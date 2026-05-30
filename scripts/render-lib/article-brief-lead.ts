/**
 * @module Infrastructure/RenderLib/ArticleBriefLead
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Localized executive-brief lead substitution + carrier stripping
 *
 * @description
 * The aggregated `analysis/daily/$DATE/$SUB/article.md` is an
 * English-canonical document. It opens with the English executive brief
 * (the `## What Happened` lead section) and — because the aggregator
 * splices *every* `.md` sibling into the body — also embeds the 13
 * localized briefs (`executive-brief_<lang>.md`) as trailing
 * `## Executive Brief Sv`, `## Executive Brief De`, … carrier sections.
 *
 * Those carrier sections were never meant to render inline: they bloat
 * every published page (each carries the full brief in a foreign language)
 * and they leave a non-English reader meeting the *English* lead before
 * their own-language summary. The SEO cascade already localizes the
 * `<title>` / `<meta description>` from `executive-brief_<lang>.md`
 * (see `aggregator/seo/localized-brief.ts`); this module brings the
 * on-page **lead** into lock-step with that cascade.
 *
 * {@link localizeExecutiveBriefLead} is a pure (no-I/O) string transform
 * applied by `renderArticleHtml` to the article-markdown body per target
 * language. It:
 *
 *   1. removes every embedded `## Executive Brief <Lang>` carrier section
 *      for **all** languages (English included); and
 *   2. for a non-English target with a localized brief, replaces the body
 *      of the first `<h2>` lead section (`## What Happened`) with the
 *      cleaned `executive-brief_<lang>.md` content so the reader's first
 *      screen is entirely in their own language. When the localized brief
 *      is absent, the English lead is left in place (the same "localized
 *      if exists, English otherwise" rule the SEO cascade follows).
 *
 * The localized body is cleaned with the **same** pipeline the aggregator
 * uses for the carrier sections — `cleanArtifactBody` (front-matter / H1 /
 * admin-byline strip + `##` → `###` heading demotion) followed by
 * `rewriteRelativeLinks` — so the swapped-in lead is byte-identical to
 * what the aggregator would have embedded. Crucially it does **not** run
 * `normalizeNarrativeTerminology`, whose English first-use annotations
 * (`Riksdag document #… (HD…)`, `Lede`, confidence glosses) must never be
 * injected into localized prose.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import { LANGUAGES } from './constants.js';
import { buildGithubBlobUrl } from './url-helpers.js';
import {
  cleanArtifactBody,
  rewriteRelativeLinks,
} from './aggregator/cleaning/structural.js';

/**
 * Title-cased single-segment language codes for **all 14** locales,
 * matching `prettifyFallbackTitle('executive-brief_<lang>.md')` in
 * `aggregator/order.ts` (e.g. `sv` → `Sv`, `no` → `No`, `zh` → `Zh`,
 * `en` → `En`).
 *
 * English (`En`) is intentionally included: the canonical English brief
 * renders as the `## What Happened` lead (or the legacy `## Executive
 * Brief` heading with **no** language suffix), so a suffixed `## Executive
 * Brief En` heading is always a stray `executive-brief_en.md` carrier — it
 * must be stripped just like the 13 localized carriers. Without it, an
 * `executive-brief_en.md` artifact (e.g. when aggregating a single language
 * in isolation) leaks an `Executive Brief En` heading into the rendered
 * TOC. The `\b` boundary after the suffix means the legacy unsuffixed
 * `## Executive Brief` lead is never matched.
 */
const LOCALIZED_BRIEF_TITLE_SUFFIXES: readonly string[] = LANGUAGES
  .map((l) => l.charAt(0).toUpperCase() + l.slice(1));

/**
 * Matches an embedded `## Executive Brief <Lang>` carrier section: the
 * heading line through every following line up to (but excluding) the
 * next `<h2>`. Mirrors the line-anchored sweep used by
 * `stripBodyDuplicateSections` so `###`/`# `/code-fence lines inside the
 * section are consumed while the next `## ` boundary stops the match.
 * The required `<Lang>` suffix means the canonical unsuffixed
 * `## Executive Brief` lead heading is preserved.
 */
const EMBEDDED_BRIEF_SECTION_RE = new RegExp(
  String.raw`^##\s+Executive Brief (?:${LOCALIZED_BRIEF_TITLE_SUFFIXES.join('|')})\b[^\n]*\n(?:(?!^##\s)[^\n]*\n?)*`,
  'gim',
);

/**
 * Strip all embedded `## Executive Brief <Lang>` carrier sections from an
 * article-markdown body. Applied for every language, English included.
 */
export function stripEmbeddedLocalizedBriefSections(content: string): string {
  const stripped = content.replace(EMBEDDED_BRIEF_SECTION_RE, '');
  // Collapse the blank-line run left where the carrier block used to sit.
  return `${stripped.replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

interface LeadBounds {
  readonly headingLine: string;
  readonly firstH2: number;
  readonly secondH2: number;
}

/** Locate the first and second `## ` (h2) line indices in a markdown body. */
function findLeadBounds(lines: readonly string[]): LeadBounds | null {
  let firstH2 = -1;
  let secondH2 = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s/.test(lines[i]!)) {
      if (firstH2 === -1) {
        firstH2 = i;
      } else {
        secondH2 = i;
        break;
      }
    }
  }
  if (firstH2 === -1) return null;
  return { headingLine: lines[firstH2]!, firstH2, secondH2 };
}

/**
 * Replace the body of the first `<h2>` lead section with `localizedBody`,
 * keeping the original heading and repointing the provenance comment at
 * `executive-brief_<lang>.md`.
 */
function replaceLeadSectionBody(
  content: string,
  lang: Language,
  localizedBody: string,
  subfolderRepoRelPath: string,
): string {
  const lines = content.split('\n');
  const bounds = findLeadBounds(lines);
  if (!bounds) return content;

  const sourceRel = `executive-brief_${lang}.md`;
  const sourceUrl = subfolderRepoRelPath
    ? buildGithubBlobUrl(`${subfolderRepoRelPath}/${sourceRel}`)
    : sourceRel;

  const before = lines.slice(0, bounds.firstH2);
  const after = bounds.secondH2 === -1 ? [] : lines.slice(bounds.secondH2);

  const leadBlock = [
    bounds.headingLine,
    `<!-- source: ${sourceRel} :: ${sourceUrl} -->`,
    '',
    localizedBody.trim(),
    '',
  ];

  return [...before, ...leadBlock, ...after].join('\n');
}

export interface LocalizeExecutiveBriefLeadInput {
  /** Article-markdown body (front-matter already removed). */
  readonly content: string;
  /** Target language. */
  readonly lang: Language;
  /** Raw `executive-brief_<lang>.md` markdown when one exists on disk. */
  readonly localizedBriefMarkdown?: string;
  /** Repo-relative analysis folder, used to rewrite relative links. */
  readonly subfolderRepoRelPath?: string;
}

/**
 * Localize the on-page executive-brief lead and strip embedded carrier
 * sections. See the module JSDoc for the full contract.
 */
export function localizeExecutiveBriefLead(
  input: LocalizeExecutiveBriefLeadInput,
): string {
  const stripped = stripEmbeddedLocalizedBriefSections(input.content);

  // English keeps the canonical `## What Happened` lead verbatim.
  if (input.lang === 'en') return stripped;

  const brief = input.localizedBriefMarkdown;
  if (!brief || brief.trim().length === 0) return stripped;

  const cleaned = rewriteRelativeLinks(
    cleanArtifactBody(brief),
    input.subfolderRepoRelPath ?? '',
  );
  if (cleaned.trim().length === 0) return stripped;

  return replaceLeadSectionBody(
    stripped,
    input.lang,
    cleaned,
    input.subfolderRepoRelPath ?? '',
  );
}
