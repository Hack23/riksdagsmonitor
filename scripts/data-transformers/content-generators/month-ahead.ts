/**
 * @module data-transformers/content-generators/month-ahead
 * @description Generator for "month-ahead" article content. Extends week-ahead calendar
 * coverage with committee pipeline tracking, propositions in pipeline, and motion trend analysis.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { ArticleContentData, WeekAheadData, RawDocument } from '../types.js';
import {
  svSpan,
  sanitizeUrl,
  getCommitteeName,
  normalizePartyKey,
  formatDocumentDate,
} from '../helpers.js';
import { detectPolicyDomains, generatePolicySignificance } from '../policy-analysis.js';
import { generateWeekAheadContent } from './week-ahead.js';

/**
 * Generate Month-Ahead article content with strategic legislative forecasting.
 * Extends week-ahead calendar coverage with committee pipeline tracking,
 * propositions in pipeline, and motion trend analysis.
 */
export function generateMonthAheadContent(data: ArticleContentData, lang: Language | string): string {
  // Base calendar/event content (handles events + upcoming documents)
  let content = generateWeekAheadContent(data as WeekAheadData, lang);

  const propositions = data.propositions ?? [];
  const reports = data.reports ?? [];
  const motions = data.motions ?? [];

  // ── Strategic Legislative Outlook ────────────────────────────────────────
  if (propositions.length > 0) {
    const outlookLabel = lang === 'sv' ? 'Strategisk lagstiftningsutsikt'
      : lang === 'de' ? 'Strategischer Gesetzgebungsausblick'
      : lang === 'fr' ? 'Perspectives législatives stratégiques'
      : lang === 'es' ? 'Perspectiva legislativa estratégica'
      : lang === 'da' ? 'Strategisk lovgivningsmæssigt udsyn'
      : lang === 'no' ? 'Strategisk lovgivningsmessig utsikt'
      : lang === 'fi' ? 'Strateginen lainsäädäntönäkymä'
      : lang === 'nl' ? 'Strategisch wetgevingsoverzicht'
      : lang === 'ar' ? 'التوقعات التشريعية الاستراتيجية'
      : lang === 'he' ? 'תחזית חקיקתית אסטרטגית'
      : lang === 'ja' ? '戦略的立法見通し'
      : lang === 'ko' ? '전략적 입법 전망'
      : lang === 'zh' ? '战略立法展望'
      : 'Strategic Legislative Outlook';
    content += `\n    <h2>${outlookLabel}</h2>\n`;

    // Lede: how many propositions are in the pipeline
    const propLedeTemplates: Record<string, (n: number) => string> = {
      sv: n => `${n} propositioner befinner sig i den lagstiftande processen denna månad.`,
      da: n => `${n} lovforslag befinder sig i den lovgivningsmæssige proces denne måned.`,
      no: n => `${n} proposisjoner er i den lovgivningsmessige prosessen denne måneden.`,
      fi: n => `${n} hallituksen esitystä on lainsäädäntöprosessissa tässä kuussa.`,
      de: n => `${n} Regierungsvorlagen befinden sich diesen Monat im Gesetzgebungsprozess.`,
      fr: n => `${n} propositions gouvernementales sont en cours de traitement législatif ce mois-ci.`,
      es: n => `${n} proposiciones gubernamentales se encuentran en el proceso legislativo este mes.`,
      nl: n => `${n} regeringsvoorstellen bevinden zich deze maand in het wetgevingsproces.`,
      ar: n => `${n} مقترحات حكومية في المسار التشريعي هذا الشهر.`,
      he: n => `${n} הצעות ממשלה נמצאות בתהליך החקיקתי החודש.`,
      ja: n => `今月は${n}件の政府提案が立法プロセスにあります。`,
      ko: n => `이달 ${n}건의 정부 법안이 입법 프로세스에 있습니다.`,
      zh: n => `本月${n}项政府提案处于立法审议过程中。`,
    };
    const propLedeTpl = propLedeTemplates[lang as string];
    const propLede = propLedeTpl
      ? propLedeTpl(propositions.length)
      : `${propositions.length} government propositions are in the legislative pipeline this month.`;
    content += `    <p class="article-lede">${escapeHtml(propLede)}</p>\n`;

    propositions.slice(0, 8).forEach(prop => {  // 8 propositions: readable summary without overwhelming
      const rec = prop as Record<string, string>;
      const titleText = rec['titel'] || rec['title'] || rec['doktyp'] || 'Proposition';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (rec['titel'] && !rec['title']) ? svSpan(escapedTitle, lang) : escapedTitle;
      const significance = generatePolicySignificance(prop, lang);
      const dokId = rec['dok_id'] ?? rec['id'] ?? '';
      const urlBase = 'https://riksdagen.se/sv/dokument-och-lagar/dokument/';
      const safeUrl = dokId ? sanitizeUrl(`${urlBase}${encodeURIComponent(dokId)}/`) : '';
      content += `    <div class="document-entry">\n`;
      content += `      <h4>${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">` : ''}${titleHtml}${safeUrl ? '</a>' : ''}</h4>\n`;
      const propDateHtml = formatDocumentDate(prop as RawDocument, lang);
      if (propDateHtml) content += `      <p>${propDateHtml}</p>\n`;
      if (significance) {
        content += `      <p class="policy-significance">${escapeHtml(significance)}</p>\n`;
      }
      content += `    </div>\n`;
    });
  }

  // ── Committee Pipeline ────────────────────────────────────────────────────
  if (reports.length > 0) {
    const pipelineLabel = lang === 'sv' ? 'Utskottspipeline'
      : lang === 'de' ? 'Ausschusspipeline'
      : lang === 'fr' ? 'Pipeline des commissions'
      : lang === 'es' ? 'Proceso en comité'
      : lang === 'da' ? 'Udvalgspipeline'
      : lang === 'no' ? 'Komitépipeline'
      : lang === 'fi' ? 'Valiokuntaputkisto'
      : lang === 'nl' ? 'Commissiepijplijn'
      : lang === 'ar' ? 'مسار اللجان'
      : lang === 'he' ? 'צינור הוועדות'
      : lang === 'ja' ? '委員会パイプライン'
      : lang === 'ko' ? '위원회 파이프라인'
      : lang === 'zh' ? '委员会审议流程'
      : 'Committee Pipeline';
    content += `\n    <h2>${pipelineLabel}</h2>\n`;

    // Group reports by committee
    const byCommittee: Record<string, RawDocument[]> = {};
    reports.forEach(r => {
      const rec2 = r as Record<string, string>;
      const key = rec2.organ ?? rec2.committee ?? 'unknown';
      if (!byCommittee[key]) byCommittee[key] = [];
      byCommittee[key].push(r);
    });

    Object.entries(byCommittee).slice(0, 5).forEach(([committeeCode, committeeReports]) => { // up to 5 committees
      const committeeName = getCommitteeName(committeeCode, lang);
      content += `    <h3>${escapeHtml(committeeName)}</h3>\n`;
      committeeReports.slice(0, 3).forEach(report => {  // 3 reports per committee keeps the section scannable
        const rec = report as Record<string, string>;
        const titleText = rec['titel'] || rec['title'] || 'Report';
        const escapedTitle = escapeHtml(titleText);
        const titleHtml = (rec['titel'] && !rec['title']) ? svSpan(escapedTitle, lang) : escapedTitle;
        const dokId = rec['dok_id'] ?? '';
        const urlBase = 'https://riksdagen.se/sv/dokument-och-lagar/dokument/';
        const safeUrl = dokId ? sanitizeUrl(`${urlBase}${encodeURIComponent(dokId)}/`) : '';
        content += `    <div class="document-entry">\n`;
        content += `      <h4>${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">` : ''}${titleHtml}${safeUrl ? '</a>' : ''}</h4>\n`;
        const reportDateHtml = formatDocumentDate(report as RawDocument, lang);
        if (reportDateHtml) content += `      <p>${reportDateHtml}</p>\n`;
        content += `    </div>\n`;
      });
    });
  }

  // ── Policy Trends ─────────────────────────────────────────────────────────
  if (motions.length > 0) {
    const trendsLabel = lang === 'sv' ? 'Politiska trender'
      : lang === 'de' ? 'Politische Trends'
      : lang === 'fr' ? 'Tendances politiques'
      : lang === 'es' ? 'Tendencias políticas'
      : lang === 'da' ? 'Politiske tendenser'
      : lang === 'no' ? 'Politiske trender'
      : lang === 'fi' ? 'Poliittiset trendit'
      : lang === 'nl' ? 'Politieke trends'
      : lang === 'ar' ? 'الاتجاهات السياسية'
      : lang === 'he' ? 'מגמות מדיניות'
      : lang === 'ja' ? '政策トレンド'
      : lang === 'ko' ? '정책 트렌드'
      : lang === 'zh' ? '政策趋势'
      : 'Policy Trends';
    content += `\n    <h2>${trendsLabel}</h2>\n`;

    // Identify active policy domains from motions
    const allTrendDomains = new Set<string>();
    motions.forEach(m => detectPolicyDomains(m, lang).forEach(d => allTrendDomains.add(d)));

    // Party activity breakdown
    const byPartyTrend: Record<string, number> = {};
    motions.forEach(m => {
      const party = normalizePartyKey((m as Record<string, string>).parti);
      byPartyTrend[party] = (byPartyTrend[party] || 0) + 1;
    });

    if (allTrendDomains.size > 0) {
      const domainList = Array.from(allTrendDomains).slice(0, 5).join(', ');  // top 5 domains for readability
      const domainIntroTemplates: Record<string, (d: string, n: number) => string> = {
        sv: (d, n) => `${n} motioner identifierar aktiva policydomäner: ${d}.`,
        da: (d, n) => `${n} motioner identificerer aktive politikdomæner: ${d}.`,
        no: (d, n) => `${n} forslag identifiserer aktive politikkdomener: ${d}.`,
        fi: (d, n) => `${n} aloitetta tunnistaa aktiiviset politiikka-alueet: ${d}.`,
        de: (d, n) => `${n} Anträge identifizieren aktive Politikbereiche: ${d}.`,
        fr: (d, n) => `${n} motions identifient des domaines politiques actifs: ${d}.`,
        es: (d, n) => `${n} mociones identifican áreas de política activas: ${d}.`,
        nl: (d, n) => `${n} moties identificeren actieve beleidsgebieden: ${d}.`,
        ar: (d, n) => `${n} اقتراحات تُحدد مجالات السياسة النشطة: ${d}.`,
        he: (d, n) => `${n} הצעות מזהות תחומי מדיניות פעילים: ${d}.`,
        ja: (d, n) => `${n}件の動議が活発な政策領域を特定しています: ${d}。`,
        ko: (d, n) => `${n}건의 동의가 활발한 정책 분야를 식별합니다: ${d}.`,
        zh: (d, n) => `${n}项动议确定了活跃的政策领域：${d}。`,
      };
      const domTpl = domainIntroTemplates[lang as string];
      const domainIntroRaw = domTpl
        ? domTpl(domainList, motions.length)
        : `${motions.length} motions identify active policy domains: ${domainList}.`;
      const domainIntro = escapeHtml(domainIntroRaw);
      content += `    <p>${domainIntro}</p>\n`;
    }

    // Top parties by motion volume
    const topParties = Object.entries(byPartyTrend)
      .filter(([k]) => k !== 'unknown' && k !== 'other')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);  // 4 parties: covers the typical Swedish governing+major-opposition parties

    if (topParties.length > 0) {
      content += `    <ul>\n`;
      topParties.forEach(([party, count]) => {
        const partyMotionTemplates: Record<string, (p: string, n: number) => string> = {
          sv: (p, n) => `${p}: ${n} motioner inlämnade`,
          da: (p, n) => `${p}: ${n} motioner indgivet`,
          no: (p, n) => `${p}: ${n} forslag innsendt`,
          fi: (p, n) => `${p}: ${n} aloitetta jätetty`,
          de: (p, n) => `${p}: ${n} Anträge eingereicht`,
          fr: (p, n) => `${p}: ${n} motions déposées`,
          es: (p, n) => `${p}: ${n} mociones presentadas`,
          nl: (p, n) => `${p}: ${n} moties ingediend`,
          ar: (p, n) => `${p}: ${n} اقتراحات مقدمة`,
          he: (p, n) => `${p}: ${n} הצעות הוגשו`,
          ja: (p, n) => `${p}: ${n}件の動議を提出`,
          ko: (p, n) => `${p}: ${n}건의 동의 제출`,
          zh: (p, n) => `${p}: ${n}项动议提交`,
        };
        const partyTpl = partyMotionTemplates[lang as string];
        const partyEntry = partyTpl
          ? partyTpl(escapeHtml(party), count)
          : `${escapeHtml(party)}: ${count} motions submitted`;
        content += `      <li>${partyEntry}</li>\n`;
      });
      content += `    </ul>\n`;
    }
  }

  return content;
}
