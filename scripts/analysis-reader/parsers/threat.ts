/**
 * @module analysis-reader/parsers/threat
 * @description Parser for `threat-analysis.md` analysis artifacts.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  DemocraticHealthLabel,
  ThreatAnalysisResult,
} from '../types.js';
import { extractBulletList } from '../helpers/bullet-list.js';
import { extractIconTagged } from '../helpers/icon-tagged.js';
import {
  extractSection,
  extractValue,
} from '../helpers/section-extractor.js';
import { toConfidenceLabel } from './confidence.js';

/**
 * Normalize a string to a DemocraticHealthLabel.
 * Returns 'MEDIUM' as default when unrecognized.
 */
export function toDemocraticHealthLabel(value: string): DemocraticHealthLabel {
  const upper = value.toUpperCase().trim().replace(/[\s_-]+/g, '_');
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'LOW') return 'LOW';
  if (upper === 'AT_RISK' || upper === 'ATRISK') return 'AT_RISK';
  return 'MEDIUM';
}

/**
 * Parse `threat-analysis.md` into a structured ThreatAnalysisResult.
 */
export function parseThreatAnalysis(markdown: string): ThreatAnalysisResult {
  const indicators = extractIconTagged(markdown, '🎯');
  const democraticHealth = toDemocraticHealthLabel(extractValue(markdown, 'Democratic Health') || extractValue(markdown, 'Health Status') || 'MEDIUM');
  const confidence = toConfidenceLabel(extractValue(markdown, 'Confidence'));

  const actorsSection = extractSection(markdown, 'Key Actors') || extractSection(markdown, 'Actors');
  const actors = actorsSection ? extractBulletList(actorsSection) : [];

  const summarySection = extractSection(markdown, 'Summary') || extractSection(markdown, 'Overview');
  const summary = summarySection || markdown.split('\n').filter(l => l.trim().length > 30).slice(0, 2).join(' ');

  return { indicators: indicators.slice(0, 8), democraticHealth, actors: actors.slice(0, 6), confidence, summary };
}
