/**
 * @module Infrastructure/RenderLib/Article
 * @category Intelligence Operations / Supporting Infrastructure
 * @name End-to-end article composer: markdown + chrome + JSON-LD
 *
 * @description
 * Orchestrates the article pipeline's final stage. Given an aggregated
 * `article.md` (produced by the {@link ../aggregator.js | aggregator}
 * module) plus the target language + canonical path, produces a
 * complete `<!DOCTYPE html>` page ready to be written to
 * `news/$DATE-$SUBFOLDER-$LANG.html`.
 *
 * The composer does three things:
 * 1. Parse front-matter with `gray-matter` to pull `title` + `description`
 *    + `date` out of the aggregated markdown
 * 2. Call {@link renderMarkdownToHtml} on the body
 * 3. Build Schema.org `NewsArticle` JSON-LD, hand it to
 *    {@link buildChrome}, and concatenate the resulting head/header/footer
 *    around the rendered body + a footer "Analysis sources" block
 *    listing every artifact consumed by the aggregator
 *
 * Round-4 architecture split: extracted from the former monolithic
 * `render-lib/index.ts`. This module is the **single consumer** of the
 * markdown + chrome + aggregator modules taken together — keeping it in
 * its own file makes the orchestration logic obvious without
 * interleaving it with any of the building blocks.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import matter from 'gray-matter';
import path from 'path';

import type { Language } from '../types/language.js';
import { LANGUAGE_META, escapeHtml } from '../sitemap-html/index.js';
import { BASE_URL } from './constants.js';
import { buildGithubBlobUrl } from './url-helpers.js';
import { renderMarkdownToHtml } from './markdown/index.js';
import { buildChrome } from './chrome.js';
import { buildBreadcrumbListLd, buildNewsArticleLd, buildSpeakableWebPageLd, BREADCRUMB_TITLE_MAX_LENGTH, BREADCRUMB_ELLIPSIS_OVERHEAD } from './jsonld.js';

import { getBySubfolder, getById, loadArticleTypesRegistry } from './article-types.js';
import { articleTypeLabel } from './article-type-i18n.js';
import { buildArticleSeoMetadata } from './article-seo.js';
import {
  renderReaderNavigation,
  renderAnalysisArtifactsReference,
  renderMethodsReference,
} from './article-aside.js';

/**
 * CSS selectors identifying the voice-assistant TTS-readable regions of
 * an article. Must match the class names in the article HTML template
 * rendered at the bottom of `renderArticleHtml`.
 */
const ARTICLE_SPEAKABLE_SELECTORS: readonly string[] = [
  '.rm-article-header h1',
  '.rm-article-dek',
  '.rm-article-body',
];

export interface RenderArticleInput {
  /** Aggregated markdown (front-matter + body) produced by aggregateAnalysis. */
  readonly markdown: string;
  /** Language code. */
  readonly lang: Language;
  /** Canonical path (e.g. `news/2026-04-23/propositions-en.html`). */
  readonly canonicalPath: string;
  /** Hreflang alternates map (optional). */
  readonly hreflangAlternates?: Partial<Record<Language, string>>;
  /** Subfolder github tree link used in the analysis references block. */
  readonly subfolderRepoRelPath?: string;
  /** Ordered list of artifacts used (shown in the footer). */
  readonly artifactsUsed?: readonly string[];
}

function canonicalizeMarkdownHrefTarget(
  href: string,
  subfolderRepoRelPath: string | undefined,
): string {
  const [pathPart, anchor] = href.split('#', 2) as [string, string | undefined];
  if (!pathPart) return href;

  const withAnchor = (base: string): string => (anchor ? `${base}#${anchor}` : base);
  const toBlobHref = (repoRelativePath: string): string =>
    withAnchor(buildGithubBlobUrl(repoRelativePath.replace(/^\/+/, '')));

  if (/^(#|mailto:)/i.test(href)) return href;

  const rawGithubMatch = pathPart.match(
    /^https:\/\/raw\.githubusercontent\.com\/Hack23\/riksdagsmonitor\/(?:main|master)\/(.+\.md)$/i,
  );
  if (rawGithubMatch?.[1]) return toBlobHref(rawGithubMatch[1]);

  const githubFileMatch = pathPart.match(
    /^https:\/\/github\.com\/Hack23\/riksdagsmonitor\/(?:blob|tree)\/(?:main|master)\/(.+\.md)$/i,
  );
  if (githubFileMatch?.[1]) return toBlobHref(githubFileMatch[1]);

  if (/^https?:\/\//i.test(pathPart)) return href;

  const analysisPathMatch = pathPart.match(/^(?:\.\/|\.\.\/)*\/?(analysis\/.+\.md)$/i);
  if (analysisPathMatch?.[1]) return toBlobHref(analysisPathMatch[1]);

  if (!subfolderRepoRelPath) return href;

  const resolved = path.posix.normalize(path.posix.join(subfolderRepoRelPath, pathPart));
  if (resolved.startsWith('..')) return href;
  return toBlobHref(resolved);
}

export function rewriteMarkdownHrefsInHtml(
  bodyHtml: string,
  subfolderRepoRelPath: string | undefined,
): string {
  return bodyHtml.replace(
    /(<a\b[^>]*\bhref=)(['"])([^"']+\.md(?:#[^"']*)?)(\2)/gi,
    (_match, before: string, quote: string, href: string) =>
      `${before}${quote}${canonicalizeMarkdownHrefTarget(href, subfolderRepoRelPath)}${quote}`,
  );
}

/**
 * Hard-coded fallback labels — kept only for legacy article types not yet
 * in the registry. New types should ONLY add a registry entry.
 */
const ARTICLE_TYPE_LABELS_FALLBACK: Record<string, string> = {
  'deep-inspection': 'Deep inspection',
  realtime: 'Realtime pulse',
  'realtime-pulse': 'Realtime pulse',
  breaking: 'Breaking intelligence',
  'parliament-agenda': 'Parliament agenda',
};

/**
 * Build a label lookup from the registry + legacy fallbacks.
 */
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

function inferArticleType(canonicalPath: string, title: string): { type: string; label: string } {
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
  return {
    type,
    label: getArticleTypeLabel(match ?? type),
  };
}

/**
 * Strip the markdown-based "Reader Intelligence Guide" table and the
 * "Article Sources" appendix from the article body. These sections are
 * injected by the aggregator in English-only; the renderer emits
 * properly localized, styled HTML versions via chrome, so the markdown
 * duplicates must be removed to avoid showing the same content twice
 * (once untranslated, once translated).
 *
 * Matches:
 * - `## Reader Intelligence Guide` (any case) + all content until the
 *   next H2 or end-of-string.
 * - `## Article Sources` + all content until the next H2 or end-of-string.
 *
 * Exported for testability.
 */
export function stripBodyDuplicateSections(body: string): string {
  let cleaned = body.replace(
    /^##\s+Reader Intelligence Guide[^\n]*\n(?:(?!^## )[^\n]*\n?)*/gim,
    '',
  );
  cleaned = cleaned.replace(
    /^##\s+Article Sources[^\n]*\n(?:(?!^## )[^\n]*\n?)*/gim,
    '',
  );
  return cleaned;
}

/**
 * Split rendered article body HTML into two chunks at the boundary of
 * the second `<h2` element:
 *
 *   - `lead`  — everything from the start through (but not including)
 *               the second `<h2`. By aggregator contract the first H2 is
 *               always **Executive Brief**, so this chunk contains the
 *               opening BLUF / executive summary and nothing else.
 *   - `rest`  — the remainder of the body (Synthesis Summary onwards).
 *
 * The renderer composes the page as
 * `header → lead → reader-guide → rest → sources` so that readers see
 * the Executive Brief immediately, then the Reader Intelligence Guide
 * (which explains *how* to read the rest), then the full analysis, then
 * the source-card appendix. This is the journalist-optimal "fast answer
 * → operating manual → deep analysis → provenance" arc.
 *
 * If the body contains fewer than two `<h2` elements (very short
 * articles), the entire body is returned as `lead` and `rest` is empty —
 * the reader guide will then render after the whole body which still
 * matches the "executive brief first, then reader guide" intent because
 * a single-section body is, by definition, the executive brief.
 *
 * Exported for testability.
 */
export function splitBodyAtSecondH2(bodyHtml: string): { lead: string; rest: string } {
  const h2OpenRe = /<h2[\s>]/gi;
  const positions: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = h2OpenRe.exec(bodyHtml)) !== null) {
    positions.push(match.index);
    if (positions.length >= 2) break;
  }
  if (positions.length < 2) {
    return { lead: bodyHtml, rest: '' };
  }
  const splitAt = positions[1];
  return {
    lead: bodyHtml.slice(0, splitAt),
    rest: bodyHtml.slice(splitAt),
  };
}

/**
 * Parse a `date` value from front-matter into a stable `YYYY-MM-DD`
 * string. Front-matter dates can arrive as either a parsed `Date` (when
 * `gray-matter` recognises an ISO-8601 scalar) or as a raw string. When
 * the value is missing or unrecognised, today's UTC date is used so the
 * article still renders with a valid `<time datetime>`.
 *
 * Exported for testability — pure function, no I/O.
 *
 * @param dateRaw The raw `data.date` field returned by `gray-matter`.
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

export async function renderArticleHtml(input: RenderArticleInput): Promise<string> {
  const parsed = matter(input.markdown);
  const fm = parsed.data as Record<string, unknown>;
  const title = String(fm.title ?? 'Political Intelligence');
  const description = String(fm.description ?? 'Riksdagsmonitor political intelligence report.');
  const rawKeywords = typeof fm.keywords === 'string' ? fm.keywords : undefined;
  const date = parseFrontMatterDate(fm.date);
  const publishedIso = `${date}T00:00:00Z`;
  const modifiedIso = new Date().toISOString();
  const articleType = inferArticleType(input.canonicalPath, title);
  const localizedArticleTypeLabel = articleTypeLabel(articleType.type, input.lang, articleType.label);
  const seo = buildArticleSeoMetadata({
    title,
    description,
    keywords: rawKeywords,
    lang: input.lang,
    date,
    articleTypeLabel: localizedArticleTypeLabel,
    articleTypeId: articleType.type,
    canonicalPath: input.canonicalPath,
  });

  const cleanedContent = stripBodyDuplicateSections(parsed.content);

  const bodyHtml = rewriteMarkdownHrefsInHtml(
    await renderMarkdownToHtml(cleanedContent),
    input.subfolderRepoRelPath,
  );

  const { lead: leadHtml, rest: restHtml } = splitBodyAtSecondH2(bodyHtml);

  const articleUrl = `${BASE_URL}/${input.canonicalPath}`;
  const langMeta = LANGUAGE_META[input.lang];

  const newsArticleLd = buildNewsArticleLd({
    headline: title,
    description: seo.description,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    inLanguage: langMeta.hreflang,
    url: articleUrl,
    isBasedOn: (input.artifactsUsed ?? []).map((a) => ({
      url: input.subfolderRepoRelPath
        ? buildGithubBlobUrl(`${input.subfolderRepoRelPath}/${a}`)
        : a,
      name: a,
    })),
    // Mirror the page's `<meta keywords>` into NewsArticle.keywords (an
    // array per Schema.org), and surface the localized article-type label
    // as `articleSection` (Propositions / Motions / Interpellations / …).
    // Both fields are skipped when empty so the JSON-LD shape is stable.
    keywords: seo.keywords,
    articleSection: localizedArticleTypeLabel,
  });

  const breadcrumbName = title.length > BREADCRUMB_TITLE_MAX_LENGTH
    ? title.substring(0, BREADCRUMB_TITLE_MAX_LENGTH - BREADCRUMB_ELLIPSIS_OVERHEAD) + '…'
    : title;
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: langMeta.translations.home, item: `${BASE_URL}/` },
    { name: langMeta.translations.newsAnalysis, item: `${BASE_URL}/news/` },
    { name: breadcrumbName },
  ]);

  const speakableLd = buildSpeakableWebPageLd(
    articleUrl,
    langMeta.hreflang,
    ARTICLE_SPEAKABLE_SELECTORS,
  );

  const chrome = buildChrome({
    lang: input.lang,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    canonicalPath: input.canonicalPath,
    hreflangAlternates: input.hreflangAlternates,
    publishedIso,
    modifiedIso,
    jsonLd: [newsArticleLd, breadcrumbLd, speakableLd],
    section: 'Political Intelligence',
    heroBannerImage: 'images/riksdagsmonitornews-banner.webp',
    bodyClass: 'news-article',
  });

  const artifacts = input.artifactsUsed ?? [];
  const readerNavigationHtml = renderReaderNavigation({
    lang: input.lang,
    artifactsUsed: artifacts,
  });
  const analysisArtifactsHtml = renderAnalysisArtifactsReference({
    lang: input.lang,
    artifactsUsed: artifacts,
    subfolderRepoRelPath: input.subfolderRepoRelPath,
  });
  const methodsReferenceHtml = renderMethodsReference({
    lang: input.lang,
    canonicalPath: input.canonicalPath,
  });

  return `${chrome.head}
${chrome.headerHtml}
      <article class="rm-article rm-article-type-${escapeHtml(articleType.type)}" data-article-type="${escapeHtml(articleType.type)}" lang="${LANGUAGE_META[input.lang].hreflang}">
        <header class="rm-article-header">
          <p class="rm-article-eyebrow"><span class="rm-icon" aria-hidden="true">🔍</span> ${escapeHtml(localizedArticleTypeLabel)}</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="rm-article-dek">${escapeHtml(seo.description)}</p>
          <p class="rm-article-meta">
            <time datetime="${publishedIso}"><span class="rm-icon" aria-hidden="true">📅</span> ${escapeHtml(date)}</time>
            · <span class="rm-article-lang">${LANGUAGE_META[input.lang].flag} ${LANGUAGE_META[input.lang].nativeName}</span>
          </p>
          <ul class="rm-article-trust-badges" aria-label="${escapeHtml(LANGUAGE_META[input.lang].translations.articleTrustAriaLabel)}">
            <li><span class="rm-icon" aria-hidden="true">🏛️</span> ${escapeHtml(LANGUAGE_META[input.lang].translations.articleTrustPublicSources)}</li>
            <li><span class="rm-icon" aria-hidden="true">🤖</span> ${escapeHtml(LANGUAGE_META[input.lang].translations.articleTrustAiFirst)}</li>
            <li><span class="rm-icon" aria-hidden="true">🔗</span> ${escapeHtml(LANGUAGE_META[input.lang].translations.articleTrustTraceable)}</li>
          </ul>
        </header>
        <div class="rm-article-body">
${leadHtml}
        </div>
${readerNavigationHtml}${restHtml ? `
        <div class="rm-article-body rm-article-body-rest">
${restHtml}
        </div>` : ''}
${analysisArtifactsHtml}${methodsReferenceHtml}
      </article>
${chrome.footerHtml}`;
}
