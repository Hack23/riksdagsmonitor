/**
 * @module parliamentary-data/mcp-retry-queue/persistence
 * @description On-disk queue state — schema constants, types, load/save
 * primitives for the file-backed deferred MCP retry queue. Pure I/O with no
 * MCP client coupling.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MCPCoverageState, MCPToolInvocationDiagnostic } from '../../types/mcp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

export const MCP_RETRY_QUEUE_SCHEMA = 'riksdagsmonitor-mcp-retry-queue/1.0';
export const DEFAULT_MCP_RETRY_QUEUE_PATH = path.join(
  REPO_ROOT,
  'data',
  'mcp-retry-queue.json',
);

export interface MCPRetryQueueEntry {
  resourceType: 'document_fulltext' | 'voteringar_search';
  resourceId: string;
  tool: string;
  docType?: string | null;
  coverageState: MCPCoverageState;
  requestedAt: string;
  expiresAt: string;
  attemptCount: number;
  params: Record<string, unknown>;
  reason?: string;
  lastAttemptAt?: string;
}

export interface MCPRetryQueueFile {
  schema: string;
  updatedAt: string;
  entries: MCPRetryQueueEntry[];
}

export interface MCPRetryDrainResult {
  queue: MCPRetryQueueFile;
  processed: number;
  resolved: number;
  retained: number;
  expired: number;
  resolvedDocuments: Record<string, Record<string, unknown>>;
  /**
   * Voting rows recovered from previously-deferred voteringar searches,
   * keyed by the queue entry's `resourceId` (the exact query payload).
   * Surfaced so callers can re-inject the rows into the run output even if
   * the original query is no longer selected by the current date/filter.
   */
  resolvedVoteringar: Record<string, unknown[]>;
  diagnostics: MCPToolInvocationDiagnostic[];
}

export function emptyQueue(
  initialTimestamp = new Date(0).toISOString(),
): MCPRetryQueueFile {
  return {
    schema: MCP_RETRY_QUEUE_SCHEMA,
    updatedAt: initialTimestamp,
    entries: [],
  };
}

export function loadMcpRetryQueue(
  queuePath: string = DEFAULT_MCP_RETRY_QUEUE_PATH,
): MCPRetryQueueFile {
  if (!fs.existsSync(queuePath)) return emptyQueue();
  try {
    const parsed = JSON.parse(fs.readFileSync(queuePath, 'utf8')) as Partial<MCPRetryQueueFile>;
    return {
      schema: parsed.schema ?? MCP_RETRY_QUEUE_SCHEMA,
      updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
      entries: Array.isArray(parsed.entries) ? parsed.entries as MCPRetryQueueEntry[] : [],
    };
  } catch {
    return emptyQueue();
  }
}

export function saveMcpRetryQueue(
  queue: MCPRetryQueueFile,
  queuePath: string = DEFAULT_MCP_RETRY_QUEUE_PATH,
): void {
  fs.mkdirSync(path.dirname(queuePath), { recursive: true });
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + '\n', 'utf8');
}
