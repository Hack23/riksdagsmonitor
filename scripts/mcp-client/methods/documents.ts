/**
 * @module mcp-client/methods/documents
 * @description Document search, detail fetch, enrichment and government
 * document domain methods for the MCP client.
 *
 * Includes the external URL fetch helper used to pull raw GitHub/regeringen
 * content — kept here because every consumer (article generation, analysis
 * gate) reaches it via the same `MCPClient` orchestrator.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPTransportClient } from '../transport/jsonrpc.js';
import type {
  GovDocSearchParams,
  MCPDocumentResult,
  MCPProvenance,
  MCPSearchResult,
  RiksdagDocument,
  SearchDocumentsParams,
} from '../../types/mcp.js';
import { annotateDocumentTypes } from '../document-types.js';
import {
  attachCoverageMetadata,
  buildMcpProvenance,
  inferDocumentCoverageState,
} from '../coverage.js';
import { classifyDocumentErrorAsNotIndexed } from '../error-classification/not-indexed.js';
import { fetchExternalUrlText } from '../transport/timeout.js';

export async function searchDocuments(
  transport: MCPTransportClient,
  searchParams: SearchDocumentsParams,
): Promise<unknown[]> {
  return (await searchDocumentsWithDiagnostics(transport, searchParams)).items;
}

export async function searchDocumentsWithDiagnostics(
  transport: MCPTransportClient,
  searchParams: SearchDocumentsParams,
): Promise<MCPSearchResult<Record<string, unknown>>> {
  const response = await transport.request(
    'search_dokument',
    searchParams as unknown as Record<string, unknown>,
  );
  const raw = (response['dokument'] ?? response['documents'] ?? []) as unknown[];
  const resultCount = raw.length;
  const coverageState = resultCount === 0 ? 'search_empty' : 'metadata_only';
  const provenance = buildMcpProvenance({
    endpoint: transport.baseURL,
    tool: 'search_dokument',
    query: searchParams as Record<string, unknown>,
    resultCount,
    coverageState,
  });
  const items = raw.map((d) => {
    const annotated = annotateDocumentTypes(d as Record<string, unknown>);
    const docCoverage = inferDocumentCoverageState(annotated);
    const docProvenance = {
      ...provenance,
      coverageState: docCoverage,
    } as MCPProvenance;
    return attachCoverageMetadata(annotated, docProvenance);
  });
  return {
    items,
    query: { ...(searchParams as Record<string, unknown>) },
    resultCount,
    coverageState,
    provenance,
  };
}

export async function fetchGovernmentDocuments(
  transport: MCPTransportClient,
  searchParams: GovDocSearchParams,
): Promise<unknown[]> {
  const response = await transport.request(
    'search_regering',
    searchParams as unknown as Record<string, unknown>,
  );
  return (response['documents'] ?? []) as unknown[];
}

export async function fetchDocumentDetails(
  transport: MCPTransportClient,
  dok_id: string,
  include_full_text = true,
): Promise<Record<string, unknown>> {
  const response = await transport.request('get_dokument_innehall', {
    dok_id,
    include_full_text,
  });
  return response;
}

export async function fetchDocumentDetailsWithCoverage(
  transport: MCPTransportClient,
  dok_id: string,
  include_full_text = true,
  options: {
    requestedDate?: string | null;
    retrieval?: 'live' | 'retry_queue' | 'cache';
  } = {},
): Promise<MCPDocumentResult<Record<string, unknown>>> {
  const query = { dok_id, include_full_text };
  try {
    const response = await fetchDocumentDetails(transport, dok_id, include_full_text);
    const coverageState = inferDocumentCoverageState(response, {
      requestedDate: options.requestedDate ?? null,
      fullTextRequested: include_full_text,
    });
    const resultCount = Object.keys(response).length > 0 ? 1 : 0;
    const provenance = buildMcpProvenance({
      endpoint: transport.baseURL,
      tool: 'get_dokument_innehall',
      query,
      resultCount,
      coverageState,
      retrieval: options.retrieval ?? 'live',
    });
    return {
      document: attachCoverageMetadata({ ...response, dok_id }, provenance),
      query,
      resultCount,
      coverageState,
      provenance,
    };
  } catch (error) {
    const err = error as Error;
    const notIndexedLike = classifyDocumentErrorAsNotIndexed(err.message ?? '', dok_id);
    if (!notIndexedLike) throw error;

    const coverageState = 'not_indexed';
    const provenance = buildMcpProvenance({
      endpoint: transport.baseURL,
      tool: 'get_dokument_innehall',
      query,
      resultCount: 0,
      coverageState,
      retrieval: options.retrieval ?? 'live',
    });
    return {
      document: attachCoverageMetadata(
        { dok_id, contentFetchError: err.message },
        provenance,
      ),
      query,
      resultCount: 0,
      coverageState,
      provenance,
    };
  }
}

export async function enrichDocumentsWithContent(
  transport: MCPTransportClient,
  documents: RiksdagDocument[],
  concurrency = 3,
): Promise<RiksdagDocument[]> {
  const safeConcurrency = Math.max(1, Math.floor(concurrency));
  const enriched: RiksdagDocument[] = [];

  for (let i = 0; i < documents.length; i += safeConcurrency) {
    const batch = documents.slice(i, i + safeConcurrency);

    const batchResults = await Promise.allSettled(
      batch.map(async (doc): Promise<RiksdagDocument> => {
        const dok_id = doc.dokumentnamn ?? doc.dok_id ?? doc.id;
        if (!dok_id) {
          console.warn('⚠️ Document missing ID:', doc);
          return { ...doc, contentFetchError: 'No document ID' };
        }

        try {
          const details = await fetchDocumentDetails(transport, dok_id, false);
          const intressent = (details['intressent'] ?? {}) as Record<string, string>;
          const author = intressent['tilltalsnamn']
            ? `${intressent['tilltalsnamn']} ${intressent['efternamn']}`.trim()
            : doc.intressent_namn ?? intressent['namn'] ?? 'Unknown';
          const party = intressent['parti'] ?? doc.parti ?? 'Unknown';
          const summary =
            (details['summary'] as string) ??
            doc.summary ??
            (details['notis'] as string) ??
            doc.notis ??
            '';

          return {
            ...doc,
            ...(details as Partial<RiksdagDocument>),
            author,
            parti: party,
            intressent_namn: author,
            summary,
            contentFetched: true,
          } as RiksdagDocument;
        } catch (error: unknown) {
          const errMsg = (error as Error).message;
          console.error(`❌ Failed to enrich document ${dok_id}:`, errMsg);
          return { ...doc, contentFetchError: errMsg };
        }
      }),
    );

    for (let idx = 0; idx < batchResults.length; idx++) {
      const result = batchResults[idx]!;
      if (result.status === 'fulfilled') {
        enriched.push(result.value);
      } else {
        const failedDoc = batch[idx]!;
        const failedDokId = failedDoc.dokumentnamn ?? failedDoc.dok_id ?? failedDoc.id ?? 'unknown';
        console.error(`❌ Batch enrichment failed for document ${failedDokId}:`, result.reason);
        enriched.push({ ...failedDoc, contentFetchError: (result.reason as Error).message });
      }
    }

    if (i + safeConcurrency < documents.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, 200));
    }
  }

  return enriched;
}

/**
 * Fetch government document content from regeringen.se via g0v.se.
 * Uses the get_g0v_document_content MCP tool to retrieve Markdown content.
 *
 * The g0v MCP tool response typically contains:
 *   - `content` (primary): Markdown content of the document
 *   - `markdown` (fallback): Alias used by some g0v API versions
 *   - `text` (fallback): Plain text content when Markdown is unavailable
 */
export async function fetchGovernmentDocumentContent(
  transport: MCPTransportClient,
  regeringenUrl: string,
): Promise<string | null> {
  try {
    const response = await transport.request('get_g0v_document_content', {
      regeringenUrl,
    });
    return (response['content'] ?? response['markdown'] ?? response['text'] ?? null) as string | null;
  } catch (error: unknown) {
    console.warn(`⚠️ Could not fetch government document content for ${regeringenUrl}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Fetch raw text content from an external URL (e.g. GitHub raw, other public URLs).
 * Performs a simple HTTP GET and returns the response body as text.
 * Uses a 15-second timeout (see `transport/timeout.ts`) to avoid hanging
 * on slow external resources.
 */
export async function fetchExternalUrlContent(
  _transport: MCPTransportClient,
  rawUrl: string,
): Promise<string | null> {
  return fetchExternalUrlText(rawUrl);
}
