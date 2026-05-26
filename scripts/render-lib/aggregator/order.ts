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
 * The order follows a journalist-optimal narrative arc for political-
 * intelligence reporting:
 *
 *   Phase A — Lead & headline judgments (BLUF)
 *   Phase B — Primary evidence (`documents/*` expanded after
 *             `significance-scoring.md`; see aggregate.ts step 3)
 *   Phase C — Actors & political arithmetic (stakeholders, coalition
 *             math, voter segmentation)
 *   Phase D — Forward trajectory (indicators, scenarios, election,
 *             cycle, parliamentary season)
 *   Phase E — Risk, threat & strategic posture (risk, SWOT, threat,
 *             STRIDE, wildcards, PESTLE)
 *   Phase F — Context & narrative environment (history, comparative,
 *             feasibility, media framing)
 *   Phase G — Critique (devil's advocate)
 *   Phase H — Audit appendix (classification, cross-refs, methodology,
 *             manifest)
 *
 * Rationale: readers form their own view of the substance first
 * (Phases A→D), then weigh risk and context (Phases E→F), and finally
 * see narrative-environment / influence-operations and devil's-advocate
 * critique (late F + G) before the appendix. Anchoring per-document
 * evidence right after the so-what ranking ("show your work") is the
 * standard intelligence-product structure (cf. ICD 203, NIC NIE).
 */
export const AGGREGATION_ORDER: readonly string[] = [
  // ─── Phase A — Lead & headline judgments (BLUF) ────────────────────
  // Front-load the journalist's "fast answer" cluster: who/what/when/why,
  // confidence-bearing Key Judgments, and the so-what ranking.
  'executive-brief.md',
  'synthesis-summary.md',
  'intelligence-assessment.md',
  'significance-scoring.md',
  // ─── Phase B — Primary evidence (documents/* expanded here) ────────
  // The aggregator injects per-document analyses immediately after
  // significance-scoring so readers meet the actual primary sources
  // (motions, propositions, committee reports, with their `dok_id`)
  // BEFORE any interpretive lenses. This is the "show your work"
  // pattern intelligence consumers expect.
  // ─── Phase C — Actors & political arithmetic ───────────────────────
  // Stakeholder lens, parliamentary arithmetic (who can pass it), and
  // voter exposure (whose interests are at stake) — clustered so the
  // "WHO" question is answered as one block.
  'stakeholder-perspectives.md',
  'stakeholder-impact.md',
  'coalition-mathematics.md',
  'voter-segmentation.md',
  // ─── Phase D — Forward trajectory ──────────────────────────────────
  // Dated watch items, probability-weighted scenarios, electoral
  // implications, and (for long-horizon workflows) cycle trajectory
  // and parliamentary calendar.
  'forward-indicators.md',
  'scenario-analysis.md',
  'election-2026-analysis.md',
  'election-cycle-analysis.md', // generalised alias for election-2026-analysis.md (filename-variant; canonical name as cycles roll over). De-duplicated at render time via FILENAME_ALIASES below — if both files exist in a folder, only the one encountered first in this order is emitted.
  'election-2026-implications.md', // legacy filename variant — same alias group; listed here so it participates in AGGREGATION_ORDER de-dupe rather than being appended as a supplementary file.
  'cycle-trajectory.md', // 24th artifact — election-cycle workflow ONLY
  'parliamentary-season.md', // long-horizon workflows (quarter / year / cycle)
  // ─── Phase E — Risk, threat & strategic posture ────────────────────
  // All "what could go wrong" lenses clustered together so readers
  // process them as a coherent risk register rather than as a random
  // sprinkle between substance and context.
  'risk-assessment.md',
  'swot-analysis.md',
  'quantitative-swot.md', // year-ahead + cycle blocking
  'threat-analysis.md',
  'political-stride-assessment.md', // cycle blocking
  'wildcards-blackswans.md', // year-ahead + cycle blocking
  'pestle-analysis.md', // year-ahead + cycle blocking; supplementary elsewhere
  // ─── Phase F — Context & narrative environment ─────────────────────
  // Historical parallels, peer-country comparison, implementation
  // feasibility, then media-framing/influence-operations LAST in this
  // cluster so readers form their own view of the substance first
  // before being shown how the story is being framed.
  'historical-parallels.md',
  'comparative-international.md',
  'implementation-feasibility.md',
  'media-framing-analysis.md',
  // ─── Phase G — Critique & alt hypotheses ───────────────────────────
  'devils-advocate.md',
  // ─── Phase H — Audit appendix ──────────────────────────────────────
  'classification-results.md',
  'political-classification.md',
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
  new Set(['election-2026-analysis.md', 'election-cycle-analysis.md', 'election-2026-implications.md']),
  new Set(['stakeholder-perspectives.md', 'stakeholder-impact.md']),
  new Set(['classification-results.md', 'political-classification.md']),
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
  'stakeholder-impact.md': 'Stakeholder Perspectives',
  'swot-analysis.md': 'SWOT Analysis',
  'risk-assessment.md': 'Risk Assessment',
  'threat-analysis.md': 'Threat Analysis',
  'election-2026-analysis.md': 'Election 2026 Analysis',
  'election-cycle-analysis.md': 'Election Cycle Analysis',
  'election-2026-implications.md': 'Election 2026 Analysis',
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
  'political-classification.md': 'Political Classification',
  'cross-reference-map.md': 'Cross-Reference Map',
  'methodology-reflection.md': 'Methodology Reflection & Limitations',
  'data-download-manifest.md': 'Data Download Manifest',
};

/**
 * Curated, descriptive category-level fallback titles for known article
 * subfolders. These fire only when both the H1 and BLUF-derived title
 * extraction fail — the absolute last resort before showing a generic
 * slug-to-title-case label. Written in an engaging, journalist style to
 * maintain SERP quality even in degraded scenarios.
 */
const CATEGORY_FALLBACK_TITLES: Readonly<Record<string, string>> = {
  'realtime-monitor': 'Swedish Parliament Live — Today in the Riksdag',
  'propositions': 'Government Bills — Swedish Legislative Agenda',
  'committee-reports': 'Committee Verdicts — Riksdag Policy Decisions',
  'interpellations': 'Ministers Under Fire — Parliamentary Questions',
  'motions': 'Opposition Plays — Riksdag Policy Proposals',
  'evening-analysis': 'Evening Briefing — Swedish Political Intelligence',
  'weekly-review': 'The Week in Swedish Politics',
  'debates': 'Floor Fights — Riksdag Chamber Debates',
};

/**
 * Convert a filename like `pestle-analysis.md` into a human title
 * `Pestle Analysis`. Used as the fallback for any artifact not in
 * {@link SECTION_TITLES}.
 */
export function prettifyFallbackTitle(file: string): string {
  const base = path.basename(file).replace(/\.md$/i, '');
  // Check curated category titles first (for subfolder slugs).
  if (CATEGORY_FALLBACK_TITLES[base]) return CATEGORY_FALLBACK_TITLES[base]!;
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
