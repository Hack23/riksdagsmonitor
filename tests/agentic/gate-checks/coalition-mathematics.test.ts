/**
 * @module tests/agentic/gate-checks/coalition-mathematics
 * @description Check 8b — coalition-mathematics.md must contain a seat /
 *              vote-breakdown table.
 * @see scripts/agentic/gate-checks/coalition-mathematics.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkCoalitionMathematics } from '../../../scripts/agentic/gate-checks/coalition-mathematics.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkCoalitionMathematics', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with seat-count table', async () => {
    writeArtifact(testDir, 'coalition-mathematics.md',
      '| Party | Seats | Ja | Nej |\n|-------|-------|-----|-----|\n| S | 107 | X | |\n');
    const results = await checkCoalitionMathematics(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'coalition-mathematics.md');
    expect(failures).toHaveLength(0);
  });

  it('fails without vote-breakdown table', async () => {
    writeArtifact(testDir, 'coalition-mathematics.md', '# Coalition\n\nNo table here.\n');
    const results = await checkCoalitionMathematics(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'coalition-mathematics.md');
    expect(failures.length).toBeGreaterThan(0);
  });
});
