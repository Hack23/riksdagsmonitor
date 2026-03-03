/**
 * @module Shared/DataLoader
 * @description Unified data fetching with fallback, caching, and retry logic.
 * Replaces 6+ independent data loading implementations across dashboards.
 *
 * Features:
 * - Local-first with remote fallback
 * - localStorage caching with TTL
 * - Retry with exponential backoff
 * - CSV parsing via PapaParse (CSP-compatible) with simple fallback
 * - JSON and text response handling

 *
 * @intelligence Resilient OSINT data acquisition pipeline — multi-source intelligence data loading with local-first strategy, remote fallback, localStorage caching (TTL-based), retry with exponential backoff, and CSV/JSON parsing. Ensures continuous intelligence availability even during source outages.
 *
 * @business Platform reliability foundation — data loading resilience directly impacts user experience KPIs (page load time, error rate, Time to Interactive). Caching reduces infrastructure costs and enables offline-capable future PWA offering.
 *
 * @marketing Performance marketing enabler — fast, reliable data loading supports Core Web Vitals targets (LCP < 2.5s, FID < 100ms) critical for SEO ranking and user retention. Reliability metrics are a key selling point for B2G/enterprise prospects.
 * */

import { logger } from './logger.js';
import type { CSVRow, DataSource, LoadOptions } from './types.js';

const DEFAULT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_BACKOFF = 2000;

interface CacheEntry {
  data: string;
  timestamp: number;
}

/**
 * Fetch data from a URL with retry logic.
 */
async function fetchWithRetry(
  url: string,
  retries: number,
  backoff: number,
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      logger.warn(`Fetch attempt ${attempt}/${retries} failed for ${url}: ${response.status}`);
    } catch (error) {
      logger.warn(`Fetch attempt ${attempt}/${retries} error for ${url}:`, error);
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, backoff * attempt));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

/**
 * Get data from localStorage cache if valid.
 */
function getFromCache(key: string, ttl: number): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Store data in localStorage cache.
 */
function setCache(key: string, data: string): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    logger.warn('Failed to cache data — localStorage may be full');
  }
}

/**
 * Load text data from a data source with fallback and caching.
 */
export async function loadText(
  source: DataSource,
  options: LoadOptions = {},
): Promise<string> {
  const {
    cacheKey,
    cacheTTL = DEFAULT_CACHE_TTL,
    retries = DEFAULT_RETRIES,
    retryBackoff = DEFAULT_RETRY_BACKOFF,
  } = options;

  // Check cache first
  if (cacheKey) {
    const cached = getFromCache(cacheKey, cacheTTL);
    if (cached) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }
  }

  // Try primary URL, then fallbacks
  const urls = [source.primary, ...(source.fallbacks ?? [])];
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const response = await fetchWithRetry(url, retries, retryBackoff);
      const text = await response.text();
      if (cacheKey) setCache(cacheKey, text);
      logger.debug(`Loaded ${url} (${text.length} bytes)`);
      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Failed to load from ${url}, trying next fallback...`);
    }
  }

  throw lastError ?? new Error('No data sources provided');
}

/**
 * Load and parse CSV data from a data source.
 * Uses PapaParse (CSP-compatible) with a simple CSV fallback parser.
 */
export async function loadCSV(
  source: DataSource,
  options: LoadOptions = {},
): Promise<CSVRow[]> {
  const text = await loadText(source, options);
  return parseCSV(text);
}

/**
 * Load and parse JSON data from a data source.
 */
export async function loadJSON<T = unknown>(
  source: DataSource,
  options: LoadOptions = {},
): Promise<T> {
  const text = await loadText(source, options);
  return JSON.parse(text) as T;
}

/**
 * Parse CSV text into rows.
 * Uses PapaParse if available (CSP-compatible), falls back to a simple CSV parser.
 * Does NOT use d3.csvParse as it requires unsafe-eval in CSP.
 */
export function parseCSV(text: string): CSVRow[] {
  // Use PapaParse if available (CSP-compatible, no unsafe-eval needed)
  const PapaGlobal = (globalThis as Record<string, unknown>).Papa as
    | { parse: (text: string, config: Record<string, unknown>) => { data: CSVRow[] } }
    | undefined;
  if (PapaGlobal?.parse) {
    return PapaGlobal.parse(text, { header: true, skipEmptyLines: true }).data;
  }

  // CSP-safe fallback: simple CSV parser
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: CSVRow = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });
    return row;
  });
}

/**
 * Create a DataSource from local path with optional GitHub raw fallback.
 */
export function createDataSource(
  localPath: string,
  repoPath?: string,
): DataSource {
  const source: DataSource = { primary: localPath };
  if (repoPath) {
    source.fallbacks = [
      `https://raw.githubusercontent.com/Hack23/cia/master/${repoPath}`,
    ];
  }
  return source;
}
