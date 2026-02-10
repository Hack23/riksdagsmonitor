/**
 * Cypress Custom Commands
 * 
 * Reusable commands for E2E testing
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Wait for dashboard to load
 */
Cypress.Commands.add('waitForDashboard', (dashboardId) => {
  cy.get(`#${dashboardId}`).should('be.visible');
  cy.get(`#${dashboardId} canvas, #${dashboardId} svg`).should('exist');
});

/**
 * Check accessibility
 */
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('[role]').should('have.attr', 'role');
  cy.get('img').should('have.attr', 'alt');
  cy.get('canvas[role="img"]').should('have.attr', 'aria-label');
});

/**
 * Test responsive design at different viewports
 */
Cypress.Commands.add('testResponsive', (selector) => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 720, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' }
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    cy.get(selector).should('be.visible');
  });
});

/**
 * Wait for Chart.js to render
 */
Cypress.Commands.add('waitForChart', (canvasId) => {
  cy.get(`#${canvasId}`).should('be.visible');
  cy.wait(500); // Wait for animation
});

/**
 * Wait for D3 visualization to render
 */
Cypress.Commands.add('waitForD3', (containerId) => {
  cy.get(`#${containerId} svg`).should('exist');
  cy.wait(500); // Wait for rendering
});

/**
 * Intercept and stub API calls
 */
Cypress.Commands.add('stubCIAData', () => {
  cy.intercept('GET', '**/cia-data/**/*.csv', {
    statusCode: 200,
    body: 'Year,Quarter,Ballot\n2024,Q1,1000\n2024,Q2,1100'
  }).as('ciaData');
  
  cy.intercept('GET', '**/raw.githubusercontent.com/**', {
    statusCode: 200,
    body: 'Year,Quarter,Ballot\n2024,Q1,1000\n2024,Q2,1100'
  }).as('githubData');
});

/**
 * Test language switcher
 */
Cypress.Commands.add('switchLanguage', (langCode) => {
  cy.get(`a[href*="index_${langCode}.html"]`).click();
  cy.url().should('include', `index_${langCode}.html`);
});

/**
 * Check for console errors
 */
Cypress.Commands.add('checkConsoleErrors', () => {
  cy.window().then((win) => {
    cy.spy(win.console, 'error');
  });
});

/**
 * Test back-to-top button
 */
Cypress.Commands.add('testBackToTop', () => {
  cy.scrollTo('bottom');
  cy.wait(500);
  cy.get('.back-to-top').should('be.visible');
  cy.get('.back-to-top').click();
  cy.window().its('scrollY').should('equal', 0);
});
