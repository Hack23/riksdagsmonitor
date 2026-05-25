/**
 * @module Infrastructure/RenderLib/Aggregator
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Analysis artifacts → aggregated article.md (barrel)
 *
 * @description
 * Public barrel for the Round-5 split aggregator. Re-exports the same
 * public API surface the legacy `aggregator.ts` had — every consumer
 * (`scripts/aggregate-analysis.ts`, `scripts/render-articles.ts`,
 * `scripts/render-lib/index.ts`, `tests/render-lib*.ts`) keeps working
 * with **zero source-line changes**.
 *
 * The `__test__` escape hatch is composed from each leaf module so
 * tests can exercise every branch without re-importing internals.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import {
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
  stripLeadingAdminBylines,
} from './cleaning/admin-bylines.js';
import {
  PASS_TWO_HEADING_RE,
  stripPassTwoSection,
} from './cleaning/pass-two.js';
import {
  PROCESS_META_LINE_RE,
  stripProcessMetaLines,
} from './cleaning/process-meta.js';
import {
  cleanArtifactBody,
  demoteHeadings,
  rewriteRelativeLinks,
  stripInlineReaderGuide,
  stripSourcePreamble,
} from './cleaning/structural.js';
import {
  escapeInlineMd,
  escapeYaml,
} from './frontmatter.js';
import {
  prettifyFallbackTitle,
} from './order.js';
import {
  anchorForTitle,
} from './reader-guide.js';
import {
  SENTENCE_END_RE,
  markdownInlineToText,
  readBlufParagraph,
  readFirstParagraph,
  truncateToSentenceBoundary,
} from './seo/description.js';
import {
  cleanArticleTitle,
  readFirstHeading,
  titleFromBluf,
} from './seo/title.js';

// Public API surface — what every consumer outside `render-lib/` should use.
export {
  AGGREGATION_ORDER,
  prettifyFallbackTitle,
  titleForArtifact,
} from './order.js';
export {
  aggregateAnalysis,
} from './aggregate.js';
export type {
  AggregationInput,
  AggregationResult,
} from './aggregate.js';
export {
  buildReaderGuide,
  anchorForTitle,
  READER_GUIDE_ENTRIES,
} from './reader-guide.js';
export {
  READER_GUIDE_I18N,
  readerGuideI18n,
} from './reader-guide-i18n.js';
export type {
  ReaderGuideI18nBundle,
  ReaderGuideChrome,
  ReaderGuideEntryI18n,
} from './reader-guide-i18n.js';

// --- Localized executive-brief SEO -----------------------------------------
// Cascade chain step #2 — derive localized `<title>` / `<meta description>`
// from `executive-brief_<lang>.md` so the per-language SEO surfaces match
// the localized brief tradecraft. Consumed by `article-merge.ts`.
export {
  extractLocalizedBriefSeo,
  isBannedLocalizedBriefH1,
  LOCALIZED_BRIEF_H1_BANNED_PATTERNS,
} from './seo/localized-brief.js';
export type {
  LocalizedBriefSeoInput,
  LocalizedBriefSeo,
} from './seo/localized-brief.js';

// --- Per-language SERP description windows ---------------------------------
// W2 polish — the description module owns the per-language soft-min /
// hard-max budget for `<meta description>` (Latin LTR 140–200 / RTL ar,he
// 120–170 / CJK ja,ko,zh 70–120). Re-exported here so future consumers
// outside `render-lib/` (static-pages, political-intelligence, dashboards)
// can pick the right SERP window without reaching into the leaf module.
export {
  LANG_DESCRIPTION_WINDOWS,
  descriptionWindowForLanguage,
} from './seo/description.js';
export { runArticlePipeline } from './pipeline.js';
export type {
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
} from './interfaces.js';

/**
 * Strict shape of the test-only escape hatch. Frozen so accidental
 * mutation of the regex constants (which carry `lastIndex` state) is
 * caught immediately by the test suite. Replaces the previous
 * `Record<string, unknown>` typing in the legacy aggregator.
 */
export interface AggregatorTestApi {
  readonly PASS_TWO_HEADING_RE: RegExp;
  readonly ADMIN_FIELD_RE: RegExp;
  readonly ADMIN_FRAGMENT_SPLITTER: RegExp;
  readonly PROCESS_META_LINE_RE: RegExp;
  readonly SENTENCE_END_RE: RegExp;
  readonly stripPassTwoSection: (body: string) => string;
  readonly stripLeadingAdminBylines: (body: string) => string;
  readonly stripProcessMetaLines: (body: string) => string;
  readonly stripSourcePreamble: (body: string) => string;
  readonly stripInlineReaderGuide: (body: string) => string;
  readonly demoteHeadings: (body: string) => string;
  readonly cleanArtifactBody: (raw: string) => string;
  readonly rewriteRelativeLinks: (body: string, repoRelPath: string) => string;
  readonly prettifyFallbackTitle: (file: string) => string;
  readonly readFirstHeading: (markdown: string) => string | null;
  readonly readFirstParagraph: (markdown: string) => string | null;
  readonly readBlufParagraph: (markdown: string) => string | null;
  readonly truncateToSentenceBoundary: (text: string, softMin?: number, hardMax?: number) => string;
  readonly markdownInlineToText: (markdown: string) => string;
  readonly cleanArticleTitle: (raw: string | null, subfolder?: string, lang?: import('../../types/language.js').Language) => string | null;
  readonly titleFromBluf: (bluf: string | null, maxLen?: number) => string | null;
  readonly escapeYaml: (text: string) => string;
  readonly escapeInlineMd: (text: string) => string;
  readonly anchorForTitle: (title: string) => string;
}

/**
 * Test-only escape hatch composed from every leaf module. NOT part of
 * the stable public API — let `tests/render-lib.test.ts` exercise every
 * branch without re-implementing the transforms. Downstream scripts
 * must import the public exports (`aggregateAnalysis`, …) instead.
 */
export const __test__: AggregatorTestApi = Object.freeze({
  PASS_TWO_HEADING_RE,
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
  PROCESS_META_LINE_RE,
  SENTENCE_END_RE,
  stripPassTwoSection,
  stripLeadingAdminBylines,
  stripProcessMetaLines,
  stripSourcePreamble,
  stripInlineReaderGuide,
  demoteHeadings,
  cleanArtifactBody,
  rewriteRelativeLinks,
  prettifyFallbackTitle,
  readFirstHeading,
  readFirstParagraph,
  readBlufParagraph,
  truncateToSentenceBoundary,
  markdownInlineToText,
  cleanArticleTitle,
  titleFromBluf,
  escapeYaml,
  escapeInlineMd,
  anchorForTitle,
});
