#!/usr/bin/env tsx
/**
 * @module download-parliamentary-data
 * @description Thin entry-point shim. The real implementation lives in
 * `./download-parliamentary-data/` (split for the >600-line refactor epic).
 *
 * Public API preserved verbatim — `parseArgs`, `resolveAutoFullTextTopN`,
 * `serializeDataManifest`, `buildWeeklySummaryMarkdown` continue to be
 * importable from this path so existing tests stay green.
 *
 * Usage:
 *   npx tsx scripts/download-parliamentary-data.ts [--date YYYY-MM-DD] [--limit N]
 *   npx tsx scripts/download-parliamentary-data.ts --aggregate weekly [--date YYYY-WNN]
 *   npx tsx scripts/download-parliamentary-data.ts --auto-full-text-top-n 2
 *   npx tsx scripts/download-parliamentary-data.ts --full-text-for-all
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export {
  parseArgs,
  resolveAutoFullTextTopN,
  serializeDataManifest,
  buildWeeklySummaryMarkdown,
  runPreArticleAnalysis,
} from './download-parliamentary-data/cli.js';
export type { ParsedArgs } from './download-parliamentary-data/cli.js';

import { parseArgs, runPreArticleAnalysis } from './download-parliamentary-data/cli.js';

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  const args = parseArgs(process.argv);
  runPreArticleAnalysis(args).catch((err: unknown) => {
    console.error(
      '[download-parliamentary-data] Fatal error:',
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  });
}
