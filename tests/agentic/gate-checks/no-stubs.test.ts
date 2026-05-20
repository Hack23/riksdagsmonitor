/**
 * @module tests/agentic/gate-checks/no-stubs
 * @description Check 3 — stub placeholder detection across all required
 *              artifacts and the `documents/` (Family E) directory.
 * @see scripts/agentic/gate-checks/no-stubs.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { checkNoStubs } from '../../../scripts/agentic/gate-checks/no-stubs.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkNoStubs', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when no stubs present', async () => {
    writeArtifact(testDir, 'README.md', '# README\n\nClean content.');
    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('detects AI_MUST_REPLACE placeholder', async () => {
    writeArtifact(testDir, 'README.md', '# README\n\nAI_MUST_REPLACE this.');
    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('AI_MUST_REPLACE');
  });

  it('detects TODO: placeholder', async () => {
    writeArtifact(testDir, 'swot-analysis.md', '# SWOT\n\nTODO: add evidence');
    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('TODO:');
  });

  it('detects multiple stub types in same file', async () => {
    writeArtifact(testDir, 'README.md', 'AI_MUST_REPLACE and [REQUIRED] and TODO: fix');
    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(3);
  });

  it('detects stubs in documents/ directory (Family E)', async () => {
    // No stubs in required artifacts
    writeArtifact(testDir, 'README.md', '# README\n\nClean content.');
    // But stub in documents/ per-document analysis
    const docsDir = join(testDir, 'documents');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'H901FiU1-analysis.md'), '# Analysis\n\nAI_MUST_REPLACE\n', 'utf-8');

    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.artifact).toContain('documents/');
  });
});
