/**
 * Tests for IntersectionObserver-based lazy dashboard loader
 *
 * Verifies:
 *   - initLazyDashboards() calls loaders only when containers enter the viewport
 *   - skeleton class is applied while loading and removed on completion / failure
 *   - graceful fallback when IntersectionObserver is unavailable
 *   - missing container elements are skipped without throwing
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initLazyDashboards, CHART_SKELETON_CLASS } from '../src/browser/lazy-loader.js';

// ─── IntersectionObserver mock ────────────────────────────────────────────────

/** Capture observe/unobserve calls so we can fire entries manually */
let observerCallback = null;
const observedElements = new Set();

class MockIntersectionObserver {
  constructor(callback, _options) {
    observerCallback = callback;
  }
  observe(el) {
    observedElements.add(el);
  }
  unobserve(el) {
    observedElements.delete(el);
  }
  disconnect() {
    observedElements.clear();
  }
}

/** Simulate an element intersecting the viewport */
function triggerIntersection(el, isIntersecting = true) {
  if (observerCallback) {
    observerCallback([{ target: el, isIntersecting }]);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('initLazyDashboards', () => {
  let originalIntersectionObserver;

  beforeEach(() => {
    observerCallback = null;
    observedElements.clear();
    originalIntersectionObserver = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  // ── Skeleton class management ────────────────────────────────────────────────

  describe('Skeleton class', () => {
    it('adds chart-skeleton class to container while loading', async () => {
      document.body.innerHTML = '<section id="test-dashboard"></section>';
      const el = document.getElementById('test-dashboard');

      let resolveLoader;
      const loader = vi.fn(() => new Promise((res) => { resolveLoader = res; }));

      initLazyDashboards([{ containerId: 'test-dashboard', loader }]);
      triggerIntersection(el);

      // skeleton present during loading
      expect(el.classList.contains(CHART_SKELETON_CLASS)).toBe(true);

      resolveLoader();
      await loader.mock.results[0].value;
      // flush microtasks
      await Promise.resolve();

      expect(el.classList.contains(CHART_SKELETON_CLASS)).toBe(false);
    });

    it('removes chart-skeleton class when loader rejects', async () => {
      document.body.innerHTML = '<section id="test-dashboard"></section>';
      const el = document.getElementById('test-dashboard');

      const loader = vi.fn(() => Promise.reject(new Error('load failed')));

      initLazyDashboards([{ containerId: 'test-dashboard', loader }]);
      triggerIntersection(el);

      await Promise.resolve(); // flush rejection handler
      await Promise.resolve();

      expect(el.classList.contains(CHART_SKELETON_CLASS)).toBe(false);
    });
  });

  // ── Intersection-triggered loading ──────────────────────────────────────────

  describe('Viewport-triggered loading', () => {
    it('does not call loader before intersection', () => {
      document.body.innerHTML = '<section id="test-dashboard"></section>';
      const loader = vi.fn(() => Promise.resolve());

      initLazyDashboards([{ containerId: 'test-dashboard', loader }]);

      expect(loader).not.toHaveBeenCalled();
    });

    it('calls loader when container intersects viewport', async () => {
      document.body.innerHTML = '<section id="test-dashboard"></section>';
      const el = document.getElementById('test-dashboard');
      const loader = vi.fn(() => Promise.resolve());

      initLazyDashboards([{ containerId: 'test-dashboard', loader }]);
      triggerIntersection(el);

      expect(loader).toHaveBeenCalledOnce();
    });

    it('does not call loader for non-intersecting entries', () => {
      document.body.innerHTML = '<section id="test-dashboard"></section>';
      const el = document.getElementById('test-dashboard');
      const loader = vi.fn(() => Promise.resolve());

      initLazyDashboards([{ containerId: 'test-dashboard', loader }]);
      triggerIntersection(el, false); // isIntersecting = false

      expect(loader).not.toHaveBeenCalled();
    });

    it('unobserves element after first intersection', async () => {
      document.body.innerHTML = '<section id="test-dashboard"></section>';
      const el = document.getElementById('test-dashboard');
      const loader = vi.fn(() => Promise.resolve());

      initLazyDashboards([{ containerId: 'test-dashboard', loader }]);
      expect(observedElements.has(el)).toBe(true);

      triggerIntersection(el);
      expect(observedElements.has(el)).toBe(false);
    });

    it('calls loader only once even when intersected multiple times', async () => {
      document.body.innerHTML = '<section id="test-dashboard"></section>';
      const el = document.getElementById('test-dashboard');
      const loader = vi.fn(() => Promise.resolve());

      initLazyDashboards([{ containerId: 'test-dashboard', loader }]);
      triggerIntersection(el);
      triggerIntersection(el); // second trigger — should be ignored

      expect(loader).toHaveBeenCalledOnce();
    });
  });

  // ── Multiple dashboards ──────────────────────────────────────────────────────

  describe('Multiple dashboards', () => {
    it('observes all containers on registration', () => {
      document.body.innerHTML = `
        <section id="dashboard-a"></section>
        <section id="dashboard-b"></section>
      `;
      const loaderA = vi.fn(() => Promise.resolve());
      const loaderB = vi.fn(() => Promise.resolve());

      initLazyDashboards([
        { containerId: 'dashboard-a', loader: loaderA },
        { containerId: 'dashboard-b', loader: loaderB },
      ]);

      expect(observedElements.size).toBe(2);
    });

    it('loads dashboards independently when each intersects', async () => {
      document.body.innerHTML = `
        <section id="dashboard-a"></section>
        <section id="dashboard-b"></section>
      `;
      const elA = document.getElementById('dashboard-a');
      const elB = document.getElementById('dashboard-b');
      const loaderA = vi.fn(() => Promise.resolve());
      const loaderB = vi.fn(() => Promise.resolve());

      initLazyDashboards([
        { containerId: 'dashboard-a', loader: loaderA },
        { containerId: 'dashboard-b', loader: loaderB },
      ]);

      triggerIntersection(elA);
      expect(loaderA).toHaveBeenCalledOnce();
      expect(loaderB).not.toHaveBeenCalled();

      triggerIntersection(elB);
      expect(loaderB).toHaveBeenCalledOnce();
    });
  });

  // ── Missing containers ───────────────────────────────────────────────────────

  describe('Missing containers', () => {
    it('skips dashboards whose container is not in the DOM', () => {
      // No matching element in DOM
      const loader = vi.fn(() => Promise.resolve());

      expect(() =>
        initLazyDashboards([{ containerId: 'nonexistent-dashboard', loader }])
      ).not.toThrow();

      expect(loader).not.toHaveBeenCalled();
    });

    it('still loads present dashboards when some containers are missing', async () => {
      document.body.innerHTML = '<section id="present-dashboard"></section>';
      const el = document.getElementById('present-dashboard');
      const presentLoader = vi.fn(() => Promise.resolve());
      const missingLoader = vi.fn(() => Promise.resolve());

      initLazyDashboards([
        { containerId: 'missing-dashboard', loader: missingLoader },
        { containerId: 'present-dashboard', loader: presentLoader },
      ]);

      triggerIntersection(el);

      expect(presentLoader).toHaveBeenCalledOnce();
      expect(missingLoader).not.toHaveBeenCalled();
    });
  });

  // ── Fallback: no IntersectionObserver ────────────────────────────────────────

  describe('Fallback (no IntersectionObserver)', () => {
    it('loads all present dashboards immediately when IntersectionObserver is unavailable', async () => {
      delete globalThis.IntersectionObserver;

      document.body.innerHTML = `
        <section id="dash-a"></section>
        <section id="dash-b"></section>
      `;
      const loaderA = vi.fn(() => Promise.resolve());
      const loaderB = vi.fn(() => Promise.resolve());

      initLazyDashboards([
        { containerId: 'dash-a', loader: loaderA },
        { containerId: 'dash-b', loader: loaderB },
      ]);

      expect(loaderA).toHaveBeenCalledOnce();
      expect(loaderB).toHaveBeenCalledOnce();
    });

    it('skips missing containers in fallback mode', () => {
      delete globalThis.IntersectionObserver;

      // No matching element in DOM
      const loader = vi.fn(() => Promise.resolve());
      initLazyDashboards([{ containerId: 'nonexistent', loader }]);

      expect(loader).not.toHaveBeenCalled();
    });

    it('does not throw when IntersectionObserver is unavailable', () => {
      delete globalThis.IntersectionObserver;

      const loader = vi.fn(() => Promise.resolve());
      expect(() =>
        initLazyDashboards([{ containerId: 'nonexistent', loader }])
      ).not.toThrow();
    });

    it('applies and removes skeleton class in fallback mode', async () => {
      delete globalThis.IntersectionObserver;

      document.body.innerHTML = '<section id="fallback-dash"></section>';
      const el = document.getElementById('fallback-dash');

      let resolveLoader;
      const loader = vi.fn(() => new Promise((res) => { resolveLoader = res; }));

      initLazyDashboards([{ containerId: 'fallback-dash', loader }]);

      expect(loader).toHaveBeenCalledOnce();
      // skeleton added immediately (before promise resolves)
      expect(el.classList.contains(CHART_SKELETON_CLASS)).toBe(true);

      resolveLoader();
      await loader.mock.results[0].value;
      await Promise.resolve();

      expect(el.classList.contains(CHART_SKELETON_CLASS)).toBe(false);
    });
  });
});

// ─── CHART_SKELETON_CLASS constant ───────────────────────────────────────────

describe('CHART_SKELETON_CLASS', () => {
  it('is "chart-skeleton"', () => {
    expect(CHART_SKELETON_CLASS).toBe('chart-skeleton');
  });
});
