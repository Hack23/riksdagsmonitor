/**
 * @module scripts/imf-fetch/weo-pipeline
 * @description Three-tier WEO fetch pipeline: Datamapper retry →
 * direct-Datamapper fallback → stale cache fallback.
 *
 * Extracted from the `weo` subcommand so the subcommand entry can
 * stay thin (≤ 150 lines per the refactor brief) while keeping the
 * full orchestration testable as a pure async function.
 *
 * The outer retry loop here is the single retry authority. The inner
 * `ImfClient` is constructed with `maxRetries=0` to avoid nesting two
 * retry layers (which would consume up to 9 requests per invocation).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { ImfClient } from '../imf/client.js';
import { ImfWeoSdmxOnlyError } from '../imf/errors/weo-sdmx-only.js';
import { IMF_WEO_DATAMAPPER_AVAILABLE } from '../imf/indicators/weo.js';
import {
  parseDatamapperValues,
  type DatamapperEnvelope,
} from '../imf/parsers/datamapper-envelope.js';
import { calculateRetryDelay } from '../imf/transport/retry.js';
import type { ImfDataPoint } from '../imf/types.js';
import { toDatamapperCode } from '../imf-codes.js';
import { buildFallbackPayload, isCacheStale, loadCachedIMFData } from './cache.js';
import { classifyImfFetchError, EMPTY_DATAMAPPER_SERIES_CODE } from './classifier.js';
import { createCliLogEvent, defaultCliLogger, type ImfCliLogEvent } from './logger.js';

/**
 * Max attempts in the outer retry loop. Combined with `maxRetries=0`
 * on the inner `ImfClient`, this caps total Datamapper requests per
 * invocation at 3 (plus the optional direct-Datamapper fallback).
 */
export const WEO_FETCH_MAX_ATTEMPTS = 3;

interface WeoCommandClient {
  readonly datamapperBaseURL: string;
  readonly userAgent: string;
  readonly timeout: number;
  readonly weoVintage: string;
  readonly sdmxSubscriptionKey?: string;
  getWeoIndicator(country: string, indicator: string, years: number): Promise<ImfDataPoint[]>;
  sdmxFetch(pathWithQuery: string): Promise<unknown>;
}

export interface FetchWeoPayloadOptions {
  readonly country: string;
  readonly indicator: string;
  readonly years: number;
}

export interface FetchWeoPayloadDeps {
  readonly client?: WeoCommandClient;
  readonly fetchFn?: typeof fetch;
  readonly sleepFn?: (ms: number) => Promise<void>;
  readonly logger?: (event: ImfCliLogEvent) => void;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWeoViaDirectDatamapper(
  client: WeoCommandClient,
  country: string,
  indicator: string,
  years: number,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<ImfDataPoint[]> {
  const code = toDatamapperCode(country);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), client.timeout);
  try {
    const response = await fetchFn(
      `${client.datamapperBaseURL}/${encodeURIComponent(indicator)}/${encodeURIComponent(code)}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': client.userAgent },
      },
    );
    if (!response.ok) {
      throw new Error(
        `Direct IMF Datamapper fallback failed: ${response.status} ${response.statusText}`,
      );
    }
    const raw = (await response.json()) as DatamapperEnvelope;
    return parseDatamapperValues(raw, indicator, code, client.weoVintage).slice(0, years);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function tryDirectDatamapperFallback(
  client: WeoCommandClient,
  options: FetchWeoPayloadOptions,
  fetchFn: typeof fetch,
  logger: (event: ImfCliLogEvent) => void,
): Promise<{ payload?: Record<string, unknown>; error?: unknown }> {
  const { country, indicator, years } = options;
  try {
    logger(
      createCliLogEvent(
        options,
        'warn',
        'direct-datamapper-fallback',
        'Retry budget exhausted — attempting direct Datamapper REST fallback',
        { transport: 'direct-datamapper', classification: 'transient' },
      ),
    );
    const series = await fetchWeoViaDirectDatamapper(client, country, indicator, years, fetchFn);
    if (series.length > 0) {
      logger(
        createCliLogEvent(
          options,
          'warn',
          'direct-datamapper-fallback-succeeded',
          `Recovered ${series.length} IMF data points via direct Datamapper REST fallback`,
          { transport: 'direct-datamapper' },
        ),
      );
      return {
        payload: { indicator, country, years, transport: 'direct-datamapper', dataPoints: series },
      };
    }
    throw new Error(
      `Direct IMF Datamapper fallback also returned an empty series for '${indicator}' (${country})`,
    );
  } catch (directErr: unknown) {
    logger(
      createCliLogEvent(
        options,
        'warn',
        'direct-datamapper-fallback-failed',
        directErr instanceof Error ? directErr.message : String(directErr),
        { transport: 'direct-datamapper', classification: classifyImfFetchError(directErr) },
      ),
    );
    return { error: directErr };
  }
}

async function attemptDatamapperFetch(
  client: WeoCommandClient,
  options: FetchWeoPayloadOptions,
  attempt: number,
  logger: (event: ImfCliLogEvent) => void,
): Promise<Record<string, unknown> | null> {
  const { country, indicator, years } = options;
  logger(
    createCliLogEvent(
      options,
      'info',
      'weo-fetch-attempt',
      `Fetching IMF WEO indicator via Datamapper (attempt ${attempt}/${WEO_FETCH_MAX_ATTEMPTS})`,
      { attempt, maxAttempts: WEO_FETCH_MAX_ATTEMPTS, transport: 'datamapper' },
    ),
  );
  const series = await client.getWeoIndicator(country, indicator, years);
  if (IMF_WEO_DATAMAPPER_AVAILABLE.has(indicator) && series.length === 0) {
    const emptyError = new Error(
      `IMF Datamapper returned an empty series for Datamapper-available WEO indicator '${indicator}' (${country})`,
    ) as Error & { code?: string };
    emptyError.code = EMPTY_DATAMAPPER_SERIES_CODE;
    throw emptyError;
  }
  logger(
    createCliLogEvent(
      options,
      'info',
      'weo-fetch-succeeded',
      `Fetched ${series.length} IMF data points via Datamapper`,
      { attempt, maxAttempts: WEO_FETCH_MAX_ATTEMPTS, transport: 'datamapper' },
    ),
  );
  return { indicator, country, years, transport: 'datamapper', dataPoints: series };
}

async function handleSdmxRouting(
  client: WeoCommandClient,
  options: FetchWeoPayloadOptions,
  err: ImfWeoSdmxOnlyError,
  attempt: number,
  logger: (event: ImfCliLogEvent) => void,
): Promise<Record<string, unknown>> {
  const { country, indicator, years } = options;
  logger(
    createCliLogEvent(
      options,
      'info',
      'weo-routed-to-sdmx',
      `Routing '${indicator}' via SDMX (${err.sdmxPath})`,
      { attempt, maxAttempts: WEO_FETCH_MAX_ATTEMPTS, transport: 'sdmx' },
    ),
  );
  const raw = await client.sdmxFetch(err.sdmxPath);
  return {
    indicator,
    country,
    years,
    transport: 'sdmx',
    sdmxPath: err.sdmxPath,
    sdmxResponse: raw,
  };
}

export async function fetchWeoPayload(
  options: FetchWeoPayloadOptions,
  deps: FetchWeoPayloadDeps = {},
): Promise<Record<string, unknown>> {
  const client = deps.client ?? new ImfClient({ maxRetries: 0 });
  const fetchFn = deps.fetchFn ?? globalThis.fetch;
  const sleepFn = deps.sleepFn ?? sleep;
  const logger = deps.logger ?? defaultCliLogger;
  const { indicator, country } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= WEO_FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      const payload = await attemptDatamapperFetch(client, options, attempt, logger);
      if (payload) return payload;
    } catch (err: unknown) {
      if (err instanceof ImfWeoSdmxOnlyError && client.sdmxSubscriptionKey) {
        return handleSdmxRouting(client, options, err, attempt, logger);
      }
      const classification = classifyImfFetchError(err);
      lastError = err;
      logger(
        createCliLogEvent(
          options,
          classification === 'transient' ? 'warn' : 'error',
          'weo-fetch-failed',
          err instanceof Error ? err.message : String(err),
          { attempt, maxAttempts: WEO_FETCH_MAX_ATTEMPTS, transport: 'datamapper', classification },
        ),
      );
      if (classification === 'transient' && attempt < WEO_FETCH_MAX_ATTEMPTS) {
        const delay = calculateRetryDelay(attempt - 1);
        logger(
          createCliLogEvent(options, 'info', 'weo-fetch-retrying', `Retrying after ${delay} ms backoff`, {
            attempt,
            maxAttempts: WEO_FETCH_MAX_ATTEMPTS,
            transport: 'datamapper',
            classification,
          }),
        );
        await sleepFn(delay);
        continue;
      }
      break;
    }
  }

  if (IMF_WEO_DATAMAPPER_AVAILABLE.has(indicator)) {
    const direct = await tryDirectDatamapperFallback(client, options, fetchFn, logger);
    if (direct.payload) return direct.payload;
    if (direct.error !== undefined) lastError = direct.error;
  }

  const cached = loadCachedIMFData(indicator, country);
  if (cached) {
    const stale = isCacheStale(cached.meta.fetchedAt);
    logger(
      createCliLogEvent(
        options,
        'warn',
        'weo-cache-fallback',
        `Live fetch failed; falling back to cached IMF data from ${cached.meta.fetchedAt}${stale ? ' (stale >6 months)' : ''}`,
        { transport: 'cache', classification: 'transient' },
      ),
    );
    return buildFallbackPayload(cached.data, lastError, cached.meta.fetchedAt, stale);
  }

  throw lastError ?? new Error(`IMF WEO fetch failed for ${indicator}/${country}`);
}
