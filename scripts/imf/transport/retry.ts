/**
 * @module imf/transport/retry
 * @description Single retry policy for IMF transport (Datamapper + SDMX).
 *
 * Strategy:
 *  - Base schedule is exponential: 1 s → 2 s → 4 s (attempt 0/1/2).
 *  - When the server supplies a `Retry-After` header (delta-seconds),
 *    honour it, capped at {@link RETRY_AFTER_CAP_MS} to avoid pathological
 *    multi-minute sleeps from a misbehaving origin (matches
 *    THREAT_MODEL.md TB-6a — resource-exhaustion via cooperative back-off).
 *  - Invalid / non-positive `Retry-After` values fall back to the
 *    exponential schedule.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { ImfHttpError } from '../errors/http-error.js';

/** Base delay (ms) for the exponential back-off used on 429 / 5xx / network errors. */
const RETRY_BASE_DELAY_MS = 1_000;

/**
 * Cap applied to a server-supplied `Retry-After` header so that a
 * misbehaving origin cannot pin the client in a multi-minute sleep.
 * Matches THREAT_MODEL.md TB-6a (resource-exhaustion via cooperative
 * back-off). **MUST remain 30_000** — asserted by unit test.
 */
export const RETRY_AFTER_CAP_MS = 30_000;

const NETWORK_TYPE_ERROR_PATTERNS = [
  /fetch failed/i,
  /failed to fetch/i,
  /network/i,
  /load failed/i,
] as const;

/**
 * Compute the retry delay (milliseconds) for a given attempt number.
 *
 * Exported to keep the retry math verifiable without spinning up an HTTP stub.
 */
export function calculateRetryDelay(
  attempt: number,
  retryAfterHeader?: string | null,
): number {
  const exponential = RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempt);
  if (!retryAfterHeader) return exponential;
  const retryAfterSec = Number.parseInt(retryAfterHeader, 10);
  if (!Number.isFinite(retryAfterSec) || retryAfterSec <= 0) return exponential;
  return Math.min(retryAfterSec * 1_000, RETRY_AFTER_CAP_MS);
}

/** Whether the error indicates a transient transport failure (network / abort). */
export function isTransientFetchError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return NETWORK_TYPE_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
  }
  if (error instanceof Error) return error.name === 'AbortError';
  return false;
}

/** Whether the error should be retried under the IMF retry policy. */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ImfHttpError) {
    return error.retryable;
  }
  return isTransientFetchError(error);
}
