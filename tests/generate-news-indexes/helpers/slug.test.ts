/**
 * @module tests/generate-news-indexes/helpers/slug
 * @description Split from `tests/generate-news-indexes.test.ts` (924 lines)
 * per Hack23/riksdagsmonitor#2624 — see PR description for the full
 * source-line mapping table.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Language } from '../../../scripts/types/language.js';
import type { ArticleCategory } from '../../../scripts/types/article.js';

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

describe('classifyArticleType multi-language', () => {
  let module: GenerateNewsIndexesModule;

  beforeEach(async () => {
    module = await import('../../../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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
  let module: GenerateNewsIndexesModule;

  beforeEach(async () => {
    module = await import('../../../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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
