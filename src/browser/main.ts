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
  const { registerBrowserGlobals } = await import('./shared/register-globals.js');
  registerBrowserGlobals();
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
  // Read the module-level variable to satisfy noUnusedLocals — the observer
  // must stay referenced at module scope to avoid garbage collection.
  void _lazyObserver;

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

// ─── Service Worker Registration ─────────────────────────────────────────────
// Registers /sw.js to enable PWA install + offline read-only access.
//
// HTML navigations use `networkFirst` (see public/sw.js) so every
// page already shows the latest content without intervention. The
// "update available" toast below is a courtesy for users who keep
// long-lived tabs open across deploys: it surfaces the new SW
// (which carries the new BUILD_ID and therefore a fresh HTML cache)
// and offers a one-click reload.
//
// We also call `registration.update()` on `visibilitychange` to
// catch users returning to a backgrounded tab after a deploy.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        logger.info('[SW] Registered:', reg.scope);

        // Re-check for an updated SW whenever the page regains focus.
        // `update()` is a no-op if no new worker is available.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => { /* ignore offline */ });
          }
        });

        // Fire one update check immediately after registration.
        reg.update().catch(() => { /* ignore offline */ });

        // Surface a "New content available" toast when a fresh SW
        // is installed AND another worker is already controlling
        // the page (i.e. this is an *update*, not the first install).
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              showUpdateToast(reg);
            }
          });
        });
      })
      .catch((err) => logger.warn('[SW] Registration failed:', err));

    // When the new SW takes control after `SKIP_WAITING`, reload so
    // the page is served from the new HTML cache.
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}

/**
 * Render a non-blocking toast offering the user a one-click reload to
 * pick up the latest deployed content. Pure DOM, no framework.
 *
 * Click → posts `SKIP_WAITING` to the waiting worker, which calls
 * `self.skipWaiting()` → fires `controllerchange` → page reloads.
 */
function showUpdateToast(reg: ServiceWorkerRegistration): void {
  if (document.getElementById('sw-update-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'sw-update-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = [
    'position:fixed',
    'inset-inline-end:1rem',
    'inset-block-end:1rem',
    'z-index:9999',
    'max-width:min(calc(100vw - 2rem),22rem)',
    'padding:0.875rem 1rem',
    'background:linear-gradient(135deg,rgba(0,217,255,0.18),rgba(255,0,110,0.14))',
    'border:1px solid rgba(0,217,255,0.55)',
    'border-radius:8px',
    'box-shadow:0 8px 32px rgba(0,0,0,0.45)',
    'color:#e0e0e0',
    'font:500 0.95rem/1.4 system-ui,-apple-system,"Segoe UI",sans-serif',
    'backdrop-filter:blur(10px)',
    '-webkit-backdrop-filter:blur(10px)',
    'display:flex',
    'gap:0.75rem',
    'align-items:center',
  ].join(';');

  const msg = document.createElement('span');
  msg.textContent = 'New content available';
  msg.style.cssText = 'flex:1';

  const reloadBtn = document.createElement('button');
  reloadBtn.type = 'button';
  reloadBtn.textContent = 'Reload';
  reloadBtn.style.cssText = [
    'padding:0.4rem 0.85rem',
    'background:linear-gradient(135deg,#00d9ff,#ff006e)',
    'color:#0a0e27',
    'border:0',
    'border-radius:4px',
    'font-weight:600',
    'cursor:pointer',
    'font-size:0.9rem',
  ].join(';');
  reloadBtn.addEventListener('click', () => {
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // No waiting worker (race with activate) — just reload.
      window.location.reload();
    }
  });

  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.textContent = '×';
  dismissBtn.setAttribute('aria-label', 'Dismiss');
  dismissBtn.style.cssText = [
    'background:transparent',
    'color:inherit',
    'border:0',
    'font-size:1.4rem',
    'line-height:1',
    'cursor:pointer',
    'padding:0 0.25rem',
    'opacity:0.7',
  ].join(';');
  dismissBtn.addEventListener('click', () => toast.remove());

  toast.append(msg, reloadBtn, dismissBtn);
  document.body.appendChild(toast);
}
