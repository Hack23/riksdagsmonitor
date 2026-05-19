/**
 * @module parliamentary-data/data-downloader
 * @description Thin orchestrator that fans out per-doctype fetch tasks and
 * runs full-text enrichment on the top documents. Pure helpers, fetch-task
 * factories, error-classification wrapper, and enrichment flows now live in
 * sibling sub-folders:
 *
 * - `./helpers/`     — pure normalise / flatten / business-days / current-rm
 * - `./errors/`      — not-indexed classification wrapper
 * - `./fetch-tasks/` — 7 per-doctype fetch task factories
 * - `./enrichment/`  — in-memory + top-N full-text enrichment
 *
 * Public API is preserved verbatim via re-exports so existing tests
 * (`tests/auto-full-text-top-n.test.ts`, `tests/data-downloader-enrichment.test.ts`,
 * `tests/statskontoret-enrichment-contract.test.ts`, …) keep importing from
 * this module unchanged.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../data-transformers/types.js';
import type { MCPClient } from '../mcp-client/client.js';
import type { MCPToolInvocationDiagnostic } from '../types/mcp.js';
import { buildMcpProvenance } from '../mcp-client/coverage.js';

// ---------------------------------------------------------------------------
// Re-exports (public API preserved verbatim)
// ---------------------------------------------------------------------------

export { FULL_TEXT_MIN_LENGTH } from './full-text-threshold.js';
export { subtractBusinessDays, MAX_LOOKBACK_BUSINESS_DAYS } from './helpers/business-days.js';
export { flattenDocuments } from './helpers/normalise.js';
export { isDocumentNotIndexedError } from './errors/not-indexed.js';
export {
  MAX_ENRICHMENT_PER_TYPE,
  LONG_HORIZON_FULL_TEXT_FLOOR,
  fetchFullTextForTopN,
  type FullTextFetchOutcome,
} from './enrichment/full-text.js';

// ---------------------------------------------------------------------------
// Local imports
// ---------------------------------------------------------------------------

import { currentRm } from './helpers/current-rm.js';
import { enrichTopDocumentsWithDetails, MAX_ENRICHMENT_PER_TYPE } from './enrichment/full-text.js';
import { FETCH_TASK_TYPE_MAP, type FetchTask, type FetchTaskContext } from './fetch-tasks/index.js';
import { createPropositionerTask } from './fetch-tasks/propositioner.js';
import { createMotionerTask } from './fetch-tasks/motioner.js';
import { createBetankandenTask } from './fetch-tasks/betankanden.js';
import { createVoteringarTask } from './fetch-tasks/voteringar.js';
import { createAnforandenTask } from './fetch-tasks/anforanden.js';
import { createFragorTask } from './fetch-tasks/fragor.js';
import { createInterpellationerTask } from './fetch-tasks/interpellationer.js';

// ---------------------------------------------------------------------------
// Types (preserved verbatim from original module)
// ---------------------------------------------------------------------------

/** Supported document type keys for scoped downloads. */
export type DocumentTypeKey =
  | 'propositions'
  | 'motions'
  | 'committeeReports'
  | 'votes'
  | 'speeches'
  | 'questions'
  | 'interpellations';

export interface DownloadedData {
  /** Government propositions */
  propositions: RawDocument[];
  /** Parliamentary motions */
  motions: RawDocument[];
  /** Committee reports */
  committeeReports: RawDocument[];
  /** Parliamentary votes */
  votes: RawDocument[];
  /** Parliamentary speeches (anföranden) */
  speeches: RawDocument[];
  /** Written questions */
  questions: RawDocument[];
  /** Interpellations */
  interpellations: RawDocument[];
}

export interface DownloadManifest {
  /** Names of MCP tools with successful fetch + post-processing during download */
  dataSources: string[];
  /** Document counts per type */
  docCounts: Record<string, number>;
  /** Total download duration in milliseconds */
  durationMs: number;
  /** Row-per-call MCP diagnostics for manifest rendering */
  toolDiagnostics: MCPToolInvocationDiagnostic[];
}

export interface DownloadResult {
  data: DownloadedData;
  manifest: DownloadManifest;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/**
 * Download all relevant documents from riksdag-regering-mcp.
 *
 * Each document type is fetched with a configurable limit (default 20).
 * Failures in individual calls are caught so a partial result is returned
 * rather than failing the entire pipeline.
 *
 * When `docTypes` is provided, only the listed document types are fetched.
 * This prevents multiple workflows (e.g. propositions and committee-reports)
 * from downloading the same documents and writing conflicting analysis.
 *
 * @param client   - MCPClient instance (caller-supplied for testability)
 * @param options  - Optional overrides for limits, riksmöte, and document type scoping
 */
export async function downloadAllDocuments(
  client: MCPClient,
  options: {
    limit?: number;
    rm?: string;
    docTypes?: DocumentTypeKey[];
    enrichLimit?: number;
    analysisRunDate?: string;
  } = {},
): Promise<DownloadResult> {
  const start = Date.now();
  const limit = options.limit ?? 20;
  const rm = options.rm ?? currentRm();
  const docTypes = options.docTypes ?? null;
  // Same-day inference must be tied to the analysis run date, not the host
  // wall clock — otherwise backfill/historical reruns misclassify coverage.
  const analysisRunDate =
    typeof options.analysisRunDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(options.analysisRunDate)
      ? options.analysisRunDate
      : new Date().toISOString().slice(0, 10);

  const dataSources: string[] = [];
  const toolDiagnostics: MCPToolInvocationDiagnostic[] = [];
  const data: DownloadedData = {
    propositions: [],
    motions: [],
    committeeReports: [],
    votes: [],
    speeches: [],
    questions: [],
    interpellations: [],
  };

  const ctx: FetchTaskContext = { client, limit, rm, data };
  const fetchTasks: FetchTask[] = [
    createPropositionerTask(ctx),
    createMotionerTask(ctx),
    createBetankandenTask(ctx),
    createVoteringarTask(ctx),
    createAnforandenTask(ctx),
    createFragorTask(ctx),
    createInterpellationerTask(ctx),
  ];

  const activeTasks = docTypes
    ? fetchTasks.filter((task) => {
        const mapped = FETCH_TASK_TYPE_MAP[task.name];
        return docTypes.includes(mapped);
      })
    : fetchTasks;

  const fetchResults = await Promise.allSettled(activeTasks.map((task) => task.fetch()));

  fetchResults.forEach((result, index) => {
    const task = activeTasks[index]!;

    if (result.status === 'fulfilled') {
      try {
        task.assign(result.value.items);
        dataSources.push(task.source);
        toolDiagnostics.push(result.value.diagnostic);
      } catch (err) {
        console.warn(
          `[pre-analysis] ${task.name} post-processing failed:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    } else {
      console.warn(
        `[pre-analysis] ${task.name} failed:`,
        result.reason instanceof Error ? result.reason.message : String(result.reason),
      );
      const query = task.query();
      toolDiagnostics.push({
        tool: task.source,
        query,
        resultCount: 0,
        coverageState: 'fetch_error',
        provenance: buildMcpProvenance({
          endpoint: client.baseURL,
          tool: task.source,
          query,
          resultCount: 0,
          coverageState: 'fetch_error',
        }),
        notes: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  const docCounts: Record<string, number> = {
    propositions: data.propositions.length,
    motions: data.motions.length,
    committeeReports: data.committeeReports.length,
    votes: data.votes.length,
    speeches: data.speeches.length,
    questions: data.questions.length,
    interpellations: data.interpellations.length,
  };

  const enrichLimit = options.enrichLimit ?? MAX_ENRICHMENT_PER_TYPE;
  const anyEnriched = await enrichTopDocumentsWithDetails(client, data, {
    enrichLimit,
    analysisRunDate,
    docTypes,
  });
  if (anyEnriched && !dataSources.includes('get_dokument_innehall')) {
    dataSources.push('get_dokument_innehall');
  }

  return {
    data,
    manifest: {
      dataSources,
      docCounts,
      durationMs: Date.now() - start,
      toolDiagnostics,
    },
  };
}
