/**
 * @module parliamentary-data/helpers/normalise
 * @description Pure helpers for filtering/annotating MCP document payloads
 * and flattening downloaded collections.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../../data-transformers/types.js';
import {
  attachCoverageMetadata,
  buildMcpProvenance,
  inferDocumentCoverageState,
} from '../../mcp-client/coverage.js';
import type { DownloadedData } from '../data-downloader.js';

/** Drop falsy entries from a raw MCP list payload. */
export function normalise(raw: unknown[]): RawDocument[] {
  return (raw as RawDocument[]).filter(Boolean);
}

/**
 * Add MCP coverage-state and provenance metadata to each fetched document list.
 *
 * The wrapper stamps every document with `mcpCoverageState`/`mcpProvenance`
 * so the manifest and downstream analysis can distinguish full-text, metadata,
 * and empty-search conditions without reparsing the original MCP payload.
 */
export function annotateDocumentsWithCoverage(
  docs: RawDocument[],
  tool: string,
  query: Record<string, unknown>,
  endpoint: string,
): RawDocument[] {
  const resultCount = docs.length;
  return docs.map((doc) => {
    const record = doc as Record<string, unknown>;
    const coverageState = inferDocumentCoverageState(record);
    const provenance = buildMcpProvenance({
      endpoint,
      tool,
      query,
      resultCount,
      coverageState,
    });
    Object.assign(record, attachCoverageMetadata(record, provenance));
    return doc;
  });
}

/**
 * Flatten all downloaded document collections into a single array,
 * deduplicated by a best-effort document identifier.
 *
 * The primary deduplication key is `dok_id` when present. If `dok_id` is
 * missing or empty, the function falls back in order to:
 * `dokument_id`, `id`, `dok_url`, `url`, `rel_dok_id`, `titel`, and `title`.
 * The first non-empty string among these fields is used as the dedup key,
 * and documents resolving to the same key are treated as duplicates.
 */
export function flattenDocuments(data: DownloadedData): RawDocument[] {
  const all: RawDocument[] = [
    ...data.propositions,
    ...data.motions,
    ...data.committeeReports,
    ...data.votes,
    ...data.speeches,
    ...data.questions,
    ...data.interpellations,
  ];

  const seen = new Set<string>();
  return all.filter(doc => {
    if (!doc) return false;
    const record = doc as Record<string, unknown>;
    const idCandidates = [
      record['dok_id'],
      record['dokument_id'],
      record['id'],
      record['dok_url'],
      record['url'],
      record['rel_dok_id'],
      record['titel'],
      record['title'],
    ];
    const id = idCandidates.find((candidate): candidate is string =>
      typeof candidate === 'string' && candidate.trim().length > 0,
    )?.trim() ?? '';
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
