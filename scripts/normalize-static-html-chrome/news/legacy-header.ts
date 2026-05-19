/**
 * @module normalize-static-html-chrome/news/legacy-header
 * @description Legacy news article header + chrome normalization helpers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { chromeStrings } from '../../render-lib/chrome-i18n.js';
import { LANGUAGE_META } from '../../sitemap-html/i18n.js';
import { API_DOCS_URL } from '../constants.js';
import { footer } from '../chrome/footer.js';
import { localizedSuffix } from '../paths.js';

/** Build the legacy news article header for a given language. */
export function legacyNewsHeader(lang: Language): string {
  const suffix = localizedSuffix(lang);
  const cs = chromeStrings(lang);
  const t = LANGUAGE_META[lang].translations;
  return `<header class="site-header" role="banner">
<nav class="article-top-nav" aria-label="${cs.mainNav}">
<a href="../index${suffix}.html" class="nav-home" aria-label="Riksdagsmonitor ${t.home}">
  <img src="../images/riksdagsmonitor-logo.webp" srcset="../images/riksdagsmonitor-logo-48w.webp 48w, ../images/riksdagsmonitor-logo-96w.webp 96w" sizes="48px" alt="Riksdagsmonitor" class="site-logo" width="48" height="48" loading="eager">
  <span>Riksdagsmonitor</span>
</a>
<span class="nav-separator">|</span>
<a href="index${suffix}.html" class="nav-news">${cs.news}</a>
<a href="../dashboard/index${suffix}.html">${cs.dashboard}</a>
<a href="../political-intelligence${suffix}.html">🧠 ${cs.politicalIntelligence}</a>
<a href="../sitemap${suffix}.html">🗺️ ${t.siteMap}</a>
<a href="${API_DOCS_URL}">📚 ${t.apiDocs}</a>
<a class="rm-header-cta rm-header-cta-transparency" href="https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" title="${cs.transparencyTitle}" aria-label="${cs.transparencyTitle}">
  <span class="rm-header-cta-icon" aria-hidden="true">🔐</span>
  <span class="rm-header-cta-label">${cs.transparencyLabel}</span>
</a>
<a class="rm-header-cta rm-header-cta-sponsor" href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer" title="${cs.sponsorTitle}" aria-label="${cs.sponsorTitle}">
  <span class="rm-header-cta-icon" aria-hidden="true">💖</span>
  <span class="rm-header-cta-label">${cs.sponsorLabel}</span>
</a>
<button id="theme-toggle" class="theme-toggle-btn" type="button"
        aria-pressed="false"
        aria-label="${cs.themeAria}"
        title="${cs.themeAria}"
        data-label-dark="${cs.themeToLight}"
        data-label-light="${cs.themeToDark}">
  <span class="theme-icon" aria-hidden="true">🌙</span>
</button>
</nav>
</header>`;
}

/**
 * Normalize the legacy news chrome: replace any old `<header class="site-header">`
 * with `legacyNewsHeader`, fall back to inserting one at `<body>` open if missing,
 * then swap the footer for the canonical legacy footer.
 *
 * Idempotent for already-modernized pages — short-circuits when the modern
 * `rm-site-header` chrome is detected.
 */
export function normalizeLegacyNewsChrome(html: string, lang: Language): string {
  if (html.includes('class="rm-site-header"')) return html;
  let next = html;
  if (/<header\b[^>]*class="[^"]*\bsite-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i.test(next)) {
    next = next.replace(/<header\b[^>]*class="[^"]*\bsite-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i, legacyNewsHeader(lang));
  }
  if (!next.includes('id="theme-toggle"') && /<body[^>]*>/i.test(next)) {
    next = next.replace(/(<body[^>]*>)/i, `$1\n${legacyNewsHeader(lang)}`);
  }
  const normalizedFooter = footer('../', 'home', lang);
  if (/<footer\b[^>]*(?:role="contentinfo"|class="[^"]*\bsite-footer\b)[^>]*>[\s\S]*?<\/footer>/i.test(next)) {
    next = next.replace(/<footer\b[^>]*(?:role="contentinfo"|class="[^"]*\bsite-footer\b)[^>]*>[\s\S]*?<\/footer>/i, normalizedFooter);
  }
  return next;
}
