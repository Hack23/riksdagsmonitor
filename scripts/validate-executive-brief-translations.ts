#!/usr/bin/env node
/**
 * @module scripts/validate-executive-brief-translations
 * @description CLI shim — see `scripts/validators/executive-brief-translations/`
 *              for the per-rule modules. Preserves the `npx tsx
 *              scripts/validate-executive-brief-translations.ts` entry
 *              point referenced by workflows and `package.json`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runCli } from './validators/executive-brief-translations/cli.js';

export * from './validators/executive-brief-translations/index.js';

/* istanbul ignore next */
if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? '')) {
  runCli(process.argv.slice(2));
}
