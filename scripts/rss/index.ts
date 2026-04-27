/**
 * @module Infrastructure/Rss
 * @category Intelligence Operations / Supporting Infrastructure
 * @name RSS Generator — Public Barrel
 *
 * @description
 * Re-exports the public surface of the RSS generator from its
 * bounded-context leaf modules. Consumers should import from this
 * barrel — never reach into `render/`, `scanner.ts`, etc. directly.
 *
 * Round-6 split: replaces the 372-LOC monolith.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export { escapeXml } from './escape.js';
export { hreflangCode } from './hreflang.js';
export { stablePubDate } from './pub-date.js';
export { extractArticleMeta } from './article-meta.js';
export type { ArticleMeta } from './article-meta.js';
export { getRssArticles } from './scanner.js';
export type { RssArticle } from './scanner.js';
export { generateRss } from './render/feed.js';
export { validateRss } from './validator.js';
