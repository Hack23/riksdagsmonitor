/**
 * @module data-transformers/content-generators/interpellations
 * @description Generator for "interpellations" article content. Renders parliamentary
 * interpellations grouped by submitting party and policy theme, with accountability analysis.
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
  normalizePartyKey,
} from '../helpers.js';
import { detectPolicyDomains } from '../policy-analysis.js';
import {
  renderInterpellationEntry,
} from '../document-analysis.js';

export function generateInterpellationsContent(data: ArticleContentData, lang: Language | string): string {
  const interpellations: RawDocument[] = data.interpellations || [];

  let content = `<h2>${L(lang, 'interpellationsTag')}</h2>\n`;

  if (interpellations.length === 0) {
    content += `<p>${L(lang, 'noInterpellations')}</p>\n`;
    return content;
  }

  // Analytical lede paragraph
  const breakdownFn = L(lang, 'interpellationsBreakdown') as string | ((n: number) => string);
  const breakdownText = typeof breakdownFn === 'function'
    ? breakdownFn(interpellations.length)
    : `${interpellations.length} interpellations submitted.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Group interpellations by submitting party for strategic analysis
  const byParty: Record<string, RawDocument[]> = {};
  interpellations.forEach(interp => {
    const party = normalizePartyKey(interp.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(interp);
  });
  const partyCount = Object.keys(byParty).filter(p => p !== 'other').length;

  // Parliamentary oversight strategy section with per-party analysis
  if (partyCount > 1) {
    content += `\n    <h2>${L(lang, 'oppositionStrategy')}</h2>\n`;
    const strategyFn = L(lang, 'interpellationStrategyContext') as string | ((n: number) => string);
    const strategyContext = typeof strategyFn === 'function'
      ? strategyFn(partyCount)
      : `Interpellations from ${partyCount} different parties reveal coordinated parliamentary oversight efforts.`;
    content += `    <p>${escapeHtml(String(strategyContext))}</p>\n`;
  }

  // Group interpellations by primary policy theme for thematic analysis
  const byTheme: Record<string, RawDocument[]> = {};
  interpellations.forEach(interp => {
    const domains = detectPolicyDomains(interp, lang);
    const theme = domains[0] || String(L(lang, 'generalMatters'));
    if (!byTheme[theme]) byTheme[theme] = [];
    byTheme[theme].push(interp);
  });
  const themeCount = Object.keys(byTheme).length;

  if (themeCount > 1) {
    content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;
    Object.entries(byTheme).forEach(([theme, themeInterps]) => {
      content += `\n    <h3>${escapeHtml(theme)} (${themeInterps.length})</h3>\n`;
      themeInterps.forEach(interp => {
        // Demote entry headings one level when inside a themed section
        const entryHtml = renderInterpellationEntry(interp, lang);
        const demotedHtml = entryHtml
          .replace(/<h3(\b[^>]*)?>/g, '<h4$1>')
          .replace(/<\/h3>/g, '</h4>');
        content += demotedHtml;
      });
    });
  } else {
    // Single theme or no detection: flat list
    interpellations.forEach(interp => { content += renderInterpellationEntry(interp, lang); });
  }

  // Deep Analysis section (5W framework)
  content += generateDeepAnalysisSection({
    documents: interpellations,
    lang,
    cia: data.ciaContext,
    articleType: 'interpellations',
  });

  // Party accountability breakdown
  if (partyCount > 0) {
    const watchTransition = getPillarTransition(lang, 'watchToOpposition');
    if (watchTransition) {
      content += `    <p class="pillar-transition">${escapeHtml(watchTransition)}</p>\n`;
    }
    content += `\n    <h2>${L(lang, 'coalitionDynamics')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    Object.entries(byParty).forEach(([party, partyInterps]) => {
      if (party !== 'other') {
        const detailFn = L(lang, 'partyInterpellationsFiled') as string | ((party: string, n: number) => string);
        const detail = typeof detailFn === 'function'
          ? detailFn(party, partyInterps.length)
          : `${party}: ${partyInterps.length} interpellations filed`;
        content += `        <li>${escapeHtml(String(detail))}</li>\n`;
      }
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
