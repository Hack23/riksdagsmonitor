/**
 * @module Infrastructure/PoliticalIntelligence
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Political-Intelligence Generator — Public Barrel
 *
 * @description
 * Re-exports the public surface of the political-intelligence generator
 * from its bounded-context leaf modules. Consumers (and the thin
 * `scripts/generate-political-intelligence.ts` CLI shim) should import
 * from this barrel — never reach into `i18n/` / `render/` directly.
 *
 * Round-6 split: replaces the 2289-LOC monolith.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export { collectCatalog, buildGithubUrl } from './catalog.js';
export type { CatalogEntry } from './catalog.js';
export { collectDailyDays } from './daily-streams.js';
export type { DailyArtifact, DailyDay, DailyStream } from './daily-streams.js';
export { generatePoliticalIntelligenceHtml } from './render/page.js';
export { renderCatalogGrid } from './render/grid.js';
export { renderDailyDay, artifactBaseName, artifactIcon } from './render/daily-day.js';
export { PI_EXTRA_STYLE } from './render/style.js';
export { METHODOLOGY_META, METHODOLOGY_DESC_I18N } from './i18n/methodology-i18n.js';
export {
  TEMPLATE_META,
  TEMPLATE_DESC_I18N,
  TEMPLATE_GENERIC_DESC_I18N,
} from './i18n/template-i18n.js';
export {
  STREAM_META,
  STREAM_NAME_I18N,
  STREAM_DESC_I18N,
  REALTIME_DESC_I18N,
  STREAM_GENERIC_DESC_I18N,
  prettifyStream,
  streamIcon,
  streamDisplayName,
  streamDescription,
} from './i18n/stream-i18n.js';
export {
  ARTIFACT_TITLE_I18N,
  LIBRARY_NAME_I18N,
  artifactTitle,
  prettifyMarkdownTitle,
  localisedCatalogDescription,
} from './i18n/artifact-i18n.js';
export type { LangMap } from './i18n/artifact-i18n.js';
export { PI_TRANSLATIONS } from './i18n/page-translations.js';
export type { PiTranslations } from './i18n/page-translations.js';
