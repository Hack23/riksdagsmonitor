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
} from './helpers.js';
import { detectPolicyDomains, generatePolicySignificance, generateDeepPolicyAnalysis } from './policy-analysis.js';

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

  const isSv = lang === 'sv';
  const count = topMotions.length;
  let text = '';

  if (isSv) {
    const domainList = topDomains.join(' och ');
    text = `<strong>${escapeHtml(topParty)}</strong> är mest aktiv med ${count} motion${count !== 1 ? 'er' : ''}`;
    if (domainList) text += `, med fokus på ${escapeHtml(domainList)}`;
    text += '.';
  } else {
    const domainList = topDomains.join(' and ');
    text = `<strong>${escapeHtml(topParty)}</strong> leads opposition activity with ${count} motion${count !== 1 ? 's' : ''}`;
    if (domainList) text += `, focused on ${escapeHtml(domainList)}`;
    text += '.';
  }

  if (sortedParties.length > 1) {
    const [secondParty, secondMotions] = sortedParties[1];
    const n = secondMotions.length;
    text += isSv
      ? ` ${escapeHtml(secondParty)} följer med ${n} motion${n !== 1 ? 'er' : ''}.`
      : ` ${escapeHtml(secondParty)} follows with ${n} motion${n !== 1 ? 's' : ''}.`;
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

  return `
    <div class="motion-entry">
      <h3>${titleHtml}</h3>
      <p><strong>${L(lang, 'filedBy')}:</strong> ${authorLine}</p>
      <p>${summaryHtml}</p>
      <p><strong>${escapeHtml(String(whyItMattersVal))}:</strong> ${generateDeepPolicyAnalysis(motion, lang, 'mot')}</p>
      <p><a href="${sanitizeUrl(motion.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
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

  // For propositions: coalition note is already in the article-level summary; skip per-document repetition.
  // (Moved to generateGenericContent key-takeaways section.)

  return parts.join(' ');
}
