/**
 * Brief Language Checker — content-side gate for translated executive briefs.
 *
 * Scans every `analysis/daily/<date>/<subfolder>/executive-brief_<lang>.md`
 * file and flags **English-fallback leaks**: the failure mode where the
 * translator silently shipped the English source (or a partial translation
 * with paragraph-level English remnants) inside a non-English brief. Without
 * this gate, a `_sv.md` / `_de.md` / `_fr.md` that is 60 % English text still
 * reaches the renderer and feeds the SEO pipeline a misclassified file —
 * the URL slug says `-de.html` but the page body is English prose.
 *
 * The companion analysis-language linter
 * (`scripts/check-analysis-language.ts`) enforces *English-only* prose in
 * the English source artifacts. This brief-language linter is its inverse:
 * it enforces that translated briefs are *genuinely in their target
 * language* by detecting an unusually high density of unambiguous English
 * function words.
 *
 * **Detection strategy** (mirrors `check-analysis-language.ts`):
 *  1. Strip YAML frontmatter, fenced code blocks, inline code,
 *     blockquote lines (attributed source quotes may stay verbatim),
 *     and `Source title:` / `Källa:` / `Original title:` lines.
 *  2. Tokenise into lowercase Latin words.
 *  3. Count occurrences of an unambiguous **English-marker** set
 *     (`the`, `and`, `that`, `which`, `from`, `with`, …). These tokens are
 *     never valid words in Swedish / German / French / Spanish /
 *     Norwegian / Danish / Finnish / Dutch / Arabic / Hebrew / Japanese /
 *     Korean / Chinese, so an above-threshold density signals an English
 *     fallback leak.
 *  4. A file fails when **both** the density exceeds the per-language
 *     threshold AND the absolute count exceeds the minimum marker floor.
 *
 * The English-source `executive-brief.md` (no language suffix) is never
 * scanned — it is supposed to be English. The validator also skips
 * `pass1/` and `full-text/` subdirectories, matching the analysis-language
 * linter's exclusion list.
 *
 * @module scripts/check-brief-language
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { stripMarkdownCodeAndFrontmatter, tokenizeWords } from './check-analysis-language.js';

// ─────────────────────────────────────────────────────────────────────────
// English-marker dictionary
// ─────────────────────────────────────────────────────────────────────────

/**
 * Unambiguous English function words — closed-class tokens that never
 * appear in normal prose for any of the 13 non-English target languages.
 *
 * Chosen so a translator who forgot to translate a paragraph (or who
 * accidentally pasted the EN source into the target file) is caught at
 * 5–10 % density. The set deliberately excludes ambiguous tokens that
 * legitimately appear as loanwords or proper-noun parts in Swedish /
 * German / Dutch (`bill`, `government`, `parliament`, `report`).
 */
export const ENGLISH_MARKERS: ReadonlySet<string> = new Set([
  // Function words
  'the', 'and', 'that', 'which', 'with', 'from', 'this', 'these', 'those',
  'have', 'has', 'had', 'will', 'would', 'should', 'could', 'about',
  'into', 'than', 'then', 'when', 'where', 'while', 'because', 'although',
  'through', 'between', 'against', 'without', 'within', 'after', 'before',
  'their', 'there', 'they', 'them', 'such', 'each', 'other', 'another',
  'whose', 'whom', 'whether', 'either', 'neither', 'both', 'some', 'any',
  'many', 'much', 'most', 'more', 'less', 'least', 'fewer',
  // Auxiliaries / common verbs
  'been', 'being', 'were', 'was', 'are',
  // Common adverbs / connectives
  'however', 'therefore', 'meanwhile', 'furthermore', 'moreover', 'instead',
  'rather', 'still', 'already', 'always', 'never', 'often', 'usually',
  // Determiners that are unambiguously English (skip `a`/`an` — too short,
  // collide with Swedish `a` letter in tokenisation edge cases)
  'every', 'several', 'enough',
]);

/**
 * Per-language English-marker density threshold. A brief fails when the
 * measured density exceeds this value AND the absolute count exceeds
 * {@link MIN_ENGLISH_MARKERS}.
 *
 * Three per-script buckets, mirroring the per-language SERP budgets in
 * `seo/serp-budgets.ts`:
 *
 *  - **Latin** (`sv`/`da`/`no`/`fi`/`de`/`fr`/`es`/`nl`): 5 % — mirrors
 *    `SWEDISH_DENSITY_THRESHOLD` in `check-analysis-language.ts`.
 *  - **RTL** (`ar`/`he`): 2 % — RTL prose tokenises into the empty Latin
 *    word stream (Arabic / Hebrew script characters are non-Latin), so
 *    *any* Latin English marker is a strong signal of leaked English.
 *    The lower floor catches even a single untranslated sentence in
 *    what should otherwise be a near-zero Latin-word brief.
 *  - **CJK** (`ja`/`ko`/`zh`): 3 % — legitimate English loanwords are
 *    rarer in CJK prose than in Latin scripts, so a single untranslated
 *    paragraph stands out at lower density.
 */
export const ENGLISH_DENSITY_THRESHOLD = 0.05;
export const ENGLISH_DENSITY_THRESHOLD_RTL = 0.02;
export const ENGLISH_DENSITY_THRESHOLD_CJK = 0.03;

/** Minimum absolute English-marker count to trigger a violation. */
export const MIN_ENGLISH_MARKERS = 5;

/** RTL target languages — use the tightest threshold. */
const RTL_LANGS = new Set(['ar', 'he']);

/** CJK target languages — use a tighter threshold than Latin. */
const CJK_LANGS = new Set(['ja', 'ko', 'zh']);

/**
 * Resolve the density threshold for the given target language code.
 * Falls back to the Latin threshold for any unrecognised code so
 * unknown locales never silently bypass the gate.
 */
export function thresholdForLanguage(lang: string): number {
  if (RTL_LANGS.has(lang)) return ENGLISH_DENSITY_THRESHOLD_RTL;
  if (CJK_LANGS.has(lang)) return ENGLISH_DENSITY_THRESHOLD_CJK;
  return ENGLISH_DENSITY_THRESHOLD;
}

// ─────────────────────────────────────────────────────────────────────────
// Density calculation
// ─────────────────────────────────────────────────────────────────────────

export interface EnglishDensity {
  readonly totalWords: number;
  readonly englishMarkerCount: number;
  readonly density: number;
}

/**
 * Calculate English-marker density and count for a Markdown brief.
 * Re-uses the analysis-language linter's strip + tokenise pipeline so
 * blockquotes, code fences, and `Source title:` lines do not skew the
 * measurement.
 */
export function calculateEnglishDensity(markdown: string): EnglishDensity {
  const prose = stripMarkdownCodeAndFrontmatter(markdown);
  const words = tokenizeWords(prose);
  const totalWords = words.length;
  const englishMarkerCount = words.filter((w) => ENGLISH_MARKERS.has(w)).length;
  const density = totalWords > 0 ? englishMarkerCount / totalWords : 0;
  return { totalWords, englishMarkerCount, density };
}

/**
 * Decide whether a brief's measured density crosses the failure threshold
 * for its target language. Returns `true` for a violation.
 */
export function exceedsEnglishThreshold(density: EnglishDensity, lang: string): boolean {
  if (density.englishMarkerCount < MIN_ENGLISH_MARKERS) return false;
  const threshold = thresholdForLanguage(lang);
  return density.density > threshold;
}

// ─────────────────────────────────────────────────────────────────────────
// File discovery
// ─────────────────────────────────────────────────────────────────────────

/**
 * Brief-file metadata captured during the walk so the violation report
 * can render the language code without re-parsing the filename.
 */
export interface BriefFile {
  readonly filepath: string;
  readonly lang: string;
}

const BRIEF_LANG_RE = /^executive-brief_([a-z]{2})\.md$/;

/**
 * Recursively find every `executive-brief_<lang>.md` (translation output)
 * under the given `analysis/daily/` root. Excludes the English source
 * `executive-brief.md`, `pass1/` and `full-text/` subdirectories, matching
 * the exclusion list in `check-analysis-language.ts`.
 */
export function findTranslatedBriefs(dir: string): BriefFile[] {
  const out: BriefFile[] = [];
  function walk(currentDir: string): void {
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'pass1' || entry.name === 'full-text') continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        const m = BRIEF_LANG_RE.exec(entry.name);
        if (m && m[1] !== 'en') out.push({ filepath: fullPath, lang: m[1] });
      }
    }
  }
  walk(dir);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────

export interface BriefLanguageViolation {
  readonly filepath: string;
  readonly relpath: string;
  readonly lang: string;
  readonly totalWords: number;
  readonly englishMarkerCount: number;
  readonly density: number;
}

/** Walk every translated brief under `analysisDir` and collect leaks. */
export function validateBriefLanguages(analysisDir: string): BriefLanguageViolation[] {
  const violations: BriefLanguageViolation[] = [];
  const briefs = findTranslatedBriefs(analysisDir);

  for (const { filepath, lang } of briefs) {
    let markdown: string;
    try {
      markdown = readFileSync(filepath, 'utf8');
    } catch {
      continue;
    }
    const density = calculateEnglishDensity(markdown);
    if (exceedsEnglishThreshold(density, lang)) {
      violations.push({
        filepath,
        relpath: relative(process.cwd(), filepath),
        lang,
        totalWords: density.totalWords,
        englishMarkerCount: density.englishMarkerCount,
        density: density.density,
      });
    }
  }
  return violations;
}

export function formatViolationReport(violations: readonly BriefLanguageViolation[]): string {
  if (violations.length === 0) return '';
  const lines: string[] = [];
  for (const v of violations) {
    lines.push(`• ${v.relpath}  [${v.lang}]`);
    lines.push(
      `    English-marker density: ${(v.density * 100).toFixed(1)}% ` +
        `(${v.englishMarkerCount} markers / ${v.totalWords} words)`,
    );
    lines.push('');
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────

/**
 * CLI entry point.
 *
 * Usage:
 *   npx tsx scripts/check-brief-language.ts [analysis-dir]
 *   npm run check:brief-language -- [analysis-dir]
 *
 * Exit codes:
 *   0 — no English-fallback leaks
 *   1 — one or more translated briefs ship with high English density
 *       (or `analysis-dir` missing)
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const analysisDir = args[0] && args[0].trim().length > 0 ? args[0] : 'analysis/daily';

  try {
    const stats = statSync(analysisDir);
    if (!stats.isDirectory()) {
      console.error(`❌ brief-language: ${analysisDir} is not a directory`);
      process.exit(1);
    }
  } catch {
    console.error(`❌ brief-language: ${analysisDir} does not exist`);
    process.exit(1);
  }

  const violations = validateBriefLanguages(analysisDir);
  const totalChecked = findTranslatedBriefs(analysisDir).length;

  if (violations.length > 0) {
    console.error(
      `❌ brief-language: ${violations.length} English-fallback leak(s) across ${totalChecked} translated brief file(s)\n`,
    );
    console.error(formatViolationReport(violations));
    console.error(
      'Each flagged executive-brief_<lang>.md has too many unambiguous English\n' +
        'function words (the / and / which / with / from / …) for a brief that is\n' +
        'supposed to be entirely in the target language. Re-run the translator on\n' +
        'the offending paragraph(s) and re-validate before commit.',
    );
    process.exit(1);
  }

  console.log(
    `✅ brief-language: 0 leaks across ${totalChecked} translated executive-brief_<lang>.md files`,
  );
  process.exit(0);
}

// Run CLI if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
