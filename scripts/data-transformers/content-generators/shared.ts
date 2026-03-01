/**
 * @module data-transformers/content-generators/shared
 * @description Shared internal helpers and templates used by all content generators.
 * Contains TITLE_SUFFIX_TEMPLATES, keyword extraction, and event/document matching helpers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, RawCalendarEvent } from '../types.js';

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
