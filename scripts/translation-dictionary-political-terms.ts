/**
 * @module Translation Dictionary — Political Terms (legacy single-file path)
 * @description Backwards-compatibility shim. The data was split into
 * alphabet-bucket files under `./translation-dictionary/`. This file is
 * kept so that existing imports of
 * `./translation-dictionary-political-terms.js` continue to work.
 */
export type { PoliticalTerm } from './translation-dictionary/index.js';
export { POLITICAL_TERMS } from './translation-dictionary/index.js';
