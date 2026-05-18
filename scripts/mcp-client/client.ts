/**
 * @module mcp-client/client
 * @description `MCPClient` orchestrator — thin façade over the JSON-RPC
 * transport (`./transport/jsonrpc.ts`) that exposes per-domain method
 * wrappers from `./methods/*.ts`.
 *
 * Public API surface is preserved verbatim from the pre-refactor
 * monolithic client: every consumer of `MCPClient` (calendar-fetch,
 * download-parliamentary-data, populate-analysis-data, the 14 news
 * workflows, all tests) continues to work unchanged.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  FetchMPsFilters,
  FetchVotingFilters,
  FetchVotingGroupFilters,
  GovDocSearchParams,
  MCPDocumentResult,
  MCPSearchResult,
  MCPStructuredSignal,
  RiksdagDocument,
  SearchDocumentsParams,
  SearchSpeechesParams,
} from '../types/mcp.js';
import { MCPTransportClient } from './transport/jsonrpc.js';
import { fetchCalendarEvents } from './methods/calendar.js';
import {
  fetchCommitteeReports,
  fetchInterpellations,
  fetchMotions,
  fetchPropositions,
  fetchWrittenQuestions,
} from './methods/reports.js';
import { searchSpeeches } from './methods/speeches.js';
import { fetchMPs } from './methods/members.js';
import {
  fetchVotingGroup,
  fetchVotingRecords,
  fetchVotingRecordsWithDiagnostics,
} from './methods/votes.js';
import {
  enrichDocumentsWithContent,
  fetchDocumentDetails,
  fetchDocumentDetailsWithCoverage,
  fetchExternalUrlContent,
  fetchGovernmentDocumentContent,
  fetchGovernmentDocuments,
  searchDocuments,
  searchDocumentsWithDiagnostics,
} from './methods/documents.js';

/**
 * MCP (Model Context Protocol) client providing typed access to
 * 32 riksdag-regering intelligence tools via JSON-RPC 2.0.
 *
 * Inherits transport, retry, session and statistics from
 * {@link MCPTransportClient}; each domain method delegates to the
 * corresponding `./methods/*.ts` free function.
 */
export class MCPClient extends MCPTransportClient {
  // ---- calendar -------------------------------------------------------
  async fetchCalendarEvents(
    from: string,
    tom: string,
    org: string | null = null,
    akt: string | null = null,
  ): Promise<unknown[]> {
    return fetchCalendarEvents(this, from, tom, org, akt);
  }

  // ---- reports / propositions / motions / questions ------------------
  async fetchCommitteeReports(
    limit = 10,
    rm: string | null = null,
    organ: string | null = null,
  ): Promise<unknown[]> {
    return fetchCommitteeReports(this, limit, rm, organ);
  }

  async fetchPropositions(limit = 10, rm: string | null = null): Promise<unknown[]> {
    return fetchPropositions(this, limit, rm);
  }

  async fetchMotions(limit = 10, rm: string | null = null): Promise<unknown[]> {
    return fetchMotions(this, limit, rm);
  }

  async fetchWrittenQuestions(params: { limit?: number; rm?: string } = {}): Promise<unknown[]> {
    return fetchWrittenQuestions(this, params);
  }

  async fetchInterpellations(params: { limit?: number; rm?: string } = {}): Promise<unknown[]> {
    return fetchInterpellations(this, params);
  }

  // ---- documents ------------------------------------------------------
  async searchDocuments(searchParams: SearchDocumentsParams): Promise<unknown[]> {
    return searchDocuments(this, searchParams);
  }

  async searchDocumentsWithDiagnostics(
    searchParams: SearchDocumentsParams,
  ): Promise<MCPSearchResult<Record<string, unknown>>> {
    return searchDocumentsWithDiagnostics(this, searchParams);
  }

  // ---- speeches -------------------------------------------------------
  async searchSpeeches(searchParams: SearchSpeechesParams): Promise<unknown[]> {
    return searchSpeeches(this, searchParams);
  }

  // ---- members --------------------------------------------------------
  async fetchMPs(filters: FetchMPsFilters = {}): Promise<unknown[]> {
    return fetchMPs(this, filters);
  }

  // ---- votes ----------------------------------------------------------
  async fetchVotingRecords(filters: FetchVotingFilters): Promise<unknown[]> {
    return fetchVotingRecords(this, filters);
  }

  async fetchVotingRecordsWithDiagnostics(
    filters: FetchVotingFilters,
  ): Promise<MCPSearchResult<Record<string, unknown>> & { signal?: MCPStructuredSignal }> {
    return fetchVotingRecordsWithDiagnostics(this, filters);
  }

  async fetchVotingGroup(params: FetchVotingGroupFilters = {}): Promise<unknown[]> {
    return fetchVotingGroup(this, params);
  }

  // ---- government documents + enrichment ------------------------------
  async fetchGovernmentDocuments(searchParams: GovDocSearchParams): Promise<unknown[]> {
    return fetchGovernmentDocuments(this, searchParams);
  }

  async fetchDocumentDetails(
    dok_id: string,
    include_full_text = true,
  ): Promise<Record<string, unknown>> {
    return fetchDocumentDetails(this, dok_id, include_full_text);
  }

  async fetchDocumentDetailsWithCoverage(
    dok_id: string,
    include_full_text = true,
    options: {
      requestedDate?: string | null;
      retrieval?: 'live' | 'retry_queue' | 'cache';
    } = {},
  ): Promise<MCPDocumentResult<Record<string, unknown>>> {
    return fetchDocumentDetailsWithCoverage(this, dok_id, include_full_text, options);
  }

  async enrichDocumentsWithContent(
    documents: RiksdagDocument[],
    concurrency = 3,
  ): Promise<RiksdagDocument[]> {
    return enrichDocumentsWithContent(this, documents, concurrency);
  }

  async fetchGovernmentDocumentContent(regeringenUrl: string): Promise<string | null> {
    return fetchGovernmentDocumentContent(this, regeringenUrl);
  }

  async fetchExternalUrlContent(rawUrl: string): Promise<string | null> {
    return fetchExternalUrlContent(this, rawUrl);
  }
}
