/**
 * @module tests/agentic/gate-checks/intelligence-assessment
 * @description Check 7b — intelligence-assessment.md must contain ≥ 3 Key
 *              Judgments with confidence labels.
 * @see scripts/agentic/gate-checks/intelligence-assessment.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkIntelligenceAssessment } from '../../../scripts/agentic/gate-checks/intelligence-assessment.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkIntelligenceAssessment', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with 3+ Key Judgments, confidence labels, and PIR', async () => {
    writeArtifact(testDir, 'intelligence-assessment.md',
      '## Key Judgment KJ-1\nHIGH confidence.\n## Key Judgment KJ-2\nMEDIUM.\n## Key Judgment KJ-3\nLOW.\n\nReferences PIR-FISCAL-001.\n');
    const results = await checkIntelligenceAssessment(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'intelligence-assessment.md');
    expect(failures).toHaveLength(0);
  });

  it('fails with fewer than 3 Key Judgments', async () => {
    writeArtifact(testDir, 'intelligence-assessment.md',
      '## Assessment\nOnly one KJ-1 here.\nHIGH confidence. MEDIUM. LOW.\nPIR-001\n');
    const results = await checkIntelligenceAssessment(testDir);
    const failures = results.filter((r) => !r.passed && r.message?.includes('Key Judgment'));
    expect(failures.length).toBeGreaterThan(0);
  });
});
