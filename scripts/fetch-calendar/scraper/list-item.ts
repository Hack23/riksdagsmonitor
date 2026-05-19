/**
 * @module scripts/fetch-calendar/scraper/list-item
 * @description Parser for the list-item-per-event Riksdag kalendarium markup.
 *
 * Pattern B (list-item-per-event):
 * ```html
 * <li class="calendar-list__item">
 *   <time datetime="2026-04-28T09:00:00">...</time>
 *   <span class="calendar-list__type">Utskottsmöte</span>
 *   <span class="calendar-list__organ">NU</span>
 *   <a href="/sv/...">Näringspolitik - Bredbands</a>
 * </li>
 * ```
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { CalendarEvent } from '../types.js';
import {
  decodeHtmlEntities,
  extractDataAttr,
  extractDatetime,
  extractHeadingAndLinks,
  extractSpanText,
  normalizeAkt,
  normalizeOrgCode,
  stripTags,
} from './extractors.js';

/** Parse an `<li>` calendar list item block. */
export function parseCalendarListItem(attrs: string, body: string): CalendarEvent | null {
  const dtstart = extractDatetime(body);
  if (!dtstart) return null;

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
