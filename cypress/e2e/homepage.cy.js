/**
 * Cypress E2E Tests - Homepage
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('Riksdagsmonitor Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('should load homepage successfully', () => {
    cy.title().should('include', 'Riksdagsmonitor');
    cy.get('body').should('be.visible');
  });
  
  it('should have proper document structure', () => {
    cy.get('header').should('exist');
    cy.get('main').should('exist');
    cy.get('footer').should('exist');
  });
  
  it('should display site logo/title', () => {
    cy.get('h1').should('be.visible');
  });
  
  it('should have navigation menu', () => {
    cy.get('nav').should('be.visible');
    cy.get('nav a').should('have.length.greaterThan', 0);
  });
  
  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('body').should('be.visible');
    cy.get('header').should('be.visible');
  });
  
  it('should be responsive on tablet', () => {
    cy.viewport('ipad-2');
    cy.get('body').should('be.visible');
    cy.get('header').should('be.visible');
  });
  
  it('should be responsive on desktop', () => {
    cy.viewport(1920, 1080);
    cy.get('body').should('be.visible');
    cy.get('header').should('be.visible');
  });
  
  it('should have language switcher', () => {
    cy.get('a[href*="index_sv.html"], a[href*="index_da.html"]').should('exist');
  });
  
  it('should use system-ui font stack (no third-party font CDN)', () => {
    // As of May 2026, index*.html no longer loads Google Fonts — text
    // renders in each platform's native UI font (San Francisco /
    // Segoe UI / Roboto) for fastest paint and zero font-swap CLS.
    cy.get('link[href*="fonts.googleapis.com"]').should('not.exist');
    cy.get('link[href*="fonts.gstatic.com"]').should('not.exist');
  });
  
  it('should have proper meta tags', () => {
    cy.get('meta[name="description"]').should('exist');
    cy.get('meta[name="viewport"]').should('exist');
    cy.get('meta[charset]').should('exist');
  });
  
  it('should have Open Graph tags', () => {
    cy.get('meta[property="og:title"]').should('exist');
    cy.get('meta[property="og:description"]').should('exist');
  });
  
  it('should have Twitter Card tags', () => {
    cy.get('meta[name="twitter:card"]').should('exist');
    cy.get('meta[name="twitter:title"]').should('exist');
  });

  it('should expose the Service Worker API for PWA install + offline support', () => {
    // Verify the runtime supports service workers; the actual registration
    // is initiated from src/browser/main.ts on the `load` event.
    cy.window().its('navigator.serviceWorker').should('exist');
  });
});
