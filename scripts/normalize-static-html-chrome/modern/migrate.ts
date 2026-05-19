/**
 * @module normalize-static-html-chrome/modern/migrate
 * @description Transform a legacy static landing page to modern `rm-site-header`
 * chrome while preserving the page's hero / countdown / stats content.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ModernTarget } from '../constants.js';
import { renderModernChromeBlock } from './chrome-block.js';

/**
 * Extract the "preserved" content from inside the legacy `<header>` —
 * everything that is NOT site-header-nav, NOT site-language-switcher,
 * NOT the legacy theme-toggle button, and NOT the hero-banner div. This
 * keeps page-specific hero blocks (hero-header-text, election-countdown,
 * hero-stats, politician-dashboard's logo+ul secondary nav) intact and
 * re-inserts them between the modern chrome and the page's `<main>`.
 */
export function extractPreservedHeaderContent(headerInner: string): string {
  let next = headerInner;
  // Strip the three pieces the modern chrome already provides.
  next = next.replace(/<nav\s+class="site-header-nav"[\s\S]*?<\/nav>/gi, '');
  next = next.replace(/<nav\s+class="language-switcher site-language-switcher"[\s\S]*?<\/nav>/gi, '');
  next = next.replace(/<button\s+id="theme-toggle"[\s\S]*?<\/button>/gi, '');
  // Strip the legacy hero banner div — modern chrome emits its own.
  next = next.replace(/<!--\s*Hero Banner\s*-->\s*<div\s+class="hero-banner">[\s\S]*?<\/div>/i, '');
  next = next.replace(/<div\s+class="hero-banner">[\s\S]*?<\/div>/i, '');
  // Strip politician-dashboard's bare `<nav>` containing logo + ul — this is
  // a legacy secondary nav now fully covered by the modern `rm-site-nav`.
  // Only strips bare `<nav>` tags (no class attribute) wrapping a `class="logo"` div.
  next = next.replace(/<nav>\s*<div\s+class="logo">[\s\S]*?<\/nav>/gi, '');
  // Strip vestigial section comments that would otherwise dangle.
  next = next.replace(/<!--\s*Hero Title\s*-->/gi, '');
  return next.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Transform a single legacy page into modern chrome. Idempotent — returns
 * the input unchanged if the page is already modernized.
 */
export function migrateToModernChrome(html: string, target: ModernTarget): string {
  if (/class="rm-site-header"/.test(html)) return html;
  // Must have legacy chrome markers to convert.
  if (!/data-rm-static-primary-nav="true"/.test(html)) return html;

  // Capture the legacy region: from `<body…>` open through the FIRST
  // `</header>`. Everything before the body open stays intact (head),
  // everything after the closing `</header>` (including the page's
  // `<main>`) also stays intact.
  const bodyOpenMatch = html.match(/<body\b[^>]*>/i);
  if (!bodyOpenMatch) return html;
  const bodyOpenIdx = bodyOpenMatch.index!;
  const bodyOpenEnd = bodyOpenIdx + bodyOpenMatch[0].length;
  const headerCloseIdx = html.indexOf('</header>', bodyOpenEnd);
  if (headerCloseIdx < 0) return html;
  const legacyRegion = html.slice(bodyOpenEnd, headerCloseIdx);

  // Locate the legacy `<header>` inside that region so we can keep any
  // page-specific content that lives inside it (hero text, countdown, etc.).
  const headerOpenMatch = legacyRegion.match(/<header\b[^>]*>/i);
  const headerInner = headerOpenMatch
    ? legacyRegion.slice(headerOpenMatch.index! + headerOpenMatch[0].length)
    : '';
  const preserved = extractPreservedHeaderContent(headerInner);

  const modernBlock = renderModernChromeBlock(target, html);
  const replacement = preserved
    ? `${modernBlock}\n${preserved}\n`
    : `${modernBlock}\n`;

  return (
    html.slice(0, bodyOpenIdx) +
    replacement +
    html.slice(headerCloseIdx + '</header>'.length)
  );
}
