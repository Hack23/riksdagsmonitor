/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name READER_GUIDE_I18N barrel — assemble 14 per-language bundles
 *
 * @description
 * Re-exports the shared types and assembles the 14 per-language
 * `{CHROME, ENTRIES}` exports into the canonical
 * `READER_GUIDE_I18N: Record<Language, ReaderGuideI18nBundle>` map
 * plus the `readerGuideI18n()` convenience accessor.
 *
 * Consumers (kept backwards-compatible via the parent shim
 * `../reader-guide-i18n.ts`):
 *   - `scripts/render-lib/aggregator/reader-guide.ts`
 *   - `scripts/render-lib/aggregator/index.ts`
 *   - `scripts/render-lib/article-aside.ts`
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../../types/language.js';

import type { ReaderGuideI18nBundle } from './types.js';

import * as EN from './en.js';
import * as SV from './sv.js';
import * as DA from './da.js';
import * as NO from './no.js';
import * as FI from './fi.js';
import * as DE from './de.js';
import * as FR from './fr.js';
import * as ES from './es.js';
import * as NL from './nl.js';
import * as AR from './ar.js';
import * as HE from './he.js';
import * as JA from './ja.js';
import * as KO from './ko.js';
import * as ZH from './zh.js';

export type {
  ReaderGuideChrome,
  ReaderGuideEntryI18n,
  ReaderGuideI18nBundle,
} from './types.js';

/**
 * Per-language Reader Intelligence Guide bundle (one entry per
 * supported {@link Language}).
 */
export const READER_GUIDE_I18N: Record<Language, ReaderGuideI18nBundle> = {
  en: { chrome: EN.CHROME, entries: EN.ENTRIES },
  sv: { chrome: SV.CHROME, entries: SV.ENTRIES },
  da: { chrome: DA.CHROME, entries: DA.ENTRIES },
  no: { chrome: NO.CHROME, entries: NO.ENTRIES },
  fi: { chrome: FI.CHROME, entries: FI.ENTRIES },
  de: { chrome: DE.CHROME, entries: DE.ENTRIES },
  fr: { chrome: FR.CHROME, entries: FR.ENTRIES },
  es: { chrome: ES.CHROME, entries: ES.ENTRIES },
  nl: { chrome: NL.CHROME, entries: NL.ENTRIES },
  ar: { chrome: AR.CHROME, entries: AR.ENTRIES },
  he: { chrome: HE.CHROME, entries: HE.ENTRIES },
  ja: { chrome: JA.CHROME, entries: JA.ENTRIES },
  ko: { chrome: KO.CHROME, entries: KO.ENTRIES },
  zh: { chrome: ZH.CHROME, entries: ZH.ENTRIES },
};

/**
 * Get the i18n bundle for a given language, with English fallback.
 */
export function readerGuideI18n(lang: Language): ReaderGuideI18nBundle {
  return READER_GUIDE_I18N[lang] ?? READER_GUIDE_I18N.en;
}
