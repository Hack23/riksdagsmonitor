/**
 * Anti-flash theme initialiser for Riksdagsmonitor news articles.
 *
 * Runs synchronously before first paint to set the correct `data-theme`
 * attribute on `<html>` and prevent a flash of the wrong theme.
 *
 * Uses the same storage key (`riksdagsmonitor-theme`) as theme-toggle.js
 * so that all theme state remains consistent across the app.
 *
 * @module js/theme-init
 */
(function () {
  var key = 'riksdagsmonitor-theme';
  var t = null;
  try { t = localStorage.getItem(key); } catch (_e) { /* ignore storage errors */ }
  if (t !== 'dark' && t !== 'light') {
    if (t !== null) { try { localStorage.removeItem(key); } catch (_e) { /* ignore storage errors */ } }
    t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
}());
