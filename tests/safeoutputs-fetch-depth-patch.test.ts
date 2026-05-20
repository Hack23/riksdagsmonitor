import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Regression guard for the safe_outputs fetch-depth patch.
 *
 * Background: gh-aw v0.74.7 hardcodes `fetch-depth: 1` in the safe_outputs
 * Checkout steps (compiler_safe_outputs_steps.go) with no frontmatter knob.
 * Our committed downstream fixup lives in
 * `scripts/agentic/patch-safeoutputs-fetch-depth.mjs` and is invoked by
 * `.github/workflows/compile-agentic-workflows.yml`.
 *
 * These tests pin the invariants the script enforces so that:
 *   - lock files committed to main are always in the patched shape
 *   - the script remains idempotent (no-op on already-patched files)
 *   - a future gh-aw release that renames the Checkout step is detected
 *     loudly (the script's expected count fails) instead of silently
 *     leaving lock files with fetch-depth: 1
 */

const WORKFLOWS_DIR = '.github/workflows';
const SCRIPT_PATH = 'scripts/agentic/patch-safeoutputs-fetch-depth.mjs';
const PATCHED  = '          persist-credentials: false\n          fetch-depth: 0';
const UNPATCHED = '          persist-credentials: false\n          fetch-depth: 1';
const EXPECTED_OCCURRENCES_PER_FILE = 2;
const EXPECTED_NEWS_LOCK_FILE_COUNT = 14;

function newsLockFiles(): string[] {
  return readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.startsWith('news-') && f.endsWith('.lock.yml'))
    .sort();
}

describe('safe_outputs fetch-depth patch', () => {
  it('there are exactly 14 news-*.lock.yml files', () => {
    expect(newsLockFiles().length).toBe(EXPECTED_NEWS_LOCK_FILE_COUNT);
  });

  it.each(newsLockFiles())(
    'committed %s has 2 patched safe_outputs Checkout blocks and 0 unpatched',
    (name) => {
      const src = readFileSync(join(WORKFLOWS_DIR, name), 'utf8');
      const patchedCount = src.split(PATCHED).length - 1;
      const unpatchedCount = src.split(UNPATCHED).length - 1;
      expect(
        patchedCount,
        `${name}: expected ${EXPECTED_OCCURRENCES_PER_FILE} patched safe_outputs Checkout blocks`,
      ).toBe(EXPECTED_OCCURRENCES_PER_FILE);
      expect(
        unpatchedCount,
        `${name}: must NOT contain "persist-credentials: false\\nfetch-depth: 1" — ` +
          `run \`node ${SCRIPT_PATH}\` to fix`,
      ).toBe(0);
    },
  );

  it('the patch script is idempotent on committed lock files (no diff on second run)', () => {
    // Snapshot a representative lock file, run the script, assert no change.
    const sample = join(WORKFLOWS_DIR, newsLockFiles()[0]);
    const before = readFileSync(sample, 'utf8');

    const stdout = execFileSync('node', [SCRIPT_PATH], {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    const after = readFileSync(sample, 'utf8');
    expect(after, 'script must be a no-op on already-patched lock files').toBe(before);
    expect(stdout).toMatch(/\d+ file\(s\) patched, \d+ already correct/);
    // Idempotent run patches zero files because committed lock files are
    // already in the patched shape.
    expect(stdout).toContain('0 file(s) patched');
    expect(stdout).toContain(`${EXPECTED_NEWS_LOCK_FILE_COUNT} already correct`);
  });

  it('the patch script restores fetch-depth: 0 when given an unpatched lock file', () => {
    // Pick the first lock file, mutate it in place to the unpatched shape,
    // run the script, assert it patches both occurrences back.
    const sample = join(WORKFLOWS_DIR, newsLockFiles()[0]);
    const original = readFileSync(sample, 'utf8');
    try {
      const mutated = original.split(PATCHED).join(UNPATCHED);
      // Sanity: mutation must change exactly 2 occurrences.
      expect(mutated.split(UNPATCHED).length - 1).toBe(EXPECTED_OCCURRENCES_PER_FILE);
      writeFileSync(sample, mutated);

      execFileSync('node', [SCRIPT_PATH], { encoding: 'utf8', cwd: process.cwd() });

      const restored = readFileSync(sample, 'utf8');
      expect(restored).toBe(original);
    } finally {
      // Always restore the original content, even on assertion failure.
      writeFileSync(sample, original);
    }
  });

  it('compile workflow delegates to the script and contains no inline patching logic', () => {
    const compile = readFileSync('.github/workflows/compile-agentic-workflows.yml', 'utf8');
    // Must invoke the script.
    expect(compile).toContain(`node ${SCRIPT_PATH}`);
    // Must NOT contain inline python patching logic (the previous shape).
    expect(compile).not.toContain('python3 - << ');
    expect(compile).not.toMatch(/PATTERN\s*=\s*'\s*persist-credentials/);
    expect(compile).not.toContain('PYEOF');
  });
});
