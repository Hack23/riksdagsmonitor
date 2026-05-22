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
    expect(commitPrompt).toMatch(/\(mandatory\)/i);
  });

  it('all 14 news workflows have max-patch-files in safe-outputs block and ≤ 100', () => {
    const newsWorkflows = fs.readdirSync(WORKFLOWS_DIR)
      .filter((f) => f.startsWith('news-') && f.endsWith('.md'));

    expect(newsWorkflows.length, 'expected exactly 14 news-*.md workflows').toBe(14);

    for (const file of newsWorkflows) {
      const workflow = fs.readFileSync(
        path.join(WORKFLOWS_DIR, file),
        'utf8',
      );

      // Extract the safe-outputs block (between "safe-outputs:" and "create-pull-request:")
      // to avoid matching prose mentions of max-patch-files
      const safeOutputsMatch = workflow.match(/safe-outputs:\s*\n([\s\S]*?)create-pull-request:/);
      expect(safeOutputsMatch, `${file} must have a safe-outputs config block`).not.toBeNull();

      const safeOutputsBlock = safeOutputsMatch![1]!;
      const match = safeOutputsBlock.match(/max-patch-files:\s*(\d+)/);
      expect(match, `${file} must declare max-patch-files in safe-outputs`).not.toBeNull();
      const maxPatchFiles = parseInt(match![1]!, 10);
      expect(maxPatchFiles, `${file} max-patch-files (${maxPatchFiles}) must be ≤ ${MAX_PR_FILES}`).toBeLessThanOrEqual(MAX_PR_FILES);
    }
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

        // Detect analysis sub-subfolders (e.g., election-cycle/{current,next}).
        // Exclude pass1/ (gate-evidence snapshot) and documents/ (per-doc analyses) —
        // these are already excluded from counting in getAllFiles.
        const analysisSubdirs = fs.readdirSync(subPath).filter((f) => {
          const full = path.join(subPath, f);
          return fs.statSync(full).isDirectory() && f !== 'pass1' && f !== 'documents';
        });

        if (analysisSubdirs.length > 0) {
          // Workflows that produce per-anchor sub-subfolders (e.g., election-cycle
          // with current/ and next/) check each sub-subfolder independently —
          // each represents a distinct analysis unit against the PR file budget.
          for (const subSub of analysisSubdirs) {
            const subSubPath = path.join(subPath, subSub);
            const allFiles = getAllFiles(subSubPath);
            expect(
              allFiles.length,
              `${date}/${sub}/${subSub} has ${allFiles.length} files (budget: ${SAFE_THRESHOLD})`,
            ).toBeLessThan(SAFE_THRESHOLD);
          }
        } else {
          const allFiles = getAllFiles(subPath);
          // Each subfolder + its HTML renders should stay under 90
          // (analysis files + 2 HTML + article.md)
          expect(
            allFiles.length,
            `${date}/${sub} has ${allFiles.length} files (budget: ${SAFE_THRESHOLD})`,
          ).toBeLessThan(SAFE_THRESHOLD);
        }
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
