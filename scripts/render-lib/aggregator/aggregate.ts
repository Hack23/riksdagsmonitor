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
import { buildArticleKeywords } from '../article-seo.js';
import {
  cleanArtifactBody,
  rewriteRelativeLinks,
} from './cleaning/structural.js';
import { buildFrontMatter } from './frontmatter.js';
import { aliasGroupFor, AGGREGATION_ORDER, prettifyFallbackTitle, titleForArtifact } from './order.js';
import { expandPerDocumentAnalyses, hasPerDocumentAnalyses } from './per-document.js';
import { buildReaderGuide } from './reader-guide.js';
import { readBlufParagraph, readFirstParagraph, truncateToSentenceBoundary } from './seo/description.js';
import { cleanArticleTitle, readFirstHeading, titleFromBluf } from './seo/title.js';
import { buildArtifactCoverageReport, buildSourcesAppendix } from './sources-appendix.js';

const EXCLUDED_SUPPORTING_DATA_DIRS = new Set(['pass1']);

function isExcludedSupportingDataPath(rel: string): boolean {
  for (const dir of EXCLUDED_SUPPORTING_DATA_DIRS) {
    if (rel === dir || rel.startsWith(`${dir}/`)) return true;
  }
  return false;
}

/**
 * Inputs to {@link aggregateAnalysis}. All four required fields provide
 * the filesystem and metadata context; the optional config fields allow
 * callers (e.g. `runArticlePipeline`) to override front-matter values
 * without forking the aggregation logic.
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
  /** Override the `generated_at` front-matter field (ISO-8601). Defaults to `new Date().toISOString()`. */
  readonly generated_at?: string;
  /** Language code injected into front-matter (defaults to `'en'`). */
  readonly language?: string;
  /** Layout template injected into front-matter (defaults to `'article'`). */
  readonly layout?: string;
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
  /** Context-aware keyword set for front-matter and generated HTML. */
  readonly keywords: string;
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

  const briefPath = path.join(subfolderAbsPath, 'executive-brief.md');
  if (!fs.existsSync(briefPath)) {
    throw new Error(`Aggregation requires executive-brief.md in ${subfolderRepoRelPath}`);
  }
  const briefRaw = fs.readFileSync(briefPath, 'utf8');

  const rawBlufParagraph = readBlufParagraph(briefRaw);
  const rawFirstParagraph = readFirstParagraph(briefRaw);
  const rawDescriptionSource =
    rawBlufParagraph ||
    rawFirstParagraph ||
    `Evidence-based political intelligence analysis for ${subfolder} on ${date}.`;
  const description = truncateToSentenceBoundary(rawDescriptionSource);

  const title =
    cleanArticleTitle(readFirstHeading(briefRaw), subfolder) ||
    titleFromBluf(rawBlufParagraph ?? rawFirstParagraph) ||
    `${prettifyFallbackTitle(subfolder)} — ${date}`;
  const keywords = buildArticleKeywords({
    title,
    description,
    lang: 'en',
    date,
    articleTypeLabel: prettifyFallbackTitle(subfolder),
    articleTypeId: subfolder.replace(/\//g, '-'),
  });

  const rootArtifactSet = new Set(
    fs.readdirSync(subfolderAbsPath)
      .filter((f) => /\.md$/i.test(f))
      .filter((f) => f !== 'README.md')
      .filter((f) => !/^article(?:\.[a-z-]+)?\.md$/i.test(f)),
  );
  const docsExist = hasPerDocumentAnalyses(subfolderAbsPath);

  const collectSupportingDataArtifacts = (): string[] => {
    const out: string[] = [];
    const walk = (dir: string, prefix: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))) {
        const full = path.join(dir, entry.name);
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          // Pass-1 drafts are superseded by the Pass-2 audited artifacts and
          // must not be surfaced as reader-facing supporting data.
          if (isExcludedSupportingDataPath(rel)) continue;
          walk(full, rel);
        } else if (/\.json$/i.test(entry.name)) {
          out.push(rel);
        }
      }
    };
    walk(subfolderAbsPath, '');
    return out;
  };

  readSection('executive-brief.md', false);
  sections.push(buildReaderGuide(rootArtifactSet, docsExist));

  for (const fileName of AGGREGATION_ORDER) {
    if (fileName === 'executive-brief.md') continue;
    const aliases = aliasGroupFor(fileName);
    if (aliases && used.some((usedFile) => aliases.has(usedFile))) continue;
    readSection(fileName, true);
    if (fileName === 'significance-scoring.md') {
      const docExpansion = expandPerDocumentAnalyses(subfolderAbsPath, subfolderRepoRelPath);
      if (docExpansion.section) sections.push(docExpansion.section);
      used.push(...docExpansion.usedRelative);
    }
  }

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

  const supportingDataArtifacts = collectSupportingDataArtifacts();
  const emittedRootMarkdownArtifacts = used.filter((file) => !file.startsWith('documents/'));
  const perDocumentArtifacts = used.filter((file) => file.startsWith('documents/'));
  const emittedRootSet = new Set(emittedRootMarkdownArtifacts);
  const absentOrderedArtifacts = AGGREGATION_ORDER.filter((file) => {
    if (file === 'executive-brief.md') return false;
    const aliases = aliasGroupFor(file);
    if (aliases && [...aliases].some((alias) => emittedRootSet.has(alias))) return false;
    return !rootArtifactSet.has(file);
  });

  sections.push(buildArtifactCoverageReport({
    emittedMarkdownArtifacts: emittedRootMarkdownArtifacts,
    perDocumentArtifacts,
    supportingDataArtifacts,
    absentOrderedArtifacts,
  }));

  const sourcesAppendix = buildSourcesAppendix(used, subfolderRepoRelPath, supportingDataArtifacts);
  if (sourcesAppendix) sections.push(sourcesAppendix);

  const frontMatter = buildFrontMatter({
    title,
    description,
    keywords,
    date,
    subfolder,
    source_folder: subfolderRepoRelPath,
    generated_at: input.generated_at ?? new Date().toISOString(),
    language: input.language,
    layout: input.layout,
  });

  const body = sections.join('\n\n');

  return {
    markdown: frontMatter + body + '\n',
    artifactsUsed: [...used, ...supportingDataArtifacts],
    title,
    description,
    keywords,
  };
}
