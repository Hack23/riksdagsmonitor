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
import type { ArticleContentData, WeekAheadData, RawDocument, RawCalendarEvent } from './types.js';
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

/** Extract meaningful keywords from text for cross-reference matching (min 2 chars, captures EU, KU, etc.; splits on whitespace, hyphens, and commas) */
function extractKeywords(text: string): string[] {
  return text.toLowerCase().split(/[\s,–-]+/u).filter(w => w.length >= 2);
}

/** Find documents related to a calendar event by organ match or keyword overlap (max 3) */
function findRelatedDocuments(event: RawCalendarEvent, documents: RawDocument[]): RawDocument[] {
  const eventOrgan = event.organ ?? '';
  const keywords = extractKeywords(event.rubrik ?? event.titel ?? event.title ?? '');
  return documents.filter(doc => {
    const docOrgan = doc.organ ?? doc.committee ?? '';
    if (eventOrgan && docOrgan && eventOrgan.toLowerCase() === docOrgan.toLowerCase()) return true;
    const docText = (doc.titel ?? doc.title ?? '').toLowerCase();
    return keywords.some(kw => docText.includes(kw));
  }).slice(0, 3);
}

/** Find written questions related to a calendar event by keyword overlap (max 3) */
function findRelatedQuestions(event: RawCalendarEvent, questions: RawDocument[]): RawDocument[] {
  const keywords = extractKeywords(event.rubrik ?? event.titel ?? event.title ?? '');
  return questions.filter(q => {
    const qText = (q.titel ?? q.title ?? '').toLowerCase();
    return keywords.some(kw => qText.includes(kw));
  }).slice(0, 3);
}

/** Extract targeted minister name from interpellation summary "till MINISTER" header line.
 *  Strips trailing topic clauses ("om X", "angående Y", etc.) and punctuation. */
function extractMinister(summary: string): string {
  // Use non-newline whitespace ([^\S\n]+) so we don't cross into the next line
  const m = summary.match(/\btill[^\S\n]+([^\n]+)/i);
  if (!m) return '';
  const raw = m[1].trim();
  if (!raw) return '';

  // Remove common trailing topic clauses and punctuation
  const lowerRaw = raw.toLowerCase();
  const stopPhrases = [' om ', ' angående ', ' rörande ', ' beträffande '];
  let end = raw.length;
  for (const phrase of stopPhrases) {
    const idx = lowerRaw.indexOf(phrase);
    if (idx !== -1 && idx < end) end = idx;
  }
  // Cut at terminating punctuation if it comes earlier
  const punctIdx = raw.search(/[?:;.,]/);
  if (punctIdx !== -1 && punctIdx < end) end = punctIdx;

  return raw.slice(0, end).trim();
}

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

      // Policy Context: cross-reference related documents and questions per event
      const relatedPolicyDocs = findRelatedDocuments(event, documents);
      const relatedPolicyQs = findRelatedQuestions(event, questions);
      if (relatedPolicyDocs.length > 0 || relatedPolicyQs.length > 0) {
        const policyContextLabel = lang === 'sv' ? 'Policysammanhang'
          : lang === 'de' ? 'Politischer Kontext'
          : lang === 'fr' ? 'Contexte politique'
          : lang === 'es' ? 'Contexto político'
          : lang === 'da' ? 'Politisk kontekst'
          : lang === 'no' ? 'Politisk kontekst'
          : lang === 'fi' ? 'Poliittinen konteksti'
          : lang === 'nl' ? 'Beleidscontext'
          : lang === 'ar' ? 'السياق السياسي'
          : lang === 'he' ? 'הקשר מדיניות'
          : lang === 'ja' ? '政策コンテキスト'
          : lang === 'ko' ? '정책 맥락'
          : lang === 'zh' ? '政策背景'
          : 'Policy Context';
        content += `    <div class="policy-context-box">\n`;
        content += `      <h4>${policyContextLabel}</h4>\n`;
        relatedPolicyDocs.forEach(doc => {
          const drec = doc as Record<string, string>;
          const docTitle = drec['titel'] ?? drec['title'] ?? 'Document';
          const dokId = drec['dok_id'] ?? '';
          const docUrl = dokId ? sanitizeUrl(`https://riksdagen.se/sv/dokument-och-lagar/dokument/${encodeURIComponent(dokId)}/`) : '';
          content += `      <div class="document-entry">\n`;
          content += `        <h5>${docUrl ? `<a href="${docUrl}" target="_blank" rel="noopener noreferrer">` : ''}${svSpan(escapeHtml(docTitle), lang)}${docUrl ? '</a>' : ''}</h5>\n`;
          const sig = generatePolicySignificance(doc, lang);
          if (sig) content += `        <p class="policy-significance">${escapeHtml(sig)}</p>\n`;
          content += `      </div>\n`;
        });
        relatedPolicyQs.forEach(q => {
          const qrec = q as Record<string, string>;
          const qTitle = qrec['titel'] ?? qrec['title'] ?? 'Question';
          const qParty = qrec['parti'] ? ` (${escapeHtml(qrec['parti'])})` : '';
          const qDokId = qrec['dok_id'] ?? '';
          const qUrl = qDokId ? sanitizeUrl(`https://riksdagen.se/sv/dokument-och-lagar/dokument/${encodeURIComponent(qDokId)}/`) : '';
          content += `      <div class="document-entry">\n`;
          content += `        <h5>${qUrl ? `<a href="${qUrl}" target="_blank" rel="noopener noreferrer">` : ''}${svSpan(escapeHtml(qTitle), lang)}${qUrl ? '</a>' : ''}${qParty}</h5>\n`;
          content += `      </div>\n`;
        });
        content += `    </div>\n`;
      }
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

  // Questions to Watch: upcoming written questions cross-referenced with debate topics
  if (questions.length > 0) {
    const questionsLabel = lang === 'sv' ? 'Frågor att bevaka'
      : lang === 'de' ? 'Zu beobachtende Anfragen'
      : lang === 'fr' ? 'Questions à surveiller'
      : lang === 'es' ? 'Preguntas a seguir'
      : lang === 'da' ? 'Spørgsmål at holde øje med'
      : lang === 'no' ? 'Spørsmål å følge med på'
      : lang === 'fi' ? 'Seurattavat kysymykset'
      : lang === 'nl' ? 'Te volgen vragen'
      : lang === 'ar' ? 'أسئلة تستحق المتابعة'
      : lang === 'he' ? 'שאלות לעקוב'
      : lang === 'ja' ? '注目の質問'
      : lang === 'ko' ? '주목할 질문'
      : lang === 'zh' ? '值得关注的问题'
      : 'Questions to Watch';
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

  // Interpellation Spotlight: formal interpellations enriched with minister response context
  if (interpellations.length > 0) {
    const interLabel = lang === 'sv' ? 'Interpellationer i fokus'
      : lang === 'de' ? 'Interpellationen im Fokus'
      : lang === 'fr' ? 'Interpellations en vedette'
      : lang === 'es' ? 'Interpelaciones destacadas'
      : lang === 'da' ? 'Forespørgsler i fokus'
      : lang === 'no' ? 'Interpellasjoner i fokus'
      : lang === 'fi' ? 'Välikysymykset valokeilassa'
      : lang === 'nl' ? 'Interpellaties in de spotlight'
      : lang === 'ar' ? 'أبرز الاستجوابات البرلمانية'
      : lang === 'he' ? 'בקשות הבהרה בזרקור'
      : lang === 'ja' ? '注目の質問主意書'
      : lang === 'ko' ? '주목할 대정부 질문'
      : lang === 'zh' ? '质询聚焦'
      : 'Interpellation Spotlight';
    content += `\n    <h2>${interLabel}</h2>\n`;
    interpellations.slice(0, 8).forEach(interp => {
      const rec = interp as Record<string, string>;
      const titleText = rec['titel'] || rec['title'] || 'Interpellation';
      const party = rec['parti'] ? ` (${escapeHtml(rec['parti'])})` : '';
      const dok_id = rec['dok_id'] ?? '';
      const iUrl = dok_id ? sanitizeUrl(`https://riksdagen.se/sv/dokument-och-lagar/dokument/${encodeURIComponent(dok_id)}/`) : '';
      // Extract minister and clean summary from the header lines
      const rawSummary = rec['summary'] ?? '';
      const ministerName = extractMinister(rawSummary);
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
      if (ministerName) content += `      <p class="minister-target">→ ${svSpan(escapeHtml(ministerName), lang)}</p>\n`;
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

  // Narrative bridge to analytical outlook (inter-pillar transition)
  const aheadTransition = getPillarTransition(lang, 'pulseToWatch');
  if (aheadTransition) {
    content += `    <p class="pillar-transition">${escapeHtml(aheadTransition)}</p>\n`;
  }

  // ── Key takeaways: synthesize all data sources for the week ──────────────
  const hasEventData = highPriority.length > 0;
  const hasDocData = documents.length > 0;
  const hasQData = questions.length > 0;
  const hasInterpData = interpellations.length > 0;

  if (hasEventData || hasDocData || hasQData || hasInterpData) {
    content += `\n    <h2>${L(lang, 'keyTakeaways')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;

    // Activity summary takeaway
    const itemCount = highPriority.length + documents.length + questions.length + interpellations.length;
    const activitySummaryTemplates: Record<string, (n: number) => string> = {
      sv: n => `Denna period innehåller ${n} ärenden som spänner över debatter, lagförslag, skriftliga frågor och interpellationer.`,
      da: n => `Denne periode omfatter ${n} emner på tværs af debatter, lovforslag, skriftlige spørgsmål og forespørgsler.`,
      no: n => `Denne perioden omfatter ${n} saker som spenner over debatter, lovforslag, skriftlige spørsmål og interpellasjoner.`,
      fi: n => `Tämä ajanjakso sisältää ${n} asiaa, jotka kattavat keskusteluja, lakiehdotuksia, kirjallisia kysymyksiä ja välikysymyksiä.`,
      de: n => `Dieser Zeitraum umfasst ${n} Themen in den Bereichen Debatten, Gesetzentwürfe, schriftliche Anfragen und Interpellationen.`,
      fr: n => `Cette période comprend ${n} sujets couvrant débats, propositions de loi, questions écrites et interpellations.`,
      es: n => `Este período incluye ${n} temas que abarcan debates, proyectos de ley, preguntas escritas e interpelaciones.`,
      nl: n => `Deze periode omvat ${n} onderwerpen over debatten, wetsvoorstellen, schriftelijke vragen en interpellaties.`,
      ar: n => `تشمل هذه الفترة ${n} بندًا تتراوح بين المناقشات ومشاريع القوانين والأسئلة المكتوبة والاستجوابات.`,
      he: n => `תקופה זו כוללת ${n} נושאים הכוללים דיונים, הצעות חוק, שאלות כתובות ואינטרפלציות.`,
      ja: n => `この期間には、討論・法案・書面質問・質問主意書を含む${n}件の議題があります。`,
      ko: n => `이 기간에는 토론, 법안, 서면 질문, 대정부 질문을 포괄하는 ${n}건의 의제가 있습니다.`,
      zh: n => `本期涵盖${n}个议题，横跨辩论、法案、书面质询和质询。`,
    };
    const actTpl = activitySummaryTemplates[lang as string];
    const activitySummary = actTpl
      ? actTpl(itemCount)
      : `This period features ${itemCount} items spanning debates, legislative proposals, written questions, and interpellations.`;
    content += `        <li>${escapeHtml(activitySummary)}</li>\n`;

    // Policy domain cross-analysis from documents
    if (documents.length > 0) {
      const weekDomains = new Set<string>();
      documents.forEach(doc => {
        detectPolicyDomains(doc, lang).forEach(d => weekDomains.add(d));
      });
      if (weekDomains.size > 0) {
        const domainList = Array.from(weekDomains).slice(0, 4).join(', ');
        const domainSummaryTemplates: Record<string, (d: string) => string> = {
          sv: d => `Den lagstiftande dagordningen berör ${d} — ett brett politiskt fokus denna period.`,
          da: d => `Den lovgivningsmæssige dagsorden berører ${d} — et bredt politisk fokus i denne periode.`,
          no: d => `Den lovgivningsmessige agendaen berører ${d} — et bredt politisk fokus denne perioden.`,
          fi: d => `Lainsäädäntöohjelma kattaa ${d} — laaja poliittinen painopiste tällä kaudella.`,
          de: d => `Die gesetzgeberische Tagesordnung berührt ${d} — ein breiter politischer Fokus in diesem Zeitraum.`,
          fr: d => `L'agenda législatif touche ${d} — un large spectre politique cette période.`,
          es: d => `La agenda legislativa toca ${d} — un amplio enfoque político en este período.`,
          nl: d => `De wetgevende agenda raakt ${d} — een breed politiek focus in deze periode.`,
          ar: d => `يغطي جدول الأعمال التشريعي ${d} — تركيز سياسي واسع في هذه الفترة.`,
          he: d => `סדר היום החקיקתי נוגע ב${d} — מוקד פוליטי רחב בתקופה זו.`,
          ja: d => `立法アジェンダは${d}に及び、この期間の幅広い政策的焦点を示しています。`,
          ko: d => `입법 안건은 ${d}에 걸쳐 있으며, 이 기간의 광범위한 정책 초점을 나타냅니다.`,
          zh: d => `立法议程涉及${d}——显示本期广泛的政策关注。`,
        };
        const domTpl = domainSummaryTemplates[lang as string];
        const domainSummary = domTpl
          ? domTpl(escapeHtml(domainList))
          : `The legislative agenda touches on ${escapeHtml(domainList)} — a broad policy focus this period.`;
        content += `        <li>${domainSummary}</li>\n`;
      }
    }

    // Parliamentary scrutiny indicator
    if (questions.length > 0 || interpellations.length > 0) {
      const scrutinyCount = questions.length + interpellations.length;
      const scrutinyTemplates: Record<string, (n: number) => string> = {
        sv: n => `${n} parlamentariska granskningsåtgärder (frågor och interpellationer) signalerar aktiv oppositionsövervakning.`,
        da: n => `${n} parlamentariske kontrolforanstaltninger signalerer aktiv oppositionsovervågning.`,
        no: n => `${n} parlamentariske kontrolltiltak signaliserer aktiv overvåking fra opposisjonen.`,
        fi: n => `${n} parlamentaarista valvontatoimenpidettä signaloi aktiivista oppositiovalvontaa.`,
        de: n => `${n} parlamentarische Kontrollmaßnahmen signalisieren aktive Oppositionsüberwachung.`,
        fr: n => `${n} mesures de contrôle parlementaire signalent une surveillance active de l'opposition.`,
        es: n => `${n} medidas de control parlamentario señalan una supervisión activa de la oposición.`,
        nl: n => `${n} parlementaire controlemaatregelen signaleren actief oppositietoezicht.`,
        ar: n => `${n} إجراءات رقابة برلمانية تشير إلى مراقبة نشطة من المعارضة.`,
        he: n => `${n} אמצעי פיקוח פרלמנטריים מסמנים מעקב פעיל של האופוזיציה.`,
        ja: n => `${n}件の議会監視措置は、野党による積極的な監視を示しています。`,
        ko: n => `${n}건의 의회 감시 조치는 야당의 적극적인 감시를 나타냅니다.`,
        zh: n => `${n}项议会监督措施表明反对派正在积极监督。`,
      };
      const scrTpl = scrutinyTemplates[lang as string];
      const scrutinySummary = scrTpl
        ? scrTpl(scrutinyCount)
        : `${scrutinyCount} parliamentary scrutiny measures (questions and interpellations) signal active opposition oversight.`;
      content += `        <li>${escapeHtml(scrutinySummary)}</li>\n`;
    }

    content += `      </ul>\n    </div>\n`;
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
      const propTitle = escapeHtml(prop.titel || prop.title || prop.dokumentnamn || '');
      if (propTitle) {
        content += `    <p>→ ${propTitle}</p>\n`;
      }
    });
  }

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

  // Narrative bridge to analytical outlook (inter-pillar transition)
  const propTransition = getPillarTransition(lang, 'pulseToWatch');
  if (propTransition) {
    content += `    <p class="pillar-transition">${escapeHtml(propTransition)}</p>\n`;
  }

  // ── Key takeaways: synthesize propositions batch ──────────────────────────
  content += `\n    <h2>${L(lang, 'keyTakeaways')}</h2>\n`;
  content += `    <div class="context-box">\n      <ul>\n`;

  // Propositions batch overview
  const committeeCountProp = Object.keys(byCommittee).filter(c => c !== 'unknown').length;
  const propOverviewTemplates: Record<string, (p: number, c: number) => string> = {
    sv: (p, c) => `${p} propositioner har hänvisats till ${c} utskott, vilket visar bredden i regeringens lagstiftningsambitioner.`,
    da: (p, c) => `${p} lovforslag er henvist til ${c} udvalg, hvilket viser bredden i regeringens lovgivningsmæssige ambitioner.`,
    no: (p, c) => `${p} proposisjoner er henvist til ${c} komiteer, noe som viser bredden i regjeringens lovgivningsmessige ambisjoner.`,
    fi: (p, c) => `${p} esitystä on viitattu ${c} valiokuntaan, mikä kuvastaa hallituksen lainsäädännöllisten tavoitteiden laajuutta.`,
    de: (p, c) => `${p} Vorlagen wurden an ${c} Ausschüsse verwiesen, was die Breite der Gesetzgebungsambitionen der Regierung zeigt.`,
    fr: (p, c) => `${p} propositions ont été renvoyées à ${c} commissions, montrant l'ampleur des ambitions législatives du gouvernement.`,
    es: (p, c) => `${p} proposiciones han sido remitidas a ${c} comités, mostrando la amplitud de las ambiciones legislativas del gobierno.`,
    nl: (p, c) => `${p} voorstellen zijn verwezen naar ${c} commissies, wat de breedte van de wetgevende ambities van de regering toont.`,
    ar: (p, c) => `تمت إحالة ${p} مقترحات إلى ${c} لجان، مما يُظهر نطاق الطموحات التشريعية الحكومية.`,
    he: (p, c) => `${p} הצעות הופנו ל-${c} ועדות, המראות את רוחב השאיפות החקיקתיות של הממשלה.`,
    ja: (p, c) => `${p}件の法案が${c}の委員会に付託され、政府の幅広い立法野心を示しています。`,
    ko: (p, c) => `${p}건의 법안이 ${c}개 위원회에 회부되어 정부의 광범위한 입법 야심을 나타냅니다.`,
    zh: (p, c) => `${p}项提案已交付${c}个委员会审议，显示政府广泛的立法雄心。`,
  };
  const propOverTpl = propOverviewTemplates[lang as string];
  const propOverview = propOverTpl
    ? propOverTpl(propositions.length, committeeCountProp)
    : `${propositions.length} propositions have been referred to ${committeeCountProp} committees, showing the breadth of the government's legislative ambitions.`;
  content += `        <li>${escapeHtml(propOverview)}</li>\n`;

  // Policy domain cross-analysis
  if (allPropDomains.size > 0) {
    const domainListProp = Array.from(allPropDomains).slice(0, 3).join(', ');
    const propDomainTemplates: Record<string, (d: string) => string> = {
      sv: d => `Propositionerna berör ${d} — ett mönster som avslöjar regeringens politik­prioriteringar.`,
      da: d => `Lovforslagene berører ${d} — et mønster der afdækker regeringens politiske prioriteringer.`,
      no: d => `Proposisjonene berører ${d} — et mønster som avslører regjeringens politiske prioriteringer.`,
      fi: d => `Esitykset kattavat ${d} — malli, joka paljastaa hallituksen poliittiset prioriteetit.`,
      de: d => `Die Vorlagen betreffen ${d} — ein Muster, das die politischen Prioritäten der Regierung offenbart.`,
      fr: d => `Les propositions touchent ${d} — un schéma révélant les priorités politiques du gouvernement.`,
      es: d => `Las proposiciones abarcan ${d} — un patrón que revela las prioridades políticas del gobierno.`,
      nl: d => `De voorstellen raken ${d} — een patroon dat de politieke prioriteiten van de regering onthult.`,
      ar: d => `تمس المقترحات ${d} — نمط يكشف عن الأولويات السياسية للحكومة.`,
      he: d => `ההצעות נוגעות ב${d} — תבנית החושפת את סדרי העדיפויות הפוליטיים של הממשלה.`,
      ja: d => `法案は${d}に及び、政府の政策優先事項を明らかにしています。`,
      ko: d => `법안은 ${d}에 걸쳐 있으며, 정부의 정책 우선순위를 드러냅니다.`,
      zh: d => `提案涉及${d}——揭示了政府的政策优先事项。`,
    };
    const propDomTpl = propDomainTemplates[lang as string];
    const propDomainAnalysis = propDomTpl
      ? propDomTpl(escapeHtml(domainListProp))
      : `Propositions span ${escapeHtml(domainListProp)} — a pattern revealing the government's policy priorities.`;
    content += `        <li>${propDomainAnalysis}</li>\n`;
  }

  content += `      </ul>\n    </div>\n`;

  // Display limits for enrichment sections
  const MAX_DISPLAY_ITEMS = 3;
  const MAX_SPEECH_PREVIEW_LENGTH = 200;

  // ── Policy Substance section (from search_dokument_fulltext) ─────────────
  const fullTextResults = data.fullTextResults as Array<Record<string, unknown>> | undefined;
  if (fullTextResults && fullTextResults.length > 0) {
    const policySubstanceHeadings: Record<string, string> = {
      en: 'Policy Substance', sv: 'Politikinnehåll', da: 'Politisk indhold',
      no: 'Politisk innhold', fi: 'Politiikan sisältö', de: 'Politischer Inhalt',
      fr: 'Contenu politique', es: 'Contenido de la política', nl: 'Beleidsinhoud',
      ar: 'مضمون السياسة', he: 'תוכן המדיניות', ja: '政策の内容', ko: '정책 내용', zh: '政策内容',
    };
    const psHeading = policySubstanceHeadings[lang as string] ?? policySubstanceHeadings['en'];
    content += `\n    <h2>${escapeHtml(psHeading)}</h2>\n`;
    content += `    <div class="policy-substance">\n`;
    for (const doc of fullTextResults.slice(0, MAX_DISPLAY_ITEMS)) {
      const docTitle = escapeHtml(String(doc['titel'] ?? doc['title'] ?? ''));
      const docSummary = escapeHtml(String(doc['summary'] ?? doc['notis'] ?? ''));
      if (docTitle) {
        content += `      <div class="fulltext-result"><strong>${docTitle}</strong>`;
        if (docSummary) content += `<p>${docSummary}</p>`;
        content += `</div>\n`;
      }
    }
    content += `    </div>\n`;
  }

  // ── Department Impact section (from analyze_g0v_by_department) ───────────
  const departmentAnalysis = data.departmentAnalysis as Record<string, unknown> | undefined;
  const departments = departmentAnalysis
    ? ((departmentAnalysis['departments'] ?? departmentAnalysis['dokument'] ?? []) as Array<Record<string, unknown>>)
    : [];
  if (departments.length > 0) {
    const departmentImpactHeadings: Record<string, string> = {
      en: 'Department Impact', sv: 'Departementets påverkan', da: 'Ministerielt ansvar',
      no: 'Departementspåvirkning', fi: 'Ministeriön vaikutus', de: 'Ressortverantwortung',
      fr: 'Impact ministériel', es: 'Impacto ministerial', nl: 'Ministeriële impact',
      ar: 'تأثير الوزارة', he: 'השפעת המשרד', ja: '省庁への影響', ko: '부처 영향', zh: '部门影响',
    };
    const diHeading = departmentImpactHeadings[lang as string] ?? departmentImpactHeadings['en'];
    content += `\n    <h2>${escapeHtml(diHeading)}</h2>\n`;
    content += `    <div class="department-impact"><ul>\n`;
    for (const dept of departments.slice(0, MAX_DISPLAY_ITEMS)) {
      const deptName = escapeHtml(String(dept['departement'] ?? dept['name'] ?? dept['namn'] ?? ''));
      const deptCount = Number(dept['count'] ?? dept['antal'] ?? 0);
      if (deptName) {
        content += `      <li>${deptName}${deptCount > 0 ? ` (${deptCount})` : ''}</li>\n`;
      }
    }
    content += `    </ul></div>\n`;
  }

  // ── Parliamentary Debate section (from search_anforanden) ─────────────────
  const speechDebates = data.speechDebates as Array<Record<string, unknown>> | undefined;
  if (speechDebates && speechDebates.length > 0) {
    const parliamentaryDebateHeadings: Record<string, string> = {
      en: 'Parliamentary Debate', sv: 'Parlamentarisk debatt', da: 'Parlamentarisk debat',
      no: 'Parlamentarisk debatt', fi: 'Parlamentaarinen keskustelu', de: 'Parlamentarische Debatte',
      fr: 'Débat parlementaire', es: 'Debate parlamentario', nl: 'Parlementair debat',
      ar: 'النقاش البرلماني', he: 'דיון פרלמנטרי', ja: '議会討論', ko: '의회 토론', zh: '议会辩论',
    };
    const pdHeading = parliamentaryDebateHeadings[lang as string] ?? parliamentaryDebateHeadings['en'];
    content += `\n    <h2>${escapeHtml(pdHeading)}</h2>\n`;
    content += `    <div class="debate-context">\n`;
    for (const speech of speechDebates.slice(0, MAX_DISPLAY_ITEMS)) {
      const speaker = escapeHtml(String(speech['talare'] ?? speech['speaker'] ?? ''));
      const party = escapeHtml(String(speech['parti'] ?? speech['party'] ?? ''));
      const text = escapeHtml(String(speech['anforandetext'] ?? speech['text'] ?? '').substring(0, MAX_SPEECH_PREVIEW_LENGTH));
      if (speaker && text) {
        content += `      <blockquote><p>${text}…</p><footer>— ${speaker}${party ? ` (${party})` : ''}</footer></blockquote>\n`;
      }
    }
    content += `    </div>\n`;
  }

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
      const topCName = escapeHtml(getCommitteeName(topC, lang));
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
        ? govTpl(topCName, topN)
        : `${topCName} receives ${topN} propositions — signalling government priority in this policy area.`;
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
