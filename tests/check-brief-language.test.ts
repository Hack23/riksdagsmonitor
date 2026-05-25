/**
 * Unit tests for `scripts/check-brief-language.ts`.
 *
 * Covers the language-leak detection helpers — pure functions that do
 * not touch the filesystem (except via the integration `validateBriefLanguages`
 * walker, which is exercised here with a temp directory tree).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ENGLISH_MARKERS,
  calculateEnglishDensity,
  exceedsEnglishThreshold,
  findTranslatedBriefs,
  formatViolationReport,
  validateBriefLanguages,
} from '../scripts/check-brief-language.js';

describe('check-brief-language — ENGLISH_MARKERS', () => {
  it('contains unambiguous English function words', () => {
    for (const tok of ['the', 'and', 'that', 'which', 'with', 'from', 'these', 'because']) {
      expect(ENGLISH_MARKERS.has(tok)).toBe(true);
    }
  });

  it('excludes short ambiguous tokens that could appear in other languages', () => {
    // `a` and `an` are excluded — they collide with Swedish `a`-prefix tokens
    expect(ENGLISH_MARKERS.has('a')).toBe(false);
    expect(ENGLISH_MARKERS.has('an')).toBe(false);
  });
});

describe('check-brief-language — calculateEnglishDensity', () => {
  it('returns zero density for a Swedish brief', () => {
    const sv = [
      '---',
      'title: "Brief"',
      '---',
      '',
      '# Riksdagen Antar Lagförslag',
      '',
      'BLUF: Sveriges riksdag beslutade att godkänna propositionen.',
      'Justitieutskottet rapporterade enhälligt om lagförslaget.',
    ].join('\n');
    const d = calculateEnglishDensity(sv);
    expect(d.englishMarkerCount).toBe(0);
    expect(d.density).toBe(0);
  });

  it('detects high density when English fallback leaked into _sv.md', () => {
    const leak = [
      '# Sweden Passes Bill',
      '',
      'The Riksdag passed the bill which was proposed by the government.',
      'These reforms, which have been debated for months, will take effect.',
      'The committee report from the justice committee recommends approval.',
    ].join('\n');
    const d = calculateEnglishDensity(leak);
    expect(d.englishMarkerCount).toBeGreaterThanOrEqual(8);
    expect(d.density).toBeGreaterThan(0.1);
  });

  it('strips fenced code blocks before measuring', () => {
    const md = [
      '# Titel',
      '',
      'Detta är svensk text.',
      '',
      '```',
      'the and that which with from these those',
      'have has had will would should could about',
      '```',
      '',
      'Mer svensk text.',
    ].join('\n');
    const d = calculateEnglishDensity(md);
    expect(d.englishMarkerCount).toBe(0);
  });

  it('strips Markdown blockquote lines (attributed source quotations)', () => {
    const md = [
      '# Titel',
      '',
      'Svensk inledning.',
      '',
      '> The committee report which was published yesterday has been approved.',
      '> These reforms will take effect from the next session.',
      '',
      'Svensk slutsats.',
    ].join('\n');
    const d = calculateEnglishDensity(md);
    // The quoted English source material is stripped — only Swedish remains
    expect(d.englishMarkerCount).toBe(0);
  });
});

describe('check-brief-language — exceedsEnglishThreshold', () => {
  it('returns false when absolute marker count is below the floor', () => {
    expect(exceedsEnglishThreshold({ totalWords: 100, englishMarkerCount: 4, density: 0.04 }, 'sv')).toBe(false);
  });

  it('returns true when density exceeds 5% on Latin targets', () => {
    expect(exceedsEnglishThreshold({ totalWords: 100, englishMarkerCount: 10, density: 0.1 }, 'sv')).toBe(true);
    expect(exceedsEnglishThreshold({ totalWords: 100, englishMarkerCount: 10, density: 0.1 }, 'de')).toBe(true);
    expect(exceedsEnglishThreshold({ totalWords: 100, englishMarkerCount: 10, density: 0.1 }, 'fr')).toBe(true);
  });

  it('uses a tighter 3% threshold for CJK targets', () => {
    // density 0.04 → fails for CJK, passes for Latin
    expect(exceedsEnglishThreshold({ totalWords: 200, englishMarkerCount: 8, density: 0.04 }, 'ja')).toBe(true);
    expect(exceedsEnglishThreshold({ totalWords: 200, englishMarkerCount: 8, density: 0.04 }, 'sv')).toBe(false);
  });

  it('returns false at exactly the threshold (strict >)', () => {
    expect(exceedsEnglishThreshold({ totalWords: 100, englishMarkerCount: 5, density: 0.05 }, 'sv')).toBe(false);
    expect(exceedsEnglishThreshold({ totalWords: 100, englishMarkerCount: 5, density: 0.03 }, 'ja')).toBe(false);
  });
});

describe('check-brief-language — findTranslatedBriefs + validateBriefLanguages', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'check-brief-language-'));
  });

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  function write(relPath: string, contents: string): string {
    const fullPath = join(tmpRoot, relPath);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, contents);
    return fullPath;
  }

  it('finds executive-brief_<lang>.md files and skips the English source', () => {
    write('2026-05-20/propositions/executive-brief.md', '# EN source');
    write('2026-05-20/propositions/executive-brief_sv.md', '# SV brief');
    write('2026-05-20/propositions/executive-brief_de.md', '# DE brief');
    write('2026-05-20/propositions/article.md', '# article');

    const found = findTranslatedBriefs(tmpRoot);
    const langs = found.map((b) => b.lang).sort();
    expect(langs).toEqual(['de', 'sv']);
  });

  it('skips pass1/ and full-text/ subdirectories', () => {
    write('2026-05-20/propositions/executive-brief_sv.md', '# SV');
    write('2026-05-20/propositions/pass1/executive-brief_sv.md', '# SV pass1');
    write('2026-05-20/propositions/full-text/executive-brief_sv.md', '# SV full-text');

    const found = findTranslatedBriefs(tmpRoot);
    expect(found).toHaveLength(1);
    expect(found[0].filepath.endsWith('propositions/executive-brief_sv.md')).toBe(true);
  });

  it('flags an English-fallback leak in _sv.md', () => {
    const englishLeak = [
      '# Sweden Passes Bill',
      '',
      'The Riksdag passed the bill which was proposed by the government.',
      'These reforms, which have been debated for months, will take effect.',
      'The committee report from the justice committee recommends approval.',
      'The opposition argues that these measures are insufficient.',
      'The chairperson noted that the vote was unanimous.',
    ].join('\n');
    write('2026-05-20/propositions/executive-brief_sv.md', englishLeak);

    const violations = validateBriefLanguages(tmpRoot);
    expect(violations).toHaveLength(1);
    expect(violations[0].lang).toBe('sv');
    expect(violations[0].density).toBeGreaterThan(0.05);
  });

  it('passes a genuine Swedish translation', () => {
    const sv = [
      '# Riksdagen Antar Historiska Reformer',
      '',
      'Sveriges riksdag beslutade idag att godkänna propositionen om migrationsreform.',
      'Justitieutskottet rapporterade enhälligt om lagförslaget under måndagens session.',
      'Oppositionen kritiserade beslutet medan regeringspartierna lovordade det.',
      'Beslutet träder i kraft från och med nästa session i höst.',
      'Förändringarna påverkar samtliga ansökningar som lämnats in efter detta datum.',
    ].join('\n');
    write('2026-05-20/propositions/executive-brief_sv.md', sv);

    const violations = validateBriefLanguages(tmpRoot);
    expect(violations).toHaveLength(0);
  });

  it('formats the violation report with relpath, lang, and density', () => {
    const englishLeak = [
      '# Title',
      '',
      'The bill which was proposed by the government from the committee.',
      'These reforms have been debated and the opposition argues that they are insufficient.',
      'The chairperson noted that the vote was unanimous from the justice committee.',
    ].join('\n');
    write('2026-05-20/propositions/executive-brief_de.md', englishLeak);

    const violations = validateBriefLanguages(tmpRoot);
    const report = formatViolationReport(violations);
    expect(report).toContain('executive-brief_de.md');
    expect(report).toContain('[de]');
    expect(report).toMatch(/density: \d+\.\d%/);
  });

  it('returns empty report when no violations', () => {
    expect(formatViolationReport([])).toBe('');
  });
});
