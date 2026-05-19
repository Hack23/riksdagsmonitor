/**
 * @module scripts/statskontoret/extractors/download-links
 * @description Extract downloadable Excel/CSV-ZIP/document links from a
 * Statskontoret open-data HTML page, with provenance attributes.
 *
 * Defensive regex-based scraper — no external HTML parser — matches the
 * style of the rest of the Statskontoret client. The classifier mirrors
 * the firewall allowlist's file-extension allow-list.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { STATSKONTORET_BASE_URL } from '../source-registry.js';
import type {
  StatskontoretDownloadLink,
  StatskontoretResourceType,
  StatskontoretSourceKey,
} from '../types.js';
import {
  decodeHtml,
  normalizeWhitespace,
  parseStatskontoretOptionalInt,
} from '../internal/text.js';
import { resolveStatskontoretUrl } from '../internal/url-guard.js';

export const FILE_EXTENSION_RE = /\.(xlsx|xls|csv|zip|docx|pdf)(?:$|[?#])/i;
export const HREF_RE = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
export const TAG_RE = /<[^>]+>/g;

export function extractStatskontoretDownloadLinks(
  html: string,
  source: StatskontoretSourceKey,
  sourcePage: string,
  baseURL: string = STATSKONTORET_BASE_URL,
): StatskontoretDownloadLink[] {
  const links: StatskontoretDownloadLink[] = [];
  const pageUpdatedAt = extractPageLastModified(html);
  for (const match of html.matchAll(HREF_RE)) {
    const href = decodeHtml(match[1] ?? '').trim();
    const text = normalizeWhitespace(decodeHtml((match[2] ?? '').replace(TAG_RE, ' ')));
    if (!href) continue;
    const resourceType = classifyStatskontoretResource(href, text);
    if (resourceType === 'unknown') continue;
    const url = resolveStatskontoretUrl(href, baseURL);
    const parsed = new URL(url);
    const year = parseStatskontoretOptionalInt(parsed.searchParams.get('Year'));
    const month = parseStatskontoretOptionalInt(parsed.searchParams.get('month'));
    links.push({
      source,
      sourcePage,
      href,
      url,
      text,
      resourceType,
      ...(parsed.searchParams.get('documentType')
        ? { documentType: parsed.searchParams.get('documentType') ?? undefined }
        : {}),
      ...(parsed.searchParams.get('fileType')
        ? { fileType: parsed.searchParams.get('fileType') ?? undefined }
        : {}),
      ...(parsed.searchParams.get('fileName')
        ? { fileName: parsed.searchParams.get('fileName') ?? undefined }
        : {}),
      ...(year !== undefined ? { year } : {}),
      ...(month !== undefined ? { month } : {}),
      ...(parsed.searchParams.get('status')
        ? { status: parsed.searchParams.get('status') ?? undefined }
        : {}),
      ...(pageUpdatedAt ? { updatedAt: pageUpdatedAt } : {}),
    });
  }
  return deduplicateLinks(links);
}

export function classifyStatskontoretResource(
  href: string,
  text: string,
): StatskontoretResourceType {
  const haystack = `${href} ${text}`.toLowerCase();
  if (
    haystack.includes('filetype=excel') ||
    /\.xlsx(?:$|[?#])/i.test(href) ||
    /\bexcel\b/i.test(text)
  ) {
    return 'excel';
  }
  if (haystack.includes('filetype=zip') && /\bcsv\b/i.test(text)) return 'csv-zip';
  if (/\.zip(?:$|[?#])/i.test(href)) return /\bcsv\b/i.test(text) ? 'csv-zip' : 'zip';
  if (/\b(csv|zip)\b/i.test(text) && href.includes('GetFile')) return 'csv-zip';
  if (/\.(docx|pdf)(?:$|[?#])/i.test(href)) return 'document';
  if (FILE_EXTENSION_RE.test(href) || href.includes('GetFile')) return 'unknown';
  return 'unknown';
}

function deduplicateLinks(
  links: readonly StatskontoretDownloadLink[],
): StatskontoretDownloadLink[] {
  const seen = new Set<string>();
  const out: StatskontoretDownloadLink[] = [];
  for (const link of links) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    out.push(link);
  }
  return out;
}

function extractPageLastModified(html: string): string | undefined {
  const match = /<meta\s+name=["']last-modified["']\s+content=["']([^"']+)["']/i.exec(html);
  return match ? decodeHtml(match[1] ?? '') : undefined;
}
