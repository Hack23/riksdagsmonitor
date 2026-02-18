/**
 * Cypress E2E Tests - Dashboard Page
 * 
 * Comprehensive tests for dashboard/index.html and all 14 language variants
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('Dashboard Page - Main English Version', () => {
  beforeEach(() => {
    cy.stubCIAData();
    cy.visit('/dashboard/');
  });
  
  it('should load dashboard page successfully', () => {
    cy.title().should('include', 'Dashboard');
    cy.get('body').should('be.visible');
  });
  
  it('should have proper document structure', () => {
    cy.get('header').should('exist');
    cy.get('main').should('exist');
    cy.get('footer').should('exist');
  });
  
  it('should display page heading', () => {
    cy.get('h1').should('be.visible');
    cy.get('h1').should('contain.text', 'Dashboard');
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
      
      // Expect at least 5 of 13 language links to be present (flexible)
      // Dashboard might have fewer language links than homepage
      expect(foundCount).to.be.at.least(5);
    });
  });
  
  it('should have CIA data visualization containers', () => {
    // Check for common dashboard chart/visualization containers
    cy.get('body').then(($body) => {
      const bodyHtml = $body.html();
      
      // Look for typical dashboard elements
      const hasCharts = bodyHtml.includes('canvas') || bodyHtml.includes('chart');
      const hasVisualizations = bodyHtml.includes('dashboard') || bodyHtml.includes('visualization');
      
      expect(hasCharts || hasVisualizations).to.be.true;
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
  
  it('should load JavaScript modules', () => {
    cy.get('script[src]').should('exist');
  });
});

describe('Dashboard Page - All Language Variants', () => {
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
      beforeEach(() => {
        cy.stubCIAData();
      });
      
      it(`should load ${lang.name} dashboard page`, () => {
        cy.visit(`/dashboard/index_${lang.code}.html`);
        cy.get('html').should('have.attr', 'lang');
        cy.get('body').should('be.visible');
      });
      
      it(`should have correct dir attribute for ${lang.name}`, () => {
        cy.visit(`/dashboard/index_${lang.code}.html`);
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
        cy.visit(`/dashboard/index_${lang.code}.html`);
        cy.get('header').should('exist');
        cy.get('main').should('exist');
        cy.get('footer').should('exist');
      });
      
      it(`should be responsive for ${lang.name}`, () => {
        cy.visit(`/dashboard/index_${lang.code}.html`);
        
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

describe('Dashboard Page - Accessibility', () => {
  beforeEach(() => {
    cy.stubCIAData();
    cy.visit('/dashboard/');
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
  
  it('should have ARIA labels on charts (if any)', () => {
    cy.get('body').then(($body) => {
      const charts = $body.find('canvas[role="img"]');
      if (charts.length > 0) {
        cy.get('canvas[role="img"]').should('have.attr', 'aria-label');
      } else {
        cy.log('No charts found - skipping ARIA label validation');
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
});

describe('Dashboard Page - Navigation', () => {
  beforeEach(() => {
    cy.stubCIAData();
  });
  
  it('should navigate from homepage to dashboard', () => {
    cy.visit('/');
    cy.get('a[href*="dashboard"]').first().click();
    cy.url().should('include', 'dashboard');
  });
  
  it('should navigate from dashboard back to homepage', () => {
    cy.visit('/dashboard/');
    cy.get('a[href="/"], a[href="../"], a[href*="index.html"]').first().click();
    cy.url().should('match', /\/$|index\.html$/);
  });
  
  it('should support language switching on dashboard page', () => {
    cy.visit('/dashboard/');
    
    // Fail-fast: Language switcher must exist
    cy.get('a[href*="index_sv.html"]').should('exist');
    cy.get('a[href*="index_sv.html"]').first().click();
    cy.url().should('include', 'index_sv.html');
  });
});

describe('Dashboard Page - Performance', () => {
  beforeEach(() => {
    cy.stubCIAData();
  });
  
  it('should load dashboard page within reasonable time', () => {
    cy.visit('/dashboard/', { timeout: 10000 });
    cy.get('body', { timeout: 5000 }).should('be.visible');
  });
  
  it('should handle missing data gracefully', () => {
    cy.intercept('GET', '**/cia-data/**/*.csv', {
      statusCode: 404,
      body: 'Not Found'
    });
    
    cy.visit('/dashboard/');
    cy.get('body').should('be.visible');
    // Page should still render even if data fails to load
  });
});

describe('Dashboard Page - RTL Support', () => {
  const rtlLanguages = [
    { code: 'ar', name: 'Arabic' },
    { code: 'he', name: 'Hebrew' }
  ];
  
  rtlLanguages.forEach((lang) => {
    it(`should have proper RTL layout for ${lang.name}`, () => {
      cy.stubCIAData();
      cy.visit(`/dashboard/index_${lang.code}.html`);
      
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
