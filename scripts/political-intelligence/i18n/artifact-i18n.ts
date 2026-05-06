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
  'synthesis-summary.md': {
    en: 'Synthesis Summary', sv: 'Syntessammanfattning', da: 'Synteseoversigt', no: 'Synteseoppsummering', fi: 'Synteesin yhteenveto',
    de: 'Synthese-Zusammenfassung', fr: 'Résumé de synthèse', es: 'Resumen de síntesis', nl: 'Synthese-samenvatting',
    ar: 'ملخص التوليف', he: 'סיכום סינתזה', ja: '統合サマリー', ko: '종합 요약', zh: '综合摘要',
  },
  'intelligence-assessment.md': {
    en: 'Intelligence Assessment', sv: 'Underrättelsebedömning', da: 'Efterretningsvurdering', no: 'Etterretningsvurdering', fi: 'Tiedusteluarvio',
    de: 'Geheimdienstliche Bewertung', fr: 'Évaluation du renseignement', es: 'Evaluación de inteligencia', nl: 'Inlichtingenbeoordeling',
    ar: 'تقييم استخباراتي', he: 'הערכת מודיעין', ja: 'インテリジェンス評価', ko: '정보 평가', zh: '情报评估',
  },
  'significance-scoring.md': {
    en: 'Significance Scoring', sv: 'Betydelsepoängsättning', da: 'Betydningsscoring', no: 'Betydningsscoring', fi: 'Merkityspisteet',
    de: 'Signifikanz-Bewertung', fr: 'Notation de signification', es: 'Puntuación de significancia', nl: 'Significantiescoring',
    ar: 'تسجيل الأهمية', he: 'דירוג חשיבות', ja: '重要度スコアリング', ko: '중요도 점수', zh: '重要性评分',
  },
  'stakeholder-perspectives.md': {
    en: 'Stakeholder Perspectives', sv: 'Intressentperspektiv', da: 'Interessentperspektiver', no: 'Interessentperspektiver', fi: 'Sidosryhmänäkökulmat',
    de: 'Stakeholder-Perspektiven', fr: 'Perspectives des parties prenantes', es: 'Perspectivas de partes interesadas', nl: 'Stakeholder-perspectieven',
    ar: 'وجهات نظر الأطراف المعنية', he: 'נקודות מבט של בעלי עניין', ja: 'ステークホルダー視点', ko: '이해관계자 관점', zh: '利益相关者观点',
  },
  'coalition-mathematics.md': {
    en: 'Coalition Mathematics', sv: 'Koalitionsmatematik', da: 'Koalitionsmatematik', no: 'Koalisjonsmatematikk', fi: 'Koalitiomatematiikka',
    de: 'Koalitionsmathematik', fr: 'Mathématiques de coalition', es: 'Matemáticas de coalición', nl: 'Coalitiemathematica',
    ar: 'رياضيات الائتلاف', he: 'מתמטיקת קואליציה', ja: '連立方程式', ko: '연합 수학', zh: '联盟数学',
  },
  'voter-segmentation.md': {
    en: 'Voter Segmentation', sv: 'Väljaranalys', da: 'Vælgersegmentering', no: 'Velgersegmentering', fi: 'Äänestäjäsegmentointi',
    de: 'Wählersegmentierung', fr: 'Segmentation des électeurs', es: 'Segmentación electoral', nl: 'Kiezersegmentatie',
    ar: 'تقسيم الناخبين', he: 'פילוח בוחרים', ja: '有権者セグメンテーション', ko: '유권자 세분화', zh: '选民细分',
  },
  'forward-indicators.md': {
    en: 'Forward Indicators', sv: 'Framåtblickande indikatorer', da: 'Fremadrettede indikatorer', no: 'Fremtidsindikatorer', fi: 'Tulevaisuusindikaattorit',
    de: 'Zukunftsindikatoren', fr: 'Indicateurs avancés', es: 'Indicadores prospectivos', nl: 'Toekomstindicatoren',
    ar: 'مؤشرات مستقبلية', he: 'מדדים עתידיים', ja: '先行指標', ko: '선행 지표', zh: '前瞻指标',
  },
  'scenario-analysis.md': {
    en: 'Scenario Analysis', sv: 'Scenarioanalys', da: 'Scenarieanalyse', no: 'Scenarioanalyse', fi: 'Skenaarioanalyysi',
    de: 'Szenarioanalyse', fr: 'Analyse de scénarios', es: 'Análisis de escenarios', nl: 'Scenarioanalyse',
    ar: 'تحليل السيناريوهات', he: 'ניתוח תרחישים', ja: 'シナリオ分析', ko: '시나리오 분석', zh: '情景分析',
  },
  'election-2026-analysis.md': {
    en: 'Election 2026 Analysis', sv: 'Valanalys 2026', da: 'Valganalyse 2026', no: 'Valganalyse 2026', fi: 'Vaalianalyysi 2026',
    de: 'Wahlanalyse 2026', fr: 'Analyse électorale 2026', es: 'Análisis electoral 2026', nl: 'Verkiezingsanalyse 2026',
    ar: 'تحليل انتخابات 2026', he: 'ניתוח בחירות 2026', ja: '2026年選挙分析', ko: '2026 선거 분석', zh: '2026年选举分析',
  },
  'historical-parallels.md': {
    en: 'Historical Parallels', sv: 'Historiska paralleller', da: 'Historiske paralleller', no: 'Historiske paralleller', fi: 'Historialliset rinnakkaisuudet',
    de: 'Historische Parallelen', fr: 'Parallèles historiques', es: 'Paralelos históricos', nl: 'Historische parallellen',
    ar: 'أوجه التشابه التاريخية', he: 'הקבלות היסטוריות', ja: '歴史的類似事例', ko: '역사적 유사 사례', zh: '历史相似案例',
  },
  'comparative-international.md': {
    en: 'Comparative International', sv: 'Internationell jämförelse', da: 'International sammenligning', no: 'Internasjonal sammenligning', fi: 'Kansainvälinen vertailu',
    de: 'Internationaler Vergleich', fr: 'Comparaison internationale', es: 'Comparativa internacional', nl: 'Internationaal vergelijk',
    ar: 'مقارنة دولية', he: 'השוואה בינלאומית', ja: '国際比較', ko: '국제 비교', zh: '国际比较',
  },
  'implementation-feasibility.md': {
    en: 'Implementation Feasibility', sv: 'Genomförbarhet', da: 'Gennemførlighed', no: 'Gjennomførbarhet', fi: 'Toteutettavuus',
    de: 'Umsetzungsmachbarkeit', fr: 'Faisabilité de mise en œuvre', es: 'Viabilidad de implementación', nl: 'Haalbaarheidsanalyse',
    ar: 'جدوى التنفيذ', he: 'כדאיות יישום', ja: '実現可能性', ko: '구현 타당성', zh: '实施可行性',
  },
  'media-framing-analysis.md': {
    en: 'Media Framing Analysis', sv: 'Medieramanalys', da: 'Medierammeanalyse', no: 'Medierammeanalyse', fi: 'Mediakehystysanalyysi',
    de: 'Medienrahmenanalyse', fr: 'Analyse du cadrage médiatique', es: 'Análisis de encuadre mediático', nl: 'Media-framinganalyse',
    ar: 'تحليل تأطير إعلامي', he: 'ניתוח מסגור תקשורתי', ja: 'メディアフレーミング分析', ko: '미디어 프레이밍 분석', zh: '媒体框架分析',
  },
  'devils-advocate.md': {
    en: "Devil's Advocate", sv: 'Djävulens advokat', da: 'Djævelens advokat', no: 'Djevelens advokat', fi: 'Paholaisen asianajaja',
    de: 'Advocatus Diaboli', fr: "Avocat du diable", es: 'Abogado del diablo', nl: 'Advocaat van de duivel',
    ar: 'محامي الشيطان', he: 'סנגורו של השטן', ja: '反証分析', ko: '악마의 변호인', zh: '魔鬼代言人',
  },
  'classification-results.md': {
    en: 'Classification Results', sv: 'Klassificeringsresultat', da: 'Klassificeringsresultater', no: 'Klassifiseringsresultater', fi: 'Luokitustulokset',
    de: 'Klassifikationsergebnisse', fr: 'Résultats de classification', es: 'Resultados de clasificación', nl: 'Classificatieresultaten',
    ar: 'نتائج التصنيف', he: 'תוצאות סיווג', ja: '分類結果', ko: '분류 결과', zh: '分类结果',
  },
  'cross-reference-map.md': {
    en: 'Cross-Reference Map', sv: 'Korsreferenskarta', da: 'Krydsreferencekort', no: 'Kryssreferansekart', fi: 'Ristiviittauskartta',
    de: 'Querverweiskarte', fr: 'Carte de références croisées', es: 'Mapa de referencias cruzadas', nl: 'Kruisverwijzingskaart',
    ar: 'خريطة الإسناد الترافقي', he: 'מפת הפניות צולבות', ja: '相互参照マップ', ko: '교차 참조 맵', zh: '交叉引用图',
  },
  'methodology-reflection.md': {
    en: 'Methodology Reflection', sv: 'Metodreflektion', da: 'Metoderefleksion', no: 'Metoderefleksjon', fi: 'Metodologinen pohdinta',
    de: 'Methodenreflexion', fr: 'Réflexion méthodologique', es: 'Reflexión metodológica', nl: 'Methodereflectie',
    ar: 'تأمل منهجي', he: 'רפלקציה מתודולוגית', ja: '方法論の振り返り', ko: '방법론 성찰', zh: '方法论反思',
  },
  'data-download-manifest.md': {
    en: 'Data Download Manifest', sv: 'Datanedladdningsmanifest', da: 'Datadownloadmanifest', no: 'Datanedlastingsmanifest', fi: 'Tietojen latausmanifesti',
    de: 'Daten-Download-Manifest', fr: 'Manifeste de téléchargement', es: 'Manifiesto de descarga de datos', nl: 'Data-downloadmanifest',
    ar: 'بيان تنزيل البيانات', he: 'מניפסט הורדת נתונים', ja: 'データ取得マニフェスト', ko: '데이터 다운로드 매니페스트', zh: '数据下载清单',
  },
  'pir-status.json': {
    en: 'PIR Status', sv: 'PIR-status', da: 'PIR-status', no: 'PIR-status', fi: 'PIR-tila',
    de: 'PIR-Status', fr: 'Statut PIR', es: 'Estado PIR', nl: 'PIR-status',
    ar: 'حالة PIR', he: 'סטטוס PIR', ja: 'PIR ステータス', ko: 'PIR 상태', zh: 'PIR 状态',
  },
};

/**
 * Icon mapping for known analysis artifacts.
 * Falls back to a default icon for unknown files.
 */
export const ARTIFACT_ICON: Record<string, string> = {
  'executive-brief.md': '📊',
  'synthesis-summary.md': '🧠',
  'intelligence-assessment.md': '🎯',
  'significance-scoring.md': '📈',
  'classification-results.md': '🏷️',
  'classification-results.json': '🏷️',
  'swot-analysis.md': '🧮',
  'risk-assessment.md': '⚠️',
  'threat-analysis.md': '🛡️',
  'stakeholder-perspectives.md': '👥',
  'stakeholder-map.md': '👥',
  'data-download-manifest.md': '📦',
  'cross-reference-map.md': '🔀',
  'scenario-analysis.md': '🔮',
  'scenario-planning.md': '🔮',
  'comparative-international.md': '🌍',
  'devils-advocate.md': '😈',
  'methodology-reflection.md': '🔬',
  'election-2026-analysis.md': '🗳️',
  'voter-segmentation.md': '📋',
  'coalition-mathematics.md': '🔢',
  'historical-parallels.md': '📜',
  'forward-indicators.md': '🔭',
  'media-framing-analysis.md': '📰',
  'implementation-feasibility.md': '⚙️',
  'behavioral-analysis.md': '🧩',
  'synthesis.md': '🧠',
  'timeline.md': '⏱️',
  'economic-data.json': '💹',
  'pir-status.json': '📡',
  'README.md': '📘',
};

/** Return the icon for a given artifact filename (with document/ prefix fallback). */
export function artifactIcon(file: string): string {
  // Strip documents/ prefix for matching
  const baseName = file.replace(/^documents\//, '');
  if (ARTIFACT_ICON[baseName]) return ARTIFACT_ICON[baseName];
  if (ARTIFACT_ICON[file]) return ARTIFACT_ICON[file];
  // Pattern-based fallbacks
  if (file.endsWith('.json')) return '📄';
  if (file.startsWith('documents/') && file.endsWith('-analysis.md')) return '📑';
  if (file.startsWith('documents/')) return '📎';
  return '📝';
}

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
