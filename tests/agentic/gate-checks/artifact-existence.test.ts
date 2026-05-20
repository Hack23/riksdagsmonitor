/**
 * @module tests/agentic/gate-checks/artifact-existence
 * @description Check 1 — artifact existence and non-empty content.
 * @see scripts/agentic/gate-checks/artifact-existence.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';

import { REQUIRED_ARTIFACT_FILENAMES } from '../../../scripts/agentic/artifact-inventory.js';
import { checkArtifactExistence } from '../../../scripts/agentic/gate-checks/artifact-existence.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkArtifactExistence', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('reports all artifacts missing when directory is empty', () => {
    const results = checkArtifactExistence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(23);
  });

  it('reports success when all artifacts present', () => {
    for (const filename of REQUIRED_ARTIFACT_FILENAMES) {
      writeArtifact(testDir, filename, 'content');
    }
    const results = checkArtifactExistence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('reports specific missing artifact', () => {
    for (const filename of REQUIRED_ARTIFACT_FILENAMES) {
      if (filename !== 'swot-analysis.md') {
        writeArtifact(testDir, filename, 'content');
      }
    }
    const results = checkArtifactExistence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.artifact).toBe('swot-analysis.md');
  });

  it('reports failure for zero-byte (empty) artifact', () => {
    for (const filename of REQUIRED_ARTIFACT_FILENAMES) {
      writeArtifact(testDir, filename, filename === 'README.md' ? '' : 'content');
    }
    const results = checkArtifactExistence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('Empty artifact');
    expect(failures[0]?.artifact).toBe('README.md');
  });
});
