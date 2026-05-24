/**
 * @module Tests/RenderLib/ArticleMerge
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Tests for `mergeLocalizedWithEnglish`
 *
 * @description
 * The agent-translated `article.<lang>.md` files are typically short
 * executive summaries (≈50 lines), while the canonical English
 * `article.md` aggregates 23 analysis artifacts (>2 000 lines). The
 * merger's job is to publish a single non-English HTML page that opens
 * with the localized summary AND continues with the full English
 * analytical depth — without losing any of either.
 *
 * These tests cover the contract documented in
 * `scripts/render-lib/article-merge.ts`:
 *
 *  - English language pass-through (no merge).
 *  - Localized + English merge — front matter overlay rules
 *    (canonical-identity keys preserved, localized header strings
 *    overridden, `language` forced to target).
 *  - Body merge — localized body first, English body after the
 *    localized boundary heading.
 *  - Empty-body fallback — localized FM + English body when the
 *    `article.<lang>.md` has only front matter.
 *  - All 14 supported languages have non-empty boundary heading + note.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';

import {
  mergeLocalizedWithEnglish,
  buildEnglishCoverageBoundary,
} from '../scripts/render-lib/article-merge.js';
import { LANGUAGES } from '../scripts/render-lib/constants.js';
import { LANGUAGE_META } from '../scripts/sitemap-html/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const englishMarkdown = [
  '---',
  'title: "Government propositions"',
  'description: "Three interlocking propositions"',
  'date: 2026-05-08',
  'subfolder: propositions',
  'slug: 2026-05-08-propositions',
  'source_folder: analysis/daily/2026-05-08/propositions',
  'generated_at: 2026-05-11T11:04:33.528Z',
  'language: en',
  'layout: article',
  '---',
  '',
  '## Executive Brief',
  '',
  'On 7 May 2026 the Tidö government submitted three propositions.',
  '',
  '## Coalition Mathematics',
  '',
  'Tidö 176 vs S/V/MP/C 173.',
  '',
  '## Risk Assessment',
  '',
  'ECHR Art. 5 challenge — score 15.',
  '',
].join('\n');

const germanMarkdown = [
  '---',
  'title: "Regierungspropositionspakete"',
  'description: "DIW Gesamt: 10,0/10"',
  'date: 2026-05-08',
  'subfolder: propositions',
  'slug: 2026-05-08-propositions',
  'source_folder: analysis/daily/2026-05-08/propositions',
  'generated_at: 2026-05-08T09:00:00.000Z',
  'language: de',
  'layout: article',
  '---',
  '',
  '## Zusammenfassung',
  '',
  'Am 7. Mai 2026 legte die Tidö-Regierung drei Vorlagen vor.',
  '',
].join('\n');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('mergeLocalizedWithEnglish', () => {
  it('returns English markdown unchanged when lang === "en"', () => {
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: germanMarkdown,
      lang: 'en',
    });
    expect(out).toBe(englishMarkdown);
  });

  it('overlays localized title/language but keeps English executive-brief description', () => {
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: germanMarkdown,
      lang: 'de',
    });
    const { data } = matter(out);
    expect(data.title).toBe('Regierungspropositionspakete');
    expect(data.description).toBe('Three interlocking propositions');
    expect(data.language).toBe('de');
  });

  it('keeps canonical-identity front-matter fields from the English source', () => {
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: germanMarkdown,
      lang: 'de',
    });
    const { data } = matter(out);
    // date, subfolder, slug, source_folder, layout, generated_at must
    // come from the English (canonical) front-matter — never from the
    // localized file (which the agent may have stamped differently).
    expect(data.date).toEqual(new Date('2026-05-08'));
    expect(data.subfolder).toBe('propositions');
    expect(data.slug).toBe('2026-05-08-propositions');
    expect(data.source_folder).toBe('analysis/daily/2026-05-08/propositions');
    expect(data.layout).toBe('article');
    // generated_at must be the English value (2026-05-11), not the
    // older localized stamp (2026-05-08).
    const generatedAt = data.generated_at instanceof Date
      ? data.generated_at.toISOString()
      : String(data.generated_at);
    expect(generatedAt).toContain('2026-05-11');
  });

  it('places the localized body BEFORE the English body, separated by the boundary heading', () => {
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: germanMarkdown,
      lang: 'de',
    });
    const { content } = matter(out);
    const localizedPos = content.indexOf('## Zusammenfassung');
    const boundaryPos = content.indexOf('## Detaillierte Analyse');
    const englishPos = content.indexOf('## Executive Brief');
    expect(localizedPos).toBeGreaterThanOrEqual(0);
    expect(boundaryPos).toBeGreaterThan(localizedPos);
    expect(englishPos).toBeGreaterThan(boundaryPos);
  });

  it('preserves every English body section in the merged output', () => {
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: germanMarkdown,
      lang: 'de',
    });
    expect(out).toContain('## Executive Brief');
    expect(out).toContain('## Coalition Mathematics');
    expect(out).toContain('## Risk Assessment');
    expect(out).toContain('On 7 May 2026 the Tidö government');
    expect(out).toContain('ECHR Art. 5 challenge — score 15.');
  });

  it('preserves the localized body content verbatim', () => {
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: germanMarkdown,
      lang: 'de',
    });
    expect(out).toContain('Am 7. Mai 2026 legte die Tidö-Regierung drei Vorlagen vor.');
  });

  it('emits the localized aside note on the boundary line so readers know why English follows', () => {
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: germanMarkdown,
      lang: 'de',
    });
    expect(out).toContain(LANGUAGE_META.de.translations.articleEnglishCoverageNote);
  });

  it('falls back to the English body when the localized file has no body content (FM only)', () => {
    const fmOnly = [
      '---',
      'title: "Bara svensk titel"',
      'language: sv',
      '---',
      '',
    ].join('\n');
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: fmOnly,
      lang: 'sv',
    });
    const { data, content } = matter(out);
    expect(data.title).toBe('Bara svensk titel');
    expect(data.language).toBe('sv');
    // No boundary block — straight English body with localized FM.
    expect(content).not.toContain('Detaljerad analys');
    expect(content).toContain('## Executive Brief');
    expect(content).toContain('## Coalition Mathematics');
  });

  it('forces language: <lang> even when the localized file forgot to set it', () => {
    const langless = [
      '---',
      'title: "Sammanfattning"',
      '---',
      '',
      '## Sammanfattning',
      '',
      'Detta är ett test.',
      '',
    ].join('\n');
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: langless,
      lang: 'sv',
    });
    const { data } = matter(out);
    expect(data.language).toBe('sv');
  });

  it('ignores empty-string localized title/description so English fallback wins', () => {
    const blank = [
      '---',
      'title: ""',
      'description: ""',
      '---',
      '',
      '## Heading',
      '',
      'Body.',
      '',
    ].join('\n');
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: blank,
      lang: 'sv',
    });
    const { data } = matter(out);
    expect(data.title).toBe('Government propositions');
    expect(data.description).toBe('Three interlocking propositions');
  });

  // --- Cascade chain step #2 — localized executive-brief overrides --------
  // Historical note: the merger used to overlay localized
  // `executive-brief_<lang>.md` H1 / BLUF onto title/description (chain
  // step #2). That responsibility moved to the **renderer** in
  // `scripts/render-lib/article.ts § deriveBriefSeoOverrides` post-
  // `2026-05-24`. The merger now:
  //   - ignores `localizedBriefMarkdown` and `subfolder` (kept as
  //     deprecated parameters for back-compat),
  //   - never rewrites `title:` / `description:` / `keywords:` from a
  //     brief,
  //   - still forces `language: <lang>`, still applies the body overlay
  //     when a localized body exists, still falls through to the
  //     English body when no localized body is present.
  // The new tests below pin the simplified contract.

  it('ignores localizedBriefMarkdown — does NOT rewrite title/description from the brief', () => {
    const briefDe = [
      '# Tidö-Regierung legt drei Vorlagen vor — Umverteilung von 12,4 Mrd Kronen',
      '',
      '## 🎯 BLUF',
      '',
      'Am 7. Mai 2026 legte die Tidö-Regierung drei Vorlagen vor, die zusammen 12,4 Milliarden Kronen zwischen Forstwirtschaft und Verteidigung umverteilen.',
    ].join('\n');
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: germanMarkdown,
      lang: 'de',
      // Forwarded for back-compat but ignored — the renderer owns
      // brief-driven SEO now.
      localizedBriefMarkdown: briefDe,
      subfolder: 'propositions',
    });
    const { data } = matter(out);
    // Title/description survive from the localized article front-matter
    // (chain step #3); the brief is no longer consulted by the merger.
    expect(data.title).toBe('Regierungspropositionspakete');
    expect(data.description).toBe('Three interlocking propositions');
    expect(data.language).toBe('de');
    // Localized body content is still applied above the boundary.
    expect(out).toContain('Am 7. Mai 2026 legte die Tidö-Regierung drei Vorlagen vor.');
  });

  it('ignores localizedBriefMarkdown even when the localized article is missing', () => {
    // No localized article body, only a localized brief — the merger
    // must still NOT touch title/description from the brief (that's the
    // renderer's job via `deriveBriefSeoOverrides`). The merger only
    // forces `language: <lang>` and falls through to the English body.
    const briefDe = [
      '# Tidö-Regierung legt drei Vorlagen vor',
      '',
      '## 🎯 BLUF',
      '',
      'Am 7. Mai 2026 legte die Tidö-Regierung drei Vorlagen vor.',
    ].join('\n');
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: '',
      lang: 'de',
      localizedBriefMarkdown: briefDe,
      subfolder: 'propositions',
    });
    const { data, content } = matter(out);
    // English-side title/description survive because the merger no
    // longer overlays the brief.
    expect(data.title).toBe('Government propositions');
    expect(data.description).toBe('Three interlocking propositions');
    expect(data.language).toBe('de');
    // English body preserved verbatim (no localized body, no boundary).
    expect(content).toContain('On 7 May 2026 the Tidö government submitted three propositions.');
    expect(content).not.toContain('Detailed analysis (in English)');
  });

  it('falls back to English title/description when both localized inputs are missing', () => {
    const out = mergeLocalizedWithEnglish({
      englishMarkdown,
      localizedMarkdown: '',
      lang: 'de',
    });
    const { data, content } = matter(out);
    expect(data.title).toBe('Government propositions');
    expect(data.description).toBe('Three interlocking propositions');
    // …but `language` is forced to the target so `<html lang>` and
    // JSON-LD `inLanguage` match the rendered HTML.
    expect(data.language).toBe('de');
    expect(content).toContain('On 7 May 2026 the Tidö government submitted three propositions.');
  });
});

describe('buildEnglishCoverageBoundary', () => {
  it.each(LANGUAGES.filter((l) => l !== 'en'))(
    'emits a non-empty H2 + aside note for "%s"',
    (lang) => {
      const out = buildEnglishCoverageBoundary(lang);
      const heading = LANGUAGE_META[lang].translations.articleEnglishCoverageHeading;
      const note = LANGUAGE_META[lang].translations.articleEnglishCoverageNote;
      expect(heading.length).toBeGreaterThan(0);
      expect(note.length).toBeGreaterThan(0);
      expect(out).toContain(`## ${heading}`);
      expect(out).toContain(`> ℹ️ ${note}`);
      // Must start with a leading horizontal rule so the boundary is
      // visually distinct in the rendered HTML.
      expect(out.startsWith('\n\n---\n\n## ')).toBe(true);
    },
  );
});
