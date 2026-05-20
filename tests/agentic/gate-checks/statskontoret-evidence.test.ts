/**
 * @module tests/agentic/gate-checks/statskontoret-evidence
 * @description Check 9b — When `implementation-feasibility.md` names a
 *              recognised agency, the file must contain a
 *              `| Statskontoret relevance | …|` row pointing at a
 *              `statskontoret.se` URL or carrying the literal `none found`.
 * @see scripts/agentic/gate-checks/statskontoret-evidence.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkStatskontoretEvidence } from '../../../scripts/agentic/gate-checks/statskontoret-evidence.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkStatskontoretEvidence', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when no recognised agency mentioned', async () => {
    writeArtifact(testDir, 'implementation-feasibility.md',
      '# Implementation\n\nGeneric content.\n');
    const results = await checkStatskontoretEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('passes when agency mentioned with statskontoret.se URL', async () => {
    writeArtifact(testDir, 'implementation-feasibility.md',
      '# Implementation\n\nSkatteverket is relevant.\n\n| **Statskontoret relevance** | https://www.statskontoret.se/report |\n');
    const results = await checkStatskontoretEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('passes when agency mentioned with "none found"', async () => {
    writeArtifact(testDir, 'implementation-feasibility.md',
      '# Implementation\n\nPolismyndigheten is relevant.\n\n| **Statskontoret relevance** | none found |\n');
    const results = await checkStatskontoretEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('fails when agency mentioned without Statskontoret row', async () => {
    writeArtifact(testDir, 'implementation-feasibility.md',
      '# Implementation\n\nSkatteverket is relevant.\n\nNo Statskontoret row.\n');
    const results = await checkStatskontoretEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
  });
});
