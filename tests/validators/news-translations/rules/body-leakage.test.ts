/**
 * @module tests/validators/news-translations/rules/body-leakage
 * @description Per-rule unit tests for `extractBodyParagraphs` and
 *              `checkBodyContentLeakage`. Pinned from the deleted
 *              `tests/validate-news-translations.test.ts` (commit
 *              `52f9743f78~1`, "Content leakage detection" `describe`
 *              block).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  checkBodyContentLeakage,
  extractBodyParagraphs,
} from '../../../../scripts/validators/news-translations/rules/body-leakage.js';

describe('extractBodyParagraphs', () => {
  it('returns only paragraphs longer than the minimum length', () => {
    const html = `<body>
      <p>Short</p>
      <p>This paragraph is well past the forty-character minimum length threshold.</p>
    </body>`;

    const paragraphs = extractBodyParagraphs(html);
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toContain('forty-character minimum');
  });

  it('strips inline tags inside paragraphs', () => {
    const html = `<body><p>This is <strong>bold</strong> and <em>italic</em> content that meets the minimum length.</p></body>`;

    const [paragraph] = extractBodyParagraphs(html);
    expect(paragraph).toBe('This is bold and italic content that meets the minimum length.');
  });

  it('removes <script> and <style> blocks before extraction', () => {
    const html = `<body>
      <script>var pretend = 'this is a script content that is long enough to look like a paragraph';</script>
      <style>.foo{display:none;} /* this style block is long enough to confuse a naive parser */</style>
      <p>This is the only real paragraph that should survive the extraction step today.</p>
    </body>`;

    const paragraphs = extractBodyParagraphs(html);
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toContain('only real paragraph');
  });

  it('collapses whitespace inside paragraphs', () => {
    const html = `<body><p>This   paragraph\nhas\tlots\n\nof  whitespace baked into its source markup.</p></body>`;
    const [paragraph] = extractBodyParagraphs(html);
    expect(paragraph).toBe('This paragraph has lots of whitespace baked into its source markup.');
  });
});

describe('checkBodyContentLeakage', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-leakage-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns null when fileLang is "en" (EN articles are not checked)', () => {
    const filepath = join(testDir, 'test-en.html');
    writeFileSync(
      filepath,
      `<html><body><p>The pace of activity signals the political urgency driving the legislation.</p></body></html>`,
    );

    expect(checkBodyContentLeakage(filepath, null, 'en')).toBeNull();
  });

  it('detects EN paragraph leakage when the same paragraph appears in EN and DE files', () => {
    const enPath = join(testDir, '2026-04-09-test-en.html');
    const dePath = join(testDir, '2026-04-09-test-de.html');
    const shared = 'This is a substantive analytical paragraph about Swedish government policy that should be translated.';
    writeFileSync(enPath, `<html><body><p>${shared}</p></body></html>`);
    writeFileSync(dePath, `<html><body><p>${shared}</p></body></html>`);

    const record = checkBodyContentLeakage(dePath, enPath, 'de');
    expect(record).not.toBeNull();
    expect(record?.untranslatedParagraphs).toBe(1);
    expect(record?.samples.some((s) => s.startsWith('[EN leakage]'))).toBe(true);
  });

  it('detects Swedish leakage phrases in non-SV articles', () => {
    const filepath = join(testDir, '2026-04-09-test-de.html');
    writeFileSync(
      filepath,
      `<html><body>
        <p>Dies ist ein deutscher Absatz über die schwedische Regierungspolitik und ihre Auswirkungen.</p>
        <p>Regeringen överlämnar denna proposition till riksdagen. Stockholm den 1 april 2026.</p>
      </body></html>`,
    );

    const record = checkBodyContentLeakage(filepath, null, 'de');
    expect(record).not.toBeNull();
    expect(record?.phraseMatches).toBeGreaterThan(0);
    expect(record?.samples.some((s) => s.startsWith('[SV leakage]'))).toBe(true);
  });

  it('detects banned English boilerplate phrases in translations', () => {
    const filepath = join(testDir, '2026-04-09-test-fr.html');
    writeFileSync(
      filepath,
      `<html><body>
        <p>Ceci est un paragraphe analytique en français sur la politique gouvernementale suédoise.</p>
        <p>The pace of activity signals the political urgency driving this legislative push forward.</p>
        <p>Live intelligence platform for Swedish Parliament monitoring using CIA OSINT capabilities.</p>
      </body></html>`,
    );

    const record = checkBodyContentLeakage(filepath, null, 'fr');
    expect(record).not.toBeNull();
    expect(record?.phraseMatches).toBeGreaterThan(0);
    expect(record?.samples.some((s) => s.startsWith('[EN phrase]'))).toBe(true);
  });

  it('returns null for fully translated DE articles with no leakage', () => {
    const enPath = join(testDir, '2026-04-09-clean-en.html');
    const dePath = join(testDir, '2026-04-09-clean-de.html');
    writeFileSync(
      enPath,
      `<html><body><p>The government submitted ten new propositions to parliament this week.</p></body></html>`,
    );
    writeFileSync(
      dePath,
      `<html><body><p>Die Regierung hat diese Woche zehn neue Gesetzesvorlagen ins Parlament eingebracht.</p></body></html>`,
    );

    expect(checkBodyContentLeakage(dePath, enPath, 'de')).toBeNull();
  });

  it('returns null when the translated body has no paragraphs above the minimum length', () => {
    const filepath = join(testDir, 'short-de.html');
    writeFileSync(filepath, '<html><body><p>Hi</p></body></html>');

    expect(checkBodyContentLeakage(filepath, null, 'de')).toBeNull();
  });

  it('handles a missing EN source file gracefully (phrase rules still run)', () => {
    const filepath = join(testDir, 'orphan-fr.html');
    writeFileSync(
      filepath,
      `<html><body>
        <p>Ceci est un paragraphe analytique en français sur la politique gouvernementale.</p>
        <p>Live intelligence platform for Swedish Parliament monitoring using CIA OSINT capabilities.</p>
      </body></html>`,
    );

    // EN source intentionally omitted
    const record = checkBodyContentLeakage(filepath, null, 'fr');
    expect(record).not.toBeNull();
    expect(record?.untranslatedParagraphs).toBe(0);
    expect(record?.phraseMatches).toBeGreaterThan(0);
  });
});
