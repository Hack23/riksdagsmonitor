/**
 * @module CIA/CSVUtils
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * CSV parsing and HTTP loading helpers for the CIA data pipeline.
 *
 * Originally lived as private/public methods on `CIADataLoader`; extracted as
 * free functions so each per-domain loader (`loaders/*.ts`) can use them
 * directly without instantiating the orchestrator class. Mockable in tests
 * by stubbing `globalThis.fetch`.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type { CSVRow } from './types.js';
import Papa from 'papaparse';

/** Signature used by per-domain loaders to fetch and parse a single CSV. */
export type LoadCSV = (
  localPath: string,
  fallbackPath?: string
) => Promise<CSVRow[]>;

/**
 * Parse CSV text into an array of header-keyed rows with auto-typed values.
 *
 * Handles basic quoting (`"value, with, commas"`) and converts numeric strings
 * to numbers. Empty cells are kept as the empty string. Returns `[]` for
 * inputs without at least a header and one data row.
 *
 * @param csvText - Raw CSV text
 * @returns Parsed rows (empty array if header-only or empty)
 */
export function parseCSV(csvText: string): CSVRow[] {
  const trimmed = csvText.trim();
  if (!trimmed || !trimmed.includes('\n')) return [];

  const parsed = Papa.parse<CSVRow>(trimmed, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  return parsed.data.filter(row =>
    Object.values(row).some(value => value !== null && value !== undefined && value !== '')
  );
}

/**
 * Join a base URL with a relative path using exactly one slash between them.
 *
 * Tolerant of base URLs that omit the trailing slash and of paths that include
 * a leading slash — both common foot-guns when callers concatenate URL strings
 * by hand. Empty inputs are passed through: an empty `base` returns `path`
 * unchanged, and an empty `path` returns `base` unchanged (useful for directory
 * listings or when the path is computed conditionally).
 *
 * @param base - Base URL (with or without trailing slash); empty string returns `path` as-is
 * @param path - Relative path (with or without leading slash); empty string returns `base` as-is
 * @returns The two segments joined by exactly one `/`, or whichever input is non-empty when one is empty
 */
export function joinURL(base: string, path: string): string {
  if (!base) return path;
  if (!path) return base;
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
}

/**
 * Load a CSV with local-first fallback.
 *
 * Tries `joinURL(csvBaseURL, localPath)` first. If the response is non-OK or
 * yields zero rows, falls back to `joinURL(fallbackURL, fallbackPath ?? localPath)`
 * when a `fallbackURL` is provided. Network errors are logged as warnings
 * rather than thrown so the page can degrade gracefully when offline.
 *
 * URL joining is tolerant of missing trailing slashes on the base URL and
 * leading slashes on the path; callers do not need to worry about the slash
 * boundary.
 *
 * @param csvBaseURL - Base URL for the local-first CSV directory
 * @param fallbackURL - Optional remote fallback URL (e.g. raw.githubusercontent.com mirror); empty string disables fallback
 * @param localPath - Path relative to `csvBaseURL`
 * @param fallbackPath - Optional path on the fallback host (defaults to `localPath`)
 * @returns Parsed CSV rows; `[]` when no source returned data
 */
export async function loadCSV(
  csvBaseURL: string,
  fallbackURL: string,
  localPath: string,
  fallbackPath?: string
): Promise<CSVRow[]> {
  const urls: string[] = [joinURL(csvBaseURL, localPath)];
  if (fallbackURL) {
    urls.push(joinURL(fallbackURL, fallbackPath ?? localPath));
  }

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const text = await response.text();
      const rows = parseCSV(text);
      if (rows.length > 0) return rows;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`Failed to load CSV from ${url}:`, message);
    }
  }

  console.warn(`No data loaded for ${localPath}`);
  return [];
}

/**
 * Build a `LoadCSV` closure bound to a `csvBaseURL` / `fallbackURL` pair.
 *
 * Per-domain loaders accept this closure so they can be unit-tested without
 * any reference to the URL configuration of a specific environment.
 *
 * @param csvBaseURL - Base URL for the local-first CSV directory
 * @param fallbackURL - Optional remote fallback URL (empty string disables fallback)
 * @returns A `LoadCSV` function bound to those URLs
 */
export function createLoadCSV(csvBaseURL: string, fallbackURL = ''): LoadCSV {
  return (localPath, fallbackPath) =>
    loadCSV(csvBaseURL, fallbackURL, localPath, fallbackPath);
}
