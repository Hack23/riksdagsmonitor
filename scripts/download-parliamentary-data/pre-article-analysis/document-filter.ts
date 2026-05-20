/**
 * @module download-parliamentary-data/pre-article-analysis/document-filter
 * @description Filter the flattened MCP document batch by the analysis date
 * (with a business-day lookback fallback), and fall back to targeted MCP
 * `fetchDocumentDetailsWithCoverage` calls for documents requested by `--doc-id`
 * that were missing from the initial batch.
 *
 * Pure data shuffling — no console output beyond informational notices that
 * mirror the original `pre-article-analysis.ts` body.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { MCPClient } from '../../mcp-client/client.js';
import type { RawDocument } from '../../data-transformers/types.js';
import {
  MAX_LOOKBACK_BUSINESS_DAYS,
  subtractBusinessDays,
} from '../../parliamentary-data/data-downloader.js';

export interface FilterByDateResult {
  selected: RawDocument[];
  dataFreshness: string | null;
}

/**
 * Filter `flattenedDocs` to documents whose `datum` matches `date` (slice
 * `0..10`) or whose `dok_id` matches one of `requestedIdSet`. When the result
 * is empty AND no `--doc-id` filter was supplied, perform up to
 * `MAX_LOOKBACK_BUSINESS_DAYS` business-day lookback steps for the first
 * non-empty match.
 */
export function filterByDateWithLookback(
  flattenedDocs: RawDocument[],
  date: string,
  requestedIdSet: Set<string>,
): FilterByDateResult {
  const selected = flattenedDocs.filter((doc: RawDocument) => {
    const docId = doc.dok_id ?? '';
    if (requestedIdSet.size > 0 && requestedIdSet.has(docId.toUpperCase())) {
      return true;
    }
    if (doc.datum && typeof doc.datum === 'string') {
      return doc.datum.slice(0, 10) === date;
    }
    return false;
  });

  let dataFreshness: string | null = null;
  if (selected.length === 0 && requestedIdSet.size === 0) {
    for (let lookback = 1; lookback <= MAX_LOOKBACK_BUSINESS_DAYS; lookback++) {
      const lookbackDate = subtractBusinessDays(date, lookback);
      const lookbackDocs = flattenedDocs.filter((doc: RawDocument) => {
        if (doc.datum && typeof doc.datum === 'string') {
          return doc.datum.slice(0, 10) === lookbackDate;
        }
        return false;
      });
      if (lookbackDocs.length > 0) {
        selected.push(...lookbackDocs);
        dataFreshness = lookbackDate;
        console.log(
          `   🔄 Lookback fallback: 0 documents for ${date}, using ${lookbackDocs.length} documents from ${lookbackDate} (${lookback} business day(s) back)`,
        );
        break;
      }
    }
    if (selected.length === 0) {
      console.warn(
        `   ⚠️  Lookback exhausted (${MAX_LOOKBACK_BUSINESS_DAYS} business days) — no recent documents found in downloaded batch.`,
      );
    }
  }

  return { selected, dataFreshness };
}

/**
 * For every dok_id in `documentIds` not already represented in `allDocs`,
 * call `client.fetchDocumentDetailsWithCoverage` and append the result.
 * Failures are logged but do not throw.
 */
export async function fetchMissingDocumentsByIds(
  client: MCPClient,
  allDocs: RawDocument[],
  documentIds: string[],
  date: string,
): Promise<void> {
  if (documentIds.length === 0) return;
  const foundIds = new Set(
    allDocs.map((d: RawDocument) => (d.dok_id ?? '').toUpperCase()),
  );
  const missingIds = documentIds.filter((id) => !foundIds.has(id.toUpperCase()));
  if (missingIds.length === 0) return;

  console.log(
    `   🔍 Fetching ${missingIds.length} targeted document(s) by ID: ${missingIds.join(', ')}`,
  );
  for (const dokId of missingIds) {
    try {
      const result = await client.fetchDocumentDetailsWithCoverage(dokId, false, {
        requestedDate: date,
      });
      if (result.document && typeof result.document === 'object') {
        const doc = result.document as unknown as RawDocument;
        if (!doc.dok_id) {
          (doc as Record<string, unknown>).dok_id = dokId;
        }
        allDocs.push(doc);
        console.log(
          `   ✅ Fetched document ${dokId}: ${(doc as Record<string, unknown>).titel ?? (doc as Record<string, unknown>).title ?? '(no title)'}`,
        );
      }
    } catch (err) {
      console.warn(
        `   ⚠️ Failed to fetch document ${dokId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
