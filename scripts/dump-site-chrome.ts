/**
 * @module dump-site-chrome
 * @description One-shot helper used by cleanup-html-consistency.py.
 * Outputs a JSON object mapping each of the 14 language codes to its
 * canonical `<header role="banner">` and `<footer role="contentinfo">` HTML.
 *
 * Usage:
 *   npx tsx scripts/dump-site-chrome.ts  > /tmp/site-chrome.json
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { generateSiteFooter, generateSiteHeader } from './article-template.js';

const ALL_LANGS = ['en','sv','da','no','fi','de','fr','es','nl','ar','he','ja','ko','zh'] as const;

const result: Record<string, { header: string; footer: string }> = {};
for (const lang of ALL_LANGS) {
  result[lang] = {
    header: generateSiteHeader(lang),
    footer: generateSiteFooter(lang),
  };
}

process.stdout.write(JSON.stringify(result));
