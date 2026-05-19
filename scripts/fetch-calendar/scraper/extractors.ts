/**
 * @module scripts/fetch-calendar/scraper/extractors
 * @description Low-level HTML extraction primitives used by the
 * Riksdag kalendarium scraper.
 *
 * Each helper is intentionally small and regex-based (no external HTML
 * parser) so they can be fuzz-tested individually against malformed HTML.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { decodeHtmlEntities } from '../../html-utils.js';

/** Escape a string for safe use in a `new RegExp(...)` constructor. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extract the `datetime` attribute from a `<time>` element. */
export function extractDatetime(html: string): string | null {
  const m = html.match(/<time\b[^>]*\bdatetime=(["'])(.*?)\1/i);
  return m ? (m[2] ?? null) : null;
}

/** Extract a `data-{attr}` attribute value from a tag's attribute string. */
export function extractDataAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`\\bdata-${escapeRegex(name)}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  const m = attrs.match(re);
  return m && m[2]?.trim() ? m[2].trim() : null;
}

/** True when an element attribute string contains a `calendar-item` class token. */
export function hasCalendarItemClass(attrs: string): boolean {
  const m = attrs.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
  return m ? (m[2] ?? '').split(/\s+/).includes('calendar-item') : false;
}

/**
 * Extract the inner text of a `<span>` whose class contains `{name}`.
 * Uses a simple, non-greedy regex that covers the common markup pattern.
 */
export function extractSpanText(html: string, name: string): string | null {
  const safe = escapeRegex(name);
  const re = new RegExp(
    `<span\\b[^>]*\\bclass\\s*=\\s*(["'])[^"']*${safe}[^"']*\\1[^>]*>([\\s\\S]*?)<\\/span>`,
    'i',
  );
  const m = html.match(re);
  return m ? stripTags(m[2] ?? '').trim() || null : null;
}

/**
 * Extract the heading text (h1–h6 or first anchor) and any document
 * reference links from an event block.
 */
export function extractHeadingAndLinks(html: string): {
  summary: string;
  docRefs: string[];
} {
  const headingRe = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i;
  const headingMatch = html.match(headingRe);
  const summary = headingMatch ? (headingMatch[1] ?? '') : extractFirstAnchorText(html);

  const docRefs: string[] = [];
  const hrefRe = /<a\b[^>]*\bhref=(["'])([^"']+)\1[^>]*>/gi;
  for (const m of html.matchAll(hrefRe)) {
    const href = (m[2] ?? '').trim();
    if (isRiksdagDocumentHref(href)) {
      docRefs.push(href);
    }
  }

  return { summary, docRefs };
}

/** Extract the text of the first `<a>` anchor in an HTML fragment. */
export function extractFirstAnchorText(html: string): string {
  const m = html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
  return m ? (m[1] ?? '') : '';
}

/** True when an href looks like a Riksdag document or proceedings link. */
export function isRiksdagDocumentHref(href: string): boolean {
  return (
    href.includes('/dokument') ||
    href.includes('/betankanden') ||
    href.includes('/propositioner') ||
    href.includes('/motioner') ||
    href.includes('/interpellationer')
  );
}

/** Remove all HTML tags from a string. */
export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/** Normalize committee/organ codes by collapsing whitespace and trimming only. */
export function normalizeOrgCode(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/** Normalize activity type strings to lower-case-with-hyphens. */
export function normalizeAkt(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-åäö]/g, '')
    .trim();
}

export { decodeHtmlEntities };
