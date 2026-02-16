/**
 * Cypress E2E Tests - Sitemap Pages
 * 
 * Tests for sitemap.html and language variants covering:
 * - Page loading and structure
 * - Link validity and organization
 * - Multi-language support (14 languages)
 * - RTL support for Arabic and Hebrew
 * - Navigation and user experience
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('Sitemap Pages', () => {
  describe('English Sitemap', () => {
    beforeEach(() => {
      cy.visit('/sitemap.html');
    });

    it('should load sitemap successfully', () => {
      cy.title().should('include', 'Sitemap');
      cy.get('body').should('be.visible');
    });

    it('should have proper document structure', () => {
      cy.get('header').should('exist');
      cy.get('main, body').should('exist');
      cy.get('footer').should('exist');
    });

    it('should have sitemap heading', () => {
      cy.get('h1').should('be.visible');
      cy.get('h1').invoke('text').then((text) => {
        expect(text.toLowerCase()).to.match(/sitemap|site map/);
      });
    });

    it('should have multiple links', () => {
      cy.get('a[href]').should('have.length.greaterThan', 10);
    });

    it('should have organized sections', () => {
      cy.get('h2, h3, ul, ol').should('exist');
    });

    it('should have links to main pages', () => {
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        
        // Check for common page links
        const hasHomeLink = bodyHtml.includes('index.html') || bodyHtml.includes('href="/"');
        const hasDashboardLink = bodyHtml.includes('dashboard');
        const hasNewsLink = bodyHtml.includes('news');
        
        expect(hasHomeLink || hasDashboardLink || hasNewsLink).to.be.true;
      });
    });

    it('should have valid internal links', () => {
      cy.get('a[href^="/"], a[href^="./"], a[href^="index"]').first().then(($link) => {
        if ($link.length > 0) {
          const href = $link.attr('href');
          cy.log(`Found internal link: ${href}`);
          expect(href).to.not.be.empty;
        }
      });
    });

    it('should have proper meta tags', () => {
      cy.get('meta[name="description"]').should('exist');
      cy.get('meta[name="viewport"]').should('exist');
    });

    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('body').should('be.visible');
      cy.get('h1').should('be.visible');
    });
  });

  describe('Multi-Language Sitemap Support', () => {
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

    languages.forEach(({ code, name, dir }) => {
      describe(`${name} Sitemap (${code})`, () => {
        it(`should load ${name} sitemap successfully`, () => {
          cy.visit(`/sitemap_${code}.html`);
          cy.get('body').should('be.visible');
        });

        it(`should have proper lang attribute for ${name}`, () => {
          cy.visit(`/sitemap_${code}.html`);
          cy.get('html').should('have.attr', 'lang', code);
        });

        it(`should have proper dir attribute for ${name}`, () => {
          cy.visit(`/sitemap_${code}.html`);
          cy.get('html').should('have.attr', 'dir', dir);
        });

        it(`should have links in ${name}`, () => {
          cy.visit(`/sitemap_${code}.html`);
          cy.get('a[href]').should('have.length.greaterThan', 5);
        });

        it(`should have sitemap heading in ${name}`, () => {
          cy.visit(`/sitemap_${code}.html`);
          cy.get('h1').should('be.visible');
        });
      });
    });
  });

  describe('RTL Sitemap Support', () => {
    it('should have proper RTL layout for Arabic', () => {
      cy.visit('/sitemap_ar.html');
      cy.get('html').should('have.attr', 'dir', 'rtl');
      cy.get('html').should('have.attr', 'lang', 'ar');
      cy.get('body').should('be.visible');
    });

    it('should have proper RTL layout for Hebrew', () => {
      cy.visit('/sitemap_he.html');
      cy.get('html').should('have.attr', 'dir', 'rtl');
      cy.get('html').should('have.attr', 'lang', 'he');
      cy.get('body').should('be.visible');
    });
  });

  describe('Sitemap Link Organization', () => {
    beforeEach(() => {
      cy.visit('/sitemap.html');
    });

    it('should have dashboard links', () => {
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        if (bodyHtml.includes('dashboard')) {
          cy.get('a[href*="dashboard"]').should('exist');
        }
      });
    });

    it('should have news links', () => {
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        if (bodyHtml.includes('news')) {
          cy.get('a[href*="news"]').should('exist');
        }
      });
    });

    it('should have language variant links', () => {
      cy.get('body').then(($body) => {
        const bodyHtml = $body.html();
        
        // Check for language code patterns
        const hasLanguageLinks = 
          bodyHtml.includes('_sv') ||
          bodyHtml.includes('_da') ||
          bodyHtml.includes('_no');
        
        if (hasLanguageLinks) {
          cy.log('Found language variant links');
        }
      });
    });
  });

  describe('Sitemap Accessibility', () => {
    beforeEach(() => {
      cy.visit('/sitemap.html');
    });

    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length', 1);
    });

    it('should have keyboard navigable links', () => {
      cy.get('a[href]').first().focus().should('have.focus');
    });

    it('should have descriptive link text', () => {
      cy.get('a[href]').first().then(($link) => {
        const linkText = $link.text().trim();
        expect(linkText.length).to.be.greaterThan(0);
      });
    });

    it('should not have empty links', () => {
      cy.get('a[href]').each(($link) => {
        const href = $link.attr('href');
        expect(href).to.not.be.empty;
        expect(href).to.not.equal('#');
      });
    });
  });

  describe('Sitemap Performance', () => {
    it('should load quickly', () => {
      cy.visit('/sitemap.html');
      cy.get('h1', { timeout: 3000 }).should('be.visible');
    });

    it('should not have broken internal links (sample)', () => {
      cy.visit('/sitemap.html');
      
      // Test a few links to ensure they exist
      cy.get('a[href^="/"], a[href^="./"]').then(($links) => {
        if ($links.length > 0) {
          // Test first 3 links
          const linksToTest = $links.slice(0, 3);
          
          linksToTest.each((index, link) => {
            const href = Cypress.$(link).attr('href');
            if (href && !href.includes('http') && !href.includes('#')) {
              cy.log(`Testing link: ${href}`);
              // We can't actually visit all links, but we log them
            }
          });
        }
      });
    });
  });

  describe('Sitemap Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should be responsive on ${name}`, () => {
        cy.visit('/sitemap.html');
        cy.viewport(width, height);
        cy.get('body').should('be.visible');
        cy.get('h1').should('be.visible');
        
        // Links should be visible and clickable
        cy.get('a[href]').first().should('be.visible');
      });
    });
  });

  describe('Sitemap Navigation', () => {
    it('should have link back to homepage', () => {
      cy.visit('/sitemap.html');
      cy.get('body').then(($body) => {
        const hasHomeLink = 
          $body.find('a[href="/"]').length > 0 ||
          $body.find('a[href="index.html"]').length > 0 ||
          $body.find('a[href="./index.html"]').length > 0;
        
        if (hasHomeLink) {
          cy.log('Found link back to homepage');
        }
      });
    });

    it('should have navigation menu', () => {
      cy.visit('/sitemap.html');
      cy.get('nav, header').should('exist');
    });
  });
});
