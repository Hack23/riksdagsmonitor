/**
 * @module scripts/fetch-calendar
 * @description Resilient Riksdag calendar fetcher with primary→fallback chain.
 *
 * **Primary path**: calls `get_calendar_events` on the riksdag-regering MCP
 * server via a lightweight JSON-RPC 2.0 POST.  If the response is not valid
 * JSON (e.g. the server returns an HTML error page) or the request fails, the
 * module automatically retries and — after exhausting retries — falls back to
 * scraping `https://www.riksdagen.se/sv/kalendarium/` directly.
 *
 * **Output**: both paths produce the same `CalendarEvent[]` shape and write a
 * normalized JSON file to `data/calendar/{from}.json` so that week-ahead and
 * month-ahead workflows can consume a single, reliable data source regardless
 * of which transport succeeded.
 *
 * **Manifest**: every run records `path`, `eventCount`, any `error` message
 * and a `fetchedAt` timestamp.  Workflows append this to their
 * `data-download-manifest.md` to satisfy the ICD-203 provenance requirement.
 *
 * Usage (CLI):
 *   tsx scripts/fetch-calendar.ts --from 2026-04-28 --to 2026-05-04 [--persist]
 *   tsx scripts/fetch-calendar.ts --from 2026-04-28 --to 2026-05-31 [--persist]
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeHtmlEntities } from './html-utils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single normalized calendar event produced by either transport path.
 *
 * Fields map to the riksdag-regering `get_calendar_events` response envelope
 * (`kalender[]`) so that the MCP path is loss-free and the web-fallback
 * path produces maximally equivalent data.
 */
export interface CalendarEvent {
  /** ISO 8601 date-time string (e.g. "2026-04-28T10:00:00"). */
  readonly dtstart: string;
  /** ISO 8601 end date-time string, when available. */
  readonly dtend?: string;
  /** Organ/committee code (e.g. "FiU", "KU", "kammaren"). */
  readonly org: string;
  /** Activity type code (e.g. "debatt", "utskottsmöte", "votering", "beredning"). */
  readonly akt: string;
  /** Human-readable event summary / title. */
  readonly summary: string;
  /** Document references extracted from the event (dok_id or URLs). */
  readonly doc_refs: readonly string[];
  /** Which transport provided this event. */
  readonly source: 'mcp-primary' | 'web-fallback';
}

/**
 * Provenance manifest written alongside the normalized events JSON.
 * Workflows append this to `data-download-manifest.md`.
 */
export interface CalendarFetchManifest {
  /** Date of the run (ISO 8601 "from" value). */
  readonly date: string;
  /** Date range end (ISO 8601 "to" value). */
  readonly dateTo: string;
  /** Which path actually delivered the events. */
  readonly path: 'mcp-primary' | 'web-fallback' | 'none';
  /** Number of events returned. */
  readonly eventCount: number;
  /** Error message from the failed primary path (when fallback was used). */
  readonly primaryError?: string;
  /** Error message from the failed fallback path (when both failed). */
  readonly fallbackError?: string;
  /** ISO 8601 timestamp of the fetch. */
  readonly fetchedAt: string;
}

/**
 * Result object returned by `fetchCalendarWithFallback`.
 */
export interface CalendarFetchResult {
  readonly events: readonly CalendarEvent[];
  readonly manifest: CalendarFetchManifest;
}

/**
 * Injectable configuration for `fetchCalendarWithFallback`.
 * All network calls go through `fetchFn` so tests can substitute a mock.
 */
export interface CalendarFetchConfig {
  /**
   * MCP server endpoint URL.
   * Defaults to the `MCP_SERVER_URL` env var or the public Render.com endpoint.
   */
  readonly mcpUrl?: string;
  /**
   * Riksdag web kalendarium base URL (no trailing slash).
   * Defaults to `https://www.riksdagen.se`.
   */
  readonly webBaseUrl?: string;
  /** Request timeout in ms.  Default 15 000. */
  readonly timeout?: number;
  /** Maximum MCP retry attempts before triggering the web fallback.  Default 2. */
  readonly maxRetries?: number;
  /**
   * Injectable fetch function.  Defaults to `globalThis.fetch`.
   * Set in tests to control all network calls without live HTTP.
   */
  readonly fetchFn?: typeof fetch;
  /**
   * Optional sleep function override (ms → Promise<void>).
   * Defaults to `setTimeout`-based sleep.  Override in tests to skip delays.
   */
  readonly sleepFn?: (ms: number) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MCP_URL =
  process.env['MCP_SERVER_URL'] ?? 'https://riksdag-regering-ai.onrender.com/mcp';
const DEFAULT_WEB_BASE_URL = 'https://www.riksdagen.se';
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_RETRIES = 2;
/** Retry base delay (ms); doubled on each subsequent attempt. */
const RETRY_BASE_DELAY_MS = 1_000;

// HTML detection: common HTML document / fragment leading tags.
const HTML_PREFIX_RE = /^\s*(?:<!doctype(?=[\s>])|<html(?=[\s>/])|<head(?=[\s>/])|<body(?=[\s>/])|<title(?=[\s>/])|<meta(?=[\s>/]))/i;

// ---------------------------------------------------------------------------
// HTML detection
// ---------------------------------------------------------------------------

/**
 * Returns true when `text` looks like an HTML document rather than JSON.
 * Used to detect when the MCP endpoint returns an error page instead of JSON.
 */
export function isHtmlErrorResponse(text: string): boolean {
  return HTML_PREFIX_RE.test(text);
}

// ---------------------------------------------------------------------------
// MCP helper
// ---------------------------------------------------------------------------

/** Minimum JSON-RPC 2.0 envelope for a `tools/call` request. */
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: 'tools/call';
  params: { name: string; arguments: Record<string, unknown> };
}

/** Partial shape of a JSON-RPC 2.0 response (only the fields we use). */
interface JsonRpcResponse {
  result?: {
    content?: Array<{ text?: string }>;
    kalender?: unknown[];
    events?: unknown[];
    [key: string]: unknown;
  };
  error?: { message?: string; [key: string]: unknown };
  [key: string]: unknown;
}

let _rpcId = 1;

/**
 * Call the riksdag-regering MCP `get_calendar_events` tool via a single
 * JSON-RPC 2.0 POST.  Throws a typed `CalendarMcpError` on any transport,
 * HTTP, or protocol error so callers can distinguish HTML responses from
 * genuine tool failures.
 */
export async function callMcpCalendarEvents(
  from: string,
  tom: string,
  config: Required<Pick<CalendarFetchConfig, 'mcpUrl' | 'timeout' | 'fetchFn'>>,
): Promise<unknown[]> {
  const body: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: _rpcId++,
    method: 'tools/call',
    params: { name: 'get_calendar_events', arguments: { from, tom } },
  };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), config.timeout);

  let responseText: string;
  try {
    const response = await config.fetchFn(config.mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    responseText = await response.text();

    if (!response.ok) {
      throw new CalendarMcpError(
        `MCP HTTP error: ${response.status} ${response.statusText}`,
        isHtmlErrorResponse(responseText) ? 'html' : 'http',
        responseText,
      );
    }
  } catch (err) {
    clearTimeout(tid);
    if (err instanceof CalendarMcpError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new CalendarMcpError(`MCP fetch failed: ${msg}`, 'network');
  } finally {
    clearTimeout(tid);
  }

  // Detect HTML error page masquerading as a 200 OK response.
  if (isHtmlErrorResponse(responseText)) {
    throw new CalendarMcpError(
      'MCP returned HTML instead of JSON',
      'html',
      responseText,
    );
  }

  // Parse JSON-RPC response.
  let rpc: JsonRpcResponse;
  try {
    rpc = JSON.parse(responseText) as JsonRpcResponse;
  } catch {
    throw new CalendarMcpError(
      `MCP response is not valid JSON: ${responseText.slice(0, 120)}`,
      'json',
    );
  }

  if (rpc.error) {
    const msg = rpc.error.message ?? JSON.stringify(rpc.error);
    throw new CalendarMcpError(`MCP tool error: ${msg}`, 'tool');
  }

  const result = rpc.result ?? {};

  // Handle the content-envelope pattern used by the MCP server.
  const content = result['content'] as Array<{ text?: string }> | undefined;
  if (Array.isArray(content) && content[0]?.text) {
    let inner: Record<string, unknown>;
    try {
      inner = JSON.parse(content[0].text) as Record<string, unknown>;
    } catch {
      throw new CalendarMcpError(
        `MCP content text is not valid JSON: ${content[0].text.slice(0, 120)}`,
        'json',
      );
    }
    const events = inner['kalender'] ?? inner['events'];
    if (Array.isArray(events)) return events as unknown[];
    return [];
  }

  const direct = result['kalender'] ?? result['events'];
  if (Array.isArray(direct)) return direct as unknown[];

  return [];
}

/** Typed error for MCP transport / protocol failures. */
export class CalendarMcpError extends Error {
  /** Error category. */
  readonly kind: 'html' | 'http' | 'network' | 'json' | 'tool';
  /** Raw response body (only present for `html` / `http` kinds). */
  readonly responseText?: string;

  constructor(
    message: string,
    kind: CalendarMcpError['kind'],
    responseText?: string,
  ) {
    super(message);
    this.name = 'CalendarMcpError';
    this.kind = kind;
    this.responseText = responseText;
  }
}

// ---------------------------------------------------------------------------
// MCP event normalizer
// ---------------------------------------------------------------------------

/**
 * Normalize a raw event object from the MCP `get_calendar_events` response
 * into the canonical `CalendarEvent` shape.
 *
 * The riksdag-regering server uses the iCalendar field names (`DTSTART`,
 * `DTEND`, `SUMMARY`, etc.) with either upper-case or lower-case keys — both
 * are handled.
 */
export function normalizeMcpCalendarEvent(raw: unknown): CalendarEvent {
  const r = (raw ?? {}) as Record<string, unknown>;

  const dtstart =
    String(r['dtstart'] ?? r['DTSTART'] ?? r['start'] ?? '').trim();
  const dtend =
    String(r['dtend'] ?? r['DTEND'] ?? r['end'] ?? '').trim() || undefined;
  const org =
    String(r['organ'] ?? r['org'] ?? r['ORG'] ?? r['location'] ?? '').trim();
  const akt =
    String(r['akt'] ?? r['AKT'] ?? r['type'] ?? r['kategori'] ?? '').trim();
  const summary =
    String(r['summary'] ?? r['SUMMARY'] ?? r['titel'] ?? r['title'] ?? '').trim();

  // Collect document references from various possible fields.
  const docRefs: string[] = [];
  for (const key of ['dok_id', 'dokid', 'url', 'href', 'beteckning', 'doc_id']) {
    const val = r[key];
    if (typeof val === 'string' && val.trim()) {
      docRefs.push(val.trim());
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string' && item.trim()) docRefs.push(item.trim());
      }
    }
  }

  return {
    dtstart,
    ...(dtend ? { dtend } : {}),
    org,
    akt,
    summary,
    doc_refs: docRefs,
    source: 'mcp-primary',
  };
}

// ---------------------------------------------------------------------------
// Web fallback HTML parser
// ---------------------------------------------------------------------------

/**
 * Parse the HTML returned by `https://www.riksdagen.se/sv/kalendarium/` and
 * extract calendar events into the normalized `CalendarEvent` shape.
 *
 * The parser is intentionally defensive and regex-based (no external parser
 * dependency) in the same style as `statskontoret-client.ts`.  It handles
 * the two primary markup patterns used by riksdagen.se (as of 2026):
 *
 * **Pattern A – article-per-event:**
 * ```html
 * <article class="calendar-item" data-akt="votering" data-organ="FiU">
 *   <time datetime="2026-04-28T10:00:00">...</time>
 *   <h2 class="calendar-item__title">
 *     <a href="/sv/dokument-och-lagar/utskottens-arbete/betankanden/H901FiU1/">Budget 2026</a>
 *   </h2>
 * </article>
 * ```
 *
 * **Pattern B – list-item-per-event:**
 * ```html
 * <li class="calendar-list__item">
 *   <time datetime="2026-04-28T09:00:00">...</time>
 *   <span class="calendar-list__type">Utskottsmöte</span>
 *   <span class="calendar-list__organ">NU</span>
 *   <a href="/sv/...">Näringspolitik - Bredbands</a>
 * </li>
 * ```
 */
export function parseRiksdagKalendariumHtml(html: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Extract <article> blocks, then retain only calendar-item articles (Pattern A).
  const articleRe = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
  for (const articleMatch of html.matchAll(articleRe)) {
    const attrs = articleMatch[1] ?? '';
    if (!hasCalendarItemClass(attrs)) continue;
    const body = articleMatch[2] ?? '';
    const event = parseCalendarArticle(attrs, body);
    if (event) events.push(event);
  }

  // If no articles found, try <li> blocks (Pattern B).
  if (events.length === 0) {
    const liRe = /<li\b([^>]*class=(["'])[^"']*calendar[^"']*\2[^>]*)>([\s\S]*?)<\/li>/gi;
    for (const liMatch of html.matchAll(liRe)) {
      const attrs = liMatch[1] ?? '';
      const body = liMatch[3] ?? '';
      const event = parseCalendarListItem(attrs, body);
      if (event) events.push(event);
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// HTML parser internals (exported for unit tests)
// ---------------------------------------------------------------------------

/** Parse an `<article>` calendar item block. */
export function parseCalendarArticle(attrs: string, body: string): CalendarEvent | null {
  const dtstart = extractDatetime(body);
  if (!dtstart) return null;

  const org =
    extractDataAttr(attrs, 'organ') ??
    extractDataAttr(attrs, 'org') ??
    extractSpanText(body, 'organ') ??
    extractSpanText(body, 'committee') ??
    '';

  const akt =
    extractDataAttr(attrs, 'akt') ??
    extractDataAttr(attrs, 'type') ??
    extractSpanText(body, 'type') ??
    extractSpanText(body, 'akt') ??
    '';

  const { summary, docRefs } = extractHeadingAndLinks(body);

  return {
    dtstart,
    org: normalizeOrgCode(decodeHtmlEntities(org)),
    akt: normalizeAkt(decodeHtmlEntities(akt)),
    summary: decodeHtmlEntities(stripTags(summary).trim()),
    doc_refs: docRefs,
    source: 'web-fallback',
  };
}

/** Parse an `<li>` calendar list item block. */
export function parseCalendarListItem(attrs: string, body: string): CalendarEvent | null {
  const dtstart = extractDatetime(body);
  if (!dtstart) return null;

  // organ can come from a dedicated span or a data attribute.
  const org =
    extractDataAttr(attrs, 'organ') ??
    extractSpanText(body, 'organ') ??
    extractSpanText(body, 'committee') ??
    '';

  const akt =
    extractDataAttr(attrs, 'akt') ??
    extractSpanText(body, 'type') ??
    extractSpanText(body, 'akt') ??
    '';

  const { summary, docRefs } = extractHeadingAndLinks(body);

  return {
    dtstart,
    org: normalizeOrgCode(decodeHtmlEntities(org)),
    akt: normalizeAkt(decodeHtmlEntities(akt)),
    summary: decodeHtmlEntities(stripTags(summary).trim()),
    doc_refs: docRefs,
    source: 'web-fallback',
  };
}

// ---------------------------------------------------------------------------
// HTML extraction helpers
// ---------------------------------------------------------------------------

/** Escape a string for safe use in a `new RegExp(...)` constructor. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extract the `datetime` attribute from a `<time>` element. */
function extractDatetime(html: string): string | null {
  const m = html.match(/<time\b[^>]*\bdatetime=(["'])(.*?)\1/i);
  return m ? (m[2] ?? null) : null;
}

/** Extract a `data-{attr}` attribute value from a tag's attribute string. */
function extractDataAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`\\bdata-${escapeRegex(name)}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  const m = attrs.match(re);
  return m && m[2]?.trim() ? m[2].trim() : null;
}

/** True when an element attribute string contains a `calendar-item` class token. */
function hasCalendarItemClass(attrs: string): boolean {
  const m = attrs.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
  return m ? (m[2] ?? '').split(/\s+/).includes('calendar-item') : false;
}

/**
 * Extract the inner text of a `<span>` whose class contains `{name}`.
 * Uses a simple, non-greedy regex that covers the common markup pattern.
 */
function extractSpanText(html: string, name: string): string | null {
  const safe = escapeRegex(name);
  const re = new RegExp(
    `<span\\b[^>]*\\bclass\\s*=\\s*(["'])[^"']*${safe}[^"']*\\1[^>]*>([\\s\\S]*?)<\\/span>`,
    'i',
  );
  const m = html.match(re);
  return m ? stripTags(m[2] ?? '').trim() || null : null;
}

/**
 * Extract the heading text (h1–h6 or first anchor) and any document
 * reference links from an event block.
 */
function extractHeadingAndLinks(html: string): { summary: string; docRefs: string[] } {
  // Try heading first.
  const headingRe = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i;
  const headingMatch = html.match(headingRe);
  const summary = headingMatch ? (headingMatch[1] ?? '') : extractFirstAnchorText(html);

  // Collect document reference links (/sv/dokument-och-lagar/… or /dokument/…).
  const docRefs: string[] = [];
  const hrefRe = /<a\b[^>]*\bhref=(["'])([^"']+)\1[^>]*>/gi;
  for (const m of html.matchAll(hrefRe)) {
    const href = (m[2] ?? '').trim();
    if (isRiksdagDocumentHref(href)) {
      docRefs.push(href);
    }
  }

  return { summary, docRefs };
}

/** Extract the text of the first `<a>` anchor in an HTML fragment. */
function extractFirstAnchorText(html: string): string {
  const m = html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
  return m ? (m[1] ?? '') : '';
}

/** True when an href looks like a Riksdag document or proceedings link. */
function isRiksdagDocumentHref(href: string): boolean {
  return (
    href.includes('/dokument') ||
    href.includes('/betankanden') ||
    href.includes('/propositioner') ||
    href.includes('/motioner') ||
    href.includes('/interpellationer')
  );
}

/** Remove all HTML tags from a string. */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/** Normalize committee/organ codes by collapsing whitespace and trimming only. */
function normalizeOrgCode(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/** Normalize activity type strings to lower-case-with-hyphens. */
function normalizeAkt(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-åäö]/g, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Web fallback fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch the Riksdag web calendar for a date range and parse events.
 *
 * URL: `https://www.riksdagen.se/sv/kalendarium/?from={from}&tom={to}`
 */
export async function fetchWebCalendar(
  from: string,
  to: string,
  config: Required<Pick<CalendarFetchConfig, 'webBaseUrl' | 'timeout' | 'fetchFn'>>,
): Promise<CalendarEvent[]> {
  const url = `${config.webBaseUrl}/sv/kalendarium/?from=${encodeURIComponent(from)}&tom=${encodeURIComponent(to)}`;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), config.timeout);

  let html: string;
  try {
    const response = await config.fetchFn(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
        'User-Agent': 'riksdagsmonitor-news-bot/1.0 (+https://riksdagsmonitor.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Riksdag web calendar HTTP error: ${response.status} ${response.statusText}`);
    }

    html = await response.text();
  } catch (err) {
    clearTimeout(tid);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Riksdag web calendar fetch failed: ${msg}`, { cause: err });
  } finally {
    clearTimeout(tid);
  }

  return parseRiksdagKalendariumHtml(html);
}

// ---------------------------------------------------------------------------
// Sleep helper
// ---------------------------------------------------------------------------

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Primary → fallback orchestrator
// ---------------------------------------------------------------------------

/**
 * Fetch Riksdag calendar events for the given date range using a
 * primary→fallback resilience chain:
 *
 * 1. **MCP primary**: call `get_calendar_events` on riksdag-regering.
 *    Retries up to `maxRetries` times on transient failures.
 * 2. **Web fallback**: if every MCP attempt returns an HTML error page or a
 *    network failure, scrape `riksdagen.se/sv/kalendarium/` instead.
 *
 * @param from  ISO 8601 date string (inclusive start, e.g. "2026-04-28").
 * @param to    ISO 8601 date string (inclusive end,   e.g. "2026-05-04").
 * @param config Optional overrides for URLs, timeout, retries, and fetch mock.
 */
export async function fetchCalendarWithFallback(
  from: string,
  to: string,
  config: CalendarFetchConfig = {},
): Promise<CalendarFetchResult> {
  const mcpUrl = config.mcpUrl ?? DEFAULT_MCP_URL;
  const webBaseUrl = config.webBaseUrl ?? DEFAULT_WEB_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  const fetchFn = config.fetchFn ?? globalThis.fetch;
  const sleepFn = config.sleepFn ?? defaultSleep;
  const fetchedAt = new Date().toISOString();

  const resolved = { mcpUrl, webBaseUrl, timeout, fetchFn, sleepFn };

  // ── MCP primary path (with retry) ──────────────────────────────────────
  let primaryError: string | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1), 30_000);
      console.warn(
        `  ⚠️  MCP calendar retry ${attempt}/${maxRetries} after ${delay} ms…`,
      );
      await sleepFn(delay);
    }

    try {
      console.log(`  🔄 [fetch-calendar] MCP primary attempt ${attempt + 1}/${maxRetries + 1}…`);
      const raw = await callMcpCalendarEvents(from, to, resolved);
      const events = raw.map(normalizeMcpCalendarEvent);
      console.log(`  ✅ [fetch-calendar] MCP primary succeeded — ${events.length} events`);

      return {
        events,
        manifest: {
          date: from,
          dateTo: to,
          path: 'mcp-primary',
          eventCount: events.length,
          fetchedAt,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      primaryError = msg;
      const kind = err instanceof CalendarMcpError ? err.kind : 'unknown';
      console.warn(`  ⚠️  [fetch-calendar] MCP attempt ${attempt + 1} failed (${kind}): ${msg.slice(0, 120)}`);
      // HTML error is definitive — no point retrying the same endpoint.
      if (err instanceof CalendarMcpError && err.kind === 'html') break;
    }
  }

  // ── Web fallback path ──────────────────────────────────────────────────
  console.log(`  🔄 [fetch-calendar] Falling back to riksdagen.se/sv/kalendarium/…`);
  let fallbackError: string | undefined;
  try {
    const events = await fetchWebCalendar(from, to, resolved);
    console.log(`  ✅ [fetch-calendar] Web fallback succeeded — ${events.length} events`);

    return {
      events,
      manifest: {
        date: from,
        dateTo: to,
        path: 'web-fallback',
        eventCount: events.length,
        primaryError,
        fetchedAt,
      },
    };
  } catch (err) {
    fallbackError = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ [fetch-calendar] Web fallback also failed: ${fallbackError}`);
  }

  // ── Both paths exhausted ───────────────────────────────────────────────
  return {
    events: [],
    manifest: {
      date: from,
      dateTo: to,
      path: 'none',
      eventCount: 0,
      primaryError,
      fallbackError,
      fetchedAt,
    },
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CALENDAR_DIR = path.join(REPO_ROOT, 'data', 'calendar');

/**
 * Write a `CalendarFetchResult` to `data/calendar/{from}.json`.
 *
 * The file is an object with `{ manifest, events }` so that consumers can
 * load a single file and get both the data and the provenance record.
 */
export function persistCalendarJson(
  from: string,
  result: CalendarFetchResult,
  outputDir: string = CALENDAR_DIR,
): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${from}.json`);
  const payload = {
    schema: 'riksdagsmonitor-calendar/1.0',
    manifest: result.manifest,
    events: result.events,
  };
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`  💾 [fetch-calendar] Persisted ${result.events.length} events → ${outputPath}`);
  return outputPath;
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

/**
 * Generate a manifest markdown snippet suitable for appending to
 * `data-download-manifest.md`.
 */
export function formatManifestMarkdown(manifest: CalendarFetchManifest): string {
  const pathLabel =
    manifest.path === 'mcp-primary'
      ? '✅ MCP primary (`get_calendar_events`)'
      : manifest.path === 'web-fallback'
        ? '⚠️ Web fallback (`riksdagen.se/sv/kalendarium/`)'
        : '❌ None (both paths failed)';

  const lines = [
    `## Calendar Fetch — ${manifest.date}`,
    '',
    `- **Path used**: ${pathLabel}`,
    `- **Events**: ${manifest.eventCount}`,
    `- **Fetched at**: ${manifest.fetchedAt}`,
  ];
  if (manifest.primaryError) {
    lines.push(`- **Primary error**: ${manifest.primaryError.slice(0, 200)}`);
  }
  if (manifest.fallbackError) {
    lines.push(`- **Fallback error**: ${manifest.fallbackError.slice(0, 200)}`);
  }
  return lines.join('\n');
}

/** Parse CLI argv into `{ from, to, persist }`. */
export function parseCalendarArgs(argv: readonly string[]): {
  from: string;
  to: string;
  persist: boolean;
} {
  const flags = new Map<string, string>();
  const booleans = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token || !token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      booleans.add(key);
    }
  }
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const from = flags.get('from') ?? '';
  const to = flags.get('to') ?? '';
  if (!ISO_DATE_RE.test(from)) {
    throw new Error(`--from must be an ISO 8601 date (YYYY-MM-DD), got: "${from}"`);
  }
  if (!ISO_DATE_RE.test(to)) {
    throw new Error(`--to must be an ISO 8601 date (YYYY-MM-DD), got: "${to}"`);
  }
  return { from, to, persist: booleans.has('persist') };
}

async function main(): Promise<void> {
  const args = parseCalendarArgs(process.argv.slice(2));
  console.log(`📅 [fetch-calendar] Fetching ${args.from} → ${args.to}`);

  const result = await fetchCalendarWithFallback(args.from, args.to);

  console.log(formatManifestMarkdown(result.manifest));

  if (args.persist) {
    persistCalendarJson(args.from, result);
  } else {
    // Print JSON to stdout for piping / agentic workflow consumption.
    console.log(JSON.stringify(result, null, 2));
  }

  if (result.manifest.path === 'none') {
    process.exit(1);
  }
}

// Guard: run `main()` only when this file is the direct entry point.
if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main().catch((err: unknown) => {
    console.error('❌ [fetch-calendar] Fatal error:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
