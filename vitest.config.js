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
        'scripts/sync-cia-schemas.js',
        'scripts/check-cia-schema-updates.js',
        'scripts/generate-types-from-cia-schemas.js',
        'scripts/add-dashboard-to-all-languages.js'
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
    
    // Pool options for parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  }
});
