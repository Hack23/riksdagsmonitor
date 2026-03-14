/**
 * @module data-transformers/content-generators/interpellations
 * @description Generator for "interpellations" article content. Renders interpellation
 * debates grouped by target minister with accountability analysis. This is a dedicated
 * generator separate from the motions generator to properly reflect the parliamentary
 * oversight function of interpellations.
 *
 * Interpellations are formal parliamentary questions submitted by opposition MPs demanding
 * responses from specific ministers. They differ from motions in purpose (accountability
 * vs. legislation) and structure (minister-focused vs. policy-focused).
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
  normalizePartyKey,
  formatDocumentDate,
  sanitizeUrl,
} from '../helpers.js';
import { detectPolicyDomains, generateDeepPolicyAnalysis } from '../policy-analysis.js';

/**
 * Generate content for interpellation debates articles.
 * Groups interpellations by target minister and provides accountability analysis.
 */
export function generateInterpellationsContent(data: ArticleContentData, lang: Language | string): string {
  // Interpellations are stored in the motions field for backward compatibility
  const interpellations = data.motions || [];

  const headingVal = L(lang, 'interpellationsTag');
  let content = `<h2>${String(headingVal)}</h2>\n`;

  if (interpellations.length === 0) {
    const noInterpVal = L(lang, 'noInterpellations');
    content += `<p>${String(noInterpVal)}</p>\n`;
    return content;
  }

  // Analytical lede paragraph
  const breakdownFn = L(lang, 'interpellationsBreakdown') as string | ((n: number) => string);
  const breakdownText = typeof breakdownFn === 'function'
    ? breakdownFn(interpellations.length)
    : `Opposition MPs have filed ${interpellations.length} interpellations demanding ministerial accountability.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Group interpellations by target minister (mottagare) for accountability analysis
  const byMinister: Record<string, RawDocument[]> = {};
  const unassigned: RawDocument[] = [];

  interpellations.forEach(interp => {
    const minister = interp.mottagare?.trim() || '';
    if (minister) {
      if (!byMinister[minister]) byMinister[minister] = [];
      byMinister[minister].push(interp);
    } else {
      unassigned.push(interp);
    }
  });

  const ministerCount = Object.keys(byMinister).length;

  // Ministerial Accountability section — show per-minister breakdown
  if (ministerCount > 0) {
    content += `\n    <h2>${L(lang, 'ministerAccountability')}</h2>\n`;
    const accountFn = L(lang, 'ministerAccountabilityContext') as string | ((n: number) => string);
    const accountContext = typeof accountFn === 'function'
      ? accountFn(ministerCount)
      : `${ministerCount} ministers face parliamentary interpellations this period.`;
    content += `    <p>${escapeHtml(String(accountContext))}</p>\n`;

    // Per-minister sections (sorted by number of interpellations descending)
    const sortedMinisters = Object.entries(byMinister)
      .sort(([, a], [, b]) => b.length - a.length);

    for (const [minister, ministerInterps] of sortedMinisters) {
      content += `\n    <h3>${svSpan(escapeHtml(minister), lang)} (${ministerInterps.length})</h3>\n`;
      ministerInterps.forEach(interp => {
        // Demote entry headings to h4 under minister h3 to maintain h2→h3→h4 hierarchy
        const entryHtml = renderInterpellationEntry(interp, lang);
        const demotedHtml = entryHtml
          .replace(/<h3(\b[^>]*)?>/g, '<h4$1>')
          .replace(/<\/h3>/g, '</h4>');
        content += demotedHtml;
      });
    }
  }

  // Unassigned interpellations (no mottagare field)
  if (unassigned.length > 0) {
    if (ministerCount > 0) {
      // Use a neutral heading instead of motion-specific "Independent Motions"
      content += `\n    <h2>${L(lang, 'otherDocuments')}</h2>\n`;
    }
    unassigned.forEach(interp => {
      content += renderInterpellationEntry(interp, lang);
    });
  }

  // Opposition oversight analysis — which parties are most active in oversight
  const byParty: Record<string, RawDocument[]> = {};
  interpellations.forEach(interp => {
    const party = normalizePartyKey(interp.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(interp);
  });

  const partyCount = Object.keys(byParty).filter(p => p !== 'other').length;

  if (partyCount > 0) {
    // Narrative bridge (inter-pillar transition)
    const watchTransition = getPillarTransition(lang, 'watchToOpposition');
    if (watchTransition) {
      content += `    <p class="pillar-transition">${escapeHtml(watchTransition)}</p>\n`;
    }

    content += `\n    <h2>${L(lang, 'oppositionOversight')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;

    const partyLabels = Object.entries(byParty)
      .filter(([party]) => party !== 'other')
      .sort(([, a], [, b]) => b.length - a.length);

    partyLabels.forEach(([party, partyInterps]) => {
      // Use dedicated aggregate label for grammatical, localized phrasing
      const labelFn = L(lang, 'partyInterpellationsFiled') as string | ((p: string, n: number) => string);
      const labelText = typeof labelFn === 'function'
        ? labelFn(party, partyInterps.length)
        : `${party}: ${partyInterps.length} interpellation${partyInterps.length > 1 ? 's' : ''} filed`;
      content += `        <li>${escapeHtml(String(labelText))}</li>\n`;
    });
    content += `      </ul>\n    </div>\n`;
  }

  // Deep Analysis section (5W framework)
  content += generateDeepAnalysisSection({
    documents: interpellations,
    lang,
    cia: data.ciaContext,
    articleType: 'interpellations',
  });

  // Policy theme analysis — what policy areas are targeted
  const allDomains = new Map<string, number>();
  interpellations.forEach(interp => {
    const domains = detectPolicyDomains(interp, lang);
    domains.forEach(domain => {
      allDomains.set(domain, (allDomains.get(domain) ?? 0) + 1);
    });
  });

  if (allDomains.size > 0) {
    content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    const sortedDomains = [...allDomains.entries()].sort(([, a], [, b]) => b - a);
    sortedDomains.slice(0, 6).forEach(([domain, count]) => {
      content += `        <li><strong>${escapeHtml(domain)}</strong> (${count})</li>\n`;
    });
    content += `      </ul>\n    </div>\n`;
  }

  // Government department engagement section
  const govDeptData = data.govDeptData ?? [];
  if (govDeptData.length > 0) {
    content += `\n    <h2>${L(lang, 'govEngagement')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    govDeptData.slice(0, 5).forEach(dept => {
      const deptName = escapeHtml(String(dept['name'] ?? dept['departement'] ?? dept['department'] ?? ''));
      const deptCount = dept['count'] ?? dept['total'] ?? dept['document_count'];
      if (deptName) {
        const hasDeptCount = deptCount !== null && deptCount !== undefined;
        content += hasDeptCount
          ? `        <li><strong>${deptName}</strong> (${escapeHtml(String(deptCount))})</li>\n`
          : `        <li><strong>${deptName}</strong></li>\n`;
      }
    });
    content += `      </ul>\n    </div>\n`;
  }

  return content;
}

/**
 * Render a single interpellation entry as an HTML block.
 * Uses interpellation-specific labels (not motion labels).
 */
function renderInterpellationEntry(interp: RawDocument, lang: Language | string): string {
  const titleText = interp.titel || interp.title || '';
  const escapedTitle = escapeHtml(titleText);
  const titleHtml = (interp.titel && !interp.title)
    ? svSpan(escapedTitle, lang)
    : escapedTitle;

  const docName = escapeHtml(interp.dokumentnamn || interp.dok_id || titleText);

  // Questioner name and party
  const unknownVal = L(lang, 'unknown');
  const authorName = (interp.intressent_namn !== 'Unknown' ? interp.intressent_namn : null)
    || (interp.author !== 'Unknown' ? interp.author : null)
    || (typeof unknownVal === 'string' ? unknownVal : 'Unknown');
  const partyName = (interp.parti !== 'Unknown' ? interp.parti : '') || '';

  const authorLine = partyName
    ? `${escapeHtml(authorName)} (${escapeHtml(partyName)})`
    : escapeHtml(authorName);

  // Target minister line
  const ministerLine = interp.mottagare
    ? `<p><strong>${escapeHtml(String(L(lang, 'targetMinister')))}:</strong> ${svSpan(escapeHtml(interp.mottagare), lang)}</p>`
    : '';

  // Policy relevance analysis
  const whyItMattersVal = L(lang, 'whyItMatters');
  const policyAnalysis = generateDeepPolicyAnalysis(interp, lang, 'ip');

  const dateHtml = formatDocumentDate(interp, lang);

  const readFullVal = L(lang, 'readFullInterpellation');
  const interpellationByVal = L(lang, 'interpellationBy');

  return `
    <div class="motion-entry">
      <h3>${titleHtml}</h3>
      <p><strong>${escapeHtml(String(interpellationByVal))}:</strong> ${authorLine}</p>${ministerLine}${dateHtml ? `\n      <p>${dateHtml}</p>` : ''}
      <p><strong>${escapeHtml(String(whyItMattersVal))}:</strong> ${policyAnalysis}</p>
      <p><a href="${sanitizeUrl(interp.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
    </div>
`;
}
