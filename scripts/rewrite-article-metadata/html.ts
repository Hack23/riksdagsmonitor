/**
 * @module rewrite-article-metadata/html
 * @description HTML parse / rewrite helpers (regex-based, byte-safe).
 * Pure helpers extracted from the monolithic legacy script.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { __test__ } from '../render-lib/aggregator/index.js';

const { ADMIN_FIELD_RE, ADMIN_FRAGMENT_SPLITTER } = __test__;

export const BANNED_PHRASES: readonly RegExp[] = [
  /AI[- ]generated\s+political\s+intelligence/i,
  /Executive\s+Brief\s*[—-]/i,
  /\bAdmiralty\b/i,
];

export function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function htmlUnescape(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/** Strip inline HTML tags and collapse whitespace to produce plain prose. */
export function stripTagsToText(fragment: string): string {
  return fragment
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Decode common HTML entities used in our articles (numeric + named). */
export function decodeEntities(s: string): string {
  let out = htmlUnescape(s);
  out = out.replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)));
  return out;
}

/**
 * Extract the first prose paragraph from the article body, skipping
 * admin-byline blocks, generic filler copy, tables, figures, code blocks,
 * and Mermaid diagrams. Returns `null` when no usable prose is found.
 */
export function extractBestDescription(articleHtml: string): string | null {
  const scrubbed = articleHtml
    .replace(/<pre class="mermaid"[^>]*>[\s\S]*?<\/pre>/gi, '')
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, '')
    .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, '')
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '');

  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(scrubbed)) !== null) {
    const raw = m[1] ?? '';
    const text = decodeEntities(stripTagsToText(raw));
    if (text.length < 40) continue;

    const cleaned = text.replace(/^\s*(?:🎯|BLUF[:：]?)\s*/i, '').trim();

    if (BANNED_PHRASES.some((rx) => rx.test(cleaned))) continue;

    const fragments = cleaned.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    const allAdmin = fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()));
    if (allAdmin) continue;

    return cleaned;
  }
  return null;
}

/**
 * Strip admin-byline fragments from an existing description string.
 * Returns the remaining prose, or `null` when every fragment is admin.
 */
export function stripAdminFromDescription(description: string): string | null {
  const fragments = description.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
  const prose = fragments.filter((f) => !ADMIN_FIELD_RE.test(f.trim())).map((f) => f.trim());
  if (prose.length === 0) return null;
  const joined = prose.join(' ').replace(/\s+/g, ' ').trim();
  return joined.length > 0 ? joined : null;
}
