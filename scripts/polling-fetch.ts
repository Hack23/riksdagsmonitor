#!/usr/bin/env tsx
/**
 * @module scripts/polling-fetch
 * @description Aggregates latest polling-wave context for Sifo, Novus, and Demoskop.
 *
 * The script fetches a single page per provider, extracts the latest visible
 * party percentages when possible, computes a simple cross-provider mean, and
 * persists a versioned cache (`data/polling-context.json` by default) so the
 * news pre-warm step has a stable polling context artifact even when one or
 * more upstream pages fail.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeHtmlEntities } from './html-utils.js';

export const PARTY_CODES = ['S', 'M', 'SD', 'V', 'MP', 'C', 'L', 'KD'] as const;
export type PartyCode = typeof PARTY_CODES[number];
export type PollProviderKey = 'sifo' | 'novus' | 'demoskop';

export interface PollingWave {
  readonly provider: PollProviderKey;
  readonly sourceUrl: string;
  readonly fetchedAt: string;
  readonly status: 'ok' | 'unavailable';
  readonly title?: string;
  readonly publishedAt?: string;
  readonly fieldworkMonth?: string;
  readonly sampleSize?: number;
  readonly parties: Partial<Record<PartyCode, number>>;
  readonly notes?: string;
}

export interface PollingAggregatePoint {
  readonly mean: number;
  readonly samples: number;
}

export interface PollingContext {
  readonly schemaVersion: '1.0';
  readonly cacheVersion: 1;
  readonly generatedAt: string;
  readonly providers: readonly PollingWave[];
  readonly aggregate: {
    readonly availableProviders: number;
    readonly parties: Partial<Record<PartyCode, PollingAggregatePoint>>;
  };
}

export interface PollingProviderDefinition {
  readonly provider: PollProviderKey;
  readonly url: string;
}

export interface PollingFetchConfig {
  readonly providers?: readonly PollingProviderDefinition[];
  readonly fetchFn?: typeof fetch;
  readonly now?: () => string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
export const DEFAULT_POLLING_OUTPUT = path.join(REPO_ROOT, 'data', 'polling-context.json');
// Per-provider request timeout (ms). Each provider fails independently so a
// single hung page cannot stall the whole script under the 60 s action-level
// `timeout` and prevent the degraded `data/polling-context.json` artifact from
// being written.
export const POLLING_REQUEST_TIMEOUT_MS = 15_000;
export const DEFAULT_POLLING_PROVIDERS: readonly PollingProviderDefinition[] = Object.freeze([
  { provider: 'sifo', url: 'https://www.veriangroup.com/sv/expertis/politik-och-opinion/valjarbarometer' },
  { provider: 'novus', url: 'https://novus.se/valjarbarometer-arkiv/kategori/valjarbarometern/' },
  // NOTE: Demoskop's public landing URL changed; the bare path
  // `/v%C3%A4ljarbarometern/` returns 404. We start from the Demoskop home
  // page so the follow-up-link heuristic in `findFollowUpPollingUrl` can
  // discover the latest wave article rather than 404-ing immediately. This is
  // best-effort — when discovery fails the entry is marked
  // `status: "unavailable"` with a clear note.
  { provider: 'demoskop', url: 'https://demoskop.se/' },
]);

const CANONICAL_RE = /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i;
const HREF_RE = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const TAG_RE = /<[^>]+>/g;
const WHITESPACE_RE = /\s+/g;
const DATE_RE = /(20\d{2}-\d{2}-\d{2})/;
const MONTH_RE = /(20\d{2})[-/](0[1-9]|1[0-2])/;
const SAMPLE_SIZE_RE = /(?:sample\s*size|urval|\bn\b)\s*[:=]?\s*(\d{3,5})/i;

function stripHtml(html: string): string {
  return decodeHtmlEntities(html).replace(TAG_RE, ' ').replace(WHITESPACE_RE, ' ').trim();
}

function extractNumericPartyShare(text: string, partyCode: PartyCode): number | undefined {
  const patterns = [
    new RegExp(`\\b${partyCode}\\b\\s*[:\\-]?\\s*(\\d{1,2}(?:[\\.,]\\d)?)\\s*%`, 'i'),
    new RegExp(`\\b${partyCode}\\b\\s*[:\\-]?\\s*(\\d{1,2}(?:[\\.,]\\d)?)\\s+procent\\b`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match?.[1]) continue;
    const value = Number.parseFloat(match[1].replace(',', '.'));
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function isArchiveRootUrl(url: string): boolean {
  // Treat /arkiv/ (archive) listing pages and category roots as "canonical archive
  // roots" we should NOT prefer over a specific polling article. Examples:
  //   https://novus.se/valjarbarometer-arkiv/
  //   https://example.test/category/valjarbarometer/
  return /\/(arkiv|category|kategori|tag)(\/|$)/i.test(new URL(url).pathname);
}

function findFollowUpPollingUrl(sourceUrl: string, html: string): string | null {
  // First, walk anchor tags and prefer concrete article links that match the
  // polling-wave pattern. We only fall back to <link rel="canonical"> when no
  // article link is found, because canonical often points at an archive root.
  for (const match of html.matchAll(HREF_RE)) {
    const href = match[1];
    const label = stripHtml(match[2] ?? '');
    if (!href) continue;
    const haystack = `${href} ${label}`.toLowerCase();
    if (!/valjarbarometer|väljarbarometer/.test(haystack)) continue;
    const resolved = new URL(href, sourceUrl).toString();
    if (resolved === sourceUrl) continue;
    if (isArchiveRootUrl(resolved)) continue;
    return resolved;
  }
  const canonical = CANONICAL_RE.exec(html)?.[1];
  if (canonical && canonical !== sourceUrl) {
    return canonical;
  }
  return null;
}

export function extractPollingWaveFromHtml(
  provider: PollProviderKey,
  sourceUrl: string,
  html: string,
  fetchedAt: string,
): PollingWave {
  const titleMatch = TITLE_RE.exec(html);
  const title = titleMatch?.[1] ? stripHtml(titleMatch[1]) : undefined;
  const text = stripHtml(html);
  const publishedAt = DATE_RE.exec(text)?.[1];
  const monthMatch = MONTH_RE.exec(text);
  const fieldworkMonth = monthMatch ? `${monthMatch[1]}-${monthMatch[2]}` : publishedAt?.slice(0, 7);
  const sampleSizeMatch = SAMPLE_SIZE_RE.exec(text);
  const sampleSize = sampleSizeMatch?.[1] ? Number.parseInt(sampleSizeMatch[1], 10) : undefined;

  const parties: Partial<Record<PartyCode, number>> = {};
  for (const partyCode of PARTY_CODES) {
    const value = extractNumericPartyShare(text, partyCode);
    if (value !== undefined) {
      parties[partyCode] = value;
    }
  }

  const populatedParties = Object.keys(parties).length;
  if (populatedParties >= 3) {
    return {
      provider,
      sourceUrl,
      fetchedAt,
      status: 'ok',
      title,
      publishedAt,
      fieldworkMonth,
      sampleSize,
      parties,
    };
  }

  return {
    provider,
    sourceUrl,
    fetchedAt,
    status: 'unavailable',
    title,
    publishedAt,
    fieldworkMonth,
    sampleSize,
    parties: {},
    notes: `Could not extract enough party shares from ${provider} source page`,
  };
}

export function buildPollingAggregate(waves: readonly PollingWave[]): PollingContext['aggregate'] {
  const available = waves.filter((wave) => wave.status === 'ok');
  const aggregate: Partial<Record<PartyCode, PollingAggregatePoint>> = {};
  for (const partyCode of PARTY_CODES) {
    const values = available
      .map((wave) => wave.parties[partyCode])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (values.length === 0) continue;
    const sum = values.reduce((acc, value) => acc + value, 0);
    aggregate[partyCode] = {
      mean: Number.parseFloat((sum / values.length).toFixed(2)),
      samples: values.length,
    };
  }
  return {
    availableProviders: available.length,
    parties: aggregate,
  };
}

async function fetchWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchFn(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; Riksdagsmonitor polling-fetch)',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPollingContext(config: PollingFetchConfig = {}): Promise<PollingContext> {
  const providers = config.providers ?? DEFAULT_POLLING_PROVIDERS;
  const fetchFn = config.fetchFn ?? globalThis.fetch;
  const fetchedAt = config.now?.() ?? new Date().toISOString();

  const waves = await Promise.all(
    providers.map(async (provider): Promise<PollingWave> => {
      try {
        const response = await fetchWithTimeout(fetchFn, provider.url, POLLING_REQUEST_TIMEOUT_MS);
        if (!response.ok) {
          return {
            provider: provider.provider,
            sourceUrl: provider.url,
            fetchedAt,
            status: 'unavailable',
            parties: {},
            notes: `HTTP ${response.status} ${response.statusText}`,
          };
        }
        const html = await response.text();
        let wave = extractPollingWaveFromHtml(provider.provider, provider.url, html, fetchedAt);
        if (wave.status === 'unavailable') {
          const followUpUrl = findFollowUpPollingUrl(provider.url, html);
          if (followUpUrl) {
            const followUpResponse = await fetchWithTimeout(fetchFn, followUpUrl, POLLING_REQUEST_TIMEOUT_MS);
            if (followUpResponse.ok) {
              wave = extractPollingWaveFromHtml(provider.provider, followUpUrl, await followUpResponse.text(), fetchedAt);
            }
          }
        }
        return wave;
      } catch (error) {
        return {
          provider: provider.provider,
          sourceUrl: provider.url,
          fetchedAt,
          status: 'unavailable',
          parties: {},
          notes: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  return {
    schemaVersion: '1.0',
    cacheVersion: 1,
    generatedAt: fetchedAt,
    providers: waves,
    aggregate: buildPollingAggregate(waves),
  };
}

export function persistPollingContext(context: PollingContext, outputPath = DEFAULT_POLLING_OUTPUT): string {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(context, null, 2)}\n`, 'utf8');
  return outputPath;
}

function parseArgs(argv: readonly string[]): { output: string; persist: boolean } {
  let output = DEFAULT_POLLING_OUTPUT;
  let persist = true;
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--output') {
      output = argv[i + 1] ?? output;
      i++;
      continue;
    }
    if (token === '--no-persist') {
      persist = false;
    }
  }
  return { output, persist };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const context = await fetchPollingContext();
  if (args.persist) {
    persistPollingContext(context, args.output);
  }
  process.stdout.write(`${JSON.stringify(context, null, 2)}\n`);
}

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main().catch((error: unknown) => {
    console.error(`polling-fetch: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
