/**
 * @module data-transformers/constants/content-labels
 * @description Assembled CONTENT_LABELS for all 14 supported languages.
 * Combines part1 (en, sv, da, no, fi, de, fr) and part2 (es, nl, ar, he, ja, ko, zh)
 * into the typed Record<Language, ContentLabelSet> used throughout the pipeline.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import type { ContentLabelSet } from '../../types/content.js';
import { CONTENT_LABELS_PART1 } from './content-labels-part1.js';
import { CONTENT_LABELS_PART2 } from './content-labels-part2.js';

// Combine the two partial maps into the full typed record.
// The cast is safe because part1 + part2 together cover all 14 Language keys.
export const CONTENT_LABELS: Record<Language, ContentLabelSet> = {
  ...CONTENT_LABELS_PART1,
  ...CONTENT_LABELS_PART2,
} as Record<Language, ContentLabelSet>;
