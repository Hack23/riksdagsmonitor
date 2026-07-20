/**
 * @module Infrastructure/SitemapXml
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Sitemap XML Generator — Public Barrel
 *
 * @description
 * Re-exports the public surface of the sitemap.xml generator from its
 * bounded-context leaf modules. Consumers should import from this
 * barrel — never reach into `scanners/`, `render/`, etc. directly.
 *
 * Round-6 split: replaces the 599-LOC monolith.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export { hreflangCode } from './hreflang.js';
export { loadGitTimestamps, getFileModTime } from './git-timestamps.js';
export { getNewsArticles } from './scanners/news.js';
export type { ArticleGroup } from './scanners/news.js';
export { getApiDocs } from './scanners/api.js';
export type { ApiDoc } from './scanners/api.js';
export { getDocFiles, getAnalysisFiles } from './scanners/docs.js';
export type { DocFile } from './scanners/docs.js';
export { generateUrlEntry } from './render/url-entry.js';
export type { HreflangAlternate } from './render/url-entry.js';
export { generateSitemap } from './render/sitemap.js';
export { validateSitemap } from './validator.js';
