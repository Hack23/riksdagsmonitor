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
