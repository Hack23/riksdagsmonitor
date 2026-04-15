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
import type { DateRange, ArticleQualityScore, UrgencyLabel } from '../types/article.js';
import type { ClassificationLevel, RiskLevel, ConfidenceLabel } from '../analysis-reader.js';
import { readLatestAnalysis, deriveArticleClassificationMeta } from '../analysis-reader.js';
import {
  NEWS_DIR,
  METADATA_DIR,
  dryRunArg,
  stats,
  QUALITY_THRESHOLD,
  MULTIDIM_QUALITY_THRESHOLD,
  toISODate,
} from './config.js';

import type { MultiDimensionalQualityAssessment, DimensionScore, QualityIssue } from '../types/article.js';
import { detectBannedPatterns } from '../data-transformers/content-generators/shared.js';
import { detectSwedishLeakage } from '../detect-swedish-leakage.js';

// ---------------------------------------------------------------------------
// Multi-dimensional article quality assessment
// ---------------------------------------------------------------------------

/** Swedish party abbreviations used to detect stakeholder coverage. */
const SWEDISH_PARTIES: readonly string[] = ['S', 'M', 'SD', 'V', 'MP', 'C', 'L', 'KD'];

/** Pre-compiled regexes for party name matching (word boundaries, case-sensitive). */
const PARTY_REGEXES: readonly RegExp[] = SWEDISH_PARTIES.map(p => new RegExp(`\\b${p}\\b`));

/** Minimum number of dok_id citations for a passing evidence quality score. */
const MIN_DOK_ID_CITATIONS = 2;

/** Number of Swedish leakage occurrences that trigger one deduction step. */
const LEAKAGE_OCCURRENCES_PER_DEDUCTION = 5;

/** Points deducted per leakage deduction step. */
const LEAKAGE_DEDUCTION_AMOUNT = 25;

/** Dimension weights for the weighted overall score (must sum to 1.0). */
const DIMENSION_WEIGHTS = {
  factualAccuracy: 0.25,
  stakeholderCoverage: 0.15,
  analyticalDepth: 0.15,
  editorialConsistency: 0.10,
  evidenceQuality: 0.20,
  languageQuality: 0.15,
} as const satisfies Record<keyof MultiDimensionalQualityAssessment['dimensions'], number>;

const DIMENSION_WEIGHT_SUM: number = Object.values(DIMENSION_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0,
);

if (Math.abs(DIMENSION_WEIGHT_SUM - 1) > 1e-10) {
  throw new Error(`DIMENSION_WEIGHTS must sum to 1.0, got ${DIMENSION_WEIGHT_SUM}`);
}

/**
 * Assess the factual accuracy dimension.
 * Detects banned boilerplate patterns — each one deducts 20 points.
 */
function scoreFactualAccuracy(html: string): DimensionScore {
  const bannedLabels: string[] = detectBannedPatterns(html);
  const deduction: number = bannedLabels.length * 20;
  const score: number = Math.max(0, 100 - deduction);

  const evidence: string[] = bannedLabels.length === 0
    ? ['No banned boilerplate patterns detected']
    : bannedLabels.map(label => `Banned pattern found: ${label}`);

  const improvements: string[] = bannedLabels.map(
    label => `Replace banned pattern "${label}" with genuine, document-specific analysis`,
  );

  return { score, evidence, improvements };
}

/**
 * Assess stakeholder coverage dimension.
 * Checks for named political parties/actors — at least 2 distinct parties expected.
 */
function scoreStakeholderCoverage(html: string): DimensionScore {
  // Strip script/style blocks before tag stripping to avoid JS/JSON-LD pollution
  const stripped: string = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const evidence: string[] = [];
  const improvements: string[] = [];

  // Count distinct Swedish parties mentioned using pre-compiled regexes
  const mentionedParties: string[] = SWEDISH_PARTIES.filter((_, i) => PARTY_REGEXES[i].test(stripped));

  evidence.push(`${mentionedParties.length} distinct parties mentioned: ${mentionedParties.join(', ') || 'none'}`);

  // Check for Winners & Losers section
  const hasWinnersLosers: boolean = /winners?\s*(and|&|\/)\s*losers?/i.test(stripped)
    || /vinnare\s*(och|&|\/)\s*förlorare/i.test(stripped);

  if (hasWinnersLosers) {
    evidence.push('Winners & Losers section detected');
  }

  let score = 100;
  if (mentionedParties.length < 2) {
    score -= 30;
    improvements.push('Add coverage of at least 2 distinct political parties with named actors');
  }
  if (!hasWinnersLosers) {
    score -= 15;
    improvements.push('Add a Winners & Losers section identifying which parties gain or lose');
  }

  return { score: Math.max(0, score), evidence, improvements };
}

/**
 * Assess analytical depth dimension.
 * Checks for Mermaid diagrams, analytical framework mentions, and structured analysis.
 */
function scoreAnalyticalDepth(html: string): DimensionScore {
  const evidence: string[] = [];
  const improvements: string[] = [];

  // Count Mermaid diagrams
  const mermaidMatches: RegExpMatchArray | null = html.match(/class="mermaid"/g);
  const mermaidCount: number = mermaidMatches ? mermaidMatches.length : 0;
  evidence.push(`${mermaidCount} Mermaid diagram(s) found`);

  // Count analytical framework references
  const frameworkPatterns: RegExp[] = [
    /SWOT/i, /cost-benefit/i, /risk\s+assessment/i, /impact\s+analysis/i,
    /stakeholder\s+analysis/i, /comparative\s+analysis/i, /trend\s+analysis/i,
  ];
  const frameworkCount: number = frameworkPatterns.filter(p => p.test(html)).length;
  evidence.push(`${frameworkCount} analytical framework reference(s) found`);

  // Check for h3 sub-sections (deeper analysis)
  const h3Matches: RegExpMatchArray | null = html.match(/<h3[\s>]/gi);
  const h3Count: number = h3Matches ? h3Matches.length : 0;
  evidence.push(`${h3Count} sub-section(s) found`);

  let score = 100;
  if (mermaidCount === 0) {
    score -= 20;
    improvements.push('Add at least one Mermaid diagram visualizing key relationships or processes');
  }
  if (frameworkCount === 0) {
    score -= 15;
    improvements.push('Reference analytical frameworks (SWOT, cost-benefit, risk assessment) to deepen analysis');
  }
  if (h3Count < 2) {
    score -= 10;
    improvements.push('Add sub-sections (h3) for more granular analytical depth');
  }

  return { score: Math.max(0, score), evidence, improvements };
}

/**
 * Assess editorial consistency dimension.
 * Detects duplicate "Why It Matters" sections and other structural duplications.
 */
function scoreEditorialConsistency(html: string): DimensionScore {
  const evidence: string[] = [];
  const improvements: string[] = [];

  // Count "Why It Matters" occurrences in heading tags only (h2/h3)
  const whyItMattersMatches: RegExpMatchArray | null = html.match(/<h[23][^>]*>[^<]*Why\s+It\s+Matters[^<]*<\/h[23]>/gi);
  const whyItMattersCount: number = whyItMattersMatches ? whyItMattersMatches.length : 0;
  evidence.push(`${whyItMattersCount} "Why It Matters" heading(s)`);

  // Count "What to Watch" occurrences in heading tags only (h2/h3)
  const watchMatches: RegExpMatchArray | null = html.match(/<h[23][^>]*>[^<]*What\s+to\s+Watch[^<]*<\/h[23]>/gi);
  const watchCount: number = watchMatches ? watchMatches.length : 0;
  evidence.push(`${watchCount} "What to Watch" heading(s)`);

  let score = 100;
  const duplicateWhyItMatters: number = Math.max(0, whyItMattersCount - 1);
  if (duplicateWhyItMatters > 0) {
    score -= duplicateWhyItMatters * 15;
    improvements.push(`Remove ${duplicateWhyItMatters} duplicate "Why It Matters" section(s) — only one per article`);
  }
  const duplicateWatch: number = Math.max(0, watchCount - 1);
  if (duplicateWatch > 0) {
    score -= duplicateWatch * 15;
    improvements.push(`Remove ${duplicateWatch} duplicate "What to Watch" section(s) — only one per article`);
  }

  return { score: Math.max(0, score), evidence, improvements };
}

/**
 * Assess evidence quality dimension.
 * Checks for dok_id citations, confidence labels, and named sources.
 */
function scoreEvidenceQuality(html: string, docIds: readonly string[]): DimensionScore {
  const evidence: string[] = [];
  const improvements: string[] = [];

  const normalizeDocId = (value: string): string => value.trim().toUpperCase();

  // Deduplicate source document IDs
  const sourceDocIds: Set<string> = new Set(
    docIds
      .map((docId: string) => normalizeDocId(docId))
      .filter((docId: string) => docId.length > 0),
  );

  // Extract unique document IDs from HTML (deduplicated across patterns)
  const htmlDocIds: Set<string> = new Set();
  const addMatchesToSet = (pattern: RegExp, groupIndex: number = 0): void => {
    for (const match of html.matchAll(pattern)) {
      const candidate: string | undefined = match[groupIndex];
      if (!candidate) continue;
      const normalized: string = normalizeDocId(candidate);
      if (normalized) htmlDocIds.add(normalized);
    }
  };

  // Extract explicit document ID values from common HTML/JSON citation fields
  addMatchesToSet(/data-dok-id\s*=\s*["']([^"']+)["']/gi, 1);
  addMatchesToSet(/\bdok_id\b\s*[:=]\s*["']?([A-Za-z0-9]+)["']?/gi, 1);

  // Riksdag document ID format: letter + 3 digits + letter(s) + alphanumeric suffix
  // Examples: H901AU10, H901FiU1, GZ10259. Intentionally broad to catch variants.
  addMatchesToSet(/\b([A-Z]\d{3}[A-Za-z]\w+)\b/gi, 1);

  const totalDocIds: number = new Set<string>([...sourceDocIds, ...htmlDocIds]).size;
  evidence.push(
    `${totalDocIds} unique document ID reference(s) found (${sourceDocIds.size} source + ${htmlDocIds.size} inline, merged and deduplicated)`,
  );

  // Check for confidence labels
  const confidencePattern = /\b(HIGH|MEDIUM|LOW)\s+confidence\b/gi;
  const confidenceMatches: RegExpMatchArray | null = html.match(confidencePattern);
  const confidenceCount: number = confidenceMatches ? confidenceMatches.length : 0;
  evidence.push(`${confidenceCount} confidence label(s) found`);

  let score = 100;
  if (totalDocIds < MIN_DOK_ID_CITATIONS) {
    score -= 20;
    improvements.push(`Add at least ${MIN_DOK_ID_CITATIONS} document ID citations (dok_id) to support factual claims`);
  }
  if (confidenceCount === 0) {
    score -= 15;
    improvements.push('Add confidence labels (HIGH/MEDIUM/LOW confidence) to analytical claims');
  }

  return { score: Math.max(0, score), evidence, improvements };
}

/**
 * Assess language quality dimension.
 * Detects Swedish text leakage in non-Swedish articles using the dedicated detector.
 */
function scoreLanguageQuality(html: string, lang: string): DimensionScore {
  const evidence: string[] = [];
  const improvements: string[] = [];

  if (lang === 'sv') {
    evidence.push('Swedish article — language leakage check not applicable');
    return { score: 100, evidence, improvements };
  }

  const leakageReport = detectSwedishLeakage(html, lang as Language);
  const leakageScore: number = leakageReport.score;
  const leakedTerms = leakageReport.leakedTerms;

  evidence.push(`${leakedTerms.length} unique Swedish term(s) leaked (${leakageScore} total occurrence(s))`);

  if (leakedTerms.length > 0) {
    const topTerms: string = leakedTerms.slice(0, 5).map(t => `"${t.term}"`).join(', ');
    evidence.push(`Top leaked terms: ${topTerms}`);
  }

  const deduction: number = Math.min(100, Math.floor(leakageScore / LEAKAGE_OCCURRENCES_PER_DEDUCTION) * LEAKAGE_DEDUCTION_AMOUNT);
  const score: number = Math.max(0, 100 - deduction);

  if (leakageScore > 0) {
    improvements.push(`Translate ${leakedTerms.length} Swedish term(s) to ${lang}: ${leakedTerms.slice(0, 3).map(t => `"${t.term}"`).join(', ')}`);
  }

  return { score, evidence, improvements };
}

/**
 * Multi-dimensional article quality assessment.
 *
 * Scores 6 dimensions independently, then computes a weighted overall score.
 * Returns actionable improvement suggestions and detected quality issues.
 *
 * @param html      - raw HTML of the article
 * @param lang      - language code (e.g. "en", "sv")
 * @param docIds    - source document IDs used in the article
 * @param threshold - minimum overall score to pass (typically MULTIDIM_QUALITY_THRESHOLD)
 * @returns MultiDimensionalQualityAssessment with per-dimension scores, issues, and suggestions
 */
export function assessArticleQuality(html: string, lang: string, docIds: readonly string[], threshold: number): MultiDimensionalQualityAssessment {
  // ── Pass 1: score each dimension ────────────────────────────────────────
  const factualAccuracy = scoreFactualAccuracy(html);
  const stakeholderCoverage = scoreStakeholderCoverage(html);
  const analyticalDepth = scoreAnalyticalDepth(html);
  const editorialConsistency = scoreEditorialConsistency(html);
  const evidenceQuality = scoreEvidenceQuality(html, docIds);
  const languageQuality = scoreLanguageQuality(html, lang);

  const dimensions = {
    factualAccuracy,
    stakeholderCoverage,
    analyticalDepth,
    editorialConsistency,
    evidenceQuality,
    languageQuality,
  };

  // ── Pass 2: aggregate weighted overall score ────────────────────────────
  const overallScore: number = Math.round(
    factualAccuracy.score * DIMENSION_WEIGHTS.factualAccuracy +
    stakeholderCoverage.score * DIMENSION_WEIGHTS.stakeholderCoverage +
    analyticalDepth.score * DIMENSION_WEIGHTS.analyticalDepth +
    editorialConsistency.score * DIMENSION_WEIGHTS.editorialConsistency +
    evidenceQuality.score * DIMENSION_WEIGHTS.evidenceQuality +
    languageQuality.score * DIMENSION_WEIGHTS.languageQuality,
  );

  // ── Collect issues sorted by severity ───────────────────────────────────
  const issues: QualityIssue[] = [];

  for (const [dimName, dim] of Object.entries(dimensions)) {
    if (dim.score < 50) {
      issues.push({
        severity: 'critical',
        dimension: dimName,
        description: `${dimName} score critically low (${dim.score}/100)`,
        suggestedFix: dim.improvements[0] ?? 'Improve this dimension',
      });
    } else if (dim.score < 70) {
      issues.push({
        severity: 'major',
        dimension: dimName,
        description: `${dimName} score below acceptable (${dim.score}/100)`,
        suggestedFix: dim.improvements[0] ?? 'Improve this dimension',
      });
    } else if (dim.score < 90 && dim.improvements.length > 0) {
      issues.push({
        severity: 'minor',
        dimension: dimName,
        description: `${dimName} has room for improvement (${dim.score}/100)`,
        suggestedFix: dim.improvements[0] ?? 'Improve this dimension',
      });
    }
  }

  // Sort: critical → major → minor
  const severityOrder: Record<string, number> = { critical: 0, major: 1, minor: 2 };
  issues.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  // ── Collect top suggestions ─────────────────────────────────────────────
  const suggestions: string[] = [];
  for (const dim of Object.values(dimensions)) {
    for (const imp of dim.improvements) {
      suggestions.push(imp);
    }
  }

  const passesThreshold: boolean = overallScore >= threshold;

  return {
    overallScore,
    dimensions,
    issues,
    suggestions,
    passesThreshold,
    assessmentPasses: 2,
  };
}

/** Print a summary of the multi-dimensional quality assessment to console. */
function printQualityReport(assessment: MultiDimensionalQualityAssessment, filename: string): void {
  const reportId: string = filename.replace(/\.html$/, '');
  console.log(`\n🔍 Multi-dimensional Quality Report: ${reportId}`);
  console.log(`   Overall score:          ${assessment.overallScore}/100 — ${assessment.passesThreshold ? 'PASSED' : 'BELOW THRESHOLD'}`);
  for (const [dimName, dim] of Object.entries(assessment.dimensions)) {
    const icon: string = dim.score >= 80 ? '✅' : dim.score >= 50 ? '⚠️' : '❌';
    console.log(`   ${dimName}: ${dim.score}/100 ${icon}`);
  }
  if (assessment.issues.length > 0) {
    console.log(`   Issues (${assessment.issues.length}):`);
    for (const issue of assessment.issues.slice(0, 5)) {
      console.log(`     [${issue.severity}] ${issue.description}`);
    }
  }
}

/**
 * Inject quality metadata as `<meta>` tags into the article `<head>`.
 * Inserts tags just before the closing `</head>` element.
 *
 * Quality metadata tags follow the quality-criteria.md v2 specification:
 * - `article:quality-score` — overall multi-dimensional score (0-100)
 * - `article:quality-version` — quality assessment version
 * - `article:quality-iterations` — number of assessment passes
 * - `article:quality-assessed` — whether a quality assessment is present
 */
export function injectQualityMetadata(html: string, assessment?: MultiDimensionalQualityAssessment): string {
  const score = assessment?.overallScore ?? 0;
  const passes = assessment?.assessmentPasses ?? 0;
  const version = 'v2';
  const qualityAssessed = assessment ? 'true' : 'false';

  const metaTags = [
    `  <meta name="article:quality-score" content="${score}">`,
    `  <meta name="article:quality-version" content="${version}">`,
    `  <meta name="article:quality-iterations" content="${passes}">`,
    `  <meta name="article:quality-assessed" content="${qualityAssessed}">`,
  ].join('\n');

  // Remove any existing quality meta tags first (idempotent)
  const qualityMetaTagPattern =
    /\s*<meta\b(?=[^>]*\bname\s*=\s*["']article:quality-[^"']+["'])[^>]*>\s*\n?/gi;
  const closingHeadPattern = /<\/head>/i;
  const sanitizedHtml = html.replace(qualityMetaTagPattern, '');

  // Insert before </head> (case-insensitive), preserving the original closing tag casing
  if (closingHeadPattern.test(sanitizedHtml)) {
    return sanitizedHtml.replace(closingHeadPattern, (match) => `${metaTags}\n${match}`);
  }
  return sanitizedHtml;
}

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
  /** Key themes from pre-computed synthesis analysis (for article enrichment) */
  synthesisKeyThemes?: string[];
  /** Aggregate risk summary from pre-computed risk assessment */
  riskSummary?: string;
  /** Date of the analysis data (may differ from article date due to lookback) */
  analysisDate?: string;
}

/**
 * Options controlling which analysis snapshot to load.
 *
 * - `maxDaysBack` controls how far back in time we search for an analysis file.
 *   Defaults to `3` days (preserves existing behavior).
 * - `basePath` allows callers/tests to select an alternative analysis base
 *   directory. When omitted, the default path used by `readLatestAnalysis`
 *   applies.
 */
export interface AnalysisEnrichmentOptions {
  maxDaysBack?: number;
  basePath?: string;
}

/**
 * Module-level cache so analysis is loaded at most once per process for a
 * given option set (maxDaysBack/basePath).
 */
const analysisEnrichmentCache = new Map<string, AnalysisEnrichment | null>();

/**
 * Attempt to load the latest pre-computed daily analysis and derive article
 * classification metadata.
 *
 * The result is cached for the lifetime of the process so that all article
 * generators that request the same (maxDaysBack, basePath) share the same
 * snapshot.
 *
 * Returns `null` when no analysis files are available (backward-compatible —
 * generators can omit classification fields).
 */
export async function getAnalysisEnrichment(
  options: AnalysisEnrichmentOptions = {},
): Promise<AnalysisEnrichment | null> {
  const maxDaysBack = options.maxDaysBack ?? 3;
  const basePath = options.basePath;
  const cacheKey = `${maxDaysBack}:${basePath ?? 'default'}`;

  if (analysisEnrichmentCache.has(cacheKey)) {
    return analysisEnrichmentCache.get(cacheKey) ?? null;
  }

  try {
    const analysis = await readLatestAnalysis(maxDaysBack, basePath);
    if (!analysis.hasAnalysis) {
      analysisEnrichmentCache.set(cacheKey, null);
      return null;
    }
    const meta = deriveArticleClassificationMeta(analysis);
    const enrichment: AnalysisEnrichment = {
      classificationLevel: meta.classificationLevel,
      riskLevel: meta.riskLevel,
      confidenceLabel: meta.confidenceLabel,
      significance: meta.significanceScore,
      urgency: meta.urgency,
      // Feed pre-computed analysis content into article generation
      synthesisKeyThemes: analysis.synthesis?.keyThemes ?? [],
      riskSummary: analysis.riskAssessment?.summary ?? undefined,
      analysisDate: analysis.date,
    };
    analysisEnrichmentCache.set(cacheKey, enrichment);
    console.log(`  📊 Analysis enrichment loaded: classification=${meta.classificationLevel}, risk=${meta.riskLevel}, confidence=${meta.confidenceLabel}, keyThemes=${enrichment.synthesisKeyThemes?.length ?? 0}`);
    return enrichment;
  } catch (error: unknown) {
    if (process.env.DEBUG || process.env.LOG_LEVEL === 'debug') {
      console.error(
        '⚠️  Failed to load analysis enrichment (falling back to null):',
        error,
      );
    }
    analysisEnrichmentCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Reset the analysis enrichment cache.  Useful in tests.
 */
export function resetAnalysisEnrichmentCache(): void {
  analysisEnrichmentCache.clear();
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
 * Write EN/SV article pair — convenience wrapper over writeSingleArticle
 */
export async function writeArticlePair(htmlEN: string, htmlSV: string, slug: string): Promise<void> {
  await writeSingleArticle(htmlEN, slug, 'en');
  await writeSingleArticle(htmlSV, slug, 'sv');
}

// ---------------------------------------------------------------------------
// Dynamic title/description generation from content highlights
// ---------------------------------------------------------------------------

/** Extract top N most relevant highlight phrases from article content */
// v5.0: The HIGHLIGHT_REJECT_PATTERNS array and extractHighlights/extractDominantTheme
// functions were removed. Title generation is now performed by the AI agent (Copilot
// opus 4.6) during agentic workflows — see ai-driven-analysis-guide.md v5.0.
// The BANNED_PATTERNS for content quality remain in shared.ts detectBannedPatterns().

/**
 * Generate a content-aware fallback title and subtitle from article content.
 *
 * The AI agent in the agentic workflow (.md prompt) SHOULD overwrite
 * both the title and subtitle with genuine, analysis-driven values.
 * This function provides a minimally newsworthy fallback so that articles
 * never ship with bare category labels as titles.
 *
 * Extracts policy domains from `<strong>` tags and h3 headings in content
 * to produce titles like "Committee Reports: Defence, Transport, and Climate"
 * instead of the bare "Committee Reports".
 *
 * @param baseTitle - The generic article type title (e.g. "Government Propositions")
 * @param content   - HTML content of the article body
 * @param docCount  - Number of source documents (0 if unknown)
 * @returns A `TitleSet` with content-aware fallback — AI agent should replace both.
 */
export function generateDynamicTitle(
  baseTitle: string,
  content: string,
  docCount: number,
): { title: string; subtitle: string } {
  // Extract topic hints from strong tags and h3 headings
  const seen = new Set<string>();
  const topics: string[] = [];
  const strongMatches = content.matchAll(/<strong[^>]*>([^<]{3,50})<\/strong>/gi);
  for (const m of strongMatches) {
    const text = m[1]?.trim();
    if (text && !seen.has(text) && topics.length < 5) {
      seen.add(text);
      topics.push(text);
    }
  }
  const h3Matches = content.matchAll(/<h3[^>]*>([^<]{3,60})<\/h3>/gi);
  for (const m of h3Matches) {
    const text = m[1]?.trim();
    if (text && !seen.has(text) && topics.length < 5) {
      seen.add(text);
      topics.push(text);
    }
  }

  // Sanitize topic strings: strip newlines, collapse whitespace, drop quotes
  const sanitized = topics.map(t =>
    t.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').replace(/["']/g, '').trim()
  ).filter(t => t.length >= 3);

  // Build a content-aware title if we found topic hints
  let title = baseTitle;
  let subtitle = `${baseTitle} — AI-generated political intelligence from Sweden's Riksdag`;

  const documentLabel = docCount === 1 ? 'document' : 'documents';
  const documentTitleLabel = docCount === 1 ? 'Document' : 'Documents';

  if (sanitized.length > 0) {
    const topicList = sanitized.slice(0, 3).join(', ');
    title = `${baseTitle}: ${topicList}`;
    const countStr = docCount > 0 ? ` across ${docCount} ${documentLabel}` : '';
    subtitle = `Analysis of ${topicList}${countStr} in Sweden's Riksdag`;
  } else if (docCount > 0) {
    title = `${baseTitle}: ${docCount} ${documentTitleLabel} Analyzed`;
    subtitle = `Analysis of ${docCount} parliamentary ${documentLabel} from Sweden's Riksdag`;
  }

  return { title, subtitle };
}
