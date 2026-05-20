/**
 * @module generate-news-indexes/template/client-script-runtime/helpers
 * @description Pure utility helpers (XSS escape, safe href, i18n template
 * interpolation) — emitted as a string fragment into the inline `<script>`
 * body. Keep small: this is a CSP-relevant surface per
 * `Secure_Development_Policy.md`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Helper functions (escape / safe href / i18n template). */
export const HELPER_FUNCTIONS = `
    // HTML-escape helper to prevent XSS when interpolating article fields into innerHTML
    function esc(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    }

    function safeHref(slug) {
      var s = String(slug);
      // Allow relative HTML paths including subdirectory articles (e.g. "2026-05-04-election-cycle/current-en.html").
      // Block control chars, backslashes, and protocol-relative URLs.
      if (!s || /[\\\\\\x00-\\x1F\\x7F]/.test(s) || s.indexOf('//') === 0) {
        return '#';
      }
      if (!/^[A-Za-z0-9._/-]+\\.html$/.test(s)) {
        return '#';
      }
      return esc(s);
    }

    function i18nShowing(shown, total) {
      var template;
      if (i18nShowingConfig && typeof i18nShowingConfig === 'object') {
        if (shown === 1 && Object.prototype.hasOwnProperty.call(i18nShowingConfig, 'one')) {
          template = i18nShowingConfig.one;
        } else if (Object.prototype.hasOwnProperty.call(i18nShowingConfig, 'other')) {
          template = i18nShowingConfig.other;
        } else {
          template = String(i18nShowingConfig);
        }
      } else {
        template = i18nShowingConfig || '';
      }
      if (typeof template !== 'string') {
        template = String(template);
      }
      return template
        .replace('{shown}', String(shown))
        .replace('{total}', String(total));
    }
`;
