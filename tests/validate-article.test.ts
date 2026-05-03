/**
 * @module tests/validate-article
 * @description Unit tests for the BLUF evidence-anchor counter exported
 *              by `scripts/validate-article.ts`. The full validator is
 *              exercised end-to-end via `npm run validate-article` in
 *              CI; these tests cover the granular helpers that drive
 *              the new article-quality rules added for issue #14
 *              (Improve aggregation + article.md quality).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { countBlufEvidenceAnchors } from '../scripts/validate-article.js';

describe('validate-article — countBlufEvidenceAnchors', () => {
  it('counts a single dok_id reference', () => {
    expect(countBlufEvidenceAnchors('Government tabled HD12345 today.')).toBe(1);
  });

  it('counts mixed-case committee report identifiers', () => {
    // Riksdag committee reports include lowercase letters in the suffix
    // (e.g. `HC01SoU29`). The validator is case-insensitive after the
    // leading `H`.
    expect(countBlufEvidenceAnchors('Approved HC01SoU29 yesterday.')).toBeGreaterThanOrEqual(1);
  });

  it('counts parliamentary doc references', () => {
    expect(
      countBlufEvidenceAnchors('Skr. 2025/26:259 introduces the plan.'),
    ).toBeGreaterThanOrEqual(1);
  });

  it('counts Riksrevisionen audit references', () => {
    expect(
      countBlufEvidenceAnchors('Audit RiR 2025:30 documents the gap.'),
    ).toBeGreaterThanOrEqual(1);
  });

  it('counts primary-source URLs', () => {
    expect(
      countBlufEvidenceAnchors('See https://data.riksdagen.se/dokument/HD12345.html'),
    ).toBeGreaterThanOrEqual(1);
  });

  it('returns zero for narrative prose without anchors', () => {
    const prose =
      'The government has mounted a significant legislative push this week, ' +
      'with implications for migration policy and law-and-order positioning ' +
      'before the autumn 2026 election.';
    expect(countBlufEvidenceAnchors(prose)).toBe(0);
  });

  it('counts multiple anchors of mixed types', () => {
    const bluf =
      'HD03259 (Skr. 2025/26:259) referenced by RiR 2025:30 and ' +
      'https://regeringen.se/proposition/2025/26/259';
    // dok_id (1) + Skr. ref (1) + RiR (1) + URL (1) = 4
    expect(countBlufEvidenceAnchors(bluf)).toBeGreaterThanOrEqual(4);
  });
});
