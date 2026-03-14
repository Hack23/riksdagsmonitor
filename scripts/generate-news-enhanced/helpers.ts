/**
 * @module generate-news-enhanced/helpers
 * @description Article writing, quality validation, and date formatting helpers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { translateSwedishContent } from '../translation-dictionary.js';
import type { Language } from '../types/language.js';
import type { DateRange, ArticleQualityScore } from '../types/article.js';
import {
  assessArticleQuality,
  printQualityReport,
  injectQualityMetadata,
} from '../ai-analysis/quality-assessor.js';
import {
  NEWS_DIR,
  METADATA_DIR,
  dryRunArg,
  stats,
  QUALITY_THRESHOLD,
  toISODate,
} from './config.js';

/**
 * Get date range for Week Ahead (next 7 days)
 */
export function getWeekAheadDateRange(): DateRange {
  const today: Date = new Date();
  const startDate: Date = new Date(today);
  startDate.setDate(today.getDate() + 1); // Tomorrow

  const endDate: Date = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7); // +7 days

  return {
    start: toISODate(startDate),
    end: toISODate(endDate)
  };
}

/**
 * Format date for article slug
 */
export function formatDateForSlug(date: Date = new Date()): string {
  return toISODate(date);
}

/**
 * Write article to file
 */
export async function writeArticle(html: string, filename: string): Promise<boolean> {
  if (dryRunArg) {
    console.log(`  [DRY RUN] Would write: ${filename}`);
    return true;
  }

  const filepath: string = path.join(NEWS_DIR, filename);
  fs.writeFileSync(filepath, html, 'utf-8');
  console.log(`  ✅ Wrote: ${filename}`);
  return true;
}

// ---------------------------------------------------------------------------
// Per-article quality score persistence
// ---------------------------------------------------------------------------

/** In-memory store for per-article multi-dimensional scores (written per-run) */
const perArticleScores: Record<string, {
  filename: string;
  lang: string;
  articleType: string;
  score: number;
  passed: boolean;
  multidimensional: {
    overallScore: number;
    passesThreshold: boolean;
    iterationCount: number;
    dimensions: Record<string, number>;
    issueCount: number;
  };
  timestamp: string;
}> = {};

/**
 * Persist all collected per-article quality scores to
 * `news/metadata/quality-scores.json`.  Called after each article write.
 *
 * **Per-run overwrite**: Only the current run's scores are written.  Previous
 * runs' data is replaced so that stale/test entries never accumulate and
 * Check 13's average score reflects the current generation only.
 */
function flushQualityScores(): void {
  if (dryRunArg) return;
  try {
    if (!fs.existsSync(METADATA_DIR)) {
      fs.mkdirSync(METADATA_DIR, { recursive: true });
    }
    const outPath = path.join(METADATA_DIR, 'quality-scores.json');
    // Overwrite with current run's scores only — no merging with stale data
    fs.writeFileSync(outPath, JSON.stringify(perArticleScores, null, 2), 'utf-8');
  } catch (err: unknown) {
    console.warn(`  ⚠️  Could not persist quality scores: ${(err as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// Article quality validation
// ---------------------------------------------------------------------------

/**
 * Validate the quality of a generated article HTML.
 *
 * Performs two sequential assessments:
 *
 *  1. **Structural scoring** (0–100): word count (0–50), h2 sections (0–30),
 *     translation completeness (0–20). Used as the primary pass/fail gate
 *     against `QUALITY_THRESHOLD`.
 *
 *  2. **Multi-dimensional assessment** via `assessArticleQuality()`, which
 *     internally runs its own two passes (dimension computation + aggregation),
 *     producing a 6-dimension weighted score, issue list, and suggestions.
 *
 * Total: 3 assessment passes — 1 structural + 2 multi-dimensional.
 *
 * @param html        - raw HTML of the article
 * @param lang        - language code of the article (e.g. "en")
 * @param articleType - article type slug (e.g. "motions")
 * @param filename    - filename for the quality record
 * @param sourceDocIds - optional list of source document IDs for factual-accuracy check
 * @returns           ArticleQualityScore with metrics, pass/fail, and multidimensional assessment
 */
export function validateArticleQuality(
  html: string,
  lang: string,
  articleType: string,
  filename: string,
  sourceDocIds: readonly string[] = [],
): ArticleQualityScore {
  // ── Pass 1: structural scoring ────────────────────────────────────────────
  const stripped: string = html.replace(/<[^>]+>/g, ' ');
  const wordCount: number = stripped.split(/\s+/).filter(w => w.length > 0).length;
  const wordScore: number = Math.min(50, Math.round((wordCount / 1000) * 50));

  const h2Matches: RegExpMatchArray | null = html.match(/<h2[\s>]/gi);
  const analyticalSections: number = h2Matches ? h2Matches.length : 0;
  const sectionScore: number = Math.min(30, Math.round((analyticalSections / 3) * 30));

  const untranslatedMatches: RegExpMatchArray | null = html.match(/data-translate="true"/g);
  const untranslatedSpans: number = untranslatedMatches ? untranslatedMatches.length : 0;
  const translationDeduction: number = lang === 'sv' ? 0 : Math.min(20, untranslatedSpans * 2);
  const translationScore: number = 20 - translationDeduction;

  const score: number = wordScore + sectionScore + translationScore;

  const unknownMatches: RegExpMatchArray | null = html.match(/Unknown \(Unknown\)/g);
  const unknownAuthors: number = unknownMatches ? unknownMatches.length : 0;

  const passed: boolean = score >= QUALITY_THRESHOLD;

  // ── Pass 2: multi-dimensional assessment ─────────────────────────────────
  // Threshold for multi-dimensional pipeline: 60 out of 100
  const multiPassThreshold = 60;
  const multidimensional = assessArticleQuality(html, lang, sourceDocIds, multiPassThreshold);
  printQualityReport(multidimensional, filename);

  // ----- console report (structural) -----
  const scoreLabel: string = passed ? '✅' : '⚠️';
  const reportId: string = filename.replace(/\.html$/, '');
  console.log(`\n📊 Article Quality Report (structural): ${reportId}`);
  console.log(`   Word count:           ${wordCount} (score: ${wordScore}/50)`);
  console.log(`   Analytical sections:  ${analyticalSections} (score: ${sectionScore}/30)`);
  console.log(`   Untranslated spans:   ${untranslatedSpans} (score: ${translationScore}/20)`);
  console.log(`   Unknown authors:      ${unknownAuthors} ${unknownAuthors > 0 ? '⚠️' : '✅'}`);
  console.log(`   Quality Score:        ${score}/100 — ${passed ? 'PASSED' : 'BELOW THRESHOLD'} ${scoreLabel}`);

  if (!passed) {
    console.warn(`   ⚠️  Score ${score} is below threshold ${QUALITY_THRESHOLD}. Article written but flagged.`);
    if (wordCount < 300) {
      console.warn('      → Article under 300 words — expand with analytical sections');
    }
    if (untranslatedSpans > 10 && lang !== 'sv') {
      console.warn(`      → ${untranslatedSpans} untranslated data-translate spans — translate before committing`);
    }
    if (analyticalSections < 1) {
      console.warn('      → No analytical h2 sections found — add thematic analysis');
    }
    if (unknownAuthors > 0) {
      console.warn(`      → ${unknownAuthors} "Unknown (Unknown)" entries — fix author/party metadata`);
    }
  }

  if (!multidimensional.passesThreshold) {
    console.warn(`   ⚠️  Multi-dimensional score ${multidimensional.overallScore}/100 below threshold ${multiPassThreshold}.`);
    if (multidimensional.suggestions.length > 0) {
      console.warn('      Top improvement suggestions:');
      for (const s of multidimensional.suggestions.slice(0, 3)) {
        console.warn(`        → ${s}`);
      }
    }
  }

  // Accumulate per-article score for flush
  perArticleScores[filename] = {
    filename,
    lang,
    articleType,
    score,
    passed,
    multidimensional: {
      overallScore: multidimensional.overallScore,
      passesThreshold: multidimensional.passesThreshold,
      iterationCount: multidimensional.iterationCount,
      dimensions: {
        factualAccuracy:      multidimensional.dimensions.factualAccuracy.score,
        stakeholderCoverage:  multidimensional.dimensions.stakeholderCoverage.score,
        analyticalDepth:      multidimensional.dimensions.analyticalDepth.score,
        editorialConsistency: multidimensional.dimensions.editorialConsistency.score,
        evidenceQuality:      multidimensional.dimensions.evidenceQuality.score,
        languageQuality:      multidimensional.dimensions.languageQuality.score,
      },
      issueCount: multidimensional.issues.length,
    },
    timestamp: new Date().toISOString(),
  };
  flushQualityScores();

  return {
    filename,
    lang,
    articleType,
    wordCount,
    unknownAuthors,
    untranslatedSpans,
    analyticalSections,
    score,
    passed,
    multidimensional,
  };
}

/**
 * Write article in specified language
 */
export async function writeSingleArticle(html: string, slug: string, lang: Language, articleType?: string, sourceDocIds?: readonly string[]): Promise<string> {
  const filename: string = `${slug}-${lang}.html`;
  // Translate any remaining Swedish data-translate spans before writing or validating
  const translatedHtml: string = translateSwedishContent(html, lang);
  // Infer article type from slug (e.g. "2026-02-23-motions" → "motions",
  // "2026-02-23-committee-reports" → "committee-reports"). Falls back to the
  // full slug if the slug does not follow the YYYY-MM-DD-{type} pattern.
  const slugParts: string[] = slug.split('-');
  const inferredType: string = slugParts.length >= 4 ? slugParts.slice(3).join('-') : slug;
  const qualityScore: ArticleQualityScore = validateArticleQuality(
    translatedHtml,
    lang,
    articleType ?? inferredType,
    filename,
    sourceDocIds ?? [],
  );
  stats.qualityScores.push(qualityScore);

  // Inject quality metadata (meta tag + JSON-LD) into article HTML
  const finalHtml: string = qualityScore.multidimensional
    ? injectQualityMetadata(translatedHtml, qualityScore.multidimensional)
    : translatedHtml;

  await writeArticle(finalHtml, filename);
  stats.generated += 1;
  stats.articles.push(filename);
  return filename;
}

/**
 * Write EN/SV article pair (legacy function for backward compatibility)
 */
export async function writeArticlePair(htmlEN: string, htmlSV: string, slug: string): Promise<void> {
  await writeSingleArticle(htmlEN, slug, 'en');
  await writeSingleArticle(htmlSV, slug, 'sv');
}
