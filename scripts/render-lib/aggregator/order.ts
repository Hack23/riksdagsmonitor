/**
 * @module Infrastructure/RenderLib/Aggregator/Order
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Canonical narrative order for analysis artifacts
 *
 * @description
 * Pure data + tiny pure functions describing how analysis artifacts are
 * ordered in the rendered article and how filenames map to human-readable
 * section titles. Zero filesystem access, zero markdown dependencies —
 * just a static table and two string helpers.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import path from 'path';

/**
 * Canonical narrative order. Each file is emitted as an `<h2>`-prefixed
 * section in the aggregated article. Unknown artifacts (e.g. supplementary
 * PESTLE / black-swan studies) are appended after the core sections in the
 * order they appear on disk.
 *
 * `documents/` is expanded separately — each per-document analysis becomes
 * its own subsection under the "Per-document intelligence" section.
 */
export const AGGREGATION_ORDER: readonly string[] = [
  'executive-brief.md',
  'synthesis-summary.md',
  'intelligence-assessment.md',
  'significance-scoring.md',
  'media-framing-analysis.md',
  'stakeholder-perspectives.md',
  'forward-indicators.md',
  'scenario-analysis.md',
  'risk-assessment.md',
  'swot-analysis.md',
  'threat-analysis.md',
  // documents/* expanded inline here
  'election-2026-analysis.md',
  'election-cycle-analysis.md', // generalised alias for election-2026-analysis.md (filename-variant; canonical name as cycles roll over). De-duplicated at render time via FILENAME_ALIASES below — if both files exist in a folder, only the one encountered first in this order is emitted.
  'cycle-trajectory.md', // 24th artifact — election-cycle workflow ONLY
  'parliamentary-season.md', // long-horizon workflows (quarter / year / cycle)
  'coalition-mathematics.md',
  'voter-segmentation.md',
  'comparative-international.md',
  'historical-parallels.md',
  'implementation-feasibility.md',
  'pestle-analysis.md', // year-ahead + cycle blocking; supplementary elsewhere
  'wildcards-blackswans.md', // year-ahead + cycle blocking
  'quantitative-swot.md', // year-ahead + cycle blocking
  'political-stride-assessment.md', // cycle blocking
  'devils-advocate.md',
  'classification-results.md',
  'cross-reference-map.md',
  'horizon-pir-rollforward.md', // long-horizon supplementary
  'methodology-reflection.md',
  'data-download-manifest.md',
];

/**
 * Filename-variant aliases. Each key maps to a set of equivalent filenames
 * that represent the same logical artifact. The aggregator emits at most
 * **one** member of each alias group per folder — if two aliased filenames
 * are present on disk (e.g. both `election-2026-analysis.md` and
 * `election-cycle-analysis.md`), only the first one encountered in
 * {@link AGGREGATION_ORDER} is rendered; the others are skipped.
 *
 * This guarantees backwards compatibility with ~50 existing run folders that
 * use the legacy `election-2026-analysis.md` name while the cycle-agnostic
 * `election-cycle-analysis.md` becomes the canonical name post-2026 rollover.
 */
export const FILENAME_ALIASES: ReadonlyArray<ReadonlySet<string>> = [
  new Set(['election-2026-analysis.md', 'election-cycle-analysis.md']),
];

/**
 * Resolve the alias group (if any) that a filename belongs to. Returns the
 * set of equivalent filenames including `file` itself, or `null` if `file`
 * has no aliases.
 */
export function aliasGroupFor(file: string): ReadonlySet<string> | null {
  for (const group of FILENAME_ALIASES) {
    if (group.has(file)) return group;
  }
  return null;
}


/**
 * Human-readable English section titles for each artifact. The aggregator
 * emits these as `## <title>` headings so the rendered article has a
 * consistent outline independent of what the AI wrote inside the file.
 * Unknown files fall back to a title derived from the filename via
 * {@link prettifyFallbackTitle}.
 */
const SECTION_TITLES: Record<string, string> = {
  'executive-brief.md': 'Executive Brief',
  'synthesis-summary.md': 'Synthesis Summary',
  'significance-scoring.md': 'Significance Scoring',
  'stakeholder-perspectives.md': 'Stakeholder Perspectives',
  'swot-analysis.md': 'SWOT Analysis',
  'risk-assessment.md': 'Risk Assessment',
  'threat-analysis.md': 'Threat Analysis',
  'election-2026-analysis.md': 'Election 2026 Analysis',
  'election-cycle-analysis.md': 'Election Cycle Analysis',
  'cycle-trajectory.md': 'Cycle Trajectory',
  'parliamentary-season.md': 'Parliamentary Season Outlook',
  'pestle-analysis.md': 'PESTLE Analysis',
  'wildcards-blackswans.md': 'Wildcards & Black Swans',
  'quantitative-swot.md': 'Quantitative SWOT',
  'political-stride-assessment.md': 'Political STRIDE Assessment',
  'horizon-pir-rollforward.md': 'Horizon PIR Roll-Forward',
  'coalition-mathematics.md': 'Coalition Mathematics',
  'voter-segmentation.md': 'Voter Segmentation',
  'scenario-analysis.md': 'Scenario Analysis',
  'forward-indicators.md': 'Forward Indicators',
  'comparative-international.md': 'Comparative International',
  'historical-parallels.md': 'Historical Parallels',
  'media-framing-analysis.md': 'Media Framing Analysis',
  'implementation-feasibility.md': 'Implementation Feasibility',
  'devils-advocate.md': "Devil's Advocate",
  'intelligence-assessment.md': 'Intelligence Assessment — Key Judgments',
  'classification-results.md': 'Classification Results',
  'cross-reference-map.md': 'Cross-Reference Map',
  'methodology-reflection.md': 'Methodology Reflection & Limitations',
  'data-download-manifest.md': 'Data Download Manifest',
};

/**
 * Convert a filename like `pestle-analysis.md` into a human title
 * `Pestle Analysis`. Used as the fallback for any artifact not in
 * {@link SECTION_TITLES}.
 */
export function prettifyFallbackTitle(file: string): string {
  const base = path.basename(file).replace(/\.md$/i, '');
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * Resolve the human-readable section title for an artifact. Looks up
 * the curated map first; falls back to {@link prettifyFallbackTitle}.
 */
export function titleForArtifact(file: string): string {
  const base = path.basename(file);
  return SECTION_TITLES[base] ?? prettifyFallbackTitle(base);
}
