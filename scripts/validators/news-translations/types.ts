/**
 * @module scripts/validators/news-translations/types
 * @description Shared result types for the news-translations validator.
 *
 *              Rule census: extracted from
 *              `scripts/validate-news-translations.ts` lines 54–93
 *              (`CheckResult*`, `FailedFileRecord`, `ContentLeakageRecord`).
 *              Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export interface CheckResultPassed {
  readonly passed: true;
  readonly error?: undefined;
  readonly markerCount?: undefined;
  readonly samples?: undefined;
}

export interface CheckResultFailed {
  readonly passed: false;
  readonly markerCount: number;
  readonly samples: string[];
  readonly error?: undefined;
}

export interface CheckResultError {
  readonly passed?: undefined;
  readonly error: string;
  readonly markerCount?: undefined;
  readonly samples?: undefined;
}

export type CheckResult = CheckResultPassed | CheckResultFailed | CheckResultError;

export interface FailedFileRecord {
  readonly filename: string;
  readonly lang: string;
  readonly count: number;
  readonly samples: string[];
}

/**
 * Record for files containing unresolved `AI_MUST_REPLACE` markers in
 * HTML comments. Restored from the pre-#2582 monolith (commit
 * `52f9743f78~1`); the refactor split accidentally dropped this rule.
 */
export interface AIMarkerFileRecord {
  readonly filename: string;
  readonly lang: string;
  readonly markerCount: number;
  readonly samples: string[];
}

/** Record for files with untranslated body content (English or Swedish leakage) */
export interface ContentLeakageRecord {
  readonly filename: string;
  readonly lang: string;
  readonly untranslatedParagraphs: number;
  readonly phraseMatches: number;
  readonly totalParagraphs: number;
  readonly percentUntranslated: number;
  readonly samples: string[];
}
