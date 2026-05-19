/**
 * @module normalize-static-html-chrome/chrome/theme-toggle
 * @description Localized theme-toggle button used by all static landings.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { chromeStrings as chromeStringsFn } from '../../render-lib/chrome-i18n.js';

/**
 * Render the localized theme-toggle button used by all static landing
 * pages. Houses both ☀️ and 🌙 glyphs so CSS can swap visibility based on
 * `html[data-theme]`, giving the button a morphing icon without inline
 * scripts. Aria-pressed is set by `js/theme-toggle.js` at runtime.
 */
export function themeToggleButton(cs: ReturnType<typeof chromeStringsFn>): string {
  return `<button id="theme-toggle" class="theme-toggle-btn" type="button"
        aria-pressed="false"
        aria-label="${cs.themeAria}"
        title="${cs.themeAria}"
        data-label-dark="${cs.themeToLight}"
        data-label-light="${cs.themeToDark}"
        data-rm-static-theme-toggle="true">
  <span class="theme-icon theme-icon-moon" aria-hidden="true">🌙</span>
  <span class="theme-icon theme-icon-sun" aria-hidden="true">☀️</span>
  <span class="theme-toggle-label">${cs.themeLabel}</span>
</button>`;
}
