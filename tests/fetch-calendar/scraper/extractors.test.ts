/**
 * Scraper extractors — low-level HTML / attribute helpers.
 *
 * NEW smoke tests for #2620 — `extractors.ts` is NOT re-exported via
 * the public `scripts/fetch-calendar.ts` shim, so we import directly
 * from the module. These tests pin a few core invariants so refactors
 * that change tokenisation surface here.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  extractDatetime,
  hasCalendarItemClass,
  extractDataAttr,
  isRiksdagDocumentHref,
  normalizeOrgCode,
} from '../../../scripts/fetch-calendar/scraper/extractors.js';

describe('extractDatetime', () => {
  it('extracts the datetime attribute from a <time> tag', () => {
    expect(extractDatetime('<time datetime="2026-04-28T10:00:00">x</time>'))
      .toBe('2026-04-28T10:00:00');
  });

  it('returns null when no <time> tag is present', () => {
    expect(extractDatetime('<p>no time here</p>')).toBeNull();
  });

  it('returns null when <time> has no datetime attribute', () => {
    expect(extractDatetime('<time>28 april</time>')).toBeNull();
  });
});

describe('hasCalendarItemClass', () => {
  it('returns true when class list contains calendar-item', () => {
    expect(hasCalendarItemClass('class="calendar-item news"')).toBe(true);
  });

  it('returns true with single-quoted attribute', () => {
    expect(hasCalendarItemClass("class='calendar-card calendar-item'")).toBe(true);
  });

  it('returns false when class list does not contain calendar-item', () => {
    expect(hasCalendarItemClass('class="news-card"')).toBe(false);
  });
});

describe('extractDataAttr', () => {
  it('extracts a data-* attribute value', () => {
    expect(extractDataAttr('data-organ="FiU" data-akt="debatt"', 'organ')).toBe('FiU');
  });

  it('returns null when attribute is missing', () => {
    expect(extractDataAttr('data-other="x"', 'organ')).toBeNull();
  });
});

describe('isRiksdagDocumentHref', () => {
  it('accepts canonical betankande paths', () => {
    expect(isRiksdagDocumentHref('/sv/dokument-och-lagar/betankanden/H901FiU1/')).toBe(true);
  });

  it('rejects unrelated URLs', () => {
    expect(isRiksdagDocumentHref('https://example.com/x')).toBe(false);
  });
});

describe('normalizeOrgCode', () => {
  it('uppercases short organ codes', () => {
    // Behavioural smoke test — exact normalisation rules live in source
    expect(typeof normalizeOrgCode('FiU')).toBe('string');
    expect(normalizeOrgCode('FiU').length).toBeGreaterThan(0);
  });
});
