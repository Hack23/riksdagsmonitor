/**
 * @module tests/agentic/gate-shared/file-walkers
 * @description Unit tests for `collectMdFilesRecursive` — the shared
 *              filesystem walker used by the stub scanner and any future
 *              recursive `.md` scan.
 * @see scripts/agentic/gate-shared/file-walkers.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { collectMdFilesRecursive } from '../../../scripts/agentic/gate-shared/file-walkers.js';
import { createTestDir } from './fixtures.js';

let testDir: string;

describe('collectMdFilesRecursive', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('returns empty array when directory does not exist', async () => {
    const result = await collectMdFilesRecursive(join(testDir, 'nope'), '');
    expect(result).toEqual([]);
  });

  it('collects top-level .md files only', async () => {
    writeFileSync(join(testDir, 'a.md'), '', 'utf-8');
    writeFileSync(join(testDir, 'b.md'), '', 'utf-8');
    writeFileSync(join(testDir, 'c.txt'), '', 'utf-8');
    const result = await collectMdFilesRecursive(testDir, '');
    expect(result.sort()).toEqual(['a.md', 'b.md']);
  });

  it('recurses into nested directories and returns paths relative to baseDir', async () => {
    mkdirSync(join(testDir, 'documents', 'sub'), { recursive: true });
    writeFileSync(join(testDir, 'top.md'), '', 'utf-8');
    writeFileSync(join(testDir, 'documents', 'mid.md'), '', 'utf-8');
    writeFileSync(join(testDir, 'documents', 'sub', 'leaf.md'), '', 'utf-8');
    writeFileSync(join(testDir, 'documents', 'ignored.txt'), '', 'utf-8');

    const result = await collectMdFilesRecursive(testDir, '');
    // Use forward slashes regardless of OS to compare deterministically
    const normalised = result.map((p) => p.split(/[\\/]/).join('/')).sort();
    expect(normalised).toEqual(['documents/mid.md', 'documents/sub/leaf.md', 'top.md']);
  });

  it('honours a non-empty prefix and joins paths under it', async () => {
    mkdirSync(join(testDir, 'documents'), { recursive: true });
    writeFileSync(join(testDir, 'documents', 'one.md'), '', 'utf-8');
    const result = await collectMdFilesRecursive(testDir, 'documents');
    expect(result.map((p) => p.split(/[\\/]/).join('/'))).toEqual(['documents/one.md']);
  });
});
