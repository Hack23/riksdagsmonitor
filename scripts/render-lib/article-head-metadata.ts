/**
 * @module Infrastructure/RenderLib/ArticleHeadMetadata
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Article `<head>` metadata composer (shared between renderer & QA tools)
 *
 * @description
 * Deterministic helper (side-effect free aside from a one-time memoised
 * registry load) that, given an aggregated `article.md` (with
 * front-matter + body) plus a target language and canonical path,
 * produces the **exact** set of `<head>` metadata values that
 * {@link ./article.ts | renderArticleHtml} embeds into a rendered news
 * page — title, branded title, description, keywords, article-type
 * label and parsed publication date.
 *
 * This module exists so the regenerate / test pipelines and the
 * Markdown→HTML article renderer share a single source of truth for
 * "what ships in `<head>` for a given `article.md`". Tests and the
 * `test-article-headers` CLI can call this function and be sure they
 * are observing exactly what the shipped corpus sees — no drift, no
 * forked SEO logic.
 *
 * Note: `loadArticleTypesRegistry()` reads `analysis/article-types.json`
 * on first call and caches the result — the module is therefore not
 * purely functional in the strict sense, but all subsequent calls are
 * fully deterministic for the same inputs.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import matter from 'gray-matter';

import type { Language } from '../types/language.js';
import { articleTypeLabel } from './article-type-i18n.js';
import { getBySubfolder, getById, loadArticleTypesRegistry } from './article-types.js';
import type { ArticleSeoMetadata } from './article-seo.js';
import { buildArticleSeoMetadata } from './article-seo.js';
import { brandTitle, DEFAULT_ARTICLE_SECTION } from './chrome/head.js';

/**
 * Hard-coded fallback labels — kept only for legacy article types not yet
 * in the registry. New types should ONLY add a registry entry.
 *
 * This is the single authoritative source for legacy article-type labels;
 * the renderer delegates all article-type label resolution to this module
 * via {@link computeArticleHeadMetadata}.
 */
const ARTICLE_TYPE_LABELS_FALLBACK: Record<string, string> = {
  'deep-inspection': 'Deep inspection',
  realtime: 'Realtime pulse',
  'realtime-pulse': 'Realtime pulse',
  breaking: 'Breaking intelligence',
  'parliament-agenda': 'Parliament agenda',
};

function getArticleTypeLabel(type: string): string {
  const entry = getById(type) ?? getBySubfolder(type);
  if (entry) return entry.label;
  return ARTICLE_TYPE_LABELS_FALLBACK[type] ?? 'Political intelligence';
}

function normalizeArticleType(value: string): string {
  return value
    .replace(/committeeReports/g, 'committee-reports')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Infer the article type (`propositions`, `motions`, `committee-reports`,
 * …) from the canonical path or article title. The registry is the
 * primary source; legacy hard-coded candidates remain for older folders
 * that pre-date the registry.
 *
 * Exported so the head-metadata helper and the regenerator can derive
 * the localized `articleTypeLabel` deterministically — and so test
 * scripts can verify type classification without rebuilding the regex
 * locally.
 */
export function inferArticleType(canonicalPath: string, title: string): { type: string; label: string } {
  const source = `${canonicalPath} ${title}`.toLowerCase();

  const registry = loadArticleTypesRegistry();
  for (const entry of registry.types) {
    if (source.includes(entry.subfolder.toLowerCase()) || source.includes(entry.id.toLowerCase())) {
      return { type: normalizeArticleType(entry.id), label: entry.label };
    }
  }

  const legacyCandidates = [
    'committeeReports',
    'deep-inspection',
    'realtime-pulse',
    'realtime',
    'breaking',
    'parliament-agenda',
  ];
  const match = legacyCandidates.find((candidate) => source.includes(candidate.toLowerCase()));
  const type = normalizeArticleType(match ?? 'political-intelligence');
  // Always look up the label with the *normalized* type slug so that
  // camelCase legacy candidate names (e.g. `committeeReports`) map to
  // the same registry/fallback entry as their hyphenated equivalents
  // (`committee-reports`).  Using the raw `match` string here would
  // miss registry entries and fall through to the generic default.
  return {
    type,
    label: getArticleTypeLabel(type),
  };
}

/**
 * Coerce `date` front-matter into a `YYYY-MM-DD` string. Accepts a
 * `Date` (gray-matter parses ISO dates eagerly), a string starting
 * with `YYYY-MM-DD`, or falls back to "today".
 *
 * @param dateRaw The `date:` field as returned by gray-matter.
 * @param now     Injection seam for "today" — defaults to `new Date()`.
 *                Tests pass a frozen clock to make assertions deterministic.
 * @returns       A `YYYY-MM-DD` string.
 */
export function parseFrontMatterDate(dateRaw: unknown, now: Date = new Date()): string {
  if (dateRaw instanceof Date && !Number.isNaN(dateRaw.getTime())) {
    return dateRaw.toISOString().slice(0, 10);
  }
  if (typeof dateRaw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateRaw)) {
    return dateRaw.slice(0, 10);
  }
  return now.toISOString().slice(0, 10);
}

/**
 * Input for {@link computeArticleHeadMetadata}.
 */
export interface ArticleHeadMetadataInput {
  /** Aggregated markdown (front-matter + body) produced by aggregateAnalysis. */
  readonly markdown: string;
  /** Target language code. */
  readonly lang: Language;
  /** Canonical path (e.g. `news/2026-04-23-propositions-en.html`). */
  readonly canonicalPath: string;
  /**
   * Optional clock seam used by {@link parseFrontMatterDate} when the
   * front-matter `date:` is missing or malformed. Defaults to `new Date()`.
   */
  readonly now?: Date;
  /**
   * Pre-parsed front-matter data (the `.data` record returned by
   * `gray-matter`). When provided, the internal `matter()` call is
   * skipped, avoiding a duplicate parse in callers (e.g.
   * `renderArticleHtml`) that have already parsed the markdown.
   */
  readonly parsedData?: Record<string, unknown>;
}

/**
 * Result of {@link computeArticleHeadMetadata}.
 *
 * Carries both the raw front-matter inputs that fed the SEO composer
 * **and** the computed `<head>` strings that ship in the rendered HTML,
 * so consumers (renderer, QA reports) get a complete picture in one
 * call.
 */
export interface ArticleHeadMetadata {
  /** Raw `title:` from the article.md front-matter (post-cascade). */
  readonly rawTitle: string;
  /** Raw `description:` from the article.md front-matter (post-cascade). */
  readonly rawDescription: string;
  /** Raw `keywords:` from the article.md front-matter (post-cascade), or `undefined`. */
  readonly rawKeywords: string | undefined;
  /** Normalised publication date (YYYY-MM-DD). */
  readonly date: string;
  /** Article-type ID slug (`propositions`, `committee-reports`, …). */
  readonly articleTypeId: string;
  /** Localized article-type label (`Propositions`, `Komitéindstillinger`, …). */
  readonly articleTypeLabel: string;
  /**
   * The `article:section` / `articleSection` value passed to chrome
   * and JSON-LD by the renderer. Exposed here so the audit CLI reports
   * exactly what ships in the rendered HTML without re-implementing
   * the same derivation.
   */
  readonly articleSection: string;
  /**
   * Computed SEO `<title>` / `<meta description>` / `<meta keywords>`
   * triple from {@link buildArticleSeoMetadata} — i.e. exactly what the
   * renderer hands to chrome.
   */
  readonly seo: ArticleSeoMetadata;
  /**
   * Branded `<title>` as emitted by `chrome/head.ts`:
   * `seo.title` unchanged when it already mentions "Riksdagsmonitor",
   * otherwise `${seo.title} — Riksdagsmonitor`.
   */
  readonly brandedTitle: string;
}

/**
 * Compute the canonical `<head>` metadata for an `article.md` exactly
 * the way the article renderer does. Used by:
 *
 *  - {@link ./article.ts | renderArticleHtml} during real article
 *    generation
 *  - {@link ../test-article-headers.ts | test-article-headers} CLI for
 *    auditing the shipped corpus
 *
 * The two callers MUST share this function so the audit report can
 * never drift from what is actually rendered into HTML.
 */
export function computeArticleHeadMetadata(input: ArticleHeadMetadataInput): ArticleHeadMetadata {
  const fm = (input.parsedData ?? matter(input.markdown).data) as Record<string, unknown>;
  const rawTitle = String(fm.title ?? 'Political Intelligence');
  const rawDescription = String(fm.description ?? 'Riksdagsmonitor political intelligence report.');
  const rawKeywords = typeof fm.keywords === 'string' ? fm.keywords : undefined;
  const date = parseFrontMatterDate(fm.date, input.now);
  const articleType = inferArticleType(input.canonicalPath, rawTitle);
  const localizedArticleTypeLabel = articleTypeLabel(articleType.type, input.lang, articleType.label);
  const seo = buildArticleSeoMetadata({
    title: rawTitle,
    description: rawDescription,
    keywords: rawKeywords,
    lang: input.lang,
    date,
    articleTypeLabel: localizedArticleTypeLabel,
    articleTypeId: articleType.type,
    canonicalPath: input.canonicalPath,
  });
  const computedBrandedTitle = brandTitle(seo.title);
  // Mirror the section value passed to buildChrome so the audit CLI
  // reports exactly what ships in the rendered HTML. Sourced from the
  // shared `DEFAULT_ARTICLE_SECTION` constant in chrome/head.ts so the
  // two derivations cannot drift.
  const articleSection = DEFAULT_ARTICLE_SECTION;
  return {
    rawTitle,
    rawDescription,
    rawKeywords,
    date,
    articleTypeId: articleType.type,
    articleTypeLabel: localizedArticleTypeLabel,
    seo,
    brandedTitle: computedBrandedTitle,
    articleSection,
  };
}
