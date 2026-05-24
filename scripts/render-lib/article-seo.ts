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

/**
 * Per-language "core keyword" set — semantically identical to the English
 * `CORE_KEYWORDS` list (`Riksdagsmonitor`, `Swedish Parliament`,
 * `Riksdag`, `political intelligence`, `OSINT`, `Swedish politics`,
 * `democratic transparency`) but translated into native terminology for
 * each of the 14 supported languages. `Riksdagsmonitor` (the platform
 * brand) and the acronym `OSINT` stay verbatim across languages — they
 * are proper nouns / international acronyms and translating them would
 * dilute brand SERP signal. Everything else is native.
 *
 * This replaces the previous single English `CORE_KEYWORDS` constant
 * that leaked EN tokens (`Swedish Parliament`, `political intelligence`,
 * `democratic transparency`) into the keyword string of every non-EN
 * article page — diluting per-language SERP signal across all 13
 * non-English locales. See `seo-metadata-contract.md` §4 (per-language
 * charset budgets) for the editorial rule.
 *
 * Native-term sources (referenced in
 * `scripts/translation-dictionary-*.ts`):
 *  - Swedish: native Riksdag terminology
 *  - German: `Schwedisches Parlament` / `Reichstag` (Riksdag) — the
 *    German-language convention used by the Federal Foreign Office.
 *  - Arabic / Hebrew: `الريكسداغ` / `ריקסדאג` — the Latin transliteration
 *    that Riksdagen itself uses in its multilingual outreach.
 *  - CJK: native equivalents that Google CJK indexers recognise as
 *    political-intelligence terminology.
 */
const LANG_CORE_KEYWORDS: Readonly<Record<Language, readonly string[]>> = {
  en: [
    'Riksdagsmonitor',
    'Swedish Parliament',
    'Riksdag',
    'political intelligence',
    'OSINT',
    'Swedish politics',
    'democratic transparency',
  ],
  sv: [
    'Riksdagsmonitor',
    'Sveriges riksdag',
    'Riksdagen',
    'politisk underrättelse',
    'OSINT',
    'svensk politik',
    'demokratisk transparens',
  ],
  da: [
    'Riksdagsmonitor',
    'Sveriges rigsdag',
    'Riksdagen',
    'politisk efterretning',
    'OSINT',
    'svensk politik',
    'demokratisk gennemsigtighed',
  ],
  no: [
    'Riksdagsmonitor',
    'Sveriges riksdag',
    'Riksdagen',
    'politisk etterretning',
    'OSINT',
    'svensk politikk',
    'demokratisk åpenhet',
  ],
  fi: [
    'Riksdagsmonitor',
    'Ruotsin valtiopäivät',
    'Riksdag',
    'poliittinen tiedustelu',
    'OSINT',
    'Ruotsin politiikka',
    'demokraattinen läpinäkyvyys',
  ],
  de: [
    'Riksdagsmonitor',
    'Schwedisches Parlament',
    'Reichstag',
    'politische Aufklärung',
    'OSINT',
    'schwedische Politik',
    'demokratische Transparenz',
  ],
  fr: [
    'Riksdagsmonitor',
    'Parlement suédois',
    'Riksdag',
    'renseignement politique',
    'OSINT',
    'politique suédoise',
    'transparence démocratique',
  ],
  es: [
    'Riksdagsmonitor',
    'Parlamento sueco',
    'Riksdag',
    'inteligencia política',
    'OSINT',
    'política sueca',
    'transparencia democrática',
  ],
  nl: [
    'Riksdagsmonitor',
    'Zweeds parlement',
    'Riksdag',
    'politieke inlichtingen',
    'OSINT',
    'Zweedse politiek',
    'democratische transparantie',
  ],
  ar: [
    'Riksdagsmonitor',
    'البرلمان السويدي',
    'الريكسداغ',
    'استخبارات سياسية',
    'OSINT',
    'السياسة السويدية',
    'الشفافية الديمقراطية',
  ],
  he: [
    'Riksdagsmonitor',
    'הפרלמנט השוודי',
    'ריקסדאג',
    'מודיעין פוליטי',
    'OSINT',
    'פוליטיקה שוודית',
    'שקיפות דמוקרטית',
  ],
  ja: [
    'Riksdagsmonitor',
    'スウェーデン議会',
    'リクスダーグ',
    '政治インテリジェンス',
    'OSINT',
    'スウェーデン政治',
    '民主的透明性',
  ],
  ko: [
    'Riksdagsmonitor',
    '스웨덴 의회',
    '릭스다그',
    '정치 정보',
    'OSINT',
    '스웨덴 정치',
    '민주적 투명성',
  ],
  zh: [
    'Riksdagsmonitor',
    '瑞典议会',
    '瑞典国会',
    '政治情报',
    'OSINT',
    '瑞典政治',
    '民主透明度',
  ],
};

/**
 * Per-language word for the Swedish government ("Regeringen" / cabinet
 * / executive branch) — the second canonical institutional keyword that
 * must appear in every article's keyword string alongside "Riksdag" /
 * "Riksdagsmonitor" / "political intelligence". Mandatory floor item
 * per the news-journalism editorial brief (2026-05-24): every page
 * targeting Swedish political SERPs must surface BOTH chambers
 * (legislature + government).
 */
const LANG_GOVERNMENT_KEYWORD: Readonly<Record<Language, string>> = {
  en: 'Regeringen',
  sv: 'Regeringen',
  da: 'Regeringen',
  no: 'Regjeringen',
  fi: 'Ruotsin hallitus',
  de: 'Schwedische Regierung',
  fr: 'Gouvernement suédois',
  es: 'Gobierno sueco',
  nl: 'Zweedse regering',
  ar: 'الحكومة السويدية',
  he: 'הממשלה השוודית',
  ja: 'スウェーデン政府',
  ko: '스웨덴 정부',
  zh: '瑞典政府',
};

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Single-pass HTML entity decode map — avoids double-unescaping. */
const HTML_ENTITY_MAP: Readonly<Record<string, string>> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
};
const HTML_ENTITY_RE = /&(?:nbsp|amp|quot|lt|gt|apos|#39);/giu;

function decodeHtmlEntities(text: string): string {
  return text.replace(HTML_ENTITY_RE, (match) => HTML_ENTITY_MAP[match.toLowerCase()] ?? match);
}

function stripDescriptionMarkup(text: string): string {
  const stripped = text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script[^>]*>/giu, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style[^>]*>/giu, ' ')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/^[\s>#+*_`-]+/gmu, ' ');
  // Decode entities after initial tag strip, then strip again to catch
  // entity-encoded markup (e.g. &lt;script&gt;) that becomes real tags.
  // Re-run script/style block removal first so their contents are also removed.
  const decoded = decodeHtmlEntities(stripped);
  const reStripped = decoded
    .replace(/<script\b[^>]*>[\s\S]*?<\/script[^>]*>/giu, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style[^>]*>/giu, ' ')
    .replace(/<[^>]+>/gu, ' ');
  return collapseWhitespace(reStripped);
}

function trimTrailingPunctuation(text: string): string {
  return text.replace(/[\s,;:—–-]+$/u, '').replace(/[.。؟?!…]+$/u, '').trim();
}

/**
 * Trailing connector punctuation / words left behind when the
 * word-boundary truncation in {@link truncateAtWord} cuts a long
 * brief H1 at a coordinating connector.
 *
 * **Expanded superset** of the *trailing-connector* rule in
 * `aggregator/seo/title.ts § TRAILING_CONNECTOR_RE`: the aggregator's
 * trailing-connector list is English-only (it strips dangling EN
 * conjunctions/prepositions after word-boundary truncation), but note
 * that the aggregator's `BLUF_DATE_PREFIX_PATTERNS` already include
 * multilingual prefixes (EN + SV + DE + FR) to handle BLUF date
 * leaks. The renderer here must *also* strip Swedish / German /
 * French trailing connectors because executive-brief H1s ship in
 * all 14 languages. If you update either trailing-connector list,
 * update both — keep this regex strictly a superset of the
 * aggregator's EN-only connector list (drift in the EN subset would
 * let dangling EN connectors leak through in the renderer).
 *
 * Applied here as well as in the aggregator because the renderer's
 * `<title>` budget (70 chars) is tighter than the brief H1 and can
 * truncate a perfectly clean H1 mid-connector.
 *
 * Live case: brief H1
 *   "Riksdag Enshrines Constitutional Protection for Abortion — and
 *    Expands the Security State's Toolkit" (99 chars)
 * → without this strip the SERP `<title>` ships as
 *   "Riksdag Enshrines Constitutional Protection for Abortion — and…"
 *   which reads as a dangling connector to readers and search engines.
 * With this strip the SERP `<title>` ships as
 *   "Riksdag Enshrines Constitutional Protection for Abortion…"
 *   which is clean prose.
 */
const TRAILING_CONNECTOR_RE =
  /[\s,;:—–-]+(?:and|or|but|with|as|in|of|to|for|on|at|by|from|that|which|who|when|where|while|after|before|the|a|an|have|has|had|is|are|was|were|will|would|can|may|might|should|must|och|men|eller|med|som|av|till|för|på|i|att|der|die|das|und|oder|aber|mit|als|für|in|auf|et|ou|mais|avec|comme|de|à|pour|en|sur)$/iu;

function trimTrailingConnectors(text: string): string {
  let prev = text;
  for (let i = 0; i < 5; i += 1) {
    const next = prev.replace(TRAILING_CONNECTOR_RE, '').replace(/[\s,;:—–-]+$/u, '').trim();
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

function truncateAtWord(text: string, maxLen: number): string {
  const clean = collapseWhitespace(text);
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(maxLen * 0.55) ? sliced.slice(0, lastSpace) : sliced;
  const stripped = trimTrailingConnectors(trimTrailingPunctuation(cut));
  return stripped + '…';
}

function truncateWithinBudget(text: string, maxLen: number): string {
  const clean = collapseWhitespace(text);
  if (clean.length <= maxLen) return clean;
  if (maxLen <= 1) return '…'.slice(0, maxLen);
  const truncated = truncateAtWord(clean, maxLen - 1);
  return truncated.length <= maxLen ? truncated : `${clean.slice(0, maxLen - 1).trim()}…`;
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

export interface ArticleSeoMetadataInput {
  readonly title: string;
  readonly description: string;
  readonly lang: Language;
  readonly date: string;
  readonly articleTypeLabel: string;
  readonly articleTypeId: string;
  readonly canonicalPath?: string;
  readonly keywords?: string;
  /**
   * Pre-computed, story-specific keywords mined from the executive-brief
   * (bill IDs, proposition refs, committee codes/reports, party codes,
   * named entities). When present these are seeded FIRST so the
   * highest-signal SERP tokens (`HD03267`, `JuU28`, `SÄPO`,
   * `Migrationsverket`) lead the keyword string. Universal-Swedish
   * identifiers (bill IDs, committee codes) survive untranslated across
   * all 14 languages, so the same set is supplied to every locale's
   * page. See `scripts/render-lib/aggregator/seo/brief-extractor.ts`.
   */
  readonly briefEntities?: readonly string[];
}

export interface ArticleSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly keywords: string;
}

/**
 * Build the SERP `<title>`. The executive-brief H1 — which the cascade
 * has already localized into 14 languages — IS the context. We do not
 * append `— DATE · LANG` boilerplate, because:
 *
 *  - The publication date is already conveyed by `article:published_time`
 *    OG meta and the per-article URL slug; Google renders it as a SERP
 *    snippet prefix without needing it in the `<title>`.
 *  - The language is already conveyed by `<html lang>`, `hreflang`
 *    alternates, and `og:locale`; carrying it again in the `<title>`
 *    eats ~5-6 chars of the 70-char SERP budget for zero CTR benefit.
 *  - Pre-2026-05 the boilerplate `— 2026-05-22 · en — Riksdagsmonitor`
 *    consumed ~40 chars and left only ~30 chars for the actual story,
 *    forcing rich 107-char H1s like `"Sweden Abolishes Permanent
 *    Residence and Expands Security Deportation: A Pre-Election
 *    Legislative Reckoning"` to ship as `"Sweden Abolishes Permanent…"`.
 *
 * The only suffix we keep is the site signature ` — Riksdagsmonitor`,
 * and only when the brief H1 plus suffix fits within the 70-char SERP
 * budget. When the H1 already mentions Riksdagsmonitor, we don't
 * duplicate it. When the H1 alone exceeds 70 chars we drop the suffix
 * entirely so the story title gets every available pixel.
 */
export function buildSeoTitle(input: ArticleSeoMetadataInput): string {
  const SERP_TITLE_BUDGET = 70;
  const SITE_SUFFIX = ' — Riksdagsmonitor';
  const base = collapseWhitespace(input.title);
  if (base.length === 0) {
    // Empty title — synthesise from article-type label + brand.
    const fallback = `${input.articleTypeLabel}${SITE_SUFFIX}`;
    return truncateWithinBudget(fallback, SERP_TITLE_BUDGET);
  }
  // Avoid duplicating the brand when the H1 already mentions it.
  if (/riksdagsmonitor/i.test(base)) {
    if (base.length <= SERP_TITLE_BUDGET) return base;
    return truncateWithinBudget(base, SERP_TITLE_BUDGET);
  }
  // Branded variant fits the SERP budget — ship the full story + brand.
  if (base.length + SITE_SUFFIX.length <= SERP_TITLE_BUDGET) {
    return `${base}${SITE_SUFFIX}`;
  }
  // H1 alone fits the SERP budget — drop the brand suffix so the story
  // title is the SERP signal (brand is already covered by `og:site_name`
  // and the canonical URL).
  if (base.length <= SERP_TITLE_BUDGET) return base;
  // H1 overflows the SERP budget — truncate cleanly and ship without
  // brand suffix so every available char goes to the story.
  return truncateWithinBudget(base, SERP_TITLE_BUDGET);
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
  const base = stripDescriptionMarkup(input.description);
  return truncateWithinBudget(base, DESCRIPTION_HARD_MAX);
}

/**
 * Build article-specific keywords. Editorial floor (2026-05-24 brief):
 * every page MUST surface the four institutional anchors —
 * `Riksdagsmonitor`, `Riksdag`, `Regeringen`, `political intelligence` —
 * in the page's own language, then layer story-specific signal on top.
 *
 * **Ordering (highest signal first):**
 *  1. **Brief entities** (`input.briefEntities`) — bill IDs (HD03267),
 *     proposition refs (prop. 2025/26:267), committee report IDs (JuU28),
 *     committee codes (JuU, SfU), party codes (M, SD), named entities
 *     (SÄPO, Migrationsverket, Tidöavtalet). Mined upstream by
 *     `brief-extractor.ts` from the executive-brief; universal-Swedish
 *     identifiers carry across all 14 locales unchanged.
 *  2. **Localized mandatory floor** — `LANG_CORE_KEYWORDS[lang]` (already
 *     includes localized Riksdagsmonitor / parliament / political
 *     intelligence) + `LANG_GOVERNMENT_KEYWORD[lang]` (Regeringen).
 *  3. **Localized article-type label** (`Propositions` → `Lagförslag` /
 *     `Regierungsvorlagen` / …). The localized label, not the English
 *     `articleTypeId` slug, so non-EN pages don't leak EN tokens.
 *  4. **Native language name** (`Svenska`, `Deutsch`, `日本語`) — surfaces
 *     the locale in its own script for multilingual SERP routing.
 *
 * **Removed (was leakage / boilerplate):**
 *  - `formatPublicationUpdateKeyword(date, lang)` — `"22 maj 2026
 *    uppdatering"` is calendar boilerplate, not story signal. The
 *    publication date already lives in `article:published_time` OG
 *    meta, the URL slug, and the rendered byline.
 *  - `topicPhrase` + `wordsFrom(title) + wordsFrom(description)` — these
 *    were chopping rich H1s (`"Sweden Abolishes Permanent Residence
 *    …"`) into junk single-word tokens (`Sweden`, `Abolishes`,
 *    `Permanent`). Brief entities carry the same semantic ground
 *    without prose fragmentation.
 *  - Canonical-path slug parts and English Language-Meta name — both
 *    leaked EN tokens into non-EN keyword strings.
 *  - EN frontmatter `keywords:` seed — historically mixed in via the
 *    aggregator's `buildArticleKeywords` upstream call, which itself
 *    used this function. Now seeded purely via `briefEntities` to keep
 *    the pipeline single-source-of-truth.
 *
 * The English path still accepts the `input.keywords` seed (the EN
 * frontmatter line) for backward-compat with EN-only tests, but it is
 * appended AFTER brief entities and the mandatory floor, so the
 * deterministic high-signal tokens always lead.
 */
export function buildArticleKeywords(input: ArticleSeoMetadataInput): string {
  const out: string[] = [];
  const seen = new Set<string>();
  const isEnglish = input.lang === 'en';

  // 1. Brief entities first — highest SERP signal, universal across
  //    languages. These are normalised by the upstream extractor; we
  //    just push them in order so the cap preserves story priority.
  for (const ent of input.briefEntities ?? []) {
    if (out.length >= KEYWORD_MAX) break;
    pushKeyword(out, seen, ent);
  }

  // 2. Mandatory institutional floor — every page surfaces both chambers
  //    of Swedish power (legislature + government) in its own language.
  for (const keyword of LANG_CORE_KEYWORDS[input.lang]) pushKeyword(out, seen, keyword);
  pushKeyword(out, seen, LANG_GOVERNMENT_KEYWORD[input.lang]);

  // 3. Localized article-type label (e.g. "Lagförslag", "Comités",
  //    "Komiteeraportit"). Skip the raw English slug for non-EN locales.
  pushKeyword(out, seen, input.articleTypeLabel);
  if (isEnglish) {
    pushKeyword(out, seen, input.articleTypeId.replace(/-/g, ' '));
  }

  // 4. Native language name in its own script — surfaces locale for
  //    multilingual SERP routing without leaking EN ("Swedish" under
  //    `<html lang="sv">` is a hard contract violation).
  pushKeyword(out, seen, LANGUAGE_META[input.lang].nativeName);

  // 5. EN frontmatter seed appended last (EN-only) for backward compat
  //    with the EN article keyword line. Non-EN locales never seed from
  //    EN frontmatter.
  if (isEnglish) {
    for (const keyword of (input.keywords ?? '').split(',')) {
      if (out.length >= KEYWORD_MAX) break;
      pushKeyword(out, seen, keyword);
    }
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
