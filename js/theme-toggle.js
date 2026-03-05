/**
 * Theme toggle functionality for Riksdagsmonitor news articles.
 *
 * Reads/writes the user's preference under the same storage key
 * (`riksdagsmonitor-theme`) used by the anti-flash head snippet so that
 * the initial state, the toggle, and the CSS selector (`[data-theme]` on
 * `<html>`) are all kept in sync.
 *
 * @module js/theme-toggle
 */
(function () {
  var STORAGE_KEY = 'riksdagsmonitor-theme';
  var DARK = 'dark';
  var LIGHT = 'light';

  var button = document.getElementById('theme-toggle');
  if (!button) {
    return;
  }

  /**
   * Apply the given theme to the document and update the toggle button state.
   * Receives the button element explicitly to avoid relying on the outer-scope variable.
   *
   * @param {string} theme - 'dark' or 'light'
   * @param {HTMLElement} btn - The theme-toggle button element
   */
  function applyTheme(theme, btn) {
    document.documentElement.setAttribute('data-theme', theme);

    var isDark = theme === DARK;
    btn.setAttribute('aria-pressed', String(isDark));
    var label = isDark
      ? btn.getAttribute('data-label-dark')
      : btn.getAttribute('data-label-light');
    if (label) {
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
  }

  function getStoredTheme() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === DARK || stored === LIGHT) {
        return stored;
      }
    } catch (e) {
      // Ignore storage errors and fall back to the attribute set by the anti-flash snippet
    }
    return null;
  }

  // Resolve the initial theme in priority order:
  //  1. `data-theme` attribute on <html> — already set by the anti-flash head
  //     snippet before first paint; respecting it avoids a second flash.
  //  2. `localStorage` value — respects the user's explicit last choice when
  //     the anti-flash snippet could not set the attribute (e.g. JS disabled).
  //  3. Default to LIGHT if neither source provides a valid value.
  var initial = document.documentElement.getAttribute('data-theme');
  var currentTheme =
    (initial === DARK || initial === LIGHT ? initial : null) ||
    getStoredTheme() ||
    LIGHT;

  applyTheme(currentTheme, button);

  button.addEventListener('click', function () {
    currentTheme = currentTheme === DARK ? LIGHT : DARK;
    applyTheme(currentTheme, button);
    try {
      window.localStorage.setItem(STORAGE_KEY, currentTheme);
    } catch (e) {
      // Ignore storage errors
    }
  });
}());
