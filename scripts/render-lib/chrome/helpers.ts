/**
 * @module Infrastructure/RenderLib/Chrome/Helpers
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Chrome utility functions (depth calculation, hreflang block)
 *
 * @description
 * Pure, stateless utility functions used by the chrome head and header
 * builders. Extracted from the monolithic `chrome.ts` for independent
 * testability.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { LANGUAGE_META } from '../../sitemap-html/index.js';
import { BASE_URL, LANGUAGES } from '../constants.js';

/**
 * Compute the relative path prefix to reach the site root from a
 * canonical path. For example, `news/2026-04-23/props-en.html` → `../../`.
 */
export function depth(canonicalPath: string): string {
  const clean = canonicalPath.replace(/^\/+/, '');
  const depthLevel = clean.split('/').length - 1;
  return depthLevel > 0 ? '../'.repeat(depthLevel) : '';
}

/**
 * Render the `<link rel="alternate" hreflang="…">` block for the `<head>`.
 *
 * When `alternates` is provided, emits one `<link>` per language plus
 * `x-default` (pointing at the English alternate or canonical). When
 * omitted, emits only the current language + canonical.
 */
export function renderHreflangBlock(
  current: Language,
  canonicalPath: string,
  alternates: Partial<Record<Language, string>> | undefined,
): string {
  if (!alternates) {
    return [
      `    <link rel="alternate" hreflang="${LANGUAGE_META[current].hreflang}" href="${BASE_URL}/${canonicalPath}">`,
      `    <link rel="canonical" href="${BASE_URL}/${canonicalPath}">`,
    ].join('\n');
  }
  const lines: string[] = [];
  for (const l of LANGUAGES) {
    const href = alternates[l];
    if (!href) continue;
    lines.push(
      `    <link rel="alternate" hreflang="${LANGUAGE_META[l].hreflang}" href="${BASE_URL}/${href}">`,
    );
  }
  const enHref = alternates.en ?? canonicalPath;
  lines.push(`    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/${enHref}">`);
  lines.push(`    <link rel="canonical" href="${BASE_URL}/${canonicalPath}">`);
  return lines.join('\n');
}

/**
 * Resolve the lang-switcher fallback href for a given language.
 *
 * Caller-supplied `hreflangAlternates[lang]` always wins. Otherwise
 * the `defaultAlternateBase` is used (defaulting to `'index.html'`).
 */
export function fallbackAlternateHref(
  lang: Language,
  altBase: string,
): string {
  const altBaseStem = altBase.replace(/\.html$/i, '');
  return lang === 'en' ? altBase : `${altBaseStem}_${lang}.html`;
}
