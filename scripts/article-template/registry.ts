/**
 * @module article-template/registry
 * @description Per-article-type template registry.  Each entry provides a
 * complete `ArticleTemplate` object that drives visual theming (via
 * `styleClass`), structural layout hints, and AI style directives injected
 * into generation prompts for Economist-style political journalism.
 *
 * Usage:
 * ```typescript
 * import { getTemplate, getStyleClass, getAIDirectives } from './registry.js';
 *
 * const tpl = getTemplate('propositions');
 * // tpl.styleClass  → 'article-type-propositions'
 * // tpl.layout      → { columns: 1, sidebar: false, heroSection: true, … }
 * ```
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ArticleType } from '../types/article.js';
import type { ArticleTemplate, AIStyleDirective, LayoutConfig } from './types.js';
import { GLOBAL_STYLE_RUBRIC } from './types.js';

// ---------------------------------------------------------------------------
// Shared layout presets
// ---------------------------------------------------------------------------

const LAYOUT_SINGLE: LayoutConfig = {
  columns: 1,
  sidebar: false,
  heroSection: true,
  breadcrumbStyle: 'full',
} as const;

const LAYOUT_SINGLE_NO_HERO: LayoutConfig = {
  columns: 1,
  sidebar: false,
  heroSection: false,
  breadcrumbStyle: 'compact',
} as const;

const LAYOUT_TWO_COL: LayoutConfig = {
  columns: 2,
  sidebar: true,
  heroSection: true,
  breadcrumbStyle: 'full',
} as const;

// ---------------------------------------------------------------------------
// Shared AI directive builders
// ---------------------------------------------------------------------------

function makeLedeDirective(tone: AIStyleDirective['tone']): AIStyleDirective {
  return {
    section: 'lede',
    tone,
    maxWords: 60,
    requiresSubheadings: false,
    stakeholderFocus: [],
    rubric: [
      ...GLOBAL_STYLE_RUBRIC,
      'Open with the single most newsworthy fact; do not bury the lead.',
      'No opinions or speculation in the lede.',
    ],
  };
}

function makeKeyTakeawaysDirective(stakeholders: string[]): AIStyleDirective {
  return {
    section: 'key-takeaways',
    tone: 'analytical',
    maxWords: 150,
    requiresSubheadings: false,
    stakeholderFocus: stakeholders,
    rubric: [
      ...GLOBAL_STYLE_RUBRIC,
      'Limit to 5 bullet points maximum.',
      'Each bullet: one concrete fact or consequence.',
    ],
  };
}

function makeSwotDirective(subject: string): AIStyleDirective {
  return {
    section: 'swot',
    tone: 'analytical',
    maxWords: 400,
    requiresSubheadings: true,
    stakeholderFocus: [subject],
    rubric: [
      ...GLOBAL_STYLE_RUBRIC,
      'Each SWOT entry: 15–40 words, must cite a specific document or vote.',
      'Do not repeat the same argument across quadrants.',
      `Subject: ${subject}`,
    ],
  };
}

// ---------------------------------------------------------------------------
// Registry definition
// ---------------------------------------------------------------------------

const REGISTRY: Readonly<Record<ArticleType, ArticleTemplate>> = {
  'week-ahead': {
    type: 'week-ahead',
    styleClass: 'article-type-week-ahead',
    description: 'Calendar-driven forward-looking article with event grid and confidence meters.',
    layout: { ...LAYOUT_TWO_COL, heroSection: false },
    aiDirectives: {
      lede: makeLedeDirective('informational'),
      calendar: {
        section: 'calendar',
        tone: 'informational',
        maxWords: 300,
        requiresSubheadings: true,
        stakeholderFocus: ['Parliament', 'Government', 'Committees'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Group events by day; use exact times from the Riksdag calendar.',
          'Flag high-impact events with a confidence score (High / Medium / Low).',
        ],
      },
      'what-to-watch': {
        section: 'what-to-watch',
        tone: 'analytical',
        maxWords: 200,
        requiresSubheadings: false,
        stakeholderFocus: ['Voters', 'Journalists', 'Policy analysts'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Max 4 watch points; each with a one-sentence why-it-matters.',
        ],
      },
    },
  },

  'month-ahead': {
    type: 'month-ahead',
    styleClass: 'article-type-month-ahead',
    description: 'Longer-horizon planning article covering the full month\'s parliamentary schedule.',
    layout: LAYOUT_SINGLE,
    aiDirectives: {
      lede: makeLedeDirective('informational'),
      'key-takeaways': makeKeyTakeawaysDirective(['Parliament', 'Government', 'Committees']),
      swot: makeSwotDirective('Monthly Parliamentary Agenda'),
    },
  },

  'weekly-review': {
    type: 'weekly-review',
    styleClass: 'article-type-weekly-review',
    description: 'Retrospective summary of the week\'s parliamentary activity with highlights.',
    layout: LAYOUT_SINGLE,
    aiDirectives: {
      lede: makeLedeDirective('reflective'),
      'key-takeaways': makeKeyTakeawaysDirective(['Parliament', 'Government', 'Opposition']),
      swot: makeSwotDirective('This Week in Parliament'),
      'week-metrics': {
        section: 'week-metrics',
        tone: 'analytical',
        maxWords: 150,
        requiresSubheadings: false,
        stakeholderFocus: [],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Include vote counts, bills passed, and committee reports adopted.',
        ],
      },
    },
  },

  'monthly-review': {
    type: 'monthly-review',
    styleClass: 'article-type-monthly-review',
    description: 'Comprehensive monthly retrospective with trend charts and milestone timeline.',
    layout: { ...LAYOUT_TWO_COL, heroSection: true },
    aiDirectives: {
      lede: makeLedeDirective('reflective'),
      'key-takeaways': makeKeyTakeawaysDirective(['Parliament', 'Government', 'Parties', 'Citizens']),
      swot: makeSwotDirective('Monthly Parliamentary Performance'),
      trends: {
        section: 'trends',
        tone: 'analytical',
        maxWords: 300,
        requiresSubheadings: true,
        stakeholderFocus: ['Policy analysts', 'Journalists'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Identify at least one month-over-month trend with supporting data.',
          'Reference historical baseline from prior months where available.',
        ],
      },
    },
  },

  'committee-reports': {
    type: 'committee-reports',
    styleClass: 'article-type-committee-reports',
    description: 'Committee report cards with vote breakdown and member attribution.',
    layout: LAYOUT_SINGLE,
    aiDirectives: {
      lede: makeLedeDirective('analytical'),
      'vote-breakdown': {
        section: 'vote-breakdown',
        tone: 'analytical',
        maxWords: 250,
        requiresSubheadings: true,
        stakeholderFocus: ['Committee members', 'Party groups'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'State exact vote counts (Ja / Nej / Avstår / Frånvarande).',
          'Name parties that broke from their group line.',
        ],
      },
      'key-takeaways': makeKeyTakeawaysDirective(['Committees', 'Government', 'Parliament']),
    },
  },

  'propositions': {
    type: 'propositions',
    styleClass: 'article-type-propositions',
    description: 'Government proposition impact assessments with budget tables and stakeholder analysis.',
    layout: LAYOUT_SINGLE,
    aiDirectives: {
      lede: makeLedeDirective('analytical'),
      'impact-assessment': {
        section: 'impact-assessment',
        tone: 'analytical',
        maxWords: 350,
        requiresSubheadings: true,
        stakeholderFocus: ['Taxpayers', 'Businesses', 'Government', 'Opposition'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Quantify fiscal impact where the proposition states a sum.',
          'Identify at least two affected stakeholder groups with opposing interests.',
        ],
      },
      swot: makeSwotDirective('Government Proposition'),
      'key-takeaways': makeKeyTakeawaysDirective(['Government', 'Parliament', 'Citizens']),
    },
  },

  'motions': {
    type: 'motions',
    styleClass: 'article-type-motions',
    description: 'Cross-party motion analysis with party alignment radar.',
    layout: LAYOUT_SINGLE,
    aiDirectives: {
      lede: makeLedeDirective('analytical'),
      'party-alignment': {
        section: 'party-alignment',
        tone: 'analytical',
        maxWords: 250,
        requiresSubheadings: true,
        stakeholderFocus: ['Party groups', 'Opposition', 'Government'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'For each motion, state the proposing party and cosignatories.',
          'Identify ideological clusters (left–right, rural–urban, etc.).',
        ],
      },
      'key-takeaways': makeKeyTakeawaysDirective(['Opposition', 'Government', 'Voters']),
    },
  },

  'interpellations': {
    type: 'interpellations',
    styleClass: 'article-type-interpellations',
    description: 'Q&A format interpellation debates with minister response accountability.',
    layout: LAYOUT_SINGLE,
    aiDirectives: {
      lede: makeLedeDirective('investigative'),
      'minister-response': {
        section: 'minister-response',
        tone: 'investigative',
        maxWords: 300,
        requiresSubheadings: true,
        stakeholderFocus: ['Ministers', 'Questioners', 'Parliament'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Quote the minister\'s key commitment or evasion verbatim if available.',
          'Assess whether the response addressed the specific question raised.',
        ],
      },
      'accountability-tracker': {
        section: 'accountability-tracker',
        tone: 'investigative',
        maxWords: 200,
        requiresSubheadings: false,
        stakeholderFocus: ['Ministers', 'Parliament', 'Voters'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Link to prior interpellations on the same topic where possible.',
          'Rate response adequacy: Comprehensive / Partial / Evasive.',
        ],
      },
    },
  },

  'breaking': {
    type: 'breaking',
    styleClass: 'article-type-breaking',
    description: 'High-urgency alert format with severity indicator and live update structure.',
    layout: LAYOUT_SINGLE_NO_HERO,
    aiDirectives: {
      lede: makeLedeDirective('urgent'),
      context: {
        section: 'context',
        tone: 'informational',
        maxWords: 150,
        requiresSubheadings: false,
        stakeholderFocus: ['Readers', 'Decision-makers'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'State what is known vs what is still developing.',
          'Do not speculate; use conditional language for unconfirmed details.',
        ],
      },
      'impact-assessment': {
        section: 'impact-assessment',
        tone: 'analytical',
        maxWords: 100,
        requiresSubheadings: false,
        stakeholderFocus: ['Parliament', 'Government', 'Citizens'],
        rubric: [
          'One paragraph only.',
          'Focus on immediate, concrete consequences.',
        ],
      },
    },
  },

  'deep-inspection': {
    type: 'deep-inspection',
    styleClass: 'article-type-deep-inspection',
    description: 'Full-dashboard deep analysis with SWOT, mindmap, charts, and Sankey diagram.',
    layout: { columns: 1, sidebar: false, heroSection: true, breadcrumbStyle: 'full' },
    aiDirectives: {
      lede: makeLedeDirective('analytical'),
      swot: makeSwotDirective('Deep-Inspection Subject'),
      mindmap: {
        section: 'mindmap',
        tone: 'analytical',
        maxWords: 200,
        requiresSubheadings: false,
        stakeholderFocus: [],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Identify 4–7 thematic branches relevant to the subject.',
          'Each branch should have 3–5 leaf items with concrete examples.',
        ],
      },
      'deep-analysis': {
        section: 'deep-analysis',
        tone: 'analytical',
        maxWords: 800,
        requiresSubheadings: true,
        stakeholderFocus: ['Policy makers', 'Journalists', 'Researchers'],
        rubric: [
          ...GLOBAL_STYLE_RUBRIC,
          'Use the 5W framework: Who, What, When, Where, Why.',
          'Minimum 3 analytical sub-sections with independent headings.',
          'Cite specific documents, votes, or statements for every claim.',
        ],
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve the full template configuration for a given article type.
 * Falls back to the `breaking` template for unknown types — this means
 * any unrecognised type string will receive the compact, urgency-focused
 * breaking-news layout rather than an error, ensuring graceful degradation
 * across all content generation pipelines.
 *
 * @param type - ArticleType identifier
 * @returns ArticleTemplate configuration object
 */
export function getTemplate(type: ArticleType | string): ArticleTemplate {
  return (REGISTRY as Record<string, ArticleTemplate>)[type] ?? REGISTRY['breaking'];
}

/**
 * Convenience accessor: return only the CSS class string for `<article>`.
 *
 * @param type - ArticleType identifier
 * @returns CSS class such as `"article-type-propositions"`
 */
export function getStyleClass(type: ArticleType | string): string {
  return getTemplate(type).styleClass;
}

/**
 * Convenience accessor: return only the AI directives map for a type.
 *
 * @param type - ArticleType identifier
 * @returns Record of section name → AIStyleDirective
 */
export function getAIDirectives(
  type: ArticleType | string,
): Readonly<Record<string, AIStyleDirective>> {
  return getTemplate(type).aiDirectives;
}

/**
 * Return the layout configuration for a given article type.
 *
 * @param type - ArticleType identifier
 * @returns LayoutConfig
 */
export function getLayout(type: ArticleType | string): LayoutConfig {
  return getTemplate(type).layout;
}

/**
 * List all registered article types.
 *
 * @returns Array of ArticleType strings
 */
export function listRegisteredTypes(): readonly ArticleType[] {
  return Object.keys(REGISTRY) as ArticleType[];
}
