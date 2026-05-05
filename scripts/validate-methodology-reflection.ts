/**
 * @module validate-methodology-reflection
 * @description Validator for `methodology-reflection.md` files in
 *              `analysis/daily/YYYY-MM-DD/<subfolder>/`.
 *
 * Enforces the 14-artefact §methodology-reflection contract documented in
 * `.github/aw/SHARED_PROMPT_PATTERNS.md` Row 14 of the Tier-C table and the
 * "Recent Daily Knowledge Base Synthesis" protocol:
 *
 *   - **Required sections** (markdown H2 headings):
 *       - Purpose
 *       - Methodology Application Matrix
 *       - Upstream Watchpoint Reconciliation (aggregation / realtime / deep-inspection)
 *       - Uncertainty Hot-Spots
 *       - Known Limitations
 *       - Pass-1 → Pass-2 Improvement Evidence
 *       - Recommendations for Doctrine Codification
 *       - References
 *
 *   - **Minimum byte threshold** of the baseline 4 000 B scaled by the
 *     period-scope multiplier (0.8× realtime, 0.9× evening-analysis,
 *     1.0× week-ahead / weekly-review / deep-inspection,
 *     1.3× month-ahead, 1.5× monthly-review).
 *
 *   - **Confidence labels**: the file must use at least one of `[HIGH]`,
 *     `[MEDIUM]`, or `[LOW]` (case-insensitive) per the "every analytical
 *     claim carries a confidence label" rule.
 *
 *   - **Upstream-watchpoint reconciliation table** (Tier-C only): a
 *     markdown table beneath the §Upstream Watchpoint Reconciliation heading
 *     with at least one watchpoint row and a Disposition column signalling
 *     `carried forward`, `retired`, `operationalised`, `continued`, or
 *     `extended` — the "zero silent drops" rule.
 *
 *   - **Cross-references**: at least one relative-path link to a sibling
 *     run (e.g. `../../2026-04-18/weekly-review/`) so the continuity-of-
 *     intelligence chain is visible in the file itself.
 *
 * The validator exits non-zero when any violation is found so it can be
 * wired into `validate-news-generation.sh` and the per-workflow validation
 * gates without any further glue.
 *
 * @example
 *   npx tsx scripts/validate-methodology-reflection.ts \
 *     analysis/daily/2026-04-19/month-ahead/methodology-reflection.md
 *
 * @see analysis/agentic-workflow-quality-plan §P1-5
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Contract definitions
// ---------------------------------------------------------------------------

/** Period-scope multipliers sourced from SHARED_PROMPT_PATTERNS.md. */
export const PERIOD_SCOPE_MULTIPLIERS: Readonly<Record<string, number>> = Object.freeze({
  'realtime-*': 0.8,
  'evening-analysis': 0.9,
  'week-ahead': 1.0,
  'weekly-review': 1.0,
  'deep-inspection': 1.0,
  'month-ahead': 1.3,
  'monthly-review': 1.5,
});

/** Baseline minimum byte threshold (weekly-review / week-ahead). */
export const BASELINE_MIN_BYTES = 4000;

/**
 * Required markdown H2 section titles (order-insensitive).
 *
 * Real exemplars prefix H2 headings with 1–2 emoji, variation-selector
 * codepoints, and sometimes bullet numbering, so the preamble class is
 * permissive (up to ~20 non-newline chars). Each entry accepts the
 * canonical name plus documented synonyms used by pre-contract exemplars.
 */
export const REQUIRED_SECTIONS: ReadonlyArray<RegExp> = [
  // Purpose — present in every post-contract exemplar.
  /^##[^\n]{0,30}\bPurpose\b/mi,
  // Methodology Application Matrix — doc-type folders use "Pipeline Overview" +
  // "Structured Analytic Techniques Applied" as the equivalent.
  /^##[^\n]{0,30}\b(?:Methodology Application Matrix|Pipeline Overview|Structured Analytic Techniques(?:\s+Applied)?)\b/mi,
  // Upstream Watchpoint Reconciliation — Tier-C only (enforced downstream).
  /^##[^\n]{0,30}\bUpstream Watchpoint Reconciliation\b/mi,
  // Uncertainty Hot-Spots — synonyms: "Known Biases".
  /^##[^\n]{0,30}\b(?:Uncertainty Hot[-\s]?Spots|Known Biases(?:\s+and Mitigations)?)\b/mi,
  // Known Limitations — synonyms: "Limitations and Caveats".
  /^##[^\n]{0,30}\b(?:Known Limitations|Limitations(?:\s+and Caveats)?)\b/mi,
  // Pass-1 → Pass-2 Improvement Evidence — synonyms: "AI-FIRST Iteration Log",
  // "What Would Strengthen Future Runs".
  /^##[^\n]{0,30}(?:Pass[-\s]?1\s*[→–-]+\s*Pass[-\s]?2|AI[-\s]?FIRST Iteration Log|What Would Strengthen(?:\s+Future Runs)?)\b/mi,
  // Recommendations for Doctrine Codification — synonyms: "Recommendations
  // for Codification", "Recommended Upstream Changes", "Lessons for Future".
  /^##[^\n]{0,30}(?:Recommendations for(?:\s+Doctrine)?\s+Codification|Recommended Upstream Changes|Lessons for Future\b[^\n]*)\b/mi,
  // References — synonyms: "Cross-References", "Cross References".
  /^##[^\n]{0,30}\b(?:Cross[-\s]?)?References\b/mi,
  // Data Source Connectivity Audit — records live connectivity of every external
  // data source attempted. Required so systematic IMF/Riksdag fetch failures are
  // tracked rather than silently falling back without an audit trail.
  /^##[^\n]{0,30}\bData Source Connectivity Audit\b/mi,
];

/** Human-readable labels parallel to {@link REQUIRED_SECTIONS}. */
export const REQUIRED_SECTION_LABELS: ReadonlyArray<string> = [
  'Purpose',
  'Methodology Application Matrix',
  'Upstream Watchpoint Reconciliation',
  'Uncertainty Hot-Spots',
  'Known Limitations',
  'Pass-1 → Pass-2 Improvement Evidence',
  'Recommendations for Doctrine Codification',
  'References',
  'Data Source Connectivity Audit',
];

/** Confidence-label tokens — at least one must appear. */
const CONFIDENCE_TOKEN = /\[(?:VERY\s+)?(?:HIGH|MEDIUM|LOW)\]/i;

/** Sibling-run relative-link pattern (e.g. `../../2026-04-18/weekly-review/`). */
const SIBLING_LINK = /\]\((?:\.\.\/){1,3}(?:\d{4}-\d{2}-\d{2}\/)?[a-z0-9-]+\//i;

/** Watchpoint disposition keywords — at least one row must match. */
const WATCHPOINT_DISPOSITION = /\b(carried forward|retired|operationalised|operationalized|continued|extended|used as evidence base)\b/i;

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/**
 * Derive the period-scope multiplier for a methodology-reflection file path.
 *
 * `analysis/daily/YYYY-MM-DD/<subfolder>/methodology-reflection.md` — the
 * subfolder determines the Tier-C multiplier (0.8× through 1.5×). Runs
 * whose subfolder begins with `realtime-` use the wildcard `realtime-*`
 * bucket. Unknown subfolders default to 1.0 (the reference baseline).
 */
export function derivePeriodMultiplier(filePath: string): number {
  const parent = basename(dirname(filePath));
  if (parent.startsWith('realtime-')) {
    return PERIOD_SCOPE_MULTIPLIERS['realtime-*'];
  }
  return PERIOD_SCOPE_MULTIPLIERS[parent] ?? 1.0;
}

/**
 * Whether the subfolder is a Tier-C workflow (aggregation · realtime ·
 * deep-inspection). Only Tier-C folders are required to carry the Upstream
 * Watchpoint Reconciliation table — per-document-type folders
 * (`propositions/`, `motions/`, `committeeReports/`, `interpellations/`)
 * have methodology-reflection.md files but are not Tier-C.
 */
export function isTierCFolder(filePath: string): boolean {
  const parent = basename(dirname(filePath));
  const TIER_C = new Set([
    'week-ahead',
    'weekly-review',
    'deep-inspection',
    'month-ahead',
    'monthly-review',
    'evening-analysis',
  ]);
  return TIER_C.has(parent) || parent.startsWith('realtime-');
}

// ---------------------------------------------------------------------------
// Report types
// ---------------------------------------------------------------------------

/** A single contract violation reported by the validator. */
export interface ValidationIssue {
  readonly severity: 'error' | 'warning';
  readonly rule: string;
  readonly message: string;
}

/** Aggregated validation report for one methodology-reflection.md file. */
export interface ValidationReport {
  readonly file: string;
  readonly bytes: number;
  readonly minBytes: number;
  readonly isTierC: boolean;
  readonly issues: ReadonlyArray<ValidationIssue>;
  /** True when no `severity: 'error'` issues are present. */
  readonly ok: boolean;
}

// ---------------------------------------------------------------------------
// Core validator
// ---------------------------------------------------------------------------

/**
 * Validate a single `methodology-reflection.md` file against the Tier-C
 * content contract.
 *
 * @param filePath - Absolute or repo-relative path to the file
 * @returns Structured validation report. Callers decide exit code.
 */
export async function validateMethodologyReflection(filePath: string): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const tierC = isTierCFolder(filePath);
  const multiplier = derivePeriodMultiplier(filePath);
  const minBytes = Math.round(BASELINE_MIN_BYTES * multiplier);

  if (!existsSync(filePath)) {
    return {
      file: filePath,
      bytes: 0,
      minBytes,
      isTierC: tierC,
      issues: [
        { severity: 'error', rule: 'file-exists', message: `File not found: ${filePath}` },
      ],
      ok: false,
    };
  }

  const [content, statResult] = await Promise.all([
    readFile(filePath, 'utf-8'),
    stat(filePath),
  ]);
  const bytes = statResult.size;

  // Rule 1: size floor.
  if (bytes < minBytes) {
    issues.push({
      severity: 'error',
      rule: 'min-bytes',
      message: `File is ${bytes} bytes; minimum ${minBytes} bytes required (baseline ${BASELINE_MIN_BYTES} × multiplier ${multiplier}).`,
    });
  }

  // Rule 2: required sections. Tier-C requires all; per-document-type folders
  // have a lighter contract — Pipeline Overview / Methodology equivalent,
  // plus References. They are leaf workflows and document the pipeline that
  // produced them rather than Tier-C's continuity-of-intelligence chain.
  let requiredForThisFile: ReadonlyArray<RegExp>;
  let requiredLabelsForThisFile: ReadonlyArray<string>;
  if (tierC) {
    requiredForThisFile = REQUIRED_SECTIONS;
    requiredLabelsForThisFile = REQUIRED_SECTION_LABELS;
  } else {
    // Index 1 = Methodology Application Matrix / Pipeline Overview (allowed
    // synonym); index 7 = References. These two rows are the doc-type floor.
    requiredForThisFile = [REQUIRED_SECTIONS[1], REQUIRED_SECTIONS[7]];
    requiredLabelsForThisFile = [REQUIRED_SECTION_LABELS[1], REQUIRED_SECTION_LABELS[7]];
  }

  for (let i = 0; i < requiredForThisFile.length; i++) {
    if (!requiredForThisFile[i].test(content)) {
      issues.push({
        severity: 'error',
        rule: 'required-section',
        message: `Missing required §${requiredLabelsForThisFile[i]} section (H2 heading).`,
      });
    }
  }

  // Rule 3: at least one confidence label — analytical-quality rule that
  // applies to every methodology-reflection file regardless of tier.
  if (!CONFIDENCE_TOKEN.test(content)) {
    issues.push({
      severity: 'error',
      rule: 'confidence-label',
      message: 'No `[HIGH]` / `[MEDIUM]` / `[LOW]` confidence labels found. Every analytical claim must carry one.',
    });
  }

  // Rule 4 (Tier-C only): at least one cross-reference link to a sibling
  // run. Doc-type leaf workflows do not participate in the continuity-of-
  // intelligence chain, so this rule does not apply to them.
  if (tierC && !SIBLING_LINK.test(content)) {
    issues.push({
      severity: 'error',
      rule: 'sibling-cross-reference',
      message: 'No relative-path link to a sibling run found (e.g. `../../2026-04-18/weekly-review/`). Continuity-of-intelligence chain is not visible.',
    });
  }

  // Rule 5 (Tier-C only): Upstream-Watchpoint Reconciliation must contain a
  // markdown table whose rows carry a recognised disposition keyword. This
  // is the "zero silent drops" rule — without this, Upstream Watchpoint
  // Reconciliation is section-present-but-content-missing.
  if (tierC) {
    // Extract the section body until the next `## ` heading or EOF.
    // The `(?=^##\s|$(?![\s\S]))` lookahead matches either the start of the
    // next H2 heading or the absolute end of the input. `$(?![\s\S])` is
    // the "no more characters after this point" anchor — equivalent to
    // `\z` in regex flavors that support it; the RegExp engine in V8 does
    // not, hence this explicit form.
    const watchpointSectionMatch = /^##[^\n]{0,30}\bUpstream Watchpoint Reconciliation\b[\s\S]*?(?=^##\s|$(?![\s\S]))/mi.exec(content);
    if (watchpointSectionMatch) {
      const body = watchpointSectionMatch[0];
      const hasTable = /^\s*\|.+\|$/m.test(body);
      const hasDisposition = WATCHPOINT_DISPOSITION.test(body);
      if (!hasTable) {
        issues.push({
          severity: 'error',
          rule: 'watchpoint-table',
          message: '§Upstream Watchpoint Reconciliation has no markdown table — the reconciliation evidence is missing.',
        });
      }
      if (!hasDisposition) {
        issues.push({
          severity: 'error',
          rule: 'watchpoint-disposition',
          message: '§Upstream Watchpoint Reconciliation contains no recognised disposition keywords (carried forward · retired · operationalised · continued · extended). Every watchpoint must be explicitly disposed of (zero silent drops).',
        });
      }
    }
  }

  // Rule 7 (universal, warning): Detect World Bank economic substitution.
  // Per ECONOMIC_DATA_CONTRACT v2.1, IMF is the primary provider for all
  // economic context. Using World Bank for GDP/growth/debt/inflation is a
  // methodology gap that should be surfaced.
  const WB_ECONOMIC_DATA_REGEX = /World\s+Bank\s+(?:GDP|growth|debt|inflation|fiscal|unemployment)|worldbank\.org.{0,50}(?:GDP|NY\.GDP|GROWTH)/i;
  if (WB_ECONOMIC_DATA_REGEX.test(content)) {
    issues.push({
      severity: 'warning',
      rule: 'imf-primary-violation',
      message: 'World Bank appears to be used for economic data (GDP/growth/debt/inflation). Per ECONOMIC_DATA_CONTRACT, IMF is the primary economic-data source. Use IMF with fallback cache; World Bank is reserved for governance, environment, and social residue.',
    });
  }

  const ok = issues.every((i) => i.severity !== 'error');
  return { file: filePath, bytes, minBytes, isTierC: tierC, issues, ok };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: validate-methodology-reflection <file.md> [<file.md> …]');
    process.exit(2);
  }

  let totalFailures = 0;
  for (const arg of args) {
    const report = await validateMethodologyReflection(resolve(arg));
    const label = report.isTierC ? '[Tier-C]' : '[Doc-type]';
    if (report.ok) {
      console.log(`✅ ${label} ${report.file} (${report.bytes} B, min ${report.minBytes} B)`);
      // Also print warnings so operators see them even when the file passes.
      const warnings = report.issues.filter((i) => i.severity === 'warning');
      for (const w of warnings) {
        console.warn(`   ⚠️  [${w.rule}] ${w.message}`);
      }
    } else {
      console.error(`❌ ${label} ${report.file} (${report.bytes} B, min ${report.minBytes} B)`);
      for (const issue of report.issues) {
        const icon = issue.severity === 'error' ? '🔴' : '⚠️';
        console.error(`   ${icon} [${issue.rule}] ${issue.message}`);
      }
      totalFailures++;
    }
  }

  if (totalFailures > 0) {
    console.error(`\n${totalFailures} methodology-reflection file(s) failed validation.`);
    process.exit(1);
  } else {
    console.log('\n✅ All methodology-reflection files passed validation.');
  }
}

// Run CLI when invoked directly.
const isMainModule =
  typeof process !== 'undefined' &&
  typeof process.argv?.[1] === 'string' &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
