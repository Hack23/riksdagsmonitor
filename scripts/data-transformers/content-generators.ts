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
  generateSwotSection,
  generateDashboardSection,
  generateStakeholderSwotSection,
  generateEconomicDashboardSection,
  findIndicatorsForDomains,
  buildEconomicCharts,
  buildEconomicTables,
  scoreNewsworthiness,
  generateMindmapSection,
  generateSankeySection,
  generateCiaOverviewSection,
} from './content-generators/index.js';

export type {
  SwotSectionOptions,
  DashboardSectionOptions,
  StakeholderSwotSectionOptions,
  StakeholderSwot,
  EconomicDashboardOptions,
  EconomicDataPoint,
  NewsworthinessScore,
  NewsworthinessDimension,
  MindmapSectionOptions,
  MindmapBranch,
  MindmapBranchColor,
  SankeySectionOptions,
  SankeyNode,
  SankeyFlow,
  SankeyNodeColor,
  CiaOverviewSectionOptions,
} from './content-generators/index.js';
