/**
 * @module scripts/validators/article/slug
 * @description Permissive heading slug helper used by the empty-slug
 *              guard rule. Kept separate from the renderer's
 *              github-slugger-based production slugger so the validator
 *              has no runtime dependency on the render pipeline.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 487–492. Logic is
 *              byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export function permissiveSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

import type { ArticleViolation } from './types.js';

/** Empty-heading-slug rule. */
export function checkHeadingSlugs(rel: string, text: string): ArticleViolation[] {
  const out: ArticleViolation[] = [];
  const headingLines = text.match(/^#{2,6}\s+\S[^\n]*$/gm) ?? [];
  for (const h of headingLines) {
    const headingText = h.replace(/^#+\s+/, '').trim();
    if (!permissiveSlug(headingText)) {
      out.push({
        file: rel,
        code: 'empty-heading-slug',
        message: `Heading ${JSON.stringify(headingText)} produces an empty slug — pick a heading that contains at least one word/digit so the rendered #anchor is non-empty.`,
      });
    }
  }
  return out;
}
