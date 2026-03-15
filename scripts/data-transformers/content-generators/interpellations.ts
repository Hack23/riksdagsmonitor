/**
 * @module data-transformers/content-generators/interpellations
 * @description Generator for "interpellations" article content. Renders parliamentary
 * interpellations with debate dynamics analysis, minister accountability assessment,
 * and political scrutiny context.
 *
 * Interpellations are formal parliamentary questions that opposition MPs address to
 * ministers, who must respond in chamber debate. They are a key accountability tool
 * in the Swedish Riksdag, distinct from opposition motions in purpose and procedure.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { generateDeepAnalysisSection } from './shared.js';
import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { ArticleContentData, RawDocument } from '../types.js';
import { getPillarTransition } from '../../editorial-pillars.js';
import {
  L,
  svSpan,
  sanitizeUrl,
  normalizePartyKey,
  formatDocumentDate,
} from '../helpers.js';
import { detectPolicyDomains, generateDeepPolicyAnalysis } from '../policy-analysis.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract minister name or responsible department from an interpellation document.
 * Interpellations are directed to a specific minister; this information may appear
 * in the `mottagare` field or in the document title (pattern: "till X statsråd/minister").
 */
function extractMinisterTarget(doc: RawDocument): string {
  // Prefer the typed mottagare (recipient) field from the interpellations API
  if (typeof doc.mottagare === 'string' && doc.mottagare.trim()) {
    return doc.mottagare.trim();
  }
  // Fall back to looking for minister-directed phrases in the title.
  // Capture the full minister phrase including compound titles like "utrikesminister"/"finansminister".
  // Only match when a minister-related term is present to avoid false positives (e.g. "till Gaza").
  const titleText = doc.titel || doc.title || '';
  const ministerMatch = titleText.match(
    /(?:till|to)\s+(.{3,60}?\s*(?:statsråd(?:et[s]?)?|statsminister(?:n(?:s)?|s)?|(?:\w+)?minister(?:n(?:s)?|s)?))/i
  );
  if (ministerMatch?.[1]) {
    return ministerMatch[1].trim();
  }
  return '';
}

/**
 * Render a single interpellation entry as an HTML block.
 */
function renderInterpellationEntry(doc: RawDocument, lang: Language | string): string {
  const titleText = doc.titel || doc.title || '';
  const escapedTitle = escapeHtml(titleText);
  const titleHtml = (doc.titel && !doc.title)
    ? svSpan(escapedTitle, lang)
    : escapedTitle;

  const docName = escapeHtml(doc.dokumentnamn || doc.dok_id || titleText);
  // Filter out "Unknown" sentinel values that leak from enrichDocumentsWithContent()
  const rawAuthor = doc.intressent_namn || doc.author || '';
  const authorText = (rawAuthor && rawAuthor.toLowerCase() !== 'unknown')
    ? escapeHtml(rawAuthor)
    : '';
  // Only show party when the raw value is present and not an "Unknown" sentinel
  const rawParti = typeof doc.parti === 'string' ? doc.parti.trim() : '';
  const hasParty = rawParti !== '' && rawParti.toLowerCase() !== 'unknown';
  const partyText = hasParty ? escapeHtml(rawParti.toUpperCase()) : '';
  const dateHtml = formatDocumentDate(doc, lang);
  const ministerTarget = extractMinisterTarget(doc);

  const whyItMattersLabel = L(lang, 'whyItMatters');
  const interpellationByLabel = L(lang, 'interpellationBy');
  const ministerAccountabilityLabel = L(lang, 'ministerAccountability');
  const readFullLabel = L(lang, 'readFullInterpellation');
  const defaultText = L(lang, 'interpellationDefault');

  // Policy analysis — explains what accountability issue is being raised.
  // No explicit doktyp override is passed; policy-analysis.ts only distinguishes
  // 'mot'/'bet' with type-specific text — all other types (including interpellations)
  // fall through to the 'default' analysis, which is the correct behavior here.
  const policyAnalysis = generateDeepPolicyAnalysis(doc, lang);

  let html = `\n    <div class="interpellation-entry">\n`;
  html += `      <h3>${titleHtml}</h3>\n`;
  if (dateHtml) html += `      <p>${dateHtml}</p>\n`;

  if (authorText || partyText) {
    const authorLine = [
      authorText ? `<strong>${escapeHtml(String(interpellationByLabel))}:</strong> ${authorText}` : '',
      partyText ? `<strong>${escapeHtml(String(L(lang, 'party')))}:</strong> ${partyText}` : '',
    ].filter(Boolean).join(' &nbsp;|&nbsp; ');
    html += `      <p>${authorLine}</p>\n`;
  }

  if (ministerTarget) {
    html += `      <p><strong>${escapeHtml(String(ministerAccountabilityLabel))}:</strong> ${escapeHtml(ministerTarget)}</p>\n`;
  }

  const summaryText = doc.summary || doc.notis
    ? (doc.summary || doc.notis || '')
    : String(defaultText);
  const summaryHtml = (doc.titel && !doc.title && (doc.summary || doc.notis))
    ? svSpan(escapeHtml(summaryText), lang)
    : escapeHtml(summaryText);

  html += `      <p>${summaryHtml}</p>\n`;
  html += `      <p><strong>${escapeHtml(String(whyItMattersLabel))}:</strong> ${policyAnalysis}</p>\n`;

  if (doc.url) {
    html += `      <p><a href="${sanitizeUrl(doc.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullLabel))}: ${docName}</a></p>\n`;
  }

  html += `    </div>\n`;
  return html;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate article content for the "interpellations" article type.
 *
 * Produces a structured accountability-focused article covering:
 * 1. **Lede** — Count and significance of interpellations filed
 * 2. **Debate Dynamics** — Per-party breakdown of accountability issues raised
 * 3. **Thematic analysis** — Interpellations grouped by policy domain
 * 4. **Deep Analysis** — 5W framework (who, what, when, why, impact)
 * 5. **Coalition Dynamics** — Cross-party accountability patterns
 *
 * @param data - Article content data (interpellations loaded in `data.motions`)
 * @param lang - Target language
 * @returns Generated HTML content string
 */
export function generateInterpellationsContent(data: ArticleContentData, lang: Language | string): string {
  // Interpellations are stored in data.motions by the data pipeline
  // (for backward compatibility) but may also appear in data.documents.
  const motionsArray = data.motions ?? [];
  const interpellations: RawDocument[] = motionsArray.length > 0 ? motionsArray : (data.documents ?? []);

  let content = `<h2>${L(lang, 'interpellationsTag')}</h2>\n`;

  if (interpellations.length === 0) {
    content += `<p>${L(lang, 'noInterpellations')}</p>\n`;
    return content;
  }

  // Analytical lede paragraph
  const breakdownFn = L(lang, 'interpellationsBreakdown') as string | ((n: number) => string);
  const breakdownText = typeof breakdownFn === 'function'
    ? breakdownFn(interpellations.length)
    : `${interpellations.length} new interpellations filed.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Group by party for party accountability overview
  const byParty: Record<string, RawDocument[]> = {};
  interpellations.forEach(ip => {
    const party = normalizePartyKey(ip.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(ip);
  });
  const partyCount = Object.keys(byParty).filter(p => p !== 'other').length;

  // Debate dynamics section — how many parties are holding ministers accountable
  content += `\n    <h2>${L(lang, 'debateDynamics')}</h2>\n`;
  if (partyCount > 1) {
    const scrutinyFn = L(lang, 'interpellationsScrutinyContext') as string | ((n: number) => string);
    const scrutinyContext = typeof scrutinyFn === 'function'
      ? scrutinyFn(partyCount)
      : `Interpellations from ${partyCount} different parties demonstrate broad parliamentary scrutiny of government ministers.`;
    content += `    <p>${escapeHtml(String(scrutinyContext))}</p>\n`;
  }

  // Group interpellations by policy domain for thematic accountability analysis
  const byTheme: Record<string, RawDocument[]> = {};
  interpellations.forEach(ip => {
    const domains = detectPolicyDomains(ip, lang);
    const theme = domains[0] || String(L(lang, 'generalMatters'));
    if (!byTheme[theme]) byTheme[theme] = [];
    byTheme[theme].push(ip);
  });
  const themeCount = Object.keys(byTheme).length;

  // Thematic analysis — grouped by accountability domain
  if (themeCount > 1) {
    content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;
    Object.entries(byTheme).forEach(([theme, themeIps]) => {
      content += `\n    <h3>${escapeHtml(theme)} (${themeIps.length})</h3>\n`;
      themeIps.forEach(ip => {
        const entryHtml = renderInterpellationEntry(ip, lang);
        // Demote h3 → h4 inside a themed section to maintain hierarchy
        content += entryHtml
          .replace(/<h3(\b[^>]*)?>/g, '<h4$1>')
          .replace(/<\/h3>/g, '</h4>');
      });
    });
  } else {
    // Single theme or ungrouped: flat list under the debate dynamics section
    interpellations.forEach(ip => {
      content += renderInterpellationEntry(ip, lang);
    });
  }

  // Accountability Analysis section
  content += `\n    <h2>${L(lang, 'accountabilityAnalysis')}</h2>\n`;
  const accountabilityFn = L(lang, 'interpellationsAccountabilityContext') as string | ((count: number, domains: number) => string);
  const accountabilityText = typeof accountabilityFn === 'function'
    ? accountabilityFn(interpellations.length, themeCount)
    : `These ${interpellations.length} interpellations span ${themeCount} policy domain${themeCount !== 1 ? 's' : ''}, reflecting the breadth of parliamentary accountability demands on the government.`;
  content += `    <p>${escapeHtml(String(accountabilityText))}</p>\n`;

  // Deep Analysis section (5W framework)
  content += generateDeepAnalysisSection({
    documents: interpellations,
    lang,
    cia: data.ciaContext,
    articleType: 'interpellations',
  });

  // Coalition dynamics — which parties are driving accountability
  if (partyCount > 0) {
    // Narrative bridge before coalition dynamics (inter-pillar transition)
    const watchTransition = getPillarTransition(lang, 'watchToOpposition');
    if (watchTransition) {
      content += `    <p class="pillar-transition">${escapeHtml(watchTransition)}</p>\n`;
    }
    content += `\n    <h2>${L(lang, 'coalitionDynamics')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    Object.entries(byParty).forEach(([party, partyIps]) => {
      if (party !== 'other') {
        const detailFn = L(lang, 'partyInterpellationsFiled') as string | ((party: string, n: number) => string);
        const detail = typeof detailFn === 'function'
          ? detailFn(party, partyIps.length)
          : `${party}: ${partyIps.length} interpellation${partyIps.length > 1 ? 's' : ''} filed`;
        content += `        <li>${escapeHtml(String(detail))}</li>\n`;
      }
    });
    content += `      </ul>\n    </div>\n`;
  }

  return content;
}
