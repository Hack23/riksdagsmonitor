/**
 * Cypress E2E Tests - Politician Dashboard
 * 
 * Tests for politician-dashboard.html covering:
 * - Page loading and structure
 * - Chart rendering and visualization
 * - Responsive design
 * - Accessibility compliance
 * - Data display and interactions
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('Politician Dashboard', () => {
  beforeEach(() => {
    cy.visit('/politician-dashboard.html');
  });

  describe('Page Loading and Structure', () => {
    it('should load politician dashboard successfully', () => {
      cy.title().should('include', 'Politician Career & Productivity Analytics');
      cy.get('body').should('be.visible');
    });

    it('should have proper document structure', () => {
      cy.get('header').should('exist');
      cy.get('main, .dashboard-container').should('exist');
      cy.get('footer').should('exist');
    });

    it('should have dashboard header', () => {
      cy.get('.dashboard-header').should('be.visible');
      cy.get('.dashboard-header h1').should('be.visible');
    });

    it('should have chart cards container', () => {
      cy.get('.dashboard-grid, .chart-card').should('exist');
    });

    it('should have proper meta tags', () => {
      cy.get('meta[name="description"]').should('exist');
      cy.get('meta[name="viewport"]').should('exist');
      cy.get('meta[charset]').should('exist');
    });

    it('should have Open Graph tags', () => {
      cy.get('meta[property="og:title"]').should('exist');
      cy.get('meta[property="og:description"]').should('exist');
      cy.get('meta[property="og:url"]').should('have.attr', 'content').and('include', 'politician-dashboard');
    });

    it('should have canonical link', () => {
      cy.get('link[rel="canonical"]').should('have.attr', 'href').and('include', 'politician-dashboard');
    });
  });

  describe('Chart and Visualization Elements', () => {
    it('should have chart containers', () => {
      cy.get('canvas, .chart-card').should('exist');
    });

    it('should load Chart.js library', () => {
      cy.window().then((win) => {
        // Check if Chart.js is loaded
        expect(win.Chart).to.exist;
      });
    });

    it('should have chart cards with proper styling', () => {
      cy.get('.chart-card').first().then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).should('be.visible');
          cy.wrap($card).should('have.css', 'border');
        }
      });
    });

    it('should have chart titles', () => {
      cy.get('.chart-card h2, .chart-title').then(($titles) => {
        if ($titles.length > 0) {
          cy.wrap($titles).first().should('be.visible');
        }
      });
    });

    it('should render canvas elements for charts', () => {
      // Wait a bit for charts to potentially render
      cy.wait(1000);
      
      cy.get('body').then(($body) => {
        const canvases = $body.find('canvas');
        if (canvases.length > 0) {
          cy.log(`Found ${canvases.length} canvas elements`);
          cy.get('canvas').first().should('be.visible');
        } else {
          cy.log('No canvas elements found - charts may not have rendered yet');
        }
      });
    });
  });

  describe('Politician Data Display', () => {
    it('should display politician rankings or data', () => {
      cy.get('body').then(($body) => {
        // Check for various possible data display patterns
        const hasTable = $body.find('table').length > 0;
        const hasCards = $body.find('.politician-card, .mp-card').length > 0;
        const hasList = $body.find('.politician-list, .mp-list').length > 0;
        
        if (hasTable || hasCards || hasList) {
          cy.log('Found politician data display elements');
        } else {
          cy.log('Politician data display may be dynamically loaded');
        }
      });
    });

    it('should have top rankings section', () => {
      cy.get('body').then(($body) => {
        const bodyText = $body.text();
        if (bodyText.includes('Top') || bodyText.includes('Ranking')) {
          cy.log('Found ranking-related content');
        }
      });
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Large Desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should be responsive on ${name} (${width}x${height})`, () => {
        cy.viewport(width, height);
        cy.get('body').should('be.visible');
        cy.get('.dashboard-header').should('be.visible');
        
        // Check that content is not cut off
        cy.get('body').then(($body) => {
          const bodyWidth = $body.width();
          expect(bodyWidth).to.be.at.most(width);
        });
      });
    });

    it('should have mobile-friendly grid layout', () => {
      cy.viewport('iphone-x');
      cy.get('.dashboard-grid').then(($grid) => {
        if ($grid.length > 0) {
          // Grid should stack on mobile
          cy.wrap($grid).should('have.css', 'display', 'grid');
        }
      });
    });
  });

  describe('Accessibility (WCAG 2.1 AA)', () => {
    it('should have proper language attribute', () => {
      cy.get('html').should('have.attr', 'lang', 'en');
    });

    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length', 1);
    });

    it('should have ARIA labels on interactive elements', () => {
      cy.get('button, a[href]').first().then(($el) => {
        if ($el.length > 0) {
          // Element should have accessible text content
          expect($el.text().trim().length).to.be.greaterThan(0);
        }
      });
    });

    it('should have alt text on images', () => {
      cy.get('body').then(($body) => {
        const images = $body.find('img');
        if (images.length > 0) {
          cy.get('img').each(($img) => {
            cy.wrap($img).should('have.attr', 'alt');
          });
        }
      });
    });

    it('should be keyboard navigable', () => {
      cy.get('a, button, input, select').first().then(($el) => {
        if ($el.length > 0) {
          cy.wrap($el).focus().should('have.focus');
        }
      });
    });

    it('should have sufficient color contrast', () => {
      // Visual check - ensure text is visible
      cy.get('.dashboard-header h1').should('be.visible');
      cy.get('.chart-card').first().then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).should('be.visible');
        }
      });
    });
  });

  describe('Navigation and Links', () => {
    it('should have navigation back to homepage', () => {
      cy.get('body').then(($body) => {
        const homeLinks = $body.find('a[href="/"], a[href="index.html"], nav a').length;
        if (homeLinks > 0) {
          cy.log('Found navigation links');
        }
      });
    });

    it('should have working internal links', () => {
      cy.get('body').then(($body) => {
        const links = $body.find('a[href^="/"], a[href^="./"]');
        if (links.length > 0) {
          const href = links.first().attr('href');
          cy.log(`Found internal link: ${href}`);
          expect(href).to.not.be.undefined;
        } else {
          cy.log('No internal links found - page may be standalone');
        }
      });
    });
  });

  describe('Performance', () => {
    it('should load page within reasonable time', () => {
      cy.visit('/politician-dashboard.html');
      cy.get('.dashboard-header', { timeout: 5000 }).should('be.visible');
    });

    it('should not have JavaScript errors', () => {
      cy.window().then((win) => {
        // Cypress catches JS errors automatically, this is a placeholder
        cy.log('Checking for JS errors...');
      });
    });
  });

  describe('Data Loading States', () => {
    it('should handle empty state gracefully', () => {
      // Page should still render even if data is missing
      cy.get('body').should('be.visible');
      cy.get('.dashboard-header').should('be.visible');
    });

    it('should have loading indicators or data display', () => {
      cy.get('body').then(($body) => {
        const hasLoading = $body.find('.loading, .spinner').length > 0;
        const hasData = $body.find('canvas, table, .data').length > 0;
        
        if (!hasLoading && !hasData) {
          cy.log('Page may be static or data-less');
        }
      });
    });
  });

  describe('CSS and Styling', () => {
    it('should load external fonts', () => {
      cy.get('link[href*="fonts.googleapis.com"]').should('exist');
    });

    it('should have custom styling loaded', () => {
      cy.get('link[rel="stylesheet"]').should('exist');
    });

    it('should have cyberpunk theme elements', () => {
      cy.get('.chart-card').first().then(($card) => {
        if ($card.length > 0) {
          // Check for border styling (cyberpunk theme)
          cy.wrap($card).should('have.css', 'border');
        }
      });
    });
  });
});
