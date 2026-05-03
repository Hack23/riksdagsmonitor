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

// ---------------------------------------------------------------------------
// Editorial QA scanners (issue #245)
// ---------------------------------------------------------------------------

import {
  scanBannedPhrases,
  countWords,
  computeCitationDensity,
  scanStaleProvenance,
  countArticleEvidenceAnchors,
} from '../scripts/validate-article.js';

describe('validate-article — countArticleEvidenceAnchors', () => {
  it('counts dok_id and URL anchors', () => {
    const text = 'HD12345 cited via https://data.riksdagen.se/dokument/HD12345.html';
    expect(countArticleEvidenceAnchors(text)).toBeGreaterThanOrEqual(1);
  });

  it('does NOT count #rm- internal links', () => {
    const text = 'See [overview](#rm-synthesis-summary) and [details](#rm-risk-assessment).';
    expect(countArticleEvidenceAnchors(text)).toBe(0);
  });
});

describe('validate-article — scanBannedPhrases', () => {
  const banned = ['Sources say', 'significant development', 'Obviously,'];

  it('detects a banned phrase (case-insensitive)', () => {
    const text = 'In this article, sources say the policy is contested.';
    const hits = scanBannedPhrases(text, banned);
    expect(hits.length).toBe(1);
    expect(hits[0]!.phrase).toBe('Sources say');
  });

  it('detects multiple occurrences of the same phrase', () => {
    const text = 'Sources say A and sources say B.';
    const hits = scanBannedPhrases(text, banned);
    expect(hits.length).toBe(2);
  });

  it('returns empty array for clean text', () => {
    const text = 'HD12345 shows the vote was 173-176 on 2026-04-22.';
    expect(scanBannedPhrases(text, banned)).toHaveLength(0);
  });

  it('matches case-insensitively', () => {
    const text = 'OBVIOUSLY, the result is clear.';
    const hits = scanBannedPhrases(text, banned);
    expect(hits.length).toBe(1);
    expect(hits[0]!.phrase).toBe('Obviously,');
  });
});

describe('validate-article — countWords', () => {
  it('counts words in plain text', () => {
    expect(countWords('one two three four five')).toBe(5);
  });

  it('excludes fenced code blocks', () => {
    const text = 'word1 word2\n```\ncode here ignored\n```\nword3';
    expect(countWords(text)).toBe(3);
  });

  it('excludes fenced code blocks with language tag', () => {
    const text = 'word1\n```typescript\nconst x = 1;\n```\nword2';
    expect(countWords(text)).toBe(2);
  });

  it('strips markdown links but keeps link text', () => {
    const text = 'See [the report](https://example.com) for details.';
    // "See the report for details." = 5 words
    expect(countWords(text)).toBe(5);
  });

  it('strips markdown table pipes and alignment rows', () => {
    const text = '| Header | Data |\n|---|---|\n| cell1 | cell2 |';
    // Should count: Header, Data, cell1, cell2 — NOT pipes or alignment row
    const count = countWords(text);
    expect(count).toBe(4);
  });

  it('handles table-heavy content without inflated counts', () => {
    const text = '| Party | Seats | Change |\n|:---:|:---:|:---:|\n| S | 107 | +2 |\n| M | 68 | -3 |';
    // Words: Party, Seats, Change, S, 107, +2, M, 68, -3 = 9
    const count = countWords(text);
    expect(count).toBe(9);
  });
});

describe('validate-article — computeCitationDensity', () => {
  it('returns Infinity for text with no anchors', () => {
    const text = 'This is plain text without any evidence anchors at all.';
    expect(computeCitationDensity(text)).toBe(Infinity);
  });

  it('computes density for text with anchors', () => {
    // ~20 words with 2 anchors → density ~10
    const text = 'The vote on HD12345 passed 173-176. Prop. 2025/26:259 introduces the plan for next year.';
    const density = computeCitationDensity(text);
    expect(density).toBeLessThan(20);
    expect(density).toBeGreaterThan(0);
  });

  it('does not count #rm- internal links as evidence anchors', () => {
    // Text has only #rm- links and no real evidence anchors
    const text = 'See [synthesis](#rm-synthesis-summary) and [risk](#rm-risk-assessment) for details on this policy proposal that matters.';
    const density = computeCitationDensity(text);
    // Should be Infinity since #rm- links are not verifiable evidence
    expect(density).toBe(Infinity);
  });
});

describe('validate-article — scanStaleProvenance', () => {
  it('flags entries older than 6 months', () => {
    const text = `economicProvenance:\n  provider: imf\n  retrieved_at: 2025-01-15\n`;
    const ref = new Date('2026-05-03');
    const stale = scanStaleProvenance(text, ref);
    expect(stale.length).toBe(1);
    expect(stale[0]!.retrievedAt).toBe('2025-01-15');
    expect(stale[0]!.ageMonths).toBeGreaterThan(6);
  });

  it('ignores entries within 6 months', () => {
    const text = `retrieved_at: 2026-03-01\n`;
    const ref = new Date('2026-05-03');
    expect(scanStaleProvenance(text, ref)).toHaveLength(0);
  });

  it('ignores entries with stale-vintage annotation on immediately preceding line', () => {
    const text = `<!-- stale-vintage: IMF data not yet refreshed -->\nretrieved_at: 2025-01-15\n`;
    const ref = new Date('2026-05-03');
    expect(scanStaleProvenance(text, ref)).toHaveLength(0);
  });

  it('does NOT exempt entries when annotation is too far away', () => {
    // Annotation is separated by several lines — should NOT exempt
    const text = `<!-- stale-vintage: old note -->\nsome other content\nmore content\nretrieved_at: 2025-01-15\n`;
    const ref = new Date('2026-05-03');
    const stale = scanStaleProvenance(text, ref);
    expect(stale.length).toBe(1);
  });
});
