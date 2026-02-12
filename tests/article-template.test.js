/**
 * Unit Tests for Article Template
 * Tests HTML article generation
 */

import { describe, it, expect } from 'vitest';
import { generateArticleHTML } from '../scripts/article-template.js';

describe('Article Template', () => {
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

    it('should include responsive design CSS', () => {
      const html = generateArticleHTML(mockArticleData);
      
      expect(html).toContain('@media (max-width: 768px)');
      expect(html).toContain('grid-template-columns');
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
});
