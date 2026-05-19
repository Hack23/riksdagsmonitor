/**
 * @module normalize-static-html-chrome/chrome/primary-nav
 * @description Legacy `site-header-nav` primary nav fragment.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { chromeStrings } from '../../render-lib/chrome-i18n.js';
import { LANGUAGE_META } from '../../sitemap-html/i18n.js';
import { API_DOCS_URL } from '../constants.js';
import { localizedSuffix } from '../paths.js';

/** Build the legacy `site-header-nav` for a static landing page. */
export function primaryNav(prefix: string, current: Language): string {
  const suffix = localizedSuffix(current);
  const cs = chromeStrings(current);
  const t = LANGUAGE_META[current].translations;
  const indexFile = `${prefix}index${suffix}.html`;
  const newsFile = `${prefix}news/index${suffix}.html`;
  const dashboardFile = `${prefix}dashboard/index${suffix}.html`;
  const piFile = `${prefix}political-intelligence${suffix}.html`;
  const politiciansFile = `${prefix}politician-dashboard${suffix}.html`;
  const sitemapFile = `${prefix}sitemap${suffix}.html`;
  return `<nav class="site-header-nav" aria-label="${cs.mainNav}" data-rm-static-primary-nav="true">
  <a href="${indexFile}">${t.home}</a>
  <a href="${newsFile}">${cs.news}</a>
  <a href="${dashboardFile}">${cs.dashboard}</a>
  <a href="${politiciansFile}"><span aria-hidden="true">👤</span> ${cs.politicians}</a>
  <a href="${piFile}"><span aria-hidden="true">🧠</span> ${cs.politicalIntelligence}</a>
  <a href="${sitemapFile}"><span aria-hidden="true">🗺️</span> ${t.siteMap}</a>
  <a href="${API_DOCS_URL}"><span aria-hidden="true">📚</span> ${t.apiDocs}</a>
  <a class="rm-header-cta rm-header-cta-transparency" href="https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" title="${cs.transparencyTitle}" aria-label="${cs.transparencyTitle}"><span aria-hidden="true">🔐</span> ${cs.transparencyLabel}</a>
  <a class="rm-header-cta rm-header-cta-sponsor" href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer" title="${cs.sponsorTitle}" aria-label="${cs.sponsorTitle}"><span aria-hidden="true">💖</span> ${cs.sponsorLabel}</a>
</nav>`;
}
