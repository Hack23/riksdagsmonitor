/**
 * @module data-transformers/content-generators/shared
 * @description Shared internal helpers and templates used by all content generators.
 * Contains TITLE_SUFFIX_TEMPLATES, keyword extraction, event/document matching helpers,
 * and the deep analysis section generator (5W framework).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { RawDocument, RawCalendarEvent, CIAContext } from '../types.js';
import { L, normalizePartyKey } from '../helpers.js';
import { detectPolicyDomains } from '../policy-analysis.js';

/** Per-language title-suffix templates for inverted-pyramid lede construction. */
export const TITLE_SUFFIX_TEMPLATES: Readonly<Record<string, (t: string) => string>> = {
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
export function findRelatedDocuments(event: RawCalendarEvent, documents: RawDocument[]): RawDocument[] {
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
export function findRelatedQuestions(event: RawCalendarEvent, questions: RawDocument[]): RawDocument[] {
  const keywords = extractKeywords(event.rubrik ?? event.titel ?? event.title ?? '');
  return questions.filter(q => {
    const qText = (q.titel ?? q.title ?? '').toLowerCase();
    return keywords.some(kw => qText.includes(kw));
  }).slice(0, 3);
}

/** Extract targeted minister name from interpellation summary "till MINISTER" header line.
 *  Strips trailing topic clauses ("om X", "angående Y", etc.) and punctuation. */
export function extractMinister(summary: string): string {
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

// ---------------------------------------------------------------------------
// Deep Analysis Section (5W Framework)
// ---------------------------------------------------------------------------

/** Options for generating the deep analysis section */
export interface DeepAnalysisOptions {
  documents: RawDocument[];
  lang: Language | string;
  cia?: CIAContext;
  articleType: string;
  /** Extra context sentences to inject into the "Why" subsection */
  whyContext?: string;
}

/**
 * Extract unique party names from a set of documents for "Who" analysis.
 */
function extractKeyActors(docs: RawDocument[]): { parties: Map<string, number>; authors: string[] } {
  const parties = new Map<string, number>();
  const authorSet = new Set<string>();

  for (const doc of docs) {
    const party = normalizePartyKey(doc.parti);
    if (party && party !== 'other') {
      parties.set(party, (parties.get(party) ?? 0) + 1);
    }
    const author = doc.intressent_namn || doc.author || '';
    if (author && author !== 'Unknown' && author.length > 1) {
      authorSet.add(author);
    }
  }

  return { parties, authors: Array.from(authorSet).slice(0, 8) };
}

/**
 * Aggregate policy domains across all documents for "What" analysis.
 */
function aggregateDomains(docs: RawDocument[], lang: Language | string): Map<string, number> {
  const domainCounts = new Map<string, number>();
  for (const doc of docs) {
    for (const domain of detectPolicyDomains(doc, lang)) {
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }
  }
  return domainCounts;
}

/**
 * Determine winners and losers based on document patterns and CIA context.
 */
function analyseWinnersLosers(
  docs: RawDocument[],
  cia: CIAContext | undefined,
  lang: Language | string,
): string {
  const parts: string[] = [];

  // Count government vs opposition documents
  const govDocs = docs.filter(d => d.doktyp === 'prop' || d.doktyp === 'bet' || d.doktyp === 'skr');
  const oppDocs = docs.filter(d => d.doktyp === 'mot');

  if (govDocs.length > 0 && oppDocs.length > 0) {
    const ratio = govDocs.length / Math.max(1, oppDocs.length);
    if (ratio > 2) {
      parts.push(govAdvantageText(lang, govDocs.length, oppDocs.length));
    } else if (ratio < 0.5) {
      parts.push(oppPressureText(lang, oppDocs.length));
    } else {
      parts.push(balancedText(lang));
    }
  }

  if (cia) {
    const margin = cia.coalitionStability?.majorityMargin ?? 0;
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (margin <= 3 && stability < 60) {
      parts.push(coalitionRiskText(lang, margin));
    }
  }

  return parts.join(' ') || neutralText(lang);
}

function govAdvantageText(lang: Language | string, gov: number, opp: number): string {
  const templates: Record<string, string> = {
    en: `The governing coalition holds the initiative with ${gov} legislative items versus ${opp} opposition motions, suggesting strong agenda control.`,
    sv: `Regeringskoalitionen håller initiativet med ${gov} lagstiftningsärenden mot ${opp} oppositionsyrkanden, vilket tyder på stark agendakontroll.`,
    da: `Regeringskoalitionen har initiativet med ${gov} lovgivningspunkter mod ${opp} oppositionsforslag.`,
    no: `Regjeringskoalisjonen holder initiativet med ${gov} lovforslag mot ${opp} opposisjonsforslag.`,
    fi: `Hallituskoalitio pitää aloitteen ${gov} lainsäädäntöasialla vastaan ${opp} opposition aloitetta.`,
    de: `Die Regierungskoalition hält die Initiative mit ${gov} Gesetzgebungspunkten gegenüber ${opp} Oppositionsanträgen.`,
    fr: `La coalition gouvernementale tient l'initiative avec ${gov} points législatifs contre ${opp} motions de l'opposition.`,
    es: `La coalición gobernante mantiene la iniciativa con ${gov} puntos legislativos frente a ${opp} mociones de la oposición.`,
    nl: `De regeringscoalitie houdt het initiatief met ${gov} wetgevingspunten versus ${opp} oppositiemoties.`,
    ar: `يحتفظ الائتلاف الحاكم بالمبادرة بـ${gov} بنداً تشريعياً مقابل ${opp} اقتراحات معارضة.`,
    he: `הקואליציה שומרת על היוזמה עם ${gov} סעיפי חקיקה מול ${opp} הצעות אופוזיציה.`,
    ja: `与党連合は${gov}の立法項目で主導権を握り、野党の${opp}動議に対して優位に立っています。`,
    ko: `여당 연합은 ${gov}건의 입법 항목으로 주도권을 유지하며, 야당의 ${opp}건 동의에 대해 우위를 보이고 있습니다.`,
    zh: `执政联盟以${gov}项立法议题保持主动权，对比反对党的${opp}项动议。`,
  };
  return templates[lang as string] ?? templates.en;
}

function oppPressureText(lang: Language | string, opp: number): string {
  const templates: Record<string, string> = {
    en: `The opposition is applying significant pressure with ${opp} motions, signalling broad dissatisfaction with government policy.`,
    sv: `Oppositionen utövar betydande tryck med ${opp} motioner, vilket signalerar brett missnöje med regeringens politik.`,
  };
  return templates[lang as string] ?? templates.en;
}

function balancedText(lang: Language | string): string {
  const templates: Record<string, string> = {
    en: 'The balance between government and opposition activity suggests a competitive legislative environment where neither side dominates.',
    sv: 'Balansen mellan regerings- och oppositionsaktivitet tyder på en konkurrensutsatt lagstiftningsmiljö.',
  };
  return templates[lang as string] ?? templates.en;
}

function coalitionRiskText(lang: Language | string, margin: number): string {
  const templates: Record<string, string> = {
    en: `With a majority margin of only ${margin} seats, the coalition faces elevated risk of legislative defeats on contested measures.`,
    sv: `Med en majoritetsmarginal på bara ${margin} mandat löper koalitionen förhöjd risk för nederlag vid omstridda omröstningar.`,
  };
  return templates[lang as string] ?? templates.en;
}

function neutralText(lang: Language | string): string {
  const templates: Record<string, string> = {
    en: 'The political landscape remains fluid, with both government and opposition positioning for advantage.',
    sv: 'Det politiska landskapet förblir rörligt, med både regering och opposition som positionerar sig.',
  };
  return templates[lang as string] ?? templates.en;
}

/**
 * Generate a comprehensive Deep Analysis section following the 5W framework
 * (Who, What, When, Why, Winners/Losers) plus impact, consequences, and critical
 * assessment subsections. This section is designed for highly analytical readers
 * who seek multi-perspective intelligence on parliamentary developments.
 *
 * @returns HTML string for the deep analysis section, or empty string if insufficient data
 */
export function generateDeepAnalysisSection(opts: DeepAnalysisOptions): string {
  const { documents, lang, cia, articleType, whyContext } = opts;

  // Deep analysis requires at least 2 documents to produce meaningful
  // cross-document insights (actor patterns, domain aggregation, etc.).
  // Single-document analysis is already handled by per-entry "Why It Matters".
  if (!documents || documents.length < 2) return '';

  const lbl = (key: string): string => {
    const val = L(lang, key);
    return typeof val === 'string' ? val : key;
  };

  const parts: string[] = [];
  parts.push(`\n    <section class="deep-analysis" aria-label="${escapeHtml(lbl('deepAnalysis'))}">`);
  parts.push(`    <h2>${escapeHtml(lbl('deepAnalysis'))}</h2>`);

  // ── WHO: Key Actors ────────────────────────────────────────────────────────
  const { parties, authors } = extractKeyActors(documents);
  if (parties.size > 0 || authors.length > 0) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWho'))}</h3>`);
    if (parties.size > 0) {
      const sortedParties = [...parties.entries()].sort((a, b) => b[1] - a[1]);
      const partyList = sortedParties
        .map(([p, count]) => `<strong>${escapeHtml(p)}</strong> (${count})`)
        .join(', ');
      parts.push(`    <p>${partyList}</p>`);
    }
    if (authors.length > 0) {
      parts.push(`    <p>${authors.map(a => escapeHtml(a)).join(', ')}</p>`);
    }
  }

  // ── WHAT: What Happened ────────────────────────────────────────────────────
  const domains = aggregateDomains(documents, lang);
  if (domains.size > 0) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhat'))}</h3>`);
    const sortedDomains = [...domains.entries()].sort((a, b) => b[1] - a[1]);
    const domainItems = sortedDomains.slice(0, 6)
      .map(([d, c]) => `${escapeHtml(d)} (${c})`)
      .join(', ');
    const docTypes = new Map<string, number>();
    for (const doc of documents) {
      const t = doc.doktyp || doc.documentType || 'other';
      docTypes.set(t, (docTypes.get(t) ?? 0) + 1);
    }
    const typeList = [...docTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${escapeHtml(t)}: ${c}`)
      .join(', ');
    parts.push(`    <p>${domainItems}</p>`);
    parts.push(`    <p><em>${typeList}</em></p>`);
  }

  // ── WHEN: Timeline & Context ───────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhen'))}</h3>`);
  const timelineContext = generateTimelineContext(documents, lang, articleType);
  parts.push(`    <p>${timelineContext}</p>`);

  // ── WHY: Why This Matters ──────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhy'))}</h3>`);
  const whyText = generateWhyAnalysis(documents, lang, cia, whyContext);
  parts.push(`    <p>${whyText}</p>`);

  // ── WINNERS & LOSERS ───────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWinners'))}</h3>`);
  const winnersText = analyseWinnersLosers(documents, cia, lang);
  parts.push(`    <p>${winnersText}</p>`);

  // ── POLITICAL IMPACT ───────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisImpact'))}</h3>`);
  const impactText = generateImpactAnalysis(documents, lang, cia);
  parts.push(`    <p>${impactText}</p>`);

  // ── ACTIONS & CONSEQUENCES ─────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisConsequences'))}</h3>`);
  const consequencesText = generateConsequencesAnalysis(documents, lang, articleType);
  parts.push(`    <p>${consequencesText}</p>`);

  // ── CRITICAL ASSESSMENT ────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisCritical'))}</h3>`);
  const criticalText = generateCriticalAssessment(documents, lang, cia);
  parts.push(`    <p>${criticalText}</p>`);

  // ── MULTIPLE PERSPECTIVES ──────────────────────────────────────────────────
  if (parties.size >= 2) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisPerspectives'))}</h3>`);
    const perspectivesText = generatePerspectivesAnalysis(documents, lang, parties);
    parts.push(`    <p>${perspectivesText}</p>`);
  }

  parts.push('    </section>\n');
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Deep Analysis subsection generators
// ---------------------------------------------------------------------------

function generateTimelineContext(docs: RawDocument[], lang: Language | string, articleType: string): string {
  const count = docs.length;
  const committees = new Set(docs.map(d => d.organ || d.committee || '').filter(Boolean));

  const prospective = articleType.includes('ahead');
  const retrospective = articleType.includes('review');

  const templates: Record<string, Record<string, string>> = {
    en: {
      prospective: `${count} items are scheduled across ${committees.size} committee${committees.size !== 1 ? 's' : ''}, creating a dense legislative calendar that demands close monitoring. Each item moves through committee review and chamber debate — timing and sequencing will determine which issues reach a vote.`,
      retrospective: `Over the review period, ${count} parliamentary actions were recorded across ${committees.size} committee${committees.size !== 1 ? 's' : ''}. The volume and distribution of activity reveals the government's priorities and the opposition's strategic responses.`,
      default: `${count} parliamentary items across ${committees.size} active committee${committees.size !== 1 ? 's' : ''} define the current legislative landscape. The pace of activity signals the political urgency driving these proceedings.`,
    },
    sv: {
      prospective: `${count} ärenden är planerade i ${committees.size} utskott, vilket skapar en tät lagstiftningskalender som kräver noggrann bevakning.`,
      retrospective: `Under granskningsperioden registrerades ${count} parlamentariska åtgärder i ${committees.size} utskott. Volymen och fördelningen avslöjar regeringens prioriteringar.`,
      default: `${count} riksdagsärenden i ${committees.size} aktiva utskott definierar det aktuella lagstiftningslandskapet.`,
    },
  };

  const langTemplates = templates[lang as string] ?? templates.en;
  const key = prospective ? 'prospective' : retrospective ? 'retrospective' : 'default';
  return langTemplates[key] ?? langTemplates.default;
}

function generateWhyAnalysis(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined, extraContext?: string): string {
  const parts: string[] = [];

  // Domain breadth signals policy ambition
  const domains = aggregateDomains(docs, lang);
  const domainCount = domains.size;
  if (domainCount >= 4) {
    parts.push(broadAgendaText(lang, domainCount));
  } else if (domainCount >= 2) {
    parts.push(focusedAgendaText(lang, domainCount));
  }

  // Coalition stability context
  if (cia) {
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (stability < 50) {
      parts.push(instabilityText(lang));
    }
  }

  if (extraContext) {
    parts.push(extraContext);
  }

  if (parts.length === 0) {
    parts.push(defaultWhyText(lang));
  }

  return parts.join(' ');
}

function broadAgendaText(lang: Language | string, n: number): string {
  const templates: Record<string, string> = {
    en: `With ${n} policy domains in play, this represents a broad legislative push that will shape multiple aspects of Swedish society. The breadth of activity makes this a critical period for understanding the government's strategic direction.`,
    sv: `Med ${n} politikområden i spel representerar detta en bred lagstiftningssatsning som kommer att forma flera aspekter av det svenska samhället.`,
  };
  return templates[lang as string] ?? templates.en;
}

function focusedAgendaText(lang: Language | string, n: number): string {
  const templates: Record<string, string> = {
    en: `Activity concentrated in ${n} policy domains suggests targeted legislative priorities rather than broad reform, making each initiative particularly consequential.`,
    sv: `Aktivitet koncentrerad till ${n} politikområden tyder på riktade lagstiftningsprioriteringar snarare än bred reform.`,
  };
  return templates[lang as string] ?? templates.en;
}

function instabilityText(lang: Language | string): string {
  const templates: Record<string, string> = {
    en: 'The current coalition instability adds significant uncertainty to all legislative proceedings. Any controversial measure could become a confidence test.',
    sv: 'Den nuvarande koalitionsinstabiliteten tillför betydande osäkerhet till alla lagstiftningsförfaranden.',
  };
  return templates[lang as string] ?? templates.en;
}

function defaultWhyText(lang: Language | string): string {
  const templates: Record<string, string> = {
    en: 'These parliamentary developments carry significance for Swedish governance, reflecting ongoing policy debates and power dynamics within the Riksdag.',
    sv: 'Dessa riksdagshändelser har betydelse för svensk styrning och speglar pågående politiska debatter och maktdynamik.',
  };
  return templates[lang as string] ?? templates.en;
}

function generateImpactAnalysis(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined): string {
  const parts: string[] = [];

  const propCount = docs.filter(d => d.doktyp === 'prop').length;
  const motCount = docs.filter(d => d.doktyp === 'mot').length;
  const betCount = docs.filter(d => d.doktyp === 'bet').length;

  if (propCount > 0) {
    parts.push(propImpactText(lang, propCount));
  }
  if (betCount > 0) {
    parts.push(betImpactText(lang, betCount));
  }
  if (motCount > 0) {
    parts.push(motImpactText(lang, motCount));
  }

  if (cia) {
    const margin = cia.coalitionStability?.majorityMargin ?? 0;
    if (margin <= 5) {
      parts.push(thinMajorityImpactText(lang, margin));
    }
  }

  return parts.join(' ') || genericImpactText(lang);
}

function propImpactText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `${n} government proposition${n !== 1 ? 's' : ''} will, if adopted, directly alter Swedish law and policy, affecting citizens, businesses, and institutions.`,
    sv: `${n} regeringsproposition${n !== 1 ? 'er' : ''} kommer, om de antas, att direkt ändra svensk lag och politik.`,
  };
  return t[lang as string] ?? t.en;
}

function betImpactText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `${n} committee report${n !== 1 ? 's' : ''} represent${n === 1 ? 's' : ''} the culmination of legislative review, with recommendations that guide chamber votes.`,
    sv: `${n} betänkande${n !== 1 ? 'n' : ''} representerar kulmen av lagstiftningsöversynen.`,
  };
  return t[lang as string] ?? t.en;
}

function motImpactText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `${n} opposition motion${n !== 1 ? 's' : ''} challenge${n === 1 ? 's' : ''} the government's position, even though most motions are historically rejected; they signal future electoral battlegrounds.`,
    sv: `${n} oppositionsmotion${n !== 1 ? 'er' : ''} utmanar regeringens position och signalerar framtida valfrågor.`,
  };
  return t[lang as string] ?? t.en;
}

function thinMajorityImpactText(lang: Language | string, margin: number): string {
  const t: Record<string, string> = {
    en: `The thin majority margin of ${margin} seat${margin !== 1 ? 's' : ''} means any defection could defeat government measures, amplifying the political stakes.`,
    sv: `Den tunna majoritetsmarginal på ${margin} mandat innebär att varje avhopp kan fälla regeringens förslag.`,
  };
  return t[lang as string] ?? t.en;
}

function genericImpactText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'The legislative activity reflects the ongoing interplay between governing ambition and opposition scrutiny that characterises Swedish parliamentary democracy.',
    sv: 'Lagstiftningsaktiviteten speglar det pågående samspelet mellan regeringsambitioner och oppositionens granskning.',
  };
  return t[lang as string] ?? t.en;
}

function generateConsequencesAnalysis(docs: RawDocument[], lang: Language | string, articleType: string): string {
  const propCount = docs.filter(d => d.doktyp === 'prop').length;
  const motCount = docs.filter(d => d.doktyp === 'mot').length;
  const parts: string[] = [];

  if (propCount > 0) {
    parts.push(propConsequencesText(lang, propCount));
  }
  if (motCount > 0) {
    parts.push(motConsequencesText(lang, motCount));
  }
  if (parts.length === 0) {
    parts.push(genericConsequencesText(lang));
  }
  return parts.join(' ');
}

function propConsequencesText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `If adopted, these ${n} proposition${n !== 1 ? 's' : ''} will trigger implementation across government agencies, requiring regulatory changes, budget allocations, and administrative adaptation. Failure to pass would signal coalition weakness and embolden the opposition.`,
    sv: `Om de antas kommer dessa ${n} proposition${n !== 1 ? 'er' : ''} att utlösa implementering i myndigheter, kräva regeländringar och budgetanpassningar.`,
  };
  return t[lang as string] ?? t.en;
}

function motConsequencesText(lang: Language | string, n: number): string {
  const t: Record<string, string> = {
    en: `The ${n} opposition motion${n !== 1 ? 's' : ''}, while likely to be rejected, establish the policy alternatives that opposition parties will champion in the next election cycle. Rejection does not diminish their strategic value as campaign ammunition.`,
    sv: `De ${n} oppositionsmotion${n !== 1 ? 'erna' : 'en'}, även om de troligen avslås, etablerar policyalternativ för nästa valcykel.`,
  };
  return t[lang as string] ?? t.en;
}

function genericConsequencesText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'The outcomes of these proceedings will cascade through committee deliberations, chamber votes, and ultimately into policy implementation — or be shelved, affecting political credibility and future legislative strategy.',
    sv: 'Resultaten av dessa ärenden kommer att kaskadgenomslag genom utskottsbehandling, kammarröstning och slutligen policyimplementering.',
  };
  return t[lang as string] ?? t.en;
}

function generateCriticalAssessment(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined): string {
  const parts: string[] = [];

  // Check for single-party dominance in motions (potential echo chamber)
  const motionParties = new Map<string, number>();
  docs.filter(d => d.doktyp === 'mot').forEach(d => {
    const p = normalizePartyKey(d.parti);
    if (p && p !== 'other') motionParties.set(p, (motionParties.get(p) ?? 0) + 1);
  });
  const totalMotions = [...motionParties.values()].reduce((a, b) => a + b, 0);
  if (motionParties.size === 1 && totalMotions > 3) {
    parts.push(singlePartyDominanceText(lang));
  }

  // Check for lack of debate data (information gap)
  const withSpeeches = docs.filter(d => d.speeches && d.speeches.length > 0).length;
  if (withSpeeches === 0 && docs.length > 3) {
    parts.push(noDebateDataText(lang));
  }

  // Thin majority risk assessment
  if (cia) {
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (stability < 40) {
      parts.push(criticalStabilityText(lang));
    }
  }

  if (parts.length === 0) {
    parts.push(defaultCriticalText(lang));
  }

  return parts.join(' ');
}

function singlePartyDominanceText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'Opposition activity is dominated by a single party, which may indicate either strategic focus or a failure of other parties to engage. Watch for whether this concentration reflects genuine policy leadership or internal opposition dysfunction.',
    sv: 'Oppositionsaktiviteten domineras av ett enda parti, vilket kan tyda på antingen strategiskt fokus eller andra partiers misslyckande att engagera sig.',
  };
  return t[lang as string] ?? t.en;
}

function noDebateDataText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'No chamber debate data is available for these items, limiting our ability to assess the depth of parliamentary deliberation. This information gap should be monitored — the quality of democracy depends on substantive debate, not just procedural passage.',
    sv: 'Inga debattdata från kammaren finns tillgängliga, vilket begränsar vår förmåga att bedöma parlamentariskt deliberationsdjup.',
  };
  return t[lang as string] ?? t.en;
}

function criticalStabilityText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'Coalition stability has deteriorated to critical levels. The risk of a government crisis is non-trivial, and any procedural surprise could trigger a confidence vote. All legislative analysis must be read through this lens of instability.',
    sv: 'Koalitionsstabiliteten har försämrats till kritiska nivåer. Risken för en regeringskris är icke-trivial.',
  };
  return t[lang as string] ?? t.en;
}

function defaultCriticalText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'Standard parliamentary procedures are being followed, but vigilance is warranted. The gap between legislative intent and implementation often reveals the true political winners and losers. Monitor committee amendments and chamber debate quality for the full picture.',
    sv: 'Standardiserade parlamentariska förfaranden följs, men vaksamhet är motiverad. Klyftan mellan lagstiftningsavsikt och implementering avslöjar ofta de verkliga vinnarna och förlorarna.',
  };
  return t[lang as string] ?? t.en;
}

function generatePerspectivesAnalysis(docs: RawDocument[], lang: Language | string, parties: Map<string, number>): string {
  const sortedParties = [...parties.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const partyAnalyses: string[] = [];

  for (const [party, count] of sortedParties) {
    const partyDocs = docs.filter(d => normalizePartyKey(d.parti) === party);
    const partyDomains = aggregateDomains(partyDocs, lang);
    const topDomains = [...partyDomains.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([d]) => d);
    if (topDomains.length > 0) {
      partyAnalyses.push(
        `<strong>${escapeHtml(party)}</strong> (${count}): ${topDomains.map(d => escapeHtml(d)).join(', ')}`
      );
    } else {
      partyAnalyses.push(`<strong>${escapeHtml(party)}</strong> (${count})`);
    }
  }

  if (partyAnalyses.length === 0) return '';
  return partyAnalyses.join(' · ');
}
