/**
 * @module data-transformers/content-generators/swot-section
 * @description Generates an embeddable SWOT analysis HTML section that can be
 * injected into any article type via the `TemplateSection` extensibility pattern.
 *
 * Agentic workflows call `generateSwotSection()` with structured data sourced
 * from MCP servers or CIA-data and append the returned `TemplateSection` to the
 * article's `sections` array.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { TemplateSection, SwotData, SwotEntry, SwotImpact } from '../../types/article.js';
import { L } from '../helpers.js';

// ---------------------------------------------------------------------------
// Impact badge helper
// ---------------------------------------------------------------------------

const IMPACT_CLASSES: Readonly<Record<SwotImpact, string>> = {
  high: 'swot-impact--high',
  medium: 'swot-impact--medium',
  low: 'swot-impact--low',
};

const IMPACT_LABEL_KEYS: Readonly<Record<SwotImpact, string>> = {
  high: 'swotImpactHigh',
  medium: 'swotImpactMedium',
  low: 'swotImpactLow',
};

function impactBadge(impact: SwotImpact | undefined, lbl: (key: string) => string): string {
  if (!impact) return '';
  const impactClass = IMPACT_CLASSES[impact] ?? IMPACT_CLASSES.medium;
  const labelKey = IMPACT_LABEL_KEYS[impact] ?? IMPACT_LABEL_KEYS.medium;
  const label = lbl(labelKey);
  return ` <span class="swot-impact ${impactClass}">[${escapeHtml(label)}]</span>`;
}

// ---------------------------------------------------------------------------
// Quadrant renderer
// ---------------------------------------------------------------------------

function renderQuadrant(heading: string, entries: SwotEntry[], cssClass: string, lbl: (key: string) => string): string {
  if (!entries || entries.length === 0) return '';
  const items = entries
    .map(e => `      <li>${escapeHtml(e.text)}${impactBadge(e.impact, lbl)}</li>`)
    .join('\n');
  return `    <div class="swot-quadrant ${cssClass}">
      <h3>${escapeHtml(heading)}</h3>
      <ul>
${items}
      </ul>
    </div>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Options for the SWOT section generator.
 */
export interface SwotSectionOptions {
  /** Structured SWOT data */
  data: SwotData;
  /** Target language for labels */
  lang: Language | string;
}

/**
 * Generate an embeddable SWOT analysis section.
 *
 * Returns a `TemplateSection` that can be appended to `ArticleData.sections`.
 * The section renders as a 2×2 CSS Grid matrix styled to match the existing
 * cyberpunk article theme.
 *
 * @example
 * ```ts
 * import { generateSwotSection } from './content-generators/swot-section.js';
 *
 * const section = generateSwotSection({
 *   data: {
 *     subject: 'Socialdemokraterna (S)',
 *     strengths: [{ text: 'Largest party', impact: 'high' }],
 *     weaknesses: [{ text: 'Internal divisions', impact: 'medium' }],
 *     opportunities: [{ text: 'Rising voter concern on welfare', impact: 'high' }],
 *     threats: [{ text: 'Coalition fragmentation', impact: 'medium' }],
 *   },
 *   lang: 'en',
 * });
 *
 * articleData.sections = [...(articleData.sections ?? []), section];
 * ```
 */
export function generateSwotSection(opts: SwotSectionOptions): TemplateSection {
  const { data, lang } = opts;

  const lbl = (key: string): string => {
    const val = L(lang, key);
    return typeof val === 'string' ? val : key;
  };

  const titleText = lbl('swotAnalysis');
  const trimmedSubject = (data.subject ?? '').trim();
  const subjectLine = trimmedSubject
    ? `    <p class="swot-subject"><strong>${escapeHtml(trimmedSubject)}</strong></p>\n`
    : '';

  const grid = [
    renderQuadrant(lbl('swotStrengths'), data.strengths, 'swot-strengths', lbl),
    renderQuadrant(lbl('swotWeaknesses'), data.weaknesses, 'swot-weaknesses', lbl),
    renderQuadrant(lbl('swotOpportunities'), data.opportunities, 'swot-opportunities', lbl),
    renderQuadrant(lbl('swotThreats'), data.threats, 'swot-threats', lbl),
  ].filter(Boolean).join('\n');

  const rawContext = data.context?.trim();
  const contextBlock = rawContext
    ? `\n    <p class="swot-context"><em>${escapeHtml(lbl('swotContext'))}:</em> ${escapeHtml(rawContext)}</p>`
    : '';

  const html = `<section class="swot-analysis" aria-label="${escapeHtml(titleText)}">
    <h2>${escapeHtml(titleText)}</h2>
${subjectLine}    <div class="swot-grid">
${grid}
    </div>${contextBlock}
  </section>`;

  return {
    id: 'swot-analysis',
    html,
    className: 'swot-analysis-section',
  };
}
