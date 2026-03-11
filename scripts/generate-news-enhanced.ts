/**
 * @module Intelligence Operations/Automated News Generation
 * @description Barrel re-export for backward compatibility.
 *
 * This file was previously a 1183-line monolith. It has been decomposed
 * into focused modules under `./generate-news-enhanced/`:
 *
 * | Module         | Lines | Responsibility                                      |
 * |--------------- |-------|-----------------------------------------------------|
 * | types.ts       | ~40   | Local interfaces (TitleSet, BatchStatus…)            |
 * | config.ts      | ~220  | CLI parsing, language config, shared MCP client      |
 * | helpers.ts     | ~175  | Date helpers, writeArticle, quality validation       |
 * | generators.ts  | ~400  | Week-ahead, committee, propositions, motions         |
 * | index.ts       | ~265  | Barrel re-export + orchestrator (generateNews)       |
 *
 * All public exports are preserved — existing consumers require no changes.
 *
 * Valid article types (defined in config.ts):
 *   'week-ahead', 'month-ahead', 'weekly-review', 'monthly-review',
 *   'committee-reports', 'propositions', 'motions', 'breaking'
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
export {
  generateNews,
  generateWeekAhead,
  generateCommitteeReports,
  generatePropositions,
  generateMotions,
  writeSingleArticle,
  writeArticlePair,
  validateArticleQuality,
  VALID_ARTICLE_TYPES,
  ALL_LANGUAGES,
  LANGUAGE_PRESETS,
  languages,
  QUALITY_THRESHOLD,
  formatDateForSlug,
  getWeekAheadDateRange,
  requireMcp,
  translateSwedishContent,
} from './generate-news-enhanced/index.js';

// Internal-only import — runCli is not part of the public API since it
// calls process.exit() and is only used for CLI auto-execution.
import { runCli } from './generate-news-enhanced/index.js';

// ---------------------------------------------------------------------------
// Auto-execution — delegate CLI handling to the main module when this
// barrel file is invoked directly (e.g. `npx tsx scripts/generate-news-enhanced.ts`).
// This avoids duplicating the CLI/exit-code logic implemented in the main
// `./generate-news-enhanced/index.ts` entry point.
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
