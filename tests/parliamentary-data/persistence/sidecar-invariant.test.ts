/**
 * @file sidecar-invariant.test.ts
 * @module tests/parliamentary-data/persistence/sidecar-invariant
 * @description **Sidecar invariant** — `persistDownloadedData` MUST write the
 * raw data file without injecting any pipeline-attached metadata
 * (`mcpCoverageState`, `mcpProvenance`, `mcpSignals`, `_metadata`).
 * Provenance lives exclusively in the `*.meta.json` sidecar.
 *
 * This invariant is the merge-safety control that lets parallel news
 * workflows produce byte-identical raw data files for the same source
 * document (see `Threat_Modeling.md`).
 *
 * Hard-required by issue #2620 acceptance criteria.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import type { DownloadedData } from '../../../scripts/parliamentary-data/data-downloader.js';
import { persistDownloadedData } from '../../../scripts/parliamentary-data/data-persistence.js';

import { makeRawDoc, emptyDownloadedData, mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('persistDownloadedData — sidecar invariant', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('strips in-memory MCP coverage metadata so data files remain byte-identical', () => {
    // The pipeline decorates RawDocument records with mcpCoverageState /
    // mcpProvenance / mcpSignals in memory. These must NEVER reach the
    // raw data file — provenance belongs in the sidecar .meta.json and
    // the manifest, not in the persisted JSON. Otherwise parallel
    // workflows produce divergent JSON for the same source document.
    const doc = makeRawDoc({
      dok_id: 'STRIP-TEST',
      ...({
        mcpCoverageState: 'metadata_only',
        mcpProvenance: {
          provider: 'riksdag-regering',
          endpoint: 'https://example.invalid/mcp',
          tool: 'get_dokument',
          query: { dok_id: 'STRIP-TEST' },
          resultCount: 1,
          coverageState: 'metadata_only',
          retrieval: 'live',
          retrievedAt: '2026-05-15T12:00:00.000Z',
        },
        mcpSignals: [],
      } as Record<string, unknown>),
    });
    const data: DownloadedData = {
      ...emptyDownloadedData(),
      propositions: [doc],
    };
    persistDownloadedData(data, '2025/26', undefined, tmpDir);

    const persisted = JSON.parse(
      fs.readFileSync(
        path.join(tmpDir, 'documents', 'propositions', 'strip-test.json'),
        'utf8',
      ),
    );
    expect(persisted).not.toHaveProperty('mcpCoverageState');
    expect(persisted).not.toHaveProperty('mcpProvenance');
    expect(persisted).not.toHaveProperty('mcpSignals');
    expect(persisted).not.toHaveProperty('_metadata');
    // The source dok_id and other genuine fields must still be present.
    expect(persisted.dok_id).toBe('STRIP-TEST');
  });

  it('produces byte-identical data files for parallel writes (collision-free)', () => {
    const doc = makeRawDoc({ dok_id: 'COLLISION-TEST' });
    const data: DownloadedData = {
      ...emptyDownloadedData(),
      propositions: [doc],
    };

    persistDownloadedData(data, '2025/26', undefined, tmpDir);
    const content1 = fs.readFileSync(
      path.join(tmpDir, 'documents', 'propositions', 'collision-test.json'),
      'utf8',
    );

    const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'riksdag-persist-test2-'));
    try {
      persistDownloadedData(data, '2025/26', undefined, tmpDir2);
      const content2 = fs.readFileSync(
        path.join(tmpDir2, 'documents', 'propositions', 'collision-test.json'),
        'utf8',
      );
      // Data files must be byte-identical — no embedded timestamp.
      expect(content1).toBe(content2);
    } finally {
      fs.rmSync(tmpDir2, { recursive: true, force: true });
    }
  });
});
