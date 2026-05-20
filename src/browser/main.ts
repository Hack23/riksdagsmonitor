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
import { initLazyDashboards, DEFAULT_ROOT_MARGIN, DEFAULT_THRESHOLD, HOMEPAGE_ROOT_MARGIN } from './lazy-loader.js';
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

  initBackToTop();

  // Pages dedicated to a single dashboard (`/dashboards/<slug>.html`,
  // `/politician-dashboard*.html`) need the generous 2000 px pre-fetch
  // margin so the lone below-fold container always intersects without
  // user scroll.  Multi-section pages such as `index*.html` must NOT
  // use that margin — `#coalition-status` would otherwise pre-fetch
  // ≈ 6 MiB of CSV on every visit, driving Lighthouse Performance to 4.
  // See {@link HOMEPAGE_ROOT_MARGIN} for the full root-cause analysis.
  const pathname =
    typeof window !== 'undefined' && window.location
      ? window.location.pathname
      : '';
  const isSingleDashboardPage =
    /^\/(dashboards\/|politician-dashboard)/.test(pathname);
  const rootMargin = isSingleDashboardPage
    ? DEFAULT_ROOT_MARGIN
    : HOMEPAGE_ROOT_MARGIN;

  _lazyObserver = initLazyDashboards(LAZY_DASHBOARDS, {
    rootMargin,
    threshold: DEFAULT_THRESHOLD,
  });
  void _lazyObserver;

  // Start pages (`/`, `/index.html`, `/index_<lang>.html`) have their
  // `data-stat-id="…"` placeholders baked at deploy time by
  // `scripts/bake-stats-html.ts`, so the runtime CSV fetch is pure
  // wasted work there — it would re-fetch ≈ 15 KiB, re-parse, and
  // overwrite DOM nodes with the identical value. Skip it on those
  // pages to cut TBT/LCP on the homepage. Every other page (notably
  // `/dashboards/*.html`, which also embed `data-stat-id` markers but
  // are NOT in the bake scope) still runs the original runtime path.
  const isBakedStartPage = /^\/(index(_[a-z]{2,3})?\.html)?$/i.test(pathname);

  if (!isBakedStartPage) {
    try {
      await initStats();
      logger.debug('✓ stats initialized');
    } catch (error) {
      logger.error('✗ stats failed:', error);
    }
  } else {
    logger.debug('✓ stats baked at deploy time — runtime fetch skipped');
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
// page already shows the latest content without intervention. Cache
// settings ensure freshness on every navigation — no popup or
// auto-reload is needed. The SW silently activates new versions.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        logger.info('[SW] Registered:', reg.scope);

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => { /* ignore offline */ });
          }
        });

        reg.update().catch(() => { /* ignore offline */ });

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => logger.warn('[SW] Registration failed:', err));
  });
}

/**
 * Deprecated localization helpers retained for backward compatibility with
 * `tests/sw-update-toast-labels.test.ts`. The SW update toast and the
 * auto-reload behavior they supported have been removed; the network-first
 * caching strategy in `public/sw.js` ensures fresh content on every
 * navigation without user intervention.
 */

/** @deprecated Labels previously used by the SW update toast. Retained for test backward compat. */
interface UpdateToastLabels {
  readonly lang: string;
  readonly message: string;
  readonly reload: string;
  readonly dismiss: string;
}

/**
 * Toast strings localized for the 14 site languages.
 * @deprecated Toast no longer shown. Retained for test backward compat.
 */
export const SW_UPDATE_TOAST_LABELS: Readonly<Record<string, UpdateToastLabels>> = {
  en: { lang: 'en', message: 'New content available', reload: 'Reload', dismiss: 'Dismiss' },
  sv: { lang: 'sv', message: 'Nytt innehåll tillgängligt', reload: 'Ladda om', dismiss: 'Stäng' },
  da: { lang: 'da', message: 'Nyt indhold tilgængeligt', reload: 'Genindlæs', dismiss: 'Luk' },
  no: { lang: 'no', message: 'Nytt innhold tilgjengelig', reload: 'Last på nytt', dismiss: 'Lukk' },
  nb: { lang: 'nb', message: 'Nytt innhold tilgjengelig', reload: 'Last på nytt', dismiss: 'Lukk' },
  fi: { lang: 'fi', message: 'Uutta sisältöä saatavilla', reload: 'Lataa uudelleen', dismiss: 'Sulje' },
  de: { lang: 'de', message: 'Neue Inhalte verfügbar', reload: 'Neu laden', dismiss: 'Schließen' },
  fr: { lang: 'fr', message: 'Nouveau contenu disponible', reload: 'Recharger', dismiss: 'Fermer' },
  es: { lang: 'es', message: 'Nuevo contenido disponible', reload: 'Recargar', dismiss: 'Cerrar' },
  nl: { lang: 'nl', message: 'Nieuwe inhoud beschikbaar', reload: 'Opnieuw laden', dismiss: 'Sluiten' },
  ar: { lang: 'ar', message: 'محتوى جديد متاح', reload: 'إعادة التحميل', dismiss: 'إغلاق' },
  he: { lang: 'he', message: 'תוכן חדש זמין', reload: 'טען מחדש', dismiss: 'סגור' },
  ja: { lang: 'ja', message: '新しいコンテンツがあります', reload: '再読み込み', dismiss: '閉じる' },
  ko: { lang: 'ko', message: '새 콘텐츠를 사용할 수 있습니다', reload: '새로고침', dismiss: '닫기' },
  zh: { lang: 'zh', message: '有新内容可用', reload: '重新加载', dismiss: '关闭' },
};

/**
 * Resolve the toast labels for a given `<html lang>` value.
 * @deprecated Toast no longer shown. Retained for test backward compat.
 */
export function getUpdateToastLabels(lang: string): UpdateToastLabels {
  const primary = (lang || 'en').toLowerCase().split(/[-_]/)[0] ?? 'en';
  return SW_UPDATE_TOAST_LABELS[primary] ?? SW_UPDATE_TOAST_LABELS.en!;
}
