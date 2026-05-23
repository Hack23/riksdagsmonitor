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
 * Per-language word for "update" appended after the publication-date
 * keyword (e.g. `15 maj 2026 uppdatering`, `15. Mai 2026 Aktualisierung`,
 * `2026年5月15日 更新`). Previously the English string `"update"` was
 * hard-coded into every locale.
 */
const LANG_UPDATE_WORD: Readonly<Record<Language, string>> = {
  en: 'update',
  sv: 'uppdatering',
  da: 'opdatering',
  no: 'oppdatering',
  fi: 'päivitys',
  de: 'Aktualisierung',
  fr: 'mise à jour',
  es: 'actualización',
  nl: 'update',
  ar: 'تحديث',
  he: 'עדכון',
  ja: '更新',
  ko: '업데이트',
  zh: '更新',
};

/**
 * Tokens to skip when mining keywords from the article title /
 * description. Covers function words / pronouns / common verbs in every
 * supported language plus the platform-name family — these are
 * universally low-signal in keyword form. Keep additions broad: any
 * token that appears in >50% of articles regardless of topic should go
 * here.
 */
const TOPIC_STOPWORDS = new Set([
  // ── EN
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'over', 'under',
  'today', 'coverage', 'edition', 'riksdagsmonitor', 'riksdag', 'riksdagen',
  'swedish', 'parliament', 'political', 'intelligence', 'analysis', 'osint',
  'have', 'been', 'will', 'their', 'there', 'these', 'those', 'about',
  'than', 'them', 'they', 'when', 'what', 'which', 'while', 'after',
  // ── SV / DA / NO / FI
  'och', 'att', 'med', 'från', 'som', 'det', 'den', 'ett', 'över', 'under',
  'aren', 'inte', 'eller', 'efter', 'sedan', 'eller', 'både', 'när',
  'eller', 'samt', 'mellan', 'genom', 'utan', 'hade', 'kommer',
  'oller', 'efter', 'siden',
  // ── DE
  'eine', 'einer', 'und', 'der', 'die', 'das', 'mit', 'auf', 'für',
  'zwischen', 'durch', 'ohne', 'beim', 'nach', 'vor', 'wenn', 'aber',
  'auch', 'noch', 'schon', 'sowohl', 'sowie',
  // ── FR / ES / NL
  'pour', 'avec', 'dans', 'sur', 'sans', 'mais', 'aussi', 'comme',
  'les', 'des', 'une', 'del', 'con', 'para', 'het', 'een', 'van', 'voor',
  'sobre', 'entre', 'desde', 'hasta', 'cuando', 'donde', 'sino',
  'door', 'tussen', 'zonder', 'omdat', 'wanneer', 'maar', 'ook',
  // ── AR (definite article + common particles; CJK / RTL stopwords stay
  // short because mining strategies in those scripts prefer character
  // n-grams over whitespace tokens, but BLUF sentences in our corpus
  // routinely use whitespace separation for political-actor names).
  'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي',
  'أن', 'إن', 'كما', 'لكن', 'كل', 'بعض',
  // ── HE
  'של', 'את', 'עם', 'על', 'אל', 'מן', 'אשר', 'אבל', 'גם', 'כאשר',
  'בין', 'כמו', 'אך', 'כדי',
  // ── JA / KO / ZH function words rarely appear as whitespace-separated
  // tokens but we add the most common script-mixed leak cases.
  'について', 'および', 'および',
  '그리고', '또는', '하지만', '이것', '저것',
  '以及', '或者', '但是', '这个', '那个',
]);

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
  return collapseWhitespace(decodeHtmlEntities(text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script[^>]*>/giu, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style[^>]*>/giu, ' ')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/^[\s>#+*_`-]+/gmu, ' ')));
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

/**
 * Build the localized `"<date> <update-word>"` keyword fragment used in
 * the keyword string. Previously the English word `"update"` was
 * hard-coded into every locale; now we honour {@link LANG_UPDATE_WORD}.
 */
function formatPublicationUpdateKeyword(date: string, lang: Language): string {
  return `${formatPublicationContext(date, lang)} ${LANG_UPDATE_WORD[lang]}`;
}

function uniqueTitleSuffix(input: ArticleSeoMetadataInput): string {
  return ` — ${input.date} · ${input.lang}`;
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
  const uniqueSuffix = uniqueTitleSuffix(input);
  const base = collapseWhitespace(input.title);
  if (base.length === 0) {
    return truncateWithinBudget(`${input.articleTypeLabel}${uniqueSuffix}${SITE_SUFFIX}`, SERP_TITLE_BUDGET);
  }
  // Every article title carries date + locale context so legacy pages with
  // reused H1s (or untranslated fallback H1s) stay unique in webmaster tools.
  if (/riksdagsmonitor/i.test(base)) {
    if (base.length + uniqueSuffix.length <= SERP_TITLE_BUDGET) {
      return `${base}${uniqueSuffix}`;
    }
    return `${truncateWithinBudget(base, SERP_TITLE_BUDGET - uniqueSuffix.length)}${uniqueSuffix}`;
  }
  const tail = `${uniqueSuffix}${SITE_SUFFIX}`;
  // Append the site signature with the unique date/lang suffix and truncate
  // only the brief H1 when needed. Returning a branded title prevents
  // chrome/head.ts from appending a second suffix outside the SERP budget.
  if (base.length + tail.length <= SERP_TITLE_BUDGET) {
    return `${base}${tail}`;
  }
  return `${truncateWithinBudget(base, SERP_TITLE_BUDGET - tail.length)}${tail}`;
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
 * Build article-specific keywords from front-matter, editorial headline,
 * BLUF description, article lens, extracted story topic and language.
 * This replaces the former global keyword fallback that made many
 * article pages identical.
 *
 * **Per-language localization rule (since 2026-05):**
 *
 *  - For `lang === 'en'` the function still seeds the keyword list from
 *    `input.keywords` (the EN article-frontmatter `keywords:` line set
 *    by the aggregator in `aggregator/aggregate.ts`).
 *  - For every non-English language the EN-frontmatter seed is dropped
 *    so the localized title + description + canonical-path slugs +
 *    {@link LANG_CORE_KEYWORDS}`[lang]` drive the keyword string. Without
 *    this guard the EN frontmatter (`Sweden, Committee, tabled,
 *    interlocked, …`) leaked into every German / Arabic / Japanese
 *    article and diluted multilingual SERP signal — a hard violation of
 *    `seo-metadata-contract.md` §4 charset budgets.
 *  - The localized H1 + BLUF have already been cascade-merged into
 *    `input.title` + `input.description` by `article-merge.ts` (cascade
 *    chain step #2), so mining those two fields IS mining the localized
 *    executive brief.
 *  - The article-type ID (`committee-reports`, `propositions`, …) is an
 *    English hyphen-slug — we keep the *localized* `articleTypeLabel`
 *    (translated upstream via `article-type-i18n.ts`) but skip the raw
 *    English ID for non-EN languages.
 *  - The canonical-path slug parts (`committeeReports`, `realtime`, …)
 *    are skipped for non-EN languages for the same reason: they are
 *    English subfolder names and would re-introduce the same leak we
 *    just guarded against.
 */
export function buildArticleKeywords(input: ArticleSeoMetadataInput): string {
  const out: string[] = [];
  const seen = new Set<string>();
  const isEnglish = input.lang === 'en';

  // English path keeps the original ordering for backward-compatibility
  // with the existing keyword string (and the EN-only test snapshots).
  if (isEnglish) {
    for (const keyword of (input.keywords ?? '').split(',')) pushKeyword(out, seen, keyword);
  }

  pushKeyword(out, seen, input.articleTypeLabel);
  // The English hyphenated article-type ID is English regardless of
  // `lang` — skip it for non-EN locales so we don't seed EN tokens
  // (`committee reports`, `realtime pulse`) into a non-EN keyword
  // string. The localized `articleTypeLabel` (pushed above) already
  // covers the same semantic ground.
  if (isEnglish) {
    pushKeyword(out, seen, input.articleTypeId.replace(/-/g, ' '));
  }
  // For non-EN locales, surface only the native language name in the
  // keyword string (the English Language-Meta `name`, e.g. `Swedish`,
  // is a leak in `<meta keywords>` under `<html lang="sv">`). For EN
  // we keep both `English` and `English` (a no-op duplicate that the
  // `seen` set collapses).
  if (isEnglish) {
    pushKeyword(out, seen, LANGUAGE_META[input.lang].name);
  }
  pushKeyword(out, seen, LANGUAGE_META[input.lang].nativeName);
  pushKeyword(out, seen, formatPublicationUpdateKeyword(input.date, input.lang));

  if (input.canonicalPath) {
    for (const part of input.canonicalPath.replace(/\.html$/i, '').split(/[/-]+/)) {
      if (/^\d{4}$|^\d{2}$|^[a-z]{2}$/i.test(part)) continue;
      // Canonical path is `news/$DATE-$SUBFOLDER-$LANG.html` — the
      // subfolder segments (`committeeReports`, `realtime`, …) are
      // English slugs. Skip them for non-EN locales so they don't
      // re-seed EN tokens.
      if (!isEnglish) continue;
      pushKeyword(out, seen, part);
    }
  }

  for (const keyword of LANG_CORE_KEYWORDS[input.lang]) pushKeyword(out, seen, keyword);
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
