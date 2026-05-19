/**
 * @module analysis-reader/parsers/synthesis
 * @description Parser for `synthesis-summary.md` analysis artifacts.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { SynthesisSummaryResult } from '../types.js';
import { extractBulletList } from '../helpers/bullet-list.js';
import { extractSection } from '../helpers/section-extractor.js';

/**
 * Parse `synthesis-summary.md` into a structured SynthesisSummaryResult.
 */
export function parseSynthesisSummary(markdown: string): SynthesisSummaryResult {
  const narrativeDirection = extractSection(markdown, 'Narrative Direction') || extractSection(markdown, 'Primary Narrative') || '';
  const articleFocus = extractSection(markdown, 'Article Focus') || extractSection(markdown, 'Focus') || '';

  const themesSection = extractSection(markdown, 'Key Themes') || extractSection(markdown, 'Themes');
  const keyThemes = themesSection ? extractBulletList(themesSection) : [];

  const forwardSection = extractSection(markdown, 'Forward Indicators') || extractSection(markdown, 'What to Watch');
  const forwardIndicators = forwardSection ? extractBulletList(forwardSection) : [];

  const freshnessMatch = /\*\*Data Freshness\*\*:\s*Documents sourced from \*\*(\d{4}-\d{2}-\d{2})\*\*/.exec(markdown);
  const dataFreshness = freshnessMatch?.[1] ?? null;

  return {
    narrativeDirection: narrativeDirection.split('\n').filter(l => l.trim()).join(' ').trim(),
    keyThemes: keyThemes.slice(0, 8),
    articleFocus: articleFocus.split('\n').filter(l => l.trim()).join(' ').trim(),
    forwardIndicators: forwardIndicators.slice(0, 5),
    dataFreshness,
  };
}
