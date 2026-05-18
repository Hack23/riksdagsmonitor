/**
 * @module Infrastructure/RenderLib/ChromeI18n (legacy single-file path)
 * @description Backwards-compatibility shim. The data was split into one
 * file per language under `./chrome-i18n/` (see `./chrome-i18n/index.ts`).
 * This file is kept so that existing imports of
 * `./render-lib/chrome-i18n.js` continue to work unchanged.
 */
export type { ChromeStrings } from './chrome-i18n/index.js';
export { CHROME_I18N, chromeStrings } from './chrome-i18n/index.js';
