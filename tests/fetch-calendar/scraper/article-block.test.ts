/**
 * Web fallback scraper — parseCalendarArticle helper.
 *
 * Migrated verbatim from tests/fetch-calendar.test.ts (describe
 * 'parseCalendarArticle').
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { parseCalendarArticle } from '../../../scripts/fetch-calendar.js';

describe('parseCalendarArticle', () => {
  it('returns null when no datetime found', () => {
    const result = parseCalendarArticle('data-akt="debatt"', '<h2>No time element</h2>');
    expect(result).toBeNull();
  });

  it('extracts organ and akt from data attributes', () => {
    const body = `<time datetime="2026-04-28T11:00:00">11.00</time><h2>Test</h2>`;
    const event = parseCalendarArticle('data-organ="SoU" data-akt="debatt"', body);
    expect(event?.org).toBe('SoU');
    expect(event?.akt).toBe('debatt');
  });

  it('falls back to span text for org and akt when data attributes absent', () => {
    const body = `
      <time datetime="2026-04-28T10:00:00">10.00</time>
      <span class="organ">CU</span>
      <span class="akt">Utskottsmöte</span>
      <h2>Civilutskottets möte</h2>
    `;
    const event = parseCalendarArticle('', body);
    expect(event?.org).toBe('CU');
  });
});
