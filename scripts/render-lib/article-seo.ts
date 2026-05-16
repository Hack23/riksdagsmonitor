/**
 * @module Infrastructure/RenderLib/ArticleSeo
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Article SEO metadata composer
 *
 * @description
 * Builds context-aware article titles, descriptions and keywords for the
 * generated 14-language HTML matrix. The helpers are pure so both the
 * `article.md` aggregator and HTML renderer can share the same metadata
 * rules without duplicating SEO logic.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import { LANGUAGE_META } from '../sitemap-html/index.js';

const DESCRIPTION_HARD_MAX = 200;
const KEYWORD_MAX = 24;

const CORE_KEYWORDS: readonly string[] = [
  'Riksdagsmonitor',
  'Swedish Parliament',
  'Riksdag',
  'political intelligence',
  'OSINT',
  'Swedish politics',
  'democratic transparency',
];

const TOPIC_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'over', 'under',
  'today', 'coverage', 'edition', 'riksdagsmonitor', 'riksdag', 'riksdagen',
  'swedish', 'parliament', 'political', 'intelligence', 'analysis', 'osint',
  'och', 'att', 'med', 'från', 'som', 'det', 'den', 'ett', 'över', 'under',
  'eine', 'einer', 'und', 'der', 'die', 'das', 'mit', 'pour', 'avec', 'dans',
  'les', 'des', 'une', 'del', 'con', 'para', 'het', 'een', 'van', 'voor',
]);

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function trimTrailingPunctuation(text: string): string {
  return text.replace(/[\s,;:—–-]+$/u, '').replace(/[.。؟?!…]+$/u, '').trim();
}

function truncateAtWord(text: string, maxLen: number): string {
  const clean = collapseWhitespace(text);
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(maxLen * 0.55) ? sliced.slice(0, lastSpace) : sliced;
  return trimTrailingPunctuation(cut) + '…';
}

function normaliseKeyword(raw: string): string {
  return raw
    .replace(/[<>"'`()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pushKeyword(out: string[], seen: Set<string>, raw: string): void {
  const keyword = normaliseKeyword(raw);
  if (keyword.length < 2) return;
  const key = keyword.toLocaleLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  out.push(keyword);
}

function wordsFrom(text: string): string[] {
  return collapseWhitespace(text)
    .split(/[^\p{L}\p{N}-]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !/^\d{4}-\d{2}-\d{2}$/.test(w));
}

function topicPhrase(input: ArticleSeoMetadataInput, maxWords = 5): string {
  const candidates = [...wordsFrom(input.title), ...wordsFrom(input.description)];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of candidates) {
    const normalised = raw
      .replace(/^\d{1,4}[./:-]\d{1,2}(?:[./:-]\d{1,4})?$/u, '')
      .replace(/^\d+$/u, '')
      .trim();
    if (!normalised) continue;
    const key = normalised.toLocaleLowerCase();
    if (TOPIC_STOPWORDS.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(normalised);
    if (out.length >= maxWords) break;
  }
  if (out.length > 0) return out.join(' ');
  return input.articleTypeId.replace(/-/g, ' ');
}

function formatPublicationContext(date: string, lang: Language): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  try {
    return new Intl.DateTimeFormat(LANGUAGE_META[lang].hreflang, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed);
  } catch {
    return date;
  }
}

export interface ArticleSeoMetadataInput {
  readonly title: string;
  readonly description: string;
  readonly lang: Language;
  readonly date: string;
  readonly articleTypeLabel: string;
  readonly articleTypeId: string;
  readonly canonicalPath?: string;
  readonly keywords?: string;
}

export interface ArticleSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly keywords: string;
}

/**
 * Build the SERP `<title>`. The executive-brief H1 — which the cascade
 * has already localized into 14 languages — IS the context. We do not
 * append article-type / topic / "edition update" boilerplate, because:
 *
 *  - The brief H1 is already rich, story-specific, and unique per day
 *    AND per article type AND per language (the cascade in
 *    `article-merge.ts` and `aggregator/aggregate.ts` guarantees it).
 *  - Boilerplate appendages caused near-identical SERP titles to repeat
 *    across days ("Deutsch Regierungsvorlagen: …", "Français Projets
 *    de loi: …") even when the underlying brief was completely
 *    different — see `Article-Generation.md § "Per-language precedence
 *    chain"`.
 *
 * The only suffix we keep is the site signature ` — Riksdagsmonitor`,
 * and only when the brief H1 plus suffix fits within the 70-char
 * SERP budget. When the H1 already mentions Riksdagsmonitor, we do
 * not duplicate it.
 */
export function buildSeoTitle(input: ArticleSeoMetadataInput): string {
  const SERP_TITLE_BUDGET = 70;
  const SITE_SUFFIX = ' — Riksdagsmonitor';
  const base = collapseWhitespace(input.title);
  if (base.length === 0) {
    return `${input.articleTypeLabel} — Riksdagsmonitor`;
  }
  // If the brief H1 already advertises the platform, return it as-is.
  if (/riksdagsmonitor/i.test(base)) {
    return truncateAtWord(base, SERP_TITLE_BUDGET);
  }
  // Append the site signature only when it fits without truncating
  // the brief H1 mid-word.
  if (base.length + SITE_SUFFIX.length <= SERP_TITLE_BUDGET) {
    return `${base}${SITE_SUFFIX}`;
  }
  // Otherwise the brief H1 is itself near the budget — keep it pristine
  // (truncated to the SERP budget) so search engines never see
  // duplicated boilerplate suffixes.
  return truncateAtWord(base, SERP_TITLE_BUDGET);
}

/**
 * Build the SERP `<meta name="description">`. The executive-brief BLUF
 * IS the description — already localized, already story-specific,
 * already in the 140-200 char SERP window for every language thanks to
 * the cascade in `aggregator/seo/description.ts § truncateToSentenceBoundary`.
 * We never append `Coverage: <Type> on <topic>; <lang> edition update
 * for <date> with Riksdag/OSINT provenance.` boilerplate because:
 *
 *  - It duplicates words already in the BLUF.
 *  - It collapses 14 hreflang siblings to near-identical snippets that
 *    only vary by the `Coverage:` translation — defeating the point of
 *    per-language BLUFs.
 *  - Search engines silently truncate >200 chars, so the boilerplate
 *    often replaced the actual analytical context with editorial
 *    plumbing.
 */
export function buildSeoDescription(input: ArticleSeoMetadataInput): string {
  const base = collapseWhitespace(input.description);
  if (base.length === 0) {
    return `${input.articleTypeLabel} — ${formatPublicationContext(input.date, input.lang)}`;
  }
  if (base.length <= DESCRIPTION_HARD_MAX) return base;
  return truncateAtWord(base, DESCRIPTION_HARD_MAX);
}

/**
 * Build article-specific keywords from front-matter, editorial headline,
 * BLUF description, article lens, extracted story topic and language. This replaces the
 * former global keyword fallback that made many article pages identical.
 */
export function buildArticleKeywords(input: ArticleSeoMetadataInput): string {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const keyword of (input.keywords ?? '').split(',')) pushKeyword(out, seen, keyword);
  pushKeyword(out, seen, input.articleTypeLabel);
  pushKeyword(out, seen, input.articleTypeId.replace(/-/g, ' '));
  pushKeyword(out, seen, LANGUAGE_META[input.lang].name);
  pushKeyword(out, seen, LANGUAGE_META[input.lang].nativeName);
  pushKeyword(out, seen, `${formatPublicationContext(input.date, input.lang)} update`);
  if (input.canonicalPath) {
    for (const part of input.canonicalPath.replace(/\.html$/i, '').split(/[/-]+/)) {
      if (/^\d{4}$|^\d{2}$|^[a-z]{2}$/i.test(part)) continue;
      pushKeyword(out, seen, part);
    }
  }
  for (const keyword of CORE_KEYWORDS) pushKeyword(out, seen, keyword);
  pushKeyword(out, seen, topicPhrase(input, 5));
  for (const word of [...wordsFrom(input.title), ...wordsFrom(input.description)]) {
    if (out.length >= KEYWORD_MAX) break;
    pushKeyword(out, seen, word);
  }
  return out.slice(0, KEYWORD_MAX).join(', ');
}

export function buildArticleSeoMetadata(input: ArticleSeoMetadataInput): ArticleSeoMetadata {
  return {
    title: buildSeoTitle(input),
    description: buildSeoDescription(input),
    keywords: buildArticleKeywords(input),
  };
}
