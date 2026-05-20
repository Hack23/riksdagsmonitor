/**
 * MCP event normaliser — normalizeMcpCalendarEvent.
 *
 * Migrated verbatim from tests/fetch-calendar.test.ts (describe
 * 'normalizeMcpCalendarEvent').
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { normalizeMcpCalendarEvent } from '../../../scripts/fetch-calendar.js';

describe('normalizeMcpCalendarEvent', () => {
  it('maps standard MCP event fields', () => {
    const raw = {
      dtstart: '2026-04-28T10:00:00',
      organ: 'FiU',
      akt: 'votering',
      summary: 'Budget-omröstning',
      dok_id: 'H901FiU10',
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.dtstart).toBe('2026-04-28T10:00:00');
    expect(event.org).toBe('FiU');
    expect(event.akt).toBe('votering');
    expect(event.summary).toBe('Budget-omröstning');
    expect(event.doc_refs).toContain('H901FiU10');
    expect(event.source).toBe('mcp-primary');
  });

  it('handles upper-case DTSTART / SUMMARY keys', () => {
    const raw = {
      DTSTART: '2026-04-29T14:00:00',
      SUMMARY: 'Utskottsmöte',
      organ: 'NU',
      akt: 'utskottsmöte',
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.dtstart).toBe('2026-04-29T14:00:00');
    expect(event.summary).toBe('Utskottsmöte');
  });

  it('includes dtend when present', () => {
    const raw = {
      dtstart: '2026-04-28T10:00:00',
      dtend: '2026-04-28T12:00:00',
      organ: 'KU',
      akt: 'beredning',
      summary: 'Konstitutionsutskottets beredning',
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.dtend).toBe('2026-04-28T12:00:00');
  });

  it('collects multiple doc_refs from array fields', () => {
    const raw = {
      dtstart: '2026-04-28T10:00:00',
      organ: 'FiU',
      akt: 'debatt',
      summary: 'Plenidebatt',
      url: ['https://riksdagen.se/dokument/H901FiU1', 'https://riksdagen.se/dokument/H901FiU2'],
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.doc_refs).toHaveLength(2);
  });

  it('handles null / undefined gracefully', () => {
    const event = normalizeMcpCalendarEvent(null);
    expect(event.dtstart).toBe('');
    expect(event.org).toBe('');
    expect(event.doc_refs).toEqual([]);
    expect(event.source).toBe('mcp-primary');
  });

  it('omits dtend when not present in raw event', () => {
    const raw = {
      dtstart: '2026-04-28T10:00:00',
      organ: 'KU',
      akt: 'beredning',
      summary: 'Konstitutionsutskottets möte',
      // dtend intentionally absent
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.dtend).toBeUndefined();
    expect(event.dtstart).toBe('2026-04-28T10:00:00');
  });
});
