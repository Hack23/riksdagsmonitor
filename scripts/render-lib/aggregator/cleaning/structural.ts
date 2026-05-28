/**
 * @module Infrastructure/RenderLib/Aggregator/Cleaning/Structural
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Structural body cleaning + heading demotion + link rewriting
 *
 * @description
 * Last stage of the artifact-body cleaning pipeline. Depends on the three
 * leaf strippers ({@link ./admin-bylines.js | admin-bylines},
 * {@link ./process-meta.js | process-meta}, {@link ./pass-two.js | pass-two})
 * plus three reader-facing HTML-quality projections that are local to
 * this module:
 *
 * 1. **Heading demotion** ({@link demoteHeadings}) — every artifact body
 *    is wrapped under an aggregator-injected `## <Section title>`, so the
 *    *inner* `##`, `###`, … headings are demoted by one level (`##` →
 *    `###`, `###` → `####`, …, capped at `######`). Without this the
 *    rendered article ends up with ~170 H2s and a flat outline that
 *    violates WCAG 2.4.6 ("Headings and Labels") and the SEO
 *    heading-hierarchy contract documented in `Article-Generation.md`.
 * 2. **`_Source: file.md_` preamble removal** ({@link stripSourcePreamble})
 *    — the legacy aggregator used to inject this italic line under every
 *    section heading; it now lives in the Reader Intelligence Guide and
 *    the `## Article Sources` appendix.
 * 3. **Empty-paragraph collapse** — admin-byline removal can leave 3+
 *    consecutive blank lines and rendered HTML emits a stray `<p></p>`
 *    for each pair. Collapse 3+ blank lines to 2.
 *
 * {@link rewriteRelativeLinks} rewrites every relative `](file.md)` link
 * to an absolute GitHub blob URL so the rendered HTML — which lives at a
 * different path than the source artifacts — still has auditable
 * back-links to GitHub.
 *
 * {@link cleanArtifactBody} is the orchestrator that calls every stripper
 * in the canonical order and is the single entry point used by
 * {@link ../aggregate.js | aggregate.ts}.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import matter from 'gray-matter';

import { stripPassTwoSection } from './pass-two.js';
import { stripLeadingAdminBylines } from './admin-bylines.js';
import { stripProcessMetaLines } from './process-meta.js';
import { demoteHeadings } from './heading-demotion.js';
import { dedupeAdjacentDuplicateLines, collapseRepeatedFooterBlocks } from './deduplication.js';

/**
 * Remove `_Source: \`file.md\`_` (and `_Source: [\`file.md\`](url)_`)
 * italic preamble lines. Only strips lines that **start** with the
 * source marker — never inline mentions. Bracket-link variant is
 * matched explicitly to allow for the markdown link payload.
 */
export function stripSourcePreamble(body: string): string {
  return body
    .replace(/^_\s*Source:\s*\[?`[^\n]*?\n+/gim, '')
    .replace(/^_\s*Source:\s*[^\n]*_\s*$\n?/gim, '');
}

/**
 * Strip inline "Reader Intelligence Guide" blocks that may appear inside
 * individual artifact bodies. The canonical guide is emitted exactly once
 * by the aggregator immediately after the executive brief; any duplicates
 * baked into artifact markdown must be removed to guarantee the
 * single-occurrence invariant.
 *
 * Matches the **English** heading `## Reader Intelligence Guide` only.
 * Source artifacts are always authored in English; localised articles are
 * produced post-aggregation and never re-enter the cleaning pipeline, so
 * matching English alone is sufficient.
 *
 * Strips the heading, any preamble paragraph immediately below it, and the
 * contiguous markdown table that follows (header row + separator + data rows).
 * Content that appears after the table (e.g. subsequent paragraphs or
 * subheadings) is preserved.
 */
export function stripInlineReaderGuide(body: string): string {
  return body.replace(
    /^##\s+Reader Intelligence Guide[^\n]*\n(?:\n|(?!\|)[^\n]*\n)*(?:\|[^\n]*\n)*/gim,
    '',
  );
}

/**
 * First-use annotation state for {@link normalizeNarrativeTerminology}.
 *
 * The confidence-code gloss and the Riksdag-document-id contextualization are
 * *first-use only* — they must be emitted at most once per rendered article,
 * not once per artifact body. The aggregator calls
 * {@link normalizeNarrativeTerminology} separately for every artifact (see
 * `aggregate.ts`), so the flags cannot live as function-local state: they would
 * reset for each file and re-emit the annotation in every artifact that matches.
 * The caller therefore owns one state object for the whole article and threads
 * it through every call.
 */
export interface NarrativeNormalizationState {
  confidenceExplained: boolean;
  firstDocContextualized: boolean;
}

/** Fresh per-article first-use state (all flags unset). */
export function createNarrativeNormalizationState(): NarrativeNormalizationState {
  return { confidenceExplained: false, firstDocContextualized: false };
}

/**
 * Apply reader-facing narrative terminology normalization:
 * - replace BLUF headings with journalistic lede wording
 * - rename decision-support heading to plain-language wording
 * - explain confidence code notation at first mention
 * - contextualize the first `HDxxxxx` token as a Riksdag document id
 *
 * **Language scope.** Every rewrite below injects English copy (`Lede`,
 * `Decisions and confidence context`, `… confidence, corroborated by multiple
 * sources`, `Riksdag document #…`). Source analysis artifacts are authored in
 * English and only English bodies flow through the aggregator, so the rewrites
 * are gated to `lang === 'en'`. For any other language the body is returned
 * untouched to avoid injecting English strings into otherwise localized prose
 * (e.g. a translated `executive-brief_<lang>.md`).
 *
 * **First-use scope.** `confidenceExplained` / `firstDocContextualized` live on
 * the caller-supplied {@link NarrativeNormalizationState} so the first-use
 * annotations fire once per *article*, not once per artifact body.
 *
 * **Document-id scope.** Only the `HD` prefix is contextualized because it is
 * the sole *bare* Riksdag document-identifier token used in these artifacts
 * (matching `BILL_ID_RE` in `seo/brief-extractor.ts`, e.g. `HD03271`). Other
 * Riksdag references — propositions, motions, interpellations, written
 * questions, committee reports, public inquiries (`prop. 2025/26:267`,
 * `MOT 2023/24:1234`, `IP 2023/24:567`) — appear as session-scoped
 * `YYYY/NN:NNN` references whose trailing number is not a global document id,
 * so framing them as `Riksdag document #…` would be incorrect.
 */
export function normalizeNarrativeTerminology(
  body: string,
  state: NarrativeNormalizationState = createNarrativeNormalizationState(),
  lang: string = 'en',
): string {
  if (lang !== 'en') return body;

  let out = body.replace(
    /^(#{2,6})\s*(?:🎯\s*)?(?:BLUF(?:\s*\(Bottom Line Up Front\))?|Bottom Line Up Front)\s*$/gim,
    '$1 Lede',
  );
  out = out.replace(
    /^(#{2,6})\s*Decisions This Brief Supports\s*$/gim,
    '$1 Decisions and confidence context',
  );

  out = out.replace(/\b(HIGH|MEDIUM|LOW)\s*\(([A-C]\d)\)/g, (match, band: string, code: string) => {
    if (state.confidenceExplained) return match;
    state.confidenceExplained = true;
    const explanation =
      band === 'HIGH'
        ? 'high confidence, corroborated by multiple sources'
        : band === 'MEDIUM'
          ? 'medium confidence, partial corroboration'
          : 'low confidence, limited corroboration';
    return `${band} (${code}, ${explanation})`;
  });

  out = out.replace(/\b(HD(\d{5,}))\b/g, (match, fullId: string, numericId: string) => {
    if (state.firstDocContextualized) return match;
    state.firstDocContextualized = true;
    return `Riksdag document #${numericId} (${fullId})`;
  });

  return out;
}

// Re-exported from dedicated deduplication module (extracted for ≤200 LOC constraint).
export { dedupeAdjacentDuplicateLines, collapseRepeatedFooterBlocks } from './deduplication.js';

// Re-export from dedicated module (extracted for ≤200 LOC constraint).
export { demoteHeadings } from './heading-demotion.js';

// Re-export from dedicated module (extracted for ≤200 LOC constraint).
export { rewriteRelativeLinks } from './link-rewriting.js';

/**
 * Strip a leading YAML front-matter block, the first top-level H1 (it is
 * replaced by the injected `##` section heading), trailing template
 * boilerplate footers (`— End of template —`, `<!-- End of artifact -->`,
 * `Document control`, `Generated by …`), AI self-audit `## Pass 2 …`
 * sections (which carry process metadata, not article content), and
 * leading admin-byline paragraphs (`**Author**: … · **Run ID**: …`).
 *
 * Also performs three reader-facing HTML-quality projections — see the
 * module-level JSDoc above — applied after the structural strips so
 * they never remove signal.
 */
export function cleanArtifactBody(raw: string): string {
  const parsed = matter(raw);
  let body = parsed.content;
  // Strip Unicode bidi control marks (LRM/RLM/LRE/RLE/PDF/LRO/RLO/LRI/RLI/FSI/PDI)
  // that appear at the start of lines in many Arabic/Hebrew translated briefs.
  // These are invisible typesetting hints, but they break `^#{2,6}` / `^\*\s`
  // regex matching downstream (the SEO extraction cascade and bullet detection).
  // Removing them at line boundaries is safe — they carry no semantic content
  // and any subsequent rendering re-applies bidi based on the actual text runs.
  body = body.replace(/^[\u200E\u200F\u202A-\u202E\u2066-\u2069]+/gm, '');
  body = body.replace(/^\s*#\s+[^\n]*\n+/, '');
  body = body.replace(/^#+\s*Document control[\s\S]*$/im, '');
  body = body.replace(/^#+\s*Audit trail[\s\S]*$/im, '');
  body = body.replace(/^—\s*End of (template|artifact)\s*—[\s\S]*$/im, '');
  body = body.replace(/<!--\s*End of (template|artifact)[\s\S]*?-->/gi, '');
  body = body.replace(/^Generated by .*$/gim, '');
  body = body.replace(/^Run ID: .*$/gim, '');
  body = stripPassTwoSection(body);
  body = stripLeadingAdminBylines(body.trimStart());
  body = stripProcessMetaLines(body);
  body = stripSourcePreamble(body);
  body = stripInlineReaderGuide(body);
  body = collapseRepeatedFooterBlocks(body);
  body = dedupeAdjacentDuplicateLines(body);
  body = demoteHeadings(body);
  body = body.replace(/\n{3,}/g, '\n\n');
  return body.trim();
}
