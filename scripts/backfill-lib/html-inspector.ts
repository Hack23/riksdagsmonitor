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
 * 1. **Speed.** Inspecting 2,736 articles in dry-run mode must complete
 *    in a few seconds on CI, not minutes.
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
  htmlLang: /<html[^>]*\blang="([^"]+)"/i,
  title: /<title[^>]*>([\s\S]*?)<\/title>/i,
  metaDescription:
    /<meta\s+name="description"\s+content="([^"]*)"/i,
  ogTitle:
    /<meta\s+property="og:title"\s+content="([^"]*)"/i,
  ogDescription:
    /<meta\s+property="og:description"\s+content="([^"]*)"/i,
  twitterTitle:
    /<meta\s+name="twitter:title"\s+content="([^"]*)"/i,
  twitterDescription:
    /<meta\s+name="twitter:description"\s+content="([^"]*)"/i,
  jsonLdScript: /<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/gi,
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
      if (dec) return String.fromCodePoint(Number(dec));
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
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

/** Strip inline HTML tags and collapse whitespace to produce plain prose.
 *  Script / style end tags allow whitespace before `>` per the HTML5
 *  parser; bare `</script>` would otherwise miss `</script >`. */
function stripTags(fragment: string): string {
  return fragment
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
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

/** Extract a string field from the *first* JSON-LD block that contains
 *  it. Uses `JSON.parse` with graceful fall-through — a malformed block
 *  is skipped rather than crashing the whole scan. */
function extractJsonLdField(html: string, field: 'headline' | 'alternativeHeadline' | 'description'): string {
  // Reset global regex state.
  REGEXES.jsonLdScript.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = REGEXES.jsonLdScript.exec(html)) !== null) {
    const body = m[1] ?? '';
    try {
      const parsed = JSON.parse(body) as unknown;
      const value = readJsonLdField(parsed, field);
      if (value) return value;
    } catch {
      // Skip malformed blocks — never fatal.
      continue;
    }
  }
  return '';
}

function readJsonLdField(
  parsed: unknown,
  field: 'headline' | 'alternativeHeadline' | 'description',
): string {
  if (!parsed || typeof parsed !== 'object') return '';
  // JSON-LD can be a single object or a `@graph` array.
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
  const lang = match1(html, REGEXES.htmlLang);
  const rawTitle = match1(html, REGEXES.title);
  const metaDescription = match1(html, REGEXES.metaDescription);
  const ogTitle = match1(html, REGEXES.ogTitle);
  const ogDescription = match1(html, REGEXES.ogDescription);
  const twitterTitle = match1(html, REGEXES.twitterTitle);
  const twitterDescription = match1(html, REGEXES.twitterDescription);

  const jsonLdHeadline = extractJsonLdField(html, 'headline');
  const jsonLdAlternativeHeadline = extractJsonLdField(html, 'alternativeHeadline');
  const jsonLdDescription = extractJsonLdField(html, 'description');

  const articleMatch = html.match(REGEXES.article);
  const bodyPlainText = articleMatch
    ? stripTags(articleMatch[1] ?? '').slice(0, 2048)
    : '';

  return {
    filePath,
    lang,
    title: rawTitle,
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
  REGEXES,
};
