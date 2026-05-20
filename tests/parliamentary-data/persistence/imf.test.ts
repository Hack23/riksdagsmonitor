/**
 * @file imf.test.ts
 * @module tests/parliamentary-data/persistence/imf
 * @description `persistIMFData` — provenance sidecar including database +
 * projectionVintage fields (ECONOMIC_DATA_CONTRACT.md v3.1 vintage discipline).
 * Split from `tests/data-persistence.test.ts` (issue #2620).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { persistIMFData } from '../../../scripts/parliamentary-data/data-persistence.js';
import { mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('persistIMFData', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('stores IMF data under imf/{indicator}/{country}.json with sidecar', () => {
    const resultPath = persistIMFData(
      'NGDP_RPCH',
      'SWE',
      [{ period: '2026', value: 2.1, projection: true }],
      {
        database: 'WEO',
        projectionVintage: 'WEO-2026-04',
        dataRoot: tmpDir,
      },
    );
    expect(fs.existsSync(resultPath)).toBe(true);
    expect(resultPath).toContain(path.join('imf', 'ngdp-rpch', 'swe.json'));

    const metaPath = resultPath.replace('.json', '.meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    expect(meta.mcpTool).toBe('imf-ts-client');
    expect(meta.indicator).toBe('NGDP_RPCH');
    expect(meta.country).toBe('SWE');
    expect(meta.database).toBe('WEO');
    expect(meta.projectionVintage).toBe('WEO-2026-04');
  });

  it('omits optional provenance fields when not supplied', () => {
    const resultPath = persistIMFData(
      'PCPIPCH',
      'DEU',
      { data: [] },
      { dataRoot: tmpDir },
    );
    const metaPath = resultPath.replace('.json', '.meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    expect(meta.database).toBeUndefined();
    expect(meta.projectionVintage).toBeUndefined();
  });
});
