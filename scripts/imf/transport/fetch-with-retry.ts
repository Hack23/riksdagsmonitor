/**
 * @module imf/transport/fetch-with-retry
 * @description Shared HTTP fetch primitive for IMF transport layers.
 *
 * Datamapper (unauth) and SDMX (auth) differ in headers but share the
 * exact same timeout + retry + error-classification machinery. Keep
 * that machinery here so the transport modules can stay thin and
 * focused on URL building / envelope shape.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { ImfHttpError } from '../errors/http-error.js';
import { calculateRetryDelay, isRetryableError } from './retry.js';

export interface FetchWithRetryOptions {
  readonly timeout: number;
  readonly maxRetries: number;
  readonly userAgent: string;
  readonly extraHeaders?: Record<string, string>;
}

/**
 * GET `url` with exponential back-off retry on 429 / 5xx / network
 * errors. Throws {@link ImfHttpError} on non-OK responses.
 *
 * The `extraHeaders` map is the auth boundary: Datamapper transport
 * passes `{}` (no subscription key) and SDMX transport injects the
 * `Ocp-Apim-Subscription-Key` header here. This helper itself does
 * NOT validate the contents of `extraHeaders` — the
 * "Datamapper transport never carries an SDMX subscription key"
 * convention is enforced at the call sites (see
 * `scripts/imf/transport/datamapper.ts`) and asserted by the
 * "IMF SDMX subscription key auth boundary" static-source scan in
 * `tests/imf/refactor-invariants.test.ts`.
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions,
  attempt = 0,
): Promise<unknown> {
  const { timeout, maxRetries, userAgent, extraHeaders = {} } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent,
        ...extraHeaders,
      },
    });

    if (!response.ok) {
      const sentSubscriptionKey = 'Ocp-Apim-Subscription-Key' in extraHeaders;
      throw new ImfHttpError(response, url, sentSubscriptionKey);
    }

    return await response.json();
  } catch (error) {
    const retryAfterHeader = error instanceof ImfHttpError ? error.retryAfterHeader : undefined;
    if (attempt < maxRetries && isRetryableError(error)) {
      const delay = calculateRetryDelay(attempt, retryAfterHeader);
      clearTimeout(timeoutId);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
