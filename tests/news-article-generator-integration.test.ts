/**
 * Integration Tests for News Article Generator Workflow
 * 
 * Tests the complete workflow integration including:
 * - Modular architecture integration
 * - Cross-reference validation
 * - Multi-type article generation
 * - Playwright validation integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateCrossReferences, REQUIRED_TOOLS_PER_TYPE } from '../scripts/validate-cross-references.js';
import type { CrossRefValidationResult, BatchValidationResult, CISummary, ArticleBatchItem, RequiredToolsMap } from '../scripts/types/validation.js';
import type { ArticleType } from '../scripts/types/article.js';

/** MCP call record for cross-reference validation */
interface MCPCall {
  tool: string;
  result?: unknown[];
}

/** Validation report input */
interface ValidationReportInput {
  articleType: string;
  usedTools: string[];
  missingTools: string[];
  crossReferencesInText: string[];
  passed: boolean;
  score: number;
}

/** Batch result input for CI summary */
interface BatchResultInput {
  total: number;
  passed: number;
  failed: number;
  avgScore: number;
  passRate: number;
}

describe('News Article Generator Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cross-Reference Validation', () => {
    it('should validate week-ahead cross-references', () => {
      const articleContent = 'This week we have calendar events, documents, questions, and interpellations.';
      const mcpCalls: MCPCall[] = [
        { tool: 'get_calendar_events', result: [] },
        { tool: 'search_dokument', result: [] },
        { tool: 'get_fragor', result: [] },
        { tool: 'get_interpellationer', result: [] }
      ];
      
      const validation = validateCrossReferences('week-ahead', articleContent, mcpCalls) as CrossRefValidationResult;
      
      expect(validation.passed).toBe(true);
      expect(validation.allRequiredToolsUsed).toBe(true);
      expect(validation.hasMinimumSources).toBe(true);
    });

    it('should validate committee-reports cross-references', () => {
      const articleContent = 'Committee reports reveal voting patterns and debates on propositions.';
      const mcpCalls: MCPCall[] = [
        { tool: 'get_betankanden', result: [] },
        { tool: 'search_voteringar', result: [] },
        { tool: 'search_anforanden', result: [] },
        { tool: 'get_propositioner', result: [] }
      ];
      
      const validation = validateCrossReferences('committee-reports', articleContent, mcpCalls) as CrossRefValidationResult;
      
      expect(validation.passed).toBe(true);
      expect(validation.missingTools.length).toBe(0);
    });

    it('should detect missing required tools', () => {
      const articleContent = 'Article content';
      const mcpCalls: MCPCall[] = [
        { tool: 'get_calendar_events', result: [] }
      ];
      
      const validation = validateCrossReferences('week-ahead', articleContent, mcpCalls) as CrossRefValidationResult;
      
      expect(validation.passed).toBe(false);
      expect(validation.missingTools.length).toBeGreaterThan(0);
    });

    it('should track extra tools used', () => {
      const articleContent = 'Article with calendar events, documents, questions, interpellations, members and committees.';
      const mcpCalls: MCPCall[] = [
        { tool: 'get_calendar_events', result: [] },
        { tool: 'search_dokument', result: [] },
        { tool: 'get_fragor', result: [] },
        { tool: 'get_interpellationer', result: [] },
        { tool: 'search_ledamoter', result: [] }, // Extra tool
        { tool: 'get_utskott', result: [] } // Extra tool
      ];
      
      const validation = validateCrossReferences('week-ahead', articleContent, mcpCalls) as CrossRefValidationResult;
      
      expect(validation.extraTools.length).toBe(2);
      expect(validation.score).toBeGreaterThan(0.8); // Good score with all required + extras
    });
  });

  describe('Required Tools Configuration', () => {
    it('should define required tools for all article types', () => {
      const articleTypes: ArticleType[] = ['week-ahead', 'committee-reports', 'propositions', 'motions', 'breaking'];
      
      articleTypes.forEach((type: ArticleType) => {
        expect((REQUIRED_TOOLS_PER_TYPE as RequiredToolsMap)[type]).toBeDefined();
        expect(Array.isArray((REQUIRED_TOOLS_PER_TYPE as RequiredToolsMap)[type])).toBe(true);
        expect((REQUIRED_TOOLS_PER_TYPE as RequiredToolsMap)[type].length).toBeGreaterThan(0);
      });
    });

    it('should require minimum 3 sources per article type', () => {
      (Object.values(REQUIRED_TOOLS_PER_TYPE) as ReadonlyArray<readonly string[]>).forEach((tools: readonly string[]) => {
        expect(tools.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Cross-Reference Patterns', () => {
    it('should extract calendar references from content', async () => {
      const { extractCrossReferences } = await import('../scripts/validate-cross-references.js') as {
        extractCrossReferences: (content: string) => string[];
      };
      
      const content = 'This week we have several calendar events and meetings scheduled.';
      const refs = extractCrossReferences(content);
      
      expect(refs).toContain('calendar');
    });

    it('should extract document references from content', async () => {
      const { extractCrossReferences } = await import('../scripts/validate-cross-references.js') as {
        extractCrossReferences: (content: string) => string[];
      };
      
      const content = 'The Riksdag has received propositions and motions on healthcare.';
      const refs = extractCrossReferences(content);
      
      expect(refs).toContain('documents');
    });

    it('should extract vote references from content', async () => {
      const { extractCrossReferences } = await import('../scripts/validate-cross-references.js') as {
        extractCrossReferences: (content: string) => string[];
      };
      
      const content = 'The vote revealed party divisions on the issue.';
      const refs = extractCrossReferences(content);
      
      expect(refs).toContain('votes');
    });

    it('should extract multiple reference types', async () => {
      const { extractCrossReferences } = await import('../scripts/validate-cross-references.js') as {
        extractCrossReferences: (content: string) => string[];
      };
      
      const content = 'Calendar events show debates on propositions, with votes expected and speeches scheduled.';
      const refs = extractCrossReferences(content);
      
      expect(refs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple articles at once', async () => {
      const { validateArticleBatch } = await import('../scripts/validate-cross-references.js') as {
        validateArticleBatch: (articles: ArticleBatchItem[]) => BatchValidationResult;
      };
      
      const articles: ArticleBatchItem[] = [
        {
          type: 'week-ahead',
          content: 'Calendar events and documents with questions and interpellations.',
          mcpCalls: [
            { tool: 'get_calendar_events' },
            { tool: 'search_dokument' },
            { tool: 'get_fragor' },
            { tool: 'get_interpellationer' }
          ]
        },
        {
          type: 'committee-reports',
          content: 'Committee reports with voting and debate speeches on propositions.',
          mcpCalls: [
            { tool: 'get_betankanden' },
            { tool: 'search_voteringar' },
            { tool: 'search_anforanden' },
            { tool: 'get_propositioner' }
          ]
        }
      ];
      
      const batchResult = validateArticleBatch(articles);
      
      expect(batchResult.total).toBe(2);
      expect(batchResult.passed).toBe(2);
      expect(batchResult.passRate).toBe(1);
    });

    it('should calculate average score', async () => {
      const { validateArticleBatch } = await import('../scripts/validate-cross-references.js') as {
        validateArticleBatch: (articles: ArticleBatchItem[]) => BatchValidationResult;
      };
      
      const articles: ArticleBatchItem[] = [
        {
          type: 'week-ahead',
          content: 'Content with references',
          mcpCalls: [
            { tool: 'get_calendar_events' },
            { tool: 'search_dokument' },
            { tool: 'get_fragor' },
            { tool: 'get_interpellationer' }
          ]
        }
      ];
      
      const batchResult = validateArticleBatch(articles);
      
      expect(batchResult.avgScore).toBeGreaterThan(0);
      expect(batchResult.avgScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Validation Reporting', () => {
    it('should generate markdown validation report', async () => {
      const { generateValidationReport } = await import('../scripts/validate-cross-references.js') as {
        generateValidationReport: (validation: ValidationReportInput) => string;
      };
      
      const validation: ValidationReportInput = {
        articleType: 'week-ahead',
        usedTools: ['get_calendar_events', 'search_dokument'],
        missingTools: ['get_fragor'],
        crossReferencesInText: ['calendar', 'documents'],
        passed: false,
        score: 0.7
      };
      
      const report = generateValidationReport(validation);
      
      expect(report).toContain('Cross-Reference Validation Report');
      expect(report).toContain('week-ahead');
      expect(report).toContain('FAILED');
      expect(report).toContain('70%');
    });

    it('should export CI-friendly summary', async () => {
      const { exportCISummary } = await import('../scripts/validate-cross-references.js') as {
        exportCISummary: (batchResults: BatchResultInput) => CISummary;
      };
      
      const batchResults: BatchResultInput = {
        total: 5,
        passed: 4,
        failed: 1,
        avgScore: 0.85,
        passRate: 0.8
      };
      
      const ciSummary = exportCISummary(batchResults);
      
      expect(ciSummary.status).toBe('failure'); // Not 100% pass rate
      expect(ciSummary.total).toBe(5);
      expect(ciSummary.passed).toBe(4);
      expect(ciSummary.passRate).toBe('80.0%');
      expect(ciSummary.avgScore).toBe('85.0%');
      expect(ciSummary.timestamp).toBeDefined();
    });

    it('should mark success when all articles pass', async () => {
      const { exportCISummary } = await import('../scripts/validate-cross-references.js') as {
        exportCISummary: (batchResults: BatchResultInput) => CISummary;
      };
      
      const batchResults: BatchResultInput = {
        total: 5,
        passed: 5,
        failed: 0,
        avgScore: 0.95,
        passRate: 1.0
      };
      
      const ciSummary = exportCISummary(batchResults);
      
      expect(ciSummary.status).toBe('success');
    });
  });

  describe('Quality Score Calculation', () => {
    it('should score perfect articles highly', () => {
      const articleContent = 'Calendar events with documents, votes, and speeches.';
      const mcpCalls: MCPCall[] = [
        { tool: 'get_calendar_events' },
        { tool: 'search_dokument' },
        { tool: 'get_fragor' },
        { tool: 'get_interpellationer' },
        { tool: 'search_anforanden' } // Extra tool
      ];
      
      const validation = validateCrossReferences('week-ahead', articleContent, mcpCalls) as CrossRefValidationResult;
      
      expect(validation.score).toBeGreaterThan(0.9);
    });

    it('should score incomplete articles lower', () => {
      const articleContent = 'Brief article';
      const mcpCalls: MCPCall[] = [
        { tool: 'get_calendar_events' }
      ];
      
      const validation = validateCrossReferences('week-ahead', articleContent, mcpCalls) as CrossRefValidationResult;
      
      expect(validation.score).toBeLessThan(0.5);
    });
  });
});
