/**
 * Unit Tests for Article Template
 * Tests HTML article generation
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { generateArticleHTML, generateArticleLanguageSwitcher, generateSiteFooter, fixHtmlNesting } from '../scripts/article-template.js';
import articleTemplateDefault from '../scripts/article-template.js';
import type { Language } from '../scripts/types/language.js';
import type { ArticleData, ArticleCategory, EventGridItem, WatchPoint } from '../scripts/types/article.js';

/** Mock article data shape matching ArticleData but with mutable properties for test manipulation */
interface MockArticleData {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  type: ArticleCategory | string;
  readTime?: string;
  lang?: Language | string;
  content: string;
  events?: Array<{
    date: string;
    dayName: string;
    dayNumber: string;
    dayLabel: string;
    isToday: boolean;
    items: Array<{ time: string; title: string }>;
  }>;
  watchPoints?: Array<{ title: string; description: string }>;
  sources?: string[];
  keywords?: string[];
  topics?: string[];
  tags?: string[];
}

describe('Article Template', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  const mockArticleData: MockArticleData = {
    slug: '2026-02-10-week-ahead-en.html',
    title: 'Week Ahead: February 10-17, 2026',
    subtitle: 'Parliamentary calendar and key events for the coming week',
    date: '2026-02-10',
    type: 'prospective',
    readTime: '6 min read',
    lang: 'en',
    content: '<h2>Key Events</h2><p>This week features several important developments.</p>',
    events: [
      {
        date: '2026-02-10',
        dayName: 'Monday',
        dayNumber: '10',
        dayLabel: 'February 10 - Monday',
        isToday: false,
        items: [
          { time: '10:00', title: 'EU Committee Meeting' },
          { time: '14:00', title: 'Chamber Debate' }
        ]
      }
    ],
    watchPoints: [
      {
        title: 'EU Committee Meeting',
        description: 'Monitor key policy developments'
      }
    ],
    sources: ['riksdag-regering-mcp', 'Riksdagen Calendar'],
    keywords: ['parliament', 'riksdag', 'week ahead', 'sweden'],
    topics: ['parliament', 'government', 'eu'],
    tags: ['Week Ahead', 'Parliament', 'EU']
  };

  describe('generateArticleHTML', () => {
    it('should generate valid HTML structure', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('should include article title in multiple locations', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('<title>Week Ahead: February 10-17, 2026');
      expect(html).toContain('<h1>Week Ahead: February 10-17, 2026</h1>');
      expect(html).toContain('<meta property="og:title"');
    });

    it('should include SEO meta tags', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      // Open Graph
      expect(html).toContain('<meta property="og:title"');
      expect(html).toContain('<meta property="og:description"');
      expect(html).toContain('<meta property="og:type" content="article"');
      expect(html).toContain('<meta property="og:url"');
      
      // Article meta tags
      expect(html).toContain('<meta property="article:published_time"');
      expect(html).toContain('<meta property="article:author"');
      expect(html).toContain('<meta property="article:section"');
      
      // Keywords
      expect(html).toContain('<meta name="keywords"');
    });

    it('should include hreflang tags for bilingual support', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('hreflang="en"');
      expect(html).toContain('hreflang="sv"');
      expect(html).toContain('hreflang="x-default"');
    });

    it('should include Schema.org structured data', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('<script type="application/ld+json">');
      expect(html).toContain('"@type": "NewsArticle"');
      expect(html).toContain('"headline"');
      expect(html).toContain('"datePublished"');
    });

    it('should include event calendar section', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('class="event-calendar"');
      expect(html).toContain('EU Committee Meeting');
      expect(html).toContain('Chamber Debate');
    });

    it('should include watch section', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('class="watch-section"');
      expect(html).toContain('Monitor key policy developments');
    });

    it('should include article content', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('<h2>Key Events</h2>');
      expect(html).toContain('This week features several important developments');
    });

    it('should include proper CSS classes for styling', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('class="article-header"');
      expect(html).toContain('class="article-meta"');
      expect(html).toContain('class="event-calendar"');
      expect(html).toContain('class="watch-section"');
    });

    it('should support Swedish language', () => {
      const swedishData: MockArticleData = {
        ...mockArticleData,
        lang: 'sv',
        slug: '2026-02-10-week-ahead-sv.html',
        title: 'Vecka Framåt: 10-17 februari, 2026'
      };
      
      const html = generateArticleHTML(swedishData as unknown as ArticleData) as string;
      
      expect(html).toContain('<html lang="sv">');
      expect(html).toContain('Vecka Framåt');
    });

    it('should use external styles.css and not embed CSS', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      // Should link to external stylesheet
      expect(html).toContain('href="../styles.css"');
      expect(html).toContain('<link rel="stylesheet"');
      // Should NOT have embedded style tags
      expect(html).not.toMatch(/<style[^>]*>/);
    });

    it('should include accessibility attributes', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('aria-label');
      expect(html).toContain('<article');
      expect(html).toContain('<header');
      expect(html).toContain('<section');
      expect(html).toContain('<footer');
    });

    it('should include skip to content link as first focusable element', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('class="skip-link"');
      expect(html).toContain('href="#main-content"');
      expect(html).toContain('Skip to main content');
      // Skip link must appear before language switcher
      const skipIdx = html.indexOf('class="skip-link"');
      const navIdx = html.indexOf('class="language-switcher"');
      expect(skipIdx).toBeGreaterThan(-1);
      expect(skipIdx).toBeLessThan(navIdx);
    });

    it('should include id="main-content" on article element', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('id="main-content"');
      expect(html).toContain('<article id="main-content"');
    });

    it('should translate skip link for non-English languages', () => {
      const svData: MockArticleData = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-test-sv.html' };
      const arData: MockArticleData = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      
      const svHtml = generateArticleHTML(svData as unknown as ArticleData) as string;
      expect(svHtml).toContain('Hoppa till huvudinnehåll');
      
      const arHtml = generateArticleHTML(arData as unknown as ArticleData) as string;
      expect(arHtml).toContain('الانتقال إلى المحتوى الرئيسي');
    });

    it('should include sources attribution', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('Data Sources');
      expect(html).toContain('riksdag-regering-mcp');
      expect(html).toContain('Riksdagen Calendar');
    });

    it('should include back to news link', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      
      expect(html).toContain('href="index.html"');
      expect(html).toContain('Back to News');
    });
  });

  describe('Default export', () => {
    it('should export generateArticleHTML, generateEventCalendar, generateWatchSection', () => {
      expect(articleTemplateDefault).toBeDefined();
      expect(typeof (articleTemplateDefault as Record<string, unknown>).generateArticleHTML).toBe('function');
      expect(typeof (articleTemplateDefault as Record<string, unknown>).generateEventCalendar).toBe('function');
      expect(typeof (articleTemplateDefault as Record<string, unknown>).generateWatchSection).toBe('function');
    });
  });

  describe('Multi-language type labels', () => {
    const typeTests: Array<{ lang: Language | string; type: string; expected: string }> = [
      { lang: 'en', type: 'prospective', expected: 'The Week Ahead' },
      { lang: 'sv', type: 'prospective', expected: 'Veckan som kommer' },
      { lang: 'da', type: 'analysis', expected: 'Analyse' },
      { lang: 'no', type: 'breaking', expected: 'Siste nytt' },
      { lang: 'fi', type: 'retrospective', expected: 'Viikon katsaus' },
      { lang: 'de', type: 'prospective', expected: 'Woche voraus' },
      { lang: 'fr', type: 'breaking', expected: 'Dernière heure' },
      { lang: 'es', type: 'analysis', expected: 'Análisis' },
      { lang: 'nl', type: 'prospective', expected: 'Week vooruit' },
      { lang: 'ar', type: 'prospective', expected: 'الأسبوع القادم' },
      { lang: 'he', type: 'breaking', expected: 'חדשות אחרונות' },
      { lang: 'ja', type: 'prospective', expected: '来週の展望' },
      { lang: 'ko', type: 'analysis', expected: '분석' },
      { lang: 'zh', type: 'breaking', expected: '突发新闻' }
    ];

    typeTests.forEach(({ lang, type, expected }) => {
      it(`should use correct type label for ${lang}/${type}`, () => {
        const data: MockArticleData = {
          ...mockArticleData,
          lang,
          type,
          slug: `2026-02-10-test-${lang}.html`
        };
        const html = generateArticleHTML(data as unknown as ArticleData) as string;
        expect(html).toContain(expected);
      });
    });

    it('should fall back to English type label for unknown language', () => {
      const data: MockArticleData = {
        ...mockArticleData,
        lang: 'xx',
        type: 'prospective',
        slug: '2026-02-10-test-xx.html'
      };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('The Week Ahead');
    });

    it('should show News for unknown type', () => {
      const data: MockArticleData = {
        ...mockArticleData,
        type: 'unknown-type',
        slug: '2026-02-10-test-en.html'
      };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('News');
    });
  });

  describe('Footer labels / localized back-to-news link', () => {
    const footerTests: Array<{ lang: Language | string; backToNews: string; indexFile: string }> = [
      { lang: 'en', backToNews: 'Back to News', indexFile: 'index.html' },
      { lang: 'sv', backToNews: 'Tillbaka till nyheter', indexFile: 'index_sv.html' },
      { lang: 'da', backToNews: 'Tilbage til nyheder', indexFile: 'index_da.html' },
      { lang: 'no', backToNews: 'Tilbake til nyheter', indexFile: 'index_no.html' },
      { lang: 'fi', backToNews: 'Takaisin uutisiin', indexFile: 'index_fi.html' },
      { lang: 'de', backToNews: 'Zurück zu Nachrichten', indexFile: 'index_de.html' },
      { lang: 'fr', backToNews: 'Retour aux actualités', indexFile: 'index_fr.html' },
      { lang: 'es', backToNews: 'Volver a noticias', indexFile: 'index_es.html' },
      { lang: 'nl', backToNews: 'Terug naar nieuws', indexFile: 'index_nl.html' },
      { lang: 'ar', backToNews: 'العودة إلى الأخبار', indexFile: 'index_ar.html' },
      { lang: 'he', backToNews: 'חזרה לחדשות', indexFile: 'index_he.html' },
      { lang: 'ja', backToNews: 'ニュースに戻る', indexFile: 'index_ja.html' },
      { lang: 'ko', backToNews: '뉴스로 돌아가기', indexFile: 'index_ko.html' },
      { lang: 'zh', backToNews: '返回新闻', indexFile: 'index_zh.html' }
    ];

    footerTests.forEach(({ lang, backToNews, indexFile }) => {
      it(`should use localized back-to-news for ${lang}`, () => {
        const data: MockArticleData = {
          ...mockArticleData,
          lang,
          slug: `2026-02-10-test-${lang}.html`
        };
        const html = generateArticleHTML(data as unknown as ArticleData) as string;
        expect(html).toContain(backToNews);
        expect(html).toContain(`href="${indexFile}"`);
      });
    });
  });

  describe('Breadcrumb translations', () => {
    it('should include Home and News breadcrumbs in English', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('Home');
      expect(html).toContain('News');
    });

    it('should include localized breadcrumbs for Swedish', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-test-sv.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('Hem');
      expect(html).toContain('Nyheter');
    });

    it('should include localized breadcrumbs for Japanese', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ja', slug: '2026-02-10-test-ja.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('ホーム');
      expect(html).toContain('ニュース');
    });

    it('should include localized breadcrumbs for Arabic', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('الرئيسية');
      expect(html).toContain('أخبار');
    });
  });

  describe('RTL language support', () => {
    it('should set correct html lang for Arabic', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<html lang="ar" dir="rtl">');
    });

    it('should set correct html lang for Hebrew', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'he', slug: '2026-02-10-test-he.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<html lang="he" dir="rtl">');
    });

    it('should not include dir attribute for LTR languages', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'en', slug: '2026-02-10-test-en.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<html lang="en">');
      expect(html).not.toContain('dir="rtl"');
    });
  });

  describe('CJK language support', () => {
    it('should set correct html lang for Japanese', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ja', slug: '2026-02-10-test-ja.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<html lang="ja">');
    });

    it('should set correct html lang for Korean', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ko', slug: '2026-02-10-test-ko.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<html lang="ko">');
    });

    it('should set correct html lang for Chinese', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'zh', slug: '2026-02-10-test-zh.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<html lang="zh">');
    });
  });

  describe('Localized date formatting via generateArticleHTML', () => {
    it('should format date differently for Swedish locale', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-test-sv.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      // Swedish date format uses "februari" instead of "February"
      expect(html).toContain('februari');
    });

    it('should format date differently for German locale', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'de', slug: '2026-02-10-test-de.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      // German date: "Februar"
      expect(html).toContain('Februar');
    });

    it('should format date differently for French locale', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'fr', slug: '2026-02-10-test-fr.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      // French date: "février"
      expect(html).toContain('février');
    });
  });

  describe('Localized source labels', () => {
    it('should use German source labels', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'de', slug: '2026-02-10-test-de.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('Datenquellen');
    });

    it('should use Japanese source labels', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ja', slug: '2026-02-10-test-ja.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('データソース');
    });

    it('should use Arabic source labels', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('مصادر البيانات');
    });
  });

  describe('Edge cases', () => {
    it('should generate article with no events', () => {
      const data: MockArticleData = { ...mockArticleData, events: [] };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<!DOCTYPE html>');
      // No event calendar section
      expect(html).not.toContain('class="event-calendar"');
    });

    it('should generate article with no watch points', () => {
      const data: MockArticleData = { ...mockArticleData, watchPoints: [] };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).not.toContain('class="watch-section"');
    });

    it('should generate article with no sources', () => {
      const data: MockArticleData = { ...mockArticleData, sources: [] };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should use default readTime when not provided', () => {
      const { readTime, ...dataWithoutReadTime } = mockArticleData;
      const html = generateArticleHTML(dataWithoutReadTime as unknown as ArticleData) as string;
      expect(html).toContain('5 min read');
    });

    it('should use default lang when not provided', () => {
      const { lang, ...dataWithoutLang } = mockArticleData;
      const html = generateArticleHTML(dataWithoutLang as unknown as ArticleData) as string;
      expect(html).toContain('<html lang="en">');
    });

    it('should handle multiple events across days', () => {
      const data: MockArticleData = {
        ...mockArticleData,
        events: [
          {
            date: '2026-02-10',
            dayName: 'Monday',
            dayNumber: '10',
            dayLabel: 'February 10',
            isToday: false,
            items: [{ time: '10:00', title: 'Morning Session' }]
          },
          {
            date: '2026-02-11',
            dayName: 'Tuesday',
            dayNumber: '11',
            dayLabel: 'February 11',
            isToday: false,
            items: [{ time: '14:00', title: 'Afternoon Session' }]
          }
        ]
      };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('Morning Session');
      expect(html).toContain('Afternoon Session');
    });

    it('should escape HTML in title and subtitle', () => {
      const data: MockArticleData = {
        ...mockArticleData,
        title: 'Test <script>alert("xss")</script>',
        subtitle: 'Sub <img onerror="hack">'
      };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      // og:title meta content should be escaped
      expect(html).toContain('&lt;script&gt;');
      // og:description should have escaped subtitle
      expect(html).toContain('&lt;img onerror=');
    });
  });

  describe('All 14 hreflang tags', () => {
    it('should include hreflang tags for all 14 languages', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      // Norwegian maps to BCP-47 'nb' (Bokmål); URL path suffix remains 'no'
      const allLangs: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      allLangs.forEach((lang: Language) => {
        const expectedHreflang = lang === 'no' ? 'nb' : lang;
        expect(html).toContain(`hreflang="${expectedHreflang}"`);
      });
    });
  });

  describe('og:locale mapping (OG_LOCALE_MAP)', () => {
    const ogLocaleTests: Array<{ lang: Language | string; expected: string }> = [
      { lang: 'en', expected: 'en_US' },
      { lang: 'sv', expected: 'sv_SE' },
      { lang: 'da', expected: 'da_DK' },
      { lang: 'no', expected: 'nb_NO' },
      { lang: 'fi', expected: 'fi_FI' },
      { lang: 'de', expected: 'de_DE' },
      { lang: 'fr', expected: 'fr_FR' },
      { lang: 'es', expected: 'es_ES' },
      { lang: 'nl', expected: 'nl_NL' },
      { lang: 'ar', expected: 'ar_SA' },
      { lang: 'he', expected: 'he_IL' },
      { lang: 'ja', expected: 'ja_JP' },
      { lang: 'ko', expected: 'ko_KR' },
      { lang: 'zh', expected: 'zh_CN' }
    ];

    ogLocaleTests.forEach(({ lang, expected }) => {
      it(`should output og:locale ${expected} for ${lang}`, () => {
        const data: MockArticleData = { ...mockArticleData, lang, slug: `2026-02-10-test-${lang}.html` };
        const html = generateArticleHTML(data as unknown as ArticleData) as string;
        expect(html).toContain(`<meta property="og:locale" content="${expected}"`);
      });
    });

    it('should fall back to en_US for unknown language', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'xx', slug: '2026-02-10-test-xx.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('og:locale');
      expect(html).toContain('en_US');
    });
  });

  describe('Site tagline (SITE_TAGLINE)', () => {
    it('should include site-tagline div in English', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('class="site-tagline"');
      expect(html).toContain('Swedish Parliament Intelligence Platform');
    });

    it('should include Swedish tagline for sv', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-test-sv.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('class="site-tagline"');
      expect(html).toContain('Senaste nyheter och analyser');
    });

    it('should include German tagline for de', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'de', slug: '2026-02-10-test-de.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('Aktuelle Nachrichten und Analysen');
    });

    it('should include Japanese tagline for ja', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ja', slug: '2026-02-10-test-ja.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('スウェーデン議会リクスダーグの最新ニュースと分析');
    });

    it('should include Arabic tagline for ar', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('أحدث الأخبار والتحليلات من البرلمان السويدي');
    });

    it('should fall back to English tagline for unknown language', () => {
      const data: MockArticleData = { ...mockArticleData, lang: 'xx', slug: '2026-02-10-test-xx.html' };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).toContain('Swedish Parliament Intelligence Platform');
    });
  });

  describe('Watch section titles (WATCH_SECTION_TITLES)', () => {
    const watchTitleTests: Array<{ lang: Language | string; expected: string }> = [
      { lang: 'en', expected: 'What to Watch This Week' },
      { lang: 'sv', expected: 'Vad man ska följa denna vecka' },
      { lang: 'de', expected: 'Worauf diese Woche zu achten ist' },
      { lang: 'fr', expected: 'À suivre cette semaine' },
      { lang: 'ja', expected: '今週の注目ポイント' },
      { lang: 'ar', expected: 'ما يجب متابعته هذا الأسبوع' },
      { lang: 'ko', expected: '이번 주 주목할 사항' },
      { lang: 'zh', expected: '本周关注要点' }
    ];

    watchTitleTests.forEach(({ lang, expected }) => {
      it(`should use localized watch title for ${lang}`, () => {
        const data: MockArticleData = {
          ...mockArticleData,
          lang,
          slug: `2026-02-10-test-${lang}.html`,
          watchPoints: [{ title: 'Test', description: 'Test desc' }]
        };
        const html = generateArticleHTML(data as unknown as ArticleData) as string;
        expect(html).toContain(expected);
      });
    });
  });

  describe('Event calendar titles (EVENT_CALENDAR_TITLES)', () => {
    const calendarTitleTests: Array<{ lang: Language | string; expected: string }> = [
      { lang: 'en', expected: 'Event Calendar' },
      { lang: 'sv', expected: 'Veckans händelser' },
      { lang: 'de', expected: 'Veranstaltungskalender' },
      { lang: 'fr', expected: 'Calendrier des événements' },
      { lang: 'ja', expected: 'イベントカレンダー' },
      { lang: 'ar', expected: 'تقويم الأحداث' },
      { lang: 'ko', expected: '일정 캘린더' },
      { lang: 'zh', expected: '活动日历' }
    ];

    calendarTitleTests.forEach(({ lang, expected }) => {
      it(`should use localized calendar title for ${lang}`, () => {
        const data: MockArticleData = {
          ...mockArticleData,
          lang,
          slug: `2026-02-10-test-${lang}.html`
        };
        const html = generateArticleHTML(data as unknown as ArticleData) as string;
        expect(html).toContain(expected);
      });
    });
  });

  describe('sanitizeArticleBody in JSON-LD', () => {
    it('should include sanitized articleBody in JSON-LD', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('"articleBody"');
      // Should not contain raw newlines within the JSON-LD block
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(jsonLdMatch).not.toBeNull();
      const jsonLd = jsonLdMatch![1]!;
      // The articleBody value itself should have newlines removed
      const bodyMatch = jsonLd.match(/"articleBody":\s*"([^"]*)"/);
      expect(bodyMatch).not.toBeNull();
      expect(bodyMatch![1]).not.toContain('\n');
    });

    it('should truncate long articleBody to 500 chars', () => {
      const longContent = '<p>' + 'Word '.repeat(500) + '</p>';
      const data: MockArticleData = { ...mockArticleData, content: longContent };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = jsonLdMatch![1]!;
      const bodyMatch = jsonLd.match(/"articleBody":\s*"([^"]*)"/);
      expect(bodyMatch![1]!.length).toBeLessThanOrEqual(510); // 500 chars + some escaped entities
    });
  });

  describe('Language switcher in generated article', () => {
    it('should include language-switcher nav in article HTML', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('class="language-switcher"');
      expect(html).toContain('role="navigation"');
      expect(html).toContain('aria-label="Language versions"');
    });

    it('should include all 14 language links', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      for (const lang of langs) {
        // Norwegian maps to BCP-47 'nb'; URL path suffix remains 'no'
        const expectedHreflang = lang === 'no' ? 'nb' : lang;
        expect(html).toContain(`hreflang="${expectedHreflang}"`);
        expect(html).toContain(`class="lang-link`);
      }
    });

    it('should mark current language as active', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('class="lang-link active" hreflang="en"');
    });

    it('should mark Swedish as active for sv articles', () => {
      const svData: MockArticleData = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-week-ahead-sv.html' };
      const html = generateArticleHTML(svData as unknown as ArticleData) as string;
      expect(html).toContain('class="lang-link active" hreflang="sv"');
    });
  });

  describe('Top back-to-news navigation', () => {
    it('should include article-top-nav before the article', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('class="article-top-nav"');
    });

    it('should include back-to-news link in top nav', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      const topNavMatch = html.match(/<div class="article-top-nav">([\s\S]*?)<\/div>/);
      expect(topNavMatch).not.toBeNull();
      expect(topNavMatch![1]).toContain('class="back-to-news"');
      expect(topNavMatch![1]).toContain('Back to News');
    });

    it('should link to correct news index for language', () => {
      const svData: MockArticleData = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-week-ahead-sv.html' };
      const html = generateArticleHTML(svData as unknown as ArticleData) as string;
      const topNavMatch = html.match(/<div class="article-top-nav">([\s\S]*?)<\/div>/);
      expect(topNavMatch).not.toBeNull();
      expect(topNavMatch![1]).toContain('index_sv.html');
    });
  });

  describe('Site footer in generated article', () => {
    it('should include site footer with footer-content', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('<footer role="contentinfo">');
      expect(html).toContain('class="footer-content"');
      expect(html).toContain('class="footer-section"');
    });

    it('should include footer-bottom with copyright', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('class="footer-bottom"');
      expect(html).toContain('Hack23 AB');
    });

    it('should include language grid in footer', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('class="language-grid"');
    });

    it('should include footer stats', () => {
      const html = generateArticleHTML(mockArticleData as unknown as ArticleData) as string;
      expect(html).toContain('class="footer-stats"');
      expect(html).toContain('349 MPs');
    });
  });

  describe('generateArticleLanguageSwitcher', () => {
    it('should generate nav with all 14 language links', () => {
      const html = generateArticleLanguageSwitcher('2026-02-10-test', 'en');
      expect(html).toContain('class="language-switcher"');
      expect(html).toContain('2026-02-10-test-en.html');
      expect(html).toContain('2026-02-10-test-sv.html');
      expect(html).toContain('2026-02-10-test-zh.html');
    });

    it('should mark the current language as active', () => {
      const html = generateArticleLanguageSwitcher('2026-02-10-test', 'de');
      expect(html).toContain('class="lang-link active" hreflang="de"');
      expect(html).not.toContain('class="lang-link active" hreflang="en"');
    });

    it('should include flag emojis', () => {
      const html = generateArticleLanguageSwitcher('2026-02-10-test', 'en');
      expect(html).toContain('🇬🇧');
      expect(html).toContain('🇸🇪');
      expect(html).toContain('🇯🇵');
    });

    it('should add aria-current="page" to active language link', () => {
      const html = generateArticleLanguageSwitcher('2026-02-10-test', 'de');
      expect(html).toContain('aria-current="page"');
      // Only the active language should have aria-current
      const matches = html.match(/aria-current="page"/g);
      expect(matches).toHaveLength(1);
      expect(html).toContain('hreflang="de" aria-current="page"');
    });

    it('should use localized aria-label for nav element', () => {
      const htmlEn = generateArticleLanguageSwitcher('2026-02-10-test', 'en');
      expect(htmlEn).toContain('aria-label="Language versions"');

      const htmlSv = generateArticleLanguageSwitcher('2026-02-10-test', 'sv');
      expect(htmlSv).toContain('aria-label="Språkversioner"');

      const htmlAr = generateArticleLanguageSwitcher('2026-02-10-test', 'ar');
      expect(htmlAr).toContain('aria-label="إصدارات اللغة"');
    });
  });

  describe('generateSiteFooter', () => {
    it('should generate footer with English labels', () => {
      const html = generateSiteFooter('en');
      expect(html).toContain('About Riksdagsmonitor');
      expect(html).toContain('Quick Links');
      expect(html).toContain('Built by Hack23 AB');
    });

    it('should generate footer with Swedish labels', () => {
      const html = generateSiteFooter('sv');
      expect(html).toContain('Om Riksdagsmonitor');
      expect(html).toContain('Snabblänkar');
    });

    it('should include language grid', () => {
      const html = generateSiteFooter('en');
      expect(html).toContain('class="language-grid"');
      expect(html).toContain('🇬🇧');
    });

    it('should include copyright info', () => {
      const html = generateSiteFooter('en');
      expect(html).toContain('Hack23 AB');
      expect(html).toContain('Org.nr 5595347807');
    });

    it('should fall back to English for unknown language', () => {
      const html = generateSiteFooter('xx');
      expect(html).toContain('About Riksdagsmonitor');
      // Should use English paths, not index_xx.html
      expect(html).toContain('../index.html');
      expect(html).not.toContain('index_xx.html');
    });

    it('should include Dashboard, LinkedIn, Security Policy, and Contact Us links', () => {
      const html = generateSiteFooter('en');
      expect(html).toContain('dashboard/index.html');
      expect(html).toContain('linkedin.com/company/hack23');
      expect(html).toContain('Information_Security_Policy.md');
      expect(html).toContain('mailto:info@hack23.com');
      expect(html).toContain('Contact Us');
    });

    it('should include aria-label attributes on language grid links', () => {
      const html = generateSiteFooter('en');
      expect(html).toContain('aria-label="Switch to English"');
      expect(html).toContain('aria-label="Byt till Svenska"');
      expect(html).toContain('aria-label="日本語に切り替え"');
    });

    it('should use localized dashboard link for non-English languages', () => {
      const htmlSv = generateSiteFooter('sv');
      expect(htmlSv).toContain('dashboard/index_sv.html');
      expect(htmlSv).toContain('Instrumentpanel');
      const htmlFr = generateSiteFooter('fr');
      expect(htmlFr).toContain('dashboard/index_fr.html');
      expect(htmlFr).toContain('Tableau de bord');
    });

    it('should use localized location in footer bottom', () => {
      const htmlEn = generateSiteFooter('en');
      expect(htmlEn).toContain('Gothenburg, Sweden');
      const htmlSv = generateSiteFooter('sv');
      expect(htmlSv).toContain('Göteborg, Sverige');
      const htmlJa = generateSiteFooter('ja');
      expect(htmlJa).toContain('ヨーテボリ（スウェーデン）');
    });

    it('should use localized footer stats', () => {
      const htmlSv = generateSiteFooter('sv');
      expect(htmlSv).toContain('349 ledamöter');
      expect(htmlSv).toContain('45 riskregler');
      const htmlFr = generateSiteFooter('fr');
      expect(htmlFr).toContain('349 députés');
      expect(htmlFr).toContain('45 règles de risque');
    });

    it('should include app version in footer', () => {
      const html = generateSiteFooter('en');
      expect(html).toMatch(/\| v\d+\.\d+\.\d+/);
    });

    it('should include disclaimer with GitHub issues link', () => {
      const html = generateSiteFooter('en');
      expect(html).toContain('footer-disclaimer');
      expect(html).toContain('Ongoing improvements');
      expect(html).toContain('https://github.com/Hack23/riksdagsmonitor/issues');
    });

    it('should localise disclaimer for non-English languages', () => {
      const htmlSv = generateSiteFooter('sv');
      expect(htmlSv).toContain('footer-disclaimer');
      expect(htmlSv).toContain('rapportera eventuella problem');
      expect(htmlSv).not.toContain('Ongoing improvements');

      const htmlJa = generateSiteFooter('ja');
      expect(htmlJa).toContain('footer-disclaimer');
      expect(htmlJa).toContain('GitHub');
    });
  });

  describe('Default export includes new functions', () => {
    it('should export generateArticleLanguageSwitcher', () => {
      expect(typeof articleTemplateDefault.generateArticleLanguageSwitcher).toBe('function');
    });

    it('should export generateSiteFooter', () => {
      expect(typeof articleTemplateDefault.generateSiteFooter).toBe('function');
    });
  });

  describe('fixHtmlNesting', () => {
    it('should remove orphaned </p> after </ul>', () => {
      const input = '<p>intro</p><ul><li>item</li></ul></p>';
      expect(fixHtmlNesting(input)).toBe('<p>intro</p><ul><li>item</li></ul>');
    });

    it('should remove orphaned </p> after </ol>', () => {
      const input = '<p>intro</p><ol><li>step</li></ol></p>';
      expect(fixHtmlNesting(input)).toBe('<p>intro</p><ol><li>step</li></ol>');
    });

    it('should handle whitespace between </ul> and </p>', () => {
      const input = '<ul><li>x</li></ul>  </p>';
      expect(fixHtmlNesting(input)).toBe('<ul><li>x</li></ul>');
    });

    it('should leave valid </p> tags unchanged', () => {
      const input = '<p>valid paragraph</p><p>another</p>';
      expect(fixHtmlNesting(input)).toBe('<p>valid paragraph</p><p>another</p>');
    });

    it('should fix the pattern in rendered article HTML body', () => {
      const data: MockArticleData = {
        ...mockArticleData,
        content: '<p>Key proposals include:</p><ul><li><strong>Item A</strong></li></ul></p>'
      };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      expect(html).not.toContain('</ul></p>');
      expect(html).not.toContain('</ol></p>');
    });

    it('should fix the pattern in JSON-LD articleBody', () => {
      const data: MockArticleData = {
        ...mockArticleData,
        content: '<p>Key proposals include:</p><ul><li><strong>Item A</strong></li></ul></p>'
      };
      const html = generateArticleHTML(data as unknown as ArticleData) as string;
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(jsonLdMatch).not.toBeNull();
      // The escaped form of </ul></p> should not appear in JSON-LD articleBody
      expect(jsonLdMatch![1]).not.toContain('&lt;/ul&gt;&lt;/p&gt;');
    });
  });
});
