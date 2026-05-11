/**
 * @module analysis-references
 * @description Generates the "📊 Analysis & Sources" HTML section for news articles.
 *
 * Scans `analysis/daily/{date}/{subfolder}/` for all existing analysis files and
 * builds a complete HTML block with links to each file on GitHub. This ensures
 * every generated article includes links to ALL analysis files created for that
 * specific generation run, making article–analysis traceability deterministic.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import type { Language } from './types/language.js';
import { escapeHtml } from './html-utils.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Base GitHub blob URL for linking to analysis files */
const GITHUB_BLOB_BASE = 'https://github.com/Hack23/riksdagsmonitor/blob/main';

/** Base GitHub tree URL for linking to analysis directories */
const GITHUB_TREE_BASE = 'https://github.com/Hack23/riksdagsmonitor/tree/main';

/** Strict YYYY-MM-DD format guard to prevent path traversal. */
const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Known analysis file display metadata: label and emoji prefix. */
const KNOWN_ANALYSIS_FILES: ReadonlyArray<{
  filename: string;
  emoji: string;
  labels: Record<Language, string>;
}> = [
  {
    filename: 'synthesis-summary.md',
    emoji: '📋',
    labels: {
      en: 'Synthesis Summary', sv: 'Syntessammanfattning', da: 'Synteseresumé',
      no: 'Synteseoppsummering', fi: 'Synteesiyhteenveto', de: 'Synthese-Zusammenfassung',
      fr: 'Résumé de synthèse', es: 'Resumen de síntesis', nl: 'Syntheseoverzicht',
      ar: 'ملخص التوليف', he: 'סיכום סינתזה', ja: '統合要約', ko: '종합 요약', zh: '综合摘要',
    },
  },
  {
    filename: 'swot-analysis.md',
    emoji: '💪',
    labels: {
      en: 'SWOT Analysis', sv: 'SWOT-analys', da: 'SWOT-analyse',
      no: 'SWOT-analyse', fi: 'SWOT-analyysi', de: 'SWOT-Analyse',
      fr: 'Analyse SWOT', es: 'Análisis DAFO', nl: 'SWOT-analyse',
      ar: 'تحليل SWOT', he: 'ניתוח SWOT', ja: 'SWOT分析', ko: 'SWOT 분석', zh: 'SWOT分析',
    },
  },
  {
    filename: 'risk-assessment.md',
    emoji: '⚠️',
    labels: {
      en: 'Risk Assessment', sv: 'Riskbedömning', da: 'Risikovurdering',
      no: 'Risikovurdering', fi: 'Riskinarviointi', de: 'Risikobewertung',
      fr: 'Évaluation des risques', es: 'Evaluación de riesgos', nl: 'Risicobeoordeling',
      ar: 'تقييم المخاطر', he: 'הערכת סיכונים', ja: 'リスク評価', ko: '위험 평가', zh: '风险评估',
    },
  },
  {
    filename: 'threat-analysis.md',
    emoji: '🎭',
    labels: {
      en: 'Threat Analysis', sv: 'Hotanalys', da: 'Trusselanalyse',
      no: 'Trusselanalyse', fi: 'Uhka-analyysi', de: 'Bedrohungsanalyse',
      fr: 'Analyse des menaces', es: 'Análisis de amenazas', nl: 'Dreigingsanalyse',
      ar: 'تحليل التهديدات', he: 'ניתוח איומים', ja: '脅威分析', ko: '위협 분석', zh: '威胁分析',
    },
  },
  {
    filename: 'stakeholder-perspectives.md',
    emoji: '👥',
    labels: {
      en: 'Stakeholder Perspectives', sv: 'Intressentperspektiv', da: 'Interessentperspektiver',
      no: 'Interessentperspektiver', fi: 'Sidosryhmänäkemykset', de: 'Stakeholder-Perspektiven',
      fr: 'Perspectives des parties prenantes', es: 'Perspectivas de partes interesadas',
      nl: 'Stakeholderperspectiven', ar: 'وجهات نظر أصحاب المصلحة', he: 'פרספקטיבות בעלי עניין',
      ja: 'ステークホルダーの視点', ko: '이해관계자 관점', zh: '利益相关者观点',
    },
  },
  {
    filename: 'significance-scoring.md',
    emoji: '📈',
    labels: {
      en: 'Significance Scoring', sv: 'Betydelsepoäng', da: 'Betydningsvurdering',
      no: 'Betydningsvurdering', fi: 'Merkittävyysarviointi', de: 'Bedeutungsbewertung',
      fr: 'Score de significativité', es: 'Puntuación de significancia',
      nl: 'Significantiescore', ar: 'تقييم الأهمية', he: 'ציון משמעות',
      ja: '重要性スコアリング', ko: '중요도 점수', zh: '重要性评分',
    },
  },
  {
    filename: 'classification-results.md',
    emoji: '🏷️',
    labels: {
      en: 'Classification Results', sv: 'Klassificeringsresultat', da: 'Klassificeringsresultater',
      no: 'Klassifiseringsresultater', fi: 'Luokittelutulokset', de: 'Klassifizierungsergebnisse',
      fr: 'Résultats de classification', es: 'Resultados de clasificación',
      nl: 'Classificatieresultaten', ar: 'نتائج التصنيف', he: 'תוצאות סיווג',
      ja: '分類結果', ko: '분류 결과', zh: '分类结果',
    },
  },
  {
    filename: 'cross-reference-map.md',
    emoji: '🔗',
    labels: {
      en: 'Cross-Reference Map', sv: 'Korsreferenskarta', da: 'Krydsreferencekort',
      no: 'Kryssreferansekart', fi: 'Ristiviitekartta', de: 'Querverweiskarte',
      fr: 'Carte de références croisées', es: 'Mapa de referencias cruzadas',
      nl: 'Kruisverwijzingskaart', ar: 'خريطة المراجع المتقاطعة', he: 'מפת הפניות צולבות',
      ja: '相互参照マップ', ko: '교차 참조 맵', zh: '交叉引用地图',
    },
  },
  {
    filename: 'data-download-manifest.md',
    emoji: '📥',
    labels: {
      en: 'Data Download Manifest', sv: 'Datanedladdningsmanifest', da: 'Datadownloadmanifest',
      no: 'Datanedlastingsmanifest', fi: 'Tietolatausmanifesti', de: 'Daten-Download-Manifest',
      fr: 'Manifeste de téléchargement', es: 'Manifiesto de descarga de datos',
      nl: 'Data-downloadmanifest', ar: 'سجل تنزيل البيانات', he: 'מניפסט הורדת נתונים',
      ja: 'データダウンロードマニフェスト', ko: '데이터 다운로드 매니페스트', zh: '数据下载清单',
    },
  },
  // -------------------------------------------------------------------------
  // Reference-grade files (methodology guide v5.1, Rule 7).
  // Present in exemplar runs (e.g., analysis/daily/2026-04-17/realtime-1434).
  // -------------------------------------------------------------------------
  {
    filename: 'README.md',
    emoji: '🗂️',
    labels: {
      en: 'Dossier Index', sv: 'Dossierinnehåll', da: 'Dossierindeks',
      no: 'Dossierindeks', fi: 'Aineistoluettelo', de: 'Dossier-Index',
      fr: 'Index du dossier', es: 'Índice del dossier', nl: 'Dossierindex',
      ar: 'فهرس الملف', he: 'אינדקס תיק', ja: 'ドシエ索引', ko: '도시에 색인', zh: '档案索引',
    },
  },
  {
    filename: 'executive-brief.md',
    emoji: '🎯',
    labels: {
      en: 'Executive Brief', sv: 'Ledningsbriefing', da: 'Ledelsesbriefing',
      no: 'Ledelsesbriefing', fi: 'Johdon tiivistelmä', de: 'Executive Briefing',
      fr: 'Note exécutive', es: 'Resumen ejecutivo', nl: 'Executive briefing',
      ar: 'موجز تنفيذي', he: 'תדרוך בכיר', ja: 'エグゼクティブ・ブリーフ', ko: '경영진 브리핑', zh: '执行简报',
    },
  },
  {
    filename: 'scenario-analysis.md',
    emoji: '🎲',
    labels: {
      en: 'Scenario Analysis', sv: 'Scenarioanalys', da: 'Scenarieanalyse',
      no: 'Scenarioanalyse', fi: 'Skenaarioanalyysi', de: 'Szenarioanalyse',
      fr: 'Analyse de scénarios', es: 'Análisis de escenarios', nl: 'Scenarioanalyse',
      ar: 'تحليل السيناريوهات', he: 'ניתוח תרחישים', ja: 'シナリオ分析', ko: '시나리오 분석', zh: '情景分析',
    },
  },
  {
    filename: 'comparative-international.md',
    emoji: '🌍',
    labels: {
      en: 'International Comparison', sv: 'Internationell jämförelse', da: 'International sammenligning',
      no: 'Internasjonal sammenligning', fi: 'Kansainvälinen vertailu', de: 'Internationaler Vergleich',
      fr: 'Comparaison internationale', es: 'Comparación internacional', nl: 'Internationale vergelijking',
      ar: 'مقارنة دولية', he: 'השוואה בינלאומית', ja: '国際比較', ko: '국제 비교', zh: '国际比较',
    },
  },
  {
    filename: 'methodology-reflection.md',
    emoji: '🔬',
    labels: {
      en: 'Methodology Reflection', sv: 'Metodikreflektion', da: 'Metodologirefleksion',
      no: 'Metodologirefleksjon', fi: 'Menetelmäpohdinta', de: 'Methodenreflexion',
      fr: 'Réflexion méthodologique', es: 'Reflexión metodológica', nl: 'Methodologiereflectie',
      ar: 'تأمل منهجي', he: 'הרהור מתודולוגי', ja: '方法論省察', ko: '방법론 성찰', zh: '方法论反思',
    },
  },
];

/** Localized methodology link label */
const METHODOLOGY_LABELS: Record<Language, string> = {
  en: 'AI Analysis Methodology', sv: 'AI-analysmetodik', da: 'AI-analysemetodik',
  no: 'AI-analysemetodikk', fi: 'Tekoälyanalyysimenetelmä', de: 'KI-Analysemethodik',
  fr: 'Méthodologie d\'analyse IA', es: 'Metodología de análisis IA',
  nl: 'AI-analysemethodologie', ar: 'منهجية تحليل الذكاء الاصطناعي',
  he: 'מתודולוגיית ניתוח AI', ja: 'AI分析手法', ko: 'AI 분석 방법론', zh: 'AI分析方法论',
};

/** Localized section title */
const SECTION_TITLES: Record<Language, string> = {
  en: 'Analysis & Sources', sv: 'Analys och källor', da: 'Analyse og kilder',
  no: 'Analyse og kilder', fi: 'Analyysi ja lähteet', de: 'Analyse und Quellen',
  fr: 'Analyse et sources', es: 'Análisis y fuentes', nl: 'Analyse en bronnen',
  ar: 'التحليل والمصادر', he: 'ניתוח ומקורות', ja: '分析とソース', ko: '분석 및 출처', zh: '分析与来源',
};

/** Localized intro text */
const INTRO_TEXT: Record<Language, string> = {
  en: 'This article is based on AI-driven political intelligence analysis. Full methodology and analysis files:',
  sv: 'Denna artikel bygger på AI-driven politisk underrättelseanalys. Fullständig metodik och analysfiler:',
  da: 'Denne artikel er baseret på AI-drevet politisk efterretningsanalyse. Fuld metodologi og analysefiler:',
  no: 'Denne artikkelen er basert på AI-drevet politisk etterretningsanalyse. Full metodikk og analysefiler:',
  fi: 'Tämä artikkeli perustuu tekoälyllä tuotettuun poliittiseen tiedusteluanalyysiin. Täydellinen metodologia ja analyysitiedostot:',
  de: 'Dieser Artikel basiert auf KI-gesteuerter politischer Geheimdienstanalyse. Vollständige Methodik und Analysedateien:',
  fr: 'Cet article est basé sur une analyse de renseignement politique par IA. Méthodologie complète et fichiers d\'analyse :',
  es: 'Este artículo se basa en análisis de inteligencia política impulsado por IA. Metodología completa y archivos de análisis:',
  nl: 'Dit artikel is gebaseerd op AI-gestuurde politieke inlichtingenanalyse. Volledige methodologie en analysebestanden:',
  ar: 'تستند هذه المقالة إلى تحليل استخباراتي سياسي مدعوم بالذكاء الاصطناعي. المنهجية الكاملة وملفات التحليل:',
  he: 'מאמר זה מבוסס על ניתוח מודיעין פוליטי מונע AI. מתודולוגיה מלאה וקבצי ניתוח:',
  ja: 'この記事はAI駆動の政治情報分析に基づいています。完全な方法論と分析ファイル：',
  ko: '이 기사는 AI 기반 정치 정보 분석을 기반으로 합니다. 전체 방법론 및 분석 파일:',
  zh: '本文基于AI驱动的政治情报分析。完整方法论和分析文件：',
};

/** Localized per-document label */
const PER_DOC_LABELS: Record<Language, string> = {
  en: 'Per-document analyses', sv: 'Dokumentvisa analyser', da: 'Per-dokument analyser',
  no: 'Per-dokument analyser', fi: 'Asiakirjakohtaiset analyysit', de: 'Dokumentweise Analysen',
  fr: 'Analyses par document', es: 'Análisis por documento', nl: 'Per-document analyses',
  ar: 'تحليلات لكل وثيقة', he: 'ניתוחים לכל מסמך', ja: '文書別分析', ko: '문서별 분석', zh: '逐文件分析',
};

/** Localized aria-label for the section */
const ARIA_LABELS: Record<Language, string> = {
  en: 'Analysis sources and methodology', sv: 'Analyskällor och metodik',
  da: 'Analysekilder og metodik', no: 'Analysekilder og metodikk',
  fi: 'Analyysilähteet ja menetelmät', de: 'Analysquellen und Methodik',
  fr: 'Sources d\'analyse et méthodologie', es: 'Fuentes de análisis y metodología',
  nl: 'Analysebronnen en methodologie', ar: 'مصادر التحليل والمنهجية',
  he: 'מקורות ניתוח ומתודולוגיה', ja: '分析ソースと手法', ko: '분석 출처 및 방법론', zh: '分析来源和方法论',
};

// ---------------------------------------------------------------------------
// Article type → analysis subfolder mapping
// ---------------------------------------------------------------------------

/**
 * Maps article types to their corresponding analysis subfolder names.
 * Must be kept in sync with SHARED_PROMPT_PATTERNS.md "Article Type → Analysis Folder Mapping".
 */
export const ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER: Record<string, string> = {
  'committee-reports': 'committeeReports',
  'propositions': 'propositions',
  'interpellations': 'interpellations',
  'motions': 'motions',
  'evening-analysis': 'evening-analysis',
  'breaking': 'breaking',
  'week-ahead': 'week-ahead',
  'month-ahead': 'month-ahead',
  'weekly-review': 'weekly-review',
  'monthly-review': 'monthly-review',
  'deep-inspection': 'deep-inspection',
};

/**
 * Aggregation article types that synthesize across ALL daily analysis.
 * These workflows read (and should link to) sibling analysis from other
 * article types on the same date.
 */
export const AGGREGATION_ARTICLE_TYPES: ReadonlySet<string> = new Set([
  'evening-analysis',
  'weekly-review',
  'monthly-review',
  'week-ahead',
  'month-ahead',
]);

/**
 * Display metadata for sibling analysis type folders used in cross-reference links.
 */
const SIBLING_TYPE_DISPLAY: Record<string, { emoji: string; labels: Record<Language, string> }> = {
  propositions: {
    emoji: '📜',
    labels: {
      en: 'Propositions Analysis', sv: 'Propositionsanalys', da: 'Propositionsanalyse',
      no: 'Proposisjonsanalyse', fi: 'Esitysanalyysi', de: 'Propositionsanalyse',
      fr: 'Analyse des propositions', es: 'Análisis de proposiciones',
      nl: 'Propositieanalyse', ar: 'تحليل المقترحات', he: 'ניתוח הצעות',
      ja: '法案分析', ko: '법안 분석', zh: '法案分析',
    },
  },
  committeeReports: {
    emoji: '📋',
    labels: {
      en: 'Committee Reports Analysis', sv: 'Utskottsbetänkandeanalys', da: 'Udvalgsberetningsanalyse',
      no: 'Komitérapportanalyse', fi: 'Valiokuntalausuntoanalyysi', de: 'Ausschussberichtsanalyse',
      fr: 'Analyse des rapports de comité', es: 'Análisis de informes de comité',
      nl: 'Commissierapportanalyse', ar: 'تحليل تقارير اللجان', he: 'ניתוח דוחות ועדה',
      ja: '委員会報告分析', ko: '위원회 보고서 분석', zh: '委员会报告分析',
    },
  },
  motions: {
    emoji: '✊',
    labels: {
      en: 'Motions Analysis', sv: 'Motionsanalys', da: 'Forslagsanalyse',
      no: 'Forslags-analyse', fi: 'Aloiteanalyysi', de: 'Antraganalyse',
      fr: 'Analyse des motions', es: 'Análisis de mociones',
      nl: 'Motieanalyse', ar: 'تحليل الاقتراحات', he: 'ניתוח הצעות',
      ja: '動議分析', ko: '발의 분석', zh: '动议分析',
    },
  },
  interpellations: {
    emoji: '❓',
    labels: {
      en: 'Interpellations Analysis', sv: 'Interpellationsanalys', da: 'Interpellationsanalyse',
      no: 'Interpellasjonsanalyse', fi: 'Välikysymysanalyysi', de: 'Interpellationsanalyse',
      fr: 'Analyse des interpellations', es: 'Análisis de interpelaciones',
      nl: 'Interpellatieanalyse', ar: 'تحليل الاستجوابات', he: 'ניתוח אינטרפלציות',
      ja: '質問主意書分析', ko: '대정부질문 분석', zh: '质询分析',
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Options for generating the analysis references section.
 */
export interface AnalysisReferencesOptions {
  /** Article date in YYYY-MM-DD format */
  date: string;
  /** Article type (maps to analysis subfolder) */
  articleType: string;
  /** Language for localized labels */
  lang: Language;
  /** Base path for the analysis directory (defaults to 'analysis/daily') */
  analysisBasePath?: string;
}

/**
 * Result from scanning analysis files.
 */
export interface AnalysisFilesResult {
  /** List of analysis files found (relative to the subfolder) */
  files: string[];
  /** Whether a documents/ subdirectory with per-document analyses exists */
  hasDocumentsDir: boolean;
  /** List of per-document analysis files found inside documents/ (filenames only, sorted) */
  documentFiles: string[];
  /** The full subfolder path relative to analysis/daily/{date} */
  subfolder: string;
  /** The article date used */
  date: string;
}

/**
 * Scan the analysis directory for existing analysis files.
 *
 * @returns List of found analysis files and metadata, or null if no analysis directory exists.
 */
export function scanAnalysisFiles(options: AnalysisReferencesOptions): AnalysisFilesResult | null {
  const { date, articleType, analysisBasePath } = options;

  if (!DATE_FORMAT_RE.test(date)) return null;

  const subfolder = ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER[articleType];
  if (!subfolder) return null;

  const basePath = analysisBasePath ?? 'analysis/daily';
  const analysisDir = path.join(basePath, date, subfolder);

  if (!fs.existsSync(analysisDir)) return null;

  const entries = fs.readdirSync(analysisDir, { withFileTypes: true });
  const files = entries
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => e.name)
    .sort();

  const hasDocumentsDir = entries.some(e => e.isDirectory() && e.name === 'documents');
  let documentFiles: string[] = [];
  if (hasDocumentsDir) {
    try {
      const docsDir = path.join(analysisDir, 'documents');
      documentFiles = fs.readdirSync(docsDir, { withFileTypes: true })
        .filter(e => e.isFile() && e.name.endsWith('.md'))
        .map(e => e.name)
        .sort();
    } catch {
      documentFiles = [];
    }
  }

  if (files.length === 0 && !hasDocumentsDir) return null;

  return { files, hasDocumentsDir, documentFiles, subfolder, date };
}

/**
 * Generate the complete "📊 Analysis & Sources" HTML section with links to
 * all analysis files found for a given article date and type.
 *
 * The generated links point to the GitHub repository blob view, ensuring
 * readers can access the exact analysis files used for this article.
 *
 * @returns HTML string for the analysis references section, or empty string
 *          if no analysis files exist.
 */
export function generateAnalysisReferencesHtml(options: AnalysisReferencesOptions): string {
  const { lang } = options;
  const result = scanAnalysisFiles(options);

  if (!result) return '';

  const { files, hasDocumentsDir, subfolder, date } = result;

  const sectionTitle = SECTION_TITLES[lang] ?? SECTION_TITLES.en;
  const introText = INTRO_TEXT[lang] ?? INTRO_TEXT.en;
  const ariaLabel = ARIA_LABELS[lang] ?? ARIA_LABELS.en;
  const methodologyLabel = METHODOLOGY_LABELS[lang] ?? METHODOLOGY_LABELS.en;
  const perDocLabel = PER_DOC_LABELS[lang] ?? PER_DOC_LABELS.en;

  const analysisPath = `analysis/daily/${date}/${subfolder}`;

  /** URL-encode a single path segment (filename) for use in href attributes. */
  const encodePathSegment = (segment: string): string => encodeURIComponent(segment);

  const listItems: string[] = [];
  const processedFiles = new Set<string>();

  for (const known of KNOWN_ANALYSIS_FILES) {
    if (files.includes(known.filename)) {
      const label = escapeHtml(known.labels[lang] ?? known.labels.en);
      const href = `${GITHUB_BLOB_BASE}/${analysisPath}/${encodePathSegment(known.filename)}`;
      listItems.push(`    <li><a href="${href}" rel="noopener noreferrer">${known.emoji} ${label}</a></li>`);
      processedFiles.add(known.filename);
    }
  }

  for (const file of files) {
    if (!processedFiles.has(file)) {
      const rawLabel = file.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const label = escapeHtml(rawLabel);
      const href = `${GITHUB_BLOB_BASE}/${analysisPath}/${encodePathSegment(file)}`;
      listItems.push(`    <li><a href="${href}" rel="noopener noreferrer">📄 ${label}</a></li>`);
    }
  }

  const siblingItems: string[] = [];
  if (AGGREGATION_ARTICLE_TYPES.has(options.articleType)) {
    const basePath = options.analysisBasePath ?? 'analysis/daily';
    const dateDir = path.join(basePath, date);
    if (fs.existsSync(dateDir)) {
      const siblingDirs = fs.readdirSync(dateDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && e.name !== subfolder)
        .map(e => e.name)
        .sort();
      for (const sibDir of siblingDirs) {
        const display = SIBLING_TYPE_DISPLAY[sibDir];
        if (display) {
          const sibLabel = escapeHtml(display.labels[lang] ?? display.labels.en);
          const sibHref = `${GITHUB_TREE_BASE}/analysis/daily/${date}/${sibDir}`;
          siblingItems.push(`    <li><a href="${sibHref}" rel="noopener noreferrer">${display.emoji} ${sibLabel}</a></li>`);
        } else {
          const rawLabel = sibDir.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const sibHref = `${GITHUB_TREE_BASE}/analysis/daily/${date}/${sibDir}`;
          siblingItems.push(`    <li><a href="${sibHref}" rel="noopener noreferrer">📂 ${escapeHtml(rawLabel)}</a></li>`);
        }
      }
    }
  }

  const methodologyHref = `${GITHUB_BLOB_BASE}/analysis/methodologies/ai-driven-analysis-guide.md`;
  listItems.push(`    <li><a href="${methodologyHref}" rel="noopener noreferrer">🤖 ${escapeHtml(methodologyLabel)}</a></li>`);

  let html = `\n  <section class="analysis-references" aria-label="${escapeHtml(ariaLabel)}">
    <h2>📊 ${escapeHtml(sectionTitle)}</h2>
    <p>${escapeHtml(introText)}</p>
    <ul>\n${listItems.join('\n')}\n    </ul>`;

  if (siblingItems.length > 0) {
    const crossRefTitle: Record<Language, string> = {
      en: 'Cross-Referenced Analysis', sv: 'Korsrefererad analys', da: 'Krydsrefereret analyse',
      no: 'Kryssreferert analyse', fi: 'Ristiviiteanalyysi', de: 'Querverweis-Analyse',
      fr: 'Analyse avec références croisées', es: 'Análisis con referencias cruzadas',
      nl: 'Kruisverwijzingsanalyse', ar: 'تحليل مرجعي متقاطع', he: 'ניתוח הפניות צולבות',
      ja: '相互参照分析', ko: '교차 참조 분석', zh: '交叉引用分析',
    };
    const crossTitle = escapeHtml(crossRefTitle[lang] ?? crossRefTitle.en);
    html += `\n    <h3>🔗 ${crossTitle}</h3>\n    <ul>\n${siblingItems.join('\n')}\n    </ul>`;
  }

  if (hasDocumentsDir) {
    const { documentFiles } = result;
    if (documentFiles.length > 0) {
      const docItems = documentFiles.map(df => {
        const rawLabel = df.replace(/\.md$/, '').replace(/-/g, ' ');
        const label = escapeHtml(rawLabel);
        const href = `${GITHUB_BLOB_BASE}/${analysisPath}/documents/${encodePathSegment(df)}`;
        return `    <li><a href="${href}" rel="noopener noreferrer">📄 ${label}</a></li>`;
      });
      html += `\n    <h3>📁 ${escapeHtml(perDocLabel)}</h3>\n    <ul>\n${docItems.join('\n')}\n    </ul>`;
    } else {
      const docsHref = `${GITHUB_TREE_BASE}/${analysisPath}/documents/`;
      html += `\n    <p><em>${escapeHtml(perDocLabel)}: <a href="${docsHref}" rel="noopener noreferrer">documents/</a></em></p>`;
    }
  }

  html += '\n  </section>';

  return html;
}
