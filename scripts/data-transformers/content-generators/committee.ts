/**
 * @module data-transformers/content-generators/committee
 * @description Generator for "committee-reports" article content. Renders committee
 * reports grouped by committee with policy significance analysis.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { ArticleContentData } from '../types.js';
import { getPillarTransition } from '../../editorial-pillars.js';
import type { RawDocument } from '../types.js';
import {
  L,
  svSpan,
  sanitizeUrl,
  getCommitteeName,
  generateEnhancedSummary,
  formatDocumentDate,
} from '../helpers.js';
import { detectPolicyDomains, generateDeepPolicyAnalysis } from '../policy-analysis.js';
import { generateDeepAnalysisSection } from './shared.js';

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
      const dateHtml = formatDocumentDate(report, lang);

      content += `
    <div class="report-entry">
      <h4>${titleHtml}</h4>
      <p><strong>${L(lang, 'committee')}:</strong> ${escapeHtml(committeeName)}</p>${dateHtml ? `\n      <p>${dateHtml}</p>` : ''}
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

  // Deep Analysis section (5W framework)
  content += generateDeepAnalysisSection({
    documents: reports,
    lang,
    cia: data.ciaContext,
    articleType: 'committee-reports',
  });

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

  // ── Optional: Voting Results section ─────────────────────────────────────
  const votes = (data.votes ?? []) as unknown[];
  if (votes.length > 0) {
    const votingSectionHeaders: Record<string, string> = {
      sv: 'Röstningsresultat', da: 'Afstemningsresultater', no: 'Voteringsresultater',
      fi: 'Äänestystulokset', de: 'Abstimmungsergebnisse', fr: 'Résultats du vote',
      es: 'Resultados de la votación', nl: 'Stemresultaten', ar: 'نتائج التصويت',
      he: 'תוצאות ההצבעה', ja: '投票結果', ko: '투표 결과', zh: '投票结果',
    };
    const votingCountTemplates: Record<string, (n: number) => string> = {
      sv: (n) => `${n} röstningsprotokoll visar hur partierna röstade i utskottsbeslut denna period.`,
      da: (n) => `${n} afstemningsprotokoller viser, hvordan partierne stemte om udvalgets beslutninger.`,
      no: (n) => `${n} voteringsprotokoll viser hvordan partiene stemte i komitévedtak.`,
      fi: (n) => `${n} äänestysrekisteriä osoittaa, miten puolueet äänestivät valiokunnan päätöksistä.`,
      de: (n) => `${n} Abstimmungsrekorde zeigen, wie die Parteien über Ausschussbeschlüsse abstimmten.`,
      fr: (n) => `${n} procès-verbaux de vote montrent comment les partis ont voté sur les décisions de commission.`,
      es: (n) => `${n} registros de votación muestran cómo votaron los partidos en las decisiones de la comisión.`,
      nl: (n) => `${n} stemregisters tonen hoe partijen stemden over commissiebeslissingen.`,
      ar: (n) => `${n} سجلات التصويت تظهر كيف صوتت الأحزاب على قرارات اللجنة.`,
      he: (n) => `${n} פרוטוקולי הצבעה מציגים כיצד הצביעו המפלגות על החלטות הוועדה.`,
      ja: (n) => `${n}件の投票記録が、委員会決定に対する各党の投票方法を示しています。`,
      ko: (n) => `${n}건의 투표 기록이 위원회 결정에 대한 각 정당의 투표 방식을 보여줍니다.`,
      zh: (n) => `${n}条投票记录显示各党派对委员会决定的投票情况。`,
    };
    const votingHeader = votingSectionHeaders[lang as string] ?? 'Voting Results';
    const votingCountFn = votingCountTemplates[lang as string];
    const votingCountText = votingCountFn
      ? votingCountFn(votes.length)
      : `${votes.length} voting records show how parties voted on committee decisions this period.`;
    content += `\n    <h2>${escapeHtml(votingHeader)}</h2>\n`;
    content += `    <p>${escapeHtml(votingCountText)}</p>\n`;
  }

  // ── Optional: Committee Debate section ───────────────────────────────────
  const speeches = (data.speeches ?? []) as unknown[];
  if (speeches.length > 0) {
    const debateSectionHeaders: Record<string, string> = {
      sv: 'Utskottsdebatt', da: 'Udvalgets debat', no: 'Komitédebatt',
      fi: 'Valiokunnan keskustelu', de: 'Ausschussdebatte', fr: 'Débat en commission',
      es: 'Debate en comisión', nl: 'Commissiedebat', ar: 'نقاش اللجنة',
      he: 'דיון בוועדה', ja: '委員会討論', ko: '위원회 토론', zh: '委员会讨论',
    };
    const debateCountTemplates: Record<string, (n: number) => string> = {
      sv: (n) => `${n} anföranden i kammaren belyser de viktigaste argumenten och partipositionerna i dessa frågor.`,
      da: (n) => `${n} parlamentariske taler belyser nøgleargumenter og partipositioner.`,
      no: (n) => `${n} parlamentariske innlegg belyser nøkkelargumenter og partiposisjoner.`,
      fi: (n) => `${n} parlamentaarista puheenvuoroa valaisee keskeisiä argumentteja ja puolueiden kantoja.`,
      de: (n) => `${n} parlamentarische Reden beleuchten Hauptargumente und Parteipositionen.`,
      fr: (n) => `${n} discours parlementaires éclairent les arguments clés et les positions des partis.`,
      es: (n) => `${n} discursos parlamentarios iluminan los principales argumentos y posiciones de los partidos.`,
      nl: (n) => `${n} parlementaire toespraken belichten de belangrijkste argumenten en partijposities.`,
      ar: (n) => `${n} خطاب برلماني يسلط الضوء على الحجج الرئيسية ومواقف الأحزاب.`,
      he: (n) => `${n} נאומים פרלמנטריים מאירים טיעונים מרכזיים ועמדות מפלגות.`,
      ja: (n) => `${n}件の議会演説が主要な論点と各党の立場を明らかにしています。`,
      ko: (n) => `${n}건의 의회 연설이 주요 논점과 각 정당의 입장을 보여줍니다.`,
      zh: (n) => `${n}篇议会演讲揭示了主要论点和各党派立场。`,
    };
    const debateHeader = debateSectionHeaders[lang as string] ?? 'Committee Debate';
    const debateCountFn = debateCountTemplates[lang as string];
    const debateCountText = debateCountFn
      ? debateCountFn(speeches.length)
      : `${speeches.length} parliamentary speeches highlight key arguments and party positions on these issues.`;
    content += `\n    <h2>${escapeHtml(debateHeader)}</h2>\n`;
    content += `    <p>${escapeHtml(debateCountText)}</p>\n`;
  }

  // ── Optional: Government Bill Linkage section ─────────────────────────────
  const propositions = (data.propositions ?? []) as RawDocument[];
  if (propositions.length > 0) {
    const billSectionHeaders: Record<string, string> = {
      sv: 'Koppling till regeringspropositioner', da: 'Tilknytning til regeringsforslag',
      no: 'Tilknytning til regjeringsproposisjoner', fi: 'Yhteys hallituksen esityksiin',
      de: 'Verknüpfung mit Regierungsvorlagen', fr: 'Lien avec les projets de loi gouvernementaux',
      es: 'Vinculación con proyectos de ley gubernamentales', nl: 'Koppeling aan regeringsvoorstellen',
      ar: 'الصلة بمشاريع قوانين الحكومة', he: 'קישור להצעות חוק ממשלתיות',
      ja: '政府法案との連携', ko: '정부 법안과의 연계', zh: '与政府法案的关联',
    };
    const billCountTemplates: Record<string, (n: number) => string> = {
      sv: (n) => `${n} regeringspropositioner är kopplade till dessa betänkanden och visar lagstiftningskedjan.`,
      da: (n) => `${n} regeringsforslag er knyttet til disse betænkninger og viser den lovgivningsmæssige kæde.`,
      no: (n) => `${n} regjeringsproposisjoner er knyttet til disse innstillingene og viser den legislative kjeden.`,
      fi: (n) => `${n} hallituksen esitystä liittyy näihin mietintöihin ja osoittaa lainsäädäntöketjun.`,
      de: (n) => `${n} Regierungsvorlagen sind mit diesen Berichten verknüpft und zeigen die Gesetzgebungskette.`,
      fr: (n) => `${n} projets de loi gouvernementaux sont liés à ces rapports, montrant la chaîne législative.`,
      es: (n) => `${n} proyectos de ley gubernamentales están vinculados a estos informes, mostrando la cadena legislativa.`,
      nl: (n) => `${n} regeringsvoorstellen zijn gekoppeld aan deze rapporten en tonen de wetgevingsketen.`,
      ar: (n) => `${n} مشاريع قوانين حكومية مرتبطة بهذه التقارير، مما يُظهر السلسلة التشريعية.`,
      he: (n) => `${n} הצעות חוק ממשלתיות קשורות לדוחות אלה, ומציגות את השרשרת החקיקתית.`,
      ja: (n) => `${n}件の政府法案がこれらの報告書に関連しており、立法プロセスの連鎖を示しています。`,
      ko: (n) => `${n}건의 정부 법안이 이 보고서들과 연계되어 입법 과정의 연결고리를 보여줍니다.`,
      zh: (n) => `${n}项政府法案与这些报告相关，展示了立法链条。`,
    };
    const billHeader = billSectionHeaders[lang as string] ?? 'Government Bill Linkage';
    const billCountFn = billCountTemplates[lang as string];
    const billCountText = billCountFn
      ? billCountFn(propositions.length)
      : `${propositions.length} government propositions are linked to these reports, tracing the full legislative chain.`;
    content += `\n    <h2>${escapeHtml(billHeader)}</h2>\n`;
    content += `    <p>${escapeHtml(billCountText)}</p>\n`;
    propositions.slice(0, 3).forEach(prop => { // display up to 3 linked propositions
      if (typeof prop !== 'object' || prop === null) return;
      const propTitle = escapeHtml((prop as RawDocument).titel || (prop as RawDocument).title || (prop as RawDocument).dokumentnamn || '');
      if (propTitle) {
        content += `    <p>→ ${propTitle}</p>\n`;
      }
    });
  }

  return content;
}

