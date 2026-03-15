/**
 * @module ai-analysis/dashboard-analyzer
 * @description AI-powered dashboard analysis for deep-inspection articles.
 * Analyzes document content to produce structured chart configurations for
 * multiple chart types: risk radar, stakeholder alignment (scatter), and
 * legislative pipeline (bar). Each chart ships with an accessible data table.
 *
 * The analysis is deterministic — scores are derived from document keyword
 * matching, type classification, and structural metadata rather than an
 * external ML service. This keeps the pipeline fully offline while still
 * producing content-aware, multi-dimensional insights.
 *
 * Charts conform to Chart.js 4.x conventions and are embedded as
 * `data-chart-config` attributes (no inline scripts), consistent with the
 * dashboard-section.ts "no inline scripts" pattern.
 *
 * **Supported chart types produced**:
 * - `radar`   — Policy Risk Assessment (5 dimensions)
 * - `scatter` — Stakeholder Alignment Matrix (influence vs. alignment)
 * - `bar`     — Legislative Pipeline (docs per stage)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type {
  DashboardChartConfig,
  DashboardTableConfig,
  DashboardDataset,
  DashboardPoint,
} from '../types/article.js';
import type { RawDocument } from '../data-transformers/types.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Extends DashboardChartConfig with AI-provenance metadata. */
export interface AIChartConfig extends DashboardChartConfig {
  /** Human-readable explanation of what this chart shows and how it was derived. */
  analysisNote: string;
  /** Description of the documents / data that informed this chart. */
  dataSource: string;
  /** 0–1 confidence score for this analysis (1 = high confidence). */
  confidence: number;
}

/** Data quality level for the overall dashboard analysis. */
export type DataQuality = 'high' | 'medium' | 'low';

/** Complete result from `analyzeDashboardData()`. */
export interface DashboardAnalysisResult {
  /** AI-analyzed chart configurations (3 charts: radar, scatter, bar). */
  charts: AIChartConfig[];
  /** Accessible data tables — one per chart. */
  tables: DashboardTableConfig[];
  /** Human-readable narrative summary of the analysis. */
  summary: string;
  /** Data quality classification driven by document richness. */
  dataQuality: DataQuality;
}

// ---------------------------------------------------------------------------
// Multi-language label tables
// ---------------------------------------------------------------------------

/** Helper type: sparse per-language record with English as mandatory fallback. */
type LangMap = Partial<Record<string, string>> & { en: string };

const L: Record<string, LangMap> = {
  riskAssessmentTitle: {
    en: 'Policy Risk Assessment', sv: 'Politisk riskbedömning', da: 'Politisk risikovurdering',
    no: 'Politisk risikovurdering', fi: 'Poliittinen riskinarviointi', de: 'Politische Risikobewertung',
    fr: 'Évaluation des risques politiques', es: 'Evaluación de riesgos políticos',
    nl: 'Politieke risicobeoordeling', ar: 'تقييم المخاطر السياسية',
    he: 'הערכת סיכונים פוליטיים', ja: '政策リスク評価', ko: '정책 리스크 평가', zh: '政策风险评估',
  },
  implementationRisk: {
    en: 'Implementation Risk', sv: 'Genomföranderisk', da: 'Implementeringsrisiko',
    no: 'Implementeringsrisiko', fi: 'Toimeenpanoriski', de: 'Umsetzungsrisiko',
    fr: 'Risque de mise en œuvre', es: 'Riesgo de implementación',
    nl: 'Implementatierisico', ar: 'مخاطر التنفيذ',
    he: 'סיכון יישום', ja: '実施リスク', ko: '이행 위험', zh: '实施风险',
  },
  stakeholderOpposition: {
    en: 'Stakeholder Opposition', sv: 'Intressentmotstånd', da: 'Interessentmodstand',
    no: 'Interessentmotstand', fi: 'Sidosryhmävastustus', de: 'Stakeholder-Widerstand',
    fr: "Opposition des parties prenantes", es: 'Oposición de partes interesadas',
    nl: 'Stakeholderweerstand', ar: 'معارضة أصحاب المصلحة',
    he: 'התנגדות בעלי עניין', ja: 'ステークホルダーの反対', ko: '이해관계자 반대', zh: '利益相关者反对',
  },
  budgetPressure: {
    en: 'Budget Pressure', sv: 'Budgettryck', da: 'Budgetpres',
    no: 'Budsjettpress', fi: 'Budjettipaine', de: 'Haushaltsdruck',
    fr: 'Pression budgétaire', es: 'Presión presupuestaria',
    nl: 'Budgetdruk', ar: 'ضغط الميزانية',
    he: 'לחץ תקציבי', ja: '予算圧力', ko: '예산 압박', zh: '预算压力',
  },
  regulatoryComplexity: {
    en: 'Regulatory Complexity', sv: 'Regulatorisk komplexitet', da: 'Regulatorisk kompleksitet',
    no: 'Regulatorisk kompleksitet', fi: 'Sääntelymonimutkaisuus', de: 'Regulatorische Komplexität',
    fr: 'Complexité réglementaire', es: 'Complejidad regulatoria',
    nl: 'Regelgevingscomplexiteit', ar: 'التعقيد التنظيمي',
    he: 'מורכבות רגולטורית', ja: '規制の複雑さ', ko: '규제 복잡성', zh: '监管复杂性',
  },
  timelinePressure: {
    en: 'Timeline Pressure', sv: 'Tidspress', da: 'Tidspres',
    no: 'Tidspress', fi: 'Aikataulupaine', de: 'Zeitdruck',
    fr: 'Pression temporelle', es: 'Presión de plazos',
    nl: 'Tijdsdruk', ar: 'ضغط الجدول الزمني',
    he: 'לחץ לוחות זמנים', ja: 'タイムライン圧力', ko: '일정 압박', zh: '时间线压力',
  },
  stakeholderAlignmentTitle: {
    en: 'Stakeholder Alignment', sv: 'Intressentanpassning', da: 'Interessenttilpasning',
    no: 'Interessenttilpasning', fi: 'Sidosryhmäasemointi', de: 'Stakeholder-Ausrichtung',
    fr: 'Alignement des parties prenantes', es: 'Alineación de partes interesadas',
    nl: 'Stakeholderafstemming', ar: 'مواءمة أصحاب المصلحة',
    he: 'יישור בעלי עניין', ja: 'ステークホルダー整合', ko: '이해관계자 정렬', zh: '利益相关者一致性',
  },
  policyAlignment: {
    en: 'Policy Alignment (1–10)', sv: 'Policyanpassning (1–10)', da: 'Politisk tilpasning (1–10)',
    no: 'Politisk tilpasning (1–10)', fi: 'Poliittinen yhdenmukaistaminen (1–10)',
    de: 'Politikausrichtung (1–10)', fr: 'Alignement politique (1–10)', es: 'Alineación política (1–10)',
    nl: 'Politieke afstemming (1–10)', ar: 'التوافق السياسي (١–١٠)',
    he: 'יישור מדיניות (1–10)', ja: '政策整合性 (1–10)', ko: '정책 정렬 (1–10)', zh: '政策一致性 (1–10)',
  },
  influenceLevel: {
    en: 'Influence Level (1–10)', sv: 'Inflytandenivå (1–10)', da: 'Indflydelsesniveau (1–10)',
    no: 'Innflytelsenivå (1–10)', fi: 'Vaikutustaso (1–10)', de: 'Einflussniveau (1–10)',
    fr: "Niveau d'influence (1–10)", es: 'Nivel de influencia (1–10)',
    nl: 'Invloedniveau (1–10)', ar: 'مستوى التأثير (١–١٠)',
    he: 'רמת השפעה (1–10)', ja: '影響力レベル (1–10)', ko: '영향력 수준 (1–10)', zh: '影响力级别 (1–10)',
  },
  legislativePipelineTitle: {
    en: 'Legislative Pipeline', sv: 'Lagstiftningspipeline', da: 'Lovgivningspipeline',
    no: 'Lovgivningspipeline', fi: 'Lainsäädäntöputki', de: 'Gesetzgebungspipeline',
    fr: 'Pipeline législatif', es: 'Pipeline legislativo',
    nl: 'Wetgevingspijplijn', ar: 'خط الأنابيب التشريعي',
    he: 'צנרת חקיקה', ja: '立法パイプライン', ko: '입법 파이프라인', zh: '立法流程',
  },
  draftProposal: {
    en: 'Draft Proposal', sv: 'Utkast', da: 'Udkast', no: 'Utkast',
    fi: 'Luonnos', de: 'Entwurf', fr: 'Avant-projet', es: 'Borrador',
    nl: 'Ontwerp', ar: 'مسودة اقتراح', he: 'טיוטת הצעה',
    ja: '提案草案', ko: '초안 제안', zh: '初步提案',
  },
  parliamentaryMotion: {
    en: 'Parliamentary Motion', sv: 'Motion', da: 'Motion', no: 'Forslag',
    fi: 'Kirjelmä', de: 'Parlamentarischer Antrag', fr: 'Motion parlementaire', es: 'Moción parlamentaria',
    nl: 'Parlementaire motie', ar: 'اقتراح برلماني', he: 'הצעת חוק פרלמנטרית',
    ja: '議会動議', ko: '의회 동의', zh: '议会动议',
  },
  governmentProposal: {
    en: 'Government Proposal', sv: 'Proposition', da: 'Regeringsforslag', no: 'Regjeringsfremlegg',
    fi: 'Hallituksen esitys', de: 'Regierungsvorschlag', fr: 'Proposition du gouvernement', es: 'Propuesta del gobierno',
    nl: 'Regeringsvoorstel', ar: 'اقتراح حكومي', he: 'הצעת ממשלה',
    ja: '政府提案', ko: '정부 제안', zh: '政府提案',
  },
  committeeReview: {
    en: 'Committee Review', sv: 'Utskottsbetänkande', da: 'Udvalgsbehandling', no: 'Komitébehandling',
    fi: 'Valiokunnan mietintö', de: 'Ausschussprüfung', fr: 'Examen en commission', es: 'Revisión en comité',
    nl: 'Commissietoetsing', ar: 'مراجعة اللجنة', he: 'סקירת ועדה',
    ja: '委員会審査', ko: '위원회 검토', zh: '委员会审查',
  },
  enactedLaw: {
    en: 'Enacted Law', sv: 'Antagen lag', da: 'Vedtaget lov', no: 'Vedtatt lov',
    fi: 'Säädetty laki', de: 'Verabschiedetes Gesetz', fr: 'Loi adoptée', es: 'Ley promulgada',
    nl: 'Ingevoerde wet', ar: 'قانون مُصدَّق', he: 'חוק שנחקק',
    ja: '制定法', ko: '제정법', zh: '颁布法律',
  },
  pressRelease: {
    en: 'Press Release', sv: 'Pressmeddelande', da: 'Pressemeddelelse', no: 'Pressemelding',
    fi: 'Lehdistötiedote', de: 'Pressemitteilung', fr: 'Communiqué de presse', es: 'Comunicado de prensa',
    nl: 'Persbericht', ar: 'بيان صحفي', he: 'הודעה לעיתונות',
    ja: 'プレスリリース', ko: '보도 자료', zh: '新闻稿',
  },
  euPosition: {
    en: 'EU Position', sv: 'EU-position', da: 'EU-position', no: 'EU-posisjon',
    fi: 'EU-kanta', de: 'EU-Position', fr: 'Position UE', es: 'Posición UE',
    nl: 'EU-standpunt', ar: 'موقف الاتحاد الأوروبي', he: 'עמדת האיחוד האירופי',
    ja: 'EU 立場', ko: 'EU 입장', zh: '欧盟立场',
  },
  government: {
    en: 'Government', sv: 'Regering', da: 'Regering', no: 'Regjering',
    fi: 'Hallitus', de: 'Regierung', fr: 'Gouvernement', es: 'Gobierno',
    nl: 'Regering', ar: 'حكومة', he: 'ממשלה',
    ja: '政府', ko: '정부', zh: '政府',
  },
  opposition: {
    en: 'Opposition', sv: 'Opposition', da: 'Opposition', no: 'Opposisjon',
    fi: 'Oppositio', de: 'Opposition', fr: 'Opposition', es: 'Oposición',
    nl: 'Oppositie', ar: 'المعارضة', he: 'אופוזיציה',
    ja: '野党', ko: '야당', zh: '反对派',
  },
  civilSociety: {
    en: 'Civil Society', sv: 'Civilsamhälle', da: 'Civilsamfund', no: 'Sivilsamfunn',
    fi: 'Kansalaisyhteiskunta', de: 'Zivilgesellschaft', fr: 'Société civile', es: 'Sociedad civil',
    nl: 'Maatschappelijk middenveld', ar: 'المجتمع المدني', he: 'החברה האזרחית',
    ja: '市民社会', ko: '시민 사회', zh: '公民社会',
  },
  riskDimension: {
    en: 'Risk Dimension', sv: 'Riskdimension', da: 'Risikodimension', no: 'Risikodimensjon',
    fi: 'Riskidimensio', de: 'Risikodimension', fr: 'Dimension de risque', es: 'Dimensión de riesgo',
    nl: 'Risicodimensie', ar: 'بُعد المخاطرة', he: 'ממד סיכון',
    ja: 'リスク次元', ko: '위험 차원', zh: '风险维度',
  },
  scoreOutOf10: {
    en: 'Score (1–10)', sv: 'Poäng (1–10)', da: 'Score (1–10)', no: 'Score (1–10)',
    fi: 'Pisteet (1–10)', de: 'Wert (1–10)', fr: 'Score (1–10)', es: 'Puntuación (1–10)',
    nl: 'Score (1–10)', ar: 'النتيجة (١–١٠)', he: 'ציון (1–10)',
    ja: 'スコア (1–10)', ko: '점수 (1–10)', zh: '分数 (1–10)',
  },
  stakeholder: {
    en: 'Stakeholder', sv: 'Intressent', da: 'Interessent', no: 'Interessent',
    fi: 'Sidosryhmä', de: 'Stakeholder', fr: 'Partie prenante', es: 'Parte interesada',
    nl: 'Belanghebbende', ar: 'صاحب المصلحة', he: 'בעל עניין',
    ja: 'ステークホルダー', ko: '이해관계자', zh: '利益相关者',
  },
  stage: {
    en: 'Stage', sv: 'Steg', da: 'Trin', no: 'Trinn',
    fi: 'Vaihe', de: 'Stufe', fr: 'Étape', es: 'Etapa',
    nl: 'Stadium', ar: 'مرحلة', he: 'שלב',
    ja: 'ステージ', ko: '단계', zh: '阶段',
  },
  count: {
    en: 'Count', sv: 'Antal', da: 'Antal', no: 'Antall',
    fi: 'Määrä', de: 'Anzahl', fr: 'Nombre', es: 'Cantidad',
    nl: 'Aantal', ar: 'العدد', he: 'ספירה',
    ja: '数', ko: '수', zh: '数量',
  },
};

/** Retrieve a localized label with fallback to English. */
function lbl(key: string, lang: string): string {
  return L[key]?.[lang] ?? L[key]?.en ?? key;
}

// ---------------------------------------------------------------------------
// Score derivation helpers
// ---------------------------------------------------------------------------

/** Keywords that raise implementation risk. */
const IMPLEMENTATION_RISK_KEYWORDS = [
  'genomföra', 'implement', 'reform', 'förändring', 'ny lag', 'new law',
  'deadline', 'tidsfrist', 'pilotprojekt', 'pilot project',
];
/** Keywords that raise stakeholder opposition risk. */
const OPPOSITION_RISK_KEYWORDS = [
  'opposition', 'avslag', 'reject', 'protest', 'invändning', 'objection',
  'remiss', 'konsultation', 'consultation', 'kritik', 'criticism',
];
/** Keywords that raise budget pressure. */
const BUDGET_RISK_KEYWORDS = [
  'budget', 'kostnad', 'cost', 'finansiering', 'funding', 'anslag', 'appropriation',
  'skatt', 'tax', 'avgift', 'fee', 'anslagsökning', 'spending increase',
];
/** Keywords that raise regulatory complexity. */
const REGULATORY_RISK_KEYWORDS = [
  'reglera', 'regulat', 'direktiv', 'directive', 'förordning', 'regulation',
  'tillämpning', 'application', 'undantag', 'exemption', 'tillstånd', 'permit',
];
/** Keywords that raise timeline pressure. */
const TIMELINE_RISK_KEYWORDS = [
  'senast', 'deadline', 'tidsgräns', 'skyndsamt', 'urgent', 'omgående',
  'omedelbart', 'immediately', '2025', '2026', '2027',
];

/**
 * Count how many risk keywords appear in a document's text fields.
 * Looks at title, summary, and a portion of fullText (or fullContent as fallback).
 */
function countKeywords(doc: RawDocument, keywords: string[]): number {
  const haystack = [
    doc.titel ?? '',
    doc.rubrik ?? '',
    doc.title ?? '',
    doc.summary ?? '',
    doc.notis ?? '',
    (doc.fullText || doc.fullContent || '').slice(0, 500),
  ].join(' ').toLowerCase();
  return keywords.filter(kw => haystack.includes(kw.toLowerCase())).length;
}

/**
 * Derive a risk score 1–10 for a single dimension from a set of documents.
 * Base score comes from document type counts and keyword frequency.
 */
function deriveRiskScore(
  docs: RawDocument[],
  keywords: string[],
  docTypeWeight: Record<string, number>,
): number {
  // Keyword contribution: 0–5 points
  const totalKeywordHits = docs.reduce((sum, doc) => sum + countKeywords(doc, keywords), 0);
  const keywordScore = Math.min(5, totalKeywordHits * 0.8);

  // Doc-type contribution: 0–5 points
  const typeScore = docs.reduce((sum, doc) => {
    const t = (doc.doktyp ?? doc.documentType ?? 'other').toLowerCase();
    return sum + (docTypeWeight[t] ?? 0);
  }, 0);
  const clampedTypeScore = Math.min(5, typeScore / Math.max(1, docs.length) * 5);

  const raw = keywordScore + clampedTypeScore;
  // Clamp to [1, 10] and round to 1 decimal
  return Math.round(Math.max(1, Math.min(10, raw)) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Risk Assessment Radar chart
// ---------------------------------------------------------------------------

function buildRiskRadarChart(
  id: string,
  docs: RawDocument[],
  lang: string,
): { chart: AIChartConfig; table: DashboardTableConfig } {
  const dimLabels = [
    lbl('implementationRisk', lang),
    lbl('stakeholderOpposition', lang),
    lbl('budgetPressure', lang),
    lbl('regulatoryComplexity', lang),
    lbl('timelinePressure', lang),
  ];

  const implementationScore = deriveRiskScore(docs, IMPLEMENTATION_RISK_KEYWORDS, {
    prop: 1.2, sfs: 1.5, mot: 0.6, bet: 0.4,
  });
  const oppositionScore = deriveRiskScore(docs, OPPOSITION_RISK_KEYWORDS, {
    mot: 1.5, bet: 1.0, prop: 0.3,
  });
  const budgetScore = deriveRiskScore(docs, BUDGET_RISK_KEYWORDS, {
    prop: 1.2, sfs: 0.8, bet: 0.6, mot: 0.4,
  });
  const regulatoryScore = deriveRiskScore(docs, REGULATORY_RISK_KEYWORDS, {
    sfs: 1.5, prop: 1.0, bet: 0.8, fpm: 0.5,
  });
  const timelineScore = deriveRiskScore(docs, TIMELINE_RISK_KEYWORDS, {
    prop: 0.8, sfs: 1.2, pressm: 0.5,
  });

  const scores = [implementationScore, oppositionScore, budgetScore, regulatoryScore, timelineScore];

  const hasFullText = docs.some(d => (d.fullText || d.fullContent || '').length > 100);
  const confidence = hasFullText ? 0.8 : 0.5;

  const chart: AIChartConfig = {
    id,
    type: 'radar',
    title: lbl('riskAssessmentTitle', lang),
    labels: dimLabels,
    datasets: [{
      label: lbl('scoreOutOf10', lang),
      data: scores,
      backgroundColor: 'rgba(255, 0, 110, 0.2)',
      borderColor: '#ff006e',
      borderWidth: 2,
    }],
    analysisNote: `Risk dimensions scored 1–10 from keyword analysis of ${docs.length} documents.`,
    dataSource: `${docs.length} parliamentary documents analysed`,
    confidence,
  };

  const table: DashboardTableConfig = {
    caption: lbl('riskAssessmentTitle', lang),
    headers: [lbl('riskDimension', lang), lbl('scoreOutOf10', lang)],
    rows: dimLabels.map((dim, i) => [dim, String(scores[i])]),
  };

  return { chart, table };
}

// ---------------------------------------------------------------------------
// Stakeholder Alignment Scatter chart
// ---------------------------------------------------------------------------

function buildStakeholderAlignmentChart(
  id: string,
  docs: RawDocument[],
  lang: string,
): { chart: AIChartConfig; table: DashboardTableConfig } {
  const propCount   = docs.filter(d =>
    ['prop', 'skr'].includes((d.doktyp ?? d.documentType) ?? ''),
  ).length;
  const motCount    = docs.filter(d => (d.doktyp ?? d.documentType) === 'mot').length;
  const betCount    = docs.filter(d => (d.doktyp ?? d.documentType) === 'bet').length;
  const sfsDocs     = docs.filter(d =>
    (d.doktyp ?? d.documentType) === 'sfs' || (d.dokumentnamn ?? '').startsWith('SFS'),
  ).length;
  const extCount    = docs.filter(d =>
    ['ext', 'pressm', 'fpm'].includes((d.doktyp ?? d.documentType) ?? ''),
  ).length;

  const total = Math.max(1, docs.length);

  // Government: high alignment when many propositions/laws; influence = proportion of proposals
  const govAlignment = Math.round(Math.min(10, 2 + (propCount + sfsDocs) / total * 10) * 10) / 10;
  const govInfluence = Math.round(Math.min(10, 3 + (propCount + sfsDocs) / total * 10) * 10) / 10;

  // Opposition: alignment inversely related to number of opposing motions
  const oppAlignment = Math.round(Math.max(1, Math.min(10, 8 - motCount / total * 6)) * 10) / 10;
  const oppInfluence = Math.round(Math.min(10, 2 + (motCount + betCount) / total * 10) * 10) / 10;

  // Civil society: moderate alignment, influence tied to external documents
  const civAlignment = Math.round(Math.min(10, 4 + extCount / total * 4) * 10) / 10;
  const civInfluence = Math.round(Math.min(10, 2 + extCount / total * 8) * 10) / 10;

  const govLabel    = lbl('government', lang);
  const oppLabel    = lbl('opposition', lang);
  const civLabel    = lbl('civilSociety', lang);

  const makePoint = (x: number, y: number): DashboardPoint => ({ x, y });

  const datasets: DashboardDataset[] = [
    {
      label: govLabel,
      data: [makePoint(govAlignment, govInfluence)],
      backgroundColor: '#00d9ff',
      borderColor: '#00b8d4',
      borderWidth: 2,
    },
    {
      label: oppLabel,
      data: [makePoint(oppAlignment, oppInfluence)],
      backgroundColor: '#ff006e',
      borderColor: '#d4004e',
      borderWidth: 2,
    },
    {
      label: civLabel,
      data: [makePoint(civAlignment, civInfluence)],
      backgroundColor: '#ffbe0b',
      borderColor: '#d4a00b',
      borderWidth: 2,
    },
  ];

  const chart: AIChartConfig = {
    id,
    type: 'scatter',
    title: lbl('stakeholderAlignmentTitle', lang),
    datasets,
    analysisNote: `Stakeholder positions derived from document type distribution (${docs.length} docs).`,
    dataSource: `Propositions: ${propCount}, Motions: ${motCount}, Committee reports: ${betCount}`,
    confidence: 0.6,
  };

  const table: DashboardTableConfig = {
    caption: lbl('stakeholderAlignmentTitle', lang),
    headers: [
      lbl('stakeholder', lang),
      lbl('policyAlignment', lang),
      lbl('influenceLevel', lang),
    ],
    rows: [
      [govLabel, String(govAlignment), String(govInfluence)],
      [oppLabel, String(oppAlignment), String(oppInfluence)],
      [civLabel, String(civAlignment), String(civInfluence)],
    ],
  };

  return { chart, table };
}

// ---------------------------------------------------------------------------
// Legislative Pipeline Bar chart
// ---------------------------------------------------------------------------

/** Maps a document type to its legislative stage label key. */
const DOC_TYPE_TO_STAGE: Record<string, string> = {
  fpm:    'draftProposal',
  mot:    'parliamentaryMotion',
  prop:   'governmentProposal',
  bet:    'committeeReview',
  sfs:    'enactedLaw',
  skr:    'governmentProposal',
  pressm: 'pressRelease',
  eu:     'euPosition',
};

function buildLegislativePipelineChart(
  id: string,
  docs: RawDocument[],
  lang: string,
): { chart: AIChartConfig; table: DashboardTableConfig } {
  // Aggregate counts per stage
  const stageCounts: Record<string, number> = {};
  docs.forEach(doc => {
    const t = (doc.doktyp ?? doc.documentType ?? 'other').toLowerCase();
    const stageKey = DOC_TYPE_TO_STAGE[t] ?? 'parliamentaryMotion';
    stageCounts[stageKey] = (stageCounts[stageKey] ?? 0) + 1;
  });

  const stageOrder = [
    'draftProposal',
    'parliamentaryMotion',
    'governmentProposal',
    'committeeReview',
    'enactedLaw',
    'pressRelease',
    'euPosition',
  ];

  const presentStages = stageOrder.filter(s => (stageCounts[s] ?? 0) > 0);
  if (presentStages.length === 0) {
    // Fallback: show all stages with zero so chart still renders
    presentStages.push('governmentProposal', 'committeeReview');
    stageCounts['governmentProposal'] = 0;
    stageCounts['committeeReview'] = 0;
  }

  const palette = ['#00d9ff', '#ff006e', '#ffbe0b', '#00ff88', '#ff8800', '#aa00ff', '#83cf39'];
  const labels  = presentStages.map(s => lbl(s, lang));
  const values  = presentStages.map(s => stageCounts[s] ?? 0);
  const colors  = presentStages.map((_, i) => palette[i % palette.length]);

  const chart: AIChartConfig = {
    id,
    type: 'bar',
    title: lbl('legislativePipelineTitle', lang),
    labels,
    datasets: [{
      label: lbl('count', lang),
      data: values,
      backgroundColor: colors,
      borderColor: colors,
      borderWidth: 1,
    }],
    analysisNote: `Documents mapped to ${presentStages.length} legislative stages.`,
    dataSource: `${docs.length} parliamentary documents classified by type`,
    confidence: 0.9,
  };

  const table: DashboardTableConfig = {
    caption: lbl('legislativePipelineTitle', lang),
    headers: [lbl('stage', lang), lbl('count', lang)],
    rows: labels.map((label, i) => [label, String(values[i])]),
  };

  return { chart, table };
}

// ---------------------------------------------------------------------------
// Data quality assessment
// ---------------------------------------------------------------------------

/**
 * Classify overall data quality based on document richness.
 * - `high`   → several documents with full text
 * - `medium` → documents with metadata but little or no full text
 * - `low`    → very few documents or only minimal metadata
 */
function assessDataQuality(docs: RawDocument[]): DataQuality {
  if (docs.length === 0) return 'low';
  const withFullText = docs.filter(d => (d.fullText || d.fullContent || '').length > 100).length;
  if (withFullText >= 3 || (withFullText >= 1 && docs.length >= 5)) return 'high';
  if (docs.length >= 3) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a set of parliamentary documents and produce AI-aware chart
 * configurations for the deep-inspection dashboard.
 *
 * Returns exactly **three** chart + table pairs covering:
 * 1. **Policy Risk Assessment** (radar) — five risk dimensions scored 1–10
 * 2. **Stakeholder Alignment** (scatter) — three stakeholders on a 2D grid
 * 3. **Legislative Pipeline** (bar) — document counts per legislative stage
 *
 * If `docs` is empty, all charts return minimal placeholder data so the
 * dashboard still renders without errors.
 *
 * @example
 * ```ts
 * import { analyzeDashboardData } from './ai-analysis/dashboard-analyzer.js';
 *
 * const result = analyzeDashboardData(docs, 'defence policy', 'en');
 * // result.charts  — [AIChartConfig, AIChartConfig, AIChartConfig]
 * // result.tables  — [DashboardTableConfig × 3]
 * // result.dataQuality — 'high' | 'medium' | 'low'
 * ```
 */
export function analyzeDashboardData(
  docs: RawDocument[],
  topic: string | null,
  lang: Language | string,
): DashboardAnalysisResult {
  const safeLang = typeof lang === 'string' ? lang : 'en';

  // Pass the real (possibly empty) array to each builder — each handles
  // the empty case internally rather than relying on a placeholder document.
  const { chart: radarChart, table: radarTable } =
    buildRiskRadarChart('ai-risk-radar', docs, safeLang);

  const { chart: scatterChart, table: scatterTable } =
    buildStakeholderAlignmentChart('ai-stakeholder-alignment', docs, safeLang);

  const { chart: pipelineChart, table: pipelineTable } =
    buildLegislativePipelineChart('ai-legislative-pipeline', docs, safeLang);

  const dataQuality = assessDataQuality(docs);

  const totalDocs   = docs.length;
  const uniqueTypes = new Set(docs.map(d => d.doktyp ?? d.documentType ?? 'other')).size;
  const topicSuffix = topic ? ` — ${topic}` : '';
  const summary = totalDocs === 0
    ? 'No documents available for analysis.'
    : `AI analysis of ${totalDocs} document${totalDocs > 1 ? 's' : ''} across ${uniqueTypes} type${uniqueTypes > 1 ? 's' : ''}${topicSuffix}.`;

  return {
    charts: [radarChart, scatterChart, pipelineChart],
    tables: [radarTable, scatterTable, pipelineTable],
    summary,
    dataQuality,
  };
}
