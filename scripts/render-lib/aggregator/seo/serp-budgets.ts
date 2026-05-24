/**
 * @module Infrastructure/RenderLib/Aggregator/Seo/SerpBudgets
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Per-language SERP budgets (title + description)
 *
 * @description
 * **Single source of truth** for the per-language SERP character budgets
 * documented in `.github/prompts/seo-metadata-contract.md` §4. Both the
 * aggregator-side cascade (`localized-brief.ts`, `description.ts`) and
 * the renderer-side composer (`article-seo.ts`) consume these tables so
 * the title / description widths cannot drift between extraction and
 * rendering.
 *
 * Why this matters for the 14-language matrix:
 *
 *  - **Latin LTR** (`en sv da no fi de fr es nl`) — 9 languages share
 *    the canonical Google desktop budget: title 55–70 visual chars,
 *    description 140–200.
 *  - **RTL** (`ar he`) — 2 languages render right-to-left; Google
 *    truncates RTL descriptions ~15 % earlier than LTR (title 45–60,
 *    description 120–170).
 *  - **CJK** (`ja ko zh`) — 3 languages whose ideographic glyphs occupy
 *    roughly twice the SERP visual width of a Latin letter (title 30–45
 *    glyphs, description 70–120).
 *
 * Pre-2026-05-24 the renderer hard-coded `SERP_TITLE_BUDGET = 70` and
 * `DESCRIPTION_HARD_MAX = 200` for **all** 14 languages. CJK titles
 * therefore shipped at ~70 glyphs (≈140 visual width — 3× the Google
 * budget) and got truncated mid-glyph in the SERP. After this module
 * lands, every language honors its own contract window end-to-end.
 *
 * The module is pure (no I/O, no clock) — exported constants + two pure
 * lookup helpers. Tests in `tests/seo-budget-windows.test.ts` enforce
 * contract parity and BCP-47 normalisation rules.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * A `{ softMin, hardMax }` pair describing the SERP budget for a single
 * language. `softMin` is the editorial floor (descriptions shorter than
 * this trigger Google to rewrite the snippet from the body); `hardMax`
 * is the truncation ceiling (anything longer gets truncated mid-content
 * with no recovery). All values are **visual SERP widths** — for CJK
 * languages count glyphs, not bytes.
 *
 * Soft-min for titles is currently informational (the renderer does not
 * pad short titles); only `hardMax` is enforced in the truncation path.
 * Future work: pad short EN/SV titles with the article-type label when
 * they fall below `softMin` (tracked as a follow-up in the SEO contract).
 */
export interface SerpBudget {
  readonly softMin: number;
  readonly hardMax: number;
}

/**
 * Per-language `<title>` budget table. Mirrors the structure of
 * {@link LANG_DESCRIPTION_WINDOWS} so the two tables can be reasoned
 * about together (and so a future refactor can collapse them into a
 * single `{ title, description }` record per language).
 *
 * Values from `seo-metadata-contract.md` §4 "Per-language charset
 * budgets" — the contract is the human-readable source of truth; this
 * table is the machine-readable enforcement layer. Tests in
 * `tests/seo-budget-windows.test.ts` assert the two stay in lock-step.
 */
export const LANG_TITLE_WINDOWS: Readonly<Record<string, SerpBudget>> = {
  // Latin LTR — 9 languages, all 55–70 (Google desktop SERP)
  en: { softMin: 55, hardMax: 70 },
  sv: { softMin: 55, hardMax: 70 },
  da: { softMin: 55, hardMax: 70 },
  no: { softMin: 55, hardMax: 70 },
  fi: { softMin: 55, hardMax: 70 },
  de: { softMin: 55, hardMax: 70 },
  fr: { softMin: 55, hardMax: 70 },
  es: { softMin: 55, hardMax: 70 },
  nl: { softMin: 55, hardMax: 70 },
  // RTL — 2 languages, 45–60
  ar: { softMin: 45, hardMax: 60 },
  he: { softMin: 45, hardMax: 60 },
  // CJK — 3 languages, 30–45 (count CJK glyphs, not bytes)
  ja: { softMin: 30, hardMax: 45 },
  ko: { softMin: 30, hardMax: 45 },
  zh: { softMin: 30, hardMax: 45 },
};

/**
 * Per-language `<meta description>` budget table — identical schema to
 * {@link LANG_TITLE_WINDOWS}. See {@link LANG_TITLE_WINDOWS} for the
 * rationale; values come from the same `seo-metadata-contract.md` §4
 * table.
 *
 * Re-exported by `description.ts` under the legacy name
 * `LANG_DESCRIPTION_WINDOWS` for back-compat with existing callers; new
 * callers should import from this module directly.
 */
export const LANG_DESCRIPTION_WINDOWS: Readonly<Record<string, SerpBudget>> = {
  // Latin LTR — 9 languages, all 140-200
  en: { softMin: 140, hardMax: 200 },
  sv: { softMin: 140, hardMax: 200 },
  da: { softMin: 140, hardMax: 200 },
  no: { softMin: 140, hardMax: 200 },
  fi: { softMin: 140, hardMax: 200 },
  de: { softMin: 140, hardMax: 200 },
  fr: { softMin: 140, hardMax: 200 },
  es: { softMin: 140, hardMax: 200 },
  nl: { softMin: 140, hardMax: 200 },
  // RTL — 2 languages, 120-170
  ar: { softMin: 120, hardMax: 170 },
  he: { softMin: 120, hardMax: 170 },
  // CJK — 3 languages, 70-120 (count CJK glyphs, not bytes)
  ja: { softMin: 70, hardMax: 120 },
  ko: { softMin: 70, hardMax: 120 },
  zh: { softMin: 70, hardMax: 120 },
};

/**
 * Normalise a raw BCP-47 / file-suffix language code to the primary
 * subtag used as the lookup key in {@link LANG_TITLE_WINDOWS} /
 * {@link LANG_DESCRIPTION_WINDOWS}. Strips whitespace, lower-cases,
 * splits on `-` or `_`, and returns the first non-empty segment.
 *
 * Returns `null` for empty / whitespace-only inputs so callers can use
 * the `??` operator to fall back to a canonical default.
 *
 * Examples:
 *  - `'JA'`       → `'ja'`
 *  - `'zh-CN'`    → `'zh'`
 *  - `'nb-NO'`    → `'nb'`  (note: not in the table; lookup returns EN window)
 *  - `'  de  '`   → `'de'`
 *  - `''`         → `null`
 *  - `null`       → `null`
 */
export function normalisePrimaryLangSubtag(
  lang: string | null | undefined,
): string | null {
  if (!lang) return null;
  const primary = lang.toString().trim().toLowerCase().split(/[-_]/)[0];
  return primary && primary.length > 0 ? primary : null;
}

/**
 * Resolve the per-language `<title>` budget. Falls back to the EN
 * window `{ 55, 70 }` for unknown / malformed inputs so callers default
 * to the contract's widest Latin window when handed an unexpected
 * BCP-47 code. Mirrors the public contract of
 * {@link descriptionWindowForLanguage}.
 *
 * Real-world callers pass BCP-47 strings from `<html lang>` attrs, RSS
 * feeds and CMSes (`zh-CN`, `JA`, `Ar`, `  de  `, `nb-NO`, …) so this
 * function normalises the input via {@link normalisePrimaryLangSubtag}
 * before lookup.
 */
export function titleWindowForLanguage(
  lang: string | null | undefined,
): SerpBudget {
  const primary = normalisePrimaryLangSubtag(lang);
  if (!primary) return LANG_TITLE_WINDOWS.en!;
  return LANG_TITLE_WINDOWS[primary] ?? LANG_TITLE_WINDOWS.en!;
}

/**
 * Resolve the per-language `<meta description>` budget. Falls back to
 * the EN window `{ 140, 200 }` for unknown / malformed inputs.
 *
 * This is the canonical implementation; `description.ts` re-exports it
 * under the same name for back-compat with pre-2026-05-24 callers that
 * import from `aggregator/seo/description.js`.
 */
export function descriptionWindowForLanguage(
  lang: string | null | undefined,
): SerpBudget {
  const primary = normalisePrimaryLangSubtag(lang);
  if (!primary) return LANG_DESCRIPTION_WINDOWS.en!;
  return LANG_DESCRIPTION_WINDOWS[primary] ?? LANG_DESCRIPTION_WINDOWS.en!;
}
