/**
 * @module scripts/fetch-statskontoret
 * @description Cached fetch module for Statskontoret open data, providing a
 * 30-day TTL cache layer over {@link StatskontoretClient}.
 *
 * This module is intended for use by agentic workflows that need Statskontoret
 * context (authority register, budget outturn) without re-downloading large
 * Excel/ZIP files on every run. It follows the same no-MCP client pattern as
 * `imf-context.ts` and `scb-context.ts`.
 *
 * ### Cache behaviour
 * - Cache root: `analysis/data/statskontoret/<sourceKey>/cache/`
 * - TTL: 30 days (configurable via the `cacheTtlMs` option)
 * - On hit: returns the cached payload with provenance metadata
 * - On miss or stale: invokes `StatskontoretClient.discoverDownloads()` and
 *   persists the result before returning
 * - On fetch error: falls back to the most recent stale cache entry (resilience)
 *
 * ### Security
 * Fetch calls go only to `https://www.statskontoret.se` (enforced by
 * `assertStatskontoretFetchTarget` inside `StatskontoretClient`). No
 * credentials are required; all data is PUBLIC classification.
 *
 * @see analysis/statskontoret/indicators-inventory.json
 * @see scripts/statskontoret-client.ts  (low-level HTTP + parse)
 * @see scripts/statskontoret-fetch.ts   (CLI entry-point)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getStatskontoretSource,
  STATSKONTORET_SOURCES,
  StatskontoretClient,
  StatskontoretError,
  type StatskontoretClientConfig,
  type StatskontoretDownloadLink,
  type StatskontoretSourceKey,
} from './statskontoret-client.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');

/** Default 30-day cache TTL in milliseconds (30 days × 24 h × 60 min × 60 s × 1000 ms). */
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Root directory for cached Statskontoret payloads. */
export const STATSKONTORET_CACHE_ROOT = path.join(
  REPO_ROOT,
  'analysis',
  'data',
  'statskontoret',
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A cached Statskontoret downloads payload with provenance metadata. */
export interface StatskontoretCachedPayload {
  readonly sourceKey: StatskontoretSourceKey;
  readonly sourceTitle: string;
  readonly sourceUrl: string;
  readonly links: readonly StatskontoretDownloadLink[];
  readonly cachedAt: string;
  readonly fetchedAt: string;
  readonly fromCache: boolean;
  readonly cacheAgeMs: number;
}

/** Options for {@link fetchStatskontoretCached}. */
export interface FetchStatskontoretCachedOptions {
  /** Override the 30-day TTL (milliseconds). Mainly for testing. */
  readonly cacheTtlMs?: number;
  /** Override the cache root directory. Mainly for testing. */
  readonly cacheRoot?: string;
  /** Override the `StatskontoretClient` configuration (e.g. inject a mock fetch). */
  readonly clientConfig?: StatskontoretClientConfig;
}

/** Internal cache file format. */
interface CacheEntry {
  readonly fetchedAt: string;
  readonly sourceKey: StatskontoretSourceKey;
  readonly links: StatskontoretDownloadLink[];
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function cacheDir(sourceKey: StatskontoretSourceKey, cacheRoot: string): string {
  return path.join(cacheRoot, sourceKey, 'cache');
}

function cacheFilePath(sourceKey: StatskontoretSourceKey, cacheRoot: string): string {
  return path.join(cacheDir(sourceKey, cacheRoot), 'downloads.json');
}

function readCacheEntry(filePath: string): CacheEntry | undefined {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return undefined;
  }
}

function writeCacheEntry(filePath: string, entry: CacheEntry): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8');
}

function isCacheFresh(fetchedAt: string, ttlMs: number): boolean {
  const age = Date.now() - new Date(fetchedAt).getTime();
  return age < ttlMs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch Statskontoret download links for a given source key, using a 30-day
 * file-system cache.
 *
 * @param sourceKey - The Statskontoret source to fetch
 *   (`myndighetsforteckning`, `arsutfall`, `manadsutfall`, `budget-time-series`).
 * @param options   - Optional TTL, cache-root and client overrides.
 * @returns A {@link StatskontoretCachedPayload} with links and provenance info.
 *
 * @example
 * ```ts
 * const payload = await fetchStatskontoretCached('myndighetsforteckning');
 * console.log(`Found ${payload.links.length} download links (fromCache=${payload.fromCache})`);
 * ```
 */
export async function fetchStatskontoretCached(
  sourceKey: StatskontoretSourceKey,
  options: FetchStatskontoretCachedOptions = {},
): Promise<StatskontoretCachedPayload> {
  const {
    cacheTtlMs = CACHE_TTL_MS,
    cacheRoot = STATSKONTORET_CACHE_ROOT,
    clientConfig = {},
  } = options;

  const source = getStatskontoretSource(sourceKey);
  const filePath = cacheFilePath(sourceKey, cacheRoot);

  // --- Cache hit ---
  const cached = readCacheEntry(filePath);
  if (cached !== undefined && isCacheFresh(cached.fetchedAt, cacheTtlMs)) {
    const cacheAgeMs = Date.now() - new Date(cached.fetchedAt).getTime();
    return {
      sourceKey,
      sourceTitle: source.title,
      sourceUrl: source.url,
      links: cached.links,
      cachedAt: cached.fetchedAt,
      fetchedAt: cached.fetchedAt,
      fromCache: true,
      cacheAgeMs,
    };
  }

  // --- Cache miss or stale: fetch from origin ---
  const client = new StatskontoretClient(clientConfig);
  let links: StatskontoretDownloadLink[];
  let fetchedAt: string;

  try {
    links = await client.discoverDownloads(sourceKey);
    // Stamp provenance after discovery completes so `fetchedAt` reflects the
    // cache completion time, not when the request was issued.
    fetchedAt = new Date().toISOString();
    writeCacheEntry(filePath, { fetchedAt, sourceKey, links });
  } catch (error) {
    // --- Resilience: return stale cache on fetch failure ---
    if (cached !== undefined) {
      const cacheAgeMs = Date.now() - new Date(cached.fetchedAt).getTime();
      return {
        sourceKey,
        sourceTitle: source.title,
        sourceUrl: source.url,
        links: cached.links,
        cachedAt: cached.fetchedAt,
        fetchedAt: cached.fetchedAt,
        fromCache: true,
        cacheAgeMs,
      };
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new StatskontoretError(
      `fetch-statskontoret: failed to fetch ${sourceKey} and no cache available: ${detail}`,
      'http',
      { cause: error },
    );
  }

  return {
    sourceKey,
    sourceTitle: source.title,
    sourceUrl: source.url,
    links,
    cachedAt: fetchedAt,
    fetchedAt,
    fromCache: false,
    cacheAgeMs: 0,
  };
}

/**
 * Check whether a fresh cache entry exists for the given source key without
 * triggering a network fetch.
 *
 * @param sourceKey  - The Statskontoret source to check.
 * @param options    - Optional TTL and cache-root overrides.
 * @returns `true` if a fresh cache entry exists, `false` otherwise.
 */
export function isStatskontoretCacheFresh(
  sourceKey: StatskontoretSourceKey,
  options: Pick<FetchStatskontoretCachedOptions, 'cacheTtlMs' | 'cacheRoot'> = {},
): boolean {
  const { cacheTtlMs = CACHE_TTL_MS, cacheRoot = STATSKONTORET_CACHE_ROOT } = options;
  const filePath = cacheFilePath(sourceKey, cacheRoot);
  const cached = readCacheEntry(filePath);
  return cached !== undefined && isCacheFresh(cached.fetchedAt, cacheTtlMs);
}

/**
 * Return the list of all built-in Statskontoret source keys.
 * Useful for iterating over all sources in agentic workflows.
 */
export function statskontoretSourceKeys(): readonly StatskontoretSourceKey[] {
  return STATSKONTORET_SOURCES.map((s) => s.key);
}
