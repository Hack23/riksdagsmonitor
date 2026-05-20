/**
 * @module tests/agentic/gate-checks/family-d-structure
 * @description Check 8 aggregator — fans out to forward-indicators and
 *              coalition-mathematics.
 *
 * Sub-check behaviour is tested in the dedicated per-module test files.
 *
 * @see scripts/agentic/gate-checks/family-d-structure.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkFamilyDStructure } from '../../../scripts/agentic/gate-checks/family-d-structure.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkFamilyDStructure (aggregator)', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('returns no failures when both Family D artifacts are well-formed', async () => {
    const dates = Array.from({ length: 12 }, (_, i) =>
      `- 2026-06-${String(i + 1).padStart(2, '0')}: Event ${i + 1}`
    ).join('\n');
    writeArtifact(testDir, 'forward-indicators.md', `# Indicators\n\n${dates}\n`);
    writeArtifact(testDir, 'coalition-mathematics.md',
      '| Party | Seats | Ja | Nej |\n|-------|-------|-----|-----|\n| S | 107 | X | |\n');
    const results = await checkFamilyDStructure(testDir);
    expect(results.filter((r) => !r.passed)).toHaveLength(0);
  });

  it('aggregates failures from both sub-checks', async () => {
    writeArtifact(testDir, 'forward-indicators.md', '# Indicators\n\n- 2026-06-01: Only one.\n');
    writeArtifact(testDir, 'coalition-mathematics.md', '# Coalition\n\nNo table here.\n');
    const results = await checkFamilyDStructure(testDir);
    const failureArtifacts = new Set(
      results.filter((r) => !r.passed).map((r) => r.artifact),
    );
    expect(failureArtifacts.has('forward-indicators.md')).toBe(true);
    expect(failureArtifacts.has('coalition-mathematics.md')).toBe(true);
  });
});
