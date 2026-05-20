/**
 * @module tests/agentic/gate-checks/forward-indicators
 * @description Check 8a — forward-indicators.md must contain ≥ 10 dated
 *              indicators (ISO date or quarterly format).
 * @see scripts/agentic/gate-checks/forward-indicators.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkForwardIndicators } from '../../../scripts/agentic/gate-checks/forward-indicators.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkForwardIndicators', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with 10+ dated indicators', async () => {
    const dates = Array.from({ length: 12 }, (_, i) =>
      `- 2026-06-${String(i + 1).padStart(2, '0')}: Event ${i + 1}`
    ).join('\n');
    writeArtifact(testDir, 'forward-indicators.md', `# Indicators\n\n${dates}\n`);
    const results = await checkForwardIndicators(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'forward-indicators.md');
    expect(failures).toHaveLength(0);
  });

  it('fails with fewer than 10 dated indicators', async () => {
    writeArtifact(testDir, 'forward-indicators.md', '# Indicators\n\n- 2026-06-01: Only one.\n');
    const results = await checkForwardIndicators(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'forward-indicators.md');
    expect(failures.length).toBeGreaterThan(0);
  });

  it('recognises quarterly date format', async () => {
    const quarters = Array.from({ length: 12 }, (_, i) =>
      `- 2026Q${(i % 4) + 1}: Event ${i + 1}`
    ).join('\n');
    writeArtifact(testDir, 'forward-indicators.md', `# Indicators\n\n${quarters}\n`);
    const results = await checkForwardIndicators(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'forward-indicators.md');
    expect(failures).toHaveLength(0);
  });
});
