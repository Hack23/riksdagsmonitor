/**
 * @module analysis-reader/file-reader
 * @description Filesystem helpers for the analysis reader — date-format
 * guards, per-file resolution against `analysis/daily/<date>/.../`, and
 * latest-date discovery used by the orchestrator.
 *
 * Extracted from `./index.ts` per Hack23/riksdagsmonitor#2624 to keep the
 * orchestrator ≤ 250 lines (per the refactor file-size budget).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Base path for the analysis directory relative to project root */
export const ANALYSIS_BASE_PATH = 'analysis/daily';

/** Analysis file names within a daily directory */
export const ANALYSIS_FILES = {
  classification: 'classification-results.md',
  risk: 'risk-assessment.md',
  swot: 'swot-analysis.md',
  threat: 'threat-analysis.md',
  stakeholders: 'stakeholder-perspectives.md',
  significance: 'significance-scoring.md',
  synthesis: 'synthesis-summary.md',
} as const;

/** Strict YYYY-MM-DD format guard to prevent path traversal via `date`. */
export const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Attempt to read a markdown file from the analysis directory.
 * First checks `analysis/daily/{date}/{filename}`, then scans immediate
 * subdirectories (e.g., `deep-inspection/`, `propositions/`) for the file.
 * Returns `null` if the file does not exist, cannot be read, or `date` is
 * not a valid YYYY-MM-DD string (guards against path traversal).
 */
export async function readAnalysisFile(date: string, filename: string, basePath?: string): Promise<string | null> {
  if (!DATE_FORMAT_RE.test(date)) return null;
  const resolvedBase = basePath ?? ANALYSIS_BASE_PATH;
  const dateDir = join(resolvedBase, date);

  try {
    const entries = await readdir(dateDir, { withFileTypes: true });
    const sortedDirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of sortedDirs) {
      const subPath = join(dateDir, entry.name, filename);
      try {
        return await readFile(subPath, 'utf-8');
      } catch {
        // Not in this subdirectory — continue
      }
    }
  } catch {
    // Date directory doesn't exist or can't be read
  }

  const rootPath = join(resolvedBase, date, filename);
  try {
    return await readFile(rootPath, 'utf-8');
  } catch {
    // Root-level file not found either
  }
  return null;
}

/**
 * Derive the most recent date for which analysis files exist.
 * Searches backwards from today up to `maxDaysBack` days.
 *
 * @param maxDaysBack - Maximum number of days to search back (default 7)
 * @param basePath - Optional override for the base analysis directory path
 * @returns ISO date string (YYYY-MM-DD) or `null` if no analysis found
 */
export async function findLatestAnalysisDate(maxDaysBack = 7, basePath?: string): Promise<string | null> {
  const resolvedBase = basePath ?? ANALYSIS_BASE_PATH;
  const today = new Date();
  for (let i = 0; i < maxDaysBack; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]!;
    const dirPath = join(resolvedBase, dateStr);
    if (existsSync(dirPath)) {
      const hasRootFile = Object.values(ANALYSIS_FILES).some(f => existsSync(join(dirPath, f)));
      if (hasRootFile) return dateStr;

      try {
        const entries = await readdir(dirPath, { withFileTypes: true });
        const sortedDirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of sortedDirs) {
          const hasSubFile = Object.values(ANALYSIS_FILES).some(
            f => existsSync(join(dirPath, entry.name, f)),
          );
          if (hasSubFile) return dateStr;
        }
      } catch {
        // Can't read subdirectories — skip
      }
    }
  }
  return null;
}
