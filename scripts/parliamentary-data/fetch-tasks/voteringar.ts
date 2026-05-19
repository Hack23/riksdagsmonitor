/**
 * @module parliamentary-data/fetch-tasks/voteringar
 * @description `search_voteringar` (voting records) fetch task factory.
 * Uses the bespoke `fetchVotingRecordsWithDiagnostics` MCP call which already
 * returns provenance + coverageState + optional signal — so this task does
 * NOT go through the shared `runListFetch` helper.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPToolInvocationDiagnostic } from '../../types/mcp.js';
import { normalise } from '../helpers/normalise.js';
import type { FetchTask, FetchTaskContext, FetchTaskResult } from './index.js';
import { assignTo } from './_shared.js';

export function createVoteringarTask(ctx: FetchTaskContext): FetchTask {
  const { client, limit, rm } = ctx;
  return {
    name: 'fetchVotingRecords',
    source: 'search_voteringar',
    query: () => ({ limit, rm }),
    fetch: async (): Promise<FetchTaskResult> => {
      const result = await client.fetchVotingRecordsWithDiagnostics({ limit, rm });
      return {
        items: normalise(result.items),
        diagnostic: {
          tool: 'search_voteringar',
          query: result.query,
          resultCount: result.resultCount,
          coverageState: result.coverageState,
          provenance: result.provenance,
          ...(result.signal ? { signal: result.signal, notes: result.signal.message } : {}),
        } satisfies MCPToolInvocationDiagnostic,
      };
    },
    assign: assignTo(ctx, 'votes'),
  };
}
