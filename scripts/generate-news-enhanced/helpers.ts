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
import type { ClassificationLevel, RiskLevel, ConfidenceLabel } from '../analysis-reader.js';
import type { UrgencyLabel } from '../ai-analysis/political-significance.js';
import { readLatestAnalysis, deriveArticleClassificationMeta } from '../analysis-reader.js';
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
  MULTIDIM_QUALITY_THRESHOLD,
  toISODate,
} from './config.js';

// ---------------------------------------------------------------------------
// Analysis enrichment — cached daily analysis for article metadata
// ---------------------------------------------------------------------------

/** Pre-computed classification metadata derived from the daily analysis pipeline. */
export interface AnalysisEnrichment {
  classificationLevel: ClassificationLevel;
  riskLevel: RiskLevel;
  confidenceLabel: ConfidenceLabel;
  significance?: number;
  urgency?: UrgencyLabel;
}

/** Module-level cache so analysis is loaded at most once per process. */
let cachedEnrichment: AnalysisEnrichment | null | undefined;

/**
 * Attempt to load the latest pre-computed daily analysis and derive article
 * classification metadata.  The result is cached for the lifetime of the
 * process so that all article generators share the same snapshot.
 *
 * Returns `null` when no analysis files are available (backward-compatible —
 * generators can omit classification fields).
 */
export async function getAnalysisEnrichment(): Promise<AnalysisEnrichment | null> {
  if (cachedEnrichment !== undefined) return cachedEnrichment;

  try {
    const analysis = await readLatestAnalysis(3);
    if (!analysis.hasAnalysis) {
      cachedEnrichment = null;
      return null;
    }
    const meta = deriveArticleClassificationMeta(analysis);
    cachedEnrichment = {
      classificationLevel: meta.classificationLevel,
      riskLevel: meta.riskLevel,
      confidenceLabel: meta.confidenceLabel,
      significance: meta.significanceScore,
      urgency: meta.urgency,
    };
    console.log(`  📊 Analysis enrichment loaded: classification=${meta.classificationLevel}, risk=${meta.riskLevel}, confidence=${meta.confidenceLabel}`);
    return cachedEnrichment;
  } catch {
    cachedEnrichment = null;
    return null;
  }
}

/**
 * Reset the analysis enrichment cache.  Useful in tests.
 */
export function resetAnalysisEnrichmentCache(): void {
  cachedEnrichment = undefined;
}

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
    assessmentPasses: number;
    dimensions: Record<string, number>;
    issueCount: number;
  };
  timestamp: string;
}> = {};

/**
 * Persist all collected per-article quality scores to
 * `news/metadata/quality-scores.json`.
 *
 * Uses atomic write (write to temp file, then rename) to avoid leaving
 * truncated/invalid JSON on disk if the process is interrupted mid-write.
 *
 * **Per-run overwrite**: Only the current run's scores are written.  Previous
 * runs' data is replaced so that stale/test entries never accumulate and
 * Check 13's average score reflects the current generation only.
 *
 * Call once at the end of the overall generation run (not per-article) to
 * avoid write amplification when many articles are generated.
 */
export function flushQualityScores(): void {
  if (dryRunArg) return;
  try {
    if (!fs.existsSync(METADATA_DIR)) {
      fs.mkdirSync(METADATA_DIR, { recursive: true });
    }
    const outPath = path.join(METADATA_DIR, 'quality-scores.json');
    const tmpPath = outPath + '.tmp';
    // Best-effort atomic write: write to temp file, then rename.
    // Try rename first (atomic on POSIX). On Windows the rename may fail when
    // the destination exists, so fall back to unlink-then-rename.
    fs.writeFileSync(tmpPath, JSON.stringify(perArticleScores, null, 2), 'utf-8');
    try {
      fs.renameSync(tmpPath, outPath);
    } catch (renameErr: unknown) {
      // Only attempt unlink+rename for known Windows cross-device/exists codes.
      // Other failures (permissions, missing parent dir, etc.) should propagate
      // so we don't delete an otherwise valid quality-scores.json.
      const code = (renameErr as NodeJS.ErrnoException).code;
      if (code === 'EEXIST' || code === 'EPERM' || code === 'EACCES' || code === 'EXDEV') {
        try { fs.unlinkSync(outPath); } catch (e: unknown) {
          if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        }
        fs.renameSync(tmpPath, outPath);
      } else {
        throw renameErr;
      }
    }
    // Clear in-memory map after a successful flush so that subsequent
    // invocations in the same Node process don't carry stale entries.
    for (const key of Object.keys(perArticleScores)) {
      delete perArticleScores[key];
    }
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
  const stripped: string = html
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
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
  const multidimensional = assessArticleQuality(html, lang, sourceDocIds, MULTIDIM_QUALITY_THRESHOLD);
  if (multidimensional.passesThreshold === false || process.env.NEWS_QUALITY_VERBOSE === '1') {
    printQualityReport(multidimensional, filename);
  }

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
    console.warn(`   ⚠️  Multi-dimensional score ${multidimensional.overallScore}/100 below threshold ${MULTIDIM_QUALITY_THRESHOLD}.`);
    if (multidimensional.suggestions.length > 0) {
      console.warn('      Top improvement suggestions:');
      for (const s of multidimensional.suggestions.slice(0, 3)) {
        console.warn(`        → ${s}`);
      }
    }
  }

  // Accumulate per-article score (flushed at end of run via exported flushQualityScores())
  perArticleScores[filename] = {
    filename,
    lang,
    articleType,
    score,
    passed,
    multidimensional: {
      overallScore: multidimensional.overallScore,
      passesThreshold: multidimensional.passesThreshold,
      assessmentPasses: multidimensional.assessmentPasses,
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

  // Inject quality metadata (CSP-safe <meta> tag only; opt-in JSON-LD via injectJsonLd param)
  const finalHtml: string = qualityScore.multidimensional
    ? injectQualityMetadata(translatedHtml, qualityScore.multidimensional)
    : translatedHtml;

  await writeArticle(finalHtml, filename);
  stats.generated += 1;
  stats.articles.push(filename);
  return filename;
}

/**
 * Install process-exit signal handlers that flush quality scores once.
 * Call from the CLI entrypoint (not at module load time) to avoid side
 * effects when helpers.ts is imported by tests or other tooling.
 */
let _flushGuardInstalled = false;
let _flushed = false;

/** Flush quality scores at most once per process lifetime. */
function flushOnce(): void {
  if (_flushed) return;
  if (Object.keys(perArticleScores).length === 0) {
    _flushed = true;
    return;
  }
  flushQualityScores();
  if (Object.keys(perArticleScores).length === 0) {
    _flushed = true;
  }
}

export function installFlushHandlers(): void {
  if (_flushGuardInstalled) return;
  _flushGuardInstalled = true;
  process.once('exit', () => flushOnce());
  process.once('SIGINT', () => { flushOnce(); process.exit(130); });
  process.once('SIGTERM', () => { flushOnce(); process.exit(143); });
}

/**
 * Write EN/SV article pair (legacy function for backward compatibility)
 */
export async function writeArticlePair(htmlEN: string, htmlSV: string, slug: string): Promise<void> {
  await writeSingleArticle(htmlEN, slug, 'en');
  await writeSingleArticle(htmlSV, slug, 'sv');
}

// ---------------------------------------------------------------------------
// Dynamic title/description generation from content highlights
// ---------------------------------------------------------------------------

/** Extract top N most relevant highlight phrases from article content */
function extractHighlights(content: string, maxHighlights: number = 3): string[] {
  // Look for strong/emphasized patterns in the HTML
  const strongMatches = content.match(/<strong>([^<]{5,60})<\/strong>/gi) ?? [];
  // Also look for h3 headings as highlights
  const h3Matches = content.match(/<h3[^>]*>([^<]{5,80})<\/h3>/gi) ?? [];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of [...strongMatches, ...h3Matches]) {
    const text = m.replace(/<\/?(?:strong|h3)[^>]*>/gi, '').trim();
    if (text.length >= 5 && text.length <= 80 && !seen.has(text)) {
      seen.add(text);
      result.push(text);
      if (result.length >= maxHighlights) break;
    }
  }
  return result;
}

/** Extract key policy domain or committee name from content */
function extractDominantTheme(content: string): string | null {
  const text = content.replace(/<[^>]+>/g, ' ');
  // Known Swedish committee patterns
  const committees = [
    'Finansutskottet', 'Försvarsutskottet', 'Justitieutskottet', 'Socialutskottet',
    'Utrikesutskottet', 'Civilutskottet', 'Näringsutskottet', 'Kulturutskottet',
    'Miljöutskottet', 'Arbetsmarknadsutskottet', 'Konstitutionsutskottet',
    'Socialförsäkringsutskottet', 'Trafikutskottet', 'Utbildningsutskottet',
  ];
  for (const c of committees) {
    if (text.includes(c)) return c;
  }
  // Policy domain patterns
  const domains = [
    { pattern: /\b(defense|defence|försvar|NATO|military)\b/i, theme: 'Defense' },
    { pattern: /\b(budget|fiscal|skattepo|ekonomi|finance)\b/i, theme: 'Economy' },
    { pattern: /\b(migration|invandring|asylum|refugee)\b/i, theme: 'Migration' },
    { pattern: /\b(climate|miljö|environment|hållbar|sustainability)\b/i, theme: 'Climate' },
    { pattern: /\b(education|utbildning|school|skola)\b/i, theme: 'Education' },
    { pattern: /\b(health|hälso|vård|sjukvård|healthcare)\b/i, theme: 'Health' },
    { pattern: /\b(EU|European Union|Europeiska)\b/i, theme: 'EU Affairs' },
    { pattern: /\b(justice|rätts|crime|brott|law enforcement)\b/i, theme: 'Justice' },
    { pattern: /\b(labour|arbetsmarknad|employment|unemployment)\b/i, theme: 'Labour' },
  ];
  for (const d of domains) {
    if (d.pattern.test(text)) return d.theme;
  }
  return null;
}

/**
 * Generate a dynamic, content-based title that highlights key findings.
 *
 * Uses extractable highlights from article content to produce titles that
 * reflect the specific topics covered rather than generic templates.
 *
 * @param baseTitle - The generic article type title prefix
 * @param content   - The HTML content of the article
 * @param docCount  - Number of source documents analyzed
 * @returns         A `TitleSet` with content-enriched title and description
 */
export function generateDynamicTitle(
  baseTitle: string,
  content: string,
  docCount: number,
): { title: string; subtitle: string } {
  const highlights = extractHighlights(content);
  const theme = extractDominantTheme(content);

  // Build dynamic title incorporating the dominant theme
  let title = baseTitle;
  if (theme && !baseTitle.toLowerCase().includes(theme.toLowerCase())) {
    title = `${baseTitle}: ${theme} in Focus`;
  } else if (highlights.length > 0) {
    const topHighlight = highlights[0];
    // Only append if it adds meaningful context and isn't too long
    if (topHighlight.length <= 40 && !baseTitle.includes(topHighlight)) {
      title = `${baseTitle}: ${topHighlight}`;
    }
  }

  // Build dynamic subtitle from highlights
  let subtitle: string;
  if (highlights.length >= 2) {
    subtitle = `Analysis of ${docCount} documents covering ${highlights.slice(0, 2).join(', ')}`;
  } else if (highlights.length === 1) {
    subtitle = `Analysis of ${docCount} documents focusing on ${highlights[0]}`;
  } else if (theme) {
    subtitle = `Analysis of ${docCount} parliamentary documents on ${theme}`;
  } else {
    subtitle = `Analysis of ${docCount} parliamentary documents revealing key political developments`;
  }

  return { title, subtitle };
}
