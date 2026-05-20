/**
 * @module tests/validators/news-translations/rules/untranslated
 * @description Per-rule unit tests for the `data-translate="true"`
 *              marker scanner (`checkFileForUntranslatedContent`).
 *              Pinned from the deleted
 *              `tests/validate-news-translations.test.ts` (commit
 *              `52f9743f78~1`, "Untranslated marker detection"
 *              `describe` block).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkFileForUntranslatedContent } from '../../../../scripts/validators/news-translations/rules/untranslated.js';

describe('checkFileForUntranslatedContent', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-untranslated-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns passed=true when no markers are present', () => {
    const filepath = join(testDir, 'clean-en.html');
    writeFileSync(filepath, '<html lang="en"><body><h1>Hi</h1><p>No markers</p></body></html>');

    const result = checkFileForUntranslatedContent(filepath);
    expect(result.passed).toBe(true);
    expect(result.markerCount).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('counts every data-translate="true" occurrence', () => {
    const filepath = join(testDir, 'multi-en.html');
    writeFileSync(filepath, `
      <html lang="en"><body>
        <span data-translate="true" lang="sv">ett</span>
        <span data-translate="true" lang="sv">två</span>
        <span data-translate="true" lang="sv">tre</span>
      </body></html>
    `);

    const result = checkFileForUntranslatedContent(filepath);
    expect(result.passed).toBe(false);
    expect(result.markerCount).toBe(3);
  });

  it('returns up to three sample Swedish snippets from the markers', () => {
    const filepath = join(testDir, 'samples-en.html');
    writeFileSync(filepath, `
      <html lang="en"><body>
        <span data-translate="true" lang="sv">Detta är svensk text</span>
        <span data-translate="true" lang="sv">Mer svensk text</span>
        <span data-translate="true" lang="sv">Ytterligare svensk text</span>
        <span data-translate="true" lang="sv">Ännu mer text</span>
      </body></html>
    `);

    const result = checkFileForUntranslatedContent(filepath);
    expect(result.passed).toBe(false);
    expect(result.markerCount).toBe(4);
    expect(result.samples).toHaveLength(3);
    expect(result.samples?.[0]).toBe('Detta är svensk text');
  });

  it('returns an error record when the file cannot be read', () => {
    const ghost = join(testDir, 'does-not-exist-en.html');

    const result = checkFileForUntranslatedContent(ghost);
    expect(result.error).toBeDefined();
    expect(result.passed).toBeUndefined();
  });

  it('does not match standalone strings without the full attribute', () => {
    const filepath = join(testDir, 'partial-en.html');
    writeFileSync(filepath, '<html lang="en"><body>data-translate="false" is fine</body></html>');

    const result = checkFileForUntranslatedContent(filepath);
    expect(result.passed).toBe(true);
  });
});
