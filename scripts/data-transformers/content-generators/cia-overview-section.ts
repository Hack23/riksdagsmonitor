/**
 * @module data-transformers/content-generators/cia-overview-section
 * @description Generates a CIA intelligence overview TemplateSection from a
 * loaded {@link CIAContext} object. Renders coalition stability, party
 * performance, and voting alignment data as a pure CSS/HTML section (no
 * runtime JavaScript, no external libraries).
 *
 * Used by weekly-review and monthly-review article generators to add a
 * visual intelligence panel to every article, making CIA data visible to
 * readers without requiring a separate data fetch.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { TemplateSection } from '../../types/article.js';
import type { CIAContext } from '../types.js';

// ---------------------------------------------------------------------------
// Per-language labels (14 languages)
// ---------------------------------------------------------------------------

const SECTION_TITLES: Readonly<Record<string, string>> = {
  en: '🇸🇪 Parliamentary Intelligence Overview',
  sv: '🇸🇪 Parlamentarisk intelligensöversikt',
  da: '🇸🇪 Parlamentarisk efterretningsoversigt',
  no: '🇸🇪 Parlamentarisk etterretningsoversikt',
  fi: '🇸🇪 Parlamentaarinen tiedusteluyleiskatsaus',
  de: '🇸🇪 Parlamentarischer Geheimdienstüberblick',
  fr: '🇸🇪 Aperçu du renseignement parlementaire',
  es: '🇸🇪 Resumen de inteligencia parlamentaria',
  nl: '🇸🇪 Parlementair inlichtingenoverzicht',
  ar: '🇸🇪 نظرة عامة على الاستخبارات البرلمانية',
  he: '🇸🇪 סקירת מודיעין פרלמנטרי',
  ja: '🇸🇪 議会インテリジェンス概要',
  ko: '🇸🇪 의회 정보 개요',
  zh: '🇸🇪 议会情报概述',
};

const COALITION_LABELS: Readonly<Record<string, string>> = {
  en: 'Coalition Stability', sv: 'Koalitionsstabilitet', da: 'Koalitionsstabilitet',
  no: 'Koalisjonsstabilitet', fi: 'Koalitiostabiliteetti', de: 'Koalitionsstabilität',
  fr: 'Stabilité de la coalition', es: 'Estabilidad de coalición', nl: 'Coalitie stabiliteit',
  ar: 'استقرار الائتلاف', he: 'יציבות הקואליציה', ja: '連立安定性', ko: '연립 안정성', zh: '联合政府稳定性',
};

const RISK_LABELS: Readonly<Record<string, string>> = {
  en: 'Risk Level', sv: 'Risknivå', da: 'Risikoniveau', no: 'Risikonivå',
  fi: 'Riskitaso', de: 'Risikoniveau', fr: 'Niveau de risque', es: 'Nivel de riesgo',
  nl: 'Risiconiveau', ar: 'مستوى المخاطر', he: 'רמת סיכון', ja: 'リスクレベル', ko: '위험 수준', zh: '风险级别',
};

const DEFECTION_LABELS: Readonly<Record<string, string>> = {
  en: 'Defection probability', sv: 'Avhoppssannolikhet', da: 'Afhopp sandsynlighed',
  no: 'Avhoppssannsynlighet', fi: 'Luopumistodennäköisyys', de: 'Abtrünnigkeitswahrscheinlichkeit',
  fr: 'Probabilité de défection', es: 'Probabilidad de deserción', nl: 'Uitstapkans',
  ar: 'احتمال الانشقاق', he: 'הסתברות עריקה', ja: '離脱確率', ko: '이탈 확률', zh: '背叛概率',
};

const MAJORITY_LABELS: Readonly<Record<string, string>> = {
  en: 'Majority margin', sv: 'Majoritetsmarginal', da: 'Flertalsmarginal',
  no: 'Flertallsmarginal', fi: 'Enemmistömarginaali', de: 'Mehrheitsvorsprung',
  fr: 'Marge de majorité', es: 'Margen de mayoría', nl: 'Meerderheidsmarge',
  ar: 'هامش الأغلبية', he: 'מרווח הרוב', ja: '過半数マージン', ko: '과반수 마진', zh: '多数票优势',
};

const SEATS_UNIT_LABELS: Readonly<Record<string, string>> = {
  en: 'seats', sv: 'mandat', da: 'mandater', no: 'mandater', fi: 'paikkaa',
  de: 'Sitze', fr: 'sièges', es: 'escaños', nl: 'zetels',
  ar: 'مقعد', he: 'מושבים', ja: '議席', ko: '의석', zh: '席',
};

const PARTY_TABLE_LABELS: Readonly<Record<string, { party: string; seats: string; success: string; cohesion: string; trend: string }>> = {
  en: { party: 'Party', seats: 'Seats', success: 'Success%', cohesion: 'Cohesion', trend: 'Trend' },
  sv: { party: 'Parti', seats: 'Mandat', success: 'Framgång%', cohesion: 'Sammanhållning', trend: 'Trend' },
  da: { party: 'Parti', seats: 'Mandater', success: 'Succes%', cohesion: 'Sammenhæng', trend: 'Trend' },
  no: { party: 'Parti', seats: 'Mandater', success: 'Suksess%', cohesion: 'Samhold', trend: 'Trend' },
  fi: { party: 'Puolue', seats: 'Paikat', success: 'Menestys%', cohesion: 'Yhtenäisyys', trend: 'Trendi' },
  de: { party: 'Partei', seats: 'Sitze', success: 'Erfolg%', cohesion: 'Kohäsion', trend: 'Trend' },
  fr: { party: 'Parti', seats: 'Sièges', success: 'Succès%', cohesion: 'Cohésion', trend: 'Tendance' },
  es: { party: 'Partido', seats: 'Escaños', success: 'Éxito%', cohesion: 'Cohesión', trend: 'Tendencia' },
  nl: { party: 'Partij', seats: 'Zetels', success: 'Succes%', cohesion: 'Cohesie', trend: 'Trend' },
  ar: { party: 'الحزب', seats: 'المقاعد', success: 'نجاح%', cohesion: 'التماسك', trend: 'الاتجاه' },
  he: { party: 'מפלגה', seats: 'מושבים', success: 'הצלחה%', cohesion: 'לכידות', trend: 'מגמה' },
  ja: { party: '政党', seats: '議席', success: '成功率%', cohesion: '結束度', trend: 'トレンド' },
  ko: { party: '정당', seats: '의석', success: '성공률%', cohesion: '결속력', trend: '추세' },
  zh: { party: '政党', seats: '席位', success: '成功率%', cohesion: '凝聚力', trend: '趋势' },
};

const VOTING_ALIGNMENT_LABELS: Readonly<Record<string, { title: string; coalition: string; opposition: string }>> = {
  en: { title: 'Voting Alignment by Issue', coalition: 'Coalition', opposition: 'Opposition' },
  sv: { title: 'Röstningsanpassning per fråga', coalition: 'Koalition', opposition: 'Opposition' },
  da: { title: 'Afstemningsstilling per emne', coalition: 'Koalition', opposition: 'Opposition' },
  no: { title: 'Stemmegivning per sak', coalition: 'Koalisjon', opposition: 'Opposisjon' },
  fi: { title: 'Äänestystasapaino aiheittain', coalition: 'Koalitio', opposition: 'Oppositio' },
  de: { title: 'Abstimmungsausrichtung nach Thema', coalition: 'Koalition', opposition: 'Opposition' },
  fr: { title: 'Alignement de vote par sujet', coalition: 'Coalition', opposition: 'Opposition' },
  es: { title: 'Alineación de voto por tema', coalition: 'Coalición', opposition: 'Oposición' },
  nl: { title: 'Stemuitlijning per onderwerp', coalition: 'Coalitie', opposition: 'Oppositie' },
  ar: { title: 'توافق التصويت حسب المسألة', coalition: 'الائتلاف', opposition: 'المعارضة' },
  he: { title: 'התאמת הצבעות לפי נושא', coalition: 'קואליציה', opposition: 'אופוזיציה' },
  ja: { title: '課題別投票一致率', coalition: '連立', opposition: '野党' },
  ko: { title: '이슈별 투표 정렬', coalition: '연립', opposition: '야당' },
  zh: { title: '按议题的投票一致性', coalition: '联合政府', opposition: '反对党' },
};

const PARTY_PERF_LABELS: Readonly<Record<string, string>> = {
  en: '📊 Party Performance', sv: '📊 Partiernas prestationer', da: '📊 Partiernes præstationer',
  no: '📊 Partienes prestasjoner', fi: '📊 Puolueiden suoritukset', de: '📊 Parteiperformance',
  fr: '📊 Performance des partis', es: '📊 Rendimiento de partidos', nl: '📊 Partijprestaties',
  ar: '📊 أداء الأحزاب', he: '📊 ביצועי המפלגות', ja: '📊 政党パフォーマンス', ko: '📊 정당 성과', zh: '📊 政党绩效',
};

const DATA_SOURCE_NOTES: Readonly<Record<string, string>> = {
  en: 'Source: CIA Platform — Swedish Riksdag intelligence data',
  sv: 'Källa: CIA-plattformen — Riksdagsunderrättelse',
  da: 'Kilde: CIA-platformen — Riksdag efterretningsdata',
  no: 'Kilde: CIA-plattformen — Riksdag etterretningsdata',
  fi: 'Lähde: CIA-alusta — Riksdagin tiedusteludata',
  de: 'Quelle: CIA-Plattform — Schwedischer Riksdag Geheimdienstdaten',
  fr: 'Source: Plateforme CIA — Données de renseignement du Riksdag suédois',
  es: 'Fuente: Plataforma CIA — Datos de inteligencia del Riksdag sueco',
  nl: 'Bron: CIA-platform — Zweedse Riksdag inlichtingendata',
  ar: 'المصدر: منصة CIA — بيانات استخبارات الريكسداغ السويدي',
  he: 'מקור: פלטפורמת CIA — נתוני מודיעין ריקסדאג שוודי',
  ja: '出典: CIAプラットフォーム — スウェーデン議会インテリジェンスデータ',
  ko: '출처: CIA 플랫폼 — 스웨덴 의회 정보 데이터',
  zh: '来源：CIA平台——瑞典议会情报数据',
};

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/** Map riskLevel string to a CSS cyberpunk color */
function riskLevelColor(riskLevel: string): string {
  const lvl = riskLevel.toLowerCase();
  if (lvl === 'low') return '#83cf39';       // green
  if (lvl === 'moderate') return '#ffbe0b';  // yellow
  if (lvl === 'high') return '#ff006e';      // magenta
  if (lvl === 'critical') return '#ff0000';  // red
  return '#a0a0a0';                          // grey fallback
}

/** Map stabilityScore 0-100 to a CSS cyberpunk color */
function stabilityColor(score: number): string {
  if (score >= 75) return '#83cf39';   // green
  if (score >= 50) return '#ffbe0b';   // yellow
  return '#ff006e';                    // magenta/red
}

/** Map supportTrend / activityTrend to an emoji indicator */
function trendIcon(trend: string): string {
  const t = trend.toLowerCase();
  if (t === 'rising' || t === 'increasing') return '↑';
  if (t === 'declining') return '↓';
  return '→';
}

// ---------------------------------------------------------------------------
// Options / public API
// ---------------------------------------------------------------------------

/** Options for {@link generateCiaOverviewSection} */
export interface CiaOverviewSectionOptions {
  /** Pre-loaded CIA context (from loadCIAContext() or test mock) */
  cia: CIAContext;
  /** Target language */
  lang: Language | string;
  /** Custom section title override */
  title?: string;
  /** Optional narrative summary */
  summary?: string;
}

// ---------------------------------------------------------------------------
// Renderer helpers
// ---------------------------------------------------------------------------

function renderCoalitionPanel(cia: CIAContext, lang: Language | string): string {
  const s = cia.coalitionStability;
  const scoreColor = stabilityColor(s.stabilityScore);
  const riskColor  = riskLevelColor(s.riskLevel);
  const coLabel    = COALITION_LABELS[lang as string] ?? COALITION_LABELS.en!;
  const riLabel    = RISK_LABELS[lang as string]      ?? RISK_LABELS.en!;
  const defLabel   = DEFECTION_LABELS[lang as string] ?? DEFECTION_LABELS.en!;
  const majLabel   = MAJORITY_LABELS[lang as string]  ?? MAJORITY_LABELS.en!;
  const seatsUnit  = SEATS_UNIT_LABELS[lang as string] ?? SEATS_UNIT_LABELS.en!;

  return `
<div class="cia-coalition-panel">
  <h3 class="cia-panel-heading" style="color:${escapeHtml(scoreColor)}">${escapeHtml(coLabel)}</h3>
  <div class="cia-coalition-score-row">
    <span class="cia-score-number" style="color:${escapeHtml(scoreColor)}">${escapeHtml(String(s.stabilityScore))}/100</span>
    <span class="cia-risk-badge" style="background:${escapeHtml(riskColor)}20;border:1px solid ${escapeHtml(riskColor)};color:${escapeHtml(riskColor)}">${escapeHtml(s.riskLevel.toUpperCase())}</span>
  </div>
  <div class="cia-stability-bar-wrapper" role="progressbar" aria-valuenow="${escapeHtml(String(s.stabilityScore))}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(coLabel)} ${escapeHtml(String(s.stabilityScore))}/100">
    <div class="cia-stability-bar" style="width:${Math.min(100, Math.max(0, s.stabilityScore))}%;background:${escapeHtml(scoreColor)}"></div>
  </div>
  <dl class="cia-stat-list">
    <dt>${escapeHtml(riLabel)}</dt><dd style="color:${escapeHtml(riskColor)}">${escapeHtml(s.riskLevel)}</dd>
    <dt>${escapeHtml(defLabel)}</dt><dd>${escapeHtml(String(s.defectionProbability))}%</dd>
    <dt>${escapeHtml(majLabel)}</dt><dd>${escapeHtml(String(s.majorityMargin))} ${escapeHtml(seatsUnit)}</dd>
  </dl>
</div>`.trim();
}

function calculateCohesionFallback(motionsSubmitted: number, motionsPassed: number): number {
  if (motionsSubmitted <= 0) return 100;
  const denialRate = (motionsSubmitted - motionsPassed) / motionsSubmitted;
  return Math.round((1 - denialRate) * 100);
}

function renderPartyTable(cia: CIAContext, lang: Language | string): string {
  if (cia.partyPerformance.length === 0) return '';
  const lbl = PARTY_TABLE_LABELS[lang as string] ?? PARTY_TABLE_LABELS.en!;
  const heading = PARTY_PERF_LABELS[lang as string] ?? PARTY_PERF_LABELS.en!;

  // Sort by seats desc
  const sorted = [...cia.partyPerformance].sort((a, b) => b.metrics.seats - a.metrics.seats);

  const rows = sorted.map(p => {
    const icon = trendIcon(p.trends.supportTrend);
    const cohesionVal = p.metrics.cohesionScore
      ?? calculateCohesionFallback(p.metrics.motionsSubmitted, p.metrics.motionsPassed);
    return `<tr>
      <td class="cia-party-id">${escapeHtml(p.id)}</td>
      <td>${escapeHtml(p.partyName)}</td>
      <td class="cia-stat-num">${escapeHtml(String(p.metrics.seats))}</td>
      <td class="cia-stat-num">${escapeHtml(p.metrics.successRate.toFixed(1))}%</td>
      <td class="cia-stat-num">${escapeHtml(String(cohesionVal))}%</td>
      <td class="cia-trend ${escapeHtml(p.trends.supportTrend)}">${icon}</td>
    </tr>`;
  }).join('\n');

  return `
<div class="cia-party-panel">
  <h3 class="cia-panel-heading">${escapeHtml(heading)}</h3>
  <div class="cia-table-scroll">
    <table class="cia-party-table" aria-label="${escapeHtml(heading)}">
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">${escapeHtml(lbl.party)}</th>
          <th scope="col">${escapeHtml(lbl.seats)}</th>
          <th scope="col">${escapeHtml(lbl.success)}</th>
          <th scope="col">${escapeHtml(lbl.cohesion)}</th>
          <th scope="col">${escapeHtml(lbl.trend)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</div>`.trim();
}

function renderVotingAlignment(cia: CIAContext, lang: Language | string): string {
  const issues = cia.votingPatterns.keyIssues;
  if (!issues || issues.length === 0) return '';
  const lbl = VOTING_ALIGNMENT_LABELS[lang as string] ?? VOTING_ALIGNMENT_LABELS.en!;

  const bars = issues.slice(0, 6).map(issue => {
    const coAlignment  = Math.min(100, Math.max(0, issue.coalitionAlignment));
    const oppAlignment = Math.min(100, Math.max(0, issue.oppositionAlignment));
    return `
<div class="cia-alignment-row">
  <span class="cia-alignment-topic">${escapeHtml(issue.topic)}</span>
  <div class="cia-alignment-bars">
    <div class="cia-bar-row" title="${escapeHtml(lbl.coalition)} ${escapeHtml(String(coAlignment))}%">
      <span class="cia-bar-label cia-coalition-label">${escapeHtml(lbl.coalition)}</span>
      <div class="cia-bar-track">
        <div class="cia-bar-fill cia-coalition-fill" style="width:${coAlignment}%"></div>
      </div>
      <span class="cia-bar-pct">${escapeHtml(String(coAlignment))}%</span>
    </div>
    <div class="cia-bar-row" title="${escapeHtml(lbl.opposition)} ${escapeHtml(String(oppAlignment))}%">
      <span class="cia-bar-label cia-opposition-label">${escapeHtml(lbl.opposition)}</span>
      <div class="cia-bar-track">
        <div class="cia-bar-fill cia-opposition-fill" style="width:${oppAlignment}%"></div>
      </div>
      <span class="cia-bar-pct">${escapeHtml(String(oppAlignment))}%</span>
    </div>
  </div>
</div>`.trim();
  }).join('\n');

  return `
<div class="cia-voting-panel">
  <h3 class="cia-panel-heading">${escapeHtml(lbl.title)}</h3>
  <div class="cia-alignment-list" aria-label="${escapeHtml(lbl.title)}">
    ${bars}
  </div>
</div>`.trim();
}

// ---------------------------------------------------------------------------
// Public generator
// ---------------------------------------------------------------------------

/**
 * Generates a rich CIA intelligence overview section from a pre-loaded
 * {@link CIAContext}. Returns a single {@link TemplateSection} with three
 * panels:
 * 1. **Coalition Stability** — stability score, risk level, defection probability
 * 2. **Party Performance** — sortable table: seats, success rate, cohesion, trend
 * 3. **Voting Alignment** — CSS bar charts of coalition vs opposition alignment by issue
 *
 * All HTML is pure CSS/HTML — no runtime JavaScript required.
 *
 * @example
 * ```ts
 * import { loadCIAContext } from '../news-types/weekly-review.js';
 * import { generateCiaOverviewSection } from './content-generators/cia-overview-section.js';
 *
 * const cia = loadCIAContext();
 * const section = generateCiaOverviewSection({ cia, lang: 'en' });
 * const html = generateArticleHTML({ ..., sections: [section] });
 * ```
 */
export function generateCiaOverviewSection(opts: CiaOverviewSectionOptions): TemplateSection {
  const { cia, lang } = opts;
  const titleText = opts.title?.trim() || SECTION_TITLES[lang as string] || SECTION_TITLES.en!;
  const summaryBlock = opts.summary?.trim()
    ? `<p class="cia-section-summary">${escapeHtml(opts.summary.trim())}</p>\n`
    : '';
  const sourceNote = DATA_SOURCE_NOTES[lang as string] ?? DATA_SOURCE_NOTES.en!;

  const coalitionPanel  = renderCoalitionPanel(cia, lang);
  const partyTable      = renderPartyTable(cia, lang);
  const votingAlignment = renderVotingAlignment(cia, lang);

  const html = `
<section class="cia-overview-section" aria-label="${escapeHtml(titleText)}">
  <h2>${escapeHtml(titleText)}</h2>
  ${summaryBlock}
  <div class="cia-panels-grid">
    ${coalitionPanel}
    ${partyTable}
    ${votingAlignment}
  </div>
  <p class="cia-data-source-note">${escapeHtml(sourceNote)}</p>
</section>`.trim();

  return { id: 'cia-overview-section', className: 'cia-overview-section-wrapper', html };
}
