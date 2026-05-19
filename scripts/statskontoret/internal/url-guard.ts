/**
 * @module scripts/statskontoret/internal/url-guard
 * @description Allowlist guard + URL resolver for Statskontoret outbound fetches.
 *
 * Shared by the HTTP client and the link extractor — both need to resolve
 * relative HREFs against the same base URL and reject hosts outside the
 * Statskontoret allowlist per the firewall contract documented in
 * `analysis/statskontoret/indicators-inventory.json`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { StatskontoretError } from '../errors.js';
import { STATSKONTORET_BASE_URL } from '../source-registry.js';
import { decodeHtml, trimTrailingSlash } from './text.js';

export function resolveStatskontoretUrl(url: string, baseURL: string): string {
  return new URL(decodeHtml(url), `${trimTrailingSlash(baseURL)}/`).toString();
}

/**
 * Validate that an outbound URL targets the Statskontoret allowlisted host
 * over HTTPS before issuing a fetch. Mirrors the firewall allowlist documented
 * in `analysis/statskontoret/indicators-inventory.json` so absolute URLs from
 * untrusted callers cannot redirect the client to arbitrary hosts.
 */
export function assertStatskontoretFetchTarget(
  url: string,
  baseURL: string = STATSKONTORET_BASE_URL,
): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new StatskontoretError(`Invalid Statskontoret URL: ${url}`, 'http');
  }
  if (parsed.protocol !== 'https:') {
    throw new StatskontoretError(`Statskontoret fetch must use https: ${url}`, 'http');
  }
  const allowedHost = new URL(baseURL).hostname;
  if (parsed.hostname !== allowedHost) {
    throw new StatskontoretError(
      `Statskontoret fetch host ${parsed.hostname} not in allowlist (${allowedHost})`,
      'http',
    );
  }
  return parsed;
}
