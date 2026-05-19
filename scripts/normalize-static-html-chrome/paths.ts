/**
 * @module normalize-static-html-chrome/paths
 * @description Filesystem path / suffix helpers for chrome normalization.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Language } from '../types/language.js';
import type { PageFamily } from './constants.js';

/** EN pages have no `_lang` suffix; all others use `_xx`. */
export function languageSuffix(lang: Language): string {
  return lang === 'en' ? '' : `_${lang}`;
}

/** Alias kept for legacy news code paths. */
export function localizedSuffix(lang: Language): string {
  return lang === 'en' ? '' : `_${lang}`;
}

/** Resolve the page filename for a given family + language. */
export function fileFor(family: PageFamily, lang: Language): string {
  const suffix = languageSuffix(lang);
  if (family === 'dashboard') return `dashboard/index${suffix}.html`;
  if (family === 'politician') return `politician-dashboard${suffix}.html`;
  return `index${suffix}.html`;
}

/** Compute the relative `../` prefix needed from a file to the repo root. */
export function pathPrefix(file: string): string {
  const depth = file.split('/').length - 1;
  return depth > 0 ? '../'.repeat(depth) : '';
}

/** Recursively list every `.html` file under `dir`. */
export function walkHtmlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}
