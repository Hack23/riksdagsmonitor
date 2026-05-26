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

import { articleTypeIcon } from './article-type-i18n.js';
import { computeArticleHeadMetadata } from './article-head-metadata.js';
import {
  readFirstHeading,
  cleanArticleTitle,
} from './aggregator/seo/title.js';
import {
  composeRichDescription,
  readBlufParagraph,
  readFirstParagraph,
  truncateToSentenceBoundary,
  descriptionWindowForLanguage,
} from './aggregator/seo/description.js';
import { extractLocalizedBriefSeo } from './aggregator/seo/localized-brief.js';
import {
  extractBriefEntities,
  flattenBriefEntities,
} from './aggregator/seo/brief-extractor.js';
import { titleWindowForLanguage } from './aggregator/seo/serp-budgets.js';
/**
 * @deprecated Re-exported from `article-head-metadata.ts`. The function
 * body lives there now so the renderer, regenerator and QA tooling all
 * call exactly one implementation. This export only exists to preserve
 * the historical `import { parseFrontMatterDate } from './article.js'`
 * import sites (notably `tests/render-lib-architecture.test.ts`).
 */
export { parseFrontMatterDate, inferArticleType } from './article-head-metadata.js';
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
  /**
   * Raw English `executive-brief.md` markdown adjacent to `article.md`.
   * When provided, the renderer derives `<title>` (from the brief H1
   * via {@link cleanArticleTitle}) and `<meta description>` (from the
   * BLUF via {@link composeRichDescription} / {@link readBlufParagraph}
   * → {@link truncateToSentenceBoundary}) **directly from the brief**,
   * bypassing the (now back-compat-only) `article.md` frontmatter
   * `title:` / `description:` lines.
   *
   * When omitted (the 278 pre-`2026-03-26` legacy `news/*-en.html`
   * articles whose `analysis/daily/<date>/` source directories have
   * been deleted), the renderer gracefully falls back to whatever
   * `article.md` frontmatter is available — keeps existing legacy
   * SEO intact without throwing.
   *
   * The subfolder slug (`propositions`, `committee-reports`, …) is
   * sourced from {@link subfolderSlug}; defaults to the empty string
   * which simply skips the article-type boilerplate scrub inside
   * {@link cleanArticleTitle}.
   */
  readonly englishBriefMarkdown?: string;
  /**
   * Raw localized `executive-brief_<lang>.md` markdown when one exists
   * for `input.lang`. When provided and `lang !== 'en'`, the renderer
   * derives title + description from the localized brief (per the
   * cascade-chain step #2 in `Article-Generation.md § "Per-language
   * precedence chain"`); when the localized brief has a banned /
   * missing H1 / BLUF, fields independently fall through to the
   * {@link englishBriefMarkdown} cascade.
   */
  readonly localizedBriefMarkdown?: string;
  /**
   * Subfolder slug (`propositions`, `committee-reports`, …). Forwarded
   * to {@link cleanArticleTitle} so brief H1s that simply repeat the
   * article-type label are scrubbed before truncation. Optional; an
   * empty string disables that scrub.
   */
  readonly subfolderSlug?: string;
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
 * Derive `<title>` / `<meta description>` / keyword-entity overrides
 * from the executive-brief markdown adjacent to `article.md`. Pure
 * function — no I/O, no clock.
 *
 * Resolution order:
 *
 *  1. For non-EN, prefer {@link RenderArticleInput.localizedBriefMarkdown}
 *     via {@link extractLocalizedBriefSeo}. Title and description are
 *     resolved **independently**: a banned title with a clean BLUF
 *     still localizes the description, and a clean title with an
 *     empty BLUF still localizes the title.
 *  2. Whatever field is still `null` after step 1 falls through to the
 *     English brief — title via {@link readFirstHeading} →
 *     {@link cleanArticleTitle}; description via
 *     {@link composeRichDescription} ∥ {@link readBlufParagraph} ∥
 *     {@link readFirstParagraph}, capped by per-language SERP window
 *     in {@link truncateToSentenceBoundary}.
 *  3. Entities are mined from the brief (localized first, EN
 *     fallback) — universal-Swedish identifiers (HD03267, JuU/SfU)
 *     carry across locales.
 *
 * Returns `{ title: undefined, description: undefined, entities: [] }`
 * when no brief markdown is provided so the head-metadata helper falls
 * back to the legacy frontmatter-only audit path (covers the 278 pre-
 * `2026-03-26` `news/*-en.html` files whose source `analysis/daily/`
 * directories have been deleted).
 *
 * Exported for testability.
 */
export function deriveBriefSeoOverrides(input: {
  readonly lang: Language;
  readonly englishBriefMarkdown?: string;
  readonly localizedBriefMarkdown?: string;
  readonly subfolderSlug?: string;
}): {
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly entities: readonly string[];
} {
  const subfolder = input.subfolderSlug ?? '';
  const hasEn = !!input.englishBriefMarkdown && input.englishBriefMarkdown.trim().length > 0;
  const hasLoc = !!input.localizedBriefMarkdown
    && input.localizedBriefMarkdown!.trim().length > 0;
  if (!hasEn && !hasLoc) {
    return { title: undefined, description: undefined, entities: [] };
  }

  let title: string | null = null;
  let description: string | null = null;
  let entities: readonly string[] = [];

  // Step 1 — localized brief (non-EN only).
  if (input.lang !== 'en' && hasLoc) {
    const briefSeo = extractLocalizedBriefSeo({
      briefMarkdown: input.localizedBriefMarkdown!,
      subfolder,
      lang: input.lang,
    });
    if (briefSeo.title) title = briefSeo.title;
    if (briefSeo.description) description = briefSeo.description;
    if (briefSeo.keywords.length > 0) entities = briefSeo.keywords;
  }

  // Step 2 — English brief fallback for any field still unresolved.
  if (hasEn) {
    if (title === null) {
      const rawH1 = readFirstHeading(input.englishBriefMarkdown!);
      const cleaned = cleanArticleTitle(rawH1, subfolder, 'en');
      if (cleaned && cleaned.length > 0) title = cleaned;
    }
    if (description === null) {
      // Rich description (BLUF + headline-section bullets) — mirrors
      // the aggregator's English path. **Use the caller's lang for the
      // budget** so a non-EN page that falls back to EN content is at
      // least sized to its own SERP window (AR/HE 170, CJK 120) rather
      // than the 200-char EN default.
      const composed = composeRichDescription(input.englishBriefMarkdown!, input.lang);
      if (composed && composed.length > 0) {
        description = composed;
      } else {
        const bluf = readBlufParagraph(input.englishBriefMarkdown!)
          ?? readFirstParagraph(input.englishBriefMarkdown!);
        if (bluf && bluf.trim().length > 0) {
          const { softMin, hardMax } = descriptionWindowForLanguage(input.lang);
          const truncated = truncateToSentenceBoundary(bluf, softMin, hardMax);
          if (truncated.length > 0) description = truncated;
        }
      }
    }
    if (entities.length === 0) {
      entities = flattenBriefEntities(extractBriefEntities(input.englishBriefMarkdown!, 'en'));
    }
  }

  // Final defence-in-depth admin-byline VALUE scrubber. The localized
  // `executive-brief_<lang>.md` files use translated admin labels
  // (`**Författare**`, `**المؤلف**`, `**Kirjoittaja**`, `**Forfatter**`,
  // `**著者**`, `**Upphovsman**`, etc.) and not every translation is
  // present in `ADMIN_FIELD_NAMES`. When a label is unrecognised the
  // upstream extractors leak the VALUE (the editorial-byline name, the
  // run-ID digits, the classification banner, the confidence grade)
  // into the rendered SEO surface — a journalist searching for a
  // specific date then sees `James Pether Sörling…` as the SERP
  // snippet instead of the BLUF. This scrubber is label-agnostic: it
  // matches the known VALUES that should never ship and removes them
  // from the composed title / description.
  if (title !== null) title = scrubAdminBylineValues(title);
  if (description !== null) description = scrubAdminBylineValues(description);

  // Final per-language ceiling enforcement. The localized-brief and
  // EN-fallback paths each have their own truncation logic but the
  // contract on this function is `length <= hardMax(lang)` for both
  // title and description. Defense-in-depth: any future extractor
  // upstream that forgets to truncate still ships within budget.
  if (title !== null) {
    const { hardMax: titleMax } = titleWindowForLanguage(input.lang);
    if (title.length > titleMax) {
      title = capByWordBoundary(title, titleMax);
    }
  }
  if (description !== null) {
    const { hardMax: descMax } = descriptionWindowForLanguage(input.lang);
    if (description.length > descMax) {
      description = capByWordBoundary(description, descMax);
    }
  }

  return {
    title: title ?? undefined,
    description: description ?? undefined,
    entities,
  };
}

/**
 * Admin-byline VALUE patterns that must never appear in a shipped
 * SEO title or description regardless of source language. Each entry
 * captures a value that is generated by the brief pipeline itself
 * (editorial byline, classification banner, run-ID, OSINT Admiralty
 * grade) so removing them never destroys article-content meaning.
 *
 * The scrubber excises the matched span plus any immediately
 * surrounding admin-label fragment (`**Author**:`, `Författare:`,
 * `Date:`, …) so we collapse `(Author: <byline>) ` style residue
 * into clean whitespace.
 */
const ADMIN_VALUE_SCRUB_PATTERNS: readonly RegExp[] = [
  /James\s+Pether\s+S(?:ö|o)rling[^\n]*?(?=(?:\s*[—•·|]\s*|\s*\.\s|$))/gi,
  /\bHack23\s+AB\b[^\n]*?(?=(?:\s*[—•·|]\s*|\s*\.\s|$))/gi,
  /\b(?:Run[-\s]?ID|K[öo]rnings[-\s]?ID|Lauf[-\s]?ID|Ajo[-\s]?ID|实行ID|実行ID|운영\s*ID|实例ID)\b\s*[:：]?\s*\d{6,}/gi,
  /\b(?:Confidence|Konfidens(?:nivå)?|Konfidenz|Luottamustaso|信頼度|信心度|Niveau de confiance|Nivel de confianza|Betrouwbaarheid)\b\s*[:：]?\s*(?:HIGH|HØJ|HIGH\s*\[B\d\]|HØY|KORKEA|高い|高|HOCH|Élevé|Alto|Hoog|عالٍ?|גבוה)\b[^\n]*?(?=(?:\s*[—•·|]\s*|\s*\.\s|$))/gi,
  /\bClassification\b\s*[:：]?\s*PUBLIC[^\n]*?(?=(?:\s*[—•·|]\s*|\s*\.\s|$))/gi,
  /\bAdmiralty\s+(?:Range|Baseline|Code|Grade|Scale)\b[^\n]*?(?=(?:\s*[—•·|]\s*|\s*\.\s|$))/gi,
  /\bGDPR\s+Art\.?\s*\d+(?:\(\d+\))?(?:\([a-z](?:[,;]\s*[a-z])*\))?[^\n]*?(?=(?:\s*[—•·|]\s*|\s*\.\s|$))/gi,
];

/**
 * Strip admin-byline VALUES (editorial name, run-ID, classification
 * banner, confidence grade) from the final SEO string. Pure
 * label-agnostic — works on any source language.
 */
function scrubAdminBylineValues(text: string): string {
  let cleaned = text;
  for (const re of ADMIN_VALUE_SCRUB_PATTERNS) {
    cleaned = cleaned.replace(re, ' ');
  }
  // Collapse any " — " / "•" / "·" / "|" residue left behind by the
  // scrub plus tidy whitespace and dangling punctuation.
  return cleaned
    .replace(/\s*[—•·|]\s*(?=[—•·|])/g, ' ')
    .replace(/\s*[—•·|]\s*$/u, '')
    .replace(/^\s*[—•·|]\s*/u, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

/**
 * Word-boundary truncation with `…` ellipsis. Used as a defence-in-depth
 * cap on `deriveBriefSeoOverrides` output. The upstream extractors each
 * apply their own language-aware truncation; this only fires when the
 * result still exceeds the hard ceiling (e.g. an H1 that is itself
 * longer than the per-language `hardMax`).
 *
 * The function tries to cut at a word boundary in the last 45% of the
 * window; if no boundary exists it falls back to a hard slice. The
 * resulting string is guaranteed to have `length <= maxLen`.
 */
function capByWordBoundary(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  if (maxLen <= 1) return '…'.slice(0, maxLen);
  const sliced = text.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(maxLen * 0.55) ? sliced.slice(0, lastSpace) : sliced;
  // Strip dangling punctuation / connectors before adding ellipsis.
  const stripped = cut
    .replace(/[\s,;:\-—–]+$/u, '')
    .trim();
  return (stripped + '…').slice(0, maxLen);
}

export async function renderArticleHtml(input: RenderArticleInput): Promise<string> {
  const parsed = matter(input.markdown);
  // Cascade-chain step #1+#2 — pull SEO directly from executive-brief.md
  // (localized brief beats EN brief for non-EN, EN brief is canonical
  // for EN). The brief is the single source of truth for `<title>` /
  // `<meta description>` / JSON-LD `headline` / JSON-LD `description`.
  // `article.md` frontmatter `title:` / `description:` / `keywords:`
  // lines are back-compat-only fallback for the 278 pre-`2026-03-26`
  // legacy `news/*-en.html` files whose source directories have been
  // deleted (see `deriveBriefSeoOverrides`).
  const briefOverrides = deriveBriefSeoOverrides({
    lang: input.lang,
    englishBriefMarkdown: input.englishBriefMarkdown,
    localizedBriefMarkdown: input.localizedBriefMarkdown,
    subfolderSlug: input.subfolderSlug,
  });
  // Delegate every `<head>`-relevant derivation to the shared helper so
  // the renderer and the `test-article-headers` CLI can never drift.
  const head = computeArticleHeadMetadata({
    markdown: input.markdown,
    lang: input.lang,
    canonicalPath: input.canonicalPath,
    // Pass the already-parsed front-matter data so `computeArticleHeadMetadata`
    // can skip a second `matter()` call on the same string.
    parsedData: parsed.data as Record<string, unknown>,
    briefDerivedTitle: briefOverrides.title,
    briefDerivedDescription: briefOverrides.description,
    briefDerivedEntities: briefOverrides.entities,
  });
  const { rawTitle: title, date, articleTypeId, articleTypeLabel: localizedArticleTypeLabel, seo } = head;
  const publishedIso = `${date}T00:00:00Z`;
  const modifiedIso = new Date().toISOString();
  const articleType = { type: articleTypeId, label: localizedArticleTypeLabel };

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
    section: head.articleSection,
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
          <p class="rm-article-eyebrow"><span class="rm-icon" aria-hidden="true">${articleTypeIcon(articleType.type)}</span> ${escapeHtml(localizedArticleTypeLabel)}</p>
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
