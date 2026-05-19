#!/usr/bin/env -S npx tsx
/**
 * @module Infrastructure/ArticleMetadataRewriter
 * @description Thin compatibility shim. The implementation has been split
 * into focused modules under `scripts/rewrite-article-metadata/`. This
 * file is kept so existing CLI invocations
 * (`npx tsx scripts/rewrite-article-metadata.ts`) keep working unchanged.
 *
 * Importing this module triggers `main()` (matching pre-refactor behavior).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import './rewrite-article-metadata/cli.js';
