/**
 * @module analysis-reader/parsers/swot
 * @description Parser for `swot-analysis.md` analysis artifacts.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  AnalysisSwotEntry,
  ConfidenceLabel,
  SwotAnalysisResult,
} from '../types.js';
import { DOC_ID_PATTERN } from '../helpers/doc-ids.js';
import {
  extractSection,
  extractValue,
} from '../helpers/section-extractor.js';
import { toConfidenceLabel } from './confidence.js';

/**
 * Parse SWOT entries from a markdown quadrant section.
 */
function parseSwotEntries(sectionText: string): AnalysisSwotEntry[] {
  const entries: AnalysisSwotEntry[] = [];
  const blocks = sectionText.split(/\n(?=[-*]|\d+\.)/);
  for (const block of blocks) {
    const text = block.replace(/^\s*(?:[-*]|\d+\.)\s+/, '').trim();
    if (!text || text.startsWith('#')) continue;

    const confMatch = /\[(HIGH|MEDIUM|LOW)\]/i.exec(text);
    const confidence: ConfidenceLabel = confMatch ? toConfidenceLabel(confMatch[1]!) : 'MEDIUM';

    const impactMatch = /impact:\s*(high|medium|low)/i.exec(text);
    const impact = impactMatch
      ? (impactMatch[1]!.toLowerCase() as 'high' | 'medium' | 'low')
      : undefined;

    const docIdMatches = text.match(DOC_ID_PATTERN) ?? [];

    entries.push({
      text: text.replace(/\[(HIGH|MEDIUM|LOW)\]/gi, '').replace(/impact:\s*(high|medium|low)/gi, '').trim(),
      confidence,
      impact,
      sourceDocIds: docIdMatches,
    });
  }
  return entries.filter(e => e.text.length > 0);
}

/**
 * Parse `swot-analysis.md` into a structured SwotAnalysisResult.
 */
export function parseSwotAnalysis(markdown: string): SwotAnalysisResult {
  const subject = extractValue(markdown, 'Subject') || 'Swedish Parliament';
  const context = extractSection(markdown, 'Context') || undefined;

  const strengthsSection = extractSection(markdown, 'Strengths') || extractSection(markdown, '💪 Strengths');
  const weaknessesSection = extractSection(markdown, 'Weaknesses') || extractSection(markdown, '⚡ Weaknesses');
  const opportunitiesSection = extractSection(markdown, 'Opportunities') || extractSection(markdown, '🚀 Opportunities');
  const threatsSection = extractSection(markdown, 'Threats') || extractSection(markdown, '☁️ Threats');

  return {
    subject,
    strengths: parseSwotEntries(strengthsSection),
    weaknesses: parseSwotEntries(weaknessesSection),
    opportunities: parseSwotEntries(opportunitiesSection),
    threats: parseSwotEntries(threatsSection),
    context,
  };
}
