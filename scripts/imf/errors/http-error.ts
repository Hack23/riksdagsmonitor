/**
 * @module imf/errors/http-error
 * @description HTTP error type for IMF transport layer (Datamapper + SDMX).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * HTTP-level error emitted by the IMF transport. Carries `retryable`
 * so the retry policy in `transport/retry.ts` can distinguish transient
 * (429 / 5xx) from permanent (4xx) failures, and `retryAfterHeader`
 * so a server-supplied `Retry-After` can override the exponential
 * back-off schedule.
 *
 * The constructor disambiguates a class of confusing IMF Azure APIM
 * responses: when the `Ocp-Apim-Subscription-Key` header is **absent**
 * the gateway masks SDMX `/data/...` endpoints as **HTTP 404 "Resource
 * not found"** (verified via curl 2026-05-10); with an **invalid** key
 * it returns 401 / 403. Both modes produce a single
 * "subscription key missing or invalid" diagnostic so operators don't
 * waste time chasing a generic 404.
 */
export class ImfHttpError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  readonly retryAfterHeader?: string | null;

  constructor(response: Response, requestUrl?: string, sentSubscriptionKey = false) {
    const url = response.url || requestUrl || '';
    const baseMessage = `IMF API error: ${response.status} ${response.statusText} for ${url}`;
    const isAuthFailure = response.status === 401 || response.status === 403;
    const isMaskedAuthFailure = response.status === 404 && !sentSubscriptionKey;
    const isSdmxHost = url.includes('://api.imf.org/external/sdmx/') || url === '';
    const message =
      (isAuthFailure || isMaskedAuthFailure) && isSdmxHost
        ? `${baseMessage} — IMF SDMX subscription key missing or invalid (set IMF_SDMX_SUBSCRIPTION_KEY)`
        : baseMessage;
    super(message);
    this.name = 'ImfHttpError';
    this.status = response.status;
    this.retryable = response.status === 429 || response.status >= 500;
    this.retryAfterHeader = response.headers.get('retry-after');
  }
}
