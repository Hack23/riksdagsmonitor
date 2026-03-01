/**
 * @module news-types/weekly-review
 * @description Barrel re-export for weekly-review article generation module.
 * Decomposed from the monolithic weekly-review.ts into focused sub-modules:
 * - **types** — exported interfaces and constants (REQUIRED_TOOLS, TitleSet, etc.)
 * - **data-loader** — CIA context loading, CSV parsing, document enrichment
 * - **analysis** — coalition stress analysis, weekly metrics, content sections
 * - **generator** — main generateWeeklyReview orchestrator function
 * - **validation** — validateWeeklyReview quality checks
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

// Types and constants
export type {
  TitleSet,
  WeeklyReviewValidationResult,
  ArticleInput,
  GenerationOptions,
  VotingRecord,
  CoalitionStressResult,
  WeeklyActivityMetrics,
} from './types.js';
export { REQUIRED_TOOLS } from './types.js';

// Data loading utilities
export {
  formatDateForSlug,
  repoDataDir,
  loadCIAContext,
  enrichWithFullText,
  attachSpeechesToDocuments,
} from './data-loader.js';

// Analysis functions
export {
  analyzeCoalitionStress,
  calculateWeeklyActivityMetrics,
  generateCoalitionDynamicsSection,
  generateWeeklyActivitySection,
} from './analysis.js';

// Main generator
export { generateWeeklyReview } from './generator.js';

// Validation
export { validateWeeklyReview } from './validation.js';
