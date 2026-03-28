/**
 * @module tests/catalog-downloaded-data
 * @description Tests for the catalog-downloaded-data script.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildCatalog } from '../scripts/catalog-downloaded-data.js';

const TMP_ROOT = path.resolve('/tmp/test-catalog-data');

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

describe('catalog-downloaded-data', () => {
  beforeEach(() => {
    fs.rmSync(TMP_ROOT, { recursive: true, force: true });
    ensureDir(TMP_ROOT);
  });

  afterEach(() => {
    fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  });

  it('returns empty catalog for empty data root', () => {
    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.totalFiles).toBe(0);
    expect(catalog.entries).toHaveLength(0);
    expect(catalog.pendingAnalysis).toBe(0);
    expect(catalog.completedAnalysis).toBe(0);
    expect(catalog.generatedAt).toBeTruthy();
  });

  it('catalogs proposition files', () => {
    writeJSON(path.join(TMP_ROOT, 'documents/propositions/H901.json'), {
      dok_id: 'H901',
      titel: 'Test proposition',
    });
    writeJSON(path.join(TMP_ROOT, 'documents/propositions/H901.meta.json'), {
      fetchedAt: '2026-03-28T10:00:00Z',
      documentType: 'propositions',
    });

    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('H901');
    expect(catalog.entries[0].type).toBe('propositions');
    expect(catalog.entries[0].hasAnalysis).toBe(false);
    expect(catalog.entries[0].meta).toMatchObject({
      fetchedAt: '2026-03-28T10:00:00Z',
    });
  });

  it('detects existing analysis files', () => {
    writeJSON(path.join(TMP_ROOT, 'documents/motions/M100.json'), {
      dok_id: 'M100',
    });
    fs.writeFileSync(
      path.join(TMP_ROOT, 'documents/motions/M100.analysis.md'),
      '# Analysis for M100\n',
      'utf-8',
    );

    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].hasAnalysis).toBe(true);
    expect(catalog.completedAnalysis).toBe(1);
    expect(catalog.pendingAnalysis).toBe(0);
  });

  it('filters by type', () => {
    writeJSON(path.join(TMP_ROOT, 'documents/propositions/P1.json'), {});
    writeJSON(path.join(TMP_ROOT, 'documents/motions/M1.json'), {});
    writeJSON(path.join(TMP_ROOT, 'mps/MP1.json'), {});

    const catalog = buildCatalog(TMP_ROOT, 'motions');
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].type).toBe('motions');
  });

  it('filters pending-only', () => {
    writeJSON(path.join(TMP_ROOT, 'documents/propositions/P1.json'), {});
    writeJSON(path.join(TMP_ROOT, 'documents/propositions/P2.json'), {});
    fs.writeFileSync(
      path.join(TMP_ROOT, 'documents/propositions/P1.analysis.md'),
      '# Done\n',
      'utf-8',
    );

    const catalog = buildCatalog(TMP_ROOT, undefined, true);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('P2');
  });

  it('excludes .meta.json files from entries', () => {
    writeJSON(path.join(TMP_ROOT, 'mps/MP1.json'), { name: 'Test' });
    writeJSON(path.join(TMP_ROOT, 'mps/MP1.meta.json'), {
      fetchedAt: '2026-03-28T10:00:00Z',
    });

    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('MP1');
  });

  it('handles nested date directories (votes/YYYY-MM-DD/)', () => {
    writeJSON(
      path.join(TMP_ROOT, 'votes/2026-03-28/vote-001.json'),
      { id: 'vote-001' },
    );

    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].id).toBe('vote-001');
    expect(catalog.entries[0].type).toBe('votes');
  });

  it('handles malformed meta.json gracefully', () => {
    writeJSON(path.join(TMP_ROOT, 'scb/table1.json'), { data: [] });
    fs.writeFileSync(
      path.join(TMP_ROOT, 'scb/table1.meta.json'),
      'NOT VALID JSON',
      'utf-8',
    );

    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.totalFiles).toBe(1);
    expect(catalog.entries[0].meta).toBeNull();
  });

  it('records file size', () => {
    const content = JSON.stringify({ data: 'x'.repeat(500) });
    ensureDir(path.join(TMP_ROOT, 'worldbank'));
    fs.writeFileSync(
      path.join(TMP_ROOT, 'worldbank/GDP.json'),
      content,
      'utf-8',
    );

    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.entries[0].sizeBytes).toBeGreaterThan(0);
  });

  it('catalogs multiple types at once', () => {
    writeJSON(path.join(TMP_ROOT, 'documents/propositions/P1.json'), {});
    writeJSON(path.join(TMP_ROOT, 'documents/committeeReports/CR1.json'), {});
    writeJSON(path.join(TMP_ROOT, 'mps/MP1.json'), {});
    writeJSON(path.join(TMP_ROOT, 'worldbank/GDP.json'), {});
    writeJSON(path.join(TMP_ROOT, 'scb/pop.json'), {});

    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.totalFiles).toBe(5);

    const types = catalog.entries.map((e) => e.type);
    expect(types).toContain('propositions');
    expect(types).toContain('committeeReports');
    expect(types).toContain('mps');
    expect(types).toContain('worldbank');
    expect(types).toContain('scb');
  });

  it('generates analysis paths alongside data files', () => {
    writeJSON(path.join(TMP_ROOT, 'documents/speeches/S1.json'), {});

    const catalog = buildCatalog(TMP_ROOT);
    expect(catalog.entries[0].analysisPath).toMatch(
      /documents\/speeches\/S1\.analysis\.md$/,
    );
  });
});
