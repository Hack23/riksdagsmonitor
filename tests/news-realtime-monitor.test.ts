/**
 * Unit Tests for News Realtime Monitor
 * Tests multi-language synchronization, quality framework, and workflow coordination
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import type { Language } from '../scripts/types/language.js';
import type { ArticleCategory } from '../scripts/types/article.js';
import type { QualityMetrics, QualityResult, QualityThresholds } from '../scripts/types/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_DIR = path.join(__dirname, '..', 'news');

/** Article entry with language info */
interface ArticleEntry {
  readonly slug: string;
  readonly title: string;
  readonly lang: Language;
  readonly date: string;
  readonly description: string;
  readonly type: ArticleCategory;
  readonly topics: readonly string[];
  readonly tags: readonly string[];
}

/** Article entry enriched with language availability info */
interface ArticleWithLanguageInfo extends ArticleEntry {
  readonly availableLanguages: readonly Language[];
}

/** Articles grouped by language */
type ArticlesByLanguage = Partial<Record<Language, ArticleEntry[]>>;

/** Shape of the generate-news-indexes module */
interface GenerateNewsIndexesModule {
  readonly getAllArticlesWithLanguageInfo: (articlesByLang: ArticlesByLanguage) => ArticleWithLanguageInfo[];
  readonly generateLanguageBadge: (lang: Language, isRTL?: boolean) => string;
  readonly generateAvailableLanguages: (languages: readonly Language[], currentLang: Language) => string;
}

/** Shape of the article-quality-enhancer module */
interface ArticleQualityEnhancerModule {
  readonly assessAnalyticalDepth: (content: string) => number;
  readonly countPartyPerspectives: (content: string) => number;
  readonly countCrossReferences: (content: string) => number;
  readonly hasWhyThisMatters: (content: string) => boolean;
  readonly hasHistoricalContext: (content: string) => boolean;
  readonly hasLanguageSwitcher: (content: string) => boolean;
  readonly hasArticleTopNav: (content: string) => boolean;
  readonly hasBackToNews: (content: string) => boolean;
  readonly calculateQualityScore: (metrics: QualityMetrics) => number;
  readonly enhanceArticleQuality: (articlePath: string, thresholds?: Partial<QualityThresholds>) => Promise<QualityResult>;
}

describe('News Realtime Monitor - Multi-Language Synchronization', () => {
  let module: GenerateNewsIndexesModule;

  beforeEach(async () => {
    module = await import('../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllArticlesWithLanguageInfo', () => {
    it('should collect all articles from all languages', () => {
      const articlesByLang: ArticlesByLanguage = {
        en: [
          { slug: '2026-01-01-test-en.html', title: 'Test EN', lang: 'en', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ],
        sv: [
          { slug: '2026-01-01-test-sv.html', title: 'Test SV', lang: 'sv', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ],
        fr: [
          { slug: '2026-01-02-other-fr.html', title: 'Other FR', lang: 'fr', date: '2026-01-02', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ]
      };

      const allArticles = module.getAllArticlesWithLanguageInfo(articlesByLang);

      // Should have 3 articles total (not language-filtered)
      expect(allArticles).toHaveLength(3);

      // Should have lang field
      expect(allArticles[0]).toHaveProperty('lang');

      // Should have availableLanguages field
      expect(allArticles[0]).toHaveProperty('availableLanguages');
      expect(Array.isArray(allArticles[0]!.availableLanguages)).toBe(true);
    });

    it('should detect available languages for same slug across languages', () => {
      const articlesByLang: ArticlesByLanguage = {
        en: [
          { slug: '2026-01-01-test-en.html', title: 'Test EN', lang: 'en', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ],
        sv: [
          { slug: '2026-01-01-test-sv.html', title: 'Test SV', lang: 'sv', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ],
        fr: [
          { slug: '2026-01-01-test-fr.html', title: 'Test FR', lang: 'fr', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ]
      };

      const allArticles = module.getAllArticlesWithLanguageInfo(articlesByLang);

      // All three articles should have the same availableLanguages: ['en', 'fr', 'sv']
      const enArticle = allArticles.find(a => a.lang === 'en');
      const svArticle = allArticles.find(a => a.lang === 'sv');
      const frArticle = allArticles.find(a => a.lang === 'fr');

      expect([...(enArticle!.availableLanguages as Language[])].sort()).toEqual(['en', 'fr', 'sv']);
      expect([...(svArticle!.availableLanguages as Language[])].sort()).toEqual(['en', 'fr', 'sv']);
      expect([...(frArticle!.availableLanguages as Language[])].sort()).toEqual(['en', 'fr', 'sv']);
    });

    it('should have availableLanguages with single language for unique article', () => {
      const articlesByLang: ArticlesByLanguage = {
        en: [
          { slug: '2026-01-01-unique-en.html', title: 'Unique EN', lang: 'en', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ],
        sv: []
      };

      const allArticles = module.getAllArticlesWithLanguageInfo(articlesByLang);

      expect(allArticles).toHaveLength(1);
      expect(allArticles[0]!.availableLanguages).toEqual(['en']);
    });

    it('should sort articles by date descending (newest first)', () => {
      const articlesByLang: ArticlesByLanguage = {
        en: [
          { slug: '2026-01-01-old-en.html', title: 'Old', lang: 'en', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] },
          { slug: '2026-01-03-new-en.html', title: 'New', lang: 'en', date: '2026-01-03', description: 'Test', type: 'analysis', topics: [], tags: [] },
          { slug: '2026-01-02-mid-en.html', title: 'Mid', lang: 'en', date: '2026-01-02', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ]
      };

      const allArticles = module.getAllArticlesWithLanguageInfo(articlesByLang);

      expect(allArticles[0]!.title).toBe('New'); // 2026-01-03
      expect(allArticles[1]!.title).toBe('Mid'); // 2026-01-02
      expect(allArticles[2]!.title).toBe('Old'); // 2026-01-01
    });
  });

  describe('generateLanguageBadge', () => {
    it('should generate language badge with flag and code', () => {
      const badge = module.generateLanguageBadge('en', false);

      expect(badge).toContain('language-badge');
      expect(badge).toContain('🇬🇧');
      expect(badge).toContain('EN');
      expect(badge).toContain('aria-label');
    });

    it('should include dir="ltr" for RTL context', () => {
      const badge = module.generateLanguageBadge('en', true);

      expect(badge).toContain('dir="ltr"');
    });

    it('should work for all supported languages', () => {
      const languages: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

      languages.forEach(lang => {
        const badge = module.generateLanguageBadge(lang);
        expect(badge).toContain('language-badge');
        expect(badge).toContain(lang.toUpperCase());
      });
    });
  });

  describe('generateAvailableLanguages', () => {
    it('should return empty string for single language', () => {
      const result = module.generateAvailableLanguages(['en'], 'en');
      expect(result).toBe('');
    });

    it('should generate available languages text with badges for multiple languages', () => {
      const result = module.generateAvailableLanguages(['en', 'sv', 'fr'], 'en');

      expect(result).toContain('Available in');
      expect(result).toContain('language-badge');
      expect(result).toContain('EN');
      expect(result).toContain('SV');
      expect(result).toContain('FR');
    });

    it('should use correct translation for each language', () => {
      const resultFr = module.generateAvailableLanguages(['en', 'sv'], 'fr');
      expect(resultFr).toContain('Disponible en');

      const resultDe = module.generateAvailableLanguages(['en', 'sv'], 'de');
      expect(resultDe).toContain('Verfügbar in');

      const resultSv = module.generateAvailableLanguages(['en', 'sv'], 'sv');
      expect(resultSv).toContain('Tillgänglig på');
    });
  });

  describe('Real-world Integration Tests', () => {
    const GENERATED_INDEX_FILES: string[] = [];

    beforeAll(() => {
      const ROOT_DIR = path.join(__dirname, '..');
      const before = new Set(fs.readdirSync(NEWS_DIR).filter(f => f.startsWith('index') && f.endsWith('.html')));
      execSync('npx tsx scripts/generate-news-indexes/index.ts', { cwd: ROOT_DIR, stdio: 'pipe' });
      const after = fs.readdirSync(NEWS_DIR).filter(f => f.startsWith('index') && f.endsWith('.html'));
      GENERATED_INDEX_FILES.push(...after.filter(f => !before.has(f)));
    }, 30000);

    afterAll(() => {
      GENERATED_INDEX_FILES.forEach(f => {
        try { fs.unlinkSync(path.join(NEWS_DIR, f)); } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.warn(`Cleanup warning: ${(err as Error).message}`);
        }
      });
    });

    it('should verify all 14 language indexes exist', () => {
      const languages: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

      languages.forEach(lang => {
        const filename = lang === 'en' ? 'index.html' : `index_${lang}.html`;
        const filePath = path.join(NEWS_DIR, filename);

        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should verify French index contains language metadata in JavaScript', () => {
      const frIndexPath = path.join(NEWS_DIR, 'index_fr.html');
      const content = fs.readFileSync(frIndexPath, 'utf-8');

      // Should contain lang field in articles array
      expect(content).toContain('"lang":');

      // Should contain availableLanguages field
      expect(content).toContain('"availableLanguages":');

      // Should contain language badge generation code
      expect(content).toContain('language-badge');
    });

    it('should verify all indexes have same article data structure', () => {
      const languages: Language[] = ['en', 'sv', 'fr', 'de'];

      languages.forEach(lang => {
        const filename = lang === 'en' ? 'index.html' : `index_${lang}.html`;
        const filePath = path.join(NEWS_DIR, filename);
        const content = fs.readFileSync(filePath, 'utf-8');

        // All should have articles array with lang and availableLanguages
        expect(content).toContain('const articles = [');
        expect(content).toContain('"lang":');
        expect(content).toContain('"availableLanguages":');
      });
    });
  });
});

describe('News Realtime Monitor - Quality Framework', () => {
  let qualityModule: ArticleQualityEnhancerModule;

  beforeEach(async () => {
    qualityModule = await import('../scripts/article-quality-enhancer.js') as unknown as ArticleQualityEnhancerModule;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('assessAnalyticalDepth', () => {
    it('should score high for causal reasoning', () => {
      const content = 'Because the government failed, therefore the opposition won. As a result, policy changed.';
      const score = qualityModule.assessAnalyticalDepth(content);
      expect(score).toBeGreaterThan(0.1);
    });

    it('should score high for comparative analysis', () => {
      const content = 'Compared to previous years, while this policy works, however that one failed.';
      const score = qualityModule.assessAnalyticalDepth(content);
      expect(score).toBeGreaterThan(0.1);
    });

    it('should return 0 for non-analytical content', () => {
      const content = 'The meeting happened. People attended. End of story.';
      const score = qualityModule.assessAnalyticalDepth(content);
      expect(score).toBeLessThan(0.1);
    });

    it('should cap score at 1.0', () => {
      const content = 'because therefore as a result compared to while however trend pattern shift data shows according to study report';
      const score = qualityModule.assessAnalyticalDepth(content);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('countPartyPerspectives', () => {
    it('should count Swedish party mentions', () => {
      const content = 'Socialdemokraterna said X. Moderaterna said Y. SD commented Z. Vänsterpartiet agreed.';
      const count = qualityModule.countPartyPerspectives(content);
      expect(count).toBeGreaterThanOrEqual(4);
    });

    it('should normalize party names', () => {
      const content = 'Social Democrats and S both mentioned. Moderate and Moderaterna both said.';
      const count = qualityModule.countPartyPerspectives(content);
      expect(count).toBe(2); // S and M
    });

    it('should return 0 for no party mentions', () => {
      const content = 'This article has no political party references at all.';
      const count = qualityModule.countPartyPerspectives(content);
      expect(count).toBe(0);
    });

    it('should handle all 8 Swedish parties', () => {
      const content = 'S, M, SD, C, V, KD, L, MP all participated in the debate.';
      const count = qualityModule.countPartyPerspectives(content);
      expect(count).toBe(8);
    });
  });

  describe('countCrossReferences', () => {
    it('should detect proposition references', () => {
      const content = 'According to Prop. 2024/25:1 and Prop. 2024/25:100, the policy changed.';
      const count = qualityModule.countCrossReferences(content);
      expect(count).toBe(2);
    });

    it('should detect committee report references', () => {
      const content = 'Bet. 2024/25:FiU10 and Bet. 2024/25:AU5 were reviewed.';
      const count = qualityModule.countCrossReferences(content);
      expect(count).toBe(2);
    });

    it('should detect motion references', () => {
      const content = 'Mot. 2024/25:123, Mot. 2024/25:456, and Mot. 2024/25:789.';
      const count = qualityModule.countCrossReferences(content);
      expect(count).toBe(3);
    });

    it('should return 0 for no document references', () => {
      const content = 'This article has no riksdag document IDs.';
      const count = qualityModule.countCrossReferences(content);
      expect(count).toBe(0);
    });
  });

  describe('hasWhyThisMatters', () => {
    it('should detect "Why This Matters" in English', () => {
      const content = '<h2>Why This Matters</h2><p>This is important because...</p>';
      const result = qualityModule.hasWhyThisMatters(content);
      expect(result).toBe(true);
    });

    it('should detect Swedish equivalents', () => {
      const content = '<h2>Varför detta betyder något</h2><p>Betydelse...</p>';
      const result = qualityModule.hasWhyThisMatters(content);
      expect(result).toBe(true);
    });

    it('should return false if section missing', () => {
      const content = '<h2>Introduction</h2><p>Just basic content here.</p>';
      const result = qualityModule.hasWhyThisMatters(content);
      expect(result).toBe(false);
    });
  });

  describe('hasHistoricalContext', () => {
    it('should detect year references', () => {
      const content = 'Since 2015, the policy has changed. In 2020, another shift occurred.';
      const result = qualityModule.hasHistoricalContext(content);
      expect(result).toBe(true);
    });

    it('should detect "historically" keyword', () => {
      const content = 'Historically, this has never happened before.';
      const result = qualityModule.hasHistoricalContext(content);
      expect(result).toBe(true);
    });

    it('should return false if no historical context', () => {
      const content = 'Today the meeting happened. Tomorrow another one.';
      const result = qualityModule.hasHistoricalContext(content);
      expect(result).toBe(false);
    });
  });

  describe('calculateQualityScore', () => {
    it('should calculate score with all metrics met', () => {
      const metrics: QualityMetrics = {
        analyticalDepth: 0.8,
        partyCount: 6,
        crossReferences: 4,
        hasWhyThisMatters: true,
        hasHistoricalContext: true,
        hasInternationalComparison: true
      };
      const score = qualityModule.calculateQualityScore(metrics);
      expect(score).toBeGreaterThanOrEqual(0.9);
    });

    it('should calculate lower score for poor metrics', () => {
      const metrics: QualityMetrics = {
        analyticalDepth: 0.2,
        partyCount: 1,
        crossReferences: 0,
        hasWhyThisMatters: false,
        hasHistoricalContext: false,
        hasInternationalComparison: false
      };
      const score = qualityModule.calculateQualityScore(metrics);
      expect(score).toBeLessThan(0.3);
    });

    it('should normalize party count correctly', () => {
      const metricsWithSixParties: QualityMetrics = {
        analyticalDepth: 0,
        partyCount: 6,
        crossReferences: 0,
        hasWhyThisMatters: false,
        hasHistoricalContext: false,
        hasInternationalComparison: false
      };
      const score = qualityModule.calculateQualityScore(metricsWithSixParties);
      // 6 parties (full quota) should contribute 0.25 (25% weight)
      expect(score).toBeGreaterThanOrEqual(0.24);
      expect(score).toBeLessThanOrEqual(0.26);

      // 4 parties should contribute less than full weight (4/6 * 0.25 ≈ 0.167)
      const metricsWithFourParties: QualityMetrics = {
        analyticalDepth: 0,
        partyCount: 4,
        crossReferences: 0,
        hasWhyThisMatters: false,
        hasHistoricalContext: false,
        hasInternationalComparison: false
      };
      const scoreFour = qualityModule.calculateQualityScore(metricsWithFourParties);
      expect(scoreFour).toBeLessThan(score);
      expect(scoreFour).toBeCloseTo((4 / 6) * 0.25, 2);
    });

    it('should cap score at 1.0', () => {
      const metrics: QualityMetrics = {
        analyticalDepth: 1.5, // Artificially high
        partyCount: 20,
        crossReferences: 100,
        hasWhyThisMatters: true,
        hasHistoricalContext: true,
        hasInternationalComparison: true
      };
      const score = qualityModule.calculateQualityScore(metrics);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('enhanceArticleQuality integration', () => {
    it('should pass for high-quality real article', async () => {
      // Find any existing article in news directory
      const newsFiles = fs.readdirSync(NEWS_DIR)
        .filter(f => f.endsWith('.html') && !f.startsWith('index'));

      if (newsFiles.length === 0) {
        return; // Skip if no articles
      }

      const articlePath = path.join(NEWS_DIR, newsFiles[0] as string);
      const result = await qualityModule.enhanceArticleQuality(articlePath, {
        minQualityScore: 0.3, // Lower threshold for test
        minAnalyticalDepth: 0.2,
        minPartySources: 2,
        minCrossReferences: 1,
        requireWhyThisMatters: false
      });

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('metrics');
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should fail for non-existent article', async () => {
      const result = await qualityModule.enhanceArticleQuality('/tmp/nonexistent.html');
      expect(result.passed).toBe(false);
      expect(result.error).toBe('Article file not found');
    });

    it('should return detailed metrics', async () => {
      const newsFiles = fs.readdirSync(NEWS_DIR)
        .filter(f => f.endsWith('.html') && !f.startsWith('index'));

      if (newsFiles.length === 0) {
        return;
      }

      const articlePath = path.join(NEWS_DIR, newsFiles[0] as string);
      const result = await qualityModule.enhanceArticleQuality(articlePath);

      expect(result.metrics).toHaveProperty('analyticalDepth');
      expect(result.metrics).toHaveProperty('partyCount');
      expect(result.metrics).toHaveProperty('crossReferences');
      expect(result.metrics).toHaveProperty('hasWhyThisMatters');
      expect(result.metrics).toHaveProperty('hasHistoricalContext');
      expect(result.metrics).toHaveProperty('hasInternationalComparison');
    });
  });

  describe('recommendEconomicContext warning', () => {
    const tmpArticle = '/tmp/test-economic-context-article.html';

    afterEach(() => {
      if (fs.existsSync(tmpArticle)) fs.unlinkSync(tmpArticle);
    });

    it('should emit warning when economic context is missing and recommendation is enabled', async () => {
      fs.writeFileSync(tmpArticle, '<html><body><p>The parliamentary vote was decisive. Because reasons, therefore results.</p></body></html>');
      const result = await qualityModule.enhanceArticleQuality(tmpArticle, {
        minQualityScore: 0,
        recommendEconomicContext: true,
      });
      expect(result.warnings).toContain('Recommended: Add economic context (World Bank indicators, GDP, unemployment data)');
    });

    it('should not emit warning when economic context is present', async () => {
      fs.writeFileSync(tmpArticle, '<html><body><p>Sweden GDP growth was 2.1% according to World Bank data.</p></body></html>');
      const result = await qualityModule.enhanceArticleQuality(tmpArticle, {
        minQualityScore: 0,
        recommendEconomicContext: true,
      });
      expect(result.warnings).not.toContain('Recommended: Add economic context (World Bank indicators, GDP, unemployment data)');
    });

    it('should not emit warning when recommendation is disabled', async () => {
      fs.writeFileSync(tmpArticle, '<html><body><p>The parliamentary vote was decisive.</p></body></html>');
      const result = await qualityModule.enhanceArticleQuality(tmpArticle, {
        minQualityScore: 0,
        recommendEconomicContext: false,
      });
      expect(result.warnings ?? []).not.toContain('Recommended: Add economic context (World Bank indicators, GDP, unemployment data)');
    });
  });
});
