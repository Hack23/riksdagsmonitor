import { describe, expect, it } from 'vitest';
import {
  EXEC_BRIEF_TRANSLATION_LANGS,
  extractLangFromPath,
  isFileOwnedByCategory,
  validateFileList,
} from '../scripts/validate-file-ownership.js';

describe('extractLangFromPath — executive-brief markdown', () => {
  it('extracts the language code from an executive-brief_<lang>.md path', () => {
    expect(
      extractLangFromPath('analysis/daily/2026-05-15/propositions/executive-brief_sv.md'),
    ).toBe('sv');
    expect(
      extractLangFromPath('analysis/daily/2026-05-15/motions/executive-brief_ar.md'),
    ).toBe('ar');
    expect(
      extractLangFromPath('analysis/daily/2026-05-15/motions/executive-brief_zh.md'),
    ).toBe('zh');
  });

  it('returns null for the English-master executive-brief.md (no suffix)', () => {
    expect(
      extractLangFromPath('analysis/daily/2026-05-15/propositions/executive-brief.md'),
    ).toBeNull();
  });

  it('still works for news/<slug>-<lang>.html paths', () => {
    expect(extractLangFromPath('news/2026-05-15-propositions-sv.html')).toBe('sv');
    expect(extractLangFromPath('news/2026-05-15-propositions-en.html')).toBe('en');
  });
});

describe('isFileOwnedByCategory — executive-brief markdown', () => {
  const enSource = 'analysis/daily/2026-05-15/propositions/executive-brief.md';
  const svBrief = 'analysis/daily/2026-05-15/propositions/executive-brief_sv.md';
  const arBrief = 'analysis/daily/2026-05-15/propositions/executive-brief_ar.md';
  const zhBrief = 'analysis/daily/2026-05-15/propositions/executive-brief_zh.md';

  it('English-master executive-brief.md is owned by the content category', () => {
    expect(isFileOwnedByCategory(enSource, 'content')).toBe(true);
    expect(isFileOwnedByCategory(enSource, 'translation')).toBe(false);
  });

  it('Swedish executive-brief_sv.md is owned by the translation category', () => {
    // Note: Swedish is in EXEC_BRIEF_TRANSLATION_LANGS — the brief pipeline
    // differs from the HTML pipeline (where SV is content).
    expect(isFileOwnedByCategory(svBrief, 'translation')).toBe(true);
    expect(isFileOwnedByCategory(svBrief, 'content')).toBe(false);
  });

  it('Arabic and Chinese briefs are owned by the translation category', () => {
    expect(isFileOwnedByCategory(arBrief, 'translation')).toBe(true);
    expect(isFileOwnedByCategory(zhBrief, 'translation')).toBe(true);
    expect(isFileOwnedByCategory(arBrief, 'content')).toBe(false);
    expect(isFileOwnedByCategory(zhBrief, 'content')).toBe(false);
  });

  it('does not affect non-executive-brief markdown files outside analysis/daily', () => {
    expect(isFileOwnedByCategory('README.md', 'content')).toBe(true);
    expect(isFileOwnedByCategory('README.md', 'translation')).toBe(true);
    expect(isFileOwnedByCategory('docs/notes.md', 'translation')).toBe(true);
  });

  it('still enforces the existing news/*.html ownership rules', () => {
    // Content workflow may write EN/SV HTML; translation workflow may not.
    expect(isFileOwnedByCategory('news/2026-05-15-x-en.html', 'content')).toBe(true);
    expect(isFileOwnedByCategory('news/2026-05-15-x-en.html', 'translation')).toBe(false);
    expect(isFileOwnedByCategory('news/2026-05-15-x-de.html', 'translation')).toBe(true);
    expect(isFileOwnedByCategory('news/2026-05-15-x-de.html', 'content')).toBe(false);
  });
});

describe('validateFileList — mixed news + executive-brief batches', () => {
  it('flags a translation batch that touches the English-master brief', () => {
    const files = [
      'analysis/daily/2026-05-15/propositions/executive-brief_sv.md',
      'analysis/daily/2026-05-15/propositions/executive-brief_de.md',
      'analysis/daily/2026-05-15/propositions/executive-brief.md', // ← violation
    ];
    const result = validateFileList(files, 'translation');
    expect(result.passed).toBe(false);
    expect(result.violations).toEqual([
      'analysis/daily/2026-05-15/propositions/executive-brief.md',
    ]);
    expect(result.checkedCount).toBe(3);
  });

  it('flags a content batch that touches translated briefs', () => {
    const files = [
      'analysis/daily/2026-05-15/propositions/executive-brief.md',
      'analysis/daily/2026-05-15/propositions/executive-brief_sv.md', // ← violation
    ];
    const result = validateFileList(files, 'content');
    expect(result.passed).toBe(false);
    expect(result.violations).toEqual([
      'analysis/daily/2026-05-15/propositions/executive-brief_sv.md',
    ]);
  });

  it('passes a pure translation batch (all 13 non-EN briefs)', () => {
    const files = EXEC_BRIEF_TRANSLATION_LANGS.map(
      (lang) => `analysis/daily/2026-05-15/propositions/executive-brief_${lang}.md`,
    );
    const result = validateFileList(files, 'translation');
    expect(result.passed).toBe(true);
    expect(result.checkedCount).toBe(13);
  });

  it('ignores unrelated markdown files', () => {
    const files = ['README.md', 'docs/notes.md'];
    const result = validateFileList(files, 'translation');
    expect(result.passed).toBe(true);
    expect(result.checkedCount).toBe(0);
  });
});
