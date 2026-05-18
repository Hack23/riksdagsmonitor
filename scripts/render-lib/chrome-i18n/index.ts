/**
 * @module Infrastructure/RenderLib/ChromeI18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name CHROME_I18N barrel — assemble 14 per-language chrome bundles
 *
 * @description
 * Re-exports the `ChromeStrings` type and assembles the per-language
 * `CHROME_<LANG>` records (one file per language) into the canonical
 * `CHROME_I18N: Record<Language, ChromeStrings>` map plus the
 * `chromeStrings()` convenience accessor.
 *
 * Why per-language modules:
 *   - Native-speaker reviewers can edit one file (~100 lines) instead
 *     of the legacy 1 505-line monolith.
 *   - `git log scripts/render-lib/chrome-i18n/<lang>.ts` gives the
 *     entire translation history for that language.
 *   - Smaller merge surface — a Korean copy-edit no longer conflicts
 *     with a Swedish copy-edit.
 *
 * Consumers (kept backwards-compatible via `../chrome-i18n.ts` shim):
 *   - `scripts/render-lib/chrome.ts`
 *   - `scripts/render-lib/chrome/header.ts`
 *   - `scripts/render-lib/chrome/footer.ts`
 *   - `scripts/normalize-static-html-chrome.ts`
 *   - `scripts/backfill-translated-chrome.ts`
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';

import type { ChromeStrings } from './types.js';
import { CHROME_EN } from './en.js';
import { CHROME_SV } from './sv.js';
import { CHROME_DA } from './da.js';
import { CHROME_NO } from './no.js';
import { CHROME_FI } from './fi.js';
import { CHROME_DE } from './de.js';
import { CHROME_FR } from './fr.js';
import { CHROME_ES } from './es.js';
import { CHROME_NL } from './nl.js';
import { CHROME_AR } from './ar.js';
import { CHROME_HE } from './he.js';
import { CHROME_JA } from './ja.js';
import { CHROME_KO } from './ko.js';
import { CHROME_ZH } from './zh.js';

export type { ChromeStrings } from './types.js';

/**
 * Per-language chrome strings (one record per supported {@link Language}).
 *
 * Translation discipline:
 *  - Standards / brand names left in English (ISO 27001, NIST CSF, etc.).
 *  - Honorific forms used in JA/KO/ZH where appropriate.
 *  - RTL languages (AR, HE) provide RTL-friendly translations; the chrome
 *    container relies on `dir="rtl"` from `LANGUAGE_META` for layout.
 */
export const CHROME_I18N: Record<Language, ChromeStrings> = {
  en: CHROME_EN,
  sv: CHROME_SV,
  da: CHROME_DA,
  no: CHROME_NO,
  fi: CHROME_FI,
  de: CHROME_DE,
  fr: CHROME_FR,
  es: CHROME_ES,
  nl: CHROME_NL,
  ar: CHROME_AR,
  he: CHROME_HE,
  ja: CHROME_JA,
  ko: CHROME_KO,
  zh: CHROME_ZH,
};

/** Convenience accessor with fallback to English. */
export function chromeStrings(lang: Language): ChromeStrings {
  return CHROME_I18N[lang] ?? CHROME_I18N.en;
}
