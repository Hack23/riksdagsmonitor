/**
 * @module tests/agentic/gate-checks/family-c-structure
 * @description Check 7 aggregator — fans out to executive-brief,
 *              intelligence-assessment, scenario-analysis, devils-advocate,
 *              methodology-reflection and comparative-international.
 *
 * Sub-check behaviour is tested in the dedicated per-module test files
 * (executive-brief.test.ts, intelligence-assessment.test.ts, …). This
 * file owns only the aggregator wiring contract.
 *
 * @see scripts/agentic/gate-checks/family-c-structure.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkFamilyCStructure } from '../../../scripts/agentic/gate-checks/family-c-structure.js';
import {
  REQUIRED_REFLECTION_SECTIONS,
  createTestDir,
  writeArtifact,
} from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkFamilyCStructure (aggregator)', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('returns no failures when every Family C artifact is well-formed', async () => {
    writeArtifact(
      testDir,
      'executive-brief.md',
      '# Riksdag narrowly approves FiU48 fuel-tax cut\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions This Brief Supports\n\n1. A\n',
    );
    writeArtifact(
      testDir,
      'intelligence-assessment.md',
      '## Key Judgment KJ-1\nHIGH confidence.\n## Key Judgment KJ-2\nMEDIUM.\n## Key Judgment KJ-3\nLOW.\n\nReferences PIR-FISCAL-001.\n',
    );
    writeArtifact(
      testDir,
      'scenario-analysis.md',
      '## Scenario 1\n\n## Scenario 2\n\n## Scenario 3\n',
    );
    writeArtifact(
      testDir,
      'devils-advocate.md',
      [
        '## Hypothesis 1: A',
        '## Hypothesis 2: B',
        '## Hypothesis 3: C',
        '',
        '## Key Judgment Coverage Matrix (Required)',
        '',
        '| KJ ID | KJ summary | Hypothesis | Challenged |',
        '|-------|------------|------------|:----------:|',
        '| KJ-1 | A | H1 | ✅ |',
        '| KJ-2 | B | H2 | ✅ |',
        '| KJ-3 | C | H3 | ✅ |',
      ].join('\n'),
    );
    writeArtifact(testDir, 'methodology-reflection.md', REQUIRED_REFLECTION_SECTIONS);
    writeArtifact(
      testDir,
      'comparative-international.md',
      '**Comparator set**: Denmark, Norway, Finland\n\n| Country | Policy |\n|---------|--------|\n| Denmark | A |\n| Norway | B |\n',
    );

    const results = await checkFamilyCStructure(testDir);
    expect(results.filter((r) => !r.passed)).toHaveLength(0);
  });

  it('aggregates failures from multiple sub-checks when artifacts are malformed', async () => {
    // Each sub-check returns [] when its artifact is missing, so make
    // several artifacts exist-but-invalid and confirm the aggregator
    // surfaces failures from at least two distinct sub-checks.
    writeArtifact(testDir, 'executive-brief.md', '## 🎯 BLUF\n\nNo H1.\n');
    writeArtifact(testDir, 'scenario-analysis.md', '## Scenario 1\n\n## Scenario 2\n');
    writeArtifact(testDir, 'comparative-international.md', '# Comparative\n\nNo comparator set.\n');
    const results = await checkFamilyCStructure(testDir);
    const failureArtifacts = new Set(
      results.filter((r) => !r.passed).map((r) => r.artifact),
    );
    expect(failureArtifacts.has('executive-brief.md')).toBe(true);
    expect(failureArtifacts.has('scenario-analysis.md')).toBe(true);
    expect(failureArtifacts.has('comparative-international.md')).toBe(true);
  });
});
