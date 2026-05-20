/**
 * @module tests/generate-news-indexes/helpers/article-merge
 * @description Split from `tests/generate-news-indexes.test.ts` (924 lines)
 * per Hack23/riksdagsmonitor#2624 — see PR description for the full
 * source-line mapping table.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Language } from '../../scripts/types/language.js';
import type { ArticleCategory } from '../../scripts/types/article.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_DIR = path.join(__dirname, '..', '..', '..', 'news');

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


import { generateIndexHTML } from '../../../scripts/generate-news-indexes/template.js';

describe('scanNewsArticles', { timeout: 60000 }, () => {
  let module: GenerateNewsIndexesModule;

  beforeEach(async () => {
    module = await import('../../../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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

// ---------------------------------------------------------------------------
// SEO features at template render time (FAQ JSON-LD, visible FAQ, crawler-
// visible <details> article list)
// ---------------------------------------------------------------------------

describe('generate-news-indexes/template — SEO features', () => {
  const mockArticles = Array.from({ length: 15 }, (_, i) => ({
    slug: `2026-05-${String(i + 1).padStart(2, '0')}-test-en.html`,
    lang: 'en',
    title: `Test Article ${i + 1}`,
    description: `Description ${i + 1}`,
    date: `2026-05-${String(15 - i).padStart(2, '0')}`,
    type: 'analysis' as const,
    topics: ['parliament'],
    tags: ['test'],
  }));

  it('emits FAQPage JSON-LD', () => {
    const html = generateIndexHTML('en', mockArticles, { en: mockArticles });
    expect(html).toContain('"@type":"FAQPage"');
  });

  it('emits a visible FAQ section with localised heading', () => {
    const html = generateIndexHTML('en', mockArticles, { en: mockArticles });
    expect(html).toContain('id="news-faq-heading"');
    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('<details class="news-faq-item">');
  });

  it('localises the FAQ heading for Swedish', () => {
    const svArticles = mockArticles.map((a) => ({ ...a, lang: 'sv', slug: a.slug.replace('-en.', '-sv.') }));
    const html = generateIndexHTML('sv', svArticles, { sv: svArticles });
    expect(html).toContain('Vanliga frågor');
  });

  it('emits a crawler-visible article list as a collapsible <details> block', () => {
    const html = generateIndexHTML('en', mockArticles, { en: mockArticles });
    expect(html).toContain('class="seo-article-list"');
    expect(html).toContain('id="seo-article-list-heading"');
    expect(html).toContain('<details class="seo-article-list"');
  });

  it('does NOT use inline positioning styles on the article list', () => {
    const html = generateIndexHTML('en', mockArticles, { en: mockArticles });
    // Ensure no inline absolute positioning on the seo list section
    expect(html).not.toMatch(/class="seo-article-list[^"]*"[^>]*style="/);
  });
});
