/**
 * @module mcp-client/coverage
 * @description Coverage-state and provenance helpers for riksdag-regering MCP data.
 */

import { isPersonProfileText } from '../data-transformers/helpers.js';
import type { MCPCoverageState, MCPProvenance, MCPStructuredSignal } from '../types/mcp.js';
import { FULL_TEXT_MIN_LENGTH as SUBSTANTIVE_TEXT_MIN_LENGTH } from '../parliamentary-data/full-text-threshold.js';

function asCleanString(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return isPersonProfileText(trimmed) ? '' : trimmed;
}

/**
 * Extract the best-effort primary date for a document-like payload.
 */
export function extractDocumentDate(record: Record<string, unknown>): string | null {
  const candidates = [
    record['datum'],
    record['inlämnad'],
    record['inlamnad'],
    record['publicerad'],
    record['date'],
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length >= 10) {
      return candidate.trim().slice(0, 10);
    }
  }
  return null;
}

/**
 * Returns true when the payload carries meaningful document text.
 */
export function hasSubstantiveFullText(record: Record<string, unknown>): boolean {
  const contentFields = ['fullText', 'fullContent', 'text', 'html'];
  return contentFields.some((field) => asCleanString(record[field]).length > SUBSTANTIVE_TEXT_MIN_LENGTH);
}

/**
 * Infer the machine-readable MCP coverage state for a document payload.
 *
 * The `requestedDate` should be the current analysis/run date (i.e. "today"),
 * NOT the document's own publication date. Only when the document was published
 * on the same day as the analysis run and still lacks full text do we infer
 * `not_indexed` (indexing lag). For older documents without full text, the
 * correct state is `metadata_only`.
 */
export function inferDocumentCoverageState(
  record: Record<string, unknown>,
  options: { requestedDate?: string | null; fullTextRequested?: boolean } = {},
): MCPCoverageState {
  if (hasSubstantiveFullText(record)) return 'full_text';

  const requestedDate = options.requestedDate?.slice(0, 10) ?? null;
  const documentDate = extractDocumentDate(record);

  // Only infer `not_indexed` when:
  // 1. Full text was requested
  // 2. We have BOTH a run date and a document date
  // 3. The document was published on the SAME day as the analysis run
  // This means the document is brand new and likely not yet indexed.
  const sameDay = Boolean(
    requestedDate && documentDate && requestedDate === documentDate,
  );

  if (options.fullTextRequested && sameDay) {
    return 'not_indexed';
  }

  return 'metadata_only';
}

/**
 * Build the standardised MCP provenance block for an MCP-derived payload.
 */
export function buildMcpProvenance(options: {
  endpoint: string;
  tool: string;
  query: Record<string, unknown>;
  resultCount: number;
  coverageState: MCPCoverageState;
  retrieval?: 'live' | 'retry_queue' | 'cache';
  retrievedAt?: string;
  signals?: MCPStructuredSignal[];
}): MCPProvenance {
  return {
    provider: 'riksdag-regering',
    endpoint: options.endpoint,
    tool: options.tool,
    query: { ...options.query },
    resultCount: options.resultCount,
    coverageState: options.coverageState,
    retrieval: options.retrieval ?? 'live',
    retrievedAt: options.retrievedAt ?? new Date().toISOString(),
    ...(options.signals && options.signals.length > 0 ? { signals: options.signals } : {}),
  };
}

/**
 * Attach coverage-state metadata to an arbitrary record.
 */
export function attachCoverageMetadata<T extends Record<string, unknown>>(
  record: T,
  provenance: MCPProvenance,
): T & {
  mcpCoverageState: MCPCoverageState;
  mcpProvenance: MCPProvenance;
  mcpSignals?: MCPStructuredSignal[];
} {
  return {
    ...record,
    mcpCoverageState: provenance.coverageState,
    mcpProvenance: provenance,
    ...(provenance.signals && provenance.signals.length > 0
      ? { mcpSignals: provenance.signals }
      : {}),
  };
}
