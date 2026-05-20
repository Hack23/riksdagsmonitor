/**
 * @file world-bank.test.ts
 * @module tests/parliamentary-data/persistence/world-bank
 * @description `persistWorldBankData` — indicator/country layout + sidecar.
 * Split from `tests/data-persistence.test.ts` (issue #2620).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { persistWorldBankData } from '../../../scripts/parliamentary-data/data-persistence.js';
import { mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('persistWorldBankData', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('should store data with indicator/country structure', () => {
    const resultPath = persistWorldBankData(
      'NY.GDP.MKTP.CD',
      'SWE',
      [{ date: '2025', value: 600000000000 }],
      tmpDir,
    );
    expect(fs.existsSync(resultPath)).toBe(true);

    const data = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    expect(data[0].date).toBe('2025');

    expect(resultPath).toContain(path.join('worldbank', 'ny-gdp-mktp-cd', 'swe.json'));

    const metaPath = resultPath.replace('.json', '.meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    expect(meta.indicator).toBe('NY.GDP.MKTP.CD');
    expect(meta.country).toBe('SWE');
  });
});
