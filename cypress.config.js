/**
 * Cypress E2E Testing Configuration for Riksdagsmonitor
 * 
 * End-to-end testing for dashboard functionality and user interactions
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Base URL for tests
    baseUrl: 'http://localhost:4173',
    
    // Spec pattern
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'cypress/support/e2e.js',
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    videoCompression: 32,
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Watch for file changes
    watchForFileChanges: true,
    
    // Browser configuration
    chromeWebSecurity: true,
    
    // Test isolation
    testIsolation: true,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    }
  },
  
  // Environment variables
  env: {
    coverage: false
  }
});
