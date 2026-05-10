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
  /**
   * User-Agent sent to IMF HTTP endpoints. Akamai currently rejects Node's
   * default undici user-agent on the Datamapper API with HTTP 403, while
   * browser/curl-style user-agents succeed.
   */
  readonly userAgent?: string;
  /** Max retry count for transient failures. Default 2. */
  readonly maxRetries?: number;
  /**
   * Optional WEO vintage tag to stamp on every projection returned by
   * `getWeoIndicator`. Defaults to the current WEO cycle — update in
   * April / October when the IMF publishes a new flagship release.
   */
  readonly weoVintage?: string;
  /**
   * IMF Data SDMX API subscription key, sent as the
   * `Ocp-Apim-Subscription-Key` header on every {@link ImfClient.sdmxFetch}
   * call. The Datamapper transport (`getWeoIndicator` etc.) is NOT
   * authenticated and never receives this header.
   *
   * If omitted the client falls back to `process.env.IMF_SDMX_SUBSCRIPTION_KEY`.
   * If neither is set, SDMX requests still go out (so connectivity probes can
   * detect a "no key configured" state) but the IMF Azure APIM gateway will
   * return HTTP 401, which {@link ImfHttpError} surfaces with a diagnostic
   * "subscription key missing or invalid" message.
   *
   * Confirmed via curl 2026-05-10: every SDMX 3.0/2.1 `/data/...` endpoint
   * now requires this header (returns HTTP 404 from APIM when missing).
   * `/structure/...` endpoints remain public.
   */
  readonly sdmxSubscriptionKey?: string;
  /**
   * Optional diagnostic hook invoked when `getWeoIndicatorsBatch()` fail-softs
   * one indicator to an empty series because the IMF transport/API call failed.
   * The default is no-op so callers can opt in without polluting JSON stdout.
   */
  readonly onBatchIndicatorError?: (event: ImfBatchIndicatorErrorEvent) => void;
}

/** Diagnostic payload for one fail-softed `getWeoIndicatorsBatch()` item. */
export interface ImfBatchIndicatorErrorEvent {
  readonly countryCode: string;
  readonly indicatorId: string;
  readonly error: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_DATAMAPPER_BASE_URL = 'https://www.imf.org/external/datamapper/api/v1';
const DEFAULT_SDMX_BASE_URL = 'https://api.imf.org/external/sdmx/3.0';
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; Riksdagsmonitor; +https://riksdagsmonitor.com)';
/** Default vintage. Update in April / October when the WEO re-releases. */
const DEFAULT_WEO_VINTAGE = 'WEO-2026-04';

/** Base delay (ms) for the exponential back-off used on 429 / 5xx / network errors. */
const RETRY_BASE_DELAY_MS = 1_000;
/**
 * Cap applied to a server-supplied `Retry-After` header so that a
 * misbehaving origin cannot pin the client in a multi-minute sleep.
 * Matches THREAT_MODEL.md TB-6a (resource-exhaustion via cooperative back-off).
 */
const RETRY_AFTER_CAP_MS = 30_000;
const NETWORK_TYPE_ERROR_PATTERNS = [
  /fetch failed/i,
  /failed to fetch/i,
  /network/i,
  /load failed/i,
] as const;

/**
 * Canonical IMF indicator IDs used by Riksdagsmonitor articles.
 *
 * **Logical WEO surface** — these are the codes article workflows cite as
 * `WEO:<code>`. Some are addressable via the simple Datamapper JSON
 * transport (see {@link IMF_WEO_DATAMAPPER_AVAILABLE}); the rest only
 * live in the full WEO 9.0.0 SDMX dataflow (`IMF.RES,WEO,9.0.0`) and
 * require {@link ImfClient.sdmxFetch} with the
 * `IMF_SDMX_SUBSCRIPTION_KEY` set. The WEO release cadence is twice a
 * year (April + October) — bump {@link DEFAULT_WEO_VINTAGE} accordingly.
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
  /** General government revenue, % of GDP. SDMX-only on Datamapper as of WEO 2026-04. */
  generalGovRevenue: 'GGR_NGDP',
  /** General government total expenditure, % of GDP. SDMX-only on Datamapper as of WEO 2026-04. */
  generalGovExpenditure: 'GGX_NGDP',
  /** General government net lending / borrowing, % of GDP. */
  generalGovBalance: 'GGXCNL_NGDP',
  /** Current account balance, % of GDP. */
  currentAccountBalance: 'BCA_NGDPD',
  /** Volume of exports of goods and services, annual % change. SDMX-only on Datamapper as of WEO 2026-04. */
  exportsVolumeGrowth: 'TX_RPCH',
  /** Population (millions). */
  population: 'LP',
} as const;

/**
 * WEO indicator codes that are reachable through the simple Datamapper
 * JSON transport (`/external/datamapper/api/v1/{code}/{country}`).
 *
 * Verified live on 2026-05-10 against `https://www.imf.org/external/datamapper/api/v1/indicators`
 * (132 indicators, 15 of which are tagged `dataset: "WEO"`). The 9
 * codes below are the intersection of {@link IMF_WEO_INDICATORS} and
 * the live Datamapper WEO set. Codes outside this set must be fetched
 * via {@link ImfClient.sdmxFetch} against the
 * `IMF.RES,WEO,9.0.0` SDMX dataflow — see {@link weoSdmxPath}.
 */
export const IMF_WEO_DATAMAPPER_AVAILABLE: ReadonlySet<string> = new Set([
  'NGDP_RPCH',
  'NGDPD',
  'NGDPDPC',
  'PCPIPCH',
  'LUR',
  'GGXWDG_NGDP',
  'GGXCNL_NGDP',
  'BCA_NGDPD',
  'LP',
]);

/**
 * WEO codes declared by {@link IMF_WEO_INDICATORS} that the Datamapper
 * silently 404s on (returns an empty `values` envelope). Callers must
 * route these through {@link ImfClient.sdmxFetch} with the WEO 9.0.0
 * dataflow path produced by {@link weoSdmxPath}.
 *
 * `getWeoIndicator()` throws an {@link ImfWeoSdmxOnlyError} for codes in
 * this set so silent zero-point returns no longer mask transport issues.
 */
export const IMF_WEO_SDMX_ONLY: ReadonlySet<string> = new Set([
  'GGR_NGDP',
  'GGX_NGDP',
  'TX_RPCH',
  'GGXONLB_NGDP',
]);

/**
 * Commonly-referenced IMF Fiscal Monitor (FM) indicators. The codes
 * below are the **logical** FM identifiers used in `FM:<code>` article
 * citations and routed through {@link ImfClient.sdmxFetch} against the
 * `IMF.FAD,FM,5.1.0` SDMX dataflow. The Datamapper FM dataset uses
 * different suffix conventions (`GGXONLB_G01_GDP_PT`,
 * `G_XWDG_G01_GDP_PT`, …) — see the live catalog via
 * {@link ImfClient.listDatamapperIndicators}.
 */
export const IMF_FM_INDICATORS = {
  /** General government gross debt, % of GDP (FM vintage — may differ slightly from WEO). */
  generalGovGrossDebtFm: 'GGXWDG_NGDP',
  /** General government primary balance, % of GDP. */
  primaryBalance: 'GGXONLB_NGDP',
} as const;

/**
 * Build the SDMX 3.0 data path for a WEO code + country, suitable for
 * {@link ImfClient.sdmxFetch}. Uses the WEO 9.0.0 dataflow (the
 * `IMF.RES:WEO(9.0.0)` URN browsable at
 * `https://data.imf.org/en/Data-Explorer?datasetUrn=IMF.RES:WEO(9.0.0)`)
 * with annual frequency.
 *
 * @example
 *   client.sdmxFetch(weoSdmxPath('SWE', 'GGR_NGDP'));
 *   // GET https://api.imf.org/external/sdmx/3.0/data/IMF.RES,WEO,9.0.0/A.SWE.GGR_NGDP
 */
export function weoSdmxPath(iso3: string, weoCode: string): string {
  const c = encodeURIComponent(iso3.toUpperCase());
  const i = encodeURIComponent(weoCode);
  return `/data/IMF.RES,WEO,9.0.0/A.${c}.${i}`;
}

/**
 * Thrown by {@link ImfClient.getWeoIndicator} when the requested code
 * lives in {@link IMF_WEO_SDMX_ONLY} (i.e. the Datamapper transport
 * returned zero points). Carries the SDMX path the caller should use
 * instead so agents can recover programmatically.
 */
export class ImfWeoSdmxOnlyError extends Error {
  readonly weoCode: string;
  readonly countryCode: string;
  readonly sdmxPath: string;
  constructor(iso3: string, weoCode: string) {
    const sdmxPath = weoSdmxPath(iso3, weoCode);
    super(
      `IMF WEO indicator '${weoCode}' is not exposed by the Datamapper for '${iso3}'. ` +
        `Use sdmxFetch('${sdmxPath}') with IMF_SDMX_SUBSCRIPTION_KEY set, or the ` +
        `'imf-fetch sdmx --path ${sdmxPath} --indicator ${weoCode} --country ${iso3}' CLI.`,
    );
    this.name = 'ImfWeoSdmxOnlyError';
    this.weoCode = weoCode;
    this.countryCode = iso3;
    this.sdmxPath = sdmxPath;
  }
}

// ---------------------------------------------------------------------------
// Raw Datamapper response shape
// ---------------------------------------------------------------------------

/** Shape of the IMF Datamapper JSON response (partial). */
export interface DatamapperResponse {
  values?: {
    [indicatorId: string]:
      | {
          [countryCode: string]:
            | {
                [year: string]: number | string | null | undefined;
              }
            | undefined;
        }
      | undefined;
  };
}

/** Defensive parser input: Datamapper can return empty or partial envelopes. */
export type DatamapperEnvelope = Partial<DatamapperResponse> | null | undefined;

class ImfHttpError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  readonly retryAfterHeader?: string | null;

  constructor(response: Response, requestUrl?: string) {
    // `response.url` is empty when constructed via `new Response(body, init)`
    // in tests; fall back to the explicit requestUrl supplied by the caller.
    const url = response.url || requestUrl || '';
    const baseMessage = `IMF API error: ${response.status} ${response.statusText} for ${url}`;
    // SDMX endpoints under api.imf.org return 401/403 from the Azure APIM
    // gateway when the Ocp-Apim-Subscription-Key header is missing or invalid.
    // Surface that explicitly so operators don't waste time chasing
    // a "404 Resource not found" from the data-path APIM mask.
    const isAuthFailure = response.status === 401 || response.status === 403;
    const isSdmxHost = url.includes('://api.imf.org/external/sdmx/') || url === '';
    const message = isAuthFailure && isSdmxHost
      ? `${baseMessage} — IMF SDMX subscription key missing or invalid (set IMF_SDMX_SUBSCRIPTION_KEY)`
      : baseMessage;
    super(message);
    this.name = 'ImfHttpError';
    this.status = response.status;
    this.retryable = response.status === 429 || response.status >= 500;
    this.retryAfterHeader = response.headers.get('retry-after');
  }
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
  readonly userAgent: string;
  /**
   * Resolved IMF SDMX subscription key. Empty string when neither the
   * constructor option nor the `IMF_SDMX_SUBSCRIPTION_KEY` env var is set —
   * SDMX requests still go out so probes can detect "no key" vs "outage".
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
    this.sdmxSubscriptionKey =
      config.sdmxSubscriptionKey ?? process.env.IMF_SDMX_SUBSCRIPTION_KEY ?? '';
    this.onBatchIndicatorError = config.onBatchIndicatorError;
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

    const points = parseDatamapperValues(raw, weoCode, code, this.weoVintage);
    if (points.length === 0 && IMF_WEO_SDMX_ONLY.has(weoCode)) {
      // The Datamapper silently returns an empty `values` envelope for
      // these codes (verified live 2026-05-10). Fail loudly so callers
      // route through SDMX rather than treating "missing" as "no data".
      throw new ImfWeoSdmxOnlyError(iso3, weoCode);
    }
    return points.slice(0, years);
  }

  /**
   * Fetch the IMF Datamapper indicator catalog
   * (`https://www.imf.org/external/datamapper/api/v1/indicators`).
   *
   * Returned as a `Map<code, IndicatorMeta>` — 132 entries as of WEO
   * 2026-04, grouped by `dataset` (`WEO`, `FM`, `FPP`, `IFS`, `BOP`,
   * `DOTS`, `GFS_COFOG`, `MFS_IR`, `PCPS`, `ER`, `AFRREO`, `APDREO`,
   * `WHDREO`, `EUREO`, `MCDREO`, `CL`, `CF`, `GD`, `GDD`, `SPRLU`,
   * `DEBT`, `ARA`, `AIPI`, `FR_FC`).
   *
   * Use this to discover any of the 132 Datamapper-addressable
   * indicators at runtime — the WEO subset is small (~15 codes) and
   * covers the headline projections; broader queries (full WEO 9.0.0,
   * IFS, BOP, GFS_COFOG, …) require {@link sdmxFetch}.
   */
  async listDatamapperIndicators(): Promise<Map<string, ImfDatamapperIndicatorMeta>> {
    const url = `${this.datamapperBaseURL}/indicators`;
    const raw = (await this.fetchWithRetry(url)) as DatamapperIndicatorsResponse;
    return parseDatamapperIndicators(raw);
  }

  /**
   * Fetch several WEO indicators for the **same** country in sequence.
   * Sequential (not parallel) to respect the IMF rate limit of
   * ~10 req / 5 s. Failures on individual indicators map to an empty
   * array for that indicator so a single flaky series does not poison
   * the whole batch — matches the fail-soft posture of
   * {@link compareCountriesWeo}.
   *
   * Useful for article dashboards that need a full macro+fiscal panel
   * for Sweden (GDP growth, inflation, unemployment, debt, balance).
   *
   * @param iso3 ISO-3 alpha-3 country code
   * @param weoCodes WEO indicator codes (e.g. ['NGDP_RPCH', 'PCPIPCH', 'LUR'])
   * @param years How many most-recent years per indicator (default 10)
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
   * Authentication: when {@link sdmxSubscriptionKey} is set (constructor
   * option or `IMF_SDMX_SUBSCRIPTION_KEY` env var) the request includes
   * the `Ocp-Apim-Subscription-Key` header — required by every SDMX 3.0/2.1
   * `/data/...` endpoint as of 2026-05.
   *
   * @param path URL path starting with `/data/...` or `/structure/...`
   */
  async sdmxFetch(pathWithQuery: string): Promise<unknown> {
    const separator = pathWithQuery.startsWith('/') ? '' : '/';
    const url = `${this.sdmxBaseURL}${separator}${pathWithQuery}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.sdmx.data+json;version=2.0.0',
    };
    if (this.sdmxSubscriptionKey) {
      // Azure APIM gateway header (case-sensitive). Used for both the
      // SDMX 3.0 and SDMX 2.1 surfaces under api.imf.org — same
      // subscription key works for both per the IMF Data SDMX API
      // subscription product.
      headers['Ocp-Apim-Subscription-Key'] = this.sdmxSubscriptionKey;
    }
    return this.fetchWithRetry(url, 0, headers);
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
        headers: { Accept: 'application/json', 'User-Agent': this.userAgent, ...extraHeaders },
      });

      if (!response.ok) {
        throw new ImfHttpError(response, url);
      }

      return await response.json();
    } catch (error) {
      const retryAfterHeader = error instanceof ImfHttpError ? error.retryAfterHeader : undefined;
      if (attempt < this.maxRetries && isRetryableError(error)) {
        // Retryable errors use exponential backoff starting at 1 s
        // (1 s → 2 s → 4 s → … depending on maxRetries).
        // HTTP 429 additionally honours Retry-After (delta-seconds), capped
        // at 30 s to avoid pathological waits.
        const delay = calculateRetryDelay(attempt, retryAfterHeader);
        clearTimeout(timeoutId);
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
// Pure helpers (exported for testability)
// ---------------------------------------------------------------------------

/**
 * Compute the retry delay (milliseconds) for a given attempt number.
 *
 * Strategy:
 *  - Base schedule is exponential: 1 s → 2 s → 4 s (attempt 0/1/2).
 *  - When the server supplies a `Retry-After` header (delta-seconds),
 *    honour it, capped at {@link RETRY_AFTER_CAP_MS} to avoid pathological
 *    multi-minute sleeps from a misbehaving origin.
 *  - Invalid / non-positive `Retry-After` values fall back to the
 *    exponential schedule.
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

/**
 * Parse a raw Datamapper JSON envelope into canonical {@link ImfDataPoint}
 * records for one `(indicator, country)` pair.
 *
 * Defensive posture:
 *  - Missing indicator node → `[]`
 *  - Missing country node → `[]`
 *  - `null` / `undefined` / non-finite / `'n/a'` values dropped (no silent zeros)
 *  - Non-numeric year keys dropped
 *  - Output is sorted descending by year (newest first)
 *
 * Pure function: no I/O, no clocks except `new Date()` for projection
 * detection. Exported so tests can exercise the parser directly without
 * stubbing `fetch`.
 */
export function parseDatamapperValues(
  raw: DatamapperEnvelope,
  weoCode: string,
  iso3: string,
  weoVintage: string,
): ImfDataPoint[] {
  const indicatorNode = raw?.values?.[weoCode];
  if (!indicatorNode) return [];
  const countryNode = indicatorNode[iso3];
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
      countryCode: iso3,
      countryName: iso3, // Datamapper does not return the display name; callers overlay this from COUNTRY_NAMES_EN
      indicatorId: weoCode,
      indicatorName: weoCode,
      date: year,
      value: numeric,
      projection: isProjection,
      provider: 'imf',
      ...(isProjection ? { projectionVintage: weoVintage } : {}),
    };
    points.push(dp);
  }

  // Sort by year desc so consumers can slice newest-first.
  points.sort((a, b) => Number.parseInt(b.date, 10) - Number.parseInt(a.date, 10));
  return points;
}

// ---------------------------------------------------------------------------
// Datamapper indicator catalog
// ---------------------------------------------------------------------------

/** One entry from `https://www.imf.org/external/datamapper/api/v1/indicators`. */
export interface ImfDatamapperIndicatorMeta {
  /** Canonical Datamapper indicator code (used as the primary key). */
  readonly code: string;
  /** Human-readable label (English). */
  readonly label: string;
  /** Long description (English). */
  readonly description: string;
  /** Source / publisher (typically "IMF"). */
  readonly source: string;
  /** Unit of measurement (e.g. `'Percent of GDP'`, `'Annual percent change'`). */
  readonly unit: string;
  /** IMF dataset family (`WEO`, `FM`, `FPP`, `IFS`, `BOP`, `DOTS`, `GFS_COFOG`, …). */
  readonly dataset: string;
  /** ISO 8601 last-updated timestamp emitted by the catalog (when present). */
  readonly lastUpdate?: string;
}

/** Raw shape of `/external/datamapper/api/v1/indicators`. */
export interface DatamapperIndicatorsResponse {
  indicators?: {
    [code: string]:
      | {
          label?: string;
          description?: string;
          source?: string;
          unit?: string;
          dataset?: string;
          lastUpdate?: string;
        }
      | undefined;
  };
}

/**
 * Pure parser for the Datamapper indicator catalog. Skips entries whose
 * `dataset` is missing — defensive against IMF schema drift.
 */
export function parseDatamapperIndicators(
  raw: DatamapperIndicatorsResponse | null | undefined,
): Map<string, ImfDatamapperIndicatorMeta> {
  const out = new Map<string, ImfDatamapperIndicatorMeta>();
  const indicators = raw?.indicators;
  if (!indicators) return out;
  for (const [code, meta] of Object.entries(indicators)) {
    if (!meta || typeof meta !== 'object') continue;
    const dataset = typeof meta.dataset === 'string' ? meta.dataset : '';
    if (!dataset) continue;
    out.set(code, {
      code,
      label: typeof meta.label === 'string' ? meta.label : '',
      description: typeof meta.description === 'string' ? meta.description : '',
      source: typeof meta.source === 'string' ? meta.source : '',
      unit: typeof meta.unit === 'string' ? meta.unit : '',
      dataset,
      ...(typeof meta.lastUpdate === 'string' ? { lastUpdate: meta.lastUpdate } : {}),
    });
  }
  return out;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof ImfHttpError) {
    return error.retryable;
  }
  return isTransientFetchError(error);
}

function isTransientFetchError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return NETWORK_TYPE_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
  }
  if (error instanceof Error) return error.name === 'AbortError';
  return false;
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
