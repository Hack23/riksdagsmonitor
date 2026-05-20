/**
 * @module tests/validators/news-translations/rules/ai-must-replace
 * @description Per-rule unit tests for `checkFileForAIMustReplaceMarkers`.
 *              Pinned from the deleted
 *              `tests/validate-news-translations.test.ts` (commit
 *              `52f9743f78~1`, "AI_MUST_REPLACE marker detection"
 *              `describe` block). The orchestrator must hard-fail
 *              translated articles that still contain unresolved
 *              `<!-- AI_MUST_REPLACE: ... -->` comments — a publication
 *              gate dropped during the #2582 refactor and now restored.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkFileForAIMustReplaceMarkers } from '../../../../scripts/validators/news-translations/rules/ai-must-replace.js';

describe('checkFileForAIMustReplaceMarkers', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-ai-marker-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns null when no AI_MUST_REPLACE markers are present', () => {
    const filepath = join(testDir, 'clean-fi.html');
    writeFileSync(filepath, '<html lang="fi"><body><p>Tämä on suomenkielinen artikkeli.</p></body></html>');

    expect(checkFileForAIMustReplaceMarkers(filepath)).toBeNull();
  });

  it('detects a single AI_MUST_REPLACE comment', () => {
    const filepath = join(testDir, 'one-es.html');
    writeFileSync(
      filepath,
      `<html lang="es"><body>
        <!-- AI_MUST_REPLACE: why_matters — DATA: 3. Output MUST be in the article's language. -->
      </body></html>`,
    );

    const record = checkFileForAIMustReplaceMarkers(filepath);
    expect(record).not.toBeNull();
    expect(record?.filename).toBe('one-es.html');
    expect(record?.lang).toBe('es');
    expect(record?.markerCount).toBe(1);
    expect(record?.samples).toEqual(['why_matters']);
  });

  it('counts multiple markers and reports up to three distinct sample names', () => {
    const filepath = join(testDir, 'multi-de.html');
    writeFileSync(
      filepath,
      `<html lang="de"><body>
        <!-- AI_MUST_REPLACE: coalition_instability — Analysiere die Koalitionsstabilität. -->
        <!-- AI_MUST_REPLACE: critical_assessment — Schreibe eine kritische Bewertung. -->
        <!-- AI_MUST_REPLACE: forward_outlook — Skizziere Ausblick. -->
        <!-- AI_MUST_REPLACE: forward_outlook — duplicate name should be deduped. -->
      </body></html>`,
    );

    const record = checkFileForAIMustReplaceMarkers(filepath);
    expect(record?.markerCount).toBe(4);
    expect(record?.samples).toHaveLength(3);
    expect(record?.samples).toEqual([
      'coalition_instability',
      'critical_assessment',
      'forward_outlook',
    ]);
  });

  it('ignores AI_MUST_REPLACE text outside of HTML comments', () => {
    const filepath = join(testDir, 'plain-de.html');
    writeFileSync(
      filepath,
      '<html lang="de"><body><p>Discussion of the AI_MUST_REPLACE convention.</p></body></html>',
    );

    expect(checkFileForAIMustReplaceMarkers(filepath)).toBeNull();
  });

  it('records the filename even when the language suffix is missing', () => {
    const filepath = join(testDir, 'orphan.html');
    writeFileSync(
      filepath,
      '<html><body><!-- AI_MUST_REPLACE: stray — text. --></body></html>',
    );

    const record = checkFileForAIMustReplaceMarkers(filepath);
    expect(record?.lang).toBe('');
    expect(record?.markerCount).toBe(1);
  });

  it('throws a contextualised error when the file cannot be read', () => {
    const ghost = join(testDir, 'does-not-exist-fr.html');

    expect(() => checkFileForAIMustReplaceMarkers(ghost)).toThrow(/AI_MUST_REPLACE/);
  });
});
