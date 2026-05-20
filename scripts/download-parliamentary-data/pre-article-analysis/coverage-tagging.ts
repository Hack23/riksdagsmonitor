/**
 * @module download-parliamentary-data/pre-article-analysis/coverage-tagging
 * @description Significance / coverage classifiers used pre-analysis.
 *
 * Tags downloaded documents with `mcpCoverageState` / `mcpProvenance` (when
 * not already set by an enrichment pass), and builds deferred retry-queue
 * entries from `MCP_INDEXING_LAG` diagnostics, full-text outcomes, and the
 * fallback `not_indexed` flow for documents enrichment touched but couldn't
 * recover.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../../data-transformers/types.js';
import type {
  DocumentTypeKey,
  FullTextFetchOutcome,
} from '../../parliamentary-data/data-downloader.js';
import {
  buildMcpProvenance,
  inferDocumentCoverageState,
} from '../../mcp-client/coverage.js';
import {
  createRetryQueueEntry,
  type MCPRetryQueueEntry,
} from '../../parliamentary-data/mcp-retry-queue.js';
import type {
  MCPCoverageState,
  MCPToolInvocationDiagnostic,
} from '../../types/mcp.js';
import type { MCPClient } from '../../mcp-client/client.js';

import { extractDokId } from '../manifest.js';

/**
 * For every doc in `allDocs` without a pre-existing `mcpCoverageState`,
 * infer the coverage state from the analysis run `date` (NOT `doc.datum` —
 * that would incorrectly classify any dated metadata-only document as a
 * same-day filing) and attach an `mcpProvenance` block.
 */
export function tagDocumentsWithCoverage(
  client: MCPClient,
  allDocs: RawDocument[],
  date: string,
): void {
  for (const doc of allDocs) {
    const record = doc as Record<string, unknown>;
    if (record['mcpCoverageState']) continue;
    const coverageState = inferDocumentCoverageState(record, {
      requestedDate: date,
      fullTextRequested: Boolean(doc.contentFetched),
    });
    record['mcpCoverageState'] = coverageState;
    record['mcpProvenance'] = buildMcpProvenance({
      endpoint: client.baseURL,
      tool: 'download-parliamentary-data',
      query: { dok_id: extractDokId(doc, '') },
      resultCount: 1,
      coverageState,
    });
  }
}

/**
 * Build retry-queue entries for the `MCP_INDEXING_LAG` voteringar diagnostics
 * emitted by `downloadAllDocuments`. Each entry is keyed by the JSON-encoded
 * voting filters so dedup uses the exact query shape.
 */
export function buildVoteringarLagEntries(
  toolDiagnostics: MCPToolInvocationDiagnostic[],
  docType: DocumentTypeKey | null,
  now: () => string = () => new Date().toISOString(),
): MCPRetryQueueEntry[] {
  return toolDiagnostics
    .filter((diag) => diag.signal?.code === 'MCP_INDEXING_LAG')
    .map((diag) =>
      createRetryQueueEntry({
        resourceType: 'voteringar_search',
        resourceId: `search_voteringar:${JSON.stringify(diag.query)}`,
        tool: diag.tool,
        coverageState: diag.coverageState,
        docType,
        params: diag.query,
        reason: diag.signal?.message,
        requestedAt: now(),
      }),
    );
}

/**
 * Build retry-queue entries from `fetchFullTextForTopN` outcomes whose
 * coverage state landed below `full_text` AND whose source `datum` matches
 * the run date. These are same-day filings that still need a follow-up
 * full-text fetch.
 */
export function buildFullTextOutcomeEntries(
  fullTextOutcomes: FullTextFetchOutcome[] | undefined,
  allDocs: RawDocument[],
  docType: DocumentTypeKey | null,
  date: string,
  now: () => string = () => new Date().toISOString(),
): MCPRetryQueueEntry[] {
  if (!fullTextOutcomes) return [];
  const entries: MCPRetryQueueEntry[] = [];
  const docMap = new Map(allDocs.map((doc) => [extractDokId(doc, ''), doc]));
  for (const outcome of fullTextOutcomes) {
    const doc = docMap.get(outcome.dokId);
    if (!doc) continue;
    if (
      outcome.coverageState !== 'full_text' &&
      typeof doc.datum === 'string' &&
      doc.datum.slice(0, 10) === date
    ) {
      entries.push(
        createRetryQueueEntry({
          resourceType: 'document_fulltext',
          resourceId: outcome.dokId,
          tool: 'get_dokument_innehall',
          coverageState: outcome.coverageState,
          docType,
          params: { requestedDate: doc.datum.slice(0, 10), include_full_text: true },
          reason: outcome.reason,
          requestedAt: now(),
        }),
      );
    }
  }
  return entries;
}

/**
 * Fallback retry-queue enrolment for the default (non-top-N) flow:
 * `downloadAllDocuments()` already attempts limited full-text enrichment
 * (`MAX_ENRICHMENT_PER_TYPE`) and can set `mcpCoverageState: 'not_indexed'`,
 * but those documents are not represented in `fullTextOutcomes`. Without
 * this loop, same-day not-yet-indexed documents are silently dropped from
 * the deferred retry queue instead of being scheduled for a later run.
 */
export function buildFallbackNotIndexedEntries(
  allDocs: RawDocument[],
  alreadyQueuedDocIds: Set<string>,
  docType: DocumentTypeKey | null,
  date: string,
  now: () => string = () => new Date().toISOString(),
): MCPRetryQueueEntry[] {
  const entries: MCPRetryQueueEntry[] = [];
  for (const doc of allDocs) {
    const record = doc as Record<string, unknown>;
    const coverageState = record['mcpCoverageState'] as MCPCoverageState | undefined;
    if (coverageState !== 'not_indexed') continue;
    if (typeof doc.datum !== 'string' || doc.datum.slice(0, 10) !== date) continue;
    const dokId = extractDokId(doc, '');
    if (!dokId || alreadyQueuedDocIds.has(dokId)) continue;
    const provenanceReason =
      record['mcpProvenance'] &&
      typeof (record['mcpProvenance'] as Record<string, unknown>)['signals'] === 'object'
        ? undefined
        : `Same-day enrichment returned ${coverageState} for ${dokId}`;
    entries.push(
      createRetryQueueEntry({
        resourceType: 'document_fulltext',
        resourceId: dokId,
        tool: 'get_dokument_innehall',
        coverageState,
        docType,
        params: { requestedDate: doc.datum.slice(0, 10), include_full_text: true },
        reason: provenanceReason,
        requestedAt: now(),
      }),
    );
    alreadyQueuedDocIds.add(dokId);
  }
  return entries;
}
