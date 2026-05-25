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
import { buildSeoTitle, stripTrailingCommaStub } from '../scripts/render-lib/article-seo.js';

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

  it('ships short brief H1s as "{H1} — Riksdagsmonitor" with NO date prefix', () => {
    // **Post-2026-05-24 contract** (renderer audit of 480 EN articles):
    // The localized-date prefix (`May 15, 2026 · `) has been removed from
    // the SERP `<title>` cascade because the publication date is already
    // carried by five other signals (canonical URL slug,
    // `og:article:published_time`, JSON-LD `datePublished`, visible byline,
    // SERP auto-rendered snippet). Forcing the date into `<title>` ate
    // ~15 chars of the 70-char budget and forced truncation of 143/480
    // (30%) of EN titles whose brief H1s would otherwise have fit.
    //
    // Short H1s now ship as `{H1} — Riksdagsmonitor` (brand suffix
    // visible, no date prefix). The H1 is sourced from the executive
    // brief by `cleanArticleTitle` so editorial quality is policed at
    // source.
    const shortH1 = 'Riksdag Approves FiU48 Fuel-Tax Cut';
    const result = buildSeoTitle({ ...baseInput, title: shortH1 });
    expect(result).toBe('Riksdag Approves FiU48 Fuel-Tax Cut — Riksdagsmonitor');
    // No date prefix in any form must leak into the SERP title.
    expect(result).not.toMatch(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/,
    );
    expect(result).not.toMatch(/2026-05-15/);
    expect(result.length).toBeLessThanOrEqual(70);
  });

  it('strips trailing connector AND date prefix when H1 just fits without brand', () => {
    // 58-char H1 + ` — Riksdagsmonitor` (18 chars) = 76 chars overshoots
    // the 70-char budget → brand suffix dropped → bare H1 (58 chars) ships.
    // No date prefix added, no truncation needed.
    const h1 = 'Deep Inspection HD03231 (Russia · Cyber · Defence · Ukraine)';
    const result = buildSeoTitle({ ...baseInput, date: '2026-04-19', title: h1 });
    expect(result).toBe(h1);
    expect(result).not.toMatch(/Apr 19, 2026/);
    expect(result).not.toContain('…');
    expect(result.length).toBeLessThanOrEqual(70);
  });

  it('never prepends a localized date prefix in any of the 14 supported languages', () => {
    // Per-language SERP budgets accommodate the bare H1 in every locale.
    // The renderer must never inject `Mon DD, YYYY · `, `D. Mai YYYY · `,
    // `YYYY年M月D日 · `, etc. into the SERP title.
    const inputs = [
      { lang: 'en' as const, title: 'Riksdag Approves Budget Reform' },
      { lang: 'sv' as const, title: 'Riksdagen Antar Budgetreform' },
      { lang: 'da' as const, title: 'Folketinget Vedtager Budgetreform' },
      { lang: 'no' as const, title: 'Stortinget Vedtar Budsjettreform' },
      { lang: 'fi' as const, title: 'Eduskunta Hyväksyy Budjettiuudistuksen' },
      { lang: 'de' as const, title: 'Reichstag Verabschiedet Haushaltsreform' },
      { lang: 'fr' as const, title: 'Le Riksdag Adopte la Réforme Budgétaire' },
      { lang: 'es' as const, title: 'El Riksdag Aprueba la Reforma Presupuestaria' },
      { lang: 'nl' as const, title: 'Riksdag Keurt Begrotingshervorming Goed' },
      { lang: 'ar' as const, title: 'البرلمان يعتمد إصلاح الميزانية' },
      { lang: 'he' as const, title: 'הריקסדאג מאשר רפורמה בתקציב' },
      { lang: 'ja' as const, title: '国会予算改革を承認' },
      { lang: 'ko' as const, title: '의회가 예산 개혁을 승인' },
      { lang: 'zh' as const, title: '国会通过预算改革' },
    ];
    for (const { lang, title } of inputs) {
      const result = buildSeoTitle({ ...baseInput, lang, title });
      // Latin-script newsroom prefix.
      expect(result, `lang=${lang}`).not.toMatch(
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s*·/,
      );
      // CJK newsroom prefix (年 月 日).
      expect(result, `lang=${lang}`).not.toMatch(/\d{4}年\d{1,2}月\d{1,2}日\s*·/);
      // ISO form must never leak either.
      expect(result, `lang=${lang}`).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    }
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

// ──────────────────────────────────────────────────────────────────
// Round 9 (2026-05-25) — comma-trailing-fragment guard in
// truncateAtWord. Live audit of news/index.html cards showed
// truncated descriptions ending on bare noun-phrase stubs after the
// last comma (`… national security, tax authority`,
// `… consequences, the…`), reading as list-mid cuts. The new
// stripTrailingCommaStub helper steps back to the comma when the
// tail is short and the head is substantive.
// ──────────────────────────────────────────────────────────────────

describe('stripTrailingCommaStub — comma-trailing fragment guard', () => {
  it('strips a 2-word noun-phrase tail after the last comma', () => {
    const input =
      "Sweden's Riksdag closed the week with security legislation, tax authority";
    expect(stripTrailingCommaStub(input)).toBe(
      "Sweden's Riksdag closed the week with security legislation",
    );
  });

  it('strips a 1-word noun tail (`the`-style determiner is a connector and is already stripped upstream)', () => {
    const input = 'Twenty interpellations crystallise the opposition offensive, today';
    expect(stripTrailingCommaStub(input)).toBe(
      'Twenty interpellations crystallise the opposition offensive',
    );
  });

  it('preserves the original text when the tail is too long (likely real clause)', () => {
    const input =
      'Riksdag advances three reform clusters, including education reform and security expansion';
    // Tail after last comma is 64 chars — way over the 30-char threshold,
    // so this looks like a substantive subordinate clause, not a stub.
    expect(stripTrailingCommaStub(input)).toBe(input);
  });

  it('preserves the text when the head is short (would over-strip)', () => {
    const input = 'Brief, today';
    // Head is only 5 chars — stripping would leave nothing meaningful.
    expect(stripTrailingCommaStub(input)).toBe(input);
  });

  it('preserves text with no comma', () => {
    const input = "Sweden's Riksdag closes the week with security legislation";
    expect(stripTrailingCommaStub(input)).toBe(input);
  });

  it('preserves a tail that ends with a sentence terminator (real prose)', () => {
    const input = 'Riksdag advances reform, finally.';
    expect(stripTrailingCommaStub(input)).toBe(input);
  });
});
