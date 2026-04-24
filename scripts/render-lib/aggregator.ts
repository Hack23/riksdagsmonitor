/**
 * @module Infrastructure/RenderLib/Aggregator
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Analysis artifacts → aggregated article.md
 *
 * @description
 * Deterministic concatenator that turns a per-day per-subfolder set of
 * analysis artifacts under `analysis/daily/$DATE/$SUBFOLDER/` into one
 * publish-ready `article.md` with YAML front-matter. The aggregator is
 * **pure with respect to the filesystem** — given the same set of
 * artifact files on disk, it always produces byte-identical output.
 *
 * ## Narrative order
 * See {@link AGGREGATION_ORDER}. The order is intentionally fixed:
 * 1. `executive-brief.md` (mandatory — supplies title + description)
 * 2. `synthesis-summary.md`
 * 3. `intelligence-assessment.md` — ICD-203 Key Judgments centrepiece
 * 4. `significance-scoring.md`
 * 5. `stakeholder-perspectives.md`
 * 6. `swot-analysis.md`
 * 7. `risk-assessment.md`
 * 8. `threat-analysis.md`
 * 9. `documents/*-analysis.md` — inlined as "Per-document intelligence"
 * 10. `scenario-analysis.md` … `methodology-reflection.md` (see list)
 * 11. any remaining supplementary `*.md` not in the canonical list —
 *     appended alphabetically
 *
 * ## Cleaning rules (see {@link cleanArtifactBody})
 * - strip YAML front-matter
 * - strip the first H1 (replaced by an injected `## <section-title>`)
 * - strip `## Pass 2 …` AI self-audit trailing sections
 * - strip leading admin-byline paragraphs (`**Author**: … · **Run ID**: …`)
 * - strip `Document control` / `Audit trail` / `End of template` footers
 * - rewrite every relative `](path.md)` link to an absolute GitHub blob URL
 *
 * Round-4 architecture split: extracted from the monolithic
 * `render-lib/index.ts` (960 LOC → 4 leaf modules). No public API
 * change — `render-lib/index.ts` still re-exports everything below.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';

import { buildGithubBlobUrl } from './url-helpers.js';
import { GITHUB_BLOB } from './constants.js';

// ---------------------------------------------------------------------------
// Canonical narrative order + section titles
// ---------------------------------------------------------------------------

/**
 * Canonical narrative order. Each file is emitted as an `<h2>`-prefixed
 * section in the aggregated article. Unknown artifacts (e.g. supplementary
 * PESTLE / black-swan studies) are appended after the core sections in the
 * order they appear on disk.
 *
 * `documents/` is expanded separately — each per-document analysis becomes
 * its own subsection under the "Per-document intelligence" section.
 */
export const AGGREGATION_ORDER: readonly string[] = [
  'executive-brief.md',
  'synthesis-summary.md',
  'intelligence-assessment.md',
  'significance-scoring.md',
  'stakeholder-perspectives.md',
  'swot-analysis.md',
  'risk-assessment.md',
  'threat-analysis.md',
  // documents/* expanded inline here
  'scenario-analysis.md',
  'forward-indicators.md',
  'election-2026-analysis.md',
  'coalition-mathematics.md',
  'voter-segmentation.md',
  'comparative-international.md',
  'historical-parallels.md',
  'media-framing-analysis.md',
  'implementation-feasibility.md',
  'devils-advocate.md',
  'classification-results.md',
  'cross-reference-map.md',
  'methodology-reflection.md',
  'data-download-manifest.md',
];

/**
 * Human-readable English section titles for each artifact. The aggregator
 * emits these as `## <title>` headings so the rendered article has a
 * consistent outline independent of what the AI wrote inside the file.
 * Unknown files fall back to a title derived from the filename.
 */
const SECTION_TITLES: Record<string, string> = {
  'executive-brief.md': 'Executive Brief',
  'synthesis-summary.md': 'Synthesis Summary',
  'significance-scoring.md': 'Significance Scoring',
  'stakeholder-perspectives.md': 'Stakeholder Perspectives',
  'swot-analysis.md': 'SWOT Analysis',
  'risk-assessment.md': 'Risk Assessment',
  'threat-analysis.md': 'Threat Analysis',
  'election-2026-analysis.md': 'Election 2026 Analysis',
  'coalition-mathematics.md': 'Coalition Mathematics',
  'voter-segmentation.md': 'Voter Segmentation',
  'scenario-analysis.md': 'Scenario Analysis',
  'forward-indicators.md': 'Forward Indicators',
  'comparative-international.md': 'Comparative International',
  'historical-parallels.md': 'Historical Parallels',
  'media-framing-analysis.md': 'Media Framing Analysis',
  'implementation-feasibility.md': 'Implementation Feasibility',
  'devils-advocate.md': "Devil's Advocate",
  'intelligence-assessment.md': 'Intelligence Assessment — Key Judgments',
  'classification-results.md': 'Classification Results',
  'cross-reference-map.md': 'Cross-Reference Map',
  'methodology-reflection.md': 'Methodology Reflection & Limitations',
  'data-download-manifest.md': 'Data Download Manifest',
};

function prettifyFallbackTitle(file: string): string {
  const base = path.basename(file).replace(/\.md$/i, '');
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function titleForArtifact(file: string): string {
  const base = path.basename(file);
  return SECTION_TITLES[base] ?? prettifyFallbackTitle(base);
}

// ---------------------------------------------------------------------------
// Artifact body cleaning
// ---------------------------------------------------------------------------

/**
 * Regex matching an "AI self-audit" trailing section that must never reach
 * the published article. These are added by analysis agents during the
 * AI-FIRST Pass-2 iteration (see `00-base-contract.md` §5) and document
 * *how* the analysis was refined, not *what* it says. Matches, from a
 * heading like `## Pass 2 …` / `### Pass 2 …` / `## 🔁 Pass 2 …` /
 * `#### Pass 2 …`, all the way to either the next same-or-higher-level
 * `##`-or-`#` heading or end-of-file.
 */
const PASS_TWO_HEADING_RE =
  /^#{2,6}\s+(?:[^\n#]*?\s)?Pass\s*2\b[^\n]*$/gim;

/**
 * Bold-label admin-byline field names that commonly appear joined by
 * `·` / `—` / `-` / double-space separators at the top of an analysis
 * artifact. A paragraph made *entirely* of such fields is template
 * preamble, not prose — strip it. A paragraph that *starts* with one of
 * these fields but also contains real prose is left untouched.
 *
 * Expanded 2026-04-24 (per `seo-metadata-contract.md` §5) to also cover
 * the admin fields emitted by executive-brief / realtime templates
 * (`Brief ID`, `Prepared by`, `Prepared at`, `Analyst`, `Distribution`,
 * `Methodology`, `Cycle`, `Admiralty baseline`, `60-second read`,
 * `Reviewed by`, `Reviewer`, `Disseminated`, `Source`, `Dissemination`).
 * `**` wrapping is now optional so unbolded admin lines are also caught.
 */
const ADMIN_FIELD_RE =
  /^\*{0,2}(?:Author|Run\s*ID|Date|Classification|Confidence|Scope|Admiralty(?:\s*(?:range|baseline))?|Read[-\s]?time|Version|Status|Owner|Last\s*Updated|Generated|Brief\s*ID|Prepared\s*by|Prepared\s*at|Analyst|Distribution|Methodology|Cycle|60[-\s]?second\s*read|Reviewed\s*by|Reviewer|Disseminated|Source|Dissemination)\*{0,2}\s*:/i;

/**
 * Fragment splitter for admin-byline paragraphs. Splits only on
 * **structural** delimiters that genuinely separate distinct fields —
 * newlines, pipes (`|` / fullwidth `｜`), Japanese enumeration comma (`、`),
 * and long runs of whitespace. Deliberately does **not** split on `—` /
 * `·` / `–`, because those commonly appear *inside* admin-field values
 * (e.g. `**Classification**: Public — GDPR Art. 9(2)(e)`) and previously
 * let whole admin paragraphs escape the stripper.
 */
const ADMIN_FRAGMENT_SPLITTER = /\s*(?:\||｜|、|\n|\s{2,})\s*/;

/**
 * Strip the Pass-2 self-audit section (and anything after it) from a single
 * artifact body. The section extends from the Pass-2 heading through the
 * end of file, because it is always the last thing the agent writes.
 */
function stripPassTwoSection(body: string): string {
  // Use a fresh regex since PASS_TWO_HEADING_RE is /g-flagged.
  const re = /^#{1,6}\s+(?:[^\n#]*?\s)?Pass\s*2\b[^\n]*$/im;
  const match = body.match(re);
  if (!match || match.index === undefined) return body;
  return body.slice(0, match.index).replace(/\s+$/g, '') + '\n';
}

/**
 * Remove leading admin-byline paragraphs (those made up entirely of bold
 * `**Author**` / `**Run ID**` / `**Classification**` / `**Confidence**` /
 * … fields). Walks paragraph-by-paragraph from the top, stopping at the
 * first real-prose paragraph.
 */
function stripLeadingAdminBylines(body: string): string {
  const paragraphs = body.split(/\n\n+/);
  let skip = 0;
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) { skip += 1; continue; }
    // Structural-only delimiter — see ADMIN_FRAGMENT_SPLITTER JSDoc.
    const fragments = trimmed.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    const allAdmin = fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()));
    if (allAdmin && fragments.length > 0) {
      skip += 1;
      continue;
    }
    break;
  }
  return skip === 0 ? body : paragraphs.slice(skip).join('\n\n');
}

/**
 * Strip a leading YAML front-matter block, the first top-level H1 (it is
 * replaced by the injected `##` section heading), trailing template
 * boilerplate footers (`— End of template —`, `<!-- End of artifact -->`,
 * `Document control`, `Generated by …`), AI self-audit `## Pass 2 …`
 * sections (which carry process metadata, not article content), and
 * leading admin-byline paragraphs (`**Author**: … · **Run ID**: …`).
 */
function cleanArtifactBody(raw: string): string {
  const parsed = matter(raw);
  let body = parsed.content;
  // Strip first H1
  body = body.replace(/^\s*#\s+[^\n]*\n+/, '');
  // Strip repeated admin/footer blocks
  body = body.replace(/^#+\s*Document control[\s\S]*$/im, '');
  body = body.replace(/^#+\s*Audit trail[\s\S]*$/im, '');
  body = body.replace(/^—\s*End of (template|artifact)\s*—[\s\S]*$/im, '');
  body = body.replace(/<!--\s*End of (template|artifact)[\s\S]*?-->/gi, '');
  body = body.replace(/^Generated by .*$/gim, '');
  body = body.replace(/^Run ID: .*$/gim, '');
  // Strip AI self-audit "Pass 2 …" trailing section (any H1-H6, with or
  // without leading emoji), from the heading through end-of-artifact.
  body = stripPassTwoSection(body);
  // Strip leading admin-byline paragraphs (template preamble).
  body = stripLeadingAdminBylines(body.trimStart());
  // Collapse 3+ blank lines to 2
  body = body.replace(/\n{3,}/g, '\n\n');
  return body.trim();
}

/**
 * Rewrite relative `[label](path.md)` links in the aggregated markdown to
 * absolute GitHub blob URLs — the rendered HTML lives at a different path
 * than the source artifacts, so every link must be auditable back to
 * GitHub. Leaves absolute `http(s)://…` links untouched.
 */
function rewriteRelativeLinks(body: string, subfolderRepoRelPath: string): string {
  return body.replace(
    /\]\((?!https?:\/\/|#|mailto:)([^)]+)\)/g,
    (_match, target: string) => {
      const [pathPart, anchor] = target.split('#', 2) as [string, string | undefined];
      if (!pathPart) return `](${target})`;
      const resolved = path.posix.normalize(
        path.posix.join(subfolderRepoRelPath, pathPart),
      );
      const href = `${GITHUB_BLOB}/${resolved}` + (anchor ? `#${anchor}` : '');
      return `](${href})`;
    },
  );
}

// Expose admin-byline and pass-2 regex constants and internal helpers for
// tests. These are NOT part of the stable public API — they exist only to
// let `tests/render-lib.test.ts` exercise every branch without re-implementing
// the transforms. Downstream scripts must import the *public* exports
// (`aggregateAnalysis`, `renderArticleHtml`, …) instead.
//
// NB: the `__test__` barrel lives *after* every helper it references so
// block-scoped `const`s declared later in the file (e.g.
// {@link SENTENCE_END_RE}, {@link truncateToSentenceBoundary}) are
// already initialised.

// ---------------------------------------------------------------------------
// Public aggregator API
// ---------------------------------------------------------------------------

export interface AggregationInput {
  /** Absolute path to `analysis/daily/$DATE/$SUBFOLDER`. */
  readonly subfolderAbsPath: string;
  /** Repo-relative path (e.g. `analysis/daily/2026-04-23/propositions`). */
  readonly subfolderRepoRelPath: string;
  /** `$DATE` (YYYY-MM-DD). */
  readonly date: string;
  /** `$SUBFOLDER` (e.g. `propositions`). */
  readonly subfolder: string;
}

export interface AggregationResult {
  /** Generated aggregated markdown (with YAML front-matter). */
  readonly markdown: string;
  /** Ordered list of artifact files consumed (relative to subfolder). */
  readonly artifactsUsed: readonly string[];
  /** First H1 from `executive-brief.md`, used as the article title. */
  readonly title: string;
  /** First non-empty paragraph from `executive-brief.md`, used as description. */
  readonly description: string;
}

function readFirstHeading(markdown: string): string | null {
  const match = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

/**
 * Sentence-terminator set used by {@link truncateToSentenceBoundary}.
 * Covers Latin (`.`, `!`, `?`), Chinese/Japanese full stop (`。`),
 * Devanagari danda (`।`), and the Unicode horizontal ellipsis (`…`).
 */
const SENTENCE_END_RE = /[.!?…。।]/g;

/**
 * Truncate a string to the longest sentence-terminated prefix whose
 * length is ≤ `hardMax`, preferring a break ≥ `softMin`. Never cuts
 * mid-word. Used for `<meta description>` so Google never renders a
 * truncated last token with a trailing ellipsis.
 *
 * Implements `seo-metadata-contract.md` §3.1: EN target window
 * 140-200 chars; shorter languages use their own windows but go
 * through the same sentence-preserving logic.
 *
 * @param text    Input prose (markdown emphasis already stripped).
 * @param softMin Soft minimum — prefer truncating at or after this
 *                length (default 140).
 * @param hardMax Hard maximum — never return more than this many chars
 *                (default 200).
 */
function truncateToSentenceBoundary(
  text: string,
  softMin: number = 140,
  hardMax: number = 200,
): string {
  const normalised = text.replace(/\s+/g, ' ').trim();
  if (normalised.length <= hardMax) return normalised;

  // Find every sentence-end position in the prefix within hardMax.
  const window = normalised.slice(0, hardMax + 1);
  SENTENCE_END_RE.lastIndex = 0;
  const ends: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = SENTENCE_END_RE.exec(window)) !== null) {
    ends.push(m.index + m[0].length);
  }

  // Prefer the last sentence end that is ≥ softMin and ≤ hardMax.
  for (let i = ends.length - 1; i >= 0; i -= 1) {
    const end = ends[i]!;
    if (end >= softMin && end <= hardMax) return normalised.slice(0, end).trim();
  }

  // No sentence end in window — fall back to last word boundary
  // before hardMax, appending a true Unicode ellipsis so the cut is
  // intentional rather than mid-word.
  const sliced = normalised.slice(0, hardMax);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace >= softMin) return sliced.slice(0, lastSpace).trim() + '…';
  return sliced.trim() + '…';
}

/**
 * Return the first prose paragraph that immediately follows a `## 🎯 BLUF`
 * (or `## BLUF`, case-insensitive) heading in an executive-brief. This is
 * the paragraph editors already wrote as the article's lede, so it is
 * preferred over the first paragraph of the document (which is often the
 * admin-metadata block).
 *
 * Returns `null` if the brief has no BLUF heading.
 */
function readBlufParagraph(markdown: string): string | null {
  const body = cleanArtifactBody(markdown);
  // Match `## BLUF`, `## 🎯 BLUF`, `### BLUF` — any heading containing
  // the token `BLUF` as a standalone word. Case-insensitive. Consume
  // the heading line and any immediately-following blank line.
  const blufMatch = body.match(/^#{2,6}\s+(?:[^\n]*?\s)?BLUF\b[^\n]*\n+/im);
  if (!blufMatch || blufMatch.index === undefined) return null;
  const after = body.slice(blufMatch.index + blufMatch[0].length);
  // Take paragraph-by-paragraph, skip non-prose, stop at first match.
  const paragraphs = after.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    if (/^#+\s/.test(p)) break;                   // hit next heading — give up
    if (/^<!--/.test(p)) continue;
    if (/^\|/.test(p)) continue;
    if (/^```/.test(p)) continue;
    if (/^[>*]\s/.test(p)) continue;
    const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    return p.replace(/[*_`]/g, '').replace(/\s+/g, ' ');
  }
  return null;
}

function readFirstParagraph(markdown: string): string | null {
  const body = cleanArtifactBody(markdown);
  const lines = body.split(/\n\n/).map((p) => p.trim()).filter(Boolean);
  for (const p of lines) {
    if (/^#+\s/.test(p)) continue;               // skip headings
    if (/^<!--/.test(p)) continue;               // skip HTML comments
    if (/^\|/.test(p)) continue;                 // skip tables
    if (/^```/.test(p)) continue;                // skip code fences
    if (/^[>*]\s/.test(p)) continue;             // skip blockquotes / bullet-only lines
    // Structural-only delimiter (see ADMIN_FRAGMENT_SPLITTER JSDoc).
    const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    // Strip markdown emphasis for the meta description.
    return p.replace(/[*_`]/g, '').replace(/\s+/g, ' ');
  }
  return null;
}

/**
 * Scrub boilerplate from the raw H1 of an executive-brief so it can be
 * used as the article `<title>`. Per `seo-metadata-contract.md` §2:
 *
 * - strip a leading `Executive Brief — ` / `Executive Brief - ` prefix
 *   (the template boilerplate that masks the story)
 * - strip a trailing ` — YYYY-MM-DD` / ` - YYYY-MM-DD` / ` YYYY-MM-DD`
 *   (dates belong in `article:published_time`, not the SERP title)
 * - if the cleaned title is < 20 chars — too short to be a real story
 *   headline — return `null` so the caller can fall back to a BLUF
 *   sentence or to the fallback subfolder-based title.
 */
function cleanArticleTitle(raw: string | null): string | null {
  if (!raw) return null;
  let t = raw.trim();
  // Strip boilerplate prefixes (en-dash, em-dash, hyphen) — keep the story.
  t = t.replace(/^(?:Executive\s+Brief|Intelligence\s+Brief|Intelligence\s+Assessment|Realtime\s+Monitor|Riksdag\s+Realtime\s+Monitor|Daily\s+Brief)\s*[—–\-:]\s*/i, '');
  // Strip trailing ISO date (with or without a separator).
  t = t.replace(/\s*[—–\-:]?\s*\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{1,2}[:\-.]\d{2}(?:\s*UTC)?)?\s*$/i, '');
  t = t.replace(/\s+/g, ' ').trim();
  if (t.length < 20) return null;
  return t;
}

/**
 * Synthesise a title from a BLUF sentence when the H1 is too boilerplate
 * to use directly. Takes the first sentence of `bluf` (or up to `maxLen`
 * chars at a word boundary), strips markdown emphasis, trims to a clean
 * ≤ `maxLen`-char fragment. Returns `null` if no usable sentence exists.
 */
function titleFromBluf(bluf: string | null, maxLen: number = 70): string | null {
  if (!bluf) return null;
  const clean = bluf.replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  // Take the first sentence (bounded by . ! ? 。) — but never exceed maxLen.
  SENTENCE_END_RE.lastIndex = 0;
  const m = SENTENCE_END_RE.exec(clean);
  const firstSentence = m ? clean.slice(0, m.index + m[0].length) : clean;
  if (firstSentence.length <= maxLen) return firstSentence.replace(/\s*[.!?…。।]+\s*$/, '').trim();
  // First sentence too long — take word-boundary prefix ≤ maxLen.
  const sliced = firstSentence.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 30 ? sliced.slice(0, lastSpace) : sliced).trim();
}

export function aggregateAnalysis(input: AggregationInput): AggregationResult {
  const { subfolderAbsPath, subfolderRepoRelPath, date, subfolder } = input;
  if (!fs.existsSync(subfolderAbsPath)) {
    throw new Error(`Analysis subfolder not found: ${subfolderAbsPath}`);
  }

  const sections: string[] = [];
  const used: string[] = [];

  const readSection = (fileName: string, skipIfMissing: boolean): void => {
    const abs = path.join(subfolderAbsPath, fileName);
    if (!fs.existsSync(abs)) {
      if (!skipIfMissing) {
        throw new Error(`Required artifact missing: ${subfolderRepoRelPath}/${fileName}`);
      }
      return;
    }
    const raw = fs.readFileSync(abs, 'utf8');
    const clean = rewriteRelativeLinks(cleanArtifactBody(raw), subfolderRepoRelPath);
    if (!clean) return;
    const title = titleForArtifact(fileName);
    const sourceUrl = buildGithubBlobUrl(`${subfolderRepoRelPath}/${fileName}`);
    sections.push(
      `## ${title}\n\n` +
      `_Source: [\`${fileName}\`](${sourceUrl})_\n\n` +
      clean,
    );
    used.push(fileName);
  };

  // 1. Executive brief is mandatory — both title and description derive from it.
  const briefPath = path.join(subfolderAbsPath, 'executive-brief.md');
  if (!fs.existsSync(briefPath)) {
    throw new Error(`Aggregation requires executive-brief.md in ${subfolderRepoRelPath}`);
  }
  const briefRaw = fs.readFileSync(briefPath, 'utf8');

  // Description: prefer the `## 🎯 BLUF` paragraph (editors write this as the
  // publishable lede), fall back to the first prose paragraph. Always run
  // through the sentence-aware truncator so SERP snippets never end mid-word.
  // See `seo-metadata-contract.md` §3.
  const rawBlufParagraph = readBlufParagraph(briefRaw);
  const rawFirstParagraph = readFirstParagraph(briefRaw);
  const rawDescriptionSource =
    rawBlufParagraph ||
    rawFirstParagraph ||
    `Evidence-based political intelligence analysis for ${subfolder} on ${date}.`;
  const description = truncateToSentenceBoundary(rawDescriptionSource);

  // Title: strip boilerplate prefix (`Executive Brief — `) and trailing
  // ISO date from the H1. If the cleaned title is too short to be a real
  // story headline, synthesise one from the first BLUF sentence. If that
  // also fails, fall back to the legacy `<subfolder> — <date>` string.
  // See `seo-metadata-contract.md` §2.
  const title =
    cleanArticleTitle(readFirstHeading(briefRaw)) ||
    titleFromBluf(rawBlufParagraph ?? rawFirstParagraph) ||
    `${prettifyFallbackTitle(subfolder)} — ${date}`;

  // 2. Emit the canonical narrative order, expanding documents/ between
  //    threat-analysis and election-2026-analysis.
  for (const fileName of AGGREGATION_ORDER) {
    readSection(fileName, fileName !== 'executive-brief.md');
    if (fileName === 'threat-analysis.md') {
      // Inject per-document analyses as one merged section.
      const docsDir = path.join(subfolderAbsPath, 'documents');
      if (fs.existsSync(docsDir)) {
        const docFiles = fs.readdirSync(docsDir)
          .filter((f) => /\.md$/i.test(f))
          .sort();
        if (docFiles.length > 0) {
          const perDocSections: string[] = [];
          for (const df of docFiles) {
            const abs = path.join(docsDir, df);
            const raw = fs.readFileSync(abs, 'utf8');
            const clean = rewriteRelativeLinks(
              cleanArtifactBody(raw),
              `${subfolderRepoRelPath}/documents`,
            );
            if (!clean) continue;
            const dokId = df.replace(/-analysis\.md$/i, '').replace(/\.md$/i, '');
            const sourceUrl = buildGithubBlobUrl(
              `${subfolderRepoRelPath}/documents/${df}`,
            );
            perDocSections.push(
              `### ${escapeInlineMd(dokId)}\n\n` +
              `_Source: [\`documents/${df}\`](${sourceUrl})_\n\n` +
              clean,
            );
            used.push(`documents/${df}`);
          }
          if (perDocSections.length > 0) {
            sections.push(
              `## Per-document intelligence\n\n` +
              perDocSections.join('\n\n'),
            );
          }
        }
      }
    }
  }

  // 3. Any remaining *.md in the subfolder (supplementary artifacts such as
  //    pestle-analysis.md, wildcards-blackswans.md, ext/*.md …) that are not
  //    yet listed — append after the core set, in alphabetical order.
  //    Exclude README.md, article.md (aggregator output), and any language-
  //    specific article.<lang>.md written by news-translate; otherwise the
  //    aggregator embeds its own output on the next run.
  const allMd = fs.readdirSync(subfolderAbsPath)
    .filter((f) => /\.md$/i.test(f))
    .filter((f) => f !== 'README.md')
    .filter((f) => !/^article(?:\.[a-z-]+)?\.md$/i.test(f))
    .sort();
  for (const f of allMd) {
    if (used.includes(f)) continue;
    if (AGGREGATION_ORDER.includes(f)) continue;
    readSection(f, true);
  }

  // 4. Compose final markdown with YAML front-matter.
  const now = new Date();
  const slug = `${date}-${subfolder}`;
  const frontMatter = [
    '---',
    `title: "${escapeYaml(title)}"`,
    `description: "${escapeYaml(description)}"`,
    `date: ${date}`,
    `subfolder: ${subfolder}`,
    `slug: ${slug}`,
    `source_folder: ${subfolderRepoRelPath}`,
    `generated_at: ${now.toISOString()}`,
    'language: en',
    'layout: article',
    '---',
    '',
  ].join('\n');

  const body = sections.join('\n\n');

  return {
    markdown: frontMatter + body + '\n',
    artifactsUsed: used,
    title,
    description,
  };
}

function escapeInlineMd(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

function escapeYaml(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

// ---------------------------------------------------------------------------
// Test-only exports — see note above the placeholder at the top of the
// "Public aggregator API" section.
// ---------------------------------------------------------------------------
export const __test__ = {
  PASS_TWO_HEADING_RE,
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
  SENTENCE_END_RE,
  stripPassTwoSection,
  stripLeadingAdminBylines,
  cleanArtifactBody,
  rewriteRelativeLinks,
  prettifyFallbackTitle,
  readFirstHeading,
  readFirstParagraph,
  readBlufParagraph,
  truncateToSentenceBoundary,
  cleanArticleTitle,
  titleFromBluf,
  escapeYaml,
  escapeInlineMd,
};
