/**
 * NEW smoke tests for scripts/imf-fetch/cache.ts.
 *
 * `loadCachedIMFData` is filesystem-coupled (anchored at
 * `analysis/data/imf/{indicator}/{country}.json`) so we just smoke
 * the pure helpers + the "missing file ⇒ null" path here. End-to-end
 * caching is covered by tests/imf-fetch-cli.test.ts and the
 * weo-pipeline integration suite.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  loadCachedIMFData,
  isCacheStale,
  buildFallbackPayload,
} from '../../scripts/imf-fetch/cache.js';

describe('isCacheStale', () => {
  it('treats a fetchedAt date older than 6 months as stale', () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 7);
    expect(isCacheStale(old.toISOString())).toBe(true);
  });

  it('treats a recent fetchedAt date as fresh', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 7);
    expect(isCacheStale(recent.toISOString())).toBe(false);
  });

  it('treats invalid date strings as stale (conservative)', () => {
    expect(isCacheStale('not-a-date')).toBe(true);
    expect(isCacheStale('unknown')).toBe(true);
    expect(isCacheStale('')).toBe(true);
  });
});

describe('loadCachedIMFData', () => {
  it('returns null when no cache file exists for the indicator/country pair', () => {
    // Use a deliberately-nonsensical indicator that cannot collide
    // with persisted CIA snapshots.
    expect(loadCachedIMFData('__nonexistent_indicator__', '__nonexistent_country__')).toBeNull();
  });
});

describe('buildFallbackPayload', () => {
  it('annotates the cached payload with fallback metadata + transport=cache', () => {
    const cached = { values: { NGDP_RPCH: { SWE: { '2024': 1.1 } } } };
    const out = buildFallbackPayload(cached, new Error('IMF API down'), '2025-01-01T00:00:00Z', false);
    expect(out._fallback).toBe(true);
    expect(out._fallbackReason).toBe('IMF API down');
    expect(out._cachedAt).toBe('2025-01-01T00:00:00Z');
    expect(out._staleVintage).toBe(false);
    expect(out.transport).toBe('cache');
    // Original payload fields must survive.
    expect((out as { values?: unknown }).values).toEqual(cached.values);
  });

  it('uses the ">6 month vintage" wording when stale=true (renderer key for yellow / red badge)', () => {
    const out = buildFallbackPayload({}, new Error('x'), '2024-01-01', true);
    expect(out._staleVintage).toBe(true);
    expect(out._vintageAnnotation).toMatch(/>6 month vintage/);
  });
});
