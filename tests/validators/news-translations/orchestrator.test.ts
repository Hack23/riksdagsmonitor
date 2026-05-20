/**
 * @module tests/validators/news-translations/orchestrator
 * @description Integration spine for `validateNewsTranslations()`.
 *              Pinned from the deleted
 *              `tests/validate-news-translations.test.ts` (commit
 *              `52f9743f78~1`); drives the end-to-end orchestrator
 *              via captured stdout instead of `execSync` for speed and
 *              determinism.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateNewsTranslations } from '../../../scripts/validators/news-translations/index.js';

/** Capture every `console.log` line emitted while `fn` runs. */
const runCapturing = (fn: () => number): { exitCode: number; output: string } => {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map((a) => String(a)).join(' '));
  });
  try {
    const exitCode = fn();
    return { exitCode, output: lines.join('\n') };
  } finally {
    spy.mockRestore();
  }
};

const HEAD = (locale: string, inLang: string) =>
  `<head><meta property="og:locale" content="${locale}"><script type="application/ld+json">{"inLanguage": "${inLang}"}</script></head>`;

describe('validateNewsTranslations — orchestrator integration spine', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-orch-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('Language code detection + file walker', () => {
    it('detects English files as non-Swedish targets', () => {
      writeFileSync(
        join(testDir, '2026-02-14-test-en.html'),
        `<html lang="en">${HEAD('en_US', 'en')}<body><h1>Test</h1></body></html>`,
      );

      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(0);
      expect(output).toContain('Found 1 non-Swedish article files to check');
      expect(output).toContain('✓ Fully translated: 1');
    });

    it('skips Swedish files', () => {
      writeFileSync(join(testDir, 'test-sv.html'), '<html lang="sv"><body>Test</body></html>');
      writeFileSync(
        join(testDir, 'test-en.html'),
        `<html lang="en">${HEAD('en_US', 'en')}<body>Test</body></html>`,
      );

      const { output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(output).toContain('Found 1 non-Swedish article files to check');
    });

    it('ignores files without a language code', () => {
      writeFileSync(join(testDir, 'invalid.html'), '<html><body>Test</body></html>');
      const { output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(output).toContain('Found 0 non-Swedish article files');
    });

    it('recurses into subdirectories', () => {
      mkdirSync(join(testDir, 'sub'), { recursive: true });
      writeFileSync(
        join(testDir, 'test1-en.html'),
        `<html lang="en">${HEAD('en_US', 'en')}<body>1</body></html>`,
      );
      writeFileSync(
        join(testDir, 'sub', 'test2-en.html'),
        `<html lang="en">${HEAD('en_US', 'en')}<body>2</body></html>`,
      );

      const { output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(output).toContain('Found 2 non-Swedish article files');
    });
  });

  describe('Untranslated marker exit codes', () => {
    it('exits 1 when data-translate markers remain', () => {
      writeFileSync(
        join(testDir, 'test-en.html'),
        `<html lang="en">${HEAD('en_US', 'en')}<body><span data-translate="true" lang="sv">text</span></body></html>`,
      );

      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(1);
      expect(output).toContain('VALIDATION FAILED');
    });

    it('exits 0 for fully translated articles', () => {
      writeFileSync(
        join(testDir, 'test-en.html'),
        `<html lang="en">${HEAD('en_US', 'en')}<body>Clean</body></html>`,
      );
      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(0);
      expect(output).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
    });

    it('extracts a sample marker count when markers remain', () => {
      writeFileSync(
        join(testDir, 'test-en.html'),
        `<html lang="en">${HEAD('en_US', 'en')}<body>
          <span data-translate="true" lang="sv">Detta är svensk text</span>
          <span data-translate="true" lang="sv">Mer svensk text</span>
        </body></html>`,
      );

      const { output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(output).toContain('Detta är svensk text');
      expect(output).toContain('2 untranslated marker(s)');
    });
  });

  describe('BCP-47 consistency (nb vs legacy no migration)', () => {
    it('passes Norwegian articles with consistent lang="nb"', () => {
      writeFileSync(
        join(testDir, 'test-no.html'),
        `<!DOCTYPE html><html lang="nb">${HEAD('nb_NO', 'nb')}<body>Test</body></html>`,
      );

      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(0);
      expect(output).toContain('✅ ALL ARTICLES FULLY TRANSLATED');
      expect(output).not.toContain('BCP-47');
    });

    it('fails Norwegian articles that still use lang="no"', () => {
      writeFileSync(
        join(testDir, 'test-no.html'),
        `<!DOCTYPE html><html lang="no">${HEAD('nb_NO', 'nb')}<body>Test</body></html>`,
      );

      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(1);
      expect(output).toContain('BCP-47');
      expect(output).toContain('html[lang]');
      expect(output).toContain('expected "nb"');
    });

    it('fails Arabic articles missing dir="rtl"', () => {
      writeFileSync(
        join(testDir, 'test-ar.html'),
        `<!DOCTYPE html><html lang="ar">${HEAD('ar_SA', 'ar')}<body>اختبار</body></html>`,
      );

      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(1);
      expect(output).toContain('BCP-47');
      expect(output).toContain('dir');
    });
  });

  describe('Content leakage detection (soft warning)', () => {
    it('warns on EN paragraph leakage in non-EN articles without failing', () => {
      const shared = 'This is a substantive analytical paragraph about Swedish government policy that should be translated.';
      writeFileSync(
        join(testDir, '2026-04-09-test-en.html'),
        `<html lang="en">${HEAD('en_US', 'en')}<body><p>${shared}</p></body></html>`,
      );
      writeFileSync(
        join(testDir, '2026-04-09-test-de.html'),
        `<html lang="de">${HEAD('de_DE', 'de')}<body><p>${shared}</p></body></html>`,
      );

      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(0);
      expect(output).toContain('Content leakage');
      expect(output).toContain('EN leakage');
      expect(output).toContain('TRANSLATION QUALITY WARNING');
    });

    it('warns on banned English phrases in translations', () => {
      writeFileSync(
        join(testDir, '2026-04-09-test-fr.html'),
        `<html lang="fr">${HEAD('fr_FR', 'fr')}<body>
          <p>Ceci est un paragraphe analytique en français sur la politique gouvernementale.</p>
          <p>The pace of activity signals the political urgency driving this legislative push.</p>
        </body></html>`,
      );

      const { output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(output).toContain('Content leakage');
      expect(output).toContain('EN phrase');
    });
  });

  describe('AI_MUST_REPLACE marker detection (restored regression)', () => {
    it('fails with exit 1 when an AI_MUST_REPLACE comment remains', () => {
      writeFileSync(
        join(testDir, '2026-04-09-test-es.html'),
        `<html lang="es">${HEAD('es_ES', 'es')}<body>
          <p>Este es un párrafo en español sobre política sueca.</p>
          <!-- AI_MUST_REPLACE: why_matters — DATA: 3 policy domains. -->
        </body></html>`,
      );

      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(1);
      expect(output).toContain('AI_MUST_REPLACE');
      expect(output).toContain('VALIDATION FAILED');
    });

    it('reports distinct sample marker names', () => {
      writeFileSync(
        join(testDir, '2026-04-09-test-de.html'),
        `<html lang="de">${HEAD('de_DE', 'de')}<body>
          <p>Dies ist ein deutscher Absatz.</p>
          <!-- AI_MUST_REPLACE: coalition_instability — text. -->
          <!-- AI_MUST_REPLACE: critical_assessment — text. -->
        </body></html>`,
      );

      const { exitCode, output } = runCapturing(() => validateNewsTranslations(testDir));
      expect(exitCode).toBe(1);
      expect(output).toContain('coalition_instability');
      expect(output).toContain('2 unresolved marker(s)');
    });
  });
});
