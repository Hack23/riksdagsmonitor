import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // Third-party library globals (loaded via script tags)
        Chart: 'readonly',
        d3: 'readonly',
        Papa: 'readonly',
      },
    },
    rules: {
      // Override/add rules here
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-console': 'off', // Allow console in scripts
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },
  {
    // Test-specific configuration
    files: ['tests/**/*.test.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'cypress/**',
      '*.min.js',
      'js/lib/**', // Ignore vendored libraries
      'dashboard/lib/**',
    ],
  },
];
