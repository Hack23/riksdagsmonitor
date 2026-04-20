/**
 * @module IMF/Client
 * @description TypeScript REST client for IMF public data APIs.
 *
 * Covers two transports, both public and unauthenticated:
 *
 * 1. **Datamapper JSON** (`https://www.imf.org/external/datamapper/api/v1`)
 *    — simple JSON, best for World Economic Outlook (WEO) headline
 *    indicators and projections. Matches the ergonomics of our existing
 *    `world-bank-client.ts` pattern.
 *
 * 2. **SDMX 3.0** (`https://api.imf.org/external/sdmx/3.0`) — full IMF
 *    catalogue (IFS, BOP, GFS_COFOG, FM, MFS_*, FSIC, DOTS, PCPS). The
 *    `sdmxFetch()` method is a thin passthrough for callers that need
 *    broader coverage than the Datamapper WEO surface.
 *
 * The client mirrors the safety posture of `world-bank-client.ts`:
 *  - deterministic timeouts
 *  - exponential back-off on 5xx / 429
 *  - no credentials stored or transmitted (all IMF data is public)
 *
 * Rate-limit discipline: IMF advertises ~10 requests / 5 s. The client
 * defaults to `maxRetries=2` and delays 1 s on the first retry, 2 s on
 * the second; consumers that batch in tight loops should additionally
 * insert their own cooperative throttling.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 * @see https://data.imf.org/api/documentation
 */

import { toDatamapperCode } from './imf-codes.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single IMF data point. Shape mirrors `WorldBankDataPoint` so that the
 * provider-agnostic `economic-context` helpers can consume either source
 * interchangeably.
 */
export interface ImfDataPoint {
  readonly countryCode: string;
  readonly countryName: string;
  readonly indicatorId: string;
  readonly indicatorName: string;
  readonly date: string;
  readonly value: number;
  /** True when the value is a projection (future year in the release vintage). */
  readonly projection: boolean;
  /** Release vintage tag (e.g. 'WEO-2026-04'). Present for projection-bearing releases. */
  readonly projectionVintage?: string;
  /** Provider tag — always 'imf' for this client. */
  readonly provider: 'imf';
}

/** Client configuration */
export interface ImfClientConfig {
  /** Override for the Datamapper base URL (for testing). */
  readonly datamapperBaseURL?: string;
  /** Override for the SDMX 3.0 base URL (for testing). */
  readonly sdmxBaseURL?: string;
  /** Request timeout in ms. Default 15_000. */
  readonly timeout?: number;
  /** Max retry count for transient failures. Default 2. */
  readonly maxRetries?: number;
  /**
   * Optional WEO vintage tag to stamp on every projection returned by
   * `getWeoIndicator`. Defaults to the current WEO cycle — update in
   * April / October when the IMF publishes a new flagship release.
   */
  readonly weoVintage?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_DATAMAPPER_BASE_URL = 'https://www.imf.org/external/datamapper/api/v1';
const DEFAULT_SDMX_BASE_URL = 'https://api.imf.org/external/sdmx/3.0';
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_RETRIES = 2;
/** Default vintage. Update in April / October when the WEO re-releases. */
const DEFAULT_WEO_VINTAGE = 'WEO-2026-04';

/**
 * Canonical IMF indicator IDs used by Riksdagsmonitor articles. Each
 * entry is addressable via the Datamapper (`/{indicatorId}`) — the
 * WEO subset — or SDMX 3.0 via `ImfClient.sdmxFetch()` (database='WEO',
 * indicator=code).
 */
export const IMF_WEO_INDICATORS = {
  /** Real GDP growth, annual % change — headline macro indicator. */
  gdpGrowth: 'NGDP_RPCH',
  /** Nominal GDP, current USD. */
  gdpUsd: 'NGDPD',
  /** GDP per capita, current USD. */
  gdpPerCapita: 'NGDPDPC',
  /** Inflation, average consumer prices, annual % change. */
  inflationCpi: 'PCPIPCH',
  /** Unemployment rate, % of total labor force. */
  unemployment: 'LUR',
  /** General government gross debt, % of GDP. */
  generalGovGrossDebt: 'GGXWDG_NGDP',
  /** General government revenue, % of GDP. */
  generalGovRevenue: 'GGR_NGDP',
  /** General government total expenditure, % of GDP. */
  generalGovExpenditure: 'GGX_NGDP',
  /** General government net lending / borrowing, % of GDP. */
  generalGovBalance: 'GGXCNL_NGDP',
  /** Current account balance, % of GDP. */
  currentAccountBalance: 'BCA_NGDPD',
  /** Volume of exports of goods and services, annual % change. */
  exportsVolumeGrowth: 'TX_RPCH',
  /** Population (millions). */
  population: 'LP',
} as const;

/** Commonly-referenced IMF Fiscal Monitor (FM) indicators. */
export const IMF_FM_INDICATORS = {
  /** General government gross debt, % of GDP (FM vintage — may differ slightly from WEO). */
  generalGovGrossDebtFm: 'GGXWDG_NGDP',
  /** General government primary balance, % of GDP. */
  primaryBalance: 'GGXONLB_NGDP',
} as const;

// ---------------------------------------------------------------------------
// Raw Datamapper response shape
// ---------------------------------------------------------------------------

/** Shape of the IMF Datamapper JSON response (partial). */
interface DatamapperResponse {
  values?: {
    [indicatorId: string]: {
      [countryCode: string]: {
        [year: string]: number | string | null;
      };
    };
  };
}

// ---------------------------------------------------------------------------
// ImfClient class
// ---------------------------------------------------------------------------

/**
 * HTTP client for IMF public data APIs.
 *
 * Primary surface:
 *  - `getWeoIndicator(iso3, weoCode, years?)` — fetch time series for a
 *    country from the WEO Datamapper
 *  - `compareCountriesWeo(codes, weoCode)` — latest value across a peer
 *    set, ideal for Nordic comparisons
 *  - `getLatestWeoIndicator(iso3, weoCode)` — most recent data point
 *
 * The SDMX 3.0 path is exposed via `sdmxFetch()` for advanced use
 * (IFS / BOP / FM / GFS / DOTS / MFS / FSIC / PCPS). Agentic article
 * workflows invoke this client through the `scripts/imf-fetch.ts` CLI
 * via the `bash` tool (commands: `weo`, `compare`, `sdmx`,
 * `list-indicators`).
 */
export class ImfClient {
  readonly datamapperBaseURL: string;
  readonly sdmxBaseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly weoVintage: string;

  constructor(config: ImfClientConfig = {}) {
    this.datamapperBaseURL = config.datamapperBaseURL ?? DEFAULT_DATAMAPPER_BASE_URL;
    this.sdmxBaseURL = config.sdmxBaseURL ?? DEFAULT_SDMX_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.weoVintage = config.weoVintage ?? DEFAULT_WEO_VINTAGE;
  }

  /**
   * Fetch a WEO time series for one country.
   *
   * The Datamapper returns all years the IMF has for that indicator /
   * country, mixing history and projections. Projection years are
   * determined relative to the current calendar year: any year greater
   * than the current year is flagged `projection: true`.
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
    if (years < 1 || !Number.isInteger(years)) {
      throw new Error(`getWeoIndicator: 'years' must be a positive integer, got ${years}`);
    }
    const code = toDatamapperCode(iso3);
    // IMF Datamapper URL pattern: /{indicator}/{country}
    const url = `${this.datamapperBaseURL}/${encodeURIComponent(weoCode)}/${encodeURIComponent(code)}`;
    const raw = (await this.fetchWithRetry(url)) as DatamapperResponse;

    const indicatorNode = raw?.values?.[weoCode];
    if (!indicatorNode) return [];
    const countryNode = indicatorNode[code];
    if (!countryNode) return [];

    const currentYear = new Date().getUTCFullYear();
    const points: ImfDataPoint[] = [];
    for (const [year, rawValue] of Object.entries(countryNode)) {
      // Defensive: IMF can emit null / 'n/a' / undefined for missing
      // observations. `Number(null)` === 0, which would silently inject
      // a bogus zero into the chart — gate on explicit null/undefined
      // and then on NaN from string coercion.
      if (rawValue === null || rawValue === undefined) continue;
      const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
      if (!Number.isFinite(numeric)) continue;
      const yearInt = Number.parseInt(year, 10);
      if (!Number.isFinite(yearInt)) continue;
      const isProjection = yearInt > currentYear;
      const dp: ImfDataPoint = {
        countryCode: code,
        countryName: code, // Datamapper does not return the display name; callers overlay this from COUNTRY_NAMES_EN
        indicatorId: weoCode,
        indicatorName: weoCode,
        date: year,
        value: numeric,
        projection: isProjection,
        provider: 'imf',
        ...(isProjection ? { projectionVintage: this.weoVintage } : {}),
      };
      points.push(dp);
    }

    // Sort by year desc, then truncate to the requested horizon.
    points.sort((a, b) => Number.parseInt(b.date, 10) - Number.parseInt(a.date, 10));
    return points.slice(0, years);
  }

  /**
   * Convenience: fetch the latest available data point for one country.
   * Returns the most recent historical (non-projection) value when
   * available, otherwise the most recent projection.
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
   * Compare an indicator across multiple countries. Fetches sequentially
   * to respect IMF rate limits. Unknown / failed countries map to `null`.
   *
   * @param iso3Codes ISO-3 country codes (e.g. ['SWE', 'DNK', 'NOR'])
   * @param weoCode WEO indicator code
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
   * Low-level SDMX 3.0 passthrough. Returns the raw JSON from the IMF
   * SDMX endpoint. Consumers are responsible for interpreting the SDMX
   * envelope.
   *
   * @param path URL path starting with `/data/...` or `/structure/...`
   */
  async sdmxFetch(pathWithQuery: string): Promise<unknown> {
    const separator = pathWithQuery.startsWith('/') ? '' : '/';
    const url = `${this.sdmxBaseURL}${separator}${pathWithQuery}`;
    return this.fetchWithRetry(url, 0, { Accept: 'application/vnd.sdmx.data+json;version=2.0.0' });
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async fetchWithRetry(
    url: string,
    attempt = 0,
    extraHeaders: Record<string, string> = {},
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', ...extraHeaders },
      });

      if (response.status === 429 && attempt < this.maxRetries) {
        // Respect IMF advertised rate limit (~10 req / 5 s).
        const delay = 1_000 * (attempt + 1) + 1_000;
        clearTimeout(timeoutId);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, attempt + 1, extraHeaders);
      }

      if (!response.ok) {
        throw new Error(`IMF API error: ${response.status} ${response.statusText} for ${url}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = 1_000 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, attempt + 1, extraHeaders);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let defaultImfClient: ImfClient | null = null;

/** Get or create the default singleton `ImfClient`. */
export function getDefaultImfClient(): ImfClient {
  if (!defaultImfClient) {
    defaultImfClient = new ImfClient();
  }
  return defaultImfClient;
}
