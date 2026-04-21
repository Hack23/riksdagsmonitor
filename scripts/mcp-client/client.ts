/**
 * @module mcp-client/client
 * @description MCPClient class providing typed access to 32 riksdag-regering
 * intelligence tools via JSON-RPC 2.0.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import type {
  MCPClientConfig,
  MCPStats,
  JsonRpcRequest,
  JsonRpcResponse,
  SearchDocumentsParams,
  SearchSpeechesParams,
  FetchMPsFilters,
  FetchVotingFilters,
  FetchVotingGroupFilters,
  GovDocSearchParams,
  RiksdagDocument,
} from '../types/mcp.js';
import { performPost } from './transport.js';
import { annotateDocumentTypes } from './document-types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default MCP gateway port. The `ghcr.io/github/gh-aw-mcpg` container exports
 * `MCP_GATEWAY_PORT` in the compiled `news-*.lock.yml` workflows. Was `80`
 * in gh-aw <0.69 and is `8080` in gh-aw >=0.69. Always resolve dynamically
 * from `mcp-config.json`/env when possible — see `getAwfGatewayPort()`.
 */
const DEFAULT_MCP_GATEWAY_PORT = 8080;
const DEFAULT_MCP_GATEWAY_DOMAIN = 'host.docker.internal';
const DIRECT_MCP_SERVER_URL = 'https://riksdag-regering-ai.onrender.com/mcp';

/**
 * Resolve the MCP gateway port from (in order):
 *   1. `MCP_GATEWAY_PORT` env var (set by the gh-aw lock file at gateway start)
 *   2. `gateway.port` in mcp-config.json (written by the gh-aw mcp-gateway bootstrap)
 *   3. {@link DEFAULT_MCP_GATEWAY_PORT}
 */
function getAwfGatewayPort(): number {
  const envPort = process.env['MCP_GATEWAY_PORT'];
  if (envPort) {
    const parsed = Number.parseInt(envPort, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      const port = gateway?.['port'];
      if (typeof port === 'number' && port > 0) return port;
      if (typeof port === 'string') {
        const parsed = Number.parseInt(port, 10);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
    }
  } catch {
    // Best-effort — fall through to default port
  }
  return DEFAULT_MCP_GATEWAY_PORT;
}

/**
 * Resolve the MCP gateway domain from (in order):
 *   1. `MCP_GATEWAY_DOMAIN` env var
 *   2. `gateway.domain` in mcp-config.json
 *   3. {@link DEFAULT_MCP_GATEWAY_DOMAIN}
 */
function getAwfGatewayDomain(): string {
  const envDomain = process.env['MCP_GATEWAY_DOMAIN'];
  if (envDomain) return envDomain;
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      const domain = gateway?.['domain'];
      if (typeof domain === 'string' && domain.length > 0) return domain;
    }
  } catch {
    // Best-effort — fall through to default domain
  }
  return DEFAULT_MCP_GATEWAY_DOMAIN;
}

/**
 * Build the AWF gateway URL for a given MCP server name. Used as the routing
 * target inside the AWF sandbox where direct HTTPS to onrender.com is blocked.
 */
function buildAwfGatewayUrl(serverName: string): string {
  return `http://${getAwfGatewayDomain()}:${getAwfGatewayPort()}/mcp/${serverName}`;
}

/**
 * Detect whether the current process runs inside the AWF sandbox with the
 * MCP gateway active. Heuristic matches `scripts/mcp-setup.sh`:
 *   - `MCP_GATEWAY_API_KEY` env var present, OR
 *   - `gateway.apiKey` present in `mcp-config.json`, OR
 *   - `mcpServers['riksdag-regering'].headers.Authorization` present in
 *     `mcp-config.json` (populated by the gateway bootstrap).
 *
 * When true, the client must route through the gateway domain/port resolved
 * by {@link buildAwfGatewayUrl} rather than the direct onrender HTTPS URL.
 * The AWF api-proxy performs TLS MITM on outbound HTTPS which produces
 * `EPROTO SSL wrong version number` when Node.js hits onrender.com directly,
 * so gateway routing is mandatory inside the sandbox even when
 * `scripts/mcp-setup.sh` was not sourced first.
 */
function isAwfGatewayActive(): boolean {
  if (process.env['MCP_GATEWAY_API_KEY']) return true;
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (!fs.existsSync(configPath)) return false;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
    const gateway = raw['gateway'] as Record<string, unknown> | undefined;
    if (gateway?.['apiKey']) return true;
    const mcpServers = raw['mcpServers'] as Record<string, unknown> | undefined;
    const rrServer = mcpServers?.['riksdag-regering'] as Record<string, unknown> | undefined;
    const headers = rrServer?.['headers'] as Record<string, unknown> | undefined;
    if (headers?.['Authorization']) return true;
  } catch {
    // Config read is best-effort — absence of config is not an error.
  }
  return false;
}

/**
 * Resolve the default MCP server URL.
 * Priority:
 *   1. `MCP_SERVER_URL` env var (explicit override — e.g. from `mcp-setup.sh`).
 *   2. AWF sandbox auto-detection → gateway URL on the dynamically-resolved
 *      `MCP_GATEWAY_DOMAIN:MCP_GATEWAY_PORT` (gh-aw v0.69+ uses port 8080).
 *   3. Direct onrender HTTPS endpoint (local dev / CI outside AWF sandbox).
 */
function getDefaultMcpServerUrl(): string {
  const explicit = process.env['MCP_SERVER_URL'];
  if (explicit) return explicit;
  if (isAwfGatewayActive()) return buildAwfGatewayUrl('riksdag-regering');
  return DIRECT_MCP_SERVER_URL;
}

const DEFAULT_MCP_SERVER_URL: string = getDefaultMcpServerUrl();
const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
/** Timeout in milliseconds for fetching external URLs (GitHub, etc.) */
const EXTERNAL_URL_FETCH_TIMEOUT_MS = 15_000;

function getDefaultTimeout(): number {
  const envVal = process.env['MCP_CLIENT_TIMEOUT_MS'];
  return envVal ? (Number.parseInt(envVal, 10) || 30_000) : 30_000;
}

/**
 * Resolve the default MCP auth token.
 * Priority:
 *   1. MCP_AUTH_TOKEN env var (strips "Bearer " prefix if present)
 *   2. MCP_GATEWAY_API_KEY env var (raw API key)
 *   3. gateway.apiKey from MCP config file (legacy — raw API key)
 *   4. mcpServers['riksdag-regering'].headers.Authorization from MCP config file
 *      (raw API key — used as-is)
 *
 * The MCP gateway expects a raw API key (no "Bearer " prefix). If a legacy
 * "Bearer <key>" value is stored in the config, the prefix is stripped
 * automatically.
 */
function getDefaultAuthToken(): string {
  if (process.env['MCP_AUTH_TOKEN']) return process.env['MCP_AUTH_TOKEN'].replace(/^Bearer\s+/i, '');
  if (process.env['MCP_GATEWAY_API_KEY']) return process.env['MCP_GATEWAY_API_KEY'];

  // Try reading from MCP config file
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;

      // Priority 3: legacy gateway.apiKey
      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      const apiKey = gateway?.['apiKey'] as string | undefined;
      if (apiKey) return apiKey.replace(/^Bearer\s+/i, '');

      // Priority 4: mcpServers['riksdag-regering'].headers.Authorization
      // Strip legacy "Bearer " prefix if present — gateway expects raw API key
      const mcpServers = raw['mcpServers'] as Record<string, unknown> | undefined;
      const rrServer = mcpServers?.['riksdag-regering'] as Record<string, unknown> | undefined;
      const headers = rrServer?.['headers'] as Record<string, unknown> | undefined;
      const authHeader = headers?.['Authorization'] as string | undefined;
      if (authHeader) return authHeader.replace(/^Bearer\s+/i, '');
    }
  } catch {
    // Config file read is best-effort — fall through to empty token
  }
  return '';
}

const DEFAULT_MCP_AUTH_TOKEN: string = getDefaultAuthToken();

let jsonRpcId = 1;

// ---------------------------------------------------------------------------
// MCPClient class
// ---------------------------------------------------------------------------

/**
 * MCP (Model Context Protocol) client providing typed access to
 * 32 riksdag-regering intelligence tools via JSON-RPC 2.0.
 */
export class MCPClient {
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly customHeaders: Readonly<Record<string, string>>;
  readonly authToken: string;

  requestCount: number;
  errorCount: number;
  sessionId: string | null;

  constructor(config: MCPClientConfig | string = {}) {
    if (typeof config === 'string') {
      this.baseURL = config;
      this.timeout = getDefaultTimeout();
      this.maxRetries = DEFAULT_MAX_RETRIES;
      this.customHeaders = {};
      this.authToken = DEFAULT_MCP_AUTH_TOKEN;
    } else {
      this.baseURL = config.baseURL ?? config.serverUrl ?? DEFAULT_MCP_SERVER_URL;
      this.timeout = config.timeout ?? getDefaultTimeout();
      this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
      this.customHeaders = config.headers ?? {};
      this.authToken = config.authToken ?? DEFAULT_MCP_AUTH_TOKEN;
    }

    this.requestCount = 0;
    this.errorCount = 0;
    this.sessionId = null;
  }

  // -----------------------------------------------------------------------
  // Core request
  // -----------------------------------------------------------------------

  async request(
    tool: string,
    params: Record<string, unknown> = {},
    retryCount = 0,
    _skipPrefix = false,
  ): Promise<Record<string, unknown>> {
    if (!tool || typeof tool !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(tool)) {
      throw new Error(
        `Invalid tool name: ${tool}. Tool names must contain only alphanumeric characters, hyphens, and underscores.`,
      );
    }

    if (retryCount === 0) {
      this.requestCount++;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // The MCP gateway routes by URL path (e.g., /mcp/riksdag-regering),
      // so tool names should always be bare (e.g., 'get_motioner', not
      // 'riksdag-regering--get_motioner'). No server prefix is needed.
      const toolName = tool;

      const jsonRpcRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: jsonRpcId++,
        method: 'tools/call',
        params: { name: toolName, arguments: params },
      };

      if (this.authToken && !this.sessionId) {
        try {
          await this.initializeSession();
        } catch {
          // Session init is optional
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        ...this.customHeaders,
      };
      if (this.authToken) headers['Authorization'] = this.authToken;
      if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;

      const response = await performPost(
        this.baseURL,
        headers,
        JSON.stringify(jsonRpcRequest),
        controller.signal,
      );

      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch {
          // ignore
        }
        throw new Error(
          `MCP server error: ${response.status} ${response.statusText}${errorBody ? ' - ' + errorBody : ''}`,
        );
      }

      const contentType: string =
        response.headers && typeof response.headers.get === 'function'
          ? (response.headers.get('content-type') ?? '')
          : '';

      let jsonRpcResponse: JsonRpcResponse;
      if (contentType.includes('text/event-stream')) {
        const text = await response.text();
        jsonRpcResponse = this.parseSSEResponse(text);
      } else {
        jsonRpcResponse = (await response.json()) as JsonRpcResponse;
      }

      if (jsonRpcResponse.error) {
        const errorMsg = jsonRpcResponse.error.message || JSON.stringify(jsonRpcResponse.error);

        if (errorMsg.includes('session initialization') || errorMsg.includes('Too Many Requests')) {
          this.sessionId = null;
          if (retryCount < 2) {
            const delay = (retryCount + 1) * 2000;
            console.warn(`⚠️ Session error, re-initializing after ${delay}ms...`);
            await new Promise<void>((r) => setTimeout(r, delay));
            await this.initializeSession();
            return this.request(tool, params, retryCount + 1);
          }
        }

        throw new Error(`MCP tool error: ${errorMsg}`);
      }

      const result = (jsonRpcResponse.result ?? {}) as Record<string, unknown>;
      const content = result['content'] as Array<{ text?: string }> | undefined;
      if (Array.isArray(content) && content[0]?.text) {
        try {
          const parsed = JSON.parse(content[0].text) as Record<string, unknown>;
          if (parsed['payloadPath']) {
            const fs = await import('fs');
            const payloadRaw = JSON.parse(
              fs.readFileSync(parsed['payloadPath'] as string, 'utf8'),
            ) as Record<string, unknown>;
            const payloadContent = payloadRaw['content'] as Array<{ text?: string }> | undefined;
            const payloadText = payloadContent?.[0]?.text;
            if (payloadText) {
              try {
                return JSON.parse(payloadText) as Record<string, unknown>;
              } catch {
                return { text: payloadText };
              }
            }
            return payloadRaw;
          }
          return parsed;
        } catch {
          return { text: content[0].text };
        }
      }
      return result;
    } catch (error: unknown) {
      const err = error as Error;
      const errorMsg = (err.message ?? '').toLowerCase();

      if (
        retryCount < this.maxRetries - 1 &&
        (err.name === 'AbortError' ||
          errorMsg.includes('network') ||
          errorMsg.includes('econnrefused') ||
          errorMsg.includes('connection closed') ||
          errorMsg.includes('too many requests'))
      ) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.warn(
          `⚠️ Request failed (${err.message.substring(0, 60)}), retrying after ${delay}ms (${retryCount + 1}/${this.maxRetries - 1})...`,
        );
        this.sessionId = null;
        await this.sleep(delay);
        return this.request(tool, params, retryCount + 1);
      }

      this.errorCount++;

      let errorMessage = `MCP request failed: ${err.message}`;
      if (err.name === 'AbortError' || errorMsg.includes('timeout')) {
        errorMessage += `\n\n💡 Troubleshooting tips:
  - The MCP server may be cold starting (Render.com free tier)
  - Try increasing timeout or waiting a few minutes
  - Server URL: ${this.baseURL}
  - Consider running workflow again in 5-10 minutes`;
      } else if (
        errorMsg.includes('network') ||
        errorMsg.includes('econnrefused') ||
        errorMsg.includes('fetch failed')
      ) {
        errorMessage += `\n\n💡 Troubleshooting tips:
  - Check if MCP server is accessible: ${this.baseURL}
  - Verify network connectivity
  - The server may be temporarily unavailable
  - Try manual workflow dispatch with force_generation=true`;
      }

      throw new Error(errorMessage, { cause: error });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // -----------------------------------------------------------------------
  // Utilities
  // -----------------------------------------------------------------------

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  parseSSEResponse(text: string): JsonRpcResponse {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        return JSON.parse(line.substring(6)) as JsonRpcResponse;
      }
    }
    return JSON.parse(text) as JsonRpcResponse;
  }

  async initializeSession(): Promise<void> {
    if (this.sessionId || !this.authToken) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        ...this.customHeaders,
      };
      if (this.authToken) headers['Authorization'] = this.authToken;

      const response = await performPost(
        this.baseURL,
        headers,
        JSON.stringify({
          jsonrpc: '2.0',
          id: jsonRpcId++,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'riksdagsmonitor-news', version: '1.0.0' },
          },
        }),
        controller.signal,
      );

      if (!response.ok) {
        throw new Error(`Session init failed: ${response.status} ${response.statusText}`);
      }

      const sessionId =
        response.headers && typeof response.headers.get === 'function'
          ? response.headers.get('Mcp-Session-Id')
          : null;

      if (sessionId) {
        this.sessionId = sessionId;
        console.log(`  🔗 MCP session initialized: ${sessionId.substring(0, 8)}...`);
      }

      await performPost(
        this.baseURL,
        {
          ...headers,
          ...(this.sessionId ? { 'Mcp-Session-Id': this.sessionId } : {}),
        },
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
        controller.signal,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // -----------------------------------------------------------------------
  // Data-fetching methods
  // -----------------------------------------------------------------------

  async fetchCalendarEvents(
    from: string,
    tom: string,
    org: string | null = null,
    akt: string | null = null,
  ): Promise<unknown[]> {
    const params: Record<string, unknown> = { from, tom };
    if (org) params['org'] = org;
    if (akt) params['akt'] = akt;

    const response = await this.request('get_calendar_events', params);
    return (response['kalender'] ?? response['events'] ?? []) as unknown[];
  }

  async fetchCommitteeReports(
    limit = 10,
    rm: string | null = null,
    organ: string | null = null,
  ): Promise<unknown[]> {
    const params: Record<string, unknown> = { limit };
    if (rm) params['rm'] = rm;
    if (organ) params['organ'] = organ;

    const response = await this.request('get_betankanden', params);
    return (response['dokument'] ?? response['reports'] ?? []) as unknown[];
  }

  async fetchPropositions(limit = 10, rm: string | null = null): Promise<unknown[]> {
    const params: Record<string, unknown> = { limit };
    if (rm) params['rm'] = rm;

    const response = await this.request('get_propositioner', params);
    return (response['dokument'] ?? response['propositions'] ?? []) as unknown[];
  }

  async fetchMotions(limit = 10, rm: string | null = null): Promise<unknown[]> {
    const params: Record<string, unknown> = { limit };
    if (rm) params['rm'] = rm;

    const response = await this.request('get_motioner', params);
    return (response['dokument'] ?? response['motions'] ?? []) as unknown[];
  }

  async fetchWrittenQuestions(params: { limit?: number; rm?: string } = {}): Promise<unknown[]> {
    const reqParams: Record<string, unknown> = { limit: params.limit ?? 20 };
    if (params.rm) reqParams['rm'] = params.rm;
    const response = await this.request('get_fragor', reqParams);
    return (response['dokument'] ?? response['questions'] ?? []) as unknown[];
  }

  async fetchInterpellations(params: { limit?: number; rm?: string } = {}): Promise<unknown[]> {
    const reqParams: Record<string, unknown> = { limit: params.limit ?? 15 };
    if (params.rm) reqParams['rm'] = params.rm;
    const response = await this.request('get_interpellationer', reqParams);
    return (response['dokument'] ?? response['interpellations'] ?? []) as unknown[];
  }

  async searchDocuments(searchParams: SearchDocumentsParams): Promise<unknown[]> {
    const response = await this.request(
      'search_dokument',
      searchParams as unknown as Record<string, unknown>,
    );
    const raw = (response['dokument'] ?? response['documents'] ?? []) as unknown[];
    return raw.map(d => annotateDocumentTypes(d as Record<string, unknown>));
  }

  async searchSpeeches(searchParams: SearchSpeechesParams): Promise<unknown[]> {
    const response = await this.request(
      'search_anforanden',
      searchParams as unknown as Record<string, unknown>,
    );
    return (response['anforanden'] ?? response['speeches'] ?? []) as unknown[];
  }

  async fetchMPs(filters: FetchMPsFilters = {}): Promise<unknown[]> {
    const response = await this.request(
      'search_ledamoter',
      filters as unknown as Record<string, unknown>,
    );
    return (response['mps'] ?? []) as unknown[];
  }

  async fetchVotingRecords(filters: FetchVotingFilters): Promise<unknown[]> {
    const response = await this.request(
      'search_voteringar',
      filters as unknown as Record<string, unknown>,
    );
    return (response['votes'] ?? []) as unknown[];
  }

  async fetchVotingGroup(params: FetchVotingGroupFilters = {}): Promise<unknown[]> {
    const response = await this.request(
      'get_voting_group',
      params as unknown as Record<string, unknown>,
    );
    // MCP server returns 'groups' when groupBy is provided (grouped results),
    // or 'votes' when no grouping is applied (flat voting list fallback)
    return (response['groups'] ?? response['votes'] ?? []) as unknown[];
  }

  async fetchGovernmentDocuments(searchParams: GovDocSearchParams): Promise<unknown[]> {
    const response = await this.request(
      'search_regering',
      searchParams as unknown as Record<string, unknown>,
    );
    return (response['documents'] ?? []) as unknown[];
  }

  async fetchDocumentDetails(
    dok_id: string,
    include_full_text = true,
  ): Promise<Record<string, unknown>> {
    const response = await this.request('get_dokument_innehall', {
      dok_id,
      include_full_text,
    });
    return response;
  }

  async enrichDocumentsWithContent(
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
            const details = await this.fetchDocumentDetails(dok_id, false);
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
   *
   * @param regeringenUrl - Full URL to a document on regeringen.se
   * @returns Markdown content of the document, or null if unavailable
   */
  async fetchGovernmentDocumentContent(
    regeringenUrl: string,
  ): Promise<string | null> {
    try {
      const response = await this.request('get_g0v_document_content', {
        regeringenUrl,
      });
      // g0v API returns content in 'content' field; 'markdown'/'text' are fallbacks
      return (response['content'] ?? response['markdown'] ?? response['text'] ?? null) as string | null;
    } catch (error: unknown) {
      console.warn(`⚠️ Could not fetch government document content for ${regeringenUrl}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Fetch raw text content from an external URL (e.g. GitHub raw, other public URLs).
   * Performs a simple HTTP GET and returns the response body as text.
   * Uses a 15-second timeout to avoid hanging on slow external resources.
   *
   * @param rawUrl - Full URL to fetch (must be publicly accessible)
   * @returns Text content of the resource, or null if unavailable
   */
  async fetchExternalUrlContent(rawUrl: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), EXTERNAL_URL_FETCH_TIMEOUT_MS);
      const response = await fetch(rawUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'text/plain, text/markdown, text/html, */*' },
      });
      clearTimeout(timeout);
      if (!response.ok) {
        console.warn(`⚠️ HTTP ${response.status} fetching external URL: ${rawUrl}`);
        return null;
      }
      return await response.text();
    } catch (error: unknown) {
      console.warn(`⚠️ Could not fetch external URL ${rawUrl}: ${(error as Error).message}`);
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Statistics
  // -----------------------------------------------------------------------

  getStats(): MCPStats {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      successRate:
        this.requestCount > 0
          ? Math.round(((this.requestCount - this.errorCount) / this.requestCount) * 100) + '%'
          : '0%',
    };
  }

  resetStats(): void {
    this.requestCount = 0;
    this.errorCount = 0;
  }
}
