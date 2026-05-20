/**
 * @module tests/agentic/gate-checks/per-document-coverage
 * @description Check 2 — per-document coverage of every dok_id named in
 *              `data-download-manifest.md`, plus unit tests for the
 *              `extractDokIds` helper.
 * @see scripts/agentic/gate-checks/per-document-coverage.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  checkPerDocumentCoverage,
  extractDokIds,
} from '../../../scripts/agentic/gate-checks/per-document-coverage.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('extractDokIds', () => {
  it('extracts dok_ids from markdown content', () => {
    const content = 'Documents: H901FiU1, HD01CU27, and H901AU10.';
    const ids = extractDokIds(content);
    expect(ids).toContain('H901FiU1');
    expect(ids).toContain('HD01CU27');
    expect(ids).toContain('H901AU10');
  });

  it('deduplicates dok_ids', () => {
    const content = 'H901FiU1 appears twice: H901FiU1.';
    const ids = extractDokIds(content);
    expect(ids.filter((id) => id === 'H901FiU1')).toHaveLength(1);
  });

  it('returns empty array when no dok_ids found', () => {
    const content = 'No document references here.';
    expect(extractDokIds(content)).toHaveLength(0);
  });

  it('handles empty content', () => {
    expect(extractDokIds('')).toHaveLength(0);
  });
});

describe('checkPerDocumentCoverage', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when all dok_ids have analysis files', async () => {
    writeArtifact(testDir, 'data-download-manifest.md', 'Docs: H901FiU1, HD01CU27');
    const docsDir = join(testDir, 'documents');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'H901FiU1-analysis.md'), 'analysis', 'utf-8');
    writeFileSync(join(docsDir, 'HD01CU27-analysis.md'), 'analysis', 'utf-8');

    const results = await checkPerDocumentCoverage(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('reports missing document analysis', async () => {
    writeArtifact(testDir, 'data-download-manifest.md', 'Docs: H901FiU1, HD01CU27');
    const docsDir = join(testDir, 'documents');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'H901FiU1-analysis.md'), 'analysis', 'utf-8');
    // HD01CU27 intentionally missing

    const results = await checkPerDocumentCoverage(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('HD01CU27');
  });

  it('reports failure when manifest has no dok_ids', async () => {
    writeArtifact(testDir, 'data-download-manifest.md', 'No documents here.');

    const results = await checkPerDocumentCoverage(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('no dok_id entries');
  });

  it('returns empty when manifest does not exist', async () => {
    const results = await checkPerDocumentCoverage(testDir);
    expect(results).toHaveLength(0);
  });
});
