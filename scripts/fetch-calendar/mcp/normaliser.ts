/**
 * @module scripts/fetch-calendar/mcp/normaliser
 * @description Normalize raw events from the MCP `get_calendar_events`
 * response into the canonical `CalendarEvent` shape.
 *
 * The riksdag-regering server uses iCalendar field names (`DTSTART`,
 * `DTEND`, `SUMMARY`, etc.) with either upper-case or lower-case keys — both
 * are handled.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { CalendarEvent } from '../types.js';

/**
 * Normalize a raw event object from the MCP `get_calendar_events` response
 * into the canonical `CalendarEvent` shape.
 */
export function normalizeMcpCalendarEvent(raw: unknown): CalendarEvent {
  const r = (raw ?? {}) as Record<string, unknown>;

  const dtstart = String(r['dtstart'] ?? r['DTSTART'] ?? r['start'] ?? '').trim();
  const dtend = String(r['dtend'] ?? r['DTEND'] ?? r['end'] ?? '').trim() || undefined;
  const org = String(r['organ'] ?? r['org'] ?? r['ORG'] ?? r['location'] ?? '').trim();
  const akt = String(r['akt'] ?? r['AKT'] ?? r['type'] ?? r['kategori'] ?? '').trim();
  const summary = String(r['summary'] ?? r['SUMMARY'] ?? r['titel'] ?? r['title'] ?? '').trim();

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
