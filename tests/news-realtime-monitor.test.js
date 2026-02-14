/**
 * Unit Tests for News Realtime Monitor
 * Tests multi-language synchronization, quality framework, and workflow coordination
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_DIR = path.join(__dirname, '..', 'news');

describe('News Realtime Monitor - Multi-Language Synchronization', () => {
  let module;

  beforeEach(async () => {
    module = await import('../scripts/generate-news-indexes.js');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllArticlesWithLanguageInfo', () => {
    it('should collect all articles from all languages', () => {
      const articlesByLang = {
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
      expect(Array.isArray(allArticles[0].availableLanguages)).toBe(true);
    });

    it('should detect available languages for same slug across languages', () => {
      const articlesByLang = {
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

      expect(enArticle.availableLanguages.sort()).toEqual(['en', 'fr', 'sv']);
      expect(svArticle.availableLanguages.sort()).toEqual(['en', 'fr', 'sv']);
      expect(frArticle.availableLanguages.sort()).toEqual(['en', 'fr', 'sv']);
    });

    it('should have availableLanguages with single language for unique article', () => {
      const articlesByLang = {
        en: [
          { slug: '2026-01-01-unique-en.html', title: 'Unique EN', lang: 'en', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ],
        sv: []
      };

      const allArticles = module.getAllArticlesWithLanguageInfo(articlesByLang);

      expect(allArticles).toHaveLength(1);
      expect(allArticles[0].availableLanguages).toEqual(['en']);
    });

    it('should sort articles by date descending (newest first)', () => {
      const articlesByLang = {
        en: [
          { slug: '2026-01-01-old-en.html', title: 'Old', lang: 'en', date: '2026-01-01', description: 'Test', type: 'analysis', topics: [], tags: [] },
          { slug: '2026-01-03-new-en.html', title: 'New', lang: 'en', date: '2026-01-03', description: 'Test', type: 'analysis', topics: [], tags: [] },
          { slug: '2026-01-02-mid-en.html', title: 'Mid', lang: 'en', date: '2026-01-02', description: 'Test', type: 'analysis', topics: [], tags: [] }
        ]
      };

      const allArticles = module.getAllArticlesWithLanguageInfo(articlesByLang);

      expect(allArticles[0].title).toBe('New'); // 2026-01-03
      expect(allArticles[1].title).toBe('Mid'); // 2026-01-02
      expect(allArticles[2].title).toBe('Old'); // 2026-01-01
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
      const languages = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
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
    it('should verify all 14 language indexes exist', () => {
      const languages = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
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
      const languages = ['en', 'sv', 'fr', 'de'];
      
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
