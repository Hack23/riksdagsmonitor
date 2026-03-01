#!/usr/bin/env node

/**
 * @module Intelligence/ContentQuality
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Article Quality Enhancer - Economist-Style Content Validation Framework (TypeScript)
 *
 * @description
 * Comprehensive content quality assurance system implementing The Economist-style editorial standards
 * for political journalism. This utility validates article structure, analytical depth, source attribution,
 * and perspective diversity to ensure intelligence reporting meets rigorous transparency requirements.
 *
 * @author Hack23 AB (Content Intelligence Team)
 * @license Apache-2.0
 * @version 2.0.0
 */

import fs from 'fs';
import type { QualityThresholds, QualityMetrics, QualityResult } from './types/validation.js';
import { hasEconomicContext } from './world-bank-context.js';

/**
 * Map of normalized party codes to their common name variants.
 * Prevents double-counting when both full names and abbreviations appear.
 */
const PARTY_VARIANTS: Readonly<Record<string, readonly string[]>> = {
  S: ['Socialdemokraterna', 'Social Democrats', 'S'],
  M: ['Moderaterna', 'Moderate', 'M'],
  SD: ['Sverigedemokraterna', 'Sweden Democrats', 'SD'],
  C: ['Centerpartiet', 'Centre Party', 'C'],
  V: ['Vänsterpartiet', 'Left Party', 'V'],
  KD: ['Kristdemokraterna', 'Christian Democrats', 'KD'],
  L: ['Liberalerna', 'Liberals', 'L'],
  MP: ['Miljöpartiet', 'Green Party', 'MP'],
} as const;

/**
 * Riksdag/Regering document ID patterns
 */
const DOCUMENT_ID_PATTERNS: readonly RegExp[] = [
  /\b[A-Z]{1,3}\d{1,4}\/\d{2}:\d+\b/g,              // Committee reports: AU10/24:1
  /\bProp\.\s*\d{4}\/\d{2}:\d+\b/gi,                 // Propositions: Prop. 2024/25:1
  /\bBet\.\s*\d{4}\/\d{2}:[A-Z]{1,3}\d+\b/gi,        // Committee reports: Bet. 2024/25:FiU10
  /\bMot\.\s*\d{4}\/\d{2}:\d+\b/gi,                  // Motions: Mot. 2024/25:123
  /\bIP\s*\d{4}\/\d{2}:\d+\b/gi,                     // Interpellations: IP 2024/25:45
  /\bFr\.\s*\d{4}\/\d{2}:\d+\b/gi,                   // Questions: Fr. 2024/25:67
];

/**
 * Default quality thresholds based on The Economist standards
 */
const DEFAULT_THRESHOLDS: QualityThresholds = {
  minQualityScore: 0.80,
  minAnalyticalDepth: 0.6,
  minPartySources: 6,
  minCrossReferences: 3,
  requireWhyThisMatters: true,
  requireHistoricalContext: true,
  recommendHistoricalContext: true,
  recommendInternationalComparison: false,
  recommendEconomicContext: true,
};

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Assess analytical depth of article content
 *
 * Looks for:
 * - Causal reasoning ("because", "therefore", "as a result")
 * - Comparative analysis ("compared to", "in contrast", "while")
 * - Trend analysis ("trend", "pattern", "shift")
 * - Evidence-based claims (references to data, studies, reports)
 * - Multiple perspectives (quotes from different actors)
 *
 * @param content - HTML content of article
 * @returns Score 0.0-1.0
 */
function assessAnalyticalDepth(content: string): number {
  const text: string = stripHtml(content).toLowerCase();
  let score: number = 0.0;

  // Causal reasoning indicators (0.2 max)
  const causalWords: readonly string[] = ['because', 'therefore', 'as a result', 'consequently', 'due to', 'leads to', 'caused by'];
  const causalCount: number = causalWords.filter((word: string) => text.includes(word)).length;
  score += Math.min(causalCount * 0.04, 0.2);

  // Comparative analysis (0.2 max)
  const comparativeWords: readonly string[] = ['compared to', 'in contrast', 'while', 'whereas', 'on the other hand', 'however'];
  const comparativeCount: number = comparativeWords.filter((word: string) => text.includes(word)).length;
  score += Math.min(comparativeCount * 0.04, 0.2);

  // Trend/pattern analysis (0.2 max)
  const trendWords: readonly string[] = ['trend', 'pattern', 'shift', 'change', 'evolution', 'development'];
  const trendCount: number = trendWords.filter((word: string) => text.includes(word)).length;
  score += Math.min(trendCount * 0.04, 0.2);

  // Evidence-based claims (0.2 max)
  const evidenceWords: readonly string[] = ['data shows', 'according to', 'study', 'report', 'statistics', 'evidence'];
  const evidenceCount: number = evidenceWords.filter((word: string) => text.includes(word)).length;
  score += Math.min(evidenceCount * 0.04, 0.2);

  // Multiple perspectives (0.2 max) - count quotes
  const quoteCount: number = (content.match(/<blockquote>/gi) || []).length +
                     (text.match(/"\w/g) || []).length / 2;
  score += Math.min(quoteCount * 0.04, 0.2);

  return Math.min(score, 1.0);
}

/**
 * Count unique party perspectives mentioned in article.
 *
 * Uses PARTY_VARIANTS pattern to prevent double-counting when both
 * full names and abbreviations appear in the same text.
 *
 * @param content - HTML content of article
 * @returns Number of unique parties mentioned
 */
function countPartyPerspectives(content: string): number {
  const text: string = content;
  const partiesFound: Set<string> = new Set();

  // Iterate through party codes and check all variants
  (Object.entries(PARTY_VARIANTS) as [string, readonly string[]][]).forEach(([code, variants]: [string, readonly string[]]) => {
    // Check if any variant of this party is mentioned
    for (const variant of variants) {
      const regex: RegExp = new RegExp(`\\b${variant}\\b`, 'gi');
      if (regex.test(text)) {
        partiesFound.add(code);
        break; // Stop checking variants once party is found
      }
    }
  });

  return partiesFound.size;
}

/**
 * Count cross-referenced Riksdag/Regering documents
 *
 * @param content - HTML content of article
 * @returns Number of unique document IDs found
 */
function countCrossReferences(content: string): number {
  const documentIds: Set<string> = new Set();

  DOCUMENT_ID_PATTERNS.forEach((pattern: RegExp) => {
    const matches: RegExpMatchArray | null = content.match(pattern);
    (matches || []).forEach((match: string) => documentIds.add(match));
  });

  return documentIds.size;
}

/**
 * Detect "Why This Matters" section
 *
 * @param content - HTML content of article
 * @returns True if section exists
 */
function hasWhyThisMatters(content: string): boolean {
  const patterns: readonly RegExp[] = [
    /why\s+this\s+matters/i,
    /varför\s+detta\s+betyder/i,
    /betydelse/i,
    /implications/i,
    /konsekvenser/i,
  ];

  return patterns.some((pattern: RegExp) => pattern.test(content));
}

/**
 * Detect historical context
 *
 * @param content - HTML content of article
 * @returns True if historical context present
 */
function hasHistoricalContext(content: string): boolean {
  const text: string = stripHtml(content).toLowerCase();
  const patterns: readonly RegExp[] = [
    /historically/i,
    /in \d{4}/,
    /since \d{4}/,
    /tidigare/i,
    /historiskt/i,
  ];

  return patterns.some((pattern: RegExp) => pattern.test(text));
}

/**
 * Detect international comparison
 *
 * @param content - HTML content of article
 * @returns True if international comparison present
 */
function hasInternationalComparison(content: string): boolean {
  const text: string = stripHtml(content).toLowerCase();
  const patterns: readonly RegExp[] = [
    /compared to.*country/i,
    /international.*comparison/i,
    /other.*countries/i,
    /jämfört med.*länder/i,
    /internationell.*jämförelse/i,
  ];

  return patterns.some((pattern: RegExp) => pattern.test(text));
}

/**
 * Detect language switcher navigation
 *
 * @param content - HTML content of article
 * @returns True if language switcher nav is present
 */
function hasLanguageSwitcher(content: string): boolean {
  return /class=["'][^"']*\blanguage-switcher\b/.test(content);
}

/**
 * Detect article-top-nav with back-to-news link
 *
 * @param content - HTML content of article
 * @returns True if article-top-nav div is present
 */
function hasArticleTopNav(content: string): boolean {
  return /class=["'][^"']*\barticle-top-nav\b/.test(content);
}

/**
 * Detect back-to-news link (in top nav or footer)
 *
 * @param content - HTML content of article
 * @returns True if back-to-news link is present
 */
function hasBackToNews(content: string): boolean {
  return /class=["'][^"']*\bback-to-news\b/.test(content);
}

/** Weight configuration for quality score calculation */
interface QualityWeights {
  readonly analyticalDepth: number;
  readonly partyPerspectives: number;
  readonly crossReferences: number;
  readonly whyThisMatters: number;
  readonly historicalContext: number;
  readonly internationalComparison: number;
}

/**
 * Calculate overall quality score
 *
 * Weights:
 * - Analytical depth: 30%
 * - Party perspectives: 25%
 * - Cross-references: 25%
 * - "Why This Matters": 10%
 * - Historical context: 5%
 * - International comparison: 5%
 *
 * @param metrics - Individual quality metrics
 * @returns Overall score 0.0-1.0
 */
function calculateQualityScore(metrics: QualityMetrics): number {
  const weights: QualityWeights = {
    analyticalDepth: 0.30,
    partyPerspectives: 0.25,
    crossReferences: 0.25,
    whyThisMatters: 0.10,
    historicalContext: 0.05,
    internationalComparison: 0.05,
  };

  let score: number = 0.0;

  // Analytical depth (already 0-1)
  score += metrics.analyticalDepth * weights.analyticalDepth;

  // Party perspectives (normalize: 6+ parties = 1.0, reflecting 8-party Swedish system)
  score += Math.min(metrics.partyCount / 6, 1.0) * weights.partyPerspectives;

  // Cross-references (normalize: 3+ refs = 1.0)
  score += Math.min(metrics.crossReferences / 3, 1.0) * weights.crossReferences;

  // Binary checks
  score += (metrics.hasWhyThisMatters ? 1.0 : 0.0) * weights.whyThisMatters;
  score += (metrics.hasHistoricalContext ? 1.0 : 0.0) * weights.historicalContext;
  score += (metrics.hasInternationalComparison ? 1.0 : 0.0) * weights.internationalComparison;

  return Math.min(score, 1.0);
}

/**
 * Enhance article quality and validate against thresholds
 *
 * @param articlePath - Path to article HTML file
 * @param thresholds - Quality thresholds (optional, merged with defaults)
 * @returns Quality assessment result
 */
export async function enhanceArticleQuality(
  articlePath: string,
  thresholds: Partial<QualityThresholds> = {},
): Promise<QualityResult> {
  const options: QualityThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  if (!fs.existsSync(articlePath)) {
    return {
      passed: false,
      error: 'Article file not found',
      articlePath,
    };
  }

  const content: string = fs.readFileSync(articlePath, 'utf-8');

  // Collect metrics
  const metrics: QualityMetrics = {
    analyticalDepth: assessAnalyticalDepth(content),
    partyCount: countPartyPerspectives(content),
    crossReferences: countCrossReferences(content),
    hasWhyThisMatters: hasWhyThisMatters(content),
    hasHistoricalContext: hasHistoricalContext(content),
    hasInternationalComparison: hasInternationalComparison(content),
    hasEconomicContext: hasEconomicContext(content),
    hasLanguageSwitcher: hasLanguageSwitcher(content),
    hasArticleTopNav: hasArticleTopNav(content),
    hasBackToNews: hasBackToNews(content),
  };

  // Calculate overall score
  const qualityScore: number = calculateQualityScore(metrics);

  // Validate against thresholds
  const issues: string[] = [];

  if (qualityScore < options.minQualityScore) {
    issues.push(`Quality score ${qualityScore.toFixed(2)} below threshold ${options.minQualityScore}`);
  }

  if (metrics.analyticalDepth < options.minAnalyticalDepth) {
    issues.push(`Analytical depth ${metrics.analyticalDepth.toFixed(2)} below threshold ${options.minAnalyticalDepth}`);
  }

  if (metrics.partyCount < options.minPartySources) {
    issues.push(`Only ${metrics.partyCount} party perspectives (need ${options.minPartySources})`);
  }

  if (metrics.crossReferences < options.minCrossReferences) {
    issues.push(`Only ${metrics.crossReferences} cross-references (need ${options.minCrossReferences})`);
  }

  if (options.requireWhyThisMatters && !metrics.hasWhyThisMatters) {
    issues.push('Missing "Why This Matters" section');
  }

  if (options.requireHistoricalContext && !metrics.hasHistoricalContext) {
    issues.push('Missing required historical context (at least one historical comparison required)');
  }

  // Separate warnings (recommendations) from blocking failures
  const warnings: string[] = [];

  // Only warn about historical context if it is not already a blocking error
  if (options.recommendHistoricalContext && !options.requireHistoricalContext && !metrics.hasHistoricalContext) {
    warnings.push('Recommended: Add historical context');
  }

  if (options.recommendInternationalComparison && !metrics.hasInternationalComparison) {
    warnings.push('Recommended: Add international comparison');
  }

  if (options.recommendEconomicContext && !metrics.hasEconomicContext) {
    warnings.push('Recommended: Add economic context (World Bank indicators, GDP, unemployment data)');
  }

  // Navigation structure warnings (generated by template — fallback fix: scripts/fix-article-navigation.py)
  if (!metrics.hasLanguageSwitcher) {
    warnings.push('Missing language-switcher nav (should be generated by article template)');
  }
  if (!metrics.hasArticleTopNav) {
    warnings.push('Missing article-top-nav div (should be generated by article template)');
  }
  if (!metrics.hasBackToNews) {
    warnings.push('Missing back-to-news link (should be generated by article template)');
  }

  return {
    passed: issues.length === 0, // Only blocking issues affect passed status
    qualityScore,
    metrics,
    issues,
    warnings, // Non-blocking recommendations
    thresholds: options,
    articlePath,
  };
}

/**
 * Batch enhance multiple articles
 *
 * @param articlePaths - Array of article paths
 * @param thresholds - Quality thresholds (optional, merged with defaults)
 * @returns Array of quality results
 */
export async function batchEnhanceQuality(
  articlePaths: readonly string[],
  thresholds: Partial<QualityThresholds> = {},
): Promise<QualityResult[]> {
  const results: QualityResult[] = [];

  for (const articlePath of articlePaths) {
    const result: QualityResult = await enhanceArticleQuality(articlePath, thresholds);
    results.push(result);
  }

  return results;
}

/**
 * Fix common HTML nesting errors in article content.
 *
 * Corrects:
 * - `<p><ul>` → closes `</p>` before `<ul>` (block element inside inline)
 * - `<p><div>` → removes enclosing `<p>` (block element inside inline)
 * - Orphaned `</p>` immediately after `</ul>` → removed
 *
 * @param content - Raw HTML content
 * @returns Fixed HTML content
 */
export function fixHtmlNesting(content: string): string {
  let fixed = content;

  // Fix <p><ul>: close paragraph before list
  fixed = fixed.replace(/<p([^>]*)>\s*(<ul[\s>])/g, '<p$1></p>\n$2');

  // Fix <p><ol>: close paragraph before ordered list
  fixed = fixed.replace(/<p([^>]*)>\s*(<ol[\s>])/g, '<p$1></p>\n$2');

  // Fix <p><div>: remove enclosing <p> around block-level div
  fixed = fixed.replace(/<p([^>]*)>\s*(<div[\s>])/g, '$2');

  // Fix orphaned </p> immediately after </ul>
  fixed = fixed.replace(/<\/ul>\s*<\/p>/g, '</ul>');

  // Fix orphaned </p> immediately after </ol>
  fixed = fixed.replace(/<\/ol>\s*<\/p>/g, '</ol>');

  // Fix orphaned </p> immediately after </div> that was wrapped in <p>
  fixed = fixed.replace(/<\/div>\s*<\/p>/g, '</div>');

  return fixed;
}

/**
 * Fix HTML nesting errors in a file in-place.
 *
 * @param filePath - Path to the HTML file to fix
 * @returns True if the file was modified
 */
export function fixHtmlNestingInFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const original = fs.readFileSync(filePath, 'utf-8');
  const fixed = fixHtmlNesting(original);
  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed, 'utf-8');
    return true;
  }
  return false;
}

// CLI entry point: support --fix flag to fix HTML nesting in news/*.html
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--fix')) {
    const globPattern = process.argv[process.argv.indexOf('--fix') + 1];
    const targetGlob = (globPattern && !globPattern.startsWith('-')) ? globPattern : 'news/*.html';
    const { globSync } = await import('glob');
    const files: string[] = globSync(targetGlob);
    let fixedCount = 0;
    for (const file of files) {
      if (fixHtmlNestingInFile(file)) {
        console.log(`Fixed HTML nesting in: ${file}`);
        fixedCount++;
      }
    }
    console.log(`Fixed ${fixedCount} of ${files.length} files.`);
  }
}

// Export individual assessment functions for testing
export {
  assessAnalyticalDepth,
  countPartyPerspectives,
  countCrossReferences,
  hasWhyThisMatters,
  hasHistoricalContext,
  hasInternationalComparison,
  hasLanguageSwitcher,
  hasArticleTopNav,
  hasBackToNews,
  calculateQualityScore,
  DEFAULT_THRESHOLDS,
};
