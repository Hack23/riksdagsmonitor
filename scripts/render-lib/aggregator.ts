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
 */
const ADMIN_FIELD_RE =
  /^\*\*(?:Author|Run\s*ID|Date|Classification|Confidence|Scope|Admiralty(?:\s*range)?|Read[-\s]?time|Version|Status|Owner|Last\s*Updated|Generated)\*\*\s*:/i;

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
    // Split on the common admin separators to test every field-fragment.
    const fragments = trimmed.split(/\s*(?:·|—|–|-{2,}|\s{2,}|\n)\s*/);
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
export const __test__ = {
  PASS_TWO_HEADING_RE,
  ADMIN_FIELD_RE,
  stripPassTwoSection,
  stripLeadingAdminBylines,
  cleanArtifactBody,
  rewriteRelativeLinks,
  prettifyFallbackTitle,
  readFirstHeading,
  readFirstParagraph,
  escapeYaml,
  escapeInlineMd,
};

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

function readFirstParagraph(markdown: string): string | null {
  const body = cleanArtifactBody(markdown);
  const lines = body.split(/\n\n/).map((p) => p.trim()).filter(Boolean);
  for (const p of lines) {
    if (/^#+\s/.test(p)) continue;               // skip headings
    if (/^<!--/.test(p)) continue;               // skip HTML comments
    if (/^\|/.test(p)) continue;                 // skip tables
    if (/^```/.test(p)) continue;                // skip code fences
    if (/^[>*]\s/.test(p)) continue;             // skip blockquotes / bullet-only lines
    // Skip a paragraph whose fragments are entirely admin bylines.
    const fragments = p.split(/\s*(?:·|—|–|-{2,}|\s{2,}|\n)\s*/);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    // Strip markdown emphasis for the meta description.
    return p.replace(/[*_`]/g, '').replace(/\s+/g, ' ').slice(0, 300);
  }
  return null;
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
  const title =
    readFirstHeading(briefRaw) ||
    `${prettifyFallbackTitle(subfolder)} — ${date}`;
  const description =
    readFirstParagraph(briefRaw) ||
    `Evidence-based political intelligence analysis for ${subfolder} on ${date}.`;

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
