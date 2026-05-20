/**
 * @module tests/agentic/gate-checks/devils-advocate
 * @description Check 7d — devils-advocate.md must contain ≥ 3 Hypotheses
 *              and a 100% Key Judgment Coverage Matrix.
 * @see scripts/agentic/gate-checks/devils-advocate.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkDevilsAdvocate } from '../../../scripts/agentic/gate-checks/devils-advocate.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

const HYPOTHESES_WITH_MATRIX = (rows: string) => `
## Hypothesis 1: A

## Hypothesis 2: B

## Hypothesis 3: C

## Key Judgment Coverage Matrix (Required)

| KJ ID | KJ summary | Hypothesis | Challenged |
|-------|------------|------------|:----------:|
${rows}
`;

describe('checkDevilsAdvocate', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with 3+ hypotheses and 100% KJ coverage matrix', async () => {
    writeArtifact(testDir, 'devils-advocate.md',
      HYPOTHESES_WITH_MATRIX('| KJ-1 | A | H1 | ✅ |\n| KJ-2 | B | H2 | ✅ |\n| KJ-3 | C | H3 | ✅ |'));
    const results = await checkDevilsAdvocate(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'devils-advocate.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when KJ Coverage Matrix heading is missing', async () => {
    writeArtifact(testDir, 'devils-advocate.md',
      '## Hypothesis 1: A\n\n## Hypothesis 2: B\n\n## Hypothesis 3: C\n');
    const results = await checkDevilsAdvocate(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'devils-advocate.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => /Key Judgment Coverage Matrix/.test(f.message ?? ''))).toBe(true);
  });

  it('fails when any KJ coverage row contains ❌', async () => {
    writeArtifact(testDir, 'devils-advocate.md',
      HYPOTHESES_WITH_MATRIX('| KJ-1 | A | H1 | ✅ |\n| KJ-2 | B | — | ❌ |\n| KJ-3 | C | H3 | ✅ |'));
    const results = await checkDevilsAdvocate(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'devils-advocate.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => /coverage must be 100%/.test(f.message ?? ''))).toBe(true);
  });
});
