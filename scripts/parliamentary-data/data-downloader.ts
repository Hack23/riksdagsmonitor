/**
 * @module parliamentary-data/data-downloader
 * @description Downloads all relevant parliamentary documents from riksdag-regering-mcp
 * for the current Swedish parliamentary session (riksmöte). Returns typed `RawDocument[]`
 * collections plus a manifest of which MCP tools returned successful results and how many
 * documents each returned.
 *
 * Note: The download methods fetch session-wide latest documents (bounded by `limit`
 * and `rm`). Date-specific filtering should be applied by the caller after download
 * (e.g., filtering by the `datum` field on each `RawDocument`).
 *
 * Most functions in this module are side-effect-free with respect to the filesystem;
 * callers are responsible for writing any output. The exception is `fetchFullTextForTopN`,
 * which writes persisted full-text files to `{outputDir}/full-text/` — see its JSDoc.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import type { RawDocument } from '../data-transformers/types.js';
import { isPersonProfileText } from '../data-transformers/helpers.js';
import type { MCPClient } from '../mcp-client/client.js';
import { classifyDocumentErrorAsNotIndexed } from '../mcp-client/error-classification/not-indexed.js';
import type { MCPToolInvocationDiagnostic } from '../types/mcp.js';
import {
  attachCoverageMetadata,
  buildMcpProvenance,
  inferDocumentCoverageState,
} from '../mcp-client/coverage.js';
import { FULL_TEXT_MIN_LENGTH } from './full-text-threshold.js';
export { FULL_TEXT_MIN_LENGTH } from './full-text-threshold.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
  /** Row-per-call MCP diagnostics for manifest rendering */
  toolDiagnostics: MCPToolInvocationDiagnostic[];
}

export interface DownloadResult {
  data: DownloadedData;
  manifest: DownloadManifest;
}

interface FetchTaskResult {
  items: RawDocument[];
  diagnostic: MCPToolInvocationDiagnostic;
}

/** Maximum number of documents to enrich with full-text content per type. */
export const MAX_ENRICHMENT_PER_TYPE = 5;

/**
 * Minimum full-text follow-up count enforced for long-horizon batches
 * (e.g. year-ahead / cycle-style runs with `--limit >= 30`).
 *
 * Kept separate from `MAX_ENRICHMENT_PER_TYPE` so the per-type default for
 * normal `downloadAllDocuments()` callers stays at the historic value of 5,
 * while `resolveAutoFullTextTopN(...)` can raise the floor only when the
 * long-horizon resolver explicitly asks for it.
 */
export const LONG_HORIZON_FULL_TEXT_FLOOR = 10;

/**
 * Outcome record for a single document in a top-N full-text fetch.
 * Used in the data-download-manifest and as the return value of
 * `fetchFullTextForTopN`.
 */
export interface FullTextFetchOutcome {
  /** Riksdag document identifier */
  dokId: string;
  /** Whether meaningful full-text content was retrieved and persisted */
  success: boolean;
  /** Length (chars) of the persisted content; 0 when success is false */
  chars: number;
  /** Relative path to the persisted `.md` file (undefined when success is false) */
  filePath?: string;
  /** Human-readable reason when success is false */
  reason?: string;
  /** Machine-readable coverage state after the fetch attempt */
  coverageState: import('../types/mcp.js').MCPCoverageState;
  /** Provenance block mirroring economicProvenance */
  provenance: import('../types/mcp.js').MCPProvenance;
  /** True when the attempt originated from the deferred retry queue */
  deferred?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalise(raw: unknown[]): RawDocument[] {
  return (raw as RawDocument[]).filter(Boolean);
}

/**
 * Add MCP coverage-state and provenance metadata to each fetched document list.
 *
 * The wrapper stamps every document with `mcpCoverageState`/`mcpProvenance`
 * so the manifest and downstream analysis can distinguish full-text, metadata,
 * and empty-search conditions without reparsing the original MCP payload.
 */
function annotateDocumentsWithCoverage(
  docs: RawDocument[],
  tool: string,
  query: Record<string, unknown>,
  endpoint: string,
): RawDocument[] {
  const resultCount = docs.length;
  return docs.map((doc) => {
    const record = doc as Record<string, unknown>;
    const coverageState = inferDocumentCoverageState(record);
    const provenance = buildMcpProvenance({
      endpoint,
      tool,
      query,
      resultCount,
      coverageState,
    });
    Object.assign(record, attachCoverageMetadata(record, provenance));
    return doc;
  });
}

/**
 * Decide whether an upstream error message indicates a document-level
 * indexing gap (`not_indexed`) versus an operational failure (`fetch_error`).
 *
 * Thin re-export wrapper around
 * {@link classifyDocumentErrorAsNotIndexed} from
 * `scripts/mcp-client/error-classification/not-indexed.ts` — the single
 * authoritative source for not-indexed pattern matching. Keeping the
 * `isDocumentNotIndexedError` name preserves the public test API
 * (`tests/auto-full-text-top-n.test.ts`) and lets any future
 * pattern/regex change land in exactly one file.
 */
export function isDocumentNotIndexedError(message: string, dokId?: string): boolean {
  return classifyDocumentErrorAsNotIndexed(message ?? '', dokId);
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
    const dow = d.getUTCDay();
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
  const month = now.getUTCMonth() + 1;
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
  options: { limit?: number; rm?: string; docTypes?: DocumentTypeKey[]; enrichLimit?: number; analysisRunDate?: string } = {},
): Promise<DownloadResult> {
  const start = Date.now();
  const limit = options.limit ?? 20;
  const rm = options.rm ?? currentRm();
  const docTypes = options.docTypes ?? null;
  // Same-day inference must be tied to the analysis run date, not the host
  // wall clock — otherwise backfill/historical reruns misclassify coverage.
  const analysisRunDate = typeof options.analysisRunDate === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(options.analysisRunDate)
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

  const fetchTasks: Array<{
    name: FetchTaskName;
    source: string;
    query: () => Record<string, unknown>;
    fetch: () => Promise<FetchTaskResult>;
    assign: (raw: RawDocument[]) => void;
  }> = [
    {
      name: 'fetchPropositions',
      source: 'get_propositioner',
      query: () => ({ limit, rm }),
      fetch: async (): Promise<FetchTaskResult> => {
        const raw = await client.fetchPropositions(limit, rm);
        const query = { limit, ...(rm ? { rm } : {}) };
        const items = annotateDocumentsWithCoverage(
          normalise(raw),
          'get_propositioner',
          query,
          client.baseURL,
        );
        const resultCount = items.length;
        const coverageState = resultCount === 0 ? 'search_empty' : 'metadata_only';
        return {
          items,
          diagnostic: {
            tool: 'get_propositioner',
            query,
            resultCount,
            coverageState,
            provenance: buildMcpProvenance({
              endpoint: client.baseURL,
              tool: 'get_propositioner',
              query,
              resultCount,
              coverageState,
            }),
          } satisfies MCPToolInvocationDiagnostic,
        };
      },
      assign: (raw: RawDocument[]) => { data.propositions = raw; },
    },
    {
      name: 'fetchMotions',
      source: 'get_motioner',
      query: () => ({ limit, rm }),
      fetch: async (): Promise<FetchTaskResult> => {
        const raw = await client.fetchMotions(limit, rm);
        const query = { limit, ...(rm ? { rm } : {}) };
        const items = annotateDocumentsWithCoverage(
          normalise(raw),
          'get_motioner',
          query,
          client.baseURL,
        );
        const resultCount = items.length;
        const coverageState = resultCount === 0 ? 'search_empty' : 'metadata_only';
        return {
          items,
          diagnostic: {
            tool: 'get_motioner',
            query,
            resultCount,
            coverageState,
            provenance: buildMcpProvenance({
              endpoint: client.baseURL,
              tool: 'get_motioner',
              query,
              resultCount,
              coverageState,
            }),
          } satisfies MCPToolInvocationDiagnostic,
        };
      },
      assign: (raw: RawDocument[]) => { data.motions = raw; },
    },
    {
      name: 'fetchCommitteeReports',
      source: 'get_betankanden',
      query: () => ({ limit, rm }),
      fetch: async (): Promise<FetchTaskResult> => {
        const raw = await client.fetchCommitteeReports(limit, rm);
        const query = { limit, ...(rm ? { rm } : {}) };
        const items = annotateDocumentsWithCoverage(
          normalise(raw),
          'get_betankanden',
          query,
          client.baseURL,
        );
        const resultCount = items.length;
        const coverageState = resultCount === 0 ? 'search_empty' : 'metadata_only';
        return {
          items,
          diagnostic: {
            tool: 'get_betankanden',
            query,
            resultCount,
            coverageState,
            provenance: buildMcpProvenance({
              endpoint: client.baseURL,
              tool: 'get_betankanden',
              query,
              resultCount,
              coverageState,
            }),
          } satisfies MCPToolInvocationDiagnostic,
        };
      },
      assign: (raw: RawDocument[]) => { data.committeeReports = raw; },
    },
    {
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
      assign: (raw: RawDocument[]) => { data.votes = raw; },
    },
    {
      name: 'searchSpeeches',
      source: 'search_anforanden',
      query: () => ({ limit, rm }),
      fetch: async (): Promise<FetchTaskResult> => {
        const query = { limit, ...(rm ? { rm } : {}) };
        const raw = await client.searchSpeeches(query);
        const items = annotateDocumentsWithCoverage(
          normalise(raw),
          'search_anforanden',
          query,
          client.baseURL,
        );
        const resultCount = items.length;
        const coverageState = resultCount === 0 ? 'search_empty' : 'metadata_only';
        return {
          items,
          diagnostic: {
            tool: 'search_anforanden',
            query,
            resultCount,
            coverageState,
            provenance: buildMcpProvenance({
              endpoint: client.baseURL,
              tool: 'search_anforanden',
              query,
              resultCount,
              coverageState,
            }),
          } satisfies MCPToolInvocationDiagnostic,
        };
      },
      assign: (raw: RawDocument[]) => { data.speeches = raw; },
    },
    {
      name: 'fetchWrittenQuestions',
      source: 'get_fragor',
      query: () => ({ limit, rm }),
      fetch: async (): Promise<FetchTaskResult> => {
        const query = { limit, ...(rm ? { rm } : {}) };
        const raw = await client.fetchWrittenQuestions(query);
        const items = annotateDocumentsWithCoverage(
          normalise(raw),
          'get_fragor',
          query,
          client.baseURL,
        );
        const resultCount = items.length;
        const coverageState = resultCount === 0 ? 'search_empty' : 'metadata_only';
        return {
          items,
          diagnostic: {
            tool: 'get_fragor',
            query,
            resultCount,
            coverageState,
            provenance: buildMcpProvenance({
              endpoint: client.baseURL,
              tool: 'get_fragor',
              query,
              resultCount,
              coverageState,
            }),
          } satisfies MCPToolInvocationDiagnostic,
        };
      },
      assign: (raw: RawDocument[]) => { data.questions = raw; },
    },
    {
      name: 'fetchInterpellations',
      source: 'get_interpellationer',
      query: () => ({ limit, rm }),
      fetch: async (): Promise<FetchTaskResult> => {
        const query = { limit, ...(rm ? { rm } : {}) };
        const raw = await client.fetchInterpellations(query);
        const items = annotateDocumentsWithCoverage(
          normalise(raw),
          'get_interpellationer',
          query,
          client.baseURL,
        );
        const resultCount = items.length;
        const coverageState = resultCount === 0 ? 'search_empty' : 'metadata_only';
        return {
          items,
          diagnostic: {
            tool: 'get_interpellationer',
            query,
            resultCount,
            coverageState,
            provenance: buildMcpProvenance({
              endpoint: client.baseURL,
              tool: 'get_interpellationer',
              query,
              resultCount,
              coverageState,
            }),
          } satisfies MCPToolInvocationDiagnostic,
        };
      },
      assign: (raw: RawDocument[]) => { data.interpellations = raw; },
    },
  ] as const;

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
  if (enrichLimit > 0) {
    const enrichableTypes: DocumentTypeKey[] = [
      'propositions', 'committeeReports', 'motions', 'interpellations',
    ];
    const typesToEnrich = docTypes
      ? enrichableTypes.filter(t => docTypes.includes(t))
      : enrichableTypes;

    let anyEnriched = false;
    for (const docType of typesToEnrich) {
      const docs = data[docType];
      if (!docs || docs.length === 0) continue;

      const toEnrich = docs.slice(0, enrichLimit);

      const CONCURRENCY = 3;
      let fullTextCount = 0;
      let detailsOnlyCount = 0;
      for (let i = 0; i < toEnrich.length; i += CONCURRENCY) {
        const batch = toEnrich.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map(async (doc) => {
            const docRecord = doc as Record<string, unknown>;
            const dokId = [
              docRecord['dok_id'],
              docRecord['dokument_id'],
              docRecord['rel_dok_id'],
              docRecord['id'],
              docRecord['dokumentnamn'],
            ]
              .map((value) => typeof value === 'string' ? value.trim() : '')
              .find((value): value is string => value.length > 0);
            if (!dokId) return null;
            const details = await client.fetchDocumentDetails(dokId, true) as Record<string, unknown>;
            const str = (v: unknown): string => typeof v === 'string' ? v : '';
            const sanitize = (v: unknown): string => {
              const s = str(v).trim();
              return isPersonProfileText(s) ? '' : s;
            };
            const rawText = str(details['text']).trim();
            const verifiedFullText = sanitize(details['fullText']) || '';
            const verifiedFullContent = rawText.length > FULL_TEXT_MIN_LENGTH
              ? rawText
              : str(details['html']).trim();
            if (verifiedFullContent.length > FULL_TEXT_MIN_LENGTH) {
              docRecord['fullContent'] = verifiedFullContent;
            }
            if (verifiedFullText.length > FULL_TEXT_MIN_LENGTH) {
              docRecord['fullText'] = verifiedFullText;
            }
            const detailsSnippet = sanitize(details['snippet']);
            const detailsSummary = sanitize(details['summary']);
            const detailsNotis = sanitize(details['notis']);
            if (!docRecord['summary']) {
              const bestSummary = detailsSnippet || detailsSummary || '';
              if (bestSummary.length > 0) {
                docRecord['summary'] = bestSummary;
              }
            }
            if (!docRecord['notis'] && detailsNotis.length > 0) {
              docRecord['notis'] = detailsNotis;
            }
            docRecord['contentFetched'] = true;
            const coverageState = inferDocumentCoverageState(
              { ...docRecord, ...details },
              {
                requestedDate: analysisRunDate,
                fullTextRequested: true,
              },
            );
            docRecord['mcpCoverageState'] = coverageState;
            docRecord['mcpProvenance'] = buildMcpProvenance({
              endpoint: client.baseURL,
              tool: 'get_dokument_innehall',
              query: { dok_id: dokId, include_full_text: true },
              resultCount: 1,
              coverageState,
            });
            return { fullText: verifiedFullText, fullContent: verifiedFullContent };
          }),
        );
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value !== null) {
            const details = result.value as Record<string, unknown>;
            const hasFullText = typeof details['fullText'] === 'string' && (details['fullText'] as string).length > FULL_TEXT_MIN_LENGTH;
            const hasFullContent = typeof details['fullContent'] === 'string' && (details['fullContent'] as string).length > FULL_TEXT_MIN_LENGTH;
            if (hasFullText || hasFullContent) {
              fullTextCount++;
            } else {
              detailsOnlyCount++;
            }
          } else if (result.status === 'rejected') {
            console.warn(
              `[pre-analysis] ⚠️ Failed to enrich document:`,
              result.reason instanceof Error ? result.reason.message : String(result.reason),
            );
          }
        }
        if (i + CONCURRENCY < toEnrich.length) {
          await new Promise<void>(r => setTimeout(r, 300));
        }
      }
      if (fullTextCount > 0) {
        anyEnriched = true;
        console.log(`[pre-analysis] ✅ Enriched ${fullTextCount} ${docType} documents with full text` +
          (detailsOnlyCount > 0 ? `, ${detailsOnlyCount} with details/summary only` : ''));
      } else if (detailsOnlyCount > 0) {
        anyEnriched = true;
        console.log(`[pre-analysis] ℹ️ Fetched details for ${detailsOnlyCount} ${docType} documents (no full text returned)`);
      } else {
        console.warn(
          `[pre-analysis] ⚠️ ${docType} enrichment produced no content (metadata-only analysis)`,
        );
      }
    }
    if (anyEnriched && !dataSources.includes('get_dokument_innehall')) {
      dataSources.push('get_dokument_innehall');
    }
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

// ---------------------------------------------------------------------------
// Top-N full-text fetch (auto-full-text-top-n feature)
// ---------------------------------------------------------------------------

/**
 * Fetch full-text content for the top-N documents in `docs` and persist each
 * to `{outputDir}/full-text/{dok_id}.md`.
 *
 * This function has filesystem side effects: it creates `outputDir/full-text/`
 * (including any missing parent directories) and writes one `.md` file per
 * successfully fetched document.
 *
 * Documents that lack a resolvable `dok_id` are skipped. If the MCP call
 * succeeds but returns no meaningful content (< FULL_TEXT_MIN_LENGTH chars),
 * the outcome is recorded as `success: false` with an explanatory `reason` so
 * the caller (and the analysis gate) can distinguish "not tried" from
 * "tried but only metadata returned".
 *
 * @param client      - MCPClient instance for calling get_dokument_innehall
 * @param docs        - Ordered list of documents; first `topN` will be attempted
 * @param topN        - Maximum number of documents to fetch full text for
 * @param outputDir   - Base directory; `full-text/` sub-folder is created here
 *                      (including any missing parent directories)
 * @returns           - One outcome record per dok_id attempted
 */
export async function fetchFullTextForTopN(
  client: MCPClient,
  docs: RawDocument[],
  topN: number,
  outputDir: string,
  options: { runDate?: string } = {},
): Promise<FullTextFetchOutcome[]> {
  if (topN <= 0 || docs.length === 0) return [];

  // Coverage inference must be tied to the analysis run date (the date the
  // pipeline is producing analysis for), not the host machine's wall clock.
  // This keeps backfill / historical reruns from misclassifying coverage.
  const runDate = typeof options.runDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(options.runDate)
    ? options.runDate
    : new Date().toISOString().slice(0, 10);

  const fullTextDir = path.join(outputDir, 'full-text');
  fs.mkdirSync(fullTextDir, { recursive: true });

  const candidates: Array<{ dokId: string; doc: RawDocument }> = [];
  for (const doc of docs) {
    if (candidates.length >= topN) break;
    const record = doc as Record<string, unknown>;
    const dokId = [
      record['dok_id'],
      record['dokument_id'],
      record['rel_dok_id'],
      record['id'],
      record['dokumentnamn'],
    ]
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .find((v) => v.length > 0);
    if (!dokId) continue;
    candidates.push({ dokId, doc });
  }

  const outcomes: FullTextFetchOutcome[] = [];

  for (const { dokId, doc } of candidates) {
    let outcome: FullTextFetchOutcome;
    try {
      const str = (v: unknown): string => (typeof v === 'string' ? v : '');
      const sanitize = (v: unknown): string => {
        const s = str(v).trim();
        return isPersonProfileText(s) ? '' : s;
      };
      const selectContent = (source: Record<string, unknown>): string => {
        const rawText = str(source['text']).trim();
        const rawFullContent = sanitize(source['fullContent']);
        const rawFullText = sanitize(source['fullText']);
        const rawHtml = str(source['html']).trim();

        return rawText.length > FULL_TEXT_MIN_LENGTH
          ? rawText
          : rawFullContent.length > FULL_TEXT_MIN_LENGTH
            ? rawFullContent
            : rawFullText.length > FULL_TEXT_MIN_LENGTH
              ? rawFullText
              : rawHtml;
      };

      const docRecord = doc as Record<string, unknown>;
      let details: Record<string, unknown> | null = null;
      let content = selectContent(docRecord);

      if (content.length <= FULL_TEXT_MIN_LENGTH) {
        const detailsWithCoverage = await client.fetchDocumentDetailsWithCoverage(
          dokId,
          true,
          {
            requestedDate: runDate,
          },
        );
        details = detailsWithCoverage.document;
        content = selectContent(details);
      }

      const coverageState = inferDocumentCoverageState(
        { ...docRecord, ...(details ?? {}) },
        {
          requestedDate: runDate,
          fullTextRequested: true,
        },
      );
      const provenance = buildMcpProvenance({
        endpoint: client.baseURL,
        tool: 'get_dokument_innehall',
        query: { dok_id: dokId, include_full_text: true },
        resultCount: details ? 1 : 0,
        coverageState,
      });

      if (content.length > FULL_TEXT_MIN_LENGTH) {
        const filenameSafeDokId = dokId.replace(/[^A-Za-z0-9_-]/g, '_');
        const filePath = path.join(fullTextDir, `${filenameSafeDokId}.md`);
        const snippet =
          sanitize(docRecord['snippet']) ||
          sanitize(docRecord['summary']) ||
          sanitize(details?.['snippet']) ||
          sanitize(details?.['summary']) ||
          '';
        const headerLines = [
          `# Full Text — ${dokId}`,
          '',
          ...(snippet ? [`> ${snippet}`, ''] : []),
          '---',
          '',
        ];
        const header = headerLines.join('\n');
        fs.writeFileSync(filePath, header + content, 'utf8');
        docRecord['contentFetched'] = true;
        docRecord['fullContent'] = content;
        docRecord['mcpCoverageState'] = 'full_text';
        docRecord['mcpProvenance'] = { ...provenance, coverageState: 'full_text', resultCount: 1 };
        outcome = {
          dokId,
          success: true,
          chars: content.length,
          filePath: path.relative(outputDir, filePath).split(path.sep).join('/'),
          coverageState: 'full_text',
          provenance: { ...provenance, coverageState: 'full_text', resultCount: 1 },
        };
      } else {
        docRecord['contentFetched'] = true;
        docRecord['mcpCoverageState'] = coverageState;
        docRecord['mcpProvenance'] = provenance;
        outcome = {
          dokId,
          success: false,
          chars: 0,
          reason: `content below FULL_TEXT_MIN_LENGTH (${FULL_TEXT_MIN_LENGTH}) — metadata-only`,
          coverageState,
          provenance,
        };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isNotIndexed = isDocumentNotIndexedError(errMsg, dokId);
      const state = isNotIndexed ? 'not_indexed' : 'fetch_error' as const;
      const provenance = buildMcpProvenance({
        endpoint: client.baseURL,
        tool: 'get_dokument_innehall',
        query: { dok_id: dokId, include_full_text: true },
        resultCount: 0,
        coverageState: state,
      });
      outcome = {
        dokId,
        success: false,
        chars: 0,
        reason: `fetchDocumentDetails failed: ${errMsg}`,
        coverageState: state,
        provenance,
      };
    }
    outcomes.push(outcome);
  }

  return outcomes;
}
