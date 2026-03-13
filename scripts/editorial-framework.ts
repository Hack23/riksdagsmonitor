/**
 * @module Intelligence/EditorialFramework
 * @description Article type profiles defining AI analysis depth, editorial sections,
 * and quality thresholds for each article type in the Riksdagsmonitor news pipeline.
 *
 * Each profile specifies:
 * - SWOT analysis requirements (full, condensed, quick, none)
 * - Dashboard chart requirements (Chart.js visualizations)
 * - Mindmap requirements (CSS mindmap sections)
 * - Minimum stakeholder count for analysis
 * - Number of AI analysis iterations required
 * - Minimum word count thresholds
 * - Required editorial sections
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * SWOT analysis depth for an article type.
 * - 'full': Complete SWOT with 5+ stakeholder perspectives per quadrant
 * - 'condensed': Abbreviated SWOT with 3 stakeholder perspectives
 * - 'quick': Single-paragraph SWOT overview
 * - 'none': No SWOT required
 */
export type SwotDepth = 'full' | 'condensed' | 'quick' | 'none';

/**
 * Analysis depth tier for AI iteration control.
 * - 'standard': 1–2 AI iterations; suitable for routine coverage
 * - 'deep': 2–3 AI iterations; suitable for complex multi-stakeholder topics
 * - 'comprehensive': 3+ AI iterations; suitable for flagship investigative pieces
 */
export type AnalysisDepth = 'standard' | 'deep' | 'comprehensive';

/**
 * Editorial section identifiers required per article type.
 * Each identifier maps to a named section that must appear in the generated HTML.
 */
export type EditorialSection =
  | 'executive-summary'
  | 'stakeholder-impact'
  | 'swot-analysis'
  | 'policy-dashboard'
  | 'policy-mindmap'
  | 'deep-analysis'
  | 'watch-points'
  | 'sources-methodology';

/**
 * Profile describing the editorial requirements for a single article type.
 */
export interface ArticleTypeProfile {
  /** Human-readable label for this article type */
  label: string;
  /** SWOT analysis depth requirement */
  swot: SwotDepth;
  /** Whether a Chart.js policy dashboard section is required */
  dashboard: boolean;
  /** Minimum number of charts to include when dashboard is required */
  minCharts: number;
  /** Whether a CSS mindmap section is required */
  mindmap: boolean;
  /** Minimum number of stakeholder perspectives to include */
  minStakeholders: number;
  /** Number of AI analysis iterations required to meet quality standards */
  aiIterations: number;
  /** Minimum word count for the generated article */
  minWordCount: number;
  /** Default analysis depth for workflow_dispatch input */
  defaultAnalysisDepth: AnalysisDepth;
  /** Ordered list of required editorial sections */
  requiredSections: EditorialSection[];
  /** Quality gate thresholds that must be met before PR creation */
  qualityThresholds: {
    /** Minimum quality score (0–100) from article-quality-enhancer.ts */
    minQualityScore: number;
    /** Minimum number of policy domains detected */
    minPolicyDomains: number;
    /** Whether stakeholder diversity check is required */
    requireStakeholderDiversity: boolean;
  };
}

/**
 * Editorial profiles for all 11 article types supported by the news generation pipeline.
 *
 * Profiles are ordered by analysis complexity from most to least intensive.
 */
export const ARTICLE_TYPE_PROFILES: Readonly<Record<string, ArticleTypeProfile>> = {
  'deep-inspection': {
    label: 'Deep Inspection',
    swot: 'full',
    dashboard: true,
    minCharts: 4,
    mindmap: true,
    minStakeholders: 7,
    aiIterations: 3,
    minWordCount: 2000,
    defaultAnalysisDepth: 'comprehensive',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'swot-analysis',
      'policy-dashboard',
      'policy-mindmap',
      'deep-analysis',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 70,
      minPolicyDomains: 3,
      requireStakeholderDiversity: true,
    },
  },

  'monthly-review': {
    label: 'Monthly Review',
    swot: 'full',
    dashboard: true,
    minCharts: 4,
    mindmap: true,
    minStakeholders: 7,
    aiIterations: 3,
    minWordCount: 1800,
    defaultAnalysisDepth: 'deep',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'swot-analysis',
      'policy-dashboard',
      'policy-mindmap',
      'deep-analysis',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 65,
      minPolicyDomains: 3,
      requireStakeholderDiversity: true,
    },
  },

  'committee-reports': {
    label: 'Committee Reports',
    swot: 'full',
    dashboard: true,
    minCharts: 2,
    mindmap: true,
    minStakeholders: 5,
    aiIterations: 2,
    minWordCount: 800,
    defaultAnalysisDepth: 'deep',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'swot-analysis',
      'policy-dashboard',
      'policy-mindmap',
      'deep-analysis',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 55,
      minPolicyDomains: 2,
      requireStakeholderDiversity: true,
    },
  },

  'propositions': {
    label: 'Government Propositions',
    swot: 'full',
    dashboard: true,
    minCharts: 2,
    mindmap: true,
    minStakeholders: 5,
    aiIterations: 2,
    minWordCount: 800,
    defaultAnalysisDepth: 'deep',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'swot-analysis',
      'policy-dashboard',
      'policy-mindmap',
      'deep-analysis',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 55,
      minPolicyDomains: 2,
      requireStakeholderDiversity: true,
    },
  },

  'weekly-review': {
    label: 'Weekly Review',
    swot: 'condensed',
    dashboard: true,
    minCharts: 2,
    mindmap: true,
    minStakeholders: 5,
    aiIterations: 2,
    minWordCount: 1000,
    defaultAnalysisDepth: 'standard',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'swot-analysis',
      'policy-dashboard',
      'deep-analysis',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 50,
      minPolicyDomains: 2,
      requireStakeholderDiversity: false,
    },
  },

  'motions': {
    label: 'Opposition Motions',
    swot: 'condensed',
    dashboard: true,
    minCharts: 1,
    mindmap: false,
    minStakeholders: 4,
    aiIterations: 2,
    minWordCount: 700,
    defaultAnalysisDepth: 'standard',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'swot-analysis',
      'deep-analysis',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 50,
      minPolicyDomains: 1,
      requireStakeholderDiversity: false,
    },
  },

  'interpellations': {
    label: 'Interpellation Debates',
    swot: 'condensed',
    dashboard: true,
    minCharts: 1,
    mindmap: false,
    minStakeholders: 4,
    aiIterations: 2,
    minWordCount: 700,
    defaultAnalysisDepth: 'standard',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'swot-analysis',
      'deep-analysis',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 50,
      minPolicyDomains: 1,
      requireStakeholderDiversity: false,
    },
  },

  'month-ahead': {
    label: 'Month Ahead',
    swot: 'condensed',
    dashboard: true,
    minCharts: 2,
    mindmap: true,
    minStakeholders: 5,
    aiIterations: 2,
    minWordCount: 900,
    defaultAnalysisDepth: 'standard',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'swot-analysis',
      'policy-dashboard',
      'policy-mindmap',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 50,
      minPolicyDomains: 2,
      requireStakeholderDiversity: false,
    },
  },

  'week-ahead': {
    label: 'Week Ahead',
    swot: 'quick',
    dashboard: true,
    minCharts: 2,
    mindmap: false,
    minStakeholders: 3,
    aiIterations: 1,
    minWordCount: 600,
    defaultAnalysisDepth: 'standard',
    requiredSections: [
      'executive-summary',
      'policy-dashboard',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 40,
      minPolicyDomains: 1,
      requireStakeholderDiversity: false,
    },
  },

  'evening-analysis': {
    label: 'Evening Analysis',
    swot: 'quick',
    dashboard: true,
    minCharts: 1,
    mindmap: false,
    minStakeholders: 3,
    aiIterations: 1,
    minWordCount: 600,
    defaultAnalysisDepth: 'standard',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'deep-analysis',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 40,
      minPolicyDomains: 1,
      requireStakeholderDiversity: false,
    },
  },

  'breaking': {
    label: 'Breaking News',
    swot: 'quick',
    dashboard: false,
    minCharts: 0,
    mindmap: false,
    minStakeholders: 3,
    aiIterations: 1,
    minWordCount: 400,
    defaultAnalysisDepth: 'standard',
    requiredSections: [
      'executive-summary',
      'stakeholder-impact',
      'watch-points',
      'sources-methodology',
    ],
    qualityThresholds: {
      minQualityScore: 40,
      minPolicyDomains: 1,
      requireStakeholderDiversity: false,
    },
  },
} as const;

/**
 * Get the profile for an article type.
 *
 * @param articleType - The article type identifier
 * @returns The editorial profile, or the 'breaking' profile as a safe fallback
 */
export function getArticleTypeProfile(articleType: string): ArticleTypeProfile {
  return ARTICLE_TYPE_PROFILES[articleType] ?? ARTICLE_TYPE_PROFILES['breaking']!;
}

/**
 * Resolve the effective AI iteration count based on the requested depth and profile.
 *
 * @param articleType - The article type identifier
 * @param requestedDepth - The analysis depth requested via workflow_dispatch input
 * @returns Number of AI analysis iterations to perform
 */
export function resolveAiIterations(
  articleType: string,
  requestedDepth: AnalysisDepth,
): number {
  const profile = getArticleTypeProfile(articleType);
  switch (requestedDepth) {
    case 'standard':
      return Math.max(1, profile.aiIterations);
    case 'deep':
      // deep always enforces at least 2 iterations regardless of profile default
      return Math.max(2, profile.aiIterations);
    case 'comprehensive':
      // comprehensive uses the full profile iteration count (minimum 3)
      return Math.max(3, profile.aiIterations);
  }
}

/**
 * Check whether a given analysis depth string is a valid AnalysisDepth value.
 *
 * @param depth - The string to validate
 * @returns true if valid, false otherwise
 */
export function isValidAnalysisDepth(depth: unknown): depth is AnalysisDepth {
  return depth === 'standard' || depth === 'deep' || depth === 'comprehensive';
}

/**
 * Minimum quality thresholds shared across all article types as a floor.
 * Individual profiles may raise these values but cannot lower them below these floors.
 */
export const GLOBAL_QUALITY_FLOOR = {
  minWordCount: 400,
  minQualityScore: 40,
  minPolicyDomains: 1,
} as const;

/**
 * Editorial framework version for cache-busting and compatibility tracking.
 */
export const EDITORIAL_FRAMEWORK_VERSION = '1.0.0';
