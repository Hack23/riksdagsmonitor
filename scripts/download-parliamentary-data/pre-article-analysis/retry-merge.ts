/**
 * @module download-parliamentary-data/pre-article-analysis/retry-merge
 * @description Merge resolved voteringar + documents from the deferred MCP
 * retry queue drain back into the live download batch.
 *
 * Two flows:
 *   1. `mergeResolvedVoteringar` — push recovered voting rows onto
 *      `data.votes` (so they participate in persistence + manifest counts).
 *   2. `mergeResolvedDocuments` — overlay resolved full-text data onto any
 *      matching doc in `allDocs`, and append docs the current selection did
 *      not include.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../../data-transformers/types.js';
import type { DownloadedData } from '../../parliamentary-data/data-downloader.js';

import { extractDokId } from '../manifest.js';

/**
 * Push every entry of `resolvedVoteringar` (keyed by the original query) onto
 * `data.votes`, logging each batch. Returns the merged count.
 */
export function mergeResolvedVoteringar(
  data: DownloadedData,
  resolvedVoteringar: Record<string, unknown[]>,
): number {
  if (Object.keys(resolvedVoteringar).length === 0) return 0;

  let mergedVoteCount = 0;
  for (const [queryKey, items] of Object.entries(resolvedVoteringar)) {
    if (!Array.isArray(items) || items.length === 0) continue;
    data.votes.push(...(items as RawDocument[]));
    mergedVoteCount += items.length;
    console.log(`   🗳️  Recovered ${items.length} voteringar from deferred queue (${queryKey})`);
  }
  if (mergedVoteCount > 0) {
    console.log(
      `   🔁 Deferred queue restored ${mergedVoteCount} voteringar row(s) — appended to current-run output`,
    );
  }
  return mergedVoteCount;
}

/**
 * Overlay `resolvedDocuments` (keyed by `dok_id`) onto matching docs in
 * `allDocs`, and append documents not already selected by the current run's
 * date filter. Returns the set of merged ids.
 */
export function mergeResolvedDocuments(
  allDocs: RawDocument[],
  resolvedDocuments: Record<string, Record<string, unknown>>,
): Set<string> {
  const mergedIds = new Set<string>();
  if (Object.keys(resolvedDocuments).length === 0) return mergedIds;

  const resolvedIds = new Set(Object.keys(resolvedDocuments));
  for (const doc of allDocs) {
    const dokId = extractDokId(doc, '');
    if (!dokId || !resolvedIds.has(dokId)) continue;
    Object.assign(doc, resolvedDocuments[dokId]);
    mergedIds.add(dokId);
  }
  // Append resolved documents that aren't already in allDocs (e.g. from a
  // prior run's queue where the document is no longer selected by current
  // date filters)
  for (const dokId of resolvedIds) {
    if (mergedIds.has(dokId)) continue;
    const resolvedDoc = resolvedDocuments[dokId] as RawDocument;
    if (resolvedDoc) {
      allDocs.push(resolvedDoc);
      mergedIds.add(dokId);
    }
  }
  console.log(`   🔁 Deferred queue restored full text for ${mergedIds.size} document(s)`);
  return mergedIds;
}
