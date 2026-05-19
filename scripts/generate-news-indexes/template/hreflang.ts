/**
 * @module generate-news-indexes/template/hreflang
 * @description Standalone hreflang block generator. Kept as a public export
 * for backward compatibility with existing tests; the canonical hreflang
 * block is now emitted by `buildChrome`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { LANGUAGES } from '../constants.js';
import type { LanguageConfig } from '../types.js';

/** Generate hreflang tags for every supported language plus x-default. */
export function generateHreflangTags(): string {
  const tags: string[] = [];

  for (const langKey of Object.keys(LANGUAGES)) {
    const filename = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
    const hrefLang = (LANGUAGES as Record<string, LanguageConfig>)[langKey]!.code;
    tags.push(`  <link rel="alternate" hreflang="${hrefLang}" href="https://riksdagsmonitor.com/news/${filename}">`);
  }

  tags.push(`  <link rel="alternate" hreflang="x-default" href="https://riksdagsmonitor.com/news/index.html">`);

  return tags.join('\n');
}
