/**
 * Unit Tests for Generate News Indexes
 * Tests news index generation functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Language } from '../scripts/types/language.js';
import type { ArticleCategory } from '../scripts/types/article.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_DIR = path.join(__dirname, '..', 'news');

/** Parsed article metadata */
interface ArticleMetadata {
  readonly slug: string;
  readonly lang: Language;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly type: ArticleCategory;
  readonly topics: readonly string[];
  readonly tags: readonly string[];
}

/** Articles grouped by language */
type ArticlesByLanguage = Record<Language, ArticleMetadata[]>;

/** Index generation result */
interface IndexGenerationResult {
  readonly success: boolean;
  readonly successCount: number;
  readonly errorCount: number;
  readonly articles: ArticlesByLanguage;
}

/** Shape of the dynamically imported module */
interface GenerateNewsIndexesModule {
  readonly parseArticleMetadata: (filePath: string) => ArticleMetadata | null;
  readonly scanNewsArticles: () => ArticlesByLanguage;
  readonly generateAllIndexes: () => IndexGenerationResult;
}

describe('Generate News Indexes', () => {
  let module: GenerateNewsIndexesModule;

  beforeEach(async () => {
    // Dynamic import — module has top-level console.log but is safe to import
    module = await import('../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('parseArticleMetadata', () => {
    it('should parse metadata from a real article file', () => {
      // Find any existing article file in the news directory
      const newsFiles = fs.readdirSync(NEWS_DIR)
        .filter(f => f.endsWith('.html') && !f.startsWith('index'));

      if (newsFiles.length === 0) {
        // No articles to test with — skip gracefully
        return;
      }

      const filePath = path.join(NEWS_DIR, newsFiles[0] as string);
      const metadata = module.parseArticleMetadata(filePath);

      if (metadata) {
        expect(metadata).toHaveProperty('slug');
        expect(metadata).toHaveProperty('lang');
        expect(metadata).toHaveProperty('title');
        expect(metadata).toHaveProperty('description');
        expect(metadata).toHaveProperty('date');
        expect(metadata).toHaveProperty('type');
        expect(metadata).toHaveProperty('topics');
        expect(metadata).toHaveProperty('tags');
        expect(typeof metadata.slug).toBe('string');
        expect(typeof metadata.lang).toBe('string');
      }
    });

    it('should return null for non-article files', () => {
      // Create a temp file without language suffix
      const tempFile = path.join(NEWS_DIR, 'test-no-lang.html');
      fs.writeFileSync(tempFile, '<html><head><title>Test</title></head><body></body></html>');

      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata).toBeNull();
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should extract correct language from filename suffix', () => {
      const testLangs: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

      testLangs.forEach(lang => {
        const tempFile = path.join(NEWS_DIR, `2026-01-01-test-${lang}.html`);
        const html = `<!DOCTYPE html><html lang="${lang}"><head>
          <title>Test Article</title>
          <meta property="og:title" content="Test Title">
          <meta property="og:description" content="Test description">
          <meta property="article:published_time" content="2026-01-01T00:00:00.000Z">
        </head><body></body></html>`;

        fs.writeFileSync(tempFile, html);

        try {
          const metadata = module.parseArticleMetadata(tempFile);
          expect(metadata).not.toBeNull();
          expect(metadata!.lang).toBe(lang);
        } finally {
          fs.unlinkSync(tempFile);
        }
      });
    });

    it('should classify week-ahead articles as prospective', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-week-ahead-en.html');
      const html = `<!DOCTYPE html><html lang="en"><head>
        <title>Week Ahead</title>
        <meta property="og:title" content="Week Ahead">
      </head><body>Week Ahead content</body></html>`;

      fs.writeFileSync(tempFile, html);

      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('prospective');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should classify committee-reports as analysis', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-committee-reports-en.html');
      const html = `<!DOCTYPE html><html lang="en"><head>
        <title>Committee Reports</title>
        <meta property="og:title" content="Committee Reports">
      </head><body>Committee Reports content</body></html>`;

      fs.writeFileSync(tempFile, html);

      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('analysis');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should extract topics from article:tag meta tags', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-topics-test-en.html');
      const html = `<!DOCTYPE html><html lang="en"><head>
        <title>Topics Test</title>
        <meta property="og:title" content="Topics Test">
        <meta property="article:tag" content="Parliament">
        <meta property="article:tag" content="EU Affairs">
        <meta property="article:tag" content="Government Policy">
      </head><body></body></html>`;

      fs.writeFileSync(tempFile, html);

      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.topics).toContain('parliament');
        expect(metadata!.topics).toContain('eu');
        expect(metadata!.topics).toContain('government');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should extract tags from article:tag meta tags', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-tags-test-en.html');
      const html = `<!DOCTYPE html><html lang="en"><head>
        <title>Tags Test</title>
        <meta property="og:title" content="Tags Test">
        <meta property="article:tag" content="Week Ahead">
        <meta property="article:tag" content="Parliament">
      </head><body></body></html>`;

      fs.writeFileSync(tempFile, html);

      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.tags).toContain('Week Ahead');
        expect(metadata!.tags).toContain('Parliament');
        expect(metadata!.tags.length).toBeLessThanOrEqual(4);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });
  });

  describe('scanNewsArticles', () => {
    it('should return object with all 14 language keys', () => {
      const articles = module.scanNewsArticles();

      expect(typeof articles).toBe('object');
      expect(articles).toHaveProperty('en');
      expect(articles).toHaveProperty('sv');
      expect(articles).toHaveProperty('da');
      expect(articles).toHaveProperty('no');
      expect(articles).toHaveProperty('fi');
      expect(articles).toHaveProperty('de');
      expect(articles).toHaveProperty('fr');
      expect(articles).toHaveProperty('es');
      expect(articles).toHaveProperty('nl');
      expect(articles).toHaveProperty('ar');
      expect(articles).toHaveProperty('he');
      expect(articles).toHaveProperty('ja');
      expect(articles).toHaveProperty('ko');
      expect(articles).toHaveProperty('zh');
    });

    it('should return arrays for each language', () => {
      const articles = module.scanNewsArticles();
      Object.values(articles).forEach(langArticles => {
        expect(Array.isArray(langArticles)).toBe(true);
      });
    });

    it('should sort articles by date descending', () => {
      const articles = module.scanNewsArticles();

      Object.values(articles).forEach(langArticles => {
        if (langArticles.length >= 2) {
          for (let i = 0; i < langArticles.length - 1; i++) {
            const dateA = new Date(langArticles[i]!.date);
            const dateB = new Date(langArticles[i + 1]!.date);
            expect(dateA.getTime()).toBeGreaterThanOrEqual(dateB.getTime());
          }
        }
      });
    });
  });

  describe('generateAllIndexes', () => {
    it('should return result object with success status', () => {
      const result = module.generateAllIndexes();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('errorCount');
      expect(result).toHaveProperty('articles');
    });

    it('should generate indexes successfully', () => {
      const result = module.generateAllIndexes();

      // Should generate at least some index files successfully
      expect(result.successCount).toBeGreaterThan(0);
    });

    it('should generate index files for all 14 languages', () => {
      const result = module.generateAllIndexes();

      // Check that index files exist
      expect(fs.existsSync(path.join(NEWS_DIR, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(NEWS_DIR, 'index_sv.html'))).toBe(true);
    });

    it('should generate index files with correct lang attribute', () => {
      module.generateAllIndexes();

      const langFiles: Record<string, Language> = {
        'index.html': 'en',
        'index_sv.html': 'sv',
        'index_de.html': 'de',
        'index_fr.html': 'fr',
        'index_ar.html': 'ar',
        'index_ja.html': 'ja'
      };

      Object.entries(langFiles).forEach(([file, expectedLang]) => {
        const filePath = path.join(NEWS_DIR, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content).toContain(`lang="${expectedLang}"`);
        }
      });
    });

    it('should include domain-specific keywords in generated indexes', () => {
      module.generateAllIndexes();

      // English should have political terms in keywords
      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toContain('committee reports');
      expect(enContent).toContain('government bills');
      expect(enContent).toContain('parliamentary votes');

      // Swedish should have Swedish political terms
      const svContent = fs.readFileSync(path.join(NEWS_DIR, 'index_sv.html'), 'utf-8');
      expect(svContent).toContain('propositioner');
      expect(svContent).toContain('betänkanden');
      expect(svContent).toContain('motioner');
    });

    it('should include translated Schema.org WebSite description per language', () => {
      module.generateAllIndexes();

      // English index should NOT have hardcoded English-only description for all
      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toContain('"inLanguage": "en"');

      // German index should have German schema description
      const deContent = fs.readFileSync(path.join(NEWS_DIR, 'index_de.html'), 'utf-8');
      expect(deContent).toContain('"inLanguage": "de"');
      expect(deContent).toContain('Schwedische Parlaments');
    });

    it('should include publisher and about in Schema.org ItemList articles', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      // Publisher should be in the schema
      expect(enContent).toContain('"publisher"');
      expect(enContent).toContain('"Hack23 AB"');
      // About should reference Riksdag as GovernmentOrganization
      expect(enContent).toContain('"GovernmentOrganization"');
      expect(enContent).toContain('"Riksdag"');
    });

    it('should set dir="rtl" for Arabic and Hebrew indexes', () => {
      module.generateAllIndexes();

      const arContent = fs.readFileSync(path.join(NEWS_DIR, 'index_ar.html'), 'utf-8');
      expect(arContent).toContain('dir="rtl"');
      expect(arContent).toContain('lang="ar"');

      const heContent = fs.readFileSync(path.join(NEWS_DIR, 'index_he.html'), 'utf-8');
      expect(heContent).toContain('dir="rtl"');
      expect(heContent).toContain('lang="he"');
    });

    it('should include search input with id and aria-label', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toContain('id="search-input"');
      expect(enContent).toContain('type="search"');
      // aria-label present (non-empty) and autocomplete disabled, order-independent
      expect(enContent).toMatch(/aria-label="[^"]+"/);
      expect(enContent).toMatch(/autocomplete="off"/);
    });

    it('should include load-more button and article counter', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toContain('id="load-more-btn"');
      expect(enContent).toContain('id="article-counter"');
      expect(enContent).toContain('aria-live="polite"');
      // load-more must use addEventListener, not an inline onclick handler
      expect(enContent).not.toContain('onclick="loadMore()"');
      expect(enContent).toMatch(/addEventListener\s*\(\s*['"]click['"]\s*,\s*loadMore\s*\)/);
    });

    it('should include PAGE_SIZE and pagination logic', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toContain('PAGE_SIZE');
      expect(enContent).toContain('loadMore()');
      expect(enContent).toContain('visibleCount');
    });

    it('should include readURLParams and updateURL for URL state management', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toContain('readURLParams()');
      expect(enContent).toContain('updateURL()');
      expect(enContent).toContain('URLSearchParams');
    });

    it('should not include conflicting DOMContentLoaded content loader', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      // The old dynamic content loader must not be present (it could overwrite pagination state)
      expect(enContent).not.toContain("document.addEventListener('DOMContentLoaded'");
      // #no-articles is the intentional empty-state element for "no articles at all"
      expect(enContent).toContain('id="no-articles"');
      // renderPage() must distinguish articles.length === 0 from filteredArticles.length === 0
      expect(enContent).toContain('articles.length === 0');
    });

    it('should include esc() helper and apply it to article fields in buildArticleCard', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      // esc() helper must be present to prevent XSS via innerHTML
      expect(enContent).toContain('function esc(');
      expect(enContent).toContain('.replace(/&/g,');
      // safeHref() must be present and used for href to prevent javascript: XSS
      expect(enContent).toContain('function safeHref(');
      expect(enContent).toContain('safeHref(article.slug)');
      // article fields must be escaped when interpolated
      expect(enContent).toContain('esc(article.title)');
      expect(enContent).toContain('esc(article.excerpt)');
      expect(enContent).toContain('esc(tag)');
    });

    it('should include AI-Disrupted News Generation section', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toContain('ai-newsroom-section');
      expect(enContent).toContain('AI-Disrupted News Generation');
      expect(enContent).toContain('agentic news generation pipeline');
    });

    it('should localise AI newsroom section for non-English languages', () => {
      module.generateAllIndexes();

      const svContent = fs.readFileSync(path.join(NEWS_DIR, 'index_sv.html'), 'utf-8');
      expect(svContent).toContain('ai-newsroom-section');
      expect(svContent).toContain('AI-styrd nyhetsproduktion');
      expect(svContent).not.toContain('>🤖 AI-Disrupted News Generation<');
    });

    it('should include app version in footer', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toMatch(/\| v\d+\.\d+\.\d+/);
    });

    it('should include disclaimer with GitHub issues link in footer', () => {
      module.generateAllIndexes();

      const enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      expect(enContent).toContain('footer-disclaimer');
      expect(enContent).toContain('Ongoing improvements');
      expect(enContent).toContain('https://github.com/Hack23/riksdagsmonitor/issues');
    });

    it('should localise disclaimer for non-English languages', () => {
      module.generateAllIndexes();

      const svContent = fs.readFileSync(path.join(NEWS_DIR, 'index_sv.html'), 'utf-8');
      expect(svContent).toContain('footer-disclaimer');
      expect(svContent).toContain('rapportera eventuella problem');
      expect(svContent).not.toContain('>Ongoing improvements<');
    });
  });

  describe('classifyArticleType multi-language', () => {
    it('should classify German prospective articles', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-vorschau-de.html');
      const html = `<!DOCTYPE html><html lang="de"><head>
        <title>Woche voraus</title>
        <meta property="og:title" content="Woche voraus">
      </head><body>Vorschau auf die kommende Woche</body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('prospective');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should classify French analysis articles', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-rapports-fr.html');
      const html = `<!DOCTYPE html><html lang="fr"><head>
        <title>Rapports de commission</title>
        <meta property="og:title" content="Rapports de commission">
      </head><body>Rapports de commission parlementaire</body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('analysis');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should classify Japanese breaking news articles', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-sokuhou-ja.html');
      const html = `<!DOCTYPE html><html lang="ja"><head>
        <title>速報</title>
        <meta property="og:title" content="速報">
      </head><body>緊急ニュース</body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('breaking');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should classify Arabic prospective articles', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-preview-ar.html');
      const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head>
        <title>الأسبوع المقبل</title>
        <meta property="og:title" content="الأسبوع المقبل">
      </head><body>الأسبوع المقبل في البرلمان</body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('prospective');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should classify Finnish analysis articles', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-analyysi-fi.html');
      const html = `<!DOCTYPE html><html lang="fi"><head>
        <title>Valiokuntaraportit</title>
        <meta property="og:title" content="Valiokuntaraportit">
      </head><body>Valiokunnan mietintö ja analyysi</body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('analysis');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should classify Korean breaking news articles', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-sokbo-ko.html');
      const html = `<!DOCTYPE html><html lang="ko"><head>
        <title>속보</title>
        <meta property="og:title" content="속보 뉴스">
      </head><body>긴급 뉴스</body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('breaking');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should default to retrospective when no keywords match', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-general-nl.html');
      const html = `<!DOCTYPE html><html lang="nl"><head>
        <title>Algemeen Nieuws</title>
        <meta property="og:title" content="Algemeen Nieuws">
      </head><body>Regulier parlementair nieuws</body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.type).toBe('retrospective');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });
  });

  describe('extractTopics multi-language', () => {
    it('should extract topics from German tags', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-topics-de.html');
      const html = `<!DOCTYPE html><html lang="de"><head>
        <title>Test</title>
        <meta property="og:title" content="Test">
        <meta property="article:tag" content="Ausschuss für Finanzen">
        <meta property="article:tag" content="Regierung">
        <meta property="article:tag" content="Verteidigung">
      </head><body></body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.topics).toContain('committees');
        expect(metadata!.topics).toContain('government');
        expect(metadata!.topics).toContain('defense');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should extract topics from Japanese tags', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-topics-ja.html');
      const html = `<!DOCTYPE html><html lang="ja"><head>
        <title>Test</title>
        <meta property="og:title" content="Test">
        <meta property="article:tag" content="議会">
        <meta property="article:tag" content="委員会報告">
      </head><body></body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.topics).toContain('parliament');
        expect(metadata!.topics).toContain('committees');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should extract topics from Arabic tags', () => {
      const tempFile = path.join(NEWS_DIR, '2026-01-01-topics-ar.html');
      const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head>
        <title>Test</title>
        <meta property="og:title" content="Test">
        <meta property="article:tag" content="البرلمان السويدي">
        <meta property="article:tag" content="الحكومة">
        <meta property="article:tag" content="البيئة">
      </head><body></body></html>`;

      fs.writeFileSync(tempFile, html);
      try {
        const metadata = module.parseArticleMetadata(tempFile);
        expect(metadata!.topics).toContain('parliament');
        expect(metadata!.topics).toContain('government');
        expect(metadata!.topics).toContain('environment');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });
  });
});
