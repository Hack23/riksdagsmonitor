/**
 * @module news-types/weekly-review
 * @description Barrel re-export – the implementation has been decomposed into
 * focused sub-modules under `./weekly-review/`.
 * All consumers that previously imported from `./weekly-review.js`
 * continue to work without changes.
 *
 * @see ./weekly-review/index.ts for the full public API.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export type {
  TitleSet,
  WeeklyReviewValidationResult,
  ArticleInput,
  GenerationOptions,
  VotingRecord,
  CoalitionStressResult,
  WeeklyActivityMetrics,
} from './weekly-review/index.js';
export {
  REQUIRED_TOOLS,
  formatDateForSlug,
  repoDataDir,
  loadCIAContext,
  enrichWithFullText,
  attachSpeechesToDocuments,
  analyzeCoalitionStress,
  calculateWeeklyActivityMetrics,
  generateCoalitionDynamicsSection,
  generateWeeklyActivitySection,
  generateWeeklyReview,
  validateWeeklyReview,
} from './weekly-review/index.js';
