import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MCPClient } from '../scripts/mcp-client/client.js';
import {
  createRetryQueueEntry,
  drainMcpRetryQueue,
  enqueueRetryEntries,
  loadMcpRetryQueue,
} from '../scripts/parliamentary-data/mcp-retry-queue.js';

let testQueueDir: string | null = null;

afterEach(() => {
  if (testQueueDir) {
    fs.rmSync(testQueueDir, { recursive: true, force: true });
    testQueueDir = null;
  }
});

function queuePath(): string {
  testQueueDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-retry-queue-'));
  return path.join(testQueueDir, 'mcp-retry-queue.json');
}

describe('mcp retry queue', () => {
  it('deduplicates entries by resource type + id', () => {
    const file = queuePath();
    enqueueRetryEntries([
      createRetryQueueEntry({
        resourceType: 'document_fulltext',
        resourceId: 'HD10492',
        tool: 'get_dokument_innehall',
        coverageState: 'not_indexed',
        params: { requestedDate: '2026-05-15' },
      }),
      createRetryQueueEntry({
        resourceType: 'document_fulltext',
        resourceId: 'HD10492',
        tool: 'get_dokument_innehall',
        coverageState: 'metadata_only',
        params: { requestedDate: '2026-05-15' },
      }),
    ], file);

    const loaded = loadMcpRetryQueue(file);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0]?.resourceId).toBe('HD10492');
  });

  it('drains a queued document once full text becomes available', async () => {
    const file = queuePath();
    enqueueRetryEntries([
      createRetryQueueEntry({
        resourceType: 'document_fulltext',
        resourceId: 'HD10492',
        tool: 'get_dokument_innehall',
        coverageState: 'not_indexed',
        params: { requestedDate: '2026-05-15' },
      }),
    ], file);

    const client = {
      fetchDocumentDetailsWithCoverage: vi.fn().mockResolvedValue({
        document: {
          dok_id: 'HD10492',
          fullText: 'X'.repeat(120),
          mcpCoverageState: 'full_text',
        },
        query: { dok_id: 'HD10492', include_full_text: true },
        resultCount: 1,
        coverageState: 'full_text',
        provenance: {
          provider: 'riksdag-regering',
          endpoint: 'https://riksdag-regering-ai.onrender.com/mcp',
          tool: 'get_dokument_innehall',
          query: { dok_id: 'HD10492', include_full_text: true },
          resultCount: 1,
          coverageState: 'full_text',
          retrieval: 'retry_queue',
          retrievedAt: '2026-05-15T00:00:00.000Z',
        },
      }),
      fetchVotingRecordsWithDiagnostics: vi.fn(),
    } as unknown as MCPClient;

    const result = await drainMcpRetryQueue(client, { queuePath: file });
    expect(result.resolved).toBe(1);
    expect(result.queue.entries).toHaveLength(0);
    expect(result.resolvedDocuments['HD10492']).toBeDefined();
  });
});
