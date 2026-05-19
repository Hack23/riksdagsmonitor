/**
 * @module normalize-static-html-chrome/chrome/stylesheet
 * @description Stylesheet + API/issue link normalisation.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { API_DOCS_URL, ISSUE_URL } from '../constants.js';

/** Ensure the canonical `styles.css` `<link>` exists in `<head>`. */
export function ensureStylesheet(html: string, prefix: string): string {
  const href = `${prefix}styles.css`;
  if (new RegExp(`<link\\b[^>]*href=["']${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html)) {
    return html;
  }
  const link = `<link rel="stylesheet" href="${href}">`;
  if (/<meta name="viewport"[^>]*>/i.test(html)) {
    return html.replace(/(<meta name="viewport"[^>]*>)/i, `$1\n${link}`);
  }
  return html.replace(/<\/head>/i, `${link}\n</head>`);
}

/** Rewrite legacy API/issue link variants onto the canonical URLs. */
export function normalizeApiLinks(html: string): string {
  return html
    .replace(/href="(?:\.\.\/)?api\/index\.html"/g, `href="${API_DOCS_URL}"`)
    .replace(/href="(?:\.\.\/)?docs\/api\/?"/g, `href="${API_DOCS_URL}"`)
    .replace(/href="(?:\.\.\/)?docs\/api\/index\.html"/g, `href="${API_DOCS_URL}"`)
    .replace(/href="https:\/\/riksdagsmonitor\.com\/docs\/api\/?"/g, `href="${API_DOCS_URL}"`)
    .replace(/href="https:\/\/github\.com\/Hack23\/riksdagsmonitor\/issues"/g, `href="${ISSUE_URL}"`);
}
