/**
 * @module scripts/validators/news-translations/rules/untranslated
 * @description Detect `data-translate="true"` markers that indicate
 *              content the translator left untranslated.
 *
 *              Rule census: extracted from
 *              `scripts/validate-news-translations.ts` lines 379–413.
 *              Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync } from 'fs';

import type { CheckResult } from '../types.js';

/**
 * Check if a file contains untranslated Swedish content markers.
 */
export function checkFileForUntranslatedContent(filepath: string): CheckResult {
  try {
    const content = readFileSync(filepath, 'utf-8');
    const markers = content.match(/data-translate="true"/g);

    if (!markers) {
      return { passed: true };
    }

    const samples: string[] = [];
    const sampleRegex = /<span data-translate="true"[^>]*>([^<]{0,80})/g;
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = sampleRegex.exec(content)) !== null && count < 3) {
      const raw = match[1] ?? '';
      const text = raw.length >= 80 ? raw + '...' : raw;
      samples.push(text);
      count++;
    }

    return {
      passed: false,
      markerCount: markers.length,
      samples,
    };
  } catch (error: unknown) {
    return {
      error: (error as Error).message,
    };
  }
}
