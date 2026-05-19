/**
 * @module scripts/validators/news-translations/walker
 * @description Filesystem walker + EN-source path derivation helpers
 *              used by the news-translations validator orchestrator.
 *
 *              Rule census: extracted from
 *              `scripts/validate-news-translations.ts` lines 291–302
 *              (`deriveEnSourcePath`) and 415–441 (`getAllHtmlFiles`).
 *              Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { basename, dirname, join } from 'path';

import { colors } from './colors.js';

/**
 * Derive the EN source file path from a translated file path.
 * e.g. news/2026-04-09-committee-reports-de.html → news/2026-04-09-committee-reports-en.html
 */
export function deriveEnSourcePath(filepath: string): string | null {
  const dir = dirname(filepath);
  const name = basename(filepath);
  const enName = name.replace(/-[a-z]{2}\.html$/, '-en.html');
  if (enName === name) return null;
  const enPath = join(dir, enName);
  return existsSync(enPath) ? enPath : null;
}

/**
 * Get all HTML files in a directory (recursive).
 */
export function getAllHtmlFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...getAllHtmlFiles(fullPath));
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (error: unknown) {
    console.error(
      `${colors.red}Error reading directory ${dir}: ${(error as Error).message}${colors.reset}`,
    );
  }

  return files;
}
