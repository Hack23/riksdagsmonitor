/**
 * @module Browser/LazyLoader
 * @description Lazy loads dashboard modules using IntersectionObserver.
 * Defers dynamic import() calls until the dashboard container enters the viewport,
 * reducing initial page load and improving Time to Interactive (TTI).
 *
 * Falls back to immediate loading when IntersectionObserver is unavailable.
 *
 * @performance Each lazy dashboard defers its dynamic import() until the section
 * scrolls into view (plus a `DEFAULT_ROOT_MARGIN` pre-fetch margin), preventing
 * Chart.js (~200 KB), D3 (~250 KB) and PapaParse (~50 KB) from blocking the
 * initial parse/render.
 *
 * The default pre-fetch margin (`2000 px`) is intentionally generous so that on
 * dedicated `/dashboards/<name>.html` pages — where a single dashboard container
 * frequently sits 1 000–1 500 px below the fold beneath hero + navigation — the
 * IntersectionObserver still fires immediately without any user scroll. A
 * narrower 200 px margin (the previous default) silently broke those pages
 * because the dashboard never entered the observer's root.
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

/**
 * Default `IntersectionObserver` `rootMargin` used by {@link initLazyDashboards}.
 *
 * Set generously (≈ 2 viewport heights) so that on dedicated dashboard pages
 * (`/dashboards/<name>.html`) the single below-fold dashboard container always
 * pre-fetches without requiring user scroll — the previous `200px` value left
 * those pages with empty charts until the user scrolled, because the only
 * dashboard on the page sits ~1 000–1 500 px below a 720 px viewport.
 *
 * Tests assert this exact value to lock the contract.
 */
export const DEFAULT_ROOT_MARGIN = '2000px';

/** Default intersection threshold paired with {@link DEFAULT_ROOT_MARGIN}. */
export const DEFAULT_THRESHOLD = 0.01;

/**
 * Parse the first component of an `IntersectionObserver` `rootMargin` string
 * (e.g. `"2000px"`, `"100px 50px"`) into a pixel number. Returns `0` when the
 * value is missing, percentage-based, or otherwise unparseable — this is
 * intentionally conservative so the eager-load fallback never fires for
 * containers that the observer itself would not consider intersecting.
 */
export function parseRootMarginPx(rootMargin: string | undefined): number {
  if (!rootMargin) return 0;
  const first = rootMargin.trim().split(/\s+/)[0];
  if (!first) return 0;
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(first);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register dashboard modules for lazy loading via IntersectionObserver.
 *
 * When a container element intersects the viewport (with a 200 px pre-fetch
 * margin), its loader is called, the skeleton class is added, and removed
 * once the promise resolves or rejects.
 *
 * If `IntersectionObserver` is unavailable (old browser), all loaders are
 * invoked immediately as a graceful fallback (containers still checked for DOM
 * presence before loading).
 *
 * The created `IntersectionObserver` is returned so callers can hold a
 * reference (preventing GC) and call `disconnect()` if needed. `undefined` is
 * returned when the fallback path is taken.
 *
 * @param dashboards - Array of lazy-loadable dashboard descriptors.
 * @param options    - Optional `IntersectionObserver` init overrides.
 * @returns The active `IntersectionObserver`, or `undefined` in fallback mode.
 */
export function initLazyDashboards(
  dashboards: LazyDashboard[],
  options: IntersectionObserverInit = {
    rootMargin: DEFAULT_ROOT_MARGIN,
    threshold: DEFAULT_THRESHOLD,
  },
): IntersectionObserver | undefined {
  if (typeof IntersectionObserver === 'undefined') {
    for (const { containerId, loader } of dashboards) {
      const el = document.getElementById(containerId);
      if (!el) {
        logger.debug(`Lazy loader (fallback): #${containerId} not in DOM, skipping`);
        continue;
      }
      el.classList.add(CHART_SKELETON_CLASS);
      Promise.resolve()
        .then(() => loader())
        .then(() => {
          el.classList.remove(CHART_SKELETON_CLASS);
        })
        .catch((err: unknown) => {
          el.classList.remove(CHART_SKELETON_CLASS);
          logger.error(`Lazy load failed for #${containerId}:`, err);
        });
    }
    return undefined;
  }

  const pending = new Map<Element, () => Promise<void>>();

  const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const el = entry.target as HTMLElement;
      observer.unobserve(el);

      const loaderFn = pending.get(el);
      if (!loaderFn) continue;
      pending.delete(el);

      el.classList.add(CHART_SKELETON_CLASS);

      Promise.resolve()
        .then(() => loaderFn())
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

  // Belt-and-suspenders fallback: on dedicated dashboard pages the single
  // observed container often sits 1 000–1 500 px below the fold, well
  // outside the default 200 px pre-fetch margin used previously. Even with
  // the new 2 000 px DEFAULT_ROOT_MARGIN, some browser / iframe contexts
  // (e.g. Cypress AUT) do not always deliver an initial intersection entry
  // without a user-driven scroll, leaving the dashboard empty until the
  // user scrolls. Defensively probe each observed container's geometry
  // against the configured rootMargin one frame after registration and
  // synthesise a load for anything that would intersect — this fires the
  // loader exactly once regardless of whether the observer also fires.
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    const rootMarginPx = parseRootMarginPx(options.rootMargin);
    window.requestAnimationFrame(() => {
      for (const [el, loaderFn] of pending) {
        const rect = (el as HTMLElement).getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const intersects = rect.bottom >= -rootMarginPx && rect.top <= viewportHeight + rootMarginPx;
        if (!intersects) continue;

        observer.unobserve(el);
        pending.delete(el);

        (el as HTMLElement).classList.add(CHART_SKELETON_CLASS);
        Promise.resolve()
          .then(() => loaderFn())
          .then(() => {
            (el as HTMLElement).classList.remove(CHART_SKELETON_CLASS);
            logger.debug(`✓ eager-loaded #${el.id} (near-viewport)`);
          })
          .catch((err: unknown) => {
            (el as HTMLElement).classList.remove(CHART_SKELETON_CLASS);
            logger.error(`✗ eager load failed #${el.id}:`, err);
          });
      }
    });
  }

  return observer;
}
