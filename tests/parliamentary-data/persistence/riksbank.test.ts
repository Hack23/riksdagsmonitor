/**
 * @file riksbank.test.ts
 * @module tests/parliamentary-data/persistence/riksbank
 * @description `persistRiksbankData` — repo-rate path + sidecar provenance.
 * Split from `tests/data-persistence.test.ts` (issue #2620).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { persistRiksbankData } from '../../../scripts/parliamentary-data/data-persistence.js';
import { mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('persistRiksbankData', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('should store Riksbank artifacts with sidecar', () => {
    const resultPath = persistRiksbankData(
      'repo-rate-path',
      { provider: 'riksbank', url: 'https://www.riksbank.se/en-gb/monetary-policy/' },
      tmpDir,
    );
    expect(fs.existsSync(resultPath)).toBe(true);
    expect(resultPath).toContain(path.join('riksbank', 'repo-rate-path.json'));

    const metaPath = resultPath.replace('.json', '.meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    expect(meta.kind).toBe('repo-rate-path');
    expect(meta.url).toBe('https://www.riksbank.se/en-gb/monetary-policy/');
    expect(meta.mcpTool).toBe('riksbank-ts-client');
  });
});
