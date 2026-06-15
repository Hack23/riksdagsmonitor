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

      // Persist the coverage report even when one or more tests fail.
      // Vitest's default behaviour (`reportOnFailure: false`) calls
      // `cleanAfterRun()` on a failing run, which wipes `builds/coverage/`
      // entirely — that is the root cause of CI seeing "no coverage" and
      // the artifact upload failing with `if-no-files-found: error`.
      // See node_modules/vitest/dist/chunks/coverage.*.js:
      //   `if (!this.options.reportOnFailure) await this.cleanAfterRun();`
      reportOnFailure: true,

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
        // Bounded-context modules split out of the `validate-news-translations.ts`
        // CLI shim above (21-line entry now re-exports from a per-concern
        // subtree). Exercised end-to-end by `npm run validate-news` in
        // workflow `news-link-and-translations-validation.yml`, not by unit
        // tests. Mirrors the `scripts/download-parliamentary-data/**` and
        // `scripts/imf-fetch/**` precedents above (refactored 2026-05;
        // see PR #2593, Refactor 7/8).
        'scripts/validators/news-translations/**',
        // Refactor 7/8 (PR #2593) split shims: `scripts/validate-article.ts`
        // and `scripts/validate-executive-brief-translations.ts` are now
        // ≤ 26-line CLI shims re-exporting the per-rule subtree. The rule
        // leaves under `scripts/validators/article/rules/**` and
        // `scripts/validators/executive-brief-translations/{counters,extractors,rules,strippers,types,validate-translation-content}.ts`
        // remain inside the gate (unit-tested by `tests/validate-article.test.ts`,
        // `tests/validate-executive-brief-translations.test.ts`, and the new
        // `tests/validators-article-rules.test.ts`). The CLI / orchestrator /
        // walker / file-I/O files (process.argv parsing + fs walk on import,
        // exercised by `exec-brief-translation-checks.yml` and the per-type
        // news workflows) are excluded with the same rationale as the
        // `scripts/download-parliamentary-data/**` precedent above.
        'scripts/validate-executive-brief-translations.ts',
        'scripts/validators/article/cli.ts',
        'scripts/validators/article/index.ts',
        'scripts/validators/article/walker.ts',
        'scripts/validators/article/source-mermaid.ts',
        'scripts/validators/article/rules/required-artifacts.ts',
        'scripts/validators/executive-brief-translations/cli.ts',
        'scripts/validators/executive-brief-translations/index.ts',
        'scripts/validators/executive-brief-translations/render-report.ts',
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
        // Bounded-context CLI subcommands split out of the `imf-fetch.ts`
        // shim above (44-line entry now re-exports from a per-concern
        // subtree). Each subcommand is a thin argv-router → fetch → write
        // wrapper around the unit-tested `scripts/imf/**` library, exercised
        // end-to-end by the 14 `news-*.lock.yml` workflows via
        // `tsx scripts/imf-fetch.ts <subcommand> …`. Excluding the whole
        // subtree keeps the coverage gate aligned with the parent CLI's
        // historic exclusion (refactored 2026-05; mirrors the
        // `scripts/download-parliamentary-data/**` precedent above).
        'scripts/imf-fetch/**',
        // Pure-type module for the IMF client (interfaces + type aliases).
        // No runtime code, therefore no runtime coverage to measure.
        'scripts/imf/types.ts',
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
        // Bounded-context modules split out of the `normalize-static-html-chrome.ts`
        // CLI shim above (27-line entry now re-exports from a per-concern
        // subtree). File-I/O / CLI dispatch on import — exercised end-to-end
        // by the `prebuild`/`postbuild` pipeline, not by unit tests.
        // Mirrors the `scripts/download-parliamentary-data/**` and
        // `scripts/imf-fetch/**` precedents above (refactored 2026-05;
        // see PR #2595, Refactor 8/8).
        'scripts/normalize-static-html-chrome/**',
        'scripts/validate-article.ts',
        'scripts/audits/inventory-headers-footers.ts',
        'scripts/mcp-query-cli.ts',
        'scripts/extract-news-metadata.ts',
        'scripts/rewrite-article-metadata.ts',
        // Bounded-context modules split out of the `rewrite-article-metadata.ts`
        // CLI shim above (15-line entry now re-exports from a per-concern
        // subtree). HTML rewriting + file-I/O CLI exercised end-to-end by the
        // article-validator workflows, not by unit tests. Same precedent as
        // the `scripts/normalize-static-html-chrome/**` block above
        // (refactored 2026-05; see PR #2595, Refactor 8/8).
        'scripts/rewrite-article-metadata/**',
        'scripts/backfill-article-metadata.ts',
        'scripts/analysis-reader.ts',
        // Bounded-context modules split out of the `analysis-reader.ts`
        // CLI shim above (81-line entry now re-exports from a per-concern
        // subtree of types + helpers + parsers). The shim is excluded per
        // its scoped-deprecation comment ("Analysis in md files should not
        // ever be parsed") — the parsers exist only to support the legacy
        // `deriveArticleClassificationMeta()` path. Same precedent as
        // `scripts/download-parliamentary-data/**` (refactored 2026-05;
        // see PR #2595, Refactor 8/8).
        'scripts/analysis-reader/**',
        // CLI shim for the split roll-forward-pirs subtree below. The shim
        // entry (`#!/usr/bin/env tsx` + `process.argv` parsing + top-level
        // `isMainModule` dispatch) is exercised by the news workflows
        // (`tsx scripts/roll-forward-pirs.ts …`), not by unit tests. The
        // implementation under `scripts/roll-forward-pirs/**` remains
        // inside the gate (95%+ covered via `tests/pir-status-contract.test.ts`
        // and `tests/roll-forward-pirs.rollforward-md.test.ts`).
        'scripts/roll-forward-pirs.ts',
        'scripts/analysis-references.ts',
        'scripts/statistical-claims-detector.ts',
        'scripts/populate-analysis-data.ts',
        'scripts/mcp-client.ts',
        // News pipeline CLI entry points (shebang + process.argv + file I/O;
        // exercised end-to-end by the news workflows, not by unit tests).
        'scripts/aggregate-analysis.ts',
        'scripts/render-articles.ts',
        // QA audit CLI — shebang + top-level process.argv parsing + file I/O
        // on import; exercised by the "Test Article Headers" manual workflow,
        // not by unit tests. Same precedent as scripts/render-articles.ts.
        'scripts/test-article-headers.ts',
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
        'src/browser/shared/logger.ts',
        // Additional CLI scripts that exec at module load (file I/O,
        // process.argv parsing, or top-level await). Exercised end-to-end
        // by the prebuild/postbuild pipeline, the article-validator and
        // executive-brief-translation workflows, and the `mermaid-diagrams`
        // gate — not by unit tests. Same precedent as the existing CLI
        // exclusions above (refactored 2026-05).
        'scripts/build-csv-contracts-fixture.ts',
        'scripts/check-brief-narrative-drift.ts',
        'scripts/fix-hreflang.ts',
        'scripts/fix-mermaid-diagrams.ts',
        'scripts/minify-dist.ts',
        'scripts/strip-in-method-comments.ts',
        'scripts/strip-legacy-chrome-script-tags.ts',
        'scripts/validate-mermaid-diagrams.ts',
        // Pure-type `.d.ts` declarations for the two Vite plugins above
        // (no runtime code).
        'scripts/vite-plugin-static-pages.d.ts',
        'scripts/vite-plugin-sw-build-id.d.ts',
        // Pure re-export shims that preserve the public surface of the
        // bounded-context client subtrees (`scripts/imf/**`,
        // `scripts/statskontoret/**`). The subtrees themselves are
        // individually gated and ≥80% covered. Same precedent as
        // `scripts/parliamentary-data/data-persistence.ts` above.
        'scripts/imf-client.ts',
        'scripts/statskontoret-client.ts',
        // Mermaid corpus validator — supporting library for the two CLIs
        // (`scripts/validate-mermaid-diagrams.ts`, `scripts/fix-mermaid-diagrams.ts`)
        // and for the `gate-checks/mermaid-diagrams.ts` agentic gate-check.
        // Exercised end-to-end by the news workflows and by the
        // `Validate Mermaid Diagrams` job; dedicated unit tests tracked as
        // follow-up work. Same precedent as `scripts/render-lib/**` above.
        'scripts/validators/mermaid-diagrams/**',
        // Pure-barrel / legacy compatibility shims under
        // `scripts/generate-news-indexes/` — each entry is `export { … }
        // from './<subdir>/index.js'`, no executable branching. Their
        // leaves are individually gated and unit-tested. Mirrors the
        // existing `scripts/political-intelligence/index.ts` / `scripts/rss/index.ts`
        // / `scripts/sitemap-html/index.ts` / `scripts/sitemap-xml/index.ts`
        // entries above.
        'scripts/generate-news-indexes/constants.ts',
        'scripts/generate-news-indexes/helpers.ts',
        'scripts/generate-news-indexes/template.ts',
        'scripts/generate-news-indexes/constants/index.ts',
        'scripts/generate-news-indexes/helpers/index.ts',
        'scripts/generate-news-indexes/template/client-script-runtime.ts',
        // Pure-barrel agentic dispatch index — re-exports the gate-checks
        // catalog (which is itself the orchestrator imported by the
        // `news-*.lock.yml` workflows). No branching to gate.
        'scripts/agentic/index.ts',
        'scripts/agentic/gate-checks/index.ts',
        // Pure-type modules (interfaces + type aliases only — no runtime
        // code, therefore no runtime coverage to measure). Mirrors the
        // existing `scripts/imf/types.ts` / `scripts/types/**` /
        // `src/browser/cia/types.ts` exclusions above.
        'scripts/agentic/gate-shared/types.ts',
        'scripts/fetch-calendar/types.ts',
        'scripts/parliamentary-data/mcp-retry-queue/types.ts',
        'scripts/roll-forward-pirs/types.ts',
        'scripts/statskontoret/types.ts',
        // Pure re-export shim for the split `mcp-retry-queue/` subtree
        // (re-exports `./mcp-retry-queue/index.js`). Same precedent as
        // `scripts/parliamentary-data/data-persistence.ts` above.
        'scripts/parliamentary-data/mcp-retry-queue.ts'
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
    // Use the default 'forks' pool (child processes) instead of the
    // experimental 'vmThreads' pool (worker_threads + VM context).
    // 'vmThreads' is marked @experimental in Vitest 4.x and triggers
    // "Worker exited unexpectedly" crashes in CI when any worker thread
    // terminates abnormally (SIGABRT/OOM). Child-process forks are fully
    // isolated: a crash in one worker does not cascade to the parent or
    // other workers, and the OS reclaims memory cleanly between files.
    pool: 'forks',

    // Limit to one concurrent fork so coverage instrumentation and the
    // large import graph (scripts/**) do not compete for heap. This is the
    // forks-pool equivalent of the previous singleThread: true setting.
    maxWorkers: 1,

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  }
});
