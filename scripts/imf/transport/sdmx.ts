/**
 * @module imf/transport/sdmx
 * @description IMF SDMX 3.0 REST transport (authenticated).
 *
 * SDMX 3.0 is the full IMF catalogue (IFS / BOP / DOTS / GFS_COFOG /
 * FM / MFS_IR / PCPS / ER / full WEO 9.0.0). Every `/data/...` request
 * must carry the `Ocp-Apim-Subscription-Key` header — the IMF Azure
 * APIM gateway masks missing-key responses as **HTTP 404**, see
 * `errors/http-error.ts` for the disambiguation logic.
 *
 * The auth key is read **only** in `config/auth.ts` — this module
 * receives it via parameter, never `process.env` directly.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { normalizeSdmxPathForBase } from './path-normaliser.js';
import { fetchWithRetry } from './fetch-with-retry.js';

export interface SdmxTransportOptions {
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly userAgent: string;
  /** Empty string when no key configured — request still goes out so probes can detect it. */
  readonly subscriptionKey: string;
}

/**
 * Low-level SDMX 3.0 passthrough. Returns the raw JSON envelope from
 * the IMF SDMX endpoint. Consumers are responsible for interpreting
 * the SDMX dataMessage.
 *
 * @param pathWithQuery URL path starting with `/data/...` or `/structure/...`,
 *   optionally followed by a `?...` query string.
 */
export async function sdmxFetch(
  pathWithQuery: string,
  options: SdmxTransportOptions,
): Promise<unknown> {
  const normalized = normalizeSdmxPathForBase(options.baseURL, pathWithQuery);
  const separator = normalized.startsWith('/') ? '' : '/';
  const url = `${options.baseURL}${separator}${normalized}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.sdmx.data+json;version=2.0.0',
  };
  if (options.subscriptionKey) {
    headers['Ocp-Apim-Subscription-Key'] = options.subscriptionKey;
  }
  return fetchWithRetry(url, {
    timeout: options.timeout,
    maxRetries: options.maxRetries,
    userAgent: options.userAgent,
    extraHeaders: headers,
  });
}
