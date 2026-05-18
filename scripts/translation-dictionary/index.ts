/**
 * @module Translation Dictionary — Political Terms barrel
 * @category Intelligence Operations / Translation Tooling
 *
 * @description
 * Re-assembles the four alphabet-bucket slices
 * (`political-terms-a-f`, `political-terms-g-m`, `political-terms-n-s`,
 * `political-terms-t-z`) into the canonical `POLITICAL_TERMS` array
 * exported by the legacy single-file path
 * `scripts/translation-dictionary-political-terms.ts` (kept as a
 * 5-line re-export shim).
 *
 * Why alphabet buckets:
 *   - A single-term copy-edit touches one file of ≤ 200 lines, not the
 *     736-line monolith.
 *   - `git log scripts/translation-dictionary/political-terms-n-s.ts`
 *     gives a focused review history per alphabet range.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { PoliticalTerm } from './types.js';
import { POLITICAL_TERMS_A_F } from './political-terms-a-f.js';
import { POLITICAL_TERMS_G_M } from './political-terms-g-m.js';
import { POLITICAL_TERMS_N_S } from './political-terms-n-s.js';
import { POLITICAL_TERMS_T_Z } from './political-terms-t-z.js';

export type { PoliticalTerm } from './types.js';

/**
 * Parliamentary procedure, budget/fiscal, EU, geographic, legal and
 * policy terms. Each entry: `[Swedish lemma, per-language translations]`.
 */
export const POLITICAL_TERMS: ReadonlyArray<PoliticalTerm> = [
  ...POLITICAL_TERMS_A_F,
  ...POLITICAL_TERMS_G_M,
  ...POLITICAL_TERMS_N_S,
  ...POLITICAL_TERMS_T_Z,
];
