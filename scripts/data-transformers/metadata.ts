/**
 * @module data-transformers/metadata
 * @description SEO metadata generation, reading-time calculation,
 * source attribution, and content-title generation for articles.
 * Handles keyword localisation across 14 supported languages.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../html-utils.js';
import type { Language } from '../types/language.js';
import type { ArticleMetadata, ArticleType } from '../types/article.js';
import type { ArticleContentData, RawDocument } from './types.js';
import { L } from './helpers.js';

/**
 * SEO keyword translations for all 14 supported languages.
 * Maps English keyword strings to their localized equivalents.
 * Used by generateMetadata() to produce language-specific keyword lists.
 */
const SEO_KEYWORD_TRANSLATIONS: Record<string, Partial<Record<Language, string>>> = {
  'parliament':      { sv: 'riksdag', da: 'parlament', no: 'parlament', fi: 'eduskunta', de: 'parlament', fr: 'parlement', es: 'parlamento', nl: 'parlement', ar: 'برلمان', he: 'פרלמנט', ja: '議会', ko: '의회', zh: '议会' },
  'Swedish Parliament': { sv: 'Riksdagen', da: 'Svensk Parlament', no: 'Svensk Parlament', fi: 'Ruotsin Eduskunta', de: 'Schwedisches Parlament', fr: 'Parlement Suédois', es: 'Parlamento Sueco', nl: 'Zweeds Parlement', ar: 'البرلمان السويدي', he: 'הפרלמנט השבדי', ja: 'スウェーデン議会', ko: '스웨덴 의회', zh: '瑞典议会' },
  'Sweden':          { sv: 'Sverige', da: 'Sverige', no: 'Sverige', fi: 'Ruotsi', de: 'Schweden', fr: 'Suède', es: 'Suecia', nl: 'Zweden', ar: 'السويد', he: 'שבדיה', ja: 'スウェーデン', ko: '스웨덴', zh: '瑞典' },
  'politics':        { sv: 'politik', da: 'politik', no: 'politikk', fi: 'politiikka', de: 'politik', fr: 'politique', es: 'política', nl: 'politiek', ar: 'سياسة', he: 'פוליטיקה', ja: '政治', ko: '정치', zh: '政治' },
  'week ahead':      { sv: 'veckan framåt', da: 'ugen forude', no: 'uken fremover', fi: 'tuleva viikko', de: 'kommende woche', fr: 'semaine à venir', es: 'semana próxima', nl: 'week vooruit', ar: 'الأسبوع القادم', he: 'השבוע הקרוב', ja: '来週の展望', ko: '다음 주', zh: '下周展望' },
  'month ahead':     { sv: 'månaden framåt', da: 'måneden forude', no: 'måneden fremover', fi: 'tuleva kuukausi', de: 'kommender monat', fr: 'mois à venir', es: 'mes próximo', nl: 'maand vooruit', ar: 'الشهر القادم', he: 'החודש הקרוב', ja: '来月の展望', ko: '다음 달', zh: '下月展望' },
  'calendar':        { sv: 'kalender', da: 'kalender', no: 'kalender', fi: 'kalenteri', de: 'kalender', fr: 'calendrier', es: 'calendario', nl: 'kalender', ar: 'تقويم', he: 'לוח שנה', ja: 'カレンダー', ko: '일정', zh: '日历' },
  'events':          { sv: 'händelser', da: 'begivenheder', no: 'hendelser', fi: 'tapahtumat', de: 'ereignisse', fr: 'événements', es: 'eventos', nl: 'evenementen', ar: 'أحداث', he: 'אירועים', ja: '出来事', ko: '이벤트', zh: '事件' },
  'committee':       { sv: 'utskott', da: 'udvalg', no: 'komité', fi: 'valiokunta', de: 'ausschuss', fr: 'commission', es: 'comisión', nl: 'commissie', ar: 'لجنة', he: 'ועדה', ja: '委員会', ko: '위원회', zh: '委员会' },
  'committees':      { sv: 'utskott', da: 'udvalg', no: 'komiteer', fi: 'valiokunnat', de: 'ausschüsse', fr: 'commissions', es: 'comisiones', nl: 'commissies', ar: 'لجان', he: 'ועדות', ja: '委員会', ko: '위원회들', zh: '委员会' },
  'reports':         { sv: 'betänkanden', da: 'betænkninger', no: 'innstillinger', fi: 'mietinnöt', de: 'berichte', fr: 'rapports', es: 'informes', nl: 'rapporten', ar: 'تقارير', he: 'דוחות', ja: '報告書', ko: '보고서', zh: '报告' },
  'betänkanden':     { sv: 'betänkanden', da: 'betænkninger', no: 'innstillinger', fi: 'mietinnöt', de: 'parlamentsberichte', fr: 'rapports parlementaires', es: 'informes parlamentarios', nl: 'parlementaire rapporten', ar: 'تقارير برلمانية', he: 'דוחות פרלמנטריים', ja: '議会報告書', ko: '의회 보고서', zh: '议会报告' },
  'government':      { sv: 'regering', da: 'regering', no: 'regjering', fi: 'hallitus', de: 'regierung', fr: 'gouvernement', es: 'gobierno', nl: 'regering', ar: 'حكومة', he: 'ממשלה', ja: '政府', ko: '정부', zh: '政府' },
  'propositions':    { sv: 'propositioner', da: 'lovforslag', no: 'proposisjoner', fi: 'esitykset', de: 'gesetzentwürfe', fr: 'propositions de loi', es: 'proposiciones', nl: 'wetsvoorstellen', ar: 'مقترحات', he: 'הצעות חוק', ja: '法律案', ko: '법률안', zh: '提案' },
  'legislation':     { sv: 'lagstiftning', da: 'lovgivning', no: 'lovgivning', fi: 'lainsäädäntö', de: 'gesetzgebung', fr: 'législation', es: 'legislación', nl: 'wetgeving', ar: 'تشريع', he: 'חקיקה', ja: '立法', ko: '법률', zh: '立法' },
  'motions':         { sv: 'motioner', da: 'forslag', no: 'forslag', fi: 'aloitteet', de: 'anträge', fr: 'motions', es: 'mociones', nl: 'moties', ar: 'اقتراحات', he: 'הצעות', ja: '動議', ko: '동의', zh: '动议' },
  'opposition':      { sv: 'opposition', da: 'opposition', no: 'opposisjon', fi: 'oppositio', de: 'opposition', fr: 'opposition', es: 'oposición', nl: 'oppositie', ar: 'معارضة', he: 'אופוזיציה', ja: '野党', ko: '야당', zh: '反对派' },
  'proposals':       { sv: 'förslag', da: 'forslag', no: 'forslag', fi: 'ehdotukset', de: 'vorschläge', fr: 'propositions', es: 'propuestas', nl: 'voorstellen', ar: 'مقترحات', he: 'הצעות', ja: '提案', ko: '제안', zh: '提案' },
  'outlook':         { sv: 'utsikter', da: 'udsigt', no: 'utsikter', fi: 'näkymät', de: 'ausblick', fr: 'perspectives', es: 'perspectivas', nl: 'vooruitzichten', ar: 'توقعات', he: 'תחזית', ja: '見通し', ko: '전망', zh: '展望' },
  'weekly review':   { sv: 'veckans sammanfattning', da: 'ugentlig gennemgang', no: 'ukentlig gjennomgang', fi: 'viikkokatsaus', de: 'wochenbericht', fr: 'bilan hebdomadaire', es: 'revisión semanal', nl: 'wekelijks overzicht', ar: 'مراجعة أسبوعية', he: 'סקירה שבועית', ja: '週間レビュー', ko: '주간 리뷰', zh: '每周回顾' },
  'monthly review':  { sv: 'månadens sammanfattning', da: 'månedlig gennemgang', no: 'månedlig gjennomgang', fi: 'kuukausikatsaus', de: 'monatsbericht', fr: 'bilan mensuel', es: 'revisión mensual', nl: 'maandelijks overzicht', ar: 'مراجعة شهرية', he: 'סקירה חודשית', ja: '月間レビュー', ko: '월간 리뷰', zh: '每月回顾' },
  'analysis':        { sv: 'analys', da: 'analyse', no: 'analyse', fi: 'analyysi', de: 'analyse', fr: 'analyse', es: 'análisis', nl: 'analyse', ar: 'تحليل', he: 'ניתוח', ja: '分析', ko: '분석', zh: '分析' },
  'recap':           { sv: 'sammanfattning', da: 'resumé', no: 'oppsummering', fi: 'yhteenveto', de: 'zusammenfassung', fr: 'récapitulatif', es: 'resumen', nl: 'samenvatting', ar: 'ملخص', he: 'סיכום', ja: 'まとめ', ko: '요약', zh: '总结' },
  'breaking news':   { sv: 'senaste nytt', da: 'seneste nyt', no: 'siste nytt', fi: 'viimeisimmät uutiset', de: 'Eilmeldung', fr: 'dernières nouvelles', es: 'noticias de última hora', nl: 'laatste nieuws', ar: 'أخبار عاجلة', he: 'חדשות אחרונות', ja: '速報', ko: '속보', zh: '突发新闻' },
  'urgent':          { sv: 'brådskande', da: 'presserende', no: 'haster', fi: 'kiireellinen', de: 'dringend', fr: 'urgent', es: 'urgente', nl: 'dringend', ar: 'عاجل', he: 'דחוף', ja: '緊急', ko: '긴급', zh: '紧急' },
  'alert':           { sv: 'varning', da: 'advarsel', no: 'varsel', fi: 'hälytys', de: 'warnung', fr: 'alerte', es: 'alerta', nl: 'waarschuwing', ar: 'تنبيه', he: 'התראה', ja: '警告', ko: '경보', zh: '警告' },
  'debates':         { sv: 'debatter', da: 'debatter', no: 'debatter', fi: 'keskustelut', de: 'debatten', fr: 'débats', es: 'debates', nl: 'debatten', ar: 'مناقشات', he: 'דיונים', ja: '討論', ko: '토론', zh: '辩论' },
};

/** Return the localized form of an SEO keyword for the given language (falls back to English). */
function localizeKeyword(keyword: string, lang: Language): string {
  if (lang === 'en') return keyword;
  return SEO_KEYWORD_TRANSLATIONS[keyword]?.[lang] ?? keyword;
}

/**
 * Generate article metadata
 */
export function generateMetadata(data: ArticleContentData, type: ArticleType | string, lang: Language = 'en'): ArticleMetadata {
  const keywords: string[] = [];
  const topics: string[] = [];
  const tags: string[] = [];
  const kw = (k: string): string => localizeKeyword(k, lang);

  // Add type-specific keywords
  switch (type) {
    case 'week-ahead':
      keywords.push(kw('parliament'), kw('week ahead'), kw('calendar'), kw('events'));
      topics.push('parliament');
      {
        const tagVal = L(lang, 'weekAhead');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'committee-reports':
      keywords.push(kw('committee'), kw('reports'), kw('betänkanden'), kw('parliament'));
      topics.push('committees', 'reports');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'propositions':
      keywords.push(kw('government'), kw('propositions'), kw('parliament'), kw('legislation'));
      topics.push('government', 'legislation');
      {
        const tagVal = L(lang, 'govPropsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'motions':
      keywords.push(kw('motions'), kw('opposition'), kw('parliament'), kw('proposals'));
      topics.push('parliament', 'opposition');
      {
        const tagVal = L(lang, 'oppMotionsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'month-ahead':
      keywords.push(kw('parliament'), kw('month ahead'), kw('calendar'), kw('outlook'));
      topics.push('parliament', 'outlook');
      {
        const tagVal = L(lang, 'weekAhead');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'weekly-review':
      keywords.push(kw('parliament'), kw('weekly review'), kw('analysis'), kw('recap'));
      topics.push('parliament', 'review');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'monthly-review':
      keywords.push(kw('parliament'), kw('monthly review'), kw('analysis'), kw('recap'));
      topics.push('parliament', 'review');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'breaking':
      keywords.push(kw('breaking news'), kw('parliament'), kw('urgent'), kw('alert'));
      topics.push('breaking', 'parliament');
      break;
  }

  // Extract additional keywords from data
  if (data.events) {
    keywords.push(kw('calendar'), kw('events'), kw('debates'));
  }
  if (data.reports) {
    keywords.push(kw('committees'), kw('reports'));
  }

  // Add common keywords
  keywords.push(kw('Swedish Parliament'), 'Riksdag', kw('politics'), kw('Sweden'));

  return {
    keywords: keywords.slice(0, 15),
    topics: topics.slice(0, 5),
    tags: tags.slice(0, 10)
  };
}

/**
 * Calculate estimated read time
 */
export function calculateReadTime(content: string): string {
  // Remove HTML tags for word count
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).length;

  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(words / 200);

  return `${minutes} min read`;
}

/**
 * Policy domain keywords (Swedish) for extracting themes from parliamentary documents.
 * Scans `titel`, `rubrik`, `summary`, and `notis` fields for these terms.
 */
const POLICY_DOMAIN_KEYWORDS: Record<string, string[]> = {
  energy:      ['energi', 'elproduktion', 'kärnkraft', 'förnybar', 'vindkraft', 'solenergi'],
  environment: ['miljö', 'klimat', 'utsläpp', 'naturvård', 'avfall', 'biologisk'],
  housing:     ['bostäder', 'hyra', 'fastighet', 'byggande', 'bostadsmark', 'bostadsbrist'],
  defense:     ['försvar', 'militär', 'nato', 'säkerhetspolitik', 'försvarsutgifter'],
  healthcare:  ['sjukvård', 'hälso', 'omsorg', 'läkemedel', 'primärvård'],
  education:   ['utbildning', 'skola', 'högskola', 'forskning', 'gymnasium'],
  economy:     ['skatt', 'budget', 'ekonomi', 'finans', 'moms', 'konjunktur'],
  migration:   ['migration', 'asyl', 'flyktingar', 'invandrare', 'uppehållstillstånd'],
  justice:     ['brott', 'rättsväsende', 'polis', 'straff', 'kriminalitet'],
  social:      ['sociala', 'välfärd', 'pension', 'trygghet', 'socialbidrag'],
  transport:   ['trafik', 'järnväg', 'vägar', 'infrastruktur', 'kollektivtrafik'],
  trade:       ['näringsliv', 'industri', 'export', 'konkurrens', 'utrikeshandel', 'handelspolitik'],
  eu:          ['europeisk', 'europaparlament', 'direktiv', 'eu-', 'europafrågor'],
};

/** Localized domain names for all 14 supported languages */
const DOMAIN_TRANSLATIONS: Record<string, Record<string, string>> = {
  energy:      { en: 'Energy', sv: 'Energi', da: 'Energi', no: 'Energi', fi: 'Energia', de: 'Energie', fr: 'Énergie', es: 'Energía', nl: 'Energie', ar: 'الطاقة', he: 'אנרגיה', ja: 'エネルギー', ko: '에너지', zh: '能源' },
  environment: { en: 'Environment', sv: 'Miljö', da: 'Miljø', no: 'Miljø', fi: 'Ympäristö', de: 'Umwelt', fr: 'Environnement', es: 'Medio Ambiente', nl: 'Milieu', ar: 'البيئة', he: 'סביבה', ja: '環境', ko: '환경', zh: '环境' },
  housing:     { en: 'Housing', sv: 'Bostäder', da: 'Boliger', no: 'Boliger', fi: 'Asuminen', de: 'Wohnungsbau', fr: 'Logement', es: 'Vivienda', nl: 'Huisvesting', ar: 'الإسكان', he: 'דיור', ja: '住宅', ko: '주택', zh: '住房' },
  defense:     { en: 'Defense', sv: 'Försvar', da: 'Forsvar', no: 'Forsvar', fi: 'Puolustus', de: 'Verteidigung', fr: 'Défense', es: 'Defensa', nl: 'Defensie', ar: 'الدفاع', he: 'ביטחון', ja: '防衛', ko: '방위', zh: '国防' },
  healthcare:  { en: 'Healthcare', sv: 'Sjukvård', da: 'Sundhed', no: 'Helse', fi: 'Terveydenhuolto', de: 'Gesundheit', fr: 'Santé', es: 'Sanidad', nl: 'Gezondheidszorg', ar: 'الرعاية الصحية', he: 'בריאות', ja: '医療', ko: '의료', zh: '医疗' },
  education:   { en: 'Education', sv: 'Utbildning', da: 'Uddannelse', no: 'Utdanning', fi: 'Koulutus', de: 'Bildung', fr: 'Éducation', es: 'Educación', nl: 'Onderwijs', ar: 'التعليم', he: 'חינוך', ja: '教育', ko: '교육', zh: '教育' },
  economy:     { en: 'Economy', sv: 'Ekonomi', da: 'Økonomi', no: 'Økonomi', fi: 'Talous', de: 'Wirtschaft', fr: 'Économie', es: 'Economía', nl: 'Economie', ar: 'الاقتصاد', he: 'כלכלה', ja: '経済', ko: '경제', zh: '经济' },
  migration:   { en: 'Migration', sv: 'Migration', da: 'Migration', no: 'Migrasjon', fi: 'Maahanmuutto', de: 'Migration', fr: 'Migration', es: 'Migración', nl: 'Migratie', ar: 'الهجرة', he: 'הגירה', ja: '移民', ko: '이민', zh: '移民' },
  justice:     { en: 'Justice', sv: 'Rättsväsende', da: 'Retsvæsen', no: 'Rettsvesen', fi: 'Oikeus', de: 'Justiz', fr: 'Justice', es: 'Justicia', nl: 'Justitie', ar: 'العدالة', he: 'משפט', ja: '司法', ko: '사법', zh: '司法' },
  social:      { en: 'Welfare', sv: 'Välfärd', da: 'Velfærd', no: 'Velferd', fi: 'Sosiaaliturva', de: 'Sozialpolitik', fr: 'Protection sociale', es: 'Bienestar Social', nl: 'Sociale zekerheid', ar: 'الرعاية الاجتماعية', he: 'רווחה', ja: '社会保障', ko: '사회복지', zh: '社会保障' },
  transport:   { en: 'Transport', sv: 'Trafik', da: 'Transport', no: 'Transport', fi: 'Liikenne', de: 'Verkehr', fr: 'Transport', es: 'Transporte', nl: 'Transport', ar: 'النقل', he: 'תחבורה', ja: '交通', ko: '교통', zh: '交通' },
  trade:       { en: 'Industry', sv: 'Näringsliv', da: 'Erhvervsliv', no: 'Næringsliv', fi: 'Elinkeinoelämä', de: 'Wirtschaft', fr: 'Industrie', es: 'Industria', nl: 'Industrie', ar: 'الصناعة', he: 'תעשייה', ja: '産業', ko: '산업', zh: '产业' },
  eu:          { en: 'EU Affairs', sv: 'EU-frågor', da: 'EU-spørgsmål', no: 'EU-saker', fi: 'EU-asiat', de: 'EU-Angelegenheiten', fr: 'Affaires européennes', es: 'Asuntos Europeos', nl: 'EU-zaken', ar: 'الشؤون الأوروبية', he: 'ענייני אירופה', ja: 'EU問題', ko: 'EU사무', zh: '欧盟事务' },
};

/**
 * Title and subtitle templates keyed by article type then language.
 * Placeholders: {d1} first domain, {d2} second domain, {count} document count.
 */
const CONTENT_TITLE_TEMPLATES: Record<string, Record<string, { title: string; subtitle: string }>> = {
  motions: {
    en: { title: 'Opposition Challenges {d1} and {d2}', subtitle: 'Analysis of {count} opposition motions on {d1} & {d2}' },
    sv: { title: 'Oppositionen utmanar {d1} och {d2}', subtitle: 'Analys av {count} oppositionsmotioner om {d1} & {d2}' },
    da: { title: 'Opposition udfordrer {d1} og {d2}', subtitle: 'Analyse af {count} oppositionsforslag om {d1} & {d2}' },
    no: { title: 'Opposisjonen utfordrer {d1} og {d2}', subtitle: 'Analyse av {count} opposisjonsforslag om {d1} & {d2}' },
    fi: { title: 'Oppositio haastaa {d1} ja {d2}', subtitle: 'Analyysi {count} opposition aloitteesta: {d1} & {d2}' },
    de: { title: 'Opposition fordert {d1} und {d2} heraus', subtitle: 'Analyse von {count} Oppositionsanträgen zu {d1} & {d2}' },
    fr: { title: "L'opposition défie {d1} et {d2}", subtitle: "Analyse de {count} motions d'opposition sur {d1} & {d2}" },
    es: { title: 'La oposición desafía {d1} y {d2}', subtitle: 'Análisis de {count} mociones de oposición sobre {d1} & {d2}' },
    nl: { title: 'Oppositie daagt {d1} en {d2} uit', subtitle: 'Analyse van {count} oppositiemoties over {d1} & {d2}' },
    ar: { title: 'المعارضة تتحدى {d1} و{d2}', subtitle: 'تحليل {count} اقتراح معارضة حول {d1} و{d2}' },
    he: { title: 'האופוזיציה מאתגרת {d1} ו{d2}', subtitle: 'ניתוח {count} הצעות אופוזיציה: {d1} ו{d2}' },
    ja: { title: '野党が{d1}と{d2}に挑む', subtitle: '{d1}と{d2}に関する{count}件の野党動議の分析' },
    ko: { title: '야당이 {d1}과 {d2}에 도전', subtitle: '{d1}과 {d2}에 관한 {count}개 야당 동의 분析' },
    zh: { title: '反对党挑战{d1}和{d2}', subtitle: '关于{d1}和{d2}的{count}份反对党动议分析' },
  },
  propositions: {
    en: { title: 'Government Targets {d1} and {d2} Reform', subtitle: 'Analysis of {count} government propositions on {d1} & {d2}' },
    sv: { title: 'Regeringen satsar på {d1} och {d2}', subtitle: 'Analys av {count} propositioner om {d1} & {d2}' },
    da: { title: 'Regeringen fokuserer på {d1} og {d2}', subtitle: 'Analyse af {count} regeringsforslag om {d1} & {d2}' },
    no: { title: 'Regjeringen satser på {d1} og {d2}', subtitle: 'Analyse av {count} regjeringsproposisjoner om {d1} & {d2}' },
    fi: { title: 'Hallitus panostaa {d1} ja {d2}', subtitle: 'Analyysi {count} hallituksen esityksestä: {d1} & {d2}' },
    de: { title: 'Regierung adressiert {d1} und {d2}', subtitle: 'Analyse von {count} Regierungsvorlagen zu {d1} & {d2}' },
    fr: { title: 'Le gouvernement cible {d1} et {d2}', subtitle: 'Analyse de {count} propositions gouvernementales sur {d1} & {d2}' },
    es: { title: 'El gobierno apunta a {d1} y {d2}', subtitle: 'Análisis de {count} proposiciones gubernamentales sobre {d1} & {d2}' },
    nl: { title: 'Regering richt zich op {d1} en {d2}', subtitle: 'Analyse van {count} regeringsvoorstellen over {d1} & {d2}' },
    ar: { title: 'الحكومة تستهدف {d1} و{d2}', subtitle: 'تحليل {count} مقترح حكومي حول {d1} و{d2}' },
    he: { title: 'הממשלה מתמקדת ב{d1} וב{d2}', subtitle: 'ניתוח {count} הצעות ממשלה: {d1} ו{d2}' },
    ja: { title: '政府が{d1}と{d2}に着手', subtitle: '{d1}と{d2}に関する{count}件の政府提案の分析' },
    ko: { title: '정부가 {d1}과 {d2} 추진', subtitle: '{d1}과 {d2}에 관한 {count}개 정부 법안 분析' },
    zh: { title: '政府推进{d1}和{d2}改革', subtitle: '关于{d1}和{d2}的{count}份政府提案分析' },
  },
  'committee-reports': {
    en: { title: 'Committees Address {d1} and {d2}', subtitle: 'Analysis of {count} committee reports on {d1} & {d2}' },
    sv: { title: 'Utskotten behandlar {d1} och {d2}', subtitle: 'Analys av {count} utskottsbetänkanden om {d1} & {d2}' },
    da: { title: 'Udvalg behandler {d1} og {d2}', subtitle: 'Analyse af {count} udvalgsbetænkninger om {d1} & {d2}' },
    no: { title: 'Komiteer behandler {d1} og {d2}', subtitle: 'Analyse av {count} komitéinnstillinger om {d1} & {d2}' },
    fi: { title: 'Valiokunnat käsittelevät {d1} ja {d2}', subtitle: 'Analyysi {count} valiokunnan mietinnöstä: {d1} & {d2}' },
    de: { title: 'Ausschüsse beraten {d1} und {d2}', subtitle: 'Analyse von {count} Ausschussberichten zu {d1} & {d2}' },
    fr: { title: 'Les commissions examinent {d1} et {d2}', subtitle: 'Analyse de {count} rapports de commission sur {d1} & {d2}' },
    es: { title: 'Comisiones examinan {d1} y {d2}', subtitle: 'Análisis de {count} informes de comisión sobre {d1} & {d2}' },
    nl: { title: 'Commissies behandelen {d1} en {d2}', subtitle: 'Analyse van {count} commissierapporten over {d1} & {d2}' },
    ar: { title: 'اللجان تعالج {d1} و{d2}', subtitle: 'تحليل {count} تقرير لجنة حول {d1} و{d2}' },
    he: { title: 'הוועדות עוסקות ב{d1} וב{d2}', subtitle: 'ניתוח {count} דוחות ועדה: {d1} ו{d2}' },
    ja: { title: '委員会が{d1}と{d2}を審議', subtitle: '{d1}と{d2}に関する{count}件の委員会報告の分析' },
    ko: { title: '위원회가 {d1}과 {d2}을 심의', subtitle: '{d1}과 {d2}에 관한 {count}개 위원회 보고서 분析' },
    zh: { title: '委员会审议{d1}和{d2}', subtitle: '关于{d1}和{d2}的{count}份委员会报告分析' },
  },
};

/**
 * Extract the top policy domains from a set of parliamentary documents.
 * Scans `titel`, `rubrik`, `summary`, and `notis` fields for Swedish keywords.
 *
 * @internal Use {@link generateContentTitle} instead.
 */
function extractPolicyDomains(documents: RawDocument[]): string[] {
  const counts: Record<string, number> = {};
  for (const doc of documents) {
    const text = `${doc.titel ?? ''} ${doc.rubrik ?? ''} ${doc.summary ?? ''} ${doc.notis ?? ''}`.toLowerCase();
    for (const [domain, keywords] of Object.entries(POLICY_DOMAIN_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        counts[domain] = (counts[domain] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain]) => domain);
}

/**
 * Generate a content-aware article title derived from the policy domains found in documents.
 *
 * Extracts the top 2 policy themes from the provided documents and returns a
 * language-specific title that reflects the actual content. Returns `null` when
 * fewer than 2 distinct domains can be detected so callers can fall back to
 * their static titles.
 *
 * @param documents - Source documents to analyse for policy themes
 * @param lang - Target language code (e.g. `'en'`, `'sv'`, `'de'`)
 * @param articleType - Article type: `'motions'` | `'propositions'` | `'committee-reports'`
 * @returns Content-based `{ title, subtitle }`, or `null` when analysis is insufficient
 */
export function generateContentTitle(
  documents: RawDocument[],
  lang: Language | string,
  articleType: 'motions' | 'propositions' | 'committee-reports'
): { title: string; subtitle: string } | null {
  const domains = extractPolicyDomains(documents);
  if (domains.length < 2) return null;

  const langKey = lang as string;
  const trans0 = DOMAIN_TRANSLATIONS[domains[0] ?? ''];
  const trans1 = DOMAIN_TRANSLATIONS[domains[1] ?? ''];
  if (!trans0 || !trans1) return null;
  const d1 = trans0[langKey] ?? trans0['en'];
  const d2 = trans1[langKey] ?? trans1['en'];
  if (!d1 || !d2) return null;

  const typeTemplates = CONTENT_TITLE_TEMPLATES[articleType];
  const tmpl = typeTemplates?.[langKey] ?? typeTemplates?.['en'];
  if (!tmpl) return null;

  return {
    title:    tmpl.title.replace('{d1}', d1).replace('{d2}', d2),
    subtitle: tmpl.subtitle
      .replace('{count}', String(documents.length))
      .replace('{d1}', d1)
      .replace('{d2}', d2),
  };
}

/**
 * Generate article sources list
 */
export function generateSources(tools: string[] = []): string[] {
  const sources: string[] = ['riksdag-regering-mcp'];

  if (tools.includes('get_calendar_events')) {
    sources.push('Riksdagen Calendar');
  }
  if (tools.includes('get_betankanden')) {
    sources.push('Committee Reports');
  }
  if (tools.includes('get_propositioner')) {
    sources.push('Government Propositions');
  }
  if (tools.includes('get_motioner')) {
    sources.push('Parliamentary Motions');
  }
  if (tools.includes('search_dokument')) {
    sources.push('Riksdagen Documents');
  }
  if (tools.includes('get_dokument_innehall')) {
    sources.push('Riksdagen Document Content');
  }

  return sources;
}
