/**
 * @module parliamentary-data/enrichment/full-text/fetch-policy
 * @description Retry + caching policy specific to in-memory full-text
 * enrichment. Implements `enrichTopDocumentsWithDetails` — the flow called
 * from `downloadAllDocuments()` after the initial metadata fetch.
 *
 * Mutates the first N documents per enrichable type in place, attempting to
 * attach `fullContent` / `fullText` plus coverage / provenance metadata. NO
 * filesystem writes — sidecar persistence is performed separately by the
 * stitcher.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPClient } from '../../../mcp-client/client.js';
import { buildMcpProvenance, inferDocumentCoverageState } from '../../../mcp-client/coverage.js';
import { FULL_TEXT_MIN_LENGTH } from '../../full-text-threshold.js';
import type { DocumentTypeKey, DownloadedData } from '../../data-downloader.js';

import {
  ENRICHABLE_TYPES,
  ENRICHMENT_CONCURRENCY,
  resolveDokId,
  sanitize,
  str,
} from './top-n-selection.js';

export interface EnrichTopDocumentsOptions {
  enrichLimit: number;
  analysisRunDate: string;
  docTypes?: DocumentTypeKey[] | null;
}

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
