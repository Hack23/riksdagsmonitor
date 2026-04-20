/**
 * Unit tests for `scripts/validate-methodology-reflection.ts`.
 *
 * Uses synthetic markdown fixtures so tests stay stable as the real
 * `analysis/daily/…` content evolves. Each fixture targets one rule so the
 * validator's behaviour is locked in per-rule.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateMethodologyReflection,
  derivePeriodMultiplier,
  isTierCFolder,
  PERIOD_SCOPE_MULTIPLIERS,
  BASELINE_MIN_BYTES,
} from '../scripts/validate-methodology-reflection.js';

// ---------------------------------------------------------------------------
// Synthetic fixtures
// ---------------------------------------------------------------------------

/** Minimal PASSING Tier-C fixture — hits every contract rule. */
const PASSING_TIER_C = `# Methodology Reflection — Test Fixture

${'Filler prose. '.repeat(400)}

## 🎯 Purpose

Self-audit of this dossier's tradecraft. \`[HIGH]\`

## 📋 Methodology Application Matrix

| Rule | Source | Evidence | Compliance |
|------|--------|----------|:----------:|
| R1 | guide §Rule 1 | this file | ✅ \`[HIGH]\` |

## 🔁 Upstream Watchpoint Reconciliation

| Source | Watchpoint | Disposition |
|--------|-----------|-------------|
| [../../2026-04-18/weekly-review/](../../2026-04-18/weekly-review/synthesis-summary.md) | W1 | ✅ **Carried forward** \`[HIGH]\` |
| Same | W2 | 📅 **Retired** — outside horizon |

## 🌫️ Uncertainty Hot-Spots

| # | Hot-Spot | Confidence |
|:-:|----------|:----------:|
| U1 | X | \`[MEDIUM]\` |

## ⚠️ Known Limitations

1. Limitation 1.

## 🔬 Pass-1 → Pass-2 Improvement Evidence

| Improvement | Evidence |
|-------------|----------|
| Added X | See §Y |

## 💡 Recommendations for Doctrine Codification

### R1. Something

## 📎 References

- [Sibling](../../2026-04-18/weekly-review/)
`;

/** Fixture missing an H2 required section. */
const MISSING_SECTIONS_TIER_C = PASSING_TIER_C.replace(/## ⚠️ Known Limitations[\s\S]*?(?=## )/, '');

/** Fixture with Watchpoint section but no table / disposition. */
const WATCHPOINT_NO_TABLE = PASSING_TIER_C.replace(
  /## 🔁 Upstream Watchpoint Reconciliation[\s\S]*?(?=## 🌫️)/,
  '## 🔁 Upstream Watchpoint Reconciliation\n\nNo table here, just prose. `[HIGH]`\n\n'
);

/** Fixture with Watchpoint table but no disposition keywords. */
const WATCHPOINT_NO_DISPOSITION = PASSING_TIER_C.replace(
  /\| \[\.\.[\s\S]*?\| Same \| W2 \| 📅 \*\*Retired\*\* — outside horizon \|/,
  '| X | W1 | something vague |\n| Y | W2 | uncertain |'
);

/** Fixture with no sibling cross-references at all. */
const NO_SIBLING_LINKS = PASSING_TIER_C
  .replace(/\]\(\.\.\/\.\.\/\d{4}-\d{2}-\d{2}\/[a-z-]+\/[^)]*\)/g, '](#local)')
  .replace(/- \[Sibling\]\([^)]*\)/, '- [Local](#)');

/** Fixture without any confidence labels. */
const NO_CONFIDENCE_LABELS = PASSING_TIER_C.replace(/`\[(?:VERY\s+)?(?:HIGH|MEDIUM|LOW)\]`/g, '(n/a)');

/** Fixture for a doc-type folder — minimal lightweight contract. */
const PASSING_DOC_TYPE = `# Methodology Reflection — motions

${'Prose. '.repeat(600)}

## Pipeline Overview

Description of pipeline. \`[HIGH]\`

## References

1. Reference A
2. Reference B
`;

// ---------------------------------------------------------------------------
// Temp-directory scaffolding
// ---------------------------------------------------------------------------

let rootDir: string;

async function writeFixture(
  relativePath: string,
  content: string
): Promise<string> {
  const absPath = join(rootDir, relativePath);
  await mkdir(join(absPath, '..'), { recursive: true });
  await writeFile(absPath, content, 'utf-8');
  return absPath;
}

beforeAll(async () => {
  rootDir = await mkdtemp(join(tmpdir(), 'method-refl-'));
});

afterAll(async () => {
  if (rootDir) {
    await rm(rootDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('derivePeriodMultiplier', () => {
  it('returns 0.8 for realtime-* folders', () => {
    expect(derivePeriodMultiplier('/a/analysis/daily/2026-04-17/realtime-1434/methodology-reflection.md')).toBe(0.8);
  });

  it('returns 0.9 for evening-analysis', () => {
    expect(derivePeriodMultiplier('/a/analysis/daily/2026-04-19/evening-analysis/methodology-reflection.md')).toBe(0.9);
  });

  it('returns 1.0 for week-ahead / weekly-review baselines', () => {
    expect(derivePeriodMultiplier('/a/.../week-ahead/methodology-reflection.md')).toBe(1.0);
    expect(derivePeriodMultiplier('/a/.../weekly-review/methodology-reflection.md')).toBe(1.0);
    expect(derivePeriodMultiplier('/a/.../deep-inspection/methodology-reflection.md')).toBe(1.0);
  });

  it('returns 1.3 for month-ahead, 1.5 for monthly-review', () => {
    expect(derivePeriodMultiplier('/a/.../month-ahead/methodology-reflection.md')).toBe(1.3);
    expect(derivePeriodMultiplier('/a/.../monthly-review/methodology-reflection.md')).toBe(1.5);
  });

  it('defaults to 1.0 for unknown subfolders', () => {
    expect(derivePeriodMultiplier('/a/.../motions/methodology-reflection.md')).toBe(1.0);
    expect(derivePeriodMultiplier('/a/.../interpellations/methodology-reflection.md')).toBe(1.0);
  });
});

describe('isTierCFolder', () => {
  it('recognises all documented Tier-C folder names', () => {
    for (const name of ['week-ahead', 'weekly-review', 'deep-inspection', 'month-ahead', 'monthly-review', 'evening-analysis']) {
      expect(isTierCFolder(`/a/.../${name}/methodology-reflection.md`), name).toBe(true);
    }
  });

  it('recognises realtime-HHMM subfolders as Tier-C', () => {
    expect(isTierCFolder('/a/.../realtime-0703/methodology-reflection.md')).toBe(true);
    expect(isTierCFolder('/a/.../realtime-1705/methodology-reflection.md')).toBe(true);
  });

  it('rejects doc-type leaf folders', () => {
    for (const name of ['propositions', 'motions', 'committeeReports', 'interpellations']) {
      expect(isTierCFolder(`/a/.../${name}/methodology-reflection.md`), name).toBe(false);
    }
  });
});

describe('validateMethodologyReflection — happy paths', () => {
  it('PASSES a full Tier-C fixture that satisfies every rule', async () => {
    const file = await writeFixture('2026-01-01/week-ahead/methodology-reflection.md', PASSING_TIER_C);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.isTierC).toBe(true);
    expect(report.bytes).toBeGreaterThanOrEqual(report.minBytes);
  });

  it('PASSES a minimal doc-type fixture (Pipeline Overview + References)', async () => {
    const file = await writeFixture('2026-01-01/motions/methodology-reflection.md', PASSING_DOC_TYPE);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(true);
    expect(report.isTierC).toBe(false);
  });
});

describe('validateMethodologyReflection — file-exists rule', () => {
  it('reports error when file is missing', async () => {
    const file = join(rootDir, 'does-not-exist/methodology-reflection.md');
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'file-exists')).toBe(true);
  });
});

describe('validateMethodologyReflection — byte-floor rule', () => {
  it('flags files below the scaled minimum', async () => {
    const tiny = '## Pipeline Overview\n\nBody. `[HIGH]`\n\n## References\n\n- x\n';
    const file = await writeFixture('2026-01-01/week-ahead-tiny/methodology-reflection.md', tiny);
    const report = await validateMethodologyReflection(file);
    expect(report.issues.some((i) => i.rule === 'min-bytes')).toBe(true);
    expect(report.ok).toBe(false);
  });

  it('applies the 1.3× multiplier for month-ahead', async () => {
    const file = await writeFixture('2026-01-01/month-ahead-tiny/methodology-reflection.md', 'x');
    const report = await validateMethodologyReflection(file);
    expect(report.minBytes).toBe(Math.round(BASELINE_MIN_BYTES * 1.0)); // unknown → 1.0 default
    // Now a real month-ahead folder:
    const file2 = await writeFixture('2026-01-01/month-ahead/methodology-reflection.md', 'x');
    const report2 = await validateMethodologyReflection(file2);
    expect(report2.minBytes).toBe(Math.round(BASELINE_MIN_BYTES * PERIOD_SCOPE_MULTIPLIERS['month-ahead']));
  });

  it('applies the 1.5× multiplier for monthly-review', async () => {
    const file = await writeFixture('2026-01-01/monthly-review/methodology-reflection.md', 'x');
    const report = await validateMethodologyReflection(file);
    expect(report.minBytes).toBe(Math.round(BASELINE_MIN_BYTES * 1.5));
  });
});

describe('validateMethodologyReflection — required-section rule', () => {
  it('flags missing §Known Limitations in Tier-C', async () => {
    const file = await writeFixture('2026-01-02/week-ahead/methodology-reflection.md', MISSING_SECTIONS_TIER_C);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'required-section' && i.message.includes('Known Limitations'))).toBe(true);
  });

  it('accepts synonym H2 "What Would Strengthen Future Runs" for Pass-1 → Pass-2', async () => {
    const withSynonym = PASSING_TIER_C.replace(
      '## 🔬 Pass-1 → Pass-2 Improvement Evidence',
      '## 🆕 What Would Strengthen Future Runs'
    );
    const file = await writeFixture('2026-01-03/weekly-review/methodology-reflection.md', withSynonym);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(true);
  });

  it('accepts synonym H2 "Recommendations for Codification" for Recommendations', async () => {
    const withSynonym = PASSING_TIER_C.replace(
      '## 💡 Recommendations for Doctrine Codification',
      '## 📚 Recommendations for Codification'
    );
    const file = await writeFixture('2026-01-04/weekly-review/methodology-reflection.md', withSynonym);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(true);
  });

  it('accepts synonym H2 "Cross-References" for References', async () => {
    const withSynonym = PASSING_TIER_C.replace('## 📎 References', '## 📎 Cross-References');
    const file = await writeFixture('2026-01-05/weekly-review/methodology-reflection.md', withSynonym);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(true);
  });
});

describe('validateMethodologyReflection — watchpoint-table rule (Tier-C only)', () => {
  it('flags Upstream Watchpoint Reconciliation section without a table', async () => {
    const file = await writeFixture('2026-01-06/weekly-review/methodology-reflection.md', WATCHPOINT_NO_TABLE);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'watchpoint-table')).toBe(true);
  });

  it('flags Watchpoint section with table but no disposition keywords', async () => {
    const file = await writeFixture('2026-01-07/weekly-review/methodology-reflection.md', WATCHPOINT_NO_DISPOSITION);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'watchpoint-disposition')).toBe(true);
  });

  it('does NOT apply watchpoint rules to doc-type folders', async () => {
    const file = await writeFixture('2026-01-08/motions/methodology-reflection.md', PASSING_DOC_TYPE);
    const report = await validateMethodologyReflection(file);
    // Doc-type folders don't need watchpoint reconciliation at all.
    expect(report.issues.some((i) => i.rule.startsWith('watchpoint-'))).toBe(false);
  });
});

describe('validateMethodologyReflection — sibling-cross-reference rule (Tier-C only)', () => {
  it('flags a Tier-C file with no sibling-run links', async () => {
    const file = await writeFixture('2026-01-09/weekly-review/methodology-reflection.md', NO_SIBLING_LINKS);
    const report = await validateMethodologyReflection(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'sibling-cross-reference')).toBe(true);
  });

  it('does NOT require sibling links on doc-type folders', async () => {
    const file = await writeFixture('2026-01-10/motions/methodology-reflection.md', PASSING_DOC_TYPE);
    const report = await validateMethodologyReflection(file);
    expect(report.issues.some((i) => i.rule === 'sibling-cross-reference')).toBe(false);
  });
});

describe('validateMethodologyReflection — confidence-label rule (universal)', () => {
  it('flags any file without [HIGH] / [MEDIUM] / [LOW] tokens', async () => {
    const file = await writeFixture('2026-01-11/weekly-review/methodology-reflection.md', NO_CONFIDENCE_LABELS);
    const report = await validateMethodologyReflection(file);
    expect(report.issues.some((i) => i.rule === 'confidence-label')).toBe(true);
  });

  it('accepts [VERY HIGH] as a valid confidence variant', async () => {
    const withVeryHigh = PASSING_TIER_C.replace('`[HIGH]`', '`[VERY HIGH]`');
    const file = await writeFixture('2026-01-12/weekly-review/methodology-reflection.md', withVeryHigh);
    const report = await validateMethodologyReflection(file);
    expect(report.issues.some((i) => i.rule === 'confidence-label')).toBe(false);
  });
});
