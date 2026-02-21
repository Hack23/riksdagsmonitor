/**
 * @module Main
 * @description Single entry point for main Riksdagsmonitor pages (index*.html).
 * Replaces 18 individual script tags with one module import.
 *
 * Each dashboard is initialized independently — if one fails, others continue.
 * Libraries (Chart.js, D3) are imported via Vite bundling from npm packages.

 *
 * @intelligence Central intelligence platform orchestrator — coordinates 12 analytical dashboards covering OSINT data acquisition, political risk assessment, coalition dynamics, electoral forecasting, and behavioral anomaly detection across 349 Swedish MPs and 8 parties.
 *
 * @business Core platform entry point delivering the primary user value proposition: comprehensive political transparency as a service. Each successfully loaded dashboard directly increases user engagement time (target: 8+ min average session), driving conversion from casual visitors to regular users and API subscribers.
 *
 * @marketing Landing page intelligence showcase — first impression for all 5 target audiences (citizens, journalists, researchers, NGOs, corporations). Each dashboard module is a demonstrable feature for content marketing, social media screenshots, and press coverage. Supports 14-language SEO via separate index files.
 * */

// ─── Library Imports (Vite bundles these from node_modules) ──────────────────
// Register Chart.js and D3.js on globalThis so dashboard modules can access them.
// Must be imported before any dashboard module that reads (globalThis as any).Chart / .d3.
import './shared/register-globals.js';

// ─── UI Components ───────────────────────────────────────────────────────────
import { initBackToTop } from './ui/back-to-top.js';

// ─── Dashboard Modules ──────────────────────────────────────────────────────
import { init as initStats } from './dashboards/stats-loader.js';
import { init as initRisk } from './dashboards/risk-dashboard.js';
import { init as initParty } from './dashboards/party-dashboard.js';
import { init as initMinistry } from './dashboards/ministry-dashboard.js';
import { init as initCoalitionLoader } from './dashboards/coalition-loader.js';
import { init as initCoalitionDashboard } from './dashboards/coalition-dashboard.js';
import { init as initCommittees } from './dashboards/committees-dashboard.js';
import { init as initElectionCycle } from './dashboards/election-cycle.js';
import { init as initSeasonalPatterns } from './dashboards/seasonal-patterns.js';
import { init as initPreElection } from './dashboards/pre-election.js';
import { init as initAnomalyDetection } from './dashboards/anomaly-detection.js';
import { init as initPolitician } from './dashboards/politician-dashboard.js';

import { logger } from './shared/logger.js';

// ─── Dashboard Registry ─────────────────────────────────────────────────────
// Each entry: [name, init function]
// Order matters for perceived loading (stats & risk first as they're above the fold)
const DASHBOARDS: Array<[string, () => Promise<void>]> = [
  ['stats', initStats],
  ['risk', initRisk],
  ['coalition-loader', initCoalitionLoader],
  ['party', initParty],
  ['coalition-dashboard', initCoalitionDashboard],
  ['committees', initCommittees],
  ['ministry', initMinistry],
  ['election-cycle', initElectionCycle],
  ['seasonal-patterns', initSeasonalPatterns],
  ['pre-election', initPreElection],
  ['anomaly-detection', initAnomalyDetection],
  ['politician', initPolitician],
];

// ─── Initialization ─────────────────────────────────────────────────────────

async function initAll(): Promise<void> {
  logger.info('Riksdagsmonitor initializing...');
  const start = performance.now();

  // Init UI components (sync, fast)
  initBackToTop();

  // Init dashboards in parallel — each is independent
  const results = await Promise.allSettled(
    DASHBOARDS.map(async ([name, initFn]) => {
      try {
        await initFn();
        logger.debug(`✓ ${name} initialized`);
      } catch (error) {
        logger.error(`✗ ${name} failed:`, error);
        throw error;
      }
    }),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  const elapsed = (performance.now() - start).toFixed(0);

  logger.info(`Initialized ${succeeded}/${DASHBOARDS.length} dashboards in ${elapsed}ms${failed > 0 ? ` (${failed} failed)` : ''}`);
}

// Wait for DOM then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void initAll());
} else {
  void initAll();
}
