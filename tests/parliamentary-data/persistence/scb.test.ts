/**
 * @file scb.test.ts
 * @module tests/parliamentary-data/persistence/scb
 * @description `persistSCBData` — Swedish-specific ground-truth provider.
 * Split from `tests/data-persistence.test.ts` (issue #2620).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { persistSCBData } from '../../../scripts/parliamentary-data/data-persistence.js';
import { mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('persistSCBData', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('should store SCB table data with sidecar', () => {
    const resultPath = persistSCBData(
      'BE0101A',
      { columns: ['Region', 'Population'], data: [[1, 10000]] },
      { region: '01' },
      tmpDir,
    );
    expect(fs.existsSync(resultPath)).toBe(true);
    expect(resultPath).toContain(path.join('scb', 'be0101a.json'));

    const metaPath = resultPath.replace('.json', '.meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    expect(meta.tableId).toBe('BE0101A');
    expect(meta.query.region).toBe('01');
  });

  it('should work without query parameter', () => {
    const resultPath = persistSCBData('TEST_TABLE', { data: [] }, undefined, tmpDir);
    expect(fs.existsSync(resultPath)).toBe(true);
    const metaPath = resultPath.replace('.json', '.meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    expect(meta.query).toBeUndefined();
  });
});
