/**
 * @file collision-avoidance.test.ts
 * @module tests/parliamentary-data/persistence/collision-avoidance
 * @description Within-batch collision avoidance for `persistDownloadedData` —
 * duplicate slugs get `-1`, `-2`, … suffixed so the disk write never
 * silently overwrites a prior document.
 *
 * Split from the original 710-line `tests/data-persistence.test.ts`
 * (issue #2620).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import type { RawDocument } from '../../../scripts/data-transformers/types.js';
import type { DownloadedData } from '../../../scripts/parliamentary-data/data-downloader.js';
import { persistDownloadedData } from '../../../scripts/parliamentary-data/data-persistence.js';

import { emptyDownloadedData, mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('persistDownloadedData — collision avoidance', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('should suffix duplicate doc IDs within a batch', () => {
    const docWithTitleOnly = (title: string): RawDocument =>
      ({
        titel: title,
        doktyp: 'prop',
        organ: 'FiU',
        datum: '2026-03-28',
      }) as unknown as RawDocument;

    const data: DownloadedData = {
      ...emptyDownloadedData(),
      propositions: [
        docWithTitleOnly('Same Title'),
        docWithTitleOnly('Same Title'),
        docWithTitleOnly('Same Title'),
      ],
    };
    const result = persistDownloadedData(data, '2025/26', undefined, tmpDir);
    expect(result.written).toBe(3);

    const propDir = path.join(tmpDir, 'documents', 'propositions');
    const files = fs
      .readdirSync(propDir)
      .filter((f) => f.endsWith('.json') && !f.endsWith('.meta.json'));
    expect(files.length).toBe(3);
    expect(files.some((f) => f === 'same-title.json')).toBe(true);
    expect(files.some((f) => f === 'same-title-1.json')).toBe(true);
    expect(files.some((f) => f === 'same-title-2.json')).toBe(true);
  });
});
