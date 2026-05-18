/**
 * @module mcp-client/methods/votes
 * @description Voting record / votering domain methods for the MCP client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPTransportClient } from '../transport/jsonrpc.js';
import type {
  FetchVotingFilters,
  FetchVotingGroupFilters,
  MCPSearchResult,
  MCPStructuredSignal,
  MCPProvenance,
} from '../../types/mcp.js';
import { attachCoverageMetadata, buildMcpProvenance } from '../coverage.js';
import { previousRiksmote } from '../riksmote/helpers.js';

export async function fetchVotingRecords(
  transport: MCPTransportClient,
  filters: FetchVotingFilters,
): Promise<unknown[]> {
  return (await fetchVotingRecordsWithDiagnostics(transport, filters)).items;
}

export async function fetchVotingRecordsWithDiagnostics(
  transport: MCPTransportClient,
  filters: FetchVotingFilters,
): Promise<MCPSearchResult<Record<string, unknown>> & { signal?: MCPStructuredSignal }> {
  const response = await transport.request(
    'search_voteringar',
    filters as unknown as Record<string, unknown>,
  );
  const items = ((response['votes'] ?? response['voteringar'] ?? []) as Record<string, unknown>[])
    .map((vote) => ({ ...vote }));
  const resultCount = items.length;
  let signal: MCPStructuredSignal | undefined;

  if (resultCount === 0 && typeof filters.rm === 'string') {
    const comparisonRm = previousRiksmote(filters.rm);
    if (comparisonRm) {
      try {
        const comparisonResponse = await transport.request(
          'search_voteringar',
          { ...(filters as Record<string, unknown>), rm: comparisonRm },
        );
        const comparisonCount = (
          (comparisonResponse['votes'] ?? comparisonResponse['voteringar'] ?? []) as unknown[]
        ).length;
        if (comparisonCount > 0) {
          signal = {
            code: 'MCP_INDEXING_LAG',
            severity: 'warning',
            message: `search_voteringar returned 0 rows for ${filters.rm} while ${comparisonRm} still returns ${comparisonCount}; this may indicate indexing lag or pending vote availability, so queue an exact-query retry for the next run.`,
            tool: 'search_voteringar',
            query: { ...(filters as Record<string, unknown>) },
            observedResultCount: resultCount,
            comparisonRm,
            comparisonResultCount: comparisonCount,
            action: 'retry_queue',
          };
        }
      } catch {
        // Best-effort comparison only; the primary zero-result response still stands.
      }
    }
  }

  const coverageState = resultCount === 0 ? 'search_empty' : 'metadata_only';
  const provenance: MCPProvenance = buildMcpProvenance({
    endpoint: transport.baseURL,
    tool: 'search_voteringar',
    query: filters as Record<string, unknown>,
    resultCount,
    coverageState,
    signals: signal ? [signal] : undefined,
  });

  return {
    items: items.map((vote) => attachCoverageMetadata(vote, provenance)),
    query: { ...(filters as Record<string, unknown>) },
    resultCount,
    coverageState,
    provenance,
    ...(signal ? { signal } : {}),
  };
}

export async function fetchVotingGroup(
  transport: MCPTransportClient,
  params: FetchVotingGroupFilters = {},
): Promise<unknown[]> {
  const response = await transport.request(
    'get_voting_group',
    params as unknown as Record<string, unknown>,
  );
  return (response['groups'] ?? response['votes'] ?? []) as unknown[];
}
