/**
 * @module pre-article-analysis/data-downloader
 * @description Downloads all relevant parliamentary documents from riksdag-regering-mcp
 * for a given date. Returns typed `RawDocument[]` collections plus a manifest of
 * which MCP tools were called and how many documents each returned.
 *
 * This module is intentionally side-effect-free with respect to the filesystem;
 * callers are responsible for writing any output.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../data-transformers/types.js';
import { MCPClient } from '../mcp-client/client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  /** Names of MCP tools called during download */
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
 * @param client   - MCPClient instance (caller-supplied for testability)
 * @param options  - Optional overrides for limits and riksmöte
 */
export async function downloadAllDocuments(
  client: MCPClient,
  options: { limit?: number; rm?: string } = {},
): Promise<DownloadResult> {
  const start = Date.now();
  const limit = options.limit ?? 20;
  const rm = options.rm ?? currentRm();

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

  // ── Propositions ──────────────────────────────────────────────────────────
  try {
    const raw = await client.fetchPropositions(limit, rm);
    data.propositions = normalise(raw);
    dataSources.push('get_propositioner');
  } catch (err) {
    console.warn('[pre-analysis] fetchPropositions failed:', err instanceof Error ? err.message : String(err));
  }

  // ── Motions ───────────────────────────────────────────────────────────────
  try {
    const raw = await client.fetchMotions(limit, rm);
    data.motions = normalise(raw);
    dataSources.push('get_motioner');
  } catch (err) {
    console.warn('[pre-analysis] fetchMotions failed:', err instanceof Error ? err.message : String(err));
  }

  // ── Committee reports ─────────────────────────────────────────────────────
  try {
    const raw = await client.fetchCommitteeReports(limit, rm);
    data.committeeReports = normalise(raw);
    dataSources.push('get_betankanden');
  } catch (err) {
    console.warn('[pre-analysis] fetchCommitteeReports failed:', err instanceof Error ? err.message : String(err));
  }

  // ── Votes ─────────────────────────────────────────────────────────────────
  try {
    const raw = await client.fetchVotingRecords({ limit, rm });
    data.votes = normalise(raw);
    dataSources.push('search_voteringar');
  } catch (err) {
    console.warn('[pre-analysis] fetchVotingRecords failed:', err instanceof Error ? err.message : String(err));
  }

  // ── Speeches ──────────────────────────────────────────────────────────────
  try {
    const raw = await client.searchSpeeches({ limit, rm });
    data.speeches = normalise(raw);
    dataSources.push('search_anforanden');
  } catch (err) {
    console.warn('[pre-analysis] searchSpeeches failed:', err instanceof Error ? err.message : String(err));
  }

  // ── Written questions ─────────────────────────────────────────────────────
  try {
    const raw = await client.fetchWrittenQuestions({ limit, rm });
    data.questions = normalise(raw);
    dataSources.push('get_fragor');
  } catch (err) {
    console.warn('[pre-analysis] fetchWrittenQuestions failed:', err instanceof Error ? err.message : String(err));
  }

  // ── Interpellations ───────────────────────────────────────────────────────
  try {
    const raw = await client.fetchInterpellations({ limit, rm });
    data.interpellations = normalise(raw);
    dataSources.push('get_interpellationer');
  } catch (err) {
    console.warn('[pre-analysis] fetchInterpellations failed:', err instanceof Error ? err.message : String(err));
  }

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
