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
 *
 * **Single-letter exception** — Spanish / Catalan / Portuguese `a`,
 * French `à`, and Swedish `i` are split into a separate
 * {@link TRAILING_SINGLE_LETTER_CONNECTOR_RE} regex without the `i`
 * flag. Without that split, the case-insensitive multi-letter pattern
 * would also match uppercase `A` / `À` / `I` at the end of a real
 * title (`Tax Class A`, `Group A`, `Plan A`, `Article I`, `Section A`,
 * Roman numeral references), silently truncating the most informative
 * trailing token. Single-letter prepositions render in lowercase in
 * every language we ship, so requiring lowercase here is loss-free.
 */
const TRAILING_CONNECTOR_RE =
  /[\s,;:—–-]+(?:and|or|but|with|as|in|of|to|for|on|at|by|from|that|which|who|when|where|while|after|before|the|an|have|has|had|is|are|was|were|will|would|can|may|might|should|must|och|men|eller|med|som|av|till|för|på|att|der|die|das|und|oder|aber|mit|als|für|auf|et|ou|mais|avec|comme|de|pour|en|sur)$/iu;

/**
 * Single-letter trailing connectors — kept case-sensitive (no `i` flag)
 * so titles ending in a bare uppercase initial like `Tax Class A`,
 * `Plan A`, `Section A`, or `Article I` are NOT silently truncated to
 * `Tax Class` / `Plan` / `Section` / `Article`. See the JSDoc on
 * {@link TRAILING_CONNECTOR_RE} for the rationale.
 */
const TRAILING_SINGLE_LETTER_CONNECTOR_RE = /[\s,;:—–-]+(?:à|a|i)$/u;

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

/**
 * Reader-hostile trailing fragments after the last comma — when the
 * word-boundary truncate cuts a list mid-item like
 *   "Sweden's Riksdag closed the week with security, tax authority"
 * the trailing `tax authority` is a bare noun phrase with no verb /
 * predicate and reads as a stub. Step back to the segment **before**
 * the last comma so the title ends on a complete clause.
 *
 * Conservative: only triggers when
 *   - there is a comma in the cut, AND
 *   - the tail (text after the last comma) is short (≤ 30 chars) AND
 *     contains 1–4 words AND has no trailing punctuation, AND
 *   - the preceding segment is itself substantive (≥ 25 chars after
 *     trim), so we never strip a title down to a meaningless fragment.
 *
 * Live cases (audit 2026-05-25):
 *  - "Swedish Riksdag closed the week of 22 May 2026 with a substantial
 *     legislative harvest spanning national security, tax authority…"
 *    → cuts to "… spanning national security…" (drops `tax authority`).
 *  - "Twenty interpellations filed in the 2025/26 riksmöte crystallise
 *     the opposition's pre-election accountability offensive, the…"
 *    → cuts before the trailing comma.
 *
 * Pure function — exported only for testability.
 */
export function stripTrailingCommaStub(text: string): string {
  const lastComma = text.lastIndexOf(',');
  if (lastComma < 0) return text;
  const head = text.slice(0, lastComma).trim();
  const tail = text.slice(lastComma + 1).trim();
  if (head.length < 25) return text;
  if (tail.length === 0 || tail.length > 30) return text;
  // Tail must look like a bare noun phrase: 1-4 words, no terminal
  // punctuation, no connector ending (the connector strip already ran
  // upstream).
  const tailWords = tail.split(/\s+/).filter(Boolean);
  if (tailWords.length < 1 || tailWords.length > 4) return text;
  if (/[.!?…]$/u.test(tail)) return text;
  return head;
}

function trimTrailingConnectors(text: string): string {
  let prev = text;
  for (let i = 0; i < 8; i += 1) {
    const next = prev
      .replace(TRAILING_CONNECTOR_RE, '')
      .replace(TRAILING_SINGLE_LETTER_CONNECTOR_RE, '')
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
  // Two-stage cleanup: first strip dangling connectors / cardinals /
  // hyphenated stubs (TRAILING_CONNECTOR_RE etc.); then step back over
  // any comma-trailing list-item stub that survives the connector
  // strip (live: `… spanning national security, tax authority` →
  // `… spanning national security`). The comma-stub stripper is run
  // after the connector strip so dangling connectors are not mistaken
  // for the bare-noun tail.
  const connectorStripped = trimTrailingConnectors(trimTrailingPunctuation(cut));
  const stripped = trimTrailingConnectors(stripTrailingCommaStub(connectorStripped));
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
 * has already localized into 14 languages — IS the SERP title. Per
 * `seo-metadata-contract.md` §2.1, the title is **always** sourced
 * from the executive brief (`cleanArticleTitle` strips boilerplate;
 * `titleFromBluf` synthesises from BLUF when the H1 is unusable).
 *
 * **No date prefix** (since 2026-05-24, audit on 480-article EN corpus):
 *
 *  - 198/480 (41%) of EN titles shipped with an ugly `"Mon DD, 2026 · "`
 *    prefix that ate ~15 chars of the 70-char SERP budget.
 *  - 143/480 (30%) of EN titles shipped truncated mid-phrase (e.g.
 *    `"Apr 19, 2026 · Deep Inspection HD03231 (Russia · Cyber · Defence ·…"`)
 *    when the bare H1 would have fit the budget cleanly.
 *  - The date is **already** carried by five other signals: the URL
 *    slug (`2026-04-19-deep-inspection-en.html`), `og:article:published_time`,
 *    JSON-LD `datePublished`, the visible page byline, and the SERP's
 *    own auto-rendered date snippet. Forcing the date into `<title>` is
 *    duplicative, destroys precious budget chars, and yields visually
 *    broken truncated titles.
 *  - Reader-friendly newsroom datelines remain on the `<meta description>`
 *    (see {@link buildSeoDescription}) — that's where the convention
 *    belongs.
 *  - Daily-series articles (election-cycle/current, year-ahead, …) that
 *    historically reused identical H1s across dates are now policed at
 *    the content layer (`scripts/check-headline-quality.ts` + brief
 *    generator prompts) — the renderer no longer papers over duplicate
 *    H1s by glue-mounting a date prefix on top.
 *
 * **Per-language SERP budgets** (`seo-metadata-contract.md` §4):
 *
 *  - **Latin LTR** (`en sv da no fi de fr es nl`) — 55-70 chars.
 *  - **RTL** (`ar he`) — 45-60 chars.
 *  - **CJK** (`ja ko zh`) — 30-45 glyphs.
 *
 * **Composition cascade** (richest form first, fall back step by step):
 *
 *  1. `{H1} — Riksdagsmonitor` — story + brand (preferred).
 *  2. `{H1}` — bare story (brand dropped to fit budget).
 *  3. truncated `{H1}` with `…` ellipsis (last-resort).
 *
 * Brand suffix is dropped when the H1 already mentions `Riksdagsmonitor`
 * (avoid duplication). Empty-bracket artefacts left behind by upstream
 * brief-generator template-substitution defects (`( )`, `[ ]`, `{ - }`)
 * are scrubbed by {@link stripEmptyBrackets} before any length /
 * truncation logic runs — see live regression on
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
  // Avoid duplicating the brand when the H1 already mentions it.
  if (/riksdagsmonitor/i.test(base)) {
    if (base.length <= serpTitleBudget) return base;
    return truncateWithinBudget(base, serpTitleBudget);
  }
  // Composition cascade — try the richest form first, fall back step by
  // step until something fits the per-language SERP `hardMax`. Every
  // available char goes to the executive-brief H1; the brand suffix is
  // dropped first because the brand is already conveyed by the canonical
  // URL, `og:site_name`, and the JSON-LD `publisher` block.
  const withBrand = `${base}${SITE_SUFFIX}`;
  if (withBrand.length <= serpTitleBudget) return withBrand;
  if (base.length <= serpTitleBudget) return base;
  // H1 overflows the SERP budget — truncate cleanly with `…` ellipsis.
  // `truncateAtWord` strips dangling connectors / cardinals / hyphenated
  // stubs so the truncation lands on a substantive word boundary.
  return truncateWithinBudget(base, serpTitleBudget);
}

/**
 * Build the SERP `<meta name="description">`. The executive-brief BLUF
 * IS the description — already localized, already story-specific,
 * already in the per-language SERP window for every language thanks to
 * the cascade in `aggregator/seo/description.ts § truncateToSentenceBoundary`.
 *
 * **Per-language SERP budgets** (`seo-metadata-contract.md` §4):
 *
 *  - **Latin LTR** (`en sv da no fi de fr es nl`) — 140-200 chars.
 *  - **RTL** (`ar he`) — 120-170 chars.
 *  - **CJK** (`ja ko zh`) — 70-120 glyphs.
 *
 * The renderer-side cap matters in three fallback paths: (1) when no
 * localized brief exists and the EN description leaks through unchanged,
 * (2) when an agent ships a long `description:` front-matter line that
 * bypasses the cascade, and (3) when a downstream caller invokes
 * `buildSeoMetadata` directly without pre-truncating. Capping at the
 * per-language `hardMax` here closes those three gaps so CJK / RTL
 * pages never overshoot their visual SERP budget regardless of where
 * the description came from.
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
 *
 * **No date dateline** (since 2026-05-24): pre-2026-05-24 this function
 * prepended a localized newsroom dateline (`May 11, 2026 — …`) to every
 * description. The 480-article EN audit showed the dateline burns
 * 15-18 chars of the per-language budget on a signal that's already
 * auto-rendered next to every SERP result, inflates 14 hreflang siblings
 * with locale-varying dates (`May 11, 2026` / `11. Mai 2026` /
 * `2026年5月11日`), and reduces room for the BLUF. Per the title-side
 * rationale (see `buildSeoTitle`), publication date is already carried
 * by the URL slug, `og:article:published_time`, JSON-LD `datePublished`,
 * and the visible page byline. The description now ships the BLUF
 * (truncated to the per-language `hardMax`) with **no** date prefix.
 */

export function buildSeoDescription(input: ArticleSeoMetadataInput): string {
  const base = stripDescriptionMarkup(input.description);
  const { hardMax } = descriptionWindowForLanguage(input.lang);
  if (base.length === 0) return base;
  return truncateWithinBudget(base, hardMax);
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
