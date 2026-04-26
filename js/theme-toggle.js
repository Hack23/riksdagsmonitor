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
  var _transitionTimer = null;

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
    } catch (_e) {
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
    document.documentElement.classList.add('theme-transition');
    applyTheme(currentTheme, button);
    try {
      window.localStorage.setItem(STORAGE_KEY, currentTheme);
    } catch (_e) {
      // Ignore storage errors
    }
    // Remove transition class after animations complete; clear any pending timer
    // to avoid races when the user clicks rapidly.
    if (_transitionTimer) { clearTimeout(_transitionTimer); }
    _transitionTimer = setTimeout(function () {
      document.documentElement.classList.remove('theme-transition');
      _transitionTimer = null;
    }, 350);
  });
}());

/**
 * Brand-logo bitmap fallback bootstrap.
 *
 * The header brand row renders an `<img class="rm-logo-img" data-rm-logo-img>`
 * stacked over a `🇸🇪` flag glyph fallback. When the bitmap loads
 * successfully we add `.rm-logo-img-loaded` to the parent `<a class="rm-logo">`
 * so the CSS rule `.rm-logo.rm-logo-img-loaded > .rm-logo-glyph { display: none }`
 * can hide the glyph. If the image errors (network failure, CDN block,
 * future asset removal) the class is never set and the emoji remains
 * visible — no broken-image icon, no collapsed brand row.
 *
 * Done in JS rather than via inline `onload=` so the chrome stays free of
 * inline scripting and we keep the option of tightening CSP in the future.
 */
(function () {
  if (typeof document === 'undefined') return;
  var imgs = document.querySelectorAll('img[data-rm-logo-img]');
  for (var i = 0; i < imgs.length; i++) {
    (function (img) {
      function markLoaded() {
        var parent = img.parentNode;
        if (parent && parent.classList) {
          parent.classList.add('rm-logo-img-loaded');
        }
      }
      // Image may already be cached/decoded by the time this runs.
      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      } else {
        img.addEventListener('load', markLoaded, { once: true });
      }
    })(imgs[i]);
  }
}());
