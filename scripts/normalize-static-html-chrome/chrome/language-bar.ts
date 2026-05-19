/**
 * @module normalize-static-html-chrome/chrome/language-bar
 * @description Language-switcher grid + bar for legacy static landing pages.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { chromeStrings } from '../../render-lib/chrome-i18n.js';
import { LANGUAGE_META } from '../../sitemap-html/i18n.js';
import { LANGUAGES, type PageFamily } from '../constants.js';
import { fileFor } from '../paths.js';

/** Render the `<a>…</a>` grid used by both the inline switcher and the footer. */
export function languageGrid(prefix: string, family: PageFamily, current: Language): string {
  const cs = chromeStrings(current);
  return LANGUAGES.map((lang) => {
    const meta = LANGUAGE_META[lang];
    const href = `${prefix}${fileFor(family, lang)}`;
    const code = lang === 'no' ? 'NO' : meta.hreflang.toUpperCase();
    const currentAttrs = lang === current ? ' aria-current="page" class="active"' : '';
    return `        <a href="${href}" lang="${meta.hreflang}" hreflang="${meta.hreflang}" title="${meta.nativeName}" aria-label="${cs.switchLanguage}: ${meta.name}"${currentAttrs}><span aria-hidden="true">${meta.flag}</span> ${code}</a>`;
  }).join('\n');
}

/** Render the localized inline language-switcher `<nav>` block. */
export function languageBar(prefix: string, family: PageFamily, current: Language): string {
  const cs = chromeStrings(current);
  return `<nav class="language-switcher site-language-switcher" aria-label="${cs.thisPageInOtherLanguages}" data-rm-static-language-switcher="true">\n${languageGrid(prefix, family, current)}\n</nav>`;
}
