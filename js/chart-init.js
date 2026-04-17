/**
 * chart-init.js — generic Chart.js initializer for riksdagsmonitor articles.
 *
 * Scans the DOM for `<canvas data-chart-config="…">` elements, parses the
 * JSON-escaped Chart.js config stored in the `data-chart-config` attribute,
 * and instantiates a `new Chart(ctx, config)` for each one.
 *
 * This module is loaded automatically by `scripts/article-template/template.ts`
 * when an article contains at least one `data-chart-config` canvas (emitted
 * by `scripts/data-transformers/content-generators/dashboard-section.ts`,
 * `economic-dashboard-section.ts`, `swot-section.ts`, etc.).
 *
 * Requires Chart.js 4 to be loaded before this script runs (the template
 * loads `../js/lib/chart.umd.4.4.1.js` immediately prior).
 *
 * Security: `data-chart-config` is produced server-side by the static-site
 * generator from typed `DashboardChartConfig` objects — the content is not
 * user-supplied, so JSON.parse is safe. `new Chart()` does not execute
 * arbitrary code from its config.
 *
 * WCAG: failed charts leave the `<canvas>` empty and the sibling
 * accessibility table (also server-side rendered) continues to display the
 * same numeric data for screen readers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

(function () {
  'use strict';

  /** Safely parse the JSON blob held by the data-chart-config attribute. */
  function parseConfig(el) {
    var raw = el.getAttribute('data-chart-config');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[chart-init] Invalid data-chart-config JSON on', el, err);
      }
      return null;
    }
  }

  /**
   * Register the Chart.js annotation plugin if it's been loaded globally.
   * The plugin ships as a UMD that exposes `window['chartjs-plugin-annotation']`
   * (or `window.ChartAnnotation`). Registering is idempotent.
   */
  function registerAnnotationPlugin(Chart) {
    if (!Chart || typeof Chart.register !== 'function') return;
    var plugin =
      (typeof window !== 'undefined' && window['chartjs-plugin-annotation']) ||
      (typeof window !== 'undefined' && window.ChartAnnotation) ||
      null;
    if (plugin) {
      try { Chart.register(plugin); } catch (_e) { /* already registered */ }
    }
  }

  function initAll() {
    if (typeof window === 'undefined') return;
    var Chart = window.Chart;
    if (!Chart) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[chart-init] Chart.js not loaded — skipping chart initialisation');
      }
      return;
    }

    registerAnnotationPlugin(Chart);

    var canvases = document.querySelectorAll('canvas[data-chart-config]');
    for (var i = 0; i < canvases.length; i++) {
      var canvas = canvases[i];
      // Guard against re-initialisation (e.g. hot reload, navigation caches).
      if (canvas.getAttribute('data-chart-initialised') === '1') continue;

      var cfg = parseConfig(canvas);
      if (!cfg) continue;

      try {
        new Chart(canvas.getContext('2d'), cfg);
        canvas.setAttribute('data-chart-initialised', '1');
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[chart-init] Failed to render chart', canvas.id || '(anonymous)', err);
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    // DOM already parsed (e.g. script placed at end of <body>)
    initAll();
  }
})();
