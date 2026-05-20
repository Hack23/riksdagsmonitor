/**
 * @module tests/agentic/gate-checks/evidence-citations
 * @description Check 4 aggregator — fans out to SWOT (Check 4a) and
 *              significance-scoring (Check 4b) evidence checks.
 * @see scripts/agentic/gate-checks/evidence-citations.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkEvidenceCitations } from '../../../scripts/agentic/gate-checks/evidence-citations.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkEvidenceCitations (aggregator)', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('returns empty when files do not exist', async () => {
    const results = await checkEvidenceCitations(testDir);
    expect(results).toHaveLength(0);
  });

  it('aggregates failures from both SWOT and significance-scoring sub-checks', async () => {
    // Both files have at least one bullet missing evidence — both sub-checks
    // should contribute at least one failure each.
    writeArtifact(
      testDir,
      'swot-analysis.md',
      '# SWOT\n\n### Strengths\n- Strong position with no citation\n',
    );
    writeArtifact(
      testDir,
      'significance-scoring.md',
      '# Significance\n\n1. Generic ranked item with no citation\n',
    );
    const results = await checkEvidenceCitations(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.some((f) => f.artifact === 'swot-analysis.md')).toBe(true);
    expect(failures.some((f) => f.artifact === 'significance-scoring.md')).toBe(true);
  });
});
