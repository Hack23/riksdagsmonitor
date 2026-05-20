/**
 * @module tests/agentic/gate-checks/pass2-evidence
 * @description Check 6 — Pass-2 evidence: each PASS2_REQUIRED_ARTIFACTS
 *              file must have a differing `pass1/` snapshot or carry a
 *              fresh mtime (PASS2_MTIME_THRESHOLD_MS = 180_000).
 *
 * The mtime branch is timing-sensitive and lives in its own file (rather
 * than the monolithic suite) so a flake can be quarantined or marked
 * `test.concurrent` without affecting the other 21 check suites.
 *
 * @see scripts/agentic/gate-checks/pass2-evidence.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  checkPass2Evidence,
  PASS2_MTIME_THRESHOLD_MS,
} from '../../../scripts/agentic/gate-checks/pass2-evidence.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkPass2Evidence', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('exports the canonical 180_000 ms mtime threshold', () => {
    // Memory invariant: PASS2_MTIME_THRESHOLD_MS must remain 180_000 — any
    // change here breaks the bash/TS gate parity.
    expect(PASS2_MTIME_THRESHOLD_MS).toBe(180_000);
  });

  it('passes when pass1/ snapshot differs from current file', async () => {
    writeArtifact(testDir, 'README.md', '# Pass-2 improved content\n\nMore analysis here.\n');
    const pass1Dir = join(testDir, 'pass1');
    mkdirSync(pass1Dir, { recursive: true });
    writeFileSync(join(pass1Dir, 'README.md'), '# Original pass1 draft\n\n', 'utf-8');

    const results = await checkPass2Evidence(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'README.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when pass1/ snapshot is identical to current file (no improvements)', async () => {
    const content = '# Same content in both passes\n\nNothing changed.\n';
    writeArtifact(testDir, 'README.md', content);
    const pass1Dir = join(testDir, 'pass1');
    mkdirSync(pass1Dir, { recursive: true });
    writeFileSync(join(pass1Dir, 'README.md'), content, 'utf-8');

    const results = await checkPass2Evidence(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'README.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.message).toContain('Pass-2 evidence missing');
  });

  it('skips artifacts that do not exist', async () => {
    // No files written — all PASS2 artifacts missing
    const results = await checkPass2Evidence(testDir);
    // Should return empty (non-existent files are skipped)
    expect(results).toHaveLength(0);
  });

  it('returns pass2-evidence checkId on failure', async () => {
    const content = '# Same content\n';
    writeArtifact(testDir, 'README.md', content);
    const pass1Dir = join(testDir, 'pass1');
    mkdirSync(pass1Dir, { recursive: true });
    writeFileSync(join(pass1Dir, 'README.md'), content, 'utf-8');

    const results = await checkPass2Evidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.checkId).toBe('pass2-evidence');
  });
});
