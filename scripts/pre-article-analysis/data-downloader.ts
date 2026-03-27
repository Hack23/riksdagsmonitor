/**
 * @module pre-article-analysis/data-downloader
 * @description Downloads all relevant parliamentary documents from riksdag-regering-mcp
 * for the current Swedish parliamentary session (riksmöte). Returns typed `RawDocument[]`
 * collections plus a manifest of which MCP tools returned successful results and how many
 * documents each returned.
 *
 * Note: The download methods fetch session-wide latest documents (bounded by `limit`
 * and `rm`). Date-specific filtering should be applied by the caller after download
 * (e.g., filtering by the `datum` field on each `RawDocument`).
 *
 * This module is intentionally side-effect-free with respect to the filesystem;
 * callers are responsible for writing any output.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../data-transformers/types.js';
import type { MCPClient } from '../mcp-client/client.js';

// ---------------------------------------------------------------------------
// Types
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
}

export interface DownloadResult {
  data: DownloadedData;
  manifest: DownloadManifest;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalise(raw: unknown[]): RawDocument[] {
  return (raw as RawDocument[]).filter(Boolean);
}

/** Maps internal fetch task names to their corresponding DocumentTypeKey.
 *  `satisfies` ensures every key maps to a valid DocumentTypeKey at compile time.
 *  The keys correspond to the `name` field of each entry in the `fetchTasks` array. */
const FETCH_TASK_TYPE_MAP = {
  fetchPropositions: 'propositions',
  fetchMotions: 'motions',
  fetchCommitteeReports: 'committeeReports',
  fetchVotingRecords: 'votes',
  searchSpeeches: 'speeches',
  fetchWrittenQuestions: 'questions',
  fetchInterpellations: 'interpellations',
} as const satisfies Record<string, DocumentTypeKey>;

/**
 * Returns the current Swedish parliamentary session (riksmöte) in `YYYY/YY` format.
 * The Swedish parliamentary year runs from October to September:
 *   - October–December of year N: session is `N/N+1`
 *   - January–September of year N: session is `N-1/N`
 *
 * Examples: 2025-11 → "2025/26", 2026-03 → "2025/26", 2026-10 → "2026/27"
 */
function currentRm(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-based
  // Swedish parliamentary year runs roughly October–September
  if (month >= 10) {
    return `${year}/${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}/${String(year).slice(-2)}`;
}

// ---------------------------------------------------------------------------
// Download orchestration
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
  options: { limit?: number; rm?: string; docTypes?: DocumentTypeKey[] } = {},
): Promise<DownloadResult> {
  const start = Date.now();
  const limit = options.limit ?? 20;
  const rm = options.rm ?? currentRm();
  const docTypes = options.docTypes ?? null; // null means fetch all types

  const dataSources: string[] = [];
  const data: DownloadedData = {
    propositions: [],
    motions: [],
    committeeReports: [],
    votes: [],
    speeches: [],
    questions: [],
    interpellations: [],
  };

  // Run independent MCP fetches in parallel to reduce total latency while
  // still collecting partial results on failure.
  const fetchTasks = [
    {
      name: 'fetchPropositions',
      source: 'get_propositioner',
      fetch: () => client.fetchPropositions(limit, rm),
      assign: (raw: RawDocument[]) => { data.propositions = raw; },
    },
    {
      name: 'fetchMotions',
      source: 'get_motioner',
      fetch: () => client.fetchMotions(limit, rm),
      assign: (raw: RawDocument[]) => { data.motions = raw; },
    },
    {
      name: 'fetchCommitteeReports',
      source: 'get_betankanden',
      fetch: () => client.fetchCommitteeReports(limit, rm),
      assign: (raw: RawDocument[]) => { data.committeeReports = raw; },
    },
    {
      name: 'fetchVotingRecords',
      source: 'search_voteringar',
      fetch: () => client.fetchVotingRecords({ limit, rm }),
      assign: (raw: RawDocument[]) => { data.votes = raw; },
    },
    {
      name: 'searchSpeeches',
      source: 'search_anforanden',
      fetch: () => client.searchSpeeches({ limit, rm }),
      assign: (raw: RawDocument[]) => { data.speeches = raw; },
    },
    {
      name: 'fetchWrittenQuestions',
      source: 'get_fragor',
      fetch: () => client.fetchWrittenQuestions({ limit, rm }),
      assign: (raw: RawDocument[]) => { data.questions = raw; },
    },
    {
      name: 'fetchInterpellations',
      source: 'get_interpellationer',
      fetch: () => client.fetchInterpellations({ limit, rm }),
      assign: (raw: RawDocument[]) => { data.interpellations = raw; },
    },
  ] as const;

  // When docTypes is specified, only fetch the listed document types.
  const activeTasks = docTypes
    ? fetchTasks.filter(task => {
        const mapped = FETCH_TASK_TYPE_MAP[task.name as keyof typeof FETCH_TASK_TYPE_MAP];
        return mapped != null && docTypes.includes(mapped);
      })
    : fetchTasks;

  const fetchResults = await Promise.allSettled(
    activeTasks.map(task => task.fetch()),
  );

  fetchResults.forEach((result, index) => {
    const task = activeTasks[index]!;

    if (result.status === 'fulfilled') {
      try {
        task.assign(normalise(result.value as unknown[]));
        dataSources.push(task.source);
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

  return {
    data,
    manifest: {
      dataSources,
      docCounts,
      durationMs: Date.now() - start,
    },
  };
}

/**
 * Flatten all downloaded document collections into a single array,
 * deduplicated by a best-effort document identifier.
 *
 * The primary deduplication key is `dok_id` when present. If `dok_id` is
 * missing or empty, the function falls back in order to:
 * `dokument_id`, `id`, `dok_url`, `url`, `rel_dok_id`, `titel`, and `title`.
 * The first non-empty string among these fields is used as the dedup key,
 * and documents resolving to the same key are treated as duplicates.
 */
export function flattenDocuments(data: DownloadedData): RawDocument[] {
  const all: RawDocument[] = [
    ...data.propositions,
    ...data.motions,
    ...data.committeeReports,
    ...data.votes,
    ...data.speeches,
    ...data.questions,
    ...data.interpellations,
  ];

  const seen = new Set<string>();
  return all.filter(doc => {
    if (!doc) return false;
    const record = doc as Record<string, unknown>;
    const idCandidates = [
      record['dok_id'],
      record['dokument_id'],
      record['id'],
      record['dok_url'],
      record['url'],
      record['rel_dok_id'],
      record['titel'],
      record['title'],
    ];
    const id = idCandidates.find((candidate): candidate is string =>
      typeof candidate === 'string' && candidate.trim().length > 0,
    )?.trim() ?? '';
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
