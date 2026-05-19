/**
 * @module scripts/validators/news-translations/colors
 * @description Terminal colour codes shared by the news-translations
 *              validator output.
 *
 *              Rule census: extracted from
 *              `scripts/validate-news-translations.ts` lines 27–43.
 *              Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export interface Colors {
  readonly reset: string;
  readonly green: string;
  readonly red: string;
  readonly yellow: string;
  readonly cyan: string;
  readonly bold: string;
}

export const colors: Colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};
