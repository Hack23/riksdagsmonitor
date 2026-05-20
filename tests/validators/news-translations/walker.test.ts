/**
 * @module tests/validators/news-translations/walker
 * @description Per-rule unit tests for the filesystem walker
 *              (`getAllHtmlFiles`, `deriveEnSourcePath`). Pinned from the
 *              deleted `tests/validate-news-translations.test.ts` (commit
 *              `52f9743f78~1`, "Recursive directory scanning" `describe`
 *              block).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  deriveEnSourcePath,
  getAllHtmlFiles,
} from '../../../scripts/validators/news-translations/walker.js';

describe('getAllHtmlFiles', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-walker-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('finds top-level HTML files', () => {
    writeFileSync(join(testDir, 'a.html'), '<p>a</p>');
    writeFileSync(join(testDir, 'b.html'), '<p>b</p>');
    writeFileSync(join(testDir, 'c.txt'), 'ignored');

    const files = getAllHtmlFiles(testDir);
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.endsWith('.html'))).toBe(true);
  });

  it('recurses into subdirectories', () => {
    mkdirSync(join(testDir, 'sub', 'nested'), { recursive: true });
    writeFileSync(join(testDir, 'root-en.html'), '<p>root</p>');
    writeFileSync(join(testDir, 'sub', 'a-de.html'), '<p>a</p>');
    writeFileSync(join(testDir, 'sub', 'nested', 'b-fr.html'), '<p>b</p>');

    const files = getAllHtmlFiles(testDir);
    expect(files).toHaveLength(3);
    expect(files.some((f) => f.endsWith('root-en.html'))).toBe(true);
    expect(files.some((f) => f.endsWith('a-de.html'))).toBe(true);
    expect(files.some((f) => f.endsWith('b-fr.html'))).toBe(true);
  });

  it('ignores non-HTML files', () => {
    writeFileSync(join(testDir, 'doc.md'), '# doc');
    writeFileSync(join(testDir, 'data.json'), '{}');
    writeFileSync(join(testDir, 'styles.css'), 'body{}');

    expect(getAllHtmlFiles(testDir)).toEqual([]);
  });

  it('returns an empty array (and logs) for a missing directory', () => {
    const ghost = join(testDir, 'does', 'not', 'exist');
    expect(getAllHtmlFiles(ghost)).toEqual([]);
  });
});

describe('deriveEnSourcePath', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'news-walker-en-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns the EN sibling path when it exists', () => {
    const enPath = join(testDir, '2026-04-09-test-en.html');
    const dePath = join(testDir, '2026-04-09-test-de.html');
    writeFileSync(enPath, '<p>en</p>');
    writeFileSync(dePath, '<p>de</p>');

    expect(deriveEnSourcePath(dePath)).toBe(enPath);
  });

  it('returns null when the EN sibling is missing', () => {
    const dePath = join(testDir, '2026-04-09-orphan-de.html');
    writeFileSync(dePath, '<p>orphan</p>');

    expect(deriveEnSourcePath(dePath)).toBeNull();
  });

  it('returns null when the filename has no language suffix', () => {
    const noSuffix = join(testDir, '2026-04-09-plain.html');
    writeFileSync(noSuffix, '<p>plain</p>');

    expect(deriveEnSourcePath(noSuffix)).toBeNull();
  });

  it('derives EN sibling regardless of source language (fr, ja, ar)', () => {
    const enPath = join(testDir, '2026-04-09-multi-en.html');
    writeFileSync(enPath, '<p>en</p>');
    writeFileSync(join(testDir, '2026-04-09-multi-fr.html'), '<p>fr</p>');
    writeFileSync(join(testDir, '2026-04-09-multi-ja.html'), '<p>ja</p>');
    writeFileSync(join(testDir, '2026-04-09-multi-ar.html'), '<p>ar</p>');

    expect(deriveEnSourcePath(join(testDir, '2026-04-09-multi-fr.html'))).toBe(enPath);
    expect(deriveEnSourcePath(join(testDir, '2026-04-09-multi-ja.html'))).toBe(enPath);
    expect(deriveEnSourcePath(join(testDir, '2026-04-09-multi-ar.html'))).toBe(enPath);
  });
});
