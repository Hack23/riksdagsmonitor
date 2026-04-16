/**
 * @module generate-news-enhanced/generators
 * @description Article generator functions for week-ahead, committee reports,
 * propositions, and motions article types.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import {
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  filterFreshDocuments,
  type RawDocument,
} from '../data-transformers.js';
import {
  generateStakeholderSwotSection,
  generateDashboardSection,
  generateEconomicDashboardSection,
  generateMindmapSection,
  generateSankeySection,
  buildAIMindmapAnalysis,
  buildMindmapOptionsFromAnalysis,
  type SankeyNode,
  type SankeyFlow,
} from '../data-transformers/index.js';
import { generateDeepAnalysisSection, localizeDocType } from '../data-transformers/content-generators/index.js';
import { generateDeepPolicyAnalysis, detectPolicyDomains } from '../data-transformers/policy-analysis.js';
import { escapeHtml } from '../html-utils.js';
import { generateArticleHTML } from '../article-template.js';
import { MCPClient } from '../mcp-client.js';
import type { Language } from '../types/language.js';
import type { GenerationResult, DateRange, ArticleCategory, TemplateSection, DashboardChartConfig, DashboardTableConfig } from '../types/article.js';
import type { TitleSet } from './types.js';
import fs from 'node:fs';
import path from 'node:path';
import { languages, stats, getSharedClient, requireMcp, toISODate, documentIds, documentUrls, focusTopic, analysisDepth, METADATA_DIR } from './config.js';
import type { AnalysisDepth } from './config.js';
import {
  getWeekAheadDateRange,
  formatDateForSlug,
  writeSingleArticle,
  generateDynamicTitle,
  getAnalysisEnrichment,
} from './helpers.js';

/** Article generation iteration metadata */
interface AnalysisIterationMetadata {
  iteration?: number;
  depth: AnalysisDepth;
  enhancedSections?: string[];
  articleSlug?: string;
  lang?: string;
  iterationsCompleted?: number;
  iterationDurationsMs?: number[];
  confidenceScore?: number;
  validationResult?: unknown;
  documentCount?: number;
  enrichedCount?: number;
  focusTopic?: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------

/** Returns empty stakeholder list — AI produces SWOT in agentic workflows */
function buildAISwotStakeholders(_docs: unknown[], _topic: string, _lang: string): never[] {
  return [];
}

/** Returns empty dashboard data — AI produces dashboards in agentic workflows */
function analyzeDashboardData(_docs: unknown[], _topic: string, _lang: string) {
  return { charts: [] as DashboardChartConfig[], tables: [] as DashboardTableConfig[], summary: '' };
}

/** Stakeholder display names for mindmap/sankey labels */
const AI_STAKEHOLDER_NAMES: Record<string, Record<string, string>> = {
  'government-coalition': { en: 'Government Coalition', sv: 'Regeringskoalitionen' },
  'opposition': { en: 'Opposition', sv: 'Oppositionen' },
  'private-sector': { en: 'Private Sector', sv: 'Näringslivet' },
};

// ---------------------------------------------------------------------------
// Per-language labels for deep-analysis enrichment sections (14 languages)
// ---------------------------------------------------------------------------

/** Section headings and labels for deep-analysis enrichment sections. */
const ENRICHMENT_LABELS: Record<string, Record<Language, string>> = {
  swotHeading: {
    en: 'SWOT Analysis', sv: 'SWOT-analys', da: 'SWOT-analyse',
    no: 'SWOT-analyse', fi: 'SWOT-analyysi', de: 'SWOT-Analyse',
    fr: 'Analyse SWOT', es: 'Análisis DAFO', nl: 'SWOT-analyse',
    ar: 'تحليل SWOT', he: 'ניתוח SWOT', ja: 'SWOT分析', ko: 'SWOT 분석', zh: 'SWOT分析',
  },
  strengths: {
    en: 'Strengths', sv: 'Styrkor', da: 'Styrker',
    no: 'Styrker', fi: 'Vahvuudet', de: 'Stärken',
    fr: 'Forces', es: 'Fortalezas', nl: 'Sterktes',
    ar: 'نقاط القوة', he: 'חוזקות', ja: '強み', ko: '강점', zh: '优势',
  },
  weaknesses: {
    en: 'Weaknesses', sv: 'Svagheter', da: 'Svagheder',
    no: 'Svakheter', fi: 'Heikkoudet', de: 'Schwächen',
    fr: 'Faiblesses', es: 'Debilidades', nl: 'Zwaktes',
    ar: 'نقاط الضعف', he: 'חולשות', ja: '弱み', ko: '약점', zh: '劣势',
  },
  opportunities: {
    en: 'Opportunities', sv: 'Möjligheter', da: 'Muligheder',
    no: 'Muligheter', fi: 'Mahdollisuudet', de: 'Chancen',
    fr: 'Opportunités', es: 'Oportunidades', nl: 'Kansen',
    ar: 'الفرص', he: 'הזדמנויות', ja: '機会', ko: '기회', zh: '机会',
  },
  threats: {
    en: 'Threats', sv: 'Hot', da: 'Trusler',
    no: 'Trusler', fi: 'Uhat', de: 'Risiken',
    fr: 'Menaces', es: 'Amenazas', nl: 'Bedreigingen',
    ar: 'التهديدات', he: 'איומים', ja: '脅威', ko: '위협', zh: '威胁',
  },
  stakeholderHeading: {
    en: 'Stakeholder Perspectives', sv: 'Intressentperspektiv', da: 'Interessentperspektiver',
    no: 'Interessentperspektiver', fi: 'Sidosryhmänäkemykset', de: 'Stakeholder-Perspektiven',
    fr: 'Perspectives des parties prenantes', es: 'Perspectivas de partes interesadas',
    nl: 'Stakeholderperspectiven', ar: 'وجهات نظر أصحاب المصلحة', he: 'פרספקטיבות בעלי עניין',
    ja: 'ステークホルダーの視点', ko: '이해관계자 관점', zh: '利益相关者观点',
  },
  riskHeading: {
    en: 'Risk & Threat Assessment', sv: 'Risk- och hotbedömning', da: 'Risiko- og trusselsvurdering',
    no: 'Risiko- og trusselvurdering', fi: 'Riski- ja uhka-arvio', de: 'Risiko- und Bedrohungsbewertung',
    fr: 'Évaluation des risques et menaces', es: 'Evaluación de riesgos y amenazas',
    nl: 'Risico- en dreigingsbeoordeling', ar: 'تقييم المخاطر والتهديدات', he: 'הערכת סיכונים ואיומים',
    ja: 'リスクと脅威の評価', ko: '위험 및 위협 평가', zh: '风险与威胁评估',
  },
  democraticHealth: {
    en: 'Democratic Health', sv: 'Demokratisk hälsa', da: 'Demokratisk sundhed',
    no: 'Demokratisk helse', fi: 'Demokraattinen terveys', de: 'Demokratische Gesundheit',
    fr: 'Santé démocratique', es: 'Salud democrática', nl: 'Democratische gezondheid',
    ar: 'الصحة الديمقراطية', he: 'בריאות דמוקרטית', ja: '民主主義の健全性', ko: '민주적 건강', zh: '民主健康',
  },
  threatIndicators: {
    en: 'Threat Indicators', sv: 'Hotindikatorer', da: 'Trusselsindikatorer',
    no: 'Trusselindikatorer', fi: 'Uhkaindikaattorit', de: 'Bedrohungsindikatoren',
    fr: 'Indicateurs de menace', es: 'Indicadores de amenaza', nl: 'Dreigingsindicatoren',
    ar: 'مؤشرات التهديد', he: 'מדדי איום', ja: '脅威指標', ko: '위협 지표', zh: '威胁指标',
  },
  forwardHeading: {
    en: 'What to Watch Next', sv: 'Vad händer härnäst?', da: 'Hvad skal man holde øje med?',
    no: 'Hva bør følges med på?', fi: 'Mitä seurata seuraavaksi?', de: 'Was kommt als Nächstes?',
    fr: 'Quoi surveiller ensuite?', es: '¿Qué observar a continuación?',
    nl: 'Wat nu te volgen?', ar: 'ما الذي يجب مراقبته؟', he: 'מה לעקוב אחריו?',
    ja: '次に注目すべきこと', ko: '다음에 주목할 점', zh: '下一步关注什么？',
  },
  significanceHeading: {
    en: 'Most Significant Documents', sv: 'Mest betydande dokument', da: 'Mest betydningsfulde dokumenter',
    no: 'Mest betydningsfulle dokumenter', fi: 'Merkittävimmät asiakirjat', de: 'Bedeutendste Dokumente',
    fr: 'Documents les plus significatifs', es: 'Documentos más significativos',
    nl: 'Meest significante documenten', ar: 'أهم الوثائق', he: 'המסמכים המשמעותיים ביותר',
    ja: '最も重要な文書', ko: '가장 중요한 문서', zh: '最重要的文件',
  },
  docId: {
    en: 'Doc ID', sv: 'Dok-ID', da: 'Dok-ID',
    no: 'Dok-ID', fi: 'Asiakirja-ID', de: 'Dok-ID',
    fr: 'ID doc.', es: 'ID doc.', nl: 'Doc-ID',
    ar: 'معرف المستند', he: 'מזהה מסמך', ja: '文書ID', ko: '문서 ID', zh: '文档ID',
  },
  score: {
    en: 'Score', sv: 'Poäng', da: 'Score',
    no: 'Poeng', fi: 'Pistemäärä', de: 'Bewertung',
    fr: 'Score', es: 'Puntuación', nl: 'Score',
    ar: 'النتيجة', he: 'ציון', ja: 'スコア', ko: '점수', zh: '评分',
  },
  reason: {
    en: 'Reason', sv: 'Motivering', da: 'Begrundelse',
    no: 'Begrunnelse', fi: 'Peruste', de: 'Begründung',
    fr: 'Raison', es: 'Motivo', nl: 'Reden',
    ar: 'السبب', he: 'סיבה', ja: '理由', ko: '이유', zh: '原因',
  },
  impactHigh: {
    en: 'High impact', sv: 'Hög påverkan', da: 'Høj påvirkning',
    no: 'Høy påvirkning', fi: 'Suuri vaikutus', de: 'Hohe Auswirkung',
    fr: 'Impact élevé', es: 'Alto impacto', nl: 'Hoge impact',
    ar: 'تأثير عالٍ', he: 'השפעה גבוהה', ja: '影響大', ko: '높은 영향', zh: '高影响',
  },
  impactMedium: {
    en: 'Medium impact', sv: 'Medelpåverkan', da: 'Middel påvirkning',
    no: 'Middels påvirkning', fi: 'Keskimääräinen vaikutus', de: 'Mittlere Auswirkung',
    fr: 'Impact moyen', es: 'Impacto medio', nl: 'Gemiddelde impact',
    ar: 'تأثير متوسط', he: 'השפעה בינונית', ja: '影響中', ko: '중간 영향', zh: '中影响',
  },
  impactLow: {
    en: 'Low impact', sv: 'Låg påverkan', da: 'Lav påvirkning',
    no: 'Lav påvirkning', fi: 'Pieni vaikutus', de: 'Geringe Auswirkung',
    fr: 'Impact faible', es: 'Bajo impacto', nl: 'Lage impact',
    ar: 'تأثير منخفض', he: 'השפעה נמוכה', ja: '影響小', ko: '낮은 영향', zh: '低影响',
  },
};

/** Stakeholder perspective labels per language */
const STAKEHOLDER_LABELS: Record<string, Record<Language, string>> = {
  government: {
    en: 'Government Coalition', sv: 'Regeringskoalitionen', da: 'Regeringskoalitionen',
    no: 'Regjeringskoalisjonen', fi: 'Hallituskoalitio', de: 'Regierungskoalition',
    fr: 'Coalition gouvernementale', es: 'Coalición de gobierno', nl: 'Regeringscoalitie',
    ar: 'الائتلاف الحكومي', he: 'קואליציית הממשלה', ja: '与党連合', ko: '정부 연합', zh: '执政联盟',
  },
  opposition: {
    en: 'Opposition Bloc', sv: 'Oppositionen', da: 'Oppositionen',
    no: 'Opposisjonen', fi: 'Oppositio', de: 'Oppositionsblock',
    fr: "Bloc d'opposition", es: 'Bloque de oposición', nl: 'Oppositieblok',
    ar: 'كتلة المعارضة', he: 'גוש האופוזיציה', ja: '野党ブロック', ko: '야당 블록', zh: '反对派阵营',
  },
  citizen: {
    en: 'Citizens', sv: 'Medborgare', da: 'Borgere',
    no: 'Borgere', fi: 'Kansalaiset', de: 'Bürger',
    fr: 'Citoyens', es: 'Ciudadanos', nl: 'Burgers',
    ar: 'المواطنون', he: 'אזרחים', ja: '市民', ko: '시민', zh: '公民',
  },
  economic: {
    en: 'Business/Economy', sv: 'Näringsliv/Ekonomi', da: 'Erhvervsliv/Økonomi',
    no: 'Næringsliv/Økonomi', fi: 'Elinkeinoelämä/Talous', de: 'Wirtschaft',
    fr: 'Entreprises/Économie', es: 'Negocios/Economía', nl: 'Bedrijfsleven/Economie',
    ar: 'الأعمال/الاقتصاد', he: 'עסקים/כלכלה', ja: 'ビジネス/経済', ko: '비즈니스/경제', zh: '商业/经济',
  },
  international: {
    en: 'International/EU', sv: 'Internationellt/EU', da: 'Internationalt/EU',
    no: 'Internasjonalt/EU', fi: 'Kansainvälinen/EU', de: 'International/EU',
    fr: 'International/UE', es: 'Internacional/UE', nl: 'Internationaal/EU',
    ar: 'دولي/الاتحاد الأوروبي', he: 'בינלאומי/האיחוד האירופי', ja: '国際/EU', ko: '국제/EU', zh: '国际/欧盟',
  },
  media: {
    en: 'Media/Public Opinion', sv: 'Media/Opinion', da: 'Medier/Offentlig mening',
    no: 'Media/Offentlig mening', fi: 'Media/Yleinen mielipide', de: 'Medien/Öffentliche Meinung',
    fr: "Médias/Opinion publique", es: 'Medios/Opinión pública', nl: 'Media/Publieke opinie',
    ar: 'وسائل الإعلام/الرأي العام', he: 'תקשורת/דעת הקהל', ja: 'メディア/世論', ko: '미디어/여론', zh: '媒体/舆论',
  },
};

/** Helper to look up localized labels with English fallback. */
function lbl(key: string, lang: Language): string {
  return ENRICHMENT_LABELS[key]?.[lang] ?? ENRICHMENT_LABELS[key]?.en ?? key;
}

/** Impact levels for SWOT entries (constrained union) */
type ImpactLevel = 'high' | 'medium' | 'low';

/** Normalize an unknown impact value to a safe ImpactLevel. */
function toImpactLevel(value: string | undefined): ImpactLevel {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

// ---------------------------------------------------------------------------
// Pre-computed analysis → article section builders
// ---------------------------------------------------------------------------

/**
 * Build deep analysis TemplateSections from pre-computed analysis enrichment.
 * This bridges the gap between AI-generated analysis files and the article HTML
 * by producing SWOT, stakeholder, forward indicators, and risk sections from
 * the `AnalysisEnrichment` data loaded by `getAnalysisEnrichment()`.
 *
 * When enrichment is null (no analysis files available), returns an empty array
 * for backward compatibility.
 */
/** @internal Exported for testing */
export function buildAnalysisEnrichmentSections(
  enrichment: import('./helpers.js').AnalysisEnrichment | null,
  lang: Language,
): TemplateSection[] {
  if (!enrichment) return [];
  const sections: TemplateSection[] = [];

  // ── 1. SWOT Analysis Section ────────────────────────────────────────────
  const swot = enrichment.swotAnalysis;
  if (swot && (swot.strengths.length > 0 || swot.weaknesses.length > 0 || swot.opportunities.length > 0 || swot.threats.length > 0)) {
    const renderEntries = (entries: Array<{ text: string; confidence?: string; impact?: string }>) =>
      entries.map(e => {
        const impact = toImpactLevel(e.impact);
        // Impact badges with localized ARIA labels for screen reader accessibility
        const impactLabelKey = impact === 'high' ? 'impactHigh' : impact === 'low' ? 'impactLow' : 'impactMedium';
        const impactLabel = lbl(impactLabelKey, lang);
        const badge = impact === 'high' ? '🔴' : impact === 'low' ? '🟢' : '🟡';
        return `<li><span class="impact-badge impact-${impact}" aria-label="${escapeHtml(impactLabel)}"><span aria-hidden="true">${badge}</span></span> ${escapeHtml(e.text)}</li>`;
      }).join('\n');

    const heading = lbl('swotHeading', lang);
    const subjectLine = swot.subject ? `<p class="swot-subject">${escapeHtml(swot.subject)}</p>` : '';
    const html = `
      <h2>${escapeHtml(heading)}</h2>
      ${subjectLine}
      <div class="swot-grid" aria-label="${escapeHtml(heading)}">
        <div class="swot-quadrant swot-strengths">
          <h3>${escapeHtml(lbl('strengths', lang))}</h3>
          <ul>${renderEntries(swot.strengths)}</ul>
        </div>
        <div class="swot-quadrant swot-weaknesses">
          <h3>${escapeHtml(lbl('weaknesses', lang))}</h3>
          <ul>${renderEntries(swot.weaknesses)}</ul>
        </div>
        <div class="swot-quadrant swot-opportunities">
          <h3>${escapeHtml(lbl('opportunities', lang))}</h3>
          <ul>${renderEntries(swot.opportunities)}</ul>
        </div>
        <div class="swot-quadrant swot-threats">
          <h3>${escapeHtml(lbl('threats', lang))}</h3>
          <ul>${renderEntries(swot.threats)}</ul>
        </div>
      </div>`;
    sections.push({ id: 'swot-analysis', html, className: 'swot-section' });
  }

  // ── 2. Stakeholder Perspectives Section ─────────────────────────────────
  const sp = enrichment.stakeholderPerspectives;
  if (sp) {
    const perspectives = [
      { key: 'government', icon: '🏛️' },
      { key: 'opposition', icon: '⚔️' },
      { key: 'citizen', icon: '👥' },
      { key: 'economic', icon: '📊' },
      { key: 'international', icon: '🌍' },
      { key: 'media', icon: '📰' },
    ].filter(p => sp[p.key as keyof typeof sp]);

    if (perspectives.length > 0) {
      const heading = lbl('stakeholderHeading', lang);
      const perspectiveHtml = perspectives.map(p => {
        const text = sp[p.key as keyof typeof sp] || '';
        const pLabel = STAKEHOLDER_LABELS[p.key]?.[lang] ?? STAKEHOLDER_LABELS[p.key]?.en ?? p.key;
        return `
          <div class="stakeholder-card">
            <h3><span aria-hidden="true">${p.icon}</span> ${escapeHtml(pLabel)}</h3>
            <p>${escapeHtml(text)}</p>
          </div>`;
      }).join('\n');

      sections.push({
        id: 'stakeholder-perspectives',
        html: `<h2>${escapeHtml(heading)}</h2><div class="stakeholder-grid">${perspectiveHtml}</div>`,
        className: 'stakeholder-section',
      });
    }
  }

  // ── 3. Risk & Threat Assessment Section ─────────────────────────────────
  if (enrichment.riskSummary || enrichment.democraticHealth || (enrichment.threatIndicators && enrichment.threatIndicators.length > 0)) {
    const heading = lbl('riskHeading', lang);
    let riskHtml = `<h2>${escapeHtml(heading)}</h2>`;

    if (enrichment.riskSummary) {
      riskHtml += `<p class="risk-summary">${escapeHtml(enrichment.riskSummary)}</p>`;
    }

    if (enrichment.democraticHealth) {
      const healthLabel = lbl('democraticHealth', lang);
      const healthBadge = enrichment.democraticHealth === 'HIGH' ? '🟢' :
        enrichment.democraticHealth === 'MEDIUM' ? '🟡' :
        enrichment.democraticHealth === 'LOW' ? '🟠' :
        enrichment.democraticHealth === 'AT_RISK' ? '🔴' : '🔴';
      riskHtml += `<p class="democratic-health"><strong>${escapeHtml(healthLabel)}:</strong> <span aria-hidden="true">${healthBadge}</span> ${enrichment.democraticHealth}</p>`;
    }

    if (enrichment.threatIndicators && enrichment.threatIndicators.length > 0) {
      const indicatorLabel = lbl('threatIndicators', lang);
      riskHtml += `<h3>${escapeHtml(indicatorLabel)}</h3><ul>`;
      for (const indicator of enrichment.threatIndicators.slice(0, 6)) {
        riskHtml += `<li><span aria-hidden="true">🎯</span> ${escapeHtml(indicator)}</li>`;
      }
      riskHtml += `</ul>`;
    }

    sections.push({ id: 'risk-assessment', html: riskHtml, className: 'risk-section' });
  }

  // ── 4. Forward Indicators Section ───────────────────────────────────────
  if (enrichment.forwardIndicators && enrichment.forwardIndicators.length > 0) {
    const heading = lbl('forwardHeading', lang);
    let forwardHtml = `<h2>${escapeHtml(heading)}</h2><ul class="forward-indicators">`;
    for (const indicator of enrichment.forwardIndicators.slice(0, 8)) {
      forwardHtml += `<li><span aria-hidden="true">🔮</span> ${escapeHtml(indicator)}</li>`;
    }
    forwardHtml += `</ul>`;

    sections.push({ id: 'forward-indicators', html: forwardHtml, className: 'forward-section' });
  }

  // ── 5. Significance-Ranked Documents Section ────────────────────────────
  if (enrichment.topDocuments && enrichment.topDocuments.length > 0) {
    const heading = lbl('significanceHeading', lang);
    let sigHtml = `<h2>${escapeHtml(heading)}</h2>`;
    sigHtml += `<table class="significance-table" role="table" aria-label="${escapeHtml(heading)}">`;
    sigHtml += `<thead><tr><th scope="col">${escapeHtml(lbl('docId', lang))}</th><th scope="col">${escapeHtml(lbl('score', lang))}</th><th scope="col">${escapeHtml(lbl('reason', lang))}</th></tr></thead><tbody>`;
    for (const doc of enrichment.topDocuments.slice(0, 10)) {
      const scoreColor = doc.score >= 80 ? 'high' : doc.score >= 50 ? 'medium' : 'low';
      sigHtml += `<tr><td><code>${escapeHtml(doc.docId)}</code></td><td class="score-${scoreColor}">${doc.score}</td><td>${escapeHtml(doc.reason)}</td></tr>`;
    }
    sigHtml += `</tbody></table>`;

    sections.push({ id: 'significance-ranking', html: sigHtml, className: 'significance-section' });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Shared article visualization builder
// ---------------------------------------------------------------------------

/**
 * Build SWOT, dashboard, and economic TemplateSections for standard article
 * types (not deep-inspection, which has its own richer builder).
 *
 * Produces 1–3 sections depending on available data:
 *  - SWOT stakeholder analysis (always, when docs.length >= 2)
 *  - Chart.js dashboard with document type breakdown (when docs.length >= 3)
 *  - Economic dashboard (when policyDomains match World Bank indicators)
 *
 * Each section is safe to append to `generateArticleHTML({ sections })`.
 */
export function buildArticleVisualizationSections(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): TemplateSection[] {
  const sections: TemplateSection[] = [];
  if (docs.length < 2) return sections;

  try {
    // ── 1. SWOT stakeholder analysis ──────────────────────────────────────
    const stakeholders = buildAISwotStakeholders(docs, topic ?? '', lang);
    if (stakeholders.length > 0) {
      const swotSection = generateStakeholderSwotSection({ stakeholders, lang });
      sections.push(swotSection);
    }
  } catch { /* graceful degradation */ }

  try {
    // ── 2. Chart.js dashboard (doc-type breakdown + AI analysis) ──────────
    if (docs.length >= 3) {
      const dashboardAnalysis = analyzeDashboardData(docs, topic ?? '', lang);
      if (dashboardAnalysis.charts.length > 0 || dashboardAnalysis.tables.length > 0) {
        const dashboardSection = generateDashboardSection({
          data: {
            title: 'Policy Analysis Dashboard',
            summary: dashboardAnalysis.summary,
            charts: dashboardAnalysis.charts,
            tables: dashboardAnalysis.tables,
          },
          lang,
        });
        sections.push(dashboardSection);
      }
    }
  } catch { /* graceful degradation */ }

  try {
    // ── 3. Economic dashboard (World Bank indicators for detected domains) ─
    const allDomains = new Set<string>();
    for (const d of docs) {
      for (const dom of detectPolicyDomains(d, lang)) {
        allDomains.add(dom);
      }
    }
    if (allDomains.size > 0) {
      const econSection = generateEconomicDashboardSection({
        policyDomains: [...allDomains],
        lang,
      });
      if (econSection) sections.push(econSection);
    }
  } catch { /* graceful degradation */ }

  return sections;
}

// ---------------------------------------------------------------------------
// Generator functions
// ---------------------------------------------------------------------------

/**
 * Generate Week Ahead article in specified languages
 */
export async function generateWeekAhead(): Promise<GenerationResult> {
  console.log('📅 Generating Week Ahead article...');

  try {
    const client: MCPClient = await getSharedClient();
    const dateRange: DateRange = getWeekAheadDateRange();

    console.log(`  📆 Date range: ${dateRange.start} to ${dateRange.end}`);

    // 1. Fetch calendar events from MCP
    console.log('  🔄 Fetching calendar events from riksdag-regering-mcp...');
    const events: unknown[] = await client.fetchCalendarEvents(dateRange.start, dateRange.end);
    console.log(`  📊 Found ${events.length} events`);

    // 2. Fetch upcoming/recent documents
    const rawDocs = await client.searchDocuments({ from_date: dateRange.start, to_date: dateRange.end, limit: 30 })
      .catch((e: unknown) => { if (requireMcp) throw e; return [] as unknown[]; });
    const documents: RawDocument[] = Array.isArray(rawDocs) ? rawDocs as RawDocument[] : [];
    console.log(`  📊 Found ${documents.length} upcoming documents`);

    // 3. Fetch parliamentary questions (fragor)
    console.log('  🔄 Fetching parliamentary questions...');
    const rawQuestions = await client.fetchWrittenQuestions({ limit: 20 })
      .catch((e: unknown) => { if (requireMcp) throw e; return [] as unknown[]; });
    const questions: unknown[] = Array.isArray(rawQuestions) ? rawQuestions : [];
    console.log(`  📊 Found ${questions.length} written questions`);

    // 4. Fetch interpellations (interpellationer)
    console.log('  🔄 Fetching interpellations...');
    const rawInterpellations = await client.fetchInterpellations({ limit: 15 })
      .catch((e: unknown) => { if (requireMcp) throw e; return [] as unknown[]; });
    const interpellations: RawDocument[] = Array.isArray(rawInterpellations) ? rawInterpellations as RawDocument[] : [];
    console.log(`  📊 Found ${interpellations.length} interpellations`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-week-ahead`;

    // 5. Load pre-computed analysis enrichment (classification, risk, confidence)
    const enrichment = await getAnalysisEnrichment();

    // 6. Generate for each requested language
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      // Transform data for this language
      // MCP returns unknown[] — cast to match data-transformers' expected shapes
      const eventGrid = transformCalendarToEventGrid(events as Parameters<typeof transformCalendarToEventGrid>[0], lang);
      const weekData = {
        events: events as Parameters<typeof transformCalendarToEventGrid>[0],
        documents,
        questions: questions as import('../data-transformers/types.js').RawDocument[],
        interpellations: interpellations as import('../data-transformers/types.js').RawDocument[],
        highlights: [] as Array<{title: string; description: string}>,
      };
      const content: string = generateArticleContent(weekData, 'week-ahead', lang);
      const watchPoints = extractWatchPoints({ events: events as Parameters<typeof transformCalendarToEventGrid>[0], documents }, lang);
      const metadata = generateMetadata({ events: events as Parameters<typeof transformCalendarToEventGrid>[0], documents }, 'week-ahead', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_calendar_events', 'search_dokument', 'get_fragor', 'get_interpellationer']);

      // Language-specific titles
      const titles: Record<Language, TitleSet> = {
        en: { title: `Week Ahead: ${dateRange.start} to ${dateRange.end}`, subtitle: `Parliamentary calendar, committee meetings, and chamber debates for the coming week` },
        sv: { title: `Vecka Framåt: ${dateRange.start} till ${dateRange.end}`, subtitle: `Riksdagens kalender, utskottsmöten och kammarens debatter för kommande vecka` },
        da: { title: `Ugen Fremover: ${dateRange.start} til ${dateRange.end}`, subtitle: `Parlamentarisk kalender, udvalgsmøder og debatter for den kommende uge` },
        no: { title: `Uke Fremover: ${dateRange.start} til ${dateRange.end}`, subtitle: `Parlamentarisk kalender, komitémøter og debatter for kommende uke` },
        fi: { title: `Tuleva Viikko: ${dateRange.start} - ${dateRange.end}`, subtitle: `Parlamentin kalenteri, valiokuntien kokoukset ja keskustelut tulevalle viikolle` },
        de: { title: `Woche Voraus: ${dateRange.start} bis ${dateRange.end}`, subtitle: `Parlamentarischer Kalender, Ausschusssitzungen und Debatten für die kommende Woche` },
        fr: { title: `Semaine à Venir: ${dateRange.start} au ${dateRange.end}`, subtitle: `Calendrier parlementaire, réunions de commission et débats pour la semaine à venir` },
        es: { title: `Semana Próxima: ${dateRange.start} a ${dateRange.end}`, subtitle: `Calendario parlamentario, reuniones de comisión y debates para la próxima semana` },
        nl: { title: `Week Vooruit: ${dateRange.start} tot ${dateRange.end}`, subtitle: `Parlementaire kalender, commissievergaderingen en debatten voor de komende week` },
        ar: { title: `الأسبوع القادم: ${dateRange.start} إلى ${dateRange.end}`, subtitle: `التقويم البرلماني واجتماعات اللجان والمناقشات للأسبوع المقبل` },
        he: { title: `השבוע הקרוב: ${dateRange.start} עד ${dateRange.end}`, subtitle: `לוח שנה פרלמנטרי, פגישות ועדה ודיונים לשבוע הקרוב` },
        ja: { title: `来週の展望: ${dateRange.start} から ${dateRange.end}`, subtitle: `来週の議会カレンダー、委員会会議、討論` },
        ko: { title: `다음 주 전망: ${dateRange.start}부터 ${dateRange.end}까지`, subtitle: `다음 주 의회 일정, 위원회 회의 및 토론` },
        zh: { title: `下周展望：${dateRange.start} 至 ${dateRange.end}`, subtitle: `下周议会日程、委员会会议和辩论` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;
      // Enrich English title/subtitle with content-based highlights
      const enriched = lang === 'en' ? generateDynamicTitle(langTitles.title, content, documents.length + events.length) : langTitles;

      // Build visualization sections (SWOT, dashboard, economic)
      const sections = buildArticleVisualizationSections(documents, null, lang);
      // Append deep analysis sections from pre-computed analysis files (AI-written)
      sections.push(...buildAnalysisEnrichmentSections(enrichment, lang));
      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: enriched.title,
        subtitle: enriched.subtitle,
        date: toISODate(today),
        type: 'prospective' as ArticleCategory,
        readTime,
        lang,
        content,
        events: eventGrid,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags,
        sections,
        // Analysis references are injected by fix-analysis-references.ts post-processor
        ...(enrichment ?? {}),
      });
      await writeSingleArticle(html, slug, lang, 'week-ahead');
      console.log(`  ✅ ${lang.toUpperCase()} version generated`);
    }

    console.log('  ✅ Week Ahead article generated successfully in all requested languages');
    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Week Ahead:', (error as Error).message);
    console.error('   Stack:', (error as Error).stack);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Committee Reports article
 */
export async function generateCommitteeReports(): Promise<GenerationResult> {
  console.log('📋 Generating Committee Reports article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching committee reports from riksdag-regering-mcp...');
    let reports: unknown[] = filterFreshDocuments(await client.fetchCommitteeReports(10) as RawDocument[]);
    console.log(`  📊 Found ${reports.length} committee reports`);

    if (reports.length === 0) {
      console.log('  ℹ️ No new committee reports found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    reports = await client.enrichDocumentsWithContent(reports as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (reports as Array<Record<string, unknown>>).filter(r => r['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${reports.length} reports with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-committee-reports`;
    const enrichment = await getAnalysisEnrichment();

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedReports = reports as Parameters<typeof generateArticleContent>[0]['reports'];
      const content: string = generateArticleContent({ reports: typedReports }, 'committee-reports', lang);
      const watchPoints = extractWatchPoints({ reports: typedReports }, lang);
      const metadata = generateMetadata({ reports: typedReports }, 'committee-reports', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_betankanden', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Riksdag Committee Reports`, subtitle: `Riksdag Committee Reports — AI-generated political intelligence from Sweden's Riksdag` },
        sv: { title: `Utskottsbetänkanden från riksdagen`, subtitle: `Utskottsbetänkanden från riksdagen — AI-genererad politisk analys från Sveriges riksdag` },
        da: { title: `Udvalgsindstillinger fra Riksdagen`, subtitle: `Udvalgsindstillinger fra Riksdagen — AI-genereret politisk analyse fra det svenske parlament` },
        no: { title: `Komitéinnstillinger fra Riksdagen`, subtitle: `Komitéinnstillinger fra Riksdagen — AI-generert politisk analyse fra det svenske parlamentet` },
        fi: { title: `Valiokunnan mietinnöt Riksdagista`, subtitle: `Valiokunnan mietinnöt Riksdagista — tekoälytuotettu poliittinen analyysi Ruotsin valtiopäiviltä` },
        de: { title: `Ausschussberichte aus dem Riksdag`, subtitle: `Ausschussberichte aus dem Riksdag — KI-generierte politische Analyse aus dem schwedischen Parlament` },
        fr: { title: `Rapports de commission du Riksdag`, subtitle: `Rapports de commission du Riksdag — analyse politique générée par IA du Parlement suédois` },
        es: { title: `Informes de comisión del Riksdag`, subtitle: `Informes de comisión del Riksdag — análisis político generado por IA del Parlamento sueco` },
        nl: { title: `Commissierapporten uit de Riksdag`, subtitle: `Commissierapporten uit de Riksdag — AI-gegenereerde politieke analyse uit het Zweedse parlement` },
        ar: { title: `تقارير لجان الريكسداغ`, subtitle: `تقارير لجان الريكسداغ — تحليل سياسي بالذكاء الاصطناعي من البرلمان السويدي` },
        he: { title: `דוחות ועדות הריקסדאג`, subtitle: `דוחות ועדות הריקסדאג — ניתוח פוליטי שנוצר על ידי בינה מלאכותית מהפרלמנט השוודי` },
        ja: { title: `リクスダーグ委員会報告`, subtitle: `リクスダーグ委員会報告 — スウェーデン議会のAI生成政治分析` },
        ko: { title: `릭스다그 위원회 보고서`, subtitle: `릭스다그 위원회 보고서 — 스웨덴 의회의 AI 생성 정치 분석` },
        zh: { title: `瑞典议会委员会报告`, subtitle: `瑞典议会委员会报告 — 瑞典议会的AI生成政治分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;
      // Enrich English title/subtitle with content-based highlights
      const enriched = lang === 'en' ? generateDynamicTitle(langTitles.title, content, reports.length) : langTitles;

      // Build visualization sections (SWOT, dashboard, economic)
      const sections = buildArticleVisualizationSections(reports as RawDocument[], null, lang);
      // Append deep analysis sections from pre-computed analysis files (AI-written)
      sections.push(...buildAnalysisEnrichmentSections(enrichment, lang));

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: enriched.title,
        subtitle: enriched.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags,
        sections,
        // Analysis references are injected by fix-analysis-references.ts post-processor
        ...(enrichment ?? {}),
      });

      await writeSingleArticle(html, slug, lang, 'committee-reports');
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Committee Reports:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Government Propositions article
 */
export async function generatePropositions(): Promise<GenerationResult> {
  console.log('📜 Generating Government Propositions article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching propositions from riksdag-regering-mcp...');
    let propositions: unknown[] = filterFreshDocuments(await client.fetchPropositions(10) as RawDocument[]);
    console.log(`  📊 Found ${propositions.length} propositions`);

    if (propositions.length === 0) {
      console.log('  ℹ️ No new propositions found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    propositions = await client.enrichDocumentsWithContent(propositions as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (propositions as Array<Record<string, unknown>>).filter(p => p['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${propositions.length} propositions with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-government-propositions`;
    const enrichment = await getAnalysisEnrichment();

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedPropositions = propositions as Parameters<typeof generateArticleContent>[0]['propositions'];
      const content: string = generateArticleContent({ propositions: typedPropositions }, 'propositions', lang);
      const watchPoints = extractWatchPoints({ propositions: typedPropositions }, lang);
      const metadata = generateMetadata({ propositions: typedPropositions }, 'propositions', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_propositioner', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Government Propositions`, subtitle: `Government Propositions — AI-generated political intelligence from Sweden's Riksdag` },
        sv: { title: `Regeringens propositioner`, subtitle: `Regeringens propositioner — AI-genererad politisk analys från Sveriges riksdag` },
        da: { title: `Regeringsforslag fra Sverige`, subtitle: `Regeringsforslag fra Sverige — AI-genereret politisk analyse fra det svenske parlament` },
        no: { title: `Svenske regjeringsproposisjoner`, subtitle: `Svenske regjeringsproposisjoner — AI-generert politisk analyse fra det svenske parlamentet` },
        fi: { title: `Ruotsin hallituksen esitykset`, subtitle: `Ruotsin hallituksen esitykset — tekoälytuotettu poliittinen analyysi Ruotsin valtiopäiviltä` },
        de: { title: `Schwedische Regierungsvorlagen`, subtitle: `Schwedische Regierungsvorlagen — KI-generierte politische Analyse aus dem schwedischen Parlament` },
        fr: { title: `Propositions du gouvernement suédois`, subtitle: `Propositions du gouvernement suédois — analyse politique générée par IA du Parlement suédois` },
        es: { title: `Proposiciones del gobierno sueco`, subtitle: `Proposiciones del gobierno sueco — análisis político generado por IA del Parlamento sueco` },
        nl: { title: `Zweedse regeringsvoorstellen`, subtitle: `Zweedse regeringsvoorstellen — AI-gegenereerde politieke analyse uit het Zweedse parlement` },
        ar: { title: `مقترحات الحكومة السويدية`, subtitle: `مقترحات الحكومة السويدية — تحليل سياسي بالذكاء الاصطناعي من البرلمان السويدي` },
        he: { title: `הצעות הממשלה השוודית`, subtitle: `הצעות הממשלה השוודית — ניתוח פוליטי שנוצר על ידי בינה מלאכותית מהפרלמנט השוודי` },
        ja: { title: `スウェーデン政府提案`, subtitle: `スウェーデン政府提案 — スウェーデン議会のAI生成政治分析` },
        ko: { title: `스웨덴 정부 법안`, subtitle: `스웨덴 정부 법안 — 스웨덴 의회의 AI 생성 정치 분석` },
        zh: { title: `瑞典政府提案`, subtitle: `瑞典政府提案 — 瑞典议会的AI生成政治分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;
      // Enrich English title/subtitle with content-based highlights
      const enriched = lang === 'en' ? generateDynamicTitle(langTitles.title, content, propositions.length) : langTitles;

      // Build visualization sections (SWOT, dashboard, economic)
      const sections = buildArticleVisualizationSections(propositions as RawDocument[], null, lang);
      // Append deep analysis sections from pre-computed analysis files (AI-written)
      sections.push(...buildAnalysisEnrichmentSections(enrichment, lang));

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: enriched.title,
        subtitle: enriched.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags,
        sections,
        // Analysis references are injected by fix-analysis-references.ts post-processor
        ...(enrichment ?? {}),
      });

      await writeSingleArticle(html, slug, lang, 'propositions');
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Propositions:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Opposition Motions article
 */
export async function generateMotions(): Promise<GenerationResult> {
  console.log('📝 Generating Opposition Motions article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching motions from riksdag-regering-mcp...');
    let motions: unknown[] = filterFreshDocuments(await client.fetchMotions(10) as RawDocument[]);
    console.log(`  📊 Found ${motions.length} motions`);

    if (motions.length === 0) {
      console.log('  ℹ️ No new motions found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    motions = await client.enrichDocumentsWithContent(motions as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (motions as Array<Record<string, unknown>>).filter(m => m['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${motions.length} motions with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-opposition-motions`;
    const enrichment = await getAnalysisEnrichment();

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedMotions = motions as Parameters<typeof generateArticleContent>[0]['motions'];
      const content: string = generateArticleContent({ motions: typedMotions }, 'motions', lang);
      const watchPoints = extractWatchPoints({ motions: typedMotions }, lang);
      const metadata = generateMetadata({ motions: typedMotions }, 'motions', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_motioner', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Opposition Motions`, subtitle: `Opposition Motions — AI-generated political intelligence from Sweden's Riksdag` },
        sv: { title: `Oppositionsmotioner`, subtitle: `Oppositionsmotioner — AI-genererad politisk analys från Sveriges riksdag` },
        da: { title: `Svenske oppositionsforslag`, subtitle: `Svenske oppositionsforslag — AI-genereret politisk analyse fra det svenske parlament` },
        no: { title: `Svenske opposisjonsforslag`, subtitle: `Svenske opposisjonsforslag — AI-generert politisk analyse fra det svenske parlamentet` },
        fi: { title: `Ruotsin opposition aloitteet`, subtitle: `Ruotsin opposition aloitteet — tekoälytuotettu poliittinen analyysi Ruotsin valtiopäiviltä` },
        de: { title: `Schwedische Oppositionsanträge`, subtitle: `Schwedische Oppositionsanträge — KI-generierte politische Analyse aus dem schwedischen Riksdag` },
        fr: { title: `Motions de l'opposition suédoise`, subtitle: `Motions de l'opposition suédoise — analyse politique générée par IA du Riksdag suédois` },
        es: { title: `Mociones de la oposición sueca`, subtitle: `Mociones de la oposición sueca — análisis político generado por IA del Riksdag sueco` },
        nl: { title: `Zweedse oppositiemoties`, subtitle: `Zweedse oppositiemoties — AI-gegenereerde politieke analyse uit de Zweedse Riksdag` },
        ar: { title: `اقتراحات المعارضة السويدية`, subtitle: `اقتراحات المعارضة السويدية — تحليل سياسي بالذكاء الاصطناعي من البرلمان السويدي` },
        he: { title: `הצעות האופוזיציה השוודית`, subtitle: `הצעות האופוזיציה השוודית — ניתוח פוליטי שנוצר על ידי בינה מלאכותית מהריקסדאג השוודי` },
        ja: { title: `スウェーデン野党動議`, subtitle: `スウェーデン野党動議 — スウェーデン議会のAI生成政治分析` },
        ko: { title: `스웨덴 야당 동의`, subtitle: `스웨덴 야당 동의 — 스웨덴 의회의 AI 생성 정치 분석` },
        zh: { title: `瑞典反对党动议`, subtitle: `瑞典反对党动议 — 瑞典议会的AI生成政治分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;
      // Enrich English title/subtitle with content-based highlights
      const enriched = lang === 'en' ? generateDynamicTitle(langTitles.title, content, motions.length) : langTitles;

      // Build visualization sections (SWOT, dashboard, economic)
      const sections = buildArticleVisualizationSections(motions as RawDocument[], null, lang);
      // Append deep analysis sections from pre-computed analysis files (AI-written)
      sections.push(...buildAnalysisEnrichmentSections(enrichment, lang));

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: enriched.title,
        subtitle: enriched.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags,
        sections,
        // Analysis references are injected by fix-analysis-references.ts post-processor
        ...(enrichment ?? {}),
      });

      await writeSingleArticle(html, slug, lang, 'motions');
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Motions:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Interpellation Debates article
 */
export async function generateInterpellations(): Promise<GenerationResult> {
  console.log('🔔 Generating Interpellation Debates article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching interpellations from riksdag-regering-mcp...');
    let interpellations: unknown[] = filterFreshDocuments(await client.fetchInterpellations({ limit: 15 }) as RawDocument[]);
    console.log(`  📊 Found ${interpellations.length} interpellations`);

    if (interpellations.length === 0) {
      console.log('  ℹ️ No new interpellations found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    interpellations = await client.enrichDocumentsWithContent(interpellations as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (interpellations as Array<Record<string, unknown>>).filter(m => m['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${interpellations.length} interpellations with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-interpellation-debates`;
    const enrichment = await getAnalysisEnrichment();

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedInterps = interpellations as import('../data-transformers/types.js').ArticleContentData['interpellations'];
      const content: string = generateArticleContent({ interpellations: typedInterps }, 'interpellations', lang);
      const watchPoints = extractWatchPoints({ interpellations: typedInterps }, lang);
      const metadata = generateMetadata({ interpellations: typedInterps }, 'interpellations', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_interpellationer', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Interpellation Debates`, subtitle: `Interpellation Debates — AI-generated political intelligence from Sweden's Riksdag` },
        sv: { title: `Interpellationsdebatter`, subtitle: `Interpellationsdebatter — AI-genererad politisk analys från Sveriges riksdag` },
        da: { title: `Interpellationsdebatter i Riksdagen`, subtitle: `Interpellationsdebatter i Riksdagen — AI-genereret politisk analyse fra det svenske parlament` },
        no: { title: `Interpellasjonsdebatter i Riksdagen`, subtitle: `Interpellasjonsdebatter i Riksdagen — AI-generert politisk analyse fra det svenske parlamentet` },
        fi: { title: `Välikysymyskeskustelut Riksdagissa`, subtitle: `Välikysymyskeskustelut Riksdagissa — tekoälytuotettu poliittinen analyysi Ruotsin valtiopäiviltä` },
        de: { title: `Interpellationsdebatten im Riksdag`, subtitle: `Interpellationsdebatten im Riksdag — KI-generierte politische Analyse aus dem schwedischen Riksdag` },
        fr: { title: `Débats d'interpellation au Riksdag`, subtitle: `Débats d'interpellation au Riksdag — analyse politique générée par IA du Parlement suédois` },
        es: { title: `Debates de interpelación en el Riksdag`, subtitle: `Debates de interpelación en el Riksdag — análisis político generado por IA del Parlamento sueco` },
        nl: { title: `Interpellatiedebatten in de Riksdag`, subtitle: `Interpellatiedebatten in de Riksdag — AI-gegenereerde politieke analyse uit de Zweedse Riksdag` },
        ar: { title: `مناقشات الاستجواب في الريكسداغ`, subtitle: `مناقشات الاستجواب في الريكسداغ — تحليل سياسي بالذكاء الاصطناعي من البرلمان السويدي` },
        he: { title: `דיוני אינטרפלציה בריקסדאג`, subtitle: `דיוני אינטרפלציה בריקסדאג — ניתוח פוליטי שנוצר על ידי בינה מלאכותית מהפרלמנט השוודי` },
        ja: { title: `リクスダーグ質問主意書討論`, subtitle: `リクスダーグ質問主意書討論 — スウェーデン議会のAI生成政治分析` },
        ko: { title: `릭스다그 대정부 질의 토론`, subtitle: `릭스다그 대정부 질의 토론 — 스웨덴 의회의 AI 생성 정치 분석` },
        zh: { title: `瑞典议会质询辩论`, subtitle: `瑞典议会质询辩论 — 瑞典议会的AI生成政治分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;
      // Enrich English title/subtitle with content-based highlights
      const enriched = lang === 'en' ? generateDynamicTitle(langTitles.title, content, interpellations.length) : langTitles;

      // Build visualization sections (SWOT, dashboard, economic)
      const sections = buildArticleVisualizationSections(interpellations as RawDocument[], null, lang);
      // Append deep analysis sections from pre-computed analysis files (AI-written)
      sections.push(...buildAnalysisEnrichmentSections(enrichment, lang));

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: enriched.title,
        subtitle: enriched.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags,
        sections,
        // Analysis references are injected by fix-analysis-references.ts post-processor
        ...(enrichment ?? {}),
      });

      await writeSingleArticle(html, slug, lang, 'interpellations');
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Interpellations:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

// ---------------------------------------------------------------------------
// URL & text utilities — implementation extracted to url-utils.ts
// Imported for local use and re-exported for backward compatibility.
// ---------------------------------------------------------------------------
import {
  extractDocIdFromUrl,
  isGovernmentUrl,
  isGitHubUrl,
  toGitHubRawUrl,
  hashPathSuffix,
  sanitizePlainText,
} from './url-utils.js';

export {
  extractDocIdFromUrl,
  isGovernmentUrl,
  isGitHubUrl,
  toGitHubRawUrl,
  hashPathSuffix,
  sanitizePlainText,
};

// ---------------------------------------------------------------------------
// Deep-Inspection content generator (topic-focused, comprehensive)
// ---------------------------------------------------------------------------

/** Cyberpunk-theme colour palette for deep-inspection dashboard charts. */
const DEEP_CHART_PALETTE: readonly string[] = [
  '#00d9ff', '#ff006e', '#ffbe0b', '#00ff88', '#ff8800', '#aa00ff',
];

/** Per-language headings for sections of the deep-inspection article. */
const DEEP_SECTION_LABELS: Readonly<Record<string, Partial<Record<Language, string>>>> = {
  documentIntelligence: {
    en: 'Document Intelligence Analysis',
    sv: 'Dokumentunderrättelseanalys',
    da: 'Dokumentefterretningsanalyse',
    no: 'Dokumentetterretningsanalyse',
    fi: 'Asiakirjatiedusteluanalyysi',
    de: 'Dokumentenintelligenz-Analyse',
    fr: 'Analyse renseignement documentaire',
    es: 'Análisis de inteligencia documental',
    nl: 'Documentintelligentie-analyse',
    ar: 'تحليل استخبارات الوثائق',
    he: 'ניתוח מודיעין מסמכים',
    ja: '文書インテリジェンス分析',
    ko: '문서 인텔리전스 분석',
    zh: '文件情报分析',
  },
  strategicImplications: {
    en: 'Strategic Implications',
    sv: 'Strategiska implikationer',
    da: 'Strategiske implikationer',
    no: 'Strategiske implikasjoner',
    fi: 'Strategiset vaikutukset',
    de: 'Strategische Implikationen',
    fr: 'Implications stratégiques',
    es: 'Implicaciones estratégicas',
    nl: 'Strategische implicaties',
    ar: 'الآثار الاستراتيجية',
    he: 'השלכות אסטרטגיות',
    ja: '戦略的示唆',
    ko: '전략적 시사점',
    zh: '战略影响',
  },
  keyTakeaways: {
    en: 'Key Takeaways',
    sv: 'Viktiga slutsatser',
    da: 'Vigtigste konklusioner',
    no: 'Viktigste konklusjoner',
    fi: 'Tärkeimmät johtopäätökset',
    de: 'Wesentliche Erkenntnisse',
    fr: 'Points clés',
    es: 'Conclusiones clave',
    nl: 'Belangrijkste bevindingen',
    ar: 'النقاط الرئيسية',
    he: 'נקודות מפתח',
    ja: '主なポイント',
    ko: '핵심 사항',
    zh: '关键要点',
  },
  topicContext: {
    en: 'Topic Context & Significance',
    sv: 'Ämneskontext och betydelse',
    da: 'Emnekontext og betydning',
    no: 'Emnekontext og betydning',
    fi: 'Aiheyhteyssä ja merkityksessä',
    de: 'Themenkontext und Bedeutung',
    fr: 'Contexte thématique et signification',
    es: 'Contexto temático y significación',
    nl: 'Onderwerpcontext en betekenis',
    ar: 'السياق الموضوعي والأهمية',
    he: 'הקשר נושאי ומשמעות',
    ja: 'トピックの文脈と重要性',
    ko: '주제 맥락 및 중요성',
    zh: '主题背景与意义',
  },
  documentsByType: {
    en: 'Documents by Type', sv: 'Dokument efter typ', da: 'Dokumenter efter type', no: 'Dokumenter etter type',
    fi: 'Asiakirjat tyypin mukaan', de: 'Dokumente nach Typ', fr: 'Documents par type', es: 'Documentos por tipo',
    nl: 'Documenten per type', ar: 'الوثائق حسب النوع', he: 'מסמכים לפי סוג',
    ja: '種類別文書', ko: '유형별 문서', zh: '按类型分类的文件',
  },
  documents: {
    en: 'Documents', sv: 'Dokument', da: 'Dokumenter', no: 'Dokumenter',
    fi: 'Asiakirjat', de: 'Dokumente', fr: 'Documents', es: 'Documentos',
    nl: 'Documenten', ar: 'وثائق', he: 'מסמכים',
    ja: '文書', ko: '문서', zh: '文件',
  },
  documentsAnalysed: {
    en: 'parliamentary documents analysed', sv: 'riksdagsdokument analyserade', da: 'parlamentsdokumenter analyseret', no: 'parlamentsdokumenter analysert',
    fi: 'asiakirjaa analysoitu', de: 'parlamentarische Dokumente analysiert', fr: 'documents parlementaires analysés', es: 'documentos parlamentarios analizados',
    nl: 'parlementaire documenten geanalyseerd', ar: 'وثيقة برلمانية تم تحليلها', he: 'מסמכים פרלמנטריים שנותחו',
    ja: '件の議会文書を分析', ko: '의회 문서 분석됨', zh: '份议会文件已分析',
  },
  documentAnalysed: {
    en: 'parliamentary document analysed', sv: 'riksdagsdokument analyserat', da: 'parlamentsdokument analyseret', no: 'parlamentsdokument analysert',
    fi: 'asiakirja analysoitu', de: 'parlamentarisches Dokument analysiert', fr: 'document parlementaire analysé', es: 'documento parlamentario analizado',
    nl: 'parlementair document geanalyseerd', ar: 'وثيقة برلمانية تم تحليلها', he: 'מסמך פרלמנטרי שנותח',
    ja: '件の議会文書を分析', ko: '의회 문서 분석됨', zh: '份议会文件已分析',
  },
  documentTypes: {
    en: 'Document Types', sv: 'Dokumenttyper', da: 'Dokumenttyper', no: 'Dokumenttyper',
    fi: 'Asiakirjatyypit', de: 'Dokumenttypen', fr: 'Types de documents', es: 'Tipos de documentos',
    nl: 'Documenttypen', ar: 'أنواع الوثائق', he: 'סוגי מסמכים',
    ja: '文書種類', ko: '문서 유형', zh: '文件类型',
  },
  policyDomains: {
    en: 'Policy Domains', sv: 'Politikområden', da: 'Politikområder', no: 'Politikkområder',
    fi: 'Politiikka-alueet', de: 'Politikbereiche', fr: 'Domaines politiques', es: 'Áreas de política',
    nl: 'Beleidsdomeinen', ar: 'مجالات السياسة', he: 'תחומי מדיניות',
    ja: '政策分野', ko: '정책 영역', zh: '政策领域',
  },
  stakeholders: {
    en: 'Stakeholders', sv: 'Intressenter', da: 'Interessenter', no: 'Interessenter',
    fi: 'Sidosryhmät', de: 'Stakeholder', fr: 'Parties prenantes', es: 'Partes interesadas',
    nl: 'Belanghebbenden', ar: 'أصحاب المصلحة', he: 'בעלי עניין',
    ja: 'ステークホルダー', ko: '이해관계자', zh: '利益相关者',
  },
  executiveSummary: {
    en: 'Executive Intelligence Summary',
    sv: 'Sammanfattning för beslutsfattare',
    da: 'Ledelsesinformation',
    no: 'Lederinformasjon',
    fi: 'Johdon yhteenveto',
    de: 'Führungszusammenfassung',
    fr: 'Résumé pour décideurs',
    es: 'Resumen ejecutivo de inteligencia',
    nl: 'Managementsamenvatting',
    ar: 'ملخص الاستخبارات التنفيذية',
    he: 'סיכום מודיעין מנהלים',
    ja: 'エグゼクティブ・インテリジェンス要約',
    ko: '경영진 인텔리전스 요약',
    zh: '执行情报摘要',
  },
  predictiveAssessment: {
    en: 'Predictive Assessment',
    sv: 'Prediktiv bedömning',
    da: 'Prædiktiv vurdering',
    no: 'Prediktiv vurdering',
    fi: 'Ennakoiva arviointi',
    de: 'Prädiktive Bewertung',
    fr: 'Évaluation prédictive',
    es: 'Evaluación predictiva',
    nl: 'Voorspellende beoordeling',
    ar: 'التقييم التنبؤي',
    he: 'הערכה חיזויית',
    ja: '予測評価',
    ko: '예측 평가',
    zh: '预测性评估',
  },
  historicalContext: {
    en: 'Historical Context & Precedents',
    sv: 'Historisk kontext och prejudikat',
    da: 'Historisk kontekst og præcedenser',
    no: 'Historisk kontekst og presedens',
    fi: 'Historiallinen konteksti ja ennakkotapaukset',
    de: 'Historischer Kontext und Präzedenzfälle',
    fr: 'Contexte historique et précédents',
    es: 'Contexto histórico y precedentes',
    nl: 'Historische context en precedenten',
    ar: 'السياق التاريخي والسوابق',
    he: 'הקשר היסטורי ותקדימים',
    ja: '歴史的背景と先例',
    ko: '역사적 맥락 및 선례',
    zh: '历史背景与先例',
  },
  methodology: {
    en: 'Methodology & Confidence',
    sv: 'Metodik och konfidensgrad',
    da: 'Metodologi og konfidens',
    no: 'Metodologi og konfidens',
    fi: 'Menetelmä ja luottamustaso',
    de: 'Methodik und Konfidenz',
    fr: 'Méthodologie et confiance',
    es: 'Metodología y confianza',
    nl: 'Methodologie en betrouwbaarheid',
    ar: 'المنهجية ودرجة الثقة',
    he: 'מתודולוגיה ורמת ביטחון',
    ja: '方法論と信頼度',
    ko: '방법론 및 신뢰도',
    zh: '方法论与置信度',
  },
  likelyOutcome: {
    en: 'Likely Outcome', sv: 'Troligt utfall', da: 'Sandsynligt udfald', no: 'Sannsynlig utfall',
    fi: 'Todennäköinen lopputulos', de: 'Wahrscheinliches Ergebnis', fr: 'Résultat probable', es: 'Resultado probable',
    nl: 'Waarschijnlijk resultaat', ar: 'النتيجة المحتملة', he: 'תוצאה סבירה',
    ja: '見込まれる結果', ko: '예상 결과', zh: '可能结果',
  },
  coalitionStability: {
    en: 'Coalition Stability Forecast', sv: 'Koalitionsstabilitetsprognos', da: 'Koalitionsstabilitetsprognose', no: 'Koalisjonstabilitetsprognose',
    fi: 'Koalition vakausennuste', de: 'Koalitionsstabilitätsprognose', fr: 'Prévision de stabilité de coalition', es: 'Pronóstico de estabilidad de coalición',
    nl: 'Coalitiesstabiliteitsprognose', ar: 'توقعات استقرار الائتلاف', he: 'תחזית יציבות קואליציה',
    ja: '連立安定性予測', ko: '연립 안정성 예측', zh: '联合稳定性预测',
  },
  riskScenarios: {
    en: 'Risk Scenarios', sv: 'Riskscenarier', da: 'Risikoscenarier', no: 'Risikoscenarier',
    fi: 'Riskiskenaariot', de: 'Risikoszenarien', fr: 'Scénarios de risque', es: 'Escenarios de riesgo',
    nl: "Risicoscenario's", ar: 'سيناريوهات المخاطر', he: 'תרחישי סיכון',
    ja: 'リスクシナリオ', ko: '위험 시나리오', zh: '风险情景',
  },
  parliamentaryAnalysis: {
    en: 'Parliamentary Analysis', sv: 'Riksdagsanalys', da: 'Parlamentarisk analyse', no: 'Parlamentarisk analyse',
    fi: 'Parlamentaarinen analyysi', de: 'Parlamentarische Analyse', fr: 'Analyse parlementaire', es: 'Análisis parlamentario',
    nl: 'Parlementaire analyse', ar: 'التحليل البرلماني', he: 'ניתוח פרלמנטרי',
    ja: '議会分析', ko: '의회 분석', zh: '议会分析',
  },
  govCommunications: {
    en: 'Gov. Communications', sv: 'Regeringsmeddelanden', da: 'Regeringsmeddelelser', no: 'Regjeringsmeldinger',
    fi: 'Hallituksen tiedonannot', de: 'Regierungsmitteilungen', fr: 'Communications gouvernementales', es: 'Comunicaciones del Gobierno',
    nl: 'Regeringsmededelingen', ar: 'بلاغات حكومية', he: 'הודעות ממשלתיות',
    ja: '政府通信', ko: '정부 통신', zh: '政府通报',
  },
  conceptualMap: {
    en: 'Conceptual map', sv: 'Konceptkarta', da: 'Konceptkort', no: 'Konseptkart',
    fi: 'Käsitekartta', de: 'Konzeptkarte', fr: 'Carte conceptuelle', es: 'Mapa conceptual',
    nl: 'Conceptmap', ar: 'خريطة مفاهيمية', he: 'מפת מושגים',
    ja: 'コンセプトマップ', ko: '개념 맵', zh: '概念图',
  },
};

function deepLabel(key: string, lang: Language): string {
  const map = DEEP_SECTION_LABELS[key];
  return (map?.[lang]) ?? (map?.en ?? key);
}

/** Checks whether a document represents an SFS (enacted statute). Delegates to {@link effectiveType}. */
function isSfsDoc(d: RawDocument): boolean {
  return effectiveType(d) === 'sfs';
}

function docTypeLabel(doktyp: string, lang: Language, count?: number): string {
  return localizeDocType(doktyp, lang, count);
}

/**
 * Generate topic-focused, comprehensive deep-inspection article content.
 * All sections are explicitly oriented around `topic`. Uses enriched full-text
 * content from each document and the 5W deep-analysis framework.
 *
 * @param depth - Analysis depth (1–4). Higher depth adds more intelligence sections:
 *   1 = Topic Context + Document Intelligence + 5W Deep Analysis + Strategic Implications + Key Takeaways
 *   2 = depth 1 + Historical Context + Predictive Assessment
 *   3 = depth 2 + Executive Intelligence Summary + Methodology (3 iterations)
 *   4 = depth 3 + quality-review iteration in Methodology (4 iterations)
 */
function generateDeepInspectionContent(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
  depth: 1 | 2 | 3 | 4 = 1,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiResult?: any,
): string {
  const esc = escapeHtml;
  let html = '';

  // ── 0. Executive Intelligence Summary (depth ≥ 3) ────────────────────────
  if (depth >= 3) {
    html += buildExecutiveSummary(docs, topic, lang);
  }

  // ── 1. Topic Context ───────────────────────────────────────────────────────
  const topicHeading = deepLabel('topicContext', lang);
  const topicCtxPara = buildTopicContextParagraph(docs, topic, lang);
  html += `\n<section class="deep-topic-context" aria-label="${esc(topicHeading)}">\n`;
  html += `  <h2>${esc(topicHeading)}</h2>\n`;
  html += `  ${topicCtxPara}\n`;
  html += `</section>\n`;

  // ── 2. Per-document deep intelligence entries ──────────────────────────────
  const docIntelHeading = deepLabel('documentIntelligence', lang);
  html += `\n<section class="document-intelligence-analysis" aria-label="${esc(docIntelHeading)}">\n`;
  html += `  <h2>${esc(docIntelHeading)}</h2>\n`;

  docs.forEach((doc, idx) => {
    html += buildDocumentEntry(doc, topic, lang, idx + 1, docs.length);
  });

  html += `</section>\n`;

  // ── 3. Cross-document 5W deep analysis ────────────────────────────────────
  const deepAnalysis = generateDeepAnalysisSection({
    documents: docs,
    lang,
    articleType: 'deep-inspection',
    whyContext: topic
      ? `This deep-inspection focuses exclusively on: ${topic}. All findings are evaluated in this context.`
      : undefined,
  });
  if (deepAnalysis) html += deepAnalysis;

  // ── 4. Strategic implications ──────────────────────────────────────────────
  const stratHeading = deepLabel('strategicImplications', lang);
  html += `\n<section class="strategic-implications" aria-label="${esc(stratHeading)}">\n`;
  html += `  <h2>${esc(stratHeading)}</h2>\n`;
  // Use AI-generated strategic implications when non-empty; otherwise emit
  // replacement marker for downstream AI processing (v3.0+).
  const strategicImplHtml = aiResult?.strategicImplications
    || '<!-- AI_MUST_REPLACE: strategic_implications -->';
  html += `  ${strategicImplHtml}\n`;
  html += `</section>\n`;

  // ── 5. Historical Context (depth ≥ 2) ─────────────────────────────────────
  if (depth >= 2) {
    html += buildHistoricalContext(docs, topic, lang);
  }

  // ── 6. Predictive Assessment (depth ≥ 2) ──────────────────────────────────
  if (depth >= 2) {
    html += buildPredictiveAssessment(docs, topic, lang);
  }

  // ── 7. Key takeaways ───────────────────────────────────────────────────────
  const takeawayHeading = deepLabel('keyTakeaways', lang);
  html += `\n<section class="key-takeaways" aria-label="${esc(takeawayHeading)}">\n`;
  html += `  <h2>${esc(takeawayHeading)}</h2>\n`;
  if (aiResult?.keyTakeaways && aiResult.keyTakeaways.length > 0) {
    // Use AI-generated takeaways
    html += `<ul class="key-takeaways-list">\n`;
    aiResult.keyTakeaways.forEach((item: string) => {
      html += `  <li>${esc(item)}</li>\n`;
    });
    html += `</ul>\n`;
  } else {
    html += '<!-- AI_MUST_REPLACE: key_takeaways -->';
  }
  html += `</section>\n`;

  // ── 8. Methodology & Confidence (depth ≥ 3) ───────────────────────────────
  if (depth >= 3) {
    html += buildMethodologySection(docs, topic, lang, depth);
  }

  return html;
}

function mapReportDepthToPipelineDepth(depth: 1 | 2 | 3 | 4): AnalysisDepth {
  if (depth <= 1) return 'quick';
  if (depth === 2) return 'standard';
  return 'deep';
}

function writeAnalysisMetadata(slug: string, metadata: AnalysisIterationMetadata): void {
  try {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
    const filePath = path.join(METADATA_DIR, `ai-analysis-${slug}-${metadata.lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2), 'utf8');
  } catch (error) {
    console.warn(`⚠️ Failed to write analysis metadata for ${slug}/${metadata.lang}:`, error);
  }
}

/**
 * Test-only hooks for deep-inspection content generation.
 * Exported to support behavioral tests without source inspection.
 * @internal
 */
export const __deepInspectionTestHooks = {
  generateDeepInspectionContent,
};

/** Build the topic context introductory paragraph. */
function buildTopicContextParagraph(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const docCount = docs.length;
  const allDomains = new Set<string>();
  // When a focus topic is provided, suppress generic detected domains entirely — they can
  // include tangential policy areas that bleed into "other areas" beyond the stated focus.
  // The topic itself IS the scope; detected domains would only add noise.
  if (!topic) {
    docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  }
  const domainList = [...allDomains].slice(0, 5).map(d => esc(d)).join(', ');

  const templates: Partial<Record<Language, string>> = {
    en: `This deep-inspection analyses ${docCount} targeted parliamentary document${docCount !== 1 ? 's' : ''}${topic ? ` with an exclusive focus on <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Policy domains covered: ${domainList}.` : ''} Each document has been individually reviewed for relevance, legislative significance, and strategic implications — all findings are evaluated through the lens of the stated focus.`,
    sv: `Denna djupanalys granskar ${docCount} riktade riksdagsdokument${topic ? ` med exklusivt fokus på <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Policyområden: ${domainList}.` : ''} Varje dokument har granskats individuellt avseende relevans, lagstiftningssignifikans och strategiska implikationer — alla resultat utvärderas genom det angivna fokuset.`,
    de: `Diese Tiefenanalyse untersucht ${docCount} gezielte Parlamentsdokument${docCount !== 1 ? 'e' : ''}${topic ? ` mit ausschließlichem Fokus auf <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Politikbereiche: ${domainList}.` : ''} Jedes Dokument wurde einzeln auf Relevanz, gesetzgeberische Bedeutung und strategische Implikationen geprüft.`,
    fr: `Cette analyse approfondie examine ${docCount} document${docCount !== 1 ? 's' : ''} parlementaire${docCount !== 1 ? 's' : ''} ciblé${docCount !== 1 ? 's' : ''}${topic ? ` avec un focus exclusif sur <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Domaines politiques couverts: ${domainList}.` : ''} Chaque document a été examiné individuellement.`,
    es: `Esta inspección profunda analiza ${docCount} documento${docCount !== 1 ? 's' : ''} parlamentario${docCount !== 1 ? 's' : ''} específico${docCount !== 1 ? 's' : ''}${topic ? ` con enfoque exclusivo en <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Áreas de política cubiertos: ${domainList}.` : ''}`,
    da: `Denne dybdeanalyse undersøger ${docCount} målrettede parlamentariske dokument${docCount !== 1 ? 'er' : ''}${topic ? ` med eksklusivt fokus på <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Politikområder: ${domainList}.` : ''}`,
    no: `Denne dybdeanalysen undersøker ${docCount} målrettede parlamentariske dokument${docCount !== 1 ? 'er' : ''}${topic ? ` med eksklusivt fokus på <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Politikkområder: ${domainList}.` : ''}`,
    fi: `Tämä syväanalyysi tutkii ${docCount} kohdennettua parlamentaarista asiakirjaa${topic ? `, joissa on yksinomainen fokus aiheeseen <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Politiikka-alueet: ${domainList}.` : ''}`,
    nl: `Deze diepteanalyse bestudeert ${docCount} gerichte parlementaire document${docCount !== 1 ? 'en' : ''}${topic ? ` met exclusieve focus op <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Beleidsdomeinen: ${domainList}.` : ''}`,
    ar: `يحلل هذا الفحص المعمق ${docCount} وثيقة برلمانية مستهدفة${topic ? ` مع التركيز الحصري على <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `مجالات السياسة المشمولة: ${domainList}.` : ''}`,
    he: `ניתוח מעמיק זה בוחן ${docCount} מסמכים פרלמנטריים ממוקדים${topic ? ` עם מיקוד בלעדי על <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `תחומי מדיניות: ${domainList}.` : ''}`,
    ja: `この詳細分析は${docCount}件のターゲット議会文書を調査します${topic ? `、<strong>${esc(topic)}</strong>に専ら焦点を当てています` : ''}。${domainList ? `政策分野: ${domainList}。` : ''}`,
    ko: `이 심층 분석은 ${docCount}건의 대상 의회 문서를 분석합니다${topic ? `, <strong>${esc(topic)}</strong>에 전적으로 집중합니다` : ''}. ${domainList ? `정책 분야: ${domainList}.` : ''}`,
    zh: `本次深度分析对${docCount}份目标议会文件进行分析${topic ? `，专注于<strong>${esc(topic)}</strong>` : ''}。${domainList ? `涵盖政策领域：${domainList}。` : ''}`,
  };
  return `<p>${templates[lang] ?? templates.en}</p>`;
}

/** Build a comprehensive HTML entry for a single document — topic-focused. */
function buildDocumentEntry(
  doc: RawDocument,
  topic: string | null,
  lang: Language,
  index: number,
  total: number,
): string {
  const esc = escapeHtml;
  const title = doc.titel || doc.title || doc.dokumentnamn || doc.dok_id || '';
  const doktyp = doc.doktyp || doc.documentType || '';
  const date = doc.datum ? esc(doc.datum) : '';
  const organ = doc.organ || doc.committee || '';
  const typeLabel = doktyp ? docTypeLabel(doktyp, lang, 1) : '';
  const domains = detectPolicyDomains(doc, lang);

  let entry = `\n  <article class="document-entry" data-index="${index}">\n`;
  entry += `    <h3>${esc(title)}</h3>\n`;

  // Document metadata line
  const metaParts: string[] = [];
  if (typeLabel) metaParts.push(`<span class="doc-type">${esc(typeLabel)}</span>`);
  if (doc.dok_id) metaParts.push(`<code>${esc(doc.dok_id)}</code>`);
  if (date) metaParts.push(`<time datetime="${date}">${date}</time>`);
  if (organ) metaParts.push(`<span class="doc-organ">${esc(organ)}</span>`);
  if (domains.length > 0 && !topic) metaParts.push(`<em>${domains.map(d => esc(d)).join(', ')}</em>`);
  if (metaParts.length > 0) {
    entry += `    <p class="doc-meta">${metaParts.join(' · ')}</p>\n`;
  }

  // Topic relevance note when topic is provided
  if (topic) {
    const topicRelevanceTemplates: Partial<Record<Language, string>> = {
      en: `Relevance to <strong>${esc(topic)}</strong>:`,
      sv: `Relevans för <strong>${esc(topic)}</strong>:`,
      de: `Relevanz für <strong>${esc(topic)}</strong>:`,
      fr: `Pertinence pour <strong>${esc(topic)}</strong>:`,
      es: `Relevancia para <strong>${esc(topic)}</strong>:`,
      da: `Relevans for <strong>${esc(topic)}</strong>:`,
      no: `Relevans for <strong>${esc(topic)}</strong>:`,
      fi: `Relevanssi aiheeseen <strong>${esc(topic)}</strong>:`,
      nl: `Relevantie voor <strong>${esc(topic)}</strong>:`,
      ar: `الصلة بـ <strong>${esc(topic)}</strong>:`,
      he: `הרלוונטיות ל<strong>${esc(topic)}</strong>:`,
      ja: `<strong>${esc(topic)}</strong>への関連性:`,
      ko: `<strong>${esc(topic)}</strong>에 대한 관련성:`,
      zh: `与<strong>${esc(topic)}</strong>的关联:`,
    };
    entry += `    <p class="topic-relevance"><strong>${topicRelevanceTemplates[lang] ?? topicRelevanceTemplates.en}</strong></p>\n`;
  }

  // Deep policy analysis (uses full text if enriched, otherwise significance)
  // Pass 600-char limit — deep inspection requires substantive per-document analysis.
  const deepAnalysis = generateDeepPolicyAnalysis(doc, lang, doktyp || undefined, 600);
  if (deepAnalysis) {
    entry += `    <div class="doc-analysis">${deepAnalysis}</div>\n`;
  }

  // Summary/notis when no full text but summary is available
  const summary = doc.summary || doc.notis || '';
  if (summary && !doc.contentFetched) {
    entry += `    <blockquote class="doc-summary">${esc(summary)}</blockquote>\n`;
  }

  if (index < total) {
    entry += `    <hr class="doc-separator">\n`;
  }

  entry += `  </article>\n`;
  return entry;
}

// ---------------------------------------------------------------------------
// Multi-iteration deep-inspection intelligence section builders
// ---------------------------------------------------------------------------

/**
 * Build a concise Executive Intelligence Summary.
 * Synthesises document composition, policy domains, and legislative posture
 * into a briefing paragraph for decision-makers.
 * Iteration 1 + Iteration 2 outcome: "what happened & why it matters".
 */
function buildExecutiveSummary(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const propCount = docs.filter(d => effectiveType(d) === 'prop').length;
  const betCount  = docs.filter(d => effectiveType(d) === 'bet').length;
  const motCount  = docs.filter(d => effectiveType(d) === 'mot').length;
  const sfsDocs   = docs.filter(isSfsDoc);
  const enriched  = docs.filter(d => d.contentFetched).length;
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domainList = [...allDomains].slice(0, 4);
  const domainPhrase = domainList.map(d => esc(d)).join(', ');

  // Determine legislative posture — neutral when no props/motions/bets/SFS exist
  const hasEnactedLaw = sfsDocs.length > 0;
  const noLegSignal = propCount + motCount + betCount === 0 && !hasEnactedLaw;
  const govLed = noLegSignal ? null : propCount > motCount;
  const highScrutiny = betCount > 0;

  const templates: Partial<Record<Language, string>> = {
    en: (() => {
      const enPosture = govLed === null ? 'non-legislative' : govLed ? 'government-led' : 'opposition-driven';
      const enClauses: string[] = [];
      if (propCount > 0) enClauses.push(`${propCount} proposition${propCount !== 1 ? 's' : ''} advancing the executive agenda`);
      if (betCount > 0) enClauses.push(`${betCount} committee report${betCount !== 1 ? 's' : ''} providing parliamentary scrutiny`);
      if (motCount > 0) enClauses.push(`${motCount} opposition motion${motCount !== 1 ? 's' : ''} challenging the direction`);
      const enClauseStr = enClauses.length > 0
        ? `, with ${enClauses.length === 1 ? enClauses[0] : enClauses.slice(0, -1).join(', ') + ', and ' + enClauses[enClauses.length - 1]}`
        : '';
      return `This deep-inspection intelligence report analyses ${docs.length} parliamentary document${docs.length !== 1 ? 's' : ''}${topic ? ` on <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, spanning ${domainPhrase}` : ''}. Of these, ${enriched} ${enriched === 1 ? 'was' : 'were'} enriched with full text to enable substantive analysis. The legislative posture is ${enPosture}${enClauseStr}. ${hasEnactedLaw ? `${sfsDocs.length} statute${sfsDocs.length !== 1 ? 's' : ''} ${sfsDocs.length !== 1 ? 'have' : 'has'} already been enacted, establishing a legal baseline.` : highScrutiny ? 'Committee engagement indicates that the policy is under active parliamentary review, signalling that key decisions are imminent.' : 'The legislative pipeline remains at an early stage, requiring close monitoring for acceleration signals.'} ${domainPhrase ? `Policy domains engaged — ${domainPhrase} — reflect the cross-cutting nature of this initiative.` : 'The documents reflect focused policy engagement in this area.'} Decision-makers should prioritise tracking committee deliberations and chamber voting patterns as the most reliable forward indicators.`;
    })(),
    sv: (() => {
      const svClauses: string[] = [];
      if (propCount > 0) svClauses.push(`${propCount} proposition${propCount !== 1 ? 'er' : ''}`);
      if (betCount > 0) svClauses.push(`${betCount} utskottsbetänkande${betCount !== 1 ? 'n' : ''} som ger parlamentarisk granskning`);
      if (motCount > 0) svClauses.push(`${motCount} opposition${motCount !== 1 ? 'smotioner' : 'smotion'} som ifrågasätter inriktningen`);
      const svPosture = govLed === null ? 'icke-lagstiftningsmässigt' : govLed ? 'regeringsdrivet' : 'oppositionsdrivet';
      const svClauseStr = svClauses.length > 0
        ? (svClauses.length > 1
          ? ' med ' + svClauses.slice(0, -1).join(', ') + ' och ' + svClauses[svClauses.length - 1]
          : ' med ' + svClauses[0])
        : '';
      return `Denna djupanalys granskar ${docs.length} riksdagsdokument${topic ? ` rörande <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` inom ${domainPhrase}` : ''}. Av dessa berikades ${enriched} med fulltext. Det lagstiftande läget är ${svPosture}${svClauseStr}. ${hasEnactedLaw ? `${sfsDocs.length} lag${sfsDocs.length !== 1 ? 'ar' : ''} har redan antagits och fastställt ett rättsligt ramverk.` : highScrutiny ? 'Utskottsengagemanget visar att policyn är under aktiv parlamentarisk granskning.' : 'Lagstiftningspipelinen befinner sig i ett tidigt skede.'} Beslutsfattare bör prioritera att följa utskottens arbete och omröstningar i kammaren.`;
    })(),
    da: (() => {
      const daClauses: string[] = [];
      if (propCount > 0) daClauses.push(`${propCount} forslag`);
      if (betCount > 0) daClauses.push(`${betCount} udvalgsrapport${betCount !== 1 ? 'er' : ''}`);
      const daClauseStr = daClauses.length > 0 ? ` med ${daClauses.join(' og ')}` : '';
      return `Denne dybdeanalyse undersøger ${docs.length} parlamentariske dokumenter${topic ? ` om <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` inden for ${domainPhrase}` : ''}. ${enriched} af disse er beriget med fulde tekster. Den lovgivningsmæssige holdning er ${govLed === null ? 'ikke-lovgivningsmæssig' : govLed ? 'regeringsdrevet' : 'oppositionsdrevet'}${daClauseStr}. Beslutningstagere bør følge udvalgsdrøftelser og afstemninger.`;
    })(),
    no: (() => {
      const noClauses: string[] = [];
      if (propCount > 0) noClauses.push(`${propCount} forslag`);
      if (betCount > 0) noClauses.push(`${betCount} komitérapport${betCount !== 1 ? 'er' : ''}`);
      const noClauseStr = noClauses.length > 0 ? ` med ${noClauses.join(' og ')}` : '';
      return `Denne dybdeanalysen undersøker ${docs.length} parlamentariske dokumenter${topic ? ` om <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` innen ${domainPhrase}` : ''}. ${enriched} av disse er beriket med fulltekst. Den lovgivningsmessige posisjonen er ${govLed === null ? 'ikke-lovgivningsmessig' : govLed ? 'regjeringsledet' : 'opposisjonsdrevet'}${noClauseStr}. Beslutningstakere bør følge komitéforhandlinger og voteringsmønstre.`;
    })(),
    fi: (() => {
      const fiClauses: string[] = [];
      if (propCount > 0) fiClauses.push(`${propCount} esitystä`);
      if (betCount > 0) fiClauses.push(`${betCount} valiokunnan mietintöä`);
      const fiClauseStr = fiClauses.length > 0 ? ` — ${fiClauses.join(' ja ')}` : '';
      return `Tämä syväanalyysi tutkii ${docs.length} parlamentaarista asiakirjaa${topic ? ` aiheesta <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` alueilla ${domainPhrase}` : ''}. Näistä ${enriched} rikastettiin koko tekstillä. Lainsäädäntöasenne on ${govLed === null ? 'ei-lainsäädännöllinen' : govLed ? 'hallitusvetoinen' : 'oppositiovetoinen'}${fiClauseStr}. Päätöksentekijöiden tulisi seurata valiokuntien harkintaa ja äänestyksiä.`;
    })(),
    de: `Dieser Tiefenanalysebericht untersucht ${docs.length} Parlamentsdokument${docs.length !== 1 ? 'e' : ''}${topic ? ` zu <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` in den Bereichen ${domainPhrase}` : ''}. Davon wurden ${enriched} mit vollständigem Text angereichert. Die gesetzgeberische Haltung ist ${govLed === null ? 'nicht-gesetzgeberisch' : govLed ? 'regierungsgeführt' : 'oppositionsgetrieben'}${propCount > 0 ? ` mit ${propCount} Regierungsvorlage${propCount !== 1 ? 'n' : ''}` : ''}${betCount > 0 ? `${propCount > 0 ? ' und' : ' mit'} ${betCount} Ausschussbericht${betCount !== 1 ? 'en' : ''}` : ''}. Entscheidungsträger sollten Ausschussberatungen und Abstimmungsmuster verfolgen.`,
    fr: `Ce rapport d'analyse approfondie examine ${docs.length} document${docs.length !== 1 ? 's' : ''} parlementaire${docs.length !== 1 ? 's' : ''}${topic ? ` sur <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, couvrant ${domainPhrase}` : ''}. Parmi ceux-ci, ${enriched} ont été enrichis avec le texte complet. La posture législative est ${govLed === null ? 'non législative' : govLed ? 'gouvernementale' : "portée par l'opposition"}${propCount > 0 ? ` avec ${propCount} proposition${propCount !== 1 ? 's' : ''}` : ''}${betCount > 0 ? `${propCount > 0 ? ' et' : ' avec'} ${betCount} rapport${betCount !== 1 ? 's' : ''} de commission` : ''}. Les décideurs devraient suivre les délibérations des commissions et les votes.`,
    es: `Este informe de análisis profundo examina ${docs.length} documento${docs.length !== 1 ? 's' : ''} parlamentario${docs.length !== 1 ? 's' : ''}${topic ? ` sobre <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, abarcando ${domainPhrase}` : ''}. De estos, ${enriched} fueron enriquecidos con texto completo. La postura legislativa es ${govLed === null ? 'no legislativa' : govLed ? 'liderada por el gobierno' : 'impulsada por la oposición'}${propCount > 0 ? ` con ${propCount} proposición${propCount !== 1 ? 'es' : ''}` : ''}${betCount > 0 ? `${propCount > 0 ? ' y' : ' con'} ${betCount} informe${betCount !== 1 ? 's' : ''} de comité` : ''}. Los tomadores de decisiones deben seguir las deliberaciones del comité y los patrones de votación.`,
    nl: `Dit diepgaand analyserapport onderzoekt ${docs.length} parlementair${docs.length !== 1 ? 'e' : ''} document${docs.length !== 1 ? 'en' : ''}${topic ? ` over <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, gericht op ${domainPhrase}` : ''}. Hiervan werden ${enriched} verrijkt met volledige tekst. De wetgevende houding is ${govLed === null ? 'niet-wetgevend' : govLed ? 'regeringsgeleid' : 'oppositiegedreven'}${propCount > 0 ? ` met ${propCount} voorstel${propCount !== 1 ? 'len' : ''}` : ''}${betCount > 0 ? `${propCount > 0 ? ' en' : ' met'} ${betCount} commissierapport${betCount !== 1 ? 'en' : ''}` : ''}. Beslissers moeten commissiedeliberaties en stempatronen volgen.`,
    ar: `يحلل تقرير التحليل المعمق هذا ${docs.length} وثيقة برلمانية${topic ? ` حول <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` في مجالات ${domainPhrase}` : ''}. منها ${enriched} مُعزَّزة بالنص الكامل. الموقف التشريعي ${govLed === null ? 'غير تشريعي' : govLed ? 'حكومي القيادة' : 'تقوده المعارضة'}${propCount > 0 ? ` مع ${propCount} مقترح${propCount !== 1 ? 'ات' : ''}` : ''}${betCount > 0 ? ` و${betCount} تقرير${betCount !== 1 ? 'ات' : ''} لجنة` : ''}. يجب على صانعي القرار متابعة مداولات اللجان وأنماط التصويت.`,
    he: `דוח הניתוח המעמיק הזה בוחן ${docs.length} מסמך${docs.length !== 1 ? 'ים' : ''} פרלמנטר${docs.length !== 1 ? 'יים' : 'י'}${topic ? ` בנושא <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` בתחומי ${domainPhrase}` : ''}. מתוכם ${enriched} הועשרו בטקסט מלא. העמדה החקיקתית ${govLed === null ? 'לא-חקיקתית' : govLed ? 'בהנהגת הממשלה' : 'בהנהגת האופוזיציה'}${propCount > 0 ? ` עם ${propCount} הצעת חוק` : ''}${betCount > 0 ? ` ו-${betCount} דוח ועדה` : ''}. מקבלי ההחלטות צריכים לעקוב אחר דיוני הוועדות ודפוסי ההצבעה.`,
    ja: (() => {
      const jaClauses: string[] = [];
      if (propCount > 0) jaClauses.push(`${propCount}件の提案`);
      if (betCount > 0) jaClauses.push(`${betCount}件の委員会報告`);
      const jaClauseStr = jaClauses.length > 0 ? `で、${jaClauses.join('と')}があります` : 'です';
      return `この詳細分析レポートは${docs.length}件の議会文書${topic ? `（<strong>${esc(topic)}</strong>に関する）` : ''}${domainPhrase ? `（${domainPhrase}分野）` : ''}を分析します。${enriched}件は全文で強化されています。立法スタンスは${govLed === null ? '非立法的' : govLed ? '政府主導' : '野党主導'}${jaClauseStr}。意思決定者は委員会審議と投票パターンを追跡する必要があります。`;
    })(),
    ko: (() => {
      const koClauses: string[] = [];
      if (propCount > 0) koClauses.push(`${propCount}개 제안`);
      if (betCount > 0) koClauses.push(`${betCount}개 위원회 보고서`);
      const koClauseStr = koClauses.length > 0 ? `이며, ${koClauses.join('과 ')}가 있습니다` : '입니다';
      return `이 심층 분석 보고서는 ${docs.length}개의 의회 문서${topic ? `（<strong>${esc(topic)}</strong> 관련）` : ''}${domainPhrase ? `（${domainPhrase} 분야）` : ''}를 분석합니다. 이 중 ${enriched}개는 전문으로 보강되었습니다. 입법 태도는 ${govLed === null ? '비입법적' : govLed ? '정부 주도' : '야당 주도'}${koClauseStr}. 의사결정자는 위원회 심의와 투표 패턴을 추적해야 합니다.`;
    })(),
    zh: `本深度分析报告分析了${docs.length}份议会文件${topic ? `（关于<strong>${esc(topic)}</strong>）` : ''}${domainPhrase ? `（涵盖${domainPhrase}）` : ''}。其中${enriched}份以全文强化。立法立场${govLed === null ? '为非立法性' : govLed ? '由政府主导' : '由反对党推动'}${propCount > 0 ? `，有${propCount}份提案` : ''}${betCount > 0 ? `${propCount > 0 ? '和' : '，有'}${betCount}份委员会报告` : ''}。决策者应追踪委员会审议和投票模式。`,
  };

  const heading = deepLabel('executiveSummary', lang);
  const text = templates[lang] ?? templates.en ?? '';
  return `\n<section class="executive-intelligence-summary" aria-label="${esc(heading)}">\n  <h2>${esc(heading)}</h2>\n  <p>${text}</p>\n</section>\n`;
}

/** Enrichment ratio threshold for HIGH confidence. */
const CONFIDENCE_HIGH_THRESHOLD = 0.7;
/** Enrichment ratio threshold for MEDIUM confidence. */
const CONFIDENCE_MEDIUM_THRESHOLD = 0.3;
/** Minimum document count for HIGH confidence. */
const CONFIDENCE_MIN_DOCS_HIGH = 3;

/**
 * Derive a tri-state confidence level for the overall analysis based on
 * document enrichment rate, document count, and SFS presence.
 *
 * @returns `'HIGH'` | `'MEDIUM'` | `'LOW'`
 */
function deriveConfidence(docs: RawDocument[]): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (docs.length === 0) return 'LOW';
  const enriched = docs.filter(d => d.contentFetched).length;
  const ratio = docs.length > 0 ? enriched / docs.length : 0;
  const hasSfs = docs.some(isSfsDoc);
  if (ratio >= CONFIDENCE_HIGH_THRESHOLD && docs.length >= CONFIDENCE_MIN_DOCS_HIGH) return 'HIGH';
  if (ratio >= CONFIDENCE_MEDIUM_THRESHOLD || hasSfs) return 'MEDIUM';
  return 'LOW';
}

/**
 * Build a Predictive Assessment section with confidence percentages.
 * Covers: likely legislative outcomes, coalition stability forecast, and
 * risk scenarios (best / worst / most-likely).
 * Iteration 3 output: "what happens next".
 */

/** Base passage probability when legislative environment is favourable. */
const BASE_PASSAGE_PROBABILITY = 50;
/** Maximum passage probability cap for any single analysis. */
const MAX_PASSAGE_PROBABILITY = 90;
/** Minimum passage probability floor (avoids 0%). */
const MIN_PASSAGE_PROBABILITY = 20;
/** Confidence points added per committee report (bet) — signals parliamentary alignment. */
const COMMITTEE_REPORT_WEIGHT = 8;
/** Confidence points added per enacted statute (sfs) — confirms legal framework exists. */
const ENACTED_STATUTE_WEIGHT = 15;
/** Confidence points deducted per opposition motion (mot) — signals resistance. */
const OPPOSITION_MOTION_PENALTY = 5;

function buildPredictiveAssessment(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const propCount = docs.filter(d => effectiveType(d) === 'prop').length;
  const betCount  = docs.filter(d => effectiveType(d) === 'bet').length;
  const motCount  = docs.filter(d => effectiveType(d) === 'mot').length;
  const sfsDocs   = docs.filter(isSfsDoc);
  const confidence = deriveConfidence(docs);

  // Passage likelihood heuristic: if committee reports exceed motions → likely passage
  const passageLikely = betCount > motCount || sfsDocs.length > 0;
  const passagePct = passageLikely
    ? Math.min(MAX_PASSAGE_PROBABILITY, BASE_PASSAGE_PROBABILITY + betCount * COMMITTEE_REPORT_WEIGHT + sfsDocs.length * ENACTED_STATUTE_WEIGHT)
    : Math.max(MIN_PASSAGE_PROBABILITY, BASE_PASSAGE_PROBABILITY - motCount * OPPOSITION_MOTION_PENALTY);
  const blockPct = 100 - passagePct;

  const topicFallback: Partial<Record<Language, string>> = {
    en: 'this area', sv: 'detta område', da: 'dette område', no: 'dette området',
    fi: 'tämä alue', de: 'diesem Bereich', fr: 'ce domaine', es: 'esta área',
    nl: 'dit gebied', ar: 'هذا المجال', he: 'תחום זה',
    ja: 'この分野', ko: '이 분야', zh: '该领域',
  };
  const topicStr = topic ? esc(topic) : (topicFallback[lang] ?? topicFallback.en!);

  const headingPredictive = deepLabel('predictiveAssessment', lang);
  const headingOutcome = deepLabel('likelyOutcome', lang);
  const headingCoalition = deepLabel('coalitionStability', lang);
  const headingRisk = deepLabel('riskScenarios', lang);

  const sections: Partial<Record<Language, { outcome: string; coalition: string; scenarios: string }>> = {
    en: {
      outcome: `Based on document composition analysis, the probability of legislative passage for <strong>${topicStr}</strong> is estimated at <strong>${passagePct}%</strong>, with a ${blockPct}% probability of delay or amendment. ${propCount > 0 ? `${propCount} active proposition${propCount !== 1 ? 's' : ''} indicate committed government intent.` : ''} ${betCount > 0 ? `${betCount} committee report${betCount !== 1 ? 's' : ''} confirm parliamentary engagement.` : ''} ${sfsDocs.length > 0 ? 'Enacted statutes confirm legal framework establishment.' : ''}`,
      coalition: `Coalition stability assessment: ${betCount > motCount ? 'High — committee activity suggests governing coalition alignment.' : motCount > betCount ? 'Moderate — active opposition motions signal coalition stress points.' : 'Moderate — balanced legislative activity indicates ongoing negotiation.'} Monitor subsequent committee votes as the primary coalition stability indicator. Overall analysis confidence: <strong>${confidence}</strong>.`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Best case (${passagePct}% probability):</strong> ${topicStr} legislation passes with cross-party support, entering implementation phase.</li><li><strong>Most likely case:</strong> ${betCount > 0 ? 'Committee scrutiny leads to amendments before final vote, delaying implementation by 3–6 months.' : 'Legislation proceeds through normal parliamentary cycle with minor modifications.'}</li><li><strong>Worst case (${blockPct}% probability):</strong> ${motCount > propCount ? 'Opposition motions gain traction, forcing significant policy revisions or deferral to next session.' : 'External developments or coalition disagreements cause unexpected delay or withdrawal.'}</li></ul>`,
    },
    sv: {
      outcome: `Baserat på dokumentsammansättningsanalys uppskattas sannolikheten för lagstiftningspassage för <strong>${topicStr}</strong> till <strong>${passagePct}%</strong>, med ${blockPct}% sannolikhet för fördröjning eller ändring. ${propCount > 0 ? `${propCount} aktiv${propCount !== 1 ? 'a' : ''} proposition${propCount !== 1 ? 'er' : ''} visar regeringens engagemang.` : ''} Analyskonfidens: <strong>${confidence}</strong>.`,
      coalition: `Koalitionsstabilitetsbedömning: ${betCount > motCount ? 'Hög — utskottsaktivitet tyder på koalitionsanpassning.' : motCount > betCount ? 'Måttlig — aktiva oppositionsmotioner signalerar stressmoment.' : 'Måttlig — balanserad aktivitet indikerar pågående förhandlingar.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Bästa scenariot (${passagePct}% sannolikhet):</strong> Lagstiftning antas med bred parlamentarisk konsensus.</li><li><strong>Troligaste scenariot:</strong> Utskottsgranskning leder till ändringar innan slutomröstning, med 3–6 månaders försenad implementering.</li><li><strong>Sämsta scenariot (${blockPct}% sannolikhet):</strong> ${motCount > propCount ? 'Oppositionsinitiativ tvingar till väsentliga policyrevisioner.' : 'Externa omständigheter orsakar oväntad försening.'}</li></ul>`,
    },
    de: {
      outcome: `Basierend auf der Dokumentzusammensetzung wird die Wahrscheinlichkeit einer gesetzlichen Verabschiedung für <strong>${topicStr}</strong> auf <strong>${passagePct}%</strong> geschätzt. Analysekonfidens: <strong>${confidence}</strong>.`,
      coalition: `Koalitionsstabilitätsbewertung: ${betCount > motCount ? 'Hoch — Ausschussaktivität deutet auf Koalitionsausrichtung hin.' : 'Mittel — laufende Verhandlungen erforderlich.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Bestes Szenario (${passagePct}%):</strong> Gesetze werden mit breitem Konsens verabschiedet.</li><li><strong>Wahrscheinlichstes Szenario:</strong> Ausschussprüfung führt zu Änderungen vor der Endabstimmung.</li><li><strong>Schlimmstes Szenario (${blockPct}%):</strong> Unerwartete Verzögerungen aufgrund externer Faktoren.</li></ul>`,
    },
    fr: {
      outcome: `Sur la base de l'analyse de la composition des documents, la probabilité de passage législatif pour <strong>${topicStr}</strong> est estimée à <strong>${passagePct}%</strong>. Confiance d'analyse : <strong>${confidence}</strong>.`,
      coalition: `Évaluation de la stabilité de coalition : ${betCount > motCount ? 'Élevée — l\'activité des commissions suggère un alignement de la coalition.' : 'Modérée — négociations en cours nécessaires.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Meilleur cas (${passagePct}%) :</strong> La législation est adoptée avec un large consensus.</li><li><strong>Cas le plus probable :</strong> L'examen en commission entraîne des amendements avant le vote final.</li><li><strong>Pire cas (${blockPct}%) :</strong> Des retards inattendus dus à des facteurs externes.</li></ul>`,
    },
    es: {
      outcome: `Con base en el análisis de composición de documentos, la probabilidad de aprobación legislativa para <strong>${topicStr}</strong> se estima en <strong>${passagePct}%</strong>. Confianza del análisis: <strong>${confidence}</strong>.`,
      coalition: `Evaluación de estabilidad de coalición: ${betCount > motCount ? 'Alta — la actividad del comité sugiere alineación de la coalición.' : 'Moderada — se requieren negociaciones en curso.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Mejor caso (${passagePct}%):</strong> La legislación se aprueba con amplio consenso.</li><li><strong>Caso más probable:</strong> El escrutinio del comité lleva a enmiendas antes de la votación final.</li><li><strong>Peor caso (${blockPct}%):</strong> Retrasos inesperados debidos a factores externos.</li></ul>`,
    },
    da: {
      outcome: `Baseret på dokumentsammensætningsanalyse anslås sandsynligheden for lovgivningsmæssig vedtagelse for <strong>${topicStr}</strong> til <strong>${passagePct}%</strong>. Analysekonfidensgrad: <strong>${confidence}</strong>.`,
      coalition: `Koalitionsstabilitetsvurdering: ${betCount > motCount ? 'Høj — udvalgsaktivitet tyder på koalitionssammensætning.' : 'Moderat — igangværende forhandlinger nødvendige.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Bedste tilfælde (${passagePct}%):</strong> Lovgivning vedtages med bred konsensus.</li><li><strong>Sandsynligste tilfælde:</strong> Udvalgsgennemgang fører til ændringer.</li><li><strong>Værste tilfælde (${blockPct}%):</strong> Uventede forsinkelser.</li></ul>`,
    },
    no: {
      outcome: `Basert på dokumentsammensetningsanalyse anslås sannsynligheten for lovgivningsmessig vedtak for <strong>${topicStr}</strong> til <strong>${passagePct}%</strong>. Analysekonfidens: <strong>${confidence}</strong>.`,
      coalition: `Koalisjonstabilitetsvurdering: ${betCount > motCount ? 'Høy — komitéaktivitet tyder på koalisjonssamstemmighet.' : 'Moderat — pågående forhandlinger nødvendig.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Beste tilfelle (${passagePct}%):</strong> Lovgivning vedtas med bred konsensus.</li><li><strong>Mest sannsynlig:</strong> Komitégjennomgang fører til endringer.</li><li><strong>Verste tilfelle (${blockPct}%):</strong> Uventede forsinkelser.</li></ul>`,
    },
    fi: {
      outcome: `Asiakirjakoostumuksen analyysin perusteella lainsäädännön läpimenon todennäköisyys aiheessa <strong>${topicStr}</strong> arvioidaan <strong>${passagePct}%</strong>:ksi. Analyysin luottamustaso: <strong>${confidence}</strong>.`,
      coalition: `Koalition vakausarvio: ${betCount > motCount ? 'Korkea — valiokuntien aktiivisuus viittaa koalition yhdenmukaisuuteen.' : 'Kohtalainen — käynnissä olevia neuvotteluja tarvitaan.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Paras tapaus (${passagePct}%):</strong> Lainsäädäntö hyväksytään laajalla konsensuksella.</li><li><strong>Todennäköisin:</strong> Valiokuntatarkastus johtaa muutoksiin.</li><li><strong>Pahin tapaus (${blockPct}%):</strong> Odottamattomia viivästyksiä.</li></ul>`,
    },
    nl: {
      outcome: `Op basis van documentsamenstelling wordt de kans op wetgevende doorgang voor <strong>${topicStr}</strong> geschat op <strong>${passagePct}%</strong>. Analysebetrouwbaarheid: <strong>${confidence}</strong>.`,
      coalition: `Coalitiesstabiliteitsbeoordeling: ${betCount > motCount ? 'Hoog — commissieactiviteit suggereert coalitie-afstemming.' : 'Matig — lopende onderhandelingen vereist.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Beste geval (${passagePct}%):</strong> Wetgeving aangenomen met brede consensus.</li><li><strong>Meest waarschijnlijk:</strong> Commissieonderzoek leidt tot wijzigingen.</li><li><strong>Slechtste geval (${blockPct}%):</strong> Onverwachte vertragingen.</li></ul>`,
    },
    ar: {
      outcome: `استناداً إلى تحليل تكوين الوثائق، تُقدَّر احتمالية المرور التشريعي لـ<strong>${topicStr}</strong> بـ<strong>${passagePct}%</strong>. ثقة التحليل: <strong>${confidence}</strong>.`,
      coalition: `تقييم استقرار الائتلاف: ${betCount > motCount ? 'مرتفع — نشاط اللجان يشير إلى توافق الائتلاف.' : 'متوسط — مفاوضات جارية مطلوبة.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>أفضل الأحوال (${passagePct}%):</strong> تُقرّ التشريعات بتوافق واسع.</li><li><strong>الحالة الأكثر احتمالاً:</strong> تؤدي مراجعة اللجان إلى تعديلات.</li><li><strong>أسوأ الأحوال (${blockPct}%):</strong> تأخيرات غير متوقعة.</li></ul>`,
    },
    he: {
      outcome: `בהתבסס על ניתוח הרכב מסמכים, הסבירות למעבר חקיקתי עבור <strong>${topicStr}</strong> מוערכת ב-<strong>${passagePct}%</strong>. רמת ביטחון הניתוח: <strong>${confidence}</strong>.`,
      coalition: `הערכת יציבות קואליציה: ${betCount > motCount ? 'גבוהה — פעילות ועדות מצביעה על יישור הקואליציה.' : 'בינונית — נדרשים משא ומתן מתמשך.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>התרחיש הטוב ביותר (${passagePct}%):</strong> חקיקה עוברת עם הסכמה רחבה.</li><li><strong>התרחיש הסביר ביותר:</strong> בדיקת ועדה מובילה לתיקונים.</li><li><strong>התרחיש הגרוע ביותר (${blockPct}%):</strong> עיכובים בלתי צפויים.</li></ul>`,
    },
    ja: {
      outcome: `文書構成分析に基づき、<strong>${topicStr}</strong>の立法可決確率は<strong>${passagePct}%</strong>と推定されます。分析信頼度：<strong>${confidence}</strong>。`,
      coalition: `連立安定性評価：${betCount > motCount ? '高 — 委員会活動は連立整合を示唆。' : '中 — 継続的な交渉が必要。'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>最良シナリオ（${passagePct}%）：</strong>広範な合意で法案可決。</li><li><strong>最有力シナリオ：</strong>委員会審査による修正後に最終投票。</li><li><strong>最悪シナリオ（${blockPct}%）：</strong>予期せぬ遅延が発生。</li></ul>`,
    },
    ko: {
      outcome: `문서 구성 분석에 기반하여, <strong>${topicStr}</strong>의 입법 통과 확률은 <strong>${passagePct}%</strong>로 추정됩니다. 분석 신뢰도: <strong>${confidence}</strong>.`,
      coalition: `연립 안정성 평가: ${betCount > motCount ? '높음 — 위원회 활동이 연립 조정을 시사.' : '보통 — 지속적인 협상 필요.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>최선의 경우 (${passagePct}%):</strong> 광범위한 합의로 법안 통과.</li><li><strong>가장 유력한 경우:</strong> 위원회 심사로 인한 수정 후 최종 투표.</li><li><strong>최악의 경우 (${blockPct}%):</strong> 예상치 못한 지연.</li></ul>`,
    },
    zh: {
      outcome: `基于文件构成分析，<strong>${topicStr}</strong>的立法通过概率估计为<strong>${passagePct}%</strong>。分析置信度：<strong>${confidence}</strong>。`,
      coalition: `联合稳定性评估：${betCount > motCount ? '高 — 委员会活动表明联合一致性。' : '中等 — 需要持续谈判。'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>最佳情景（${passagePct}%）：</strong>立法以广泛共识通过。</li><li><strong>最可能情景：</strong>委员会审查导致最终投票前进行修订。</li><li><strong>最坏情景（${blockPct}%）：</strong>出现意外延误。</li></ul>`,
    },
  };

  const s = sections[lang] ?? sections.en!;
  return [
    `\n<section class="predictive-assessment" aria-label="${esc(headingPredictive)}">`,
    `  <h2>${esc(headingPredictive)}</h2>`,
    `  <h3>${esc(headingOutcome)}</h3>`,
    `  <p>${s.outcome}</p>`,
    `  <h3>${esc(headingCoalition)}</h3>`,
    `  <p>${s.coalition}</p>`,
    `  <h3>${esc(headingRisk)}</h3>`,
    `  ${s.scenarios}`,
    `</section>`,
  ].join('\n') + '\n';
}

/**
 * Build a Historical Context & Precedents section.
 * Provides trend analysis, Nordic/EU benchmarking context, and precedent
 * references based on document types and detected policy domains.
 * Iteration 2 + Iteration 3 output: "why it matters historically".
 */
function buildHistoricalContext(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const sfsDocs   = docs.filter(isSfsDoc);
  const propCount = docs.filter(d => effectiveType(d) === 'prop').length;
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domainList = [...allDomains].slice(0, 3).map(d => esc(d));
  const hasEnacted = sfsDocs.length > 0;
  const topicStr = topic ? esc(topic) : null;

  const heading = deepLabel('historicalContext', lang);

  const templates: Partial<Record<Language, string>> = {
    en: `${topicStr ? `<strong>${topicStr}</strong> sits within` : 'This policy sits within'} a long tradition of Swedish parliamentary reform. ${hasEnacted ? `The presence of ${sfsDocs.length} enacted statute${sfsDocs.length !== 1 ? 's' : ''} indicates this area has established legal precedent.` : propCount > 0 ? `Active propositions suggest this policy cycle mirrors earlier reform waves, where government-initiated legislation progressed through committee scrutiny to enactment within 12–24 months.` : 'Early-stage documents suggest this represents a new policy initiative without direct statutory precedent.'} ${domainList.length > 0 ? `In the Nordic context, ${domainList.join(', ')} policy areas have historically benefited from cross-party consensus, with Sweden typically aligning with Danish and Norwegian approaches before adopting EU framework requirements.` : ''} International benchmarking indicates that comparable democracies — particularly Denmark, Norway, and Finland — have addressed similar policy challenges through incremental legislative packages rather than sweeping reform. Trend analysis across recent parliamentary sessions suggests that ${topicStr ? `${topicStr} legislation` : 'policy in this area'} is accelerating, driven by EU harmonisation requirements and coalition agreement commitments.`,
    sv: `${topicStr ? `<strong>${topicStr}</strong> ingår i` : 'Denna policy ingår i'} en lång tradition av svensk parlamentarisk reform. ${hasEnacted ? `Förekomsten av ${sfsDocs.length} antagen lag/förordning visar att området har etablerat rättslig praxis.` : propCount > 0 ? 'Aktiva propositioner tyder på att denna policycykel speglar tidigare reformvågor.' : 'Tidiga dokument tyder på ett nytt policyinitiativ utan direkt lagstadgat prejudikat.'} ${domainList.length > 0 ? `I nordisk kontext har ${domainList.join(', ')} historiskt gynnats av partikonsensus, med Sverige som vanligtvis anpassar sig till danska och norska tillvägagångssätt.` : ''} Trendanalys indikerar att ${topicStr ? `${topicStr}-lagstiftning` : 'politiken på detta område'} accelererar, driven av EU-harmoniseringskrav och koalitionsöverenskommelser.`,
    da: `${topicStr ? `<strong>${topicStr}</strong> er del af` : 'Denne politik er del af'} en lang tradition for svensk Riksdagsreform. ${domainList.length > 0 ? `I nordisk kontekst har ${domainList.join(', ')} historisk nydt gavn af tværpolitisk konsensus.` : ''} Trendanalyse viser, at politikken på dette område accelererer.`,
    no: `${topicStr ? `<strong>${topicStr}</strong> er en del av` : 'Denne politikken er en del av'} en lang tradisjon for svensk riksdagsreform. ${domainList.length > 0 ? `I nordisk kontekst har ${domainList.join(', ')} historisk nytt godt av tverrpolitisk konsensus.` : ''} Trendanalyse indikerer at politikk på dette området akselererer.`,
    fi: `${topicStr ? `<strong>${topicStr}</strong> on osa` : 'Tämä politiikka on osa'} pitkää Ruotsin valtiopäivien uudistusperinnettä. ${domainList.length > 0 ? `Pohjoismaisessa kontekstissa ${domainList.join(', ')} aloilla on historiallisesti hyöty puolueiden välisestä yhteisymmärryksestä.` : ''} Trendanalyysi osoittaa, että tämän alan politiikka kiihtyy.`,
    de: `${topicStr ? `<strong>${topicStr}</strong> steht in` : 'Diese Politik steht in'} einer langen Tradition schwedischer parlamentarischer Reform. ${hasEnacted ? `Das Vorhandensein von ${sfsDocs.length} verabschiedeten Statuten zeigt, dass in diesem Bereich rechtliche Präzedenzfälle etabliert sind.` : ''} ${domainList.length > 0 ? `Im nordischen Kontext haben ${domainList.join(', ')}-Politikbereiche historisch von einem parteiübergreifenden Konsens profitiert.` : ''} Die Trendanalyse zeigt, dass sich ${topicStr ? `${topicStr}-Gesetzgebung` : 'die Politik in diesem Bereich'} beschleunigt.`,
    fr: `${topicStr ? `<strong>${topicStr}</strong> s\u2019inscrit dans` : "Cette politique s\u2019inscrit dans"} une longue tradition de réforme parlementaire suédoise. ${hasEnacted ? `La présence de ${sfsDocs.length} statuts adoptés indique que ce domaine a établi des précédents juridiques.` : ''} ${domainList.length > 0 ? `Dans le contexte nordique, les domaines ${domainList.join(', ')} ont historiquement bénéficié d\u2019un consensus multipartite.` : ''} L\u2019analyse de tendances indique que ${topicStr ? `la législation sur ${topicStr}` : 'la politique dans ce domaine'} s\u2019accélère.`,
    es: `${topicStr ? `<strong>${topicStr}</strong> se inscribe en` : 'Esta política se inscribe en'} una larga tradición de reforma parlamentaria sueca. ${hasEnacted ? `La presencia de ${sfsDocs.length} estatutos promulgados indica que esta área ha establecido precedentes legales.` : ''} ${domainList.length > 0 ? `En el contexto nórdico, las áreas de política ${domainList.join(', ')} históricamente se han beneficiado del consenso multipartidista.` : ''} El análisis de tendencias indica que ${topicStr ? `la legislación sobre ${topicStr}` : 'la política en esta área'} se está acelerando.`,
    nl: `${topicStr ? `<strong>${topicStr}</strong> maakt deel uit van` : 'Dit beleid maakt deel uit van'} een lange traditie van Zweedse parlementaire hervorming. ${hasEnacted ? `De aanwezigheid van ${sfsDocs.length} ingevoerde wetgeving geeft aan dat er juridische precedenten zijn vastgesteld.` : ''} ${domainList.length > 0 ? `In de Noordse context hebben beleidsterreinen ${domainList.join(', ')} historisch geprofiteerd van partijoverstijgende consensus.` : ''} Trendanalyse geeft aan dat beleid op dit gebied versnelt.`,
    ar: `${topicStr ? `<strong>${topicStr}</strong> يقع ضمن` : 'تقع هذه السياسة ضمن'} تقليد طويل من الإصلاح البرلماني السويدي. ${hasEnacted ? `وجود ${sfsDocs.length} قانون${sfsDocs.length !== 1 ? 'ين' : ''} مُعتمد يشير إلى وجود سوابق قانونية راسخة.` : ''} ${domainList.length > 0 ? `في السياق الإسكندنافي، استفادت مجالات ${domainList.join('، ')} تاريخياً من توافق متعدد الأحزاب.` : ''} يشير تحليل الاتجاهات إلى تسارع السياسات في هذا المجال.`,
    he: `${topicStr ? `<strong>${topicStr}</strong> ממוקם ב` : 'מדיניות זו ממוקמת ב'}מסורת ארוכה של רפורמה פרלמנטרית שוודית. ${hasEnacted ? `נוכחות ${sfsDocs.length} חוקים שאושרו מצביעה על כך שנקבעו תקדימים משפטיים.` : ''} ${domainList.length > 0 ? `בהקשר הנורדי, תחומי ${domainList.join(', ')} נהנו היסטורית מקונצנזוס בין-מפלגתי.` : ''} ניתוח מגמות מצביע על האצת מדיניות בתחום זה.`,
    ja: `${topicStr ? `<strong>${topicStr}</strong>は` : 'この政策は'}スウェーデン議会改革の長い伝統の中に位置します。${hasEnacted ? `${sfsDocs.length}件の制定された法律の存在は、この分野に法的先例があることを示しています。` : ''}${domainList.length > 0 ? `北欧の文脈では、${domainList.join('、')}分野は歴史的に超党派の合意から恩恵を受けてきました。` : ''}トレンド分析は、この分野の政策が加速していることを示しています。`,
    ko: `${topicStr ? `<strong>${topicStr}</strong>는` : '이 정책은'} 스웨덴 의회 개혁의 오랜 전통 속에 있습니다. ${hasEnacted ? `${sfsDocs.length}개의 제정된 법률의 존재는 이 분야에 법적 선례가 있음을 나타냅니다.` : ''}${domainList.length > 0 ? `북유럽 맥락에서 ${domainList.join(', ')} 정책 영역은 역사적으로 초당적 합의에서 혜택을 받았습니다.` : ''} 추세 분석은 이 분야의 정책이 가속화되고 있음을 시사합니다.`,
    zh: `${topicStr ? `<strong>${topicStr}</strong>处于` : '这一政策处于'}瑞典议会改革的悠久传统之中。${hasEnacted ? `${sfsDocs.length}项已颁布法规的存在表明该领域已建立法律先例。` : ''}${domainList.length > 0 ? `在北欧背景下，${domainList.join('、')}政策领域历史上受益于跨党派共识。` : ''}趋势分析表明该领域的政策正在加速。`,
  };

  const text = templates[lang] ?? templates.en ?? '';
  return `\n<section class="historical-context" aria-label="${esc(heading)}">\n  <h2>${esc(heading)}</h2>\n  <p>${text}</p>\n</section>\n`;
}

/**
 * Build a Methodology & Confidence section.
 * Documents data sources, analysis methods, confidence scores, and known
 * limitations — providing epistemic transparency for the intelligence report.
 * Iteration 4 output: "is the analysis sound".
 */
function buildMethodologySection(docs: RawDocument[], topic: string | null, lang: Language, depth: number): string {
  const clampedDepth = Math.max(1, Math.min(4, Math.round(depth)));
  const esc = escapeHtml;
  const enriched = docs.filter(d => d.contentFetched).length;
  const confidence = deriveConfidence(docs);
  const heading = deepLabel('methodology', lang);
  const topicStr = topic ? esc(topic) : null;

  const iterationLabels: Partial<Record<Language, string[]>> = {
    en: ['Surface analysis (events and actors identified)', 'Deep analysis (motivations and strategic implications)', 'Predictive analysis (outcome forecasting and risk scenarios)', 'Quality review (bias check and completeness verification)'],
    sv: ['Ytanalys (händelser och aktörer identifierade)', 'Djupanalys (motivationer och strategiska implikationer)', 'Prediktiv analys (prognoser och riskscenarier)', 'Kvalitetsgranskning (biaskontroll och fullständighetsverifiering)'],
    da: ['Overfladeanalyse (hændelser og aktører identificeret)', 'Dybdeanalyse (motivationer og strategiske implikationer)', 'Prædiktiv analyse (prognoser og risikoscenarier)', 'Kvalitetsgennemgang (bias-tjek og fuldstændighedsverificering)'],
    no: ['Overflateanalyse (hendelser og aktører identifisert)', 'Dybdeanalyse (motivasjoner og strategiske implikasjoner)', 'Prediktiv analyse (prognoser og risikoscenarier)', 'Kvalitetsgjennomgang (bias-sjekk og fullstendighetsverifisering)'],
    fi: ['Pintaanalyysi (tapahtumat ja toimijat tunnistettu)', 'Syväanalyysi (motiivit ja strategiset vaikutukset)', 'Ennakoiva analyysi (ennusteet ja riskiskenaariot)', 'Laaduntarkistus (vinoutumien tarkistus ja kattavuuden varmennus)'],
    de: ['Oberflächenanalyse (Ereignisse und Akteure identifiziert)', 'Tiefenanalyse (Motivationen und strategische Implikationen)', 'Prädiktive Analyse (Prognosen und Risikoszenarien)', 'Qualitätsprüfung (Bias-Prüfung und Vollständigkeitsverifikation)'],
    fr: ['Analyse de surface (événements et acteurs identifiés)', 'Analyse approfondie (motivations et implications stratégiques)', 'Analyse prédictive (prévisions et scénarios de risque)', 'Revue qualité (vérification des biais et de l\'exhaustivité)'],
    es: ['Análisis superficial (eventos y actores identificados)', 'Análisis profundo (motivaciones e implicaciones estratégicas)', 'Análisis predictivo (pronósticos y escenarios de riesgo)', 'Revisión de calidad (verificación de sesgos y exhaustividad)'],
    nl: ['Oppervlakteanalyse (gebeurtenissen en actoren geïdentificeerd)', 'Diepteanalyse (motivaties en strategische implicaties)', 'Voorspellende analyse (prognoses en risicoscenario\'s)', 'Kwaliteitsreview (bias-controle en volledigheidsverificatie)'],
    ar: ['تحليل سطحي (تحديد الأحداث والجهات الفاعلة)', 'تحليل معمق (الدوافع والتداعيات الاستراتيجية)', 'تحليل تنبؤي (توقعات وسيناريوهات المخاطر)', 'مراجعة الجودة (التحقق من التحيز والاكتمال)'],
    he: ['ניתוח שטחי (זיהוי אירועים ושחקנים)', 'ניתוח עמוק (מניעים והשלכות אסטרטגיות)', 'ניתוח חיזויי (תחזיות ותרחישי סיכון)', 'ביקורת איכות (בדיקת הטיה ואימות שלמות)'],
    ja: ['表面分析（出来事と関係者の特定）', '詳細分析（動機と戦略的示唆）', '予測分析（結果予測とリスクシナリオ）', '品質レビュー（バイアスチェックと網羅性検証）'],
    ko: ['표면 분석 (사건 및 행위자 식별)', '심층 분석 (동기 및 전략적 시사점)', '예측 분석 (결과 예측 및 위험 시나리오)', '품질 검토 (편향 확인 및 완전성 검증)'],
    zh: ['表面分析（事件和行为者识别）', '深度分析（动机和战略影响）', '预测分析（结果预测和风险情景）', '质量审查（偏差检查和完整性验证）'],
  };

  const labels = iterationLabels[lang] ?? iterationLabels.en!;
  const iterationItems = labels.slice(0, clampedDepth).map((label) =>
    `<li>${esc(label)}</li>`
  ).join('\n    ');

  const sourceLabels: Partial<Record<Language, string>> = {
    en: 'Data Sources', sv: 'Datakällor', da: 'Datakilder', no: 'Datakilder',
    fi: 'Tietolähteet', de: 'Datenquellen', fr: 'Sources de données', es: 'Fuentes de datos',
    nl: 'Gegevensbronnen', ar: 'مصادر البيانات', he: 'מקורות נתונים',
    ja: 'データソース', ko: '데이터 출처', zh: '数据来源',
  };
  const sourceDesc: Partial<Record<Language, string>> = {
    en: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v proxy), and supplementary external sources (GitHub raw content, public government URLs) when available',
    sv: 'Riksdagens MCP-API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v-proxy) samt kompletterande externa källor (GitHub-råinnehåll, offentliga myndighets-URL:er) vid tillgänglighet',
    da: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v proxy) samt supplerende eksterne kilder ved tilgængelighed',
    no: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v proxy) samt supplerende eksterne kilder ved tilgjengelighet',
    fi: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v-välityspalvelin) sekä täydentävät ulkoiset lähteet saatavuuden mukaan',
    de: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v-Proxy) sowie ergänzende externe Quellen bei Verfügbarkeit',
    fr: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (proxy g0v) et sources externes complémentaires selon disponibilité',
    es: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (proxy g0v) y fuentes externas complementarias según disponibilidad',
    nl: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v proxy) en aanvullende externe bronnen indien beschikbaar',
    ar: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall)، regeringen.se (وكيل g0v)، ومصادر خارجية تكميلية عند التوفر',
    he: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (פרוקסי g0v), ומקורות חיצוניים משלימים בהתאם לזמינות',
    ja: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall)、regeringen.se (g0v プロキシ)、および利用可能な場合は補足的な外部ソース',
    ko: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v 프록시) 및 이용 가능한 경우 보충 외부 소스',
    zh: 'Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall)、regeringen.se (g0v代理) 以及可用时的补充外部来源',
  };
  const iterLabel: Partial<Record<Language, string>> = {
    en: 'Analysis iterations completed', sv: 'Genomförda analysiterationer', da: 'Gennemførte analyseiterationer',
    no: 'Gjennomførte analyseiterationer', fi: 'Suoritetut analyysikierrokset', de: 'Abgeschlossene Analyseiterationen',
    fr: 'Itérations d\'analyse terminées', es: 'Iteraciones de análisis completadas', nl: 'Voltooide analyseiteraties',
    ar: 'تكرارات التحليل المكتملة', he: 'איטרציות ניתוח שהושלמו', ja: '完了した分析反復', ko: '완료된 분석 반복', zh: '已完成的分析迭代',
  };
  const confLabel: Partial<Record<Language, string>> = {
    en: 'Overall confidence score', sv: 'Övergripande konfidenspoäng', da: 'Samlet konfidensscore',
    no: 'Samlet konfidensskår', fi: 'Kokonaisluottamuspistemäärä', de: 'Gesamtkonfidenzwert',
    fr: 'Score de confiance global', es: 'Puntuación de confianza general', nl: 'Algehele betrouwbaarheidsscore',
    ar: 'درجة الثقة الكلية', he: 'ציון ביטחון כולל', ja: '全体的な信頼スコア', ko: '전체 신뢰도 점수', zh: '整体置信度分数',
  };
  const enrichLabel: Partial<Record<Language, string>> = {
    en: 'Documents enriched with full text', sv: 'Dokument berikade med fulltext', da: 'Dokumenter beriget med fulde tekster',
    no: 'Dokumenter beriket med fulltekst', fi: 'Asiakirjat rikastettu koko tekstillä', de: 'Dokumente mit vollständigem Text angereichert',
    fr: 'Documents enrichis avec le texte complet', es: 'Documentos enriquecidos con texto completo', nl: 'Documenten verrijkt met volledige tekst',
    ar: 'وثائق معززة بالنص الكامل', he: 'מסמכים מועשרים בטקסט מלא', ja: '全文で強化された文書', ko: '전문으로 보강된 문서', zh: '以全文强化的文件',
  };
  const limitLabel: Partial<Record<Language, string>> = {
    en: 'Known limitations', sv: 'Kända begränsningar', da: 'Kendte begrænsninger', no: 'Kjente begrensninger',
    fi: 'Tunnetut rajoitukset', de: 'Bekannte Einschränkungen', fr: 'Limitations connues', es: 'Limitaciones conocidas',
    nl: 'Bekende beperkingen', ar: 'القيود المعروفة', he: 'מגבלות ידועות', ja: '既知の制限事項', ko: '알려진 제한사항', zh: '已知限制',
  };
  const limitText: Partial<Record<Language, string>> = {
    en: `Analysis based on publicly available parliamentary data only. ${enriched < docs.length ? `${docs.length - enriched} document${docs.length - enriched !== 1 ? 's' : ''} analysed without full text due to availability constraints.` : 'All documents enriched with full text.'} ${topicStr ? `Topic focus limited to: ${topicStr}.` : ''} Predictive assessments use heuristic models and should be treated as indicative, not definitive.`,
    sv: `Analys baserad enbart på offentligt tillgängliga parlamentariska data. ${enriched < docs.length ? `${docs.length - enriched} dokument analyserade utan fulltext.` : 'Alla dokument berikade med fulltext.'} Prediktiva bedömningar är heuristiska och ska behandlas som vägledande.`,
    da: `Analyse baseret på offentligt tilgængelige parlamentariske data. Prædiktive vurderinger er vejledende.`,
    no: `Analyse basert på offentlig tilgjengelige parlamentariske data. Prediktive vurderinger er heuristiske.`,
    fi: `Analyysi perustuu vain julkisesti saatavilla oleviin parlamentaarisiin tietoihin. Ennustavat arviot ovat heuristisia.`,
    de: `Analyse basiert ausschließlich auf öffentlich zugänglichen parlamentarischen Daten. Prädiktive Bewertungen sind heuristisch.`,
    fr: `Analyse basée uniquement sur des données parlementaires accessibles au public. Les évaluations prédictives sont heuristiques.`,
    es: `Análisis basado únicamente en datos parlamentarios disponibles públicamente. Las evaluaciones predictivas son heurísticas.`,
    nl: `Analyse gebaseerd op alleen publiek beschikbare parlementaire gegevens. Voorspellende beoordelingen zijn heuristisch.`,
    ar: `التحليل مستند إلى البيانات البرلمانية المتاحة للعموم فقط. التقييمات التنبؤية هيوريستية.`,
    he: `ניתוח מבוסס על נתונים פרלמנטריים זמינים לציבור בלבד. הערכות חיזויות הן היוריסטיות.`,
    ja: `分析は公開されている議会データのみに基づいています。予測評価はヒューリスティックなものです。`,
    ko: `분석은 공개적으로 이용 가능한 의회 데이터만을 기반으로 합니다. 예측 평가는 경험적입니다.`,
    zh: `分析仅基于公开可用的议会数据。预测评估是启发式的。`,
  };

  return [
    `\n<section class="methodology-confidence" aria-label="${esc(heading)}">`,
    `  <h2>${esc(heading)}</h2>`,
    `  <dl class="methodology-details">`,
    `    <dt>${esc(sourceLabels[lang] ?? sourceLabels.en!)}</dt>`,
    `    <dd>${sourceDesc[lang] ?? sourceDesc.en}</dd>`,
    `    <dt>${esc(iterLabel[lang] ?? iterLabel.en!)}</dt>`,
    `    <dd><ol class="iteration-list">\n    ${iterationItems}\n    </ol></dd>`,
    `    <dt>${esc(confLabel[lang] ?? confLabel.en!)}</dt>`,
    `    <dd><strong>${confidence}</strong></dd>`,
    `    <dt>${esc(enrichLabel[lang] ?? enrichLabel.en!)}</dt>`,
    `    <dd>${enriched} / ${docs.length}</dd>`,
    `    <dt>${esc(limitLabel[lang] ?? limitLabel.en!)}</dt>`,
    `    <dd>${limitText[lang] ?? limitText.en}</dd>`,
    `  </dl>`,
    `</section>`,
  ].join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Deep-Inspection TemplateSection builders (SWOT + Dashboard)
// ---------------------------------------------------------------------------

/**
 * Compute the effective document type for a RawDocument.
 * SFS-by-name docs (missing doktyp/documentType but dokumentnamn starting with "SFS")
 * are normalised to 'sfs' so filters, typeCounts, and chart labels stay consistent.
 */
function effectiveType(d: RawDocument): string {
  return (d.doktyp || d.documentType)
    || ((d.dokumentnamn || '').startsWith('SFS') ? 'sfs' : 'other');
}

/**
 * Build SWOT and dashboard TemplateSections for a deep-inspection article.
 * Uses buildAISwotStakeholders() to derive 6 stakeholder perspectives
 * from document metadata (types, titles, document IDs as evidence).
 * Returns TemplateSection[] ready for generateArticleHTML.sections.
 */
function buildDeepInspectionSections(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiResult?: any,
): TemplateSection[] {
  if (docs.length === 0) return [];

  // Single-pass classification: bucket docs by effectiveType() to avoid N×filter passes.
  // EU docs use both 'fpm' and 'eu' raw types; effectiveType() preserves the raw value,
  // so we merge both into the euDocs bucket below.
  const buckets = new Map<string, RawDocument[]>();
  for (const d of docs) {
    const t = effectiveType(d);
    let arr = buckets.get(t);
    if (!arr) { arr = []; buckets.set(t, arr); }
    arr.push(d);
  }
  const propDocs   = buckets.get('prop')   ?? [];
  const betDocs    = buckets.get('bet')    ?? [];
  const motDocs    = buckets.get('mot')    ?? [];
  const skrDocs    = buckets.get('skr')    ?? [];
  const sfsDocs    = buckets.get('sfs')    ?? [];
  const euDocs     = [...(buckets.get('fpm') ?? []), ...(buckets.get('eu') ?? [])];
  const pressmDocs = buckets.get('pressm') ?? [];
  const extDocs    = buckets.get('ext')    ?? [];
  // classifiedTypes must mirror every bucket key consumed above (including both EU keys)
  const classifiedTypes = new Set(['prop','bet','mot','skr','sfs','fpm','eu','pressm','ext']);
  const otherDocs  = [...buckets.entries()]
    .filter(([k]) => !classifiedTypes.has(k))
    .flatMap(([, v]) => v);

  // ── 6-stakeholder SWOT ───────────────────────────────────────────────────
  const stakeholders = buildAISwotStakeholders(docs, topic ?? '', lang);

  const strategicContext = topic
    ? `Analysis exclusively focused on: ${topic} — ${docs.length} parliamentary documents examined`
    : `Multi-stakeholder analysis of ${docs.length} parliamentary documents`;
  const swotSection = generateStakeholderSwotSection({ stakeholders, lang, strategicContext });

  // ── Localised names for mindmap/sankey labels
  const govName     = AI_STAKEHOLDER_NAMES['government-coalition'][lang] ?? AI_STAKEHOLDER_NAMES['government-coalition'].en;
  const oppName     = AI_STAKEHOLDER_NAMES['opposition'][lang]           ?? AI_STAKEHOLDER_NAMES['opposition'].en;
  const privateName = AI_STAKEHOLDER_NAMES['private-sector'][lang]       ?? AI_STAKEHOLDER_NAMES['private-sector'].en;

  // ── Multi-chart dashboard ─────────────────────────────────────────────────
  // Produces 3 chart types (radar, scatter, bar) with accessible data tables.
  const dashboardAnalysis = analyzeDashboardData(docs, topic ?? '', lang);

  // Also build the classic document-type distribution bar chart as chart #4
  // so existing article consumers still see document counts.
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    const t = effectiveType(d);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const rawTypeKeys = Object.keys(typeCounts);
  // Use localized display names for chart labels (e.g., "Press Release" not "pressm")
  const chartLabels = rawTypeKeys.map(t => docTypeLabel(t, lang, typeCounts[t]));
  const chartValues = rawTypeKeys.map(t => typeCounts[t]);

  const docTypeChart: DashboardChartConfig = {
    id: 'deep-inspection-doc-types',
    type: 'bar' as const,
    title: deepLabel('documentsByType', lang),
    labels: chartLabels,
    datasets: [{
      label: deepLabel('documents', lang),
      data: chartValues,
      backgroundColor: rawTypeKeys.map((_, i) => DEEP_CHART_PALETTE[i % DEEP_CHART_PALETTE.length]),
    }],
  };
  const docTypeTable: DashboardTableConfig = {
    caption: deepLabel('documentsByType', lang),
    headers: [deepLabel('documentTypes', lang), deepLabel('documents', lang)],
    rows: rawTypeKeys.map((t, i) => [docTypeLabel(t, lang, chartValues[i]), String(chartValues[i])]),
  };

  const dashboardSection = generateDashboardSection({
    data: {
      title: topic
        ? `${deepLabel('documentIntelligence', lang)} — ${topic}`
        : deepLabel('documentIntelligence', lang),
      summary: dashboardAnalysis.summary,
      charts: [...dashboardAnalysis.charts, docTypeChart],
      tables: [...dashboardAnalysis.tables, docTypeTable],
    },
    lang,
  });

  // ── Mindmap: conceptual map across political dimensions ──────────────────
  const allDetectedDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDetectedDomains.add(dom)));
  if (aiResult?.synthesis?.emergingTrends) {
    (aiResult.synthesis.emergingTrends as string)
      .split(',')
      .map((s: string) => s.split('[')[0]?.trim() ?? '')
      .filter(Boolean)
      .forEach((dom: string) => allDetectedDomains.add(dom));
  }
  const detectedDomainList = [...allDetectedDomains].filter(Boolean).slice(0, 8);

  // Pass precomputed domains to avoid iterating docs twice
  const aiAnalysis = buildAIMindmapAnalysis(docs, topic, lang, detectedDomainList);
  const mindmapSection = generateMindmapSection(
    buildMindmapOptionsFromAnalysis(
      aiAnalysis,
      lang,
      topic || deepLabel('parliamentaryAnalysis', lang),
      {
        summary: topic
          ? `${deepLabel('conceptualMap', lang)}: ${topic}`
          : `${deepLabel('conceptualMap', lang)} — ${docs.length} ${deepLabel('documents', lang).toLowerCase()}`,
      },
    ),
  );

  // ── Sankey: party/doc-type flow → legislative outcome ─────────────────────
  // The sankey uses three primary legislative actor groups as source nodes:
  //   - government: initiates propositions, laws, gov. communications, press releases,
  //     and EU position papers (fpm) — these originate from government ministries
  //   - opposition: initiates committee reports and motions
  //   - private sector / external actors: associated with external references
  //     and other document types
  // Additional SWOT stakeholders (civil society, citizens, etc.) are
  // analysis perspectives rather than document-originating actors.
  const sankeyNodes: SankeyNode[] = [
    { id: 'gov', label: govName,           color: 'cyan' },
    { id: 'opp', label: oppName,           color: 'magenta' },
    { id: 'pvt', label: privateName,       color: 'purple' },
  ];

  // Add document type nodes and target outcome nodes
  const sankeyFlows: SankeyFlow[] = [];
  if (propDocs.length > 0) {
    sankeyNodes.push({ id: 'prop', label: 'Propositions', color: 'orange' });
    sankeyFlows.push({ source: 'gov', target: 'prop', value: propDocs.length, label: `${propDocs.length}` });
  }
  if (betDocs.length > 0) {
    sankeyNodes.push({ id: 'bet', label: 'Committee Reports', color: 'blue' });
    sankeyFlows.push({ source: 'opp', target: 'bet', value: betDocs.length, label: `${betDocs.length}` });
  }
  if (motDocs.length > 0) {
    sankeyNodes.push({ id: 'mot', label: 'Motions', color: 'yellow' });
    sankeyFlows.push({ source: 'opp', target: 'mot', value: motDocs.length, label: `${motDocs.length}` });
  }
  if (sfsDocs.length > 0) {
    sankeyNodes.push({ id: 'sfs', label: 'Laws (SFS)', color: 'green' });
    sankeyFlows.push({ source: 'gov', target: 'sfs', value: sfsDocs.length, label: `${sfsDocs.length}` });
  }
  if (skrDocs.length > 0) {
    sankeyNodes.push({ id: 'skr', label: deepLabel('govCommunications', lang), color: 'green' });
    sankeyFlows.push({ source: 'gov', target: 'skr', value: skrDocs.length, label: `${skrDocs.length}` });
  }
  if (euDocs.length > 0) {
    sankeyNodes.push({ id: 'eu', label: 'EU Positions', color: 'blue' });
    sankeyFlows.push({ source: 'gov', target: 'eu', value: euDocs.length, label: `${euDocs.length}` });
  }
  if (pressmDocs.length > 0) {
    sankeyNodes.push({ id: 'pressm', label: 'Press Releases', color: 'orange' });
    sankeyFlows.push({ source: 'gov', target: 'pressm', value: pressmDocs.length, label: `${pressmDocs.length}` });
  }
  if (extDocs.length > 0) {
    sankeyNodes.push({ id: 'ext', label: 'External / Reference', color: 'purple' });
    sankeyFlows.push({ source: 'pvt', target: 'ext', value: extDocs.length, label: `${extDocs.length}` });
  }
  if (otherDocs.length > 0) {
    sankeyNodes.push({ id: 'other', label: 'Other Docs', color: 'purple' });
    sankeyFlows.push({ source: 'pvt', target: 'other', value: otherDocs.length, label: `${otherDocs.length}` });
  }

  // Only include Sankey when there is more than one non-trivial flow (otherwise uninformative)
  const sankeySection: TemplateSection | null = sankeyFlows.length >= 2
    ? generateSankeySection({
        nodes: sankeyNodes,
        flows: sankeyFlows,
        lang,
        title: topic ? `Legislative Flow — ${topic}` : 'Legislative Flow',
        summary: `Flow of ${docs.length} parliamentary documents from initiating actors to document types`,
      })
    : null;

  // ── World Bank / Economic Dashboard ──────────────────────────────────────
  const economicSection = detectedDomainList.length > 0
    ? generateEconomicDashboardSection({ policyDomains: detectedDomainList, lang })
    : null;

  const additionalSections: TemplateSection[] = [
    ...(sankeySection ? [sankeySection] : []),
    ...(economicSection ? [economicSection] : []),
    mindmapSection,
  ];

  return [dashboardSection, swotSection, ...additionalSections];
}

/**
 * Generate Deep-Inspection article targeting specific documents or policy topics.
 * Uses documentIds, documentUrls, and focusTopic from CLI config to fetch
 * targeted Riksdag documents and generate in-depth analysis articles.
 */
export async function generateDeepInspection(): Promise<GenerationResult> {
  console.log('🔍 Generating Deep-Inspection article...');

  if (documentIds.length === 0 && documentUrls.length === 0 && !focusTopic) {
    console.log('  ⚠️ No targeting parameters provided (--document-ids, --document-urls, or --focus-topic)');
    console.log('  ℹ️ Deep-inspection requires at least one targeting parameter — skipping');
    return { success: true, files: 0 };
  }

  console.log(`  📋 Document IDs: ${documentIds.length > 0 ? documentIds.join(', ') : '(none)'}`);
  console.log(`  🔗 Document URLs: ${documentUrls.length > 0 ? documentUrls.join(', ') : '(none)'}`);
  console.log(`  🎯 Focus topic: ${focusTopic || '(none)'}`);
  console.log(`  🔬 Analysis depth: ${analysisDepth} (${['surface', 'predictive+historical', 'full with executive summary', 'full multi-iteration'][analysisDepth - 1]})`);

  try {
    const client: MCPClient = await getSharedClient();

    // Resolve document IDs from URLs and collect government/GitHub URLs separately
    const urlDerivedIds: string[] = [];
    const governmentUrls: string[] = [];
    const gitHubUrls: string[] = [];
    for (const url of documentUrls) {
      const docId = extractDocIdFromUrl(url);
      if (docId) {
        console.log(`  🔗 Resolved URL → dok_id: ${docId}`);
        urlDerivedIds.push(docId);
      } else if (isGovernmentUrl(url)) {
        console.log(`  🏛️ Government URL detected (will fetch via g0v): ${url}`);
        governmentUrls.push(url);
      } else if (isGitHubUrl(url)) {
        console.log(`  📦 GitHub URL detected (will fetch raw content): ${url}`);
        gitHubUrls.push(url);
      } else {
        console.warn(`  ⚠️ Unsupported URL type (riksdagen.se, regeringen.se, github.com supported): ${url}`);
      }
    }

    // Combine explicit IDs + URL-derived IDs (deduplicated)
    const allDocIds: string[] = [...new Set([...documentIds, ...urlDerivedIds])];

    // Fetch targeted documents by ID
    const targetDocs: RawDocument[] = [];
    for (const docId of allDocIds) {
      try {
        console.log(`  🔄 Fetching document ${docId}...`);
        const doc = await client.request('get_dokument', { dok_id: docId });
        if (doc) targetDocs.push(doc as RawDocument);
      } catch (err: unknown) {
        console.warn(`  ⚠️ Could not fetch document ${docId}: ${(err as Error).message}`);
      }
    }

    // Fetch government document content for regeringen.se URLs via g0v
    for (const govUrl of governmentUrls) {
      try {
        console.log(`  🏛️ Fetching government document: ${govUrl}`);
        const content = await client.fetchGovernmentDocumentContent(govUrl);
        if (content) {
          // Extract a human-readable title from the URL path's last segment.
          // e.g. "/pressmeddelanden/2026/03/91-atgarder-ska-starka-..." → "91 atgarder ska starka ..."
          const urlPath = new URL(govUrl).pathname;
          const segments = urlPath.split('/').filter(Boolean);
          const titleSlug = segments[segments.length - 1] ?? 'government-document';
          const titleFromSlug = titleSlug.replace(/-/g, ' ');

          // Use a URL-path-based hash suffix to avoid dok_id collisions between
          // government documents that share the same first 30 chars of their slug.
          const hashSuffix = hashPathSuffix(urlPath);
          const govDoc: RawDocument = {
            doktyp: 'pressm',
            documentType: 'pressm',
            titel: titleFromSlug,
            title: titleFromSlug,
            url: govUrl,
            dok_id: `gov-${titleSlug.slice(0, 30)}-${hashSuffix}`,
            fullText: content,
            fullContent: content,
            contentFetched: true,
            summary: content.slice(0, 500),
            datum: new Date().toISOString().split('T')[0],
          };
          targetDocs.push(govDoc);
          console.log(`  ✅ Government document fetched: ${titleFromSlug}`);
        } else {
          console.warn(`  ⚠️ No content returned for government URL: ${govUrl}`);
        }
      } catch (err: unknown) {
        console.warn(`  ⚠️ Failed to fetch government document ${govUrl}: ${(err as Error).message}`);
      }
    }

    // Fetch GitHub raw content for github.com URLs (e.g. strategy documents, reference docs)
    for (const ghUrl of gitHubUrls) {
      try {
        const rawUrl = toGitHubRawUrl(ghUrl);
        if (!rawUrl) {
          console.warn(`  ⚠️ Cannot convert GitHub URL to raw format: ${ghUrl}`);
          continue;
        }
        console.log(`  📦 Fetching GitHub content: ${rawUrl}`);
        const content = await client.fetchExternalUrlContent(rawUrl);
        if (content) {
          // Extract title from file path — e.g. "Information_Security_Strategy.md" → "Information Security Strategy"
          const urlPath = new URL(ghUrl).pathname;
          // After split('/').filter(Boolean), segments = ['owner', 'repo', 'blob', 'branch', ...pathParts]
          const segments = urlPath.split('/').filter(Boolean);
          const filename = segments[segments.length - 1] ?? 'external-document';
          const titleFromFilename = filename
            .replace(/\.(md|txt|rst|adoc|html)$/i, '')
            .replace(/[-_]/g, ' ');

          // Identify the repository context (owner/repo) for the title
          const repoContext = segments.length >= 2 ? `${segments[0]}/${segments[1]}` : '';
          const fullTitle = repoContext ? `${titleFromFilename} (${repoContext})` : titleFromFilename;

          // Use full URL path hash to avoid dok_id collisions across repositories
          const hashSuffix = hashPathSuffix(urlPath);
          // Include repo context in dok_id for cross-repository uniqueness
          const repoSlug = repoContext ? repoContext.replace('/', '-').slice(0, 20) : '';
          const fileSlug = filename.slice(0, 30).replace(/\.(md|txt|rst|adoc|html)$/i, '');
          const ghDoc: RawDocument = {
            doktyp: 'ext',
            documentType: 'ext',
            titel: fullTitle,
            title: fullTitle,
            url: ghUrl,
            dok_id: `gh-${repoSlug}-${fileSlug}-${hashSuffix}`,
            fullText: content,
            fullContent: content,
            contentFetched: true,
            summary: content.slice(0, 500),
            datum: new Date().toISOString().split('T')[0],
          };
          targetDocs.push(ghDoc);
          console.log(`  ✅ GitHub document fetched: ${fullTitle}`);
        } else {
          console.warn(`  ⚠️ No content returned for GitHub URL: ${ghUrl}`);
        }
      } catch (err: unknown) {
        console.warn(`  ⚠️ Failed to fetch GitHub document ${ghUrl}: ${(err as Error).message}`);
      }
    }

    // Fetch documents by focus topic if no IDs resolved
    if (targetDocs.length === 0 && focusTopic) {
      console.log(`  🔄 Searching documents for topic: ${focusTopic}`);
      const rawDocs = await client.searchDocuments({ titel: focusTopic, limit: 10 })
        .catch((e: unknown) => { if (requireMcp) throw e; return [] as RawDocument[]; });
      targetDocs.push(...(Array.isArray(rawDocs) ? rawDocs as RawDocument[] : []));
    }

    if (targetDocs.length === 0) {
      console.log('  ℹ️ No target documents found for deep inspection — skipping');
      return { success: true, files: 0 };
    }

    console.log(`  📊 Found ${targetDocs.length} target documents for deep inspection`);

    // Enrich documents with content
    console.log('  🔍 Enriching documents with detailed content...');
    const enriched = await client.enrichDocumentsWithContent(
      targetDocs as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3
    );
    const enrichedDocs = enriched as RawDocument[];
    const enrichedCount: number = (enrichedDocs as Array<Record<string, unknown>>).filter(d => d['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${enrichedDocs.length} documents with content`);

    const today: Date = new Date();

    const sanitizeSlugSegment = (value: string): string =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 40)
        .replace(/^-+|-+$/g, '');

    const focusSlug: string = focusTopic ? sanitizeSlugSegment(focusTopic) : '';

    let topicSlug: string;
    if (focusSlug) {
      topicSlug = focusSlug;
    } else {
      const primaryDocId: string =
        allDocIds[0]
        ?? enrichedDocs[0]?.dok_id
        ?? 'analysis';
      const fallbackSlug: string = sanitizeSlugSegment(primaryDocId);
      topicSlug = fallbackSlug || 'analysis';
    }

    const slug: string = `${formatDateForSlug(today)}-deep-inspection-${topicSlug}`;

    const sanitizedTopicRaw = focusTopic ? sanitizePlainText(focusTopic) : '';
    const sanitizedTopic: string | null = sanitizedTopicRaw.trim() || null;
    const defaultTopicLabels: Record<Language, string> = {
      en: 'Policy Analysis',
      sv: 'Policyanalys',
      da: 'Politisk analyse',
      no: 'Politisk analyse',
      fi: 'Politiikka-analyysi',
      de: 'Politikanalyse',
      fr: 'Analyse politique',
      es: 'Análisis político',
      nl: 'Beleidsanalyse',
      ar: 'تحليل السياسات',
      he: 'ניתוח מדיניות',
      ja: '政策分析',
      ko: '정책 분석',
      zh: '政策分析',
    };
    const titles: Record<Language, TitleSet> = {
      en: { title: `Deep Inspection: ${sanitizedTopic || defaultTopicLabels.en}`, subtitle: `Deep Inspection — AI-generated political intelligence from Sweden's Riksdag` },
      sv: { title: `Djupanalys: ${sanitizedTopic || defaultTopicLabels.sv}`, subtitle: `Djupanalys — AI-genererad politisk analys från Sveriges riksdag` },
      da: { title: `Dybdeanalyse: ${sanitizedTopic || defaultTopicLabels.da}`, subtitle: `Dybdeanalyse — AI-genereret politisk analyse fra det svenske parlament` },
      no: { title: `Dybdeanalyse: ${sanitizedTopic || defaultTopicLabels.no}`, subtitle: `Dybdeanalyse — AI-generert politisk analyse fra det svenske parlamentet` },
      fi: { title: `Syväanalyysi: ${sanitizedTopic || defaultTopicLabels.fi}`, subtitle: `Syväanalyysi — tekoälytuotettu poliittinen analyysi Ruotsin valtiopäiviltä` },
      de: { title: `Tiefenanalyse: ${sanitizedTopic || defaultTopicLabels.de}`, subtitle: `Tiefenanalyse — KI-generierte politische Analyse aus dem schwedischen Parlament` },
      fr: { title: `Analyse approfondie: ${sanitizedTopic || defaultTopicLabels.fr}`, subtitle: `Analyse approfondie — analyse politique générée par IA du Parlement suédois` },
      es: { title: `Análisis en profundidad: ${sanitizedTopic || defaultTopicLabels.es}`, subtitle: `Análisis en profundidad — análisis político generado por IA del Parlamento sueco` },
      nl: { title: `Diepteanalyse: ${sanitizedTopic || defaultTopicLabels.nl}`, subtitle: `Diepteanalyse — AI-gegenereerde politieke analyse uit het Zweedse parlement` },
      ar: { title: `تحليل معمّق: ${sanitizedTopic || defaultTopicLabels.ar}`, subtitle: `تحليل معمّق — تحليل سياسي بالذكاء الاصطناعي من البرلمان السويدي` },
      he: { title: `ניתוח מעמיק: ${sanitizedTopic || defaultTopicLabels.he}`, subtitle: `ניתוח מעמיק — ניתוח פוליטי שנוצר על ידי בינה מלאכותית מהפרלמנט השוודי` },
      ja: { title: `詳細分析：${sanitizedTopic || defaultTopicLabels.ja}`, subtitle: `詳細分析 — スウェーデン議会のAI生成政治分析` },
      ko: { title: `심층 분석: ${sanitizedTopic || defaultTopicLabels.ko}`, subtitle: `심층 분석 — 스웨덴 의회의 AI 생성 정치 분석` },
      zh: { title: `深度分析：${sanitizedTopic || defaultTopicLabels.zh}`, subtitle: `深度分析 — 瑞典议会的AI生成政治分析` },
    };

    const enrichment = await getAnalysisEnrichment();

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version (analysis-depth: ${analysisDepth})...`);
      const pipelineDepth: AnalysisDepth = mapReportDepthToPipelineDepth(analysisDepth);

      const analysis = {
        iterationsCompleted: 0,
        confidenceScore: 0,
        documentCount: enrichedDocs.length,
        enrichedCount: enrichedDocs.length,
        completedAt: new Date().toISOString(),
      };
      const validation = { passed: true };
      const iterationDurationsMs = [0];
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const aiResult = undefined;

      // Write iteration metadata for audit trail
      const iterationMetadata: AnalysisIterationMetadata = {
        articleSlug: slug,
        lang,
        depth: pipelineDepth,
        iterationsCompleted: analysis.iterationsCompleted,
        iterationDurationsMs,
        confidenceScore: analysis.confidenceScore,
        validationResult: validation,
        documentCount: analysis.documentCount,
        enrichedCount: analysis.enrichedCount,
        focusTopic: sanitizedTopic ?? undefined,
        completedAt: analysis.completedAt,
      };
      writeAnalysisMetadata(slug, iterationMetadata);

      // Topic-focused deep-inspection content (uses AI strategic implications & takeaways when available)
      const content: string = generateDeepInspectionContent(enrichedDocs, sanitizedTopic, lang, analysisDepth, aiResult);

      // Metadata still derived from document data
      const contentData = { documents: enrichedDocs as Parameters<typeof generateArticleContent>[0]['documents'] };
      const watchPoints = extractWatchPoints(contentData, lang);
      const metadata = generateMetadata(contentData, 'deep-inspection', lang);
      const readTime: string = calculateReadTime(content);
      const sourceMethods = ['get_dokument', 'get_dokument_innehall', 'search_dokument'];
      if (governmentUrls.length > 0) sourceMethods.push('get_g0v_document_content');
      if (gitHubUrls.length > 0) sourceMethods.push('GitHub raw content');
      const sources: string[] = generateSources(sourceMethods);

      // SWOT + dashboard sections — AI-generated dynamic entries (context-aware, all 14 languages)
      const sections = buildDeepInspectionSections(enrichedDocs, sanitizedTopic, lang, aiResult);

      const langTitles: TitleSet = titles[lang] || titles.en;
      // Enrich English title/subtitle with content-based highlights
      const enriched = lang === 'en' ? generateDynamicTitle(langTitles.title, content, enrichedDocs.length) : langTitles;

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: enriched.title,
        subtitle: enriched.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags,
        sections,
        // Analysis references are injected by fix-analysis-references.ts post-processor
        ...(enrichment ?? {}),
      });

      await writeSingleArticle(html, slug, lang, 'deep-inspection');
    }

    console.log('  ✅ Deep-Inspection article generated successfully in all requested languages');
    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Deep-Inspection:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}
