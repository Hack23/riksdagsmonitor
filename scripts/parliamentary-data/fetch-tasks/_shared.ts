/**
 * @module parliamentary-data/fetch-tasks/_shared
 * @description Shared factory for the 6 "metadata-only" MCP fetch tasks
 * (propositions, motions, committee reports, speeches, written questions,
 * interpellations). The 7th task — voting records — has bespoke diagnostics
 * and lives in `./voteringar.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../../data-transformers/types.js';
import { buildMcpProvenance } from '../../mcp-client/coverage.js';
import type { MCPToolInvocationDiagnostic } from '../../types/mcp.js';
import { annotateDocumentsWithCoverage, normalise } from '../helpers/normalise.js';
import type { FetchTaskContext, FetchTaskResult } from './index.js';

/**
 * Build a uniform "list-shaped" fetch task that calls `fetchFn`, normalises,
 * annotates with coverage metadata, and emits a `metadata_only` /
 * `search_empty` diagnostic.
 */
export async function runListFetch(
  ctx: FetchTaskContext,
  tool: string,
  fetchFn: () => Promise<unknown[]>,
): Promise<FetchTaskResult> {
  const { client, limit, rm } = ctx;
  const query = { limit, ...(rm ? { rm } : {}) };
  const raw = await fetchFn();
  const items = annotateDocumentsWithCoverage(
    normalise(raw),
    tool,
    query,
    client.baseURL,
  );
  const resultCount = items.length;
  const coverageState: 'search_empty' | 'metadata_only' =
    resultCount === 0 ? 'search_empty' : 'metadata_only';
  return {
    items,
    diagnostic: {
      tool,
      query,
      resultCount,
      coverageState,
      provenance: buildMcpProvenance({
        endpoint: client.baseURL,
        tool,
        query,
        resultCount,
        coverageState,
      }),
    } satisfies MCPToolInvocationDiagnostic,
  };
}

/** Helper that produces an `assign` callback for a given DownloadedData key. */
export function assignTo<K extends keyof FetchTaskContext['data']>(
  ctx: FetchTaskContext,
  key: K,
): (raw: RawDocument[]) => void {
  return (raw: RawDocument[]) => {
    (ctx.data as unknown as Record<string, RawDocument[]>)[key as string] = raw;
  };
}
