/**
 * @module data-transformers/content-generators/propositions
 * @description Generator for "propositions" article content. Renders government propositions
 * with policy significance, grouped by committee where applicable.
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
  normalizePartyKey,
  generateEnhancedSummary,
  formatDocumentDate,
} from '../helpers.js';
import { detectPolicyDomains, generatePolicySignificance, generateDeepPolicyAnalysis } from '../policy-analysis.js';
import {
  groupMotionsByProposition,
  groupPropositionsByCommittee,
  generateOppositionStrategySection,
  renderMotionEntry,
  generateDocumentIntelligenceAnalysis,
  PROP_TITLE_SUFFIX_REGEX,
} from '../document-analysis.js';
import { generateDeepAnalysisSection } from './shared.js';

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
      const dateHtml = formatDocumentDate(prop, lang);

      content += `
    <div class="proposition-entry">
      <${headingTag}>${titleHtml}</${headingTag}>${dateHtml ? `\n      <p>${dateHtml}</p>` : ''}
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

  // Deep Analysis section (5W framework)
  content += generateDeepAnalysisSection({
    documents: propositions,
    lang,
    cia: data.ciaContext,
    articleType: 'propositions',
  });

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

