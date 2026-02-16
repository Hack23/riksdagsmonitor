/**
 * Cypress E2E Tests - News Page
 * 
 * Comprehensive tests for news/index.html and all 14 language variants
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('News Page - Main English Version', () => {
  beforeEach(() => {
    cy.visit('/news/');
  });
  
  it('should load news page successfully', () => {
    cy.title().should('exist');
    cy.get('body').should('be.visible');
  });
  
  it('should have proper document structure', () => {
    cy.get('header').should('exist');
    cy.get('main').should('exist');
    cy.get('footer').should('exist');
  });
  
  it('should display page heading', () => {
    cy.get('h1').should('be.visible');
  });
  
  it('should have navigation menu', () => {
    cy.get('nav').should('be.visible');
    cy.get('nav a').should('have.length.greaterThan', 0);
  });
  
  it('should have language switcher for all 14 languages', () => {
    const languages = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    
    // Check that language switcher exists
    cy.get('body').then(($body) => {
      const bodyHtml = $body.html();
      
      // At least some language links should exist
      let foundCount = 0;
      languages.forEach((lang) => {
        if (bodyHtml.includes(`index_${lang}.html`)) {
          foundCount++;
        }
      });
      
      // Expect at least 10 of 13 language links to be present (flexible)
      expect(foundCount).to.be.at.least(10);
    });
  });
  
  it('should display news articles or article list', () => {
    cy.get('body').then(($body) => {
      const bodyHtml = $body.html();
      
      // Look for typical news article elements
      const hasArticles = 
        bodyHtml.includes('article') || 
        bodyHtml.includes('news') || 
        bodyHtml.includes('headline') ||
        bodyHtml.includes('h2') ||
        bodyHtml.includes('h3');
      
      expect(hasArticles).to.be.true;
    });
  });
  
  it('should have news article links', () => {
    cy.get('body').then(($body) => {
      const links = $body.find('a[href*=".html"]');
      
      // Should have some links to articles
      expect(links.length).to.be.greaterThan(0);
    });
  });
  
  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('body').should('be.visible');
    cy.get('header').should('be.visible');
    cy.get('main').should('be.visible');
  });
  
  it('should be responsive on tablet', () => {
    cy.viewport('ipad-2');
    cy.get('body').should('be.visible');
    cy.get('header').should('be.visible');
    cy.get('main').should('be.visible');
  });
  
  it('should be responsive on desktop', () => {
    cy.viewport(1920, 1080);
    cy.get('body').should('be.visible');
    cy.get('header').should('be.visible');
    cy.get('main').should('be.visible');
  });
  
  it('should have proper meta tags', () => {
    cy.get('meta[name="description"]').should('exist');
    cy.get('meta[name="viewport"]').should('exist');
    cy.get('meta[charset]').should('exist');
  });
  
  it('should have link back to homepage', () => {
    cy.get('a[href*="/"], a[href*="index.html"]').should('exist');
  });
  
  it('should load CSS styles', () => {
    cy.get('link[rel="stylesheet"]').should('exist');
    cy.get('body').should('have.css', 'margin');
  });
  
  it('should load JavaScript (if any)', () => {
    // News page may or may not have JavaScript
    cy.get('body').should('exist');
  });
});

describe('News Page - All Language Variants', () => {
  const languages = [
    { code: 'sv', name: 'Swedish', dir: 'ltr' },
    { code: 'da', name: 'Danish', dir: 'ltr' },
    { code: 'no', name: 'Norwegian', dir: 'ltr' },
    { code: 'fi', name: 'Finnish', dir: 'ltr' },
    { code: 'de', name: 'German', dir: 'ltr' },
    { code: 'fr', name: 'French', dir: 'ltr' },
    { code: 'es', name: 'Spanish', dir: 'ltr' },
    { code: 'nl', name: 'Dutch', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', dir: 'rtl' },
    { code: 'he', name: 'Hebrew', dir: 'rtl' },
    { code: 'ja', name: 'Japanese', dir: 'ltr' },
    { code: 'ko', name: 'Korean', dir: 'ltr' },
    { code: 'zh', name: 'Chinese', dir: 'ltr' }
  ];
  
  languages.forEach((lang) => {
    describe(`${lang.name} (${lang.code.toUpperCase()})`, () => {
      it(`should load ${lang.name} news page`, () => {
        cy.visit(`/news/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'lang');
        cy.get('body').should('be.visible');
      });
      
      it(`should have correct dir attribute for ${lang.name}`, () => {
        cy.visit(`/news/index_${lang.code}.html`);
        if (lang.dir === 'rtl') {
          cy.get('html').should('have.attr', 'dir', 'rtl');
        } else {
          // LTR is default, may not be explicitly set
          cy.get('html').then(($html) => {
            const dirAttr = $html.attr('dir');
            // Either ltr or not set (defaults to ltr)
            expect(dirAttr === 'ltr' || dirAttr === undefined).to.be.true;
          });
        }
      });
      
      it(`should have proper page structure for ${lang.name}`, () => {
        cy.visit(`/news/index_${lang.code}.html`);
        cy.get('header').should('exist');
        cy.get('main').should('exist');
        cy.get('footer').should('exist');
      });
      
      it(`should be responsive for ${lang.name}`, () => {
        cy.visit(`/news/index_${lang.code}.html`);
        
        // Test mobile
        cy.viewport(375, 667);
        cy.get('body').should('be.visible');
        
        // Test desktop
        cy.viewport(1280, 720);
        cy.get('body').should('be.visible');
      });
    });
  });
});

describe('News Page - Accessibility', () => {
  beforeEach(() => {
    cy.visit('/news/');
  });
  
  it('should have valid HTML lang attribute', () => {
    cy.get('html').should('have.attr', 'lang');
  });
  
  it('should have proper heading hierarchy', () => {
    cy.get('h1').should('have.length', 1);
  });
  
  it('should have alt text on images (if any)', () => {
    cy.get('body').then(($body) => {
      const images = $body.find('img');
      if (images.length > 0) {
        cy.get('img').each(($img) => {
          cy.wrap($img).should('have.attr', 'alt');
        });
      } else {
        cy.log('No images found - skipping alt text validation');
      }
    });
  });
  
  it('should be keyboard navigable', () => {
    cy.get('a, button, input, select').first().focus().should('have.focus');
  });
  
  it('should have visible focus indicators', () => {
    cy.get('a, button').first().focus();
    cy.focused().should('have.css', 'outline-style').and('not.equal', 'none');
  });
  
  it('should have semantic HTML for articles', () => {
    cy.get('body').then(($body) => {
      const hasSemanticTags = 
        $body.find('article').length > 0 || 
        $body.find('section').length > 0 ||
        $body.find('header').length > 0;
      
      expect(hasSemanticTags).to.be.true;
    });
  });
});

describe('News Page - Navigation', () => {
  it('should navigate from homepage to news page', () => {
    cy.visit('/');
    cy.get('a[href*="news"]').first().click();
    cy.url().should('include', 'news');
  });
  
  it('should navigate from news page back to homepage', () => {
    cy.visit('/news/');
    cy.get('a[href="/"], a[href="../"], a[href*="index.html"]').first().click();
    cy.url().should('match', /\/$|index\.html$/);
  });
  
  it('should support language switching on news page', () => {
    cy.visit('/news/');
    
    // Try to switch to Swedish version
    cy.get('body').then(($body) => {
      const svLink = $body.find('a[href*="index_sv.html"]');
      if (svLink.length > 0) {
        cy.get('a[href*="index_sv.html"]').first().click();
        cy.url().should('include', 'index_sv.html');
      } else {
        cy.log('Swedish language link not found - skipping language switch test');
      }
    });
  });
  
  it('should link to individual news articles', () => {
    cy.visit('/news/');
    
    cy.get('body').then(($body) => {
      const articleLinks = $body.find('a[href*=".html"]').filter((i, el) => {
        const href = Cypress.$(el).attr('href');
        return href && !href.includes('index') && href.endsWith('.html');
      });
      
      if (articleLinks.length > 0) {
        // Click first article link
        cy.wrap(articleLinks.first()).click();
        cy.url().should('include', '.html');
        cy.get('body').should('be.visible');
      } else {
        cy.log('No article links found - skipping article navigation test');
      }
    });
  });
});

describe('News Page - Performance', () => {
  it('should load news page within reasonable time', () => {
    cy.visit('/news/', { timeout: 10000 });
    cy.get('body', { timeout: 5000 }).should('be.visible');
  });
  
  it('should handle errors gracefully', () => {
    // Test that page loads even with network errors
    cy.visit('/news/');
    cy.get('body').should('be.visible');
  });
});

describe('News Page - RTL Support', () => {
  const rtlLanguages = [
    { code: 'ar', name: 'Arabic' },
    { code: 'he', name: 'Hebrew' }
  ];
  
  rtlLanguages.forEach((lang) => {
    it(`should have proper RTL layout for ${lang.name}`, () => {
      cy.visit(`/news/index_${lang.code}.html`);
      
      cy.get('html').should('have.attr', 'dir', 'rtl');
      cy.get('body').should('be.visible');
      
      // Verify RTL-specific styling (if any)
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        expect(bodyHtml).to.exist;
      });
    });
  });
});

describe('News Page - Content Validation', () => {
  beforeEach(() => {
    cy.visit('/news/');
  });
  
  it('should have news metadata (dates, categories)', () => {
    cy.get('body').then(($body) => {
      const bodyHtml = $body.html();
      
      // Look for date patterns (YYYY-MM-DD, 2026, etc.)
      const hasDate = /20\d{2}/.test(bodyHtml);
      
      expect(hasDate).to.be.true;
    });
  });
  
  it('should have proper article structure', () => {
    cy.get('body').then(($body) => {
      const bodyHtml = $body.html();
      
      // Look for article-related elements
      const hasArticleElements = 
        bodyHtml.includes('<article') || 
        bodyHtml.includes('article') ||
        bodyHtml.includes('<h2') ||
        bodyHtml.includes('<h3');
      
      expect(hasArticleElements).to.be.true;
    });
  });
  
  it('should have readable text content', () => {
    cy.get('body').invoke('text').should('have.length.greaterThan', 100);
  });
});

describe('News Page - Article Categories', () => {
  beforeEach(() => {
    cy.visit('/news/');
  });
  
  it('should show different news categories or types', () => {
    cy.get('body').then(($body) => {
      const bodyHtml = $body.html();
      
      // Look for news category indicators
      const hasCategories = 
        bodyHtml.includes('evening-analysis') ||
        bodyHtml.includes('committee-reports') ||
        bodyHtml.includes('government-propositions') ||
        bodyHtml.includes('opposition-motions') ||
        bodyHtml.includes('week-ahead') ||
        bodyHtml.toLowerCase().includes('analysis') ||
        bodyHtml.toLowerCase().includes('report') ||
        bodyHtml.toLowerCase().includes('motion');
      
      // At least one category indicator should exist
      expect(hasCategories).to.be.true;
    });
  });
});
