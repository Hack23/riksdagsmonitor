/**
 * Vitest Configuration for Riksdagsmonitor
 * 
 * Unit and integration testing for JavaScript dashboard modules
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment - happy-dom provides lightweight DOM implementation
    environment: 'happy-dom',
    
    // Global test configuration
    globals: true,
    
    // Setup files to run before tests
    setupFiles: ['./tests/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      
      // Disabled: tests don't import dashboard modules (by design)
      all: false,
      
      // Coverage thresholds
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
      
      // Include patterns
      include: [
        'js/**/*.js',
        'scripts/**/*.js',
        'dashboard/**/*.js'
      ],
      
      // Exclude patterns
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'tests/**',
        '*.config.js',
        // Vendored third-party libraries (no point testing)
        'js/lib/**',
        // Browser-only IIFE scripts (tested via DOM structural tests, not importable)
        'js/anomaly-detection-dashboard.js',
        'js/election-cycle-dashboard.js',
        'js/ministry-dashboard.js',
        'js/party-dashboard.js',
        'js/politician-dashboard.js',
        'js/pre-election-dashboard.js',
        'js/seasonal-patterns-dashboard.js',
        'js/stats-loader.js',
        // Browser-only scripts loaded via <script> in HTML
        'scripts/coalition-dashboard.js',
        'scripts/committees-dashboard.js',
        'scripts/back-to-top.js',
        // CLI-only scripts not importable in test environment
        'scripts/sync-cia-schemas.js',
        'scripts/check-cia-schema-updates.js',
        'scripts/generate-types-from-cia-schemas.js',
        'scripts/generate-news-backport.js',
        'scripts/load-cia-stats.js',
        'scripts/update-stats-from-cia.js',
        'scripts/validate-against-cia-schemas.js',
        // CLI validation script (not importable, uses process.exit)
        'scripts/validate-translations.js',
        // Dashboard modules (tested via structural DOM tests)
        'dashboard/cia-visualizations.js',
        'dashboard/dashboard-init.js',
        'dashboard/election-predictions.js'
      ]
    },
    
    // Test file patterns
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'cypress/**'
    ],
    
    // Test timeout (10 seconds)
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Watch mode settings
    watch: false,
    
    // Pool options for parallel execution (Vitest 4+)
    pool: 'threads',
    singleThread: true, // Single thread to reduce memory pressure
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  }
});
