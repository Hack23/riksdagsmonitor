#!/usr/bin/env node
/**
 * Patch safe_outputs Checkout blocks in news-*.lock.yml to use `fetch-depth: 0`.
 *
 * Why this exists
 * ---------------
 * gh-aw v0.74.7 hardcodes `fetch-depth: 1` for the safe_outputs Checkout steps
 * in `pkg/workflow/compiler_safe_outputs_steps.go` with no frontmatter knob.
 * That default breaks our news workflows in two ways:
 *
 *   1. Bundle-apply detects a shallow clone (depth=1) and runs
 *      `git fetch --unshallow origin` mid-job. On this repo it takes 13+ min
 *      and trips the 15-min safe_outputs job timeout (see run #26151926742).
 *   2. When main advances during the agent run, depth=1 loses the prerequisite
 *      commit the bundle was created from, causing
 *      "Repository lacks these prerequisite commits" and a failed
 *      create_pull_request safe output.
 *
 * The pattern uniquely targets the two safe_outputs Checkout steps:
 *   (a) the comment-event path (ref: default_branch), and
 *   (b) the main path (ref: extract-base-branch.outputs.base-branch || …)
 * Both have `persist-credentials: false` immediately before `fetch-depth: 1`.
 *
 * The agent Checkout step has `sparse-checkout-cone-mode: true` between
 * `persist-credentials: false` and `fetch-depth: 1`, so its two-line context
 * does NOT match this pattern — that checkout is intentionally left shallow
 * (agent uses sparse checkout and does not apply bundles).
 *
 * Idempotency
 * -----------
 * The script is a no-op on lock files that are already patched. It exits
 * non-zero only when a lock file has the safe_outputs Checkout pattern with
 * a count that is not exactly 2 (i.e. gh-aw changed shape and the pattern
 * needs revisiting).
 *
 * Upstream removal
 * ----------------
 * When gh-aw exposes a `safe-outputs.fetch-depth` frontmatter knob (or makes
 * `fetch-depth: 0` the default for safe_outputs Checkouts), this entire
 * script can be deleted along with its compile-workflow invocation and the
 * `tests/safeoutputs-fetch-depth-patch.test.ts` regression test.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKFLOWS_DIR = '.github/workflows';
const PATTERN     = '          persist-credentials: false\n          fetch-depth: 1';
const REPLACEMENT = '          persist-credentials: false\n          fetch-depth: 0';
const EXPECTED_OCCURRENCES = 2; // safe_outputs has TWO Checkout steps

const lockFiles = readdirSync(WORKFLOWS_DIR)
  .filter((f) => f.startsWith('news-') && f.endsWith('.lock.yml'))
  .sort();

let exitCode = 0;
let patchedFiles = 0;
let alreadyOkFiles = 0;

for (const name of lockFiles) {
  const path = join(WORKFLOWS_DIR, name);
  const original = readFileSync(path, 'utf8');
  const occurrences = original.split(PATTERN).length - 1;

  if (occurrences === 0) {
    // Already patched (or shape changed). Verify the patched form exists at
    // the expected count to catch a future gh-aw release that renames the
    // surrounding step.
    const patchedCount = original.split(REPLACEMENT).length - 1;
    if (patchedCount !== EXPECTED_OCCURRENCES) {
      console.error(
        `ERROR: ${path} has ${patchedCount} patched occurrences and ${occurrences} unpatched ` +
          `(expected ${EXPECTED_OCCURRENCES} patched). gh-aw safe_outputs Checkout shape may have changed.`,
      );
      exitCode = 1;
    } else {
      alreadyOkFiles++;
    }
    continue;
  }

  if (occurrences !== EXPECTED_OCCURRENCES) {
    console.error(
      `ERROR: ${path} has ${occurrences} unpatched occurrences ` +
        `(expected ${EXPECTED_OCCURRENCES}). gh-aw safe_outputs shape may have changed.`,
    );
    exitCode = 1;
    continue;
  }

  const patched = original.split(PATTERN).join(REPLACEMENT);
  writeFileSync(path, patched);
  console.log(`Patched ${path} (${occurrences} occurrences)`);
  patchedFiles++;
}

console.log(
  `\nSummary: ${patchedFiles} file(s) patched, ${alreadyOkFiles} already correct, ` +
    `${lockFiles.length} total news lock file(s) inspected.`,
);

process.exit(exitCode);
