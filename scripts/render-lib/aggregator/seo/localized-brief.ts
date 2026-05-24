/**
 * @module Infrastructure/RenderLib/Aggregator/Seo/LocalizedBrief
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Localized executive-brief → localized SEO (title + description)
 *
 * @description
 * Bounded-context implementation of the per-language SEO cascade
 * documented in `Article-Generation.md § "Title and description
 * extraction → Per-language precedence chain"`. Specifically, this module
 * implements **chain step #2**: when `analysis/daily/$DATE/$SUB/executive-brief_<lang>.md`
 * exists, its H1 and BLUF are the canonical localized SEO source — the
 * same way the English `executive-brief.md` is the canonical English
 * SEO source (chain step #1, handled by `aggregator/aggregate.ts`).
 *
 * The English-side extraction lives in:
 *   - {@link readFirstHeading} + {@link cleanArticleTitle} (title)
 *   - {@link readBlufParagraph} + {@link readFirstParagraph}
 *     + {@link truncateToSentenceBoundary} (description)
 *
 * Those functions are **pure** and stateless — this module reuses them
 * verbatim against the localized brief markdown so the editorial rule
 * "title + description are highlights of the executive brief" is enforced
 * identically across all 14 languages with zero duplicated logic.
 *
 * What this module adds on top of the English-side pure functions:
 *
 *  1. **Banned-phrase rejection parity with the analysis-gate.** The
 *     gate (`scripts/agentic/analysis-gate.ts § checkExecutiveBrief`)
 *     blocks the English brief if its H1 is the template placeholder
 *     (`REPLACE THIS H1`, `Executive Brief Template`, `AI_MUST_REPLACE`,
 *     `AI-generated political intelligence`) or the bare boilerplate
 *     `Executive Brief`. Those rules also apply to the 13 localized
 *     siblings — if the translator left a template stub in
 *     `executive-brief_de.md`, the wire-up MUST refuse to ship it as
 *     `<title>` and fall back to the next cascade layer.
 *
 *  2. **Sentence-aware truncation re-runs against the localized BLUF.**
 *     The English-side cascade applies {@link truncateToSentenceBoundary}
 *     to the English BLUF; the localized cascade re-runs it against the
 *     localized BLUF so per-language descriptions also land in the
 *     140-200 char SERP window (or 120-170 chars for RTL, 70-120 chars
 *     for CJK once {@link truncateToSentenceBoundary} grows per-language
 *     budgets — until then the Latin window is the safe upper bound).
 *
 *  3. **All-or-nothing semantics.** Either field may resolve to `null`
 *     independently — if the localized brief has a clean H1 but a
 *     boilerplate BLUF, only the title is offered to the merger; the
 *     description falls through to the next cascade layer. This avoids
 *     mixing a localized title with an English description (or vice
 *     versa) which would look like a translation bug to readers.
 *
 * The module is pure and string-only — no filesystem I/O, no clock, no
 * environment. Reading the brief markdown from disk and deciding whether
 * to consume it is the wire-up's responsibility (in
 * `scripts/render-articles.ts`); this keeps the unit under test free of
 * timing and filesystem fixtures.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../../types/language.js';
import {
  composeRichDescription,
  descriptionWindowForLanguage,
  readBlufParagraph,
  readFirstParagraph,
  truncateToSentenceBoundary,
} from './description.js';
import {
  extractBriefEntities,
  flattenBriefEntities,
} from './brief-extractor.js';
import {
  cleanArticleTitle,
  readFirstHeading,
} from './title.js';

/**
 * Input contract for {@link extractLocalizedBriefSeo}. The brief markdown
 * is the full file contents of `executive-brief_<lang>.md` (front-matter
 * + body). The subfolder slug is forwarded to {@link cleanArticleTitle}
 * so its boilerplate-equality check works identically to the English
 * side (e.g. localized brief H1 `# Propositions` is rejected when the
 * subfolder is `propositions`).
 */
export interface LocalizedBriefSeoInput {
  /**
   * The full text of `analysis/daily/$DATE/$SUB/executive-brief_<lang>.md`.
   * The caller is responsible for reading it from disk. Pass `null` /
   * empty string when the file does not exist — the function returns
   * `{ title: null, description: null }` in that case so the caller can
   * cleanly fall through to the next cascade layer.
   */
  readonly briefMarkdown: string | null | undefined;

  /**
   * The analysis subfolder slug (e.g. `propositions`, `interpellations`,
   * `weekly-review`). Used by {@link cleanArticleTitle} to reject H1s
   * that collapse to the subfolder fallback (boilerplate category
   * labels).
   */
  readonly subfolder: string;

  /**
   * Optional BCP-47 / file-suffix language code (e.g. `de`, `ar`, `ja`).
   * When supplied, the description is truncated using the per-language
   * SERP window from {@link descriptionWindowForLanguage} —
   * 140-200 for Latin LTR, 120-170 for RTL (ar/he), 70-120 for CJK
   * (ja/ko/zh). When omitted, falls back to the canonical EN 140-200
   * window (preserves pre-2026-05 behaviour for callers that have not
   * yet been updated).
   */
  readonly lang?: string | null;
}

/**
 * Output contract — three independent optional fields. The caller (the
 * `article-merge.ts` merger) overlays whichever fields are non-null over
 * the per-type agent's `article.<lang>.md` front-matter title /
 * description / keywords.
 */
export interface LocalizedBriefSeo {
  /**
   * Localized `<title>` candidate, post-{@link cleanArticleTitle}. `null`
   * when the brief is missing, its H1 is template boilerplate, contains
   * a banned phrase, or shrinks to <20 chars after cleanup.
   */
  readonly title: string | null;

  /**
   * Localized `<meta description>` candidate, post-{@link truncateToSentenceBoundary}.
   * Composed via {@link composeRichDescription} which combines the BLUF
   * lede with the top headline-section bullets (bill IDs + topics) when
   * the localized brief has a `## 60-Second Read` / native equivalent.
   * `null` when the brief is missing or has no usable BLUF/first
   * paragraph.
   */
  readonly description: string | null;

  /**
   * Story-specific keyword tokens mined from the localized brief —
   * universal-Swedish identifiers (bill IDs `HD03267`, committee
   * codes `JuU`, party codes `M`/`SD`) plus locale-script named
   * entities. These are pre-flattened and ready to seed the keyword
   * builder via `ArticleSeoMetadataInput.briefEntities`. Empty array
   * (not `null`) when the brief is missing — keeps the consumer-side
   * spread `[...localizedSeo.keywords]` safe.
   */
  readonly keywords: readonly string[];
}

/**
 * Banned-phrase patterns kept in lock-step with `analysis-gate.ts § checkExecutiveBrief`.
 * If you add a new pattern in the gate, mirror it here — and add a test
 * case to `tests/localized-brief-seo.test.ts` — so a localized brief
 * carrying a fresh banned phrase cannot leak into the SERP title via
 * cascade chain step #2.
 *
 * Exported for testability.
 */
export const LOCALIZED_BRIEF_H1_BANNED_PATTERNS: readonly RegExp[] = [
  /replace\s*this\s*h1/i,
  /executive\s+brief\s+template/i,
  /ai[_\s-]*must[_\s-]*replace/i,
  /ai-generated\s+political\s+intelligence/i,
];

/**
 * Return `true` when `h1` is template / placeholder boilerplate that must
 * not be used as the SERP `<title>`.
 *
 * Three rejection layers:
 *  1. Any banned-phrase match from {@link LOCALIZED_BRIEF_H1_BANNED_PATTERNS}.
 *  2. The bare boilerplate `Executive Brief` (case- and emoji-tolerant) —
 *     identical to the gate's `h1Plain === 'executive brief'` check.
 *  3. The empty string after emoji + connector stripping.
 *
 * Pure function — exported for tests.
 */
export function isBannedLocalizedBriefH1(h1: string): boolean {
  for (const pattern of LOCALIZED_BRIEF_H1_BANNED_PATTERNS) {
    if (pattern.test(h1)) return true;
  }
  const h1Plain = h1
    .toLowerCase()
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s—–-]+/u, '')
    .replace(/[\s—–-]+$/u, '')
    .trim();
  return h1Plain === 'executive brief' || h1Plain === '';
}

/**
 * Derive `{ title, description }` from a localized executive-brief
 * markdown blob. Each field is resolved independently — `title` falls
 * back to `null` when the H1 fails {@link isBannedLocalizedBriefH1} or
 * is too short for {@link cleanArticleTitle}; `description` falls back
 * to `null` when neither a BLUF paragraph nor a first prose paragraph
 * is present.
 *
 * The caller (the article-merge merger) is expected to overlay non-null
 * fields onto the per-type agent's `article.<lang>.md` front-matter so a
 * banned/missing title in the brief still results in a localized title
 * coming from the article front-matter (cascade chain step #3) rather
 * than English content under a non-English `<html lang>`.
 *
 * Pure function — no I/O, no clock.
 */
export function extractLocalizedBriefSeo(
  input: LocalizedBriefSeoInput,
): LocalizedBriefSeo {
  const { briefMarkdown, subfolder, lang } = input;
  if (!briefMarkdown || briefMarkdown.trim().length === 0) {
    return { title: null, description: null, keywords: [] };
  }

  // Title — readFirstHeading + isBannedLocalizedBriefH1 + cleanArticleTitle.
  let title: string | null = null;
  const rawH1 = readFirstHeading(briefMarkdown);
  if (rawH1 && !isBannedLocalizedBriefH1(rawH1)) {
    title = cleanArticleTitle(rawH1, subfolder);
  }

  // Description — `composeRichDescription` combines the BLUF lede with
  // the localized headline-section bullets (`## 60-Second Read` → `##
  // Nyckelrön` / `## Wesentliche Erkenntnisse` etc.) so per-language
  // SERP snippets carry the same bill-ID + topic signal as the English
  // page. Falls back to plain BLUF when no headline section is present.
  // The per-language SERP window is enforced inside the composer.
  let description: string | null = null;
  const langKey = normaliseLangKey(lang);
  const composed = composeRichDescription(briefMarkdown, langKey);
  if (composed && composed.length > 0) {
    description = composed;
  } else {
    // Defensive fallback for legacy callers / unknown languages — keep
    // the pre-rich-composer behaviour so nothing regresses to empty.
    const blufParagraph = readBlufParagraph(briefMarkdown);
    const fallbackParagraph = blufParagraph ? null : readFirstParagraph(briefMarkdown);
    const rawDescription = blufParagraph ?? fallbackParagraph;
    if (rawDescription && rawDescription.trim().length > 0) {
      const { softMin, hardMax } = descriptionWindowForLanguage(lang);
      const truncated = truncateToSentenceBoundary(rawDescription, softMin, hardMax);
      if (truncated.length > 0) description = truncated;
    }
  }

  // Keywords — mine bill IDs / committee codes / party codes / named
  // entities from the localized brief. Universal-Swedish identifiers
  // (HD03267, JuU, SfU) carry identically across locales; only the
  // named-entity miner is Latin-script-gated upstream.
  const keywords = flattenBriefEntities(extractBriefEntities(briefMarkdown, langKey));

  return { title, description, keywords };
}

/**
 * Normalise a raw lang input (BCP-47 string, `null`, or `undefined`) to
 * a known {@link Language} key, defaulting to `en` for unknown inputs.
 * The `composeRichDescription` and `extractBriefEntities` modules use
 * per-language section-header / stopword tables keyed by the primary
 * BCP-47 subtag — pass the canonicalised form so e.g. `zh-CN` → `zh`.
 */
function normaliseLangKey(lang: string | null | undefined): Language {
  if (!lang) return 'en';
  const primary = lang.toString().trim().toLowerCase().split(/[-_]/)[0];
  const SUPPORTED: ReadonlySet<string> = new Set([
    'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
    'ar', 'he', 'ja', 'ko', 'zh',
  ]);
  return (primary && SUPPORTED.has(primary) ? primary : 'en') as Language;
}
