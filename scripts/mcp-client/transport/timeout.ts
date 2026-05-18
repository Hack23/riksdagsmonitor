/**
 * @module mcp-client/transport/timeout
 * @description Abortable fetch helper for non-MCP external URLs
 * (GitHub raw, regeringen.se, etc.). Wraps `globalThis.fetch` with an
 * `AbortController`-backed timeout so the news pipeline cannot hang on
 * slow public resources.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Timeout in milliseconds for fetching external URLs (GitHub, etc.) */
export const EXTERNAL_URL_FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch raw text content from an external URL with an abortable timeout.
 * Returns `null` (and emits a `console.warn`) on any non-2xx response or
 * network error — callers treat absence as "content unavailable" rather
 * than fatal.
 */
export async function fetchExternalUrlText(
  rawUrl: string,
  timeoutMs: number = EXTERNAL_URL_FETCH_TIMEOUT_MS,
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(rawUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/plain, text/markdown, text/html, */*' },
    });
    clearTimeout(timeout);
    if (!response.ok) {
      console.warn(`⚠️ HTTP ${response.status} fetching external URL: ${rawUrl}`);
      return null;
    }
    return await response.text();
  } catch (error: unknown) {
    console.warn(`⚠️ Could not fetch external URL ${rawUrl}: ${(error as Error).message}`);
    return null;
  }
}
