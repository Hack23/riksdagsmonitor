/**
 * @module Infrastructure/RenderLib/SectionTitleI18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Localised article section titles — single source of truth
 *
 * @description
 * Maps a language-stable, canonical article **section slug** (the normalized
 * `<h2 id>` produced by the aggregator, e.g. `risk-assessment`,
 * `deep-dive-cross-reference-map`) to a localised, journalist-framed section
 * title across all 14 supported {@link Language}s.
 *
 * This is the single source of truth consumed by the in-article Table of
 * Contents ({@link ./article-scannability.js#generateArticleToc}) so that TOC
 * navigation chrome reads in the article's own language even though the
 * aggregated `article.md` body keeps English landmark headings (required by
 * `scripts/validators/article/rules/landmarks.ts`, and matching the
 * English-only analysis body content).
 *
 * Architecture / reuse:
 *   - Sections whose journalist label equals the backing artifact's own title
 *     delegate to the vetted {@link ARTIFACT_TITLE_I18N} constant (no string
 *     duplication) via {@link SLUG_TO_ARTIFACT_FILE}.
 *   - The `per-document-intelligence` section reuses the reader-guide
 *     `perDocLabel` chrome string so both pointers stay in lock-step.
 *   - Journalist-framed sections that intentionally differ from the backing
 *     artifact title (e.g. "Why It Matters" vs "Synthesis Summary") and the
 *     `Deep Dive: …` prefixed sections carry explicit 14-language entries in
 *     {@link JOURNALIST_SECTION_TITLE_I18N}.
 *
 * English values are byte-identical to the current body headings, so callers
 * may safely localise every language including `en`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';

import { ARTIFACT_TITLE_I18N } from '../political-intelligence/i18n/artifact-i18n.js';

import { READER_GUIDE_I18N } from './aggregator/reader-guide-i18n/index.js';

/** Per-language section title; `en` is always present as the fallback. */
type SectionLangMap = Record<Language, string> | (Partial<Record<Language, string>> & { en: string });

/**
 * Journalist-framed section titles that do not map 1:1 onto a backing
 * artifact title (or have no single backing artifact), plus the
 * `Deep Dive: …` prefixed deep-dive sections. Keyed by canonical slug.
 *
 * English values match the labels emitted by
 * `scripts/render-lib/aggregator/order.ts` (`SECTION_TITLES`) and the
 * sources/coverage appendices, so localising `en` is a no-op.
 */
const JOURNALIST_SECTION_TITLE_I18N: Record<string, SectionLangMap> = {
  'what-happened': {
    en: 'What Happened', sv: 'Vad som hände', da: 'Hvad skete der', no: 'Hva skjedde', fi: 'Mitä tapahtui',
    de: 'Was geschah', fr: "Ce qui s'est passé", es: 'Qué sucedió', nl: 'Wat er gebeurde',
    ar: 'ماذا حدث', he: 'מה קרה', ja: '何が起きたか', ko: '무슨 일이 있었나', zh: '发生了什么',
  },
  'why-it-matters': {
    en: 'Why It Matters', sv: 'Varför det spelar roll', da: 'Hvorfor det betyder noget', no: 'Hvorfor det betyr noe', fi: 'Miksi sillä on väliä',
    de: 'Warum es wichtig ist', fr: "Pourquoi c'est important", es: 'Por qué importa', nl: 'Waarom het ertoe doet',
    ar: 'لماذا يهم', he: 'למה זה חשוב', ja: 'なぜ重要か', ko: '왜 중요한가', zh: '为何重要',
  },
  'key-findings': {
    en: 'Key Findings', sv: 'Nyckelfynd', da: 'Nøglefund', no: 'Nøkkelfunn', fi: 'Keskeiset havainnot',
    de: 'Wichtigste Erkenntnisse', fr: 'Principaux constats', es: 'Hallazgos clave', nl: 'Belangrijkste bevindingen',
    ar: 'أبرز النتائج', he: 'ממצאים עיקריים', ja: '主要な調査結果', ko: '주요 결과', zh: '主要发现',
  },
  'analysis-artifact-coverage-report': {
    en: 'Analysis Artifact Coverage Report', sv: 'Täckningsrapport för analysartefakter', da: 'Dækningsrapport for analyseartefakter', no: 'Dekningsrapport for analyseartefakter', fi: 'Analyysiartefaktien kattavuusraportti',
    de: 'Abdeckungsbericht der Analyseartefakte', fr: "Rapport de couverture des artefacts d'analyse", es: 'Informe de cobertura de artefactos de análisis', nl: 'Dekkingsrapport van analyseartefacten',
    ar: 'تقرير تغطية مصنوعات التحليل', he: 'דוח כיסוי של תוצרי הניתוח', ja: '分析アーティファクト網羅レポート', ko: '분석 산출물 커버리지 보고서', zh: '分析工件覆盖报告',
  },
  'deep-dive-classification-results': {
    en: 'Deep Dive: Classification Results', sv: 'Fördjupning: Klassificeringsresultat', da: 'Dybdegående: Klassificeringsresultater', no: 'Fordypning: Klassifiseringsresultater', fi: 'Syväluotaus: Luokitustulokset',
    de: 'Vertiefung: Klassifikationsergebnisse', fr: 'Analyse approfondie : Résultats de classification', es: 'Análisis profundo: Resultados de clasificación', nl: 'Verdieping: Classificatieresultaten',
    ar: 'تحليل معمق: نتائج التصنيف', he: 'צלילה לעומק: תוצאות סיווג', ja: '詳細分析：分類結果', ko: '심층 분석: 분류 결과', zh: '深入分析：分类结果',
  },
  'deep-dive-cross-reference-map': {
    en: 'Deep Dive: Cross-Reference Map', sv: 'Fördjupning: Korsreferenskarta', da: 'Dybdegående: Krydsreferencekort', no: 'Fordypning: Kryssreferansekart', fi: 'Syväluotaus: Ristiviittauskartta',
    de: 'Vertiefung: Querverweiskarte', fr: 'Analyse approfondie : Carte de références croisées', es: 'Análisis profundo: Mapa de referencias cruzadas', nl: 'Verdieping: Kruisverwijzingskaart',
    ar: 'تحليل معمق: خريطة الإسناد الترافقي', he: 'צלילה לעומק: מפת הפניות צולבות', ja: '詳細分析：相互参照マップ', ko: '심층 분석: 교차 참조 맵', zh: '深入分析：交叉引用图',
  },
  'deep-dive-methodology--limitations': {
    en: 'Deep Dive: Methodology & Limitations', sv: 'Fördjupning: Metodik och begränsningar', da: 'Dybdegående: Metode og begrænsninger', no: 'Fordypning: Metode og begrensninger', fi: 'Syväluotaus: Menetelmä ja rajoitukset',
    de: 'Vertiefung: Methodik und Grenzen', fr: 'Analyse approfondie : Méthodologie et limites', es: 'Análisis profundo: Metodología y limitaciones', nl: 'Verdieping: Methodologie en beperkingen',
    ar: 'تحليل معمق: المنهجية والقيود', he: 'צלילה לעומק: מתודולוגיה ומגבלות', ja: '詳細分析：方法論と限界', ko: '심층 분석: 방법론 및 한계', zh: '深入分析：方法论与局限',
  },
  'deep-dive-data-download-manifest': {
    en: 'Deep Dive: Data Download Manifest', sv: 'Fördjupning: Datanedladdningsmanifest', da: 'Dybdegående: Datadownloadmanifest', no: 'Fordypning: Datanedlastingsmanifest', fi: 'Syväluotaus: Tietojen latausmanifesti',
    de: 'Vertiefung: Daten-Download-Manifest', fr: 'Analyse approfondie : Manifeste de téléchargement', es: 'Análisis profundo: Manifiesto de descarga de datos', nl: 'Verdieping: Data-downloadmanifest',
    ar: 'تحليل معمق: بيان تنزيل البيانات', he: 'צלילה לעומק: מניפסט הורדת נתונים', ja: '詳細分析：データ取得マニフェスト', ko: '심층 분석: 데이터 다운로드 매니페스트', zh: '深入分析：数据下载清单',
  },
};

/**
 * Sections whose journalist heading equals the backing artifact's own title.
 * The localised string is reused verbatim from {@link ARTIFACT_TITLE_I18N}
 * (keyed by artifact filename) to avoid duplicating vetted translations.
 */
const SLUG_TO_ARTIFACT_FILE: Record<string, string> = {
  'significance-scoring': 'significance-scoring.md',
  'stakeholder-perspectives': 'stakeholder-perspectives.md',
  'coalition-mathematics': 'coalition-mathematics.md',
  'voter-segmentation': 'voter-segmentation.md',
  'forward-indicators': 'forward-indicators.md',
  'scenario-analysis': 'scenario-analysis.md',
  'election-2026-analysis': 'election-2026-analysis.md',
  'risk-assessment': 'risk-assessment.md',
  'swot-analysis': 'swot-analysis.md',
  'threat-analysis': 'threat-analysis.md',
  'historical-parallels': 'historical-parallels.md',
  'comparative-international': 'comparative-international.md',
  'implementation-feasibility': 'implementation-feasibility.md',
  'media-framing-analysis': 'media-framing-analysis.md',
  'devils-advocate': 'devils-advocate.md',
};

/**
 * Resolve the localised journalist title for a canonical section `slug`.
 *
 * Resolution order:
 *   1. Explicit journalist / deep-dive override map.
 *   2. `per-document-intelligence` → reader-guide `perDocLabel` (reused).
 *   3. Backing-artifact title via {@link ARTIFACT_TITLE_I18N}.
 *
 * Returns `undefined` when the slug has no curated localisation, letting the
 * caller fall back gracefully to the (English) heading text.
 */
export function localizedSectionTitle(slug: string, lang: Language): string | undefined {
  const override = JOURNALIST_SECTION_TITLE_I18N[slug];
  if (override) return override[lang] ?? override.en;

  if (slug === 'per-document-intelligence') {
    const guide = READER_GUIDE_I18N[lang] ?? READER_GUIDE_I18N.en;
    return guide.chrome.perDocLabel;
  }

  const artifactFile = SLUG_TO_ARTIFACT_FILE[slug];
  if (artifactFile) {
    const map = ARTIFACT_TITLE_I18N[artifactFile];
    if (map) return map[lang] ?? map.en;
  }

  return undefined;
}
