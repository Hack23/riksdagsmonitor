/**
 * @module generate-news-enhanced/analysis-cache
 * @description In-memory cache for intermediate AI analysis results during
 * multi-iteration news generation. Prevents redundant re-analysis within a
 * single generation run and supports TTL-based expiry for stale results.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { RawDocument } from '../data-transformers.js';
import type { AIAnalysisResult } from './ai-analysis-pipeline.js';

/** Default TTL for cached analysis results: 30 minutes */
const DEFAULT_TTL_MS = 30 * 60 * 1000;

/** Maximum number of entries the cache will hold before purging expired + oldest. */
const MAX_CACHE_SIZE = 500;

interface CacheEntry {
  result: AIAnalysisResult;
  createdAt: number;
  ttlMs: number;
}

/**
 * Simple hash of a string using the FNV-1a algorithm (32-bit).
 * The algorithm uses offset basis 0x811c9dc5 and prime 0x01000193.
 * This is deterministic but NOT cryptographically secure — used only
 * for generating cache keys.
 */
function quickHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * Cache for AI analysis results.
 *
 * Thread-safety note: Node.js is single-threaded; concurrent async access is
 * fine without additional locking.
 */
export class AnalysisCache {
  private readonly store = new Map<string, CacheEntry>();

  /**
   * Generate a deterministic cache key from analysis inputs.
   *
   * @param docs - Documents being analysed
   * @param topic - Focus topic, or null
   * @param iterations - Number of analysis iterations
   * @param lang - Target language
   * @returns Cache key string
   */
  generateKey(
    docs: RawDocument[],
    topic: string | null,
    iterations: number,
    lang: Language,
  ): string {
    // Use stable per-doc identifiers (order-independent via sort) to reduce collision risk.
    // When dok_id is absent, include doktyp + datum alongside the title for uniqueness.
    const docIds = docs
      .map(d => d.dok_id ?? `${d.doktyp ?? ''}:${d.datum ?? ''}:${d.titel ?? d.title ?? ''}`)
      .sort();
    const docPart = `${docIds.length}:${docIds.join(',')}`;
    const raw = `${docPart}|${topic ?? ''}|${iterations}|${lang}`;
    return quickHash(raw);
  }

  /**
   * Retrieve a cached analysis result if it exists and has not expired.
   *
   * @param key - Cache key from generateKey()
   * @returns Cached result, or undefined if absent / expired
   */
  get(key: string): AIAnalysisResult | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.store.delete(key);
      return undefined;
    }
    return entry.result;
  }

  /**
   * Store an analysis result in the cache.
   *
   * @param key - Cache key from generateKey()
   * @param result - Analysis result to cache
   * @param ttlMs - Time-to-live in milliseconds (default: 30 min)
   */
  set(key: string, result: AIAnalysisResult, ttlMs: number = DEFAULT_TTL_MS): void {
    this.store.set(key, { result, createdAt: Date.now(), ttlMs });
    // Opportunistically purge expired entries to prevent unbounded growth.
    this.purgeExpired();
  }

  /**
   * Remove all expired entries from the cache.
   * Called opportunistically from `set()` to prevent memory growth in
   * long-lived processes. Also enforces a maximum cache size.
   */
  purgeExpired(): void {
    const now = Date.now();
    for (const [k, entry] of this.store) {
      if (now - entry.createdAt > entry.ttlMs) {
        this.store.delete(k);
      }
    }
    // If still over the cap after purging expired entries, evict oldest first.
    if (this.store.size > MAX_CACHE_SIZE) {
      const sorted = [...this.store.entries()].sort(
        (a, b) => a[1].createdAt - b[1].createdAt,
      );
      const toRemove = sorted.slice(0, this.store.size - MAX_CACHE_SIZE);
      for (const [k] of toRemove) {
        this.store.delete(k);
      }
    }
  }

  /** Remove all entries from the cache. */
  clear(): void {
    this.store.clear();
  }

  /** Number of live (non-expired) entries currently in the cache. */
  get size(): number {
    this.purgeExpired();
    return this.store.size;
  }
}

/** Module-level singleton cache shared across all generators in a run. */
export const sharedAnalysisCache = new AnalysisCache();
