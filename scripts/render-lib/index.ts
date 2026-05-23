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

export { LANGUAGE_META, escapeHtml } from '../sitemap-html/index.js';
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
  runArticlePipeline,
} from './aggregator/index.js';
export type {
  AggregationInput,
  AggregationResult,
  PipelineResult,
  PipelineStage,
  ReadStageInput,
  ReadStageOutput,
  ArtifactFile,
  ValidateStageOutput,
  ValidationDiagnostic,
  AggregateStageOutput,
  ArticleSection,
  EnrichStageOutput,
  EnrichmentMetadata,
  WriteStageOutput,
  ArticlePipelineConfig,
} from './aggregator/index.js';

// --- Markdown ---------------------------------------------------------------
export { sanitizeSchema, renderMarkdownToHtml } from './markdown/index.js';

// --- Chrome -----------------------------------------------------------------
export { renderChromeHead, buildChrome } from './chrome.js';
export type { ChromeOptions, SiteChrome, BreadcrumbItem } from './chrome.js';

// --- Article SEO -------------------------------------------------------------
export {
  buildArticleSeoMetadata,
  buildSeoTitle,
  buildSeoDescription,
  buildArticleKeywords,
} from './article-seo.js';
export type { ArticleSeoMetadataInput, ArticleSeoMetadata } from './article-seo.js';

// --- JSON-LD builders -------------------------------------------------------
export { buildBreadcrumbListLd, buildNewsArticleLd, buildSpeakableWebPageLd, BREADCRUMB_TITLE_MAX_LENGTH, BREADCRUMB_ELLIPSIS_OVERHEAD } from './jsonld.js';
export type { BreadcrumbEntry, BreadcrumbEntryWithItem, BreadcrumbEntryCurrentPage, NewsArticleLdInput, BreadcrumbListLd, NewsArticleLd, SpeakableWebPageLd, JsonLdListItem } from './jsonld.js';

// --- Article (orchestrator) -------------------------------------------------
export { renderArticleHtml, stripBodyDuplicateSections, splitBodyAtSecondH2 } from './article.js';
export type { RenderArticleInput } from './article.js';

// --- Shared `<head>` metadata composer -------------------------------------
// Single source of truth used by both `renderArticleHtml` (real article
// generation) and the `test-article-headers` QA CLI so the audit report
// can never drift from what actually ships in production HTML.
export {
  computeArticleHeadMetadata,
  inferArticleType,
  parseFrontMatterDate,
} from './article-head-metadata.js';
export type {
  ArticleHeadMetadataInput,
  ArticleHeadMetadata,
} from './article-head-metadata.js';

// --- Localized + English article merge -------------------------------------
// Used by `scripts/render-articles.ts` so that non-English news HTML pages
// always include the full English analytical depth when the agent-translated
// `article.<lang>.md` only carries a short executive summary.
export { mergeLocalizedWithEnglish, buildEnglishCoverageBoundary } from './article-merge.js';
export type { MergeLocalizedInput } from './article-merge.js';

// --- Localized executive-brief SEO -----------------------------------------
// Cascade chain step #2 — derive localized `<title>` / `<meta description>`
// from `executive-brief_<lang>.md` so the per-language SEO surfaces match
// the localized brief tradecraft. Consumed by `article-merge.ts`.
export {
  extractLocalizedBriefSeo,
  isBannedLocalizedBriefH1,
  LOCALIZED_BRIEF_H1_BANNED_PATTERNS,
} from './aggregator/seo/localized-brief.js';
export type {
  LocalizedBriefSeoInput,
  LocalizedBriefSeo,
} from './aggregator/seo/localized-brief.js';

// Reusable per-article side-block renderers (reader navigation,
// analysis-artifacts reference, methods reference). Extracted so that
// every article-type renderer (current and future) can share the same
// i18n / icon / accessibility wiring without duplication.
export {
  renderReaderNavigation,
  renderAnalysisArtifactsReference,
  renderMethodsReference,
} from './article-aside.js';
export type {
  ReaderNavigationInput,
  AnalysisArtifactsReferenceInput,
  MethodsReferenceInput,
} from './article-aside.js';
