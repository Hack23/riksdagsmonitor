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
export const DEFAULT_POLLING_PROVIDERS: readonly PollingProviderDefinition[] = Object.freeze([
  { provider: 'sifo', url: 'https://www.tv4.se/tag/valjarbarometern' },
  { provider: 'novus', url: 'https://novus.se/valjarbarometern/' },
  { provider: 'demoskop', url: 'https://demoskop.se/category/valjarbarometer/' },
]);

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

export function extractPollingWaveFromHtml(
  provider: PollProviderKey,
  sourceUrl: string,
  html: string,
  fetchedAt: string,
): PollingWave {
  const title = TITLE_RE.exec(html)?.[1] ? stripHtml(TITLE_RE.exec(html)![1]!) : undefined;
  const text = stripHtml(html);
  const publishedAt = DATE_RE.exec(text)?.[1];
  const monthMatch = MONTH_RE.exec(text);
  const fieldworkMonth = monthMatch ? `${monthMatch[1]}-${monthMatch[2]}` : publishedAt?.slice(0, 7);
  const sampleSize = SAMPLE_SIZE_RE.exec(text)?.[1] ? Number.parseInt(SAMPLE_SIZE_RE.exec(text)![1]!, 10) : undefined;

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

export async function fetchPollingContext(config: PollingFetchConfig = {}): Promise<PollingContext> {
  const providers = config.providers ?? DEFAULT_POLLING_PROVIDERS;
  const fetchFn = config.fetchFn ?? globalThis.fetch;
  const fetchedAt = config.now?.() ?? new Date().toISOString();

  const waves = await Promise.all(
    providers.map(async (provider): Promise<PollingWave> => {
      try {
        const response = await fetchFn(provider.url, {
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0 (compatible; Riksdagsmonitor polling-fetch)',
          },
        });
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
        return extractPollingWaveFromHtml(provider.provider, provider.url, html, fetchedAt);
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
