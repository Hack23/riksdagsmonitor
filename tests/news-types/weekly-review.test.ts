/**
 * Unit Tests for Weekly Review Article Generation Module
 * 
 * Tests the scripts/news-types/weekly-review.ts module including:
 * - Document search (7-day lookback)
 * - Multi-language support
 * - Article structure validation
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type { GeneratedArticle, GenerationResult, MCPCallRecord } from '../../scripts/types/article.js';
import type { Language } from '../../scripts/types/language.js';

/** Document from MCP server */
interface SearchDocument {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly type: string;
}

/** Mock MCP client shape */
interface MockMCPClientShape {
  searchDocuments: Mock<(params: Record<string, unknown>) => Promise<SearchDocument[]>>;
  fetchDocumentDetails: Mock<(dokId: string, includeFullText?: boolean) => Promise<Record<string, unknown>>>;
  searchSpeeches: Mock<(params: Record<string, unknown>) => Promise<unknown[]>>;
  fetchVotingRecords: Mock<(filters: Record<string, unknown>) => Promise<unknown[]>>;
  fetchCommitteeReports: Mock<(limit: number, rm: string) => Promise<unknown[]>>;
  fetchPropositions: Mock<(limit: number, rm: string) => Promise<unknown[]>>;
  fetchMotions: Mock<(limit: number, rm: string) => Promise<unknown[]>>;
}

/** Validation input */
interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

/** Weekly review validation result */
interface WeeklyReviewValidationResult {
  hasWeeklySummary: boolean;
  hasMinimumSources: boolean;
  hasRetrospectiveTone: boolean;
  hasKeyOutcomes: boolean;
  passed: boolean;
}

/** Extended generation result for weekly review */
interface WeeklyReviewGenerationResult extends Omit<GenerationResult, 'crossReferences' | 'articles'> {
  readonly articles: readonly GeneratedArticle[];
  readonly crossReferences: {
    readonly event: string;
    readonly sources: readonly string[];
  };
}

/** Shape of the dynamically imported weekly-review module */
interface WeeklyReviewModule {
  readonly REQUIRED_TOOLS: readonly string[];
  readonly generateWeeklyReview: (options?: {
    languages?: Language[];
    lookbackDays?: number;
    writeArticle?: (html: string, filename: string) => void;
  }) => Promise<WeeklyReviewGenerationResult>;
  readonly validateWeeklyReview: (article: ArticleInput) => WeeklyReviewValidationResult;
  readonly analyzeCoalitionStress: (
    votingRecords: Array<{ parti?: string; rost?: string; bet?: string; punkt?: string }>,
    ciaContext: Record<string, unknown>
  ) => {
    governmentWins: number;
    governmentLosses: number;
    crossPartyVotes: number;
    defections: number;
    totalVotes: number;
    riskIndex: { score: number; level: string; summary: string };
    anomalies: Array<{ type: string; severity: string; description: string }>;
  };
  readonly calculateWeeklyActivityMetrics: (
    documents: unknown[],
    speeches: unknown[],
    votingRecords: unknown[],
    ciaContext: Record<string, unknown>
  ) => {
    currentDocuments: number;
    currentSpeeches: number;
    currentVotes: number;
    activityChange: string;
    trendComparison: { overallDirection: string; insights: string[] };
  };
  readonly generateCoalitionDynamicsSection: (stress: Record<string, unknown>, lang: Language) => string;
  readonly generateWeeklyActivitySection: (metrics: Record<string, unknown>, lang: Language) => string;
}

// Mock MCP client
const { mockClientInstance, mockDocuments, MockMCPClient } = vi.hoisted(() => {
  const mockDocuments: SearchDocument[] = [
    { id: 'doc-1', title: 'Budget vote results', date: '2026-02-18', type: 'votering' },
    { id: 'doc-2', title: 'Defense committee report', date: '2026-02-17', type: 'betankande' },
    { id: 'doc-3', title: 'Immigration motion', date: '2026-02-16', type: 'motion' }
  ];

  const mockClientInstance: MockMCPClientShape = {
    searchDocuments: vi.fn().mockResolvedValue(mockDocuments) as MockMCPClientShape['searchDocuments'],
    fetchDocumentDetails: vi.fn().mockResolvedValue({ summary: 'Full document text', fullText: 'Complete analysis of the document.' }) as MockMCPClientShape['fetchDocumentDetails'],
    searchSpeeches: vi.fn().mockResolvedValue([]) as MockMCPClientShape['searchSpeeches'],
    fetchVotingRecords: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchVotingRecords'],
    fetchCommitteeReports: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchCommitteeReports'],
    fetchPropositions: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchPropositions'],
    fetchMotions: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchMotions'],
  };

  function MockMCPClient(): MockMCPClientShape {
    return mockClientInstance;
  }

  return { mockClientInstance, mockDocuments, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

let weeklyReviewModule: WeeklyReviewModule;

beforeAll(async () => {
  weeklyReviewModule = await import('../../scripts/news-types/weekly-review.js') as unknown as WeeklyReviewModule;
});

describe('Weekly Review Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstance.searchDocuments.mockResolvedValue(mockDocuments);
    mockClientInstance.fetchDocumentDetails.mockResolvedValue({ summary: 'Full document text', fullText: 'Complete analysis.' });
    mockClientInstance.searchSpeeches.mockResolvedValue([]);
    mockClientInstance.fetchVotingRecords.mockResolvedValue([]);
    mockClientInstance.fetchCommitteeReports.mockResolvedValue([]);
    mockClientInstance.fetchPropositions.mockResolvedValue([]);
    mockClientInstance.fetchMotions.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(weeklyReviewModule.REQUIRED_TOOLS).toBeDefined();
      expect(Array.isArray(weeklyReviewModule.REQUIRED_TOOLS)).toBe(true);
      expect(weeklyReviewModule.REQUIRED_TOOLS.length).toBeGreaterThan(0);
    });

    it('should require search_dokument tool', () => {
      expect(weeklyReviewModule.REQUIRED_TOOLS).toContain('search_dokument');
    });

    it('should require search_voteringar tool', () => {
      expect(weeklyReviewModule.REQUIRED_TOOLS).toContain('search_voteringar');
    });
  });

  describe('Data Collection', () => {
    it('should fetch documents from MCP', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(mockClientInstance.searchDocuments).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'search_dokument')).toBe(true);
    });

    it('should handle empty documents', async () => {
      mockClientInstance.searchDocuments.mockResolvedValue([]);

      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });
  });

  describe('Article Structure', () => {
    it('should generate articles for requested languages', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en', 'sv', 'de']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBe(3);
      expect(result.articles.length).toBe(3);
    });

    it('should include correct slug format', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(result.slug).toMatch(/^\d{4}-\d{2}-\d{2}-weekly-review$/);
    });
  });

  describe('Validation', () => {
    it('should export validateWeeklyReview function', () => {
      expect(weeklyReviewModule.validateWeeklyReview).toBeDefined();
      expect(typeof weeklyReviewModule.validateWeeklyReview).toBe('function');
    });

    it('should validate weekly review content', () => {
      const article: ArticleInput = {
        content: 'This week in review the parliament voted and concluded on the budget decision outcome.',
        sources: ['source1', 'source2', 'source3']
      };

      const validation = weeklyReviewModule.validateWeeklyReview(article);
      expect(validation.hasWeeklySummary).toBe(true);
      expect(validation.hasRetrospectiveTone).toBe(true);
    });
  });

  describe('Multi-Language', () => {
    it('should generate language-specific titles', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en', 'sv']
      });

      const enArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'en');
      const svArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'sv');

      expect(enArticle!.html).toContain('Weekly Review');
      expect(svArticle!.html).toContain('Veckans sammanfattning');
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP errors', async () => {
      mockClientInstance.searchDocuments.mockRejectedValue(
        new Error('Network error')
      );

      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration with Writer', () => {
    it('should call writeArticle function if provided', async () => {
      const mockWriter = vi.fn();

      await weeklyReviewModule.generateWeeklyReview({
        languages: ['en'],
        writeArticle: mockWriter
      });

      expect(mockWriter).toHaveBeenCalled();
    });

    it('should work without writeArticle function', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.articles.length).toBe(1);
    });
  });

  describe('Coalition Stress Analysis', () => {
    it('should export analyzeCoalitionStress function', () => {
      expect(weeklyReviewModule.analyzeCoalitionStress).toBeDefined();
      expect(typeof weeklyReviewModule.analyzeCoalitionStress).toBe('function');
    });

    it('should return zero counts for empty voting records', () => {
      const result = weeklyReviewModule.analyzeCoalitionStress([], {
        coalitionStability: { stabilityScore: 75, riskLevel: 'low', defectionProbability: 0.1, majorityMargin: 5 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 96,
      } as unknown as Record<string, unknown>);

      expect(result.governmentWins).toBe(0);
      expect(result.governmentLosses).toBe(0);
      expect(result.totalVotes).toBe(0);
      expect(result.riskIndex).toBeDefined();
      expect(result.riskIndex.score).toBeGreaterThanOrEqual(0);
      expect(result.anomalies).toBeDefined();
    });

    it('should detect government wins from voting records', () => {
      const votingRecords = [
        { parti: 'M', rost: 'Ja', bet: 'AU10', punkt: '1' },
        { parti: 'KD', rost: 'Ja', bet: 'AU10', punkt: '1' },
        { parti: 'L', rost: 'Ja', bet: 'AU10', punkt: '1' },
        { parti: 'S', rost: 'Nej', bet: 'AU10', punkt: '1' },
        { parti: 'V', rost: 'Nej', bet: 'AU10', punkt: '1' },
      ];

      const result = weeklyReviewModule.analyzeCoalitionStress(votingRecords, {
        coalitionStability: { stabilityScore: 75, riskLevel: 'low', defectionProbability: 0.1, majorityMargin: 5 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 96,
      } as unknown as Record<string, unknown>);

      expect(result.governmentWins).toBe(1);
      expect(result.governmentLosses).toBe(0);
      expect(result.totalVotes).toBe(1);
    });

    it('should detect government wins when government votes Nej to reject opposition proposal', () => {
      // Government rejects opposition motion: Nej majority = government win
      const votingRecords = [
        { parti: 'M', rost: 'Nej', bet: 'SoU5', punkt: '2' },
        { parti: 'KD', rost: 'Nej', bet: 'SoU5', punkt: '2' },
        { parti: 'SD', rost: 'Nej', bet: 'SoU5', punkt: '2' },
        { parti: 'S', rost: 'Ja', bet: 'SoU5', punkt: '2' },
        { parti: 'V', rost: 'Ja', bet: 'SoU5', punkt: '2' },
      ];

      const result = weeklyReviewModule.analyzeCoalitionStress(votingRecords, {
        coalitionStability: { stabilityScore: 75, riskLevel: 'low', defectionProbability: 0.1, majorityMargin: 5 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 96,
      } as unknown as Record<string, unknown>);

      // Government position is Nej, Nej majority → government won
      expect(result.governmentWins).toBe(1);
      expect(result.governmentLosses).toBe(0);
    });

    it('should detect cross-party votes', () => {
      const votingRecords = [
        { parti: 'M', rost: 'Ja', bet: 'FiU20', punkt: '1' },
        { parti: 'S', rost: 'Ja', bet: 'FiU20', punkt: '1' },
      ];

      const result = weeklyReviewModule.analyzeCoalitionStress(votingRecords, {
        coalitionStability: { stabilityScore: 70, riskLevel: 'low', defectionProbability: 0.15, majorityMargin: 4 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 96,
      } as unknown as Record<string, unknown>);

      expect(result.crossPartyVotes).toBeGreaterThanOrEqual(1);
    });

    it('should detect cross-party alignment when government and opposition both vote Nej', () => {
      // Government position is Nej; opposition also votes Nej → cross-party alignment
      const votingRecords = [
        { parti: 'M', rost: 'Nej', bet: 'CU3', punkt: '1' },
        { parti: 'S', rost: 'Nej', bet: 'CU3', punkt: '1' },
        { parti: 'V', rost: 'Ja',  bet: 'CU3', punkt: '1' },
      ];

      const result = weeklyReviewModule.analyzeCoalitionStress(votingRecords, {
        coalitionStability: { stabilityScore: 70, riskLevel: 'low', defectionProbability: 0.1, majorityMargin: 4 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 96,
      } as unknown as Record<string, unknown>);

      expect(result.crossPartyVotes).toBeGreaterThanOrEqual(1);
    });

    it('should skip win/loss when government bloc vote is evenly split', () => {
      // 1 govYes, 1 govNo → no clear position → skip win/loss
      const votingRecords = [
        { parti: 'M',  rost: 'Ja',  bet: 'NU1', punkt: '1' },
        { parti: 'KD', rost: 'Nej', bet: 'NU1', punkt: '1' },
        { parti: 'S',  rost: 'Ja',  bet: 'NU1', punkt: '1' },
      ];

      const result = weeklyReviewModule.analyzeCoalitionStress(votingRecords, {
        coalitionStability: { stabilityScore: 70, riskLevel: 'low', defectionProbability: 0.1, majorityMargin: 4 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 96,
      } as unknown as Record<string, unknown>);

      expect(result.governmentWins).toBe(0);
      expect(result.governmentLosses).toBe(0);
      // Defection should still be recorded (bloc split)
      expect(result.defections).toBeGreaterThanOrEqual(1);
    });

    it('should normalize whole-percent defectionProbability for risk calculations', () => {
      // defectionProbability=15 (whole percent) should not produce invalid risk scores
      const result = weeklyReviewModule.analyzeCoalitionStress([], {
        coalitionStability: { stabilityScore: 60, riskLevel: 'medium', defectionProbability: 15, majorityMargin: 3 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 80,
      } as unknown as Record<string, unknown>);

      // riskIndex.score should be in [0, 100]
      expect(result.riskIndex.score).toBeGreaterThanOrEqual(0);
      expect(result.riskIndex.score).toBeLessThanOrEqual(100);
    });

    it('should clamp negative and non-finite defectionProbability to 0', () => {
      for (const bad of [-0.5, -10, Infinity, -Infinity, NaN]) {
        const result = weeklyReviewModule.analyzeCoalitionStress([], {
          coalitionStability: { stabilityScore: 60, riskLevel: 'medium', defectionProbability: bad, majorityMargin: 3 },
          partyPerformance: [],
          votingPatterns: { keyIssues: [] },
          overallMotionDenialRate: 80,
        } as unknown as Record<string, unknown>);
        expect(result.riskIndex.score).toBeGreaterThanOrEqual(0);
        expect(result.riskIndex.score).toBeLessThanOrEqual(100);
      }
    });

    it('should include voting records call in mcpCalls', async () => {
      mockClientInstance.fetchVotingRecords.mockResolvedValue([
        { parti: 'M', rost: 'Ja', bet: 'AU10', punkt: '1' },
      ]);

      const result = await weeklyReviewModule.generateWeeklyReview({ languages: ['en'] });

      expect(result.mcpCalls!.some((c: MCPCallRecord) => c.tool === 'search_voteringar')).toBe(true);
    });
  });

  describe('Weekly Activity Metrics', () => {
    it('should export calculateWeeklyActivityMetrics function', () => {
      expect(weeklyReviewModule.calculateWeeklyActivityMetrics).toBeDefined();
      expect(typeof weeklyReviewModule.calculateWeeklyActivityMetrics).toBe('function');
    });

    it('should return current activity counts', () => {
      const docs = [{ id: '1' }, { id: '2' }] as unknown[];
      const speeches = [{ id: 'a' }];
      const votes = [{ parti: 'M', rost: 'Ja', bet: 'AU1', punkt: '1' }];
      const cia = {
        coalitionStability: { stabilityScore: 75, riskLevel: 'low', defectionProbability: 0.1, majorityMargin: 5 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 96,
      } as unknown as Record<string, unknown>;

      const result = weeklyReviewModule.calculateWeeklyActivityMetrics(docs, speeches, votes, cia);

      expect(result.currentDocuments).toBe(2);
      expect(result.currentSpeeches).toBe(1);
      expect(result.currentVotes).toBe(1);
      expect(['increasing', 'stable', 'declining']).toContain(result.activityChange);
      expect(result.trendComparison).toBeDefined();
      expect(Array.isArray(result.trendComparison.insights)).toBe(true);
    });

    it('should count distinct vote-points not raw records', () => {
      // 3 raw records but only 1 distinct vote-point
      const docs: unknown[] = [];
      const speeches: unknown[] = [];
      const votes = [
        { parti: 'M',  rost: 'Ja',  bet: 'AU10', punkt: '1' },
        { parti: 'KD', rost: 'Ja',  bet: 'AU10', punkt: '1' },
        { parti: 'S',  rost: 'Nej', bet: 'AU10', punkt: '1' },
      ];
      const cia = {
        coalitionStability: { stabilityScore: 75, riskLevel: 'low', defectionProbability: 0.1, majorityMargin: 5 },
        partyPerformance: [],
        votingPatterns: { keyIssues: [] },
        overallMotionDenialRate: 96,
      } as unknown as Record<string, unknown>;

      const result = weeklyReviewModule.calculateWeeklyActivityMetrics(docs, speeches, votes, cia);

      // 3 raw records, but only 1 distinct bet-punkt → currentVotes should be 1
      expect(result.currentVotes).toBe(1);
    });
  });

  describe('Template Sections', () => {
    it('should export generateCoalitionDynamicsSection function', () => {
      expect(weeklyReviewModule.generateCoalitionDynamicsSection).toBeDefined();
    });

    it('should export generateWeeklyActivitySection function', () => {
      expect(weeklyReviewModule.generateWeeklyActivitySection).toBeDefined();
    });

    it('should generate Coalition Dynamics section in English', () => {
      const stress = {
        governmentWins: 5, governmentLosses: 1, crossPartyVotes: 2,
        defections: 0, totalVotes: 6,
        riskIndex: { score: 30, level: 'LOW', summary: 'Coalition is stable.' },
        anomalies: [],
      };
      const html = weeklyReviewModule.generateCoalitionDynamicsSection(
        stress as unknown as Record<string, unknown>, 'en'
      );
      expect(html).toContain('Coalition Dynamics');
      expect(html).toContain('30');
    });

    it('should generate Coalition Dynamics section in Swedish', () => {
      const stress = {
        governmentWins: 3, governmentLosses: 0, crossPartyVotes: 0,
        defections: 1, totalVotes: 3,
        riskIndex: { score: 45, level: 'MEDIUM', summary: 'Moderate risk.' },
        anomalies: [],
      };
      const html = weeklyReviewModule.generateCoalitionDynamicsSection(
        stress as unknown as Record<string, unknown>, 'sv'
      );
      expect(html).toContain('Koalitionsdynamik');
    });

    it('should generate Coalition Dynamics section for all 14 languages', () => {
      const stress = {
        governmentWins: 2, governmentLosses: 0, crossPartyVotes: 0,
        defections: 0, totalVotes: 2,
        riskIndex: { score: 20, level: 'LOW', summary: 'Low risk.' },
        anomalies: [],
      };
      const langs: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      for (const lang of langs) {
        const html = weeklyReviewModule.generateCoalitionDynamicsSection(
          stress as unknown as Record<string, unknown>, lang
        );
        expect(html).toContain('<h2>');
        expect(html).toContain('20');
      }
    });

    it('should generate Week-over-Week section in English', () => {
      const metrics = {
        currentDocuments: 10, currentSpeeches: 25, currentVotes: 8,
        activityChange: 'stable',
        trendComparison: { overallDirection: 'STABLE', insights: ['Coalition stable.'] },
      };
      const html = weeklyReviewModule.generateWeeklyActivitySection(
        metrics as unknown as Record<string, unknown>, 'en'
      );
      expect(html).toContain('Weekly Activity');
      expect(html).toContain('10');
      expect(html).toContain('Coalition stable.');
    });

    it('should generate Weekly Activity section for all 14 languages', () => {
      const metrics = {
        currentDocuments: 5, currentSpeeches: 10, currentVotes: 3,
        activityChange: 'increasing',
        trendComparison: { overallDirection: 'IMPROVING', insights: ['Improving trend.'] },
      };
      const langs: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      for (const lang of langs) {
        const html = weeklyReviewModule.generateWeeklyActivitySection(
          metrics as unknown as Record<string, unknown>, lang
        );
        expect(html).toContain('<h2>');
        expect(html).toContain('5');
      }
    });

    it('should include Coalition Dynamics and Weekly Activity in generated articles', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({ languages: ['en', 'sv'] });

      const enArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'en');
      const svArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'sv');

      expect(enArticle!.html).toContain('Coalition Dynamics');
      expect(enArticle!.html).toContain('Weekly Activity');
      expect(svArticle!.html).toContain('Koalitionsdynamik');
      expect(svArticle!.html).toContain('Veckans aktivitet');
    });

    it('should fetch both riksmöte sessions when the 7-day window crosses the September boundary', async () => {
      // Simulate "today" = September 5, 2026 → 7-day window is 2026-08-29 .. 2026-09-05
      // August belongs to rm 2025/26, September to rm 2026/27 — both sessions must be queried.
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-05T12:00:00Z'));

      const aug28Record = { parti: 'M', rost: 'Ja', bet: 'AU1', punkt: '1', datum: '2026-08-28' };  // outside window
      const aug30Record = { parti: 'S', rost: 'Nej', bet: 'AU2', punkt: '1', datum: '2026-08-30' }; // inside window (old rm)
      const sep04Record = { parti: 'M', rost: 'Ja', bet: 'AU3', punkt: '1', datum: '2026-09-04' };  // inside window (new rm)

      // First call (rm=2025/26) returns august record; second (rm=2026/27) returns september record
      mockClientInstance.fetchVotingRecords
        .mockResolvedValueOnce([aug28Record, aug30Record])
        .mockResolvedValueOnce([sep04Record]);

      await weeklyReviewModule.generateWeeklyReview({ languages: ['en'] });

      // Both sessions should have been fetched
      const rmArgs = mockClientInstance.fetchVotingRecords.mock.calls.map(
        (call: unknown[]) => (call[0] as Record<string, unknown>).rm
      );
      expect(rmArgs).toContain('2025/26');
      expect(rmArgs).toContain('2026/27');

      vi.useRealTimers();
    });
  });
});
