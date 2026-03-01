/**
 * @module Browser/LazyLoader
 * @description Lazy loads dashboard modules using IntersectionObserver.
 * Defers dynamic import() calls until the dashboard container enters the viewport,
 * reducing initial page load and improving Time to Interactive (TTI).
 *
 * Falls back to immediate loading when IntersectionObserver is unavailable.
 *
 * @performance Each lazy dashboard defers its dynamic import() until the section
 * scrolls into view (plus a 200 px pre-fetch margin), preventing Chart.js (~200 KB),
 * D3 (~250 KB) and PapaParse (~50 KB) from blocking the initial parse/render.
 */

import { logger } from './shared/logger.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A dashboard that should be loaded lazily when its container enters the viewport. */
export interface LazyDashboard {
  /** The `id` attribute of the section/container element to observe. */
  containerId: string;
  /** Async function that dynamically imports and initialises the dashboard. */
  loader: () => Promise<void>;
}

/** CSS class applied to a container while its module is loading. */
export const CHART_SKELETON_CLASS = 'chart-skeleton';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register dashboard modules for lazy loading via IntersectionObserver.
 *
 * When a container element intersects the viewport (with a 200 px pre-fetch
 * margin), its loader is called, the skeleton class is added, and removed
 * once the promise resolves or rejects.
 *
 * If `IntersectionObserver` is unavailable (SSR, old browser), all loaders
 * are invoked immediately as a graceful fallback.
 *
 * @param dashboards - Array of lazy-loadable dashboard descriptors.
 * @param options    - Optional `IntersectionObserver` init overrides.
 */
export function initLazyDashboards(
  dashboards: LazyDashboard[],
  options: IntersectionObserverInit = { rootMargin: '200px', threshold: 0.01 },
): void {
  if (typeof IntersectionObserver === 'undefined') {
    // Graceful fallback: load everything immediately
    for (const { containerId, loader } of dashboards) {
      loader().catch((err: unknown) =>
        logger.error(`Lazy load failed for #${containerId}:`, err),
      );
    }
    return;
  }

  // Map element → loader for O(1) lookup inside the observer callback
  const pending = new Map<Element, () => Promise<void>>();

  const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const el = entry.target as HTMLElement;
      observer.unobserve(el);

      const loaderFn = pending.get(el);
      if (!loaderFn) continue;
      pending.delete(el);

      // Show skeleton while the module is downloading / initialising
      el.classList.add(CHART_SKELETON_CLASS);

      loaderFn()
        .then(() => {
          el.classList.remove(CHART_SKELETON_CLASS);
          logger.debug(`✓ lazy loaded #${el.id}`);
        })
        .catch((err: unknown) => {
          el.classList.remove(CHART_SKELETON_CLASS);
          logger.error(`✗ lazy load failed #${el.id}:`, err);
        });
    }
  }, options);

  for (const { containerId, loader } of dashboards) {
    const el = document.getElementById(containerId);
    if (!el) {
      logger.debug(`Lazy loader: #${containerId} not in DOM, skipping`);
      continue;
    }
    pending.set(el, loader);
    observer.observe(el);
  }
}
