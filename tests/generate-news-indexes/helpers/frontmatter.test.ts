/**
 * @module tests/generate-news-indexes/helpers/frontmatter
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

describe('parseArticleMetadata', () => {
  let module: GenerateNewsIndexesModule;

  beforeEach(async () => {
    // Dynamic import — module has top-level console.log but is safe to import
    module = await import('../../../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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
