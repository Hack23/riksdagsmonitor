/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n (legacy single-file path)
 * @description Backwards-compatibility shim. The data was split into one
 * file per language under `./reader-guide-i18n/` (see
 * `./reader-guide-i18n/index.ts`). This file is kept so that existing
 * imports of `./aggregator/reader-guide-i18n.js` continue to work
 * unchanged.
 */
export type {
  ReaderGuideChrome,
  ReaderGuideEntryI18n,
  ReaderGuideI18nBundle,
} from './reader-guide-i18n/index.js';
export { READER_GUIDE_I18N, readerGuideI18n } from './reader-guide-i18n/index.js';
