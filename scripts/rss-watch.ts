#!/usr/bin/env tsx
/**
 * @module scripts/rss-watch
 * @description Watches a Riksdagen RSS feed and emits PIR-ready match signals for tracked dok_ids.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeHtmlEntities } from './html-utils.js';

export interface RssItem {
  readonly title: string;
  readonly link: string;
  readonly guid: string;
  readonly pubDate?: string;
  readonly description?: string;
}

export interface RssSignal extends RssItem {
  readonly matchedDokIds: readonly string[];
}

export interface RssWatchResult {
  readonly schemaVersion: '1.0';
  readonly fetchedAt: string;
  readonly feedUrl: string;
  readonly trackedDokIds: readonly string[];
  readonly itemCount: number;
  readonly signalCount: number;
  readonly status: 'ok' | 'error';
  readonly signals: readonly RssSignal[];
  readonly notes?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
export const DEFAULT_RSS_OUTPUT = path.join(REPO_ROOT, 'data', 'rss-watch.json');
export const DEFAULT_RSS_FEED_URL = 'https://data.riksdagen.se/rss/dokumentlista/?doktyp=bet';
const ITEM_RE = /<item>([\s\S]*?)<\/item>/gi;

function decodeXml(value: string | undefined): string {
  return decodeHtmlEntities((value ?? '').trim());
}

function getTag(block: string, tagName: string): string | undefined {
  const match = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i').exec(block);
  return match?.[1] ? decodeXml(match[1]) : undefined;
}

export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  for (const match of xml.matchAll(ITEM_RE)) {
    const block = match[1] ?? '';
    const title = getTag(block, 'title');
    const link = getTag(block, 'link');
    const guid = getTag(block, 'guid') ?? link;
    if (!title || !link || !guid) continue;
    items.push({
      title,
      link,
      guid,
      pubDate: getTag(block, 'pubDate'),
      description: getTag(block, 'description'),
    });
  }
  return items;
}

export function buildRssSignals(items: readonly RssItem[], trackedDokIds: readonly string[]): RssSignal[] {
  const normalizedIds = trackedDokIds.map((value) => value.toUpperCase()).filter(Boolean);
  if (normalizedIds.length === 0) return [];
  return items.flatMap((item) => {
    const haystack = `${item.title} ${item.link} ${item.guid} ${item.description ?? ''}`.toUpperCase();
    const matchedDokIds = normalizedIds.filter((dokId) => haystack.includes(dokId));
    if (matchedDokIds.length === 0) return [];
    return [{ ...item, matchedDokIds }];
  });
}

export async function watchRssFeed(
  feedUrl = DEFAULT_RSS_FEED_URL,
  trackedDokIds: readonly string[] = [],
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<RssWatchResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const response = await fetchFn(feedUrl, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; Riksdagsmonitor rss-watch)',
      },
    });
    if (!response.ok) {
      return {
        schemaVersion: '1.0',
        fetchedAt,
        feedUrl,
        trackedDokIds,
        itemCount: 0,
        signalCount: 0,
        status: 'error',
        signals: [],
        notes: `HTTP ${response.status} ${response.statusText}`,
      };
    }
    const xml = await response.text();
    const items = parseRssItems(xml);
    const signals = buildRssSignals(items, trackedDokIds);
    return {
      schemaVersion: '1.0',
      fetchedAt,
      feedUrl,
      trackedDokIds,
      itemCount: items.length,
      signalCount: signals.length,
      status: 'ok',
      signals,
      notes: trackedDokIds.length > 0 ? 'Emit signals to PIR consumer by reading signals[] from this artifact' : 'No tracked dok_ids configured',
    };
  } catch (error) {
    return {
      schemaVersion: '1.0',
      fetchedAt,
      feedUrl,
      trackedDokIds,
      itemCount: 0,
      signalCount: 0,
      status: 'error',
      signals: [],
      notes: error instanceof Error ? error.message : String(error),
    };
  }
}

export function persistRssWatch(result: RssWatchResult, outputPath = DEFAULT_RSS_OUTPUT): string {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return outputPath;
}

function parseArgs(argv: readonly string[]): { feedUrl: string; trackedDokIds: string[]; output: string; persist: boolean } {
  let feedUrl = DEFAULT_RSS_FEED_URL;
  let trackedDokIds: string[] = [];
  let output = DEFAULT_RSS_OUTPUT;
  let persist = true;
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--feed-url' && next) {
      feedUrl = next;
      i++;
      continue;
    }
    if (token === '--dok-ids' && next) {
      trackedDokIds = next.split(',').map((value) => value.trim()).filter(Boolean);
      i++;
      continue;
    }
    if (token === '--output' && next) {
      output = next;
      i++;
      continue;
    }
    if (token === '--no-persist') {
      persist = false;
    }
  }
  return { feedUrl, trackedDokIds, output, persist };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const result = await watchRssFeed(args.feedUrl, args.trackedDokIds);
  if (args.persist) {
    persistRssWatch(result, args.output);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main().catch((error: unknown) => {
    console.error(`rss-watch: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
