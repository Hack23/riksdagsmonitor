/**
 * @module scripts/imf-fetch/cache
 * @description Cache loader + staleness check + fallback payload
 * builder for the IMF `weo` and `compare` subcommands.
 *
 * Cache lives under `analysis/data/imf/{indicator}/{country}.json`
 * with sidecar `.meta.json` for provenance — written by
 * `persistIMFData` in the parliamentary-data layer.
 *
 * Stale = older than 6 months, matching the `>6 month vintage`
 * annotation rule in `.github/aw/ECONOMIC_DATA_CONTRACT.md`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { sanitizeDokId } from '../parliamentary-data/data-persistence.js';

const DATA_ROOT = resolve(process.cwd(), 'analysis', 'data');

interface CachedImfMeta {
  readonly fetchedAt: string;
  readonly database?: string;
  readonly projectionVintage?: string;
}

export interface CachedImfRecord {
  readonly data: unknown;
  readonly meta: CachedImfMeta;
}

/**
 * Attempt to load previously-persisted IMF data for a given
 * indicator/country. Returns `null` when cache does not exist or
 * cannot be parsed.
 */
export function loadCachedIMFData(indicator: string, country: string): CachedImfRecord | null {
  const dataPath = join(DATA_ROOT, 'imf', sanitizeDokId(indicator), `${sanitizeDokId(country)}.json`);
  const metaPath = join(
    DATA_ROOT,
    'imf',
    sanitizeDokId(indicator),
    `${sanitizeDokId(country)}.meta.json`,
  );
  if (!existsSync(dataPath)) return null;
  try {
    const data = JSON.parse(readFileSync(dataPath, 'utf8'));
    const meta = existsSync(metaPath)
      ? (JSON.parse(readFileSync(metaPath, 'utf8')) as CachedImfMeta)
      : ({ fetchedAt: 'unknown' } as CachedImfMeta);
    return { data, meta };
  } catch {
    return null;
  }
}

/**
 * Check if cached data is stale (> 6 months old). Returns true for
 * invalid / unparseable dates (conservative: treat unknown age as
 * stale).
 */
export function isCacheStale(fetchedAt: string): boolean {
  const fetched = new Date(fetchedAt);
  if (Number.isNaN(fetched.getTime())) return true;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return fetched < sixMonthsAgo;
}

/**
 * Build a standardised fallback payload with metadata indicating
 * cache usage. The `_vintageAnnotation` is the renderer's source of
 * truth for the >6mo vintage badge (yellow / red).
 */
export function buildFallbackPayload(
  cachedData: unknown,
  err: unknown,
  cachedAt: string,
  stale: boolean,
): Record<string, unknown> {
  return {
    ...(cachedData as Record<string, unknown>),
    _fallback: true,
    _fallbackReason: err instanceof Error ? err.message : String(err),
    _cachedAt: cachedAt,
    _staleVintage: stale,
    _vintageAnnotation: stale
      ? `>6 month vintage (cached ${cachedAt}); live fetch failed`
      : `cached ${cachedAt}; live fetch failed`,
    transport: 'cache',
  };
}
