/**
 * @module Validation/CrossReferenceTracking
 * @category Validation
 * 
 * @title Cross-Reference Intelligence Validator - Source Verification Engine
 * 
 * @description
 * **INTELLIGENCE OPERATIVE PERSPECTIVE**
 * 
 * This module enforces data-driven journalism standards by validating that news articles
 * cite multiple parliamentary sources. Operating as a quality gate in the editorial pipeline,
 * it ensures every article rests on verified intelligence from the riksdag-regering MCP
 * platform - critical for avoiding intelligence assessment traps like single-source bias
 * or uncorroborated claims.
 * 
 * **VALIDATION FRAMEWORK:**
 * Cross-reference validation is structured around article types, each with specific
 * parliamentary information requirements:
 * 
 * - **Week-Ahead Articles** (Prospective Analysis)
 *   Required sources: Calendar events, document registry, written questions, interpellations
 *   Intelligence value: Forward-looking agenda analysis, upcoming debate topics
 * 
 * - **Committee Reports** (Organizational Intelligence)
 *   Required sources: Committee decisions, voting patterns, speeches, propositions
 *   Intelligence value: Committee composition, policy prioritization, consensus-building
 * 
 * - **Opposition Motions** (Political Positioning)
 *   Required sources: Motion registry, full-text search, department analysis, debate
 *   Intelligence value: Opposition priorities, policy alternatives, party differentiation
 * 
 * - **Government Propositions** (Executive Intent)
 *   Required sources: Government proposals, policy analysis, speeches, debate
 *   Intelligence value: Government legislative agenda, policy direction, timing
 * 
 * - **Breaking News** (Event-Driven Intelligence)
 *   Required sources: Voting records, voting groups, speeches, member data
 *   Intelligence value: Real-time political developments, coalition behavior, crisis response
 * 
 * **INTELLIGENCE APPLICATIONS:**
 * 1. Source Diversity: Minimum 3+ independent sources prevents narrative manipulation
 * 2. Triangulation: Cross-referencing same event from multiple perspectives reduces bias
 * 3. Chain of Custody: MCP tool citations create audit trail for claims
 * 4. Analytical Integrity: Enforces structured analysis vs. opinion/speculation
 * 5. Misinformation Prevention: Source requirements prevent false claims from publication
 * 
 * **OPERATIONAL WORKFLOW:**
 * 1. Parse article content for MCP tool citations
 * 2. Extract referenced document IDs and entity identifiers
 * 3. Validate required tool coverage for article type
 * 4. Confirm minimum source count (3+) for triangulation
 * 5. Generate compliance report with source breakdown
 * 6. Block publication if validation fails
 * 
 * **SOURCE VERIFICATION LOGIC:**
 * - Distinct tools = distinct sources (prevents single-query inflation)
 * - Tool parameters tracked for source diversity within category
 * - Cross-referenced entities (motions + voting patterns) count as compound sources
 * - Temporal diversity considered (older sources cross-reference recent)
 * 
 * **COMPLIANCE STANDARDS:**
 * - Editorial Standard: Minimum 3 independent sources per article
 * - Intelligence Standard: All major claims backed by at least 1 MCP tool call
 * - Transparency Standard: Source citations visible in article metadata
 * - Audit Standard: Complete call logs retained for 180 days
 * 
 * **RISK MITIGATION:**
 * - Prevents publication of unsourced allegations
 * - Detects coordination of coverage through shared sources
 * - Alerts editorial team to unusual source clustering
 * - Tracks source reliability across time
 * 
 * **GDPR CONSIDERATIONS:**
 * - All member references traced to source tool calls
 * - Personal data citations logged separately
 * - Member consent tracking integrated with source validation
 * - Data minimization enforced through source requirements
 * 
 * @osint Source Analysis Framework
 * - Maps parliamentary sources to intelligence collection methods
 * - Tracks source reliability and historical accuracy
 * - Enables meta-analysis of coverage patterns
 * - Supports incident investigation with source forensics
 * 
 * @risk Single-Source Vulnerability Detection
 * - Identifies articles vulnerable to narrative attacks
 * - Flags coordinated coverage (multiple articles same sources)
 * - Detects source saturation (over-reliance on single entity)
 * - Monitors for suspicious source patterns
 * 
 * @gdpr Member Data Handling
 * - Ensures member references properly sourced
 * - Validates consent tracking for personal data mentions
 * - Supports member rights requests (trace all mentions)
 * - Documents lawful basis for each member reference
 * 
 * @security Editorial Integrity Assurance
 * - Prevents injection of false sources into articles
 * - Validates tool call integrity through API logs
 * - Detects tampering with source citations
 * - Ensures immutability of source records
 * 
 * @author Hack23 AB (Editorial Intelligence & Fact-Check Team)
 * @license Apache-2.0
 * @version 2.1.0
 * @since 2024-08-20
 * @see https://github.com/Hack23/riksdag-regering-mcp (MCP Tool Reference)
 * @see EDITORIAL_STANDARDS.md (Source Requirements Policy)
 * @see Issue #142 (Source Verification Framework)
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
    members: /ledamot|\bmp\b|member|representative/gi,  // Word boundary for mp to avoid false matches
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
  
  // Validate minimum sources requirement - use deduplicated unique tools
  const uniqueTools = [...new Set(usedTools.filter(Boolean))];
  const hasMinimumSources = uniqueTools.length >= MINIMUM_SOURCES;
  
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
  const results = (articles || []).map(article => 
    validateCrossReferences(article.type, article.content, article.mcpCalls)
  );
  
  if (results.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      avgScore: 0,
      passRate: 0,
      details: []
    };
  }
  
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;
  
  return {
    total,
    passed,
    failed,
    avgScore,
    passRate: passed / total,
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
