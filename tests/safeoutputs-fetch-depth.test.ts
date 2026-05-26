import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Regression guard for the safe_outputs `fetch-depth` configuration.
 *
 * Background: gh-aw ≤ v0.74.7 hardcoded `fetch-depth: 1` in the safe_outputs
 * Checkout steps (`pkg/workflow/compiler_safe_outputs_steps.go`) with no
 * frontmatter knob, which required a post-compile patch script
 * (`scripts/agentic/patch-safeoutputs-fetch-depth.mjs`). From v0.76.0 onward
 * the compiler reads `checkout.fetch-depth` from the source `.md` frontmatter
 * and propagates it to both safe_outputs Checkout steps natively
 * (`buildSharedPRCheckoutSteps` → `GetDefaultCheckoutOverride().fetchDepth`).
 *
 * This test pins the invariants we now rely on:
 *   - Every news-*.md declares `checkout: { fetch-depth: 0 }` so git bundles
 *     can be applied when main has advanced since the agent started.
 *   - Every news-*.lock.yml has the safe_outputs Checkout shape with
 *     `fetch-depth: 0` (two occurrences: comment-event path + main path),
 *     plus the agent's primary Checkout also at `fetch-depth: 0`.
 *   - The agent's sparse-checkout step (`.github` / `.agents` config folders)
 *     remains intentionally shallow at `fetch-depth: 1`.
 *
 * If a future gh-aw release renames the surrounding step or removes the
 * frontmatter knob, these assertions fail loudly instead of silently
 * regressing to `fetch-depth: 1` and breaking bundle apply.
 */

const WORKFLOWS_DIR = '.github/workflows';
const EXPECTED_NEWS_LOCK_FILE_COUNT = 14;

function newsSourceFiles(): string[] {
  return readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.startsWith('news-') && f.endsWith('.md'))
    .sort();
}

function newsLockFiles(): string[] {
  return readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.startsWith('news-') && f.endsWith('.lock.yml'))
    .sort();
}

describe('safe_outputs fetch-depth (native gh-aw v0.76.0+)', () => {
  it('there are exactly 14 news-*.md sources and 14 news-*.lock.yml outputs', () => {
    expect(newsSourceFiles().length).toBe(EXPECTED_NEWS_LOCK_FILE_COUNT);
    expect(newsLockFiles().length).toBe(EXPECTED_NEWS_LOCK_FILE_COUNT);
  });

  it.each(newsSourceFiles())(
    'source %s declares `checkout: { fetch-depth: 0 }`',
    (name) => {
      const src = readFileSync(join(WORKFLOWS_DIR, name), 'utf8');
      // The block must appear in the frontmatter — i.e. before the second `---` line.
      const frontmatterEnd = src.indexOf('\n---', src.indexOf('---') + 3);
      expect(frontmatterEnd, `${name}: missing frontmatter terminator`).toBeGreaterThan(0);
      const frontmatter = src.slice(0, frontmatterEnd);
      expect(
        frontmatter,
        `${name}: must declare \`checkout: { fetch-depth: 0 }\` in the frontmatter so gh-aw ` +
          `propagates it to the safe_outputs Checkout steps (compiler_safe_outputs_steps.go)`,
      ).toMatch(/^checkout:\s*\n\s+fetch-depth:\s*0\s*$/m);
    },
  );

  it.each(newsLockFiles())(
    'compiled %s has 0 unpatched safe_outputs Checkouts (fetch-depth: 1 with persist-credentials)',
    (name) => {
      const src = readFileSync(join(WORKFLOWS_DIR, name), 'utf8');
      // The 10-space-indented pair only appears in the safe_outputs Checkout
      // blocks. The agent's sparse-checkout step also uses fetch-depth: 1 but
      // has `sparse-checkout-cone-mode: true` between persist-credentials and
      // fetch-depth, so it does NOT match this contiguous pattern.
      const unpatched = '          persist-credentials: false\n          fetch-depth: 1';
      const unpatchedCount = src.split(unpatched).length - 1;
      expect(
        unpatchedCount,
        `${name}: safe_outputs Checkouts must use fetch-depth: 0. Ensure source .md has ` +
          `\`checkout: { fetch-depth: 0 }\` in frontmatter and recompile with \`gh aw compile --purge\`.`,
      ).toBe(0);
    },
  );

  it.each(newsLockFiles())(
    'compiled %s has the two safe_outputs Checkouts at fetch-depth: 0',
    (name) => {
      const src = readFileSync(join(WORKFLOWS_DIR, name), 'utf8');
      const patched = '          persist-credentials: false\n          fetch-depth: 0';
      // safe_outputs has 2 Checkout steps (comment-event path + main path).
      // The agent's main Checkout is a third hit when checkout.fetch-depth=0
      // propagates there too. Require at least 2.
      const patchedCount = src.split(patched).length - 1;
      expect(
        patchedCount,
        `${name}: expected ≥ 2 safe_outputs Checkout blocks with fetch-depth: 0`,
      ).toBeGreaterThanOrEqual(2);
    },
  );

  it.each(newsLockFiles())(
    'compiled %s keeps the agent sparse-checkout step shallow (fetch-depth: 1)',
    (name) => {
      const src = readFileSync(join(WORKFLOWS_DIR, name), 'utf8');
      // The sparse-checkout step has `sparse-checkout-cone-mode: true` two
      // lines before `fetch-depth: 1`. Verify exactly one such block exists.
      const sparsePattern = /sparse-checkout-cone-mode: true\n\s+fetch-depth: 1/g;
      const matches = src.match(sparsePattern) ?? [];
      expect(matches.length, `${name}: agent sparse-checkout step must remain shallow`).toBe(1);
    },
  );

  it('compile workflow no longer references the deleted patch script', () => {
    const compile = readFileSync('.github/workflows/compile-agentic-workflows.yml', 'utf8');
    expect(compile).not.toContain('patch-safeoutputs-fetch-depth');
    // And the source-only `checkout.fetch-depth` is the canonical knob now.
    expect(compile).not.toContain('Patch safe_outputs fetch-depth');
  });
});
