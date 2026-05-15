/**
 * @module mcp-client/coverage
 * @description Coverage-state and provenance helpers for riksdag-regering MCP data.
 */

import { isPersonProfileText } from '../data-transformers/helpers.js';
import type { MCPCoverageState, MCPProvenance, MCPStructuredSignal } from '../types/mcp.js';

const SUBSTANTIVE_TEXT_MIN_LENGTH = 100;

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
 */
export function inferDocumentCoverageState(
  record: Record<string, unknown>,
  options: { requestedDate?: string | null; fullTextRequested?: boolean } = {},
): MCPCoverageState {
  if (hasSubstantiveFullText(record)) return 'full_text';

  const requestedDate = options.requestedDate?.slice(0, 10) ?? null;
  const documentDate = extractDocumentDate(record);
  const sameDay = Boolean(requestedDate && documentDate && requestedDate === documentDate);

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
