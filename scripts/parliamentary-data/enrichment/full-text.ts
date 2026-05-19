/**
 * @module parliamentary-data/enrichment/full-text
 * @description Two full-text enrichment flows for downloaded parliamentary
 * documents:
 *
 * 1. {@link enrichTopDocumentsWithDetails} — called from `downloadAllDocuments`
 *    after the initial metadata fetch. Mutates the first N documents per
 *    enrichable type in place, attempting to attach `fullContent`/`fullText`
 *    plus coverage/provenance metadata. NO filesystem writes.
 *
 * 2. {@link fetchFullTextForTopN} — explicit top-N persistence flow that
 *    writes one `.md` file per successfully fetched document to
 *    `{outputDir}/full-text/`. Returns per-document outcomes for the
 *    data-download manifest and analysis gate.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import type { RawDocument } from '../../data-transformers/types.js';
import { isPersonProfileText } from '../../data-transformers/helpers.js';
import type { MCPClient } from '../../mcp-client/client.js';
import { buildMcpProvenance, inferDocumentCoverageState } from '../../mcp-client/coverage.js';
import type { MCPCoverageState } from '../../types/mcp.js';
import { FULL_TEXT_MIN_LENGTH } from '../full-text-threshold.js';
import { isDocumentNotIndexedError } from '../errors/not-indexed.js';
import type { DocumentTypeKey, DownloadedData } from '../data-downloader.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  coverageState: import('../../types/mcp.js').MCPCoverageState;
  /** Provenance block mirroring economicProvenance */
  provenance: import('../../types/mcp.js').MCPProvenance;
  /** True when the attempt originated from the deferred retry queue */
  deferred?: boolean;
}

// ---------------------------------------------------------------------------
// Tiny string helpers
// ---------------------------------------------------------------------------

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const sanitize = (v: unknown): string => {
  const s = str(v).trim();
  return isPersonProfileText(s) ? '' : s;
};

function selectContent(source: Record<string, unknown>): string {
  const rawText = str(source['text']).trim();
  const rawFullContent = sanitize(source['fullContent']);
  const rawFullText = sanitize(source['fullText']);
  const rawHtml = str(source['html']).trim();

  if (rawText.length > FULL_TEXT_MIN_LENGTH) return rawText;
  if (rawFullContent.length > FULL_TEXT_MIN_LENGTH) return rawFullContent;
  if (rawFullText.length > FULL_TEXT_MIN_LENGTH) return rawFullText;
  return rawHtml;
}

function resolveDokId(record: Record<string, unknown>): string | undefined {
  return [
    record['dok_id'],
    record['dokument_id'],
    record['rel_dok_id'],
    record['id'],
    record['dokumentnamn'],
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .find((v): v is string => v.length > 0);
}

// ---------------------------------------------------------------------------
// (1) In-memory enrichment used by downloadAllDocuments
// ---------------------------------------------------------------------------

/** Document types eligible for in-place details enrichment. */
const ENRICHABLE_TYPES: DocumentTypeKey[] = [
  'propositions',
  'committeeReports',
  'motions',
  'interpellations',
];

export interface EnrichTopDocumentsOptions {
  enrichLimit: number;
  analysisRunDate: string;
  docTypes?: DocumentTypeKey[] | null;
}

/**
 * Concurrency cap (3 at a time) for `client.fetchDocumentDetails` calls during
 * in-memory enrichment — matches the historic value in the original
 * `downloadAllDocuments` body.
 */
const ENRICHMENT_CONCURRENCY = 3;

/**
 * Mutate the first `enrichLimit` documents per enrichable type in `data`,
 * attaching `fullContent`/`fullText` plus coverage/provenance when the MCP
 * call returns content above `FULL_TEXT_MIN_LENGTH`. Returns `true` when at
 * least one document received content or details — callers should then
 * push `'get_dokument_innehall'` to the manifest dataSources.
 */
export async function enrichTopDocumentsWithDetails(
  client: MCPClient,
  data: DownloadedData,
  options: EnrichTopDocumentsOptions,
): Promise<boolean> {
  const { enrichLimit, analysisRunDate, docTypes } = options;
  if (enrichLimit <= 0) return false;

  const typesToEnrich = docTypes
    ? ENRICHABLE_TYPES.filter((t) => docTypes.includes(t))
    : ENRICHABLE_TYPES;

  let anyEnriched = false;
  for (const docType of typesToEnrich) {
    const docs = data[docType];
    if (!docs || docs.length === 0) continue;

    const toEnrich = docs.slice(0, enrichLimit);

    let fullTextCount = 0;
    let detailsOnlyCount = 0;

    for (let i = 0; i < toEnrich.length; i += ENRICHMENT_CONCURRENCY) {
      const batch = toEnrich.slice(i, i + ENRICHMENT_CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (doc) => {
          const docRecord = doc as Record<string, unknown>;
          const dokId = resolveDokId(docRecord);
          if (!dokId) return null;

          const details = (await client.fetchDocumentDetails(
            dokId,
            true,
          )) as Record<string, unknown>;

          const rawText = str(details['text']).trim();
          const verifiedFullText = sanitize(details['fullText']) || '';
          const verifiedFullContent =
            rawText.length > FULL_TEXT_MIN_LENGTH
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
            { requestedDate: analysisRunDate, fullTextRequested: true },
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
          const v = result.value as Record<string, unknown>;
          const hasFullText =
            typeof v['fullText'] === 'string' &&
            (v['fullText'] as string).length > FULL_TEXT_MIN_LENGTH;
          const hasFullContent =
            typeof v['fullContent'] === 'string' &&
            (v['fullContent'] as string).length > FULL_TEXT_MIN_LENGTH;
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

      if (i + ENRICHMENT_CONCURRENCY < toEnrich.length) {
        await new Promise<void>((r) => setTimeout(r, 300));
      }
    }

    if (fullTextCount > 0) {
      anyEnriched = true;
      console.log(
        `[pre-analysis] ✅ Enriched ${fullTextCount} ${docType} documents with full text` +
          (detailsOnlyCount > 0
            ? `, ${detailsOnlyCount} with details/summary only`
            : ''),
      );
    } else if (detailsOnlyCount > 0) {
      anyEnriched = true;
      console.log(
        `[pre-analysis] ℹ️ Fetched details for ${detailsOnlyCount} ${docType} documents (no full text returned)`,
      );
    } else {
      console.warn(
        `[pre-analysis] ⚠️ ${docType} enrichment produced no content (metadata-only analysis)`,
      );
    }
  }

  return anyEnriched;
}

// ---------------------------------------------------------------------------
// (2) Top-N persistence flow used by auto-full-text-top-n
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
  const runDate =
    typeof options.runDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(options.runDate)
      ? options.runDate
      : new Date().toISOString().slice(0, 10);

  const fullTextDir = path.join(outputDir, 'full-text');
  fs.mkdirSync(fullTextDir, { recursive: true });

  const candidates: Array<{ dokId: string; doc: RawDocument }> = [];
  for (const doc of docs) {
    if (candidates.length >= topN) break;
    const record = doc as Record<string, unknown>;
    const dokId = resolveDokId(record);
    if (!dokId) continue;
    candidates.push({ dokId, doc });
  }

  const outcomes: FullTextFetchOutcome[] = [];

  for (const { dokId, doc } of candidates) {
    let outcome: FullTextFetchOutcome;
    try {
      const docRecord = doc as Record<string, unknown>;
      let details: Record<string, unknown> | null = null;
      let content = selectContent(docRecord);

      if (content.length <= FULL_TEXT_MIN_LENGTH) {
        const detailsWithCoverage = await client.fetchDocumentDetailsWithCoverage(
          dokId,
          true,
          { requestedDate: runDate },
        );
        details = detailsWithCoverage.document;
        content = selectContent(details);
      }

      const coverageState = inferDocumentCoverageState(
        { ...docRecord, ...(details ?? {}) },
        { requestedDate: runDate, fullTextRequested: true },
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
      const state: MCPCoverageState = isNotIndexed ? 'not_indexed' : 'fetch_error';
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
