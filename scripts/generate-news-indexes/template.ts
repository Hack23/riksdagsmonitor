/**
 * @module generate-news-indexes/template
 * @description Backward-compatible re-export shim. The HTML template for
 * news-index pages has been split into focused modules under `./template/`:
 *
 * - `template/constants.ts`         — `BASE_URL`, `appVersionMarker`
 * - `template/i18n.ts`              — localised label bundles + helpers
 * - `template/schema-ld.ts`         — JSON-LD structured-data builders
 * - `template/hero.ts`              — page-heading HTML
 * - `template/filters.ts`           — filter-bar HTML
 * - `template/article-grid.ts`      — article-grid skeleton + empty states
 * - `template/seo-fallback.ts`      — crawler-visible `<details>` archive
 * - `template/page-sections.ts`     — AI-newsroom + FAQ section HTML
 * - `template/client-script-*.ts`   — inline `<script>` (prelude + runtime)
 * - `template/language-notice.ts`   — "available in English/Swedish" notice
 * - `template/rtl.ts`               — standalone + chrome-style RTL overrides
 * - `template/hreflang.ts`          — legacy hreflang block (test-only)
 * - `template/index.ts`             — top-level `generateIndexHTML`
 *
 * Tests and downstream consumers import `generateIndexHTML`,
 * `generateHreflangTags`, `generateRTLStyles`, and `generateLanguageNotice`
 * from this module — keep those named exports stable.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { generateIndexHTML } from './template/index.js';
export { generateHreflangTags } from './template/hreflang.js';
export { generateRTLStyles } from './template/rtl.js';
export { generateLanguageNotice } from './template/language-notice.js';
