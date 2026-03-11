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

// ---------------------------------------------------------------------------
// Auto-execution — run generateNews() when this barrel file is invoked
// directly (e.g. `npx tsx scripts/generate-news-enhanced.ts`).
// The auto-execution guard in index.ts only fires when index.ts itself is
// the entry point, so we replicate it here for backward compatibility.
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  import('./generate-news-enhanced/index.js').then(({ generateNews: run, QUALITY_THRESHOLD: QT }) => {
    return run().then(result => {
      if (result.errors > 0) {
        process.exit(1);
      }
      const qualityScores = result.qualityScores;
      if (qualityScores.length > 0 && qualityScores.every(q => !q.passed)) {
        console.warn(`⚠️  Exiting with code 2: all ${qualityScores.length} articles scored below quality threshold ${QT}`);
        process.exit(2);
      }
      process.exit(0);
    });
  }).catch((error: unknown) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
