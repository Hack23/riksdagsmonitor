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
    // Use all doc IDs (order-independent via sort) plus count to reduce the risk of collisions
    const docIds = docs
      .map(d => d.dok_id ?? d.titel ?? d.title ?? '')
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
  }

  /** Remove all entries from the cache. */
  clear(): void {
    this.store.clear();
  }

  /** Number of entries currently in the cache (including potentially expired ones). */
  get size(): number {
    return this.store.size;
  }
}

/** Module-level singleton cache shared across all generators in a run. */
export const sharedAnalysisCache = new AnalysisCache();
