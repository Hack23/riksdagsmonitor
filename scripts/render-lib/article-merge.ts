/**
 * @module Infrastructure/RenderLib/ArticleMerge
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Localized + English `article.md` merger
 *
 * @description
 * The agent-translation step under each `news-*.md` workflow only has
 * minutes per language to produce `article.<lang>.md`. The resulting file
 * is therefore a short, hand-curated executive summary — not a full
 * 14-language translation of the canonical English `article.md`
 * (which is itself a 23-artifact aggregation, often >2 000 lines).
 *
 * Without merging, the renderer would publish a 47-line stub at
 * `news/$DATE-$SUB-de.html` while the English sibling carries the full
 * analytical depth — that is the regression this module fixes.
 *
 * `mergeLocalizedWithEnglish` produces a single Markdown document that:
 *
 *  1. **Carries the localized front-matter** (title, language,
 *     etc.) so SEO, JSON-LD `inLanguage` and the article header remain
 *     correctly localized. Front-matter fields the localized file omits
 *     fall back to the English values so canonical metadata
 *     (`date`, `subfolder`, `slug`, `source_folder`) stays stable.
 *     The `description` field is stricter: it stays sourced from the
 *     English executive brief unless a localized `executive-brief_<lang>.md`
 *     provides a publishable BLUF. Per-type localized article descriptions
 *     are intentionally ignored so SERP snippets always come from an
 *     executive brief.
 *     When a localized `executive-brief_<lang>.md` markdown is passed in
 *     (cascade chain step #2 per
 *     `Article-Generation.md § "Per-language precedence chain"`), its
 *     publishable H1 and BLUF override the merged `title:` /
 *     `description:`. Banned-phrase H1s and empty BLUFs are rejected so
 *     title falls through to chain step #3 (localized article front-matter)
 *     while description falls back to the English executive brief.
 *  2. **Starts the body with the localized executive summary** so the
 *     reader gets a first-page experience in their own language.
 *  3. **Appends the full English body** under a localized "Detailed
 *     analysis (in English)" H2 + an aside note explaining the
 *     fallback. This guarantees the published HTML contains *every*
 *     analysis section — Risk Assessment, Coalition Mathematics,
 *     Forward Indicators, Sources etc. — that an English reader sees.
 *
 * The function is pure (no I/O) and string-only — front-matter is parsed
 * with `gray-matter`, re-serialised with `gray-matter`'s `stringify` so
 * the output passes the existing aggregator validators unchanged.
 *
 * Used by `scripts/render-articles.ts` whenever a non-English language
 * specific `article.<lang>.md` file exists alongside the canonical
 * `article.md`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import matter from 'gray-matter';

import type { Language } from '../types/language.js';
import { LANGUAGE_META } from '../sitemap-html/index.js';

export interface MergeLocalizedInput {
  /** Canonical English `article.md` contents (front-matter + body). */
  readonly englishMarkdown: string;
  /** Localized `article.<lang>.md` contents (front-matter + body). */
  readonly localizedMarkdown: string;
  /** Target language. Used to pick the localized fallback heading + note. */
  readonly lang: Language;
  /**
   * @deprecated Cascade-chain step #2 (localized executive-brief →
   * title/description/keywords overlay) moved to the renderer in
   * `scripts/render-lib/article.ts` (`deriveBriefSeoOverrides`). This
   * field is accepted but ignored — kept for back-compat with any
   * external caller. Will be removed in a future cleanup.
   */
  readonly localizedBriefMarkdown?: string | null;
  /**
   * @deprecated Forwarded to the (now-removed) brief overlay. Accepted
   * but ignored. See {@link localizedBriefMarkdown}.
   */
  readonly subfolder?: string;
}

/**
 * Front-matter keys whose canonical value lives in the English
 * `article.md` (set by the aggregator) and must not be overridden by an
 * agent-authored `article.<lang>.md`. The aggregator owns these as a
 * cross-language stable identity.
 */
const ENGLISH_ONLY_FRONT_MATTER_KEYS: ReadonlySet<string> = new Set([
  'date',
  'subfolder',
  'slug',
  'source_folder',
  'layout',
  'generated_at',
]);

/**
 * Front-matter keys whose value should always come from the localized
 * file when present (and fall back to the English value otherwise).
 */
const LOCALIZED_FIRST_FRONT_MATTER_KEYS: ReadonlySet<string> = new Set([
  'title',
  'language',
]);

/**
 * Build the localized "Detailed analysis (in English)" boundary block
 * that separates the localized executive summary from the full English
 * body inside the merged Markdown document.
 *
 * Exported for testability.
 */
export function buildEnglishCoverageBoundary(lang: Language): string {
  const t = LANGUAGE_META[lang].translations;
  const heading = t.articleEnglishCoverageHeading;
  const note = t.articleEnglishCoverageNote;
  return `\n\n---\n\n## ${heading}\n\n> ℹ️ ${note}\n\n`;
}

/**
 * Merge a localized `article.<lang>.md` with the canonical English
 * `article.md`. Returns a single Markdown string ready to be handed to
 * `renderArticleHtml`.
 *
 * Behaviour contract:
 *
 *  - When `lang === 'en'` the English source is returned unchanged
 *    (defensive — render-articles.ts already takes the English path
 *    directly, but this keeps the function safe to call from any caller).
 *  - When the localized file has no body content, the English body is
 *    used directly with the localized front-matter (so at minimum the
 *    title/description are translated even if the agent failed).
 *  - When both have content, the merged body is
 *    `localizedBody + boundary + englishBody`, where `boundary` is the
 *    localized "Detailed analysis (in English)" H2 + aside note.
 *
 * The merged front-matter:
 *
 *  - Starts from the English front-matter (so canonical fields remain
 *    intact).
 *  - Overlays *every* field present in the localized front-matter
 *    *except* the keys in `ENGLISH_ONLY_FRONT_MATTER_KEYS` (date, slug,
 *    layout, etc.) and `description`. This keeps localized metadata while
 *    preventing canonical drift and ensuring descriptions only come from
 *    executive briefs.
 *  - Forces `language: <lang>` so JSON-LD `inLanguage` and SEO match.
 */
export function mergeLocalizedWithEnglish(input: MergeLocalizedInput): string {
  const { englishMarkdown, localizedMarkdown, lang } = input;

  if (lang === 'en') return englishMarkdown;

  const english = matter(englishMarkdown);
  const localized = matter(localizedMarkdown);

  const englishData = (english.data ?? {}) as Record<string, unknown>;
  const localizedData = (localized.data ?? {}) as Record<string, unknown>;

  const mergedData: Record<string, unknown> = { ...englishData };
  for (const [key, value] of Object.entries(localizedData)) {
    if (ENGLISH_ONLY_FRONT_MATTER_KEYS.has(key)) continue;
    if (key === 'description') continue;
    if (value === undefined || value === null || value === '') continue;
    mergedData[key] = value;
  }
  for (const key of LOCALIZED_FIRST_FRONT_MATTER_KEYS) {
    const value = localizedData[key];
    if (value !== undefined && value !== null && value !== '') {
      mergedData[key] = value;
    }
  }

  // Cascade-chain step #2 (localized brief → title / description /
  // keywords overlay) used to live here. It moved to the renderer in
  // commit "Wire renderArticleHtml to read SEO from executive-brief.md"
  // — see `deriveBriefSeoOverrides` in `scripts/render-lib/article.ts`.
  // The merger now only handles (a) the body overlay (localized BLUF
  // lede + EN deep-dive below the boundary H2) and (b) forcing
  // `language: <lang>` so JSON-LD `inLanguage` matches `<html lang>`.

  mergedData.language = lang;

  const englishBody = english.content.trimStart();
  const localizedBody = localized.content.trim();

  if (localizedBody.length === 0) {
    return matter.stringify(englishBody, mergedData);
  }

  const boundary = buildEnglishCoverageBoundary(lang);
  const mergedBody = `${localizedBody}${boundary}${englishBody}`;
  return matter.stringify(mergedBody, mergedData);
}
