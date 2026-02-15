/**
 * Unit Tests for validate-news-translations.js
 * Tests validation of translated news articles
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';

describe('validate-news-translations.js', () => {
  const testDir = 'tests/fixtures/translation-validation';
  
  beforeEach(() => {
    // Create test fixtures directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (e) {
      // Directory doesn't exist, that's fine
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test fixtures after all tests complete
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (e) {
      // Directory cleanup failed, ignore
    }
  });

  describe('Language code detection', () => {
    it('should detect English files', () => {
      const content = `
        <!DOCTYPE html>
        <html lang="en">
        <body><h1>Test Article</h1></body>
        </html>
      `;
      
      writeFileSync(`${testDir}/2026-02-14-test-en.html`, content);
      
      const result = execSync(`node scripts/validate-news-translations.js ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(result).toContain('Found 1 non-Swedish article files to check');
      expect(result).toContain('✓ Fully translated: 1');
    });

    it('should skip Swedish files', () => {
      writeFileSync(`${testDir}/test-sv.html`, '<html lang="sv"><body>Test</body></html>');
      writeFileSync(`${testDir}/test-en.html`, '<html lang="en"><body>Test</body></html>');
      
      const result = execSync(`node scripts/validate-news-translations.js ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(result).toContain('Found 1 non-Swedish article files to check');
    });

    it('should handle files without language code', () => {
      writeFileSync(`${testDir}/invalid.html`, '<html><body>Test</body></html>');
      
      const result = execSync(`node scripts/validate-news-translations.js ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(result).toContain('Found 0 non-Swedish article files');
    });
  });

  describe('Untranslated marker detection', () => {
    it('should detect untranslated markers', () => {
      const content = `
        <!DOCTYPE html>
        <html lang="en">
        <body>
          <h1>Test Article</h1>
          <p>Some content with <span data-translate="true" lang="sv">svensk text</span> that needs translation.</p>
          <p>More <span data-translate="true" lang="sv">annan text</span> here.</p>
        </body>
        </html>
      `;
      
      writeFileSync(`${testDir}/test-en.html`, content);
      
      let exitCode = 0;
      try {
        execSync(`node scripts/validate-news-translations.js ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error) {
        exitCode = error.status;
      }
      
      expect(exitCode).toBe(1); // Should fail validation
    });

    it('should pass validation for fully translated files', () => {
      const content = `
        <!DOCTYPE html>
        <html lang="en">
        <body>
          <h1>Test Article</h1>
          <p>All content is in English.</p>
        </body>
        </html>
      `;
      
      writeFileSync(`${testDir}/test-en.html`, content);
      
      const result = execSync(`node scripts/validate-news-translations.js ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(result).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
    });

    it('should extract sample untranslated text', () => {
      const content = `
        <html lang="en"><body>
          <span data-translate="true" lang="sv">Detta är svensk text</span>
          <span data-translate="true" lang="sv">Mer svensk text</span>
          <span data-translate="true" lang="sv">Ytterligare svensk text</span>
          <span data-translate="true" lang="sv">Ännu mer text</span>
        </body></html>
      `;
      
      writeFileSync(`${testDir}/test-en.html`, content);
      
      let output = '';
      try {
        execSync(`node scripts/validate-news-translations.js ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error) {
        output = error.stdout;
      }
      
      expect(output).toContain('Detta är svensk text');
      expect(output).toContain('4 untranslated marker(s)');
    });
  });

  describe('Multiple file validation', () => {
    it('should validate multiple language files', () => {
      const languages = ['en', 'de', 'fr', 'es'];
      
      for (const lang of languages) {
        const content = `<html lang="${lang}"><body>Fully translated</body></html>`;
        writeFileSync(`${testDir}/test-${lang}.html`, content);
      }
      
      const result = execSync(`node scripts/validate-news-translations.js ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(result).toContain('Found 4 non-Swedish article files');
      expect(result).toContain('✓ Fully translated: 4');
    });

    it('should report mixed results', () => {
      // Fully translated
      writeFileSync(`${testDir}/good-en.html`, '<html lang="en"><body>Good</body></html>');
      
      // Has untranslated content
      writeFileSync(`${testDir}/bad-de.html`, `
        <html lang="de"><body>
          <span data-translate="true" lang="sv">svensk text</span>
        </body></html>
      `);
      
      let output = '';
      try {
        execSync(`node scripts/validate-news-translations.js ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error) {
        output = error.stdout;
      }
      
      expect(output).toContain('✓ Fully translated: 1');
      expect(output).toContain('✗ Contains untranslated content: 1');
    });
  });

  describe('Recursive directory scanning', () => {
    it('should scan subdirectories', () => {
      mkdirSync(`${testDir}/subdir`, { recursive: true });
      
      writeFileSync(`${testDir}/test1-en.html`, '<html lang="en"><body>Test 1</body></html>');
      writeFileSync(`${testDir}/subdir/test2-en.html`, '<html lang="en"><body>Test 2</body></html>');
      
      const result = execSync(`node scripts/validate-news-translations.js ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(result).toContain('Found 2 non-Swedish article files');
    });
  });

  describe('Exit codes', () => {
    it('should exit with 0 for fully translated articles', () => {
      writeFileSync(`${testDir}/test-en.html`, '<html lang="en"><body>Good</body></html>');
      
      let exitCode = 0;
      try {
        execSync(`node scripts/validate-news-translations.js ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error) {
        exitCode = error.status;
      }
      
      expect(exitCode).toBe(0);
    });

    it('should exit with 1 for untranslated content', () => {
      writeFileSync(`${testDir}/test-en.html`, `
        <html lang="en"><body>
          <span data-translate="true" lang="sv">text</span>
        </body></html>
      `);
      
      let exitCode = 0;
      try {
        execSync(`node scripts/validate-news-translations.js ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error) {
        exitCode = error.status;
      }
      
      expect(exitCode).toBe(1);
    });
  });

  describe('CJK and RTL language support', () => {
    it('should validate CJK languages', () => {
      writeFileSync(`${testDir}/test-ja.html`, '<html lang="ja"><body>日本語のテスト</body></html>');
      writeFileSync(`${testDir}/test-ko.html`, '<html lang="ko"><body>한국어 테스트</body></html>');
      writeFileSync(`${testDir}/test-zh.html`, '<html lang="zh"><body>中文测试</body></html>');
      
      const result = execSync(`node scripts/validate-news-translations.js ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(result).toContain('Found 3 non-Swedish article files');
      expect(result).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
    });

    it('should validate RTL languages', () => {
      writeFileSync(`${testDir}/test-ar.html`, '<html lang="ar" dir="rtl"><body>اختبار عربي</body></html>');
      writeFileSync(`${testDir}/test-he.html`, '<html lang="he" dir="rtl"><body>בדיקה עברית</body></html>');
      
      const result = execSync(`node scripts/validate-news-translations.js ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(result).toContain('Found 2 non-Swedish article files');
      expect(result).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
    });
  });
});
