/**
 * @module scripts/validators/article/rules/landmarks
 * @description Reader-facing landmark guard — every aggregated article
 *              must contain Reader Intelligence Guide, Executive Brief,
 *              BLUF, and Article Sources sections.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 83–104
 *              (`REQUIRED_LANDMARKS`). Logic is byte-identical to the
 *              original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Reader-Facing Output Contract — every aggregated article must contain
 * these reader-facing landmarks. The aggregator generates the Reader
 * Intelligence Guide and the Article Sources appendix automatically;
 * the BLUF and Executive Brief sections come from the
 * `executive-brief.md` artifact and are guarded here so a malformed
 * template can't ship a headless article.
 */
export const REQUIRED_LANDMARKS: ReadonlyArray<{
  pattern: RegExp;
  label: string;
  code: string;
}> = [
  {
    pattern: /^##\s+Reader Intelligence Guide\s*$/m,
    label: 'Reader Intelligence Guide',
    code: 'missing-reader-guide',
  },
  {
    pattern: /^##\s+(?:What Happened|Executive Brief)\s*$/m,
    label: '## What Happened (Executive Brief) section',
    code: 'missing-executive-brief',
  },
  {
    pattern: /^#{2,6}\s+(?:[^\n]*?\s)?(?:BLUF|Lede)\b/im,
    label: 'BLUF/Lede heading inside the executive brief',
    code: 'missing-bluf',
  },
  {
    pattern: /^##\s+Article Sources\s*$/m,
    label: 'Article Sources appendix',
    code: 'missing-sources-appendix',
  },
];

import type { ArticleViolation } from '../types.js';

/** Required-landmark + duplicate-Reader-Guide rule. */
export function checkLandmarks(rel: string, text: string): ArticleViolation[] {
  const out: ArticleViolation[] = [];
  for (const landmark of REQUIRED_LANDMARKS) {
    if (!landmark.pattern.test(text)) {
      out.push({
        file: rel,
        code: landmark.code,
        message: `Aggregated article is missing the required "${landmark.label}". The aggregator generates Reader Intelligence Guide and Article Sources automatically; missing Executive Brief / BLUF means the source artifact is malformed.`,
      });
    }
  }
  const guideMatches = text.match(/^##\s+Reader Intelligence Guide\s*$/gm);
  if (guideMatches && guideMatches.length > 1) {
    out.push({
      file: rel,
      code: 'duplicate-reader-guide',
      message: `Reader Intelligence Guide heading appears ${guideMatches.length} times — must be exactly once. The cleaning pipeline should strip inline duplicates before the aggregator emits the canonical instance.`,
    });
  }
  // Reader-guide table empty-row guard
  const guideHeadingMatch = text.match(/^##\s+Reader Intelligence Guide\s*$/m);
  if (guideHeadingMatch && guideHeadingMatch.index !== undefined) {
    const after = text.slice(guideHeadingMatch.index + guideHeadingMatch[0].length);
    const stop = after.search(/^##\s+\S/m);
    const region = stop === -1 ? after : after.slice(0, stop);
    const dataRows = region.match(/^\|\s*(?:[^|\n]+\|\s*)?\[/gm) ?? [];
    if (dataRows.length === 0) {
      out.push({
        file: rel,
        code: 'reader-guide-empty-table',
        message: `Reader Intelligence Guide table has zero data rows — the aggregator should emit at least one row per available artifact lens. Verify the artifact set is non-empty and re-aggregate.`,
      });
    }
  }
  return out;
}
