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

/**
 * Supported document type filters for scoped downloads.
 *
 * Each workflow should pass its own doctype to avoid analysis conflicts when
 * multiple workflows run on the same date.
 */
export type DocType =
  | 'propositions'
  | 'motions'
  | 'committee-reports'
  | 'votes'
  | 'speeches'
  | 'questions'
  | 'interpellations'
  | 'all';

export const VALID_DOC_TYPES: readonly DocType[] = [
  'propositions',
  'motions',
  'committee-reports',
  'votes',
  'speeches',
  'questions',
  'interpellations',
  'all',
] as const;

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
 * When `doctype` is set to a specific type (e.g. 'propositions'), only that
 * type is fetched. This prevents analysis conflicts when multiple workflows
 * run on the same day and write to overlapping output directories.
 *
 * @param client   - MCPClient instance (caller-supplied for testability)
 * @param options  - Optional overrides for limits, riksmöte, and doctype
 */
export async function downloadAllDocuments(
  client: MCPClient,
  options: { limit?: number; rm?: string; doctype?: DocType } = {},
): Promise<DownloadResult> {
  const start = Date.now();
  const limit = options.limit ?? 20;
  const rm = options.rm ?? currentRm();
  const doctype = options.doctype ?? 'all';

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

  /** Map from doctype key to the fetch task descriptor. */
  const doctypeKeyMap: Record<string, string> = {
    propositions: 'propositions',
    motions: 'motions',
    'committee-reports': 'committeeReports',
    votes: 'votes',
    speeches: 'speeches',
    questions: 'questions',
    interpellations: 'interpellations',
  };

  // Run independent MCP fetches in parallel to reduce total latency while
  // still collecting partial results on failure.
  const allFetchTasks = [
    {
      name: 'fetchPropositions',
      source: 'get_propositioner',
      key: 'propositions',
      fetch: () => client.fetchPropositions(limit, rm),
      assign: (raw: RawDocument[]) => { data.propositions = raw; },
    },
    {
      name: 'fetchMotions',
      source: 'get_motioner',
      key: 'motions',
      fetch: () => client.fetchMotions(limit, rm),
      assign: (raw: RawDocument[]) => { data.motions = raw; },
    },
    {
      name: 'fetchCommitteeReports',
      source: 'get_betankanden',
      key: 'committeeReports',
      fetch: () => client.fetchCommitteeReports(limit, rm),
      assign: (raw: RawDocument[]) => { data.committeeReports = raw; },
    },
    {
      name: 'fetchVotingRecords',
      source: 'search_voteringar',
      key: 'votes',
      fetch: () => client.fetchVotingRecords({ limit, rm }),
      assign: (raw: RawDocument[]) => { data.votes = raw; },
    },
    {
      name: 'searchSpeeches',
      source: 'search_anforanden',
      key: 'speeches',
      fetch: () => client.searchSpeeches({ limit, rm }),
      assign: (raw: RawDocument[]) => { data.speeches = raw; },
    },
    {
      name: 'fetchWrittenQuestions',
      source: 'get_fragor',
      key: 'questions',
      fetch: () => client.fetchWrittenQuestions({ limit, rm }),
      assign: (raw: RawDocument[]) => { data.questions = raw; },
    },
    {
      name: 'fetchInterpellations',
      source: 'get_interpellationer',
      key: 'interpellations',
      fetch: () => client.fetchInterpellations({ limit, rm }),
      assign: (raw: RawDocument[]) => { data.interpellations = raw; },
    },
  ] as const;

  // Filter tasks based on doctype selection
  const fetchTasks = doctype === 'all'
    ? allFetchTasks
    : allFetchTasks.filter(task => task.key === doctypeKeyMap[doctype]);

  const fetchResults = await Promise.allSettled(
    fetchTasks.map(task => task.fetch()),
  );

  fetchResults.forEach((result, index) => {
    const task = fetchTasks[index]!;

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
