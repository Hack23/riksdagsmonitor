/**
 * Web fallback scraper — parseCalendarListItem helper.
 *
 * Migrated verbatim from tests/fetch-calendar.test.ts (describe
 * 'parseCalendarListItem').
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { parseCalendarListItem } from '../../../scripts/fetch-calendar.js';

describe('parseCalendarListItem', () => {
  it('returns null when no datetime found', () => {
    const result = parseCalendarListItem('', '<span class="organ">FiU</span>');
    expect(result).toBeNull();
  });

  it('extracts all fields from a well-formed list item', () => {
    const body = `
      <time datetime="2026-05-02T14:00:00">Lördag 2 maj 14.00</time>
      <span class="calendar-list__organ">JuU</span>
      <span class="calendar-list__type">Votering</span>
      <a href="/sv/dokument-och-lagar/betankanden/H901JuU10/">JuU-betänkande</a>
    `;
    const event = parseCalendarListItem('', body);
    expect(event?.dtstart).toBe('2026-05-02T14:00:00');
    expect(event?.org).toBe('JuU');
    expect(event?.doc_refs).toContain('/sv/dokument-och-lagar/betankanden/H901JuU10/');
    expect(event?.source).toBe('web-fallback');
  });
});
