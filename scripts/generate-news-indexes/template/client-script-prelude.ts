/**
 * @module generate-news-indexes/template/client-script-prelude
 * @description Per-language constant declarations injected at the top of the
 * news-index inline script. The runtime body in
 * `./client-script-runtime.ts` consumes these symbols by name.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import { AVAILABLE_IN_TRANSLATIONS, LANGUAGE_FLAGS } from '../constants.js';
import type { ArticleDisplayData, FilterLabels, LanguageConfig } from '../types.js';
import { buildRecencyLabels } from './i18n.js';

export interface PreludeInput {
  readonly langKey: string;
  readonly lang: LanguageConfig;
  readonly displayData: readonly ArticleDisplayData[];
  readonly isRTL: boolean;
}

/**
 * Emit the `const` declarations the runtime body depends on:
 *   LANGUAGE_FLAGS, IS_RTL, AVAILABLE_IN_TEXT,
 *   i18nLoadMore, i18nShowingConfig, articles,
 *   RECENCY_LABELS, typeLabels, LOCALE_CODE.
 */
export function buildPrelude({ langKey, lang, displayData, isRTL }: PreludeInput): string {
  const f: FilterLabels = lang.filters;
  const typeLabels = {
    prospective: f.prospective,
    retrospective: f.retrospective,
    analysis: f.analysis,
    breaking: f.breaking,
  };
  // </ → <\/ escape in the articles JSON prevents premature </script> termination.
  const articlesJson = JSON.stringify(displayData, null, 2).replace(/<\//g, '<\\/');
  const availableInText = escapeHtml(AVAILABLE_IN_TRANSLATIONS[langKey] || 'Available in');

  return `    // Language flags mapping (shared with server-side)
    const LANGUAGE_FLAGS = ${JSON.stringify(LANGUAGE_FLAGS)};

    // RTL page flag (used to set dir="ltr" on language badges)
    const IS_RTL = ${isRTL};

    // Available in translation (for current language)
    const AVAILABLE_IN_TEXT = '${availableInText}';

    // Pagination i18n strings
    const i18nLoadMore = ${JSON.stringify(lang.i18n.loadMore)};
    const i18nShowingConfig = ${JSON.stringify(lang.i18n.showing)};

    // Dynamic articles array - generated from news/ directory
    const articles = ${articlesJson};

    const RECENCY_LABELS = ${JSON.stringify(buildRecencyLabels(langKey))};

    const typeLabels = ${JSON.stringify(typeLabels)};

    const LOCALE_CODE = '${lang.code}';`;
}
