/**
 * Tests for validate-file-ownership.ts
 *
 * Validates the file-ownership contract that prevents merge conflicts
 * between content and translation workflows.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  CONTENT_LANGS,
  TRANSLATION_LANGS,
  extractLangFromPath,
  isFileOwnedByCategory,
  validateFileList,
} from '../scripts/validate-file-ownership.js';

describe('validate-file-ownership', () => {
  describe('constants', () => {
    it('CONTENT_LANGS should contain exactly en and sv', () => {
      expect([...CONTENT_LANGS]).toEqual(['en', 'sv']);
    });

    it('TRANSLATION_LANGS should contain 12 non-core languages', () => {
      expect(TRANSLATION_LANGS).toHaveLength(12);
      expect([...TRANSLATION_LANGS]).toEqual([
        'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
      ]);
    });

    it('CONTENT_LANGS and TRANSLATION_LANGS should not overlap', () => {
      const contentSet = new Set<string>(CONTENT_LANGS);
      for (const lang of TRANSLATION_LANGS) {
        expect(contentSet.has(lang)).toBe(false);
      }
    });
  });

  describe('extractLangFromPath', () => {
    it('should extract language code from standard article paths', () => {
      expect(extractLangFromPath('news/2026-03-23-committee-reports-en.html')).toBe('en');
      expect(extractLangFromPath('news/2026-03-23-committee-reports-sv.html')).toBe('sv');
      expect(extractLangFromPath('news/2026-03-23-committee-reports-da.html')).toBe('da');
      expect(extractLangFromPath('news/2026-03-23-committee-reports-ja.html')).toBe('ja');
    });

    it('should return null for files without language suffix', () => {
      expect(extractLangFromPath('news/index.html')).toBeNull();
      expect(extractLangFromPath('news/2026/index.html')).toBeNull();
    });

    it('should return null for non-HTML files', () => {
      expect(extractLangFromPath('news/metadata/workflow-state.json')).toBeNull();
    });
  });

  describe('isFileOwnedByCategory', () => {
    it('should allow EN/SV files for content category', () => {
      expect(isFileOwnedByCategory('news/2026-03-23-report-en.html', 'content')).toBe(true);
      expect(isFileOwnedByCategory('news/2026-03-23-report-sv.html', 'content')).toBe(true);
    });

    it('should reject translation-language files for content category', () => {
      expect(isFileOwnedByCategory('news/2026-03-23-report-da.html', 'content')).toBe(false);
      expect(isFileOwnedByCategory('news/2026-03-23-report-ko.html', 'content')).toBe(false);
      expect(isFileOwnedByCategory('news/2026-03-23-report-ar.html', 'content')).toBe(false);
    });

    it('should allow translation-language files for translation category', () => {
      expect(isFileOwnedByCategory('news/2026-03-23-report-da.html', 'translation')).toBe(true);
      expect(isFileOwnedByCategory('news/2026-03-23-report-fi.html', 'translation')).toBe(true);
      expect(isFileOwnedByCategory('news/2026-03-23-report-zh.html', 'translation')).toBe(true);
    });

    it('should reject EN/SV files for translation category', () => {
      expect(isFileOwnedByCategory('news/2026-03-23-report-en.html', 'translation')).toBe(false);
      expect(isFileOwnedByCategory('news/2026-03-23-report-sv.html', 'translation')).toBe(false);
    });

    it('should allow non-news files for both categories', () => {
      expect(isFileOwnedByCategory('scripts/validate-file-ownership.ts', 'content')).toBe(true);
      expect(isFileOwnedByCategory('scripts/validate-file-ownership.ts', 'translation')).toBe(true);
      expect(isFileOwnedByCategory('package.json', 'content')).toBe(true);
    });

    it('should allow news files without language suffix for both categories', () => {
      expect(isFileOwnedByCategory('news/index.html', 'content')).toBe(true);
      expect(isFileOwnedByCategory('news/index.html', 'translation')).toBe(true);
    });
  });

  describe('validateFileList', () => {
    it('should pass when content category has only EN/SV files', () => {
      const files = [
        'news/2026-03-23-propositions-en.html',
        'news/2026-03-23-propositions-sv.html',
        'scripts/generate-news-enhanced.ts',
      ];
      const result = validateFileList(files, 'content');
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.checkedCount).toBe(2);
    });

    it('should fail when content category has translation-language files', () => {
      const files = [
        'news/2026-03-23-propositions-en.html',
        'news/2026-03-23-propositions-sv.html',
        'news/2026-03-23-propositions-da.html',
      ];
      const result = validateFileList(files, 'content');
      expect(result.passed).toBe(false);
      expect(result.violations).toEqual([
        'news/2026-03-23-propositions-da.html',
      ]);
    });

    it('should pass when translation category has only non-EN/SV files', () => {
      const files = [
        'news/2026-03-23-motions-da.html',
        'news/2026-03-23-motions-no.html',
        'news/2026-03-23-motions-fi.html',
        'news/2026-03-23-motions-de.html',
      ];
      const result = validateFileList(files, 'translation');
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.checkedCount).toBe(4);
    });

    it('should fail when translation category has EN files', () => {
      const files = [
        'news/2026-03-23-motions-en.html',
        'news/2026-03-23-motions-da.html',
      ];
      const result = validateFileList(files, 'translation');
      expect(result.passed).toBe(false);
      expect(result.violations).toEqual([
        'news/2026-03-23-motions-en.html',
      ]);
    });

    it('should fail when translation category has SV files', () => {
      const files = [
        'news/2026-03-23-motions-sv.html',
        'news/2026-03-23-motions-ko.html',
      ];
      const result = validateFileList(files, 'translation');
      expect(result.passed).toBe(false);
      expect(result.violations).toEqual([
        'news/2026-03-23-motions-sv.html',
      ]);
    });

    it('should produce correct violation list for mixed staged sets', () => {
      const files = [
        'news/2026-03-23-committee-reports-en.html',
        'news/2026-03-23-committee-reports-sv.html',
        'news/2026-03-23-committee-reports-da.html',
        'news/2026-03-23-committee-reports-no.html',
        'news/2026-03-23-committee-reports-ar.html',
      ];
      const contentResult = validateFileList(files, 'content');
      expect(contentResult.violations).toEqual([
        'news/2026-03-23-committee-reports-da.html',
        'news/2026-03-23-committee-reports-no.html',
        'news/2026-03-23-committee-reports-ar.html',
      ]);

      const translationResult = validateFileList(files, 'translation');
      expect(translationResult.violations).toEqual([
        'news/2026-03-23-committee-reports-en.html',
        'news/2026-03-23-committee-reports-sv.html',
      ]);
    });

    it('should pass with empty file list', () => {
      const result = validateFileList([], 'content');
      expect(result.passed).toBe(true);
      expect(result.checkedCount).toBe(0);
    });

    it('should ignore non-news directories', () => {
      const files = [
        'dashboard/index_da.html',
        'index_ko.html',
      ];
      const result = validateFileList(files, 'content');
      expect(result.passed).toBe(true);
      expect(result.checkedCount).toBe(0);
    });

    it('should validate all 12 translation languages correctly', () => {
      const allTranslationFiles = TRANSLATION_LANGS.map(
        (lang) => `news/2026-03-23-test-${lang}.html`,
      );
      const contentResult = validateFileList(allTranslationFiles, 'content');
      expect(contentResult.passed).toBe(false);
      expect(contentResult.violations).toHaveLength(12);

      const translationResult = validateFileList(allTranslationFiles, 'translation');
      expect(translationResult.passed).toBe(true);
      expect(translationResult.violations).toHaveLength(0);
    });
  });
});
