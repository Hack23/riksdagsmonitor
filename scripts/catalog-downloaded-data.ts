#!/usr/bin/env tsx
/**
 * @module catalog-downloaded-data
 * @description Scans `analysis/data/` and produces a JSON catalog of all
 * downloaded MCP data files with their metadata.  This catalog is consumed
 * by the AI agent during agentic workflows so it can perform per-file
 * political intelligence analysis.
 *
 * The output is a JSON object ("data catalog") with overall metadata and an
 * `entries` array describing each data file.
 *
 * Top-level catalog fields:
 * - `generatedAt`        – ISO 8601 timestamp when the catalog was generated
 * - `dataRoot`           – root directory that was scanned (e.g. "analysis/data")
 * - `totalFiles`         – total number of discovered data files
 * - `pendingAnalysis`    – number of files without analysis
 * - `completedAnalysis`  – number of files with existing analysis
 * - `entries`            – array of per-file catalog entries
 *
 * Each item in `entries` has:
 * - `id`            – document / record identifier (filename without `.json`)
 * - `type`          – persistence document type (e.g. "propositions", "mps")
 * - `path`          – path to the data file relative to repo root
 * - `analysisPath`  – expected path for the per-file analysis markdown
 * - `hasAnalysis`   – whether the analysis markdown already exists
 * - `sizeBytes`     – file size in bytes
 *
 * Usage:
 *   npx tsx scripts/catalog-downloaded-data.ts [--data-root <path>] [--type <type>] [--pending-only]
 *
 * Options:
 *   --data-root <path>   Override analysis/data root (default: analysis/data)
 *   --type <type>        Filter to a specific document type
 *   --pending-only       Only list files that do NOT yet have analysis
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Stable repo root derived from script location. */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** A single entry in the data catalog. */
export interface CatalogEntry {
  id: string;
  type: string;
  path: string;
  analysisPath: string;
  hasAnalysis: boolean;
  sizeBytes: number;
  meta: Record<string, unknown> | null;
}

/** Full catalog output. */
export interface DataCatalog {
  generatedAt: string;
  dataRoot: string;
  totalFiles: number;
  pendingAnalysis: number;
  completedAnalysis: number;
  entries: CatalogEntry[];
}

/* ------------------------------------------------------------------ */
/*  Catalog builder (exported for testing)                             */
/* ------------------------------------------------------------------ */

const DATA_SUBDIRS = [
  'documents/propositions',
  'documents/motions',
  'documents/committeeReports',
  'documents/speeches',
  'documents/questions',
  'documents/interpellations',
  'documents/votes',
  'votes',
  'events',
  'mps',
  'worldbank',
  'scb',
  'mcp-responses',
] as const;

/**
 * Derive a human-friendly `type` from the subdirectory path.
 * e.g. "documents/propositions" → "propositions", "mps" → "mps"
 */
function typeFromSubdir(subdir: string): string {
  const parts = subdir.split('/');
  return parts[parts.length - 1];
}

/**
 * Build the catalog by scanning `dataRoot`.
 *
 * @param dataRoot - absolute or relative path to `analysis/data`
 * @param filterType - optional type filter
 * @param pendingOnly - if true, only include files without analysis
 */
export function buildCatalog(
  dataRoot: string,
  filterType?: string,
  pendingOnly = false,
): DataCatalog {
  const allEntries: CatalogEntry[] = [];

  for (const subdir of DATA_SUBDIRS) {
    const docType = typeFromSubdir(subdir);

    if (filterType && docType !== filterType) continue;

    const dirPath = path.join(dataRoot, subdir);
    if (!fs.existsSync(dirPath)) continue;

    const jsonFiles = collectJsonFiles(dirPath);

    for (const filePath of jsonFiles) {
      const id = path.relative(dirPath, filePath).replace(/\.json$/, '').split(path.sep).join('/');
      const metaPath = filePath.replace(/\.json$/, '.meta.json');
      const analysisPath = filePath.replace(/\.json$/, '.analysis.md');

      let meta: Record<string, unknown> | null = null;
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        } catch {
          meta = null;
        }
      }

      const hasAnalysis = fs.existsSync(analysisPath);

      const stat = fs.statSync(filePath);

      allEntries.push({
        id: id,
        type: docType,
        path: path.relative(REPO_ROOT, filePath).split(path.sep).join('/'),
        analysisPath: path.relative(REPO_ROOT, analysisPath).split(path.sep).join('/'),
        hasAnalysis,
        sizeBytes: stat.size,
        meta,
      });
    }
  }

  const bestByKey = new Map<string, (typeof allEntries)[number]>();
  for (const e of allEntries) {
    const idPart = e.type === 'votes' ? e.id.split('/').pop()! : e.id;
    const key = `${e.type}::${idPart}`;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, e);
    } else if (e.type === 'votes') {
      const existingHasDate = /votes\/\d{4}-\d{2}-\d{2}\//.test(existing.path);
      const currentHasDate = /votes\/\d{4}-\d{2}-\d{2}\//.test(e.path);
      if (currentHasDate && !existingHasDate) {
        bestByKey.set(key, e);
      }
      // Otherwise keep existing (first-seen or already date-stamped)
    }
    // Non-vote duplicates: keep first-seen (shouldn't occur with current DATA_SUBDIRS)
  }
  const dedupedEntries = [...bestByKey.values()];

  const totalCompleted = dedupedEntries.filter((e) => e.hasAnalysis).length;
  const totalPending = dedupedEntries.length - totalCompleted;

  const entries = pendingOnly
    ? dedupedEntries.filter((e) => !e.hasAnalysis)
    : dedupedEntries;

  entries.sort((a, b) => {
    if (a.type < b.type) return -1;
    if (a.type > b.type) return 1;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  return {
    generatedAt: new Date().toISOString(),
    dataRoot: path.relative(REPO_ROOT, dataRoot).split(path.sep).join('/'),
    totalFiles: dedupedEntries.length,
    pendingAnalysis: totalPending,
    completedAnalysis: totalCompleted,
    entries,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Recursively collect *.json files, excluding *.meta.json. */
function collectJsonFiles(dir: string): string[] {
  const results: string[] = [];
  let dirEntries: fs.Dirent[];
  try {
    dirEntries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of dirEntries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsonFiles(full));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.json') &&
      !entry.name.endsWith('.meta.json')
    ) {
      results.push(full);
    }
  }
  return results;
}

/* ------------------------------------------------------------------ */
/*  CLI entry point                                                    */
/* ------------------------------------------------------------------ */

function parseArgs(argv: string[]) {
  let dataRoot = path.join(REPO_ROOT, 'analysis/data');
  let filterType: string | undefined;
  let pendingOnly = false;

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--data-root' && argv[i + 1]) {
      dataRoot = path.resolve(argv[++i]);
    } else if (argv[i] === '--type' && argv[i + 1]) {
      filterType = argv[++i];
    } else if (argv[i] === '--pending-only') {
      pendingOnly = true;
    }
  }
  return { dataRoot, filterType, pendingOnly };
}

/* istanbul ignore next -- CLI wrapper */
function main() {
  const { dataRoot, filterType, pendingOnly } = parseArgs(process.argv);
  const catalog = buildCatalog(dataRoot, filterType, pendingOnly);

  console.error(
    `╔══════════════════════════════════════════════════════════════╗`,
  );
  console.error(
    `║   📋 Analysis Data Catalog                                  ║`,
  );
  console.error(
    `╚══════════════════════════════════════════════════════════════╝`,
  );
  console.error(`   📂 Data root: ${catalog.dataRoot}`);
  console.error(`   📄 Total files: ${catalog.totalFiles}`);
  console.error(`   ✅ Analyzed: ${catalog.completedAnalysis}`);
  console.error(`   ⏳ Pending: ${catalog.pendingAnalysis}`);
  console.error();

  console.log(JSON.stringify(catalog, null, 2));
}

// Run CLI when invoked directly
if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main();
}
