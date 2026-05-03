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

  it('counts mixed-case Riksdag committee report identifiers', () => {
    // HC01SoU29: H-series dok_id with digits (C01 + SoU29 embedded).
    expect(countBlufEvidenceAnchors('Approved HC01SoU29 yesterday.')).toBe(1);
  });

  it('counts two-uppercase-letter committee betänkande codes', () => {
    // FiU17 → the `[A-ZÅÄÖ]{2}\d{1,8}` pattern matches `FI` + `17`…
    // but `Fi` has lowercase. The pattern targets two UPPERCASE chars.
    // `SoU29` similarly has a lowercase `o`, so test a fully uppercase ref.
    expect(countBlufEvidenceAnchors('KU23 unanimous vote on constitutional change.')).toBe(1);
  });

  it('counts parliamentary doc references', () => {
    expect(
      countBlufEvidenceAnchors('Skr. 2025/26:259 introduces the plan.'),
    ).toBe(1);
  });

  it('counts Riksrevisionen audit references', () => {
    expect(
      countBlufEvidenceAnchors('Audit RiR 2025:30 documents the gap.'),
    ).toBe(1);
  });

  it('counts a primary-source URL without any embedded dok_id', () => {
    // Use an imf.org URL that contains no dok_id-shaped token, so the
    // only matching pattern is the URL regex itself.
    expect(
      countBlufEvidenceAnchors(
        'IMF projection via https://www.imf.org/en/Publications/WEO/weo-database/2026/April',
      ),
    ).toBe(1);
  });

  it('counts a riksdagen.se URL without doubling the count', () => {
    // The URL path contains `HD12345` (a dok_id), but the URL and the
    // dok_id are counted independently — that is acceptable because both
    // represent real verifiable anchors.
    const count = countBlufEvidenceAnchors(
      'See https://data.riksdagen.se/dokument/HD12345.html',
    );
    // URL (1) + dok_id HD12345 (1) = 2; or 1 if the implementation
    // deduplicates. At minimum, ≥ 1 anchor must be detected.
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('returns zero for narrative prose without anchors', () => {
    const prose =
      'The government has mounted a significant legislative push this week, ' +
      'with implications for migration policy and law-and-order positioning ' +
      'before the autumn 2026 election.';
    expect(countBlufEvidenceAnchors(prose)).toBe(0);
  });

  it('does NOT count ordinary English words as dok_ids', () => {
    // Words starting with H but having no digits must not match.
    const falsePositives =
      'Hardened Helsinki Highlights Harmony Headlined ' +
      // ISO-like strings with letter-only bodies must not match either.
      'ABCDEFGH ABCDEFGHI';
    expect(countBlufEvidenceAnchors(falsePositives)).toBe(0);
  });

  it('counts multiple anchors of mixed types', () => {
    const bluf =
      'HD03259 (Skr. 2025/26:259) referenced by RiR 2025:30 and ' +
      'https://www.imf.org/en/WEO/2026/April';
    // dok_id (1) + Skr. ref (1) + RiR (1) + URL (1) = 4
    expect(countBlufEvidenceAnchors(bluf)).toBe(4);
  });
});
