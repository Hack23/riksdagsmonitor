/**
 * @module parliamentary-data/mcp-retry-queue/classifier
 * @description Transient vs permanent retry classification — per-resource-type
 * drain handlers for `document_fulltext` and `voteringar_search` entries.
 *
 * Each handler:
 *  - Invokes the appropriate MCP client method.
 *  - Returns a structured `DrainOutcome` so the orchestrator can decide
 *    whether to resolve, retain (with incremented `attemptCount`), or
 *    classify as `fetch_error`.
 *  - Emits the diagnostic that lands in the data-download-manifest's
 *    `## MCP Query Diagnostics` section (including `fetch_error` for failed
 *    retries — without this, failures disappear into the aggregate retained
 *    counter).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPClient } from '../../mcp-client/client.js';
import type { FetchVotingFilters, MCPToolInvocationDiagnostic } from '../../types/mcp.js';

import type { MCPRetryQueueEntry } from './persistence.js';

export type DrainOutcome =
  | {
      kind: 'resolved';
      diagnostic: MCPToolInvocationDiagnostic;
      document?: Record<string, unknown>;
      voteringar?: unknown[];
    }
  | {
      kind: 'retained';
      diagnostic: MCPToolInvocationDiagnostic | null;
      entry: MCPRetryQueueEntry;
    };

export async function drainDocumentFulltextEntry(
  client: MCPClient,
  entry: MCPRetryQueueEntry,
  now: Date,
): Promise<DrainOutcome> {
  const lastAttemptAt = now.toISOString();
  try {
    const result = await client.fetchDocumentDetailsWithCoverage(
      entry.resourceId,
      true,
      {
        requestedDate: (entry.params['requestedDate'] as string | undefined) ?? null,
        retrieval: 'retry_queue',
      },
    );

    const diagnostic: MCPToolInvocationDiagnostic = {
      tool: entry.tool,
      query: { ...entry.params, dok_id: entry.resourceId, include_full_text: true },
      resultCount: result.resultCount,
      coverageState: result.coverageState,
      provenance: result.provenance,
      notes: entry.reason,
    };

    if (result.coverageState === 'full_text') {
      return { kind: 'resolved', diagnostic, document: result.document };
    }

    return {
      kind: 'retained',
      diagnostic,
      entry: {
        ...entry,
        attemptCount: entry.attemptCount + 1,
        coverageState: result.coverageState,
        reason: entry.reason ?? `Deferred ${entry.tool} retry still ${result.coverageState}`,
        lastAttemptAt,
      },
    };
  } catch (drainErr) {
    const errMessage = drainErr instanceof Error ? drainErr.message : String(drainErr);
    console.warn(
      `[mcp-retry-queue] Document retry failed for ${entry.resourceId}:`,
      errMessage,
    );
    return {
      kind: 'retained',
      diagnostic: {
        tool: entry.tool,
        query: { ...entry.params, dok_id: entry.resourceId, include_full_text: true },
        resultCount: 0,
        coverageState: 'fetch_error',
        provenance: {
          provider: 'riksdag-regering',
          endpoint: client.baseURL,
          tool: entry.tool,
          query: { ...entry.params, dok_id: entry.resourceId, include_full_text: true },
          resultCount: 0,
          coverageState: 'fetch_error',
          retrieval: 'retry_queue',
          retrievedAt: now.toISOString(),
        },
        notes: `Retry failed: ${errMessage}`,
      },
      entry: {
        ...entry,
        attemptCount: entry.attemptCount + 1,
        coverageState: 'fetch_error',
        reason: `Retry failed: ${errMessage}`,
        lastAttemptAt,
      },
    };
  }
}

export async function drainVoteringarSearchEntry(
  client: MCPClient,
  entry: MCPRetryQueueEntry,
  now: Date,
): Promise<DrainOutcome> {
  const lastAttemptAt = now.toISOString();
  const votingParams = entry.params;
  if (typeof votingParams !== 'object' || votingParams === null) {
    return {
      kind: 'retained',
      diagnostic: null,
      entry: {
        ...entry,
        attemptCount: entry.attemptCount + 1,
        reason: 'retry queue entry has invalid voting params payload',
        lastAttemptAt,
      },
    };
  }

  try {
    const votingResult = await client.fetchVotingRecordsWithDiagnostics(
      votingParams as FetchVotingFilters,
    );

    const diagnostic: MCPToolInvocationDiagnostic = {
      tool: entry.tool,
      query: { ...(entry.params as Record<string, unknown>) },
      resultCount: votingResult.resultCount,
      coverageState: votingResult.coverageState,
      provenance: votingResult.provenance,
      notes: entry.reason,
      ...(votingResult.signal ? { signal: votingResult.signal } : {}),
    };

    if (votingResult.resultCount > 0) {
      return {
        kind: 'resolved',
        diagnostic,
        voteringar: Array.isArray(votingResult.items)
          ? (votingResult.items as unknown[])
          : undefined,
      };
    }

    return {
      kind: 'retained',
      diagnostic,
      entry: {
        ...entry,
        attemptCount: entry.attemptCount + 1,
        coverageState: votingResult.coverageState,
        reason: votingResult.signal?.message ?? entry.reason,
        lastAttemptAt,
      },
    };
  } catch (drainErr) {
    const errMessage = drainErr instanceof Error ? drainErr.message : String(drainErr);
    console.warn(
      `[mcp-retry-queue] Voting retry failed for ${entry.resourceId}:`,
      errMessage,
    );
    return {
      kind: 'retained',
      diagnostic: {
        tool: entry.tool,
        query: { ...(entry.params as Record<string, unknown>) },
        resultCount: 0,
        coverageState: 'fetch_error',
        provenance: {
          provider: 'riksdag-regering',
          endpoint: client.baseURL,
          tool: entry.tool,
          query: { ...(entry.params as Record<string, unknown>) },
          resultCount: 0,
          coverageState: 'fetch_error',
          retrieval: 'retry_queue',
          retrievedAt: now.toISOString(),
        },
        notes: `Retry failed: ${errMessage}`,
      },
      entry: {
        ...entry,
        attemptCount: entry.attemptCount + 1,
        coverageState: 'fetch_error',
        reason: `Retry failed: ${errMessage}`,
        lastAttemptAt,
      },
    };
  }
}
