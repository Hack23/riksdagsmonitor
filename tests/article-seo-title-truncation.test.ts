/**
 * @module Tests/RenderLib/ArticleSeo/TitleTruncation
 * @category Intelligence Operations / Tests
 * @name Article SEO title truncation — trailing-connector regression
 *
 * @description
 * Regression tests for `buildSeoTitle` in `scripts/render-lib/article-seo.ts`.
 *
 * The renderer's SERP `<title>` budget (70 chars) is tighter than the
 * executive-brief H1, so a perfectly well-formed long H1 can be
 * truncated mid-connector. Without the trailing-connector strip, the
 * SERP title ships as `"… Protection for Abortion — and…"` — a
 * dangling fragment that reads poorly to journalists, readers and
 * search engines.
 *
 * Live regression case reproduced here:
 *   news/2026-05-15-committeeReports-en.html →
 *   <title>Riksdag Enshrines Constitutional Protection for Abortion — and… — Riksdagsmonitor</title>
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { buildSeoTitle } from '../scripts/render-lib/article-seo.js';

const baseInput = {
  description: '',
  lang: 'en' as const,
  date: '2026-05-15',
  articleTypeLabel: 'Committee Reports',
  articleTypeId: 'committeeReports',
};

describe('buildSeoTitle — trailing-connector regression', () => {
  it('strips a trailing "and" connector left after word-boundary truncation', () => {
    // Live H1 from analysis/daily/2026-05-15/committeeReports/executive-brief.md
    const longH1 =
      "Riksdag Enshrines Constitutional Protection for Abortion — and Expands the Security State's Toolkit";
    const result = buildSeoTitle({ ...baseInput, title: longH1 });
    expect(result).not.toMatch(/\band…\s+—\s+Riksdagsmonitor/);
    expect(result).not.toMatch(/—\s*and…\s+—\s+Riksdagsmonitor/);
    expect(result).toContain('…'); // still indicates truncation
    expect(result).not.toMatch(/2026-05-15/);
    expect(result.length).toBeLessThanOrEqual(70);
  });

  it('strips a trailing "with" connector', () => {
    const longH1 =
      'Riksdag Approves Fuel-Tax Cut for Rural Households with Coalition Support and Opposition Compromise';
    const result = buildSeoTitle({ ...baseInput, title: longH1 });
    expect(result).not.toMatch(/\bwith…$/);
    expect(result).not.toMatch(/\band…$/);
  });

  it('prepends a reader-friendly localized date prefix to short titles that fit the budget', () => {
    // Under the date-prefix contract (uniqueness signal preferred over brand
    // when budget is tight), a 39-char H1 + 15-char localized date + 18-char
    // brand = 72 chars > 70-char hardMax, so the brand is dropped but the
    // date prefix stays as the uniqueness signal.
    const shortH1 = 'Riksdag Approves FiU48 Fuel-Tax Cut and';
    const result = buildSeoTitle({ ...baseInput, title: shortH1 });
    // Localized date prefix is present (newsroom date format, NOT ISO).
    expect(result).toMatch(/May 15, 2026/);
    // ISO YYYY-MM-DD form must NOT leak into the SERP title.
    expect(result).not.toMatch(/2026-05-15/);
    expect(result).not.toMatch(/ · en/);
    expect(result).toContain('Riksdag Approves');
    expect(result.length).toBeLessThanOrEqual(70);
  });

  it('strips Swedish connector "och" when truncating a Swedish H1', () => {
    const longSv =
      'Riksdag Antar Konstitutionellt Skydd för Aborträtt och Utökar Säkerhetsstatens Verktygslåda Idag';
    const result = buildSeoTitle({ ...baseInput, lang: 'sv', title: longSv });
    expect(result).not.toMatch(/\boch…$/);
  });

  it('strips German connector "und" when truncating a German H1', () => {
    const longDe =
      'Riksdag Verankert Verfassungsmäßigen Schutz des Schwangerschaftsabbruchs und Erweitert die Sicherheitspolitik';
    const result = buildSeoTitle({ ...baseInput, lang: 'de', title: longDe });
    expect(result).not.toMatch(/\bund…$/);
  });

  it('truncates a medium-length H1 so the SERP title does not end on a connector', () => {
    // 58-char H1 + " — Riksdagsmonitor" suffix (18 chars) = 76 chars,
    // which exceeds the 70-char SERP budget. truncateAtWord runs and
    // must land the cut on a substantive word — never on a coordinating
    // connector like "and", "or", "with", "the", "a", "an".
    const h1 = 'Russia Legalises Aggression — Sweden Faces Three Deadlines';
    const result = buildSeoTitle({ ...baseInput, title: h1 });
    expect(result).not.toMatch(/\b(and|or|with|the|a|an)…$/i);
    expect(result.length).toBeLessThanOrEqual(70);
  });
});
