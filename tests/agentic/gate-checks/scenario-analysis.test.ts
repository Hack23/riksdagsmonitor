/**
 * @module tests/agentic/gate-checks/scenario-analysis
 * @description Check 7c — scenario-analysis.md must contain ≥ 3 scenarios.
 * @see scripts/agentic/gate-checks/scenario-analysis.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkScenarioAnalysis } from '../../../scripts/agentic/gate-checks/scenario-analysis.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkScenarioAnalysis', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with 3+ scenarios', async () => {
    writeArtifact(testDir, 'scenario-analysis.md',
      '## Scenario 1\n\n## Scenario 2\n\n## Scenario 3\n');
    const results = await checkScenarioAnalysis(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'scenario-analysis.md');
    expect(failures).toHaveLength(0);
  });

  it('fails with fewer than 3 scenarios', async () => {
    writeArtifact(testDir, 'scenario-analysis.md',
      '## Scenario 1\n\n## Scenario 2\n');
    const results = await checkScenarioAnalysis(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'scenario-analysis.md');
    expect(failures.length).toBeGreaterThan(0);
  });
});
