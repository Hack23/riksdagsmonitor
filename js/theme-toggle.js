/**
 * @module ThemeToggle
 * @description Dark/light theme toggle for Riksdagsmonitor.
 *
 * Behaviour:
 *  1. On first visit, reads `prefers-color-scheme` to pick dark or light.
 *  2. The user's explicit choice is persisted to `localStorage`.
 *  3. The `data-theme` attribute on `<html>` drives all CSS custom-property
 *     overrides, giving higher specificity than the media-query fallback.
 *  4. Listens for system-theme changes and follows them unless the user has
 *     already made an explicit choice.
 *
 * Accessibility:
 *  - Toggle is a native `<button>` with `aria-pressed` and a descriptive
 *    `aria-label` that updates on every toggle.
 *  - Keyboard: Enter / Space activate the toggle.
 *
 * @license Apache-2.0
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'riksdagsmonitor-theme';
  const DARK  = 'dark';
  const LIGHT = 'light';

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Determine the initial theme.
   * Priority: localStorage > system preference
   */
  function resolveTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === DARK || saved === LIGHT) return saved;
    } catch (_) { /* private browsing */ }
    return prefersDark() ? DARK : LIGHT;
  }

  /**
   * Write the theme to the DOM and persist it.
   * @param {string} theme - 'dark' | 'light'
   * @param {boolean} [persist=true] - save to localStorage
   */
  function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
    }
  }

  /* ── Button state ─────────────────────────────────────────────────────── */

  function updateButton(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const isDark  = theme === DARK;
    const icon    = btn.querySelector('.theme-icon');
    const darkLbl = btn.getAttribute('data-label-dark')  || 'Switch to light theme';
    const lightLbl= btn.getAttribute('data-label-light') || 'Switch to dark theme';

    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label',   isDark ? darkLbl : lightLbl);
    btn.setAttribute('title',        isDark ? darkLbl : lightLbl);

    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  }

  /* ── Toggle handler ───────────────────────────────────────────────────── */

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || LIGHT;
    const next    = current === DARK ? LIGHT : DARK;
    applyTheme(next);
    updateButton(next);
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */

  // Apply before first paint (called synchronously by the anti-flash snippet
  // already present in <head>; this line covers when the module loads later).
  applyTheme(resolveTheme(), false /* initial resolution only; do not persist on module boot */);

  document.addEventListener('DOMContentLoaded', function () {
    const theme = document.documentElement.getAttribute('data-theme') || LIGHT;
    updateButton(theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    }

    // Follow system changes only when no explicit user preference is set
    if (window.matchMedia) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      var handleSchemeChange = function (e) {
        try {
          if (localStorage.getItem(STORAGE_KEY)) return; // explicit choice wins
        } catch (_) {}
        var sysTheme = e.matches ? DARK : LIGHT;
        applyTheme(sysTheme, false);
        updateButton(sysTheme);
      };
      // Use addEventListener where available; fall back to legacy addListener
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleSchemeChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(handleSchemeChange);
      }
    }
  });

  // Expose for programmatic use (e.g. Chart.js colour refresh)
  window.riksdagsToggleTheme  = toggle;
  window.riksdagsGetTheme     = function () {
    return document.documentElement.getAttribute('data-theme') || LIGHT;
  };
})();
