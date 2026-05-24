/**
 * File Ownership Validator for News Workflow Conflict Prevention
 *
 * Enforces a strict file-ownership contract between content and translation workflows:
 * - Content workflows (news-committee-reports, news-propositions, etc.) own
 *   ALL `news/*.html` files (all 14 languages) **and** the English-master executive brief
 *   `analysis/daily/$DATE/$SUB/executive-brief.md`.
 * - Translation workflow (news-translate) owns all
 *   `analysis/daily/$DATE/$SUB/executive-brief_<lang>.md` files (for the 13
 *   non-English target languages). It does NOT own any `news/*.html` files.
 *
 * This prevents merge conflicts when concurrent workflows touch the same date's
 * article files or executive briefs.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** All languages — content workflows own ALL news/*.html files (all 14 languages). */
export const CONTENT_LANGS = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
] as const;

/**
 * Legacy: languages whose news/*.html files were previously owned by the
 * translation workflow. Now empty — news-translate no longer touches HTML.
 * Kept for backwards-compatibility of the export; the ownership check below
 * uses the updated logic.
 */
export const TRANSLATION_LANGS = [] as const;

/**
 * Languages whose `executive-brief_<lang>.md` files are owned by the
 * `news-translate` workflow. Includes Swedish — the brief markdown pipeline
 * uses a different ownership split than the HTML article pipeline:
 *   - `executive-brief.md`                = English source, owned by per-type content workflows.
 *   - `executive-brief_<lang>.md` (× 13)  = all non-English targets, owned by news-translate.
 *
 * See TRANSLATION_GUIDE.md §"Executive Brief Markdown Translations" for the
 * authoritative content contract.
 */
export const EXEC_BRIEF_TRANSLATION_LANGS = [
  'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
] as const;

/** Workflow category for file ownership validation */
export type WorkflowCategory = 'content' | 'translation';

/** Result of a file ownership validation check */
export interface ValidationResult {
  /** Whether all pending files (staged + unstaged + untracked) pass ownership validation */
  passed: boolean;
  /** Files that violate the ownership contract */
  violations: string[];
  /** Total pending news HTML files checked */
  checkedCount: number;
}

/**
 * Extract the language code from a news article filename or executive-brief
 * Markdown filename.
 *
 * Recognised patterns:
 *   - `news/YYYY-MM-DD-slug-<lang>.html`               (HTML article)
 *   - `analysis/daily/.../executive-brief_<lang>.md`   (Markdown translation)
 *
 * Returns `null` for the canonical English source `executive-brief.md` (no
 * suffix) — callers must handle that file via path-based ownership rules.
 *
 * @param filepath - The file path to extract the language from
 * @returns The two-letter language code, or null if no match
 */
export function extractLangFromPath(filepath: string): string | null {
  // executive-brief_<lang>.md
  const briefMatch = filepath.match(/\/executive-brief_([a-z]{2})\.md$/);
  if (briefMatch) return briefMatch[1] ?? null;

  // news/...-<lang>.html
  const match = filepath.match(/-([a-z]{2})\.html$/);
  return match?.[1] ?? null;
}

/**
 * Returns `true` if the file path is the English-master executive brief
 * (no language suffix), which is owned by per-type content workflows.
 */
function isEnglishExecutiveBriefSource(filepath: string): boolean {
  return /\/analysis\/daily\/.+\/executive-brief\.md$/.test('/' + filepath)
    && !/\/executive-brief_[a-z]{2}\.md$/.test('/' + filepath);
}

/**
 * Returns `true` if the file path is a translated executive brief
 * (`executive-brief_<lang>.md`), which is owned by the news-translate workflow.
 */
function isExecutiveBriefTranslation(filepath: string): boolean {
  return /\/analysis\/daily\/.+\/executive-brief_[a-z]{2}\.md$/.test('/' + filepath);
}

/**
 * Returns `true` if the file path is a localized article Markdown file
 * (`article.<lang>.md`), which is now FORBIDDEN for all workflow categories.
 * 
 * Per-type workflows must NOT write article.<lang>.md. Non-English HTML pages
 * are rendered via the localized executive-brief cascade (mergeLocalizedWithEnglish).
 */
function isLocalizedArticleMd(filepath: string): boolean {
  return /\/analysis\/daily\/.+\/article\.[a-z]{2}\.md$/.test('/' + filepath);
}

/**
 * Check whether a file belongs to the given workflow category.
 *
 * @param filepath - The file path to check
 * @param category - The workflow category ('content' or 'translation')
 * @returns true if the file is allowed for the given category
 */
export function isFileOwnedByCategory(
  filepath: string,
  category: WorkflowCategory,
): boolean {
  // article.<lang>.md is now forbidden for ALL workflow categories.
  // Per-type workflows must NOT write these files. The renderer uses
  // the localized executive-brief cascade instead (mergeLocalizedWithEnglish).
  if (isLocalizedArticleMd(filepath)) {
    return false;
  }

  // Executive-brief Markdown ownership: English source vs translation siblings.
  if (isEnglishExecutiveBriefSource(filepath)) {
    return category === 'content';
  }
  if (isExecutiveBriefTranslation(filepath)) {
    const lang = extractLangFromPath(filepath);
    if (!lang) return true;
    const isTranslationLang = (EXEC_BRIEF_TRANSLATION_LANGS as readonly string[]).includes(lang);
    return category === 'translation' && isTranslationLang;
  }

  if (!filepath.startsWith('news/') || !filepath.endsWith('.html')) {
    return true;
  }

  // Per-type content workflows own ALL news/*.html files (all 14 languages).
  // The news-translate workflow does NOT write any news/*.html files.
  return category === 'content';
}

/**
 * Validate that all pending files (staged + unstaged + untracked working-tree changes)
 * conform to the file-ownership contract for the given workflow category.
 *
 * Checks the union of:
 * - `git diff --cached --name-only` (staged)
 * - `git diff --name-only` (unstaged modifications)
 * - `git ls-files --others --exclude-standard` (untracked new files)
 *
 * This ensures violations are caught regardless of whether `git add` has been run.
 *
 * @param category - The workflow category ('content' or 'translation')
 * @returns Validation result with pass/fail status and any violations
 */
export function validatePendingFileOwnership(
  category: WorkflowCategory,
): ValidationResult {
  const stagedOutput = execSync('git diff --cached --name-only', {
    encoding: 'utf-8',
  }).trim();

  const unstagedOutput = execSync('git diff --name-only', {
    encoding: 'utf-8',
  }).trim();

  const untrackedOutput = execSync(
    'git ls-files --others --exclude-standard',
    { encoding: 'utf-8' },
  ).trim();

  const allFiles = new Set<string>();
  if (stagedOutput) {
    for (const f of stagedOutput.split('\n')) if (f) allFiles.add(f);
  }
  if (unstagedOutput) {
    for (const f of unstagedOutput.split('\n')) if (f) allFiles.add(f);
  }
  if (untrackedOutput) {
    for (const f of untrackedOutput.split('\n')) if (f) allFiles.add(f);
  }

  if (allFiles.size === 0) {
    return { passed: true, violations: [], checkedCount: 0 };
  }

  return validateFileList([...allFiles], category);
}

/**
 * Validate a list of file paths against the ownership contract.
 * This is the pure-logic core, usable without git.
 *
 * @param files - Array of file paths to validate
 * @param category - The workflow category ('content' or 'translation')
 * @returns Validation result with pass/fail status and any violations
 */
export function validateFileList(
  files: string[],
  category: WorkflowCategory,
): ValidationResult {
  const ownedFiles = files.filter((f) => {
    // News HTML articles
    if (f.startsWith('news/') && f.endsWith('.html')) return true;
    // Executive-brief markdown (English source + translations)
    if (/\/executive-brief(?:_[a-z]{2})?\.md$/.test('/' + f)
      && f.startsWith('analysis/daily/')) return true;
    // article.<lang>.md is now forbidden (category-independent violation)
    if (isLocalizedArticleMd(f)) return true;
    return false;
  });

  const violations = ownedFiles.filter(
    (f) => !isFileOwnedByCategory(f, category),
  );

  return {
    passed: violations.length === 0,
    violations,
    checkedCount: ownedFiles.length,
  };
}

/**
 * Auto-detect the workflow category from a list of changed file paths.
 *
 * Detection rules:
 *   - If only translation surface files (`executive-brief_<lang>.md`) are
 *     present → `translation`.
 *   - If only content surface files (news/*.html, English `executive-brief.md`,
 *     or forbidden `article.<lang>.md`) are present → `content`.
 *   - If BOTH surfaces are present → `null` (mixed PR, skip enforcement).
 *     Mixed PRs typically originate from non-workflow sources (manual edits,
 *     utility/refactor PRs, merge commits carrying passenger files from main)
 *     where the single-category contract does not apply. Workflow-originated
 *     PRs that need strict enforcement must pass `--category` explicitly.
 *   - Otherwise → `null` (no ownership-surface files; caller treats as no-op pass).
 *
 * Note: `news/*.html` changes NEVER imply "translation" because per-type
 * content workflows own all 14 HTML language variants.
 *
 * @param files - Array of repo-relative file paths to inspect
 * @returns The inferred workflow category, or `null` if no surface files / mixed
 */
export function detectCategoryFromFiles(
  files: readonly string[],
): WorkflowCategory | null {
  let sawTranslation = false;
  let sawContent = false;
  for (const f of files) {
    if (isExecutiveBriefTranslation(f)) {
      sawTranslation = true;
      continue;
    }
    if (isEnglishExecutiveBriefSource(f)) {
      sawContent = true;
      continue;
    }
    // article.<lang>.md is a category-independent violation — treat it as a
    // content surface file so the validator can reject it instead of silently skipping.
    if (isLocalizedArticleMd(f)) {
      sawContent = true;
      continue;
    }
    if (f.startsWith('news/') && f.endsWith('.html')) {
      // All news/*.html is owned by content workflows — never implies translation.
      sawContent = true;
    }
  }
  if (sawTranslation && sawContent) return null;
  if (sawTranslation) return 'translation';
  if (sawContent) return 'content';
  return null;
}

/** Parse CLI category values, including short aliases advertised by --help. */
export function parseWorkflowCategoryArg(value: string): WorkflowCategory | undefined {
  if (value === 'content' || value === 'c') return 'content';
  if (value === 'translation' || value === 't') return 'translation';
  return undefined;
}

/* istanbul ignore next -- CLI entry point */
if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? '')) {
  const args = process.argv.slice(2);

  // Parse flags: --files <comma-list>, --files-from <path|->, --category <c|t>, plain positional category.
  let filesArg: string | undefined;
  let filesFromArg: string | undefined;
  let categoryArg: WorkflowCategory | undefined;
  let invalidCategoryArg: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--files' && args[i + 1]) {
      filesArg = args[++i];
    } else if (a === '--files-from' && args[i + 1]) {
      filesFromArg = args[++i];
    } else if (a === '--category' && args[i + 1]) {
      const value = args[++i];
      const parsed = parseWorkflowCategoryArg(value);
      if (parsed) {
        categoryArg = parsed;
      } else {
        invalidCategoryArg = value;
      }
    } else {
      const parsed = parseWorkflowCategoryArg(a);
      if (parsed) {
        categoryArg = parsed;
      } else if (a === '--help' || a === '-h') {
        console.log(
          'Usage:\n' +
          '  validate-file-ownership.ts <content|translation|c|t>          # validate git working tree\n' +
          '  validate-file-ownership.ts --files <a.md,b.md> [--category <content|translation|c|t>]\n' +
          '  validate-file-ownership.ts --files-from <path|-> [--category <content|translation|c|t>]\n' +
          '\nIf --category is omitted with --files / --files-from, it is auto-detected:\n' +
          '  any executive-brief_<lang>.md                 -> translation\n' +
          '  news/*.html or English executive-brief.md     -> content',
        );
        process.exit(0);
      }
    }
  }

  if (invalidCategoryArg) {
    console.error(`Invalid category '${invalidCategoryArg}'. Use content|translation|c|t.`);
    process.exit(2);
  }

  // External file-list mode (PR-check workflow uses this).
  if (filesArg !== undefined || filesFromArg !== undefined) {
    let fileList: string[];
    if (filesArg !== undefined) {
      fileList = filesArg.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      // filesFromArg is guaranteed defined here.
      const src = filesFromArg as string;
      const raw = src === '-'
        ? readFileSync(0, 'utf-8')
        : readFileSync(src, 'utf-8');
      fileList = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }

    const detected = categoryArg ?? detectCategoryFromFiles(fileList);
    if (!detected) {
      console.log(
        `✅ File ownership validation skipped (0 ownership-surface files in input of ${fileList.length})`,
      );
      process.exit(0);
    }

    const result = validateFileList(fileList, detected);
    if (result.passed) {
      console.log(
        `✅ File ownership validation passed (${result.checkedCount} ownership-surface file(s) checked for '${detected}' category)`,
      );
      process.exit(0);
    }
    console.error(
      `❌ File ownership violation! The following files do not belong to the '${detected}' workflow category:`,
    );
    for (const v of result.violations) console.error(`   - ${v}`);
    process.exit(1);
  }

  // Legacy git-working-tree mode (unchanged behaviour).
  if (!categoryArg || !['content', 'translation'].includes(categoryArg)) {
    console.error(
      'Usage: npx tsx scripts/validate-file-ownership.ts <content|translation>\n' +
      '  Validates staged, unstaged, and untracked changes against the file-ownership contract.\n' +
      '  Run with --help for additional --files / --files-from options.',
    );
    process.exit(2);
  }

  const result = validatePendingFileOwnership(categoryArg);

  if (result.passed) {
    console.log(
      `✅ File ownership validation passed (${result.checkedCount} news files checked for '${categoryArg}' category)`,
    );
    process.exit(0);
  } else {
    console.error(
      `❌ File ownership violation! The following files do not belong to the '${categoryArg}' workflow category:`,
    );
    for (const v of result.violations) {
      console.error(`   - ${v}`);
    }
    process.exit(1);
  }
}
