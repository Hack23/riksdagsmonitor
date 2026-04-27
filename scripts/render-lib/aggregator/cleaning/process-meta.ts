/**
 * @module Infrastructure/RenderLib/Aggregator/Cleaning/ProcessMeta
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Line-level process-metadata stripper
 *
 * @description
 * Strips individual `**Field**: value` lines that carry pure workflow /
 * audit metadata, while leaving the rest of their paragraph untouched.
 * Complements the paragraph-level stripper in
 * {@link ./admin-bylines.js | admin-bylines} — paragraphs that mix
 * process-metadata with genuine journalist facts (e.g. per-document
 * identification cards) survive, but their process-metadata lines get
 * scrubbed in place.
 *
 * Pure string transform, zero dependencies.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Curated list of bold-label fields that are **pure process / audit
 * metadata** — never genuine journalistic content even when they appear
 * inside a paragraph that also carries fact-bearing labels. Stripped
 * line-by-line by {@link stripProcessMetaLines}, so per-document
 * identification cards (Title, Beteckning, Department, Committee,
 * Minister, Response deadline, Filed, Effective date, …) survive
 * intact while the workflow noise (Author, Date, Confidence, DIW Score,
 * Admiralty, …) is removed.
 *
 * This is a strict subset of `ADMIN_FIELD_NAMES` so we never strip
 * a label that the paragraph-level stripper considers "fact-bearing".
 *
 * Added 2026-04-27 (Round 7) after the journalist-perspective audit on
 * the latest articles found that the paragraph-level stripper was
 * over-conservative with mixed paragraphs — per-document `**Author** /
 * **Date** / **Confidence** / **DIW Score** / **Admiralty Code** /
 * **Self-audit cycle** / **Standard** / **Framework**` lines survived
 * inside the per-document identification cards.
 */
export const PROCESS_META_FIELD_NAMES: readonly string[] = [
  'Author',
  'Run\\s*ID',
  'Date',
  'Generated',
  'Confidence',
  'Classification',
  'Admiralty(?:\\s*(?:Code|range|baseline|Source\\s*Code))?',
  'Admiration\\s*Code',  // Common typo of "Admiralty"
  'DIW\\s*(?:Score|Tier)',
  'Self[-\\s]?audit\\s*cycle',
  'Standard',
  'Framework',
  'Methodology',
  'Pass\\s*2',
  'AI[-\\s]?FIRST\\s*iterations?',
  'ARTICLE_TYPE',
  'Article\\s*[Tt]ype',
  'Analysis\\s*[Tt]ype',
  'Analysis\\s*[Dd]epth',
  'Analysis\\s*[Pp]eriod',
  'Analysis\\s*[Dd]ate',
  'Analysis\\s*[Tt]imestamp',
  'Analysis\\s*run',
  'UTC\\s*Timestamp',
  'Brief\\s*ID',
  'Prepared\\s*by',
  'Prepared\\s*at',
  'Analyst',
  'Distribution',
  'Cycle',
  '60[-\\s]?second\\s*read',
  'Reviewed\\s*by',
  'Reviewer',
  'Disseminated',
  'Dissemination',
  'F3EAD\\s*Stage',
  'PIRs?(?:\\s*served)?',
  'Source\\s*Diversity(?:\\s*floor)?',
  'WEP\\+ODNI',
  'SATs?\\s*applied',
  'ICD\\s*203(?:\\s*standards?)?',
  'Hash',
  'Signature',
  'Provenance',
  'Tradecraft(?:\\s*context)?',
  'Confidence\\s*(?:distribution|floor|baseline)',
  // NOTE: synthetic artifact-row IDs (SCN-ID, RSK-ID, THR-ID, CMP-ID,
  // CLS-ID, XRF-ID, MTH-ID, SIG-ID, STA-ID) are deliberately NOT in the
  // line-level stripper because the case-insensitive `gim` flag would
  // also match journalist-useful labels like `Dok_ID` / `Dok-ID`. Those
  // synthetic IDs only ever appear inside pure-admin paragraphs, so the
  // paragraph-level stripper in `stripLeadingAdminBylines` already
  // catches them safely (see ADMIN_FIELD_NAMES `[A-Z]{3}[-_]ID` entry).
  'Riksm(?:ö|o)te',
  'Election\\b(?!\\s*date)',  // Bare "Election" — keep "Election date" (a fact)
];

/**
 * Line-anchored regex matching a single `**Field**: value` line where the
 * label is one of {@link PROCESS_META_FIELD_NAMES}. The `gim` flags make
 * it suitable for `String.prototype.replace` against a multi-line body.
 */
export const PROCESS_META_LINE_RE = new RegExp(
  `^[ \\t]*\\*{0,2}(?:${PROCESS_META_FIELD_NAMES.join('|')})\\*{0,2}\\s*:[^\\n]*$`,
  'gim',
);

/**
 * Strip individual `**Field**: value` lines that carry pure workflow /
 * audit metadata, while leaving the rest of their paragraph untouched.
 *
 * Trailing two-space markdown line-breaks (`  \n`) and CRs are matched
 * by the `[^\\n]*` body, so a stripped line removes its line terminator
 * cleanly. Subsequent `\\n{3,}` collapse in the structural cleaner
 * sweeps up any blank-line residue.
 */
export function stripProcessMetaLines(body: string): string {
  return body.replace(PROCESS_META_LINE_RE, '');
}
