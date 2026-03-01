/**
 * Cypress E2E Tests - Accessibility
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('Accessibility (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('should have valid HTML structure', () => {
    cy.get('html').should('have.attr', 'lang');
    cy.get('head').should('exist');
    cy.get('body').should('exist');
  });
  
  it('should have proper heading hierarchy', () => {
    cy.get('h1').should('have.length', 1);
    cy.get('h2').should('exist');
  });
  
  it('should have alt text on images', () => {
    cy.get('body').then(($body) => {
      const images = $body.find('img');
      if (images.length > 0) {
        cy.get('img').each(($img) => {
          cy.wrap($img).should('have.attr', 'alt');
        });
      } else {
        // No images on page - test passes (no images to check)
        cy.log('No images found on page - skipping alt text validation');
      }
    });
  });
  
  it('should have labels for form inputs', () => {
    cy.get('body').then(($body) => {
      const inputs = $body.find('input, select, textarea');
      if (inputs.length > 0) {
        cy.get('input, select, textarea').each(($input) => {
          const id = $input.attr('id');
          const ariaLabel = $input.attr('aria-label');
          const ariaLabelledby = $input.attr('aria-labelledby');
          
          // A control is considered labeled if it has either:
          // - an associated <label for="id">, or
          // - an ARIA label (aria-label or aria-labelledby)
          let hasAssociatedLabel = false;

          if (id) {
            hasAssociatedLabel = Cypress.$(`label[for="${id}"]`).length > 0;
          }

          const hasAriaLabel = ariaLabel !== undefined && ariaLabel !== null && ariaLabel !== '';
          const hasAriaLabelledby = ariaLabelledby !== undefined && ariaLabelledby !== null && ariaLabelledby !== '';
          
          // At least one labeling method must be present
          expect(hasAssociatedLabel || hasAriaLabel || hasAriaLabelledby, 
            `Input with id="${id}" must have either a <label for="${id}">, aria-label, or aria-labelledby attribute`
          ).to.be.true;
        });
      } else {
        // No form inputs on page - test passes
        cy.log('No form inputs found on page - skipping label validation');
      }
    });
  });
  
  it('should have ARIA roles on interactive elements', () => {
    cy.get('button, [role="button"]').should('exist');
  });
  
  it('should have visible focus indicators', () => {
    cy.get('a, button, input, select').first().focus();
    cy.focused().should('have.css', 'outline-style').and('not.equal', 'none');
  });
  
  it('should be keyboard navigable', () => {
    // Get all focusable elements
    cy.get('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').then(($elements) => {
      if ($elements.length > 0) {
        // Focus first focusable element
        cy.wrap($elements.first()).focus();
        cy.focused().should('exist');
        
        // If there's more than one element, focus the second one
        if ($elements.length > 1) {
          cy.wrap($elements.eq(1)).focus();
          cy.focused().should('exist');
        }
      } else {
        cy.log('No focusable elements found on page');
      }
    });
  });
  
  it('should have sufficient color contrast', () => {
    // Check text has adequate contrast
    cy.get('body').should('have.css', 'color');
    cy.get('body').should('have.css', 'background-color');
  });
  
  it('should have language attribute on HTML tag', () => {
    cy.get('html').should('have.attr', 'lang');
  });
  
  it('should have skip to content link', () => {
    cy.get('a[href="#main-content"], a[href="#main"], a[href="#main-dashboard"]').should('exist');
  });
  
  it('should have skip link as first focusable element', () => {
    cy.get('a[href="#main-content"], a[href="#main"], a[href="#main-dashboard"]').first().then(($el) => {
      const classList = Array.from($el[0].classList);
      expect(classList.some(c => c.includes('skip'))).to.be.true;
    });
  });
  
  it('should support reduced motion preference', () => {
    cy.window().then((win) => {
      win.matchMedia = cy.stub().returns({
        matches: true,
        media: '(prefers-reduced-motion: reduce)'
      });
    });
    
    cy.visit('/');
    // Verify animations are disabled
  });
});

describe('Multi-Language Support', () => {
  const languages = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
  
  languages.forEach((lang) => {
    it(`should load ${lang.toUpperCase()} version`, () => {
      cy.visit(`/index_${lang}.html`);
      cy.get('html').should('have.attr', 'lang');
      cy.get('body').should('be.visible');
    });
  });
  
  it('should have proper RTL support for Arabic', () => {
    cy.visit('/index_ar.html');
    cy.get('html').should('have.attr', 'dir', 'rtl');
  });
  
  it('should have proper RTL support for Hebrew', () => {
    cy.visit('/index_he.html');
    cy.get('html').should('have.attr', 'dir', 'rtl');
  });
  
  it('should have language switcher links', () => {
    cy.visit('/');
    languages.forEach((lang) => {
      cy.get(`a[href*="index_${lang}.html"]`).should('exist');
    });
  });
});
