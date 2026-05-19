/**
 * @module scripts/validators/executive-brief-translations/types
 * @description Shared types + language constants for the executive-brief
 *              translation validator.
 *
 *              Rule census (refactor of `scripts/validate-executive-brief-translations.ts`):
 *              extracted from original lines 49–122 (`TRANSLATION_LANGS`,
 *              `TranslationLang`, `RTL_LANGS`, `CheckResult`,
 *              `TranslationValidation`, `SourceValidation`,
 *              `ValidationSummary`). No rule was added, removed, or
 *              modified in this extraction.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** 13 non-English target languages owned by the `news-translate` workflow. */
export const TRANSLATION_LANGS = [
  'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
] as const;
export type TranslationLang = typeof TRANSLATION_LANGS[number];

/** RTL languages requiring a `<!-- dir: rtl -->` marker. */
export const RTL_LANGS: ReadonlyArray<TranslationLang> = ['ar', 'he'];

export interface CheckResult {
  /** Identifier of the check (e.g. `headings`, `tables`, `urls`). */
  check: string;
  /** Did the check pass? */
  passed: boolean;
  /** Optional human-readable detail used in the report. */
  detail?: string;
}

export interface TranslationValidation {
  /** Path to the translation file relative to the repository root. */
  translationPath: string;
  /** Target language code. */
  lang: TranslationLang;
  /** True if the translation file exists on disk. */
  exists: boolean;
  /** Per-check results. */
  checks: CheckResult[];
  /** Overall pass/fail (every check.passed === true). */
  passed: boolean;
}

export interface SourceValidation {
  /** Path to the source executive-brief.md relative to the repository root. */
  sourcePath: string;
  /** SHA of the most recent commit that touched the source (`git log -1`). */
  sourceSha: string | null;
  /** Validation result per requested language. */
  translations: TranslationValidation[];
  /** Overall pass/fail across every translation. */
  passed: boolean;
}

export interface ValidationSummary {
  totalSources: number;
  totalTranslationsExpected: number;
  totalTranslationsPresent: number;
  totalChecksRun: number;
  totalChecksFailed: number;
  sources: SourceValidation[];
}
