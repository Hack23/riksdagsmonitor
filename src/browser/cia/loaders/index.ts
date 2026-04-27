/**
 * @module CIA/Loaders
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Barrel export for all per-domain CIA data loaders.
 *
 * Each loader is a free function `(loadCSV: LoadCSV) => Promise<T>` that can
 * be imported and tested in isolation. The aggregator class in
 * `../data-loader.ts` wires them together with a shared CSV loader closure.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

export { loadOverviewDashboard } from './overview.js';
export { loadElectionAnalysis } from './election.js';
export { loadPartyPerformance } from './parties.js';
export { loadTop10Influential } from './top10.js';
export { loadCommitteeNetwork } from './committees.js';
export { loadVotingPatterns } from './voting.js';
export { loadMinistryDashboard } from './ministries.js';
export { loadDemographics } from './demographics.js';
export { loadDocumentActivity } from './documents.js';
export { loadRiskEvolution } from './risk.js';
