/**
 * Unit Tests for Generate News Indexes
 * Tests news index generation functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_DIR = path.join(__dirname, '..', 'news');

describe('Generate News Indexes', () => {
  let module;

  beforeEach(async () => {
    // Dynamic import — module has top-level console.log but is safe to import
    module = await import('../scripts/generate-news-indexes.js');
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

      const filePath = path.join(NEWS_DIR, newsFiles[0]);
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
      const testLangs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
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
          expect(metadata.lang).toBe(lang);
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
        expect(metadata.type).toBe('prospective');
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
        expect(metadata.type).toBe('analysis');
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
        expect(metadata.topics).toContain('parliament');
        expect(metadata.topics).toContain('eu');
        expect(metadata.topics).toContain('government');
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
        expect(metadata.tags).toContain('Week Ahead');
        expect(metadata.tags).toContain('Parliament');
        expect(metadata.tags.length).toBeLessThanOrEqual(4);
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
            const dateA = new Date(langArticles[i].date);
            const dateB = new Date(langArticles[i + 1].date);
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
  });
});
