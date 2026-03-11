/**
 * @module Main
 * @description Single entry point for main Riksdagsmonitor pages (index*.html).
 * Replaces 18 individual script tags with one module import.
 *
 * Above-the-fold dashboards (stats) are initialised eagerly.
 * All chart-heavy dashboards are lazy-loaded via IntersectionObserver so that
 * Chart.js (~200 KB), D3 (~250 KB), and PapaParse (~50 KB) are only downloaded
 * when the user scrolls their containing section into view.
 *
 * @intelligence Central intelligence platform orchestrator — coordinates 12 analytical dashboards covering OSINT data acquisition, political risk assessment, coalition dynamics, electoral forecasting, and behavioral anomaly detection across 349 Swedish MPs and 8 parties.
 *
 * @business Core platform entry point delivering the primary user value proposition: comprehensive political transparency as a service. Each successfully loaded dashboard directly increases user engagement time (target: 8+ min average session), driving conversion from casual visitors to regular users and API subscribers.
 *
 * @marketing Landing page intelligence showcase — first impression for all 5 target audiences (citizens, journalists, researchers, NGOs, corporations). Each dashboard module is a demonstrable feature for content marketing, social media screenshots, and press coverage. Supports 14-language SEO via separate index files.
 * */

// ─── UI Components ───────────────────────────────────────────────────────────
import { initBackToTop } from './ui/back-to-top.js';

// ─── Eager Dashboard: stats-loader (above-the-fold hero stats, no chart libs) ──
import { init as initStats } from './dashboards/stats-loader.js';

// ─── Lazy Loading ─────────────────────────────────────────────────────────────
import { initLazyDashboards } from './lazy-loader.js';
import type { LazyDashboard } from './lazy-loader.js';

import { logger } from './shared/logger.js';

// ─── Lazy Dashboard Helper ────────────────────────────────────────────────────
// Loads register-globals (Chart.js, D3, PapaParse — cached after first call)
// then imports and runs a dashboard's init().
async function loadDashboard(
  moduleLoader: () => Promise<{ init: () => Promise<void> }>,
): Promise<void> {
  await import('./shared/register-globals.js');
  const { init } = await moduleLoader();
  await init();
}

// ─── Lazy Dashboard Registry ─────────────────────────────────────────────────
// Each entry triggers a dynamic import() only when the container scrolls into view.
const LAZY_DASHBOARDS: LazyDashboard[] = [
  {
    containerId: 'coalition-status',
    loader: () => loadDashboard(() => import('./dashboards/coalition-loader.js')),
  },
  {
    containerId: 'election-cycle-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/election-cycle.js')),
  },
  {
    containerId: 'party-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/party-dashboard.js')),
  },
  {
    containerId: 'committee-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/committees-dashboard.js')),
  },
  {
    containerId: 'coalition-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/coalition-dashboard.js')),
  },
  {
    containerId: 'seasonal-patterns-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/seasonal-patterns.js')),
  },
  {
    containerId: 'pre-election-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/pre-election.js')),
  },
  {
    containerId: 'anomaly-detection-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/anomaly-detection.js')),
  },
  {
    containerId: 'ministry-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/ministry-dashboard.js')),
  },
  {
    containerId: 'risk-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/risk-dashboard.js')),
  },
  {
    containerId: 'politician-dashboard',
    loader: () => loadDashboard(() => import('./dashboards/politician-dashboard.js')),
  },
];

// ─── Initialization ─────────────────────────────────────────────────────────

// Module-level reference prevents the IntersectionObserver from being
// garbage-collected after initAll() returns.
let _lazyObserver: IntersectionObserver | undefined;

async function initAll(): Promise<void> {
  logger.info('Riksdagsmonitor initializing...');
  const start = performance.now();

  // Init UI components (sync, fast)
  initBackToTop();

  // Register lazy dashboards immediately — IntersectionObserver must be live
  // before initStats()'s async I/O so containers already in/near the viewport
  // on initial render are not missed.
  _lazyObserver = initLazyDashboards(LAZY_DASHBOARDS);
  void _lazyObserver; // retain reference to prevent GC

  // Eager: stats loader populates hero metrics — no chart libraries needed
  try {
    await initStats();
    logger.debug('✓ stats initialized');
  } catch (error) {
    logger.error('✗ stats failed:', error);
  }

  const elapsed = (performance.now() - start).toFixed(0);
  logger.info(`Core initialized in ${elapsed}ms — ${LAZY_DASHBOARDS.length} dashboards pending lazy load`);
}

// Wait for DOM then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void initAll());
} else {
  void initAll();
}
