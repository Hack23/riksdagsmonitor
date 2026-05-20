/**
 * @module parliamentary-data/mcp-retry-queue/retry-policy
 * @description Backoff + cap policy for queue entries. Builds new entries
 * (`createRetryQueueEntry`) and merges them into the on-disk queue with
 * deduplication (`enqueueRetryEntries`).
 *
 * Default expiry: 7 days. Entries are keyed by `${resourceType}:${resourceId}`
 * so re-enqueuing the same resource does not duplicate the row but preserves
 * the original `requestedAt` / `expiresAt` and `attemptCount`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPCoverageState } from '../../types/mcp.js';
import {
  DEFAULT_MCP_RETRY_QUEUE_PATH,
  MCP_RETRY_QUEUE_SCHEMA,
  loadMcpRetryQueue,
  saveMcpRetryQueue,
  type MCPRetryQueueEntry,
  type MCPRetryQueueFile,
} from './persistence.js';

const DEFAULT_EXPIRY_DAYS = 7;

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
