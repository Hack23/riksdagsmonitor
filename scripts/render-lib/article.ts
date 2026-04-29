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

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  propositions: 'Government propositions',
  'committee-reports': 'Committee reports',
  committeeReports: 'Committee reports',
  motions: 'Opposition motions',
  interpellations: 'Interpellations',
  'evening-analysis': 'Evening analysis',
  'week-ahead': 'Week ahead',
  'month-ahead': 'Month ahead',
  'weekly-review': 'Weekly review',
  'monthly-review': 'Monthly review',
  'deep-inspection': 'Deep inspection',
  realtime: 'Realtime pulse',
  'realtime-pulse': 'Realtime pulse',
  breaking: 'Breaking intelligence',
  'parliament-agenda': 'Parliament agenda',
};

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
  const candidates = [
    'propositions',
    'committee-reports',
    'committeeReports',
    'motions',
    'interpellations',
    'evening-analysis',
    'week-ahead',
    'month-ahead',
    'weekly-review',
    'monthly-review',
    'deep-inspection',
    'realtime-pulse',
    'realtime',
    'breaking',
    'parliament-agenda',
  ];
  const match = candidates.find((candidate) => source.includes(candidate.toLowerCase()));
  const type = normalizeArticleType(match ?? 'political-intelligence');
  return {
    type,
    label: ARTICLE_TYPE_LABELS[match ?? type] ?? 'Political intelligence',
  };
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

  const bodyHtml = await renderMarkdownToHtml(parsed.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    inLanguage: LANGUAGE_META[input.lang].hreflang,
    url: `${BASE_URL}/${input.canonicalPath}`,
    mainEntityOfPage: `${BASE_URL}/${input.canonicalPath}`,
    author: {
      '@type': 'Organization',
      name: 'Riksdagsmonitor (Hack23 AB)',
      url: 'https://www.hack23.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Hack23 AB',
      url: 'https://www.hack23.com',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png` },
    },
    isBasedOn: (input.artifactsUsed ?? []).map((a) => ({
      '@type': 'CreativeWork',
      url: input.subfolderRepoRelPath
        ? buildGithubBlobUrl(`${input.subfolderRepoRelPath}/${a}`)
        : a,
      name: a,
    })),
  };

  const chrome = buildChrome({
    lang: input.lang,
    title,
    description,
    canonicalPath: input.canonicalPath,
    hreflangAlternates: input.hreflangAlternates,
    publishedIso,
    modifiedIso,
    jsonLd: [jsonLd],
    section: 'Political Intelligence',
  });

  // Footer "Analysis sources" block — every artifact linked to GitHub.
  const sourcesList = (input.artifactsUsed ?? [])
    .map((a) => {
      const href = input.subfolderRepoRelPath
        ? buildGithubBlobUrl(`${input.subfolderRepoRelPath}/${a}`)
        : a;
      return `        <li><a href="${href}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(a)}</code></a></li>`;
    })
    .join('\n');
  const sourcesHtml = sourcesList ? `
      <section class="rm-article-sources" aria-labelledby="rm-article-sources-heading">
        <h2 id="rm-article-sources-heading">Analysis sources</h2>
        <p>This article is rendered 100% from the analysis artifacts below. Every section of the prose above is traceable to one of these source files on GitHub.</p>
        <ul class="rm-article-sources-list">
${sourcesList}
        </ul>
      </section>` : '';

  return `${chrome.head}
${chrome.headerHtml}
      <article class="rm-article rm-article-type-${escapeHtml(articleType.type)}" data-article-type="${escapeHtml(articleType.type)}" lang="${LANGUAGE_META[input.lang].hreflang}">
        <header class="rm-article-header">
          <p class="rm-article-eyebrow">${escapeHtml(articleType.label)}</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="rm-article-dek">${escapeHtml(description)}</p>
          <p class="rm-article-meta">
            <time datetime="${publishedIso}">${escapeHtml(date)}</time>
            · <span class="rm-article-lang">${LANGUAGE_META[input.lang].flag} ${LANGUAGE_META[input.lang].nativeName}</span>
          </p>
          <ul class="rm-article-trust-badges" aria-label="${escapeHtml(LANGUAGE_META[input.lang].translations.articleTrustAriaLabel)}">
            <li>${escapeHtml(LANGUAGE_META[input.lang].translations.articleTrustPublicSources)}</li>
            <li>${escapeHtml(LANGUAGE_META[input.lang].translations.articleTrustAiFirst)}</li>
            <li>${escapeHtml(LANGUAGE_META[input.lang].translations.articleTrustTraceable)}</li>
          </ul>
        </header>
        <div class="rm-article-body">
${bodyHtml}
        </div>
${sourcesHtml}
      </article>
${chrome.footerHtml}`;
}
