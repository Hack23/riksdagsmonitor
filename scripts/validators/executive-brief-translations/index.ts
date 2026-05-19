/**
 * @module scripts/validators/executive-brief-translations
 * @description Public orchestrator for executive-brief translation
 *              validation. Walks the analysis tree, resolves the
 *              `<!-- source-sha: -->` SHA via `git log -1`, and runs
 *              `validateTranslationContent` for every requested
 *              language.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              384–508 (filesystem walker + git SHA + orchestrator) and
 *              re-exports the per-rule symbols consumed by tests and the
 *              CLI shim. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  RTL_LANGS,
  TRANSLATION_LANGS,
  type SourceValidation,
  type TranslationLang,
  type TranslationValidation,
  type ValidationSummary,
} from './types.js';
import { validateTranslationContent } from './validate-translation-content.js';

/** Recursively walk a directory and yield every `executive-brief.md` (excluding `_<lang>.md` variants). */
export function findExecutiveBriefSources(rootDir: string): string[] {
  const results: string[] = [];
  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name === 'executive-brief.md') {
        results.push(full);
      }
    }
  }
  walk(rootDir);
  return results.sort();
}

/** Resolve the git commit SHA that last touched a path. Returns null on failure. */
export function gitLogShaForPath(filePath: string): string | null {
  try {
    // Use execFileSync to avoid shell interpretation of the path argument.
    const out = execFileSync('git', ['log', '-1', '--format=%H', '--', filePath], {
      encoding: 'utf-8',
    }).trim();
    return /^[0-9a-f]{40}$/i.test(out) ? out : null;
  } catch {
    return null;
  }
}

export interface ValidateSourcesOptions {
  /** Repository root (for relative paths). */
  repoRoot: string;
  /** Specific source paths; if omitted, scan the whole tree under `analysis/daily/`. */
  sources?: string[];
  /** Subset of languages; defaults to TRANSLATION_LANGS. */
  langs?: ReadonlyArray<TranslationLang>;
}

export function validateExecutiveBriefSources(opts: ValidateSourcesOptions): ValidationSummary {
  const langs = opts.langs ?? TRANSLATION_LANGS;
  const sourceFiles = opts.sources && opts.sources.length > 0
    ? opts.sources
    : findExecutiveBriefSources(join(opts.repoRoot, 'analysis', 'daily'));

  const sources: SourceValidation[] = [];
  let totalTranslationsExpected = 0;
  let totalTranslationsPresent = 0;
  let totalChecksRun = 0;
  let totalChecksFailed = 0;

  for (const srcAbs of sourceFiles) {
    const srcRel = relative(opts.repoRoot, srcAbs);
    const sourceContent = readFileSync(srcAbs, 'utf-8');
    const sourceSha = gitLogShaForPath(srcRel);
    const dir = dirname(srcAbs);
    const translations: TranslationValidation[] = [];

    for (const lang of langs) {
      const tgtAbs = join(dir, `executive-brief_${lang}.md`);
      const tgtRel = relative(opts.repoRoot, tgtAbs);
      totalTranslationsExpected += 1;
      const exists = existsSync(tgtAbs) && statSync(tgtAbs).size > 0;

      if (!exists) {
        translations.push({
          translationPath: tgtRel,
          lang,
          exists: false,
          checks: [{ check: 'file-exists', passed: false, detail: 'missing or empty' }],
          passed: false,
        });
        totalChecksRun += 1;
        totalChecksFailed += 1;
        continue;
      }

      totalTranslationsPresent += 1;
      const translationContent = readFileSync(tgtAbs, 'utf-8');
      const checks = validateTranslationContent({
        sourceContent,
        translationContent,
        translationPath: tgtRel,
        lang,
        sourceSha,
      });
      const passed = checks.every((c) => c.passed);
      totalChecksRun += checks.length;
      totalChecksFailed += checks.filter((c) => !c.passed).length;
      translations.push({
        translationPath: tgtRel,
        lang,
        exists: true,
        checks,
        passed,
      });
    }

    sources.push({
      sourcePath: srcRel,
      sourceSha,
      translations,
      passed: translations.every((t) => t.passed),
    });
  }

  return {
    totalSources: sources.length,
    totalTranslationsExpected,
    totalTranslationsPresent,
    totalChecksRun,
    totalChecksFailed,
    sources,
  };
}

// Re-export the per-rule helpers + types so callers (tests + the CLI
// shim `scripts/validate-executive-brief-translations.ts`) keep a
// single module surface.
export { countCodeFences } from './counters/code-fences.js';
export { countHeadings } from './counters/headings.js';
export { countMermaidBlocks } from './counters/mermaid-blocks.js';
export { countTableRows } from './counters/table-rows.js';
export { countWords } from './counters/words.js';
export { extractDokIds } from './extractors/dok-ids.js';
export { extractSourceShaMarker, hasRtlMarker } from './extractors/source-sha.js';
export { extractUrls } from './extractors/urls.js';
export { findBannedEnglishPhrases } from './rules/banned-english.js';
export { renderHumanReport } from './render-report.js';
export {
  validateTranslationContent,
  type ValidateTranslationOptions,
} from './validate-translation-content.js';
export { RTL_LANGS, TRANSLATION_LANGS };
export type {
  CheckResult,
  SourceValidation,
  TranslationLang,
  TranslationValidation,
  ValidationSummary,
} from './types.js';
