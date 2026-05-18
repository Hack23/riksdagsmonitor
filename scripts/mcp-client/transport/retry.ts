/**
 * @module mcp-client/transport/retry
 * @description Exponential-backoff retry primitives shared by the MCPClient
 * JSON-RPC request stack.
 *
 * NOTE: The retry policy mirrors `scripts/imf-client.ts` (see
 * Hack23/riksdagsmonitor#2580). Convergence into a single, shared retry
 * library is intentionally deferred: this issue (#2578) keeps the
 * boundaries disjoint to avoid a merge surface with the IMF refactor
 * (#2580). Once both ship, the two retry stacks should be unified under
 * `scripts/lib/retry.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { RETRY_DELAY } from '../config/defaults.js';

/**
 * Compute the delay (ms) before the Nth retry, using a 2^N exponential
 * backoff anchored on {@link RETRY_DELAY}.
 *
 * `retryCount` is the zero-indexed attempt counter (0 = first retry).
 */
export function calculateRetryDelay(retryCount: number): number {
  return RETRY_DELAY * Math.pow(2, Math.max(0, retryCount));
}

/**
 * Error signatures the MCPClient retries on. Used by the JSON-RPC
 * dispatcher to decide whether to re-issue a failed call.
 *
 * Retried causes:
 *   - `AbortError` — timeout-induced AbortController abort.
 *   - `network` / `econnrefused` / `connection closed` — transient TCP/IP
 *     or sandbox-firewall hiccup.
 *   - `too many requests` — upstream rate-limit; bounded retry.
 */
export function isRetryableNetworkError(err: Error): boolean {
  const errorMsg = (err.message ?? '').toLowerCase();
  return (
    err.name === 'AbortError' ||
    errorMsg.includes('network') ||
    errorMsg.includes('econnrefused') ||
    errorMsg.includes('connection closed') ||
    errorMsg.includes('too many requests')
  );
}
