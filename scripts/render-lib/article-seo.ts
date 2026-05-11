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

const DESCRIPTION_SOFT_MIN = 145;
const DESCRIPTION_HARD_MAX = 200;
const KEYWORD_MAX = 24;

const CONTEXT_LABELS: Record<Language, {
  readonly edition: string;
  readonly coverage: string;
  readonly sourceLinked: string;
}> = {
  en: { edition: 'English edition', coverage: 'Coverage', sourceLinked: 'source-linked Swedish parliamentary intelligence and OSINT analysis' },
  sv: { edition: 'svensk version', coverage: 'Bevakning', sourceLinked: 'källspårad svensk parlamentarisk underrättelseanalys och OSINT' },
  da: { edition: 'dansk version', coverage: 'Dækning', sourceLinked: 'kildesporbar svensk parlamentarisk efterretning og OSINT-analyse' },
  no: { edition: 'norsk versjon', coverage: 'Dekning', sourceLinked: 'kildesporbar svensk parlamentarisk etterretning og OSINT-analyse' },
  fi: { edition: 'suomenkielinen versio', coverage: 'Kattaus', sourceLinked: 'lähdejäljitettävä Ruotsin parlamentaarinen tiedusteluanalyysi ja OSINT' },
  de: { edition: 'deutsche Ausgabe', coverage: 'Berichterstattung', sourceLinked: 'quellenverknüpfte schwedische Parlamentsaufklärung und OSINT-Analyse' },
  fr: { edition: 'édition française', coverage: 'Couverture', sourceLinked: 'renseignement parlementaire suédois sourcé et analyse OSINT' },
  es: { edition: 'edición en español', coverage: 'Cobertura', sourceLinked: 'inteligencia parlamentaria sueca trazable a fuentes y análisis OSINT' },
  nl: { edition: 'Nederlandse editie', coverage: 'Dekking', sourceLinked: 'brongebonden Zweedse parlementaire inlichtingen en OSINT-analyse' },
  ar: { edition: 'النسخة العربية', coverage: 'تغطية', sourceLinked: 'تحليل استخباراتي برلماني سويدي مرتبط بالمصادر وتحليل OSINT' },
  he: { edition: 'מהדורה עברית', coverage: 'סיקור', sourceLinked: 'מודיעין פרלמנטרי שוודי מקושר למקורות וניתוח OSINT' },
  ja: { edition: '日本語版', coverage: 'カバレッジ', sourceLinked: '出典追跡可能なスウェーデン議会インテリジェンスとOSINT分析' },
  ko: { edition: '한국어판', coverage: '보도', sourceLinked: '출처 추적 가능한 스웨덴 의회 인텔리전스와 OSINT 분석' },
  zh: { edition: '中文版', coverage: '报道', sourceLinked: '可追溯来源的瑞典议会情报与 OSINT 分析' },
};

const CORE_KEYWORDS: readonly string[] = [
  'Riksdagsmonitor',
  'Swedish Parliament',
  'Riksdag',
  'political intelligence',
  'OSINT',
  'Swedish politics',
  'democratic transparency',
];

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

function sentenceJoin(base: string, suffix: string): string {
  const cleanBase = trimTrailingPunctuation(base);
  if (!cleanBase) return suffix;
  return `${cleanBase}. ${suffix}`;
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
 * Build a unique, language-aware title for `<title>`, Open Graph and
 * Twitter Cards. The visible H1 can remain the editorial headline while
 * the SEO title carries the locale + article lens that disambiguate the
 * 14 hreflang siblings in search-engine audits.
 */
export function buildSeoTitle(input: ArticleSeoMetadataInput): string {
  const meta = LANGUAGE_META[input.lang];
  const base = truncateAtWord(input.title, 82);
  const marker = input.lang === 'en'
    ? `${input.articleTypeLabel} ${input.date}`
    : `${meta.nativeName} ${input.articleTypeLabel}`;
  if (base.toLocaleLowerCase().includes(marker.toLocaleLowerCase())) return base;
  return truncateAtWord(`${base} | ${marker}`, 96);
}

/**
 * Build a 145–200 character description where practical. It preserves the
 * article-specific BLUF first, then appends date, article type and locale
 * context so otherwise-identical translated pages no longer share the
 * same search snippet.
 */
export function buildSeoDescription(input: ArticleSeoMetadataInput): string {
  const labels = CONTEXT_LABELS[input.lang];
  const suffix = `${labels.coverage}: ${input.articleTypeLabel}, ${input.date}, ${labels.edition} — ${labels.sourceLinked}.`;
  const base = collapseWhitespace(input.description);
  const maxBase = Math.max(70, DESCRIPTION_HARD_MAX - suffix.length - 1);
  let description = sentenceJoin(truncateAtWord(base, maxBase), suffix);
  if (description.length > DESCRIPTION_HARD_MAX) {
    description = sentenceJoin(truncateAtWord(base, maxBase - 12), suffix);
  }
  if (description.length < DESCRIPTION_SOFT_MIN) {
    const extra = input.lang === 'en'
      ? ' Includes traceable artifacts, methodology notes and official-source provenance.'
      : ` ${LANGUAGE_META[input.lang].nativeName} metadata identifies the article language, source artifacts and parliamentary lens.`;
    description = truncateAtWord(`${description} ${extra}`, DESCRIPTION_HARD_MAX);
  }
  return truncateAtWord(description, DESCRIPTION_HARD_MAX);
}

/**
 * Build article-specific keywords from front-matter, editorial headline,
 * BLUF description, article lens, date and language. This replaces the
 * former global keyword fallback that made many article pages identical.
 */
export function buildArticleKeywords(input: ArticleSeoMetadataInput): string {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const keyword of (input.keywords ?? '').split(',')) pushKeyword(out, seen, keyword);
  pushKeyword(out, seen, input.articleTypeLabel);
  pushKeyword(out, seen, input.articleTypeId.replace(/-/g, ' '));
  pushKeyword(out, seen, input.date);
  pushKeyword(out, seen, LANGUAGE_META[input.lang].name);
  pushKeyword(out, seen, LANGUAGE_META[input.lang].nativeName);
  if (input.canonicalPath) {
    for (const part of input.canonicalPath.replace(/\.html$/i, '').split(/[/-]+/)) {
      if (/^\d{4}$|^\d{2}$|^[a-z]{2}$/i.test(part)) continue;
      pushKeyword(out, seen, part);
    }
  }
  for (const keyword of CORE_KEYWORDS) pushKeyword(out, seen, keyword);
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
