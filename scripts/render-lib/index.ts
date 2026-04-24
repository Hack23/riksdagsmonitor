/**
 * @module Infrastructure/RenderLib
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Shared HTML chrome + analysis → markdown aggregator + markdown → HTML renderer
 *
 * @description
 * Single source of truth for the article pipeline:
 *
 * 1. {@link aggregateAnalysis} — concatenates the canonical markdown analysis
 *    artifacts under `analysis/daily/$DATE/$SUB/` into one publish-ready
 *    `article.md` in the deterministic narrative order defined by the
 *    project (executive-brief first, methodology-reflection last). Strips
 *    duplicated H1s, YAML front-matter, and template footers. Rewrites
 *    relative links to absolute GitHub blob URLs so the rendered article
 *    stays auditable.
 *
 * 2. {@link renderArticleHtml} — turns an aggregated `article.md` into a
 *    fully chrome-wrapped HTML page. Uses the `unified` → `remark` →
 *    `rehype` pipeline, supports GFM, slug anchors, auto-link headings,
 *    and renders Mermaid code fences as lightweight `<pre class="mermaid">`
 *    blocks that are upgraded to SVG by the site's mermaid client loader
 *    at page load time (no build-time Puppeteer/Playwright dependency,
 *    no JS framework — matches the static-site cyberpunk theme).
 *
 * 3. {@link buildChrome} — shared header/footer/nav/SEO chrome used by
 *    articles, the `political-intelligence` index, and sitemaps. Reuses
 *    `LANGUAGE_META` + `escapeHtml` from `generate-sitemap-html.ts`.
 *
 * All article generation code in this repository MUST go through these
 * three entry points. Articles are derived 100% from real analysis
 * artifacts under `analysis/daily/$DATE/$SUB/` — there are no template
 * placeholders or scaffold-and-fill steps in the pipeline.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';

import type { Language } from '../types/language.js';
import { LANGUAGE_META, escapeHtml } from '../generate-sitemap-html.js';
import {
  BASE_URL,
  GITHUB_BLOB,
  GITHUB_TREE,
  ROOT_DIR,
  ANALYSIS_DIR,
  METHODOLOGIES_DIR,
  TEMPLATES_DIR,
  DAILY_DIR,
  LANGUAGES,
} from './constants.js';

export { LANGUAGE_META, escapeHtml };

// Re-export filesystem + URL constants so every existing consumer that
// imports them from `./render-lib/index.js` keeps working untouched.
export {
  BASE_URL,
  GITHUB_BLOB,
  GITHUB_TREE,
  ROOT_DIR,
  ANALYSIS_DIR,
  METHODOLOGIES_DIR,
  TEMPLATES_DIR,
  DAILY_DIR,
  LANGUAGES,
};

// ---------------------------------------------------------------------------
// URL helpers — shared across the article pipeline + political-intelligence page.
// ---------------------------------------------------------------------------

export function buildGithubBlobUrl(repoRelativePath: string): string {
  return `${GITHUB_BLOB}/${repoRelativePath.replace(/^\/+/, '')}`;
}

export function buildGithubTreeUrl(repoRelativePath: string): string {
  return `${GITHUB_TREE}/${repoRelativePath.replace(/^\/+/, '')}`;
}

// ---------------------------------------------------------------------------
// Aggregation — concat analysis artifacts into a single article.md
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

// ---------------------------------------------------------------------------
// Markdown → HTML rendering
// ---------------------------------------------------------------------------

/**
 * Relax the default rehype-sanitize schema so the Mermaid `<pre class="mermaid">`
 * wrapper and the anchor-link icon injected by rehype-autolink-headings survive
 * sanitisation. Anything else continues to be scrubbed — no inline `<script>`,
 * no `javascript:` URLs, no `<iframe>`, no `<style>` tags.
 */
const sanitizeSchema: typeof defaultSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    pre: [...(defaultSchema.attributes?.pre ?? []), ['className', 'mermaid']],
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-/], ['className', 'mermaid']],
    a: [...(defaultSchema.attributes?.a ?? []), ['className', 'anchor', 'heading-anchor'], 'ariaHidden', 'tabIndex'],
    span: [...(defaultSchema.attributes?.span ?? []), ['className', 'icon', 'icon-link']],
    h1: [...(defaultSchema.attributes?.h1 ?? []), 'id'],
    h2: [...(defaultSchema.attributes?.h2 ?? []), 'id'],
    h3: [...(defaultSchema.attributes?.h3 ?? []), 'id'],
    h4: [...(defaultSchema.attributes?.h4 ?? []), 'id'],
    h5: [...(defaultSchema.attributes?.h5 ?? []), 'id'],
    h6: [...(defaultSchema.attributes?.h6 ?? []), 'id'],
  },
};

/**
 * Convert the Markdown body to sanitised HTML. Mermaid code fences are
 * translated to `<pre class="mermaid">` at the remark stage so the
 * site's client-side mermaid loader (in `js/lib/mermaid-init.js`) can
 * render them after page load. This avoids a build-time Puppeteer
 * dependency while still giving readers a rich diagram.
 */
export async function renderMarkdownToHtml(markdownBody: string): Promise<string> {
  // Swap ```mermaid fences for <pre class="mermaid"> blocks before remark
  // parses the content so that rehype-sanitize keeps them intact.
  const preProcessed = markdownBody.replace(
    /```mermaid\n([\s\S]*?)```/g,
    (_m, diagram: string) => {
      const escaped = escapeHtml(diagram.trimEnd());
      return `\n<pre class="mermaid" data-mermaid-source="true">${escaped}</pre>\n`;
    },
  );

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['anchor'], ariaHidden: 'true', tabIndex: -1 },
      content: { type: 'text', value: '' },
    })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify, { allowDangerousHtml: false });

  const file = await processor.process(preProcessed);
  return String(file);
}

// ---------------------------------------------------------------------------
// HTML chrome (header / footer / SEO)
// ---------------------------------------------------------------------------

export interface ChromeOptions {
  readonly lang: Language;
  readonly title: string;
  readonly description: string;
  readonly keywords?: string;
  /** Canonical filename in the site root, e.g. `news/2026-04-23/propositions-en.html`. */
  readonly canonicalPath: string;
  /** Per-language alternate paths. If omitted, chrome only emits the current one. */
  readonly hreflangAlternates?: Partial<Record<Language, string>>;
  /** ISO-8601 date for `article:published_time`. */
  readonly publishedIso?: string;
  /** ISO-8601 date for `article:modified_time` / `og:updated_time`. */
  readonly modifiedIso?: string;
  /** JSON-LD blob(s) appended inside `<head>`. Already-stringified objects. */
  readonly jsonLd?: readonly unknown[];
  /** Extra `<meta>` / `<link>` lines to splice into `<head>`. */
  readonly extraHead?: string;
  /** Inline `<style>` body, appended verbatim. */
  readonly extraStyle?: string;
  /** Prebuilt breadcrumb nav HTML (skipped if empty). */
  readonly breadcrumbHtml?: string;
  /** Section identifier (og:article:section). */
  readonly section?: string;
  /** RSS feed URL, defaults to `/rss.xml`. */
  readonly rssHref?: string;
}

function renderHreflangBlock(
  current: Language,
  canonicalPath: string,
  alternates: Partial<Record<Language, string>> | undefined,
): string {
  if (!alternates) {
    return [
      `    <link rel="alternate" hreflang="${LANGUAGE_META[current].hreflang}" href="${BASE_URL}/${canonicalPath}">`,
      `    <link rel="canonical" href="${BASE_URL}/${canonicalPath}">`,
    ].join('\n');
  }
  const lines: string[] = [];
  for (const l of LANGUAGES) {
    const href = alternates[l];
    if (!href) continue;
    lines.push(
      `    <link rel="alternate" hreflang="${LANGUAGE_META[l].hreflang}" href="${BASE_URL}/${href}">`,
    );
  }
  const enHref = alternates.en ?? canonicalPath;
  lines.push(`    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/${enHref}">`);
  lines.push(`    <link rel="canonical" href="${BASE_URL}/${canonicalPath}">`);
  return lines.join('\n');
}

export function renderChromeHead(opts: ChromeOptions): string {
  const meta = LANGUAGE_META[opts.lang];
  const keywords = opts.keywords ?? 'Riksdagsmonitor, Swedish Parliament, political intelligence, OSINT, Riksdagen';
  const published = opts.publishedIso ?? new Date().toISOString();
  const modified = opts.modifiedIso ?? published;
  const jsonLdBlocks = (opts.jsonLd ?? [])
    .map((b) => `    <script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n');

  const alternateLocalesHtml = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => `    <meta property="og:locale:alternate" content="${LANGUAGE_META[l].locale}">`)
    .join('\n');

  const hreflangHtml = renderHreflangBlock(opts.lang, opts.canonicalPath, opts.hreflangAlternates);

  return `<!DOCTYPE html>
<html lang="${meta.hreflang}" dir="${meta.dir}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(opts.title)} — Riksdagsmonitor</title>
    <meta name="description" content="${escapeHtml(opts.description)}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="news_keywords" content="${escapeHtml(keywords)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="James Pether Sörling, CISSP, CISM">
    <meta name="publisher" content="Hack23 AB">
    <meta name="theme-color" content="#0a0e27">
    <meta name="color-scheme" content="dark light">
    <meta name="generator" content="riksdagsmonitor:scripts/render-lib">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta http-equiv="Content-Language" content="${meta.hreflang}">

    <link rel="preconnect" href="https://github.com" crossorigin>
    <link rel="dns-prefetch" href="https://github.com">
    <link rel="preconnect" href="https://www.hack23.com" crossorigin>

    <link rel="stylesheet" type="text/css" href="${depth(opts.canonicalPath)}styles.css">

${hreflangHtml}

    <link rel="sitemap" type="application/xml" href="/sitemap.xml">
    <link rel="alternate" type="application/rss+xml" title="Riksdagsmonitor news (${escapeHtml(meta.nativeName)})" href="${opts.rssHref ?? '/rss.xml'}">

    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Riksdagsmonitor">
    <meta property="og:title" content="${escapeHtml(opts.title)} — Riksdagsmonitor">
    <meta property="og:description" content="${escapeHtml(opts.description)}">
    <meta property="og:url" content="${BASE_URL}/${opts.canonicalPath}">
    <meta property="og:locale" content="${meta.locale}">
${alternateLocalesHtml}
    <meta property="og:image" content="${BASE_URL}/images/og-image.webp">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Riksdagsmonitor ${escapeHtml(opts.title)}">
    <meta property="og:updated_time" content="${modified}">

    <meta property="article:publisher" content="https://www.hack23.com">
    <meta property="article:section" content="${escapeHtml(opts.section ?? 'Political Intelligence')}">
    <meta property="article:modified_time" content="${modified}">
    <meta property="article:published_time" content="${published}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@riksdagsmonitor">
    <meta name="twitter:creator" content="@hack23ab">
    <meta name="twitter:title" content="${escapeHtml(opts.title)} — Riksdagsmonitor">
    <meta name="twitter:description" content="${escapeHtml(opts.description)}">
    <meta name="twitter:image" content="${BASE_URL}/images/og-image.webp">
    <meta name="twitter:image:alt" content="Riksdagsmonitor ${escapeHtml(opts.title)}">

    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
    <link rel="icon" href="/favicon.ico" sizes="48x48">
    <link rel="manifest" href="/site.webmanifest">

${jsonLdBlocks}
${opts.extraHead ?? ''}
${opts.extraStyle ? `    <style>${opts.extraStyle}</style>` : ''}
</head>`;
}

/** Compute the relative path prefix to reach the site root. */
function depth(canonicalPath: string): string {
  const clean = canonicalPath.replace(/^\/+/, '');
  const depthLevel = clean.split('/').length - 1;
  return depthLevel > 0 ? '../'.repeat(depthLevel) : '';
}

export interface SiteChrome {
  /** Entire `<!DOCTYPE html>…<head>…</head>` block. */
  readonly head: string;
  /** `<body>…<header>…</header>` block (skip-link + header + language switcher). */
  readonly headerHtml: string;
  /** `<footer>…</footer></body></html>` block. */
  readonly footerHtml: string;
}

export function buildChrome(opts: ChromeOptions): SiteChrome {
  const meta = LANGUAGE_META[opts.lang];
  const t = meta.translations;
  const prefix = depth(opts.canonicalPath);
  const indexFile = opts.lang === 'en' ? 'index.html' : `index_${opts.lang}.html`;
  const sitemapFile = opts.lang === 'en' ? 'sitemap.html' : `sitemap_${opts.lang}.html`;
  const piFile = opts.lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${opts.lang}.html`;
  const rssHref = opts.rssHref ?? (opts.lang === 'en' ? '/rss.xml' : `/rss_${opts.lang}.xml`);

  // Header dropdown (compact "more languages") — excludes the current
  // language (which is shown in the summary). When no explicit alternate
  // is provided for a given lang, fall back to the language homepage —
  // the article-renderer populates alternates for all 14 languages so
  // in practice every link here lands on a sibling article.
  const languageSwitcher = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = opts.hreflangAlternates?.[l] ?? (l === 'en' ? 'index.html' : `index_${l}.html`);
      return `          <a href="${prefix}${href}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}" role="menuitem"><span aria-hidden="true">${lm.flag}</span> ${lm.nativeName}</a>`;
    })
    .join('\n');

  // Footer inline lang-switcher (secondary, always-visible, not inside
  // <details>) — same hrefs but rendered as a flat row for accessibility.
  const footerLangRow = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = opts.hreflangAlternates?.[l] ?? (l === 'en' ? 'index.html' : `index_${l}.html`);
      return `          <a href="${prefix}${href}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}"><span aria-hidden="true">${lm.flag}</span> <span class="rm-lang-code">${lm.hreflang}</span></a>`;
    })
    .join('\n');

  const tagline = 'Swedish parliamentary intelligence · Open-source · Apache-2.0';
  const lastUpdatedIso = opts.modifiedIso ?? new Date().toISOString();
  const lastUpdatedDisplay = lastUpdatedIso.slice(0, 16).replace('T', ' ') + ' UTC';

  const headerHtml = `<body class="rm-article-body">
    <a class="skip-link" href="#main">${escapeHtml('Skip to main content')}</a>
    <header class="rm-site-header" role="banner">
      <div class="rm-site-header-inner">
        <a class="rm-logo" href="${prefix}${indexFile}" aria-label="Riksdagsmonitor ${escapeHtml(t.home)}">
          <span class="rm-logo-glyph" aria-hidden="true">🇸🇪</span>
          <span class="rm-logo-text">
            <span class="rm-logo-brand">Riksdagsmonitor</span>
            <span class="rm-logo-tagline">${escapeHtml(tagline)}</span>
          </span>
        </a>
        <nav class="rm-site-nav" aria-label="${escapeHtml(t.mainPlatform)}">
          <a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a>
          <a href="${prefix}${piFile}">${escapeHtml('Political Intelligence')}</a>
          <a href="${prefix}${sitemapFile}">${escapeHtml(t.siteMap)}</a>
        </nav>
        <details class="rm-lang-switcher">
          <summary aria-label="${escapeHtml(t.sitemapInOtherLanguages)}">
            <span aria-hidden="true">${meta.flag}</span>
            <span class="rm-lang-current-label">${escapeHtml(meta.nativeName)}</span>
            <span class="rm-lang-switcher-caret" aria-hidden="true">▾</span>
          </summary>
          <div class="rm-lang-switcher-dropdown" role="menu">
${languageSwitcher}
          </div>
        </details>
      </div>
      <div class="rm-site-subnav" aria-label="Article context">
        <nav class="rm-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a></li>
            <li><a href="${prefix}${piFile}">${escapeHtml('Political Intelligence')}</a></li>
            <li aria-current="page">${escapeHtml(opts.title)}</li>
          </ol>
        </nav>
        ${opts.publishedIso ? `<time class="rm-article-published" datetime="${opts.publishedIso}">${opts.publishedIso.slice(0, 10)}</time>` : ''}
      </div>
    </header>
${opts.breadcrumbHtml ?? ''}
    <main id="main" class="rm-article-main" tabindex="-1">`;

  const footerHtml = `    </main>
    <footer class="rm-site-footer" role="contentinfo">
      <div class="rm-site-footer-inner">
        <section class="rm-footer-col rm-footer-brand" aria-labelledby="rm-ft-about">
          <h2 id="rm-ft-about" class="rm-footer-heading">Riksdagsmonitor</h2>
          <p>${escapeHtml(meta.translations.mainPlatformDesc)}</p>
          <p class="rm-footer-attribution">
            Powered by
            <a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">CIA OSINT Platform</a>
            · Built by
            <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a>
          </p>
          <p class="rm-footer-updated"><small>Last updated: <time datetime="${lastUpdatedIso}">${escapeHtml(lastUpdatedDisplay)}</time></small></p>
        </section>
        <section class="rm-footer-col rm-footer-navigate" aria-labelledby="rm-ft-nav">
          <h2 id="rm-ft-nav" class="rm-footer-heading">${escapeHtml(t.resources)}</h2>
          <ul>
            <li><a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a></li>
            <li><a href="${prefix}${piFile}">${escapeHtml('Political Intelligence')}</a></li>
            <li><a href="${prefix}${sitemapFile}">${escapeHtml(t.siteMap)}</a></li>
            <li><a href="${rssHref}" type="application/rss+xml" rel="alternate"><span aria-hidden="true">📡</span> RSS feed</a></li>
            <li><a href="${GITHUB_TREE}/analysis" target="_blank" rel="noopener noreferrer">GitHub · analysis/</a></li>
            <li><a href="${GITHUB_TREE}" target="_blank" rel="noopener noreferrer">GitHub · source</a></li>
          </ul>
        </section>
        <section class="rm-footer-col rm-footer-trust" aria-labelledby="rm-ft-trust">
          <h2 id="rm-ft-trust" class="rm-footer-heading">Trust &amp; compliance</h2>
          <ul>
            <li><a href="${GITHUB_BLOB}/SECURITY.md" target="_blank" rel="noopener noreferrer">Security policy</a></li>
            <li><a href="${GITHUB_BLOB}/CRA-ASSESSMENT.md" target="_blank" rel="noopener noreferrer">EU CRA assessment</a></li>
            <li><a href="${GITHUB_BLOB}/THREAT_MODEL.md" target="_blank" rel="noopener noreferrer">Threat model</a></li>
            <li><a href="${GITHUB_BLOB}/TRANSLATION_GUIDE.md" target="_blank" rel="noopener noreferrer">Translation guide</a></li>
            <li><a href="${GITHUB_BLOB}/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">Hack23 ISMS policies</a></li>
          </ul>
        </section>
      </div>
      <nav class="rm-footer-langs" aria-label="Switch language">
        <span class="rm-footer-langs-label" aria-hidden="true">🌐</span>
${footerLangRow}
      </nav>
      <p class="rm-footer-legal">
        © ${new Date().getFullYear()} Hack23 AB · Apache-2.0 · Public political data only — GDPR Art. 9(2)(e,g). No cookies, no tracking, no advertising.
      </p>
    </footer>
    <script type="module" src="${prefix}js/lib/mermaid-init.mjs"></script>
    <script type="module" src="${prefix}js/back-to-top.js"></script>
  </body>
</html>
`;

  return {
    head: renderChromeHead(opts),
    headerHtml,
    footerHtml,
  };
}

// ---------------------------------------------------------------------------
// Public entry point — render a complete article HTML from an aggregated md.
// ---------------------------------------------------------------------------

export interface RenderArticleInput {
  /** Aggregated markdown (front-matter + body) produced by aggregateAnalysis. */
  readonly markdown: string;
  /** Language code. */
  readonly lang: Language;
  /** Canonical path (e.g. `news/2026-04-23/propositions-en.html`). */
  readonly canonicalPath: string;
  /** Hreflang alternates map (optional). */
  readonly hreflangAlternates?: Partial<Record<Language, string>>;
  /** Subfolder github tree link used in the analysis references block. */
  readonly subfolderRepoRelPath?: string;
  /** Ordered list of artifacts used (shown in the footer). */
  readonly artifactsUsed?: readonly string[];
}

export async function renderArticleHtml(input: RenderArticleInput): Promise<string> {
  const parsed = matter(input.markdown);
  const fm = parsed.data as Record<string, unknown>;
  const title = String(fm.title ?? 'Political Intelligence');
  const description = String(fm.description ?? 'Riksdagsmonitor political intelligence report.');
  const dateRaw = fm.date;
  let date: string;
  if (dateRaw instanceof Date) {
    date = dateRaw.toISOString().slice(0, 10);
  } else if (typeof dateRaw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateRaw)) {
    date = dateRaw.slice(0, 10);
  } else {
    date = new Date().toISOString().slice(0, 10);
  }
  const publishedIso = `${date}T00:00:00Z`;
  const modifiedIso = new Date().toISOString();

  const bodyHtml = await renderMarkdownToHtml(parsed.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    inLanguage: LANGUAGE_META[input.lang].hreflang,
    url: `${BASE_URL}/${input.canonicalPath}`,
    mainEntityOfPage: `${BASE_URL}/${input.canonicalPath}`,
    author: {
      '@type': 'Organization',
      name: 'Riksdagsmonitor (Hack23 AB)',
      url: 'https://www.hack23.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Hack23 AB',
      url: 'https://www.hack23.com',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png` },
    },
    isBasedOn: (input.artifactsUsed ?? []).map((a) => ({
      '@type': 'CreativeWork',
      url: input.subfolderRepoRelPath
        ? buildGithubBlobUrl(`${input.subfolderRepoRelPath}/${a}`)
        : a,
      name: a,
    })),
  };

  const chrome = buildChrome({
    lang: input.lang,
    title,
    description,
    canonicalPath: input.canonicalPath,
    hreflangAlternates: input.hreflangAlternates,
    publishedIso,
    modifiedIso,
    jsonLd: [jsonLd],
    section: 'Political Intelligence',
  });

  // Footer "Analysis sources" block — every artifact linked to GitHub.
  const sourcesList = (input.artifactsUsed ?? [])
    .map((a) => {
      const href = input.subfolderRepoRelPath
        ? buildGithubBlobUrl(`${input.subfolderRepoRelPath}/${a}`)
        : a;
      return `        <li><a href="${href}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(a)}</code></a></li>`;
    })
    .join('\n');
  const sourcesHtml = sourcesList ? `
      <section class="rm-article-sources" aria-labelledby="rm-article-sources-heading">
        <h2 id="rm-article-sources-heading">Analysis sources</h2>
        <p>This article is rendered 100% from the analysis artifacts below. Every section of the prose above is traceable to one of these source files on GitHub.</p>
        <ul class="rm-article-sources-list">
${sourcesList}
        </ul>
      </section>` : '';

  return `${chrome.head}
${chrome.headerHtml}
      <article class="rm-article" lang="${LANGUAGE_META[input.lang].hreflang}">
        <header class="rm-article-header">
          <h1>${escapeHtml(title)}</h1>
          <p class="rm-article-meta">
            <time datetime="${publishedIso}">${escapeHtml(date)}</time>
            · <span class="rm-article-lang">${LANGUAGE_META[input.lang].flag} ${LANGUAGE_META[input.lang].nativeName}</span>
          </p>
        </header>
        <div class="rm-article-body">
${bodyHtml}
        </div>
${sourcesHtml}
      </article>
${chrome.footerHtml}`;
}
