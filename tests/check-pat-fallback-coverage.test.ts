import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Drift tests for scripts/check-pat-fallback-coverage.mjs.
 *
 * The script asserts that every news-*.md `name:` is referenced both in
 * .github/workflows/news-pat-pr-fallback.yml's `on.workflow_run.workflows`
 * list AND in the explicit `slug_for_name()` case statement. This regression
 * test pins the green-path behaviour AND verifies the script fails loudly
 * on the two real-world drift patterns that motivated it:
 *
 *   1. A typo in a workflow name (the historical
 *      `News: Translate Articles` vs actual
 *      `News: Translate Executive Briefs` bug).
 *   2. A new news-*.md added without being wired into the fallback yml
 *      (the historical missing `Election Cycle`/`Quarter Ahead`/`Year Ahead`).
 */

const REPO_ROOT = process.cwd();
const SCRIPT = 'scripts/check-pat-fallback-coverage.mjs';

function runScriptInClone(mutate: (dir: string) => void): { code: number; stdout: string; stderr: string } {
  const dir = mkdtempSync(join(tmpdir(), 'pat-fallback-cov-'));
  // Materialise just the files the script needs (it only reads them).
  mkdirSync(join(dir, '.github/workflows'), { recursive: true });
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  cpSync(join(REPO_ROOT, '.github/workflows'), join(dir, '.github/workflows'), { recursive: true });
  cpSync(join(REPO_ROOT, SCRIPT), join(dir, SCRIPT));
  mutate(dir);
  try {
    const stdout = execFileSync('node', [SCRIPT], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    const e = err as { status: number; stdout: Buffer | string; stderr: Buffer | string };
    return {
      code: e.status ?? 1,
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
    };
  }
}

describe('check-pat-fallback-coverage.mjs', () => {
  it('passes on the current committed state (14 sources ↔ 14 triggers ↔ 14 slug branches)', () => {
    const result = runScriptInClone(() => {
      /* no mutation */
    });
    expect(result.code, `stderr was:\n${result.stderr}`).toBe(0);
    expect(result.stdout).toMatch(/✓ PAT fallback coverage OK — 14 news-\*\.md sources, 14 workflow_run triggers, 14 slug map branches\./);
  });

  it('fails when a workflow name is mistyped in the fallback yml (the Translate Articles regression)', () => {
    const result = runScriptInClone((dir) => {
      const ymlPath = join(dir, '.github/workflows/news-pat-pr-fallback.yml');
      const yml = readFileSync(ymlPath, 'utf8').replace(
        /"News: Translate Executive Briefs"/g,
        '"News: Translate Articles"',
      );
      writeFileSync(ymlPath, yml);
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Missing from `on.workflow_run.workflows`');
    expect(result.stderr).toContain('News: Translate Executive Briefs');
    expect(result.stderr).toContain('Stale entries in `on.workflow_run.workflows`');
    expect(result.stderr).toContain('News: Translate Articles');
  });

  it('fails when a news-*.md is added without a matching trigger entry', () => {
    const result = runScriptInClone((dir) => {
      const newSrc = join(dir, '.github/workflows/news-fictitious.md');
      writeFileSync(
        newSrc,
        '---\nname: "News: Fictitious"\non:\n  schedule: []\n---\n',
      );
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Missing from `on.workflow_run.workflows`');
    expect(result.stderr).toContain('News: Fictitious');
    expect(result.stderr).toContain('Missing branches in slug_for_name()');
  });
});
