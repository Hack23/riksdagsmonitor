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
import type { RiksdagDocument } from '../types/mcp.js';

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

/** Maximum number of documents to enrich with full-text content per type. */
export const MAX_ENRICHMENT_PER_TYPE = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalise(raw: unknown[]): RawDocument[] {
  return (raw as RawDocument[]).filter(Boolean);
}

/**
 * Subtract a number of business days (Mon–Fri) from a YYYY-MM-DD date string.
 * Returns the resulting date in YYYY-MM-DD format.
 *
 * Fractional values are rounded down, and negative values are treated as 0.
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @param days    - Number of business days to subtract
 * @throws {RangeError} If `dateStr` is not a valid YYYY-MM-DD date string
 */
export function subtractBusinessDays(dateStr: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new RangeError(`subtractBusinessDays: invalid date string "${dateStr}" — expected YYYY-MM-DD`);
  }
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError(`subtractBusinessDays: "${dateStr}" is not a valid calendar date`);
  }
  let remaining = Math.max(0, Math.floor(days));
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    const dow = d.getUTCDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) {
      remaining--;
    }
  }
  return d.toISOString().slice(0, 10);
}

/** Maximum number of business days to look back when zero documents match the requested date. */
export const MAX_LOOKBACK_BUSINESS_DAYS = 5;

/** All internal fetch task names, kept in sync with the `fetchTasks` array
 *  inside `downloadAllDocuments()`.  Used to derive the `FetchTaskName` type
 *  and to validate the `FETCH_TASK_TYPE_MAP` at compile time. */
const FETCH_TASK_NAMES = [
  'fetchPropositions',
  'fetchMotions',
  'fetchCommitteeReports',
  'fetchVotingRecords',
  'searchSpeeches',
  'fetchWrittenQuestions',
  'fetchInterpellations',
] as const;

type FetchTaskName = typeof FETCH_TASK_NAMES[number];

/** Maps internal fetch task names to their corresponding DocumentTypeKey.
 *  `satisfies` ensures every FetchTaskName maps to a valid DocumentTypeKey
 *  at compile time — adding/renaming a task without updating the map is a
 *  compile error. */
const FETCH_TASK_TYPE_MAP: Record<FetchTaskName, DocumentTypeKey> = {
  fetchPropositions: 'propositions',
  fetchMotions: 'motions',
  fetchCommitteeReports: 'committeeReports',
  fetchVotingRecords: 'votes',
  searchSpeeches: 'speeches',
  fetchWrittenQuestions: 'questions',
  fetchInterpellations: 'interpellations',
} as const satisfies Record<FetchTaskName, DocumentTypeKey>;

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
  options: { limit?: number; rm?: string; docTypes?: DocumentTypeKey[]; enrichLimit?: number } = {},
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
  // task.name is typed as FetchTaskName via the `as const` assertion on
  // fetchTasks, so the lookup is safe without a cast.
  const activeTasks = docTypes
    ? fetchTasks.filter(task => {
        const mapped = FETCH_TASK_TYPE_MAP[task.name];
        return docTypes.includes(mapped);
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

  // -----------------------------------------------------------------------
  // Enrichment pass: fetch full-text content for top documents per type.
  // This calls get_dokument_innehall via MCPClient.enrichDocumentsWithContent()
  // to ensure analysis artifacts have actual document content, not just
  // metadata (title, date, committee). Without this step, the analysis
  // pipeline produces LOW-confidence metadata-only analysis.
  // -----------------------------------------------------------------------
  const enrichLimit = options.enrichLimit ?? MAX_ENRICHMENT_PER_TYPE;
  if (enrichLimit > 0) {
    const enrichableTypes: DocumentTypeKey[] = [
      'propositions', 'committeeReports', 'motions', 'interpellations',
    ];
    const typesToEnrich = docTypes
      ? enrichableTypes.filter(t => docTypes.includes(t))
      : enrichableTypes;

    for (const docType of typesToEnrich) {
      const docs = data[docType];
      if (!docs || docs.length === 0) continue;

      const toEnrich = docs.slice(0, enrichLimit);
      try {
        console.log(`[pre-analysis] Enriching ${toEnrich.length} ${docType} with full-text content...`);
        // RawDocument and RiksdagDocument are structurally compatible (both are
        // Record-like objects with dok_id, titel, etc.) but have different TS
        // definitions. The double cast is necessary because enrichDocumentsWithContent
        // expects typed RiksdagDocument[] while data-downloader uses generic RawDocument[].
        const enriched = await client.enrichDocumentsWithContent(
          toEnrich as unknown as RiksdagDocument[],
          3, // concurrency
        );
        // Merge enriched data back: replace the first N documents with enriched versions
        for (let i = 0; i < enriched.length; i++) {
          data[docType][i] = enriched[i] as unknown as RawDocument;
        }
        dataSources.push(`get_dokument_innehall(${docType})`);
        console.log(`[pre-analysis] ✅ Enriched ${enriched.length} ${docType} documents`);
      } catch (err) {
        console.warn(
          `[pre-analysis] ⚠️ ${docType} enrichment failed (metadata-only analysis):`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }

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
