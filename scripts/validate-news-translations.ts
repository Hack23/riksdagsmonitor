#!/usr/bin/env node
/**
 * @module scripts/validate-news-translations
 * @description CLI shim — see `scripts/validators/news-translations/`
 *              for the per-rule modules. Preserves the `npx tsx
 *              scripts/validate-news-translations.ts` entry point referenced
 *              by `package.json#validate-news` and the news translation
 *              quality workflow.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { validateNewsTranslations } from './validators/news-translations/index.js';

export * from './validators/news-translations/index.js';

/* istanbul ignore next */
const directory: string = process.argv[2] || 'news';
/* istanbul ignore next */
process.exit(validateNewsTranslations(directory));
