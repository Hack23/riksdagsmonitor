/**
 * @module data-transformers/content-generators/framework-renderers
 * @description HTML renderers for the document analysis framework sections:
 * PESTLE analysis, stakeholder impact, risk assessment, and implementation assessment.
 * Also contains the stub types and stub functions that replace the formerly
 * AI-generated analysis modules (per ai-driven-analysis-guide.md Rule 2).
 *
 * ⚠️ DEPRECATED FOR ANALYSIS GENERATION (v3.0, 2026-04-02):
 * All render functions produce fallback stub HTML.
 * AI agents in agentic workflow .md files MUST overwrite this output
 * with genuine political intelligence.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { CIAContext } from '../types.js';

// ---------------------------------------------------------------------------
// Stub types — local to this module; replaced by AI-driven analysis
// ---------------------------------------------------------------------------

export interface PESTLEDimensions {
  political: string[];
  economic: string[];
  social: string[];
  technological: string[];
  legal: string[];
  environmental: string[];
}

export interface StakeholderDirectImpact {
  direction: 'positive' | 'negative' | 'mixed' | 'neutral';
  magnitude: 'significant' | 'moderate' | 'minor';
  summary: string;
}

export interface StakeholderImpact {
  stakeholder: string;
  displayName: string;
  directImpact: StakeholderDirectImpact;
  confidence: string;
  implementationBurden: 'high' | 'medium' | 'low';
}

export interface ImplementationAssessment {
  feasibility: 'high' | 'medium' | 'low';
  keyObstacles: string[];
  agenciesInvolved: string[];
  timeline: string;
  estimatedTimeline: string;
  summary: string;
}

export interface DocumentAnalysis {
  pestleDimensions: PESTLEDimensions;
  stakeholderImpacts: StakeholderImpact[];
  implementationAssessment: ImplementationAssessment;
  riskAssessment: RiskAssessment[];
  [key: string]: unknown;
}

export type PESTLEAnalysis = PESTLEDimensions;

export interface RiskAssessment {
  type: 'political' | 'implementation' | 'public-acceptance' | 'legal' | 'financial';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface BatchAnalysisResult { results: unknown[] }

// ---------------------------------------------------------------------------
// Stub functions — return empty data; real analysis is AI-driven in workflows
// ---------------------------------------------------------------------------

/** Stub: returns empty analysis. Real analysis is AI-driven in workflows. */
export function analyzeDocumentsBatch(_docs: unknown[], _lang?: Language | string, _cia?: CIAContext): Map<string, DocumentAnalysis> {
  return new Map();
}

/** Stub: returns empty perspectives. Real analysis is AI-driven in workflows. */
export function analyzeDocumentsPerspectives(_docs: unknown[], _cia?: CIAContext, _lang?: Language | string): BatchAnalysisResult {
  return { results: [] };
}

// ---------------------------------------------------------------------------
// Display constants
// ---------------------------------------------------------------------------

/** Max items per PESTLE dimension in aggregated display */
const MAX_PESTLE_ITEMS = 4;
/** Max stakeholder impacts shown in the summary list */
const MAX_STAKEHOLDER_IMPACTS = 7;
/** Max risk items shown in the risk assessment summary */
const MAX_RISK_ITEMS = 5;
/** Max perspective insights shown from 6-lens analysis */
export const MAX_PERSPECTIVE_INSIGHTS = 5;
/** Max implementation obstacles listed */
const MAX_IMPLEMENTATION_OBSTACLES = 4;
/** Max agencies displayed in implementation assessment */
const MAX_AGENCIES_DISPLAYED = 5;

// ---------------------------------------------------------------------------
// Multi-language label tables
// ---------------------------------------------------------------------------

const PESTLE_LABELS: Readonly<Record<string, Record<keyof PESTLEAnalysis, string>>> = {
  en: { political: 'Political', economic: 'Economic', social: 'Social', technological: 'Technological', legal: 'Legal', environmental: 'Environmental' },
  sv: { political: 'Politisk', economic: 'Ekonomisk', social: 'Social', technological: 'Teknologisk', legal: 'Juridisk', environmental: 'Miljö' },
  da: { political: 'Politisk', economic: 'Økonomisk', social: 'Social', technological: 'Teknologisk', legal: 'Juridisk', environmental: 'Miljø' },
  no: { political: 'Politisk', economic: 'Økonomisk', social: 'Sosial', technological: 'Teknologisk', legal: 'Juridisk', environmental: 'Miljø' },
  fi: { political: 'Poliittinen', economic: 'Taloudellinen', social: 'Sosiaalinen', technological: 'Teknologinen', legal: 'Oikeudellinen', environmental: 'Ympäristö' },
  de: { political: 'Politisch', economic: 'Wirtschaftlich', social: 'Sozial', technological: 'Technologisch', legal: 'Rechtlich', environmental: 'Umwelt' },
  fr: { political: 'Politique', economic: 'Économique', social: 'Social', technological: 'Technologique', legal: 'Juridique', environmental: 'Environnemental' },
  es: { political: 'Político', economic: 'Económico', social: 'Social', technological: 'Tecnológico', legal: 'Jurídico', environmental: 'Ambiental' },
  nl: { political: 'Politiek', economic: 'Economisch', social: 'Sociaal', technological: 'Technologisch', legal: 'Juridisch', environmental: 'Milieu' },
  ar: { political: 'سياسي', economic: 'اقتصادي', social: 'اجتماعي', technological: 'تقني', legal: 'قانوني', environmental: 'بيئي' },
  he: { political: 'פוליטי', economic: 'כלכלי', social: 'חברתי', technological: 'טכנולוגי', legal: 'משפטי', environmental: 'סביבתי' },
  ja: { political: '政治', economic: '経済', social: '社会', technological: '技術', legal: '法的', environmental: '環境' },
  ko: { political: '정치', economic: '경제', social: '사회', technological: '기술', legal: '법률', environmental: '환경' },
  zh: { political: '政治', economic: '经济', social: '社会', technological: '技术', legal: '法律', environmental: '环境' },
};

const RISK_TYPE_LABELS: Readonly<Record<string, Record<RiskAssessment['type'], string>>> = {
  en: { political: 'Political', implementation: 'Implementation', 'public-acceptance': 'Public acceptance', legal: 'Legal', financial: 'Financial' },
  sv: { political: 'Politisk', implementation: 'Genomförande', 'public-acceptance': 'Offentlig acceptans', legal: 'Juridisk', financial: 'Finansiell' },
  da: { political: 'Politisk', implementation: 'Implementering', 'public-acceptance': 'Offentlig accept', legal: 'Juridisk', financial: 'Finansiel' },
  no: { political: 'Politisk', implementation: 'Implementering', 'public-acceptance': 'Offentlig aksept', legal: 'Juridisk', financial: 'Finansiell' },
  fi: { political: 'Poliittinen', implementation: 'Toteutus', 'public-acceptance': 'Julkinen hyväksyntä', legal: 'Oikeudellinen', financial: 'Taloudellinen' },
  de: { political: 'Politisch', implementation: 'Umsetzung', 'public-acceptance': 'Öffentliche Akzeptanz', legal: 'Rechtlich', financial: 'Finanziell' },
  fr: { political: 'Politique', implementation: 'Mise en œuvre', 'public-acceptance': 'Acceptation publique', legal: 'Juridique', financial: 'Financier' },
  es: { political: 'Político', implementation: 'Implementación', 'public-acceptance': 'Aceptación pública', legal: 'Jurídico', financial: 'Financiero' },
  nl: { political: 'Politiek', implementation: 'Implementatie', 'public-acceptance': 'Publieke acceptatie', legal: 'Juridisch', financial: 'Financieel' },
  ar: { political: 'سياسي', implementation: 'تنفيذي', 'public-acceptance': 'القبول العام', legal: 'قانوني', financial: 'مالي' },
  he: { political: 'פוליטי', implementation: 'יישום', 'public-acceptance': 'קבלה ציבורית', legal: 'משפטי', financial: 'פיננסי' },
  ja: { political: '政治', implementation: '実装', 'public-acceptance': '世論受容', legal: '法的', financial: '財政' },
  ko: { political: '정치', implementation: '이행', 'public-acceptance': '대중 수용성', legal: '법률', financial: '재정' },
  zh: { political: '政治', implementation: '实施', 'public-acceptance': '公众接受度', legal: '法律', financial: '财政' },
};

const LEVEL_LABELS: Readonly<Record<string, Record<'high' | 'medium' | 'low', string>>> = {
  en: { high: 'High', medium: 'Medium', low: 'Low' },
  sv: { high: 'Hög', medium: 'Medel', low: 'Låg' },
  da: { high: 'Høj', medium: 'Mellem', low: 'Lav' },
  no: { high: 'Høy', medium: 'Middels', low: 'Lav' },
  fi: { high: 'Korkea', medium: 'Keskitaso', low: 'Matala' },
  de: { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' },
  fr: { high: 'Élevé', medium: 'Moyen', low: 'Faible' },
  es: { high: 'Alto', medium: 'Medio', low: 'Bajo' },
  nl: { high: 'Hoog', medium: 'Middel', low: 'Laag' },
  ar: { high: 'مرتفع', medium: 'متوسط', low: 'منخفض' },
  he: { high: 'גבוה', medium: 'בינוני', low: 'נמוך' },
  ja: { high: '高', medium: '中', low: '低' },
  ko: { high: '높음', medium: '보통', low: '낮음' },
  zh: { high: '高', medium: '中', low: '低' },
};

const IMPLEMENTATION_LABELS: Readonly<Record<string, { feasibility: string; obstacles: string; agencies: string; noStakeholderData: string; noImplementationData: string; burden: string }>> = {
  en: { feasibility: 'Feasibility', obstacles: 'Key obstacles', agencies: 'Agencies involved', noStakeholderData: 'No stakeholder impact data available.', noImplementationData: 'No implementation data available.', burden: 'Burden' },
  sv: { feasibility: 'Genomförbarhet', obstacles: 'Viktiga hinder', agencies: 'Berörda myndigheter', noStakeholderData: 'Ingen data om intressentpåverkan tillgänglig.', noImplementationData: 'Ingen implementeringsdata tillgänglig.', burden: 'Belastning' },
  da: { feasibility: 'Gennemførlighed', obstacles: 'Vigtige hindringer', agencies: 'Involverede myndigheder', noStakeholderData: 'Ingen data om interessentpåvirkning tilgængelig.', noImplementationData: 'Ingen implementeringsdata tilgængelig.', burden: 'Byrde' },
  no: { feasibility: 'Gjennomførbarhet', obstacles: 'Viktige hindringer', agencies: 'Involverte etater', noStakeholderData: 'Ingen data om interessentpåvirkning tilgjengelig.', noImplementationData: 'Ingen implementeringsdata tilgjengelig.', burden: 'Belastning' },
  fi: { feasibility: 'Toteutettavuus', obstacles: 'Keskeiset esteet', agencies: 'Mukana olevat viranomaiset', noStakeholderData: 'Sidosryhmävaikutustietoa ei saatavilla.', noImplementationData: 'Toteutustietoa ei saatavilla.', burden: 'Rasite' },
  de: { feasibility: 'Umsetzbarkeit', obstacles: 'Wesentliche Hindernisse', agencies: 'Beteiligte Behörden', noStakeholderData: 'Keine Daten zu Stakeholder-Auswirkungen verfügbar.', noImplementationData: 'Keine Umsetzungsdaten verfügbar.', burden: 'Belastung' },
  fr: { feasibility: 'Faisabilité', obstacles: 'Obstacles clés', agencies: 'Agences impliquées', noStakeholderData: "Aucune donnée d'impact des parties prenantes disponible.", noImplementationData: 'Aucune donnée de mise en œuvre disponible.', burden: 'Charge' },
  es: { feasibility: 'Viabilidad', obstacles: 'Obstáculos clave', agencies: 'Organismos implicados', noStakeholderData: 'No hay datos de impacto en partes interesadas.', noImplementationData: 'No hay datos de implementación disponibles.', burden: 'Carga' },
  nl: { feasibility: 'Haalbaarheid', obstacles: 'Belangrijkste obstakels', agencies: 'Betrokken instanties', noStakeholderData: 'Geen gegevens over impact op belanghebbenden beschikbaar.', noImplementationData: 'Geen implementatiegegevens beschikbaar.', burden: 'Last' },
  ar: { feasibility: 'قابلية التنفيذ', obstacles: 'العقبات الرئيسية', agencies: 'الجهات المعنية', noStakeholderData: 'لا تتوفر بيانات تأثير أصحاب المصلحة.', noImplementationData: 'لا تتوفر بيانات تنفيذ.', burden: 'العبء' },
  he: { feasibility: 'ישימות', obstacles: 'חסמים מרכזיים', agencies: 'גורמים מעורבים', noStakeholderData: 'אין נתוני השפעה על בעלי עניין.', noImplementationData: 'אין נתוני יישום.', burden: 'נטל' },
  ja: { feasibility: '実現可能性', obstacles: '主な障害', agencies: '関係機関', noStakeholderData: 'ステークホルダー影響データはありません。', noImplementationData: '実施データはありません。', burden: '負担' },
  ko: { feasibility: '실행 가능성', obstacles: '주요 장애 요인', agencies: '관여 기관', noStakeholderData: '이해관계자 영향 데이터가 없습니다.', noImplementationData: '이행 데이터가 없습니다.', burden: '부담' },
  zh: { feasibility: '可实施性', obstacles: '关键障碍', agencies: '涉及机构', noStakeholderData: '暂无利益相关方影响数据。', noImplementationData: '暂无实施数据。', burden: '负担' },
};

// ---------------------------------------------------------------------------
// Localization helpers
// ---------------------------------------------------------------------------

function localizeLevel(level: 'high' | 'medium' | 'low', lang: Language | string): string {
  return LEVEL_LABELS[lang as string]?.[level] ?? LEVEL_LABELS.en[level];
}

function localizeRiskType(type: RiskAssessment['type'], lang: Language | string): string {
  return RISK_TYPE_LABELS[lang as string]?.[type] ?? RISK_TYPE_LABELS.en[type];
}

function localizedImplementationLabels(lang: Language | string): { feasibility: string; obstacles: string; agencies: string; noStakeholderData: string; noImplementationData: string; burden: string } {
  return IMPLEMENTATION_LABELS[lang as string] ?? IMPLEMENTATION_LABELS.en;
}

// ---------------------------------------------------------------------------
// Ranking helpers
// ---------------------------------------------------------------------------

function severityRank(s: string): number {
  return s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}

function magnitudeRank(magnitude: 'significant' | 'moderate' | 'minor'): number {
  return magnitude === 'significant' ? 3 : magnitude === 'moderate' ? 2 : 1;
}

function feasibilityRank(f: string): number {
  return f === 'high' ? 3 : f === 'medium' ? 2 : 1;
}

// ---------------------------------------------------------------------------
// Framework analysis HTML renderers
// ---------------------------------------------------------------------------

/**
 * Aggregate PESTLE dimensions across multiple document analyses into a
 * deduplicated list per dimension and render as an HTML description list.
 */
export function renderAggregatedPestle(analyses: DocumentAnalysis[], lang: Language | string): string {
  const merged: PESTLEAnalysis = {
    political: [], economic: [], social: [],
    technological: [], legal: [], environmental: [],
  };

  for (const a of analyses) {
    const p = a.pestleDimensions;
    merged.political.push(...p.political);
    merged.economic.push(...p.economic);
    merged.social.push(...p.social);
    merged.technological.push(...p.technological);
    merged.legal.push(...p.legal);
    merged.environmental.push(...p.environmental);
  }

  // Deduplicate per dimension
  const dedup = (arr: string[]): string[] => [...new Set(arr)].slice(0, MAX_PESTLE_ITEMS);

  const labels = PESTLE_LABELS[lang as string] ?? PESTLE_LABELS.en;
  const dims: Array<[string, string[]]> = [
    [labels.political, dedup(merged.political)],
    [labels.economic, dedup(merged.economic)],
    [labels.social, dedup(merged.social)],
    [labels.technological, dedup(merged.technological)],
    [labels.legal, dedup(merged.legal)],
    [labels.environmental, dedup(merged.environmental)],
  ];

  const items = dims
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) =>
      `      <dt><strong>${escapeHtml(label)}</strong></dt>\n      <dd>${items.map(i => escapeHtml(i)).join(' ')}</dd>`,
    )
    .join('\n');

  return `    <dl class="pestle-analysis">\n${items}\n    </dl>`;
}

/**
 * Render a summary of stakeholder impacts across all analysed documents.
 * Shows up to 7 stakeholder groups with impact direction, confidence, and burden.
 */
export function renderStakeholderImpactSummary(analyses: DocumentAnalysis[], lang: Language | string): string {
  const labels = localizedImplementationLabels(lang);
  // Collect all stakeholder impacts, deduplicated by stakeholder name
  const impactMap = new Map<string, StakeholderImpact>();
  for (const a of analyses) {
    for (const impact of a.stakeholderImpacts) {
      // Keep the higher-magnitude impact per stakeholder
      const existing = impactMap.get(impact.stakeholder);
      if (!existing || magnitudeRank(impact.directImpact.magnitude) > magnitudeRank(existing.directImpact.magnitude)) {
        impactMap.set(impact.stakeholder, impact);
      }
    }
  }

  const impacts = [...impactMap.values()].slice(0, MAX_STAKEHOLDER_IMPACTS);
  if (impacts.length === 0) return `    <p>${escapeHtml(labels.noStakeholderData)}</p>`;

  const rows = impacts.map(i => {
    const directionIcon =
      i.directImpact.direction === 'positive' ? '↑'
      : i.directImpact.direction === 'negative' ? '↓'
      : i.directImpact.direction === 'mixed' ? '↕'
      : '→';
    const burdenText = localizeLevel(i.implementationBurden, lang);
    return `      <li><strong>${escapeHtml(i.displayName)}</strong>: ${directionIcon} ${escapeHtml(i.directImpact.summary)} (${escapeHtml(i.confidence)}; ${escapeHtml(labels.burden)}: ${escapeHtml(burdenText)})</li>`;
  });

  return `    <ul class="stakeholder-impact-list">\n${rows.join('\n')}\n    </ul>`;
}

/**
 * Render a risk assessment summary. Groups risks by type and keeps the
 * highest-severity risk per type.
 */
export function renderRiskAssessment(risks: RiskAssessment[], lang: Language | string): string {
  // Deduplicate by type, preferring higher severity
  const byType = new Map<string, RiskAssessment>();
  for (const r of risks) {
    const key = r.type;
    const existing = byType.get(key);
    if (!existing || severityRank(r.severity) > severityRank(existing.severity)) {
      byType.set(key, r);
    }
  }

  const top = [...byType.values()].slice(0, MAX_RISK_ITEMS);
  const rows = top.map(r => {
    const icon = r.severity === 'high' ? '🔴' : r.severity === 'medium' ? '🟡' : '🟢';
    return `      <li>${icon} <strong>${escapeHtml(localizeRiskType(r.type, lang))}</strong> (${escapeHtml(localizeLevel(r.severity, lang))}): ${escapeHtml(r.description)}</li>`;
  });

  return `    <ul class="risk-assessment-list">\n${rows.join('\n')}\n    </ul>`;
}

/**
 * Render implementation assessment summary from framework analyses.
 */
export function renderImplementationAssessment(analyses: DocumentAnalysis[], lang: Language | string): string {
  const labels = localizedImplementationLabels(lang);
  const assessments: ImplementationAssessment[] = analyses.map(a => a.implementationAssessment);
  if (assessments.length === 0) return `    <p>${escapeHtml(labels.noImplementationData)}</p>`;

  // Aggregate obstacles and agencies across all documents
  const allObstacles = new Set<string>();
  const allAgencies = new Set<string>();
  let highestFeasibility: ImplementationAssessment['feasibility'] = 'high';
  let selectedAssessment: ImplementationAssessment = assessments[0];

  for (const ia of assessments) {
    ia.keyObstacles.forEach(o => allObstacles.add(o));
    ia.agenciesInvolved.forEach(a => allAgencies.add(a));
    if (feasibilityRank(ia.feasibility) < feasibilityRank(highestFeasibility)) {
      highestFeasibility = ia.feasibility;
      selectedAssessment = ia;
    }
  }

  const parts: string[] = [];
  const fIcon = highestFeasibility === 'high' ? '🟢' : highestFeasibility === 'medium' ? '🟡' : '🔴';
  const timeline = selectedAssessment.estimatedTimeline;
  parts.push(`    <p>${fIcon} <strong>${escapeHtml(labels.feasibility)}:</strong> ${escapeHtml(localizeLevel(highestFeasibility, lang))}. ${escapeHtml(timeline)}</p>`);

  if (allObstacles.size > 0) {
    const obstacleList = [...allObstacles].slice(0, MAX_IMPLEMENTATION_OBSTACLES).map(o => `<li>${escapeHtml(o)}</li>`).join('');
    parts.push(`    <p><strong>${escapeHtml(labels.obstacles)}:</strong></p>\n    <ul>${obstacleList}</ul>`);
  }

  if (allAgencies.size > 0) {
    parts.push(`    <p><strong>${escapeHtml(labels.agencies)}:</strong> ${[...allAgencies].slice(0, MAX_AGENCIES_DISPLAYED).map(a => escapeHtml(a)).join(', ')}</p>`);
  }

  return parts.join('\n');
}
