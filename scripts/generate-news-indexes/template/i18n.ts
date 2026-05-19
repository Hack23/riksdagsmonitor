/**
 * @module generate-news-indexes/template/i18n
 * @description Localised label bundles + helpers for the news-index template.
 *
 * The label tables live here (not in `../constants.ts`) so we don't need to
 * synchronously migrate the `LanguageConfig.i18n` interface and every entry.
 * Each helper falls back to English when a language is missing.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';

/** Localised "Clear filters" label per language. */
export const CLEAR_FILTERS_LABELS: Readonly<Record<string, string>> = {
  en: 'Clear filters',
  sv: 'Rensa filter',
  da: 'Ryd filtre',
  no: 'Tøm filtre',
  fi: 'Tyhjennä suodattimet',
  de: 'Filter zurücksetzen',
  fr: 'Effacer les filtres',
  es: 'Borrar filtros',
  nl: 'Filters wissen',
  ar: 'مسح الفلاتر',
  he: 'נקה מסננים',
  ja: 'フィルタをクリア',
  ko: '필터 지우기',
  zh: '清除筛选',
};

/** Localised recency-badge labels (today / this-week / this-month). */
export const RECENCY_LABELS: Readonly<Record<string, Readonly<Record<'today' | 'this-week' | 'this-month', string>>>> = {
  en: { 'today': 'Today', 'this-week': 'This week', 'this-month': 'This month' },
  sv: { 'today': 'Idag', 'this-week': 'Denna vecka', 'this-month': 'Denna månad' },
  da: { 'today': 'I dag', 'this-week': 'Denne uge', 'this-month': 'Denne måned' },
  no: { 'today': 'I dag', 'this-week': 'Denne uken', 'this-month': 'Denne måneden' },
  fi: { 'today': 'Tänään', 'this-week': 'Tällä viikolla', 'this-month': 'Tässä kuussa' },
  de: { 'today': 'Heute', 'this-week': 'Diese Woche', 'this-month': 'Diesen Monat' },
  fr: { 'today': "Aujourd'hui", 'this-week': 'Cette semaine', 'this-month': 'Ce mois-ci' },
  es: { 'today': 'Hoy', 'this-week': 'Esta semana', 'this-month': 'Este mes' },
  nl: { 'today': 'Vandaag', 'this-week': 'Deze week', 'this-month': 'Deze maand' },
  ar: { 'today': 'اليوم', 'this-week': 'هذا الأسبوع', 'this-month': 'هذا الشهر' },
  he: { 'today': 'היום', 'this-week': 'השבוע', 'this-month': 'החודש' },
  ja: { 'today': '今日', 'this-week': '今週', 'this-month': '今月' },
  ko: { 'today': '오늘', 'this-week': '이번 주', 'this-month': '이번 달' },
  zh: { 'today': '今天', 'this-week': '本周', 'this-month': '本月' },
};

/** Localised hero-metric labels (articles / languages / latest / pipeline). */
export const HERO_METRIC_LABELS: Readonly<Record<string, Readonly<Record<'articles' | 'languages' | 'latest' | 'pipeline', string>>>> = {
  en: { articles: 'Articles indexed', languages: 'Languages', latest: 'Latest update', pipeline: 'Agentic newsroom' },
  sv: { articles: 'Indexerade artiklar', languages: 'Språk', latest: 'Senaste uppdatering', pipeline: 'Agentbaserad redaktion' },
  da: { articles: 'Indekserede artikler', languages: 'Sprog', latest: 'Seneste opdatering', pipeline: 'Agentisk redaktion' },
  no: { articles: 'Indekserte artikler', languages: 'Språk', latest: 'Siste oppdatering', pipeline: 'Agentbasert redaksjon' },
  fi: { articles: 'Indeksoidut artikkelit', languages: 'Kielet', latest: 'Viimeisin päivitys', pipeline: 'Agenttipohjainen toimitus' },
  de: { articles: 'Indexierte Artikel', languages: 'Sprachen', latest: 'Letzte Aktualisierung', pipeline: 'Agentische Redaktion' },
  fr: { articles: 'Articles indexés', languages: 'Langues', latest: 'Dernière mise à jour', pipeline: 'Rédaction agentique' },
  es: { articles: 'Artículos indexados', languages: 'Idiomas', latest: 'Última actualización', pipeline: 'Redacción agéntica' },
  nl: { articles: 'Geïndexeerde artikelen', languages: 'Talen', latest: 'Laatste update', pipeline: 'Agentische redactie' },
  ar: { articles: 'مقالات مفهرسة', languages: 'لغات', latest: 'آخر تحديث', pipeline: 'غرفة أخبار وكيلة' },
  he: { articles: 'מאמרים באינדקס', languages: 'שפות', latest: 'עדכון אחרון', pipeline: 'מערכת סוכנים' },
  ja: { articles: '索引済み記事', languages: '言語', latest: '最新更新', pipeline: 'エージェント newsroom' },
  ko: { articles: '색인된 기사', languages: '언어', latest: '최신 업데이트', pipeline: '에이전트 뉴스룸' },
  zh: { articles: '已索引文章', languages: '语言', latest: '最新更新', pipeline: '代理新闻室' },
};

/** Resolve the localised "Clear filters" label for the given language. */
export function localizeClearFilters(langKey: string): string {
  return CLEAR_FILTERS_LABELS[langKey] ?? CLEAR_FILTERS_LABELS.en!;
}

/** Build the localised recency label map (today / this-week / this-month). */
export function buildRecencyLabels(langKey: string): Record<string, string> {
  const map = RECENCY_LABELS[langKey] ?? RECENCY_LABELS.en!;
  return {
    'today': map['today'],
    'this-week': map['this-week'],
    'this-month': map['this-month'],
  };
}

/** Resolve the localised hero-metric labels (with EN fallback). */
export function heroMetricLabels(langKey: string): Readonly<Record<'articles' | 'languages' | 'latest' | 'pipeline', string>> {
  return HERO_METRIC_LABELS[langKey] ?? HERO_METRIC_LABELS.en!;
}

/** Map a news-index `langKey` to a `Language` accepted by `buildChrome`. */
export function toChromeLang(langKey: string): Language {
  return langKey as Language;
}

/** Map a CLDR-style code to its canonical BCP-47 equivalent (no → nb). */
export function toBcp47(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  return code === 'no' ? 'nb' : code;
}
