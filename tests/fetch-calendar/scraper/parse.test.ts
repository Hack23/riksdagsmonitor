/**
 * Web fallback scraper — parseRiksdagKalendariumHtml + fetchWebCalendar.
 *
 * Migrated verbatim from tests/fetch-calendar.test.ts (describes
 * 'parseRiksdagKalendariumHtml' and 'fetchWebCalendar').
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import {
  parseRiksdagKalendariumHtml,
  fetchWebCalendar,
} from '../../../scripts/fetch-calendar.js';

// ---------------------------------------------------------------------------
// Helpers (duplicated per spec)
// ---------------------------------------------------------------------------

function htmlFetch(html: string, status = 200): typeof fetch {
  return vi.fn(async () => new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html' },
  })) as unknown as typeof fetch;
}

function errorFetch(message = 'network error'): typeof fetch {
  return vi.fn(async () => { throw new Error(message); }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------

describe('parseRiksdagKalendariumHtml', () => {
  it('parses article pattern events', () => {
    const html = `
      <article class="calendar-item" data-akt="votering" data-organ="FiU">
        <time datetime="2026-04-28T10:00:00">Måndag 28 april 10.00</time>
        <h2 class="calendar-item__title">
          <a href="/sv/dokument-och-lagar/utskottens-arbete/betankanden/H901FiU1/">Budget 2026</a>
        </h2>
      </article>
      <article class="calendar-item" data-akt="utskottsmöte" data-organ="NU">
        <time datetime="2026-04-28T13:00:00">Måndag 28 april 13.00</time>
        <h2 class="calendar-item__title">Näringspolitik</h2>
      </article>
    `;
    const events = parseRiksdagKalendariumHtml(html);
    expect(events).toHaveLength(2);
    expect(events[0]?.dtstart).toBe('2026-04-28T10:00:00');
    expect(events[0]?.org).toBe('FiU');
    expect(events[0]?.akt).toBe('votering');
    expect(events[0]?.summary).toContain('Budget 2026');
    expect(events[0]?.doc_refs).toContain('/sv/dokument-och-lagar/utskottens-arbete/betankanden/H901FiU1/');
    expect(events[0]?.source).toBe('web-fallback');
    expect(events[1]?.dtstart).toBe('2026-04-28T13:00:00');
    expect(events[1]?.org).toBe('NU');
  });

  it('falls back to list-item pattern when no articles found', () => {
    const html = `
      <ul>
        <li class="calendar-list__item">
          <time datetime="2026-04-29T09:00:00">Tisdag 29 april 09.00</time>
          <span class="calendar-list__organ">KU</span>
          <span class="calendar-list__type">Beredning</span>
          <a href="/sv/dokument-och-lagar/interpellationer/abc123/">KU-beredning</a>
        </li>
      </ul>
    `;
    const events = parseRiksdagKalendariumHtml(html);
    expect(events).toHaveLength(1);
    expect(events[0]?.dtstart).toBe('2026-04-29T09:00:00');
    expect(events[0]?.org).toBe('KU');
    expect(events[0]?.source).toBe('web-fallback');
  });

  it('returns empty array for HTML with no recognisable calendar markup', () => {
    const html = '<html><body><p>No events today.</p></body></html>';
    expect(parseRiksdagKalendariumHtml(html)).toEqual([]);
  });

  it('ignores non-calendar article blocks even when they contain time elements', () => {
    const html = `
      <article class="news-card">
        <time datetime="2026-04-28T10:00:00">28 april</time>
        <h2>Pressmeddelande som inte är kalenderhändelse</h2>
      </article>
    `;
    expect(parseRiksdagKalendariumHtml(html)).toEqual([]);
  });

  it('parses calendar-item articles when class attribute uses single quotes', () => {
    const html = `
      <article data-akt="debatt" class='calendar-card calendar-item' data-organ="FiU">
        <time datetime="2026-04-28T15:00:00">15.00</time>
        <h2>Finansdebatt</h2>
      </article>
    `;
    const events = parseRiksdagKalendariumHtml(html);
    expect(events).toHaveLength(1);
    expect(events[0]?.org).toBe('FiU');
    expect(events[0]?.summary).toContain('Finansdebatt');
  });
});

describe('fetchWebCalendar', () => {
  it('fetches and parses a calendar page with article events', async () => {
    const html = `
      <article class="calendar-item" data-akt="votering" data-organ="FiU">
        <time datetime="2026-04-28T10:00:00">10.00</time>
        <h2><a href="/sv/dokument-och-lagar/betankanden/H901FiU1/">Budget</a></h2>
      </article>
    `;
    const config = {
      webBaseUrl: 'https://riksdagen.test',
      timeout: 3_000,
      fetchFn: htmlFetch(html),
    };

    const events = await fetchWebCalendar('2026-04-28', '2026-05-04', config);
    expect(events).toHaveLength(1);
    expect(events[0]?.dtstart).toBe('2026-04-28T10:00:00');
    expect(events[0]?.source).toBe('web-fallback');
  });

  it('throws on a non-OK HTTP response', async () => {
    const config = {
      webBaseUrl: 'https://riksdagen.test',
      timeout: 3_000,
      fetchFn: htmlFetch('<html>Not Found</html>', 404),
    };

    await expect(
      fetchWebCalendar('2026-04-28', '2026-05-04', config),
    ).rejects.toThrow(/HTTP error: 404/);
  });

  it('throws on a network fetch failure', async () => {
    const config = {
      webBaseUrl: 'https://riksdagen.test',
      timeout: 3_000,
      fetchFn: errorFetch('EHOSTUNREACH'),
    };

    await expect(
      fetchWebCalendar('2026-04-28', '2026-05-04', config),
    ).rejects.toThrow(/EHOSTUNREACH/);
  });
});
