#!/usr/bin/env node
// SPDX-FileCopyrightText: 2024-2026 Hack23 AB
// SPDX-License-Identifier: Apache-2.0
//
// Drift detector for `.github/workflows/news-pat-pr-fallback.yml`.
//
// Asserts that:
//   1. Every `name:` declared in a `.github/workflows/news-*.md` source appears
//      in the `workflows:` list under `on.workflow_run` of the PAT fallback yml.
//      A missing entry means the PAT-fallback safety net is silently OFF for
//      that workflow — see investigation Finding 2.
//   2. The explicit `slug_for_name()` case mapping in the same yml has a
//      branch for every workflow name (catches typos like
//      `News: Translate Articles` vs actual `News: Translate Executive Briefs`).
//   3. No stale entries reference workflow names that no longer exist as a
//      news-*.md source (catches deletions).
//
// Invoked by `.github/workflows/compile-agentic-workflows.yml` immediately
// after `gh aw compile --purge` so any drift is caught at CI compile time
// rather than discovered when a fallback silently fails to fire in production.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const WORKFLOWS_DIR = join(REPO_ROOT, '.github/workflows');
const FALLBACK_YML = join(WORKFLOWS_DIR, 'news-pat-pr-fallback.yml');

/** Extract the `name:` string from a news-*.md source. */
function workflowNameFromSource(path) {
  const src = readFileSync(path, 'utf8');
  const m = src.match(/^name:\s*"?([^"\n]+?)"?\s*$/m);
  if (!m) throw new Error(`No name: line in ${path}`);
  return m[1].trim();
}

/** Collect all `News: …` workflow names defined by news-*.md sources. */
function collectSourceNames() {
  return readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.startsWith('news-') && f.endsWith('.md'))
    .map((f) => workflowNameFromSource(join(WORKFLOWS_DIR, f)))
    .sort();
}

/** Parse the `workflows:` list under `on.workflow_run` (line-based, robust). */
function parseFallbackWorkflowsList(yml) {
  const lines = yml.split('\n');
  // Locate the block; structure is:
  //   on:
  //     workflow_run:
  //       workflows:
  //         - "…"
  //         - "…"
  //       types: [completed]
  let inBlock = false;
  const names = [];
  for (const line of lines) {
    if (/^\s+workflows:\s*$/.test(line)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      const m = line.match(/^\s+-\s+"([^"]+)"\s*$/);
      if (m) {
        names.push(m[1]);
        continue;
      }
      // Any non-list-item line terminates the list (e.g. `types:` or `permissions:`).
      if (line.trim() !== '' && !/^\s+-\s+/.test(line)) break;
    }
  }
  return names.sort();
}

/** Parse the explicit `case "$1" in … esac` slug map. */
function parseFallbackSlugMap(yml) {
  // Match double-quoted patterns inside the slug_for_name() case statement.
  // Lines look like: `              "News: Committee Reports") echo "committee-reports" ;;`
  const start = yml.indexOf('slug_for_name()');
  if (start === -1) throw new Error('slug_for_name() not found in fallback yml');
  const end = yml.indexOf('esac', start);
  if (end === -1) throw new Error('esac terminator not found after slug_for_name()');
  const body = yml.slice(start, end);
  const names = [];
  for (const m of body.matchAll(/"([^"]+)"\)\s+echo\s+"([^"]+)"/g)) {
    names.push(m[1]);
  }
  return names.sort();
}

function main() {
  const sourceNames = collectSourceNames();
  const fallbackYml = readFileSync(FALLBACK_YML, 'utf8');
  const triggerNames = parseFallbackWorkflowsList(fallbackYml);
  const slugMapNames = parseFallbackSlugMap(fallbackYml);

  const errors = [];

  const missingFromTriggers = sourceNames.filter((n) => !triggerNames.includes(n));
  if (missingFromTriggers.length) {
    errors.push(
      `❌ Missing from \`on.workflow_run.workflows\` in news-pat-pr-fallback.yml:\n` +
        missingFromTriggers.map((n) => `     - "${n}"`).join('\n') +
        `\n   → PAT fallback will NOT fire for these workflows. Add them to the list.`,
    );
  }

  const staleTriggers = triggerNames.filter((n) => !sourceNames.includes(n));
  if (staleTriggers.length) {
    errors.push(
      `❌ Stale entries in \`on.workflow_run.workflows\` (no matching news-*.md source):\n` +
        staleTriggers.map((n) => `     - "${n}"`).join('\n') +
        `\n   → The workflow_run trigger will never match; remove the entries or fix the typo.`,
    );
  }

  const missingFromSlugMap = sourceNames.filter((n) => !slugMapNames.includes(n));
  if (missingFromSlugMap.length) {
    errors.push(
      `❌ Missing branches in slug_for_name() case statement:\n` +
        missingFromSlugMap.map((n) => `     "${n}")`).join('\n') +
        `\n   → Fallback would fall back to a noisy generic slug derivation.`,
    );
  }

  const staleSlugMap = slugMapNames.filter((n) => !sourceNames.includes(n));
  if (staleSlugMap.length) {
    errors.push(
      `❌ Stale branches in slug_for_name() (no matching news-*.md source):\n` +
        staleSlugMap.map((n) => `     "${n}")`).join('\n'),
    );
  }

  if (errors.length) {
    console.error(
      `\nPAT fallback coverage drift detected (news-pat-pr-fallback.yml ↮ news-*.md).\n`,
    );
    for (const e of errors) console.error(e + '\n');
    console.error(
      `Source workflows (${sourceNames.length}):\n` +
        sourceNames.map((n) => `  - "${n}"`).join('\n'),
    );
    process.exit(1);
  }

  console.log(
    `✓ PAT fallback coverage OK — ${sourceNames.length} news-*.md sources, ` +
      `${triggerNames.length} workflow_run triggers, ${slugMapNames.length} slug map branches.`,
  );
}

main();
