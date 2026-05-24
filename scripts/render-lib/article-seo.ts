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
import {
  descriptionWindowForLanguage,
  titleWindowForLanguage,
} from './aggregator/seo/serp-budgets.js';

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

/**
 * Strip empty bracket pairs left behind by upstream template-substitution
 * defects — e.g. a brief that ships `title: "Next Mandate 2026-2030 ( )"`
 * because a coalition-name placeholder was never filled. Also strips
 * pairs that contain only punctuation / separators (`( - )`, `[…]`,
 * `{ }`). Conservative: matches each bracket family separately so we
 * never delete a legitimate `(party)` annotation.
 */
const EMPTY_BRACKETS_RE = /\s*(?:\(\s*[\s,;:.\-–—…]*\s*\)|\[\s*[\s,;:.\-–—…]*\s*\]|\{\s*[\s,;:.\-–—…]*\s*\})\s*/gu;

function stripEmptyBrackets(text: string): string {
  return text.replace(EMPTY_BRACKETS_RE, ' ');
}

/**
 * Reader-friendly localized short date — used as a SERP-title prefix
 * to disambiguate daily-series articles (Tidö Current Mandate,
 * Post-2026 Mandate Forecast, Year-Ahead Political Intelligence, …)
 * which otherwise ship with identical `<title>` strings across multiple
 * publication dates.
 *
 * Format: localized `{Month} {Day}, {Year}` via `Intl.DateTimeFormat`
 * with the language's BCP-47 primary subtag from
 * {@link LANGUAGE_META.hreflang}. Produces native renderings such as:
 *
 *  - en: `May 6, 2026`
 *  - sv: `6 maj 2026`
 *  - de: `6. Mai 2026`
 *  - fi: `6.5.2026`
 *  - ar: `6 مايو 2026`
 *  - he: `6 במאי 2026`
 *  - ja / zh: `2026年5月6日`
 *  - ko: `2026년 5월 6일`
 *
 * Returns an empty string for malformed / missing dates so callers can
 * skip prefix injection without an extra null check.
 */
function formatLocalizedShortDate(isoDate: string, lang: Language): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(isoDate);
  if (!match) return '';
  const [, yy, mm, dd] = match;
  const year = Number(yy);
  const month = Number(mm);
  const day = Number(dd);
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utc.getTime())) return '';
  try {
    const locale = LANGUAGE_META[lang]?.hreflang ?? 'en';
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(utc);
  } catch {
    return isoDate;
  }
}

/** Separator between the localized date prefix and the article title. */
const DATE_PREFIX_SEPARATOR = ' · ';

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

/**
 * Dangling cardinal / ordinal numerals left at the end of a truncated
 * title — `truncateAtWord` happily cuts at a word boundary after a
 * cardinal, producing reader-hostile prose like
 *
 *   "Sweden Passes AI Facial Recognition Law as Riksdag Advances Five…"
 *
 * The cardinal "Five" carries no semantic value once the noun it modified
 * ("Five Committee Reports") has been chopped off. Strip trailing
 * cardinals / ordinals in the major languages we ship: EN + SV + DA + NO
 * + DE + FR + ES + NL + FI. Numerals 1–12 plus common round numbers
 * (twenty, fifty, hundred) cover the practical cases seen in audit
 * #26364730339; we only strip when preceded by a space + leading
 * separator so we never eat a numeral that is the title's only token
 * (e.g. a chart-only headline like "Top 5").
 *
 * The aggregator's EN trailing-connector list never strips numerals so
 * upstream cuts ending in a cardinal still leak through to the renderer
 * — this regex is the second line of defence.
 */
const TRAILING_DANGLING_CARDINAL_RE =
  /[\s,;:—–-]+(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|million|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv|tjugo|trettio|fyrtio|femtio|hundra|tusen|miljon|to|tre|fire|fem|seks|syv|otte|ni|ti|elleve|tolv|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|cent|mille|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|veinte|treinta|cuarenta|cincuenta|cien|mil|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf|twintig|dertig|veertig|vijftig|honderd|duizend|kaksi|kolme|neljä|viisi|kuusi|seitsemän|kahdeksan|yhdeksän|kymmenen|kaksitoista|kaksikymmentä|kolmekymmentä|sata|tuhat)$/iu;

/**
 * Dangling token that ends with a hyphen — `truncateAtWord` slicing at
 * a word boundary inside a hyphenated compound noun leaves trailing
 * stubs like `Civil-Liberties` (when the original was `Civil-Liberties
 * Backlash`). The hyphen is a strong reader signal that more text was
 * lost; strip the whole compound token plus its leading separator.
 *
 * Conservative: only strips tokens whose **last character before the
 * boundary** is a hyphen (`-`). Compound nouns that survived the cut
 * intact (e.g. `Civil-Liberties Backlash` → "Civil-Liberties") are
 * never matched because they end on a letter.
 */
const TRAILING_HYPHENATED_STUB_RE = /[\s,;:—–]+\S*-$/u;

function trimTrailingConnectors(text: string): string {
  let prev = text;
  for (let i = 0; i < 8; i += 1) {
    const next = prev
      .replace(TRAILING_CONNECTOR_RE, '')
      .replace(TRAILING_DANGLING_CARDINAL_RE, '')
      .replace(TRAILING_HYPHENATED_STUB_RE, '')
      .replace(/[\s,;:—–-]+$/u, '')
      .trim();
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
    // Strip trailing dangling hyphens/dashes — upstream extractors that
    // split on punctuation can leave incomplete tokens like
    // `"WEO Apr-"` (truncated from "WEO Apr-Jun") or `"Core Tid-"`.
    // The dangling hyphen is a strong reader-hostile signal that the
    // token is incomplete; strip the hyphen and re-trim.
    .replace(/[-–—]+\s*$/u, '')
    .trim();
}

/**
 * Detect keyword tokens that survived the punctuation strip with an
 * **isolated single-letter `s` in the middle** — the apostrophe-strip
 * leftover from possessive prose like `"L's NATO Push"`, `"Sweden's
 * Tidö Pact"`, `"Lotta Edholm's Reform"`. After `normaliseKeyword`
 * strips the apostrophe, these collapse to `"L s NATO"`, `"Sweden s
 * Tidö"`, `"Lotta Edholm s"` — reader-hostile and SERP-useless.
 *
 * The filter is intentionally narrow: it only rejects the token when
 * the keyword contains 2+ words AND one of them is a solitary `s`.
 * That preserves legitimate single-letter party codes (`S`,
 * `V`, `M`, `C`, `L`, …) which always ship as standalone tokens.
 */
function isKeywordDebris(keyword: string): boolean {
  if (keyword.length < 2) return true;
  // Solitary `s` between word-boundaries (anywhere in the token) when
  // the keyword has multiple words. Catches "L s NATO", "Sweden s Tid",
  // "Lotta Edholm s" — never matches standalone "S" party code (single
  // word, length 1, already rejected by the length check above).
  if (/\s/.test(keyword) && /(?:^|\s)s(?:$|\s)/i.test(keyword)) return true;
  return false;
}

function pushKeyword(out: string[], seen: Set<string>, raw: string): void {
  const keyword = normaliseKeyword(raw);
  if (keyword.length < 2) return;
  if (isKeywordDebris(keyword)) return;
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
 * has already localized into 14 languages — IS the context. The
 * renderer prepends a reader-friendly **localized date** prefix
 * (`{Localized Date} · {H1}`) so daily-series articles never ship
 * identical `<title>` strings across multiple publication dates.
 *
 * **Date prefix format** ({@link formatLocalizedShortDate}):
 *
 *  - en: `May 6, 2026 · …`
 *  - sv: `6 maj 2026 · …`
 *  - de: `6. Mai 2026 · …`
 *  - fi: `6.5.2026 · …`
 *  - ar / he: `6 مايو 2026 · …` / `6 במאי 2026 · …` (RTL-safe via Intl)
 *  - ja / zh: `2026年5月6日 · …`
 *  - ko: `2026년 5월 6일 · …`
 *
 * The `Intl.DateTimeFormat` short-month-year format produces 8-11 chars
 * across all 14 locales, well inside the per-language SERP budget.
 *
 * **Per-language SERP budgets** (since 2026-05-24, `seo-metadata-contract.md` §4):
 *
 *  - **Latin LTR** (`en sv da no fi de fr es nl`) — 55-70 chars.
 *  - **RTL** (`ar he`) — 45-60 chars.
 *  - **CJK** (`ja ko zh`) — 30-45 glyphs.
 *
 * **Composition cascade** (richest form first, fall back step by step):
 *
 *  1. `{Date} · {H1} — Riksdagsmonitor` — date prefix + story + brand.
 *  2. `{Date} · {H1}` — date prefix + story (brand dropped).
 *  3. `{H1} — Riksdagsmonitor` — story + brand (date prefix dropped).
 *  4. `{H1}` — story only.
 *  5. truncated `{H1}` with `…` ellipsis.
 *
 * Date prefix beats brand suffix in the cascade because the brand is
 * already conveyed by the canonical URL, `og:site_name`, and the JSON-LD
 * `publisher` block — while the date is the unique disambiguator across
 * the daily article series. When the H1 itself already mentions
 * `Riksdagsmonitor` we skip the brand suffix entirely.
 *
 * Empty-bracket artefacts left behind by upstream brief-generator
 * template-substitution defects (`( )`, `[ ]`, `{ - }`) are scrubbed
 * by {@link stripEmptyBrackets} before any length / truncation logic
 * runs — see live regression on
 * `analysis/daily/2026-05-08/election-cycle/next/article.md` which
 * shipped `title: "Post-2026 Coalition: Next Mandate 2026-2030 ( )"`.
 */
export function buildSeoTitle(input: ArticleSeoMetadataInput): string {
  const serpTitleBudget = titleWindowForLanguage(input.lang).hardMax;
  const SITE_SUFFIX = ' — Riksdagsmonitor';
  // Pre-process: strip empty-bracket placeholders (e.g. `Next Mandate 2026-2030 ( )`
  // from upstream brief generators that fail to substitute coalition-name
  // placeholders) before any length / truncation logic runs.
  const base = collapseWhitespace(stripEmptyBrackets(input.title));
  if (base.length === 0) {
    // Empty title — synthesise from article-type label + brand.
    const fallback = `${input.articleTypeLabel}${SITE_SUFFIX}`;
    return truncateWithinBudget(fallback, serpTitleBudget);
  }
  // Compute a reader-friendly localized date prefix. Daily-series article
  // types (election-cycle/current, election-cycle/next, year-ahead, …)
  // ship identical H1s across multiple dates — without the date prefix
  // the SERP `<title>` would collide across distinct canonical URLs and
  // search engines pick a single representative, suppressing the rest.
  // The prefix is dropped when the title already mentions the localized
  // date verbatim, or when the budget cannot fit it.
  const localizedDate = formatLocalizedShortDate(input.date, input.lang);
  const baseAlreadyMentionsDate = localizedDate.length > 0 && base.includes(localizedDate);
  const datePrefix = localizedDate && !baseAlreadyMentionsDate
    ? `${localizedDate}${DATE_PREFIX_SEPARATOR}`
    : '';

  // Avoid duplicating the brand when the H1 already mentions it. The
  // date prefix is still useful here for daily-series uniqueness.
  if (/riksdagsmonitor/i.test(base)) {
    const withDate = `${datePrefix}${base}`;
    if (withDate.length <= serpTitleBudget) return withDate;
    if (base.length <= serpTitleBudget) return base;
    return truncateWithinBudget(base, serpTitleBudget);
  }
  // Composition cascade — try the richest form first, fall back step by
  // step until something fits the per-language SERP `hardMax`. Date
  // prefix beats brand suffix for uniqueness when only one fits because
  // the brand is already conveyed by the canonical URL, `og:site_name`,
  // and the JSON-LD `publisher` block while the date is the unique
  // disambiguator across the daily article series.
  const withDateAndBrand = `${datePrefix}${base}${SITE_SUFFIX}`;
  if (withDateAndBrand.length <= serpTitleBudget) return withDateAndBrand;
  const withDate = `${datePrefix}${base}`;
  if (datePrefix.length > 0 && withDate.length <= serpTitleBudget) return withDate;
  // Branded variant fits the SERP budget — ship the story + brand.
  if (base.length + SITE_SUFFIX.length <= serpTitleBudget) {
    return `${base}${SITE_SUFFIX}`;
  }
  // Date prefix present but `{Date} · {H1}` overflows AND `{H1} — Brand`
  // overflows. Truncate the H1 to fit alongside the date so we keep the
  // uniqueness signal (date) at the cost of a few H1 characters. Without
  // this step, daily-series articles sharing an identical H1 across
  // different dates would all ship the bare H1 and collide on the SERP.
  if (datePrefix.length > 0) {
    const h1Budget = serpTitleBudget - datePrefix.length;
    if (h1Budget >= 16) {
      // Sanity floor: refuse to ship a date prefix with an H1 shorter
      // than 16 chars (would look like `May 24, 2026 · Tidö…` — useless).
      // 16 ≈ shortest reader-meaningful H1 fragment after ellipsis.
      return `${datePrefix}${truncateWithinBudget(base, h1Budget)}`;
    }
  }
  // H1 alone fits the SERP budget — drop the brand suffix so the story
  // title is the SERP signal (brand is already covered by `og:site_name`
  // and the canonical URL).
  if (base.length <= serpTitleBudget) return base;
  // H1 overflows the SERP budget — truncate cleanly and ship without
  // brand suffix so every available char goes to the story.
  return truncateWithinBudget(base, serpTitleBudget);
}

/**
 * Build the SERP `<meta name="description">`. The executive-brief BLUF
 * IS the description — already localized, already story-specific,
 * already in the per-language SERP window for every language thanks to
 * the cascade in `aggregator/seo/description.ts § truncateToSentenceBoundary`.
 *
 * **Reader-friendly newsroom dateline prefix** (since 2026-05-24):
 * The BLUF is preceded by a localized short date in the universal
 * newsroom dateline format `"{Date} — {BLUF}"` (e.g.
 * `"May 24, 2026 — Sweden's Riksdag closed the week …"`). This serves
 * two purposes:
 *
 *  1. **Reader signal** — newsroom datelines (`AP — `, `LONDON — `,
 *     `May 24 — `) are the single most-recognised "this is news"
 *     formatting convention across every Western news brand (Reuters,
 *     AP, BBC, Bloomberg, NYT, FT, …). The reader instantly knows the
 *     story's date before scanning the body.
 *  2. **Uniqueness signal** — daily-series articles
 *     (election-cycle/current, election-cycle/next, year-ahead, …)
 *     historically shipped identical BLUFs across multiple dates
 *     because the executive-brief generator reused stale briefs. The
 *     date prefix differentiates the SERP snippet across the corpus
 *     even when the BLUF body has not been refreshed.
 *
 * The prefix is **skipped** when:
 *  - the BLUF already starts with the localized date verbatim, or
 *  - the BLUF is empty.
 *
 * The prefix is **localized via the same {@link formatLocalizedShortDate}
 * helper as the title** so all 14 languages render reader-friendly
 * short dates (e.g. `sv: 6 maj 2026`, `de: 6. Mai 2026`, `ja: 2026年5月6日`,
 * `ar: 6 مايو 2026`).
 *
 * **Per-language SERP budgets** (since 2026-05-24, `seo-metadata-contract.md` §4):
 *
 *  - **Latin LTR** (`en sv da no fi de fr es nl`) — 140-200 chars.
 *  - **RTL** (`ar he`) — 120-170 chars.
 *  - **CJK** (`ja ko zh`) — 70-120 glyphs.
 *
 * Pre-2026-05-24 this function used the EN 200-char hard max uniformly
 * across all 14 languages. The upstream cascade already truncates to
 * the correct per-language window when a localized executive-brief
 * exists, but this renderer-side cap also matters in three fallback
 * paths: (1) when no localized brief exists and the EN description
 * leaks through unchanged, (2) when an agent ships a long
 * `description:` front-matter line that bypasses the cascade, and (3)
 * when a downstream caller invokes `buildSeoMetadata` directly without
 * pre-truncating. Capping at the per-language `hardMax` here closes
 * those three gaps so CJK / RTL pages never overshoot their visual SERP
 * budget regardless of where the description came from.
 *
 * We never append `Coverage: <Type> on <topic>; <lang> edition update
 * for <date> with Riksdag/OSINT provenance.` boilerplate because:
 *
 *  - It duplicates words already in the BLUF.
 *  - It collapses 14 hreflang siblings to near-identical snippets that
 *    only vary by the `Coverage:` translation — defeating the point of
 *    per-language BLUFs.
 *  - Search engines silently truncate beyond the per-language hardMax,
 *    so the boilerplate often replaced the actual analytical context
 *    with editorial plumbing.
 */
const DESCRIPTION_DATELINE_SEPARATOR = ' — ';

export function buildSeoDescription(input: ArticleSeoMetadataInput): string {
  const base = stripDescriptionMarkup(input.description);
  const { hardMax } = descriptionWindowForLanguage(input.lang);
  if (base.length === 0) return base;

  // Try to prepend a newsroom dateline. Skip when the BLUF already
  // begins with the localized date (rare — most BLUFs lead with an
  // analytic claim, not a date — but we honour any upstream prefix).
  const localizedDate = formatLocalizedShortDate(input.date, input.lang);
  if (localizedDate.length === 0) return truncateWithinBudget(base, hardMax);
  if (base.startsWith(localizedDate)) return truncateWithinBudget(base, hardMax);

  const prefix = `${localizedDate}${DESCRIPTION_DATELINE_SEPARATOR}`;
  // Budget the BLUF body to fit alongside the dateline. Floor at 40
  // chars so we never ship a dateline with a useless one-word BLUF
  // (e.g. `"May 24, 2026 — Brief…"`). 40 ≈ shortest reader-meaningful
  // BLUF fragment.
  const bodyBudget = hardMax - prefix.length;
  if (bodyBudget < 40) {
    // Budget too tight (CJK 70-char window + ~10-char prefix leaves 60
    // — still fine; but a defensive floor keeps us safe if budgets
    // shrink). Fall back to ship the bare BLUF.
    return truncateWithinBudget(base, hardMax);
  }
  const body = truncateWithinBudget(base, bodyBudget);
  return `${prefix}${body}`;
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
