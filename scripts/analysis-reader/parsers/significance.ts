/**
 * @module analysis-reader/parsers/significance
 * @description Parser for `significance-scoring.md` analysis artifacts.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  SignificanceScoringResult,
  UrgencyLabel,
} from '../types.js';
import {
  extractSection,
  extractValue,
} from '../helpers/section-extractor.js';
import { toConfidenceLabel } from './confidence.js';

/** Default significance score when none is found in the markdown */
export const DEFAULT_SIGNIFICANCE_SCORE = 50;

/**
 * Normalize urgency labels to the known UrgencyLabel union.
 * Returns 'standard' as safe default for unrecognized values.
 */
export function toUrgencyLabel(value: string): UrgencyLabel {
  const lower = value.toLowerCase().trim();
  if (lower === 'breaking') return 'breaking';
  if (lower === 'major') return 'major';
  if (lower === 'background') return 'background';
  return 'standard';
}

/**
 * Parse `significance-scoring.md` into a structured SignificanceScoringResult.
 */
export function parseSignificanceScoring(markdown: string): SignificanceScoringResult {
  const scoreStr = extractValue(markdown, 'Overall Score') || extractValue(markdown, 'Score');
  const score = scoreStr ? Math.min(100, Math.max(0, parseInt(scoreStr, 10) || DEFAULT_SIGNIFICANCE_SCORE)) : DEFAULT_SIGNIFICANCE_SCORE;
  const urgency = toUrgencyLabel(extractValue(markdown, 'Urgency') || 'standard');
  const confidence = toConfidenceLabel(extractValue(markdown, 'Confidence'));

  const topDocumentsSection = extractSection(markdown, 'Top Documents') || extractSection(markdown, 'Significant Documents');
  const topDocuments: Array<{ docId: string; score: number; reason: string }> = [];
  for (const line of topDocumentsSection.split('\n')) {
    const match = /([A-Z]\d{3,7}[A-Z]?).*?(\d{1,3})(?:%|\s+points?|\s+score)?[:\s—-]+(.+)/i.exec(line.trim());
    if (match) {
      const rawScore = parseInt(match[2]!, 10);
      topDocuments.push({
        docId: match[1]!,
        score: Math.min(100, Math.max(0, Number.isFinite(rawScore) ? rawScore : 0)),
        reason: match[3]!.trim(),
      });
    }
  }

  return { score, urgency, topDocuments: topDocuments.slice(0, 5), confidence };
}
