/**
 * chart-init.js — generic Chart.js initializer for riksdagsmonitor articles.
 *
 * Scans the DOM for canvas elements that carry chart configuration and
 * instantiates a `new Chart(ctx, config)` for each one. Two config
 * delivery mechanisms are supported:
 *
 *  1. `data-chart-config="…"` — JSON-escaped config string in the attribute
 *     (legacy; produced by the static-site generator for most article types).
 *  2. `data-chart-config-id="<id>"` — references a sibling
 *     `<script type="application/json" id="<id>">` element whose text content
 *     holds the JSON config. This avoids the HTML-escaping noise of large
 *     JSON blobs in attributes and makes manual review/editing easier.
 *
 * Both mechanisms apply the same security guard (function-literal rejection)
 * and the same `applyUserPreferences` pass before instantiation.
 *
 * This module is loaded automatically by `scripts/article-template/template.ts`
 * when an article contains at least one chart canvas (emitted by
 * `scripts/data-transformers/content-generators/dashboard-section.ts`,
 * `economic-dashboard-section.ts`, `swot-section.ts`, etc.).
 *
 * Requires Chart.js 4 to be loaded before this script runs (the template
 * loads `../js/lib/chart.umd.4.4.1.js` immediately prior).
 *
 * Security: configs are produced server-side by the static-site generator
 * from typed `DashboardChartConfig` objects — the content is not
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

  // Defence-in-depth: reject any data-chart-config whose stringified form
  // contains a function-literal token. Chart.js configs are pure data
  // (produced server-side by the TypeScript static-site generator from
  // typed `DashboardChartConfig` objects) and must never contain
  // executable strings. This guard keeps us safe if a future generator
  // regression (or a malicious edit) ever attempts to smuggle code via
  // JSON attributes — even though `JSON.parse` itself is safe, we refuse
  // to hand anything suspicious to Chart.js.
  var FUNC_LITERAL_RE = /\bfunction\s*\(/;

  /** Safely parse the JSON blob held by the data-chart-config attribute. */
  function parseConfig(el) {
    var raw = el.getAttribute('data-chart-config');
    if (!raw) return null;
    if (FUNC_LITERAL_RE.test(raw)) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[chart-init] Rejecting data-chart-config containing function literal on', el);
      }
      return null;
    }
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
   * Safely parse the JSON blob from a `<script type="application/json">`
   * element referenced by the canvas's `data-chart-config-id` attribute.
   *
   * This mechanism avoids embedding large HTML-escaped JSON strings directly
   * in data-* attributes, making the markup easier to read and review.
   */
  function parseConfigById(el) {
    var id = el.getAttribute('data-chart-config-id');
    if (!id) return null;
    var scriptEl = document.getElementById(id);
    if (!scriptEl) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[chart-init] No <script> element found with id "' + id + '" for canvas', el);
      }
      return null;
    }
    var raw = scriptEl.textContent || scriptEl.innerHTML || '';
    if (FUNC_LITERAL_RE.test(raw)) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[chart-init] Rejecting data-chart-config-id JSON containing function literal on', el);
      }
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[chart-init] Invalid JSON in script#' + id, err);
      }
      return null;
    }
  }

  /**
   * Apply user preferences to a Chart.js config just before instantiation.
   *
   * - Honours `prefers-reduced-motion: reduce` by disabling all animations
   *   (Chart.js animates bars/lines by default, which can trigger vestibular
   *   issues for motion-sensitive users).
   *
   * The original config object is mutated in place; since each config is
   * parsed from its own attribute, mutation is safe and avoids an extra
   * deep-clone allocation on every canvas.
   */
  function applyUserPreferences(config) {
    if (!config || typeof config !== 'object') return config;
    var reduceMotion;
    try {
      reduceMotion = !!(
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch (_e) {
      reduceMotion = false;
    }
    if (reduceMotion) {
      config.options = config.options || {};
      // Disable animation on initial render and on update (hover/tooltips).
      config.options.animation = false;
      if (typeof config.options.animations === 'object' && config.options.animations !== null) {
        config.options.animations = {};
      }
      if (typeof config.options.transitions === 'object' && config.options.transitions !== null) {
        config.options.transitions = {};
      }
    }
    return config;
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

    var canvases = document.querySelectorAll('canvas[data-chart-config], canvas[data-chart-config-id]');
    for (var i = 0; i < canvases.length; i++) {
      var canvas = canvases[i];
      // Guard against re-initialisation (e.g. hot reload, navigation caches).
      if (canvas.getAttribute('data-chart-initialised') === '1') continue;

      var cfg = canvas.hasAttribute('data-chart-config-id')
        ? parseConfigById(canvas)
        : parseConfig(canvas);
      if (!cfg) continue;
      cfg = applyUserPreferences(cfg);

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
