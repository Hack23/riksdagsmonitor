/**
 * @module scripts/fetch-calendar/scraper/parse
 * @description Entry point for the Riksdag kalendarium HTML scraper.
 *
 * Dispatches to the article-block parser first (`<article class="calendar-item">`)
 * and falls back to the list-item parser (`<li class="calendar-list__item">`)
 * when no article blocks are found.
 *
 * Defensive regex-based — matches the style of `statskontoret-client.ts`'s
 * link extractor. Per `Threat_Modeling.md` no external HTML parser is used,
 * so the failure mode is "no events" rather than "process aborts on bad
 * HTML".
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { CalendarEvent, CalendarFetchConfig } from '../types.js';
import { parseCalendarArticle } from './article-block.js';
import { parseCalendarListItem } from './list-item.js';
import { hasCalendarItemClass } from './extractors.js';

/**
 * Parse the HTML returned by `https://www.riksdagen.se/sv/kalendarium/` and
 * extract calendar events into the normalized `CalendarEvent` shape.
 */
export function parseRiksdagKalendariumHtml(html: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  const articleRe = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
  for (const articleMatch of html.matchAll(articleRe)) {
    const attrs = articleMatch[1] ?? '';
    if (!hasCalendarItemClass(attrs)) continue;
    const body = articleMatch[2] ?? '';
    const event = parseCalendarArticle(attrs, body);
    if (event) events.push(event);
  }

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

export const DEFAULT_WEB_BASE_URL = 'https://www.riksdagen.se';

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
  const url = `${config.webBaseUrl}/sv/kalendarium/?from=${encodeURIComponent(
    from,
  )}&tom=${encodeURIComponent(to)}`;

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
      throw new Error(
        `Riksdag web calendar HTTP error: ${response.status} ${response.statusText}`,
      );
    }

    html = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Riksdag web calendar fetch failed: ${msg}`, { cause: err });
  } finally {
    clearTimeout(tid);
  }

  return parseRiksdagKalendariumHtml(html);
}
