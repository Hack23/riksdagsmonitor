#!/usr/bin/env node
/**
 * @module scripts/validate-article
 * @description CLI shim — per-rule modules live in
 *              `scripts/validators/article/`. Preserves the
 *              `npx tsx scripts/validate-article.ts` entry point.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import process from 'node:process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli } from './validators/article/cli.js';

export * from './validators/article/index.js';

/* istanbul ignore next */
if (process.argv[1] !== undefined && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  runCli(process.argv.slice(2)).catch((err: unknown) => {
    console.error('💥 validate-article: unhandled error');
    console.error(err);
    process.exit(2);
  });
}
