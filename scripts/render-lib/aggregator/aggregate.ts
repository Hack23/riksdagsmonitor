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
import {
  composeRichDescription,
  readBlufParagraph,
  readFirstParagraph,
  truncateToSentenceBoundary,
} from './seo/description.js';
import { extractBriefEntities, flattenBriefEntities } from './seo/brief-extractor.js';
import { cleanArticleTitle, readFirstHeading, readHeadlineParagraph, titleFromBluf } from './seo/title.js';
import { buildArtifactCoverageReport, buildSourcesAppendix } from './sources-appendix.js';

// Maximum number of supporting-data JSON artifacts surfaced in the
// `## Article Sources` appendix and counted in the coverage report.
// Caps prevent runaway pipeline output (e.g. a step that drops dozens
// of intermediate JSON files) from bloating the rendered article and
// the `artifactsUsed` payload.
const MAX_SUPPORTING_DATA_ARTIFACTS = 100;

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
  // Files that exist on disk and were attempted by `readSection` but
  // whose body was trimmed to an empty string by `cleanArtifactBody()`
  // (and therefore omitted from the article projection). Tracked here
  // so the coverage report can distinguish them from artifacts that
  // were never attempted because alias resolution suppressed them.
  const cleanedToEmpty = new Set<string>();
  // Files skipped at *selection time* by alias-group de-duplication
  // (i.e. another member of the alias set was already emitted in this
  // run). Distinct from `cleanedToEmpty` so the report buckets match
  // their stated semantics.
  const aliasSuppressedAtSelection = new Set<string>();

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
    if (!clean) {
      cleanedToEmpty.add(fileName);
      return;
    }
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
  // Rich description prepends the BLUF lede with the top headline-section
  // bullets (`## 60-Second Read`) so the SERP snippet carries bill IDs
  // (HD03267), committee codes (JuU/SfU) and topic clauses — not just
  // generic BLUF prose. Falls back to plain BLUF when no headline
  // section is present (~75% of briefs).
  const richDescription = composeRichDescription(briefRaw, 'en');
  const rawDescriptionSource =
    richDescription ||
    rawBlufParagraph ||
    rawFirstParagraph ||
    `Evidence-based political intelligence analysis for ${subfolder} on ${date}.`;
  const description = truncateToSentenceBoundary(rawDescriptionSource);

  const title =
    cleanArticleTitle(readFirstHeading(briefRaw), subfolder, 'en') ||
    titleFromBluf(readHeadlineParagraph(briefRaw)) ||
    titleFromBluf(rawBlufParagraph ?? rawFirstParagraph) ||
    `${prettifyFallbackTitle(subfolder)} — ${date}`;
  // Mine bill IDs / proposition refs / committee codes / party codes /
  // named entities ONCE from the EN brief — universal-Swedish identifiers
  // (HD03267, JuU28, SÄPO) survive untranslated across all 14 locales,
  // so the same entity set seeds the keyword list for every language
  // page via `article-merge.ts` → `extractLocalizedBriefSeo`.
  const briefEntities = flattenBriefEntities(extractBriefEntities(briefRaw, 'en'));
  const keywords = buildArticleKeywords({
    title,
    description,
    lang: 'en',
    date,
    articleTypeLabel: prettifyFallbackTitle(subfolder),
    articleTypeId: subfolder.replace(/\//g, '-'),
    briefEntities,
  });

  const rootArtifactSet = new Set(
    fs.readdirSync(subfolderAbsPath)
      .filter((f) => /\.md$/i.test(f))
      .filter((f) => f !== 'README.md')
      .filter((f) => !/^article(?:\.[a-z-]+)?\.md$/i.test(f)),
  );
  const docsExist = hasPerDocumentAnalyses(subfolderAbsPath);

  // Constrained to two intentional locations:
  //   1. Top-level `*.json` (canonical pipeline outputs:
  //      `pir-status.json`, `economic-data.json`, `_summary.json`, etc.)
  //   2. `documents/*.json` (per-document raw payloads).
  // Any new pipeline step that emits JSON elsewhere has to be added
  // here explicitly — we deliberately do NOT recurse arbitrary
  // subdirectories so a future intermediate cache directory cannot
  // silently flood the appendix and reader-facing artifact list.
  // A hard cap (`MAX_SUPPORTING_DATA_ARTIFACTS`) provides a final
  // backstop and the truncation count is surfaced in the report.
  const collectSupportingDataArtifacts = (): { files: string[]; truncatedCount: number } => {
    const collected: string[] = [];
    const collectFromDir = (dirAbs: string, prefix: string): void => {
      if (!fs.existsSync(dirAbs)) return;
      for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))) {
        if (!entry.isFile()) continue;
        if (!/\.json$/i.test(entry.name)) continue;
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        collected.push(rel);
      }
    };
    collectFromDir(subfolderAbsPath, '');
    collectFromDir(path.join(subfolderAbsPath, 'documents'), 'documents');
    const truncatedCount = Math.max(0, collected.length - MAX_SUPPORTING_DATA_ARTIFACTS);
    return {
      files: truncatedCount > 0 ? collected.slice(0, MAX_SUPPORTING_DATA_ARTIFACTS) : collected,
      truncatedCount,
    };
  };

  readSection('executive-brief.md', false);
  // Reader Intelligence Guide is inserted AFTER the emission loops
  // (see below) so it is built from the actually-emitted artifact set
  // rather than rootArtifactSet (files on disk). Building it here would
  // produce rows whose #anchors point to headings that never get emitted
  // when cleanArtifactBody() trims a file to empty or alias resolution
  // suppresses it — i.e. broken in-article navigation.

  for (const fileName of AGGREGATION_ORDER) {
    if (fileName === 'executive-brief.md') continue;
    const aliases = aliasGroupFor(fileName);
    if (aliases && used.some((usedFile) => aliases.has(usedFile))) {
      // Only mark as alias-suppressed if the file actually exists on
      // disk; otherwise it's just absent and will be classified as
      // missingFromDisk by the per-slot reconciliation below.
      if (rootArtifactSet.has(fileName)) {
        aliasSuppressedAtSelection.add(fileName);
      }
      continue;
    }
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

  const supportingDataResult = collectSupportingDataArtifacts();
  const supportingDataArtifacts = supportingDataResult.files;
  const supportingDataTruncatedCount = supportingDataResult.truncatedCount;
  const emittedRootMarkdownArtifacts = used.filter((file) => !file.startsWith('documents/'));
  const perDocumentArtifacts = used.filter((file) => file.startsWith('documents/'));
  const emittedRootSet = new Set(emittedRootMarkdownArtifacts);

  // Now that all sections have been collected, build the Reader Guide
  // from the *emitted* set so every row points to a heading that
  // actually exists. Splice it in at index 1 (immediately after the
  // Executive Brief) to preserve the canonical reading order.
  sections.splice(1, 0, buildReaderGuide(emittedRootSet, docsExist));

  // Coverage reporting is computed per *slot* rather than per filename
  // so an alias group (e.g. {stakeholder-perspectives.md,
  // stakeholder-impact.md}) counts as ONE canonical slot. Otherwise a
  // missing alias group would be over-reported (both filenames listed
  // as absent) when the intent is "one of these aliases".
  type CoverageSlot = { readonly label: string; readonly members: readonly string[] };
  const orderedSlots: CoverageSlot[] = [];
  const seenInGroup = new Set<string>();
  for (const file of AGGREGATION_ORDER) {
    if (file === 'executive-brief.md') continue;
    if (seenInGroup.has(file)) continue;
    const aliases = aliasGroupFor(file);
    if (aliases) {
      // Preserve AGGREGATION_ORDER ordering for the group's label.
      const members = AGGREGATION_ORDER.filter((f) => aliases.has(f));
      for (const m of members) seenInGroup.add(m);
      orderedSlots.push({ label: members.join(' / '), members });
    } else {
      orderedSlots.push({ label: file, members: [file] });
    }
  }

  // Per-slot classification. A slot is:
  //   • missingFromDisk     — no member of the slot exists on disk
  //   • emitted (satisfied) — at least one member was emitted
  //   • presentButFiltered  — members exist on disk but none emitted;
  //                            tracked because `cleanArtifactBody()`
  //                            trimmed them to empty (`cleanedToEmpty`)
  //   • aliasDeduped        — siblings of an emitted slot member that
  //                            were skipped at *selection time* (i.e.
  //                            `aliasSuppressedAtSelection`). Distinct
  //                            from `cleanedToEmpty` so a sibling that
  //                            happened to also be empty after cleaning
  //                            is reported in the right bucket.
  const missingFromDisk: string[] = [];
  const presentButFiltered: string[] = [];
  const aliasDedupedArtifacts: string[] = [];
  for (const slot of orderedSlots) {
    const onDisk = slot.members.filter((m) => rootArtifactSet.has(m));
    const emitted = slot.members.filter((m) => emittedRootSet.has(m));
    if (onDisk.length === 0) {
      missingFromDisk.push(slot.label);
      continue;
    }
    if (emitted.length === 0) {
      // None of the on-disk members survived cleaning. List the actual
      // on-disk filenames so reviewers can grep them quickly.
      presentButFiltered.push(onDisk.join(', '));
      continue;
    }
    // Slot satisfied; siblings that exist on disk but were not emitted
    // get classified by *why* they were not emitted.
    for (const member of onDisk) {
      if (emittedRootSet.has(member)) continue;
      if (aliasSuppressedAtSelection.has(member)) {
        aliasDedupedArtifacts.push(member);
      } else if (cleanedToEmpty.has(member)) {
        presentButFiltered.push(member);
      } else {
        // Should not happen in practice (file exists, not emitted, not
        // alias-suppressed, not cleaned-to-empty) — surface defensively
        // as filtered so the report stays honest.
        presentButFiltered.push(member);
      }
    }
  }
  const absentOrderedArtifacts = missingFromDisk;

  sections.push(buildArtifactCoverageReport({
    emittedMarkdownArtifacts: emittedRootMarkdownArtifacts,
    perDocumentArtifacts,
    supportingDataArtifacts,
    supportingDataTruncatedCount,
    absentOrderedArtifacts,
    presentButFilteredArtifacts: presentButFiltered,
    aliasDedupedArtifacts,
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
