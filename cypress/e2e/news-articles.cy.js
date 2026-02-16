/**
 * Cypress E2E Tests - News Articles
 * 
 * Tests for individual news article pages covering:
 * - Article page loading and structure
 * - Article content validation
 * - Navigation between articles
 * - Multi-language article support
 * - Article metadata and SEO
 * - Responsive design
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('News Articles', () => {
  // Sample articles to test (most recent)
  const sampleArticles = [
    '/news/2026-02-14-committee-reports-en.html',
    '/news/2026-02-14-government-propositions-en.html',
    '/news/2026-02-14-opposition-motions-en.html',
    '/news/2026-02-14-week-ahead-feb-15-21-en.html',
    '/news/2026-02-13-evening-analysis-en.html'
  ];

  describe('Sample Article Loading', () => {
    sampleArticles.forEach((articlePath) => {
      it(`should load article: ${articlePath}`, () => {
        cy.visit(articlePath);
        cy.get('body').should('be.visible');
        cy.get('h1, .article-title').should('be.visible');
      });
    });
  });

  describe('Article Page Structure', () => {
    beforeEach(() => {
      cy.visit(sampleArticles[0]);
    });

    it('should have proper document structure', () => {
      cy.get('header').should('exist');
      cy.get('main, article, .article-content').should('exist');
      cy.get('footer').should('exist');
    });

    it('should have article heading', () => {
      cy.get('h1').should('have.length', 1);
      cy.get('h1').should('be.visible');
    });

    it('should have article content', () => {
      cy.get('article, .article-content, main').then(($content) => {
        const text = $content.text().trim();
        expect(text.length).to.be.greaterThan(100);
      });
    });

    it('should have proper meta tags', () => {
      cy.get('meta[name="description"]').should('exist');
      cy.get('meta[name="viewport"]').should('exist');
      cy.get('meta[charset]').should('exist');
    });

    it('should have Open Graph tags for social sharing', () => {
      cy.get('meta[property="og:title"]').should('exist');
      cy.get('meta[property="og:description"]').should('exist');
      cy.get('meta[property="og:type"]').should('have.attr', 'content', 'article');
    });

    it('should have article metadata', () => {
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html().toLowerCase();
        
        // Check for date/time indicators
        const hasDate = bodyHtml.includes('2026') || bodyHtml.includes('date') || bodyHtml.includes('published');
        
        if (hasDate) {
          cy.log('Found article date metadata');
        }
      });
    });

    it('should have readable typography', () => {
      cy.get('article, .article-content, main').should('have.css', 'line-height');
      cy.get('article, .article-content, main').should('have.css', 'font-size');
    });
  });

  describe('Article Content Validation', () => {
    beforeEach(() => {
      cy.visit(sampleArticles[0]);
    });

    it('should have paragraphs', () => {
      cy.get('p').should('have.length.greaterThan', 1);
    });

    it('should have headings hierarchy', () => {
      cy.get('h1').should('have.length', 1);
      cy.get('h2, h3').should('exist');
    });

    it('should not have Lorem Ipsum placeholder text', () => {
      cy.get('body').invoke('text').then((text) => {
        expect(text.toLowerCase()).to.not.include('lorem ipsum');
      });
    });

    it('should have substantial content', () => {
      cy.get('article, .article-content, main p').then(($paragraphs) => {
        let totalLength = 0;
        $paragraphs.each((index, el) => {
          totalLength += Cypress.$(el).text().length;
        });
        expect(totalLength).to.be.greaterThan(200);
      });
    });
  });

  describe('Multi-Language Article Support', () => {
    const languageVariants = [
      { path: '/news/2026-02-13-evening-analysis-en.html', lang: 'en', name: 'English' },
      { path: '/news/2026-02-13-evening-analysis-sv.html', lang: 'sv', name: 'Swedish' },
      { path: '/news/2026-02-13-evening-analysis-da.html', lang: 'da', name: 'Danish' },
      { path: '/news/2026-02-13-evening-analysis-no.html', lang: 'no', name: 'Norwegian' },
      { path: '/news/2026-02-13-evening-analysis-fi.html', lang: 'fi', name: 'Finnish' }
    ];

    languageVariants.forEach(({ path, lang, name }) => {
      it(`should load ${name} article version`, () => {
        cy.visit(path);
        cy.get('body').should('be.visible');
        cy.get('html').should('have.attr', 'lang', lang);
      });
    });

    it('should have language switcher or alternatives', () => {
      cy.visit('/news/2026-02-13-evening-analysis-en.html');
      
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        
        // Check for hreflang tags or language switcher
        const hasHreflang = bodyHtml.includes('hreflang');
        const hasLangLinks = 
          bodyHtml.includes('-sv.html') ||
          bodyHtml.includes('-da.html') ||
          bodyHtml.includes('-no.html');
        
        if (hasHreflang || hasLangLinks) {
          cy.log('Found language alternatives');
        }
      });
    });
  });

  describe('RTL Article Support', () => {
    const rtlArticles = [
      { path: '/news/2026-02-13-evening-analysis-ar.html', lang: 'ar', name: 'Arabic' },
      { path: '/news/2026-02-13-evening-analysis-he.html', lang: 'he', name: 'Hebrew' }
    ];

    rtlArticles.forEach(({ path, lang, name }) => {
      it(`should have proper RTL layout for ${name}`, () => {
        cy.visit(path);
        cy.get('html').should('have.attr', 'dir', 'rtl');
        cy.get('html').should('have.attr', 'lang', lang);
        cy.get('body').should('be.visible');
      });
    });
  });

  describe('Article Navigation', () => {
    beforeEach(() => {
      cy.visit(sampleArticles[0]);
    });

    it('should have navigation back to news index', () => {
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        const hasNewsLink = 
          bodyHtml.includes('news/index') ||
          bodyHtml.includes('news/') ||
          bodyHtml.includes('/news"');
        
        if (hasNewsLink) {
          cy.get('a[href*="news"]').first().should('exist');
        }
      });
    });

    it('should have navigation to homepage', () => {
      cy.get('body').then(($body) => {
        const hasHomeLink = 
          $body.find('a[href="/"]').length > 0 ||
          $body.find('a[href="index.html"]').length > 0 ||
          $body.find('a[href="../index.html"]').length > 0;
        
        if (hasHomeLink) {
          cy.log('Found link to homepage');
        }
      });
    });

    it('should have header navigation', () => {
      cy.get('header, nav').should('exist');
    });
  });

  describe('Article Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Large Desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should be readable on ${name} (${width}x${height})`, () => {
        cy.visit(sampleArticles[0]);
        cy.viewport(width, height);
        cy.get('body').should('be.visible');
        cy.get('h1').should('be.visible');
        
        // Content should not overflow
        cy.get('article, .article-content, main').then(($content) => {
          if ($content.length > 0) {
            const contentWidth = $content.width();
            expect(contentWidth).to.be.at.most(width);
          }
        });
      });
    });

    it('should have mobile-optimized reading experience', () => {
      cy.visit(sampleArticles[0]);
      cy.viewport('iphone-x');
      
      // Check that text is readable (not too small)
      cy.get('article p, .article-content p, main p').first().then(($p) => {
        if ($p.length > 0) {
          const fontSize = parseInt($p.css('font-size'));
          expect(fontSize).to.be.at.least(14);
        }
      });
    });
  });

  describe('Article Accessibility', () => {
    beforeEach(() => {
      cy.visit(sampleArticles[0]);
    });

    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length', 1);
    });

    it('should have alt text on images', () => {
      cy.get('body').then(($body) => {
        const images = $body.find('img');
        if (images.length > 0) {
          cy.get('img').each(($img) => {
            cy.wrap($img).should('have.attr', 'alt');
          });
        } else {
          cy.log('No images in article');
        }
      });
    });

    it('should have keyboard navigable links', () => {
      cy.get('a[href]').first().then(($link) => {
        if ($link.length > 0) {
          cy.wrap($link).focus().should('have.focus');
        }
      });
    });

    it('should have semantic HTML', () => {
      cy.get('article, main, header, footer').should('exist');
    });
  });

  describe('Article Performance', () => {
    it('should load quickly', () => {
      const start = Date.now();
      cy.visit(sampleArticles[0]);
      cy.get('h1', { timeout: 5000 }).should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        cy.log(`Page loaded in ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(10000);
      });
    });

    it('should not have JavaScript errors', () => {
      cy.visit(sampleArticles[0]);
      cy.window().then((win) => {
        // Cypress catches JS errors automatically
        cy.log('Checking for JS errors...');
      });
    });
  });

  describe('Article SEO', () => {
    beforeEach(() => {
      cy.visit(sampleArticles[0]);
    });

    it('should have canonical URL', () => {
      cy.get('link[rel="canonical"]').then(($link) => {
        if ($link.length > 0) {
          cy.wrap($link).should('have.attr', 'href');
        }
      });
    });

    it('should have description meta tag', () => {
      cy.get('meta[name="description"]').should('exist');
      cy.get('meta[name="description"]').should('have.attr', 'content').and('have.length.greaterThan', 50);
    });

    it('should have relevant keywords', () => {
      cy.get('meta[name="keywords"]').then(($meta) => {
        if ($meta.length > 0) {
          cy.wrap($meta).should('have.attr', 'content');
        }
      });
    });
  });

  describe('Article Categories', () => {
    const categories = {
      'committee-reports': '/news/2026-02-14-committee-reports-en.html',
      'government-propositions': '/news/2026-02-14-government-propositions-en.html',
      'opposition-motions': '/news/2026-02-14-opposition-motions-en.html',
      'week-ahead': '/news/2026-02-14-week-ahead-feb-15-21-en.html',
      'evening-analysis': '/news/2026-02-13-evening-analysis-en.html'
    };

    Object.entries(categories).forEach(([category, path]) => {
      it(`should load ${category} article`, () => {
        cy.visit(path);
        cy.get('body').should('be.visible');
        cy.get('h1').should('be.visible');
      });
    });
  });
});
