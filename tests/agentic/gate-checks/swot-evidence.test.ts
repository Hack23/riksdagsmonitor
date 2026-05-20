/**
 * @module tests/agentic/gate-checks/swot-evidence
 * @description Check 4a — SWOT bullets must carry primary-source evidence
 *              (dok_id or recognised URL host).
 * @see scripts/agentic/gate-checks/swot-evidence.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkSwotEvidence } from '../../../scripts/agentic/gate-checks/swot-evidence.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkSwotEvidence', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when all SWOT bullets have evidence', async () => {
    writeArtifact(testDir, 'swot-analysis.md',
      '# SWOT\n\n'
      + '### Strengths\n- Strong position H901FiU1 data\n\n'
      + '### Weaknesses\n- Deficit HD01CU27 evidence\n\n'
      + '### Opportunities\n- Growth riksdagen.se/sv/\n\n'
      + '### Threats\n- Risk www.imf.org/en/\n\n'
    );
    const results = await checkSwotEvidence(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'swot-analysis.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when a SWOT bullet is missing evidence', async () => {
    writeArtifact(testDir, 'swot-analysis.md',
      '# SWOT\n\n### Strengths\n- Strong position with no citation\n'
    );
    const results = await checkSwotEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.checkId).toBe('evidence-citations');
  });

  it('returns empty when swot-analysis.md does not exist', async () => {
    const results = await checkSwotEvidence(testDir);
    expect(results).toHaveLength(0);
  });
});
