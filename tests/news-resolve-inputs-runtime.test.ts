import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync, readFileSync as rfs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Extract the inline bash script from the composite action.yml so we can run
// it directly with mock env vars + $GITHUB_ENV. The action's only step uses
// `run: |` with the script body indented; we recover the body by stripping
// the leading 8 spaces.
function extractActionScript(): string {
  const yml = readFileSync(
    join(process.cwd(), '.github', 'actions', 'news-resolve-inputs', 'action.yml'),
    'utf8',
  );
  const lines = yml.split('\n');
  const startIdx = lines.findIndex((l) => l.trim() === 'run: |');
  expect(startIdx, 'could not locate `run: |` in action.yml').toBeGreaterThan(-1);
  // Collect every subsequent line that starts with the 8-space indent (the
  // YAML block scalar). The block ends at the first line with a smaller
  // indent or EOF.
  const body: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const ln = lines[i];
    if (ln === '' || /^ {8}/.test(ln)) {
      body.push(ln.replace(/^ {8}/, ''));
    } else {
      break;
    }
  }
  return body.join('\n');
}

function runScript(
  envOverrides: Record<string, string>,
): { exitCode: number; stdout: string; stderr: string; githubEnv: string } {
  const script = extractActionScript();
  const dir = mkdtempSync(join(tmpdir(), 'resolve-inputs-'));
  const scriptPath = join(dir, 'run.sh');
  const ghEnvPath = join(dir, 'github_env');
  writeFileSync(scriptPath, script);
  writeFileSync(ghEnvPath, '');
  try {
    const stdout = execFileSync('bash', [scriptPath], {
      env: {
        PATH: process.env.PATH,
        GITHUB_ENV: ghEnvPath,
        // Reset all IN_* vars to empty unless overridden.
        IN_SUBFOLDER: '',
        IN_ARTICLE_DATE: '',
        IN_FORCE_GENERATION: '',
        IN_ANALYSIS_DEPTH: '',
        IN_DEFAULT_DEPTH: '',
        IN_CYCLE_ANCHOR: '',
        IN_COVERAGE_DEPTH: '',
        IN_LOOKBACK_HOURS: '',
        IN_ARTICLE_TYPES: '',
        IN_FOCUS: '',
        IN_LANGUAGES: '',
        IN_MAX_BRIEFS: '',
        IN_FORCE_RETRANSLATE: '',
        IN_TRANSLATE_SUBFOLDER: '',
        ...envOverrides,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    return { exitCode: 0, stdout, stderr: '', githubEnv: rfs(ghEnvPath, 'utf8') };
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: e.status ?? -1,
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
      githubEnv: rfs(ghEnvPath, 'utf8'),
    };
  }
}

describe('news-resolve-inputs runtime behaviour', () => {
  // Sanity: composite action exists and is non-empty.
  beforeAll(() => {
    const script = extractActionScript();
    expect(script.length).toBeGreaterThan(500);
  });

  it('happy path: writes ARTICLE_DATE / SUBFOLDER / ANALYSIS_DEPTH / FORCE_GENERATION to $GITHUB_ENV', () => {
    const { exitCode, githubEnv } = runScript({
      IN_SUBFOLDER: 'propositions',
      IN_ARTICLE_DATE: '2026-05-21',
      IN_FORCE_GENERATION: 'true',
      IN_ANALYSIS_DEPTH: 'comprehensive',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(exitCode).toBe(0);
    expect(githubEnv).toContain('ARTICLE_DATE=2026-05-21');
    expect(githubEnv).toContain('SUBFOLDER=propositions');
    expect(githubEnv).toContain('ANALYSIS_DEPTH=comprehensive');
    expect(githubEnv).toContain('FORCE_GENERATION=true');
  });

  it('empty article-date defaults to today (UTC, YYYY-MM-DD)', () => {
    const { exitCode, githubEnv } = runScript({
      IN_SUBFOLDER: 'motions',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(exitCode).toBe(0);
    expect(githubEnv).toMatch(/ARTICLE_DATE=\d{4}-\d{2}-\d{2}/);
    expect(githubEnv).toContain('ANALYSIS_DEPTH=deep');
    expect(githubEnv).toContain('FORCE_GENERATION=false');
  });

  it('rejects malformed article_date with an ::error:: annotation', () => {
    const { exitCode, stderr } = runScript({
      IN_SUBFOLDER: 'motions',
      IN_ARTICLE_DATE: 'not-a-date',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('::error::');
    expect(stderr).toContain('YYYY-MM-DD');
  });

  it('rejects unknown analysis_depth', () => {
    const { exitCode, stderr } = runScript({
      IN_SUBFOLDER: 'motions',
      IN_ANALYSIS_DEPTH: 'ultra',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('::error::');
    expect(stderr).toContain('standard|deep|comprehensive');
  });

  it('rejects subfolder values with invalid grammar', () => {
    const { exitCode, stderr } = runScript({
      IN_SUBFOLDER: 'Has Spaces',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('::error::');
  });

  it('expands language presets for news-translate', () => {
    const { exitCode, githubEnv } = runScript({
      IN_SUBFOLDER: 'news-translate',
      IN_LANGUAGES: 'nordic-extra',
      IN_MAX_BRIEFS: '3',
      IN_DEFAULT_DEPTH: 'standard',
    });
    expect(exitCode).toBe(0);
    expect(githubEnv).toContain('LANGUAGES_RESOLVED=sv,da,no,fi');
    expect(githubEnv).toContain('MAX_BRIEFS_RESOLVED=3');
    expect(githubEnv).toContain('ANALYSIS_DEPTH=standard');
  });

  it('clamps out-of-range max_briefs to 2 with a warning', () => {
    const { exitCode, stdout, githubEnv } = runScript({
      IN_SUBFOLDER: 'news-translate',
      IN_MAX_BRIEFS: '99',
      IN_DEFAULT_DEPTH: 'standard',
    });
    expect(exitCode).toBe(0);
    expect(stdout + githubEnv).toContain('::warning::');
    expect(githubEnv).toContain('MAX_BRIEFS_RESOLVED=2');
  });

  it('validates cycle_anchor against current|next|both', () => {
    const ok = runScript({
      IN_SUBFOLDER: 'election-cycle',
      IN_CYCLE_ANCHOR: 'both',
      IN_DEFAULT_DEPTH: 'comprehensive',
    });
    expect(ok.exitCode).toBe(0);
    expect(ok.githubEnv).toContain('CYCLE_ANCHOR=both');

    const bad = runScript({
      IN_SUBFOLDER: 'election-cycle',
      IN_CYCLE_ANCHOR: 'bogus',
      IN_DEFAULT_DEPTH: 'comprehensive',
    });
    expect(bad.exitCode).not.toBe(0);
    expect(bad.stderr).toContain('cycle_anchor');
  });

  it('validates lookback_hours as a positive integer', () => {
    const ok = runScript({
      IN_SUBFOLDER: 'evening-analysis',
      IN_LOOKBACK_HOURS: '24',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(ok.exitCode).toBe(0);
    expect(ok.githubEnv).toContain('LOOKBACK_HOURS=24');

    const bad = runScript({
      IN_SUBFOLDER: 'evening-analysis',
      IN_LOOKBACK_HOURS: '-3',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(bad.exitCode).not.toBe(0);
  });

  it('validates focus against votes|debates|questions|all', () => {
    const ok = runScript({
      IN_SUBFOLDER: 'realtime-monitor',
      IN_FOCUS: 'votes',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(ok.exitCode).toBe(0);
    expect(ok.githubEnv).toContain('FOCUS=votes');

    const bad = runScript({
      IN_SUBFOLDER: 'realtime-monitor',
      IN_FOCUS: 'all-of-it',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(bad.exitCode).not.toBe(0);
  });

  it('validates article_types as a comma list of [a-z][a-z0-9-]* tokens', () => {
    const ok = runScript({
      IN_SUBFOLDER: 'realtime-monitor',
      IN_ARTICLE_TYPES: 'breaking,committee-reports,propositions',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(ok.exitCode).toBe(0);
    expect(ok.githubEnv).toContain('ARTICLE_TYPES=breaking,committee-reports,propositions');

    const bad = runScript({
      IN_SUBFOLDER: 'realtime-monitor',
      IN_ARTICLE_TYPES: 'breaking; rm -rf /',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(bad.exitCode).not.toBe(0);
  });

  it('rejects non-canonical boolean values for force_generation and force_retranslate', () => {
    // Documented contract: boolean inputs accept ONLY literal `true` / `false`
    // (or empty → false). Anything else is a hard failure to prevent silent
    // misconfiguration (e.g. operator types `True` and the agent reads `false`).
    const badForceGen = runScript({
      IN_SUBFOLDER: 'propositions',
      IN_FORCE_GENERATION: 'maybe',
      IN_DEFAULT_DEPTH: 'deep',
    });
    expect(badForceGen.exitCode).not.toBe(0);
    expect(badForceGen.stderr).toMatch(/force_generation 'maybe' must be literal 'true' or 'false'/);

    const badForceRetrans = runScript({
      IN_SUBFOLDER: 'news-translate',
      IN_FORCE_RETRANSLATE: 'sure',
      IN_DEFAULT_DEPTH: 'standard',
    });
    expect(badForceRetrans.exitCode).not.toBe(0);
    expect(badForceRetrans.stderr).toMatch(/force_retranslate 'sure' must be literal 'true' or 'false'/);
  });

  it('accepts only literal `true` / `false` / empty for force_generation', () => {
    for (const v of ['true', 'false', '']) {
      const { exitCode, githubEnv } = runScript({
        IN_SUBFOLDER: 'propositions',
        IN_FORCE_GENERATION: v,
        IN_DEFAULT_DEPTH: 'deep',
      });
      expect(exitCode, `value=${JSON.stringify(v)}`).toBe(0);
      expect(githubEnv).toContain(`FORCE_GENERATION=${v === 'true' ? 'true' : 'false'}`);
    }
    // Capitalized / numeric / synonym values are rejected (not silently coerced).
    for (const v of ['True', 'TRUE', '1', 'yes', 'YES', 'no']) {
      const { exitCode } = runScript({
        IN_SUBFOLDER: 'propositions',
        IN_FORCE_GENERATION: v,
        IN_DEFAULT_DEPTH: 'deep',
      });
      expect(exitCode, `value=${JSON.stringify(v)} should be rejected`).not.toBe(0);
    }
  });
});
