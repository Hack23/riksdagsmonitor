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
  'coalition-mathematics.md',
  'voter-segmentation.md',
  'comparative-international.md',
  'historical-parallels.md',
  'implementation-feasibility.md',
  'devils-advocate.md',
  'classification-results.md',
  'cross-reference-map.md',
  'methodology-reflection.md',
  'data-download-manifest.md',
];

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
