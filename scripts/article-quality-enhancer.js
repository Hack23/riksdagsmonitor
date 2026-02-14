#!/usr/bin/env node

/**
 * Article Quality Enhancer - Economist-Style Quality Framework
 * 
 * Implements The Economist-style quality standards for political journalism:
 * - Analytical depth assessment (min 0.6)
 * - Source quality validation (min 3 cross-references)
 * - Party perspective counting (min 4 parties)
 * - "Why This Matters" section detection
 * - Historical context validation
 * - Quality score calculation (0.0-1.0, min 0.75)
 * 
 * Usage: 
 *   import { enhanceArticleQuality } from './article-quality-enhancer.js';
 *   const result = await enhanceArticleQuality(articlePath, options);
 * 
 * @see Issue #150 (News Realtime Monitor Enhancement)
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
 * Swedish political parties for perspective validation
 */
const SWEDISH_PARTIES = [
  'Socialdemokraterna', 'S', 'Social Democrats',
  'Moderaterna', 'M', 'Moderate',
  'Sverigedemokraterna', 'SD', 'Sweden Democrats',
  'Centerpartiet', 'C', 'Centre Party',
  'Vänsterpartiet', 'V', 'Left Party',
  'Kristdemokraterna', 'KD', 'Christian Democrats',
  'Liberalerna', 'L', 'Liberals',
  'Miljöpartiet', 'MP', 'Green Party'
];

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
 * @param {string} content - HTML content of article
 * @returns {number} Number of unique parties mentioned
 */
function countPartyPerspectives(content) {
  const text = content;
  const partiesFound = new Set();
  
  SWEDISH_PARTIES.forEach(party => {
    const regex = new RegExp(`\\b${party}\\b`, 'gi');
    if (regex.test(text)) {
      // Normalize to party abbreviation
      if (['Socialdemokraterna', 'Social Democrats'].includes(party)) partiesFound.add('S');
      else if (['Moderaterna', 'Moderate'].includes(party)) partiesFound.add('M');
      else if (['Sverigedemokraterna', 'Sweden Democrats'].includes(party)) partiesFound.add('SD');
      else if (['Centerpartiet', 'Centre Party'].includes(party)) partiesFound.add('C');
      else if (['Vänsterpartiet', 'Left Party'].includes(party)) partiesFound.add('V');
      else if (['Kristdemokraterna', 'Christian Democrats'].includes(party)) partiesFound.add('KD');
      else if (['Liberalerna', 'Liberals'].includes(party)) partiesFound.add('L');
      else if (['Miljöpartiet', 'Green Party'].includes(party)) partiesFound.add('MP');
      else partiesFound.add(party);
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
  
  if (options.recommendHistoricalContext && !metrics.hasHistoricalContext) {
    issues.push('Recommended: Add historical context');
  }
  
  if (options.recommendInternationalComparison && !metrics.hasInternationalComparison) {
    issues.push('Recommended: Add international comparison');
  }
  
  return {
    passed: issues.length === 0,
    qualityScore,
    metrics,
    issues,
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
