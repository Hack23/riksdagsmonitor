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
  NEWS_DIR,
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
// Article quality validation
// ---------------------------------------------------------------------------

/**
 * Validate the quality of a generated article HTML.
 *
 * Scoring (0–100):
 *  - wordScore      (0–50): proportional to word count up to 1 000 words
 *  - sectionScore   (0–30): based on number of analytical <h2> sections (full at ≥ 3)
 *  - translationScore (0–20): deducted for each data-translate="true" span in non-Swedish
 *
 * @param html        - raw HTML of the article
 * @param lang        - language code of the article (e.g. "en")
 * @param articleType - article type slug (e.g. "motions")
 * @param filename    - filename for the quality record
 * @returns           ArticleQualityScore with metrics and pass/fail result
 */
export function validateArticleQuality(
  html: string,
  lang: string,
  articleType: string,
  filename: string
): ArticleQualityScore {
  // ----- word count (approximate: strip tags, count whitespace-delimited tokens) -----
  const stripped: string = html.replace(/<[^>]+>/g, ' ');
  const wordCount: number = stripped.split(/\s+/).filter(w => w.length > 0).length;
  const wordScore: number = Math.min(50, Math.round((wordCount / 1000) * 50));

  // ----- analytical sections (h2 headings) -----
  const h2Matches: RegExpMatchArray | null = html.match(/<h2[\s>]/gi);
  const analyticalSections: number = h2Matches ? h2Matches.length : 0;
  const sectionScore: number = Math.min(30, Math.round((analyticalSections / 3) * 30));

  // ----- translation completeness (non-Swedish only) -----
  const untranslatedMatches: RegExpMatchArray | null = html.match(/data-translate="true"/g);
  const untranslatedSpans: number = untranslatedMatches ? untranslatedMatches.length : 0;
  const translationDeduction: number = lang === 'sv' ? 0 : Math.min(20, untranslatedSpans * 2);
  const translationScore: number = 20 - translationDeduction;

  const score: number = wordScore + sectionScore + translationScore;

  // ----- unknown authors -----
  const unknownMatches: RegExpMatchArray | null = html.match(/Unknown \(Unknown\)/g);
  const unknownAuthors: number = unknownMatches ? unknownMatches.length : 0;

  const passed: boolean = score >= QUALITY_THRESHOLD;

  // ----- console report -----
  const scoreLabel: string = passed ? '✅' : '⚠️';
  const reportId: string = filename.replace(/\.html$/, '');
  console.log(`\n📊 Article Quality Report: ${reportId}`);
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

  return {
    filename,
    lang,
    articleType,
    wordCount,
    unknownAuthors,
    untranslatedSpans,
    analyticalSections,
    score,
    passed
  };
}

/**
 * Write article in specified language
 */
export async function writeSingleArticle(html: string, slug: string, lang: Language, articleType?: string): Promise<string> {
  const filename: string = `${slug}-${lang}.html`;
  // Translate any remaining Swedish data-translate spans before writing or validating
  const translatedHtml: string = translateSwedishContent(html, lang);
  // Infer article type from slug (e.g. "2026-02-23-motions" → "motions",
  // "2026-02-23-committee-reports" → "committee-reports"). Falls back to the
  // full slug if the slug does not follow the YYYY-MM-DD-{type} pattern.
  const slugParts: string[] = slug.split('-');
  const inferredType: string = slugParts.length >= 4 ? slugParts.slice(3).join('-') : slug;
  const qualityScore: ArticleQualityScore = validateArticleQuality(translatedHtml, lang, articleType ?? inferredType, filename);
  stats.qualityScores.push(qualityScore);
  await writeArticle(translatedHtml, filename);
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
