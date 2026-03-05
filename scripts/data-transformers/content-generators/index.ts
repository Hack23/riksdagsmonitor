/**
 * @module data-transformers/content-generators
 * @description Barrel re-export for all per-article-type content generators.
 * The monolithic content-generators.ts has been decomposed into focused modules:
 * - **shared** — internal helpers (TITLE_SUFFIX_TEMPLATES, extractKeywords, …)
 * - **week-ahead** — generateWeekAheadContent
 * - **committee** — generateCommitteeContent
 * - **propositions** — generatePropositionsContent
 * - **motions** — generateMotionsContent
 * - **generic** — generateGenericContent
 * - **monthly-review** — generateMonthlyReviewContent
 * - **month-ahead** — generateMonthAheadContent
 * - **swot-section** — generateSwotSection  (embeddable SWOT analysis)
 * - **dashboard-section** — generateDashboardSection  (embeddable Chart.js dashboard)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { generateWeekAheadContent } from './week-ahead.js';
export { generateCommitteeContent } from './committee.js';
export { generatePropositionsContent } from './propositions.js';
export { generateMotionsContent } from './motions.js';
export { generateGenericContent } from './generic.js';
export { generateMonthlyReviewContent } from './monthly-review.js';
export { generateMonthAheadContent } from './month-ahead.js';
export { generateDeepAnalysisSection } from './shared.js';
export type { DeepAnalysisOptions } from './shared.js';
export { generateSwotSection } from './swot-section.js';
export type { SwotSectionOptions } from './swot-section.js';
export { generateDashboardSection } from './dashboard-section.js';
export type { DashboardSectionOptions } from './dashboard-section.js';
