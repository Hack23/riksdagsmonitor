/**
 * @module Infrastructure/PoliticalIntelligence/I18n/ArtifactI18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Per-artifact title i18n + generic catalog description fallback
 *
 * @description
 * Owns the artifact-filename → localised title mapping (`ARTIFACT_TITLE_I18N`)
 * + the per-library localised name (`LIBRARY_NAME_I18N`) + the lookup
 * helpers `artifactTitle`, `prettifyMarkdownTitle`, `localisedCatalogDescription`.
 *
 * Round-6 split: extracted from `scripts/generate-political-intelligence.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';

import { METHODOLOGY_DESC_I18N } from './methodology-i18n.js';
import { TEMPLATE_DESC_I18N, TEMPLATE_GENERIC_DESC_I18N } from './template-i18n.js';

/** Compact alias for "translation map keyed by Language". */
export type LangMap = Record<Language, string>;

export const ARTIFACT_TITLE_I18N: Record<string, LangMap> = {
  'executive-brief.md': {
    en: 'Executive Brief', sv: 'Chefsbriefing', da: 'Ledelsesbriefing', no: 'Ledelsesbrief', fi: 'Johdon lyhyt katsaus',
    de: 'Executive Brief', fr: 'Note de direction', es: 'Resumen ejecutivo', nl: 'Executive brief',
    ar: 'ملخص تنفيذي', he: 'תקציר מנהלים', ja: 'エグゼクティブ・ブリーフ', ko: '임원 브리핑', zh: '执行摘要',
  },
  'risk-assessment.md': {
    en: 'Risk Assessment', sv: 'Riskbedömning', da: 'Risikovurdering', no: 'Risikovurdering', fi: 'Riskiarvio',
    de: 'Risikobewertung', fr: 'Évaluation des risques', es: 'Evaluación de riesgos', nl: 'Risicobeoordeling',
    ar: 'تقييم المخاطر', he: 'הערכת סיכונים', ja: 'リスク評価', ko: '위험 평가', zh: '风险评估',
  },
  'swot-analysis.md': {
    en: 'SWOT Analysis', sv: 'SWOT-analys', da: 'SWOT-analyse', no: 'SWOT-analyse', fi: 'SWOT-analyysi',
    de: 'SWOT-Analyse', fr: 'Analyse SWOT', es: 'Análisis SWOT', nl: 'SWOT-analyse',
    ar: 'تحليل SWOT', he: 'ניתוח SWOT', ja: 'SWOT 分析', ko: 'SWOT 분석', zh: 'SWOT 分析',
  },
  'stakeholder-map.md': {
    en: 'Stakeholder Map', sv: 'Intressentkarta', da: 'Interessentkort', no: 'Interessentkart', fi: 'Sidosryhmäkartta',
    de: 'Stakeholder-Karte', fr: 'Carte des parties prenantes', es: 'Mapa de partes interesadas', nl: 'Stakeholderkaart',
    ar: 'خريطة الأطراف المعنية', he: 'מפת בעלי עניין', ja: 'ステークホルダー・マップ', ko: '이해관계자 지도', zh: '利益相关者地图',
  },
  'threat-analysis.md': {
    en: 'Threat Analysis', sv: 'Hotanalys', da: 'Trusselsanalyse', no: 'Trusselanalyse', fi: 'Uhka-analyysi',
    de: 'Bedrohungsanalyse', fr: 'Analyse des menaces', es: 'Análisis de amenazas', nl: 'Dreigingsanalyse',
    ar: 'تحليل التهديدات', he: 'ניתוח איומים', ja: '脅威分析', ko: '위협 분석', zh: '威胁分析',
  },
  'scenario-planning.md': {
    en: 'Scenario Planning', sv: 'Scenarioplanering', da: 'Scenarieplanlægning', no: 'Scenarieplanlegging', fi: 'Skenaariosuunnittelu',
    de: 'Szenarienplanung', fr: 'Planification de scénarios', es: 'Planificación de escenarios', nl: 'Scenarioplanning',
    ar: 'تخطيط السيناريوهات', he: 'תכנון תרחישים', ja: 'シナリオ・プランニング', ko: '시나리오 기획', zh: '情景规划',
  },
  'behavioral-analysis.md': {
    en: 'Behavioural Analysis', sv: 'Beteendeanalys', da: 'Adfærdsanalyse', no: 'Atferdsanalyse', fi: 'Käyttäytymisanalyysi',
    de: 'Verhaltensanalyse', fr: 'Analyse comportementale', es: 'Análisis conductual', nl: 'Gedragsanalyse',
    ar: 'تحليل سلوكي', he: 'ניתוח התנהגותי', ja: '行動分析', ko: '행동 분석', zh: '行为分析',
  },
  'synthesis.md': {
    en: 'Synthesis', sv: 'Syntes', da: 'Syntese', no: 'Syntese', fi: 'Synteesi',
    de: 'Synthese', fr: 'Synthèse', es: 'Síntesis', nl: 'Synthese',
    ar: 'توليف', he: 'סינתזה', ja: '統合', ko: '종합', zh: '综合',
  },
  'timeline.md': {
    en: 'Timeline', sv: 'Tidslinje', da: 'Tidslinje', no: 'Tidslinje', fi: 'Aikajana',
    de: 'Zeitleiste', fr: 'Chronologie', es: 'Cronología', nl: 'Tijdlijn',
    ar: 'الجدول الزمني', he: 'ציר זמן', ja: 'タイムライン', ko: '타임라인', zh: '时间线',
  },
  'classification-results.json': {
    en: 'Classification Results', sv: 'Klassificeringsresultat', da: 'Klassificeringsresultater', no: 'Klassifiseringsresultater', fi: 'Luokitustulokset',
    de: 'Klassifikationsergebnisse', fr: 'Résultats de classification', es: 'Resultados de clasificación', nl: 'Classificatieresultaten',
    ar: 'نتائج التصنيف', he: 'תוצאות סיווג', ja: '分類結果', ko: '분류 결과', zh: '分类结果',
  },
  'economic-data.json': {
    en: 'Economic Data', sv: 'Ekonomisk data', da: 'Økonomiske data', no: 'Økonomiske data', fi: 'Taloustiedot',
    de: 'Wirtschaftsdaten', fr: 'Données économiques', es: 'Datos económicos', nl: 'Economische data',
    ar: 'بيانات اقتصادية', he: 'נתונים כלכליים', ja: '経済データ', ko: '경제 데이터', zh: '经济数据',
  },
  'README.md': {
    en: 'README', sv: 'Läs mig', da: 'Læs mig', no: 'Les meg', fi: 'Lue minut',
    de: 'Lies mich', fr: 'Lisez-moi', es: 'Léame', nl: 'Lees mij',
    ar: 'اقرأني', he: 'קרא אותי', ja: 'お読みください', ko: '읽어 주세요', zh: '自述文件',
  },
};

/** Generic library-display-name phrases, localised per language. */
export const LIBRARY_NAME_I18N: Record<'methodologies' | 'templates', LangMap> = {
  methodologies: {
    en: 'methodologies', sv: 'metoder', da: 'metoder', no: 'metoder', fi: 'metodit',
    de: 'Methoden', fr: 'méthodologies', es: 'metodologías', nl: 'methodologieën',
    ar: 'منهجيات', he: 'מתודולוגיות', ja: '方法論', ko: '방법론', zh: '方法论',
  },
  templates: {
    en: 'templates', sv: 'mallar', da: 'skabeloner', no: 'maler', fi: 'mallit',
    de: 'Vorlagen', fr: 'modèles', es: 'plantillas', nl: 'sjablonen',
    ar: 'قوالب', he: 'תבניות', ja: 'テンプレート', ko: '템플릿', zh: '模板',
  },
};


/**
 * Convert a markdown / json filename to a Title-Case English title.
 * Pure string transform; English-only — used as cross-language fallback.
 */
export function prettifyMarkdownTitle(file: string): string {
  return file
    .replace(/\.md$/i, '')
    .replace(/\.json$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Localised display title for an artifact filename. Falls back to English prettify. */
export function artifactTitle(file: string, lang: Language): string {
  return ARTIFACT_TITLE_I18N[file]?.[lang]
      ?? ARTIFACT_TITLE_I18N[file]?.en
      ?? prettifyMarkdownTitle(file);
}

/**
 * Localised description for a methodology/template artifact filename.
 * For templates, falls back to a generic localised pattern; for
 * methodologies, falls back to the canonical English description so
 * we never leave blanks in any UI.
 */
export function localisedCatalogDescription(
  file: string,
  lang: Language,
  library: 'methodologies' | 'templates',
  englishFallback: string,
): string {
  const map = library === 'methodologies' ? METHODOLOGY_DESC_I18N : TEMPLATE_DESC_I18N;
  const hit = map[file]?.[lang];
  if (hit) return hit;
  if (library === 'templates') {
    const pattern = TEMPLATE_GENERIC_DESC_I18N[lang] ?? TEMPLATE_GENERIC_DESC_I18N.en;
    const title = artifactTitle(file, lang);
    const libName = LIBRARY_NAME_I18N.templates[lang] ?? LIBRARY_NAME_I18N.templates.en;
    return pattern.replace('%t', title).replace('%l', libName);
  }
  return englishFallback;
}
