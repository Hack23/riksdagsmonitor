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

import type { Language } from '../types/language.js';
import { LANGUAGE_META, escapeHtml } from '../generate-sitemap-html.js';
import { BASE_URL } from './constants.js';
import { buildGithubBlobUrl } from './url-helpers.js';
import { renderMarkdownToHtml } from './markdown/index.js';
import { buildChrome } from './chrome.js';
import { buildBreadcrumbListLd, buildNewsArticleLd, buildSpeakableWebPageLd, BREADCRUMB_TITLE_MAX_LENGTH, BREADCRUMB_ELLIPSIS_OVERHEAD } from './jsonld.js';
import { depth } from './chrome/helpers.js';

import { getBySubfolder, getById, loadArticleTypesRegistry } from './article-types.js';
import { artifactTitle, artifactIcon } from '../political-intelligence/i18n/artifact-i18n.js';
import { readerGuideI18n } from './aggregator/reader-guide-i18n.js';
import { READER_GUIDE_ENTRIES, anchorForTitle } from './aggregator/reader-guide.js';
import { titleForArtifact } from './aggregator/order.js';

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
  // Try registry first
  const entry = getById(type) ?? getBySubfolder(type);
  if (entry) return entry.label;
  // Fallback for types not in registry
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

  // Try all registered types from the registry first
  const registry = loadArticleTypesRegistry();
  for (const entry of registry.types) {
    if (source.includes(entry.subfolder.toLowerCase()) || source.includes(entry.id.toLowerCase())) {
      return { type: normalizeArticleType(entry.id), label: entry.label };
    }
  }

  // Fallback: legacy candidates not (yet) in the registry
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
  // Strip "## Reader Intelligence Guide" section (from heading to next ## or end)
  let cleaned = body.replace(
    /^##\s+Reader Intelligence Guide[^\n]*\n(?:(?!^## )[^\n]*\n?)*/gim,
    '',
  );
  // Strip "## Article Sources" section (from heading to next ## or end)
  cleaned = cleaned.replace(
    /^##\s+Article Sources[^\n]*\n(?:(?!^## )[^\n]*\n?)*/gim,
    '',
  );
  return cleaned;
}

export async function renderArticleHtml(input: RenderArticleInput): Promise<string> {
  const parsed = matter(input.markdown);
  const fm = parsed.data as Record<string, unknown>;
  const title = String(fm.title ?? 'Political Intelligence');
  const description = String(fm.description ?? 'Riksdagsmonitor political intelligence report.');
  const dateRaw = fm.date;
  let date: string;
  if (dateRaw instanceof Date) {
    date = dateRaw.toISOString().slice(0, 10);
  } else if (typeof dateRaw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateRaw)) {
    date = dateRaw.slice(0, 10);
  } else {
    date = new Date().toISOString().slice(0, 10);
  }
  const publishedIso = `${date}T00:00:00Z`;
  const modifiedIso = new Date().toISOString();
  const articleType = inferArticleType(input.canonicalPath, title);

  // Strip the markdown-based Reader Intelligence Guide and Article Sources
  // from the body — the chrome-level localized HTML versions are emitted
  // below and are properly translated for all 14 languages.
  const cleanedContent = stripBodyDuplicateSections(parsed.content);

  const bodyHtml = await renderMarkdownToHtml(cleanedContent);

  const articleUrl = `${BASE_URL}/${input.canonicalPath}`;
  const langMeta = LANGUAGE_META[input.lang];

  // NewsArticle JSON-LD with isBasedOn provenance
  const newsArticleLd = buildNewsArticleLd({
    headline: title,
    description,
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
  });

  // BreadcrumbList JSON-LD for hierarchical navigation
  const breadcrumbName = title.length > BREADCRUMB_TITLE_MAX_LENGTH
    ? title.substring(0, BREADCRUMB_TITLE_MAX_LENGTH - BREADCRUMB_ELLIPSIS_OVERHEAD) + '…'
    : title;
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: langMeta.translations.home, item: `${BASE_URL}/` },
    { name: langMeta.translations.newsAnalysis, item: `${BASE_URL}/news/` },
    { name: breadcrumbName },
  ]);

  // SpeakableSpecification — voice-assistant TTS regions. Selectors must
  // match the class names used in the article HTML template below.
  const speakableLd = buildSpeakableWebPageLd(
    articleUrl,
    langMeta.hreflang,
    ARTICLE_SPEAKABLE_SELECTORS,
  );

  const chrome = buildChrome({
    lang: input.lang,
    title,
    description,
    canonicalPath: input.canonicalPath,
    hreflangAlternates: input.hreflangAlternates,
    publishedIso,
    modifiedIso,
    jsonLd: [newsArticleLd, breadcrumbLd, speakableLd],
    section: 'Political Intelligence',
  });

  // Footer "Analysis sources" block — every artifact linked to GitHub
  // with icon + i18n title + filename in a card grid.
  const artifacts = input.artifactsUsed ?? [];
  const sourcesHeading = langMeta.translations.articleSourcesHeading;
  const sourcesDesc = langMeta.translations.articleSourcesDesc;
  const methodologyLabel = langMeta.translations.articleMethodologyLabel;
  const sourceCards = artifacts
    .map((a) => {
      const href = input.subfolderRepoRelPath
        ? buildGithubBlobUrl(`${input.subfolderRepoRelPath}/${a}`)
        : a;
      const icon = artifactIcon(a);
      const title = artifactTitle(a, input.lang);
      return `          <a class="rm-source-card" href="${href}" target="_blank" rel="noopener noreferrer">
            <span class="rm-source-card-icon" aria-hidden="true">${icon}</span>
            <span class="rm-source-card-info">
              <span class="rm-source-card-title">${escapeHtml(title)}</span>
              <code class="rm-source-card-file">${escapeHtml(a)}</code>
            </span>
            <span class="rm-source-card-arrow" aria-hidden="true">↗</span>
          </a>`;
    })
    .join('\n');
  const sourcesHtml = sourceCards ? `
      <section class="rm-article-sources" aria-labelledby="rm-article-sources-heading">
        <h2 id="rm-article-sources-heading"><span class="rm-icon" aria-hidden="true">📋</span> ${escapeHtml(sourcesHeading)}</h2>
        <p>${escapeHtml(sourcesDesc)}</p>
        <details class="rm-article-methodology" open>
          <summary><span class="rm-icon" aria-hidden="true">🔬</span> ${escapeHtml(methodologyLabel)} <span class="rm-source-count">(${artifacts.length})</span></summary>
          <div class="rm-article-sources-grid">
${sourceCards}
          </div>
        </details>
      </section>` : '';

  // Reader Intelligence Guide — full localized per-artifact table + methodology cards.
  const rg = langMeta.translations;
  const prefix = depth(input.canonicalPath);
  const piFile = input.lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${input.lang}.html`;

  // Build the full localized Reader Intelligence Guide table
  const guideI18n = readerGuideI18n(input.lang);
  const guideChrome = guideI18n.chrome;
  const availableArtifacts = new Set(artifacts);
  const guideRows = READER_GUIDE_ENTRIES
    .filter((entry) => availableArtifacts.has(entry.file))
    .map((entry) => {
      const sectionTitle = titleForArtifact(entry.file);
      const anchor = anchorForTitle(sectionTitle);
      const localised = guideI18n.entries[entry.file];
      const label = localised?.label ?? entry.label;
      const readerValue = localised?.readerValue ?? entry.readerValue;
      return `            <tr>
              <td><a href="#${anchor}">${escapeHtml(label)}</a></td>
              <td>${escapeHtml(readerValue)}</td>
              <td><code>${escapeHtml(entry.file)}</code></td>
            </tr>`;
    });

  // Add per-document intelligence row if document analyses exist
  const hasDocAnalyses = artifacts.some((a) => a.startsWith('documents/') && a.endsWith('-analysis.md'));
  if (hasDocAnalyses) {
    guideRows.push(`            <tr>
              <td><a href="#rm-per-document-intelligence">${escapeHtml(guideChrome.perDocLabel)}</a></td>
              <td>${escapeHtml(guideChrome.perDocValue)}</td>
              <td><code>documents/*-analysis.md</code></td>
            </tr>`);
  }

  // Add audit appendix row
  guideRows.push(`            <tr>
              <td><a href="#rm-classification-results">${escapeHtml(guideChrome.auditLabel)}</a></td>
              <td>${escapeHtml(guideChrome.auditValue)}</td>
              <td>${escapeHtml(guideChrome.auditArtifactLabel)}</td>
            </tr>`);

  const guideTableHtml = guideRows.length > 0 ? `
        <div class="rm-table-wrap">
          <table class="rm-reader-guide-table">
            <thead>
              <tr>
                <th>${escapeHtml(guideChrome.colReaderNeed)}</th>
                <th>${escapeHtml(guideChrome.colWhatYouGet)}</th>
                <th>${escapeHtml(guideChrome.colSourceArtifact)}</th>
              </tr>
            </thead>
            <tbody>
${guideRows.join('\n')}
            </tbody>
          </table>
        </div>` : '';

  const readerGuideHtml = `
      <section class="rm-reader-guide" aria-labelledby="rm-reader-guide-heading">
        <h2 id="rm-reader-guide-heading"><span class="rm-icon" aria-hidden="true">🧭</span> ${escapeHtml(guideChrome.heading)}</h2>
        <p class="rm-reader-guide-desc">${escapeHtml(guideChrome.preamble)}</p>
${guideTableHtml}
        <div class="rm-reader-guide-grid">
          <div class="rm-reader-guide-card">
            <div class="rm-reader-guide-card-icon" aria-hidden="true">🕵️</div>
            <h3>${escapeHtml(rg.articleReaderGuideOsint)}</h3>
            <p>${escapeHtml(rg.articleReaderGuideOsintDesc)}</p>
          </div>
          <div class="rm-reader-guide-card">
            <div class="rm-reader-guide-card-icon" aria-hidden="true">🤖</div>
            <h3>${escapeHtml(rg.articleReaderGuideAiFirst)}</h3>
            <p>${escapeHtml(rg.articleReaderGuideAiFirstDesc)}</p>
          </div>
          <div class="rm-reader-guide-card">
            <div class="rm-reader-guide-card-icon" aria-hidden="true">🧮</div>
            <h3>${escapeHtml(rg.articleReaderGuideSwot)}</h3>
            <p>${escapeHtml(rg.articleReaderGuideSwotDesc)}</p>
          </div>
          <div class="rm-reader-guide-card">
            <div class="rm-reader-guide-card-icon" aria-hidden="true">🔗</div>
            <h3>${escapeHtml(rg.articleReaderGuideTraceable)}</h3>
            <p>${escapeHtml(rg.articleReaderGuideTraceableDesc)}</p>
          </div>
        </div>
        <p class="rm-reader-guide-cta"><a href="${prefix}${piFile}"><span class="rm-icon" aria-hidden="true">📚</span> ${escapeHtml(rg.articleReaderGuideMoreMethodologies)}</a></p>
      </section>`;

  return `${chrome.head}
${chrome.headerHtml}
      <article class="rm-article rm-article-type-${escapeHtml(articleType.type)}" data-article-type="${escapeHtml(articleType.type)}" lang="${LANGUAGE_META[input.lang].hreflang}">
        <header class="rm-article-header">
          <p class="rm-article-eyebrow"><span class="rm-icon" aria-hidden="true">🔍</span> ${escapeHtml(articleType.label)}</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="rm-article-dek">${escapeHtml(description)}</p>
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
${bodyHtml}
        </div>
${sourcesHtml}
${readerGuideHtml}
      </article>
${chrome.footerHtml}`;
}
