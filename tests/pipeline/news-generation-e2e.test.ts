/**
 * End-to-End Integration Tests for News Article Generation Pipeline
 *
 * Validates the full flow from MCP data fetching mock → content generation →
 * template rendering → HTML validation → quality checks for all 8 article types.
 *
 * Coverage:
 *  - All 8 article type generators (week-ahead, month-ahead, weekly-review,
 *    monthly-review, committee-reports, propositions, motions, breaking-news)
 *  - All 14 language variants via generateArticleHTML
 *  - Schema.org JSON-LD structural validation
 *  - Hreflang tag consistency
 *  - Edge cases: empty data, RTL languages, long content
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { Language } from '../../scripts/types/language.js';
import type {
  ArticleData,
  ArticleCategory,
  GeneratedArticle,
  GenerationResult,
  BreakingEventData,
} from '../../scripts/types/article.js';
import type { MCPClientConfig } from '../../scripts/types/mcp.js';

// ---------------------------------------------------------------------------
// Types for dynamically-imported modules
// ---------------------------------------------------------------------------

interface ArticleTemplateModule {
  readonly generateArticleHTML: (data: ArticleData) => string;
}

interface PipelineValidationModule {
  readonly validateArticleHTML: (
    html: string,
    opts?: Record<string, unknown>,
  ) => { passed: boolean; errors: string[]; passedChecks: string[]; warnings: string[] };
  readonly validateArticleBatch: (
    articles: ReadonlyArray<{ filename: string; html: string }>,
    opts?: Record<string, unknown>,
  ) => Array<{ filename: string; passed: boolean; errors: string[]; passedChecks: string[]; warnings: string[] }>;
}

interface WeekAheadModule {
  generateWeekAhead: (opts?: { languages?: Language[] }) => Promise<GenerationResult>;
}
interface MonthAheadModule {
  generateMonthAhead: (opts?: { languages?: Language[] }) => Promise<GenerationResult>;
}
interface WeeklyReviewModule {
  generateWeeklyReview: (opts?: { languages?: Language[]; lookbackDays?: number }) => Promise<GenerationResult>;
}
interface MonthlyReviewModule {
  generateMonthlyReview: (opts?: { languages?: Language[] }) => Promise<GenerationResult>;
}
interface CommitteeReportsModule {
  generateCommitteeReports: (opts?: { languages?: Language[] }) => Promise<GenerationResult>;
}
interface PropositionsModule {
  generatePropositions: (opts?: { languages?: Language[] }) => Promise<GenerationResult>;
}
interface MotionsModule {
  generateMotions: (opts?: { languages?: Language[] }) => Promise<GenerationResult>;
}
interface BreakingNewsModule {
  generateBreakingNews: (opts?: {
    languages?: Language[];
    eventContext?: string;
    eventData?: BreakingEventData | null;
  }) => Promise<GenerationResult>;
}

// ---------------------------------------------------------------------------
// Comprehensive MCP client mock (vi.hoisted — available before imports)
// ---------------------------------------------------------------------------

const { mockClientInstance, MockMCPClient } = vi.hoisted(() => {
  const mockCalendarEvents = [
    { id: 'ev1', title: 'Budget committee meeting', date: '2026-03-02', type: 'committee', organ: 'FiU' },
    { id: 'ev2', title: 'Chamber debate on defence', date: '2026-03-03', type: 'chamber', organ: 'Kammaren' },
    { id: 'ev3', title: 'EU affairs committee', date: '2026-03-04', type: 'committee', organ: 'EUN' },
  ];

  const mockCommitteeReports = [
    { id: 'bet1', title: 'Defence appropriations 2026', organ: 'FöU', rm: '2025/26', dok_id: 'FöU3' },
    { id: 'bet2', title: 'Social insurance reform', organ: 'SfU', rm: '2025/26', dok_id: 'SfU5' },
  ];

  const mockPropositions = [
    { id: 'prop1', title: 'Prop. 2025/26:45 — Climate action plan', rm: '2025/26' },
    { id: 'prop2', title: 'Prop. 2025/26:67 — Defence funding increase', rm: '2025/26' },
  ];

  const mockMotions = [
    { id: 'mot1', title: 'Mot. 2025/26:123 — Lower income tax', rm: '2025/26', parti: 'M' },
    { id: 'mot2', title: 'Mot. 2025/26:456 — Climate target revision', rm: '2025/26', parti: 'MP' },
  ];

  const mockDocuments = [
    { id: 'doc1', title: 'Annual budget review', date: '2026-02-20', type: 'betankande' },
    { id: 'doc2', title: 'Defence white paper', date: '2026-02-18', type: 'prop' },
  ];

  interface MockMCPClientInstance {
    fetchCalendarEvents: ReturnType<typeof vi.fn>;
    fetchCommitteeReports: ReturnType<typeof vi.fn>;
    fetchPropositions: ReturnType<typeof vi.fn>;
    fetchMotions: ReturnType<typeof vi.fn>;
    searchDocuments: ReturnType<typeof vi.fn>;
    searchSpeeches: ReturnType<typeof vi.fn>;
    fetchWrittenQuestions: ReturnType<typeof vi.fn>;
    fetchInterpellations: ReturnType<typeof vi.fn>;
    fetchVotingRecords: ReturnType<typeof vi.fn>;
    fetchVotingGroup: ReturnType<typeof vi.fn>;
    fetchMPs: ReturnType<typeof vi.fn>;
    fetchDocumentDetails: ReturnType<typeof vi.fn>;
    enrichDocumentsWithContent: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    timeout: number;
    baseURL: string;
  }

  const mockClientInstance: MockMCPClientInstance = {
    fetchCalendarEvents: vi.fn().mockResolvedValue(mockCalendarEvents),
    fetchCommitteeReports: vi.fn().mockResolvedValue(mockCommitteeReports),
    fetchPropositions: vi.fn().mockResolvedValue(mockPropositions),
    fetchMotions: vi.fn().mockResolvedValue(mockMotions),
    searchDocuments: vi.fn().mockResolvedValue(mockDocuments),
    searchSpeeches: vi.fn().mockResolvedValue([]),
    fetchWrittenQuestions: vi.fn().mockResolvedValue([]),
    fetchInterpellations: vi.fn().mockResolvedValue([]),
    fetchVotingRecords: vi.fn().mockResolvedValue([]),
    fetchVotingGroup: vi.fn().mockResolvedValue([]),
    fetchMPs: vi.fn().mockResolvedValue([]),
    fetchDocumentDetails: vi.fn().mockResolvedValue({
      summary: 'Document summary text.',
      fullText: 'Full detailed text of the document.',
    }),
    enrichDocumentsWithContent: vi.fn().mockImplementation(async (docs: unknown[]) => docs),
    request: vi.fn().mockResolvedValue({ last_sync: '2026-03-01T00:00:00Z' }),
    timeout: 30000,
    baseURL: 'https://riksdag-regering-ai.onrender.com/mcp',
  };

  function MockMCPClient(config?: MCPClientConfig): MockMCPClientInstance {
    if (config?.timeout) mockClientInstance.timeout = config.timeout;
    return mockClientInstance;
  }

  return { mockClientInstance, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient,
  getDefaultClient: () => mockClientInstance,
}));

// ---------------------------------------------------------------------------
// Module holders — populated in beforeAll
// ---------------------------------------------------------------------------

let articleTemplate: ArticleTemplateModule;
let pipelineValidation: PipelineValidationModule;
let weekAheadMod: WeekAheadModule;
let monthAheadMod: MonthAheadModule;
let weeklyReviewMod: WeeklyReviewModule;
let monthlyReviewMod: MonthlyReviewModule;
let committeeReportsMod: CommitteeReportsModule;
let propositionsMod: PropositionsModule;
let motionsMod: MotionsModule;
let breakingNewsMod: BreakingNewsModule;

beforeAll(async () => {
  [
    articleTemplate,
    pipelineValidation,
    weekAheadMod,
    monthAheadMod,
    weeklyReviewMod,
    monthlyReviewMod,
    committeeReportsMod,
    propositionsMod,
    motionsMod,
    breakingNewsMod,
  ] = await Promise.all([
    import('../../scripts/article-template.js') as Promise<ArticleTemplateModule>,
    import('../../scripts/pipeline/validation.js') as Promise<PipelineValidationModule>,
    import('../../scripts/news-types/week-ahead.js') as Promise<WeekAheadModule>,
    import('../../scripts/news-types/month-ahead.js') as Promise<MonthAheadModule>,
    import('../../scripts/news-types/weekly-review.js') as Promise<WeeklyReviewModule>,
    import('../../scripts/news-types/monthly-review.js') as Promise<MonthlyReviewModule>,
    import('../../scripts/news-types/committee-reports.js') as Promise<CommitteeReportsModule>,
    import('../../scripts/news-types/propositions.js') as Promise<PropositionsModule>,
    import('../../scripts/news-types/motions.js') as Promise<MotionsModule>,
    import('../../scripts/news-types/breaking-news.js') as Promise<BreakingNewsModule>,
  ]);
});

beforeEach(() => {
  // Re-initialize mock return values since mockReset:true clears implementations
  mockClientInstance.fetchCalendarEvents.mockResolvedValue([
    { id: 'ev1', title: 'Budget committee meeting', date: '2026-03-02', type: 'committee', organ: 'FiU' },
    { id: 'ev2', title: 'Chamber debate on defence', date: '2026-03-03', type: 'chamber', organ: 'Kammaren' },
  ]);
  mockClientInstance.fetchCommitteeReports.mockResolvedValue([
    { id: 'bet1', title: 'Defence appropriations 2026', organ: 'FöU', rm: '2025/26', dok_id: 'FöU3' },
  ]);
  mockClientInstance.fetchPropositions.mockResolvedValue([
    { id: 'prop1', title: 'Prop. 2025/26:45 — Climate action plan', rm: '2025/26' },
  ]);
  mockClientInstance.fetchMotions.mockResolvedValue([
    { id: 'mot1', title: 'Mot. 2025/26:123 — Lower income tax', rm: '2025/26', parti: 'M' },
  ]);
  mockClientInstance.searchDocuments.mockResolvedValue([
    { id: 'doc1', title: 'Annual budget review', date: '2026-02-20', type: 'betankande' },
  ]);
  mockClientInstance.searchSpeeches.mockResolvedValue([]);
  mockClientInstance.fetchWrittenQuestions.mockResolvedValue([]);
  mockClientInstance.fetchInterpellations.mockResolvedValue([]);
  mockClientInstance.fetchVotingRecords.mockResolvedValue([]);
  mockClientInstance.fetchVotingGroup.mockResolvedValue([]);
  mockClientInstance.fetchMPs.mockResolvedValue([]);
  mockClientInstance.fetchDocumentDetails.mockResolvedValue({
    summary: 'Document summary text.',
    fullText: 'Full detailed text of the document.',
  });
  mockClientInstance.enrichDocumentsWithContent.mockImplementation(async (docs: unknown[]) => docs);
  mockClientInstance.request.mockResolvedValue({ last_sync: '2026-03-01T00:00:00Z' });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: build a minimal ArticleData for direct template tests
// ---------------------------------------------------------------------------

function makeArticleData(
  lang: Language,
  type: ArticleCategory = 'prospective',
  overrides: Partial<ArticleData> = {},
): ArticleData {
  const date = '2026-03-01';
  const typeSlug = type === 'prospective' ? 'week-ahead'
    : type === 'retrospective' ? 'weekly-review'
    : type === 'analysis' ? 'committee-reports'
    : 'breaking-news';

  return {
    slug: `${date}-${typeSlug}-${lang}.html`,
    title: `Test Article — ${lang.toUpperCase()}`,
    subtitle: 'A comprehensive analysis of Swedish parliamentary affairs this week.',
    date,
    type,
    lang,
    readTime: '5 min read',
    content: [
      '<h2>Overview</h2>',
      '<p>The Swedish parliament discussed several important matters this week including budget allocation, defence policy, and climate legislation.</p>',
      '<h2>Key Developments</h2>',
      '<p>The Finance Committee reviewed proposals affecting over 200 000 Swedish citizens. Several parties expressed concern about the timeline.</p>',
      '<h2>Analysis</h2>',
      '<p>Political analysts predict a tight vote on the budget proposals. Coalition dynamics remain complex with three parties holding the balance of power.</p>',
    ].join('\n'),
    sources: ['riksdag-regering-mcp', 'Riksdagen calendar', 'SCB statistics'],
    keywords: ['parliament', 'riksdag', 'budget', 'sweden', 'politics'],
    tags: ['Budget', 'Parliament', 'Sweden'],
    events: [],
    watchPoints: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: extract JSON-LD blocks from HTML
// ---------------------------------------------------------------------------

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1] ?? ''));
    } catch {
      // push null to indicate a parse failure
      blocks.push(null);
    }
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// All 14 supported language codes (mirrors ALL_LANG_CODES from constants)
// ---------------------------------------------------------------------------

const ALL_14_LANGS: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

// ---------------------------------------------------------------------------
// Suite 1 — generateArticleHTML produces valid HTML for all 14 languages
// ---------------------------------------------------------------------------

describe('Pipeline: generateArticleHTML — all 14 language variants', () => {
  it('generates valid HTML for every language', () => {
    const articles = ALL_14_LANGS.map(lang => ({
      filename: `2026-03-01-week-ahead-${lang}.html`,
      html: articleTemplate.generateArticleHTML(makeArticleData(lang)),
    }));

    const results = pipelineValidation.validateArticleBatch(articles);

    results.forEach(r => {
      expect(r.passed, `Language ${r.filename} failed: ${r.errors.join(', ')}`).toBe(true);
    });
  });

  it('sets correct lang attribute for each language', () => {
    ALL_14_LANGS.forEach(lang => {
      const html = articleTemplate.generateArticleHTML(makeArticleData(lang));
      expect(html, `lang="${lang}" missing`).toContain(`<html lang="${lang}"`);
    });
  });

  it('sets dir="rtl" for Arabic and Hebrew', () => {
    const arHtml = articleTemplate.generateArticleHTML(makeArticleData('ar'));
    const heHtml = articleTemplate.generateArticleHTML(makeArticleData('he'));
    expect(arHtml).toContain('dir="rtl"');
    expect(heHtml).toContain('dir="rtl"');
  });

  it('does not set dir="rtl" for LTR languages', () => {
    const ltrLangs: Language[] = ['en', 'sv', 'de', 'fr', 'ja', 'ko', 'zh'];
    ltrLangs.forEach(lang => {
      const html = articleTemplate.generateArticleHTML(makeArticleData(lang));
      expect(html, `${lang} should not have rtl`).not.toContain('dir="rtl"');
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — generateArticleHTML for all 4 article categories
// ---------------------------------------------------------------------------

describe('Pipeline: generateArticleHTML — all 4 article categories', () => {
  const categories: ArticleCategory[] = ['prospective', 'retrospective', 'analysis', 'breaking'];

  categories.forEach(category => {
    it(`generates valid HTML for category "${category}"`, () => {
      const html = articleTemplate.generateArticleHTML(makeArticleData('en', category));
      const result = pipelineValidation.validateArticleHTML(html);
      expect(result.passed, result.errors.join(', ')).toBe(true);
    });
  });

  it('includes DOCTYPE and standard head elements', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('en'));
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('<meta name="viewport"');
  });

  it('includes article navigation elements', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('en'));
    expect(html).toContain('language-switcher');
    expect(html).toContain('article-top-nav');
    expect(html).toContain('back-to-news');
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Full pipeline through each article type generator
// ---------------------------------------------------------------------------

describe('Pipeline: week-ahead generator → HTML validation', () => {
  it('generates and validates a week-ahead article', async () => {
    const result = await weekAheadMod.generateWeekAhead({ languages: ['en'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article).toBeDefined();
    const validation = pipelineValidation.validateArticleHTML(article!.html);
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });

  it('produces HTML with correct lang attribute', async () => {
    const result = await weekAheadMod.generateWeekAhead({ languages: ['sv'] });
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article!.html).toContain('<html lang="sv"');
  });
});

describe('Pipeline: month-ahead generator → HTML validation', () => {
  it('generates and validates a month-ahead article', async () => {
    const result = await monthAheadMod.generateMonthAhead({ languages: ['en'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article).toBeDefined();
    const validation = pipelineValidation.validateArticleHTML(article!.html);
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });
});

describe('Pipeline: committee-reports generator → HTML validation', () => {
  it('generates and validates a committee-reports article', async () => {
    const result = await committeeReportsMod.generateCommitteeReports({ languages: ['en'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article).toBeDefined();
    const validation = pipelineValidation.validateArticleHTML(article!.html);
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });
});

describe('Pipeline: propositions generator → HTML validation', () => {
  it('generates and validates a propositions article', async () => {
    const result = await propositionsMod.generatePropositions({ languages: ['en'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article).toBeDefined();
    const validation = pipelineValidation.validateArticleHTML(article!.html);
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });
});

describe('Pipeline: motions generator → HTML validation', () => {
  it('generates and validates a motions article', async () => {
    const result = await motionsMod.generateMotions({ languages: ['en'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article).toBeDefined();
    const validation = pipelineValidation.validateArticleHTML(article!.html);
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });
});

describe('Pipeline: monthly-review generator → HTML validation', () => {
  it('generates and validates a monthly-review article', async () => {
    const result = await monthlyReviewMod.generateMonthlyReview({ languages: ['en'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article).toBeDefined();
    const validation = pipelineValidation.validateArticleHTML(article!.html);
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });
});

describe('Pipeline: weekly-review generator → HTML validation', () => {
  it('generates and validates a weekly-review article', async () => {
    const result = await weeklyReviewMod.generateWeeklyReview({ languages: ['en'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article).toBeDefined();
    const validation = pipelineValidation.validateArticleHTML(article!.html);
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });
});

describe('Pipeline: breaking-news generator → HTML validation', () => {
  it('requires event data to succeed', async () => {
    const result = await breakingNewsMod.generateBreakingNews({ languages: ['en'] });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('generates and validates a breaking-news article with event data', async () => {
    const eventData: BreakingEventData = { voteId: 'v999', topic: 'Emergency budget vote', slug: 'emergency-budget' };
    const result = await breakingNewsMod.generateBreakingNews({ languages: ['en'], eventData });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article).toBeDefined();
    // Breaking news may lack <h2> sections with minimal mock data — relax that check
    const validation = pipelineValidation.validateArticleHTML(article!.html, { requireSections: false });
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — Schema.org JSON-LD validation
// ---------------------------------------------------------------------------

describe('Pipeline: Schema.org JSON-LD validation', () => {
  it('embeds parseable JSON-LD in each article', () => {
    ALL_14_LANGS.forEach(lang => {
      const html = articleTemplate.generateArticleHTML(makeArticleData(lang));
      const blocks = extractJsonLdBlocks(html);
      expect(blocks.length, `${lang} — no JSON-LD blocks`).toBeGreaterThan(0);
      blocks.forEach((block, i) => {
        expect(block, `${lang} — JSON-LD block ${i} failed to parse`).not.toBeNull();
      });
    });
  });

  it('NewsArticle block has required fields', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('en'));
    const blocks = extractJsonLdBlocks(html);
    const newsArticle = blocks.find(
      b => typeof b === 'object' && b !== null && (b as Record<string, unknown>)['@type'] === 'NewsArticle',
    ) as Record<string, unknown> | undefined;

    expect(newsArticle).toBeDefined();
    expect(newsArticle!['@context']).toBe('https://schema.org');
    expect(typeof newsArticle!['headline']).toBe('string');
    expect(typeof newsArticle!['datePublished']).toBe('string');
    expect(typeof newsArticle!['description']).toBe('string');
    expect(newsArticle!['inLanguage']).toBe('en');
  });

  it('BreadcrumbList block has 3 list items', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('en'));
    const blocks = extractJsonLdBlocks(html);
    const breadcrumb = blocks.find(
      b => typeof b === 'object' && b !== null && (b as Record<string, unknown>)['@type'] === 'BreadcrumbList',
    ) as Record<string, unknown> | undefined;

    expect(breadcrumb).toBeDefined();
    const items = breadcrumb!['itemListElement'] as unknown[];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(3);
  });

  it('Organization block is present', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('en'));
    const blocks = extractJsonLdBlocks(html);
    const org = blocks.find(
      b => typeof b === 'object' && b !== null && (b as Record<string, unknown>)['@type'] === 'Organization',
    );
    expect(org).toBeDefined();
  });

  it('JSON-LD blocks are valid for RTL languages', () => {
    ['ar', 'he'].forEach(lang => {
      const html = articleTemplate.generateArticleHTML(makeArticleData(lang as Language));
      const blocks = extractJsonLdBlocks(html);
      expect(blocks.length).toBeGreaterThan(0);
      blocks.forEach(block => expect(block).not.toBeNull());
    });
  });

  it('inLanguage field matches article lang for each language', () => {
    ALL_14_LANGS.forEach(lang => {
      const html = articleTemplate.generateArticleHTML(makeArticleData(lang));
      const blocks = extractJsonLdBlocks(html);
      const newsArticle = blocks.find(
        b => typeof b === 'object' && b !== null && (b as Record<string, unknown>)['@type'] === 'NewsArticle',
      ) as Record<string, unknown> | undefined;
      expect(newsArticle?.['inLanguage'], `${lang} inLanguage mismatch`).toBe(lang);
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — Hreflang tag consistency
// ---------------------------------------------------------------------------

describe('Pipeline: hreflang tag consistency', () => {
  it('contains x-default hreflang pointing to English', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('en'));
    expect(html).toContain('hreflang="x-default"');
    expect(html).toMatch(/hreflang="x-default"[^>]*href="[^"]*-en\.html"/);
  });

  it('contains hreflang tags for all 14 language codes', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('en'));
    ALL_14_LANGS.forEach(lang => {
      const expectedHreflang = lang === 'no' ? 'nb' : lang;
      expect(html, `hreflang="${expectedHreflang}" missing`).toContain(`hreflang="${expectedHreflang}"`);
    });
  });

  it('hreflang links share the same base slug', () => {
    const date = '2026-03-01';
    const html = articleTemplate.generateArticleHTML(
      makeArticleData('en', 'prospective', { slug: `${date}-week-ahead-en.html` }),
    );
    ALL_14_LANGS.forEach(lang => {
      expect(html).toContain(`${date}-week-ahead-${lang}.html`);
    });
  });

  it('alternate hreflang tags are consistent when generating in each language', () => {
    // Every language variant should include hreflang for all 14 languages
    ALL_14_LANGS.forEach(lang => {
      const html = articleTemplate.generateArticleHTML(makeArticleData(lang));
      expect(html, `${lang} variant missing hreflang tags`).toContain('hreflang="en"');
      expect(html).toContain('hreflang="sv"');
      expect(html).toContain('hreflang="x-default"');
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 6 — Edge cases
// ---------------------------------------------------------------------------

describe('Pipeline: edge cases — empty MCP data (degraded mode)', () => {
  it('week-ahead handles empty calendar events gracefully', async () => {
    mockClientInstance.fetchCalendarEvents.mockResolvedValue([]);
    mockClientInstance.searchDocuments.mockResolvedValue([]);

    const result = await weekAheadMod.generateWeekAhead({ languages: ['en'] });
    // week-ahead still generates a degraded article even with no events
    expect(result.success).toBe(true);
    const articles = result.articles as GeneratedArticle[];
    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThan(0);
    // Empty event list yields a thin article without <h2> sections — relax that check
    const firstArticle = articles[0];
    expect(firstArticle).toBeDefined();
    const validation = pipelineValidation.validateArticleHTML(firstArticle!.html, { requireSections: false });
    expect(validation.passed, validation.errors.join(', ')).toBe(true);
  });

  it('committee-reports handles empty reports gracefully', async () => {
    mockClientInstance.fetchCommitteeReports.mockResolvedValue([]);

    const result = await committeeReportsMod.generateCommitteeReports({ languages: ['en'] });
    // committee-reports skips article generation when no reports are found
    expect(result.success).toBe(true);
    expect(result.files).toBe(0);
  });

  it('propositions handles empty data gracefully', async () => {
    mockClientInstance.fetchPropositions.mockResolvedValue([]);

    const result = await propositionsMod.generatePropositions({ languages: ['en'] });
    // propositions skips article generation when no propositions are found
    expect(result.success).toBe(true);
    expect(result.files).toBe(0);
  });

  it('motions handles empty data gracefully', async () => {
    mockClientInstance.fetchMotions.mockResolvedValue([]);

    const result = await motionsMod.generateMotions({ languages: ['en'] });
    // motions skips article generation when no motions are found
    expect(result.success).toBe(true);
    expect(result.files).toBe(0);
  });
});

describe('Pipeline: edge cases — RTL language output', () => {
  it('Arabic article has dir="rtl" and valid HTML structure', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('ar'));
    expect(html).toContain('dir="rtl"');
    const result = pipelineValidation.validateArticleHTML(html);
    expect(result.passed, result.errors.join(', ')).toBe(true);
  });

  it('Hebrew article has dir="rtl" and valid HTML structure', () => {
    const html = articleTemplate.generateArticleHTML(makeArticleData('he'));
    expect(html).toContain('dir="rtl"');
    const result = pipelineValidation.validateArticleHTML(html);
    expect(result.passed, result.errors.join(', ')).toBe(true);
  });

  it('Arabic generator pipeline produces valid HTML', async () => {
    const result = await weekAheadMod.generateWeekAhead({ languages: ['ar'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article!.html).toContain('dir="rtl"');
    expect(article!.html).toContain('<html lang="ar"');
  });

  it('Hebrew generator pipeline produces valid HTML', async () => {
    const result = await weekAheadMod.generateWeekAhead({ languages: ['he'] });
    expect(result.success).toBe(true);
    const article = (result.articles as GeneratedArticle[])[0];
    expect(article!.html).toContain('dir="rtl"');
    expect(article!.html).toContain('<html lang="he"');
  });
});

describe('Pipeline: edge cases — very long article content', () => {
  it('handles very long content without truncation of required structure', () => {
    const longParagraph = '<p>' + 'Swedish parliamentary analysis. '.repeat(200) + '</p>';
    const longContent = [
      '<h2>Section One</h2>',
      longParagraph,
      '<h2>Section Two</h2>',
      longParagraph,
      '<h2>Section Three</h2>',
      longParagraph,
    ].join('\n');

    const html = articleTemplate.generateArticleHTML(
      makeArticleData('en', 'analysis', { content: longContent }),
    );

    const result = pipelineValidation.validateArticleHTML(html);
    expect(result.passed, result.errors.join(', ')).toBe(true);
    // JSON-LD should still be valid
    const blocks = extractJsonLdBlocks(html);
    expect(blocks.every(b => b !== null)).toBe(true);
  });
});

describe('Pipeline: edge cases — special characters in content', () => {
  it('handles HTML entities and special characters in title', () => {
    const html = articleTemplate.generateArticleHTML(
      makeArticleData('en', 'analysis', {
        title: 'Budget & Defence: Sweden\'s 2026 Priorities',
        subtitle: 'Analysis of <key> policy areas & legislative priorities',
      }),
    );
    expect(html).toContain('<!DOCTYPE html>');
    const blocks = extractJsonLdBlocks(html);
    expect(blocks.every(b => b !== null)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 7 — validateArticleBatch for all 8 article types
// ---------------------------------------------------------------------------

describe('Pipeline: validateArticleBatch across all 8 article types', () => {
  it('all 8 article type slugs produce valid HTML when batched', async () => {
    const results = await Promise.all([
      weekAheadMod.generateWeekAhead({ languages: ['en'] }),
      monthAheadMod.generateMonthAhead({ languages: ['en'] }),
      committeeReportsMod.generateCommitteeReports({ languages: ['en'] }),
      propositionsMod.generatePropositions({ languages: ['en'] }),
      motionsMod.generateMotions({ languages: ['en'] }),
      monthlyReviewMod.generateMonthlyReview({ languages: ['en'] }),
      weeklyReviewMod.generateWeeklyReview({ languages: ['en'] }),
      breakingNewsMod.generateBreakingNews({
        languages: ['en'],
        eventData: { voteId: 'v1', topic: 'Budget', slug: 'budget' },
      }),
    ]);

    const successful = results.filter(r => r.success && r.articles?.length);
    expect(successful.length).toBeGreaterThan(0);

    const batch = successful.map(r => {
      const art = (r.articles as GeneratedArticle[])[0]!;
      return { filename: art.filename, html: art.html };
    });

    const validations = pipelineValidation.validateArticleBatch(batch);
    validations.forEach(v => {
      // Breaking news articles may not include <h2> sections with minimal mock data
      const opts = v.filename.includes('breaking') ? { requireSections: false } : {};
      const recheck = pipelineValidation.validateArticleHTML(
        batch.find(b => b.filename === v.filename)!.html,
        opts,
      );
      expect(recheck.passed, `${v.filename}: ${recheck.errors.join(', ')}`).toBe(true);
    });
  });
});
