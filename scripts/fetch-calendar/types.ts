/**
 * @module scripts/fetch-calendar/types
 * @description Shared type/interface declarations for the calendar fetcher.
 *
 * Pure types — no runtime behaviour. Re-exported via the
 * `scripts/fetch-calendar.ts` shim so callers keep their existing imports.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

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
