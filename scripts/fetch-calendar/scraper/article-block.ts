/**
 * @module scripts/fetch-calendar/scraper/article-block
 * @description Parser for the article-per-event Riksdag kalendarium markup.
 *
 * Pattern A (article-per-event):
 * ```html
 * <article class="calendar-item" data-akt="votering" data-organ="FiU">
 *   <time datetime="2026-04-28T10:00:00">...</time>
 *   <h2 class="calendar-item__title">
 *     <a href="/sv/dokument-och-lagar/utskottens-arbete/betankanden/H901FiU1/">Budget 2026</a>
 *   </h2>
 * </article>
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
