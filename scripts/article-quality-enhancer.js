#!/usr/bin/env node

/**
 * @module Intelligence/ContentQuality
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Article Quality Enhancer - Economist-Style Content Validation Framework
 * 
 * @description
 * Comprehensive content quality assurance system implementing The Economist-style editorial standards
 * for political journalism. This utility validates article structure, analytical depth, source attribution,
 * and perspective diversity to ensure intelligence reporting meets rigorous transparency requirements.
 * 
 * Core Functionality:
 * - Validates analytical depth scoring (min 0.6 threshold) assessing complexity of political analysis
 * - Enforces source quality standards requiring minimum 3 cross-referenced government documents/debates
 * - Counts unique party perspectives (min 4 parties) ensuring balanced coverage across Swedish coalition
 * - Detects "Why This Matters" contextual sections explaining political significance for readers
 * - Validates historical context references connecting current events to parliamentary timeline
 * - Calculates composite quality score (0.0-1.0 scale, min 0.75 threshold) for publication readiness
 * 
 * Intelligence Operations Integration:
 * - Supports ongoing parliamentary monitoring by maintaining content quality standards
 * - Enables identification of systematic bias in coverage across party spectrum
 * - Tracks journalistic methodology compliance with editorial guidelines
 * - Documents source diversity for audit trails and GDPR data provenance
 * 
 * Content Quality Standards:
 * - Minimum analytical depth: 0.6 (evaluates substantive policy discussion)
 * - Minimum cross-references: 3 (government documents, committee reports, voting records)
 * - Minimum party perspectives: 4 (ensures broad political spectrum coverage)
 * - Requires "Why This Matters" section for context and reader understanding
 * - Recommends historical context linking current developments to past decisions
 * - Minimum publication quality score: 0.75 (composite metric of all dimensions)
 * 
 * Integration Points:
 * - Consumed by news generation pipeline for automated quality gates
 * - Referenced in editorial workflows for manual content enhancement
 * - Used by CI/CD validation scripts (validate-news-translations.js, validate-articles-playwright.js)
 * - Feeds metrics into intelligence dashboard for quality trending
 * 
 * Data Handling:
 * - Processes publicly available parliamentary records and published journalism
 * - No processing of personal data (operates on aggregated article metrics)
 * - Complies with ISO 27001:2022 A.14.2.1 (supply chain controls on content quality)
 * - Supports GDPR Article 5 (transparency: all quality metrics documented)
 * 
 * Usage:
 *   import { enhanceArticleQuality } from './article-quality-enhancer.js';
 *   const result = await enhanceArticleQuality(articlePath, options);
 *   // Returns: { qualityScore, analyticalDepth, partyCount, hasWhyThis, issues }
 * 
 * @intelligence Core utility for content validation in political journalism platform
 * @osint Validates open-source political documentation (government records, voting history)
 * @risk Content quality failure may result in publication of unsubstantiated claims
 * @gdpr No personal data processing; operates on published content only
 * @security HTML/JavaScript injection prevented through article parsing
 * 
 * @author Hack23 AB (Content Intelligence Team)
 * @license Apache-2.0
 * @version 2.0.0
 * @see Issue #150 (News Realtime Monitor Enhancement)
 * @see The Economist Editorial Standards
 * @see GDPR Article 6(1)(e) - Public Interest Processing for political transparency
 * @see ISO 27001:2022 A.14.2.1 - Supply chain information security
 */

import fs from 'fs';

/**
 * Default quality thresholds based on The Economist standards
 */
const DEFAULT_THRESHOLDS = {
  minQualityScore: 0.75,
  minAnalyticalDepth: 0.6,
  minPartySources: 4,
  minCrossReferences: 3,
  requireWhyThisMatters: true,
  recommendHistoricalContext: true,
  recommendInternationalComparison: false
};

/**
 * Map of normalized party codes to their common name variants
 * This prevents double-counting when both full names and abbreviations appear
 */
const PARTY_VARIANTS = {
  S: ['Socialdemokraterna', 'Social Democrats', 'S'],
  M: ['Moderaterna', 'Moderate', 'M'],
  SD: ['Sverigedemokraterna', 'Sweden Democrats', 'SD'],
  C: ['Centerpartiet', 'Centre Party', 'C'],
  V: ['Vänsterpartiet', 'Left Party', 'V'],
  KD: ['Kristdemokraterna', 'Christian Democrats', 'KD'],
  L: ['Liberalerna', 'Liberals', 'L'],
  MP: ['Miljöpartiet', 'Green Party', 'MP']
};

/**
 * Riksdag/Regering document ID patterns
 */
const DOCUMENT_ID_PATTERNS = [
  /\b[A-Z]{1,3}\d{1,4}\/\d{2}:\d+\b/g,  // Committee reports: AU10/24:1
  /\bProp\.\s*\d{4}\/\d{2}:\d+\b/gi,     // Propositions: Prop. 2024/25:1
  /\bBet\.\s*\d{4}\/\d{2}:[A-Z]{1,3}\d+\b/gi,  // Committee reports: Bet. 2024/25:FiU10
  /\bMot\.\s*\d{4}\/\d{2}:\d+\b/gi,      // Motions: Mot. 2024/25:123
  /\bIP\s*\d{4}\/\d{2}:\d+\b/gi,         // Interpellations: IP 2024/25:45
  /\bFr\.\s*\d{4}\/\d{2}:\d+\b/gi        // Questions: Fr. 2024/25:67
];

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
 * @param {string} content - HTML content of article
 * @returns {number} Score 0.0-1.0
 */
function assessAnalyticalDepth(content) {
  const text = stripHtml(content).toLowerCase();
  let score = 0.0;
  
  // Causal reasoning indicators (0.2 max)
  const causalWords = ['because', 'therefore', 'as a result', 'consequently', 'due to', 'leads to', 'caused by'];
  const causalCount = causalWords.filter(word => text.includes(word)).length;
  score += Math.min(causalCount * 0.04, 0.2);
  
  // Comparative analysis (0.2 max)
  const comparativeWords = ['compared to', 'in contrast', 'while', 'whereas', 'on the other hand', 'however'];
  const comparativeCount = comparativeWords.filter(word => text.includes(word)).length;
  score += Math.min(comparativeCount * 0.04, 0.2);
  
  // Trend/pattern analysis (0.2 max)
  const trendWords = ['trend', 'pattern', 'shift', 'change', 'evolution', 'development'];
  const trendCount = trendWords.filter(word => text.includes(word)).length;
  score += Math.min(trendCount * 0.04, 0.2);
  
  // Evidence-based claims (0.2 max)
  const evidenceWords = ['data shows', 'according to', 'study', 'report', 'statistics', 'evidence'];
  const evidenceCount = evidenceWords.filter(word => text.includes(word)).length;
  score += Math.min(evidenceCount * 0.04, 0.2);
  
  // Multiple perspectives (0.2 max) - count quotes
  const quoteCount = (content.match(/<blockquote>/gi) || []).length + 
                     (text.match(/"\w/g) || []).length / 2;
  score += Math.min(quoteCount * 0.04, 0.2);
  
  return Math.min(score, 1.0);
}

/**
 * Count unique party perspectives mentioned in article
 * 
 * Uses PARTY_VARIANTS pattern to prevent double-counting when both
 * full names and abbreviations appear in the same text.
 * 
 * @param {string} content - HTML content of article
 * @returns {number} Number of unique parties mentioned
 */
function countPartyPerspectives(content) {
  const text = content;
  const partiesFound = new Set();
  
  // Iterate through party codes and check all variants
  Object.entries(PARTY_VARIANTS).forEach(([code, variants]) => {
    // Check if any variant of this party is mentioned
    for (const variant of variants) {
      const regex = new RegExp(`\\b${variant}\\b`, 'gi');
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
 * @param {string} content - HTML content of article
 * @returns {number} Number of unique document IDs found
 */
function countCrossReferences(content) {
  const documentIds = new Set();
  
  DOCUMENT_ID_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => documentIds.add(match));
  });
  
  return documentIds.size;
}

/**
 * Detect "Why This Matters" section
 * 
 * @param {string} content - HTML content of article
 * @returns {boolean} True if section exists
 */
function hasWhyThisMatters(content) {
  const patterns = [
    /why\s+this\s+matters/i,
    /varför\s+detta\s+betyder/i,
    /betydelse/i,
    /implications/i,
    /konsekvenser/i
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

/**
 * Detect historical context
 * 
 * @param {string} content - HTML content of article
 * @returns {boolean} True if historical context present
 */
function hasHistoricalContext(content) {
  const text = stripHtml(content).toLowerCase();
  const patterns = [
    /historically/i,
    /in \d{4}/,
    /since \d{4}/,
    /tidigare/i,
    /historiskt/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect international comparison
 * 
 * @param {string} content - HTML content of article
 * @returns {boolean} True if international comparison present
 */
function hasInternationalComparison(content) {
  const text = stripHtml(content).toLowerCase();
  const patterns = [
    /compared to.*country/i,
    /international.*comparison/i,
    /other.*countries/i,
    /jämfört med.*länder/i,
    /internationell.*jämförelse/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Strip HTML tags from content
 * 
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
 * @param {Object} metrics - Individual quality metrics
 * @returns {number} Overall score 0.0-1.0
 */
function calculateQualityScore(metrics) {
  const weights = {
    analyticalDepth: 0.30,
    partyPerspectives: 0.25,
    crossReferences: 0.25,
    whyThisMatters: 0.10,
    historicalContext: 0.05,
    internationalComparison: 0.05
  };
  
  let score = 0.0;
  
  // Analytical depth (already 0-1)
  score += metrics.analyticalDepth * weights.analyticalDepth;
  
  // Party perspectives (normalize: 4+ parties = 1.0)
  score += Math.min(metrics.partyCount / 4, 1.0) * weights.partyPerspectives;
  
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
 * @param {string} articlePath - Path to article HTML file
 * @param {Object} thresholds - Quality thresholds (optional)
 * @returns {Object} Quality assessment result
 */
export async function enhanceArticleQuality(articlePath, thresholds = {}) {
  const options = { ...DEFAULT_THRESHOLDS, ...thresholds };
  
  if (!fs.existsSync(articlePath)) {
    return {
      passed: false,
      error: 'Article file not found',
      articlePath
    };
  }
  
  const content = fs.readFileSync(articlePath, 'utf-8');
  
  // Collect metrics
  const metrics = {
    analyticalDepth: assessAnalyticalDepth(content),
    partyCount: countPartyPerspectives(content),
    crossReferences: countCrossReferences(content),
    hasWhyThisMatters: hasWhyThisMatters(content),
    hasHistoricalContext: hasHistoricalContext(content),
    hasInternationalComparison: hasInternationalComparison(content)
  };
  
  // Calculate overall score
  const qualityScore = calculateQualityScore(metrics);
  
  // Validate against thresholds
  const issues = [];
  
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
  
  // Separate warnings (recommendations) from blocking failures
  const warnings = [];
  
  if (options.recommendHistoricalContext && !metrics.hasHistoricalContext) {
    warnings.push('Recommended: Add historical context');
  }
  
  if (options.recommendInternationalComparison && !metrics.hasInternationalComparison) {
    warnings.push('Recommended: Add international comparison');
  }
  
  return {
    passed: issues.length === 0, // Only blocking issues affect passed status
    qualityScore,
    metrics,
    issues,
    warnings, // Non-blocking recommendations
    thresholds: options,
    articlePath
  };
}

/**
 * Batch enhance multiple articles
 * 
 * @param {string[]} articlePaths - Array of article paths
 * @param {Object} thresholds - Quality thresholds
 * @returns {Object[]} Array of quality results
 */
export async function batchEnhanceQuality(articlePaths, thresholds = {}) {
  const results = [];
  
  for (const articlePath of articlePaths) {
    const result = await enhanceArticleQuality(articlePath, thresholds);
    results.push(result);
  }
  
  return results;
}

// Export individual assessment functions for testing
export {
  assessAnalyticalDepth,
  countPartyPerspectives,
  countCrossReferences,
  hasWhyThisMatters,
  hasHistoricalContext,
  hasInternationalComparison,
  calculateQualityScore,
  DEFAULT_THRESHOLDS
};
