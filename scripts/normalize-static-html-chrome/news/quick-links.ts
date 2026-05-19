/**
 * @module normalize-static-html-chrome/news/quick-links
 * @description Inject Political Intelligence / Sitemap / API quick-links into
 * legacy news quick-link lists and header navs.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { API_DOCS_URL } from '../constants.js';
import { localizedSuffix } from '../paths.js';

/** Insert Political Intelligence / Sitemap / API links into a quick-link list. */
export function addNewsQuickLinks(html: string, lang: Language): string {
  if (html.includes('political-intelligence')) return html;
  const suffix = localizedSuffix(lang);
  const additions = `
        <li><a href="../political-intelligence${suffix}.html"><span aria-hidden="true">🧠</span> Political Intelligence</a></li>
        <li><a href="../sitemap${suffix}.html"><span aria-hidden="true">🗺️</span> Sitemap</a></li>
        <li><a href="${API_DOCS_URL}"><span aria-hidden="true">📚</span> API Documentation (TypeDoc)</a></li>`;
  const dashboardHref = `../dashboard/index${suffix}.html`;
  const dashboardLinkPattern = new RegExp(`(<li><a href="${dashboardHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<\\/a><\\/li>)`, 'i');
  return html.replace(dashboardLinkPattern, `$1${additions}`);
}

/** Insert Political Intelligence + Sitemap links into the legacy header. */
export function addNewsHeaderLinks(html: string, lang: Language): string {
  if (html.includes('political-intelligence')) return html;
  const suffix = localizedSuffix(lang);
  const additions = `
      <li><a href="../political-intelligence${suffix}.html">🧠 Political Intelligence</a></li>
      <li><a href="../sitemap${suffix}.html">🗺️ Sitemap</a></li>`;
  const dashboardHref = `../dashboard/index${suffix}.html`;
  const dashboardLinkPattern = new RegExp(`(<li><a href="${dashboardHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<\\/a><\\/li>)`, 'i');
  return html.replace(dashboardLinkPattern, `$1${additions}`);
}
