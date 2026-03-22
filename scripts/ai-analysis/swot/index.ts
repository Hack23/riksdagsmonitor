/**
 * @module ai-analysis/swot
 * @description SWOT bounded context – stakeholder SWOT matrix construction,
 *              enrichment and confidence scoring.
 * @license Apache-2.0
 * @author Hack23 AB
 */

import type { Language } from '../../types/language.js';
import type { RawDocument } from '../../data-transformers/types.js';
import { detectPolicyDomains, getDomainSpecificAnalysis } from '../../data-transformers/policy-analysis.js';
import { localizeDocType } from '../../data-transformers/content-generators/index.js';
import {
  type LangRecord,
  docType,
  docTitle,
  docId,
  isSfsDoc,
  normalizedDocType,
  isMetadataEnriched,
  hasFullTextContent,
  extractPassage,
} from '../helpers.js';
import type {
  AnalysisSwotEntry,
  AnalysisStakeholderSwot,
  KnownStakeholderRole,
  SwotQuadrant,
} from '../types.js';
import { buildPlaceholderText } from './placeholders.js';

/* ------------------------------------------------------------------ */
/*  Localised stakeholder name records                                 */
/* ------------------------------------------------------------------ */

export const GOV_NAMES: LangRecord = {
  en: 'Government / Policy Administration', sv: 'Regering / Policyförvaltning',
  da: 'Regering / Politisk forvaltning', no: 'Regjering / Politisk forvaltning',
  fi: 'Hallitus / Poliittinen hallinto', de: 'Regierung / Politikverwaltung',
  fr: 'Gouvernement / Administration', es: 'Gobierno / Administración pública',
  nl: 'Regering / Beleidsadministratie', ar: 'الحكومة / الإدارة السياسية',
  he: 'ממשלה / מינהל מדיניות', ja: '政府 / 政策行政', ko: '정부 / 정책 행정', zh: '政府 / 政策管理',
};

export const OPP_NAMES: LangRecord = {
  en: 'Parliament / Opposition', sv: 'Riksdag / Opposition',
  da: 'Folketing / Opposition', no: 'Storting / Opposisjon',
  fi: 'Eduskunta / Oppositio', de: 'Parlament / Opposition',
  fr: 'Parlement / Opposition', es: 'Parlamento / Oposición',
  nl: 'Parlement / Oppositie', ar: 'البرلمان / المعارضة',
  he: 'פרלמנט / אופוזיציה', ja: '議会 / 野党', ko: '의회 / 야당', zh: '议会 / 反对派',
};

export const PRIVATE_NAMES: LangRecord = {
  en: 'Private Sector / Civil Society', sv: 'Privat sektor / Civilsamhälle',
  da: 'Privat sektor / Civilsamfund', no: 'Privat sektor / Sivilsamfunn',
  fi: 'Yksityissektori / Kansalaisyhteiskunta', de: 'Privatsektor / Zivilgesellschaft',
  fr: 'Secteur privé / Société civile', es: 'Sector privado / Sociedad civil',
  nl: 'Privésector / Maatschappelijk middenveld', ar: 'القطاع الخاص / المجتمع المدني',
  he: 'המגזר הפרטי / החברה האזרחית', ja: '民間セクター / 市民社会', ko: '민간 부문 / 시민 사회', zh: '私营部门 / 民间社会',
};

/* ------------------------------------------------------------------ */
/*  Helper functions                                                   */
/* ------------------------------------------------------------------ */

/** Small localised phrase: "relevant to" / "relevant för" … */
function relevantLabel(lang: Language): string {
  const map: LangRecord = {
    en: 'relevant to', sv: 'relevant för', da: 'relevant for', no: 'relevant for',
    fi: 'liittyy', de: 'relevant für', fr: 'pertinent pour', es: 'relevante para',
    nl: 'relevant voor', ar: 'ذو صلة بـ', he: 'רלוונטי ל', ja: 'に関連:', ko: '관련:', zh: '相关:',
  };
  return map[lang] ?? 'relevant to';
}

/** Derive impact from document type. */
export function impactFromDocType(dt: string): 'high' | 'medium' | 'low' {
  if (['prop', 'sfs', 'bet', 'fpm', 'eu'].includes(dt)) return 'high';
  if (['mot', 'skr', 'pressm', 'ip'].includes(dt)) return 'medium';
  return 'low';
}

/** Return a SwotEntry text built from a document title. */
function entryFromDoc(doc: RawDocument, topic: string | null, lang: Language): string {
  const title = docTitle(doc);
  const type = normalizedDocType(doc);
  const typeLabel = type && type !== 'other' ? localizeDocType(type, lang, 1) : '';
  if (topic) {
    const relevance = relevantLabel(lang);
    return typeLabel
      ? `${typeLabel}: ${title} — ${relevance} ${topic}`
      : `${title} — ${relevance} ${topic}`;
  }
  return typeLabel ? `${typeLabel}: ${title}` : title;
}

/* ------------------------------------------------------------------ */
/*  Entry builder functions                                            */
/* ------------------------------------------------------------------ */

/** Build a content-derived SWOT entry from full-text passage when available. */
export function buildEnrichedEntry(
  doc: RawDocument,
  topic: string | null,
  lang: Language,
  passageMaxChars: number,
): AnalysisSwotEntry {
  const passage = extractPassage(doc, passageMaxChars);
  const type = normalizedDocType(doc);
  const domainAnalysis = detectPolicyDomains(doc, lang);
  const domainText = domainAnalysis.length > 0
    ? getDomainSpecificAnalysis(domainAnalysis[0]!, type, lang)
    : '';
  let text: string;
  if (passage) {
    text = domainText ? `${passage} — ${domainText}` : passage;
  } else {
    text = entryFromDoc(doc, topic, lang);
    if (domainText) text = `${text}. ${domainText}`;
  }
  return {
    text,
    impact: impactFromDocType(type),
    sourceDocIds: [docId(doc)].filter(Boolean),
    confidence: passage ? 'HIGH' : isMetadataEnriched(doc) ? 'MEDIUM' : 'LOW',
  };
}

/** Build a structural placeholder entry when no documents exist for a quadrant. */
export function placeholderEntry(
  role: KnownStakeholderRole,
  quadrant: SwotQuadrant,
  topic: string | null,
  lang: Language,
  domains: string[],
): AnalysisSwotEntry {
  const primaryDomain = domains[0] ?? null;
  const text = buildPlaceholderText(role, quadrant, topic, primaryDomain, lang);
  return {
    text,
    impact: quadrant === 'strengths' || quadrant === 'opportunities' ? 'medium' : 'low',
    sourceDocIds: [],
    confidence: 'LOW',
  };
}

/* ------------------------------------------------------------------ */
/*  Main stakeholder SWOT builder                                      */
/* ------------------------------------------------------------------ */

/**
 * Build the three-stakeholder SWOT matrix from classified documents.
 *
 * @param docs - Raw documents to classify
 * @param topic - Optional focus topic
 * @param lang - Target language
 * @param domains - Detected policy domains
 * @returns Array of three stakeholder SWOT analyses
 */
export function buildStakeholderSwot(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
  domains: string[],
): AnalysisStakeholderSwot[] {
  // Classify documents by type
  const propDocs    = docs.filter(d => docType(d) === 'prop');
  const betDocs     = docs.filter(d => docType(d) === 'bet');
  const motDocs     = docs.filter(d => docType(d) === 'mot');
  const skrDocs     = docs.filter(d => docType(d) === 'skr');
  const sfsDocs     = docs.filter(isSfsDoc);
  const euDocs      = docs.filter(d => docType(d) === 'fpm' || docType(d) === 'eu');
  const pressmDocs  = docs.filter(d => docType(d) === 'pressm');
  const extDocs     = docs.filter(d => docType(d) === 'ext');
  const ipDocs      = docs.filter(d => docType(d) === 'ip');
  let govThreatIpDocs = ipDocs.slice(2, 4);
  let oppOpportunityIpDocs = ipDocs.slice(2, 3);
  if (ipDocs.length < 3) {
    govThreatIpDocs = ipDocs.length === 2 ? ipDocs.slice(1, 2) : ipDocs.slice(0, 1);
    oppOpportunityIpDocs = ipDocs.slice(0, 1);
  }

  // ── Government stakeholder SWOT
  const govStrengths: AnalysisSwotEntry[] = [
    ...propDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...sfsDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...skrDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...pressmDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govWeaknesses: AnalysisSwotEntry[] = [
    ...betDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...ipDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govOpportunities: AnalysisSwotEntry[] = [
    ...euDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...skrDocs.slice(1, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govThreats: AnalysisSwotEntry[] = [
    ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...govThreatIpDocs.map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];

  if (govStrengths.length === 0)    govStrengths.push(placeholderEntry('government', 'strengths', topic, lang, domains));
  if (govWeaknesses.length === 0)   govWeaknesses.push(placeholderEntry('government', 'weaknesses', topic, lang, domains));
  if (govOpportunities.length === 0) govOpportunities.push(placeholderEntry('government', 'opportunities', topic, lang, domains));
  if (govThreats.length === 0)      govThreats.push(placeholderEntry('government', 'threats', topic, lang, domains));

  // ── Parliament / Opposition SWOT
  const oppStrengths: AnalysisSwotEntry[] = [
    ...betDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...ipDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const oppWeaknesses: AnalysisSwotEntry[] = [];
  const oppOpportunities: AnalysisSwotEntry[] = [
    ...oppOpportunityIpDocs.map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const oppThreats: AnalysisSwotEntry[] = [
    ...propDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];

  if (oppStrengths.length === 0)    oppStrengths.push(placeholderEntry('parliament', 'strengths', topic, lang, domains));
  if (oppWeaknesses.length === 0)   oppWeaknesses.push(placeholderEntry('parliament', 'weaknesses', topic, lang, domains));
  if (oppOpportunities.length === 0) oppOpportunities.push(placeholderEntry('parliament', 'opportunities', topic, lang, domains));
  if (oppThreats.length === 0)      oppThreats.push(placeholderEntry('parliament', 'threats', topic, lang, domains));

  // ── Private Sector / Civil Society SWOT
  const privateStrengths: AnalysisSwotEntry[] = [
    ...sfsDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...extDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const privateWeaknesses: AnalysisSwotEntry[] = [];
  const privateOpportunities: AnalysisSwotEntry[] = [
    ...euDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const privateThreats: AnalysisSwotEntry[] = [];

  if (privateStrengths.length === 0)    privateStrengths.push(placeholderEntry('private-sector', 'strengths', topic, lang, domains));
  if (privateWeaknesses.length === 0)   privateWeaknesses.push(placeholderEntry('private-sector', 'weaknesses', topic, lang, domains));
  if (privateOpportunities.length === 0) privateOpportunities.push(placeholderEntry('private-sector', 'opportunities', topic, lang, domains));
  if (privateThreats.length === 0)      privateThreats.push(placeholderEntry('private-sector', 'threats', topic, lang, domains));

  return [
    {
      name: GOV_NAMES[lang] ?? GOV_NAMES.en!,
      role: 'government',
      swot: { strengths: govStrengths, weaknesses: govWeaknesses, opportunities: govOpportunities, threats: govThreats },
    },
    {
      name: OPP_NAMES[lang] ?? OPP_NAMES.en!,
      role: 'parliament',
      swot: { strengths: oppStrengths, weaknesses: oppWeaknesses, opportunities: oppOpportunities, threats: oppThreats },
    },
    {
      name: PRIVATE_NAMES[lang] ?? PRIVATE_NAMES.en!,
      role: 'private-sector',
      swot: { strengths: privateStrengths, weaknesses: privateWeaknesses, opportunities: privateOpportunities, threats: privateThreats },
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Refinement                                                         */
/* ------------------------------------------------------------------ */

/**
 * Refine stakeholder SWOT entries using full-text document content.
 * Replaces metadata-derived entries with richer passage-based entries
 * when full text is available.
 *
 * @param initial - Current stakeholder SWOT array
 * @param fullTextDocs - Documents with full-text content
 * @param topic - Optional focus topic
 * @param lang - Target language
 * @returns Refined stakeholder SWOT array
 */
export function refineStakeholderSwot(
  initial: AnalysisStakeholderSwot[],
  fullTextDocs: RawDocument[],
  topic: string | null,
  lang: Language,
): AnalysisStakeholderSwot[] {
  const passageMax = 400;

  const propDocs   = fullTextDocs.filter(d => docType(d) === 'prop');
  const betDocs    = fullTextDocs.filter(d => docType(d) === 'bet');
  const motDocs    = fullTextDocs.filter(d => docType(d) === 'mot');
  const sfsDocs    = fullTextDocs.filter(isSfsDoc);
  const euDocs     = fullTextDocs.filter(d => docType(d) === 'fpm' || docType(d) === 'eu');
  const pressmDocs = fullTextDocs.filter(d => docType(d) === 'pressm');
  const extDocs    = fullTextDocs.filter(d => docType(d) === 'ext');
  const skrDocs    = fullTextDocs.filter(d => docType(d) === 'skr');
  const ipDocs     = fullTextDocs.filter(d => docType(d) === 'ip');

  return initial.map(sh => {
    if (sh.role === 'government') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...propDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...sfsDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...skrDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...pressmDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedWeaknesses: AnalysisSwotEntry[] = [
        ...betDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...ipDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedOpportunities: AnalysisSwotEntry[] = [
        ...euDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...skrDocs.slice(1, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedThreats: AnalysisSwotEntry[] = [
        ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...ipDocs.slice(2, 4).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      return {
        ...sh,
        swot: {
          strengths:     enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          weaknesses:    enrichedWeaknesses.length > 0 ? enrichedWeaknesses : sh.swot.weaknesses,
          opportunities: enrichedOpportunities.length > 0 ? enrichedOpportunities : sh.swot.opportunities,
          threats:       enrichedThreats.length > 0 ? enrichedThreats : sh.swot.threats,
        },
      };
    }
    if (sh.role === 'parliament') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...betDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...ipDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedThreats: AnalysisSwotEntry[] = propDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax));
      return {
        ...sh,
        swot: {
          ...sh.swot,
          strengths: enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          threats:   enrichedThreats.length > 0 ? enrichedThreats : sh.swot.threats,
        },
      };
    }
    if (sh.role === 'private-sector') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...sfsDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...extDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedOpportunities: AnalysisSwotEntry[] = euDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax));
      return {
        ...sh,
        swot: {
          ...sh.swot,
          strengths:     enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          opportunities: enrichedOpportunities.length > 0 ? enrichedOpportunities : sh.swot.opportunities,
        },
      };
    }
    return sh;
  });
}

/* ------------------------------------------------------------------ */
/*  Confidence scoring                                                 */
/* ------------------------------------------------------------------ */

/**
 * Calculate confidence score (0-100) calibrated on both document evidence
 * quality **and** SWOT entry evidence backing.
 *
 * Score breakdown (total 100):
 * - Evidence depth (70%): metadata enrichment, full-text, doc count, type variety
 * - SWOT quality (30%): proportion of non-placeholder SWOT entries
 *
 * @param docs - Documents analysed
 * @param stakeholderSwot - Optional SWOT entries (undefined → 15-point midpoint default)
 * @returns Confidence score 0-100
 */
export function calculateConfidenceScore(
  docs: RawDocument[],
  stakeholderSwot?: AnalysisStakeholderSwot[],
): number {
  if (docs.length === 0) return 0;
  const metadataEnriched = docs.filter(isMetadataEnriched).length;
  const fullText = docs.filter(hasFullTextContent).length;
  const typeVariety = new Set(docs.map(normalizedDocType)).size;

  const metadataRatio = metadataEnriched / docs.length;
  const fullTextRatio = fullText / docs.length;
  const enrichmentScore = metadataRatio * 20 + fullTextRatio * 20;
  const countScore = Math.min(docs.length / 10, 1) * 15;
  const varietyScore = Math.min(typeVariety / 5, 1) * 15;
  const evidenceDepth = enrichmentScore + countScore + varietyScore;

  let swotQuality = stakeholderSwot === undefined ? 15 : 0;
  if (stakeholderSwot && stakeholderSwot.length > 0) {
    let totalEntries = 0;
    let nonPlaceholderEntries = 0;
    for (const sh of stakeholderSwot) {
      const all = [...sh.swot.strengths, ...sh.swot.weaknesses, ...sh.swot.opportunities, ...sh.swot.threats];
      totalEntries += all.length;
      nonPlaceholderEntries += all.filter(e => e.sourceDocIds.length > 0).length;
    }
    swotQuality = totalEntries > 0
      ? (nonPlaceholderEntries / totalEntries) * 30
      : 0;
  }

  return Math.round(evidenceDepth + swotQuality);
}
