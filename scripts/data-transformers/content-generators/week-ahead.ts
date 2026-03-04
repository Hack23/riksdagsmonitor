/**
 * @module data-transformers/content-generators/week-ahead
 * @description Generator for "week-ahead" article content. Transforms calendar events,
 * legislative documents, questions, and interpellations into narrative HTML.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { WeekAheadData } from '../types.js';
import { getPillarTransition } from '../../editorial-pillars.js';
import {
  L,
  svSpan,
  sanitizeUrl,
  isHighPriority,
  formatDayName,
  formatDocumentDate,
} from '../helpers.js';
import { detectPolicyDomains, generatePolicySignificance } from '../policy-analysis.js';
import { findRelatedDocuments, findRelatedQuestions, extractMinister, generateDeepAnalysisSection } from './shared.js';

export function generateWeekAheadContent(data: WeekAheadData, lang: Language | string): string {
  const { events, highlights, context } = data;
  const documents = data.documents ?? [];
  const questions = data.questions ?? [];
  const interpellations = data.interpellations ?? [];

  let content = '';

  // Introduction section
  content += `
    <div class="context-box">
      <h3>${L(lang, 'whyMatters')}</h3>
      <p>${escapeHtml(context || String(L(lang, 'whyMattersDefault')))}</p>
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

      const dayPrefix = dayName ? escapeHtml(dayName) + ' - ' : '';
      content += `
    <h3>${dayPrefix}${titleHtml}</h3>
    <p>${escapeHtml(event.description || `${eventTime}: ${event.details || 'Parliamentary session scheduled.'}`)}</p>
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
      const dateHtml = formatDocumentDate(doc as import('../types.js').RawDocument, lang);
      if (dateHtml) content += `      <p>${dateHtml}</p>\n`;
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
      if (party) content += `      <p class="policy-significance">${party}</p>\n`;
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
      const cleanedSummary = (tillMatch
        ? rawSummary.slice(rawSummary.indexOf(tillMatch[0]) + tillMatch[0].length)
        : rawSummary
            .replace(/^Interpellation\s+\S+[^\n]*\n\s*/i, '')
            .replace(/^\s*av\s+[^\n]+\n\s*/i, '')
            .replace(/^\s*till\s+[^\n]+\n\s*/i, ''))
        .trim()
        .slice(0, 200);
      content += `    <div class="document-entry">\n`;
      content += `      <h4>${iUrl ? `<a href="${iUrl}" target="_blank" rel="noopener noreferrer">` : ''}${svSpan(escapeHtml(titleText), lang)}${iUrl ? '</a>' : ''}</h4>\n`;
      if (party) content += `      <p class="policy-significance">${party}</p>\n`;
      if (ministerName) content += `      <p class="minister-target">→ ${svSpan(escapeHtml(ministerName), lang)}</p>\n`;
      if (cleanedSummary) content += `      <p>${svSpan(escapeHtml(cleanedSummary) + '…', lang)}</p>\n`;
      content += `    </div>\n`;
    });
  }

  // Additional context
  if (highlights && highlights.length > 0) {
    content += `\n    <h2>${L(lang, 'whatToWatch')}</h2>\n    <ul>\n`;

    highlights.forEach(highlight => {
      content += `      <li><strong>${escapeHtml(highlight.title)}:</strong> ${escapeHtml(highlight.description)}</li>\n`;
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
    // Deep Analysis section (5W framework) — synthesize all documents
    const allWeekDocs = [...documents, ...questions, ...interpellations];
    const weekCia = data.ciaContext;
    content += generateDeepAnalysisSection({
      documents: allWeekDocs,
      lang,
      cia: weekCia,
      articleType: 'week-ahead',
    });

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

