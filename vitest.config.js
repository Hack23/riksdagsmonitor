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
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './builds/coverage',
      
      // Enabled: include all source files so zero-coverage modules are visible
      all: true,
      
      // Coverage thresholds — set to (current − 2 %) per the 2026-04-25
      // code-quality refresh. Measured baseline (npm run test:coverage):
      //   statements 24.89% · branches 24.01% · functions 22.13% · lines 25.61%
      // Thresholds catch regressions without forcing retroactive backfill of
      // already-uncovered legacy modules. Raise incrementally as tests are
      // added for `scripts/render-lib/**` and `src/browser/dashboards/**`.
      // Long-term target: lines:70, functions:70, branches:60, statements:70.
      thresholds: {
        lines: 23,
        functions: 20,
        branches: 22,
        statements: 22,
      },
      
      // Include patterns
      include: [
        'src/browser/**/*.ts',
        'js/**/*.js',
        'scripts/**/*.js',
        'scripts/**/*.ts',
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
        'scripts/coalition-dashboard.ts',
        'scripts/committees-dashboard.ts',
        'scripts/back-to-top.ts',
        // CLI-only scripts not importable in test environment
        'scripts/sync-cia-schemas.ts',
        'scripts/check-cia-schema-updates.ts',
        'scripts/generate-types-from-cia-schemas.ts',
        'scripts/generate-news-backport.ts',
        'scripts/load-cia-stats.ts',
        'scripts/update-stats-from-cia.ts',
        'scripts/validate-against-cia-schemas.ts',
        // CLI validation script (not importable, uses process.exit)
        'scripts/validate-translations.ts',
        // News pipeline CLI entry points (shebang + process.argv + file I/O;
        // exercised end-to-end by the news workflows, not by unit tests)
        'scripts/aggregate-analysis.ts',
        'scripts/render-articles.ts',
        // Supporting library for the two CLIs above. Dedicated unit tests are
        // tracked as follow-up work (see PR #1979 plan §4); excluded until
        // then to keep coverage gates stable during the pipeline transition.
        'scripts/render-lib/**',
        // Pure-type declaration files (no runtime code) introduced alongside
        // the new pipeline — contain only `interface` / `type` exports, so
        // v8 coverage instrumentation reports them as 0% despite having
        // nothing executable to cover.
        'scripts/types/**',
        // Dashboard modules (tested via structural DOM tests)
        'dashboard/cia-visualizations.js',
        'dashboard/dashboard-init.js',
        'dashboard/election-predictions.js'
      ]
    },
    
    // Test file patterns
    include: [
      'tests/**/*.test.js',
      'tests/**/*.test.ts',
      'tests/**/*.spec.js',
      'tests/**/*.spec.ts'
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
    // - verbose: console output during CI
    // - json: machine-readable results for downstream tooling
    // - html: interactive Vitest UI report (uses @vitest/ui) for release docs
    reporters: [
      'verbose',
      ['json', { outputFile: process.env.VITEST_JSON_OUTPUT || 'builds/test-results/vitest-results.json' }],
      ['html', { outputFile: 'builds/test-results/html/index.html' }]
    ],
    
    // Watch mode settings
    watch: false,
    
    // Pool options for parallel execution (Vitest 4+)
    // Use VM threads for better memory control
    pool: 'vmThreads',
    // Single VM thread to reduce memory pressure
    singleThread: true,
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  }
});
