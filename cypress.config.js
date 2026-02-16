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
    
    // Screenshots and videos (optimized for performance)
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: false, // Disable by default, enable via CLI flag for debugging
    videoCompression: 32,
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts (optimized for faster feedback)
    defaultCommandTimeout: 5000, // Reduced from 10s to 5s
    pageLoadTimeout: 20000, // Reduced from 30s to 20s
    requestTimeout: 5000, // Reduced from 10s to 5s
    responseTimeout: 20000, // Reduced from 30s to 20s
    
    // Retry configuration (FAIL-FAST: No retries in CI)
    retries: {
      runMode: 0, // Changed from 2 to 0 for fail-fast
      openMode: 0
    },
    
    // Watch for file changes
    watchForFileChanges: true,
    
    // Browser configuration
    chromeWebSecurity: true,
    
    // Test isolation (keep enabled for reliability)
    testIsolation: true,
    
    // Experimental features for performance
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 10, // Reduced from default 50
    
    setupNodeEvents(on, config) {
      // Fail-fast: Exit on first failure in spec
      on('after:spec', (spec, results) => {
        if (results && results.stats.failures > 0) {
          console.log('❌ Test failures detected - failing fast');
          // Note: Individual spec will fail, runner continues to next spec
          // Use --bail flag in CLI to stop entire run
        }
      });
      
      return config;
    }
  },
  
  // Environment variables
  env: {
    coverage: false
  }
});
