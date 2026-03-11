/**
 * @module data-transformers/content-generators/motions
 * @description Generator for "motions" article content. Renders opposition motions
 * grouped by party with strategy analysis.
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
} from '../helpers.js';
import { detectPolicyDomains } from '../policy-analysis.js';
import {
  groupMotionsByProposition,
  generateOppositionStrategySection,
  renderMotionEntry,
  PROP_TITLE_SUFFIX_REGEX,
} from '../document-analysis.js';

export function generateMotionsContent(data: ArticleContentData, lang: Language | string): string {
  const motions = data.motions || [];

  let content = `<h2>${L(lang, 'oppMotions')}</h2>\n`;

  if (motions.length === 0) {
    content += `<p>${L(lang, 'noMotions')}</p>\n`;
    return content;
  }

  // Analytical lede paragraph
  const breakdownFn = L(lang, 'motionsBreakdown') as string | ((n: number) => string);
  const breakdownText = typeof breakdownFn === 'function'
    ? breakdownFn(motions.length)
    : `${motions.length} new opposition motions filed.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Group motions by party for strategic analysis
  const byParty: Record<string, RawDocument[]> = {};
  motions.forEach(motion => {
    const party = normalizePartyKey(motion.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(motion);
  });

  // Opposition strategy section with per-party analysis
  const partyCount = Object.keys(byParty).filter(p => p !== 'other').length;
  if (partyCount > 1) {
    content += `\n    <h2>${L(lang, 'oppositionStrategy')}</h2>\n`;
    const strategyFn = L(lang, 'oppositionStrategyContext') as string | ((n: number) => string);
    const strategyContext = typeof strategyFn === 'function'
      ? strategyFn(partyCount)
      : `Motions from ${partyCount} different parties reveal the breadth of opposition political criticism and alternative policy agendas.`;
    content += `    <p>${escapeHtml(String(strategyContext))}</p>\n`;
    // Per-party analysis with domain focus
    content += generateOppositionStrategySection(motions, lang);
  }

  // Group "med anledning av prop." motions by parent proposition to eliminate duplicate headings
  const { grouped: groupedByProp, independent: independentMotions } = groupMotionsByProposition(motions);

  if (groupedByProp.size > 0) {
    content += `\n    <h2>${L(lang, 'responsesToProp')}</h2>\n`;
    groupedByProp.forEach((propMotions, propRef) => {
      // Extract the descriptive title portion that follows the prop ID
      const firstTitle = propMotions[0]?.titel || propMotions[0]?.title || '';
      const suffixMatch = firstTitle.match(PROP_TITLE_SUFFIX_REGEX);
      const propTitle = suffixMatch?.[1]?.trim() || String(propRef);
      const safePropRef = escapeHtml(String(propRef));
      const safePropTitle = escapeHtml(propTitle);
      content += `    <h3>Prop. ${safePropRef}: ${svSpan(safePropTitle, lang)}</h3>\n`;
      // Individual motions inside a prop group use h4 to maintain h2→h3→h4 hierarchy
      propMotions.forEach(m => {
        const html = renderMotionEntry(m, lang);
        content += html.replace(/<h3(\b[^>]*)?>/g, '<h4$1>').replace(/<\/h3>/g, '</h4>');
      });
    });
  }

  // Motions to render with thematic analysis:
  // - when proposition groups exist: only independent motions (non-"med anledning av")
  // - when no proposition groups: all motions (preserves existing thematic behaviour)
  const thematicMotions = groupedByProp.size > 0 ? independentMotions : motions;

  if (thematicMotions.length > 0) {
    if (groupedByProp.size > 0) {
      content += `\n    <h2>${L(lang, 'independentMotions')}</h2>\n`;
    }

    // Group motions by primary policy theme for thematic analysis
    const byTheme: Record<string, RawDocument[]> = {};
    thematicMotions.forEach(motion => {
      const domains = detectPolicyDomains(motion, lang);
      const theme = domains[0] || String(L(lang, 'generalMatters'));
      if (!byTheme[theme]) byTheme[theme] = [];
      byTheme[theme].push(motion);
    });
    const themeCount = Object.keys(byTheme).length;

    if (themeCount > 1 && groupedByProp.size === 0) {
      // Suppress "Thematic Analysis" h2 when already under an "Independent Motions" h2
      // (groupedByProp.size === 0 means we are NOT in the split-section layout, so it is
      // safe to emit the additional h2 without creating two consecutive section headers)
      content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;
      Object.entries(byTheme).forEach(([theme, themeMotions]) => {
        content += `\n    <h3>${escapeHtml(theme)} (${themeMotions.length})</h3>\n`;
        themeMotions.forEach(motion => {
          // Demote motion entry headings one level when inside a themed section
          const entryHtml = renderMotionEntry(motion, lang);
          const demotedHtml = entryHtml
            .replace(/<h3(\b[^>]*)?>/g, '<h4$1>')
            .replace(/<\/h3>/g, '</h4>');
          content += demotedHtml;
        });
      });
    } else {
      // Single theme, no detection, or alongside proposition groups: flat list
      thematicMotions.forEach(motion => { content += renderMotionEntry(motion, lang); });
    }
  }

  // Deep Analysis section (5W framework)
  content += generateDeepAnalysisSection({
    documents: motions,
    lang,
    cia: data.ciaContext,
    articleType: 'motions',
  });

  // Party activity breakdown
  if (partyCount > 0) {
    // Narrative bridge before cross-party analysis (inter-pillar transition)
    const watchTransition = getPillarTransition(lang, 'watchToOpposition');
    if (watchTransition) {
      content += `    <p class="pillar-transition">${escapeHtml(watchTransition)}</p>\n`;
    }
    content += `\n    <h2>${L(lang, 'coalitionDynamics')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    Object.entries(byParty).forEach(([party, partyMotions]) => {
      if (party !== 'other') {
        const detailFn = L(lang, 'partyMotionsFiled') as string | ((party: string, n: number) => string);
        const detail = typeof detailFn === 'function'
          ? detailFn(party, partyMotions.length)
          : `${party}: ${partyMotions.length} motions filed`;
        content += `        <li>${escapeHtml(String(detail))}</li>\n`;
      }
    });
    content += `      </ul>\n    </div>\n`;
  }

  // Government department engagement section (from analyze_g0v_by_department)
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

