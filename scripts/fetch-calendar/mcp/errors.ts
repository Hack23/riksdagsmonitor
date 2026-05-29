/**
 * @module scripts/fetch-calendar/mcp/errors
 * @description Typed transport-error class and HTML-error detector for the
 * MCP calendar transport.
 *
 * Per `Threat_Modeling.md` (trust-boundary rule for external HTML), an HTML
 * response from a JSON-RPC endpoint is treated as a hostile / error response
 * — never parsed as JSON — and the orchestrator falls back to the web
 * scraper instead.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

// HTML detection: common HTML document / fragment leading tags.
export const HTML_PREFIX_RE =
  /^\s*(?:<!doctype(?=[\s>])|<html(?=[\s>/])|<head(?=[\s>/])|<body(?=[\s>/])|<title(?=[\s>/])|<meta(?=[\s>/]))/i;

/**
 * Returns true when `text` looks like an HTML document rather than JSON.
 * Used to detect when the MCP endpoint returns an error page instead of JSON.
 */
export function isHtmlErrorResponse(text: string): boolean {
  return HTML_PREFIX_RE.test(text);
}

/**
 * Detect the riksdag-regering **degraded-kalender sentinel** payload.
 *
 * When the upstream `data.riksdagen.se/kalender/` endpoint serves an HTML
 * error page instead of JSON, the MCP server does not surface a JSON-RPC
 * error — it returns a *successful* tool result whose inner content is a
 * sentinel envelope such as:
 *
 * ```json
 * { "count": 0, "events": [], "rawHtml": "<script…",
 *   "error": "Riksdagens kalender-API returnerade HTML istället för JSON.",
 *   "notice": "API:et fungerar inte korrekt för närvarande.",
 *   "suggestions": [ … ] }
 * ```
 *
 * The empty `events: []` array would otherwise be read as a legitimate
 * zero-event window, masking the outage and suppressing the web-scraper
 * fallback. Treat the presence of a non-empty `error` string or a `rawHtml`
 * field as a degraded signal so the orchestrator falls straight back to the
 * public-page scraper.
 */
export function isDegradedKalenderSentinel(inner: Record<string, unknown>): boolean {
  const hasErrorString = typeof inner['error'] === 'string' && inner['error'].trim().length > 0;
  const hasRawHtml = typeof inner['rawHtml'] === 'string' && inner['rawHtml'].trim().length > 0;
  return hasErrorString || hasRawHtml;
}

/** Typed error for MCP transport / protocol failures. */
export class CalendarMcpError extends Error {
  /** Error category. */
  readonly kind: 'html' | 'http' | 'network' | 'json' | 'tool';
  /** Raw response body (only present for `html` / `http` kinds). */
  readonly responseText?: string;

  constructor(message: string, kind: CalendarMcpError['kind'], responseText?: string) {
    super(message);
    this.name = 'CalendarMcpError';
    this.kind = kind;
    this.responseText = responseText;
  }
}
