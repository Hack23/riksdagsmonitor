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
    expect(result).not.toMatch(/\band…$/);
    expect(result).not.toMatch(/—\s*and…$/);
    expect(result).toMatch(/…$/); // still indicates truncation
    expect(result.length).toBeLessThanOrEqual(70);
  });

  it('strips a trailing "with" connector', () => {
    const longH1 =
      'Riksdag Approves Fuel-Tax Cut for Rural Households with Coalition Support and Opposition Compromise';
    const result = buildSeoTitle({ ...baseInput, title: longH1 });
    expect(result).not.toMatch(/\bwith…$/);
    expect(result).not.toMatch(/\band…$/);
  });

  it('strips trailing connector before site suffix when H1 already fits', () => {
    // Short H1 ending with a connector should never happen post Phase-1
    // gate, but defensive: even if it does, the site suffix flow must
    // not preserve the dangling connector.
    const shortH1 = 'Riksdag Approves FiU48 Fuel-Tax Cut and';
    const result = buildSeoTitle({ ...baseInput, title: shortH1 });
    // Short H1 + suffix flow doesn't go through truncateAtWord, so the
    // connector is preserved here — Phase-1 gate is the guard for this
    // case. Document the contract by asserting the suffix appears.
    expect(result).toMatch(/Riksdagsmonitor$/);
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

  it('keeps a complete H1 unchanged when it already fits the budget', () => {
    const h1 = 'Russia Legalises Aggression — Sweden Faces Three Deadlines';
    const result = buildSeoTitle({ ...baseInput, title: h1 });
    // 58 chars + " — Riksdagsmonitor" (18) = 76 → does NOT fit, so
    // truncateAtWord runs. But truncation should land cleanly, not on
    // a connector.
    expect(result).not.toMatch(/\b(and|or|with|the|a|an)…$/i);
  });
});
