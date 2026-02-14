/**
 * Cross-Reference Validation Module
 * 
 * Validates that news articles use required MCP tools and contain proper cross-references
 * Ensures data-driven journalism with multiple verifiable sources
 */

/**
 * Required MCP tools per article type
 */
export const REQUIRED_TOOLS_PER_TYPE = {
  'week-ahead': [
    'get_calendar_events',
    'search_dokument',
    'get_fragor',
    'get_interpellationer'
  ],
  'committee-reports': [
    'get_betankanden',
    'search_voteringar',
    'search_anforanden',
    'get_propositioner'
  ],
  'propositions': [
    'get_propositioner',
    'search_dokument_fulltext',
    'analyze_g0v_by_department',
    'search_anforanden'
  ],
  'motions': [
    'get_motioner',
    'search_dokument_fulltext',
    'analyze_g0v_by_department',
    'search_anforanden'
  ],
  'breaking': [
    'search_voteringar',
    'get_voting_group',
    'search_anforanden',
    'search_ledamoter'
  ]
};

/**
 * Minimum number of distinct data sources required per article
 */
export const MINIMUM_SOURCES = 3;

/**
 * Extract cross-references from article content
 * 
 * @param {string} content - Article HTML or text content
 * @returns {Array} Array of detected cross-references
 */
export function extractCrossReferences(content) {
  if (!content) return [];
  
  const references = [];
  const contentLower = content.toLowerCase();
  
  // Detect MCP tool usage patterns in content
  const patterns = {
    calendar: /calendar|event|schedule|meeting/gi,
    documents: /dokument|document|bill|proposition|motion|betänkande/gi,
    votes: /vote|votering|röst|ballot/gi,
    speeches: /speech|anförande|debate|tal/gi,
    members: /ledamot|mp|member|representative/gi,
    committees: /committee|utskott|commission/gi,
    questions: /question|fråga|interpellation/gi
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(contentLower)) {
      references.push(type);
    }
  }
  
  return references;
}

/**
 * Validate cross-references for an article
 * 
 * @param {string} articleType - Type of article (week-ahead, committee-reports, etc.)
 * @param {string} articleContent - Article HTML or text content
 * @param {Array} mcpCalls - Array of MCP calls made during generation
 * @returns {Object} Validation result
 */
export function validateCrossReferences(articleType, articleContent, mcpCalls = []) {
  const requiredTools = REQUIRED_TOOLS_PER_TYPE[articleType] || [];
  const usedTools = mcpCalls.map(call => call.tool);
  
  // Check which required tools are missing
  const missingTools = requiredTools.filter(tool => !usedTools.includes(tool));
  
  // Check for extra tools used (not required but good for depth)
  const extraTools = usedTools.filter(tool => !requiredTools.includes(tool));
  
  // Extract cross-references from content
  const crossReferencesInText = extractCrossReferences(articleContent);
  
  // Validate minimum sources requirement
  const hasMinimumSources = usedTools.length >= MINIMUM_SOURCES;
  
  // Check if all required tools were used
  const allRequiredToolsUsed = missingTools.length === 0;
  
  // Check if cross-references appear in text
  const hasCrossReferencesInText = crossReferencesInText.length >= MINIMUM_SOURCES;
  
  const passed = allRequiredToolsUsed && hasMinimumSources && hasCrossReferencesInText;
  
  return {
    articleType,
    requiredTools,
    usedTools,
    missingTools,
    extraTools,
    crossReferencesInText,
    sourceCount: usedTools.length,
    hasMinimumSources,
    allRequiredToolsUsed,
    hasCrossReferencesInText,
    passed,
    score: calculateScore(allRequiredToolsUsed, hasMinimumSources, hasCrossReferencesInText, extraTools.length)
  };
}

/**
 * Calculate quality score for cross-referencing (0-1)
 */
function calculateScore(allRequired, minSources, hasReferences, extraCount) {
  let score = 0;
  
  if (allRequired) score += 0.4;
  if (minSources) score += 0.3;
  if (hasReferences) score += 0.2;
  score += Math.min(extraCount * 0.05, 0.1); // Bonus for extra sources
  
  return Math.min(score, 1.0);
}

/**
 * Validate multiple articles at once
 * 
 * @param {Array} articles - Array of article objects with type, content, mcpCalls
 * @returns {Object} Aggregated validation results
 */
export function validateArticleBatch(articles) {
  const results = articles.map(article => 
    validateCrossReferences(article.type, article.content, article.mcpCalls)
  );
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  return {
    total: results.length,
    passed,
    failed,
    avgScore,
    passRate: passed / results.length,
    details: results
  };
}

/**
 * Generate validation report
 * 
 * @param {Object} validation - Validation result from validateCrossReferences
 * @returns {string} Markdown formatted report
 */
export function generateValidationReport(validation) {
  const { articleType, usedTools, missingTools, crossReferencesInText, passed, score } = validation;
  
  let report = `## Cross-Reference Validation Report\n\n`;
  report += `**Article Type**: ${articleType}\n`;
  report += `**Status**: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  report += `**Score**: ${(score * 100).toFixed(0)}%\n\n`;
  
  report += `### MCP Tools Used (${usedTools.length})\n`;
  usedTools.forEach(tool => {
    report += `- ✅ ${tool}\n`;
  });
  
  if (missingTools.length > 0) {
    report += `\n### Missing Required Tools (${missingTools.length})\n`;
    missingTools.forEach(tool => {
      report += `- ❌ ${tool}\n`;
    });
  }
  
  report += `\n### Cross-References in Text (${crossReferencesInText.length})\n`;
  crossReferencesInText.forEach(ref => {
    report += `- ${ref}\n`;
  });
  
  return report;
}

/**
 * Export validation summary for CI/CD
 * 
 * @param {Object} batchResults - Results from validateArticleBatch
 * @returns {Object} CI-friendly summary
 */
export function exportCISummary(batchResults) {
  return {
    status: batchResults.passRate === 1 ? 'success' : 'failure',
    total: batchResults.total,
    passed: batchResults.passed,
    failed: batchResults.failed,
    passRate: `${(batchResults.passRate * 100).toFixed(1)}%`,
    avgScore: `${(batchResults.avgScore * 100).toFixed(1)}%`,
    timestamp: new Date().toISOString()
  };
}
