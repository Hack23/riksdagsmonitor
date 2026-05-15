#!/usr/bin/env tsx
/**
 * @module scripts/lagradet-fetch
 * @description Polls www.lagradet.se for yttrande matches for a proposition or motion reference.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeHtmlEntities } from './html-utils.js';

export interface LagradetMatch {
  readonly title: string;
  readonly url: string;
}

export interface LagradetStatus {
  readonly schemaVersion: '1.0';
  readonly fetchedAt: string;
  readonly reference: string | null;
  readonly searchedUrl: string;
  readonly status: 'found' | 'not_found' | 'not_configured' | 'error';
  readonly matches: readonly LagradetMatch[];
  readonly notes?: string;
}

export interface LagradetFetchConfig {
  readonly baseUrl?: string;
  readonly fetchFn?: typeof fetch;
  readonly now?: () => string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
export const DEFAULT_LAGRADET_OUTPUT = path.join(REPO_ROOT, 'data', 'lagradet-status.json');
const DEFAULT_LAGRADET_BASE_URL = 'https://www.lagradet.se';
export const LAGRADET_REQUEST_TIMEOUT_MS = 15_000;
const LINK_RE = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
const TAG_RE = /<[^>]+>/g;

function stripHtml(html: string): string {
  return decodeHtmlEntities(html).replace(TAG_RE, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Match a Lagrådet yttrande reference (e.g. `2025/26:42`) against haystack text
 * using a non-alphanumeric boundary on both sides. Prevents `2025/26:42` from
 * matching `2025/26:420` or `2025/26:421`.
 */
function referenceMatches(haystack: string, reference: string): boolean {
  // Lower-case both, and require either start-of-string or a non-alphanumeric
  // character on each side of the reference. `reference` can contain `/` and
  // `:` which are not word characters in JS regex, so use an explicit
  // character class instead of `\b`.
  const escaped = escapeRegExp(reference.toLowerCase());
  const boundary = '(?:^|[^a-z0-9])';
  const trailing = '(?:$|[^a-z0-9])';
  return new RegExp(`${boundary}${escaped}${trailing}`).test(haystack);
}

export function extractLagradetMatches(html: string, reference: string, baseUrl = DEFAULT_LAGRADET_BASE_URL): LagradetMatch[] {
  const matches: LagradetMatch[] = [];
  const needle = reference.trim().toLowerCase();
  for (const match of html.matchAll(LINK_RE)) {
    const href = match[1];
    const label = stripHtml(match[2] ?? '');
    if (!href || !label) continue;
    const haystack = `${href} ${label}`.toLowerCase();
    if (!referenceMatches(haystack, needle)) continue;
    matches.push({
      title: label,
      url: new URL(href, baseUrl).toString(),
    });
  }
  return dedupeMatches(matches);
}

function dedupeMatches(matches: readonly LagradetMatch[]): LagradetMatch[] {
  const seen = new Set<string>();
  const deduped: LagradetMatch[] = [];
  for (const match of matches) {
    const key = `${match.url}|${match.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(match);
  }
  return deduped;
}

export async function fetchLagradetStatus(reference: string | null, config: LagradetFetchConfig = {}): Promise<LagradetStatus> {
  const baseUrl = config.baseUrl ?? DEFAULT_LAGRADET_BASE_URL;
  const fetchedAt = config.now?.() ?? new Date().toISOString();
  const normalizedReference = reference?.trim() || null;
  const searchedUrl = normalizedReference
    ? `${baseUrl}/?s=${encodeURIComponent(normalizedReference)}`
    : `${baseUrl}/`;

  if (!normalizedReference) {
    return {
      schemaVersion: '1.0',
      fetchedAt,
      reference: null,
      searchedUrl,
      status: 'not_configured',
      matches: [],
      notes: 'No proposition or motion reference supplied',
    };
  }

  const fetchFn = config.fetchFn ?? globalThis.fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LAGRADET_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchFn(searchedUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; Riksdagsmonitor lagradet-fetch)',
      },
    });
    if (!response.ok) {
      return {
        schemaVersion: '1.0',
        fetchedAt,
        reference: normalizedReference,
        searchedUrl,
        status: 'error',
        matches: [],
        notes: `HTTP ${response.status} ${response.statusText}`,
      };
    }
    const html = await response.text();
    const matches = extractLagradetMatches(html, normalizedReference, baseUrl);
    return {
      schemaVersion: '1.0',
      fetchedAt,
      reference: normalizedReference,
      searchedUrl,
      status: matches.length > 0 ? 'found' : 'not_found',
      matches,
      ...(matches.length === 0 ? { notes: `No Lagrådet yttrande match found for ${normalizedReference}` } : {}),
    };
  } catch (error) {
    return {
      schemaVersion: '1.0',
      fetchedAt,
      reference: normalizedReference,
      searchedUrl,
      status: 'error',
      matches: [],
      notes: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function persistLagradetStatus(status: LagradetStatus, outputPath = DEFAULT_LAGRADET_OUTPUT): string {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
  return outputPath;
}

function parseArgs(argv: readonly string[]): { reference: string | null; output: string; persist: boolean } {
  let reference: string | null = null;
  let output = DEFAULT_LAGRADET_OUTPUT;
  let persist = true;
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--reference') {
      reference = argv[i + 1] ?? null;
      i++;
      continue;
    }
    if (token === '--output') {
      output = argv[i + 1] ?? output;
      i++;
      continue;
    }
    if (token === '--no-persist') {
      persist = false;
    }
  }
  return { reference, output, persist };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const status = await fetchLagradetStatus(args.reference);
  if (args.persist) {
    persistLagradetStatus(status, args.output);
  }
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
}

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main().catch((error: unknown) => {
    console.error(`lagradet-fetch: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
