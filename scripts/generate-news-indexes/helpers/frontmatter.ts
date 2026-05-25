/**
 * @module generate-news-indexes/helpers/frontmatter
 * @description HTML metadata extraction (meta tags, title, JSON-LD,
 * description) and the canonical `parseArticleMetadata` orchestrator that
 * stitches them into a `NewsArticleMetadata` record.
 *
 * Implements `seo-metadata-contract.md` §3.h (description waterfall, brand
 * suffix stripping).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import type { NewsArticleMetadata } from '../types.js';
import { decodeHtmlEntities } from '../../html-utils.js';
import { NEWS_DIR } from './path-utils.js';
import { classifyArticleType, extractTopics, extractTags } from './slug.js';

/**
 * Extract the JSON-LD `description` field from a NewsArticle blob
 * embedded in the article HTML. Returns `null` when the script tag is
 * missing, malformed, or has no description. Used as a tertiary fallback
 * for `parseArticleMetadata` / `extractArticleMeta`, after `og:description`
 * and `<meta name="description">`.
 *
 * Implements `seo-metadata-contract.md` §3.h.
 */
export function extractDescriptionFromJSONLD(html: string): string | null {
  try {
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (!jsonLdMatch) return null;
    const jsonData = JSON.parse(jsonLdMatch[1]!.trim()) as { description?: string };
    const desc = typeof jsonData.description === 'string' ? jsonData.description.trim() : '';
    return desc.length > 0 ? desc : null;
  } catch {
    return null;
  }
}

/**
 * Strip a trailing ` — Riksdagsmonitor` / ` | Riksdagsmonitor` brand
 * suffix from a title so sitemap / news-index cards render the editorial
 * headline alone. The brand is re-added by the card template.
 *
 * Implements `seo-metadata-contract.md` §3.h.
 */
export function stripBrandSuffix(title: string): string {
  return title.replace(/\s*[—\-|]\s*Riksdagsmonitor\s*$/i, '').trim();
}

/**
 * Choose the richest available description from three candidate sources,
 * preferring whichever is longest but non-empty. Falls back in order:
 *   1. `og:description` (often the richest, emitted by the aggregator)
 *   2. `<meta name="description">` (truncated legacy copy)
 *   3. JSON-LD `description` (last resort)
 *
 * Implements `seo-metadata-contract.md` §3.h.
 */
export function chooseBestDescription(
  ogDescription: string | null,
  metaDescription: string | null,
  jsonLdDescription: string | null,
): string {
  const candidates = [ogDescription, metaDescription, jsonLdDescription]
    .map((s) => (s ?? '').trim())
    .filter((s) => s.length > 0);
  if (candidates.length === 0) return '';
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0]!;
}

/**
 * Extract content from meta tags.
 *
 * Fixed: regex now properly handles apostrophes and special characters in content.
 */
export function extractMetaContent(html: string, property: string): string | null {
  const doubleQuotePattern = new RegExp(`<meta\\s+(?:property|name)="${property}"\\s+content="([^"]+)"`, 'i');
  const doubleQuoteMatch: RegExpMatchArray | null = html.match(doubleQuotePattern);
  if (doubleQuoteMatch) return doubleQuoteMatch[1]!;

  const singleQuotePattern = new RegExp(`<meta\\s+(?:property|name)='${property}'\\s+content='([^']+)'`, 'i');
  const singleQuoteMatch: RegExpMatchArray | null = html.match(singleQuotePattern);
  if (singleQuoteMatch) return singleQuoteMatch[1]!;

  const reversedDoublePattern = new RegExp(`<meta\\s+content="([^"]+)"\\s+(?:property|name)="${property}"`, 'i');
  const reversedDoubleMatch: RegExpMatchArray | null = html.match(reversedDoublePattern);
  if (reversedDoubleMatch) return reversedDoubleMatch[1]!;

  const reversedSinglePattern = new RegExp(`<meta\\s+content='([^']+)'\\s+(?:property|name)='${property}'`, 'i');
  const reversedSingleMatch: RegExpMatchArray | null = html.match(reversedSinglePattern);
  if (reversedSingleMatch) return reversedSingleMatch[1]!;

  return null;
}

/**
 * Extract title from <title> tag.
 */
export function extractTitle(html: string): string | null {
  const match: RegExpMatchArray | null = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1]!.replace(' - Riksdagsmonitor', '').trim() : null;
}

/**
 * Normalize date string to YYYY-MM-DD format.
 */
export function normalizeDateString(dateStr: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]!;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  if (dateStr.includes('T')) {
    return dateStr.split('T')[0]!;
  }

  const cleaned: string = dateStr.replace(/[+-]\d{2}:\d{2}$/, '');
  if (cleaned.includes('T')) {
    return cleaned.split('T')[0]!;
  }

  return dateStr;
}

/**
 * Extract date from JSON-LD structured data.
 */
export function extractDateFromJSONLD(html: string): string | null {
  try {
    const jsonLdMatch: RegExpMatchArray | null = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (!jsonLdMatch) return null;

    const jsonLdText: string = jsonLdMatch[1]!.trim();
    const jsonData: { datePublished?: string } = JSON.parse(jsonLdText) as { datePublished?: string };

    if (jsonData.datePublished) {
      const dateStr: string = jsonData.datePublished.split('T')[0]!;
      return dateStr;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract date from filename (YYYY-MM-DD format).
 */
export function extractFromFilename(fileName: string): string {
  const match: RegExpMatchArray | null = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1]! : new Date().toISOString().split('T')[0]!;
}

/**
 * Parse HTML file to extract article metadata.
 */
export function parseArticleMetadata(filePath: string): NewsArticleMetadata | null {
  try {
    const content: string = fs.readFileSync(filePath, 'utf-8');
    const fileName: string = path.basename(filePath);

    const langMatch: RegExpMatchArray | null = fileName.match(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
    if (!langMatch) {
      console.warn(`  ⚠️ Skipping ${fileName}: no language suffix`);
      return null;
    }

    const lang: string = langMatch[1]!;

    const rawTitle =
      extractMetaContent(content, 'og:title') ||
      extractTitle(content) ||
      'Untitled';
    const description = chooseBestDescription(
      extractMetaContent(content, 'og:description'),
      extractMetaContent(content, 'description'),
      extractDescriptionFromJSONLD(content),
    );
    const relativePath: string = path.relative(NEWS_DIR, filePath).split(path.sep).join('/');
    const topics = extractTopics(content, fileName);
    const rawKeywords = extractMetaContent(content, 'keywords');
    const keywords = rawKeywords ? decodeHtmlEntities(rawKeywords).trim() : undefined;
    const metadata: NewsArticleMetadata = {
      slug: fileName,
      lang,
      title: stripBrandSuffix(decodeHtmlEntities(rawTitle)),
      description: decodeHtmlEntities(description),
      date: normalizeDateString(
        extractMetaContent(content, 'article:published_time') ||
        extractMetaContent(content, 'date') ||
        extractDateFromJSONLD(content) ||
        extractFromFilename(relativePath),
      ),
      type: classifyArticleType(content, fileName, relativePath),
      topics,
      tags: decodeHtmlEntities(extractTags(content, fileName, topics).join('|||')).split('|||').filter(Boolean),
      ...(keywords ? { keywords } : {}),
    };

    return metadata;
  } catch (error: unknown) {
    console.error(`  ❌ Error parsing ${path.basename(filePath)}:`, (error as Error).message);
    return null;
  }
}
