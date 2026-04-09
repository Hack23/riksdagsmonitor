/**
 * Unit Tests for validate-news-translations.ts
 * Tests validation of translated news articles
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';

/** Shape of an execSync error with stdout */
interface ExecSyncError extends Error {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

describe('validate-news-translations.ts', () => {
  const testDir = 'tests/fixtures/translation-validation';

  beforeEach(() => {
    // Create test fixtures directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (_e: unknown) {
      // Directory doesn't exist, that's fine
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test fixtures after all tests complete
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (_e: unknown) {
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

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Found 1 non-Swedish article files to check');
      expect(result).toContain('✓ Fully translated: 1');
    });

    it('should skip Swedish files', () => {
      writeFileSync(`${testDir}/test-sv.html`, '<html lang="sv"><body>Test</body></html>');
      writeFileSync(`${testDir}/test-en.html`, '<html lang="en"><body>Test</body></html>');

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Found 1 non-Swedish article files to check');
    });

    it('should handle files without language code', () => {
      writeFileSync(`${testDir}/invalid.html`, '<html><body>Test</body></html>');

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
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
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        exitCode = (error as ExecSyncError).status;
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

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
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
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        output = (error as ExecSyncError).stdout;
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

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
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
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        output = (error as ExecSyncError).stdout;
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

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
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
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        exitCode = (error as ExecSyncError).status;
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
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        exitCode = (error as ExecSyncError).status;
      }

      expect(exitCode).toBe(1);
    });
  });

  describe('CJK and RTL language support', () => {
    it('should validate CJK languages', () => {
      writeFileSync(`${testDir}/test-ja.html`, '<html lang="ja"><body>日本語のテスト</body></html>');
      writeFileSync(`${testDir}/test-ko.html`, '<html lang="ko"><body>한국어 테스트</body></html>');
      writeFileSync(`${testDir}/test-zh.html`, '<html lang="zh"><body>中文测试</body></html>');

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Found 3 non-Swedish article files');
      expect(result).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
    });

    it('should validate RTL languages', () => {
      writeFileSync(`${testDir}/test-ar.html`, '<html lang="ar" dir="rtl"><body>اختبار عربي</body></html>');
      writeFileSync(`${testDir}/test-he.html`, '<html lang="he" dir="rtl"><body>בדיקה עברית</body></html>');

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Found 2 non-Swedish article files');
      expect(result).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
    });
  });

  describe('BCP-47 consistency validation', () => {
    it('should pass for Norwegian articles with correct lang="nb"', () => {
      const content = `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta property="og:locale" content="nb_NO">
  <script type="application/ld+json">{"inLanguage": "nb"}</script>
</head>
<body>Test</body>
</html>`;
      writeFileSync(`${testDir}/test-no.html`, content);

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
      expect(result).not.toContain('BCP-47');
    });

    it('should fail for Norwegian articles with wrong lang="no"', () => {
      const content = `<!DOCTYPE html>
<html lang="no">
<head>
  <meta property="og:locale" content="nb_NO">
  <script type="application/ld+json">{"inLanguage": "nb"}</script>
</head>
<body>Test</body>
</html>`;
      writeFileSync(`${testDir}/test-no.html`, content);

      let output = '';
      try {
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        output = (error as ExecSyncError).stdout;
      }

      expect(output).toContain('BCP-47');
      expect(output).toContain('html[lang]');
      expect(output).toContain('expected "nb"');
    });

    it('should fail for Norwegian articles with wrong inLanguage', () => {
      const content = `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta property="og:locale" content="nb_NO">
  <script type="application/ld+json">{"inLanguage": "no"}</script>
</head>
<body>Test</body>
</html>`;
      writeFileSync(`${testDir}/test-no.html`, content);

      let output = '';
      try {
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        output = (error as ExecSyncError).stdout;
      }

      expect(output).toContain('BCP-47');
      expect(output).toContain('inLanguage');
    });

    it('should fail for Arabic articles missing dir="rtl"', () => {
      const content = `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta property="og:locale" content="ar_SA">
  <script type="application/ld+json">{"inLanguage": "ar"}</script>
</head>
<body>اختبار</body>
</html>`;
      writeFileSync(`${testDir}/test-ar.html`, content);

      let output = '';
      try {
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        output = (error as ExecSyncError).stdout;
      }

      expect(output).toContain('BCP-47');
      expect(output).toContain('dir');
      expect(output).toContain('rtl');
    });

    it('should fail for Hebrew articles missing dir="rtl"', () => {
      const content = `<!DOCTYPE html>
<html lang="he">
<head>
  <meta property="og:locale" content="he_IL">
  <script type="application/ld+json">{"inLanguage": "he"}</script>
</head>
<body>בדיקה</body>
</html>`;
      writeFileSync(`${testDir}/test-he.html`, content);

      let output = '';
      try {
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        output = (error as ExecSyncError).stdout;
      }

      expect(output).toContain('BCP-47');
      expect(output).toContain('dir');
    });

    it('should pass for consistent English articles', () => {
      const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta property="og:locale" content="en_US">
  <script type="application/ld+json">{"inLanguage": "en"}</script>
</head>
<body>Test</body>
</html>`;
      writeFileSync(`${testDir}/test-en.html`, content);

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
    });

    it('should fail for wrong og:locale on Norwegian articles', () => {
      const content = `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta property="og:locale" content="no_NO">
  <script type="application/ld+json">{"inLanguage": "nb"}</script>
</head>
<body>Test</body>
</html>`;
      writeFileSync(`${testDir}/test-no.html`, content);

      let output = '';
      try {
        execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
          encoding: 'utf-8'
        });
      } catch (error: unknown) {
        output = (error as ExecSyncError).stdout;
      }

      expect(output).toContain('BCP-47');
      expect(output).toContain('og:locale');
    });
  });

  describe('Content leakage detection', () => {
    it('should detect English paragraph leakage in non-EN articles', () => {
      // Create EN source article with substantive paragraphs
      const enContent = `<!DOCTYPE html>
<html lang="en">
<head><meta property="og:locale" content="en_US"><script type="application/ld+json">{"inLanguage": "en"}</script></head>
<body>
  <p>This is a substantive analytical paragraph about Swedish government policy that should be translated into the target language.</p>
  <p>The coalition dynamics reveal significant tensions between governing parties on immigration reform matters.</p>
</body>
</html>`;
      writeFileSync(`${testDir}/2026-04-09-test-en.html`, enContent);

      // Create DE translation that still contains verbatim EN paragraphs (untranslated)
      const deContent = `<!DOCTYPE html>
<html lang="de">
<head><meta property="og:locale" content="de_DE"><script type="application/ld+json">{"inLanguage": "de"}</script></head>
<body>
  <p>This is a substantive analytical paragraph about Swedish government policy that should be translated into the target language.</p>
  <p>Die Koalitionsdynamik zeigt erhebliche Spannungen zwischen den Regierungsparteien in Fragen der Einwanderungsreform.</p>
</body>
</html>`;
      writeFileSync(`${testDir}/2026-04-09-test-de.html`, deContent);

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Content leakage');
      expect(result).toContain('EN leakage');
    });

    it('should detect Swedish text leakage in non-SV articles', () => {
      const deContent = `<!DOCTYPE html>
<html lang="de">
<head><meta property="og:locale" content="de_DE"><script type="application/ld+json">{"inLanguage": "de"}</script></head>
<body>
  <p>Dies ist ein deutscher Absatz über die schwedische Regierungspolitik und ihre Auswirkungen.</p>
  <p>Regeringen överlämnar denna proposition till riksdagen. Stockholm den 1 april 2026.</p>
</body>
</html>`;
      writeFileSync(`${testDir}/2026-04-09-test-de.html`, deContent);

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Content leakage');
      expect(result).toContain('SV leakage');
    });

    it('should detect banned English boilerplate phrases in translations', () => {
      const frContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta property="og:locale" content="fr_FR"><script type="application/ld+json">{"inLanguage": "fr"}</script></head>
<body>
  <p>Ceci est un paragraphe analytique en français sur la politique gouvernementale suédoise.</p>
  <p>The pace of activity signals the political urgency driving this legislative push forward.</p>
  <p>Live intelligence platform for Swedish Parliament monitoring using CIA OSINT capabilities.</p>
</body>
</html>`;
      writeFileSync(`${testDir}/2026-04-09-test-fr.html`, frContent);

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).toContain('Content leakage');
      expect(result).toContain('EN phrase');
    });

    it('should pass for fully translated articles with no leakage', () => {
      // EN source
      const enContent = `<!DOCTYPE html>
<html lang="en">
<head><meta property="og:locale" content="en_US"><script type="application/ld+json">{"inLanguage": "en"}</script></head>
<body>
  <p>The government submitted ten new propositions to parliament this week covering defense and justice policy.</p>
</body>
</html>`;
      writeFileSync(`${testDir}/2026-04-09-test-en.html`, enContent);

      // Fully translated DE article
      const deContent = `<!DOCTYPE html>
<html lang="de">
<head><meta property="og:locale" content="de_DE"><script type="application/ld+json">{"inLanguage": "de"}</script></head>
<body>
  <p>Die Regierung hat diese Woche zehn neue Gesetzesvorlagen zu Verteidigungs- und Justizpolitik ins Parlament eingebracht.</p>
</body>
</html>`;
      writeFileSync(`${testDir}/2026-04-09-test-de.html`, deContent);

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).not.toContain('Content leakage');
      expect(result).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
    });

    it('should not flag EN articles for content leakage', () => {
      // EN articles should not be checked for EN paragraph leakage
      const enContent = `<!DOCTYPE html>
<html lang="en">
<head><meta property="og:locale" content="en_US"><script type="application/ld+json">{"inLanguage": "en"}</script></head>
<body>
  <p>The pace of activity signals the political urgency driving the current legislative session forward.</p>
  <p>Live intelligence platform for Swedish Parliament monitoring using CIA OSINT capabilities.</p>
</body>
</html>`;
      writeFileSync(`${testDir}/2026-04-09-test-en.html`, enContent);

      const result = execSync(`node scripts/validate-news-translations.ts ${testDir}`, {
        encoding: 'utf-8'
      });

      expect(result).not.toContain('Content leakage');
    });
  });
});
