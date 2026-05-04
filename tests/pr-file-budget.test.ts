/**
 * @module tests/pr-file-budget
 * @description Tests that the analysis pipeline respects the 100-file PR cap
 * enforced by safe-outputs (E003). Validates that download limits and analysis
 * structure keep total file counts well under the budget.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PROMPTS_DIR = path.join(ROOT, '.github', 'prompts');
const WORKFLOWS_DIR = path.join(ROOT, '.github', 'workflows');
const ANALYSIS_DIR = path.join(ROOT, 'analysis', 'daily');

/**
 * Maximum number of files allowed in a single PR.
 * The safe-outputs handler hard-rejects PRs with > 100 files (E003).
 * We use 90 as a safety threshold.
 */
const MAX_PR_FILES = 100;
const SAFE_THRESHOLD = 90;

/**
 * Fixed files per analysis run (core artifacts + metadata + HTML).
 * 23 core artifacts + README + article.md + pir-status.json + 2 HTML = 28
 */
const FIXED_FILE_COUNT = 28;

describe('PR file-budget enforcement', () => {
  it('download limit in 03-data-download.md keeps total under 100 files', () => {
    const downloadPrompt = fs.readFileSync(
      path.join(PROMPTS_DIR, '03-data-download.md'),
      'utf8',
    );

    // Extract document-type command (contains --doc-type) and its --limit
    const docTypeCommandMatch = downloadPrompt.match(
      /--doc-type[^`]*--limit\s+(\d+)|--limit\s+(\d+)[^`]*--doc-type/,
    );
    expect(docTypeCommandMatch).not.toBeNull();
    const docTypeLimit = parseInt(
      (docTypeCommandMatch![1] ?? docTypeCommandMatch![2])!,
      10,
    );
    expect(docTypeLimit, 'document-type --limit must be ≤ 20').toBeLessThanOrEqual(20);

    // Verify total: fixed files + per-document files stays under budget
    const estimatedTotal = FIXED_FILE_COUNT + docTypeLimit;
    expect(estimatedTotal).toBeLessThan(SAFE_THRESHOLD);

    // Extract aggregation command (no --doc-type) and its --limit
    // The aggregation command appears after the document-type one in the prompt
    const allLimits = [...downloadPrompt.matchAll(/--limit\s+(\d+)/g)];
    for (const match of allLimits) {
      const limit = parseInt(match[1]!, 10);
      expect(limit, `--limit ${limit} exceeds max aggregation limit of 30`).toBeLessThanOrEqual(30);
    }
  });

  it('07-commit-and-pr.md contains mandatory 100-file guard', () => {
    const commitPrompt = fs.readFileSync(
      path.join(PROMPTS_DIR, '07-commit-and-pr.md'),
      'utf8',
    );

    // Must contain the file-budget enforcement script
    expect(commitPrompt).toContain('100-file guard');
    expect(commitPrompt).toContain('STAGED_COUNT');
    expect(commitPrompt).toContain('OVER FILE BUDGET');
    expect(commitPrompt).toContain('non-negotiable');
  });

  it('news-propositions.md workflow has max-patch-files < 100', () => {
    const workflow = fs.readFileSync(
      path.join(WORKFLOWS_DIR, 'news-propositions.md'),
      'utf8',
    );

    const match = workflow.match(/max-patch-files:\s*(\d+)/);
    expect(match).not.toBeNull();
    const maxPatchFiles = parseInt(match![1]!, 10);
    expect(maxPatchFiles).toBeLessThan(MAX_PR_FILES);
    expect(maxPatchFiles).toBeLessThanOrEqual(SAFE_THRESHOLD);
  });

  it('existing analysis folders stay under file budget', () => {
    // Check that any existing analysis subfolder has < 90 files
    if (!fs.existsSync(ANALYSIS_DIR)) return;

    const dates = fs.readdirSync(ANALYSIS_DIR).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    // Sample the latest 5 dates
    const recentDates = dates.sort().reverse().slice(0, 5);

    for (const date of recentDates) {
      const datePath = path.join(ANALYSIS_DIR, date);
      const subfolders = fs.readdirSync(datePath).filter((f) => {
        const full = path.join(datePath, f);
        return fs.statSync(full).isDirectory();
      });

      for (const sub of subfolders) {
        const subPath = path.join(datePath, sub);
        const allFiles = getAllFiles(subPath);
        // Each subfolder + its HTML renders should stay under 90
        // (analysis files + 2 HTML + article.md)
        expect(
          allFiles.length,
          `${date}/${sub} has ${allFiles.length} files (budget: ${SAFE_THRESHOLD})`,
        ).toBeLessThan(SAFE_THRESHOLD);
      }
    }
  });
});

function getAllFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip pass1/ — it's a local gate-evidence snapshot, not staged
      if (entry.name === 'pass1') continue;
      results.push(...getAllFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}
