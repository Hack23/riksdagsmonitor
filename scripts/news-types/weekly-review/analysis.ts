/**
 * @module news-types/weekly-review/analysis
 * @description Coalition stress analysis, weekly activity metrics, and content section generators.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import {
  calculateCoalitionRiskIndex,
  detectAnomalousPatterns,
  generateTrendComparison,
} from '../../data-transformers/risk-analysis.js';
import type { CIAContext, RawDocument } from '../../data-transformers.js';
import type { Language } from '../../types/language.js';
import type {
  VotingRecord,
  CoalitionStressResult,
  WeeklyActivityMetrics,
} from './types.js';
import { normalizedCIAContext } from './data-loader.js';

/** Swedish government coalition parties (current Tidö coalition) */
const GOVERNMENT_PARTIES = new Set(['M', 'KD', 'L', 'SD']);

/** Swedish opposition parties */
const OPPOSITION_PARTIES = new Set(['S', 'V', 'MP', 'C']);

/** Allowlist of severity values for anomaly CSS class injection */
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

export function analyzeCoalitionStress(
  votingRecords: VotingRecord[],
  ciaContext: CIAContext,
): CoalitionStressResult {
  const GOV_PARTIES = GOVERNMENT_PARTIES;
  const OPP_PARTIES = OPPOSITION_PARTIES;

  // Group records by vote-point
  const byPoint = new Map<string, VotingRecord[]>();
  for (const record of votingRecords) {
    const key = `${record.bet ?? 'unknown'}-${record.punkt ?? '0'}`;
    if (!byPoint.has(key)) byPoint.set(key, []);
    byPoint.get(key)!.push(record);
  }

  let governmentWins = 0;
  let governmentLosses = 0;
  let crossPartyVotes = 0;
  let defections = 0;

  for (const records of byPoint.values()) {
    const totalYes = records.filter(r => r.rost === 'Ja').length;
    const totalNo  = records.filter(r => r.rost === 'Nej').length;

    const govYes = records.filter(r => GOV_PARTIES.has(r.parti ?? '') && r.rost === 'Ja').length;
    const govNo  = records.filter(r => GOV_PARTIES.has(r.parti ?? '') && r.rost === 'Nej').length;
    const oppYes = records.filter(r => OPP_PARTIES.has(r.parti ?? '') && r.rost === 'Ja').length;
    const oppNo  = records.filter(r => OPP_PARTIES.has(r.parti ?? '') && r.rost === 'Nej').length;

    // Determine government position — skip if the bloc is evenly split (no clear position)
    const govPositionClear = govYes !== govNo;
    const govPosition = govYes > govNo ? 'Ja' : 'Nej';

    // Government wins when its position matches the chamber majority
    if (govPositionClear && totalYes !== totalNo) {
      const governmentWon =
        (govPosition === 'Ja' && totalYes > totalNo) ||
        (govPosition === 'Nej' && totalNo > totalYes);
      if (governmentWon) { governmentWins++; }
      else { governmentLosses++; }
    }

    // Cross-party: opposition aligned with government position (Ja or Nej)
    const oppAlignedWithGov = govPosition === 'Ja' ? oppYes > 0 : oppNo > 0;
    if (govPositionClear && oppAlignedWithGov) crossPartyVotes++;
    // Defection: government bloc members split
    if (govYes > 0 && govNo > 0) defections++;
  }

  const normCtx = normalizedCIAContext(ciaContext);
  return {
    governmentWins,
    governmentLosses,
    crossPartyVotes,
    defections,
    riskIndex: calculateCoalitionRiskIndex(normCtx),
    anomalies: detectAnomalousPatterns(normCtx),
    totalVotes: byPoint.size,
  };
}

/**
 * Calculate current-week activity metrics with CIA trend direction.
 *
 * Returns the count of documents, speeches, and distinct vote-points
 * collected during the current week, together with the CIA trend comparison
 * (30/90/365-day coalition stability trajectory) mapped to a simple
 * increasing/stable/declining direction.
 *
 * NOTE: This is not a prior-week comparison — `activityChange` reflects the
 * CIA coalition-stability trend direction, not a delta against last week.
 *
 * @param documents     - Documents collected this week
 * @param speeches      - Speeches collected this week
 * @param votingRecords - Voting records collected this week (already date-filtered)
 * @param ciaContext    - CIA intelligence context for trend analysis
 */
export function calculateWeeklyActivityMetrics(
  documents: RawDocument[],
  speeches: unknown[],
  votingRecords: VotingRecord[],
  ciaContext: CIAContext,
): WeeklyActivityMetrics {
  const trendComparison = generateTrendComparison(ciaContext);

  const activityChange: WeeklyActivityMetrics['activityChange'] =
    trendComparison.overallDirection === 'IMPROVING'
      ? 'increasing'
      : trendComparison.overallDirection === 'DECLINING' || trendComparison.overallDirection === 'VOLATILE'
      ? 'declining'
      : 'stable';

  // Count distinct vote-points (bet + punkt) to align with coalition analysis semantics
  const uniqueVotePoints = new Set<string>();
  for (const record of votingRecords) {
    if (record.bet && record.punkt) {
      uniqueVotePoints.add(`${record.bet}-${record.punkt}`);
    }
  }
  const currentVotes = uniqueVotePoints.size;

  return {
    currentDocuments: documents.length,
    currentSpeeches: speeches.length,
    currentVotes,
    trendComparison,
    activityChange,
  };
}

/** Coalition Dynamics section labels for all 14 languages */
const COALITION_DYNAMICS_LABELS: Readonly<Record<Language, string>> = {
  en: 'Coalition Dynamics',
  sv: 'Koalitionsdynamik',
  da: 'Koalitionsdynamik',
  no: 'Koalisjonsdynamikk',
  fi: 'Koalitionidynamiikka',
  de: 'Koalitionsdynamik',
  fr: 'Dynamique de coalition',
  es: 'Dinámica de coalición',
  nl: 'Coalitiedynamiek',
  ar: 'ديناميكيات الائتلاف',
  he: 'דינמיקת קואליציה',
  ja: '連立の動向',
  ko: '연립 동향',
  zh: '联合政府动态',
};

/** Risk level labels for all 14 languages */
const RISK_LEVEL_LABELS: Readonly<Record<Language, Record<string, string>>> = {
  en: { LOW: 'Low', MEDIUM: 'Moderate', HIGH: 'High', CRITICAL: 'Critical' },
  sv: { LOW: 'Låg', MEDIUM: 'Måttlig', HIGH: 'Hög', CRITICAL: 'Kritisk' },
  da: { LOW: 'Lav', MEDIUM: 'Moderat', HIGH: 'Høj', CRITICAL: 'Kritisk' },
  no: { LOW: 'Lav', MEDIUM: 'Moderat', HIGH: 'Høy', CRITICAL: 'Kritisk' },
  fi: { LOW: 'Matala', MEDIUM: 'Kohtalainen', HIGH: 'Korkea', CRITICAL: 'Kriittinen' },
  de: { LOW: 'Gering', MEDIUM: 'Moderat', HIGH: 'Hoch', CRITICAL: 'Kritisch' },
  fr: { LOW: 'Faible', MEDIUM: 'Modéré', HIGH: 'Élevé', CRITICAL: 'Critique' },
  es: { LOW: 'Bajo', MEDIUM: 'Moderado', HIGH: 'Alto', CRITICAL: 'Crítico' },
  nl: { LOW: 'Laag', MEDIUM: 'Matig', HIGH: 'Hoog', CRITICAL: 'Kritiek' },
  ar: { LOW: 'منخفض', MEDIUM: 'معتدل', HIGH: 'مرتفع', CRITICAL: 'حرج' },
  he: { LOW: 'נמוך', MEDIUM: 'בינוני', HIGH: 'גבוה', CRITICAL: 'קריטי' },
  ja: { LOW: '低', MEDIUM: '中程度', HIGH: '高', CRITICAL: '危機的' },
  ko: { LOW: '낮음', MEDIUM: '보통', HIGH: '높음', CRITICAL: '위급' },
  zh: { LOW: '低', MEDIUM: '中等', HIGH: '高', CRITICAL: '危急' },
};

/** Coalition Dynamics stats labels for all 14 languages */
const COALITION_STATS_LABELS: Readonly<Record<Language, {
  score: string; level: string; wins: string; losses: string;
  cross: string; defections: string; votes: string;
}>> = {
  en: { score: 'Risk score', level: 'Risk level', wins: 'Government wins', losses: 'Government losses', cross: 'Cross-party votes', defections: 'Internal defections', votes: 'Vote points analysed' },
  sv: { score: 'Riskpoäng', level: 'Risknivå', wins: 'Regeringsvinster', losses: 'Regeringsförluster', cross: 'Partiöverskridande röster', defections: 'Interna avhopp', votes: 'Analyserade röstpunkter' },
  da: { score: 'Risikoscore', level: 'Risikoniveau', wins: 'Regeringsgevinster', losses: 'Regeringstab', cross: 'Tværpartilige stemmer', defections: 'Interne afhopp', votes: 'Analyserede afstemningspunkter' },
  no: { score: 'Risikoscore', level: 'Risikonivå', wins: 'Regjeringsseire', losses: 'Regjeringstap', cross: 'Tverrpartistemmer', defections: 'Interne avhopp', votes: 'Analyserte voteringspunkter' },
  fi: { score: 'Riskipisteet', level: 'Riskitaso', wins: 'Hallituksen voitot', losses: 'Hallituksen tappiot', cross: 'Puoluerajat ylittävät äänet', defections: 'Sisäiset loikkaukset', votes: 'Analysoidut äänestyskohteet' },
  de: { score: 'Risikowert', level: 'Risikoniveau', wins: 'Regierungssiege', losses: 'Regierungsniederlagen', cross: 'Überparteiliche Abstimmungen', defections: 'Interne Abweichungen', votes: 'Analysierte Abstimmungspunkte' },
  fr: { score: 'Score de risque', level: 'Niveau de risque', wins: 'Victoires gouvernementales', losses: 'Défaites gouvernementales', cross: 'Votes transpartisans', defections: 'Défections internes', votes: 'Points de vote analysés' },
  es: { score: 'Puntuación de riesgo', level: 'Nivel de riesgo', wins: 'Victorias gubernamentales', losses: 'Derrotas gubernamentales', cross: 'Votos transversales', defections: 'Defecciones internas', votes: 'Puntos de votación analizados' },
  nl: { score: 'Risicoscore', level: 'Risiconiveau', wins: 'Regeringsoverwinningen', losses: 'Regeringsnederlagen', cross: 'Stemmen over partijgrenzen', defections: 'Interne defecties', votes: 'Geanalyseerde stempunten' },
  ar: { score: 'درجة الخطر', level: 'مستوى الخطر', wins: 'انتصارات الحكومة', losses: 'خسائر الحكومة', cross: 'تصويتات متعددة الأحزاب', defections: 'الانشقاقات الداخلية', votes: 'نقاط التصويت المحللة' },
  he: { score: 'ציון סיכון', level: 'רמת סיכון', wins: 'ניצחונות ממשלתיים', losses: 'הפסדים ממשלתיים', cross: 'הצבעות חוצות-מפלגות', defections: 'עריקות פנימיות', votes: 'נקודות הצבעה שנותחו' },
  ja: { score: 'リスクスコア', level: 'リスクレベル', wins: '政府の勝利', losses: '政府の敗北', cross: '超党派投票', defections: '内部離反', votes: '分析された投票点' },
  ko: { score: '위험 점수', level: '위험 수준', wins: '정부 승리', losses: '정부 패배', cross: '초당파 표결', defections: '내부 이탈', votes: '분석된 표결 항목' },
  zh: { score: '风险评分', level: '风险等级', wins: '政府获胜', losses: '政府失败', cross: '跨党派投票', defections: '内部叛离', votes: '分析的表决点' },
};

/**
 * Generate the "Coalition Dynamics" HTML section for the given language.
 * Shows risk index, government wins/losses, cross-party votes, defections,
 * and any anomaly flags detected this week.
 */
export function generateCoalitionDynamicsSection(
  stress: CoalitionStressResult,
  lang: Language,
): string {
  const heading = COALITION_DYNAMICS_LABELS[lang] ?? COALITION_DYNAMICS_LABELS.en;
  const riskLabels = RISK_LEVEL_LABELS[lang] ?? RISK_LEVEL_LABELS.en;
  const riskLevelLabel = riskLabels[stress.riskIndex.level] ?? stress.riskIndex.level;

  const lbl = COALITION_STATS_LABELS[lang] ?? COALITION_STATS_LABELS.en;

  let html = `\n    <h2>${escapeHtml(heading)}</h2>\n`;
  html += `    <div class="context-box">\n`;
  html += `      <p>${escapeHtml(stress.riskIndex.summary)}</p>\n`;
  html += `      <ul>\n`;
  html += `        <li><strong>${escapeHtml(lbl.score)}:</strong> ${stress.riskIndex.score}/100</li>\n`;
  html += `        <li><strong>${escapeHtml(lbl.level)}:</strong> ${escapeHtml(riskLevelLabel)}</li>\n`;

  if (stress.totalVotes > 0) {
    html += `        <li><strong>${escapeHtml(lbl.votes)}:</strong> ${stress.totalVotes}</li>\n`;
    html += `        <li><strong>${escapeHtml(lbl.wins)}:</strong> ${stress.governmentWins}</li>\n`;
    html += `        <li><strong>${escapeHtml(lbl.losses)}:</strong> ${stress.governmentLosses}</li>\n`;
    if (stress.crossPartyVotes > 0) {
      html += `        <li><strong>${escapeHtml(lbl.cross)}:</strong> ${stress.crossPartyVotes}</li>\n`;
    }
    if (stress.defections > 0) {
      html += `        <li><strong>${escapeHtml(lbl.defections)}:</strong> ${stress.defections}</li>\n`;
    }
  }

  html += `      </ul>\n`;

  if (stress.anomalies.length > 0) {
    html += `      <ul>\n`;
    for (const anomaly of stress.anomalies.slice(0, 3)) {
      const severityRaw = anomaly.severity;
      const severityNormalized = severityRaw.toLowerCase();
      const isValidSeverity = VALID_SEVERITIES.has(severityNormalized);
      if (!isValidSeverity) {
        console.warn(`WeeklyReview: Unexpected anomaly severity '${severityRaw}', falling back to 'low'.`);
      }
      const severityClass = isValidSeverity ? severityNormalized : 'low';
      html += `        <li class="anomaly-flag severity-${severityClass}">${escapeHtml(anomaly.description)}</li>\n`;
    }
    html += `      </ul>\n`;
  }

  html += `    </div>\n`;
  return html;
}

/** Weekly Activity section labels for all 14 languages */
const WEEK_OVER_WEEK_LABELS: Readonly<Record<Language, string>> = {
  en: 'Weekly Activity',
  sv: 'Veckans aktivitet',
  da: 'Ugentlig aktivitet',
  no: 'Ukentlig aktivitet',
  fi: 'Viikon toiminta',
  de: 'Wöchentliche Aktivität',
  fr: 'Activité hebdomadaire',
  es: 'Actividad semanal',
  nl: 'Wekelijkse activiteit',
  ar: 'النشاط الأسبوعي',
  he: 'פעילות שבועית',
  ja: '今週の活動',
  ko: '주간 활동',
  zh: '本周活动',
};

/** Weekly Activity metric labels for all 14 languages */
const WEEKLY_ACTIVITY_LABELS: Readonly<Record<Language, {
  documents: string; speeches: string; votes: string; trend: string;
  direction: string; insights: string; increasing: string; stable: string; declining: string;
}>> = {
  en: { documents: 'Documents', speeches: 'Speeches', votes: 'Votes', trend: 'Stability trend', direction: 'CIA stability trend', insights: 'Trend insights', increasing: 'Improving ↑', stable: 'Stable →', declining: 'Declining ↓' },
  sv: { documents: 'Dokument', speeches: 'Anföranden', votes: 'Voteringar', trend: 'Stabilitetstrend', direction: 'CIA-stabilitetstrend', insights: 'Trendinsikter', increasing: 'Förbättrad ↑', stable: 'Stabilt →', declining: 'Minskande ↓' },
  da: { documents: 'Dokumenter', speeches: 'Taler', votes: 'Afstemninger', trend: 'Stabilitetstrend', direction: 'CIA-stabilitetstrend', insights: 'Trendindsigter', increasing: 'Forbedret ↑', stable: 'Stabilt →', declining: 'Faldende ↓' },
  no: { documents: 'Dokumenter', speeches: 'Taler', votes: 'Voteringer', trend: 'Stabilitetstrend', direction: 'CIA-stabilitetstrend', insights: 'Trendinnsikter', increasing: 'Forbedret ↑', stable: 'Stabilt →', declining: 'Synkende ↓' },
  fi: { documents: 'Asiakirjat', speeches: 'Puheenvuorot', votes: 'Äänestykset', trend: 'Vakaustrendit', direction: 'CIA-vakaustrendi', insights: 'Trendianalyysit', increasing: 'Paraneva ↑', stable: 'Vakaa →', declining: 'Laskeva ↓' },
  de: { documents: 'Dokumente', speeches: 'Reden', votes: 'Abstimmungen', trend: 'Stabilitätstrend', direction: 'CIA-Stabilitätstrend', insights: 'Trendeinblicke', increasing: 'Verbessernd ↑', stable: 'Stabil →', declining: 'Abnehmend ↓' },
  fr: { documents: 'Documents', speeches: 'Discours', votes: 'Votes', trend: 'Tendance de stabilité', direction: 'Tendance stabilité CIA', insights: 'Aperçus des tendances', increasing: 'En amélioration ↑', stable: 'Stable →', declining: 'En baisse ↓' },
  es: { documents: 'Documentos', speeches: 'Discursos', votes: 'Votaciones', trend: 'Tendencia de estabilidad', direction: 'Tendencia estabilidad CIA', insights: 'Perspectivas de tendencia', increasing: 'Mejorando ↑', stable: 'Estable →', declining: 'En descenso ↓' },
  nl: { documents: 'Documenten', speeches: 'Toespraken', votes: 'Stemmingen', trend: 'Stabiliteitstrend', direction: 'CIA-stabiliteitstrend', insights: 'Trendinzichten', increasing: 'Verbeterend ↑', stable: 'Stabiel →', declining: 'Afnemend ↓' },
  ar: { documents: 'وثائق', speeches: 'خطب', votes: 'عمليات التصويت', trend: 'اتجاه الاستقرار', direction: 'اتجاه استقرار CIA', insights: 'رؤى الاتجاه', increasing: 'تحسّن ↑', stable: 'مستقر →', declining: 'متناقص ↓' },
  he: { documents: 'מסמכים', speeches: 'נאומים', votes: 'הצבעות', trend: 'מגמת יציבות', direction: 'מגמת יציבות CIA', insights: 'תובנות מגמה', increasing: 'משתפר ↑', stable: 'יציב →', declining: 'יורד ↓' },
  ja: { documents: '文書', speeches: '演説', votes: '採決', trend: '安定性トレンド', direction: 'CIA安定性トレンド', insights: 'トレンド考察', increasing: '改善中 ↑', stable: '安定 →', declining: '低下中 ↓' },
  ko: { documents: '문서', speeches: '연설', votes: '표결', trend: '안정성 추세', direction: 'CIA 안정성 추세', insights: '추세 인사이트', increasing: '개선 중 ↑', stable: '안정적 →', declining: '감소 중 ↓' },
  zh: { documents: '文件', speeches: '演讲', votes: '表决', trend: '稳定性趋势', direction: 'CIA稳定性趋势', insights: '趋势洞察', increasing: '改善中 ↑', stable: '稳定 →', declining: '下降中 ↓' },
};

/**
 * Generate the "Weekly Activity" HTML section for the given language.
 * Shows current-week activity counts (documents, speeches, vote-points),
 * the CIA coalition-stability trend direction, and trend insights.
 *
 * NOTE: The "direction" field reflects the CIA stability trend (30/90/365-day),
 * not a comparison against last week's counts.
 */
export function generateWeeklyActivitySection(
  metrics: WeeklyActivityMetrics,
  lang: Language,
): string {
  const heading = WEEK_OVER_WEEK_LABELS[lang] ?? WEEK_OVER_WEEK_LABELS.en;

  const lbl = WEEKLY_ACTIVITY_LABELS[lang] ?? WEEKLY_ACTIVITY_LABELS.en;
  const directionText = metrics.activityChange === 'increasing'
    ? lbl.increasing
    : metrics.activityChange === 'declining'
    ? lbl.declining
    : lbl.stable;

  let html = `\n    <h2>${escapeHtml(heading)}</h2>\n`;
  html += `    <div class="context-box">\n`;
  html += `      <ul>\n`;
  html += `        <li><strong>${escapeHtml(lbl.documents)}:</strong> ${metrics.currentDocuments}</li>\n`;
  html += `        <li><strong>${escapeHtml(lbl.speeches)}:</strong> ${metrics.currentSpeeches}</li>\n`;
  if (metrics.currentVotes > 0) {
    html += `        <li><strong>${escapeHtml(lbl.votes)}:</strong> ${metrics.currentVotes}</li>\n`;
  }
  html += `        <li><strong>${escapeHtml(lbl.direction)}:</strong> ${escapeHtml(directionText)}</li>\n`;
  html += `      </ul>\n`;

  if (metrics.trendComparison.insights.length > 0) {
    html += `      <p><strong>${escapeHtml(lbl.insights)}:</strong> ${escapeHtml(metrics.trendComparison.insights[0] ?? '')}</p>\n`;
  }

  html += `    </div>\n`;
  return html;
}

/**
 * Generate Weekly Review article in specified languages
 */
