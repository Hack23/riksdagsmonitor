/**
 * @module data-transformers/helpers
 * @description Low-level utility functions for the data transformation
 * pipeline: URL sanitisation, Swedish-language span generation, date
 * formatting, text cleaning, and document metadata helpers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../html-utils.js';
import type { Language } from '../types/language.js';
import type { ContentLabelSet, CommitteeName } from '../types/content.js';
import { LOCALE_MAP, COMMITTEE_NAMES, CONTENT_LABELS } from './constants.js';
import type { RawCalendarEvent, RawDocument, CIAContext } from './types.js';

/**
 * Sanitize a URL for safe use in href attributes.
 * Rejects javascript:, data:, vbscript: schemes and returns '#' for invalid URLs.
 * Also escapes HTML attribute characters in the URL.
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  // Block dangerous schemes
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
  // Only allow http, https, and relative URLs
  if (/^[a-z]+:/i.test(trimmed) && !/^https?:/i.test(trimmed)) return '#';
  // Escape HTML attribute characters
  return trimmed.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Emit a Swedish-language span.
 *
 * The span always carries both the `lang="sv"` accessibility attribute AND
 * `data-translate="true"` so that `translateSwedishContent()` (in
 * `translation-dictionary.ts`) can locate every Swedish phrase, look it up
 * in the per-language dictionary, and replace or clean the marker before the
 * article is written to disk.
 *
 * - **SV articles**: the marker lets validation tooling verify original text
 *   is present; `translateSwedishContent()` strips the marker but keeps the
 *   Swedish text unchanged.
 * - **Non-SV articles**: `translateSwedishContent()` attempts dictionary
 *   translation via `translatePhrase()` and removes the marker regardless
 *   of whether a match was found, so no `data-translate` attributes remain
 *   in the final HTML.
 *
 * @param escapedText - Already HTML-escaped text content
 * @param _lang       - Target article language (kept only for backward
 *                      compatibility; currently not used by this function)
 */
export function svSpan(escapedText: string, _lang: Language | string): string {
  // NOTE: `_lang` is intentionally unused and retained solely so existing
  // call sites do not need to be updated; all spans are marked as Swedish.
  return `<span data-translate="true" lang="sv">${escapedText}</span>`;
}

/**
 * Get localized label with fallback to English
 */
export function L(lang: Language | string, key: string): ContentLabelSet[keyof ContentLabelSet] {
  const langLabels = CONTENT_LABELS[lang as Language];
  const value = langLabels?.[key as keyof ContentLabelSet];
  if (value !== undefined) return value;
  return CONTENT_LABELS.en[key as keyof ContentLabelSet];
}

/**
 * Check if date is today
 */
export function isTodayDate(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Format day name (Monday, Tuesday, etc.) using Intl for all 14 languages
 */
export function formatDayName(date: Date, lang: Language | string = 'en'): string {
  const locale = LOCALE_MAP[lang] || lang;
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
  }
}

/**
 * Format day label (e.g., "February 10 - Monday") using Intl for all 14 languages
 */
export function formatDayLabel(date: Date, lang: Language | string = 'en'): string {
  const locale = LOCALE_MAP[lang] || lang;
  try {
    const dayName = formatDayName(date, lang);
    const monthDay = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(date);
    return `${monthDay} - ${dayName}`;
  } catch {
    const dayName = formatDayName(date, 'en');
    const monthDay = new Intl.DateTimeFormat('en-GB', { month: 'long', day: 'numeric' }).format(date);
    return `${monthDay} - ${dayName}`;
  }
}

/**
 * Determine if event is high priority
 */
export function isHighPriority(event: RawCalendarEvent): boolean {
  const title = (event.title || event.rubrik || '').toLowerCase();
  return (
    title.includes('pm') ||
    title.includes('prime minister') ||
    title.includes('statsminister') ||
    title.includes('vote') ||
    title.includes('votering') ||
    title.includes('eu') ||
    title.includes('summit')
  );
}

/**
 * Parse author and party from raw Swedish motion text.
 * Handles "av Fredrik Olovsson m.fl. (S)" and similar patterns.
 */
export function parseMotionAuthorParty(text: string): { author: string; party: string } | null {
  const m = text.match(/\bav\s+([^(]+?)\s+\(([A-ZÅÄÖ]{1,5})\)/u);
  if (m) return { author: m[1].trim().replace(/\s+/g, ' '), party: m[2] };
  return null;
}

/**
 * Clean raw Swedish motion notis text into a readable subject.
 * Strips "Motion till riksdagen XXXX av AUTHOR (PARTY) med anledning av..."
 * and truncates at "Förslag till riksdagsbeslut".
 */
export function cleanMotionText(raw: string): string {
  // Minimum cleaned text length before falling back to raw; max excerpt lengths
  const MIN_CLEANED = 20;
  const MAX_CLEANED = 300;
  const MAX_RAW_FALLBACK = 200;
  // Truncate at formal ballot section
  let text = raw.replace(/Förslag till riksdagsbeslut[\s\S]*/i, '').trim();
  // Strip leading "Motion till riksdagen YYYY/YY:NNN av AUTHOR (PARTY) " prefix
  text = text.replace(/^Motion till riksdagen\s+\S+\s+av\s+[^(]+\([A-ZÅÄÖ]{1,5}\)\s*/i, '').trim();
  // Strip "med anledning av prop. YYYY/YY:NNN " prefix
  text = text.replace(/^med anledning av prop\.\s+\S+\s*/i, '').trim();
  return text.length > MIN_CLEANED ? text.slice(0, MAX_CLEANED) : raw.slice(0, MAX_RAW_FALLBACK);
}

/**
 * Detect when a text string is an MP/politician profile page excerpt rather than
 * document content. Returns true for texts that begin with Swedish MP-status phrases
 * or contain profile-specific markers such as:
 *   - "Tjänstgörande riksdagsledamot …"   (active MP)
 *   - "Tidigare riksdagsledamot …"        (former MP)
 *   - "Avgången riksdagsledamot …"        (resigned MP)
 *   - "Tillgänglig ersättare …"           (substitute MP)
 *   - "Tjänstgörande ersättare …"         (active substitute)
 *   - "Tidigare ersättare …"              (former substitute)
 *   - "Tjänstgörande statsrådsersättare"  (acting minister substitute)
 *   - "Tidigare statsråd …"              (former minister)
 *   - "Tidigare statsminister …"          (former PM)
 *   - "Inga uppdrag"                      (no assignments)
 *   - "Avgången …"                        (resigned)
 *   - "Avliden YYYY-MM-DD …"              (deceased MP)
 *
 * This data comes from the riksdag API's person/ledamot profile pages, and must never
 * appear in article document-entry content.
 */
export function isPersonProfileText(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trimStart();
  // Ordered from most specific to least; any match → it is a person profile excerpt
  return (
    /^Tjänstgörande riksdagsledamot/u.test(trimmed) ||
    /^Tidigare riksdagsledamot/u.test(trimmed) ||
    /^Avgången riksdagsledamot/u.test(trimmed) ||
    /^Tillgänglig ersättare/u.test(trimmed) ||
    /^Tjänstgörande ersättare/u.test(trimmed) ||
    /^Tidigare ersättare/u.test(trimmed) ||
    /^Tjänstgörande statsrådsersättare/u.test(trimmed) ||
    /^Tidigare statsråd/u.test(trimmed) ||
    /^Tidigare statsminister/u.test(trimmed) ||
    /^Inga uppdrag/u.test(trimmed) ||
    /^Avgången/u.test(trimmed) ||
    // Deceased: "Avliden YYYY-MM-DD ..."
    /^Avliden\s+\d{4}-\d{2}-\d{2}/u.test(trimmed) ||
    // Contains riksdag email address — always a profile page
    /[a-zA-Z0-9._%+-]+@riksdagen\.se/u.test(trimmed) ||
    // Contains "Aktuella uppdrag Riksdagsledamot" — profile header
    /Aktuella uppdrag\s+Riksdagsledamot/u.test(trimmed)
  );
}

/**
 * Build a descriptive proposition summary from the ministry organ.
 * Returns a ministry-specific framing sentence.
 */
export function propSummaryFromOrgan(organ: string, lang: Language | string): string {
  const ministryMap: Record<string, { sv: string; en: string }> = {
    Justitiedepartementet:    { sv: 'Justitiedepartementets förslag rör rättsliga förändringar.', en: 'This Justice Ministry proposal amends existing legal framework.' },
    Finansdepartementet:      { sv: 'Finansdepartementets förslag påverkar statsbudget eller finansreglering.', en: 'This Finance Ministry proposal has fiscal or budgetary implications.' },
    Försvarsdepartementet:    { sv: 'Försvarsdepartementets förslag rör försvars- eller säkerhetspolitik.', en: 'This Defence Ministry proposal concerns national security or defence posture.' },
    Utbildningsdepartementet: { sv: 'Utbildningsdepartementets förslag berör skolsystem eller forskning.', en: 'This Education Ministry proposal affects schools, universities or research funding.' },
    Socialdepartementet:      { sv: 'Socialdepartementets förslag rör välfärd eller socialpolitik.', en: 'This Social Affairs Ministry proposal affects welfare entitlements or social services.' },
    Miljödepartementet:       { sv: 'Klimat- och miljödepartementets förslag rör klimat- eller miljöpolitik.', en: 'This Climate and Environment Ministry proposal targets emissions or ecological regulation.' },
    'Klimat- och miljödepartementet': { sv: 'Klimat- och miljödepartementets förslag rör klimat- eller miljöpolitik.', en: 'This Climate and Environment Ministry proposal targets emissions or ecological regulation.' },
    'Klimat- och näringslivsdepartementet': { sv: 'Klimat- och näringslivsdepartementets förslag rör klimat- och näringspolitik.', en: 'This Climate and Enterprise Ministry proposal addresses both environmental and industrial policy.' },
    Utrikesdepartementet:     { sv: 'Utrikesdepartementets förslag rör utrikespolitik eller internationella relationer.', en: 'This Foreign Affairs Ministry proposal concerns international relations or Sweden’s global obligations.' },
    Infrastrukturdepartementet: { sv: 'Infrastrukturdepartementets förslag rör transport eller samhällsinfrastruktur.', en: 'This Infrastructure Ministry proposal affects transport networks or public utilities.' },
  };
  const entry = ministryMap[organ];
  if (!entry) return '';
  return lang === 'sv' ? entry.sv : entry.en;
}

/**
 * Generate enhanced summary from document metadata when summary field is missing
 * Uses document type, subtype, organ, and other metadata to create informative placeholder
 */
export function generateEnhancedSummary(doc: RawDocument, type: string, lang: Language | string): string {
  // For motions/interpellations: clean raw Swedish notis text before returning
  if ((type === 'motion' || type === 'interpellation') && (doc.summary || doc.notis)) {
    const raw = (doc.summary || doc.notis || '');
    // Skip person-profile data (e.g. "Tjänstgörande riksdagsledamot...", "Avliden 2011-09-20...")
    if (!isPersonProfileText(raw)) {
      if (raw.includes('Motion till riksdagen') || raw.includes('Förslag till riksdagsbeslut')) {
        return cleanMotionText(raw);
      }
      return raw;
    }
  }

  // If we have a real summary or notis (not person profile data), use it as-is
  if (doc.summary || doc.notis) {
    const text = doc.summary || doc.notis || '';
    if (!isPersonProfileText(text)) {
      return text;
    }
  }

  // Generate enhanced summary based on metadata
  const organ = doc.organ || doc.committee;
  const subtyp = doc.subtyp || doc.subtype;
  const doktyp = doc.doktyp || doc.documentType;

  // Build contextual summary based on available metadata
  const parts: string[] = [];

  if (type === 'report' && organ) {
    const labelVal = L(lang, 'committeeReport');
    parts.push(`${organ} ${typeof labelVal === 'string' ? labelVal : ''}`);
    if (subtyp) {
      const onVal = L(lang, 'on');
      parts.push(`${typeof onVal === 'string' ? onVal : ''} ${subtyp}`);
    }
  } else if (type === 'proposition') {
    // Try ministry-specific framing first
    const ministrySummary = organ ? propSummaryFromOrgan(organ, lang) : '';
    if (ministrySummary) {
      return ministrySummary;
    }
    const propLabel = L(lang, 'governmentProposition');
    parts.push(typeof propLabel === 'string' ? propLabel : '');
    if (organ) {
      const referredVal = L(lang, 'referredTo');
      parts.push(`${typeof referredVal === 'string' ? referredVal : ''} ${organ}`);
    }
  } else if (type === 'motion') {
    const author = (doc.intressent_namn !== 'Unknown' ? doc.intressent_namn : null) || doc.author;
    const party = doc.parti !== 'Unknown' ? doc.parti : undefined;
    if (author && party) {
      const motionByVal = L(lang, 'motionBy');
      parts.push(`${typeof motionByVal === 'string' ? motionByVal : ''} ${author} (${party})`);
    } else if (author) {
      const motionByVal = L(lang, 'motionBy');
      parts.push(`${typeof motionByVal === 'string' ? motionByVal : ''} ${author}`);
    } else {
      const parlMotion = L(lang, 'parliamentaryMotion');
      parts.push(typeof parlMotion === 'string' ? parlMotion : '');
    }
    if (subtyp) {
      const onVal = L(lang, 'on');
      parts.push(`${typeof onVal === 'string' ? onVal : ''} ${subtyp}`);
    }
  } else if (type === 'interpellation') {
    const author = (doc.intressent_namn !== 'Unknown' ? doc.intressent_namn : null) || doc.author;
    const party = doc.parti !== 'Unknown' ? doc.parti : undefined;
    if (author && party) {
      const motionByVal = L(lang, 'motionBy');
      parts.push(`${typeof motionByVal === 'string' ? motionByVal : ''} ${author} (${party})`);
    } else if (author) {
      const motionByVal = L(lang, 'motionBy');
      parts.push(`${typeof motionByVal === 'string' ? motionByVal : ''} ${author}`);
    }
    // Include target minister (mottagare) if available
    const mottagare = (doc as Record<string, unknown>)['mottagare'];
    if (mottagare && typeof mottagare === 'string') {
      parts.push(`→ ${escapeHtml(mottagare)}`);
    }
    if (subtyp) {
      const onVal = L(lang, 'on');
      parts.push(`${typeof onVal === 'string' ? onVal : ''} ${subtyp}`);
    }
  }

  // Add document type information if useful
  if (doktyp && doktyp !== type) {
    parts.push(`(${doktyp})`);
  }

  // Fallback to default if no useful metadata
  if (parts.length === 0) {
    const fallback = type === 'report' ? L(lang, 'reportDefault') :
           type === 'proposition' ? L(lang, 'propDefault') :
           type === 'interpellation' ? L(lang, 'interpellationDefault') :
           L(lang, 'motionDefault');
    return typeof fallback === 'string' ? fallback : '';
  }

  return parts.join(' ') + '.';
}

/**
 * Get human-readable committee name from code
 */
export function getCommitteeName(code: string | undefined, lang: Language | string): string {
  if (!code) {
    const unknownVal = L(lang, 'unknown');
    return typeof unknownVal === 'string' ? unknownVal : 'Unknown';
  }
  if (code === 'unknown') {
    const otherVal = L(lang, 'otherCommittee');
    return typeof otherVal === 'string' ? otherVal : 'Other committees';
  }
  const entry: CommitteeName | undefined = COMMITTEE_NAMES[code];
  if (!entry) return code;
  // Use Swedish name for sv, English for all others (other languages get translated via data-translate)
  return lang === 'sv' ? entry.sv : entry.en;
}

/**
 * Extract the most analytically useful excerpt from full document text.
 * Returns first substantive paragraph (skips short headings/metadata lines).
 */
export function extractKeyPassage(fullText: string | undefined, maxChars = 600): string {
  if (!fullText) return '';
  // Strip HTML tags if present
  let plain = fullText.replace(/<[^>]+>/g, ' ');
  // Strip markdown links — keep link text, remove URL: [text](url) → text
  plain = plain.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
  // Strip bare URLs (http/https)
  plain = plain.replace(/https?:\/\/[^\s)]+/g, '');
  // Collapse whitespace
  plain = plain.replace(/\s+/g, ' ').trim();
  if (plain.length <= maxChars) return plain;
  // Find a sentence boundary near maxChars
  const cut = plain.lastIndexOf('.', maxChars);
  return cut > 100 ? plain.slice(0, cut + 1) : plain.slice(0, maxChars) + '…';
}

/**
 * Normalise a raw `parti` field to a canonical party key.
 * Maps missing, empty, or any capitalisation of 'unknown' to 'other'.
 * Used in both generateMotionsContent (party grouping) and
 * generateOppositionStrategySection so both sections treat the sentinel
 * identically regardless of capitalisation.
 */
export function normalizePartyKey(parti: unknown): string {
  const raw = typeof parti === 'string' ? parti.trim() : '';
  return !raw || raw.toLowerCase() === 'unknown' ? 'other' : raw;
}

/**
 * Look up party motion success rate from CIA context.
 * Returns null when data is unavailable so callers can skip the annotation.
 */
export function partyMotionSuccessRate(party: string | undefined, cia: CIAContext | undefined): number | null {
  if (!cia || !party) return null;
  const p = cia.partyPerformance.find(x => x.id === party || x.partyName.toLowerCase().startsWith(party.toLowerCase()));
  return p ? p.metrics.successRate : null;
}

/**
 * Format a document publication date for display.
 * Returns an HTML string like
 * `<span class="doc-date"><strong>Published:</strong> <time datetime="2026-03-04">2026-03-04</time></span>`
 * using the localized "Published" label, or empty string if datum is missing.
 */
export function formatDocumentDate(doc: RawDocument, lang: Language | string): string {
  const datum = doc.datum;
  if (!datum) return '';
  const publishedLabel = L(lang, 'published');
  return `<span class="doc-date"><strong>${escapeHtml(String(publishedLabel))}:</strong> <time datetime="${escapeHtml(datum)}">${escapeHtml(datum)}</time></span>`;
}

/**
 * Filter documents to only include those published within a given number of days.
 * Documents without a `datum` field are kept (benefit of the doubt).
 *
 * @param docs - Array of raw documents
 * @param maxAgeDays - Maximum age in days (default 30)
 * @returns Filtered array containing only fresh documents
 */
export function filterFreshDocuments(docs: RawDocument[], maxAgeDays = 30): RawDocument[] {
  // Normalize cutoff to midnight UTC so day-based threshold is consistent
  const now = new Date();
  const cutoffMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - maxAgeDays * 24 * 60 * 60 * 1000;
  return docs.filter(doc => {
    if (!doc.datum) {
      // keep documents without dates (benefit of the doubt)
      return true;
    }
    // Interpret datum (YYYY-MM-DD) as midnight UTC for deterministic comparison
    const docTime = Date.parse(`${doc.datum}T00:00:00Z`);
    if (Number.isNaN(docTime)) {
      // If the date cannot be parsed, keep the document rather than dropping it
      return true;
    }
    return docTime >= cutoffMs;
  });
}
