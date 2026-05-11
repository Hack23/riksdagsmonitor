/**
 * File Ownership Validator for News Workflow Conflict Prevention
 *
 * Enforces a strict file-ownership contract between content and translation workflows:
 * - Content workflows (news-committee-reports, news-propositions, etc.) own EN/SV files
 * - Translation workflow (news-translate) owns all other language files (DA/NO/FI/DE/FR/ES/NL/AR/HE/JA/KO/ZH)
 *
 * This prevents merge conflicts when concurrent workflows touch the same date's article files.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Languages owned by content generation workflows */
export const CONTENT_LANGS = ['en', 'sv'] as const;

/** Languages owned by the translation workflow */
export const TRANSLATION_LANGS = [
  'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
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
 * Extract the language code from a news article filename.
 * Expected pattern: `news/YYYY-MM-DD-slug-{lang}.html`
 *
 * @param filepath - The file path to extract the language from
 * @returns The two-letter language code, or null if no match
 */
export function extractLangFromPath(filepath: string): string | null {
  const match = filepath.match(/-([a-z]{2})\.html$/);
  return match?.[1] ?? null;
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
  if (!filepath.startsWith('news/') || !filepath.endsWith('.html')) {
    return true;
  }

  const lang = extractLangFromPath(filepath);
  if (!lang) {
    return true;
  }

  const isContentLang = (CONTENT_LANGS as readonly string[]).includes(lang);
  const isTranslationLang = (TRANSLATION_LANGS as readonly string[]).includes(lang);

  return category === 'content' ? isContentLang : isTranslationLang;
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
  const newsHtmlFiles = files.filter(
    (f) => f.startsWith('news/') && f.endsWith('.html'),
  );

  const violations = newsHtmlFiles.filter(
    (f) => !isFileOwnedByCategory(f, category),
  );

  return {
    passed: violations.length === 0,
    violations,
    checkedCount: newsHtmlFiles.length,
  };
}

/* istanbul ignore next -- CLI entry point */
if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? '')) {
  const category = process.argv[2] as WorkflowCategory | undefined;

  if (!category || !['content', 'translation'].includes(category)) {
    console.error(
      'Usage: npx tsx scripts/validate-file-ownership.ts <content|translation>\n' +
      '  Validates staged, unstaged, and untracked changes against the file-ownership contract.',
    );
    process.exit(2);
  }

  const result = validatePendingFileOwnership(category);

  if (result.passed) {
    console.log(
      `✅ File ownership validation passed (${result.checkedCount} news files checked for '${category}' category)`,
    );
    process.exit(0);
  } else {
    console.error(
      `❌ File ownership violation! The following files do not belong to the '${category}' workflow category:`,
    );
    for (const v of result.violations) {
      console.error(`   - ${v}`);
    }
    process.exit(1);
  }
}
