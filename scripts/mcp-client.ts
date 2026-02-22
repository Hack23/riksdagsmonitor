/**
 * @module Intelligence/MCPClient
 * @description JSON-RPC 2.0 client for the riksdag-regering-mcp server.
 * Bounded context: External Data Integration
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  MCPClientConfig,
  MCPStats,
  JsonRpcRequest,
  JsonRpcResponse,
  SearchDocumentsParams,
  SearchSpeechesParams,
  FetchMPsFilters,
  FetchVotingFilters,
  GovDocSearchParams,
  RiksdagDocument,
} from './types/mcp.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MCP_SERVER_URL: string =
  process.env['MCP_SERVER_URL'] ?? 'https://riksdag-regering-ai.onrender.com/mcp';
const DEFAULT_MCP_AUTH_TOKEN: string = process.env['MCP_AUTH_TOKEN'] ?? '';
const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function getDefaultTimeout(): number {
  const envVal = process.env['MCP_CLIENT_TIMEOUT_MS'];
  return envVal ? (Number.parseInt(envVal, 10) || 30_000) : 30_000;
}

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

  /**
   * Make an HTTP request to the MCP server using JSON-RPC 2.0.
   *
   * @param tool       - Tool name (e.g. 'get_calendar_events')
   * @param params     - Tool parameters
   * @param retryCount - Current retry attempt (internal use)
   * @param skipPrefix - Skip gateway prefix on retry (internal use)
   * @returns Parsed tool response
   */
  async request(
    tool: string,
    params: Record<string, unknown> = {},
    retryCount = 0,
    skipPrefix = false,
  ): Promise<Record<string, unknown>> {
    if (!tool || typeof tool !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(tool)) {
      throw new Error(
        `Invalid tool name: ${tool}. Tool names must contain only alphanumeric characters, hyphens, and underscores.`,
      );
    }

    if (retryCount === 0 && !skipPrefix) {
      this.requestCount++;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const isGateway =
        this.baseURL.includes('host.docker.internal') ||
        this.baseURL.includes('/mcp/riksdag-regering');
      const shouldPrefix = isGateway && !skipPrefix && !tool.includes('--');
      const toolName = shouldPrefix ? `riksdag-regering--${tool}` : tool;

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

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(jsonRpcRequest),
        signal: controller.signal,
      });

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

        const isToolLookupError =
          errorMsg.includes('not found') ||
          errorMsg.includes('Internal error') ||
          errorMsg.includes('Unknown tool') ||
          errorMsg.includes('unknown tool');

        if (isToolLookupError && toolName.startsWith('riksdag-regering--') && !skipPrefix) {
          const bareTool = toolName.replace(/^riksdag-regering--/, '');
          console.warn(`⚠️ Tool '${toolName}' not found, retrying as '${bareTool}'...`);
          return this.request(bareTool, params, retryCount, true);
        }

        if (errorMsg.includes('session initialization') || errorMsg.includes('Too Many Requests')) {
          this.sessionId = null;
          if (retryCount < 2) {
            const delay = (retryCount + 1) * 2000;
            console.warn(`⚠️ Session error, re-initializing after ${delay}ms...`);
            await new Promise<void>((r) => setTimeout(r, delay));
            await this.initializeSession();
            return this.request(tool, params, retryCount + 1, skipPrefix);
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
        return this.request(tool, params, retryCount + 1, skipPrefix);
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

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: jsonRpcId++,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'riksdagsmonitor-news', version: '1.0.0' },
          },
        }),
        signal: controller.signal,
      });

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

      await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          ...headers,
          ...(this.sessionId ? { 'Mcp-Session-Id': this.sessionId } : {}),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      });
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

  async searchDocuments(searchParams: SearchDocumentsParams): Promise<unknown[]> {
    const response = await this.request(
      'search_dokument',
      searchParams as unknown as Record<string, unknown>,
    );
    return (response['dokument'] ?? response['documents'] ?? []) as unknown[];
  }

  async searchSpeeches(searchParams: SearchSpeechesParams): Promise<unknown[]> {
    const response = await this.request(
      'search_anforanden',
      searchParams as unknown as Record<string, unknown>,
    );
    return (response['speeches'] ?? []) as unknown[];
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

// ---------------------------------------------------------------------------
// Singleton & convenience functions
// ---------------------------------------------------------------------------

let defaultClient: MCPClient | null = null;

export function getDefaultClient(): MCPClient {
  if (!defaultClient) {
    defaultClient = new MCPClient();
  }
  return defaultClient;
}

export async function fetchCalendarEvents(
  ...args: Parameters<MCPClient['fetchCalendarEvents']>
): ReturnType<MCPClient['fetchCalendarEvents']> {
  return getDefaultClient().fetchCalendarEvents(...args);
}

export async function fetchCommitteeReports(
  ...args: Parameters<MCPClient['fetchCommitteeReports']>
): ReturnType<MCPClient['fetchCommitteeReports']> {
  return getDefaultClient().fetchCommitteeReports(...args);
}

export async function fetchPropositions(
  ...args: Parameters<MCPClient['fetchPropositions']>
): ReturnType<MCPClient['fetchPropositions']> {
  return getDefaultClient().fetchPropositions(...args);
}

export async function fetchMotions(
  ...args: Parameters<MCPClient['fetchMotions']>
): ReturnType<MCPClient['fetchMotions']> {
  return getDefaultClient().fetchMotions(...args);
}

export async function searchDocuments(
  ...args: Parameters<MCPClient['searchDocuments']>
): ReturnType<MCPClient['searchDocuments']> {
  return getDefaultClient().searchDocuments(...args);
}

export async function searchSpeeches(
  ...args: Parameters<MCPClient['searchSpeeches']>
): ReturnType<MCPClient['searchSpeeches']> {
  return getDefaultClient().searchSpeeches(...args);
}

export async function fetchMPs(
  ...args: Parameters<MCPClient['fetchMPs']>
): ReturnType<MCPClient['fetchMPs']> {
  return getDefaultClient().fetchMPs(...args);
}

export async function fetchVotingRecords(
  ...args: Parameters<MCPClient['fetchVotingRecords']>
): ReturnType<MCPClient['fetchVotingRecords']> {
  return getDefaultClient().fetchVotingRecords(...args);
}

export async function fetchGovernmentDocuments(
  ...args: Parameters<MCPClient['fetchGovernmentDocuments']>
): ReturnType<MCPClient['fetchGovernmentDocuments']> {
  return getDefaultClient().fetchGovernmentDocuments(...args);
}

export async function fetchDocumentDetails(
  ...args: Parameters<MCPClient['fetchDocumentDetails']>
): ReturnType<MCPClient['fetchDocumentDetails']> {
  return getDefaultClient().fetchDocumentDetails(...args);
}

export async function enrichDocumentsWithContent(
  ...args: Parameters<MCPClient['enrichDocumentsWithContent']>
): ReturnType<MCPClient['enrichDocumentsWithContent']> {
  return getDefaultClient().enrichDocumentsWithContent(...args);
}
