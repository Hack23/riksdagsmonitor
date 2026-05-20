/**
 * @module parliamentary-data/mcp-retry-queue
 * @description Queue orchestrator — drains the file-backed deferred MCP retry
 * queue against a live `MCPClient`, classifies each entry as resolved or
 * retained, and writes the updated queue back to disk.
 *
 * Public surface (re-exports for backward compatibility):
 *  - `MCP_RETRY_QUEUE_SCHEMA`, `DEFAULT_MCP_RETRY_QUEUE_PATH`
 *  - Types: `MCPRetryQueueEntry`, `MCPRetryQueueFile`, `MCPRetryDrainResult`
 *  - I/O: `loadMcpRetryQueue`, `saveMcpRetryQueue`
 *  - Build/merge: `createRetryQueueEntry`, `enqueueRetryEntries`
 *  - Drain: `drainMcpRetryQueue`
 *
 * Original 373-line `mcp-retry-queue.ts` was split into this directory; the
 * top-level file is now a re-export shim that preserves the historic import
 * path used by `tests/mcp-retry-queue.test.ts` and downstream callers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPClient } from '../../mcp-client/client.js';
import type { MCPToolInvocationDiagnostic } from '../../types/mcp.js';

import {
  drainDocumentFulltextEntry,
  drainVoteringarSearchEntry,
} from './classifier.js';
import {
  DEFAULT_MCP_RETRY_QUEUE_PATH,
  MCP_RETRY_QUEUE_SCHEMA,
  loadMcpRetryQueue,
  saveMcpRetryQueue,
  type MCPRetryDrainResult,
  type MCPRetryQueueEntry,
  type MCPRetryQueueFile,
} from './persistence.js';

export {
  DEFAULT_MCP_RETRY_QUEUE_PATH,
  MCP_RETRY_QUEUE_SCHEMA,
  loadMcpRetryQueue,
  saveMcpRetryQueue,
  type MCPRetryDrainResult,
  type MCPRetryQueueEntry,
  type MCPRetryQueueFile,
};
export { createRetryQueueEntry, enqueueRetryEntries } from './retry-policy.js';

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
  const resolvedVoteringar: Record<string, unknown[]> = {};
  const diagnostics: MCPToolInvocationDiagnostic[] = [];
  const originalEntryCount = queue.entries.length;

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

    const outcome =
      entry.resourceType === 'document_fulltext'
        ? await drainDocumentFulltextEntry(client, entry, now)
        : await drainVoteringarSearchEntry(client, entry, now);

    if (outcome.diagnostic) diagnostics.push(outcome.diagnostic);

    if (outcome.kind === 'resolved') {
      resolved++;
      if (outcome.document) resolvedDocuments[entry.resourceId] = outcome.document;
      if (outcome.voteringar) resolvedVoteringar[entry.resourceId] = outcome.voteringar;
      continue;
    }

    remaining.push(outcome.entry);
    retained++;
  }

  const updatedQueue: MCPRetryQueueFile = {
    schema: MCP_RETRY_QUEUE_SCHEMA,
    updatedAt: now.toISOString(),
    entries: remaining,
  };

  // Avoid touching the queue file when the queue was already empty AND we
  // had nothing to process. Without this guard, every news workflow would
  // dirty `data/mcp-retry-queue.json` with a fresh `updatedAt` even when no
  // retry work occurred, producing noisy PR diffs and merge conflicts.
  const hadWork = originalEntryCount > 0 || processed > 0 || expired > 0 || remaining.length > 0;
  if (hadWork) {
    saveMcpRetryQueue(updatedQueue, queuePath);
  }

  return {
    queue: updatedQueue,
    processed,
    resolved,
    retained,
    expired,
    resolvedDocuments,
    resolvedVoteringar,
    diagnostics,
  };
}
