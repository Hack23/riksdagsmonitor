/**
 * @module Infrastructure/RenderLib/ArticleTypeI18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Per-language labels for the article-type eyebrow string
 *
 * @description
 * The article-type label ("Propositions", "Motions", "Committee Reports" …)
 * is rendered at the top of every news article inside the
 * `<p class="rm-article-eyebrow">` element. Without this map every
 * non-English article still showed the English label because
 * `analysis/article-types.json` only carries a single English `label`
 * field per type.
 *
 * This module provides a per-language label map for all 15 registry
 * types plus the 5 legacy fallback IDs handled by `inferArticleType`,
 * so the eyebrow renders in the correct language across the full
 * 14-language matrix. When a translation is missing for a given
 * (typeId, lang) pair the helper falls back to the registry's English
 * label, which guarantees no article ever renders an empty eyebrow.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';

/** Compact alias for "translation map keyed by Language". */
type LangMap = Record<Language, string>;

/**
 * Per-language labels for every article type emitted by the news pipeline.
 * Keys are the registry `id` field (or a legacy fallback ID handled by
 * `inferArticleType`). Values cover all 14 languages.
 */
export const ARTICLE_TYPE_LABEL_I18N: Record<string, LangMap> = {
  // ── Family A: single-type (lookback) ────────────────────────────────
  propositions: {
    en: 'Propositions', sv: 'Propositioner', da: 'Lovforslag', no: 'Proposisjoner', fi: 'Hallituksen esitykset',
    de: 'Regierungsvorlagen', fr: 'Projets de loi', es: 'Proyectos de ley', nl: 'Wetsvoorstellen',
    ar: 'مشاريع القوانين', he: 'הצעות חוק ממשלתיות', ja: '政府法案', ko: '정부 법안', zh: '政府法案',
  },
  motions: {
    en: 'Motions', sv: 'Motioner', da: 'Beslutningsforslag', no: 'Representantforslag', fi: 'Lakialoitteet',
    de: 'Anträge', fr: 'Motions parlementaires', es: 'Mociones parlamentarias', nl: 'Moties',
    ar: 'مقترحات نيابية', he: 'הצעות חברי כנסת', ja: '議員提出議案', ko: '의원 발의안', zh: '议员动议',
  },
  'committee-reports': {
    en: 'Committee Reports', sv: 'Utskottsbetänkanden', da: 'Udvalgsbetænkninger', no: 'Komitéinnstillinger', fi: 'Valiokuntamietinnöt',
    de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comisión', nl: 'Commissieverslagen',
    ar: 'تقارير اللجان', he: 'דוחות ועדות', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告',
  },
  interpellations: {
    en: 'Interpellations', sv: 'Interpellationer', da: 'Forespørgsler', no: 'Interpellasjoner', fi: 'Välikysymykset',
    de: 'Interpellationen', fr: 'Interpellations', es: 'Interpelaciones', nl: 'Interpellaties',
    ar: 'استجوابات برلمانية', he: 'שאילתות בוחנות', ja: '緊急質問', ko: '긴급 질의', zh: '质询',
  },
  'realtime-monitor': {
    en: 'Realtime Monitor', sv: 'Realtidsövervakning', da: 'Realtidsovervågning', no: 'Sanntidsovervåking', fi: 'Reaaliaikaseuranta',
    de: 'Echtzeit-Monitor', fr: 'Suivi en temps réel', es: 'Monitor en tiempo real', nl: 'Realtime monitor',
    ar: 'مراقبة في الوقت الفعلي', he: 'ניטור בזמן אמת', ja: 'リアルタイム・モニター', ko: '실시간 모니터', zh: '实时监测',
  },
  'evening-analysis': {
    en: 'Evening Analysis', sv: 'Kvällsanalys', da: 'Aftenanalyse', no: 'Kveldsanalyse', fi: 'Iltakatsaus',
    de: 'Abendanalyse', fr: 'Analyse du soir', es: 'Análisis vespertino', nl: 'Avondanalyse',
    ar: 'تحليل مسائي', he: 'ניתוח ערב', ja: '夜間分析', ko: '저녁 분석', zh: '晚间分析',
  },

  // ── Family B: long-horizon-forecast ─────────────────────────────────
  'week-ahead': {
    en: 'Week Ahead', sv: 'Veckan framåt', da: 'Ugen forude', no: 'Uken framover', fi: 'Tuleva viikko',
    de: 'Kommende Woche', fr: 'Semaine à venir', es: 'Semana próxima', nl: 'Komende week',
    ar: 'الأسبوع القادم', he: 'השבוע הקרוב', ja: '今後一週間', ko: '다가오는 주', zh: '未来一周',
  },
  'month-ahead': {
    en: 'Month Ahead', sv: 'Månaden framåt', da: 'Måneden forude', no: 'Måneden framover', fi: 'Tuleva kuukausi',
    de: 'Kommender Monat', fr: 'Mois à venir', es: 'Mes próximo', nl: 'Komende maand',
    ar: 'الشهر القادم', he: 'החודש הקרוב', ja: '今後一ヶ月', ko: '다가오는 달', zh: '未来一月',
  },
  'quarter-ahead': {
    en: 'Quarter Ahead', sv: 'Kvartalet framåt', da: 'Kvartalet forude', no: 'Kvartalet framover', fi: 'Tuleva neljännes',
    de: 'Kommendes Quartal', fr: 'Trimestre à venir', es: 'Próximo trimestre', nl: 'Komend kwartaal',
    ar: 'الربع القادم', he: 'הרבעון הקרוב', ja: '今後一四半期', ko: '다가오는 분기', zh: '未来一季',
  },
  'year-ahead': {
    en: 'Year Ahead', sv: 'Året framåt', da: 'Året forude', no: 'Året framover', fi: 'Tuleva vuosi',
    de: 'Kommendes Jahr', fr: 'Année à venir', es: 'Próximo año', nl: 'Komend jaar',
    ar: 'العام القادم', he: 'השנה הקרובה', ja: '今後一年', ko: '다가오는 해', zh: '未来一年',
  },
  'election-cycle': {
    en: 'Election Cycle', sv: 'Mandatperiod', da: 'Valgperiode', no: 'Valgperiode', fi: 'Vaalikausi',
    de: 'Wahlperiode', fr: 'Cycle électoral', es: 'Ciclo electoral', nl: 'Verkiezingscyclus',
    ar: 'الدورة الانتخابية', he: 'מחזור בחירות', ja: '選挙サイクル', ko: '선거 주기', zh: '选举周期',
  },

  // ── Family C: tier-c-aggregation ────────────────────────────────────
  'weekly-review': {
    en: 'Weekly Review', sv: 'Veckorapport', da: 'Ugentlig oversigt', no: 'Ukerapport', fi: 'Viikkokatsaus',
    de: 'Wochenrückblick', fr: 'Bilan hebdomadaire', es: 'Resumen semanal', nl: 'Weekoverzicht',
    ar: 'مراجعة أسبوعية', he: 'סקירה שבועית', ja: '週次レビュー', ko: '주간 리뷰', zh: '每周回顾',
  },
  'monthly-review': {
    en: 'Monthly Review', sv: 'Månadsrapport', da: 'Månedlig oversigt', no: 'Månedsrapport', fi: 'Kuukausikatsaus',
    de: 'Monatsrückblick', fr: 'Bilan mensuel', es: 'Resumen mensual', nl: 'Maandoverzicht',
    ar: 'مراجعة شهرية', he: 'סקירה חודשית', ja: '月次レビュー', ko: '월간 리뷰', zh: '每月回顾',
  },
  'tido-2022': {
    en: 'Tidö Mandate (2022–2026)', sv: 'Tidömandatet (2022–2026)', da: 'Tidö-mandatet (2022–2026)', no: 'Tidö-mandatet (2022–2026)', fi: 'Tidö-mandaatti (2022–2026)',
    de: 'Tidö-Mandat (2022–2026)', fr: 'Mandat Tidö (2022–2026)', es: 'Mandato Tidö (2022–2026)', nl: 'Tidö-mandaat (2022–2026)',
    ar: 'ولاية تيدو (2022–2026)', he: 'מנדט טידֶה (2022–2026)', ja: 'ティードー政権期 (2022–2026)', ko: '티되 임기 (2022–2026)', zh: '蒂多任期 (2022–2026)',
  },
  'post-2026': {
    en: 'Post-2026 Mandate (2026–2030)', sv: 'Mandatperioden efter 2026 (2026–2030)', da: 'Mandatperioden efter 2026 (2026–2030)', no: 'Mandatperioden etter 2026 (2026–2030)', fi: 'Vuoden 2026 jälkeinen mandaatti (2026–2030)',
    de: 'Mandat nach 2026 (2026–2030)', fr: 'Mandat post-2026 (2026–2030)', es: 'Mandato post-2026 (2026–2030)', nl: 'Mandaat na 2026 (2026–2030)',
    ar: 'ولاية ما بعد 2026 (2026–2030)', he: 'מנדט שלאחר 2026 (2026–2030)', ja: '2026年以降の政権期 (2026–2030)', ko: '2026년 이후 임기 (2026–2030)', zh: '2026 年之后任期 (2026–2030)',
  },

  // ── Legacy fallbacks (handled by inferArticleType) ──────────────────
  'deep-inspection': {
    en: 'Deep Inspection', sv: 'Djupgranskning', da: 'Dybdegående undersøgelse', no: 'Dybdegranskning', fi: 'Syväanalyysi',
    de: 'Tiefenprüfung', fr: 'Inspection approfondie', es: 'Inspección profunda', nl: 'Diepgaand onderzoek',
    ar: 'فحص عميق', he: 'בדיקה מעמיקה', ja: '徹底検証', ko: '심층 검증', zh: '深入审查',
  },
  realtime: {
    en: 'Realtime Pulse', sv: 'Realtidspuls', da: 'Realtidspuls', no: 'Sanntidspuls', fi: 'Reaaliaikapulssi',
    de: 'Echtzeit-Puls', fr: 'Pouls en temps réel', es: 'Pulso en tiempo real', nl: 'Realtime puls',
    ar: 'نبضة فورية', he: 'דופק בזמן אמת', ja: 'リアルタイム・パルス', ko: '실시간 펄스', zh: '实时脉搏',
  },
  'realtime-pulse': {
    en: 'Realtime Pulse', sv: 'Realtidspuls', da: 'Realtidspuls', no: 'Sanntidspuls', fi: 'Reaaliaikapulssi',
    de: 'Echtzeit-Puls', fr: 'Pouls en temps réel', es: 'Pulso en tiempo real', nl: 'Realtime puls',
    ar: 'نبضة فورية', he: 'דופק בזמן אמת', ja: 'リアルタイム・パルス', ko: '실시간 펄스', zh: '实时脉搏',
  },
  breaking: {
    en: 'Breaking Intelligence', sv: 'Akut underrättelse', da: 'Hastende efterretning', no: 'Hasteetterretning', fi: 'Pikatieto',
    de: 'Eilmeldung', fr: 'Renseignement urgent', es: 'Inteligencia urgente', nl: 'Spoedinformatie',
    ar: 'معلومات عاجلة', he: 'מודיעין דחוף', ja: '速報インテリジェンス', ko: '속보 인텔리전스', zh: '突发情报',
  },
  'parliament-agenda': {
    en: 'Parliament Agenda', sv: 'Riksdagens dagordning', da: 'Folketingets dagsorden', no: 'Stortingets dagsorden', fi: 'Eduskunnan asialista',
    de: 'Parlamentsagenda', fr: 'Ordre du jour parlementaire', es: 'Agenda parlamentaria', nl: 'Parlementaire agenda',
    ar: 'جدول أعمال البرلمان', he: 'סדר יום פרלמנטרי', ja: '議会議事日程', ko: '의회 의제', zh: '议会议程',
  },

  // ── Generic fallback for unrecognised types ─────────────────────────
  'political-intelligence': {
    en: 'Political Intelligence', sv: 'Politisk underrättelse', da: 'Politisk efterretning', no: 'Politisk etterretning', fi: 'Poliittinen tiedustelu',
    de: 'Politische Aufklärung', fr: 'Renseignement politique', es: 'Inteligencia política', nl: 'Politieke inlichtingen',
    ar: 'استخبارات سياسية', he: 'מודיעין פוליטי', ja: '政治インテリジェンス', ko: '정치 인텔리전스', zh: '政治情报',
  },
};

/**
 * Per-type emoji icons rendered alongside the localised eyebrow label.
 *
 * Icons are intentionally **language-neutral** (no glyph variation
 * across the 14-language matrix) — emoji are Unicode and render
 * consistently in every locale's `<html lang>`. The single
 * `articleTypeIcon()` helper falls back to the generic 🔍 magnifying
 * glass — the previous shared icon — for any type not registered here,
 * which guarantees no article ever renders an empty eyebrow even for
 * newly added registry types not yet covered.
 *
 * The icon is rendered inside `<span class="rm-icon" aria-hidden="true">`
 * (see `article.ts:328`) so screen readers ignore it — the localised
 * label that follows carries the semantic meaning.
 */
export const ARTICLE_TYPE_ICON: Record<string, string> = {
  // Family A: single-type (lookback)
  propositions: '📜',
  motions: '✍️',
  'committee-reports': '📋',
  interpellations: '❓',
  'realtime-monitor': '📡',
  'evening-analysis': '🌙',
  // Family B: long-horizon-forecast
  'week-ahead': '📅',
  'month-ahead': '🗓️',
  'quarter-ahead': '📈',
  'year-ahead': '🎯',
  'election-cycle': '🗳️',
  // Family C: tier-c-aggregation
  'weekly-review': '📊',
  'monthly-review': '📉',
  'tido-2022': '🏛️',
  'post-2026': '🏛️',
  // Legacy fallbacks
  'deep-inspection': '🔬',
  realtime: '⚡',
  'realtime-pulse': '⚡',
  breaking: '🚨',
  'parliament-agenda': '📑',
  'political-intelligence': '🕵️',
};

/**
 * Look up the per-type emoji icon. Falls back to the generic 🔍 icon
 * (previously hard-coded in `article.ts`) so newly added registry types
 * never render an empty `<span class="rm-icon">`.
 */
export function articleTypeIcon(typeId: string): string {
  return ARTICLE_TYPE_ICON[typeId] ?? '🔍';
}

/**
 * Look up the localised eyebrow label for an article type.
 *
 * @param typeId  Article-type ID (registry `id` or legacy fallback).
 * @param lang    Target language code.
 * @param fallback English label to fall back to when no translation is
 *                registered for `(typeId, lang)`. Typically the registry's
 *                own English `label` field, which guarantees a non-empty
 *                eyebrow even for newly added types not yet covered here.
 * @returns       Localised label string.
 */
export function articleTypeLabel(typeId: string, lang: Language, fallback: string): string {
  const map = ARTICLE_TYPE_LABEL_I18N[typeId];
  return map?.[lang] ?? fallback;
}
