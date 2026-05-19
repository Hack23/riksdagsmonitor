/**
 * @module analysis-reader/parsers/risk
 * @description Parser for `risk-assessment.md` analysis artifacts.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RiskAssessment, RiskLevel } from '../types.js';
import { extractBulletList } from '../helpers/bullet-list.js';
import { extractIconTagged } from '../helpers/icon-tagged.js';
import {
  extractSection,
  extractValue,
} from '../helpers/section-extractor.js';
import { toConfidenceLabel } from './confidence.js';

/**
 * Normalize a string to a RiskLevel.
 * Returns 'moderate' as default when unrecognized.
 */
export function toRiskLevel(value: string): RiskLevel {
  const lower = value.toLowerCase().trim();
  if (lower === 'high') return 'high';
  if (lower === 'elevated') return 'elevated';
  if (lower === 'low') return 'low';
  return 'moderate';
}

/**
 * Parse `risk-assessment.md` into a structured RiskAssessment.
 */
export function parseRiskAssessment(markdown: string): RiskAssessment {
  const level = toRiskLevel(extractValue(markdown, 'Overall Risk') || extractValue(markdown, 'Risk Level'));
  const confidence = toConfidenceLabel(extractValue(markdown, 'Confidence'));

  const factorsSection = extractSection(markdown, 'Risk Factors') || extractSection(markdown, 'Factors');
  const factors = factorsSection ? extractBulletList(factorsSection) : [];

  const indicators = extractIconTagged(markdown, '⚠️');

  const summarySection = extractSection(markdown, 'Summary') || extractSection(markdown, 'Overview');
  const summary = summarySection || markdown.split('\n').filter(l => l.trim().length > 30).slice(0, 2).join(' ');

  return { level, factors: factors.slice(0, 10), indicators: indicators.slice(0, 8), confidence, summary };
}
