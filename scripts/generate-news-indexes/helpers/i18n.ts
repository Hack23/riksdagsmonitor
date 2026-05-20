/**
 * @module generate-news-indexes/helpers/i18n
 * @description Language-row helpers and BCP-47 normalisation for the news
 * index renderer. Norwegian uses `nb` (BCP-47) — legacy callers may still
 * pass `no`, which is mapped explicitly here.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { LanguageConfig } from '../types.js';
import { LANGUAGES, LANGUAGE_FLAGS, AVAILABLE_IN_TRANSLATIONS } from '../constants.js';

/**
 * Generate language badge HTML for an article.
 */
export function generateLanguageBadge(lang: string, isRTL: boolean = false): string {
  const flag: string = LANGUAGE_FLAGS[lang] || '🌐';
  const langUpper: string = lang.toUpperCase();
  const dirAttr: string = isRTL ? ' dir="ltr"' : '';
  return `<span class="language-badge"${dirAttr} aria-label="${(LANGUAGES as Record<string, LanguageConfig>)[lang]?.name || lang} language"><span aria-hidden="true">${flag}</span> ${langUpper}</span>`;
}

/**
 * Generate language switcher navigation for news index pages.
 *
 * Norwegian uses BCP-47 `nb` for the `hreflang` and `lang` attributes even
 * when callers pass the legacy `no` code — `nb` is the canonical Bokmål tag
 * required by the multi-language-localisation skill.
 */
export function generateLanguageSwitcherNav(currentLang: string): string {
  const langEntries: [string, LanguageConfig][] = Object.entries(LANGUAGES);
  const links: string = langEntries.map(([code, data]) => {
    const flag: string = LANGUAGE_FLAGS[code] || '🌐';
    const filename: string = code === 'en' ? 'index.html' : `index_${code}.html`;
    const activeClass: string = code === currentLang ? ' active' : '';
    const bcp47: string = code === 'no' ? 'nb' : code;
    return `  <a href="${filename}" class="lang-link${activeClass}" hreflang="${bcp47}" lang="${bcp47}">${flag} ${data.name}</a>`;
  }).join('\n');
  return `<nav class="language-switcher" role="navigation" aria-label="Language selection">\n${links}\n</nav>`;
}

/**
 * Generate "Available in" text with language badges.
 */
export function generateAvailableLanguages(languages: string[], currentLang: string): string {
  if (!languages || languages.length <= 1) return '';

  const isRTL: boolean = ['ar', 'he'].includes(currentLang);
  const availableText: string = AVAILABLE_IN_TRANSLATIONS[currentLang] || 'Available in';
  const badges: string = languages.map((lang) => generateLanguageBadge(lang, isRTL)).join(' ');

  return `<p class="available-languages"><strong>${availableText}:</strong> ${badges}</p>`;
}
