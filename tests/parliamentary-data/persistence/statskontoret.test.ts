/**
 * @file statskontoret.test.ts
 * @module tests/parliamentary-data/persistence/statskontoret
 * @description `persistStatskontoretData` — dataset/artifact layout + sidecar.
 * New focused test added by issue #2620 (the original 710-line
 * `tests/data-persistence.test.ts` did not cover this persister).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { persistStatskontoretData } from '../../../scripts/parliamentary-data/data-persistence.js';
import { mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('persistStatskontoretData', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('should store Statskontoret data with dataset/artifact structure and sidecar', () => {
    const resultPath = persistStatskontoretData(
      'myndighetsforteckning',
      'downloads',
      { agencies: [{ name: 'Skatteverket' }] },
      tmpDir,
    );
    expect(fs.existsSync(resultPath)).toBe(true);
    expect(resultPath).toContain(
      path.join('statskontoret', 'myndighetsforteckning', 'downloads.json'),
    );

    const data = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    expect(data.agencies[0].name).toBe('Skatteverket');

    const metaPath = resultPath.replace('.json', '.meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    expect(meta.dataset).toBe('myndighetsforteckning');
    expect(meta.artifact).toBe('downloads');
  });

  it('should sanitize dataset and artifact names', () => {
    const resultPath = persistStatskontoretData(
      '../traversal',
      'derived-stats',
      { ok: true },
      tmpDir,
    );
    expect(fs.existsSync(resultPath)).toBe(true);
    expect(resultPath.startsWith(tmpDir)).toBe(true);
    expect(resultPath).not.toContain('../');
  });
});
