/**
 * @module data-transformers/content-generators/monthly-review
 * @description Generator for "monthly-review" article content. Renders monthly statistical
 * summaries, party rankings, legislative efficiency metrics, and strategic outlook.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { ArticleContentData, MonthlyMetrics } from '../types.js';
import { generateGenericContent } from './generic.js';

/**
 * Per-language label maps for the monthly-review-specific sections.
 * Covers all 14 supported languages.
 */
const MONTHLY_LABELS: Readonly<{
  monthInNumbers: Record<string, string>;
  partyRankings: Record<string, string>;
  legislativeEfficiency: Record<string, string>;
  strategicOutlook: Record<string, string>;
  totalDocuments: Record<string, string>;
  reports: Record<string, string>;
  propositions: Record<string, string>;
  motions: Record<string, string>;
  speeches: Record<string, string>;
  efficiencyRate: Record<string, string>;
  trendVsPrevMonth: Record<string, string>;
  trendVs2MonthsAgo: Record<string, string>;
  activityRank: Record<string, string>;
  motionsFiled: Record<string, string>;
  speechesDelivered: Record<string, string>;
  coalitionStabilityOutlook: Record<string, string>;
  motionDenialContext: Record<string, string>;
  insufficientData: Record<string, string>;
}> = {
  monthInNumbers: { en: '📊 Month in Numbers', sv: '📊 Månaden i siffror', da: '📊 Måneden i tal', no: '📊 Måneden i tall', fi: '📊 Kuukausi numeroina', de: '📊 Der Monat in Zahlen', fr: '📊 Le mois en chiffres', es: '📊 El mes en cifras', nl: '📊 De maand in cijfers', ar: '📊 الشهر بالأرقام', he: '📊 החודש במספרים', ja: '📊 今月の統計', ko: '📊 이달의 통계', zh: '📊 本月数字' },
  partyRankings: { en: '🏆 Party Performance Rankings', sv: '🏆 Partiernas prestationsrankning', da: '🏆 Partiernes præstationsrangering', no: '🏆 Partienes prestasjonsranking', fi: '🏆 Puolueiden suoritusranking', de: '🏆 Partei-Leistungsranking', fr: '🏆 Classement des performances des partis', es: '🏆 Clasificación de rendimiento de partidos', nl: '🏆 Partijprestaties ranking', ar: '🏆 تصنيف أداء الأحزاب', he: '🏆 דירוג ביצועי מפלגות', ja: '🏆 政党パフォーマンスランキング', ko: '🏆 정당 성과 순위', zh: '🏆 政党绩效排名' },
  legislativeEfficiency: { en: '⚖️ Legislative Efficiency', sv: '⚖️ Lagstiftningseffektivitet', da: '⚖️ Lovgivningseffektivitet', no: '⚖️ Lovgivningseffektivitet', fi: '⚖️ Lainsäädäntötehokkuus', de: '⚖️ Gesetzgebungseffizienz', fr: '⚖️ Efficacité législative', es: '⚖️ Eficiencia legislativa', nl: '⚖️ Wetgevingsefficiëntie', ar: '⚖️ الكفاءة التشريعية', he: '⚖️ יעילות חקיקתית', ja: '⚖️ 立法効率', ko: '⚖️ 입법 효율성', zh: '⚖️ 立法效率' },
  strategicOutlook: { en: '🔭 Strategic Outlook', sv: '🔭 Strategisk utsikt', da: '🔭 Strategisk udsigt', no: '🔭 Strategisk utsikt', fi: '🔭 Strateginen näkymä', de: '🔭 Strategischer Ausblick', fr: '🔭 Perspectives stratégiques', es: '🔭 Perspectiva estratégica', nl: '🔭 Strategisch vooruitzicht', ar: '🔭 التوقعات الاستراتيجية', he: '🔭 סיכוי אסטרטגי', ja: '🔭 戦略的展望', ko: '🔭 전략적 전망', zh: '🔭 战略展望' },
  totalDocuments: { en: 'Total documents', sv: 'Totalt antal dokument', da: 'Dokumenter i alt', no: 'Totalt antall dokumenter', fi: 'Asiakirjoja yhteensä', de: 'Dokumente gesamt', fr: 'Total des documents', es: 'Total de documentos', nl: 'Totaal documenten', ar: 'إجمالي الوثائق', he: 'סך כל המסמכים', ja: '総文書数', ko: '총 문서 수', zh: '文件总数' },
  reports: { en: 'Committee reports', sv: 'Betänkanden', da: 'Betænkninger', no: 'Innstillinger', fi: 'Mietinnöt', de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comité', nl: 'Commissierapporten', ar: 'تقارير اللجان', he: 'דוחות ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告' },
  propositions: { en: 'Government propositions', sv: 'Propositioner', da: 'Lovforslag', no: 'Proposisjoner', fi: 'Hallituksen esitykset', de: 'Regierungsvorlagen', fr: 'Propositions gouvernementales', es: 'Proposiciones gubernamentales', nl: 'Regeringsvoorstellen', ar: 'المقترحات الحكومية', he: 'הצעות ממשלה', ja: '政府提案', ko: '정부 법안', zh: '政府提案' },
  motions: { en: 'Opposition motions', sv: 'Motioner', da: 'Forslag', no: 'Forslag', fi: 'Aloitteet', de: 'Anträge', fr: "Motions de l'opposition", es: 'Mociones de la oposición', nl: 'Oppositiemoties', ar: 'مقترحات المعارضة', he: 'הצעות האופוזיציה', ja: '反対動議', ko: '야당 동의', zh: '反对党动议' },
  speeches: { en: 'Chamber speeches', sv: 'Anföranden', da: 'Taler', no: 'Taler', fi: 'Puheet', de: 'Parlamentsreden', fr: 'Discours parlementaires', es: 'Discursos parlamentarios', nl: 'Parlementaire toespraken', ar: 'الخطب البرلمانية', he: 'נאומי המליאה', ja: '議会演説', ko: '의회 연설', zh: '议会演讲' },
  efficiencyRate: { en: 'Committee reports per proposition', sv: 'Betänkanden per proposition', da: 'Betænkninger per lovforslag', no: 'Innstillinger per proposisjon', fi: 'Mietinnöt per esitys', de: 'Ausschussberichte pro Vorlage', fr: 'Rapports par proposition', es: 'Informes por proposición', nl: 'Commissierapporten per voorstel', ar: 'تقارير اللجان لكل اقتراح', he: 'דוחות ועדה לכל הצעה', ja: '提案当たり委員会報告数', ko: '제안당 위원회 보고서', zh: '每项提案的委员会报告数' },
  trendVsPrevMonth: { en: 'vs. previous month', sv: 'jmf föregående månad', da: 'ift. forrige måned', no: 'vs. forrige måned', fi: 'vs. edellinen kuukausi', de: 'vs. Vormonat', fr: 'vs. mois précédent', es: 'vs. mes anterior', nl: 'vs. vorige maand', ar: 'مقارنة بالشهر السابق', he: 'לעומת החודש הקודם', ja: '前月比', ko: '전월 대비', zh: '对比上个月' },
  trendVs2MonthsAgo: { en: '3-month rolling avg', sv: '3 månaders glidande snitt', da: '3-måneders glidende gennemsnit', no: '3 måneders glidende gjennomsnitt', fi: '3 kuukauden liukuva keskiarvo', de: '3-Monats-Gleitdurchschnitt', fr: 'Moyenne mobile sur 3 mois', es: 'Promedio móvil de 3 meses', nl: '3-maands voortschrijdend gemiddelde', ar: 'متوسط متحرك 3 أشهر', he: 'ממוצע נע 3 חודשים', ja: '3ヶ月移動平均', ko: '3개월 이동 평균', zh: '3个月滚动平均' },
  activityRank: { en: 'Activity rank', sv: 'Aktivitetsrankning', da: 'Aktivitetsrangering', no: 'Aktivitetsrangering', fi: 'Aktiivisuusranking', de: 'Aktivitätsrang', fr: "Rang d'activité", es: 'Rango de actividad', nl: 'Activiteitsrang', ar: 'تصنيف النشاط', he: 'דירוג פעילות', ja: '活動ランク', ko: '활동 순위', zh: '活动排名' },
  motionsFiled: { en: 'motions', sv: 'motioner', da: 'forslag', no: 'forslag', fi: 'aloitetta', de: 'Anträge', fr: 'motions', es: 'mociones', nl: 'moties', ar: 'مقترحات', he: 'הצעות', ja: '動議', ko: '동의', zh: '动议' },
  speechesDelivered: { en: 'speeches', sv: 'anföranden', da: 'taler', no: 'taler', fi: 'puhetta', de: 'Reden', fr: 'discours', es: 'discursos', nl: 'toespraken', ar: 'خطب', he: 'נאומים', ja: '演説', ko: '연설', zh: '演讲' },
  coalitionStabilityOutlook: { en: 'Coalition stability outlook', sv: 'Koalitionsstabilitetsutsikt', da: 'Koalitionsstabilitetsudsigt', no: 'Koalisjonsstabilitetsutsikt', fi: 'Koalitiostabiliteettiarvio', de: 'Koalitionsstabilitätsausblick', fr: 'Perspectives de stabilité de la coalition', es: 'Perspectiva de estabilidad de la coalición', nl: 'Coalitie stabiliteitsoverzicht', ar: 'توقعات استقرار الائتلاف', he: 'תחזית יציבות הקואליציה', ja: '連立安定性の展望', ko: '연립 안정성 전망', zh: '联合政府稳定性展望' },
  motionDenialContext: { en: 'Opposition motions historically pass at a low rate — parliamentary majority dynamics shape legislative outcomes.', sv: 'Oppositionsmotioner har historiskt sett låg bifallsfrekvens — parlamentariska majoritetsförhållanden styr lagstiftningsutfallen.', da: 'Oppositionsforslag har historisk set lav vedtagelsesfrekvens — parlamentariske flertalsdynamikker former lovgivningsresultaterne.', no: 'Opposisjonsforslag har historisk lav vedtaksrate — parlamentariske flertallsdynamikker former lovgivningsutfall.', fi: 'Oppositioaloitteilla on historiallisesti matala hyväksymisaste — parlamentin enemmistödynamiikka muokkaa lainsäädäntötuloksia.', de: 'Oppositionsanträge haben historisch geringe Erfolgsquoten — Mehrheitsverhältnisse im Parlament prägen die Gesetzgebungsergebnisse.', fr: "Les motions de l'opposition ont historiquement un faible taux d'adoption — la dynamique des majorités parlementaires façonne les résultats législatifs.", es: 'Las mociones de la oposición tienen históricamente bajas tasas de aprobación — la dinámica de la mayoría parlamentaria da forma a los resultados legislativos.', nl: 'Oppositiemoties hebben historisch gezien lage doorvoerpercentages — meerderheidsparlementsynamiek bepaalt wetgevingsresultaten.', ar: 'تتمتع مقترحات المعارضة تاريخياً بمعدلات مرور منخفضة — تشكّل ديناميكيات أغلبية البرلمان نتائج التشريع.', he: 'להצעות האופוזיציה יש היסטורית שיעורי מעבר נמוכים — דינמיקת הרוב הפרלמנטרית מעצבת תוצאות חקיקה.', ja: '野党動議は歴史的に低い通過率を持つ — 議会の多数決ダイナミクスが立法結果を形成する。', ko: '야당 동의는 역사적으로 낮은 통과율을 보임 — 의회 다수결 역학이 입법 결과를 형성함.', zh: '反对党动议历史上通过率较低——议会多数动态决定立法结果。' },
  insufficientData: { en: 'Insufficient party activity data for this period.', sv: 'Otillräckliga partiaktivitetsdata för denna period.', da: 'Utilstrækkelige partiaktivitetsdata for denne periode.', no: 'Utilstrekkelige partiaktivitetsdata for denne perioden.', fi: 'Puoluetoimintatiedot ovat riittämättömät tälle ajanjaksolle.', de: 'Unzureichende Parteiak­tivitätsdaten für diesen Zeitraum.', fr: "Données d'activité des partis insuffisantes pour cette période.", es: 'Datos de actividad de partido insuficientes para este período.', nl: 'Onvoldoende partijactiviteitsgegevens voor deze periode.', ar: 'بيانات نشاط الحزب غير كافية لهذه الفترة.', he: 'נתוני פעילות מפלגתית לא מספיקים לתקופה זו.', ja: 'この期間の政党活動データが不十分です。', ko: '이 기간에 대한 정당 활동 데이터가 불충분합니다.', zh: '本期政党活动数据不足。' },
};

/** Return the label for a language key, falling back to English. */
function ml(lang: Language | string, key: keyof typeof MONTHLY_LABELS): string {
  const map = MONTHLY_LABELS[key] as Record<string, string>;
  return map[lang as string] ?? map['en'] ?? key;
}

/**
 * Generate the "Month in Numbers" statistical summary section.
 * Renders document type counts, speech count, and month-over-month trend.
 */
function generateMonthInNumbers(metrics: MonthlyMetrics, lang: Language | string): string {
  const prevDiff = metrics.totalDocuments - metrics.previousMonthDocCount;
  const prevSign = prevDiff > 0 ? '+' : '';
  const availableMonthCounts = [
    metrics.totalDocuments,
    metrics.previousMonthDocCount,
    metrics.twoMonthsAgoDocCount,
  ].filter(count => count > 0);
  const rollingAvg = availableMonthCounts.length > 0
    ? Math.round(availableMonthCounts.reduce((a, b) => a + b, 0) / availableMonthCounts.length)
    : metrics.totalDocuments;

  let html = `\n    <h2>${escapeHtml(ml(lang, 'monthInNumbers'))}</h2>\n`;
  html += `    <div class="context-box">\n      <ul>\n`;
  html += `        <li><strong>${escapeHtml(ml(lang, 'totalDocuments'))}:</strong> ${escapeHtml(String(metrics.totalDocuments))}</li>\n`;
  html += `        <li><strong>${escapeHtml(ml(lang, 'reports'))}:</strong> ${escapeHtml(String(metrics.reportCount))}</li>\n`;
  html += `        <li><strong>${escapeHtml(ml(lang, 'propositions'))}:</strong> ${escapeHtml(String(metrics.propositionCount))}</li>\n`;
  html += `        <li><strong>${escapeHtml(ml(lang, 'motions'))}:</strong> ${escapeHtml(String(metrics.motionCount))}</li>\n`;
  html += `        <li><strong>${escapeHtml(ml(lang, 'speeches'))}:</strong> ${escapeHtml(String(metrics.speechCount))}</li>\n`;
  if (metrics.previousMonthDocCount > 0) {
    html += `        <li><em>${escapeHtml(ml(lang, 'trendVsPrevMonth'))}:</em> ${escapeHtml(prevSign)}${escapeHtml(String(prevDiff))}</li>\n`;
  }
  if (metrics.twoMonthsAgoDocCount > 0 || metrics.previousMonthDocCount > 0) {
    html += `        <li><em>${escapeHtml(ml(lang, 'trendVs2MonthsAgo'))}:</em> ${escapeHtml(String(rollingAvg))}</li>\n`;
  }
  html += `      </ul>\n    </div>\n`;
  return html;
}

/**
 * Generate the "Party Performance Rankings" section.
 * Ranks parties by combined legislative and debate activity.
 */
function generatePartyRankings(metrics: MonthlyMetrics, lang: Language | string): string {
  let html = `\n    <h2>${escapeHtml(ml(lang, 'partyRankings'))}</h2>\n`;

  if (!metrics.partyRankings || metrics.partyRankings.length === 0) {
    html += `    <div class="context-box">\n`;
    html += `      <p>${escapeHtml(ml(lang, 'insufficientData'))}</p>\n`;
    html += `    </div>\n`;
    return html;
  }

  html += `    <div class="context-box">\n      <ol>\n`;
  // Show top 8 parties — matches the 8 Swedish parliamentary parties and keeps the list scannable
  metrics.partyRankings.slice(0, 8).forEach((entry, idx) => {
    const motionLabel = ml(lang, 'motionsFiled');
    const speechLabel = ml(lang, 'speechesDelivered');
    const rankLabel = ml(lang, 'activityRank');
    html += `        <li><strong>${escapeHtml(entry.party)}</strong> — `;
    html += `${escapeHtml(String(entry.motionCount))} ${escapeHtml(motionLabel)}, `;
    html += `${escapeHtml(String(entry.speechCount))} ${escapeHtml(speechLabel)}`;
    if (idx === 0) html += ` (${escapeHtml(rankLabel)} #1)`;
    html += `</li>\n`;
  });
  html += `      </ol>\n    </div>\n`;
  return html;
}

/**
 * Generate the "Legislative Efficiency" metrics section.
 * Shows committee throughput rate and opposition motion context.
 */
function generateLegislativeEfficiency(metrics: MonthlyMetrics, lang: Language | string): string {
  let html = `\n    <h2>${escapeHtml(ml(lang, 'legislativeEfficiency'))}</h2>\n`;
  html += `    <div class="context-box">\n      <ul>\n`;

  if (metrics.propositionCount > 0) {
    const ratio = metrics.legislativeEfficiencyRate.toFixed(2);
    html += `        <li><strong>${escapeHtml(ml(lang, 'efficiencyRate'))}:</strong> ${escapeHtml(ratio)} (${escapeHtml(String(metrics.reportCount))} / ${escapeHtml(String(metrics.propositionCount))})</li>\n`;
  }

  html += `        <li><small>${escapeHtml(ml(lang, 'motionDenialContext'))}</small></li>\n`;
  html += `      </ul>\n    </div>\n`;
  return html;
}

/**
 * Generate the "Strategic Outlook" section.
 * Connects current-month trends to coalition stability and upcoming dynamics.
 */
function generateStrategicOutlook(metrics: MonthlyMetrics, data: ArticleContentData, lang: Language | string): string {
  const cia = data.ciaContext;
  let html = `\n    <h2>${escapeHtml(ml(lang, 'strategicOutlook'))}</h2>\n`;
  html += `    <div class="context-box">\n      <ul>\n`;

  // Activity trajectory based on month-over-month comparison
  if (metrics.previousMonthDocCount > 0) {
    const isIncreasing = metrics.totalDocuments > metrics.previousMonthDocCount;
    const trajectoryTemplates: Record<string, (inc: boolean) => string> = {
      en: inc => inc ? 'Legislative activity is accelerating — document volume is up month-over-month.' : 'Legislative activity is decelerating — document volume is down month-over-month.',
      sv: inc => inc ? 'Riksdagsaktiviteten accelererar — dokumentvolymen ökar månad för månad.' : 'Riksdagsaktiviteten avtar — dokumentvolymen minskar månad för månad.',
      da: inc => inc ? 'Den lovgivende aktivitet accelererer — dokumentmængden stiger måned for måned.' : 'Den lovgivende aktivitet aftager — dokumentmængden falder måned for måned.',
      no: inc => inc ? 'Den lovgivende aktiviteten akselererer — dokumentvolumet øker måned for måned.' : 'Den lovgivende aktiviteten avtar — dokumentvolumet synker måned for måned.',
      fi: inc => inc ? 'Lainsäädäntöaktiivisuus kiihtyy — asiakirjojen määrä kasvaa kuukaudesta toiseen.' : 'Lainsäädäntöaktiivisuus hidastuu — asiakirjojen määrä laskee kuukaudesta toiseen.',
      de: inc => inc ? 'Die Gesetzgebungsaktivität nimmt zu — das Dokumentenvolumen steigt von Monat zu Monat.' : 'Die Gesetzgebungsaktivität nimmt ab — das Dokumentenvolumen sinkt von Monat zu Monat.',
      fr: inc => inc ? "L'activité législative s'accélère — le volume documentaire augmente d'un mois sur l'autre." : "L'activité législative ralentit — le volume documentaire diminue d'un mois sur l'autre.",
      es: inc => inc ? 'La actividad legislativa está acelerando — el volumen de documentos aumenta mes a mes.' : 'La actividad legislativa está desacelerando — el volumen de documentos disminuye mes a mes.',
      nl: inc => inc ? 'De wetgevende activiteit neemt toe — het documentvolume stijgt maand over maand.' : 'De wetgevende activiteit neemt af — het documentvolume daalt maand over maand.',
      ar: inc => inc ? 'النشاط التشريعي يتسارع — حجم الوثائق يزداد شهراً بعد شهر.' : 'النشاط التشريعي يتباطأ — حجم الوثائق يتراجع شهراً بعد شهر.',
      he: inc => inc ? 'הפעילות החקיקתית מתאיצה — נפח המסמכים עולה מחודש לחודש.' : 'הפעילות החקיקתית מואטת — נפח המסמכים יורד מחודש לחודש.',
      ja: inc => inc ? '立法活動が加速しています — 文書量が前月比で増加しています。' : '立法活動が減速しています — 文書量が前月比で減少しています。',
      ko: inc => inc ? '입법 활동이 가속화되고 있습니다 — 문서량이 전월 대비 증가하고 있습니다.' : '입법 활동이 감속되고 있습니다 — 문서량이 전월 대비 감소하고 있습니다.',
      zh: inc => inc ? '立法活动正在加速——文件数量环比增加。' : '立法活动正在减速——文件数量环比减少。',
    };
    const tpl = trajectoryTemplates[lang as string];
    const trajectoryText = tpl ? tpl(isIncreasing) : (trajectoryTemplates['en'] ?? (inc => inc ? 'Legislative activity is accelerating.' : 'Legislative activity is decelerating.'))(isIncreasing);
    html += `        <li>${escapeHtml(trajectoryText)}</li>\n`;
  }

  // Coalition stability signal from CIA context
  if (cia) {
    const stabilityLabel = ml(lang, 'coalitionStabilityOutlook');
    const stabilityScore = cia.coalitionStability.stabilityScore;
    const riskLevel = cia.coalitionStability.riskLevel;
    html += `        <li><strong>${escapeHtml(stabilityLabel)}:</strong> ${escapeHtml(String(stabilityScore))}/100 (${escapeHtml(riskLevel)})</li>\n`;
  }

  html += `      </ul>\n    </div>\n`;
  return html;
}

/**
 * Generate a rich monthly review article with "Month in Numbers", party rankings,
 * legislative efficiency metrics, and a strategic outlook section.
 * Falls back to generic content when monthlyMetrics is absent.
 */
export function generateMonthlyReviewContent(data: ArticleContentData, lang: Language | string): string {
  // Base document analysis (same as weekly review / generic)
  let content = generateGenericContent(data, lang);

  const metrics = data.monthlyMetrics;
  if (!metrics) return content;

  // Append monthly-specific sections
  content += generateMonthInNumbers(metrics, lang);
  content += generatePartyRankings(metrics, lang);
  content += generateLegislativeEfficiency(metrics, lang);
  content += generateStrategicOutlook(metrics, data, lang);

  return content;
}
