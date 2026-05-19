/**
 * @module imf/indicators/cofog-codes
 * @description Canonical GFS_COFOG (Government Function) codes used by
 * Riksdagsmonitor articles.
 *
 * The legacy `G02 / G07 / G09 / G10` codes were **retired in the
 * 2026-05 refactor** — only the `GF##_T` form is canonical. See
 * `scripts/imf-context.ts` for the cross-script consumer and
 * `analysis/imf/data-dictionary.md` for the dataflow registry.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** COFOG 02 — Defence (FöU). */
export const COFOG_DEFENCE = 'GF02_T';
/** COFOG 07 — Health. */
export const COFOG_HEALTH = 'GF07_T';
/** COFOG 09 — Education. */
export const COFOG_EDUCATION = 'GF09_T';
/** COFOG 10 — Social protection. */
export const COFOG_SOCIAL_PROTECTION = 'GF10_T';

/**
 * Canonical IMF GFS_COFOG (Government Function) codes — the **only**
 * codes article workflows are allowed to cite as `GFS_COFOG:<code>`.
 */
export const IMF_GFS_COFOG_CODES = {
  defence: COFOG_DEFENCE,
  health: COFOG_HEALTH,
  education: COFOG_EDUCATION,
  socialProtection: COFOG_SOCIAL_PROTECTION,
} as const;
