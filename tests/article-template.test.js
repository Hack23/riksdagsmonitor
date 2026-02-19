/**
 * Unit Tests for Article Template
 * Tests HTML article generation
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { generateArticleHTML } from '../scripts/article-template.js';
import articleTemplateDefault from '../scripts/article-template.js';

describe('Article Template', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  const mockArticleData = {
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
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('should include article title in multiple locations', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('<title>Week Ahead: February 10-17, 2026');
      expect(html).toContain('<h1>Week Ahead: February 10-17, 2026</h1>');
      expect(html).toContain('<meta property="og:title"');
    });

    it('should include SEO meta tags', () => {
      const html = generateArticleHTML(mockArticleData);
      
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
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('hreflang="en"');
      expect(html).toContain('hreflang="sv"');
      expect(html).toContain('hreflang="x-default"');
    });

    it('should include Schema.org structured data', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('<script type="application/ld+json">');
      expect(html).toContain('"@type": "NewsArticle"');
      expect(html).toContain('"headline"');
      expect(html).toContain('"datePublished"');
    });

    it('should include speakable SpeakableSpecification in NewsArticle schema', () => {
      const html = generateArticleHTML(mockArticleData);

      expect(html).toContain('"speakable"');
      expect(html).toContain('"SpeakableSpecification"');
      expect(html).toContain('".lede"');
      expect(html).toContain('".article-content h2"');
    });

    it('should include dns-prefetch and preconnect resource hints', () => {
      const html = generateArticleHTML(mockArticleData);

      expect(html).toContain('rel="preconnect" href="https://hack23.com"');
      expect(html).toContain('rel="dns-prefetch" href="https://hack23.com"');
      expect(html).toContain('rel="dns-prefetch" href="https://fonts.googleapis.com"');
      expect(html).toContain('rel="dns-prefetch" href="https://fonts.gstatic.com"');
    });

    it('should include event calendar section', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('class="event-calendar"');
      expect(html).toContain('EU Committee Meeting');
      expect(html).toContain('Chamber Debate');
    });

    it('should include watch section', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('class="watch-section"');
      expect(html).toContain('Monitor key policy developments');
    });

    it('should include article content', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('<h2>Key Events</h2>');
      expect(html).toContain('This week features several important developments');
    });

    it('should include proper CSS classes for styling', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('class="article-header"');
      expect(html).toContain('class="article-meta"');
      expect(html).toContain('class="event-calendar"');
      expect(html).toContain('class="watch-section"');
    });

    it('should support Swedish language', () => {
      const swedishData = {
        ...mockArticleData,
        lang: 'sv',
        slug: '2026-02-10-week-ahead-sv.html',
        title: 'Vecka Framåt: 10-17 februari, 2026'
      };
      
      const html = generateArticleHTML(swedishData);
      
      expect(html).toContain('<html lang="sv">');
      expect(html).toContain('Vecka Framåt');
    });

    it('should use external styles.css and not embed CSS', () => {
      const html = generateArticleHTML(mockArticleData);
      
      // Should link to external stylesheet
      expect(html).toContain('href="../styles.css"');
      expect(html).toContain('<link rel="stylesheet"');
      // Should NOT have embedded style tags
      expect(html).not.toMatch(/<style[^>]*>/);
    });

    it('should include accessibility attributes', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('aria-label');
      expect(html).toContain('<article');
      expect(html).toContain('<header');
      expect(html).toContain('<section');
      expect(html).toContain('<footer');
    });

    it('should include sources attribution', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('Data Sources');
      expect(html).toContain('riksdag-regering-mcp');
      expect(html).toContain('Riksdagen Calendar');
    });

    it('should include back to news link', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('href="index.html"');
      expect(html).toContain('Back to News');
    });
  });

  describe('Default export', () => {
    it('should export generateArticleHTML, generateEventCalendar, generateWatchSection', () => {
      expect(articleTemplateDefault).toBeDefined();
      expect(typeof articleTemplateDefault.generateArticleHTML).toBe('function');
      expect(typeof articleTemplateDefault.generateEventCalendar).toBe('function');
      expect(typeof articleTemplateDefault.generateWatchSection).toBe('function');
    });
  });

  describe('Multi-language type labels', () => {
    const typeTests = [
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
        const data = {
          ...mockArticleData,
          lang,
          type,
          slug: `2026-02-10-test-${lang}.html`
        };
        const html = generateArticleHTML(data);
        expect(html).toContain(expected);
      });
    });

    it('should fall back to English type label for unknown language', () => {
      const data = {
        ...mockArticleData,
        lang: 'xx',
        type: 'prospective',
        slug: '2026-02-10-test-xx.html'
      };
      const html = generateArticleHTML(data);
      expect(html).toContain('The Week Ahead');
    });

    it('should show News for unknown type', () => {
      const data = {
        ...mockArticleData,
        type: 'unknown-type',
        slug: '2026-02-10-test-en.html'
      };
      const html = generateArticleHTML(data);
      expect(html).toContain('News');
    });
  });

  describe('Footer labels / localized back-to-news link', () => {
    const footerTests = [
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
        const data = {
          ...mockArticleData,
          lang,
          slug: `2026-02-10-test-${lang}.html`
        };
        const html = generateArticleHTML(data);
        expect(html).toContain(backToNews);
        expect(html).toContain(`href="${indexFile}"`);
      });
    });
  });

  describe('Breadcrumb translations', () => {
    it('should include Home and News breadcrumbs in English', () => {
      const html = generateArticleHTML(mockArticleData);
      expect(html).toContain('Home');
      expect(html).toContain('News');
    });

    it('should include localized breadcrumbs for Swedish', () => {
      const data = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-test-sv.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('Hem');
      expect(html).toContain('Nyheter');
    });

    it('should include localized breadcrumbs for Japanese', () => {
      const data = { ...mockArticleData, lang: 'ja', slug: '2026-02-10-test-ja.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('ホーム');
      expect(html).toContain('ニュース');
    });

    it('should include localized breadcrumbs for Arabic', () => {
      const data = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('الرئيسية');
      expect(html).toContain('أخبار');
    });
  });

  describe('RTL language support', () => {
    it('should set correct html lang for Arabic', () => {
      const data = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('<html lang="ar" dir="rtl">');
    });

    it('should set correct html lang for Hebrew', () => {
      const data = { ...mockArticleData, lang: 'he', slug: '2026-02-10-test-he.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('<html lang="he" dir="rtl">');
    });

    it('should not include dir attribute for LTR languages', () => {
      const data = { ...mockArticleData, lang: 'en', slug: '2026-02-10-test-en.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('<html lang="en">');
      expect(html).not.toContain('dir="rtl"');
    });
  });

  describe('CJK language support', () => {
    it('should set correct html lang for Japanese', () => {
      const data = { ...mockArticleData, lang: 'ja', slug: '2026-02-10-test-ja.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('<html lang="ja">');
    });

    it('should set correct html lang for Korean', () => {
      const data = { ...mockArticleData, lang: 'ko', slug: '2026-02-10-test-ko.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('<html lang="ko">');
    });

    it('should set correct html lang for Chinese', () => {
      const data = { ...mockArticleData, lang: 'zh', slug: '2026-02-10-test-zh.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('<html lang="zh">');
    });
  });

  describe('Localized date formatting via generateArticleHTML', () => {
    it('should format date differently for Swedish locale', () => {
      const data = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-test-sv.html' };
      const html = generateArticleHTML(data);
      // Swedish date format uses "februari" instead of "February"
      expect(html).toContain('februari');
    });

    it('should format date differently for German locale', () => {
      const data = { ...mockArticleData, lang: 'de', slug: '2026-02-10-test-de.html' };
      const html = generateArticleHTML(data);
      // German date: "Februar"
      expect(html).toContain('Februar');
    });

    it('should format date differently for French locale', () => {
      const data = { ...mockArticleData, lang: 'fr', slug: '2026-02-10-test-fr.html' };
      const html = generateArticleHTML(data);
      // French date: "février"
      expect(html).toContain('février');
    });
  });

  describe('Localized source labels', () => {
    it('should use German source labels', () => {
      const data = { ...mockArticleData, lang: 'de', slug: '2026-02-10-test-de.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('Datenquellen');
    });

    it('should use Japanese source labels', () => {
      const data = { ...mockArticleData, lang: 'ja', slug: '2026-02-10-test-ja.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('データソース');
    });

    it('should use Arabic source labels', () => {
      const data = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('مصادر البيانات');
    });
  });

  describe('Edge cases', () => {
    it('should generate article with no events', () => {
      const data = { ...mockArticleData, events: [] };
      const html = generateArticleHTML(data);
      expect(html).toContain('<!DOCTYPE html>');
      // No event calendar section
      expect(html).not.toContain('class="event-calendar"');
    });

    it('should generate article with no watch points', () => {
      const data = { ...mockArticleData, watchPoints: [] };
      const html = generateArticleHTML(data);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).not.toContain('class="watch-section"');
    });

    it('should generate article with no sources', () => {
      const data = { ...mockArticleData, sources: [] };
      const html = generateArticleHTML(data);
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should use default readTime when not provided', () => {
      const { readTime, ...dataWithoutReadTime } = mockArticleData;
      const html = generateArticleHTML(dataWithoutReadTime);
      expect(html).toContain('5 min read');
    });

    it('should use default lang when not provided', () => {
      const { lang, ...dataWithoutLang } = mockArticleData;
      const html = generateArticleHTML(dataWithoutLang);
      expect(html).toContain('<html lang="en">');
    });

    it('should handle multiple events across days', () => {
      const data = {
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
      const html = generateArticleHTML(data);
      expect(html).toContain('Morning Session');
      expect(html).toContain('Afternoon Session');
    });

    it('should escape HTML in title and subtitle', () => {
      const data = {
        ...mockArticleData,
        title: 'Test <script>alert("xss")</script>',
        subtitle: 'Sub <img onerror="hack">'
      };
      const html = generateArticleHTML(data);
      // og:title meta content should be escaped
      expect(html).toContain('&lt;script&gt;');
      // og:description should have escaped subtitle
      expect(html).toContain('&lt;img onerror=');
    });
  });

  describe('All 14 hreflang tags', () => {
    it('should include hreflang tags for all 14 languages', () => {
      const html = generateArticleHTML(mockArticleData);
      // Norwegian language code
      const allLangs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      allLangs.forEach(lang => {
        expect(html).toContain(`hreflang="${lang}"`);
      });
    });
  });

  describe('og:locale mapping (OG_LOCALE_MAP)', () => {
    const ogLocaleTests = [
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
        const data = { ...mockArticleData, lang, slug: `2026-02-10-test-${lang}.html` };
        const html = generateArticleHTML(data);
        expect(html).toContain(`<meta property="og:locale" content="${expected}"`);
      });
    });

    it('should fall back to en_US for unknown language', () => {
      const data = { ...mockArticleData, lang: 'xx', slug: '2026-02-10-test-xx.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('og:locale');
      expect(html).toContain('en_US');
    });
  });

  describe('Site tagline (SITE_TAGLINE)', () => {
    it('should include site-tagline div in English', () => {
      const html = generateArticleHTML(mockArticleData);
      expect(html).toContain('class="site-tagline"');
      expect(html).toContain('Swedish Parliament Intelligence Platform');
    });

    it('should include Swedish tagline for sv', () => {
      const data = { ...mockArticleData, lang: 'sv', slug: '2026-02-10-test-sv.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('class="site-tagline"');
      expect(html).toContain('Senaste nyheter och analyser');
    });

    it('should include German tagline for de', () => {
      const data = { ...mockArticleData, lang: 'de', slug: '2026-02-10-test-de.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('Aktuelle Nachrichten und Analysen');
    });

    it('should include Japanese tagline for ja', () => {
      const data = { ...mockArticleData, lang: 'ja', slug: '2026-02-10-test-ja.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('スウェーデン議会リクスダーグの最新ニュースと分析');
    });

    it('should include Arabic tagline for ar', () => {
      const data = { ...mockArticleData, lang: 'ar', slug: '2026-02-10-test-ar.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('أحدث الأخبار والتحليلات من البرلمان السويدي');
    });

    it('should fall back to English tagline for unknown language', () => {
      const data = { ...mockArticleData, lang: 'xx', slug: '2026-02-10-test-xx.html' };
      const html = generateArticleHTML(data);
      expect(html).toContain('Swedish Parliament Intelligence Platform');
    });
  });

  describe('Watch section titles (WATCH_SECTION_TITLES)', () => {
    const watchTitleTests = [
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
        const data = {
          ...mockArticleData,
          lang,
          slug: `2026-02-10-test-${lang}.html`,
          watchPoints: [{ title: 'Test', description: 'Test desc' }]
        };
        const html = generateArticleHTML(data);
        expect(html).toContain(expected);
      });
    });
  });

  describe('Event calendar titles (EVENT_CALENDAR_TITLES)', () => {
    const calendarTitleTests = [
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
        const data = {
          ...mockArticleData,
          lang,
          slug: `2026-02-10-test-${lang}.html`
        };
        const html = generateArticleHTML(data);
        expect(html).toContain(expected);
      });
    });
  });

  describe('sanitizeArticleBody in JSON-LD', () => {
    it('should include sanitized articleBody in JSON-LD', () => {
      const html = generateArticleHTML(mockArticleData);
      expect(html).toContain('"articleBody"');
      // Should not contain raw newlines within the JSON-LD block
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(jsonLdMatch).not.toBeNull();
      const jsonLd = jsonLdMatch[1];
      // The articleBody value itself should have newlines removed
      const bodyMatch = jsonLd.match(/"articleBody":\s*"([^"]*)"/);
      expect(bodyMatch).not.toBeNull();
      expect(bodyMatch[1]).not.toContain('\n');
    });

    it('should truncate long articleBody to 500 chars', () => {
      const longContent = '<p>' + 'Word '.repeat(500) + '</p>';
      const data = { ...mockArticleData, content: longContent };
      const html = generateArticleHTML(data);
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = jsonLdMatch[1];
      const bodyMatch = jsonLd.match(/"articleBody":\s*"([^"]*)"/);
      expect(bodyMatch[1].length).toBeLessThanOrEqual(510); // 500 chars + some escaped entities
    });
  });
});
