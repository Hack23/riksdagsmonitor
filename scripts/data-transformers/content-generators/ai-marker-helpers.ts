/**
 * @module data-transformers/content-generators/ai-marker-helpers
 * @description Banned content pattern detection.
 * Per SHARED_PROMPT_PATTERNS.md §BANNED Content Patterns v4.0,
 * these patterns must never appear in production articles.
 * AI agents MUST replace all AI_MUST_REPLACE markers with genuine analysis.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Banned content patterns that indicate low-quality boilerplate text.
 * Per SHARED_PROMPT_PATTERNS.md §BANNED Content Patterns v4.0, these
 * must never appear in production articles. AI agents MUST replace them
 * with genuine, document-specific analysis.
 */
const BANNED_PATTERNS: readonly { label: string; pattern: RegExp }[] = [
  { label: 'neutralText: "The political landscape remains fluid…"', pattern: /The political landscape remains fluid,? with both government and opposition positioning for advantage/i },
  { label: 'debateAnalysisMarker: "No chamber debate data is available…"', pattern: /No chamber debate data is available for these items,? limiting our ability/i },
  { label: 'policySignificanceTouches: "Touches on {domains}."', pattern: /Touches on (?![^.]*\b(?:but|however|primarily|although|while|despite|because)\b)[\p{L}\p{N}][\p{L}\p{N}\s,&/()-]*\./iu },
  { label: 'analysisOfNDocuments: "Analysis of N documents covering…"', pattern: /Analysis of \d+ documents covering/i },
  { label: 'policySignificanceGeneric: "Requires committee review and chamber debate…"', pattern: /Requires committee review and chamber debate/i },
  { label: 'topicInFocusSuffix: "…: {Topic} in Focus"', pattern: /:\s+\w[\w\s]*\bin Focus\b/i },
  { label: 'briefingOnFieldLabels: "Political intelligence briefing on {Field}: and {Field}:"', pattern: /Political intelligence briefing on \w+:\s+and\s+\w+:/i },
  // Deep Analysis generic template patterns — AI MUST replace these with specific analysis
  { label: 'genericTimeline: "The pace of activity signals…"', pattern: /The pace of activity signals the political urgency/i },
  { label: 'genericTimeline: "define the current legislative landscape"', pattern: /define the current legislative landscape/i },
  { label: 'genericWhy: "broad legislative push that will shape"', pattern: /broad legislative push that will shape multiple aspects/i },
  { label: 'genericWhy: "critical period for understanding the government"', pattern: /critical period for understanding the government.s strategic direction/i },
  { label: 'genericImpact: "culmination of legislative review, with recommendations that guide"', pattern: /culmination of legislative review,? with recommendations that guide/i },
  { label: 'genericImpact: "interplay between governing ambition and opposition scrutiny"', pattern: /interplay between governing ambition and opposition scrutiny/i },
  { label: 'genericConsequences: "cascade through committee deliberations"', pattern: /cascade through committee deliberations,? chamber votes/i },
  { label: 'genericConsequences: "establish the policy alternatives that opposition parties will champion"', pattern: /establish the policy alternatives that opposition parties will champion/i },
  { label: 'genericCritical: "Standard parliamentary procedures are being followed"', pattern: /Standard parliamentary procedures are being followed/i },
  { label: 'genericCritical: "gap between legislative intent and implementation"', pattern: /gap between legislative intent and implementation often reveals/i },
  { label: 'genericPillarTransition: "While parliament deliberates these legislative matters"', pattern: /While parliament deliberates these legislative matters/i },
  // Broken link format: relative `href="../analysis/..."` or `href="analysis/..."`
  // references to analysis markdown files. Articles are served from GitHub Pages
  // (riksdagsmonitor.com/news/…) where relative `.md` paths resolve to raw
  // markdown that does not render. The canonical form is the GitHub blob URL
  // `https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/…` (see
  // .github/aw/SHARED_PROMPT_PATTERNS.md §ANALYSIS FILE GITHUB REFERENCES and
  // exemplar news/2026-04-18-weekly-review-en.html).
  { label: 'relativeAnalysisHref: \'href="../analysis/…" relative link — use https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/…\'', pattern: /href="(?:\.\.?\/)+analysis\/[^"]+\.md"/ },
  { label: 'relativeAnalysisHref: \'href="analysis/…" bare relative link — use https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/…\'', pattern: /href="analysis\/daily\/[^"]+\.md"/ },
];

/**
 * Detect banned boilerplate patterns in HTML content.
 * Returns an array of human-readable labels identifying each detected
 * banned pattern, suitable for quality gate logs and error messages.
 *
 * @param html - The HTML string to scan for banned patterns
 * @returns Array of stable human-readable labels for each detected banned pattern
 */
export function detectBannedPatterns(html: string): string[] {
  const found: string[] = [];
  for (const { label, pattern } of BANNED_PATTERNS) {
    if (pattern.test(html)) {
      found.push(label);
    }
  }
  return found;
}
