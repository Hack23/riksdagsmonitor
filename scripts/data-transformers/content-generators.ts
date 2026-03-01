/**
 * @module data-transformers/content-generators
 * @description Barrel re-export – the implementation has been decomposed into
 * per-content-type modules under `./content-generators/`.
 * All consumers that previously imported from `./content-generators.js`
 * continue to work without changes.
 *
 * @see ./content-generators/index.ts for the full public API.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export {
  generateWeekAheadContent,
  generateCommitteeContent,
  generatePropositionsContent,
  generateMotionsContent,
  generateGenericContent,
  generateMonthlyReviewContent,
  generateMonthAheadContent,
} from './content-generators/index.js';
