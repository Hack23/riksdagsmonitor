/**
 * @module mcp-client/transport/jsonrpc
 * @description JSON-RPC 2.0 transport base class for the MCP client stack.
 *
 * `MCPTransportClient` owns the wire-level orchestration:
 *   - HTTP POST via `performPost` (fetch + Node.js fallback)
 *   - JSON-RPC 2.0 `tools/call` envelope (built in `./request-builder.ts`)
 *   - Response parsing + gateway payload dereferencing (`./response-parser.ts`)
 *   - JSON-RPC error envelope classification (`./error-envelope.ts`)
 *   - Exponential-backoff retry on transient transport errors (`./retry.ts`)
 *   - Lazy session re-init on session-init / rate-limit errors (`./session.ts`)
 *   - Statistics tracking (`requests`, `errors`, `successRate`)
 *
 * The orchestrating `MCPClient` in `../client.ts` extends this base and wires
 * per-domain method wrappers on top.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  MCPClientConfig,
  MCPStats,
  JsonRpcResponse,
} from '../../types/mcp.js';
import { performPost } from '../transport.js';
import { DEFAULT_MAX_RETRIES, DEFAULT_MCP_SERVER_URL, getDefaultTimeout } from '../config/defaults.js';
import { DEFAULT_MCP_AUTH_TOKEN } from '../config/auth.js';
import { calculateRetryDelay, isRetryableNetworkError } from './retry.js';
import { initializeSession, parseSSEResponse, type SessionInitContext } from './session.js';
import {
  assertValidToolName,
  buildJsonRpcRequest,
  buildRequestHeaders,
  nextJsonRpcId,
} from './request-builder.js';
import { parseJsonRpcEnvelope, resolveResultContent } from './response-parser.js';
import { classifyJsonRpcError, formatRequestFailure } from './error-envelope.js';

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
    return nextJsonRpcId();
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
    assertValidToolName(tool);

    if (retryCount === 0) {
      this.requestCount++;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const jsonRpcRequest = buildJsonRpcRequest(tool, params);

      if (this.authToken && !this.sessionId) {
        try {
          await this.initializeSession();
        } catch {
          // Session init is optional
        }
      }

      const headers = buildRequestHeaders(this.customHeaders, this.authToken, this.sessionId);

      const response = await performPost(
        this.baseURL,
        headers,
        JSON.stringify(jsonRpcRequest),
        controller.signal,
      );

      if (!response.ok) {
        let errorBody = '';
        try { errorBody = await response.text(); } catch { /* ignore */ }
        throw new Error(
          `MCP server error: ${response.status} ${response.statusText}${errorBody ? ' - ' + errorBody : ''}`,
        );
      }

      const jsonRpcResponse: JsonRpcResponse = await parseJsonRpcEnvelope(response);
      const errorOutcome = classifyJsonRpcError(jsonRpcResponse);

      if (errorOutcome.kind === 'session_init' && retryCount < 2) {
        this.sessionId = null;
        const delay = (retryCount + 1) * 2000;
        console.warn(`⚠️ Session error, re-initializing after ${delay}ms...`);
        await this.sleep(delay);
        await this.initializeSession();
        return this.request(tool, params, retryCount + 1);
      }
      if (errorOutcome.kind !== 'none') {
        throw new Error(errorOutcome.message);
      }

      const result = (jsonRpcResponse.result ?? {}) as Record<string, unknown>;
      return resolveResultContent(result);
    } catch (error: unknown) {
      const err = error as Error;

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
      throw new Error(formatRequestFailure(err, this.baseURL), { cause: error });
    } finally {
      clearTimeout(timeoutId);
    }
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
