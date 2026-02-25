/**
 * @module pipeline/validation
 * @description Post-generation HTML structure validation.
 *
 * Validates that generated article HTML meets minimum structural requirements
 * before the file is written to disk.  Failures are non-fatal by default —
 * the orchestrator collects validation warnings and continues.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

// ---------------------------------------------------------------------------
// Validation result types
// ---------------------------------------------------------------------------

/**
 * Result of validating a single HTML article string.
 */
export interface ArticleValidationResult {
  /** `true` when the HTML passes all required checks. */
  passed: boolean;
  /** Informational messages about checks that passed. */
  passed_checks: string[];
  /** Error messages for checks that failed (non-empty means `passed = false`). */
  errors: string[];
  /** Warning messages for checks that are advisory only. */
  warnings: string[];
}

/**
 * Options controlling which checks are enforced.
 */
export interface ValidationOptions {
  /** Require a `<h1>` element (default: `true`). */
  requireH1?: boolean;
  /** Require at least one `<h2>` section (default: `true`). */
  requireSections?: boolean;
  /** Require the sources footer block (default: `true`). */
  requireSources?: boolean;
  /** Minimum word count threshold (default: `50`). */
  minWordCount?: number;
  /** Require valid `<html lang="…">` attribute (default: `true`). */
  requireLangAttr?: boolean;
  /** Require `<!DOCTYPE html>` declaration (default: `true`). */
  requireDoctype?: boolean;
}

// ---------------------------------------------------------------------------
// Default options
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  requireH1: true,
  requireSections: true,
  requireSources: true,
  minWordCount: 50,
  requireLangAttr: true,
  requireDoctype: true,
};

// ---------------------------------------------------------------------------
// HTML structure validation
// ---------------------------------------------------------------------------

/**
 * Validate the structure of a generated article HTML string.
 *
 * This is a lightweight regex / string-based check, not a full DOM parse.
 * It is intentionally fast and dependency-free.
 *
 * @param html   - The complete HTML string to validate.
 * @param opts   - Optional configuration overrides.
 * @returns      Structured validation result.
 */
export function validateArticleHTML(
  html: string,
  opts: ValidationOptions = {},
): ArticleValidationResult {
  const options: Required<ValidationOptions> = { ...DEFAULT_OPTIONS, ...opts };

  const errors: string[] = [];
  const warnings: string[] = [];
  const passed_checks: string[] = [];

  if (!html || typeof html !== 'string') {
    return {
      passed: false,
      passed_checks,
      errors: ['HTML is empty or not a string'],
      warnings,
    };
  }

  // --- DOCTYPE ---
  if (options.requireDoctype) {
    if (/<!DOCTYPE\s+html>/i.test(html)) {
      passed_checks.push('DOCTYPE present');
    } else {
      errors.push('Missing <!DOCTYPE html> declaration');
    }
  }

  // --- lang attribute ---
  if (options.requireLangAttr) {
    if (/<html[^>]+lang=["'][a-z]{2,5}["']/i.test(html)) {
      passed_checks.push('lang attribute present');
    } else {
      errors.push('Missing valid lang attribute on <html> element');
    }
  }

  // --- H1 ---
  if (options.requireH1) {
    if (/<h1[^>]*>[\s\S]+?<\/h1>/i.test(html)) {
      passed_checks.push('H1 heading present');
    } else {
      errors.push('Missing <h1> heading');
    }
  }

  // --- Sections (H2) ---
  if (options.requireSections) {
    const h2Matches = html.match(/<h2[^>]*>/gi);
    const h2Count = h2Matches ? h2Matches.length : 0;
    if (h2Count >= 1) {
      passed_checks.push(`${h2Count} <h2> section(s) present`);
    } else {
      errors.push('No <h2> sections found — article content may be missing');
    }
  }

  // --- Sources footer ---
  if (options.requireSources) {
    if (/article-sources|data-sources|riksdag-regering-mcp/i.test(html)) {
      passed_checks.push('Sources block present');
    } else {
      warnings.push('Sources footer block not detected — article may lack attribution');
    }
  }

  // --- Word count (approximate: strip tags, split on whitespace) ---
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(w => w.length > 0).length;
  if (wordCount >= options.minWordCount) {
    passed_checks.push(`Word count ${wordCount} meets minimum ${options.minWordCount}`);
  } else {
    errors.push(
      `Word count ${wordCount} is below minimum ${options.minWordCount} — article content may be too thin`,
    );
  }

  return {
    passed: errors.length === 0,
    passed_checks,
    errors,
    warnings,
  };
}

/**
 * Validate a batch of articles and return a summary.
 *
 * @param articles - Array of `{ filename, html }` objects.
 * @param opts     - Optional validation configuration.
 * @returns        Array of per-article validation results.
 */
export function validateArticleBatch(
  articles: ReadonlyArray<{ filename: string; html: string }>,
  opts: ValidationOptions = {},
): Array<ArticleValidationResult & { filename: string }> {
  return articles.map(({ filename, html }) => ({
    filename,
    ...validateArticleHTML(html, opts),
  }));
}
