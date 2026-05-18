/**
 * @module mcp-client/transport/jsonrpc
 * @description JSON-RPC 2.0 transport base class for the MCP client stack.
 *
 * `MCPTransportClient` owns the wire-level concerns:
 *   - HTTP POST via `performPost` (fetch + Node.js fallback)
 *   - JSON-RPC 2.0 request framing + `tools/call` envelope
 *   - Exponential-backoff retry on transient transport errors
 *   - Lazy session re-init on session-init / rate-limit errors
 *   - Statistics tracking (`requests`, `errors`, `successRate`)
 *
 * Session bootstrap + SSE parsing live in `./session.ts`; retry primitives
 * live in `./retry.ts`. The orchestrating `MCPClient` in `../client.ts`
 * extends this base and wires per-domain method wrappers on top.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  MCPClientConfig,
  MCPStats,
  JsonRpcRequest,
  JsonRpcResponse,
} from '../../types/mcp.js';
import { performPost } from '../transport.js';
import { DEFAULT_MAX_RETRIES, DEFAULT_MCP_SERVER_URL, getDefaultTimeout } from '../config/defaults.js';
import { DEFAULT_MCP_AUTH_TOKEN } from '../config/auth.js';
import { calculateRetryDelay, isRetryableNetworkError } from './retry.js';
import { initializeSession, parseSSEResponse, type SessionInitContext } from './session.js';

/** Module-scoped JSON-RPC id counter — monotonically increasing across instances. */
let jsonRpcId = 1;

/**
 * Wire-level MCP transport. Domain-agnostic JSON-RPC 2.0 client with
 * retry, SSE parsing, and lazy session bootstrap.
 */
export class MCPTransportClient implements SessionInitContext {
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

  /** SessionInitContext glue — returns the next monotonic JSON-RPC id. */
  nextJsonRpcId(): number {
    return jsonRpcId++;
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
      const jsonRpcRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: jsonRpcId++,
        method: 'tools/call',
        params: { name: tool, arguments: params },
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

      if (retryCount < this.maxRetries - 1 && isRetryableNetworkError(err)) {
        const delay = calculateRetryDelay(retryCount);
        console.warn(
          `⚠️ Request failed (${err.message.substring(0, 60)}), retrying after ${delay}ms (${retryCount + 1}/${this.maxRetries - 1})...`,
        );
        this.sessionId = null;
        await this.sleep(delay);
        return this.request(tool, params, retryCount + 1);
      }

      this.errorCount++;
      throw new Error(this.formatRequestFailure(err, errorMsg), { cause: error });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Compose the `MCP request failed: …` message with troubleshooting tips. */
  private formatRequestFailure(err: Error, errorMsg: string): string {
    let message = `MCP request failed: ${err.message}`;
    if (err.name === 'AbortError' || errorMsg.includes('timeout')) {
      message += `\n\n💡 Troubleshooting tips:
  - The MCP server may be cold starting (Render.com free tier)
  - Try increasing timeout or waiting a few minutes
  - Server URL: ${this.baseURL}
  - Consider running workflow again in 5-10 minutes`;
    } else if (
      errorMsg.includes('network') ||
      errorMsg.includes('econnrefused') ||
      errorMsg.includes('fetch failed')
    ) {
      message += `\n\n💡 Troubleshooting tips:
  - Check if MCP server is accessible: ${this.baseURL}
  - Verify network connectivity
  - The server may be temporarily unavailable
  - Try manual workflow dispatch with force_generation=true`;
    }
    return message;
  }

  // -----------------------------------------------------------------------
  // Session / utility delegators
  // -----------------------------------------------------------------------

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  parseSSEResponse(text: string): JsonRpcResponse {
    return parseSSEResponse(text);
  }

  async initializeSession(): Promise<void> {
    return initializeSession(this);
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
