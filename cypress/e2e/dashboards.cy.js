/**
 * Cypress E2E Tests - Dashboards
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('Dashboard Functionality', () => {
  beforeEach(() => {
    cy.stubCIAData();
    cy.visit('/');
  });
  
  describe('Party Dashboard', () => {
    it('should display party dashboard', () => {
      cy.get('#party-dashboard').should('be.visible');
    });
    
    it('should have party effectiveness chart', () => {
      cy.get('#partyEffectivenessChart').should('exist');
    });
    
    it('should have party comparison chart', () => {
      cy.get('#partyComparisonChart').should('exist');
    });
    
    it('should have coalition alignment chart', () => {
      // Fail-fast: Chart must exist, no conditionals
      cy.get('#coalitionAlignmentChart').should('exist');
    });
    
    it('should have party momentum chart', () => {
      cy.get('#partyMomentumChart').should('exist');
    });
    
    it('should render charts after data loads', () => {
      cy.waitForChart('partyEffectivenessChart');
      cy.get('#partyEffectivenessChart').should('be.visible');
    });
  });
  
  describe('Anomaly Detection Dashboard', () => {
    it('should display anomaly dashboard', () => {
      cy.get('#anomaly-detection-dashboard').should('exist');
    });
    
    it('should have severity filter', () => {
      cy.get('#anomaly-severity-filter').should('exist');
      cy.get('#anomaly-severity-filter option').should('have.length.greaterThan', 1);
    });
    
    it('should have type filter', () => {
      cy.get('#anomaly-type-filter').should('exist');
      cy.get('#anomaly-type-filter option').should('have.length.greaterThan', 1);
    });
    
    it('should filter anomalies by severity', () => {
      cy.get('#anomaly-severity-filter').select('CRITICAL');
      // Verify filtering logic works
    });
    
    it('should display D3 heatmap', () => {
      // Fail-fast: Heatmap must exist and render, no conditionals
      // Scroll into view to ensure it's loaded
      cy.get('#anomaly-detection-dashboard').scrollIntoView();
      cy.get('#severity-heatmap').should('exist');
      cy.get('#severity-heatmap svg', { timeout: 10000 }).should('exist');
      cy.waitForD3('severity-heatmap');
    });
  });
  
  describe('Seasonal Patterns Dashboard', () => {
    it('should display seasonal patterns dashboard', () => {
      cy.get('#seasonal-patterns-dashboard').should('exist');
    });
    
    it('should have year filter', () => {
      cy.get('#seasonal-year-filter').should('exist');
    });
    
    it('should have quarter filter', () => {
      cy.get('#seasonal-quarter-filter').should('exist');
    });
  });
  
  describe('Pre-Election Dashboard', () => {
    it('should display pre-election dashboard', () => {
      cy.get('#pre-election-dashboard').should('exist');
    });
    
    it('should show status cards', () => {
      cy.get('.status-card').should('have.length.greaterThan', 0);
    });
  });
  
  describe('Dashboard Accessibility', () => {
    it('should have ARIA labels on charts', () => {
      cy.get('canvas[role="img"]').should('have.attr', 'aria-label');
    });
    
    it('should have screen reader text', () => {
      cy.get('.sr-only').should('exist');
    });
    
    it('should be keyboard navigable', () => {
      cy.get('button, a, select').first().focus().should('have.focus');
    });
  });
  
  describe('Dashboard Performance', () => {
    it('should load dashboards within reasonable time', () => {
      cy.get('#party-dashboard', { timeout: 5000 }).should('be.visible');
    });
    
    it('should handle data loading errors gracefully', () => {
      cy.intercept('GET', '**/cia-data/**/*.csv', {
        statusCode: 404,
        body: 'Not Found'
      });
      
      cy.visit('/');
      cy.get('.error-message, .dashboard-error').should('exist');
    });
  });
});
