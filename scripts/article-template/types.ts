/**
 * @module article-template/types
 * @description Extended type system for the modular article template
 * architecture.  These types complement the core `ArticleData` /
 * `ArticleType` definitions and introduce per-type layout and AI-directive
 * configuration objects consumed by the template registry.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ArticleType } from '../types/article.js';
import type { Language } from '../types/language.js';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Number of content columns the article body should use */
export type ColumnCount = 1 | 2 | 3;

/** Controls the breadcrumb display density */
export type BreadcrumbStyle = 'full' | 'compact';

/**
 * Per-type layout configuration passed to the template renderer.
 * Values are intentionally minimal — the cyberpunk CSS handles the visual
 * treatment; this struct only captures structural decisions.
 */
export interface LayoutConfig {
  /** Primary column count for the article body */
  readonly columns: ColumnCount;
  /** Whether to render a sidebar panel (e.g. SWOT summary widget) */
  readonly sidebar: boolean;
  /** Whether to render an expanded hero section with an accent banner */
  readonly heroSection: boolean;
  /** Compact breadcrumb omits the article title segment */
  readonly breadcrumbStyle: BreadcrumbStyle;
}

// ---------------------------------------------------------------------------
// AI Style Directives
// ---------------------------------------------------------------------------

/** Tone the AI should adopt when generating content for a given section */
export type ContentTone =
  | 'analytical'
  | 'urgent'
  | 'reflective'
  | 'informational'
  | 'investigative';

/**
 * Directive object that shapes the tone, length and structural constraints
 * for an AI-generated article section.  These are injected into generation
 * prompts to enforce consistent Economist-style political journalism.
 */
export interface AIStyleDirective {
  /** Internal name of the section this directive governs */
  readonly section: string;
  /** Desired editorial tone */
  readonly tone: ContentTone;
  /** Recommended maximum word count for this section */
  readonly maxWords: number;
  /** Whether the AI should include sub-headings within this section */
  readonly requiresSubheadings: boolean;
  /** Stakeholders that must be addressed in the analysis */
  readonly stakeholderFocus: readonly string[];
  /**
   * Style rubric for this section.  Each entry is a single-sentence
   * instruction included verbatim in generation prompts.
   */
  readonly rubric: readonly string[];
}

// ---------------------------------------------------------------------------
// Template registry entry
// ---------------------------------------------------------------------------

/**
 * A complete per-type template configuration stored in the registry.
 * The `styleClass` is appended to the `<article>` element so the CSS
 * custom-property cascade delivers the correct accent colour palette.
 */
export interface ArticleTemplate {
  /** The article type this template governs */
  readonly type: ArticleType;
  /**
   * CSS class added to the `<article>` element, e.g.
   * `"article-type-propositions"`.  Combined with `.news-article` to form
   * the full selector `.news-article.article-type-propositions`.
   */
  readonly styleClass: string;
  /** Structural layout hints for the renderer */
  readonly layout: LayoutConfig;
  /**
   * Per-section AI directives.  Keys are freeform section names
   * (e.g. `"lede"`, `"swot"`, `"key-takeaways"`).
   */
  readonly aiDirectives: Readonly<Record<string, AIStyleDirective>>;
  /** Human-readable description for documentation/tooling */
  readonly description: string;
}

// ---------------------------------------------------------------------------
// Style rubric shared across all article types
// ---------------------------------------------------------------------------

/**
 * Global style rubric that applies to every article type.
 * Individual directives may override or extend these rules.
 */
export const GLOBAL_STYLE_RUBRIC: readonly string[] = [
  'Headings: max 10 words, active voice, no filler phrases.',
  'Paragraphs: 2–4 sentences, analytical not merely descriptive.',
  'Lists: max 7 items per list, ordered by significance.',
  'SWOT entries: 15–40 words each, specific facts not generic statements.',
  'Dashboard interpretations: 1–2 sentences, data-driven conclusions only.',
  'Avoid passive voice; prefer subject–verb–object sentence structure.',
  'Numbers: use figures (not words) for quantities ≥ 10.',
] as const;

// ---------------------------------------------------------------------------
// Language-keyed type-name localizations
// ---------------------------------------------------------------------------

/**
 * Localised display names for each article type across all 14 languages.
 * Used in article meta bars, type badges and accessibility labels.
 */
export const ARTICLE_TYPE_NAMES: Readonly<Record<ArticleType, Readonly<Record<Language, string>>>> = {
  'week-ahead': {
    en: 'Week Ahead', sv: 'Veckan framåt', da: 'Ugen forude', no: 'Uken fremover',
    fi: 'Tuleva viikko', de: 'Woche voraus', fr: 'Semaine à venir', es: 'Semana próxima',
    nl: 'Week vooruit', ar: 'الأسبوع القادم', he: 'השבוע הקרוב', ja: '来週の展望',
    ko: '다음 주 전망', zh: '下周展望',
  },
  'month-ahead': {
    en: 'Month Ahead', sv: 'Månaden framåt', da: 'Måneden forude', no: 'Måneden fremover',
    fi: 'Tuleva kuukausi', de: 'Monat voraus', fr: 'Mois à venir', es: 'Mes próximo',
    nl: 'Maand vooruit', ar: 'الشهر القادم', he: 'החודש הקרוב', ja: '来月の展望',
    ko: '다음 달 전망', zh: '下月展望',
  },
  'weekly-review': {
    en: 'Weekly Review', sv: 'Veckans återblick', da: 'Ugens tilbageblik', no: 'Ukens tilbakeblikk',
    fi: 'Viikon katsaus', de: 'Wochenrückblick', fr: 'Revue hebdomadaire', es: 'Revisión semanal',
    nl: 'Weekoverzicht', ar: 'مراجعة الأسبوع', he: 'סיכום שבועי', ja: '週間レビュー',
    ko: '주간 리뷰', zh: '每周回顾',
  },
  'monthly-review': {
    en: 'Monthly Review', sv: 'Månadsöversikt', da: 'Månedsoversigt', no: 'Månedsoversikt',
    fi: 'Kuukausikatsaus', de: 'Monatsrückblick', fr: 'Bilan mensuel', es: 'Revisión mensual',
    nl: 'Maandoverzicht', ar: 'مراجعة شهرية', he: 'סיכום חודשי', ja: '月間レビュー',
    ko: '월간 리뷰', zh: '月度回顾',
  },
  'committee-reports': {
    en: 'Committee Reports', sv: 'Utskottsrapporter', da: 'Udvalgsrapporter', no: 'Utvalgsrapporter',
    fi: 'Valiokuntaraportit', de: 'Ausschussberichte', fr: 'Rapports de commission',
    es: 'Informes de comité', nl: 'Commissierapporten', ar: 'تقارير اللجان',
    he: 'דוחות ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告',
  },
  'propositions': {
    en: 'Government Propositions', sv: 'Propositioner', da: 'Propositioner', no: 'Proposisjoner',
    fi: 'Hallituksen esitykset', de: 'Regierungsvorlagen', fr: 'Propositions gouvernementales',
    es: 'Proposiciones del gobierno', nl: 'Regeringsvoorstellen', ar: 'مقترحات الحكومة',
    he: 'הצעות ממשלה', ja: '政府提案', ko: '정부 법안', zh: '政府提案',
  },
  'motions': {
    en: 'Opposition Motions', sv: 'Oppositionsmotioner', da: 'Oppositionsforslag',
    no: 'Opposisjonsforslag', fi: 'Oppositiomotiot', de: 'Oppositionsanträge',
    fr: 'Motions d\'opposition', es: 'Mociones de oposición', nl: 'Oppositiemoties',
    ar: 'مقترحات المعارضة', he: 'הצעות אופוזיציה', ja: '野党動議', ko: '야당 동의',
    zh: '反对党动议',
  },
  'interpellations': {
    en: 'Interpellation Debates', sv: 'Interpellationsdebatter', da: 'Interpellationsdebatter',
    no: 'Interpellasjonsdebatter', fi: 'Interpellaatiodebatit', de: 'Interpellationsdebatten',
    fr: 'Débats d\'interpellation', es: 'Debates de interpelación', nl: 'Interpellatiedebatten',
    ar: 'نقاشات الاستجواب', he: 'דיוני בירור', ja: '質問討論', ko: '대정부 질문', zh: '质询辩论',
  },
  'breaking': {
    en: 'Breaking News', sv: 'Senaste nytt', da: 'Seneste nyt', no: 'Siste nytt',
    fi: 'Tuoreet uutiset', de: 'Eilmeldung', fr: 'Dernière heure', es: 'Última hora',
    nl: 'Laatste nieuws', ar: 'أخبار عاجلة', he: 'חדשות אחרונות', ja: '速報', ko: '속보', zh: '突发新闻',
  },
  'deep-inspection': {
    en: 'Deep Inspection', sv: 'Djupanalys', da: 'Dybdeanalyse', no: 'Dybdeanalyse',
    fi: 'Syvyysanalyysi', de: 'Tiefenanalyse', fr: 'Analyse approfondie',
    es: 'Análisis profundo', nl: 'Diepgaande analyse', ar: 'تحليل معمق',
    he: 'ניתוח מעמיק', ja: '詳細分析', ko: '심층 분석', zh: '深度分析',
  },
} as const;
