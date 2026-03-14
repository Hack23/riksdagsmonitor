/**
 * @module ai-analysis/quality-assessor
 * @description Multi-dimensional quality assessment for generated news articles.
 *
 * Implements a 6-dimension quality scoring framework:
 *   1. Factual Accuracy   (25%) — document references match source material
 *   2. Stakeholder Coverage (20%) — all relevant perspectives represented
 *   3. Analytical Depth   (20%) — substance beyond surface description
 *   4. Editorial Consistency (15%) — consistent tone, structure, headings
 *   5. Evidence Quality   (10%) — assertions backed by document references
 *   6. Language Quality   (10%) — word count, clarity, readability
 *
 * The assessor runs as two passes:
 *   Pass 1 — compute dimension scores from HTML content
 *   Pass 2 — aggregate, flag issues, build suggestions list
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { extractPartyMentions } from '../party-variants.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Score for a single quality dimension */
export interface DimensionScore {
  /** 0–100 score for this dimension */
  score: number;
  /** Evidence items used to compute the score */
  evidence: string[];
  /** Suggested improvements for this dimension */
  improvements: string[];
}

/** Severity of a quality issue */
export type QualityIssueSeverity = 'critical' | 'major' | 'minor';

/** A single quality problem found in the article */
export interface QualityIssue {
  severity: QualityIssueSeverity;
  dimension: string;
  description: string;
  suggestedFix: string;
}

/** Full multi-dimensional quality assessment result */
export interface MultiDimensionalQualityAssessment {
  /** 0–100 weighted overall score */
  overallScore: number;
  /** Per-dimension scores */
  dimensions: {
    factualAccuracy: DimensionScore;
    stakeholderCoverage: DimensionScore;
    analyticalDepth: DimensionScore;
    editorialConsistency: DimensionScore;
    evidenceQuality: DimensionScore;
    languageQuality: DimensionScore;
  };
  /** Issues detected (sorted: critical → major → minor) */
  issues: QualityIssue[];
  /** Suggested improvements */
  suggestions: string[];
  /** Whether the article passes the quality threshold */
  passesThreshold: boolean;
  /** Iteration count used (always ≥ 2) */
  iterationCount: number;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Dimension weights — must sum to 1.0 */
const DIMENSION_WEIGHTS = {
  factualAccuracy: 0.25,
  stakeholderCoverage: 0.20,
  analyticalDepth: 0.20,
  editorialConsistency: 0.15,
  evidenceQuality: 0.10,
  languageQuality: 0.10,
} as const;

/** Riksdag/Regering document ID patterns */
const DOCUMENT_ID_PATTERNS: readonly RegExp[] = [
  /\b[A-Z]{1,3}\d{1,4}\/\d{2}:\d+\b/g,
  /\bProp\.\s*\d{4}\/\d{2}:\d+\b/gi,
  /\bBet\.\s*\d{4}\/\d{2}:[A-Z]{1,3}\d+\b/gi,
  /\bMot\.\s*\d{4}\/\d{2}:\d+\b/gi,
  /\bIP\s*\d{4}\/\d{2}:\d+\b/gi,
  /\bFr\.\s*\d{4}\/\d{2}:\d+\b/gi,
];

/** Words / phrases indicating causal or analytical reasoning */
const CAUSAL_WORDS: readonly string[] = [
  'because', 'therefore', 'as a result', 'consequently',
  'due to', 'leads to', 'caused by', 'results in',
];

const COMPARATIVE_WORDS: readonly string[] = [
  'compared to', 'in contrast', 'while', 'whereas',
  'on the other hand', 'however', 'unlike',
];

const TREND_WORDS: readonly string[] = [
  'trend', 'pattern', 'shift', 'change', 'evolution', 'development',
];

const EVIDENCE_WORDS: readonly string[] = [
  'data shows', 'according to', 'study', 'report', 'statistics',
  'evidence', 'figures', 'statistics show',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Normalize a document ID for deduplication and comparison. */
function normalizeDocId(id: string): string {
  return id.replace(/\s+/g, ' ').trim().toUpperCase();
}

function countDocumentIds(html: string): Set<string> {
  const ids = new Set<string>();
  for (const pattern of DOCUMENT_ID_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g');
    for (const m of html.matchAll(re)) {
      ids.add(normalizeDocId(m[0]));
    }
  }
  return ids;
}

/**
 * Count how many of the 8 Swedish parliamentary parties are mentioned.
 *
 * Delegates to the canonical `extractPartyMentions()` from
 * `scripts/party-variants.ts` which uses Unicode-aware regex boundaries
 * (`\p{L}`, `\p{N}`) for correct matching of Swedish names like
 * `Vänsterpartiet` and `Miljöpartiet`.
 */
function countParties(html: string): Set<string> {
  const codes = extractPartyMentions(html);
  return new Set<string>(codes);
}

// ---------------------------------------------------------------------------
// Pass 1 — dimension score computation
// ---------------------------------------------------------------------------

/**
 * Factual Accuracy dimension (25 %)
 *
 * Measures whether the article references source documents.
 * High score: ≥ 5 unique document IDs cited.
 * Low score: generic text with no Riksdag/Regering document references.
 */
function assessFactualAccuracy(
  html: string,
  sourceDocIds: readonly string[],
): DimensionScore {
  const foundIds = countDocumentIds(html);
  const evidence: string[] = [];
  const improvements: string[] = [];

  // Base score from raw document-ID count
  const rawCount = foundIds.size;
  let score = Math.min(100, Math.round((rawCount / 5) * 100));

  if (rawCount === 0) {
    improvements.push('Add at least 3–5 references to specific Riksdag documents (e.g. Prop. 2024/25:1, Bet. 2024/25:FiU10)');
    score = 0;
  } else {
    evidence.push(`${rawCount} document ID(s) cited: ${[...foundIds].slice(0, 5).join(', ')}`);
    if (rawCount < 3) {
      improvements.push('Add more document references for stronger factual grounding');
    }
  }

  // Bonus: verify cited IDs against source list — reward matches, don't penalise
  if (sourceDocIds.length > 0) {
    const normalizedSources = sourceDocIds.map(normalizeDocId);
    const matched = [...foundIds].filter(id =>
      normalizedSources.some(src => src.includes(id))
    ).length;
    const matchRatio = matched / Math.max(foundIds.size, 1);
    // Add up to 20 bonus points when all cited IDs match source docs
    const bonus = Math.round(20 * matchRatio);
    score = Math.min(100, score + bonus);
    evidence.push(`${matched}/${foundIds.size} cited IDs verified against source documents (+${bonus} bonus)`);
  }

  return { score, evidence, improvements };
}

/**
 * Stakeholder Coverage dimension (20 %)
 *
 * Swedish parliament has 8 parties; all perspectives should be represented.
 * High score: ≥ 6 parties mentioned.
 */
function assessStakeholderCoverage(html: string): DimensionScore {
  const parties = countParties(html);
  const evidence: string[] = [];
  const improvements: string[] = [];

  const score = Math.min(100, Math.round((parties.size / 6) * 100));

  if (parties.size === 0) {
    improvements.push('Include perspectives from at least 4 Swedish parliamentary parties');
  } else {
    evidence.push(`${parties.size}/8 parties represented: ${[...parties].join(', ')}`);
    if (parties.size < 4) {
      improvements.push(`Add perspectives from more parties (currently ${parties.size}/8)`);
    }
  }

  // Check for government/opposition balance
  const text = stripHtml(html).toLowerCase();
  const govTerms = ['government', 'minister', 'statsminister', 'riksdag'];
  const oppTerms = ['opposition', 'motions', 'critics', 'debate'];
  const hasGov = govTerms.some(t => text.includes(t));
  const hasOpp = oppTerms.some(t => text.includes(t));

  if (!hasGov || !hasOpp) {
    improvements.push('Ensure both government and opposition perspectives are represented');
  } else {
    evidence.push('Both government and opposition perspectives present');
  }

  return { score, evidence, improvements };
}

/**
 * Analytical Depth dimension (20 %)
 *
 * Measures substantive analysis beyond surface-level description.
 */
function assessAnalyticalDepth(html: string): DimensionScore {
  const text = stripHtml(html).toLowerCase();
  const evidence: string[] = [];
  const improvements: string[] = [];
  let raw = 0;

  const causal = CAUSAL_WORDS.filter(w => text.includes(w)).length;
  raw += Math.min(causal * 4, 20);
  if (causal > 0) evidence.push(`${causal} causal-reasoning indicator(s)`);

  const comparative = COMPARATIVE_WORDS.filter(w => text.includes(w)).length;
  raw += Math.min(comparative * 4, 20);
  if (comparative > 0) evidence.push(`${comparative} comparative-analysis indicator(s)`);

  const trend = TREND_WORDS.filter(w => text.includes(w)).length;
  raw += Math.min(trend * 4, 20);
  if (trend > 0) evidence.push(`${trend} trend-analysis indicator(s)`);

  const evidenceW = EVIDENCE_WORDS.filter(w => text.includes(w)).length;
  raw += Math.min(evidenceW * 4, 20);
  if (evidenceW > 0) evidence.push(`${evidenceW} evidence-based indicator(s)`);

  // Multiple perspectives (blockquotes or attributed quotes)
  const quotes = (html.match(/<blockquote>/gi) || []).length +
                 Math.floor((text.match(/"\w/g) || []).length / 2);
  raw += Math.min(quotes * 4, 20);
  if (quotes > 0) evidence.push(`${quotes} attributed quote(s) or blockquote(s)`);

  const score = Math.min(100, raw);

  if (score < 40) {
    improvements.push('Add causal reasoning — explain WHY events are happening, not just WHAT happened');
    improvements.push('Include comparative context: how does this compare to previous periods or other countries?');
  }
  if (score < 70) {
    improvements.push('Add trend analysis or pattern recognition');
  }

  return { score, evidence, improvements };
}

/**
 * Editorial Consistency dimension (15 %)
 *
 * Checks for required structural elements: h2 sections, "Why it matters",
 * historical context, forward-looking assessment.
 */
function assessEditorialConsistency(html: string): DimensionScore {
  const text = stripHtml(html).toLowerCase();
  const evidence: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // h2 analytical sections (30 pts for ≥ 3)
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const sectionPts = Math.min(30, Math.round((h2Count / 3) * 30));
  score += sectionPts;
  if (h2Count >= 3) {
    evidence.push(`${h2Count} analytical h2 sections`);
  } else {
    improvements.push(`Add more analytical sections (have ${h2Count}, need ≥ 3 h2 headings)`);
  }

  // "Why it matters" (20 pts)
  const whyPatterns = [/why\s+this\s+matters/i, /varför\s+detta/i, /implications/i, /konsekvenser/i];
  if (whyPatterns.some(p => p.test(html))) {
    score += 20;
    evidence.push('"Why it matters" section present');
  } else {
    improvements.push('Add a "Why This Matters" section explaining policy implications');
  }

  // Historical context (20 pts)
  const histPatterns = [/historically/i, /in \d{4}/, /since \d{4}/, /tidigare/i, /historiskt/i];
  if (histPatterns.some(p => p.test(text))) {
    score += 20;
    evidence.push('Historical context present');
  } else {
    improvements.push('Add historical context to provide background');
  }

  // Forward-looking assessment (15 pts)
  const fwdWords = ['next', 'upcoming', 'future', 'expected', 'will', 'coming weeks', 'framöver', 'nästa'];
  if (fwdWords.some(w => text.includes(w))) {
    score += 15;
    evidence.push('Forward-looking assessment present');
  } else {
    improvements.push('Add a forward-looking "What happens next" assessment');
  }

  // Article structure (back-to-news, language switcher — 15 pts)
  const hasLanguageSwitcher = /class=["'][^"']*\blanguage-switcher\b/.test(html);
  const hasBackToNews = /class=["'][^"']*\bback-to-news\b/.test(html);
  if (hasLanguageSwitcher && hasBackToNews) {
    score += 15;
    evidence.push('Navigation structure complete');
  } else {
    if (!hasLanguageSwitcher) improvements.push('Language switcher nav missing');
    if (!hasBackToNews) improvements.push('Back-to-news link missing');
  }

  return { score: Math.min(100, score), evidence, improvements };
}

/**
 * Evidence Quality dimension (10 %)
 *
 * Measures how well assertions are backed by specific document references,
 * source links, or official statistics.
 */
function assessEvidenceQuality(html: string): DimensionScore {
  const evidence: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // Document IDs as evidence anchors (40 pts for ≥ 3)
  const docIds = countDocumentIds(html);
  const docPts = Math.min(40, Math.round((docIds.size / 3) * 40));
  score += docPts;
  if (docIds.size > 0) {
    evidence.push(`${docIds.size} document reference(s)`);
  } else {
    improvements.push('Add specific document references (Riksdag/Regering IDs)');
  }

  // Source links in article (30 pts for ≥ 2 external hrefs)
  const externalLinks = (html.match(/href="https?:\/\//g) || []).length;
  const linkPts = Math.min(30, Math.round((externalLinks / 2) * 30));
  score += linkPts;
  if (externalLinks > 0) {
    evidence.push(`${externalLinks} source link(s)`);
  } else {
    improvements.push('Add source links to official documents or press releases');
  }

  // Sources section (30 pts)
  const hasSources = /class=["'][^"']*\bsources\b/.test(html) || /Sources:/i.test(html) || /<h[23][^>]*>\s*Sources/i.test(html);
  if (hasSources) {
    score += 30;
    evidence.push('Sources section present');
  } else {
    improvements.push('Add a dedicated Sources section listing all cited documents');
  }

  return { score: Math.min(100, score), evidence, improvements };
}

/**
 * Language Quality dimension (10 %)
 *
 * Measures readability and clarity: word count, paragraph structure,
 * absence of untranslated markers.
 */
function assessLanguageQuality(html: string, lang: string): DimensionScore {
  const text = stripHtml(html);
  const evidence: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // Word count (40 pts for ≥ 1 000 words)
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const wordPts = Math.min(40, Math.round((wordCount / 1000) * 40));
  score += wordPts;
  evidence.push(`${wordCount} words`);
  if (wordCount < 400) {
    improvements.push('Expand article to at least 600–1 000 words for adequate depth');
  }

  // Translation completeness — non-Swedish articles should have no data-translate markers (30 pts)
  if (lang !== 'sv') {
    const untranslated = (html.match(/data-translate="true"/g) || []).length;
    if (untranslated === 0) {
      score += 30;
      evidence.push('No untranslated markers');
    } else {
      improvements.push(`${untranslated} untranslated Swedish span(s) — complete translation`);
    }
  } else {
    score += 30;
    evidence.push('Swedish source language — translation check not applicable');
  }

  // Paragraph structure (30 pts for ≥ 5 paragraphs)
  const paragraphs = (html.match(/<p[\s>]/gi) || []).length;
  const paraPts = Math.min(30, Math.round((paragraphs / 5) * 30));
  score += paraPts;
  if (paragraphs >= 5) {
    evidence.push(`${paragraphs} paragraph(s)`);
  } else {
    improvements.push(`Add more paragraphs (have ${paragraphs}, need ≥ 5)`);
  }

  return { score: Math.min(100, score), evidence, improvements };
}

// ---------------------------------------------------------------------------
// Pass 2 — aggregation + issue detection
// ---------------------------------------------------------------------------

function buildIssues(
  dims: MultiDimensionalQualityAssessment['dimensions'],
  threshold: number,
): QualityIssue[] {
  const issues: QualityIssue[] = [];

  const add = (
    severity: QualityIssueSeverity,
    dimension: string,
    score: number,
    description: string,
    suggestedFix: string,
  ) => {
    if (score < threshold) {
      issues.push({ severity, dimension, description, suggestedFix });
    }
  };

  add('critical', 'factualAccuracy',      dims.factualAccuracy.score,      'Low factual accuracy score — insufficient document references',       'Add Riksdag/Regering document IDs that support each claim');
  add('major',    'stakeholderCoverage',  dims.stakeholderCoverage.score,  'Inadequate stakeholder coverage — missing party perspectives',        'Include positions of all major parliamentary parties');
  add('major',    'analyticalDepth',      dims.analyticalDepth.score,      'Insufficient analytical depth — article is descriptive, not analytical', 'Add causal reasoning, comparisons, and trend analysis');
  add('major',    'editorialConsistency', dims.editorialConsistency.score, 'Editorial structure incomplete',                                       'Add h2 sections, "Why it matters", historical context');
  add('minor',    'evidenceQuality',      dims.evidenceQuality.score,      'Evidence quality below threshold',                                     'Add source links and a dedicated Sources section');
  add('minor',    'languageQuality',      dims.languageQuality.score,      'Language quality below threshold',                                     'Expand word count, fix untranslated markers, add paragraphs');

  // Sort: critical → major → minor
  const order: Record<QualityIssueSeverity, number> = { critical: 0, major: 1, minor: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run multi-dimensional quality assessment on a generated article.
 *
 * The assessment performs two passes:
 *   Pass 1 — compute all six dimension scores from the HTML content
 *   Pass 2 — aggregate dimensions into a weighted overall score and build the issues list
 *
 * Always returns `iterationCount >= 2`.
 *
 * @param html            - Full HTML content of the article
 * @param lang            - ISO 639-1 language code (e.g. "en")
 * @param sourceDocIds    - Document IDs available in the source data for cross-checking
 * @param passThreshold   - Minimum overall score to pass (0–100, default 60)
 */
export function assessArticleQuality(
  html: string,
  lang: string,
  sourceDocIds: readonly string[] = [],
  passThreshold = 60,
): MultiDimensionalQualityAssessment {
  // ── Pass 1: compute dimension scores ──────────────────────────────────────
  const factualAccuracy      = assessFactualAccuracy(html, sourceDocIds);
  const stakeholderCoverage  = assessStakeholderCoverage(html);
  const analyticalDepth      = assessAnalyticalDepth(html);
  const editorialConsistency = assessEditorialConsistency(html);
  const evidenceQuality      = assessEvidenceQuality(html);
  const languageQuality      = assessLanguageQuality(html, lang);

  const dimensions = {
    factualAccuracy,
    stakeholderCoverage,
    analyticalDepth,
    editorialConsistency,
    evidenceQuality,
    languageQuality,
  };

  // ── Pass 2: aggregate + issues ────────────────────────────────────────────
  const overallScore = Math.round(
    factualAccuracy.score      * DIMENSION_WEIGHTS.factualAccuracy +
    stakeholderCoverage.score  * DIMENSION_WEIGHTS.stakeholderCoverage +
    analyticalDepth.score      * DIMENSION_WEIGHTS.analyticalDepth +
    editorialConsistency.score * DIMENSION_WEIGHTS.editorialConsistency +
    evidenceQuality.score      * DIMENSION_WEIGHTS.evidenceQuality +
    languageQuality.score      * DIMENSION_WEIGHTS.languageQuality,
  );

  const dimensionThreshold = passThreshold * 0.6; // dimension-level warning at 60% of overall threshold
  const issues = buildIssues(dimensions, dimensionThreshold);

  // Gather all improvement suggestions
  const suggestions: string[] = [
    ...factualAccuracy.improvements,
    ...stakeholderCoverage.improvements,
    ...analyticalDepth.improvements,
    ...editorialConsistency.improvements,
    ...evidenceQuality.improvements,
    ...languageQuality.improvements,
  ];

  return {
    overallScore,
    dimensions,
    issues,
    suggestions,
    passesThreshold: overallScore >= passThreshold,
    iterationCount: 2, // Two assessment passes: Pass 1 computes dimension scores, Pass 2 aggregates and builds issues
  };
}

/**
 * Render a quality assessment as a concise console report.
 */
export function printQualityReport(
  assessment: MultiDimensionalQualityAssessment,
  filename: string,
): void {
  const { overallScore, passesThreshold, dimensions, issues, suggestions, iterationCount } = assessment;
  const label = passesThreshold ? '✅' : '⚠️';
  console.log(`\n📊 Multi-Dimensional Quality Report: ${filename.replace(/\.html$/, '')}`);
  console.log(`   Overall Score:          ${overallScore}/100 — ${passesThreshold ? 'PASSED' : 'BELOW THRESHOLD'} ${label}`);
  console.log(`   Iterations:             ${iterationCount}`);
  console.log(`   Factual Accuracy:       ${dimensions.factualAccuracy.score}/100     (weight 25%)`);
  console.log(`   Stakeholder Coverage:   ${dimensions.stakeholderCoverage.score}/100     (weight 20%)`);
  console.log(`   Analytical Depth:       ${dimensions.analyticalDepth.score}/100     (weight 20%)`);
  console.log(`   Editorial Consistency:  ${dimensions.editorialConsistency.score}/100     (weight 15%)`);
  console.log(`   Evidence Quality:       ${dimensions.evidenceQuality.score}/100     (weight 10%)`);
  console.log(`   Language Quality:       ${dimensions.languageQuality.score}/100     (weight 10%)`);

  if (issues.length > 0) {
    console.log(`   Issues (${issues.length}):`);
    for (const issue of issues.slice(0, 5)) {
      const sev = issue.severity === 'critical' ? '🔴' : issue.severity === 'major' ? '🟡' : '🔵';
      console.log(`     ${sev} [${issue.dimension}] ${issue.description}`);
    }
  }
  if (!passesThreshold && suggestions.length > 0) {
    console.log(`   Top suggestions:`);
    for (const s of suggestions.slice(0, 3)) {
      console.log(`     → ${s}`);
    }
  }
}

/**
 * Inject quality metadata into article HTML as a `<meta>` tag and,
 * optionally, an inline JSON-LD block.
 *
 * **CSP note:** An inline `<script type="application/ld+json">` element is
 * still an inline script from the browser's perspective.  If the page's
 * Content-Security-Policy sets `script-src` without `'unsafe-inline'` (e.g.
 * `script-src 'self' https:`, which is the standard pattern in this repo),
 * the JSON-LD block will be blocked by the browser.  To keep things safe:
 *
 *  - The `<meta name="quality-score">` tag is injected when a `</head>`
 *    insertion point is found (CSP-safe).
 *  - The JSON-LD `<script>` block is only injected when `injectJsonLd` is
 *    `true` (default: `false`).  Callers that know their CSP allows inline
 *    scripts can opt in.
 *  - If the HTML contains no `</head>` tag the function returns the original
 *    HTML unchanged (no injection possible without a `<head>` section).
 *
 * @param html          - Original article HTML
 * @param assessment    - Quality assessment result
 * @param injectJsonLd  - If `true`, also add the JSON-LD script block
 *                        (requires CSP to permit inline scripts). Default: `false`.
 * @returns             Modified HTML with quality metadata injected, or the
 *                      original HTML if no `</head>` tag is present.
 */
export function injectQualityMetadata(
  html: string,
  assessment: MultiDimensionalQualityAssessment,
  injectJsonLd = false,
): string {
  const { overallScore, dimensions, passesThreshold, iterationCount } = assessment;

  // Always inject the CSP-safe <meta> tag
  const metaTag = `  <meta name="quality-score" content="${overallScore}">`;

  let injection = metaTag;

  // Only inject inline JSON-LD when explicitly opted in (requires CSP 'unsafe-inline')
  if (injectJsonLd) {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Rating',
      ratingValue: overallScore,
      bestRating: 100,
      worstRating: 0,
      ratingExplanation: `Multi-dimensional quality assessment (${iterationCount} passes)`,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'passesThreshold', value: passesThreshold },
        { '@type': 'PropertyValue', name: 'factualAccuracy', value: dimensions.factualAccuracy.score },
        { '@type': 'PropertyValue', name: 'stakeholderCoverage', value: dimensions.stakeholderCoverage.score },
        { '@type': 'PropertyValue', name: 'analyticalDepth', value: dimensions.analyticalDepth.score },
        { '@type': 'PropertyValue', name: 'editorialConsistency', value: dimensions.editorialConsistency.score },
        { '@type': 'PropertyValue', name: 'evidenceQuality', value: dimensions.evidenceQuality.score },
        { '@type': 'PropertyValue', name: 'languageQuality', value: dimensions.languageQuality.score },
      ],
    });
    const jsonLdTag = `  <script type="application/ld+json">\n  ${jsonLd}\n  </script>`;
    injection = `${metaTag}\n${jsonLdTag}`;
  }

  // Insert before </head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${injection}\n</head>`);
  }

  return html;
}
