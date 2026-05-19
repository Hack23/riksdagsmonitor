/**
 * @module scripts/validators/article/rules/citation-density
 * @description Citation-density helpers — `countWords` (markdown-aware
 *              token counter) and `computeCitationDensity`
 *              (words per evidence anchor).
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 410–440
 *              (`countWords`, `computeCitationDensity`). Logic is
 *              byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { countArticleEvidenceAnchors } from './evidence-anchors.js';

/**
 * Count words in text (splits on whitespace, excludes markdown syntax tokens).
 */
export function countWords(text: string): number {
  let cleaned = text;
  cleaned = cleaned.replace(/```[^\n]*\n[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]+`/g, '');
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/<[^>]+>/g, '');
  }
  cleaned = cleaned.replace(/^\s*\|[\s:|-]+\|\s*$/gm, '');
  cleaned = cleaned.replace(/\|/g, ' ');
  cleaned = cleaned.replace(/^\s*[>#+*-]\s*/gm, '');
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * Compute citation density: words per evidence anchor. Lower = denser.
 * Returns Infinity if zero anchors found.
 */
export function computeCitationDensity(text: string): number {
  const anchors = countArticleEvidenceAnchors(text);
  if (anchors === 0) return Infinity;
  const words = countWords(text);
  return words / anchors;
}

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ArticleViolation } from '../types.js';
import { REPO_ROOT } from '../types.js';

/** Low-citation-density rule. Uses `reference-quality-thresholds.json` per-article overrides. */
export function checkCitationDensity(
  rel: string,
  text: string,
  subfolderName: string,
): ArticleViolation[] {
  const wordCount = countWords(text);
  const anchors = countArticleEvidenceAnchors(text);
  if (wordCount > 0 && anchors === 0) {
    return [
      {
        file: rel,
        code: 'low-citation-density',
        message: `Article has ${wordCount} words but zero verifiable evidence anchors. Add dok_id references, vote IDs, or primary-source URLs.`,
      },
    ];
  }
  if (anchors === 0) return [];
  const density = wordCount / anchors;
  let threshold = 200;
  if (subfolderName) {
    try {
      const thresholdsPath = join(
        REPO_ROOT,
        'analysis',
        'methodologies',
        'reference-quality-thresholds.json',
      );
      if (existsSync(thresholdsPath)) {
        const thresholds = JSON.parse(readFileSync(thresholdsPath, 'utf8')) as {
          aiFirst?: { citationDensity?: { perArticle?: Record<string, number | string> } };
        };
        const perArticle = thresholds.aiFirst?.citationDensity?.perArticle;
        if (perArticle) {
          const typeThreshold = perArticle[subfolderName];
          if (typeof typeThreshold === 'number') {
            threshold = typeThreshold;
          }
        }
      }
    } catch {
      // Fall back to default threshold on parse error
    }
  }
  if (density > threshold) {
    return [
      {
        file: rel,
        code: 'low-citation-density',
        message: `Citation density is ${Math.round(density)} words/anchor — maximum allowed is ${threshold} (for article type "${subfolderName}"). Add more evidence anchors (dok_id, vote IDs, primary-source URLs) to meet the editorial floor.`,
      },
    ];
  }
  return [];
}
