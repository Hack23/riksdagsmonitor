/**
 * @module parliamentary-data/mcp-retry-queue
 * @description File-backed deferred retry queue for MCP indexing/content gaps.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FetchVotingFilters, MCPCoverageState, MCPToolInvocationDiagnostic } from '../types/mcp.js';
import type { MCPClient } from '../mcp-client/client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

export const MCP_RETRY_QUEUE_SCHEMA = 'riksdagsmonitor-mcp-retry-queue/1.0';
export const DEFAULT_MCP_RETRY_QUEUE_PATH = path.join(REPO_ROOT, 'data', 'mcp-retry-queue.json');
const DEFAULT_EXPIRY_DAYS = 7;

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
  diagnostics: MCPToolInvocationDiagnostic[];
}

function emptyQueue(initialTimestamp = new Date(0).toISOString()): MCPRetryQueueFile {
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

export function createRetryQueueEntry(options: {
  resourceType: MCPRetryQueueEntry['resourceType'];
  resourceId: string;
  tool: string;
  coverageState: MCPCoverageState;
  params: Record<string, unknown>;
  docType?: string | null;
  reason?: string;
  requestedAt?: string;
  expiresInDays?: number;
}): MCPRetryQueueEntry {
  const requestedAt = options.requestedAt ?? new Date().toISOString();
  const expiresAt = new Date(
    new Date(requestedAt).getTime() + ((options.expiresInDays ?? DEFAULT_EXPIRY_DAYS) * 86400000),
  ).toISOString();
  return {
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    tool: options.tool,
    docType: options.docType ?? null,
    coverageState: options.coverageState,
    requestedAt,
    expiresAt,
    attemptCount: 0,
    params: { ...options.params },
    ...(options.reason ? { reason: options.reason } : {}),
  };
}

export function enqueueRetryEntries(
  entries: MCPRetryQueueEntry[],
  queuePath: string = DEFAULT_MCP_RETRY_QUEUE_PATH,
): MCPRetryQueueFile {
  const queue = loadMcpRetryQueue(queuePath);
  const deduped = new Map<string, MCPRetryQueueEntry>();

  for (const existing of queue.entries) {
    deduped.set(`${existing.resourceType}:${existing.resourceId}`, existing);
  }

  for (const entry of entries) {
    const key = `${entry.resourceType}:${entry.resourceId}`;
    const previous = deduped.get(key);
    deduped.set(key, previous
      ? {
          ...previous,
          ...entry,
          attemptCount: previous.attemptCount,
          requestedAt: previous.requestedAt,
          expiresAt: previous.expiresAt,
        }
      : entry);
  }

  const updated: MCPRetryQueueFile = {
    schema: MCP_RETRY_QUEUE_SCHEMA,
    updatedAt: new Date().toISOString(),
    entries: [...deduped.values()].sort((a, b) => a.resourceId.localeCompare(b.resourceId)),
  };
  saveMcpRetryQueue(updated, queuePath);
  return updated;
}

export async function drainMcpRetryQueue(
  client: MCPClient,
  options: {
    docType?: string | null;
    queuePath?: string;
    now?: Date;
    maxEntries?: number;
  } = {},
): Promise<MCPRetryDrainResult> {
  const queuePath = options.queuePath ?? DEFAULT_MCP_RETRY_QUEUE_PATH;
  const now = options.now ?? new Date();
  const queue = loadMcpRetryQueue(queuePath);
  const remaining: MCPRetryQueueEntry[] = [];
  const resolvedDocuments: Record<string, Record<string, unknown>> = {};
  const diagnostics: MCPToolInvocationDiagnostic[] = [];

  let processed = 0;
  let resolved = 0;
  let retained = 0;
  let expired = 0;

  for (const entry of queue.entries) {
    if (options.docType && entry.docType && entry.docType !== options.docType) {
      remaining.push(entry);
      continue;
    }
    if (new Date(entry.expiresAt).getTime() < now.getTime()) {
      expired++;
      continue;
    }
    if (options.maxEntries && processed >= options.maxEntries) {
      remaining.push(entry);
      continue;
    }

    processed++;
    const lastAttemptAt = now.toISOString();

    if (entry.resourceType === 'document_fulltext') {
      try {
        const result = await client.fetchDocumentDetailsWithCoverage(
          entry.resourceId,
          true,
          {
            requestedDate: (entry.params['requestedDate'] as string | undefined) ?? null,
            retrieval: 'retry_queue',
          },
        );

        diagnostics.push({
          tool: entry.tool,
          query: { ...entry.params, dok_id: entry.resourceId, include_full_text: true },
          resultCount: result.resultCount,
          coverageState: result.coverageState,
          provenance: result.provenance,
          notes: entry.reason,
        });

        if (result.coverageState === 'full_text') {
          resolved++;
          resolvedDocuments[entry.resourceId] = result.document;
          continue;
        }

        remaining.push({
          ...entry,
          attemptCount: entry.attemptCount + 1,
          coverageState: result.coverageState,
          reason: entry.reason ?? `Deferred ${entry.tool} retry still ${result.coverageState}`,
          lastAttemptAt,
        });
        retained++;
      } catch (drainErr) {
        console.warn(
          `[mcp-retry-queue] Document retry failed for ${entry.resourceId}:`,
          drainErr instanceof Error ? drainErr.message : String(drainErr),
        );
        remaining.push({
          ...entry,
          attemptCount: entry.attemptCount + 1,
          reason: `Retry failed: ${drainErr instanceof Error ? drainErr.message : String(drainErr)}`,
          lastAttemptAt,
        });
        retained++;
      }
      continue;
    }

    const votingParams = entry.params;
    if (typeof votingParams !== 'object' || votingParams === null) {
      remaining.push({
        ...entry,
        attemptCount: entry.attemptCount + 1,
        reason: 'retry queue entry has invalid voting params payload',
        lastAttemptAt,
      });
      retained++;
      continue;
    }

    try {
      const votingResult = await client.fetchVotingRecordsWithDiagnostics(
        votingParams as FetchVotingFilters,
      );

      diagnostics.push({
        tool: entry.tool,
        query: { ...(entry.params as Record<string, unknown>) },
        resultCount: votingResult.resultCount,
        coverageState: votingResult.coverageState,
        provenance: votingResult.provenance,
        notes: entry.reason,
        ...(votingResult.signal ? { signal: votingResult.signal } : {}),
      });

      if (votingResult.resultCount > 0) {
        resolved++;
        continue;
      }

      remaining.push({
        ...entry,
        attemptCount: entry.attemptCount + 1,
        coverageState: votingResult.coverageState,
        reason: votingResult.signal?.message ?? entry.reason,
        lastAttemptAt,
      });
      retained++;
    } catch (drainErr) {
      console.warn(
        `[mcp-retry-queue] Voting retry failed for ${entry.resourceId}:`,
        drainErr instanceof Error ? drainErr.message : String(drainErr),
      );
      remaining.push({
        ...entry,
        attemptCount: entry.attemptCount + 1,
        reason: `Retry failed: ${drainErr instanceof Error ? drainErr.message : String(drainErr)}`,
        lastAttemptAt,
      });
      retained++;
    }
  }

  const updatedQueue: MCPRetryQueueFile = {
    schema: MCP_RETRY_QUEUE_SCHEMA,
    updatedAt: now.toISOString(),
    entries: remaining,
  };
  saveMcpRetryQueue(updatedQueue, queuePath);

  return {
    queue: updatedQueue,
    processed,
    resolved,
    retained,
    expired,
    resolvedDocuments,
    diagnostics,
  };
}
