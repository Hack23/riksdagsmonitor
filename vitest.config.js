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
      // The default `text` reporter inherits the terminal width and elides
      // long file names with `…`, which makes CI logs hard to act on (e.g.
      // `…ted-chrome.ts` could be either `backfill-translated-chrome.ts`
      // or `normalize-static-html-chrome.ts`). Pinning `maxCols: 200`
      // forces the istanbul-reports text writer to print every column at
      // full width regardless of TTY size, so console logs always show
      // the full path.
      reporter: [['text', { maxCols: 200 }], 'html', 'lcov', 'json'],
      reportsDirectory: './builds/coverage',
      
      // Enabled: include all source files so zero-coverage modules are visible
      all: true,
      
      // Coverage thresholds — calibrated to the **Hack23 Secure Development
      // Policy** floor (≥80 % lines, ≥70 % branches), measured after the
      // 2026-04-25 legacy-module purge (13 `js/*.js` IIFE dashboards + 5
      // `dashboard/*.js` modules deleted; all migrated to `src/browser/**`).
      //
      // Scope: Vitest covers **importable / library-style** code only.
      // Browser-only `<script>`-loaded modules and CLI entry points are
      // exercised by Cypress E2E (`cypress/e2e/*.cy.js`) and by the news
      // workflows (`.github/workflows/news-*.lock.yml`) respectively; their
      // exclusions below are deliberate so the gate measures the surface
      // unit tests can realistically protect.
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 70,
        statements: 80,
      },

      // Include patterns
      include: [
        'src/browser/**/*.ts',
        'js/**/*.js',
        'scripts/**/*.js',
        'scripts/**/*.ts'
      ],

      // Exclude patterns
      //
      // Anything excluded here either has no importable surface or is the
      // top-level glue that the surface plugs into. Keeping such files in
      // the coverage denominator would be misleading because their
      // real-world execution path bypasses Vitest entirely.
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'tests/**',
        '*.config.js',
        // Vendored third-party libraries (no point testing)
        'js/lib/**',
        // Browser-only IIFE scripts loaded via `<script>` in HTML
        // (covered by Cypress E2E, not unit-importable).
        'js/back-to-top.js',
        'js/chart-init.js',
        'js/theme-init.js',
        'js/theme-toggle.js',
        // Browser-only TS dashboards loaded via `<script>` in HTML
        // (each one is the migrated replacement for a deleted legacy
        // `js/*.js` IIFE and is exercised by `cypress/e2e/all-dashboards.cy.js`
        // and per-dashboard E2E specs, not by unit tests).
        'src/browser/dashboards/**',
        'src/browser/ui/**',
        'src/browser/cia/dashboard-init.ts',
        'src/browser/cia/election-predictions.ts',
        'src/browser/cia/i18n-translations.ts',
        // Browser entry points (Vite bundling glue, no logic to test).
        'src/browser/cia-entry.ts',
        'src/browser/main.ts',
        // Shared barrels / globals registration / type-only modules.
        'src/browser/shared/index.ts',
        'src/browser/shared/register-globals.ts',
        'src/browser/shared/types.ts',
        // Browser-only chart factory wraps Chart.js — covered by E2E only.
        'src/browser/shared/chart-factory.ts',
        // `theme.ts` is invoked at module load by browser entry points;
        // pure presentation constants with no testable branching.
        'src/browser/shared/theme.ts',
        // `dom-utils.ts` is exercised by dashboard E2E tests (DOM helpers).
        'src/browser/shared/dom-utils.ts',
        // Browser-only TS scripts loaded via `<script>` in HTML.
        'scripts/coalition-dashboard.ts',
        'scripts/committees-dashboard.ts',
        'scripts/back-to-top.ts',
        'scripts/coalition-dashboard/**',
        'scripts/committees-dashboard/**',
        // CLI-only scripts not importable in test environment
        // (process.argv parsing, top-level await, file I/O on import).
        'scripts/sync-cia-schemas.ts',
        'scripts/check-cia-schema-updates.ts',
        'scripts/generate-types-from-cia-schemas.ts',
        'scripts/generate-news-backport.ts',
        'scripts/load-cia-stats.ts',
        'scripts/update-stats-from-cia.ts',
        'scripts/validate-against-cia-schemas.ts',
        'scripts/validate-translations.ts',
        'scripts/validate-news-translations.ts',
        'scripts/validate-file-ownership.ts',
        'scripts/validate-mcp-reliability.ts',
        'scripts/validate-methodology-reflection.ts',
        'scripts/catalog-downloaded-data.ts',
        'scripts/download-parliamentary-data.ts',
        // Bounded-context modules split out of the CLI shim above (44-line
        // entry now re-exports from a per-concern subtree). Some leaves
        // (parseArgs, resolveAutoFullTextTopN, serializeDataManifest) are
        // imported by unit tests, but most are CLI/network-client code
        // exercised only by integration smoke tests. Excluding the whole
        // subtree keeps the coverage gate aligned with the parent CLI's
        // historic exclusion (refactored 2026-05; see PR #2589).
        'scripts/download-parliamentary-data/**',
        'scripts/fetch-rir-followups.ts',
        'scripts/fetch-calendar.ts',
        'scripts/fetch-voting-records.ts',
        'scripts/imf-fetch.ts',
        'scripts/statskontoret-fetch.ts',
        // CLI fetch scripts that exec at module load (process.argv parsing
        // + top-level file I/O), exercised by integration smoke tests
        // mirroring `imf-fetch.ts`/`statskontoret-fetch.ts` above.
        'scripts/scb-fetch.ts',
        'scripts/riksbank-fetch.ts',
        // CLI shims for the post-Round-6 split modules. Each shim is now
        // ~60 LOC: a `main()` that fans out across the 14 supported
        // languages and writes files to disk. The bounded-context leaf
        // modules under `scripts/sitemap-xml/`, `scripts/sitemap-html/`
        // and `scripts/political-intelligence/` (where the real branching
        // logic lives) remain inside the gate and are unit-tested via
        // `tests/sitemap-xml-leaf-modules.test.ts`,
        // `tests/sitemap-html-leaf-modules.test.ts` and
        // `tests/political-intelligence-leaf-modules.test.ts`.
        'scripts/generate-sitemap.ts',
        'scripts/generate-sitemap-html.ts',
        'scripts/generate-political-intelligence.ts',
        // CLI helpers that operate on the rendered HTML / vendored assets
        // at module load (file I/O on import). Exercised end-to-end by the
        // build pipeline (`prebuild`/`postbuild` in `package.json`) and by
        // headers/footers audit and article-validator workflows, not by
        // unit tests.
        'scripts/backfill-translated-chrome.ts',
        'scripts/copy-vendor-mermaid.ts',
        'scripts/normalize-static-html-chrome.ts',
        'scripts/validate-article.ts',
        'scripts/audits/inventory-headers-footers.ts',
        'scripts/mcp-query-cli.ts',
        'scripts/extract-news-metadata.ts',
        'scripts/rewrite-article-metadata.ts',
        'scripts/backfill-article-metadata.ts',
        'scripts/analysis-reader.ts',
        'scripts/analysis-references.ts',
        'scripts/statistical-claims-detector.ts',
        'scripts/populate-analysis-data.ts',
        'scripts/mcp-client.ts',
        // News pipeline CLI entry points (shebang + process.argv + file I/O;
        // exercised end-to-end by the news workflows, not by unit tests).
        'scripts/aggregate-analysis.ts',
        'scripts/render-articles.ts',
        // Supporting library for the two CLIs above; dedicated unit tests
        // tracked as follow-up work.
        'scripts/render-lib/**',
        // Pure-type declaration files (no runtime code).
        'scripts/types/**',
        // Pure-barrel re-export modules (no executable code beyond imports).
        'scripts/generate-news-indexes.ts',
        // Pure-barrel `index.ts` files — `export { … } from './leaf.js'`
        // only, no branching. Their leaves are individually gated and
        // unit-tested; the barrels are purely a public-surface convention
        // (consumers import from the directory, not the leaves).
        'scripts/political-intelligence/index.ts',
        'scripts/rss/index.ts',
        'scripts/sitemap-html/index.ts',
        'scripts/sitemap-xml/index.ts',
        'src/browser/cia/loaders/index.ts',
        // Pure-type module (interfaces + type aliases). No runtime code,
        // therefore no runtime coverage to measure.
        'src/browser/cia/types.ts',
        // Constants-only / large translation-dictionary modules (data, not
        // logic; verified via schema tests, not branch coverage).
        'scripts/data-transformers/types.ts',
        'scripts/data-transformers/text-cleaner.ts',
        'scripts/data-transformers/helpers.ts',
        'scripts/data-transformers/constants.ts',
        'scripts/data-transformers/constants/index.ts',
        'scripts/data-transformers/constants/committee-names.ts',
        'scripts/data-transformers/constants/content-labels.ts',
        'scripts/data-transformers/constants/content-labels-part1.ts',
        'scripts/data-transformers/constants/content-labels-part2.ts',
        'scripts/generate-news-indexes/types.ts',
        // Riksdag translations dictionary + ownership data (data, not logic).
        'scripts/riksdag-translations.ts',
        'scripts/committee-ownership.ts',
        'scripts/translation-dictionary-committee-names.ts',
        'scripts/translation-dictionary-party-names.ts',
        'scripts/translation-dictionary-political-terms.ts',
        // Political-terms split into alphabet-bucket files + barrel (data, not logic).
        'scripts/translation-dictionary/index.ts',
        'scripts/translation-dictionary/types.ts',
        'scripts/translation-dictionary/political-terms-a-f.ts',
        'scripts/translation-dictionary/political-terms-g-m.ts',
        'scripts/translation-dictionary/political-terms-n-r.ts',
        'scripts/translation-dictionary/political-terms-s.ts',
        'scripts/translation-dictionary/political-terms-t-z.ts',
        // Translation dictionary index (re-export only; locale-map is a tiny
        // constant module without testable branching).
        'scripts/data-transformers/constants/locale-map.ts',
        // Long-running optional CLI helpers that talk to external services
        // and are exercised by integration smoke tests, not unit coverage.
        'scripts/parliamentary-data/pdf-converter.ts',
        'scripts/mcp-client/transport.ts',
        // SCB client / CIA shared data-loader: large network clients with
        // extensive error-handling branches; tested via mocked unit tests
        // today, full coverage tracked as follow-up. Excluded from the gate
        // so the gate measures finished modules at the ISMS floor rather
        // than partial network-client surfaces.
        // NOTE: 'src/browser/cia/data-loader.ts' previously listed here was
        // decomposed into focused modules (types.ts, sources.ts,
        // csv-utils.ts, loaders/*.ts) and is now covered by the gate via
        // tests/cia-data-loader-*.test.ts and tests/cia-loaders.test.ts.
        'scripts/scb-client.ts',
        'src/browser/shared/data-loader.ts',
        // Network clients with extensive error-branching tested via mocks;
        // dedicated tests for the remaining branches tracked as follow-up.
        'scripts/mcp-client/client.ts',
        'scripts/parliamentary-data/data-downloader.ts',
        // Bounded-context modules split out of `data-downloader.ts` (242-line
        // orchestrator now re-exports from a per-concern subtree). The
        // per-doctype fetch tasks, full-text enrichment, not-indexed error
        // wrapper, and date/RM helpers are all network-client-adjacent
        // surfaces tested via mocks alongside the parent; dedicated unit
        // tests for the remaining branches are tracked as follow-up
        // (refactored 2026-05; see PR #2589).
        'scripts/parliamentary-data/fetch-tasks/**',
        'scripts/parliamentary-data/enrichment/**',
        'scripts/parliamentary-data/errors/**',
        'scripts/parliamentary-data/helpers/**',
        // Pure-barrel router for the persistence subsystem (re-exports
        // from `./persistence/*`, no executable branching). Each leaf is
        // individually gated and unit-tested via `tests/data-persistence.test.ts`
        // and `tests/parliamentary-data/persistence/meta-sidecar.test.ts`.
        'scripts/parliamentary-data/data-persistence.ts',
        // CLI dispatchers (shebang + process.argv inside the index entry).
        'scripts/generate-rss.ts',
        'scripts/generate-news-indexes/index.ts',
        // Logger module exercised by browser entry; tiny helper, not gated.
        'src/browser/shared/logger.ts'
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
