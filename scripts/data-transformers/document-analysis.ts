/**
 * @module data-transformers/document-analysis
 * @description Document grouping, opposition strategy analysis, and
 * per-document intelligence analysis. Handles motion-to-proposition
 * mapping, party activity breakdown, and speech-enriched analysis.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../html-utils.js';
import type { Language } from '../types/language.js';
import type { RawDocument, CIAContext } from './types.js';
import {
  L,
  svSpan,
  sanitizeUrl,
  isPersonProfileText,
  cleanMotionText,
  parseMotionAuthorParty,
  extractKeyPassage,
  generateEnhancedSummary,
  normalizePartyKey,
  partyMotionSuccessRate,
  formatDocumentDate,
} from './helpers.js';
import { detectPolicyDomains, generatePolicySignificance, generateDeepPolicyAnalysis } from './policy-analysis.js';

/** Committee codes with known high-influence weighting */
const HIGH_INFLUENCE_COMMITTEES = new Set(['FiU', 'KU', 'JuU', 'UU', 'FöU', 'SoU']);
/** Document types that carry higher parliamentary influence */
const HIGH_INFLUENCE_TYPES = new Set(['prop', 'bet', 'skr', 'dir']);

/**
 * Calculate an influence score (0-100) for a parliamentary document.
 * Considers committee tier, document type, policy domain breadth,
 * and the presence of full content as a proxy for document depth.
 *
 * @param doc - The document to score
 * @returns Influence score 0-100
 */
export function calculateInfluenceScore(doc: RawDocument): number {
  let score = 0;

  // Document type weighting (propositions > reports > motions)
  const docType = doc.doktyp || doc.documentType || '';
  if (HIGH_INFLUENCE_TYPES.has(docType)) {
    score += docType === 'prop' ? 35 : docType === 'bet' ? 30 : 20;
  } else if (docType === 'mot') {
    score += 10;
  } else {
    score += 15; // unknown type gets moderate weight
  }

  // Committee tier weighting
  const organ = doc.organ || doc.committee || '';
  if (HIGH_INFLUENCE_COMMITTEES.has(organ)) {
    score += 30;
  } else if (organ) {
    score += 15;
  }

  // Policy domain breadth (more domains = broader impact)
  const domains = detectPolicyDomains(doc);
  score += Math.min(20, domains.length * 7);

  // Content richness (full text available indicates substantive document)
  if (doc.fullText || doc.fullContent) {
    score += 10;
  }

  // Party sponsorship (government documents inherently carry more weight)
  const isGovernment = !doc.parti || doc.doktyp === 'prop';
  if (isGovernment && docType !== 'mot') {
    score += 5;
  }

  return Math.min(100, score);
}

/** Matches a strict proposition ID (YYYY/YY:NNN) in a motion title. */
const PROP_REFERENCE_REGEX = /med anledning av prop\.\s+(\d{4}\/\d{2}:\d+)/i;

/** Captures the descriptive title portion that follows the prop ID. */
export const PROP_TITLE_SUFFIX_REGEX = /med anledning av prop\.\s+\d{4}\/\d{2}:\d+\s*(.*)/i;

/**
 * Extract the parent proposition reference (e.g. "2025/26:118") from a motion title.
 * Motions responding to a government proposition have titles like
 * "med anledning av prop. 2025/26:118 Tillståndsprövning enligt förnybartdirektivet".
 */
export function extractPropRef(title: string): string | null {
  const m = title.match(PROP_REFERENCE_REGEX);
  return m?.[1] || null;
}

/**
 * Group motions by the parent government proposition they respond to.
 * Motions without a proposition reference are returned separately as "independent".
 */
export function groupMotionsByProposition(motions: RawDocument[]): {
  grouped: Map<string, RawDocument[]>;
  independent: RawDocument[];
} {
  const grouped = new Map<string, RawDocument[]>();
  const independent: RawDocument[] = [];
  for (const motion of motions) {
    const title = motion.titel || motion.title || '';
    const ref = extractPropRef(title);
    if (ref) {
      if (!grouped.has(ref)) grouped.set(ref, []);
      grouped.get(ref)!.push(motion);
    } else {
      independent.push(motion);
    }
  }
  return { grouped, independent };
}

/**
 * Group propositions by their referred committee (organ/committee field).
 * Propositions without a committee use the empty-string key.
 */
export function groupPropositionsByCommittee(propositions: RawDocument[]): Map<string, RawDocument[]> {
  const map = new Map<string, RawDocument[]>();
  for (const prop of propositions) {
    const key = prop.organ ?? prop.committee ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(prop);
  }
  return map;
}

export function generateOppositionStrategySection(motions: RawDocument[], lang: Language | string): string {
  const byParty: Record<string, RawDocument[]> = {};
  motions.forEach(m => {
    const party = normalizePartyKey(m.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(m);
  });

  const sortedParties = Object.entries(byParty)
    .filter(([p]) => p !== 'other')
    .sort(([, a], [, b]) => b.length - a.length);

  if (sortedParties.length === 0) return '';

  const [topParty, topMotions] = sortedParties[0];

  // Identify primary policy domain(s) for the most-active party
  const topDomainSet = new Set<string>();
  topMotions.forEach(m => {
    detectPolicyDomains(m, lang).forEach(d => topDomainSet.add(d));
  });
  const topDomains = Array.from(topDomainSet).slice(0, 2);

  const count = topMotions.length;
  const safeParty = escapeHtml(topParty);

  // Per-language conjunction for domain list
  const conjunctions: Record<string, string> = {
    sv: ' och ', da: ' og ', no: ' og ', fi: ' ja ', de: ' und ', fr: ' et ',
    es: ' y ', nl: ' en ', ar: ' و', he: ' ו', ja: '・', ko: '·', zh: '和',
  };
  const conjunction = conjunctions[lang as string] ?? ' and ';
  const domainList = topDomains.join(conjunction);

  // Per-language lead templates: {party} leads with {count} motions, focused on {domains}.
  const leadsVal = L(lang, 'partyLeadsOpposition') as string | undefined;
  let text: string;
  if (typeof leadsVal === 'string' && leadsVal !== '') {
    // If constant available in CONTENT_LABELS — use it directly
    text = leadsVal
      .replace('{party}', `<strong>${safeParty}</strong>`)
      .replace('{count}', String(count));
  } else {
    // Fallback inline templates per language
    const templates: Record<string, (p: string, n: number) => string> = {
      sv: (p, n) => `<strong>${p}</strong> är mest aktiv med ${n} motion${n !== 1 ? 'er' : ''}`,
      da: (p, n) => `<strong>${p}</strong> fører med ${n} forslag`,
      no: (p, n) => `<strong>${p}</strong> leder med ${n} forslag`,
      fi: (p, n) => `<strong>${p}</strong> johtaa ${n} aloitteella`,
      de: (p, n) => `<strong>${p}</strong> führt mit ${n} Antrag${n !== 1 ? 'en' : ''}`,
      fr: (p, n) => `<strong>${p}</strong> mène avec ${n} motion${n !== 1 ? 's' : ''}`,
      es: (p, n) => `<strong>${p}</strong> lidera con ${n} mocion${n !== 1 ? 'es' : ''}`,
      nl: (p, n) => `<strong>${p}</strong> leidt met ${n} motie${n !== 1 ? 's' : ''}`,
      ar: (p, n) => `<strong>${p}</strong> يتصدر بـ${n} اقتراح`,
      he: (p, n) => `<strong>${p}</strong> מוביל עם ${n} הצעות`,
      ja: (p, n) => `<strong>${p}</strong>が${n}件の動議で最も活発`,
      ko: (p, n) => `<strong>${p}</strong>이(가) ${n}건의 동의로 선두`,
      zh: (p, n) => `<strong>${p}</strong>以${n}项动议领先`,
    };
    const tpl = templates[lang as string];
    text = tpl ? tpl(safeParty, count) : `<strong>${safeParty}</strong> leads opposition activity with ${count} motion${count !== 1 ? 's' : ''}`;
  }

  if (domainList) {
    const focusTemplates: Record<string, string> = {
      sv: ', med fokus på ', da: ', med fokus på ', no: ', med fokus på ',
      fi: ', painopisteenä ', de: ', mit Fokus auf ', fr: ', axé sur ',
      es: ', centrado en ', nl: ', gericht op ', ar: '، بالتركيز على ',
      he: ', בדגש על ', ja: '、', ko: ', ', zh: '，重点关注',
    };
    const focusPrefix = focusTemplates[lang as string] ?? ', focused on ';
    text += `${focusPrefix}${escapeHtml(domainList)}`;
  }
  text += '.';

  if (sortedParties.length > 1) {
    const [secondParty, secondMotions] = sortedParties[1];
    const n = secondMotions.length;
    const safeSecond = escapeHtml(secondParty);
    const followTemplates: Record<string, (p: string, n: number) => string> = {
      sv: (p, c) => ` ${p} följer med ${c} motion${c !== 1 ? 'er' : ''}.`,
      da: (p, c) => ` ${p} følger med ${c} forslag.`,
      no: (p, c) => ` ${p} følger med ${c} forslag.`,
      fi: (p, c) => ` ${p} seuraa ${c} aloitteella.`,
      de: (p, c) => ` ${p} folgt mit ${c} Antrag${c !== 1 ? 'en' : ''}.`,
      fr: (p, c) => ` ${p} suit avec ${c} motion${c !== 1 ? 's' : ''}.`,
      es: (p, c) => ` ${p} sigue con ${c} mocion${c !== 1 ? 'es' : ''}.`,
      nl: (p, c) => ` ${p} volgt met ${c} motie${c !== 1 ? 's' : ''}.`,
      ar: (p, c) => ` ${p} يتبع بـ${c} اقتراح.`,
      he: (p, c) => ` ${p} עוקב עם ${c} הצעות.`,
      ja: (p, c) => ` ${p}が${c}件で続きます。`,
      ko: (p, c) => ` ${p}이(가) ${c}건으로 뒤를 잇습니다.`,
      zh: (p, c) => ` ${p}以${c}项紧随其后。`,
    };
    const followTpl = followTemplates[lang as string];
    text += followTpl
      ? followTpl(safeSecond, n)
      : ` ${safeSecond} follows with ${n} motion${n !== 1 ? 's' : ''}.`;
  }

  return `    <p>${text}</p>\n`;
}

/**
 * Render a single motion entry div (shared between flat list and themed sections).
 */
export function renderMotionEntry(motion: RawDocument, lang: Language | string): string {
  const titleText = motion.titel || motion.title || '';
  const escapedTitle = escapeHtml(titleText);
  const titleHtml = (motion.titel && !motion.title)
    ? svSpan(escapedTitle, lang)
    : escapedTitle;
  const docName = escapeHtml(motion.dokumentnamn || motion.dok_id || titleText);

  // Use enriched author and party data, with fallback parsing from raw notis.
  // Treat 'Unknown' sentinel (set by enrichDocumentsWithContent) as missing so
  // we attempt parseMotionAuthorParty before giving up.
  const unknownVal = L(lang, 'unknown');
  let authorName = (motion.intressent_namn !== 'Unknown' ? motion.intressent_namn : null)
                || (motion.author !== 'Unknown' ? motion.author : null)
                || '';
  let partyName = (motion.parti !== 'Unknown' ? motion.parti : '') || '';
  // Fire fallback when EITHER author or party is missing — covers the party-only sentinel case
  // where intressent_namn is valid but parti was 'Unknown' and stripped to ''.
  if (!authorName || !partyName) {
    const rawText = motion.undertitel || motion.summary || motion.notis || motion.fullText || motion.titel || motion.rubrik || '';
    const parsed = parseMotionAuthorParty(rawText);
    if (parsed) {
      if (parsed.author && !authorName) authorName = parsed.author;
      if (parsed.party && !partyName) partyName = parsed.party;
    }
  }
  if (!authorName) authorName = typeof unknownVal === 'string' ? unknownVal : 'Unknown';
  const authorLine = partyName
    ? `${escapeHtml(authorName)} (${escapeHtml(partyName)})`
    : escapeHtml(authorName);

  // Use enhanced summary based on metadata (cleanMotionText strips Swedish boilerplate)
  const summaryText = generateEnhancedSummary(motion, 'motion', lang);
  const motionDefaultVal = L(lang, 'motionDefault');
  // Only wrap in Swedish-language span when the content comes from a Swedish source
  const isSwedishContent = (motion.titel && !motion.title)
    || (motion.summary || motion.notis || '').includes('Motion till riksdagen');
  const summaryHtml = (summaryText && summaryText !== motionDefaultVal && isSwedishContent)
    ? svSpan(escapeHtml(summaryText), lang)
    : escapeHtml(summaryText || (typeof motionDefaultVal === 'string' ? motionDefaultVal : ''));

  const readFullVal = L(lang, 'readFullMotion');
  const whyItMattersVal = L(lang, 'whyItMatters');
  const dateHtml = formatDocumentDate(motion, lang);

  return `
    <div class="motion-entry">
      <h3>${titleHtml}</h3>
      <p><strong>${L(lang, 'filedBy')}:</strong> ${authorLine}</p>${dateHtml ? `\n      <p>${dateHtml}</p>` : ''}
      <p>${summaryHtml}</p>
      <p><strong>${escapeHtml(String(whyItMattersVal))}:</strong> ${generateDeepPolicyAnalysis(motion, lang, 'mot')}</p>
      <p><a href="${sanitizeUrl(motion.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
    </div>
`;
}

/**
 * Render a single interpellation entry with interpellation-specific labels and CSS classes.
 * Uses 'ip' doktyp for domain analysis and interpellation-specific link/default labels.
 */
export function renderInterpellationEntry(doc: RawDocument, lang: Language | string): string {
  const titleText = doc.titel || doc.title || '';
  const escapedTitle = escapeHtml(titleText);
  const titleHtml = (doc.titel && !doc.title)
    ? svSpan(escapedTitle, lang)
    : escapedTitle;
  const docName = escapeHtml(doc.dokumentnamn || doc.dok_id || titleText);

  const unknownVal = L(lang, 'unknown');
  let authorName = (doc.intressent_namn !== 'Unknown' ? doc.intressent_namn : null)
                || (doc.author !== 'Unknown' ? doc.author : null)
                || '';
  let partyName = (doc.parti !== 'Unknown' ? doc.parti : '') || '';
  if (!authorName || !partyName) {
    const rawText = doc.undertitel || doc.summary || doc.notis || doc.fullText || doc.titel || doc.rubrik || '';
    const parsed = parseMotionAuthorParty(rawText);
    if (parsed) {
      if (parsed.author && !authorName) authorName = parsed.author;
      if (parsed.party && !partyName) partyName = parsed.party;
    }
  }
  if (!authorName) authorName = typeof unknownVal === 'string' ? unknownVal : 'Unknown';
  const authorLine = partyName
    ? `${escapeHtml(authorName)} (${escapeHtml(partyName)})`
    : escapeHtml(authorName);

  const summaryText = generateEnhancedSummary(doc, 'interpellation', lang);
  const interpDefaultVal = L(lang, 'interpellationDefault');
  // Detect Swedish content: use titel-without-title heuristic (same as renderMotionEntry) 
  // or match Swedish-specific boilerplate (not just "Interpellation" which is the same in English)
  const isSwedishContent = (doc.titel && !doc.title)
    || (doc.summary || doc.notis || '').includes('Interpellation till');
  const summaryHtml = (summaryText && summaryText !== interpDefaultVal && isSwedishContent)
    ? svSpan(escapeHtml(summaryText), lang)
    : escapeHtml(summaryText || (typeof interpDefaultVal === 'string' ? interpDefaultVal : ''));

  const readFullVal = L(lang, 'readFullInterpellation');
  const whyItMattersVal = L(lang, 'whyItMatters');
  const dateHtml = formatDocumentDate(doc, lang);

  return `
    <div class="interpellation-entry">
      <h3>${titleHtml}</h3>
      <p><strong>${L(lang, 'filedBy')}:</strong> ${authorLine}</p>${dateHtml ? `\n      <p>${dateHtml}</p>` : ''}
      <p>${summaryHtml}</p>
      <p><strong>${escapeHtml(String(whyItMattersVal))}:</strong> ${generateDeepPolicyAnalysis(doc, lang, 'ip')}</p>
      <p><a href="${sanitizeUrl(doc.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
    </div>
`;
}

/**
 * Generate per-document analysis.
 * PRIMARY: full document text, policy significance, related speeches.
 * SECONDARY (only when genuinely informative): CIA historical context footnote.
 */
export function generateDocumentIntelligenceAnalysis(doc: RawDocument, docType: string, cia: CIAContext | undefined, lang: Language | string): string {
  const parts: string[] = [];

  // Normalise short doktyp codes to the names used by generateEnhancedSummary
  const normalizedType = docType === 'prop' ? 'proposition'
    : docType === 'bet' ? 'report'
    : docType === 'mot' ? 'motion'
    : docType;

  // ── PRIMARY: full document text or best available summary ────────────────
  const rawText = doc.fullText || doc.fullContent || doc.summary || doc.notis || '';
  // Discard person-profile data (MP status lines, deceased notices) — these are
  // not document content and must never appear in article document entries.
  const safeRawText = isPersonProfileText(rawText) ? '' : rawText;
  // For motions, clean Swedish boilerplate before extracting passage
  const cleanedText = (normalizedType === 'motion' && safeRawText.includes('Motion till riksdagen'))
    ? cleanMotionText(safeRawText)
    : safeRawText;
  const passage = extractKeyPassage(cleanedText, 500);
  if (passage) {
    const isSwedishSource = !!(doc.titel && !doc.title);
    parts.push(isSwedishSource
      ? svSpan(escapeHtml(passage), lang)
      : escapeHtml(passage));
  } else {
    parts.push(escapeHtml(generateEnhancedSummary(doc, normalizedType, lang)));
  }

  // ── PRIMARY: policy domain significance derived from document content ────
  const significance = generatePolicySignificance(doc, lang, docType);
  parts.push(`<strong>${escapeHtml(String(L(lang, 'whatThisMeans')))}:</strong> ${significance}`);

  // ── PRIMARY: related speeches (direct evidence from the chamber) ─────────
  const speeches = doc.speeches || [];
  if (speeches.length > 0) {
    const speakerLines = speeches.slice(0, 2).map(s => {
      const who = [s.talare, s.parti ? `(${s.parti})` : ''].filter(Boolean).join(' ');
      return who ? escapeHtml(who) : 'Unknown speaker';
    }).join(', ');
    parts.push(`<em>Debate contributions from: ${speakerLines}.</em>`);
  }

  // ── SECONDARY: CIA historical context — only where it adds real perspective
  // For motions: historical passage rate is highly relevant context since
  // almost all opposition motions are denied (~99%). Only show when we have
  // an actual party-specific rate, so the note is concrete, not generic.
  if (docType === 'mot' && cia) {
    // Try to get party from doc fields, else parse from raw text
    let party = doc.parti;
    if (!party) {
      const rawText2 = doc.summary || doc.notis || doc.fullText || '';
      const parsed2 = parseMotionAuthorParty(rawText2);
      if (parsed2) party = parsed2.party;
    }
    const rate = partyMotionSuccessRate(party, cia);
    if (rate !== null && party) {
      parts.push(
        `<small class="cia-context">Historical context: ${escapeHtml(party)} motions have a ${escapeHtml(rate.toFixed(1))}% passage rate ` +
        `(${escapeHtml(String(cia.overallMotionDenialRate))}% of all opposition motions are rejected). ` +
        `This motion signals a policy position rather than an imminent legislative change.</small>`
      );
    }
  }

  // ── EARLY WARNING: high-influence documents with stability risk indicators ─
  if (cia) {
    const influenceScore = calculateInfluenceScore(doc);
    const stabilityScore = cia.coalitionStability.stabilityScore;
    const majorityMargin = cia.coalitionStability.majorityMargin;

    // Flag high-influence documents during coalition instability
    if (influenceScore >= 60 && stabilityScore < 50) {
      parts.push(
        `<small class="early-warning">⚠ Early warning: This high-influence document (score: ${escapeHtml(String(influenceScore))}) ` +
        `arrives during a period of coalition instability (stability: ${escapeHtml(String(stabilityScore))}). ` +
        `Monitor closely for defections or procedural delays.</small>`
      );
    } else if (majorityMargin <= 2 && (docType === 'prop' || docType === 'bet')) {
      parts.push(
        `<small class="early-warning">⚠ Thin majority alert: With only ${escapeHtml(String(majorityMargin))} seat majority, ` +
        `this ${docType === 'prop' ? 'government bill' : 'committee report'} faces elevated defeat risk.</small>`
      );
    }
  }

  // For propositions: coalition note is already in the article-level summary; skip per-document repetition.
  // (Moved to generateGenericContent key-takeaways section.)

  return parts.join(' ');
}
