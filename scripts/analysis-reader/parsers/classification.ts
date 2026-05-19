/**
 * @module analysis-reader/parsers/classification
 * @description Parser for `classification-results.md` analysis artifacts.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  ClassificationLevel,
  ClassificationResult,
  PriorityLevel,
} from '../types.js';
import { extractBulletList } from '../helpers/bullet-list.js';
import { DOC_ID_PATTERN } from '../helpers/doc-ids.js';
import {
  extractSection,
  extractValue,
} from '../helpers/section-extractor.js';
import { toConfidenceLabel } from './confidence.js';

/**
 * Normalize a string to a ClassificationLevel.
 * Returns 'MEDIUM' as default when unrecognized.
 */
export function toClassificationLevel(value: string): ClassificationLevel {
  const upper = value.toUpperCase().trim();
  if (upper === 'CRITICAL') return 'CRITICAL';
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'LOW') return 'LOW';
  return 'MEDIUM';
}

/**
 * Normalize a string to a PriorityLevel.
 * Returns 'standard' as default when unrecognized.
 */
export function toPriorityLevel(value: string): PriorityLevel {
  const lower = value.toLowerCase().trim();
  if (lower === 'breaking') return 'breaking';
  if (lower === 'major') return 'major';
  if (lower === 'background') return 'background';
  return 'standard';
}

/**
 * Parse `classification-results.md` into a structured ClassificationResult.
 */
export function parseClassificationResults(markdown: string): ClassificationResult {
  const level = toClassificationLevel(extractValue(markdown, 'Level') || extractValue(markdown, 'Classification Level'));
  const priority = toPriorityLevel(extractValue(markdown, 'Priority'));
  const confidence = toConfidenceLabel(extractValue(markdown, 'Confidence'));

  const documentIds = Array.from(new Set(markdown.match(DOC_ID_PATTERN) ?? []));

  const domainsSection = extractSection(markdown, 'Policy Domains') || extractSection(markdown, 'Domains');
  const domains = domainsSection
    ? extractBulletList(domainsSection)
    : extractBulletList(extractSection(markdown, 'Classification') || '');

  const summarySection = extractSection(markdown, 'Summary');
  const summary =
    (summarySection && summarySection.trim()) ||
    /^(?!#)(.{30,})/m.exec(markdown)?.[1]?.trim() ||
    markdown.split('\n').find(l => l.trim().length > 30)?.trim() ||
    '';

  return { level, priority, confidence, summary, documentIds, domains: domains.slice(0, 10) };
}
