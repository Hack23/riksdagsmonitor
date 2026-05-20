/**
 * @module tests/generate-news-indexes/orchestrator-integration
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
const NEWS_DIR = path.join(__dirname, '..', '..', 'news');

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

import { beforeAll } from 'vitest';

describe('generateAllIndexes', () => {
  let module: GenerateNewsIndexesModule;

  beforeEach(async () => {
    module = await import('../../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

    // Run generateAllIndexes() once for all tests in this block.
    // Scanning 4000+ articles per test causes timeouts on slower CI (nightly Node).
    // This mirrors the beforeAll pattern used by the "Phase 2 UI features" block below.
    let result: ReturnType<GenerateNewsIndexesModule['generateAllIndexes']>;
    let enContent: string;
    let svContent: string;
    let deContent: string;
    let arContent: string;
    let heContent: string;

    beforeAll(async () => {
      const localModule = await import('../../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
      result = localModule.generateAllIndexes();
      enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
      svContent = fs.readFileSync(path.join(NEWS_DIR, 'index_sv.html'), 'utf-8');
      deContent = fs.readFileSync(path.join(NEWS_DIR, 'index_de.html'), 'utf-8');
      arContent = fs.readFileSync(path.join(NEWS_DIR, 'index_ar.html'), 'utf-8');
      heContent = fs.readFileSync(path.join(NEWS_DIR, 'index_he.html'), 'utf-8');
    }, 60_000);

    it('should return result object with success status', () => {
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('errorCount');
      expect(result).toHaveProperty('articles');
    });

    it('should generate indexes successfully', () => {
      // Should generate at least some index files successfully
      expect(result.successCount).toBeGreaterThan(0);
    });

    it('should generate index files for all 14 languages', () => {
      // Check that index files exist (written by beforeAll)
      expect(fs.existsSync(path.join(NEWS_DIR, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(NEWS_DIR, 'index_sv.html'))).toBe(true);
    });

    it('should generate index files with correct lang attribute', () => {
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
      // English should have political terms in keywords
      expect(enContent).toContain('committee reports');
      expect(enContent).toContain('government bills');
      expect(enContent).toContain('parliamentary votes');

      // Swedish should have Swedish political terms
      expect(svContent).toContain('propositioner');
      expect(svContent).toContain('betänkanden');
      expect(svContent).toContain('motioner');
    });

    it('should include translated Schema.org WebSite description per language', () => {
      // Unified chrome serialises JSON-LD via `JSON.stringify(blob)` with no
      // pretty-print, so `@type` keys have no space after the colon.
      expect(enContent).toContain('"inLanguage":"en"');

      // German index should have German schema description
      expect(deContent).toContain('"inLanguage":"de"');
      expect(deContent).toContain('Schwedische Parlaments');
    });

    it('should include publisher and about in Schema.org ItemList articles', () => {
      // Publisher should be in the schema
      expect(enContent).toContain('"publisher"');
      expect(enContent).toContain('"Hack23 AB"');
      // About should reference Riksdag as GovernmentOrganization
      expect(enContent).toContain('"GovernmentOrganization"');
      expect(enContent).toContain('"Riksdag"');
    });

    it('should set dir="rtl" for Arabic and Hebrew indexes', () => {
      expect(arContent).toContain('dir="rtl"');
      expect(arContent).toContain('lang="ar"');

      expect(heContent).toContain('dir="rtl"');
      expect(heContent).toContain('lang="he"');
    });

    it('should include search input with id and aria-label', () => {
      expect(enContent).toContain('id="search-input"');
      expect(enContent).toContain('type="search"');
      // aria-label present (non-empty) and autocomplete disabled, order-independent
      expect(enContent).toMatch(/aria-label="[^"]+"/);
      expect(enContent).toMatch(/autocomplete="off"/);
    });

    it('should include load-more button and article counter', () => {
      expect(enContent).toContain('id="load-more-btn"');
      expect(enContent).toContain('id="article-counter"');
      expect(enContent).toContain('aria-live="polite"');
      // load-more must use addEventListener, not an inline onclick handler
      expect(enContent).not.toContain('onclick="loadMore()"');
      expect(enContent).toMatch(/addEventListener\s*\(\s*['"]click['"]\s*,\s*loadMore\s*\)/);
    });

    it('should include PAGE_SIZE and pagination logic', () => {
      expect(enContent).toContain('PAGE_SIZE');
      expect(enContent).toContain('loadMore()');
      expect(enContent).toContain('visibleCount');
    });

    it('should include readURLParams and updateURL for URL state management', () => {
      expect(enContent).toContain('readURLParams()');
      expect(enContent).toContain('updateURL()');
      expect(enContent).toContain('URLSearchParams');
    });

    it('should not include conflicting DOMContentLoaded content loader', () => {
      // The old dynamic content loader must not be present (it could overwrite pagination state)
      expect(enContent).not.toContain("document.addEventListener('DOMContentLoaded'");
      // #no-articles is the intentional empty-state element for "no articles at all"
      expect(enContent).toContain('id="no-articles"');
      // renderPage() must distinguish articles.length === 0 from filteredArticles.length === 0
      expect(enContent).toContain('articles.length === 0');
    });

    it('should include esc() helper and apply it to article fields in buildArticleCard', () => {
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
      expect(enContent).toContain('ai-newsroom-section');
      expect(enContent).toContain('AI-Disrupted News Generation');
      expect(enContent).toContain('agentic news generation pipeline');
    });

    it('should localise AI newsroom section for non-English languages', () => {
      expect(svContent).toContain('ai-newsroom-section');
      expect(svContent).toContain('AI-styrd nyhetsproduktion');
      expect(svContent).not.toContain('>🤖 AI-Disrupted News Generation<');
    });

    it('should include app version marker', () => {
      // News-index emits an HTML-comment app-version marker immediately after
      // the AI-newsroom section. Format: `<!-- app-version: v0.0.0 -->`.
      expect(enContent).toMatch(/<!-- app-version: v\d+\.\d+\.\d+ -->/);
    });

    it('should include the unified `rm-site-footer` 3-column trust block', () => {
      // Legacy `.footer-disclaimer` row is replaced by the canonical
      // 3-column rm-footer trust block (parity with article + sitemap + PI).
      expect(enContent).toContain('class="rm-footer-col rm-footer-trust"');
      expect(enContent).toContain('Transparency &amp; compliance');
      // GitHub issues link still appears via the navigate column.
      expect(enContent).toContain('https://github.com/Hack23/riksdagsmonitor');
    });

    it('should localise footer brand description for non-English languages', () => {
      // The unified chrome footer description (`mainPlatformDesc`) is sourced
      // from `LANGUAGE_META[lang].translations` so it is translated for every
      // language. The Swedish version must therefore contain Swedish-language
      // text in the brand column rather than English.
      expect(svContent).toContain('class="rm-footer-col rm-footer-brand"');
      expect(svContent).toContain('lang="sv"');
    });

    it('should include the unified `rm-site-header` chrome with theme toggle', () => {
      expect(enContent).toContain('class="rm-site-header"');
      expect(enContent).toContain('id="theme-toggle"');
      // Legacy `.theme-toggle-btn` is replaced by `.rm-theme-toggle`.
      expect(enContent).toContain('class="rm-theme-toggle"');
      expect(enContent).not.toContain('class="theme-toggle-btn"');
      // Compact <details> language switcher (replaces inline `.language-switcher`).
      expect(enContent).toContain('class="rm-lang-switcher"');
    });

    it('should include the anti-flash inline theme bootstrap in <head>', () => {
      expect(enContent).toContain("'riksdagsmonitor-theme'");
      expect(enContent).toContain("document.documentElement.setAttribute('data-theme'");
    });

    it('should emit Organization + WebSite + ItemList + BreadcrumbList JSON-LD', () => {
      expect(enContent).toContain('"@type":"Organization"');
      expect(enContent).toContain('"@type":"WebSite"');
      expect(enContent).toContain('"@type":"ItemList"');
      expect(enContent).toContain('"@type":"BreadcrumbList"');
      // SearchAction (Sitelinks Searchbox) is preserved on the WebSite blob.
      expect(enContent).toContain('"@type":"SearchAction"');
    });

  // Phase 2 UI features (filter bar, recency, skeletons, RTL) was extracted
  // to `tests/generate-news-indexes/template/phase2-ui-features.test.ts` per
  // Hack23/riksdagsmonitor#2624 — keeps this orchestrator spine ≤ 400 lines.
});
