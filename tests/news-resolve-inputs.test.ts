import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const ACTION_PATH = join(REPO_ROOT, '.github', 'actions', 'news-resolve-inputs', 'action.yml');
const WORKFLOWS_DIR = join(REPO_ROOT, '.github', 'workflows');

const ACTION_CONTENT = readFileSync(ACTION_PATH, 'utf8');

// A composite-action `uses:` reference may appear either as the bare local form
// (`./.github/actions/<name>`) or as the SHA-pinned remote form
// (`<owner>/<repo>/.github/actions/<name>@<sha>`) that `gh aw compile` emits
// under strict action pinning. These helpers locate either form.
const newsActionRef = (name: string): RegExp =>
  new RegExp(
    `uses:\\s*(?:(?:\\./|[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/))?\\.github/actions/${name}(?:@[0-9a-fA-F]+)?`,
  );
const indexOfNewsAction = (content: string, name: string): number =>
  content.search(newsActionRef(name));

// Per-workflow expectations derived from `analysis/article-types.json`. The
// subfolder MUST be the article-type id and the default depth MUST match the
// per-tier policy (year-ahead/election-cycle = comprehensive, news-translate =
// standard, everything else = deep).
const WORKFLOW_EXPECTATIONS: Record<string, {
  subfolder: string;
  defaultDepth: 'standard' | 'deep' | 'comprehensive';
  hasForceGeneration: boolean;
  extras: Array<{ name: string; input: string }>;
}> = {
  'news-propositions.md':       { subfolder: 'propositions',       defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-motions.md':            { subfolder: 'motions',            defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-committee-reports.md':  { subfolder: 'committee-reports',  defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-interpellations.md':    { subfolder: 'interpellations',    defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-week-ahead.md':         { subfolder: 'week-ahead',         defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-month-ahead.md':        { subfolder: 'month-ahead',        defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-quarter-ahead.md':      { subfolder: 'quarter-ahead',      defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-year-ahead.md':         { subfolder: 'year-ahead',         defaultDepth: 'comprehensive', hasForceGeneration: true,  extras: [] },
  'news-election-cycle.md':     { subfolder: 'election-cycle',     defaultDepth: 'comprehensive', hasForceGeneration: true,  extras: [{ name: 'cycle-anchor', input: 'cycle_anchor' }] },
  'news-weekly-review.md':      { subfolder: 'weekly-review',      defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-monthly-review.md':     { subfolder: 'monthly-review',     defaultDepth: 'deep',          hasForceGeneration: true,  extras: [] },
  'news-evening-analysis.md':   { subfolder: 'evening-analysis',   defaultDepth: 'deep',          hasForceGeneration: false, extras: [
    { name: 'coverage-depth', input: 'coverage_depth' },
    { name: 'lookback-hours', input: 'lookback_hours' },
  ] },
  'news-realtime-monitor.md':   { subfolder: 'realtime-monitor',   defaultDepth: 'deep',          hasForceGeneration: false, extras: [
    { name: 'article-types', input: 'article_types' },
    { name: 'focus',         input: 'focus' },
  ] },
  'news-translate.md':          { subfolder: 'news-translate',     defaultDepth: 'standard',      hasForceGeneration: false, extras: [
    { name: 'languages',          input: 'languages' },
    { name: 'max-briefs',         input: 'max_briefs' },
    { name: 'force-retranslate',  input: 'force_retranslate' },
    { name: 'translate-subfolder', input: 'subfolder' },
  ] },
};

describe('news-resolve-inputs composite action', () => {
  it('declares the canonical env-export contract documented in 00-base-contract.md', () => {
    for (const envVar of [
      'ARTICLE_DATE=',
      'SUBFOLDER=',
      'ANALYSIS_DEPTH=',
      'FORCE_GENERATION=',
      'CYCLE_ANCHOR=',
      'COVERAGE_DEPTH=',
      'LOOKBACK_HOURS=',
      'ARTICLE_TYPES=',
      'FOCUS=',
      'LANGUAGES_RESOLVED=',
      'MAX_BRIEFS_RESOLVED=',
      'FORCE_RETRANSLATE=',
      'TRANSLATE_SUBFOLDER=',
    ]) {
      expect(ACTION_CONTENT, `${envVar} not exported to $GITHUB_ENV`).toContain(envVar);
    }
    // Must write to $GITHUB_ENV so awf --env-all picks it up.
    expect(ACTION_CONTENT).toContain('>> "$GITHUB_ENV"');
  });

  it('rejects malformed article_date (YYYY-MM-DD enforced)', () => {
    expect(ACTION_CONTENT).toMatch(/article_date.*must be YYYY-MM-DD/);
    expect(ACTION_CONTENT).toContain("'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'");
  });

  it('restricts analysis_depth to standard|deep|comprehensive', () => {
    expect(ACTION_CONTENT).toContain('standard|deep|comprehensive');
  });

  it('restricts cycle_anchor to current|next|both', () => {
    expect(ACTION_CONTENT).toContain('current|next|both');
  });

  it('restricts focus to votes|debates|questions|all', () => {
    expect(ACTION_CONTENT).toContain('votes|debates|questions|all');
  });

  it('clamps out-of-range max_briefs to 2 with a warning (matches prior news-translate behaviour)', () => {
    expect(ACTION_CONTENT).toMatch(/max_briefs.*out of range.*clamping to 2/);
    expect(ACTION_CONTENT).toContain('MAX_BRIEFS_RESOLVED=2');
  });

  it('expands the news-translate language presets', () => {
    expect(ACTION_CONTENT).toContain('all-extra)    LANGUAGES_RESOLVED="sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh"');
    expect(ACTION_CONTENT).toContain('nordic-extra) LANGUAGES_RESOLVED="sv,da,no,fi"');
    expect(ACTION_CONTENT).toContain('eu-extra)     LANGUAGES_RESOLVED="de,fr,es,nl"');
    expect(ACTION_CONTENT).toContain('cjk)          LANGUAGES_RESOLVED="ja,ko,zh"');
    expect(ACTION_CONTENT).toContain('rtl)          LANGUAGES_RESOLVED="ar,he"');
  });

  it('emits a "Resolved workflow inputs" audit group to the step log', () => {
    expect(ACTION_CONTENT).toContain('::group::Resolved workflow inputs');
    expect(ACTION_CONTENT).toContain('::endgroup::');
  });
});

describe('news-*.md workflows wire news-resolve-inputs immediately after news-prewarm', () => {
  const newsWorkflows = readdirSync(WORKFLOWS_DIR).filter(
    (f) => f.startsWith('news-') && f.endsWith('.md'),
  );

  it('every news-*.md uses news-prewarm', () => {
    expect(newsWorkflows.length).toBe(14);
    for (const f of newsWorkflows) {
      const content = readFileSync(join(WORKFLOWS_DIR, f), 'utf8');
      expect(content, `${f} missing news-prewarm`).toMatch(newsActionRef('news-prewarm'));
    }
  });

  it.each(Object.entries(WORKFLOW_EXPECTATIONS))(
    '%s wires news-resolve-inputs with correct subfolder/default-depth/extras',
    (filename, expectations) => {
      const content = readFileSync(join(WORKFLOWS_DIR, filename), 'utf8');

      // Sequencing: news-resolve-inputs must appear AFTER news-prewarm in the
      // steps block (otherwise $GITHUB_ENV is set before any pre-warm has run,
      // which is harmless but breaks the documented contract).
      const prewarmIdx   = indexOfNewsAction(content, 'news-prewarm');
      const resolveIdx   = indexOfNewsAction(content, 'news-resolve-inputs');
      expect(prewarmIdx, `${filename} missing news-prewarm`).toBeGreaterThan(-1);
      expect(resolveIdx, `${filename} missing news-resolve-inputs`).toBeGreaterThan(-1);
      expect(resolveIdx).toBeGreaterThan(prewarmIdx);

      // Subfolder identity = article-type id.
      expect(content).toContain(`subfolder: ${expectations.subfolder}`);

      // Default analysis depth must match the per-tier policy.
      expect(content).toContain(`default-analysis-depth: ${expectations.defaultDepth}`);

      // article-date and analysis-depth are wired for every workflow.
      expect(content).toContain('article-date: ${{ inputs.article_date }}');
      expect(content).toContain('analysis-depth: ${{ inputs.analysis_depth }}');

      // force-generation only on workflows that declare the input.
      if (expectations.hasForceGeneration) {
        expect(content).toContain('force-generation: ${{ inputs.force_generation }}');
      } else {
        expect(content).not.toContain('force-generation: ${{ inputs.force_generation }}');
      }

      // Per-workflow extras.
      for (const extra of expectations.extras) {
        expect(content, `${filename} missing extra input ${extra.name}`).toContain(
          `${extra.name}: \${{ inputs.${extra.input} }}`,
        );
      }
    },
  );
});

describe('runtime input contract is documented in 00-base-contract.md', () => {
  const promptPath = join(REPO_ROOT, '.github', 'prompts', '00-base-contract.md');
  const promptContent = readFileSync(promptPath, 'utf8');

  it('lists every canonical env var', () => {
    expect(promptContent).toContain('## Runtime input contract');
    for (const envVar of [
      '`ARTICLE_DATE`',
      '`SUBFOLDER`',
      '`ANALYSIS_DEPTH`',
      '`FORCE_GENERATION`',
      '`CYCLE_ANCHOR`',
      '`COVERAGE_DEPTH`',
      '`LOOKBACK_HOURS`',
      '`ARTICLE_TYPES`',
      '`FOCUS`',
      '`LANGUAGES_RESOLVED`',
      '`MAX_BRIEFS_RESOLVED`',
      '`FORCE_RETRANSLATE`',
      '`TRANSLATE_SUBFOLDER`',
    ]) {
      expect(promptContent, `${envVar} missing from runtime input contract`).toContain(envVar);
    }
  });

  it('cites the news-resolve-inputs composite as the propagation mechanism', () => {
    expect(promptContent).toContain('news-resolve-inputs');
    expect(promptContent).toContain('awf --env-all');
  });

  it('forbids recomputing ARTICLE_DATE/SUBFOLDER inside agent prompts', () => {
    expect(promptContent).toMatch(/(?:Never|do not)\s+recompute/i);
  });
});
