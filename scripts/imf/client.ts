/**
 * @module imf/client
 * @description IMF public-data REST client orchestrator.
 *
 * Composes the Datamapper transport (unauth) and SDMX 3.0 transport
 * (auth) into a single ergonomic surface for article workflows. Each
 * concern lives in a dedicated submodule:
 *
 *  - `config/defaults.ts`     — base URLs, timeouts, WEO vintage
 *  - `config/auth.ts`         — IMF_SDMX_SUBSCRIPTION_KEY resolver (sole reader)
 *  - `transport/datamapper.ts`— Datamapper REST fetch + parse
 *  - `transport/sdmx.ts`      — SDMX 3.0 REST passthrough
 *  - `transport/retry.ts`     — exponential back-off + Retry-After cap
 *  - `errors/`                — `ImfHttpError`, `ImfWeoSdmxOnlyError`
 *  - `indicators/`            — WEO + FM + COFOG catalogues
 *  - `parsers/`               — Datamapper envelope → ImfDataPoint
 *
 * The class itself is intentionally thin (orchestration only).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { resolveSdmxSubscriptionKey } from './config/auth.js';
import {
  DEFAULT_DATAMAPPER_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_SDMX_BASE_URL,
  DEFAULT_TIMEOUT,
  DEFAULT_USER_AGENT,
  DEFAULT_WEO_VINTAGE,
} from './config/defaults.js';
import { ImfHttpError } from './errors/http-error.js';
import {
  fetchDatamapperIndicators,
  fetchDatamapperWeoIndicator,
} from './transport/datamapper.js';
import { isTransientFetchError } from './transport/retry.js';
import { sdmxFetch as transportSdmxFetch } from './transport/sdmx.js';
import type { ImfDatamapperIndicatorMeta } from './parsers/datamapper-envelope.js';
import type {
  ImfBatchIndicatorErrorEvent,
  ImfClientConfig,
  ImfDataPoint,
} from './types.js';

/**
 * HTTP client for IMF public data APIs.
 *
 * Primary surface:
 *  - `getWeoIndicator(iso3, weoCode, years?)` — fetch time series
 *  - `compareCountriesWeo(codes, weoCode)` — peer-set latest values
 *  - `getLatestWeoIndicator(iso3, weoCode)` — most recent data point
 *  - `sdmxFetch(path)` — full SDMX 3.0 surface (auth)
 *  - `listDatamapperIndicators()` — live Datamapper catalog (132 entries)
 */
export class ImfClient {
  readonly datamapperBaseURL: string;
  readonly sdmxBaseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly weoVintage: string;
  readonly userAgent: string;
  /**
   * Resolved IMF SDMX subscription key. Empty string when neither the
   * constructor option nor `IMF_SDMX_SUBSCRIPTION_KEY` is set — SDMX
   * requests still go out so probes can detect "no key" vs "outage".
   */
  readonly sdmxSubscriptionKey: string;
  private readonly onBatchIndicatorError?: (event: ImfBatchIndicatorErrorEvent) => void;

  constructor(config: ImfClientConfig = {}) {
    this.datamapperBaseURL = config.datamapperBaseURL ?? DEFAULT_DATAMAPPER_BASE_URL;
    this.sdmxBaseURL = config.sdmxBaseURL ?? DEFAULT_SDMX_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.userAgent = config.userAgent ?? DEFAULT_USER_AGENT;
    this.weoVintage = config.weoVintage ?? DEFAULT_WEO_VINTAGE;
    this.sdmxSubscriptionKey = resolveSdmxSubscriptionKey(config.sdmxSubscriptionKey);
    this.onBatchIndicatorError = config.onBatchIndicatorError;
  }

  /**
   * Fetch a WEO time series for one country via the Datamapper.
   *
   * @param iso3 ISO-3 alpha-3 country code (Datamapper native format)
   * @param weoCode WEO indicator code (see `IMF_WEO_INDICATORS`)
   * @param years How many most-recent years to return (default 10)
   */
  async getWeoIndicator(
    iso3: string,
    weoCode: string,
    years = 10,
  ): Promise<ImfDataPoint[]> {
    return fetchDatamapperWeoIndicator(iso3, weoCode, years, {
      baseURL: this.datamapperBaseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      userAgent: this.userAgent,
      weoVintage: this.weoVintage,
    });
  }

  /**
   * Fetch the IMF Datamapper indicator catalog (~132 entries).
   * Use to discover any of the Datamapper-addressable indicators at
   * runtime. Codes outside the catalog require `sdmxFetch`.
   */
  async listDatamapperIndicators(): Promise<Map<string, ImfDatamapperIndicatorMeta>> {
    return fetchDatamapperIndicators({
      baseURL: this.datamapperBaseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      userAgent: this.userAgent,
      weoVintage: this.weoVintage,
    });
  }

  /**
   * Fetch several WEO indicators for the **same** country sequentially.
   * Failures on individual indicators map to an empty array so a
   * single flaky series does not poison the whole batch.
   */
  async getWeoIndicatorsBatch(
    iso3: string,
    weoCodes: readonly string[],
    years = 10,
  ): Promise<Map<string, readonly ImfDataPoint[]>> {
    if (years < 1 || !Number.isInteger(years)) {
      throw new Error(`getWeoIndicatorsBatch: 'years' must be a positive integer, got ${years}`);
    }

    const out = new Map<string, readonly ImfDataPoint[]>();
    for (const weoCode of weoCodes) {
      try {
        const series = await this.getWeoIndicator(iso3, weoCode, years);
        out.set(weoCode, series);
      } catch (error) {
        if (isTransientFetchError(error) || (error instanceof ImfHttpError && error.retryable)) {
          this.onBatchIndicatorError?.({ countryCode: iso3, indicatorId: weoCode, error });
          out.set(weoCode, []);
          continue;
        }
        throw error;
      }
    }
    return out;
  }

  /**
   * Fetch the latest available data point for one country. Returns
   * the most recent historical value when available, otherwise the
   * most recent projection.
   */
  async getLatestWeoIndicator(
    iso3: string,
    weoCode: string,
  ): Promise<ImfDataPoint | null> {
    const series = await this.getWeoIndicator(iso3, weoCode, 15);
    if (series.length === 0) return null;
    const history = series.filter((p) => !p.projection);
    return history[0] ?? series[0];
  }

  /**
   * Compare an indicator across multiple countries. Fetches
   * sequentially to respect IMF rate limits. Unknown / failed
   * countries map to `null`.
   */
  async compareCountriesWeo(
    iso3Codes: readonly string[],
    weoCode: string,
  ): Promise<Map<string, ImfDataPoint | null>> {
    const out = new Map<string, ImfDataPoint | null>();
    for (const code of iso3Codes) {
      try {
        const latest = await this.getLatestWeoIndicator(code, weoCode);
        out.set(code, latest);
      } catch {
        out.set(code, null);
      }
    }
    return out;
  }

  /**
   * Low-level SDMX 3.0 passthrough. Returns the raw JSON envelope.
   * Includes the `Ocp-Apim-Subscription-Key` header iff
   * `sdmxSubscriptionKey` is set.
   */
  async sdmxFetch(pathWithQuery: string): Promise<unknown> {
    return transportSdmxFetch(pathWithQuery, {
      baseURL: this.sdmxBaseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      userAgent: this.userAgent,
      subscriptionKey: this.sdmxSubscriptionKey,
    });
  }
}

let defaultImfClient: ImfClient | null = null;

/** Get or create the default singleton `ImfClient`. */
export function getDefaultImfClient(): ImfClient {
  if (!defaultImfClient) {
    defaultImfClient = new ImfClient();
  }
  return defaultImfClient;
}
