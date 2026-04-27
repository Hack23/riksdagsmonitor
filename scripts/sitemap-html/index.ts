/**
 * @module Infrastructure/SitemapHtml
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Sitemap HTML Generator — Public Barrel
 *
 * @description
 * Re-exports the public surface of the sitemap-HTML generator from its
 * bounded-context leaf modules. Consumers should import from this barrel
 * — never reach into `articles/`, `render/`, `i18n.ts`, or `escape.ts`
 * directly.
 *
 * Round-6 split: replaces the 1041-LOC monolith.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export { LANGUAGE_META } from './i18n.js';
export type { LanguageMeta } from './i18n.js';
export { escapeHtml } from './escape.js';
export {
  extractArticleDate,
  extractArticleMeta,
  getArticlesByLanguage,
} from './articles/scanner.js';
export type { ArticleInfo } from './articles/scanner.js';
export { getDocsSections } from './articles/docs-sections.js';
export type { DocsSections } from './articles/docs-sections.js';
export { generateSitemapHtml } from './render/page.js';
