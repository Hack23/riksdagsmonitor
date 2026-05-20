/**
 * @file data-persistence-integration.test.ts
 * @module tests/parliamentary-data/data-persistence-integration
 * @description Integration spine for the persistence layer — exercises
 * **cross-source** scenarios where multiple `persist*` functions write into
 * the same `analysis/data/` tree in a single run.
 *
 * The single-provider happy-path + edge-case suites live under
 * `tests/parliamentary-data/persistence/*.test.ts`. Sidecar invariance has
 * a dedicated module
 * (`tests/parliamentary-data/persistence/sidecar-invariant.test.ts`).
 *
 * This spine asserts the *interaction* contract: no provider can overwrite
 * another provider's tree, and every provider writes a sibling sidecar.
 *
 * Split from the original 710-line `tests/data-persistence.test.ts`
 * (issue #2620).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import type { DownloadedData } from '../../scripts/parliamentary-data/data-downloader.js';
import {
  persistDownloadedData,
  persistEvents,
  persistMPs,
  persistMCPResponse,
  persistWorldBankData,
  persistIMFData,
  persistSCBData,
  persistRiksbankData,
  persistStatskontoretData,
} from '../../scripts/parliamentary-data/data-persistence.js';

import {
  makeRawDoc,
  emptyDownloadedData,
  mkTmpDir,
  cleanupTmpDir,
} from './persistence/_fixtures.js';

describe('data-persistence — cross-source integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir('riksdag-persist-integ-');
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('writes every provider into a disjoint sub-tree under a shared dataRoot', () => {
    // Riksdag documents
    const data: DownloadedData = {
      ...emptyDownloadedData(),
      propositions: [makeRawDoc({ dok_id: 'PROP-A', titel: 'Integ Budget' })],
    };
    persistDownloadedData(data, '2025/26', undefined, tmpDir);
    // Calendar events
    persistEvents(
      [makeRawDoc({ dok_id: 'EVT-A', datum: '2026-03-28' })],
      '2025/26',
      tmpDir,
    );
    // MPs
    persistMPs(
      [{ intressent_id: 'MP-A', tilltalsnamn: 'Integ' } as never],
      '2025/26',
      tmpDir,
    );
    // Generic MCP response
    persistMCPResponse(
      { tool: 'get_sync_status', params: {}, server: 'riksdag-regering' },
      { status: 'ok' },
      'integ-sync',
      tmpDir,
    );
    // Economic data — WB → IMF (canonical economic provider per
    // ECONOMIC_DATA_CONTRACT.md v3.1; WB is governance/environment residue).
    persistWorldBankData('CC.EST', 'SWE', [{ date: '2024', value: 1.8 }], tmpDir);
    persistIMFData(
      'NGDP_RPCH',
      'SWE',
      [{ period: '2026', value: 2.1 }],
      { database: 'WEO', projectionVintage: 'WEO-2026-04', dataRoot: tmpDir },
    );
    // SCB ground truth
    persistSCBData('BE0101A', { data: [] }, undefined, tmpDir);
    // Riksbank
    persistRiksbankData(
      'repo-rate-path',
      { provider: 'riksbank', url: 'https://www.riksbank.se' },
      tmpDir,
    );
    // Statskontoret
    persistStatskontoretData(
      'myndighetsforteckning',
      'downloads',
      { agencies: [] },
      tmpDir,
    );

    // Each provider lives in its own top-level directory under dataRoot.
    const expectedSubtrees = [
      'documents',
      'events',
      'mps',
      'mcp-responses',
      'worldbank',
      'imf',
      'scb',
      'riksbank',
      'statskontoret',
    ];
    for (const sub of expectedSubtrees) {
      expect(fs.existsSync(path.join(tmpDir, sub))).toBe(true);
    }
    // No provider overwrites another provider's tree.
    expect(fs.existsSync(path.join(tmpDir, 'documents', 'propositions', 'prop-a.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28', 'evt-a.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'mps', 'mp-a.json'))).toBe(true);
  });

  it('every provider emits a sibling *.meta.json sidecar', () => {
    persistDownloadedData(
      { ...emptyDownloadedData(), propositions: [makeRawDoc({ dok_id: 'SIDE-PROP' })] },
      '2025/26',
      undefined,
      tmpDir,
    );
    persistWorldBankData('CC.EST', 'SWE', [], tmpDir);
    persistIMFData('NGDP_RPCH', 'SWE', [], { dataRoot: tmpDir });
    persistSCBData('BE0101A', {}, undefined, tmpDir);
    persistRiksbankData('repo-rate-path', { provider: 'riksbank' }, tmpDir);
    persistStatskontoretData('myndighetsforteckning', 'downloads', {}, tmpDir);

    // Walk all .json files under tmpDir and verify each has a sibling
    // .meta.json (or is itself a .meta.json sidecar). This is the
    // invariant contract for downstream provenance tooling.
    const dataFiles: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.endsWith('.meta.json')) {
          dataFiles.push(full);
        }
      }
    };
    walk(tmpDir);

    expect(dataFiles.length).toBeGreaterThan(0);
    for (const dataFile of dataFiles) {
      const sidecar = dataFile.replace(/\.json$/, '.meta.json');
      expect(fs.existsSync(sidecar)).toBe(true);
    }
  });

  it('cross-write order does not corrupt later writes from a different provider', () => {
    // World Bank first
    persistWorldBankData('CC.EST', 'SWE', [{ date: '2024', value: 1.8 }], tmpDir);
    // Then IMF (different indicator namespace)
    persistIMFData(
      'NGDP_RPCH',
      'SWE',
      [{ period: '2026', value: 2.1 }],
      { dataRoot: tmpDir },
    );
    // World Bank data must not have been clobbered
    const wbPath = path.join(tmpDir, 'worldbank', 'cc-est', 'swe.json');
    expect(fs.existsSync(wbPath)).toBe(true);
    const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
    expect(wb[0].value).toBe(1.8);
  });
});
