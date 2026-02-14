#!/usr/bin/env node

/**
 * Evening Analysis Validator
 * 
 * Validates evening analysis articles for:
 * - 5 Editorial Pillars structure
 * - Analytical depth (0.0-1.0 scale)
 * - Historical context (0-3 scale)
 * - International comparison presence
 * - Forward-looking content
 * - Party perspectives count
 * - Source citations
 * - Overall quality score
 * 
 * Usage: node scripts/validate-evening-analysis.js <article-path>
 * Example: node scripts/validate-evening-analysis.js news/2026-02-13-evening-analysis-en.html
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

/**
 * Parse HTML article
 */
function parseArticle(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Article not found: ${filepath}`);
  }
  
  const content = fs.readFileSync(filepath, 'utf-8');
  
  return {
    content,
    filepath,
    filename: path.basename(filepath)
  };
}

/**
 * Extract sections from article
 */
function extractSections(html) {
  const sections = {
    leadParagraph: extractLeadParagraph(html),
    parliamentaryPulse: extractSection(html, 'Parliamentary Pulse'),
    governmentWatch: extractSection(html, 'Government Watch'),
    oppositionDynamics: extractSection(html, 'Opposition Dynamics'),
    lookingAhead: extractSection(html, 'Looking Ahead')
  };
  
  return sections;
}

/**
 * Extract lead paragraph
 */
function extractLeadParagraph(html) {
  const match = html.match(/<p class="lede?">\s*([^<]+)\s*<\/p>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract section content by heading
 */
function extractSection(html, heading) {
  const pattern = new RegExp(
    `<h2[^>]*>${heading}</h2>([\\s\\S]*?)(?=<h2|<section|<footer|$)`,
    'i'
  );
  const match = html.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * Count words in section
 */
function countWords(text) {
  if (!text) return 0;
  const cleaned = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.split(' ').filter(w => w.length > 0).length;
}

/**
 * Validate structure of article
 */
function validateStructure(html) {
  const sections = extractSections(html);
  
  const results = {
    hasLeadParagraph: !!sections.leadParagraph,
    hasParliamentaryPulse: !!sections.parliamentaryPulse,
    hasGovernmentWatch: !!sections.governmentWatch,
    hasOppositionDynamics: !!sections.oppositionDynamics,
    hasLookingAhead: !!sections.lookingAhead,
    wordCounts: {
      leadParagraph: countWords(sections.leadParagraph),
      parliamentaryPulse: countWords(sections.parliamentaryPulse),
      governmentWatch: countWords(sections.governmentWatch),
      oppositionDynamics: countWords(sections.oppositionDynamics),
      lookingAhead: countWords(sections.lookingAhead)
    }
  };
  
  // Check minimum word counts
  results.meetsMinimumLength = 
    results.wordCounts.parliamentaryPulse >= 150 &&
    results.wordCounts.governmentWatch >= 150 &&
    results.wordCounts.oppositionDynamics >= 150 &&
    results.wordCounts.lookingAhead >= 80;
  
  // All 5 pillars present
  results.hasAllPillars = 
    results.hasLeadParagraph &&
    results.hasParliamentaryPulse &&
    results.hasGovernmentWatch &&
    results.hasOppositionDynamics &&
    results.hasLookingAhead;
  
  return results;
}

/**
 * Calculate analytical depth score (0.0-1.0)
 */
function calculateAnalyticalDepth(html) {
  let score = 0.0;
  
  const analyticalMarkers = {
    'causal': [/because/i, /as a result/i, /consequently/i, /therefore/i, /thus/i],
    'comparative': [/compared to/i, /more than/i, /less than/i, /unlike/i, /whereas/i],
    'evaluative': [/suggests/i, /reveals/i, /indicates/i, /demonstrates/i, /implies/i],
    'contextual': [/context/i, /background/i, /historically/i, /traditionally/i],
    'forward-looking': [/will/i, /likely/i, /expected/i, /projected/i, /forecast/i]
  };
  
  for (const [category, markers] of Object.entries(analyticalMarkers)) {
    const found = markers.some(marker => marker.test(html));
    if (found) {
      score += 0.2;
    }
  }
  
  return Math.min(1.0, score);
}

/**
 * Detect historical context (0-3 scale)
 */
function detectHistoricalContext(html) {
  let score = 0;
  
  const historicalMarkers = [
    /since \d{4}/i,
    /\d{4} election/i,
    /historically/i,
    /previous (session|government|parliament)/i,
    /compared to (last|previous) (year|session)/i,
    /\d+ years? ago/i
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
function hasInternationalComparison(html) {
  const internationalMarkers = [
    /compared to (other|european|nordic|western)/i,
    /international (standard|norm|context)/i,
    /like (other|many) (countries|democracies)/i,
    /european (union|parliament|commission)/i,
    /global (trend|pattern|context)/i,
    /(denmark|norway|finland|germany|france|uk|united states)/i
  ];
  
  return internationalMarkers.some(marker => marker.test(html));
}

/**
 * Check for forward-looking content
 */
function hasForwardLooking(html) {
  const forwardMarkers = [
    /looking ahead/i,
    /coming (weeks|months|days)/i,
    /expected to/i,
    /will (bring|test|face|require)/i,
    /what to watch/i,
    /tomorrow/i,
    /next (week|month|session|year)/i
  ];
  
  return forwardMarkers.some(marker => marker.test(html));
}

/**
 * Count party perspectives
 */
function countPartyPerspectives(html) {
  const parties = new Set();
  const partyNames = [
    'Socialdemokraterna', 'Moderaterna', 'Sverigedemokraterna', 'SD',
    'Vänsterpartiet', 'Miljöpartiet', 'Centerpartiet', 'Liberalerna',
    'Kristdemokraterna', 'KD', 'V', 'MP', 'C', 'L', 'M', 'S'
  ];
  
  for (const party of partyNames) {
    const pattern = new RegExp(`\\b${party}\\b`, 'i');
    if (pattern.test(html)) {
      parties.add(party);
    }
  }
  
  return parties.size;
}

/**
 * Validate sources
 */
function validateSources(html) {
  const sources = [];
  
  // Extract riksdag-regering-mcp tool mentions
  const mcpMatches = html.matchAll(/riksdag-regering-mcp:\s*([a-z_]+)/gi);
  for (const m of mcpMatches) {
    sources.push(m[1]);
  }
  
  return {
    count: sources.length,
    sources: sources,
    hasSources: sources.length > 0
  };
}

/**
 * Calculate overall quality score (0.0-1.0)
 */
function calculateQualityScore(validation) {
  let score = 0.0;
  let maxScore = 0.0;
  
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
function validateEveningAnalysis(articlePath) {
  try {
    const article = parseArticle(articlePath);
    const html = article.content;
    
    const validation = {
      filepath: article.filepath,
      filename: article.filename,
      structure: validateStructure(html),
      analyticalDepth: calculateAnalyticalDepth(html),
      historicalContext: detectHistoricalContext(html),
      internationalComparison: hasInternationalComparison(html),
      forwardLooking: hasForwardLooking(html),
      partyPerspectives: countPartyPerspectives(html),
      sources: validateSources(html),
      totalWordCount: countWords(html)
    };
    
    // Calculate overall quality score
    validation.qualityScore = calculateQualityScore(validation);
    
    return validation;
  } catch (error) {
    return {
      error: error.message,
      filepath: articlePath
    };
  }
}

/**
 * Print validation results
 */
function printValidation(validation) {
  if (validation.error) {
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
    validation.structure.wordCounts.parliamentaryPulse >= 150 ? '✅' : '⚠️  (min 150)');
  console.log('  • Government Watch:', validation.structure.wordCounts.governmentWatch, 'words',
    validation.structure.wordCounts.governmentWatch >= 150 ? '✅' : '⚠️  (min 150)');
  console.log('  • Opposition Dynamics:', validation.structure.wordCounts.oppositionDynamics, 'words',
    validation.structure.wordCounts.oppositionDynamics >= 150 ? '✅' : '⚠️  (min 150)');
  console.log('  • Looking Ahead:', validation.structure.wordCounts.lookingAhead, 'words',
    validation.structure.wordCounts.lookingAhead >= 80 ? '✅' : '⚠️  (min 80)');
  
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
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/validate-evening-analysis.js <article-path>');
    console.error('Example: node scripts/validate-evening-analysis.js news/2026-02-13-evening-analysis-en.html');
    process.exit(1);
  }
  
  const articlePath = args[0];
  const validation = validateEveningAnalysis(articlePath);
  printValidation(validation);
  
  // Exit with error code if quality is below 0.6
  if (validation.qualityScore && validation.qualityScore < 0.6) {
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
  calculateQualityScore
};
