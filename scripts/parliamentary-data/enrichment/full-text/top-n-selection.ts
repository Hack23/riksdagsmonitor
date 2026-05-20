/**
 * @module parliamentary-data/enrichment/full-text/top-n-selection
 * @description Top-N selection constants and helpers for the full-text
 * enrichment pipeline.
 *
 * `MAX_ENRICHMENT_PER_TYPE` (= 5) caps the in-memory enrichment performed by
 * `downloadAllDocuments()` for normal callers; `LONG_HORIZON_FULL_TEXT_FLOOR`
 * (= 10) is the minimum top-N raised by `resolveAutoFullTextTopN(...)` for
 * year-ahead / cycle-style long-horizon batches.
 *
 * These constants are documented in `analysis/methodologies/` and asserted
 * verbatim by `tests/parliamentary-data/enrichment/full-text-selection.test.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../../../data-transformers/types.js';
import { isPersonProfileText } from '../../../data-transformers/helpers.js';
import { FULL_TEXT_MIN_LENGTH } from '../../full-text-threshold.js';
import type { DocumentTypeKey } from '../../data-downloader.js';

/** Maximum number of documents to enrich with full-text content per type. */
export const MAX_ENRICHMENT_PER_TYPE = 5;

/**
 * Minimum full-text follow-up count enforced for long-horizon batches
 * (e.g. year-ahead / cycle-style runs with `--limit >= 30`).
 *
 * Kept separate from `MAX_ENRICHMENT_PER_TYPE` so the per-type default for
 * normal `downloadAllDocuments()` callers stays at the historic value of 5,
 * while `resolveAutoFullTextTopN(...)` can raise the floor only when the
 * long-horizon resolver explicitly asks for it.
 */
export const LONG_HORIZON_FULL_TEXT_FLOOR = 10;

/** Document types eligible for in-place details enrichment. */
export const ENRICHABLE_TYPES: DocumentTypeKey[] = [
  'propositions',
  'committeeReports',
  'motions',
  'interpellations',
];

/**
 * Concurrency cap (3 at a time) for `client.fetchDocumentDetails` calls during
 * in-memory enrichment — matches the historic value in the original
 * `downloadAllDocuments` body.
 */
export const ENRICHMENT_CONCURRENCY = 3;

// ---------------------------------------------------------------------------
// Tiny string helpers — shared across fetch-policy and stitcher.
// ---------------------------------------------------------------------------

export const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export const sanitize = (v: unknown): string => {
  const s = str(v).trim();
  return isPersonProfileText(s) ? '' : s;
};

export function selectContent(source: Record<string, unknown>): string {
  const rawText = str(source['text']).trim();
  const rawFullContent = sanitize(source['fullContent']);
  const rawFullText = sanitize(source['fullText']);
  const rawHtml = str(source['html']).trim();

  if (rawText.length > FULL_TEXT_MIN_LENGTH) return rawText;
  if (rawFullContent.length > FULL_TEXT_MIN_LENGTH) return rawFullContent;
  if (rawFullText.length > FULL_TEXT_MIN_LENGTH) return rawFullText;
  return rawHtml;
}

export function resolveDokId(record: Record<string, unknown>): string | undefined {
  return [
    record['dok_id'],
    record['dokument_id'],
    record['rel_dok_id'],
    record['id'],
    record['dokumentnamn'],
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .find((v): v is string => v.length > 0);
}

/**
 * Pick the first `topN` documents from `docs` that have a resolvable
 * `dok_id`. Documents without one are skipped — the candidate selection is
 * cap-based, not threshold-based.
 */
export function selectTopNCandidates(
  docs: RawDocument[],
  topN: number,
): Array<{ dokId: string; doc: RawDocument }> {
  const candidates: Array<{ dokId: string; doc: RawDocument }> = [];
  for (const doc of docs) {
    if (candidates.length >= topN) break;
    const record = doc as Record<string, unknown>;
    const dokId = resolveDokId(record);
    if (!dokId) continue;
    candidates.push({ dokId, doc });
  }
  return candidates;
}
