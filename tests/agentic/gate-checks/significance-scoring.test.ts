/**
 * @module tests/agentic/gate-checks/significance-scoring
 * @description Check 4b — significance-scoring ranked bullets must carry
 *              primary-source evidence.
 * @see scripts/agentic/gate-checks/significance-scoring.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkSignificanceScoringEvidence } from '../../../scripts/agentic/gate-checks/significance-scoring.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkSignificanceScoringEvidence', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when all significance-scoring bullets have evidence', async () => {
    writeArtifact(testDir, 'significance-scoring.md',
      '# Significance\n\n1. Reform H901FiU1\n2. Tax HD01CU27\n'
    );
    const results = await checkSignificanceScoringEvidence(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'significance-scoring.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when significance-scoring bullet is missing evidence', async () => {
    writeArtifact(testDir, 'significance-scoring.md',
      '# Significance\n\n1. Generic ranked item with no citation\n'
    );
    const results = await checkSignificanceScoringEvidence(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'significance-scoring.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.checkId).toBe('evidence-citations');
  });

  it('returns empty when significance-scoring.md does not exist', async () => {
    const results = await checkSignificanceScoringEvidence(testDir);
    expect(results).toHaveLength(0);
  });
});
