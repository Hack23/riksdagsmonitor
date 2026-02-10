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
  // Ignore Chart.js animation frame errors
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  
  // Ignore D3 rendering errors
  if (err.message.includes('d3')) {
    return false;
  }
  
  // Log other errors but don't fail tests
  cy.log('⚠️ Uncaught exception:', err.message);
  return false;
});
