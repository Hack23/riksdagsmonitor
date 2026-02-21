import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
        ChartUtils: 'readonly',
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
    // TypeScript file configuration
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': 'off', // TypeScript compiler handles this via noUnusedLocals
      'no-undef': 'off', // TypeScript compiler handles this
      'no-redeclare': 'off', // TypeScript handles this
      'no-console': 'off',
    },
  },
  {
    // Test-specific configuration
    files: ['tests/**/*.test.js', 'tests/**/*.test.ts', '**/*.test.js', '**/*.test.ts'],
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
      'builds/**',
      '*.min.js',
      'js/lib/**', // Ignore vendored libraries
      'dashboard/lib/**',
      'api/scripts/**', // Ignore generated JSDoc prettify scripts
      'docs/api/scripts/**', // Ignore generated JSDoc prettify scripts
    ],
  },
];
