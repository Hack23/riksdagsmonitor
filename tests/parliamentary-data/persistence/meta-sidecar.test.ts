/**
 * @file tests/parliamentary-data/persistence/meta-sidecar.test.ts
 * @description Unit test for the sidecar `.meta.json` invariant —
 * `writeDocumentAndMeta` MUST:
 *   1. Strip in-memory MCP coverage annotations (`mcpCoverageState`,
 *      `mcpProvenance`, `mcpSignals`) from the persisted raw `.json` file.
 *   2. Write provenance to a separate `.meta.json` sidecar.
 *   3. Produce byte-identical `.json` output across repeated calls with the
 *      same input — this is the parallel-workflow merge-conflict guarantee.
 *
 * This invariant is documented in
 * `scripts/parliamentary-data/persistence/shared/meta-sidecar.ts` and is the
 * cornerstone of the refactor's sidecar discipline.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  writeDocumentAndMeta,
  type PersistenceMetadata,
} from '../../../scripts/parliamentary-data/persistence/shared/meta-sidecar.js';
import type { RawDocument } from '../../../scripts/data-transformers/types.js';

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rm-meta-sidecar-'));
}

const SAMPLE_DOC = {
  dok_id: 'H901FiU1',
  titel: 'Sample document',
  datum: '2025-01-15',
  // In-memory annotations that MUST be stripped from the persisted file
  mcpCoverageState: 'full_text',
  mcpProvenance: { tool: 'get_dokument', resultCount: 1 },
  mcpSignals: [{ code: 'OK', message: 'fine' }],
} as unknown as RawDocument;

const METADATA: PersistenceMetadata = {
  fetchedAt: '2025-01-15T10:00:00.000Z',
  mcpTool: 'get_dokument',
  riksmote: '2024/25',
  documentType: 'propositions',
};

describe('persistence sidecar discipline — writeDocumentAndMeta', () => {
  it('strips in-memory MCP annotations from the raw `.json` file', () => {
    const dir = mktmp();
    writeDocumentAndMeta(dir, 'H901FiU1.json', SAMPLE_DOC, METADATA);

    const persisted = JSON.parse(
      fs.readFileSync(path.join(dir, 'H901FiU1.json'), 'utf8'),
    ) as Record<string, unknown>;

    expect(persisted).not.toHaveProperty('mcpCoverageState');
    expect(persisted).not.toHaveProperty('mcpProvenance');
    expect(persisted).not.toHaveProperty('mcpSignals');
    expect(persisted['dok_id']).toBe('H901FiU1');
    expect(persisted['titel']).toBe('Sample document');
    expect(persisted['datum']).toBe('2025-01-15');
  });

  it('writes provenance to a separate `.meta.json` sidecar', () => {
    const dir = mktmp();
    writeDocumentAndMeta(dir, 'H901FiU1.json', SAMPLE_DOC, METADATA);

    const metaPath = path.join(dir, 'H901FiU1.meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as PersistenceMetadata;
    expect(meta.fetchedAt).toBe('2025-01-15T10:00:00.000Z');
    expect(meta.mcpTool).toBe('get_dokument');
    expect(meta.riksmote).toBe('2024/25');
    expect(meta.documentType).toBe('propositions');
  });

  it('produces byte-identical `.json` output across repeated calls (parallel-workflow safety)', () => {
    const dirA = mktmp();
    const dirB = mktmp();

    writeDocumentAndMeta(dirA, 'H901FiU1.json', SAMPLE_DOC, METADATA);

    // Simulate a parallel workflow with different in-memory annotations.
    // The persisted `.json` must STILL be byte-identical because those
    // annotations are stripped before serialization.
    const parallelDoc = {
      ...SAMPLE_DOC,
      mcpCoverageState: 'metadata_only',
      mcpProvenance: { tool: 'different_tool', resultCount: 0 },
      mcpSignals: [{ code: 'MCP_INDEXING_LAG', message: 'lag' }],
    } as unknown as RawDocument;

    writeDocumentAndMeta(dirB, 'H901FiU1.json', parallelDoc, METADATA);

    const a = fs.readFileSync(path.join(dirA, 'H901FiU1.json'));
    const b = fs.readFileSync(path.join(dirB, 'H901FiU1.json'));
    expect(a.equals(b)).toBe(true);
  });

  it('does not mutate the input document (defensive copy)', () => {
    const dir = mktmp();
    const doc = { ...SAMPLE_DOC } as unknown as RawDocument;
    writeDocumentAndMeta(dir, 'H901FiU1.json', doc, METADATA);

    // The original in-memory doc still carries its annotations — only the
    // serialized output is stripped.
    expect((doc as Record<string, unknown>)['mcpCoverageState']).toBe('full_text');
    expect((doc as Record<string, unknown>)['mcpProvenance']).toBeDefined();
    expect((doc as Record<string, unknown>)['mcpSignals']).toBeDefined();
  });

  it('creates the output directory if it does not exist', () => {
    const dir = path.join(mktmp(), 'nested', 'deeper');
    expect(fs.existsSync(dir)).toBe(false);

    writeDocumentAndMeta(dir, 'H901FiU1.json', SAMPLE_DOC, METADATA);

    expect(fs.existsSync(path.join(dir, 'H901FiU1.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'H901FiU1.meta.json'))).toBe(true);
  });
});
