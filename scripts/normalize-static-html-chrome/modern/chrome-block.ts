/**
 * @module normalize-static-html-chrome/modern/chrome-block
 * @description Build the modern `rm-site-header` chrome block for a page,
 * including breadcrumb and hreflang alternates.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { chromeStrings } from '../../render-lib/chrome-i18n.js';
import { buildHeaderHtml } from '../../render-lib/chrome/header.js';
import type { BreadcrumbItem } from '../../render-lib/chrome/types.js';
import { LANGUAGE_META } from '../../sitemap-html/i18n.js';
import type { ModernTarget } from '../constants.js';
import {
  modernAlternatesFor,
  modernCanonicalFor,
} from '../targets.js';
import { languageSuffix } from '../paths.js';

/**
 * Extract the existing `<title>…</title>` text. Trimmed and used to populate
 * the modern chrome breadcrumb and og:title.
 */
export function extractTitle(html: string): string {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return 'Riksdagsmonitor';
  return m[1]!.replace(/\s+/g, ' ').trim();
}

/**
 * Read the existing body class list (excluding `rm-article-body`, which the
 * modern chrome adds itself).
 */
export function extractBodyClass(html: string): string {
  const m = html.match(/<body\b([^>]*)>/i);
  if (!m) return '';
  const attrs = m[1]!;
  const cm = attrs.match(/\bclass\s*=\s*"([^"]*)"/i);
  if (!cm) return '';
  return cm[1]!
    .split(/\s+/)
    .filter((c) => c && c !== 'rm-article-body')
    .join(' ')
    .trim();
}

/**
 * Read the id of the page's `<main>` element so we can adjust the modern
 * chrome skip-link to point at the actual landing target. Defaults to
 * `main` (matches `buildHeaderHtml`) if no `<main id="…">` is present.
 */
export function extractMainId(html: string): string {
  const m = html.match(/<main\b[^>]*\bid\s*=\s*"([^"]+)"/i);
  return m ? m[1]! : 'main';
}

/**
 * Build the breadcrumb chain shown in `rm-site-subnav`. Mirrors what the
 * legacy pages already carry in their pre-header breadcrumb nav.
 */
export function modernBreadcrumb(family: ModernTarget['family'], lang: Language, pageTitle: string): readonly BreadcrumbItem[] {
  const cs = chromeStrings(lang);
  const t = LANGUAGE_META[lang].translations;
  const sfx = languageSuffix(lang);
  const homeHref = `${(family === 'dashboard-hub' || family === 'dashboard-slug') ? '../' : ''}index${sfx}.html`;
  if (family === 'home') {
    return [
      { label: t.home, href: homeHref },
      { label: pageTitle },
    ];
  }
  if (family === 'politician') {
    return [
      { label: t.home, href: homeHref },
      { label: cs.politicians ?? pageTitle },
    ];
  }
  if (family === 'dashboard-hub') {
    return [
      { label: t.home, href: homeHref },
      { label: cs.dashboard ?? pageTitle },
    ];
  }
  // dashboard-slug
  return [
    { label: t.home, href: homeHref },
    { label: cs.dashboard ?? 'Dashboards', href: `../dashboard/index${sfx}.html` },
    { label: pageTitle },
  ];
}

/**
 * Render the modern chrome head fragment (everything from `<body…>` up
 * through `</header>` + optional hero-banner + lang-bar) for a single
 * page. The trailing `<main id="main" …>` produced by `buildHeaderHtml`
 * is stripped — pages keep their existing `<main id="main-content">`
 * (or similar) intact and we rewrite the skip-link to match.
 */
export function renderModernChromeBlock(target: ModernTarget, html: string): string {
  const pageTitle = extractTitle(html);
  const bodyClass = extractBodyClass(html);
  const mainId = extractMainId(html);
  const family = target.family;
  const canonicalPath = modernCanonicalFor(family, target.slug, target.lang);
  const alternates = modernAlternatesFor(family, target.slug);
  const breadcrumb = modernBreadcrumb(family, target.lang, pageTitle);
  const built = buildHeaderHtml({
    lang: target.lang,
    title: pageTitle,
    description: '',
    canonicalPath,
    hreflangAlternates: alternates,
    breadcrumb,
    bodyClass: bodyClass || undefined,
    defaultAlternateBase: canonicalPath.replace(/_[a-z]{2}\.html$/, '.html').split('/').pop()!,
    heroBanner: true,
    languageBar: true,
  });
  // Strip the trailing `<main …>` line — the page keeps its existing main.
  const stripped = built.replace(/\n?\s*<main\b[^>]*>\s*$/i, '\n');
  // Rewrite the skip-link to target the page's actual main id.
  if (mainId !== 'main') {
    return stripped.replace(/(<a class="skip-link" href=")#main(")/, `$1#${mainId}$2`);
  }
  return stripped;
}
