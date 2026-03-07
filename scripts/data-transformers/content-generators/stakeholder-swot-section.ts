/**
 * @module data-transformers/content-generators/stakeholder-swot-section
 * @description Generates a multi-stakeholder SWOT analysis section that provides
 * deep intelligence perspectives across all impacted stakeholders. Each stakeholder
 * receives its own SWOT quadrant analysis, enabling comprehensive strategic assessment.
 *
 * Used by agentic workflows to produce deep inspection analysis articles that
 * cover government, opposition, civil society, and other affected parties.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { TemplateSection, SwotData, SwotEntry, SwotImpact } from '../../types/article.js';
import { L } from '../helpers.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single stakeholder with their own SWOT analysis */
export interface StakeholderSwot {
  /** Stakeholder name (e.g. "Government Coalition", "Opposition Parties") */
  name: string;
  /** Role or description of the stakeholder */
  role?: string;
  /** SWOT data for this stakeholder */
  swot: SwotData;
}

/** Options for the multi-stakeholder SWOT section generator */
export interface StakeholderSwotSectionOptions {
  /** Title for the overall analysis section */
  title?: string;
  /** Array of stakeholder SWOT analyses */
  stakeholders: StakeholderSwot[];
  /** Target language for labels */
  lang: Language | string;
  /** Overall strategic context note */
  strategicContext?: string;
}

// ---------------------------------------------------------------------------
// Localised labels
// ---------------------------------------------------------------------------

const SECTION_TITLES: Readonly<Record<string, string>> = {
  en: 'Multi-Stakeholder SWOT Analysis',
  sv: 'Intressentanalys (SWOT)',
  da: 'Interessentanalyse (SWOT)',
  no: 'Interessentanalyse (SWOT)',
  fi: 'Sidosryhmäanalyysi (SWOT)',
  de: 'Stakeholder-SWOT-Analyse',
  fr: 'Analyse SWOT multi-parties prenantes',
  es: 'Análisis SWOT de múltiples partes interesadas',
  nl: 'Stakeholder SWOT-analyse',
  ar: 'تحليل SWOT لأصحاب المصلحة',
  he: 'ניתוח SWOT לבעלי עניין',
  ja: '利害関係者SWOT分析',
  ko: '이해관계자 SWOT 분석',
  zh: '利益相关方SWOT分析',
};

const STRATEGIC_CONTEXT_LABELS: Readonly<Record<string, string>> = {
  en: 'Strategic Context',
  sv: 'Strategisk kontext',
  da: 'Strategisk kontekst',
  no: 'Strategisk kontekst',
  fi: 'Strateginen konteksti',
  de: 'Strategischer Kontext',
  fr: 'Contexte stratégique',
  es: 'Contexto estratégico',
  nl: 'Strategische context',
  ar: 'السياق الاستراتيجي',
  he: 'הקשר אסטרטגי',
  ja: '戦略的背景',
  ko: '전략적 맥락',
  zh: '战略背景',
};

// ---------------------------------------------------------------------------
// Impact badge helper (shared with swot-section.ts pattern)
// ---------------------------------------------------------------------------

const IMPACT_CLASSES: Readonly<Record<SwotImpact, string>> = {
  high: 'swot-impact--high',
  medium: 'swot-impact--medium',
  low: 'swot-impact--low',
};

function impactBadge(impact: SwotImpact | undefined, lbl: (key: string) => string): string {
  if (!impact) return '';
  const keys: Record<SwotImpact, string> = { high: 'swotImpactHigh', medium: 'swotImpactMedium', low: 'swotImpactLow' };
  const label = lbl(keys[impact] ?? keys.medium);
  return ` <span class="swot-impact ${IMPACT_CLASSES[impact] ?? IMPACT_CLASSES.medium}">[${escapeHtml(label)}]</span>`;
}

// ---------------------------------------------------------------------------
// Quadrant renderer
// ---------------------------------------------------------------------------

function renderEntries(entries: SwotEntry[], lbl: (key: string) => string): string {
  if (!entries || entries.length === 0) return '';
  return entries.map(e => `          <li>${escapeHtml(e.text)}${impactBadge(e.impact, lbl)}</li>`).join('\n');
}

function renderStakeholderSwot(stakeholder: StakeholderSwot, lbl: (key: string) => string): string {
  const { name, role, swot } = stakeholder;
  const roleLine = role ? `\n        <p class="stakeholder-role"><em>${escapeHtml(role)}</em></p>` : '';

  const quadrants: string[] = [];
  const sections: Array<{ key: string; entries: SwotEntry[]; cssClass: string }> = [
    { key: 'swotStrengths', entries: swot.strengths, cssClass: 'swot-strengths' },
    { key: 'swotWeaknesses', entries: swot.weaknesses, cssClass: 'swot-weaknesses' },
    { key: 'swotOpportunities', entries: swot.opportunities, cssClass: 'swot-opportunities' },
    { key: 'swotThreats', entries: swot.threats, cssClass: 'swot-threats' },
  ];

  for (const sec of sections) {
    const items = renderEntries(sec.entries, lbl);
    if (items) {
      quadrants.push(`        <div class="swot-quadrant ${sec.cssClass}">
          <h4>${escapeHtml(lbl(sec.key))}</h4>
          <ul>
${items}
          </ul>
        </div>`);
    }
  }

  const contextNote = swot.context?.trim()
    ? `\n        <p class="swot-context"><em>${escapeHtml(swot.context.trim())}</em></p>`
    : '';

  return `      <div class="stakeholder-swot-card">
        <h3>${escapeHtml(name)}</h3>${roleLine}
        <div class="swot-grid">
${quadrants.join('\n')}
        </div>${contextNote}
      </div>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a multi-stakeholder SWOT analysis section.
 *
 * Returns a `TemplateSection` that can be appended to `ArticleData.sections`.
 * Each stakeholder gets their own SWOT matrix, providing comprehensive
 * multi-perspective intelligence analysis.
 *
 * @example
 * ```ts
 * import { generateStakeholderSwotSection } from './content-generators/stakeholder-swot-section.js';
 *
 * const section = generateStakeholderSwotSection({
 *   stakeholders: [
 *     {
 *       name: 'Government Coalition',
 *       role: 'Tidö Agreement parties (M, KD, L + SD)',
 *       swot: {
 *         strengths: [{ text: 'Parliamentary majority', impact: 'high' }],
 *         weaknesses: [{ text: 'Internal policy disagreements', impact: 'medium' }],
 *         opportunities: [{ text: 'Economic recovery momentum', impact: 'high' }],
 *         threats: [{ text: 'Rising opposition poll numbers', impact: 'medium' }],
 *       },
 *     },
 *     {
 *       name: 'Opposition',
 *       role: 'S, V, C, MP',
 *       swot: {
 *         strengths: [{ text: 'Strong polling position', impact: 'high' }],
 *         weaknesses: [{ text: 'Coalition formation uncertainty', impact: 'medium' }],
 *         opportunities: [{ text: 'Government policy failures', impact: 'high' }],
 *         threats: [{ text: 'Internal divisions on migration', impact: 'medium' }],
 *       },
 *     },
 *   ],
 *   lang: 'en',
 *   strategicContext: 'Ahead of the 2026 election, coalition dynamics are shifting.',
 * });
 * ```
 */
export function generateStakeholderSwotSection(opts: StakeholderSwotSectionOptions): TemplateSection {
  const { stakeholders, lang, strategicContext } = opts;

  const lbl = (key: string): string => {
    const val = L(lang, key);
    return typeof val === 'string' ? val : key;
  };

  const titleText = opts.title?.trim() || SECTION_TITLES[lang as string] || SECTION_TITLES.en;
  const cards = stakeholders.map(s => renderStakeholderSwot(s, lbl)).join('\n');

  const contextLabel = STRATEGIC_CONTEXT_LABELS[lang as string] || STRATEGIC_CONTEXT_LABELS.en;
  const contextBlock = strategicContext?.trim()
    ? `\n    <div class="strategic-context">
      <h3>${escapeHtml(contextLabel)}</h3>
      <p>${escapeHtml(strategicContext.trim())}</p>
    </div>`
    : '';

  const html = `<section class="stakeholder-swot-analysis" aria-label="${escapeHtml(titleText)}">
    <h2>${escapeHtml(titleText)}</h2>
    <div class="stakeholder-swot-grid">
${cards}
    </div>${contextBlock}
  </section>`;

  return {
    id: 'stakeholder-swot-analysis',
    html,
    className: 'stakeholder-swot-analysis-section',
  };
}
