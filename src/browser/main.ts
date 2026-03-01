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

// ─── Lazy Dashboard Registry ─────────────────────────────────────────────────
// Each entry triggers a dynamic import() only when the container scrolls into view.
// The shared/register-globals.js (Chart.js, D3, PapaParse) is loaded as part of
// the first lazy dashboard — subsequent imports reuse the cached ES module.
const LAZY_DASHBOARDS: LazyDashboard[] = [
  {
    containerId: 'coalition-status',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/coalition-loader.js');
      await init();
    },
  },
  {
    containerId: 'election-cycle-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/election-cycle.js');
      await init();
    },
  },
  {
    containerId: 'party-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/party-dashboard.js');
      await init();
    },
  },
  {
    containerId: 'committee-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/committees-dashboard.js');
      await init();
    },
  },
  {
    containerId: 'coalition-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/coalition-dashboard.js');
      await init();
    },
  },
  {
    containerId: 'seasonal-patterns-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/seasonal-patterns.js');
      await init();
    },
  },
  {
    containerId: 'pre-election-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/pre-election.js');
      await init();
    },
  },
  {
    containerId: 'anomaly-detection-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/anomaly-detection.js');
      await init();
    },
  },
  {
    containerId: 'ministry-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/ministry-dashboard.js');
      await init();
    },
  },
  {
    containerId: 'risk-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/risk-dashboard.js');
      await init();
    },
  },
  {
    containerId: 'politician-dashboard',
    loader: async () => {
      await import('./shared/register-globals.js');
      const { init } = await import('./dashboards/politician-dashboard.js');
      await init();
    },
  },
];

// ─── Initialization ─────────────────────────────────────────────────────────

async function initAll(): Promise<void> {
  logger.info('Riksdagsmonitor initializing...');
  const start = performance.now();

  // Init UI components (sync, fast)
  initBackToTop();

  // Eager: stats loader populates hero metrics — no chart libraries needed
  try {
    await initStats();
    logger.debug('✓ stats initialized');
  } catch (error) {
    logger.error('✗ stats failed:', error);
  }

  // Lazy: chart-heavy dashboards load only when their section enters the viewport
  initLazyDashboards(LAZY_DASHBOARDS);

  const elapsed = (performance.now() - start).toFixed(0);
  logger.info(`Core initialized in ${elapsed}ms — ${LAZY_DASHBOARDS.length} dashboards pending lazy load`);
}

// Wait for DOM then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void initAll());
} else {
  void initAll();
}
