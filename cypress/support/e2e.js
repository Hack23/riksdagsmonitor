/**
 * Cypress E2E Support File
 * 
 * Global commands and configuration for E2E tests
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

// Import Cypress commands
import './commands';

// Import cypress-axe for automated accessibility testing (WCAG 2.1 AA)
import 'cypress-axe';

// Hide fetch/XHR requests in command log (cleaner output)
const app = window.top;

if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global before hook
before(() => {
  cy.log('🚀 Starting Riksdagsmonitor E2E Tests');
});

// Global after hook
after(() => {
  cy.log('✅ E2E Tests Complete');
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore ResizeObserver-related animation frame errors from charts
  if (err && typeof err.message === 'string' && err.message.includes('ResizeObserver')) {
    return false;
  }

  // Ignore known benign D3 rendering errors
  if (err && typeof err.message === 'string' && err.message.includes('d3')) {
    return false;
  }

  // For all other errors, allow Cypress to fail the test
  // Log to the browser console instead of using cy.log (not supported here)
  // eslint-disable-next-line no-console
  console.error('Uncaught exception in Cypress test:', err);
  
  // Return true to fail the test for real errors
  return true;
});
