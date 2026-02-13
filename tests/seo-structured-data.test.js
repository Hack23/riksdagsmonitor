/**
 * SEO and Structured Data Tests
 * 
 * Validates that all news pages contain comprehensive SEO metadata
 * and Schema.org structured data for search engines and social media.
 */

import { describe, it, expect } from 'vitest';
import { generateArticleHTML } from '../scripts/article-template.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SEO & Structured Data', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // Sample article data for testing
  const sampleArticle = {
    slug: '2026-02-12-test-article-en.html',
    title: 'Test Article: Swedish Parliament News',
    subtitle: 'This is a test article subtitle for SEO validation',
    date: '2026-02-12T09:00:00Z',
    type: 'prospective',
    readTime: '5 min read',
    lang: 'en',
    locale: 'en_US',
    content: '<p>Test content for the article body.</p>',
    events: [],
    watchPoints: ['Key point 1', 'Key point 2'],
    sources: ['get_calendar_events', 'search_dokument'],
    keywords: ['riksdag', 'parliament', 'sweden', 'politics'],
    tags: ['government', 'parliament', 'eu']
  };

  describe('Schema.org NewsArticle Structured Data', () => {
    it('should include NewsArticle schema with all required properties', () => {
      const html = generateArticleHTML(sampleArticle);
      
      // Extract JSON-LD - capture full script content
      const jsonLDMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
      expect(jsonLDMatch, 'NewsArticle JSON-LD should exist').toBeTruthy();
      
      const jsonLD = JSON.parse(jsonLDMatch[1]);
      expect(jsonLD['@type']).toBe('NewsArticle');
      expect(jsonLD['@context']).toBe('https://schema.org');
      expect(jsonLD.headline).toBe(sampleArticle.title);
      expect(jsonLD.description).toBeTruthy();
      expect(jsonLD.datePublished).toBeTruthy();
      expect(jsonLD.author).toBeTruthy();
      expect(jsonLD.publisher).toBeTruthy();
    });

    it('should include enhanced NewsArticle properties', () => {
      const html = generateArticleHTML(sampleArticle);
      const jsonLDMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
      const jsonLD = JSON.parse(jsonLDMatch[1]);
      
      expect(jsonLD.alternativeHeadline).toBeTruthy();
      expect(jsonLD.dateModified).toBeTruthy();
      expect(jsonLD.articleSection).toBeTruthy();
      expect(jsonLD.articleBody).toBeTruthy();
      expect(jsonLD.wordCount).toBeGreaterThan(0);
      expect(jsonLD.inLanguage).toBe('en');
      expect(jsonLD.isAccessibleForFree).toBe(true);
      expect(jsonLD.mainEntityOfPage).toBeTruthy();
    });

    it('should include proper author information', () => {
      const html = generateArticleHTML(sampleArticle);
      const jsonLDMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
      const jsonLD = JSON.parse(jsonLDMatch[1]);
      
      expect(jsonLD.author['@type']).toBe('Person');
      expect(jsonLD.author.name).toBe('James Pether Sörling');
      expect(jsonLD.author.jobTitle).toBeTruthy();
      expect(jsonLD.author.affiliation).toBeTruthy();
    });

    it('should include proper publisher information with logo', () => {
      const html = generateArticleHTML(sampleArticle);
      const jsonLDMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
      const jsonLD = JSON.parse(jsonLDMatch[1]);
      
      expect(jsonLD.publisher['@type']).toBe('Organization');
      expect(jsonLD.publisher.name).toBe('Riksdagsmonitor');
      expect(jsonLD.publisher.logo).toBeTruthy();
      expect(jsonLD.publisher.logo['@type']).toBe('ImageObject');
      expect(jsonLD.publisher.logo.url).toBeTruthy();
    });
  });

  describe('Schema.org BreadcrumbList', () => {
    it('should include BreadcrumbList structured data', () => {
      const html = generateArticleHTML(sampleArticle);
      
      // Find BreadcrumbList JSON-LD
      const breadcrumbMatch = html.match(/BreadcrumbList[\s\S]*?<\/script>/);
      expect(breadcrumbMatch, 'BreadcrumbList should exist').toBeTruthy();
    });
  });

  describe('Schema.org Organization', () => {
    it('should include Organization structured data', () => {
      const html = generateArticleHTML(sampleArticle);
      
      // Find Organization JSON-LD
      const orgMatch = html.match(/"@type":\s*"Organization"[\s\S]*?contactPoint/);
      expect(orgMatch, 'Organization schema should exist').toBeTruthy();
    });
  });

  describe('Open Graph Tags', () => {
    it('should include all required Open Graph tags', () => {
      const html = generateArticleHTML(sampleArticle);
      
      expect(html).toContain('og:title');
      expect(html).toContain('og:description');
      expect(html).toContain('og:type');
      expect(html).toContain('og:url');
      expect(html).toContain('og:image');
      expect(html).toContain('og:locale');
      expect(html).toContain('og:site_name');
    });

    it('should include article-specific Open Graph tags', () => {
      const html = generateArticleHTML(sampleArticle);
      
      expect(html).toContain('article:published_time');
      expect(html).toContain('article:modified_time');
      expect(html).toContain('article:author');
      expect(html).toContain('article:section');
      expect(html).toContain('article:tag');
    });

    it('should include Open Graph image dimensions', () => {
      const html = generateArticleHTML(sampleArticle);
      
      expect(html).toContain('og:image:width');
      expect(html).toContain('og:image:height');
      expect(html).toContain('og:image:alt');
    });
  });

  describe('Twitter Card Tags', () => {
    it('should include all required Twitter Card tags', () => {
      const html = generateArticleHTML(sampleArticle);
      
      expect(html).toContain('twitter:card');
      expect(html).toContain('twitter:title');
      expect(html).toContain('twitter:description');
      expect(html).toContain('twitter:image');
      expect(html).toContain('twitter:site');
      expect(html).toContain('twitter:creator');
    });

    it('should include enhanced Twitter Card metadata', () => {
      const html = generateArticleHTML(sampleArticle);
      
      expect(html).toContain('twitter:image:alt');
      expect(html).toContain('twitter:label1');
      expect(html).toContain('twitter:data1');
      expect(html).toContain('twitter:label2');
      expect(html).toContain('twitter:data2');
    });
  });

  describe('Hreflang Tags', () => {
    it('should include hreflang tags for language alternatives', () => {
      const html = generateArticleHTML(sampleArticle);
      
      expect(html).toContain('hreflang="en"');
      expect(html).toContain('hreflang="sv"');
      expect(html).toContain('hreflang="x-default"');
    });
  });

  describe('SEO Meta Tags', () => {
    it('should include essential SEO meta tags', () => {
      const html = generateArticleHTML(sampleArticle);
      
      expect(html).toContain('<title>');
      expect(html).toContain('meta name="description"');
      expect(html).toContain('meta name="keywords"');
      expect(html).toContain('meta name="author"');
      expect(html).toContain('link rel="canonical"');
    });

    it('should have non-empty meta descriptions', () => {
      const html = generateArticleHTML(sampleArticle);
      const descMatch = html.match(/meta name="description" content="([^"]+)"/);
      
      expect(descMatch).toBeTruthy();
      expect(descMatch[1].length).toBeGreaterThanOrEqual(50);
      expect(descMatch[1].length).toBeLessThanOrEqual(160);
    });
  });

  describe('News Index Structured Data', () => {
    it('should validate news index files have ItemList structured data', () => {
      const indexPath = path.join(__dirname, '..', 'news', 'index.html');
      
      if (!fs.existsSync(indexPath)) {
        console.warn('News index not found, skipping test');
        return;
      }
      
      const html = fs.readFileSync(indexPath, 'utf-8');
      
      expect(html).toContain('"@type": "ItemList"');
      expect(html).toContain('"@type": "BreadcrumbList"');
      expect(html).toContain('"@type": "WebSite"');
    });

    it('should validate Swedish news index has correct locale', () => {
      const indexPath = path.join(__dirname, '..', 'news', 'index_sv.html');
      
      if (!fs.existsSync(indexPath)) {
        console.warn('Swedish news index not found, skipping test');
        return;
      }
      
      const html = fs.readFileSync(indexPath, 'utf-8');
      
      expect(html).toContain('lang="sv"');
      expect(html).toContain('og:locale" content="sv_SE"');
    });
  });

  describe('No Inline Styles', () => {
    it('should not have large inline style blocks in news indexes', () => {
      const indexPath = path.join(__dirname, '..', 'news', 'index.html');
      
      if (!fs.existsSync(indexPath)) {
        console.warn('News index not found, skipping test');
        return;
      }
      
      const html = fs.readFileSync(indexPath, 'utf-8');
      
      // Should have news-page class
      expect(html).toContain('class="news-page"');
      
      // Should NOT have large inline style blocks (>100 lines)
      const styleMatches = html.match(/<style>([\s\S]*?)<\/style>/g);
      if (styleMatches) {
        styleMatches.forEach(style => {
          const lineCount = style.split('\n').length;
          expect(lineCount).toBeLessThan(30); // Only minimal RTL styles allowed
        });
      }
    });

    it('should link to external styles.css', () => {
      const indexPath = path.join(__dirname, '..', 'news', 'index.html');
      
      if (!fs.existsSync(indexPath)) {
        console.warn('News index not found, skipping test');
        return;
      }
      
      const html = fs.readFileSync(indexPath, 'utf-8');
      
      expect(html).toContain('link rel="stylesheet" href="../styles.css"');
    });
  });
});
