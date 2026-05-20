/**
 * @module tests/validators/news-translations/rules/bcp47
 * @description Per-rule unit tests for `validateBCP47Consistency` and
 *              its `BCP47Error` record. Pinned from the deleted
 *              `tests/validate-news-translations.test.ts` (commit
 *              `52f9743f78~1`, "BCP-47 consistency validation"
 *              `describe` block); explicitly locks the `nb` (preferred)
 *              vs legacy `no` migration behaviour required by the
 *              language-expertise Riksdagsmonitor convention.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { validateBCP47Consistency } from '../../../../scripts/validators/news-translations/rules/bcp47.js';

const HEAD = (locale: string, inLang: string) =>
  `<head><meta property="og:locale" content="${locale}"><script type="application/ld+json">{"inLanguage": "${inLang}"}</script></head>`;

describe('validateBCP47Consistency — Norwegian nb/no migration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-bcp47-no-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('passes when html[lang]="nb", og:locale="nb_NO", inLanguage="nb"', () => {
    const filepath = join(testDir, 'test-no.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="nb">\n${HEAD('nb_NO', 'nb')}\n<body>Test</body>\n</html>`,
    );

    expect(validateBCP47Consistency(filepath, 'no')).toEqual([]);
  });

  it('flags html[lang]="no" as expected="nb", actual="no"', () => {
    const filepath = join(testDir, 'test-no.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="no">\n${HEAD('nb_NO', 'nb')}\n<body>Test</body>\n</html>`,
    );

    const errors = validateBCP47Consistency(filepath, 'no');
    expect(errors).toContainEqual({ field: 'html[lang]', expected: 'nb', actual: 'no' });
  });

  it('flags inLanguage="no" as expected="nb", actual="no"', () => {
    const filepath = join(testDir, 'test-no.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="nb">\n${HEAD('nb_NO', 'no')}\n<body>Test</body>\n</html>`,
    );

    const errors = validateBCP47Consistency(filepath, 'no');
    expect(errors).toContainEqual({ field: 'inLanguage', expected: 'nb', actual: 'no' });
  });

  it('flags og:locale="no_NO" as expected="nb_NO", actual="no_NO"', () => {
    const filepath = join(testDir, 'test-no.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="nb">\n${HEAD('no_NO', 'nb')}\n<body>Test</body>\n</html>`,
    );

    const errors = validateBCP47Consistency(filepath, 'no');
    expect(errors).toContainEqual({ field: 'og:locale', expected: 'nb_NO', actual: 'no_NO' });
  });
});

describe('validateBCP47Consistency — RTL dir attribute', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-bcp47-rtl-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('flags Arabic articles missing dir="rtl"', () => {
    const filepath = join(testDir, 'test-ar.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="ar">\n${HEAD('ar_SA', 'ar')}\n<body>اختبار</body>\n</html>`,
    );

    const errors = validateBCP47Consistency(filepath, 'ar');
    expect(errors).toContainEqual({ field: 'dir', expected: 'rtl', actual: 'missing' });
  });

  it('flags Hebrew articles missing dir="rtl"', () => {
    const filepath = join(testDir, 'test-he.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="he">\n${HEAD('he_IL', 'he')}\n<body>בדיקה</body>\n</html>`,
    );

    const errors = validateBCP47Consistency(filepath, 'he');
    expect(errors).toContainEqual({ field: 'dir', expected: 'rtl', actual: 'missing' });
  });

  it('passes Arabic articles that declare dir="rtl"', () => {
    const filepath = join(testDir, 'test-ar.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n${HEAD('ar_SA', 'ar')}\n<body>اختبار</body>\n</html>`,
    );

    expect(validateBCP47Consistency(filepath, 'ar')).toEqual([]);
  });
});

describe('validateBCP47Consistency — consistent non-Norwegian articles', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-bcp47-other-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('passes consistent English articles', () => {
    const filepath = join(testDir, 'test-en.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="en">\n${HEAD('en_US', 'en')}\n<body>Test</body>\n</html>`,
    );

    expect(validateBCP47Consistency(filepath, 'en')).toEqual([]);
  });

  it('reports html[lang] mismatch when the tag disagrees with the filename', () => {
    const filepath = join(testDir, 'test-de.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="fr">\n${HEAD('de_DE', 'de')}\n<body>Test</body>\n</html>`,
    );

    const errors = validateBCP47Consistency(filepath, 'de');
    expect(errors).toContainEqual({ field: 'html[lang]', expected: 'de', actual: 'fr' });
  });

  it('does not report og:locale when the meta tag is absent', () => {
    const filepath = join(testDir, 'test-de.html');
    writeFileSync(
      filepath,
      `<!DOCTYPE html>\n<html lang="de">\n<head><script type="application/ld+json">{"inLanguage": "de"}</script></head>\n<body>Test</body>\n</html>`,
    );

    expect(validateBCP47Consistency(filepath, 'de')).toEqual([]);
  });
});
