/**
 * @module tests/catalog-downloaded-data
 * @description Tests for the catalog-downloaded-data script.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildCatalog } from '../scripts/catalog-downloaded-data.js';

let tmpRoot: string;

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

describe('catalog-downloaded-data', () => {
  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'test-catalog-data-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('returns empty catalog for empty data root', () => {
    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(0);
    expect(catalog.entries).toHaveLength(0);
    expect(catalog.pendingAnalysis).toBe(0);
    expect(catalog.completedAnalysis).toBe(0);
    expect(catalog.generatedAt).toBeTruthy();
  });

  it('catalogs proposition files', () => {
    writeJSON(path.join(tmpRoot, 'documents/propositions/H901.json'), {
      dok_id: 'H901',
      titel: 'Test proposition',
    });
    writeJSON(path.join(tmpRoot, 'documents/propositions/H901.meta.json'), {
      fetchedAt: '2026-03-28T10:00:00Z',
      documentType: 'propositions',
    });

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('H901');
    expect(catalog.entries[0].type).toBe('propositions');
    expect(catalog.entries[0].hasAnalysis).toBe(false);
    expect(catalog.entries[0].meta).toMatchObject({
      fetchedAt: '2026-03-28T10:00:00Z',
    });
  });

  it('detects existing analysis files', () => {
    writeJSON(path.join(tmpRoot, 'documents/motions/M100.json'), {
      dok_id: 'M100',
    });
    fs.writeFileSync(
      path.join(tmpRoot, 'documents/motions/M100.analysis.md'),
      '# Analysis for M100\n',
      'utf-8',
    );

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].hasAnalysis).toBe(true);
    expect(catalog.completedAnalysis).toBe(1);
    expect(catalog.pendingAnalysis).toBe(0);
  });

  it('filters by type', () => {
    writeJSON(path.join(tmpRoot, 'documents/propositions/P1.json'), {});
    writeJSON(path.join(tmpRoot, 'documents/motions/M1.json'), {});
    writeJSON(path.join(tmpRoot, 'mps/MP1.json'), {});

    const catalog = buildCatalog(tmpRoot, 'motions');
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].type).toBe('motions');
  });

  it('filters pending-only', () => {
    writeJSON(path.join(tmpRoot, 'documents/propositions/P1.json'), {});
    writeJSON(path.join(tmpRoot, 'documents/propositions/P2.json'), {});
    fs.writeFileSync(
      path.join(tmpRoot, 'documents/propositions/P1.analysis.md'),
      '# Done\n',
      'utf-8',
    );

    const catalog = buildCatalog(tmpRoot, undefined, true);
    // totalFiles reflects the full scan (before pendingOnly filter)
    expect(catalog.totalFiles).toBe(2);
    expect(catalog.completedAnalysis).toBe(1);
    expect(catalog.pendingAnalysis).toBe(1);
    // entries only contains pending files
    expect(catalog.entries).toHaveLength(1);
    expect(catalog.entries[0].id).toBe('P2');
  });

  it('excludes .meta.json files from entries', () => {
    writeJSON(path.join(tmpRoot, 'mps/MP1.json'), { name: 'Test' });
    writeJSON(path.join(tmpRoot, 'mps/MP1.meta.json'), {
      fetchedAt: '2026-03-28T10:00:00Z',
    });

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('MP1');
  });

  it('handles nested date directories (votes/YYYY-MM-DD/)', () => {
    writeJSON(
      path.join(tmpRoot, 'votes/2026-03-28/vote-001.json'),
      { id: 'vote-001' },
    );

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('2026-03-28/vote-001');
    expect(catalog.entries[0].type).toBe('votes');
  });

  it('catalogs documents/votes/ for votes without valid datum', () => {
    writeJSON(
      path.join(tmpRoot, 'documents/votes/vote-nodatum.json'),
      { id: 'vote-nodatum', typ: 'votering' },
    );

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('vote-nodatum');
    expect(catalog.entries[0].type).toBe('votes');
  });

  it('deduplicates votes appearing in both documents/votes and votes/YYYY-MM-DD', () => {
    writeJSON(
      path.join(tmpRoot, 'documents/votes/vote-dup.json'),
      { id: 'vote-dup' },
    );
    writeJSON(
      path.join(tmpRoot, 'votes/2026-03-28/vote-dup.json'),
      { id: 'vote-dup', datum: '2026-03-28' },
    );

    const catalog = buildCatalog(tmpRoot);
    // Should only appear once, preferring the date-stamped path
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('2026-03-28/vote-dup');
    expect(catalog.entries[0].path).toContain('votes/2026-03-28/');
  });

  it('handles malformed meta.json gracefully', () => {
    writeJSON(path.join(tmpRoot, 'scb/table1.json'), { data: [] });
    fs.writeFileSync(
      path.join(tmpRoot, 'scb/table1.meta.json'),
      'NOT VALID JSON',
      'utf-8',
    );

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].meta).toBeNull();
  });

  it('records file size', () => {
    const content = JSON.stringify({ data: 'x'.repeat(500) });
    ensureDir(path.join(tmpRoot, 'worldbank'));
    fs.writeFileSync(
      path.join(tmpRoot, 'worldbank/GDP.json'),
      content,
      'utf-8',
    );

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.entries[0].sizeBytes).toBeGreaterThan(0);
  });

  it('catalogs multiple types at once', () => {
    writeJSON(path.join(tmpRoot, 'documents/propositions/P1.json'), {});
    writeJSON(path.join(tmpRoot, 'documents/committeeReports/CR1.json'), {});
    writeJSON(path.join(tmpRoot, 'mps/MP1.json'), {});
    writeJSON(path.join(tmpRoot, 'worldbank/GDP.json'), {});
    writeJSON(path.join(tmpRoot, 'scb/pop.json'), {});

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(5);

    const types = catalog.entries.map((e) => e.type);
    expect(types).toContain('propositions');
    expect(types).toContain('committeeReports');
    expect(types).toContain('mps');
    expect(types).toContain('worldbank');
    expect(types).toContain('scb');
  });

  it('generates analysis paths alongside data files', () => {
    writeJSON(path.join(tmpRoot, 'documents/speeches/S1.json'), {});

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.entries[0].analysisPath).toMatch(
      /documents\/speeches\/S1\.analysis\.md$/,
    );
  });

  it('handles nested type subdirectories with duplicate basenames', () => {
    writeJSON(path.join(tmpRoot, 'worldbank/ind1/SE.json'), { value: 1 });
    writeJSON(path.join(tmpRoot, 'worldbank/ind2/SE.json'), { value: 2 });

    const catalog = buildCatalog(tmpRoot);
    expect(catalog.totalFiles).toBe(2);
    expect(catalog.entries).toHaveLength(2);
    // Both entries should be worldbank type
    expect(catalog.entries.every((e) => e.type === 'worldbank')).toBe(true);
    // Both have path-derived ids (ind1/SE, ind2/SE) with same basename but distinct paths
    const paths = catalog.entries.map((e) => e.path);
    expect(paths.some((p) => p.includes('ind1/SE.json'))).toBe(true);
    expect(paths.some((p) => p.includes('ind2/SE.json'))).toBe(true);
  });
});
