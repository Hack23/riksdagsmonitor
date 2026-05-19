/**
 * @module imf/types
 * @description Cross-module types for the IMF client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * A single IMF data point. Shape mirrors `WorldBankDataPoint` so that
 * the provider-agnostic `economic-context` helpers can consume either
 * source interchangeably.
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

/** Diagnostic payload for one fail-softed `getWeoIndicatorsBatch()` item. */
export interface ImfBatchIndicatorErrorEvent {
  readonly countryCode: string;
  readonly indicatorId: string;
  readonly error: unknown;
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
   * User-Agent sent to IMF HTTP endpoints. Akamai currently rejects
   * Node's default undici user-agent on the Datamapper API with HTTP
   * 403, while browser/curl-style user-agents succeed.
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
   * `Ocp-Apim-Subscription-Key` header on every SDMX call. The
   * Datamapper transport is NOT authenticated and never receives this
   * header. If omitted the client resolves the key via
   * `imf/config/auth.ts::resolveSdmxSubscriptionKey` (the sole reader
   * of `IMF_SDMX_SUBSCRIPTION_KEY`).
   */
  readonly sdmxSubscriptionKey?: string;
  /**
   * Optional diagnostic hook invoked when `getWeoIndicatorsBatch()`
   * fail-softs one indicator to an empty series because the IMF
   * transport/API call failed. The default is no-op so callers can
   * opt in without polluting JSON stdout.
   */
  readonly onBatchIndicatorError?: (event: ImfBatchIndicatorErrorEvent) => void;
}
