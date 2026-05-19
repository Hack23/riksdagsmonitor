/**
 * @module analysis-reader/parsers/stakeholders
 * @description Parser for `stakeholder-perspectives.md` analysis artifacts.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { StakeholderPerspectivesResult } from '../types.js';
import { extractSection } from '../helpers/section-extractor.js';

/**
 * Parse `stakeholder-perspectives.md` into a structured StakeholderPerspectivesResult.
 */
export function parseStakeholderPerspectives(markdown: string): StakeholderPerspectivesResult {
  const government = extractSection(markdown, '🏛️ Government') || extractSection(markdown, 'Government') || '';
  const opposition = extractSection(markdown, '⚖️ Opposition') || extractSection(markdown, 'Opposition') || '';
  const citizen =
    extractSection(markdown, '👥 Citizen') ||
    extractSection(markdown, 'Citizen') ||
    extractSection(markdown, 'Citizens') ||
    '';
  const economic = extractSection(markdown, '💰 Economic') || extractSection(markdown, 'Economic') || '';
  const international = extractSection(markdown, '🌍 International') || extractSection(markdown, 'International') || '';
  const media = extractSection(markdown, '📰 Media') || extractSection(markdown, 'Media') || '';

  return {
    government: government.split('\n').filter(l => l.trim()).join(' ').trim(),
    opposition: opposition.split('\n').filter(l => l.trim()).join(' ').trim(),
    citizen: citizen.split('\n').filter(l => l.trim()).join(' ').trim(),
    economic: economic.split('\n').filter(l => l.trim()).join(' ').trim(),
    international: international.split('\n').filter(l => l.trim()).join(' ').trim(),
    media: media.split('\n').filter(l => l.trim()).join(' ').trim(),
  };
}
