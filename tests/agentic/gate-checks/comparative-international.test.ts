/**
 * @module tests/agentic/gate-checks/comparative-international
 * @description Check 7f — comparative-international.md must declare a
 *              comparator set or contain ≥ 2 comparator-table rows.
 * @see scripts/agentic/gate-checks/comparative-international.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkComparativeInternational } from '../../../scripts/agentic/gate-checks/comparative-international.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkComparativeInternational', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with comparator set declared', async () => {
    writeArtifact(testDir, 'comparative-international.md',
      '**Comparator set**: Denmark, Norway, Finland\n');
    const results = await checkComparativeInternational(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'comparative-international.md');
    expect(failures).toHaveLength(0);
  });

  it('passes with 2+ comparator table rows', async () => {
    writeArtifact(testDir, 'comparative-international.md',
      '| Country | Policy |\n|---------|--------|\n| Denmark | A |\n| Norway | B |\n');
    const results = await checkComparativeInternational(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'comparative-international.md');
    expect(failures).toHaveLength(0);
  });
});
