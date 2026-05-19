/**
 * @module normalize-static-html-chrome/news/language-from-file
 * @description Detect the language for legacy news HTML files.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { LANGUAGES } from '../constants.js';

/**
 * Detect the language code from a news file path.
 * Matches the `-XX.html` suffix convention. Returns `null` when no recognised
 * language code is present (e.g. canonical EN files with no suffix).
 */
export function langFromNewsFile(file: string): Language | null {
  const match = file.match(/-([a-z]{2})\.html$/);
  const candidate = match?.[1] as Language | undefined;
  return candidate && (LANGUAGES as readonly string[]).includes(candidate) ? candidate : null;
}
