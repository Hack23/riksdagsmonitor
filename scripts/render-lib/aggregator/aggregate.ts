/**
 * @module Infrastructure/RenderLib/Aggregator/Aggregate
 * @category Intelligence Operations / Supporting Infrastructure
 * @name `aggregateAnalysis()` orchestrator (slim)
 *
 * @description
 * Top-level orchestrator that turns a per-day per-subfolder set of
 * analysis artifacts under `analysis/daily/$DATE/$SUBFOLDER/` into one
 * publish-ready `article.md` with YAML front-matter. Pure with respect
 * to the filesystem — given the same set of artifact files on disk, it
 * always produces byte-identical output.
 *
 * ## Narrative order (reader-intelligence-first projection)
 * The order is intentionally fixed to surface high-value political-
 * intelligence lenses before technical audit appendices. The executive
 * brief opens the article so a reader gets BLUF + so-what context
 * **before** the navigation table tells them where to jump next. See
 * {@link ./order.js#AGGREGATION_ORDER} for the full list.
 *
 * Round-5 split: this orchestrator delegates to twelve focused leaf
 * modules under `aggregator/`. The previous 1205-LOC `aggregator.ts`
 * file has been replaced by a thin compat shim that re-exports
 * `./aggregator/index.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import { buildGithubBlobUrl } from '../url-helpers.js';
import {
  cleanArtifactBody,
  rewriteRelativeLinks,
} from './cleaning/structural.js';
import { buildFrontMatter } from './frontmatter.js';
import { AGGREGATION_ORDER, prettifyFallbackTitle, titleForArtifact } from './order.js';
import { expandPerDocumentAnalyses, hasPerDocumentAnalyses } from './per-document.js';
import { buildReaderGuide } from './reader-guide.js';
import { readBlufParagraph, readFirstParagraph, truncateToSentenceBoundary } from './seo/description.js';
import { cleanArticleTitle, readFirstHeading, titleFromBluf } from './seo/title.js';
import { buildSourcesAppendix } from './sources-appendix.js';

/**
 * Inputs to {@link aggregateAnalysis}. All four fields are required;
 * the absolute path is used for filesystem reads, the repo-relative
 * path is used to build GitHub source URLs.
 */
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

/**
 * Result of one aggregation run. The full markdown is published to
 * `article.md` by `scripts/aggregate-analysis.ts`; the title /
 * description / artifactsUsed fields are surfaced to the agentic
 * workflow run-summary.
 */
export interface AggregationResult {
  /** Generated aggregated markdown (with YAML front-matter). */
  readonly markdown: string;
  /** Ordered list of artifact files consumed (relative to subfolder). */
  readonly artifactsUsed: readonly string[];
  /** First H1 from `executive-brief.md` (cleaned), used as the article title. */
  readonly title: string;
  /** First non-empty paragraph from `executive-brief.md`, used as description. */
  readonly description: string;
}

/**
 * Read every artifact in {@link AGGREGATION_ORDER} from disk, clean it,
 * concatenate the result with section headings + the Reader Intelligence
 * Guide + per-document evidence + the Article Sources appendix, and
 * return the publishable article markdown.
 *
 * Slim orchestrator — see the leaf modules for every transform step:
 * - {@link ./cleaning/structural.js#cleanArtifactBody} for the body cleaner
 * - {@link ./seo/title.js#cleanArticleTitle} / {@link ./seo/title.js#titleFromBluf} for title sourcing
 * - {@link ./seo/description.js#readBlufParagraph} / {@link ./seo/description.js#readFirstParagraph} for description sourcing
 * - {@link ./reader-guide.js#buildReaderGuide} for the navigation table
 * - {@link ./per-document.js#expandPerDocumentAnalyses} for documents/* expansion
 * - {@link ./sources-appendix.js#buildSourcesAppendix} for the closing appendix
 * - {@link ./frontmatter.js#buildFrontMatter} for the YAML head block
 */
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
      `## ${title}\n` +
      `<!-- source: ${fileName} :: ${sourceUrl} -->\n\n` +
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

  // Description: prefer the `## 🎯 BLUF` paragraph (editors write this as
  // the publishable lede), fall back to the first prose paragraph. Always
  // run through the sentence-aware truncator so SERP snippets never end
  // mid-word. See `seo-metadata-contract.md` §3.
  const rawBlufParagraph = readBlufParagraph(briefRaw);
  const rawFirstParagraph = readFirstParagraph(briefRaw);
  const rawDescriptionSource =
    rawBlufParagraph ||
    rawFirstParagraph ||
    `Evidence-based political intelligence analysis for ${subfolder} on ${date}.`;
  const description = truncateToSentenceBoundary(rawDescriptionSource);

  // Title: strip boilerplate prefix + trailing ISO date from the H1. If
  // the cleaned title is too short to be a real story headline,
  // synthesise one from the first BLUF sentence. If that also fails,
  // fall back to `<subfolder> — <date>`. See `seo-metadata-contract.md`
  // §2.
  const title =
    cleanArticleTitle(readFirstHeading(briefRaw)) ||
    titleFromBluf(rawBlufParagraph ?? rawFirstParagraph) ||
    `${prettifyFallbackTitle(subfolder)} — ${date}`;

  const rootArtifactSet = new Set(
    fs.readdirSync(subfolderAbsPath)
      .filter((f) => /\.md$/i.test(f))
      .filter((f) => f !== 'README.md')
      .filter((f) => !/^article(?:\.[a-z-]+)?\.md$/i.test(f)),
  );
  const docsExist = hasPerDocumentAnalyses(subfolderAbsPath);

  // 2. Emit the executive brief FIRST so the reader meets the BLUF /
  //    so-what frame before any navigation metadata. The Reader
  //    Intelligence Guide is then injected immediately after, routing
  //    the reader into the deeper analytical lenses with the executive
  //    context already loaded.
  readSection('executive-brief.md', false);
  sections.push(buildReaderGuide(rootArtifactSet, docsExist));

  // 3. Emit the rest of the canonical narrative order, expanding
  //    documents/ between threat-analysis and election-2026-analysis.
  //    Article types that produce only a subset of the canonical
  //    artifacts (realtime, week-ahead, monthly-review) are supported
  //    transparently — readSection skips missing files and the Reader
  //    Guide above filters its rows on `available.has(entry.file)`.
  for (const fileName of AGGREGATION_ORDER) {
    if (fileName === 'executive-brief.md') continue; // already emitted in Round 0
    readSection(fileName, true);
    if (fileName === 'threat-analysis.md') {
      const docExpansion = expandPerDocumentAnalyses(subfolderAbsPath, subfolderRepoRelPath);
      if (docExpansion.section) sections.push(docExpansion.section);
      used.push(...docExpansion.usedRelative);
    }
  }

  // 4. Append any remaining *.md (supplementary artifacts such as
  //    pestle-analysis.md, wildcards-blackswans.md, ext/*.md) in
  //    alphabetical order. Exclude README.md, article.md (aggregator
  //    output), and language-specific article.<lang>.md.
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

  // 5. Article Sources appendix — single canonical list at the end.
  const sourcesAppendix = buildSourcesAppendix(used, subfolderRepoRelPath);
  if (sourcesAppendix) sections.push(sourcesAppendix);

  // 6. Compose final markdown with YAML front-matter.
  const frontMatter = buildFrontMatter({
    title,
    description,
    date,
    subfolder,
    source_folder: subfolderRepoRelPath,
    generated_at: new Date().toISOString(),
  });

  const body = sections.join('\n\n');

  return {
    markdown: frontMatter + body + '\n',
    artifactsUsed: used,
    title,
    description,
  };
}
