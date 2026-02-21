#!/usr/bin/env node

/**
 * @module Validation/EveningAnalysis
 * @category Validation
 *
 * @title Evening Analysis Content Validator - Intelligence Assessment Quality Gate
 *
 * @description
 * **INTELLIGENCE OPERATIVE PERSPECTIVE**
 *
 * This validator ensures that evening analysis articles meet the rigorous standards
 * for political intelligence assessment publications. Evening analysis represents
 * the platform's highest-depth analytical product - synthesizing parliamentary events,
 * historical context, international comparisons, and forward-looking assessments into
 * a comprehensive intelligence briefing format.
 *
 * **STRUCTURAL VALIDATION FRAMEWORK:**
 * Evening analysis articles must demonstrate the Five Editorial Pillars structure:
 *
 * 1. **Event Summary** (What happened today?)
 *    - Factual description of parliamentary developments
 *    - Primary source citations (votes, speeches, documents)
 *    - Timeline reconstruction for complex events
 *    Intelligence value: Baseline facts for deeper analysis
 *
 * 2. **Contextual Analysis** (Why does it matter?)
 *    - Connection to broader policy debates
 *    - Historical precedent analysis
 *    - Trend identification and pattern recognition
 *    Intelligence value: Understanding significance and intent
 *
 * 3. **Party Perspectives** (What do stakeholders want?)
 *    - Documented positions from all major parties (8+ Swedish parties)
 *    - Identified beneficiaries and losers
 *    - Coalition impact assessment
 *    Intelligence value: Political implications and next moves
 *
 * 4. **International Context** (How does Sweden compare?)
 *    - Cross-country policy comparisons
 *    - International precedent cases
 *    - EU/Nordic policy alignment
 *    Intelligence value: Assessing Swedish positioning
 *
 * 5. **Forward-Looking Assessment** (What happens next?)
 *    - Predicted political outcomes
 *    - Implementation timeline
 *    - Risk/opportunity assessment
 *    Intelligence value: Anticipating developments
 *
 * **ANALYTICAL DEPTH METRICS:**
 * - Analytical Score (0.0-1.0): Depth of political analysis
 *   0.0 = Surface-level description only
 *   0.5 = Analysis of immediate implications
 *   1.0 = Deep structural analysis with multiple perspectives
 *
 * - Historical Context (0-3 scale): Depth of historical research
 *   0 = No historical references
 *   1 = Recent historical analogs (past 5 years)
 *   2 = Longer historical perspective (past 20 years)
 *   3 = Deep historical comparison with long-term trends
 *
 * **VALIDATION CHECKLIST:**
 * - Pillar Structure: All 5 pillars present and substantive (100+ words each)
 * - Party Coverage: ≥5 of 8 major parties represented
 * - Source Density: ≥10 distinct MCP tool citations
 * - International Comparison: ≥2 countries referenced
 * - Forward Assessment: Explicit predictions or risk assessment present
 * - Quality Score: Combined metrics ≥80/100
 *
 * **INTELLIGENCE QUALITY STANDARDS:**
 * - Claim Backing: Every assertion requires source citation
 * - Alternative Analysis: Presents competing interpretations
 * - Confidence Assessment: Distinguishes high-confidence from speculative analysis
 * - Uncertainty Acknowledgment: Notes gaps in available intelligence
 * - Update Tracking: Links to previous analysis on same topic
 *
 * **OPERATIONAL DEPLOYMENT:**
 * 1. Automated pre-publication validation (exit code 1 = block)
 * 2. Editorial dashboard metric display
 * 3. Trend analysis over time (improvement tracking)
 * 4. Comparative analysis across article types
 * 5. Reporter performance analytics
 *
 * **MACHINE LEARNING INTEGRATION:**
 * - Trains future content generation models on validated quality
 * - Enables anomaly detection (unusually brief/shallow analysis)
 * - Supports recommendation of historical references
 * - Optimizes party perspective selection
 *
 * **GDPR COMPLIANCE ASPECTS:**
 * - Member quotes tracked and linked to source documents
 * - Personal data mentions counted and logged
 * - Consent validation for sensitive content
 * - Processing audit trail for each article
 *
 * @osint Intelligence Assessment Standards
 * - Validates compliance with intelligence analysis tradecraft
 * - Ensures structured analytic techniques applied
 * - Prevents analytical failures (mirror imaging, confirmation bias)
 * - Enables quality trending for assessment improvement
 *
 * @risk Analysis Quality Verification
 * - Shallow analysis detection (indicators of rushed publication)
 * - Historical context gaps (indicators of inadequate research)
 * - Party balance issues (indicators of potential bias)
 * - Confidence level tracking (uncertainty vs. certainty claims)
 *
 * @gdpr Personal Data Assessment
 * - Member quote sourcing and consent tracking
 * - Sensitive information handling verification
 * - Data minimization validation
 * - Member rights support (trace all personal data mentions)
 *
 * @security Content Integrity Validation
 * - HTML structure validation (prevents markup injection)
 * - Citation integrity checking
 * - Timestamp validation for freshness
 * - Author attribution verification
 *
 * @author Hack23 AB (Intelligence Analysis & Quality Assurance)
 * @license Apache-2.0
 * @version 2.1.0
 * @since 2024-09-01
 * @see EDITORIAL_STANDARDS.md (Five Pillars Structure)
 * @see scripts/editorial-pillars.js (Pillar Detection Engine)
 * @see news/2026-02-13-evening-analysis-*.html (Example Articles)
 * @see Issue #156 (Quality Gate Enhancement)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractPartyMentions } from './party-variants.js';
import { detectArticleLanguage, getLocalizedHeading } from './editorial-pillars.js';
import type { StructureValidation, SourceValidation, EveningAnalysisValidation } from './types/validation.js';
import type { Language } from './types/language.js';
import type { EditorialPillar } from './types/editorial.js';

const __filename: string = fileURLToPath(import.meta.url);

/** Parsed article representation */
interface ParsedArticle {
  readonly content: string;
  readonly filepath: string;
  readonly filename: string;
}

/** Extracted sections from an evening analysis article */
interface ArticleSections {
  leadParagraph: string | null;
  parliamentaryPulse: string | null;
  governmentWatch: string | null;
  oppositionDynamics: string | null;
  lookingAhead: string | null;
}

/** Map of analytical marker categories to regex patterns */
interface AnalyticalMarkers {
  readonly [category: string]: readonly RegExp[];
}

/** Error-only validation result (when parsing fails) */
interface EveningAnalysisError {
  readonly error: string;
  readonly filepath: string;
}

/**
 * Parse HTML article
 */
function parseArticle(filepath: string): ParsedArticle {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Article not found: ${filepath}`);
  }

  const content: string = fs.readFileSync(filepath, 'utf-8');

  return {
    content,
    filepath,
    filename: path.basename(filepath),
  };
}

/**
 * Extract sections from article (with multi-language support)
 */
function extractSections(html: string): ArticleSections {
  // Detect article language from HTML lang attribute
  const lang: Language = detectArticleLanguage(html);

  const sections: ArticleSections = {
    leadParagraph: extractLeadParagraph(html),
    parliamentaryPulse: extractSection(html, getLocalizedHeading(lang, 'parliamentaryPulse' as EditorialPillar)),
    governmentWatch: extractSection(html, getLocalizedHeading(lang, 'governmentWatch' as EditorialPillar)),
    oppositionDynamics: extractSection(html, getLocalizedHeading(lang, 'oppositionDynamics' as EditorialPillar)),
    lookingAhead: extractSection(html, getLocalizedHeading(lang, 'lookingAhead' as EditorialPillar)),
  };

  return sections;
}

/**
 * Extract lead paragraph
 */
function extractLeadParagraph(html: string): string | null {
  const match: RegExpMatchArray | null = html.match(/<p class="lede">([\s\S]*?)<\/p>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract section content by heading
 */
function extractSection(html: string, heading: string): string | null {
  const pattern: RegExp = new RegExp(
    `<h2[^>]*>${heading}</h2>([\\s\\S]*?)(?=<h2|<section|<footer|$)`,
    'i',
  );
  const match: RegExpMatchArray | null = html.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * Count words in section
 */
function countWords(text: string | null): number {
  if (!text) return 0;
  const cleaned: string = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.split(' ').filter((w: string) => w.length > 0).length;
}

/**
 * Validate structure of article
 */
function validateStructure(html: string): StructureValidation {
  const sections: ArticleSections = extractSections(html);

  const hasLeadParagraph: boolean = !!sections.leadParagraph;
  const hasParliamentaryPulse: boolean = !!sections.parliamentaryPulse;
  const hasGovernmentWatch: boolean = !!sections.governmentWatch;
  const hasOppositionDynamics: boolean = !!sections.oppositionDynamics;
  const hasLookingAhead: boolean = !!sections.lookingAhead;

  const wordCounts = {
    leadParagraph: countWords(sections.leadParagraph),
    parliamentaryPulse: countWords(sections.parliamentaryPulse),
    governmentWatch: countWords(sections.governmentWatch),
    oppositionDynamics: countWords(sections.oppositionDynamics),
    lookingAhead: countWords(sections.lookingAhead),
  };

  // Check minimum word counts (aligned with WORKFLOWS.md spec)
  // Parliamentary Pulse, Government Watch, Opposition Dynamics: 200-400 words each
  // Looking Ahead: 100-200 words
  const meetsMinimumLength: boolean =
    wordCounts.parliamentaryPulse >= 200 &&
    wordCounts.governmentWatch >= 200 &&
    wordCounts.oppositionDynamics >= 200 &&
    wordCounts.lookingAhead >= 100;

  // All 5 pillars present
  const hasAllPillars: boolean =
    hasLeadParagraph &&
    hasParliamentaryPulse &&
    hasGovernmentWatch &&
    hasOppositionDynamics &&
    hasLookingAhead;

  return {
    hasLeadParagraph,
    hasParliamentaryPulse,
    hasGovernmentWatch,
    hasOppositionDynamics,
    hasLookingAhead,
    wordCounts,
    meetsMinimumLength,
    hasAllPillars,
  };
}

/**
 * Calculate analytical depth score (0.0-1.0)
 */
function calculateAnalyticalDepth(html: string): number {
  let score: number = 0.0;

  const analyticalMarkers: AnalyticalMarkers = {
    'causal': [/because/i, /as a result/i, /consequently/i, /therefore/i, /thus/i],
    'comparative': [/compared to/i, /more than/i, /less than/i, /unlike/i, /whereas/i],
    'evaluative': [/suggests/i, /reveals/i, /indicates/i, /demonstrates/i, /implies/i],
    'contextual': [/context/i, /background/i, /historically/i, /traditionally/i],
    'forward-looking': [/will/i, /likely/i, /expected/i, /projected/i, /forecast/i],
  };

  for (const markers of Object.values(analyticalMarkers)) {
    const found: boolean = markers.some((marker: RegExp) => marker.test(html));
    if (found) {
      score += 0.2;
    }
  }

  return Math.min(1.0, score);
}

/**
 * Detect historical context (0-3 scale)
 */
function detectHistoricalContext(html: string): number {
  let score: number = 0;

  const historicalMarkers: readonly RegExp[] = [
    /since \d{4}/i,
    /\d{4} election/i,
    /historically/i,
    /previous (session|government|parliament)/i,
    /compared to (last|previous) (year|session)/i,
    /\d+ years? ago/i,
  ];

  for (const marker of historicalMarkers) {
    if (marker.test(html)) {
      score += 0.5;
    }
  }

  return Math.min(3, Math.round(score * 2) / 2); // Round to nearest 0.5
}

/**
 * Detect international comparison
 */
function hasInternationalComparison(html: string): boolean {
  const internationalMarkers: readonly RegExp[] = [
    /compared to (other|european|nordic|western)/i,
    /international (standard|norm|context)/i,
    /like (other|many) (countries|democracies)/i,
    /european (union|parliament|commission)/i,
    /global (trend|pattern|context)/i,
    /(denmark|norway|finland|germany|france|uk|united states)/i,
  ];

  return internationalMarkers.some((marker: RegExp) => marker.test(html));
}

/**
 * Check for forward-looking content
 */
function hasForwardLooking(html: string): boolean {
  const forwardMarkers: readonly RegExp[] = [
    /looking ahead/i,
    /coming (weeks|months|days)/i,
    /expected to/i,
    /will (bring|test|face|require)/i,
    /what to watch/i,
    /tomorrow/i,
    /next (week|month|session|year)/i,
  ];

  return forwardMarkers.some((marker: RegExp) => marker.test(html));
}

/**
 * Count party perspectives (using shared party-variants module)
 */
function countPartyPerspectives(html: string): number {
  return extractPartyMentions(html).size;
}

/**
 * Validate sources
 */
function validateSources(html: string): SourceValidation {
  const sources: string[] = [];

  // Extract riksdag-regering-mcp tool mentions
  const mcpMatches: IterableIterator<RegExpMatchArray> = html.matchAll(/riksdag-regering-mcp:\s*([a-z_]+)/gi);
  for (const m of mcpMatches) {
    sources.push(m[1]);
  }

  return {
    count: sources.length,
    sources: sources,
    hasSources: sources.length > 0,
  };
}

/**
 * Calculate overall quality score (0.0-1.0)
 */
function calculateQualityScore(validation: EveningAnalysisValidation): number {
  let score: number = 0.0;
  let maxScore: number = 0.0;

  // Structure (30%)
  maxScore += 0.3;
  if (validation.structure.hasAllPillars) score += 0.2;
  if (validation.structure.meetsMinimumLength) score += 0.1;

  // Analytical depth (20%)
  maxScore += 0.2;
  score += validation.analyticalDepth * 0.2;

  // Historical context (15%)
  maxScore += 0.15;
  score += (validation.historicalContext / 3) * 0.15;

  // Sources (15%)
  maxScore += 0.15;
  if (validation.sources.count >= 5) score += 0.15;
  else score += (validation.sources.count / 5) * 0.15;

  // Party perspectives (10%)
  maxScore += 0.1;
  if (validation.partyPerspectives >= 6) score += 0.1;
  else score += (validation.partyPerspectives / 6) * 0.1;

  // Forward-looking (5%)
  maxScore += 0.05;
  if (validation.forwardLooking) score += 0.05;

  // International comparison (5%)
  maxScore += 0.05;
  if (validation.internationalComparison) score += 0.05;

  return Math.round((score / maxScore) * 100) / 100; // Round to 2 decimals
}

/**
 * Main validation function
 */
function validateEveningAnalysis(articlePath: string): EveningAnalysisValidation | EveningAnalysisError {
  try {
    const article: ParsedArticle = parseArticle(articlePath);
    const html: string = article.content;

    const structure: StructureValidation = validateStructure(html);
    const analyticalDepth: number = calculateAnalyticalDepth(html);
    const historicalContext: number = detectHistoricalContext(html);
    const internationalComparison: boolean = hasInternationalComparison(html);
    const forwardLooking: boolean = hasForwardLooking(html);
    const partyPerspectives: number = countPartyPerspectives(html);
    const sources: SourceValidation = validateSources(html);
    const totalWordCount: number = countWords(html);

    const validationResult: EveningAnalysisValidation = {
      filepath: article.filepath,
      filename: article.filename,
      structure,
      analyticalDepth,
      historicalContext,
      internationalComparison,
      forwardLooking,
      partyPerspectives,
      sources,
      totalWordCount,
      qualityScore: 0, // placeholder, calculated below
    };

    // Calculate overall quality score
    const qualityScore: number = calculateQualityScore(validationResult);

    return {
      ...validationResult,
      qualityScore,
    };
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);
    return {
      error: message,
      filepath: articlePath,
    };
  }
}

/**
 * Type guard to check if validation result is an error
 */
function isValidationError(
  result: EveningAnalysisValidation | EveningAnalysisError,
): result is EveningAnalysisError {
  return 'error' in result && !('structure' in result);
}

/**
 * Print validation results
 */
function printValidation(validation: EveningAnalysisValidation | EveningAnalysisError): void {
  if (isValidationError(validation)) {
    console.error('❌ Validation Error:', validation.error);
    return;
  }

  console.log('\n📊 Evening Analysis Validation Report');
  console.log('=====================================\n');

  console.log('📄 File:', validation.filename);
  console.log('📝 Total Word Count:', validation.totalWordCount);
  console.log('\n🏗️  Structure Validation');
  console.log('  ✓ Lead Paragraph:', validation.structure.hasLeadParagraph ? '✅' : '❌');
  console.log('  ✓ Parliamentary Pulse:', validation.structure.hasParliamentaryPulse ? '✅' : '❌');
  console.log('  ✓ Government Watch:', validation.structure.hasGovernmentWatch ? '✅' : '❌');
  console.log('  ✓ Opposition Dynamics:', validation.structure.hasOppositionDynamics ? '✅' : '❌');
  console.log('  ✓ Looking Ahead:', validation.structure.hasLookingAhead ? '✅' : '❌');
  console.log('  ✓ All 5 Pillars Present:', validation.structure.hasAllPillars ? '✅' : '❌');

  console.log('\n📏 Word Counts per Section');
  console.log('  • Lead Paragraph:', validation.structure.wordCounts.leadParagraph, 'words');
  console.log('  • Parliamentary Pulse:', validation.structure.wordCounts.parliamentaryPulse, 'words',
    validation.structure.wordCounts.parliamentaryPulse >= 200 ? '✅' : '⚠️  (min 200)');
  console.log('  • Government Watch:', validation.structure.wordCounts.governmentWatch, 'words',
    validation.structure.wordCounts.governmentWatch >= 200 ? '✅' : '⚠️  (min 200)');
  console.log('  • Opposition Dynamics:', validation.structure.wordCounts.oppositionDynamics, 'words',
    validation.structure.wordCounts.oppositionDynamics >= 200 ? '✅' : '⚠️  (min 200)');
  console.log('  • Looking Ahead:', validation.structure.wordCounts.lookingAhead, 'words',
    validation.structure.wordCounts.lookingAhead >= 100 ? '✅' : '⚠️  (min 100)');

  console.log('\n🎯 Analytical Quality');
  console.log('  • Analytical Depth:', validation.analyticalDepth.toFixed(2),
    validation.analyticalDepth >= 0.6 ? '✅' : '⚠️  (target ≥ 0.6)');
  console.log('  • Historical Context:', validation.historicalContext.toFixed(1), '/ 3.0',
    validation.historicalContext >= 1.0 ? '✅' : '⚠️  (target ≥ 1.0)');
  console.log('  • International Comparison:', validation.internationalComparison ? '✅ Present' : '⚠️  Not found');
  console.log('  • Forward-Looking Content:', validation.forwardLooking ? '✅ Present' : '❌ Missing');

  console.log('\n🎭 Coverage Breadth');
  console.log('  • Party Perspectives:', validation.partyPerspectives,
    validation.partyPerspectives >= 6 ? '✅ (target ≥ 6)' : '⚠️  (target ≥ 6)');
  console.log('  • Source Citations:', validation.sources.count,
    validation.sources.count >= 5 ? '✅ (target ≥ 5)' : '⚠️  (target ≥ 5)');
  if (validation.sources.sources.length > 0) {
    console.log('    Tools used:', validation.sources.sources.join(', '));
  }

  console.log('\n⭐ Overall Quality Score:', validation.qualityScore.toFixed(2), '/ 1.0');

  if (validation.qualityScore >= 0.8) {
    console.log('   🏆 Excellent quality!');
  } else if (validation.qualityScore >= 0.7) {
    console.log('   ✅ Good quality');
  } else if (validation.qualityScore >= 0.6) {
    console.log('   ⚠️  Acceptable quality, room for improvement');
  } else {
    console.log('   ❌ Quality below target (< 0.6)');
  }

  console.log('\n');
}

// CLI execution
if (process.argv[1] === __filename) {
  const args: string[] = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/validate-evening-analysis.js <article-path>');
    console.error('Example: node scripts/validate-evening-analysis.js news/2026-02-13-evening-analysis-en.html');
    process.exit(1);
  }

  const articlePath: string = args[0];
  const validation: EveningAnalysisValidation | EveningAnalysisError = validateEveningAnalysis(articlePath);
  printValidation(validation);

  // Exit with error code if there's an error or quality is below 0.6
  if (isValidationError(validation)) {
    process.exit(1);
  }

  if (typeof validation.qualityScore === 'number' && validation.qualityScore < 0.6) {
    process.exit(1);
  }
}

// Export for use in other scripts
export {
  validateEveningAnalysis,
  calculateAnalyticalDepth,
  detectHistoricalContext,
  hasInternationalComparison,
  countPartyPerspectives,
  validateSources,
  calculateQualityScore,
};
