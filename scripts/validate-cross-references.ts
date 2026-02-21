/**
 * @module Validation/CrossReferenceTracking
 * @description Source verification engine enforcing multi-source journalism standards.
 * Bounded context: Quality Assurance
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  ArticleBatchItem,
  BatchValidationResult,
  CISummary,
  CrossRefValidationResult,
  RequiredToolsMap,
} from './types/validation.js';
import type { ArticleType } from './types/article.js';

/**
 * Required MCP tools per article type.
 */
export const REQUIRED_TOOLS_PER_TYPE: RequiredToolsMap = {
  'week-ahead': [
    'get_calendar_events',
    'search_dokument',
    'get_fragor',
    'get_interpellationer',
  ],
  'committee-reports': [
    'get_betankanden',
    'search_voteringar',
    'search_anforanden',
    'get_propositioner',
  ],
  propositions: [
    'get_propositioner',
    'search_dokument_fulltext',
    'analyze_g0v_by_department',
    'search_anforanden',
  ],
  motions: [
    'get_motioner',
    'search_dokument_fulltext',
    'analyze_g0v_by_department',
    'search_anforanden',
  ],
  breaking: [
    'search_voteringar',
    'get_voting_group',
    'search_anforanden',
    'search_ledamoter',
  ],
} as const;

/** Minimum number of distinct data sources required per article */
export const MINIMUM_SOURCES = 3;

/**
 * Extract cross-reference types from article content.
 *
 * @param content - Article HTML or text content
 * @returns Array of detected cross-reference category names
 */
export function extractCrossReferences(content: string | null | undefined): string[] {
  if (!content) return [];

  const references: string[] = [];
  const contentLower = content.toLowerCase();

  const patterns: Readonly<Record<string, RegExp>> = {
    calendar: /calendar|event|schedule|meeting/gi,
    documents: /dokument|document|bill|proposition|motion|betänkande/gi,
    votes: /vote|votering|röst|ballot/gi,
    speeches: /speech|anförande|debate|tal/gi,
    members: /ledamot|\bmp\b|member|representative/gi,
    committees: /committee|utskott|commission/gi,
    questions: /question|fråga|interpellation/gi,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(contentLower)) {
      references.push(type);
    }
  }

  return references;
}

/**
 * Calculate quality score for cross-referencing (0–1).
 */
function calculateScore(
  allRequired: boolean,
  minSources: boolean,
  hasReferences: boolean,
  extraCount: number,
): number {
  let score = 0;
  if (allRequired) score += 0.4;
  if (minSources) score += 0.3;
  if (hasReferences) score += 0.2;
  score += Math.min(extraCount * 0.05, 0.1);
  return Math.min(score, 1.0);
}

/**
 * Validate cross-references for a single article.
 *
 * @param articleType   - Type of article
 * @param articleContent - Article HTML or text content
 * @param mcpCalls      - Array of MCP calls made during generation
 * @returns Validation result with pass/fail and score
 */
export function validateCrossReferences(
  articleType: string,
  articleContent: string,
  mcpCalls: ReadonlyArray<{ readonly tool: string }> = [],
): CrossRefValidationResult {
  const requiredTools =
    REQUIRED_TOOLS_PER_TYPE[articleType as ArticleType] ?? ([] as readonly string[]);
  const usedTools = mcpCalls.map((call) => call.tool);

  const missingTools = requiredTools.filter((tool) => !usedTools.includes(tool));
  const extraTools = usedTools.filter((tool) => !requiredTools.includes(tool));
  const crossReferencesInText = extractCrossReferences(articleContent);

  const uniqueTools = [...new Set(usedTools.filter(Boolean))];
  const hasMinimumSources = uniqueTools.length >= MINIMUM_SOURCES;
  const allRequiredToolsUsed = missingTools.length === 0;
  const hasCrossReferencesInText = crossReferencesInText.length >= MINIMUM_SOURCES;

  const passed = allRequiredToolsUsed && hasMinimumSources && hasCrossReferencesInText;

  return {
    articleType,
    requiredTools: [...requiredTools],
    usedTools,
    missingTools,
    extraTools,
    crossReferencesInText,
    sourceCount: usedTools.length,
    hasMinimumSources,
    allRequiredToolsUsed,
    hasCrossReferencesInText,
    passed,
    score: calculateScore(
      allRequiredToolsUsed,
      hasMinimumSources,
      hasCrossReferencesInText,
      extraTools.length,
    ),
  };
}

/**
 * Validate multiple articles at once.
 *
 * @param articles - Array of article objects with type, content, mcpCalls
 * @returns Aggregated validation results
 */
export function validateArticleBatch(
  articles: ReadonlyArray<ArticleBatchItem> | null | undefined,
): BatchValidationResult {
  const results = (articles ?? []).map((article) =>
    validateCrossReferences(article.type, article.content, article.mcpCalls),
  );

  if (results.length === 0) {
    return { total: 0, passed: 0, failed: 0, avgScore: 0, passRate: 0, details: [] };
  }

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;

  return { total, passed, failed, avgScore, passRate: passed / total, details: results };
}

/**
 * Generate a Markdown validation report.
 */
export function generateValidationReport(validation: CrossRefValidationResult): string {
  const { articleType, usedTools, missingTools, crossReferencesInText, passed, score } = validation;

  let report = `## Cross-Reference Validation Report\n\n`;
  report += `**Article Type**: ${articleType}\n`;
  report += `**Status**: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  report += `**Score**: ${(score * 100).toFixed(0)}%\n\n`;

  report += `### MCP Tools Used (${usedTools.length})\n`;
  for (const tool of usedTools) {
    report += `- ✅ ${tool}\n`;
  }

  if (missingTools.length > 0) {
    report += `\n### Missing Required Tools (${missingTools.length})\n`;
    for (const tool of missingTools) {
      report += `- ❌ ${tool}\n`;
    }
  }

  report += `\n### Cross-References in Text (${crossReferencesInText.length})\n`;
  for (const ref of crossReferencesInText) {
    report += `- ${ref}\n`;
  }

  return report;
}

/**
 * Export CI-friendly summary from batch results.
 */
export function exportCISummary(batchResults: BatchValidationResult): CISummary {
  return {
    status: batchResults.passRate === 1 ? 'success' : 'failure',
    total: batchResults.total,
    passed: batchResults.passed,
    failed: batchResults.failed,
    passRate: `${(batchResults.passRate * 100).toFixed(1)}%`,
    avgScore: `${(batchResults.avgScore * 100).toFixed(1)}%`,
    timestamp: new Date().toISOString(),
  };
}
