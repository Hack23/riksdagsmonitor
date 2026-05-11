/**
 * @module Infrastructure/BackfillLib/HtmlInspector
 * @category Intelligence Operations / Supporting Infrastructure
 * @name HTML metadata extractor for existing `news/*.html` articles
 *
 * @description
 * Parses an existing `news/*.html` file and returns the ten metadata
 * surfaces named in the PR 2 issue without triggering the full render
 * pipeline. This is the read-only counterpart to
 * `scripts/rewrite-article-metadata.ts`; it never mutates the file.
 *
 * Parsing is regex-based rather than DOM-based for three reasons:
 *
 * 1. **Speed.** Inspecting thousands of articles in dry-run mode must
 *    complete in a few seconds on CI, not minutes.
 * 2. **Byte safety.** The existing rewriter already uses the same
 *    regex approach so output is consistent between the two tools.
 * 3. **No extra dependency.** `jsdom` / `cheerio` would pull a few MB
 *    of node_modules for a task the built-in `RegExp` handles.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';

/** Structured metadata extracted from a single article HTML file. */
export interface ArticleMetadata {
  /** Absolute path of the inspected file. */
  readonly filePath: string;
  /** `<html lang="…">` value (e.g. `en`, `sv`, `ar`). Empty string when
   *  the attribute is missing — callers fall back to the filename code
   *  via `meta.lang || fp.lang`. */
  readonly lang: string;
  /** `<title>…</title>` content (HTML-decoded, no trimming beyond trim). */
  readonly title: string;
  /** `<meta name="description" content="…">`. */
  readonly metaDescription: string;
  /** `<meta property="og:title" content="…">`. */
  readonly ogTitle: string;
  /** `<meta property="og:description" content="…">`. */
  readonly ogDescription: string;
  /** `<meta name="twitter:title" content="…">`. */
  readonly twitterTitle: string;
  /** `<meta name="twitter:description" content="…">`. */
  readonly twitterDescription: string;
  /** JSON-LD `headline` field (first `<script type="application/ld+json">`). */
  readonly jsonLdHeadline: string;
  /** JSON-LD `alternativeHeadline` field. */
  readonly jsonLdAlternativeHeadline: string;
  /** JSON-LD `description` field. */
  readonly jsonLdDescription: string;
  /** First ~2KB of the `<article>` plain text (tags stripped, whitespace
   *  collapsed). Used by PRs 3/4 as a diagnostic preview — never
   *  validated against the contract directly. */
  readonly bodyPlainText: string;
}

const REGEXES = {
  htmlTag: /<html\b[^>]*>/i,
  title: /<title[^>]*>([\s\S]*?)<\/title>/i,
  article: /<article\b[^>]*>([\s\S]*?)<\/article>/i,
} as const;

/** Decode the small subset of HTML entities used by the rendered articles.
 *  Single-pass so `&amp;quot;` survives as the literal text `&quot;`
 *  rather than being double-unescaped to `"`. (CodeQL js/double-escaping.) */
function htmlDecode(s: string): string {
  const named: Record<string, string> = {
    amp: '&',
    quot: '"',
    apos: "'",
    lt: '<',
    gt: '>',
    nbsp: ' ',
  };
  return s.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]+)|#39);?/g,
    (full, dec?: string, hex?: string, name?: string) => {
      if (dec) return decodeCodePoint(Number(dec), full);
      if (hex) return decodeCodePoint(parseInt(hex, 16), full);
      if (full === '&#39;') return "'";
      if (name) {
        const lower = name.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(named, lower)) {
          return named[lower] as string;
        }
      }
      return full;
    });
}

function decodeCodePoint(value: number, fallback: string): string {
  if (
    value < 0 ||
    value > 0x10ffff ||
    (value >= 0xd800 && value <= 0xdfff)
  ) {
    return fallback;
  }
  return String.fromCodePoint(value);
}

/** Strip inline HTML tags and collapse whitespace to produce plain prose.
 *  Script / style end tags tolerate whitespace and malformed trailing
 *  tokens before `>` so an odd `</script\t\n bar>` cannot leak body text. */
function stripTags(fragment: string): string {
  return fragment
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\b[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract a captured group or return `''`. */
function match1(html: string, re: RegExp): string {
  const m = html.match(re);
  return m ? htmlDecode(m[1] ?? '').trim() : '';
}

function extractMetaContent(
  html: string,
  selectorAttr: 'name' | 'property',
  selectorValue: string,
): string {
  const map = parseAllMetaTags(html);
  return map.get(`${selectorAttr}:${selectorValue.toLowerCase()}`) ?? '';
}

/** Walk every `<meta …>` once and build a lookup keyed by
 *  `${name|property}:${value}` (lowercased). The CLI scans thousands of
 *  files, so collapsing five sequential regex passes into one keeps the
 *  hot path small. */
function parseAllMetaTags(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const metaTagRe = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaTagRe.exec(html)) !== null) {
    const attrs = parseAttributes(m[0]);
    const content = htmlDecode(attrs.content ?? '').trim();
    const name = attrs.name?.toLowerCase();
    const property = attrs.property?.toLowerCase();
    if (name) {
      const key = `name:${name}`;
      if (!map.has(key)) map.set(key, content);
    }
    if (property) {
      const key = `property:${property}`;
      if (!map.has(key)) map.set(key, content);
    }
  }
  return map;
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(tag)) !== null) {
    attrs[m[1]!.toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

/** Extract the `lang` attribute from the document's `<html>` tag,
 *  tolerating single-quoted, double-quoted, and unquoted attribute
 *  values plus any preceding attributes. Returns `''` when missing so
 *  callers can apply their own fallback (e.g. filename language). */
function extractHtmlLang(html: string): string {
  const m = html.match(REGEXES.htmlTag);
  if (!m) return '';
  const attrs = parseAttributes(m[0]);
  return htmlDecode(attrs.lang ?? '').trim();
}

/** Walk every `<script>` once, keep the JSON-LD ones, and return their
 *  parsed (or `null` for malformed) bodies. The script tag matcher
 *  tolerates additional attributes, alternate orderings, and
 *  single-quoted `type` values. */
function parseAllJsonLdBlocks(html: string): readonly unknown[] {
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi;
  const blocks: unknown[] = [];
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html)) !== null) {
    const attrs = parseAttributes(`<script ${m[1] ?? ''}>`);
    const type = (attrs.type ?? '').toLowerCase();
    if (type !== 'application/ld+json') continue;
    const body = m[2] ?? '';
    try {
      blocks.push(JSON.parse(body));
    } catch {
      // Skip malformed blocks — never fatal.
    }
  }
  return blocks;
}

function readJsonLdFieldFromBlocks(
  blocks: readonly unknown[],
  field: 'headline' | 'alternativeHeadline' | 'description',
): string {
  for (const parsed of blocks) {
    const value = readJsonLdField(parsed, field);
    if (value) return value;
  }
  return '';
}

function readJsonLdField(
  parsed: unknown,
  field: 'headline' | 'alternativeHeadline' | 'description',
): string {
  if (!parsed || typeof parsed !== 'object') return '';
  const candidates: unknown[] = [];
  const record = parsed as Record<string, unknown>;
  if (Array.isArray(record['@graph'])) {
    candidates.push(...(record['@graph'] as unknown[]));
  }
  candidates.push(record);
  for (const c of candidates) {
    if (c && typeof c === 'object') {
      const v = (c as Record<string, unknown>)[field];
      if (typeof v === 'string' && v.trim().length > 0) return v.trim();
    }
  }
  return '';
}

/**
 * Inspect a single `news/*.html` file and return its full metadata
 * surface. The file is read from disk; callers who already have the
 * contents in memory should use {@link inspectHtmlContent} instead.
 */
export function inspectHtmlFile(filePath: string): ArticleMetadata {
  const html = fs.readFileSync(filePath, 'utf8');
  return inspectHtmlContent(html, filePath);
}

/**
 * Inspect an already-loaded HTML string and return its metadata. Split
 * from {@link inspectHtmlFile} so tests can run against literal HTML
 * without writing to disk.
 */
export function inspectHtmlContent(html: string, filePath: string = ''): ArticleMetadata {
  const lang = extractHtmlLang(html);
  const title = match1(html, REGEXES.title);

  const metaMap = parseAllMetaTags(html);
  const jsonLdBlocks = parseAllJsonLdBlocks(html);

  const metaDescription = metaMap.get('name:description') ?? '';
  const ogTitle = metaMap.get('property:og:title') ?? '';
  const ogDescription = metaMap.get('property:og:description') ?? '';
  const twitterTitle = metaMap.get('name:twitter:title') ?? '';
  const twitterDescription = metaMap.get('name:twitter:description') ?? '';

  const jsonLdHeadline = readJsonLdFieldFromBlocks(jsonLdBlocks, 'headline');
  const jsonLdAlternativeHeadline = readJsonLdFieldFromBlocks(jsonLdBlocks, 'alternativeHeadline');
  const jsonLdDescription = readJsonLdFieldFromBlocks(jsonLdBlocks, 'description');

  const articleMatch = html.match(REGEXES.article);
  const bodyPlainText = articleMatch
    ? stripTags(articleMatch[1] ?? '').slice(0, 2048)
    : '';

  return {
    filePath,
    lang,
    title,
    metaDescription,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    jsonLdHeadline,
    jsonLdAlternativeHeadline,
    jsonLdDescription,
    bodyPlainText,
  };
}

export const __test__ = {
  htmlDecode,
  stripTags,
  extractMetaContent,
  parseAttributes,
  REGEXES,
};
