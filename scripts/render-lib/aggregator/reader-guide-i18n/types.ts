/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/Types
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — shared types
 *
 * @description
 * Type-only module shared by every per-language reader-guide bundle and
 * the `./index.ts` barrel. Split from the legacy single-file
 * `scripts/render-lib/aggregator/reader-guide-i18n.ts` (742 lines) so
 * each language can be reviewed in isolation.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Chrome strings for the Reader Intelligence Guide table — heading,
 * preamble paragraph, and column headers.
 */
export interface ReaderGuideChrome {
  readonly heading: string;
  readonly preamble: string;
  readonly colReaderNeed: string;
  readonly colWhatYouGet: string;
  /** Label for the per-document intelligence row. */
  readonly perDocLabel: string;
  readonly perDocValue: string;
  /** Label for the audit appendix pointer row. */
  readonly auditLabel: string;
  readonly auditValue: string;
  /**
   * Localized sr-only label for the icon column header. The icon
   * column is visually decorative (the icon repeats meaning expressed
   * in the next column) but assistive technology still needs a name
   * for the column so users hear something distinct from the adjacent
   * `colReaderNeed` header. Examples: "Icon" (en), "Ikon" (sv),
   * "Icône" (fr), "アイコン" (ja).
   */
  readonly colIcon: string;
  /**
   * Generic localized fallback description used as the "reader value"
   * cell for any analysis artifact that is not in the curated
   * {@link ../reader-guide.js#READER_GUIDE_ENTRIES} list. Allows the
   * Reader Intelligence Guide to render a row for **every** analysis
   * artifact (icon + section anchor + description) so the table acts
   * as a complete, navigable index of the article's analytical lenses.
   */
  readonly defaultReaderValue: string;
}

/**
 * Per-entry i18n: maps each artifact file to translated `label` and
 * `readerValue` strings.
 */
export interface ReaderGuideEntryI18n {
  readonly label: string;
  readonly readerValue: string;
}

/**
 * Full i18n bundle for one language.
 */
export interface ReaderGuideI18nBundle {
  readonly chrome: ReaderGuideChrome;
  readonly entries: Readonly<Record<string, ReaderGuideEntryI18n>>;
}
