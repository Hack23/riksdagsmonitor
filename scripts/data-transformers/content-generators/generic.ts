/**
 * @module data-transformers/content-generators/generic
 * @description Generator for "generic" article content (weekly-review, breaking, etc.).
 * Renders a flexible narrative combining all available data sources.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { ArticleContentData, RawDocument } from '../types.js';
import { getPillarTransition } from '../../editorial-pillars.js';
import {
  L,
  svSpan,
  sanitizeUrl,
  getCommitteeName,
  normalizePartyKey,
} from '../helpers.js';
import { detectPolicyDomains, generatePolicySignificance, generateDeepPolicyAnalysis } from '../policy-analysis.js';
import {
  groupMotionsByProposition,
  groupPropositionsByCommittee,
  generateOppositionStrategySection,
  renderMotionEntry,
  generateDocumentIntelligenceAnalysis,
} from '../document-analysis.js';
import { TITLE_SUFFIX_TEMPLATES, generateDeepAnalysisSection } from './shared.js';

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

  // Deep Analysis section (5W framework)
  content += generateDeepAnalysisSection({
    documents: docs,
    lang,
    cia,
    articleType: 'generic',
  });

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

