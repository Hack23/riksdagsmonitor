/**
 * @module data-transformers/content-generators
 * @description Barrel re-export for all per-article-type content generators.
 * The monolithic content-generators.ts has been decomposed into focused modules:
 * - **shared** — internal helpers (TITLE_SUFFIX_TEMPLATES, extractKeywords, …)
 * - **week-ahead** — generateWeekAheadContent
 * - **committee** — generateCommitteeContent
 * - **propositions** — generatePropositionsContent
 * - **motions** — generateMotionsContent
 * - **interpellations** — generateInterpellationsContent
 * - **generic** — generateGenericContent
 * - **monthly-review** — generateMonthlyReviewContent
 * - **month-ahead** — generateMonthAheadContent
 * - **swot-section** — generateSwotSection  (embeddable SWOT analysis)
 * - **dashboard-section** — generateDashboardSection  (embeddable Chart.js dashboard)
 * - **stakeholder-swot-section** — generateStakeholderSwotSection  (multi-stakeholder SWOT)
 * - **economic-dashboard-section** — generateEconomicDashboardSection  (World Bank dashboards)
 * - **sankey-section** — generateSankeySection  (inline SVG Sankey flow charts)
 * - **mindmap-section** — generateMindmapSection  (color-coded CSS mindmaps)
 * - **newsworthiness** — scoreNewsworthiness  (multi-dimensional news value scoring)
 * - **cia-overview-section** — generateCiaOverviewSection  (CIA parliamentary intelligence overview)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { generateWeekAheadContent } from './week-ahead.js';
export { generateCommitteeContent } from './committee.js';
export { generatePropositionsContent } from './propositions.js';
export { generateMotionsContent } from './motions.js';
export { generateInterpellationsContent } from './interpellations.js';
export { generateGenericContent } from './generic.js';
export { generateMonthlyReviewContent } from './monthly-review.js';
export { generateMonthAheadContent } from './month-ahead.js';
export { generateDeepAnalysisSection, localizeDocType, DOC_TYPE_DISPLAY } from './shared.js';
export type { DeepAnalysisOptions, DocTypeLocalization } from './shared.js';
export { generateSwotSection } from './swot-section.js';
export type { SwotSectionOptions } from './swot-section.js';
export { generateDashboardSection } from './dashboard-section.js';
export type { DashboardSectionOptions } from './dashboard-section.js';
export { generateStakeholderSwotSection } from './stakeholder-swot-section.js';
export type { StakeholderSwotSectionOptions, StakeholderSwot } from './stakeholder-swot-section.js';
export { generateEconomicDashboardSection, findIndicatorsForDomains, buildEconomicCharts, buildEconomicTables } from './economic-dashboard-section.js';
export type { EconomicDashboardOptions, EconomicDataPoint } from './economic-dashboard-section.js';
export { scoreNewsworthiness } from './newsworthiness.js';
export type { NewsworthinessScore, NewsworthinessDimension } from './newsworthiness.js';
export { generateMindmapSection } from './mindmap-section.js';
export type { MindmapSectionOptions, MindmapBranch, MindmapBranchColor } from './mindmap-section.js';
export { generateSankeySection } from './sankey-section.js';
export type { SankeySectionOptions, SankeyNode, SankeyFlow, SankeyNodeColor } from './sankey-section.js';
export { generateCiaOverviewSection } from './cia-overview-section.js';
export type { CiaOverviewSectionOptions } from './cia-overview-section.js';
