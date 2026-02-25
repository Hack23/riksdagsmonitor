/**
 * @module data-transformers/content-generators
 * @description Article content generators that transform structured
 * parliamentary data into narrative HTML. Each generator handles a
 * specific article type: week-ahead, committee reports, propositions,
 * motions, and generic (weekly/monthly review, breaking).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../html-utils.js';
import type { Language } from '../types/language.js';
import type { ArticleContentData, WeekAheadData, RawDocument } from './types.js';
import { getPillarTransition } from '../editorial-pillars.js';
import {
  L,
  svSpan,
  sanitizeUrl,
  isHighPriority,
  formatDayName,
  getCommitteeName,
  generateEnhancedSummary,
  normalizePartyKey,
} from './helpers.js';
import { detectPolicyDomains, generatePolicySignificance, generateDeepPolicyAnalysis } from './policy-analysis.js';
import {
  groupMotionsByProposition,
  groupPropositionsByCommittee,
  generateOppositionStrategySection,
  renderMotionEntry,
  generateDocumentIntelligenceAnalysis,
  PROP_TITLE_SUFFIX_REGEX,
} from './document-analysis.js';

/** Per-language title-suffix templates for inverted-pyramid lede construction. */
const TITLE_SUFFIX_TEMPLATES: Readonly<Record<string, (t: string) => string>> = {
  sv: t => ` — inklusive "${t}"`,
  da: t => ` — herunder "${t}"`,
  no: t => ` — inkludert "${t}"`,
  fi: t => ` — mukaan lukien "${t}"`,
  de: t => ` — darunter "${t}"`,
  fr: t => ` — notamment "${t}"`,
  es: t => ` — incluyendo "${t}"`,
  nl: t => ` — inclusief "${t}"`,
  ar: t => ` — بما فيها "${t}"`,
  he: t => ` — כולל "${t}"`,
  ja: t => `、「${t}」を含む`,
  ko: t => `, "${t}" 포함`,
  zh: t => `，包括"${t}"`,
};

export function generateWeekAheadContent(data: WeekAheadData, lang: Language | string): string {
  const { events, highlights, context } = data;
  // Cast to ArticleContentData to access documents field (passed via switch cast)
  const documents = (data as unknown as ArticleContentData).documents ?? [];
  const questions = data.questions ?? [];
  const interpellations = data.interpellations ?? [];

  let content = '';

  // Introduction section
  content += `
    <div class="context-box">
      <h3>${L(lang, 'whyMatters')}</h3>
      <p>${context || L(lang, 'whyMattersDefault')}</p>
    </div>
`;

  // Group events by significance
  const highPriority = events.filter(e => isHighPriority(e));

  if (highPriority.length > 0) {
    content += `\n    <h2>${L(lang, 'keyEvents')}</h2>\n`;

    highPriority.forEach(event => {
      // Derive dayName from event date if not present
      const dayName = event.dayName || (event.datum || event.from || event.start ? formatDayName(new Date(event.datum || event.from || event.start || ''), lang) : '');
      const eventTime = event.time || event.tid || 'Expected';
      const eventTitle = event.title || event.titel || 'Event';

      // Mark Swedish API titles for LLM translation post-processing
      const escapedEventTitle = escapeHtml(eventTitle);
      const titleHtml = (event.titel && !event.title)
        ? svSpan(escapedEventTitle, lang)
        : escapedEventTitle;

      content += `
    <h3>${dayName ? dayName + ' - ' : ''}${titleHtml}</h3>
    <p>${event.description || `${eventTime}: ${event.details || 'Parliamentary session scheduled.'}`}</p>
`;
    });
  }

  // Legislative Pipeline: show upcoming documents when calendar is sparse or empty
  if (documents.length > 0) {
    const sectionLabel = lang === 'sv'
      ? 'Kommande i den lagstiftande processen'
      : lang === 'de' ? 'Bevorstehende legislative Tagesordnung'
      : lang === 'fr' ? 'Agenda législatif à venir'
      : lang === 'es' ? 'Agenda legislativa próxima'
      : lang === 'da' ? 'Kommende lovgivningsmæssig dagsorden'
      : lang === 'no' ? 'Kommende lovgivningsmessig agenda'
      : lang === 'fi' ? 'Tuleva lainsäädäntöohjelma'
      : lang === 'nl' ? 'Komende wetgevende agenda'
      : lang === 'ar' ? 'جدول الأعمال التشريعي القادم'
      : lang === 'he' ? 'סדר היום החקיקתי הקרוב'
      : lang === 'ja' ? '今後の立法スケジュール'
      : lang === 'ko' ? '향후 입법 일정'
      : lang === 'zh' ? '未来立法议程'
      : 'Upcoming Legislative Agenda';

    content += `\n    <h2>${sectionLabel}</h2>\n`;

    // Show top documents — prioritise propositions and committee reports
    const priorityDocs = [
      ...documents.filter(d => (d as Record<string, string>).doktyp === 'prop' || (d as Record<string, string>).doktyp === 'proposition'),
      ...documents.filter(d => (d as Record<string, string>).doktyp === 'bet' || (d as Record<string, string>).doktyp === 'betankande'),
      ...documents.filter(d => {
        const t = (d as Record<string, string>).doktyp;
        return t !== 'prop' && t !== 'proposition' && t !== 'bet' && t !== 'betankande';
      }),
    ].slice(0, 15);

    priorityDocs.forEach(doc => {
      const rec = doc as Record<string, string>;
      const titleText = rec['titel'] || rec['title'] || rec['doktyp'] || 'Document';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (rec['titel'] && !rec['title'])
        ? svSpan(escapedTitle, lang)
        : escapedTitle;

      const significance = generatePolicySignificance(doc, lang);
      const dokId = rec['dok_id'] ?? rec['id'] ?? '';
      const urlBase = 'https://riksdagen.se/sv/dokument-och-lagar/dokument/';
      const safeUrl = dokId ? sanitizeUrl(`${urlBase}${encodeURIComponent(dokId)}/`) : '';

      content += `\n    <div class="document-entry">\n`;
      content += `      <h4>${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">` : ''}${titleHtml}${safeUrl ? '</a>' : ''}</h4>\n`;
      if (significance) {
        content += `      <p class="policy-significance">${escapeHtml(significance)}</p>\n`;
      }
      content += `    </div>\n`;
    });
  }

  // Parliamentary Questions: upcoming written questions to ministers
  if (questions.length > 0) {
    const questionsLabel = lang === 'sv' ? 'Skriftliga frågor till statsråd'
      : lang === 'de' ? 'Schriftliche parlamentarische Anfragen'
      : lang === 'fr' ? 'Questions écrites au gouvernement'
      : lang === 'es' ? 'Preguntas escritas al gobierno'
      : lang === 'da' ? 'Skriftlige spørgsmål til ministrene'
      : lang === 'no' ? 'Skriftlige spørsmål til statsrådene'
      : lang === 'fi' ? 'Kirjalliset kysymykset ministerille'
      : lang === 'nl' ? 'Schriftelijke vragen aan ministers'
      : lang === 'ar' ? 'أسئلة مكتوبة للحكومة'
      : lang === 'he' ? 'שאלות כתובות לממשלה'
      : lang === 'ja' ? '大臣への書面質問'
      : lang === 'ko' ? '장관에 대한 서면 질문'
      : lang === 'zh' ? '书面质询政府'
      : 'Parliamentary Questions to Ministers';
    content += `\n    <h2>${questionsLabel}</h2>\n`;
    questions.slice(0, 8).forEach(q => {
      const rec = q as Record<string, string>;
      const titleText = rec['titel'] || rec['title'] || 'Question';
      const party = rec['parti'] ? ` (${escapeHtml(rec['parti'])})` : '';
      const dok_id = rec['dok_id'] ?? '';
      const qUrl = dok_id ? sanitizeUrl(`https://riksdagen.se/sv/dokument-och-lagar/dokument/${encodeURIComponent(dok_id)}/`) : '';
      content += `    <div class="document-entry">\n`;
      content += `      <h4>${qUrl ? `<a href="${qUrl}" target="_blank" rel="noopener noreferrer">` : ''}${svSpan(escapeHtml(titleText), lang)}${qUrl ? '</a>' : ''}</h4>\n`;
      if (party) content += `      <p class="policy-significance">${escapeHtml(party)}</p>\n`;
      content += `    </div>\n`;
    });
  }

  // Interpellations: formal parliamentary interpellations awaiting ministerial response
  if (interpellations.length > 0) {
    const interLabel = lang === 'sv' ? 'Interpellationer under behandling'
      : lang === 'de' ? 'Interpellationen in Bearbeitung'
      : lang === 'fr' ? 'Interpellations en cours'
      : lang === 'es' ? 'Interpelaciones en curso'
      : lang === 'da' ? 'Forespørgsler til behandling'
      : lang === 'no' ? 'Interpellasjoner til behandling'
      : lang === 'fi' ? 'Käsittelyssä olevat välikysymykset'
      : lang === 'nl' ? 'Interpellaties in behandeling'
      : lang === 'ar' ? 'الاستجوابات البرلمانية قيد المعالجة'
      : lang === 'he' ? 'בקשות הבהרה בטיפול'
      : lang === 'ja' ? '処理中の質問主意書'
      : lang === 'ko' ? '처리 중인 대정부 질문'
      : lang === 'zh' ? '待处理的质询'
      : 'Interpellations Pending';
    content += `\n    <h2>${interLabel}</h2>\n`;
    interpellations.slice(0, 8).forEach(interp => {
      const rec = interp as Record<string, string>;
      const titleText = rec['titel'] || rec['title'] || 'Interpellation';
      const party = rec['parti'] ? ` (${escapeHtml(rec['parti'])})` : '';
      const dok_id = rec['dok_id'] ?? '';
      const iUrl = dok_id ? sanitizeUrl(`https://riksdagen.se/sv/dokument-och-lagar/dokument/${encodeURIComponent(dok_id)}/`) : '';
      // Extract clean summary: content starts after "till MINISTER\n" line
      const rawSummary = rec['summary'] ?? '';
      // Find start of actual content after the header lines (Interpellation NNN / av AUTHOR / till MINISTER)
      const tillMatch = rawSummary.match(/\btill\s+[^\n]+\n\s*/i);
      const contentStart = tillMatch
        ? rawSummary.indexOf(tillMatch[0]) + tillMatch[0].length
        : rawSummary.replace(/^Interpellation\s+\S+[^\n]*\n\s*/i, '').replace(/^\s*av\s+[^\n]+\n\s*/i, '').length === rawSummary.length
          ? 0
          : 0;
      const cleanedSummary = (tillMatch ? rawSummary.slice(contentStart) : rawSummary
        .replace(/^Interpellation\s+\S+[^\n]*\n\s*/i, '')
        .replace(/^\s*av\s+[^\n]+\n\s*/i, '')
        .replace(/^\s*till\s+[^\n]+\n\s*/i, ''))
        .trim()
        .slice(0, 200);
      content += `    <div class="document-entry">\n`;
      content += `      <h4>${iUrl ? `<a href="${iUrl}" target="_blank" rel="noopener noreferrer">` : ''}${svSpan(escapeHtml(titleText), lang)}${iUrl ? '</a>' : ''}</h4>\n`;
      if (party) content += `      <p class="policy-significance">${escapeHtml(party)}</p>\n`;
      if (cleanedSummary) content += `      <p>${svSpan(escapeHtml(cleanedSummary) + '…', lang)}</p>\n`;
      content += `    </div>\n`;
    });
  }

  // Additional context
  if (highlights && highlights.length > 0) {
    content += `\n    <h2>${L(lang, 'whatToWatch')}</h2>\n    <ul>\n`;

    highlights.forEach(highlight => {
      content += `      <li><strong>${highlight.title}:</strong> ${highlight.description}</li>\n`;
    });

    content += '    </ul>\n';
  }

  return content;
}

export function generateCommitteeContent(data: ArticleContentData, lang: Language | string): string {
  const reports = data.reports || [];

  let content = `<h2>${L(lang, 'latestReports')}</h2>\n`;

  if (reports.length === 0) {
    content += `<p>${L(lang, 'noReports')}</p>\n`;
    return content;
  }

  // Group reports by committee for thematic coherence
  const byCommittee: Record<string, RawDocument[]> = {};
  reports.forEach(report => {
    const committee = report.organ || report.committee || 'unknown';
    if (!byCommittee[committee]) byCommittee[committee] = [];
    byCommittee[committee].push(report);
  });

  const committeeCount = Object.keys(byCommittee).length;

  // Analytical lede: contextual overview of committee activity
  const breakdown = L(lang, 'committeeBreakdown') as string | ((n: number, c: number) => string);
  const breakdownText = typeof breakdown === 'function'
    ? breakdown(reports.length, committeeCount)
    : `${reports.length} committee reports across ${committeeCount} committees.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Thematic analysis section header
  content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;

  // Generate content for each committee group with analysis
  Object.entries(byCommittee).forEach(([committeeCode, committeeReports]) => {
    const committeeName = getCommitteeName(committeeCode, lang);

    // Committee section header
    content += `\n    <h3>${escapeHtml(committeeName)}</h3>\n`;

    // Add committee context: how many reports from this committee
    if (committeeReports.length > 1) {
      const countContextFn = L(lang, 'committeeCountContext') as string | ((n: number) => string);
      const countContext = typeof countContextFn === 'function'
        ? countContextFn(committeeReports.length)
        : `${committeeReports.length} reports from this committee signal intensive legislative work within its portfolio.`;
      content += `    <p><em>${escapeHtml(String(countContext))}</em></p>\n`;
    }

    committeeReports.forEach(report => {
      const titleText = report.titel || report.title || '';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (report.titel && !report.title)
        ? svSpan(escapedTitle, lang)
        : escapedTitle;
      const docName = escapeHtml(report.dokumentnamn || report.dok_id || titleText);

      // Use enriched summary or enhanced summary from metadata
      const summaryText = generateEnhancedSummary(report, 'report', lang);
      const isFromAPI = report.summary || report.notis;
      const reportDefaultVal = L(lang, 'reportDefault');
      const summaryHtml = (report.titel && !report.title && isFromAPI && summaryText !== reportDefaultVal)
        ? svSpan(escapeHtml(summaryText), lang)
        : escapeHtml(summaryText);

      const reportSigVal = L(lang, 'reportSignificance');
      const readFullVal = L(lang, 'readFullReport');
      const whatThisMeansVal = L(lang, 'whatThisMeans');

      content += `
    <div class="report-entry">
      <h4>${titleHtml}</h4>
      <p><strong>${L(lang, 'committee')}:</strong> ${escapeHtml(committeeName)}</p>
      <p>${escapeHtml(String(reportSigVal))} ${summaryHtml}</p>
      <p><strong>${escapeHtml(String(whatThisMeansVal))}:</strong> ${generateDeepPolicyAnalysis(report, lang, 'bet')}</p>
      <p><a href="${sanitizeUrl(report.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
    </div>
`;
    });
  });

  // Narrative bridge from legislative content to analytical outlook (inter-pillar transition)
  const pulseTransition = getPillarTransition(lang, 'pulseToWatch');
  if (pulseTransition) {
    content += `    <p class="pillar-transition">${escapeHtml(pulseTransition)}</p>\n`;
  }

  // Key takeaways section
  content += `\n    <h2>${L(lang, 'keyTakeaways')}</h2>\n`;
  content += `    <div class="context-box">\n      <ul>\n`;

  // Generate analytical takeaways based on committees covered
  const committeeNames = Object.keys(byCommittee).map(c => getCommitteeName(c, lang));
  const activityFn = L(lang, 'committeeActivityTakeaway') as string | ((committees: string, extra: number) => string);
  const takeaway1 = typeof activityFn === 'function'
    ? activityFn(committeeNames.slice(0, 3).join(', '), committeeCount > 3 ? committeeCount - 3 : 0)
    : `Parliamentary committees have been active across ${committeeNames.slice(0, 3).join(', ')}.`;
  const momentumFn = L(lang, 'committeeMomentumTakeaway') as string | ((n: number) => string);
  const takeaway2 = typeof momentumFn === 'function'
    ? momentumFn(reports.length)
    : `A total of ${reports.length} reports demonstrates sustained legislative momentum.`;

  content += `        <li>${escapeHtml(takeaway1)}</li>\n`;
  content += `        <li>${escapeHtml(takeaway2)}</li>\n`;

  // Cross-committee domain analysis: identify which policy areas span multiple committees
  const allDomains = new Set<string>();
  reports.forEach(r => { detectPolicyDomains(r, lang).forEach(d => allDomains.add(d)); });
  if (allDomains.size > 0) {
    const domainList = Array.from(allDomains).slice(0, 3).join(', ');
    const crossAnalysisTemplates: Record<string, (d: string) => string> = {
      sv: (d) => `Betänkandena berör ${d} – ett mönster som tyder på breda lagstiftningsprioriteringar denna session.`,
      da: (d) => `Betænkningerne berører ${d} — et mønster, der signalerer brede lovgivningsprioriteringer.`,
      no: (d) => `Innstillingene berører ${d} — et mønster som signaliserer brede lovgivningsprioriteringer.`,
      fi: (d) => `Mietinnöt kattavat ${d} — laaja-alainen malli, joka osoittaa hallituksen lainsäädäntöprioriteetit.`,
      de: (d) => `Die Berichte betreffen ${d} — ein Muster, das die breiten Gesetzgebungsprioritäten signalisiert.`,
      fr: (d) => `Les rapports couvrent ${d} — un schéma indiquant les larges priorités législatives.`,
      es: (d) => `Los informes abarcan ${d} — un patrón que indica las amplias prioridades legislativas.`,
      nl: (d) => `De rapporten bestrijken ${d} — een patroon dat de brede wetgevende prioriteiten signaleert.`,
      ar: (d) => `تغطي التقارير ${d} — نمط يشير إلى أولويات تشريعية واسعة.`,
      he: (d) => `הדוחות מקיפים ${d} — תבנית המסמנת סדרי עדיפויות חקיקתיים רחבים.`,
      ja: (d) => `報告書は${d}に及び、幅広い立法優先事項を示しています。`,
      ko: (d) => `보고서는 ${d}에 걸쳐 있으며, 광범위한 입법 우선순위를 나타냅니다.`,
      zh: (d) => `报告涉及${d}——显示出广泛的立法优先事项。`,
    };
    const crossTpl = crossAnalysisTemplates[lang as string];
    const crossAnalysis = crossTpl
      ? crossTpl(escapeHtml(domainList))
      : `Reports span ${escapeHtml(domainList)} — a cross-committee pattern signalling the government's broad legislative priorities this session.`;
    content += `        <li>${crossAnalysis}</li>\n`;
  }

  content += `      </ul>\n    </div>\n`;

  return content;
}

export function generatePropositionsContent(data: ArticleContentData, lang: Language | string): string {
  const propositions = data.propositions || [];

  let content = `<h2>${L(lang, 'govProps')}</h2>\n`;

  if (propositions.length === 0) {
    content += `<p>${L(lang, 'noProps')}</p>\n`;
    return content;
  }

  // Analytical lede paragraph
  const breakdownFn = L(lang, 'propsBreakdown') as string | ((n: number) => string);
  const breakdownText = typeof breakdownFn === 'function'
    ? breakdownFn(propositions.length)
    : `${propositions.length} new government propositions submitted.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Legislative pipeline section
  content += `\n    <h2>${L(lang, 'legislativePipeline')}</h2>\n`;

  // Group propositions by committee; multi-committee → h3 committee + h4 prop, single → h3 prop
  const byCommitteeGroup = groupPropositionsByCommittee(propositions);
  const multiCommittee = byCommitteeGroup.size > 1;

  byCommitteeGroup.forEach((committeeProps, committeeKey) => {
    if (multiCommittee) {
      const committeeLabel = committeeKey
        ? escapeHtml(getCommitteeName(committeeKey, lang))
        : escapeHtml(String(L(lang, 'otherCommittee')));
      content += `    <h3>${committeeLabel}</h3>\n`;
    }
    const headingTag = multiCommittee ? 'h4' : 'h3';

    committeeProps.forEach(prop => {
      const titleText = prop.titel || prop.title || '';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (prop.titel && !prop.title)
        ? svSpan(escapedTitle, lang)
        : escapedTitle;
      const docName = escapeHtml(prop.dokumentnamn || prop.dok_id || titleText);

      // Use enhanced summary based on metadata
      const summaryText = generateEnhancedSummary(prop, 'proposition', lang);
      const isFromAPI = prop.summary || prop.notis;
      const propDefaultVal = L(lang, 'propDefault');
      const summaryHtml = (prop.titel && !prop.title && isFromAPI && summaryText !== propDefaultVal)
        ? svSpan(escapeHtml(summaryText), lang)
        : escapeHtml(summaryText);

      // Show "Referred to" inline only in single-committee view (committee heading covers it otherwise)
      const referredCommittee = prop.organ || prop.committee;
      const referredLine = (!multiCommittee && referredCommittee)
        ? `<br><strong>${L(lang, 'referredTo')}:</strong> ${escapeHtml(getCommitteeName(referredCommittee, lang))}`
        : '';

      const propSigVal = L(lang, 'propSignificance');
      const readFullVal = L(lang, 'readFullProp');
      const whyItMattersVal = L(lang, 'whyItMatters');

      content += `
    <div class="proposition-entry">
      <${headingTag}>${titleHtml}</${headingTag}>
      <p>${escapeHtml(String(propSigVal))} ${summaryHtml}${referredLine}</p>
      <p><strong>${escapeHtml(String(whyItMattersVal))}:</strong> ${generateDeepPolicyAnalysis(prop, lang, 'prop')}</p>
      <p><a href="${sanitizeUrl(prop.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
    </div>
`;
    });
  });

  // Policy implications section
  content += `\n    <h2>${L(lang, 'policyImplications')}</h2>\n`;
  content += `    <div class="context-box">\n`;

  // Count unique policy domains across all propositions for accurate "N policy domains" text
  const allPropDomains = new Set<string>();
  propositions.forEach(p => detectPolicyDomains(p, lang).forEach(d => allPropDomains.add(d)));
  const domainCount = allPropDomains.size;

  // Group by referred committee for government priority signal (separate from domain count)
  const byCommittee: Record<string, number> = {};
  propositions.forEach(p => {
    const c = p.organ || p.committee || 'unknown';
    byCommittee[c] = (byCommittee[c] || 0) + 1;
  });

  const implicationFn = L(lang, 'policyImplicationsContext') as string | ((propCount: number, domainCount: number) => string);
  const implication = typeof implicationFn === 'function'
    ? implicationFn(propositions.length, domainCount)
    : `These ${propositions.length} propositions touch on ${domainCount} policy domains.`;
  content += `      <p>${escapeHtml(String(implication))}</p>\n`;

  // Government priority signal: identify the committee receiving the most propositions
  const sortedCommittees = Object.entries(byCommittee)
    .filter(([c]) => c !== 'unknown')
    .sort(([, a], [, b]) => b - a);
  if (sortedCommittees.length > 0) {
    const [topCommittee, topCount] = sortedCommittees[0];
    const topName = getCommitteeName(topCommittee, lang);
    const priorityTemplates: Record<string, (n: string, c: number) => string> = {
      sv: (n, c) => `${n} tar emot ${c} av propositionerna – ett tecken på att detta är ett centralt prioriterat område för regeringen denna session.`,
      da: (n, c) => `${n} modtager ${c} af lovforslagene — et klart signal om regeringsprioritet.`,
      no: (n, c) => `${n} mottar ${c} av proposisjonene — et sterkt signal om regjeringsprioritet.`,
      fi: (n, c) => `${n} vastaanottaa ${c} esityksistä — vahva merkki hallituksen painopistealueesta.`,
      de: (n, c) => `${n} erhält ${c} der Vorlagen — ein starkes Signal für die Regierungspriorität in diesem Bereich.`,
      fr: (n, c) => `${n} reçoit ${c} des propositions — un signal fort de priorité gouvernementale.`,
      es: (n, c) => `${n} recibe ${c} de las proposiciones — una señal clara de prioridad gubernamental.`,
      nl: (n, c) => `${n} ontvangt ${c} van de voorstellen — een sterk signaal van overheidsprioriteit.`,
      ar: (n, c) => `${n} يستقبل ${c} من المقترحات — إشارة قوية لأولوية حكومية.`,
      he: (n, c) => `${n} מקבל ${c} מההצעות — אות חזק לעדיפות ממשלתית.`,
      ja: (n, c) => `${n}は${c}件の提案を受け取り、政府の重点分野であることを示しています。`,
      ko: (n, c) => `${n}이(가) ${c}건의 법안을 받아 정부 우선순위를 강하게 나타냅니다.`,
      zh: (n, c) => `${n}收到${c}项提案——强烈表明这是政府本期的优先领域。`,
    };
    const priorityTpl = priorityTemplates[lang as string];
    const priorityNote = priorityTpl
      ? priorityTpl(escapeHtml(topName), topCount)
      : `${escapeHtml(topName)} receives ${topCount} of the propositions — a strong signal of government priority in this policy area this session.`;
    content += `      <p>${priorityNote}</p>\n`;
  }

  content += `    </div>\n`;

  return content;
}

export function generateMotionsContent(data: ArticleContentData, lang: Language | string): string {
  const motions = data.motions || [];

  let content = `<h2>${L(lang, 'oppMotions')}</h2>\n`;

  if (motions.length === 0) {
    content += `<p>${L(lang, 'noMotions')}</p>\n`;
    return content;
  }

  // Analytical lede paragraph
  const breakdownFn = L(lang, 'motionsBreakdown') as string | ((n: number) => string);
  const breakdownText = typeof breakdownFn === 'function'
    ? breakdownFn(motions.length)
    : `${motions.length} new opposition motions filed.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Group motions by party for strategic analysis
  const byParty: Record<string, RawDocument[]> = {};
  motions.forEach(motion => {
    const party = normalizePartyKey(motion.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(motion);
  });

  // Opposition strategy section with per-party analysis
  const partyCount = Object.keys(byParty).filter(p => p !== 'other').length;
  if (partyCount > 1) {
    content += `\n    <h2>${L(lang, 'oppositionStrategy')}</h2>\n`;
    const strategyFn = L(lang, 'oppositionStrategyContext') as string | ((n: number) => string);
    const strategyContext = typeof strategyFn === 'function'
      ? strategyFn(partyCount)
      : `Motions from ${partyCount} different parties reveal the breadth of opposition political criticism and alternative policy agendas.`;
    content += `    <p>${escapeHtml(String(strategyContext))}</p>\n`;
    // Per-party analysis with domain focus
    content += generateOppositionStrategySection(motions, lang);
  }

  // Group "med anledning av prop." motions by parent proposition to eliminate duplicate headings
  const { grouped: groupedByProp, independent: independentMotions } = groupMotionsByProposition(motions);

  if (groupedByProp.size > 0) {
    content += `\n    <h2>${L(lang, 'responsesToProp')}</h2>\n`;
    groupedByProp.forEach((propMotions, propRef) => {
      // Extract the descriptive title portion that follows the prop ID
      const firstTitle = propMotions[0]?.titel || propMotions[0]?.title || '';
      const suffixMatch = firstTitle.match(PROP_TITLE_SUFFIX_REGEX);
      const propTitle = suffixMatch?.[1]?.trim() || String(propRef);
      const safePropRef = escapeHtml(String(propRef));
      const safePropTitle = escapeHtml(propTitle);
      content += `    <h3>Prop. ${safePropRef}: ${svSpan(safePropTitle, lang)}</h3>\n`;
      // Individual motions inside a prop group use h4 to maintain h2→h3→h4 hierarchy
      propMotions.forEach(m => {
        const html = renderMotionEntry(m, lang);
        content += html.replace(/<h3(\b[^>]*)?>/g, '<h4$1>').replace(/<\/h3>/g, '</h4>');
      });
    });
  }

  // Motions to render with thematic analysis:
  // - when proposition groups exist: only independent motions (non-"med anledning av")
  // - when no proposition groups: all motions (preserves existing thematic behaviour)
  const thematicMotions = groupedByProp.size > 0 ? independentMotions : motions;

  if (thematicMotions.length > 0) {
    if (groupedByProp.size > 0) {
      content += `\n    <h2>${L(lang, 'independentMotions')}</h2>\n`;
    }

    // Group motions by primary policy theme for thematic analysis
    const byTheme: Record<string, RawDocument[]> = {};
    thematicMotions.forEach(motion => {
      const domains = detectPolicyDomains(motion, lang);
      const theme = domains[0] || String(L(lang, 'generalMatters'));
      if (!byTheme[theme]) byTheme[theme] = [];
      byTheme[theme].push(motion);
    });
    const themeCount = Object.keys(byTheme).length;

    if (themeCount > 1 && groupedByProp.size === 0) {
      // Suppress "Thematic Analysis" h2 when already under an "Independent Motions" h2
      // (groupedByProp.size === 0 means we are NOT in the split-section layout, so it is
      // safe to emit the additional h2 without creating two consecutive section headers)
      content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;
      Object.entries(byTheme).forEach(([theme, themeMotions]) => {
        content += `\n    <h3>${escapeHtml(theme)} (${themeMotions.length})</h3>\n`;
        themeMotions.forEach(motion => {
          // Demote motion entry headings one level when inside a themed section
          const entryHtml = renderMotionEntry(motion, lang);
          const demotedHtml = entryHtml
            .replace(/<h3(\b[^>]*)?>/g, '<h4$1>')
            .replace(/<\/h3>/g, '</h4>');
          content += demotedHtml;
        });
      });
    } else {
      // Single theme, no detection, or alongside proposition groups: flat list
      thematicMotions.forEach(motion => { content += renderMotionEntry(motion, lang); });
    }
  }

  // Party activity breakdown
  if (partyCount > 0) {
    // Narrative bridge before cross-party analysis (inter-pillar transition)
    const watchTransition = getPillarTransition(lang, 'watchToOpposition');
    if (watchTransition) {
      content += `    <p class="pillar-transition">${escapeHtml(watchTransition)}</p>\n`;
    }
    content += `\n    <h2>${L(lang, 'coalitionDynamics')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    Object.entries(byParty).forEach(([party, partyMotions]) => {
      if (party !== 'other') {
        const detailFn = L(lang, 'partyMotionsFiled') as string | ((party: string, n: number) => string);
        const detail = typeof detailFn === 'function'
          ? detailFn(party, partyMotions.length)
          : `${party}: ${partyMotions.length} motions filed`;
        content += `        <li>${escapeHtml(String(detail))}</li>\n`;
      }
    });
    content += `      </ul>\n    </div>\n`;
  }

  return content;
}

export function generateGenericContent(data: ArticleContentData, lang: Language | string): string {
  const docs = data.documents || [];
  if (docs.length === 0) {
    return `<p>${L(lang, 'genericContent')}</p>`;
  }

  const cia = data.ciaContext;
  let content = '';

  // ── Inverted-pyramid lede: lead with most significant document type ──────
  // Group by document type first to identify the most newsworthy lead
  const byType: Record<string, RawDocument[]> = {};
  docs.forEach(doc => {
    const docType = doc.doktyp || doc.documentType || 'other';
    if (!byType[docType]) byType[docType] = [];
    byType[docType].push(doc);
  });

  // Significance order: propositions → committee reports → government comms → motions → rest
  const typeOrder = ['prop', 'bet', 'skr', 'mot', 'other'];
  const sortedTypes = [...Object.keys(byType)].sort((a, b) => {
    const ai = typeOrder.indexOf(a); const bi = typeOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Lead with the most significant type rather than a raw count
  const leadType = sortedTypes[0];
  const leadDocs = leadType ? (byType[leadType] ?? []) : [];
  const leadTitle = leadDocs[0] ? (leadDocs[0].titel || leadDocs[0].title || '') : '';

  // Per-language title suffix (e.g. " — including "Prop. 2025/26:42"")
  const titleSuffix: string = leadTitle
    ? (TITLE_SUFFIX_TEMPLATES[lang] ?? (t => ` — including "${t}"`))(leadTitle)
    : '';

  let ledeText: string;
  if (leadType === 'prop' && leadDocs.length > 0) {
    const n = leadDocs.length;
    ledeText = lang === 'sv'
      ? `Riksdagen behandlar ${n} proposition${n !== 1 ? 'er' : ''}${titleSuffix} under denna period.`
      : lang === 'da' ? `Folketinget behandler ${n} lovforslag${titleSuffix} i denne periode.`
      : lang === 'no' ? `Stortinget behandler ${n} lovproposisjon${n !== 1 ? 'er' : ''}${titleSuffix} i denne perioden.`
      : lang === 'fi' ? `Eduskunta käsittelee ${n} hallituksen esitystä${titleSuffix} tällä kaudella.`
      : lang === 'de' ? `Das Parlament berät ${n} Regierungsvorlag${n !== 1 ? 'en' : 'e'}${titleSuffix} in dieser Periode.`
      : lang === 'fr' ? `Le parlement examine ${n} proposition${n !== 1 ? 's' : ''} gouvernementale${n !== 1 ? 's' : ''}${titleSuffix} pendant cette période.`
      : lang === 'es' ? `El parlamento examina ${n} proposición${n !== 1 ? 'es' : ''} gubernamental${n !== 1 ? 'es' : ''}${titleSuffix} durante este período.`
      : lang === 'nl' ? `Het parlement bespreekt ${n} regeringsvoorstel${n !== 1 ? 'len' : ''}${titleSuffix} in deze periode.`
      : lang === 'ar' ? `يناقش البرلمان ${n} اقتراح${n !== 1 ? 'ات' : ''} حكومية${titleSuffix} خلال هذه الفترة.`
      : lang === 'he' ? `הפרלמנט דן ב-${n} הצעת חוק ממשלתית${n !== 1 ? 'ות' : ''}${titleSuffix} בתקופה זו.`
      : lang === 'ja' ? `議会はこの期間中に${n}本の政府提出法案を審議しています${titleSuffix}。`
      : lang === 'ko' ? `의회는 이 기간 동안 ${n}건의 정부 법안을 심의하고 있습니다${titleSuffix}.`
      : lang === 'zh' ? `议会正在审议本期${n}项政府提案${titleSuffix}。`
      : `Parliament is considering ${n} government proposition${n !== 1 ? 's' : ''}${titleSuffix} during this period.`;
  } else if (leadType === 'bet' && leadDocs.length > 0) {
    const n = leadDocs.length;
    ledeText = lang === 'sv'
      ? `Utskotten har lämnat ${n} betänkande${n !== 1 ? 'n' : ''}${titleSuffix} för riksdagens beslut.`
      : lang === 'da' ? `Udvalgene har afleveret ${n} betænkning${n !== 1 ? 'er' : ''}${titleSuffix} til parlamentarisk beslutning.`
      : lang === 'no' ? `Komiteene har levert ${n} innstilling${n !== 1 ? 'er' : ''}${titleSuffix} til parlamentarisk beslutning.`
      : lang === 'fi' ? `Valiokunnat ovat toimittaneet ${n} mietinnön${titleSuffix} parlamentin päätettäväksi.`
      : lang === 'de' ? `Die Ausschüsse haben ${n} Bericht${n !== 1 ? 'e' : ''}${titleSuffix} zur parlamentarischen Entscheidung vorgelegt.`
      : lang === 'fr' ? `Les commissions ont livré ${n} rapport${n !== 1 ? 's' : ''}${titleSuffix} pour décision parlementaire.`
      : lang === 'es' ? `Los comités han presentado ${n} informe${n !== 1 ? 's' : ''}${titleSuffix} para decisión parlamentaria.`
      : lang === 'nl' ? `De commissies hebben ${n} rapport${n !== 1 ? 'en' : ''}${titleSuffix} ingediend voor parlementaire beslissing.`
      : lang === 'ar' ? `قدمت اللجان ${n} تقرير${n !== 1 ? 'اً' : ''}${titleSuffix} للقرار البرلماني.`
      : lang === 'he' ? `הוועדות הגישו ${n} דוח${n !== 1 ? 'ות' : ''}${titleSuffix} להחלטה פרלמנטרית.`
      : lang === 'ja' ? `委員会は議会の決定のために${n}本の報告書を提出しました${titleSuffix}。`
      : lang === 'ko' ? `위원회들이 의회 결정을 위해 ${n}건의 보고서를 제출했습니다${titleSuffix}.`
      : lang === 'zh' ? `委员会已提交${n}份报告${titleSuffix}供议会决定。`
      : `Committees have delivered ${n} report${n !== 1 ? 's' : ''}${titleSuffix} for parliamentary decision.`;
  } else {
    const overviewFn = L(lang, 'genericOverview') as string | ((n: number) => string);
    ledeText = typeof overviewFn === 'function'
      ? overviewFn(docs.length)
      : `During this period, ${docs.length} documents were processed in parliament.`;
  }
  content += `<p class="article-lede">${escapeHtml(ledeText)}</p>\n`;

  content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;

  // Per-language document type labels
  const docTypeLabels: Record<string, Record<string, string>> = {
    mot: { en: 'Motions', sv: 'Motioner', da: 'Forslag', no: 'Forslag', fi: 'Aloitteet', de: 'Anträge', fr: 'Motions', es: 'Mociones', nl: 'Moties', ar: 'اقتراحات', he: 'הצעות', ja: '動議', ko: '동의', zh: '动议' },
    prop: { en: 'Propositions', sv: 'Propositioner', da: 'Lovforslag', no: 'Proposisjoner', fi: 'Hallituksen esitykset', de: 'Regierungsvorlagen', fr: 'Propositions', es: 'Proposiciones', nl: 'Regeringsvoorstellen', ar: 'مقترحات حكومية', he: 'הצעות ממשלה', ja: '政府提案', ko: '정부 법안', zh: '政府提案' },
    bet: { en: 'Committee Reports', sv: 'Betänkanden', da: 'Betænkninger', no: 'Innstillinger', fi: 'Mietinnöt', de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comité', nl: 'Commissierapporten', ar: 'تقارير اللجان', he: 'דוחות ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告' },
    skr: { en: 'Government Communications', sv: 'Skrivelser', da: 'Regeringsmeddelelser', no: 'Regjeringsmeldinger', fi: 'Hallituksen kirjeet', de: 'Regierungsschreiben', fr: 'Communications gouvernementales', es: 'Comunicaciones gubernamentales', nl: 'Regeringsmededelingen', ar: 'مراسلات حكومية', he: 'תקשורות ממשלתיות', ja: '政府通知', ko: '정부 서한', zh: '政府通知' },
  };

  for (const docType of sortedTypes) {
    const typeDocs = byType[docType] ?? [];
    const otherDocsVal = L(lang, 'otherDocuments');
    const otherDocsLabel = typeof otherDocsVal === 'string' ? otherDocsVal : 'Other documents';
    const langLabels = docTypeLabels[docType];
    const typeLabel = langLabels
      ? (langLabels[lang as string] ?? langLabels['sv'] ?? docType)
      : docType === 'other' ? otherDocsLabel : docType;

    content += `\n    <h3>${escapeHtml(typeLabel)} (${typeDocs.length})</h3>\n`;

    // ── Per-document deep analysis ───────────────────────────────────────
    for (const doc of typeDocs) {
      const titleText = doc.titel || doc.title || '';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (doc.titel && !doc.title)
        ? svSpan(escapedTitle, lang)
        : escapedTitle;

      const analysis = generateDocumentIntelligenceAnalysis(doc, docType, cia, lang);

      content += `    <div class="document-entry">\n`;
      content += `      <h4>${titleHtml}</h4>\n`;
      content += `      <p>${analysis}</p>\n`;
      if (doc.url) {
        content += `      <p><a href="${sanitizeUrl(doc.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(doc.dokumentnamn || doc.dok_id || titleText)}</a></p>\n`;
      }
      content += `    </div>\n`;
    }
  }

  // ── Cross-type analytical sections (bring generic content closer to dedicated generators) ──

  // Opposition strategy when motions with multiple parties exist
  const motionDocs = docs.filter(d => (d.doktyp || d.documentType) === 'mot');
  if (motionDocs.length >= 2) {
    const byPartyGeneric: Record<string, RawDocument[]> = {};
    motionDocs.forEach(m => {
      const party = normalizePartyKey(m.parti);
      if (!byPartyGeneric[party]) byPartyGeneric[party] = [];
      byPartyGeneric[party].push(m);
    });
    const partyCountGeneric = Object.keys(byPartyGeneric).filter(p => p !== 'other').length;
    if (partyCountGeneric > 1) {
      content += `\n    <h2>${L(lang, 'oppositionStrategy')}</h2>\n`;
      content += generateOppositionStrategySection(motionDocs, lang);
    }
  }

  // Committee breakdown when committee reports exist
  const reportDocs = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  if (reportDocs.length >= 2) {
    const byCommitteeGeneric: Record<string, number> = {};
    reportDocs.forEach(r => {
      const c = r.organ || r.committee || 'unknown';
      byCommitteeGeneric[c] = (byCommitteeGeneric[c] || 0) + 1;
    });
    const knownCommittees = Object.entries(byCommitteeGeneric).filter(([c]) => c !== 'unknown');
    if (knownCommittees.length > 0) {
      const committeeSectionLabels: Record<string, string> = {
        en: 'Committee Activity', sv: 'Utskottsaktivitet', da: 'Udvalgsaktivitet',
        no: 'Komitéaktivitet', fi: 'Valiokuntatoiminta', de: 'Ausschusstätigkeit',
        fr: 'Activité des commissions', es: 'Actividad de comités', nl: 'Commissieactiviteit',
        ar: 'نشاط اللجان', he: 'פעילות ועדות', ja: '委員会活動', ko: '위원회 활동', zh: '委员会活动',
      };
      const committeeSectionLabel = committeeSectionLabels[lang as string] ?? 'Committee Activity';
      content += `\n    <h2>${escapeHtml(committeeSectionLabel)}</h2>\n`;
      content += `    <div class="context-box">\n      <ul>\n`;
      knownCommittees
        .sort(([, a], [, b]) => b - a)
        .forEach(([c, n]) => {
          content += `        <li>${escapeHtml(getCommitteeName(c, lang))}: ${n}</li>\n`;
        });
      content += `      </ul>\n    </div>\n`;
    }
  }

  // Government priority signal when multiple propositions target the same committee
  const propDocs = docs.filter(d => (d.doktyp || d.documentType) === 'prop');
  if (propDocs.length >= 2) {
    const byPropCommittee: Record<string, number> = {};
    propDocs.forEach(p => {
      const c = p.organ || p.committee || 'unknown';
      byPropCommittee[c] = (byPropCommittee[c] || 0) + 1;
    });
    const sortedPropCommittees = Object.entries(byPropCommittee)
      .filter(([c]) => c !== 'unknown')
      .sort(([, a], [, b]) => b - a);
    if (sortedPropCommittees.length > 0 && sortedPropCommittees[0][1] >= 2) {
      const [topC, topN] = sortedPropCommittees[0];
      const topCName = getCommitteeName(topC, lang);
      const govPriorityTemplates: Record<string, (n: string, c: number) => string> = {
        sv: (n, c) => `${n} tar emot ${c} propositioner – detta signalerar ett prioriterat politikområde.`,
        da: (n, c) => `${n} modtager ${c} lovforslag — et klart signal om prioritet.`,
        no: (n, c) => `${n} mottar ${c} proposisjoner — et signal om regjeringsprioritet.`,
        fi: (n, c) => `${n} vastaanottaa ${c} esitystä — merkki hallituksen painopistealueesta.`,
        de: (n, c) => `${n} erhält ${c} Vorlagen — ein Signal für Regierungspriorität.`,
        fr: (n, c) => `${n} reçoit ${c} propositions — un signal de priorité gouvernementale.`,
        es: (n, c) => `${n} recibe ${c} proposiciones — señal de prioridad gubernamental.`,
        nl: (n, c) => `${n} ontvangt ${c} voorstellen — signaal van overheidsprioriteit.`,
        ar: (n, c) => `${n} يستقبل ${c} مقترحات — إشارة لأولوية حكومية.`,
        he: (n, c) => `${n} מקבל ${c} הצעות — אות לעדיפות ממשלתית.`,
        ja: (n, c) => `${n}は${c}件の提案を受け取り、政府の重点分野を示しています。`,
        ko: (n, c) => `${n}이(가) ${c}건의 법안을 받아 정부 우선순위를 나타냅니다.`,
        zh: (n, c) => `${n}收到${c}项提案——表明这是政府的优先领域。`,
      };
      const govTpl = govPriorityTemplates[lang as string];
      const govNote = govTpl
        ? govTpl(escapeHtml(topCName), topN)
        : `${escapeHtml(topCName)} receives ${topN} propositions — signalling government priority in this policy area.`;
      content += `\n    <h2>${L(lang, 'policyImplications')}</h2>\n`;
      content += `    <p>${govNote}</p>\n`;
    }
  }

  // ── Narrative bridge to analytical outlook ───────────────────────────────
  const oppositionTransition = getPillarTransition(lang, 'oppositionToAhead');
  if (oppositionTransition) {
    content += `    <p class="pillar-transition">${escapeHtml(oppositionTransition)}</p>\n`;
  }

  // ── Key takeaways ────────────────────────────────────────────────────────
  content += `\n    <h2>${L(lang, 'keyTakeaways')}</h2>\n`;
  content += `    <div class="context-box">\n      <ul>\n`;

  // Document type distribution (localised labels in summary too)
  const typeDescriptions = sortedTypes.map(docType => {
    const typeDocs = byType[docType] ?? [];
    const langLabels2 = docTypeLabels[docType];
    const label = langLabels2
      ? (langLabels2[lang as string] ?? langLabels2['sv'] ?? docType).toLowerCase()
      : docType;
    return `${typeDocs.length} ${label}`;
  });
  const processedLabel = L(lang, 'processedThisPeriod');
  const processedSuffix = typeof processedLabel === 'string' ? processedLabel : 'processed this period';
  if (typeDescriptions.length > 0) {
    content += `        <li>${escapeHtml(typeDescriptions.join(', '))} ${escapeHtml(processedSuffix)}</li>\n`;
  }

  // Policy domains — show labels only to keep the bullet concise
  const allDomains = new Set<string>();
  const enrichedCount = docs.filter(d => d.contentFetched).length;
  docs.forEach(doc => {
    detectPolicyDomains(doc, lang).forEach(d => allDomains.add(d));
  });
  if (allDomains.size > 0) {
    const policyContextVal = L(lang, 'policyContext');
    content += `        <li>${escapeHtml(String(policyContextVal))}: ${escapeHtml(Array.from(allDomains).slice(0, 4).join('; '))}</li>\n`;
  }
  if (enrichedCount > 0) {
    const analysisDepthLabels: Record<string, string> = {
      en: 'Analysis depth', sv: 'Analysdjup', da: 'Analysedybde', no: 'Analysedybde',
      fi: 'Analyysisyvyys', de: 'Analysetiefe', fr: 'Profondeur d\'analyse',
      es: 'Profundidad del análisis', nl: 'Analysediepte', ar: 'عمق التحليل',
      he: 'עומק הניתוח', ja: '分析の深さ', ko: '분석 깊이', zh: '分析深度',
    };
    const depthLabel = analysisDepthLabels[lang as string] ?? 'Analysis depth';
    const ofLabels: Record<string, string> = {
      sv: 'av', da: 'af', no: 'av', fi: '/', de: 'von', fr: 'sur', es: 'de',
      nl: 'van', ar: 'من', he: 'מתוך', ja: '/', ko: '/', zh: '/',
    };
    const ofLabel = ofLabels[lang as string] ?? 'of';
    content += `        <li><strong>${escapeHtml(depthLabel)}:</strong> ${enrichedCount} ${ofLabel} ${docs.length}</li>\n`;
  }

  // ── SECONDARY: CIA context only when it changes interpretation ───────────
  // Razor-thin majority is actionable intelligence worth flagging once, in summary
  if (cia && cia.coalitionStability.majorityMargin <= 2) {
    const margin = cia.coalitionStability.majorityMargin;
    const ciaContextTemplates: Record<string, (m: number) => string> = {
      sv: m => `Historisk kontext: nuvarande ${m}-mandatsövertag innebär att en enda avhoppare kan ändra utfallet.`,
      da: m => `Historisk kontekst: det nuværende flertal på ${m} mandater betyder, at en enkelt afhopper kan vende resultatet.`,
      no: m => `Historisk kontekst: nåværende ${m}-mandats flertall betyr at en enkelt avhopper kan snu utfallet.`,
      fi: m => `Historiallinen konteksti: nykyinen ${m} paikan enemmistö tarkoittaa, että yksittäinen loikkari voi kääntää tuloksen.`,
      de: m => `Historischer Kontext: Die aktuelle ${m}-Sitze-Mehrheit bedeutet, dass ein einzelner Abweichler das Ergebnis kippen könnte.`,
      fr: m => `Contexte historique : la majorité actuelle de ${m} sièges signifie qu'une seule défection pourrait inverser le résultat.`,
      es: m => `Contexto histórico: la mayoría actual de ${m} escaños significa que una sola defección podría revertir el resultado.`,
      nl: m => `Historische context: de huidige meerderheid van ${m} zetels betekent dat één enkele overloper de uitkomst kan omkeren.`,
      ar: m => `السياق التاريخي: الأغلبية الحالية البالغة ${m} مقاعد تعني أن انشقاقاً واحداً يمكن أن يعكس النتائج.`,
      he: m => `הקשר היסטורי: הרוב הנוכחי של ${m} מושבים משמעו שעריקות אחת יכולה להפוך את התוצאה.`,
      ja: m => `歴史的背景：現在の${m}議席差は、1人の離反で結果が覆る可能性を意味します。`,
      ko: m => `역사적 맥락: 현재 ${m}석 차이는 단 한 명의 이탈로도 결과가 뒤집힐 수 있음을 의미합니다.`,
      zh: m => `历史背景：目前${m}席的多数意味着任何一位议员的倒戈都可能逆转结果。`,
    };
    const ciaTpl = ciaContextTemplates[lang as string];
    const ciaText = ciaTpl
      ? ciaTpl(margin)
      : `Historical context: the current ${margin}-seat majority means any single defection or absence could reverse outcomes this week.`;
    content += `        <li><small class="cia-context">${escapeHtml(ciaText)}</small></li>\n`;
  }

  content += `      </ul>\n    </div>\n`;

  return content;
}
