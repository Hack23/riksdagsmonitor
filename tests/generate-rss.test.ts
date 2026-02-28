/**
 * Unit Tests for RSS Feed Generation
 * Tests rss.xml generation and validation, including multi-language alternates.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

/** Shape of the generate-rss module */
interface GenerateRssModule {
  readonly generateRss: () => string;
  readonly validateRss: (xml: string) => boolean;
  readonly getRssArticles: () => Array<{
    file: string;
    title: string;
    description: string;
    link: string;
    pubDate: string;
    baseSlug: string;
    lang: string;
    alternateLanguages: Array<{ lang: string; href: string }>;
  }>;
  readonly escapeXml: (text: string) => string;
}

describe('RSS Feed Generation', () => {
  let module: GenerateRssModule;
  let rssContent: string;

  beforeAll(async () => {
    const originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    module = await import('../scripts/generate-rss.js') as unknown as GenerateRssModule;
    rssContent = module.generateRss();

    process.exit = originalExit;
  });

  describe('escapeXml', () => {
    it('should escape ampersand', () => {
      expect(module.escapeXml('a & b')).toBe('a &amp; b');
    });

    it('should escape angle brackets', () => {
      expect(module.escapeXml('<tag>')).toBe('&lt;tag&gt;');
    });

    it('should escape quotes', () => {
      expect(module.escapeXml('"hello"')).toBe('&quot;hello&quot;');
    });

    it('should escape apostrophes', () => {
      expect(module.escapeXml("it's")).toBe('it&apos;s');
    });

    it('should handle plain text', () => {
      expect(module.escapeXml('Hello World')).toBe('Hello World');
    });
  });

  describe('getRssArticles', () => {
    it('should return articles', () => {
      const articles = module.getRssArticles();
      expect(articles.length).toBeGreaterThan(10);
    });

    it('should return English articles only', () => {
      const articles = module.getRssArticles();
      articles.forEach(article => {
        expect(article.lang).toBe('en');
      });
    });

    it('should have multi-language alternates', () => {
      const articles = module.getRssArticles();
      const withAlternates = articles.filter(a => a.alternateLanguages.length > 0);
      expect(withAlternates.length).toBeGreaterThan(5);
    });

    it('should extract article titles', () => {
      const articles = module.getRssArticles();
      articles.forEach(article => {
        expect(article.title).toBeTruthy();
        expect(article.title.length).toBeGreaterThan(5);
      });
    });

    it('should have valid links', () => {
      const articles = module.getRssArticles();
      articles.forEach(article => {
        expect(article.link).toMatch(/^https:\/\/riksdagsmonitor\.com\/news\/.+\.html$/);
      });
    });

    it('should be sorted by date (most recent first)', () => {
      const articles = module.getRssArticles();
      for (let i = 1; i < articles.length; i++) {
        const prev = new Date(articles[i - 1]!.pubDate).getTime();
        const curr = new Date(articles[i]!.pubDate).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('should limit to 50 articles', () => {
      const articles = module.getRssArticles();
      expect(articles.length).toBeLessThanOrEqual(50);
    });
  });

  describe('generateRss', () => {
    it('should return valid RSS 2.0 XML', () => {
      expect(rssContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(rssContent).toContain('<rss version="2.0"');
      expect(rssContent).toContain('</rss>');
    });

    it('should have channel element', () => {
      expect(rssContent).toContain('<channel>');
      expect(rssContent).toContain('</channel>');
    });

    it('should have channel title', () => {
      expect(rssContent).toContain('<title>Riksdagsmonitor');
    });

    it('should have channel link', () => {
      expect(rssContent).toContain('<link>https://riksdagsmonitor.com</link>');
    });

    it('should have channel description', () => {
      expect(rssContent).toContain('<description>');
    });

    it('should have language element', () => {
      expect(rssContent).toContain('<language>en</language>');
    });

    it('should have atom self link', () => {
      expect(rssContent).toContain('atom:link href="https://riksdagsmonitor.com/rss.xml" rel="self"');
    });

    it('should have atom namespace', () => {
      expect(rssContent).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    });

    it('should have dc namespace', () => {
      expect(rssContent).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    });

    it('should have channel image', () => {
      expect(rssContent).toContain('<image>');
      expect(rssContent).toContain('<url>https://hack23.com/cia-icon-140.webp</url>');
    });

    it('should have items', () => {
      const itemCount = (rssContent.match(/<item>/g) || []).length;
      expect(itemCount).toBeGreaterThan(10);
      expect(itemCount).toBeLessThanOrEqual(50);
    });

    it('should have item titles', () => {
      expect(rssContent).toMatch(/<item>[\s\S]*?<title>[^<]+<\/title>/);
    });

    it('should have item links', () => {
      expect(rssContent).toMatch(/<item>[\s\S]*?<link>https:\/\/riksdagsmonitor\.com\/news\/.+<\/link>/);
    });

    it('should have item guids', () => {
      expect(rssContent).toMatch(/<guid isPermaLink="true">https:\/\/riksdagsmonitor\.com\/news\/.+<\/guid>/);
    });

    it('should have pubDate elements', () => {
      expect(rssContent).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
    });

    it('should have dc:creator elements', () => {
      expect(rssContent).toContain('<dc:creator>Riksdagsmonitor</dc:creator>');
    });

    it('should have multi-language hreflang alternates', () => {
      expect(rssContent).toContain('hreflang="sv"');
      expect(rssContent).toContain('hreflang="en"');
    });

    it('should have hreflang alternates for multiple languages', () => {
      const hreflangMatches = rssContent.match(/hreflang="[a-z]{2}"/g) || [];
      const uniqueLangs = new Set(hreflangMatches.map(m => m.replace(/hreflang="|"/g, '')));
      expect(uniqueLangs.size).toBeGreaterThan(5);
    });

    it('should have channel categories', () => {
      expect(rssContent).toContain('<category>Swedish Politics</category>');
      expect(rssContent).toContain('<category>Parliament</category>');
    });

    it('should have copyright', () => {
      expect(rssContent).toContain('<copyright>');
      expect(rssContent).toContain('Hack23 AB');
    });

    it('should have ttl element', () => {
      expect(rssContent).toContain('<ttl>60</ttl>');
    });

    it('should have lastBuildDate', () => {
      expect(rssContent).toContain('<lastBuildDate>');
    });

    it('should have generator element', () => {
      expect(rssContent).toContain('<generator>Riksdagsmonitor RSS Generator');
    });

    it('should have docs link', () => {
      expect(rssContent).toContain('<docs>https://www.rssboard.org/rss-specification</docs>');
    });
  });

  describe('validateRss', () => {
    it('should pass for valid RSS', () => {
      expect(() => module.validateRss(rssContent)).not.toThrow();
      expect(module.validateRss(rssContent)).toBe(true);
    });

    it('should throw for missing XML declaration', () => {
      expect(() => module.validateRss('<rss><channel></channel></rss>')).toThrow('Invalid XML declaration');
    });

    it('should throw for missing RSS version', () => {
      expect(() => module.validateRss('<?xml version="1.0"?><feed></feed>')).toThrow('Missing RSS 2.0 version');
    });

    it('should throw for missing channel', () => {
      expect(() => module.validateRss('<?xml version="1.0"?><rss version="2.0"><item></item></rss>')).toThrow('Missing <channel> element');
    });

    it('should throw for empty feed', () => {
      const emptyRss = '<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title><link>test</link><description>test</description></channel></rss>';
      expect(() => module.validateRss(emptyRss)).toThrow('No items in RSS feed');
    });
  });
});
