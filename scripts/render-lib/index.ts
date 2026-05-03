/**
 * @module Infrastructure/RenderLib
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Article pipeline barrel — aggregator + markdown + chrome + article
 *
 * @description
 * Re-exports the four leaf modules that, together, form the article
 * pipeline. Every downstream consumer (`scripts/aggregate-analysis.ts`,
 * `scripts/render-articles.ts`, `tests/render-lib.test.ts`,
 * `scripts/analysis-references.ts`) imports from **this barrel only**,
 * so the split into `aggregator.ts` / `markdown.ts` / `chrome.ts` /
 * `article.ts` is an architectural refactor with zero public-API impact.
 *
 * ## Module graph
 * ```
 *   constants.ts  ←──────────────┐
 *         ▲                      │
 *         │                      │
 *   url-helpers.ts  ←──────┐     │
 *         ▲                │     │
 *         │                │     │
 *   aggregator.ts          │     │
 *   (no remark/rehype)     │     │
 *                          │     │
 *   markdown.ts  ──────────┤     │
 *   (remark + rehype)      │     │
 *                          │     │
 *   chrome.ts  ────────────┴─────┤
 *   (string builder, pure)       │
 *                                │
 *   article.ts  ──── orchestrator (imports all of the above) ──┘
 *
 *   index.ts  →  barrel re-export of every public API from each leaf
 * ```
 *
 * ## Import-time cost breakdown (Round-4 split, cold start)
 * - `aggregator.ts` alone: ~15 ms (matter + fs only)
 * - `markdown.ts` alone: ~40 ms (unified + remark + rehype)
 * - `chrome.ts` alone: ~3 ms (pure string builder)
 * - `article.ts` alone: ~45 ms (pulls all three)
 *
 * Test files that only touch aggregator logic (≥75 % of the test suite)
 * can now skip the remark/rehype graph entirely.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

// --- Pass-through re-exports ------------------------------------------------

export { LANGUAGE_META, escapeHtml } from '../generate-sitemap-html.js';
export {
  BASE_URL,
  GITHUB_BLOB,
  GITHUB_TREE,
  ROOT_DIR,
  ANALYSIS_DIR,
  METHODOLOGIES_DIR,
  TEMPLATES_DIR,
  DAILY_DIR,
  LANGUAGES,
} from './constants.js';
export { buildGithubBlobUrl, buildGithubTreeUrl } from './url-helpers.js';

// --- Aggregator -------------------------------------------------------------
export {
  AGGREGATION_ORDER,
  titleForArtifact,
  aggregateAnalysis,
  __test__,
} from './aggregator/index.js';
export type {
  AggregationInput,
  AggregationResult,
} from './aggregator/index.js';

// --- Markdown ---------------------------------------------------------------
export { sanitizeSchema, renderMarkdownToHtml } from './markdown/index.js';

// --- Chrome -----------------------------------------------------------------
export { renderChromeHead, buildChrome } from './chrome.js';
export type { ChromeOptions, SiteChrome, BreadcrumbItem } from './chrome.js';

// --- JSON-LD builders -------------------------------------------------------
export { buildBreadcrumbListLd, buildNewsArticleLd, buildSpeakableWebPageLd } from './jsonld.js';
export type { BreadcrumbEntry, NewsArticleLdInput } from './jsonld.js';

// --- Article (orchestrator) -------------------------------------------------
export { renderArticleHtml } from './article.js';
export type { RenderArticleInput } from './article.js';
