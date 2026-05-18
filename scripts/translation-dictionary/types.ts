/**
 * @module Translation Dictionary — Types
 * @category Intelligence Operations / Translation Tooling
 *
 * @description
 * Shared type for the `POLITICAL_TERMS` table — a tuple of the Swedish
 * lemma and the 14-language translation record. Split from the legacy
 * single-file `scripts/translation-dictionary-political-terms.ts` so
 * the alphabet-bucket modules can share one canonical shape without
 * importing each other.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';

/**
 * One entry in the political-terms dictionary: a `[swedish_lemma,
 * translations]` tuple where `translations` covers all 14 supported
 * languages.
 */
export type PoliticalTerm = readonly [string, Record<Language, string>];
