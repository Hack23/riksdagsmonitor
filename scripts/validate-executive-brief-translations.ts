#!/usr/bin/env node
/**
 * @module Validation/ExecutiveBriefTranslations
 * @category Validation
 *
 * Structural validator for executive-brief Markdown translations produced by
 * `.github/workflows/news-translate.md`.
 *
 * Source contract: `analysis/daily/$DATE/$SUB/executive-brief.md` (English).
 * Translation contract: `analysis/daily/$DATE/$SUB/executive-brief_<lang>.md`
 * for each lang in TRANSLATION_LANGS (13 non-English target languages).
 *
 * The authoritative content rules live in
 * `TRANSLATION_GUIDE.md §Executive Brief Markdown Translations`. This validator
 * enforces the deterministic, machine-checkable subset of those rules:
 *
 *   - file existence per requested language,
 *   - heading-count parity (±0),
 *   - markdown table count + total row count parity (±0),
 *   - fenced-code-block count parity (±0),
 *   - Mermaid fenced-block count parity (±0),
 *   - dok_id reference preservation (set equality, source ⊆ translation),
 *   - external URL preservation (set equality, source ⊆ translation),
 *   - RTL marker present for `ar` / `he`,
 *   - trailing `<!-- source-sha: <40-hex> -->` marker present and well-formed,
 *   - no banned English BLUF phrases in non-English files,
 *   - top-level word count within ±25% of the source.
 *
 * Drift detection uses the deterministic `git log -1 --format=%H -- <source>`
 * signal compared against the `<!-- source-sha: -->` trailer. Filesystem mtimes
 * are NEVER used.
 *
 * Usage:
 *   npx tsx scripts/validate-executive-brief-translations.ts            # scan all sources
 *   npx tsx scripts/validate-executive-brief-translations.ts --source analysis/daily/2026-05-15/propositions/executive-brief.md
 *   npx tsx scripts/validate-executive-brief-translations.ts --json     # machine-readable
 *   npx tsx scripts/validate-executive-brief-translations.ts --soft     # exit 0 even on failure (report only)
 *   npx tsx scripts/validate-executive-brief-translations.ts --lang sv,de  # validate only some langs
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 13 non-English target languages owned by the `news-translate` workflow. */
export const TRANSLATION_LANGS = [
  'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
] as const;
export type TranslationLang = typeof TRANSLATION_LANGS[number];

/** RTL languages requiring a `<!-- dir: rtl -->` marker. */
export const RTL_LANGS: ReadonlyArray<TranslationLang> = ['ar', 'he'];

/** Banned English phrases that must NOT appear in non-English translations. */
const BANNED_ENGLISH_PHRASES: ReadonlyArray<string> = [
  'Executive Brief',
  'BLUF',
  'Bottom-Line-Up-Front',
  'Top Forward Trigger',
  '60-Second Read',
  'Decision-Grade',
];

/** Banned-phrase scan exemptions (phrases that are technical / canonical). */
const BANNED_PHRASE_ALLOWLIST_CONTEXTS: ReadonlyArray<RegExp> = [
  /`Executive Brief`/i, // inline code (canonical reference)
  /\bdok_id\b/i,
  /<!--\s*source-sha:/i,
  /<!--\s*dir:\s*rtl\s*-->/i,
];

export interface CheckResult {
  /** Identifier of the check (e.g. `headings`, `tables`, `urls`). */
  check: string;
  /** Did the check pass? */
  passed: boolean;
  /** Optional human-readable detail used in the report. */
  detail?: string;
}

export interface TranslationValidation {
  /** Path to the translation file relative to the repository root. */
  translationPath: string;
  /** Target language code. */
  lang: TranslationLang;
  /** True if the translation file exists on disk. */
  exists: boolean;
  /** Per-check results. */
  checks: CheckResult[];
  /** Overall pass/fail (every check.passed === true). */
  passed: boolean;
}

export interface SourceValidation {
  /** Path to the source executive-brief.md relative to the repository root. */
  sourcePath: string;
  /** SHA of the most recent commit that touched the source (`git log -1`). */
  sourceSha: string | null;
  /** Validation result per requested language. */
  translations: TranslationValidation[];
  /** Overall pass/fail across every translation. */
  passed: boolean;
}

export interface ValidationSummary {
  totalSources: number;
  totalTranslationsExpected: number;
  totalTranslationsPresent: number;
  totalChecksRun: number;
  totalChecksFailed: number;
  sources: SourceValidation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Structural counters (exported for unit-testing).
// ─────────────────────────────────────────────────────────────────────────────

/** Strip fenced code blocks and HTML comments so other regexes don't false-match inside them. */
function stripFencesAndComments(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** Count `#`-style headings in markdown (any depth). Ignores headings inside fenced blocks. */
export function countHeadings(md: string): number {
  const stripped = stripFencesAndComments(md);
  const lines = stripped.split('\n');
  return lines.filter((l) => /^#{1,6}\s+\S/.test(l)).length;
}

/** Count fenced code blocks (any info string). */
export function countCodeFences(md: string): number {
  const matches = md.match(/^```/gm);
  // Each fence is one of opening/closing; divide by 2.
  return matches ? Math.floor(matches.length / 2) : 0;
}

/** Count Mermaid fenced code blocks specifically. */
export function countMermaidBlocks(md: string): number {
  const matches = md.match(/^```mermaid\b/gm);
  return matches ? matches.length : 0;
}

/** Count Markdown table rows (lines starting with `|` outside fenced blocks). */
export function countTableRows(md: string): number {
  const stripped = stripFencesAndComments(md);
  const lines = stripped.split('\n');
  return lines.filter((l) => /^\s*\|.*\|\s*$/.test(l)).length;
}

/** Extract `dok_id`-style identifiers (e.g. `H901FiU1`, `H8011AU10`, `HA02UU3`). */
export function extractDokIds(md: string): Set<string> {
  const stripped = stripFencesAndComments(md);
  // Riksdag dok_id pattern: starts with H, total length 6–12, letters (mixed case) and digits.
  const matches = stripped.match(/\bH[0-9A-Za-z]{4,11}\b/g) ?? [];
  return new Set(matches);
}

/** Extract bare URLs (https?://...). */
export function extractUrls(md: string): Set<string> {
  // Capture URL inside Markdown link target `(...)` and bare URLs in text.
  const urls = new Set<string>();
  const linkTargets = md.match(/\((https?:\/\/[^\s)]+)\)/g) ?? [];
  for (const t of linkTargets) urls.add(t.slice(1, -1));
  const bare = md.match(/(?<![("])https?:\/\/[^\s)<]+/g) ?? [];
  for (const u of bare) urls.add(u);
  return urls;
}

/** Top-level word count (rough: split on whitespace after stripping fences/comments). */
export function countWords(md: string): number {
  const stripped = stripFencesAndComments(md);
  return stripped.split(/\s+/).filter((w) => /\p{L}|\p{N}/u.test(w)).length;
}

/** Extract the trailing `<!-- source-sha: <40-hex> -->` marker, or null if missing/malformed. */
export function extractSourceShaMarker(md: string): string | null {
  const match = md.match(/<!--\s*source-sha:\s*([0-9a-f]{40})\s*-->/i);
  return match?.[1] ?? null;
}

/** True if the file begins with an RTL marker (allowing optional YAML / blank lines before it). */
export function hasRtlMarker(md: string): boolean {
  return /<!--\s*dir:\s*rtl\s*-->/i.test(md.slice(0, 1024));
}

/** Returns banned English phrases found in `md`, ignoring allowlist contexts. */
export function findBannedEnglishPhrases(md: string): string[] {
  const hits: string[] = [];
  for (const phrase of BANNED_ENGLISH_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (!re.test(md)) continue;
    // Check allowlist contexts on each occurrence.
    const allLines = md.split('\n');
    let stillFound = false;
    for (const line of allLines) {
      if (!re.test(line)) continue;
      const inAllowlist = BANNED_PHRASE_ALLOWLIST_CONTEXTS.some((ctx) => ctx.test(line));
      if (!inAllowlist) {
        stillFound = true;
        break;
      }
    }
    if (stillFound) hits.push(phrase);
  }
  return hits;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-translation validator.
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidateTranslationOptions {
  /** Source executive-brief.md content. */
  sourceContent: string;
  /** Translation file path (used for diagnostic context only). */
  translationPath: string;
  /** Translation file content. May be empty if file doesn't exist. */
  translationContent: string;
  /** Target language code. */
  lang: TranslationLang;
  /** Optional source SHA — when supplied, the trailer must match. */
  sourceSha?: string | null;
}

export function validateTranslationContent(opts: ValidateTranslationOptions): CheckResult[] {
  const { sourceContent, translationContent, lang, sourceSha } = opts;
  const checks: CheckResult[] = [];

  // 1. Heading parity
  const srcHeadings = countHeadings(sourceContent);
  const tgtHeadings = countHeadings(translationContent);
  checks.push({
    check: 'heading-count',
    passed: srcHeadings === tgtHeadings,
    detail: srcHeadings === tgtHeadings
      ? `${tgtHeadings}`
      : `source=${srcHeadings} translation=${tgtHeadings}`,
  });

  // 2. Table-row parity
  const srcRows = countTableRows(sourceContent);
  const tgtRows = countTableRows(translationContent);
  checks.push({
    check: 'table-row-count',
    passed: srcRows === tgtRows,
    detail: srcRows === tgtRows
      ? `${tgtRows}`
      : `source=${srcRows} translation=${tgtRows}`,
  });

  // 3. Code-fence parity
  const srcFences = countCodeFences(sourceContent);
  const tgtFences = countCodeFences(translationContent);
  checks.push({
    check: 'code-fence-count',
    passed: srcFences === tgtFences,
    detail: srcFences === tgtFences
      ? `${tgtFences}`
      : `source=${srcFences} translation=${tgtFences}`,
  });

  // 4. Mermaid-block parity
  const srcMermaid = countMermaidBlocks(sourceContent);
  const tgtMermaid = countMermaidBlocks(translationContent);
  checks.push({
    check: 'mermaid-block-count',
    passed: srcMermaid === tgtMermaid,
    detail: srcMermaid === tgtMermaid
      ? `${tgtMermaid}`
      : `source=${srcMermaid} translation=${tgtMermaid}`,
  });

  // 5. dok_id preservation (source ⊆ translation)
  const srcDokIds = extractDokIds(sourceContent);
  const tgtDokIds = extractDokIds(translationContent);
  const missingDokIds = [...srcDokIds].filter((id) => !tgtDokIds.has(id));
  checks.push({
    check: 'dok-id-preservation',
    passed: missingDokIds.length === 0,
    detail: missingDokIds.length === 0
      ? `${srcDokIds.size} preserved`
      : `missing: ${missingDokIds.join(', ')}`,
  });

  // 6. URL preservation (source ⊆ translation)
  const srcUrls = extractUrls(sourceContent);
  const tgtUrls = extractUrls(translationContent);
  const missingUrls = [...srcUrls].filter((u) => !tgtUrls.has(u));
  checks.push({
    check: 'url-preservation',
    passed: missingUrls.length === 0,
    detail: missingUrls.length === 0
      ? `${srcUrls.size} preserved`
      : `missing ${missingUrls.length} of ${srcUrls.size}`,
  });

  // 7. RTL marker (ar / he only)
  if (RTL_LANGS.includes(lang)) {
    const rtlOk = hasRtlMarker(translationContent);
    checks.push({
      check: 'rtl-marker',
      passed: rtlOk,
      detail: rtlOk ? 'present' : 'missing `<!-- dir: rtl -->` marker',
    });
  }

  // 8. source-sha trailer
  const trailerSha = extractSourceShaMarker(translationContent);
  if (sourceSha === null || sourceSha === undefined) {
    checks.push({
      check: 'source-sha-marker',
      passed: trailerSha !== null,
      detail: trailerSha ? 'present' : 'missing `<!-- source-sha: -->` trailer',
    });
  } else {
    const shaMatches = trailerSha === sourceSha;
    checks.push({
      check: 'source-sha-marker',
      passed: shaMatches,
      detail: !trailerSha
        ? 'missing `<!-- source-sha: -->` trailer'
        : shaMatches
          ? 'matches source'
          : `stale (trailer=${trailerSha.slice(0, 8)} source=${sourceSha.slice(0, 8)})`,
    });
  }

  // 9. Banned English phrases (non-EN files)
  const banned = findBannedEnglishPhrases(translationContent);
  checks.push({
    check: 'no-banned-english',
    passed: banned.length === 0,
    detail: banned.length === 0 ? 'clean' : `found: ${banned.join(', ')}`,
  });

  // 10. Word-count drift (±25%)
  const srcWords = countWords(sourceContent);
  const tgtWords = countWords(translationContent);
  const tolerance = 0.25;
  const lowerBound = Math.floor(srcWords * (1 - tolerance));
  const upperBound = Math.ceil(srcWords * (1 + tolerance));
  const inBounds = tgtWords >= lowerBound && tgtWords <= upperBound;
  checks.push({
    check: 'word-count-drift',
    passed: inBounds,
    detail: inBounds
      ? `${tgtWords} words (source=${srcWords})`
      : `${tgtWords} words outside [${lowerBound}, ${upperBound}] (source=${srcWords})`,
  });

  return checks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filesystem walker + CLI.
// ─────────────────────────────────────────────────────────────────────────────

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
export function gitLogShaForPath(path: string): string | null {
  try {
    const out = execSync(`git log -1 --format=%H -- ${JSON.stringify(path)}`, {
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

function renderHumanReport(summary: ValidationSummary): string {
  const lines: string[] = [];
  lines.push(`Executive-brief translation validator`);
  lines.push(`─────────────────────────────────────`);
  lines.push(`Sources scanned:           ${summary.totalSources}`);
  lines.push(`Translations expected:     ${summary.totalTranslationsExpected}`);
  lines.push(`Translations present:      ${summary.totalTranslationsPresent}`);
  lines.push(`Translations missing:      ${summary.totalTranslationsExpected - summary.totalTranslationsPresent}`);
  lines.push(`Checks run:                ${summary.totalChecksRun}`);
  lines.push(`Checks failed:             ${summary.totalChecksFailed}`);
  lines.push('');

  for (const src of summary.sources) {
    const failedT = src.translations.filter((t) => !t.passed);
    if (failedT.length === 0) {
      lines.push(`✅ ${src.sourcePath} — all ${src.translations.length} translation(s) valid`);
      continue;
    }
    lines.push(`❌ ${src.sourcePath} (sha=${src.sourceSha?.slice(0, 8) ?? 'unknown'})`);
    for (const t of failedT) {
      lines.push(`    └─ ${t.lang}: ${t.exists ? 'invalid' : 'MISSING'} — ${t.translationPath}`);
      for (const c of t.checks.filter((x) => !x.passed)) {
        lines.push(`        ✗ ${c.check}${c.detail ? ` — ${c.detail}` : ''}`);
      }
    }
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry point.
// ─────────────────────────────────────────────────────────────────────────────

/* istanbul ignore next */
function parseArgs(argv: string[]): {
  jsonOut: boolean;
  soft: boolean;
  sources: string[];
  langs: ReadonlyArray<TranslationLang>;
} {
  const out = {
    jsonOut: false,
    soft: false,
    sources: [] as string[],
    langs: TRANSLATION_LANGS as ReadonlyArray<TranslationLang>,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.jsonOut = true;
    else if (a === '--soft') out.soft = true;
    else if (a === '--source' && argv[i + 1]) {
      out.sources.push(argv[++i]);
    } else if (a === '--lang' && argv[i + 1]) {
      const list = argv[++i].split(',').map((s) => s.trim()) as TranslationLang[];
      for (const l of list) {
        if (!TRANSLATION_LANGS.includes(l)) {
          console.error(`Unknown language code: ${l}`);
          process.exit(2);
        }
      }
      out.langs = list;
    } else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: npx tsx scripts/validate-executive-brief-translations.ts [options]\n' +
        '  --source <path>   Validate a single executive-brief.md (repeatable).\n' +
        '  --lang sv,de,...  Restrict to a subset of target languages.\n' +
        '  --json            Emit JSON summary on stdout.\n' +
        '  --soft            Exit 0 even when checks fail (report only).',
      );
      process.exit(0);
    }
  }
  return out;
}

/* istanbul ignore next */
if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? '')) {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const summary = validateExecutiveBriefSources({
    repoRoot,
    sources: args.sources.map((p) => resolve(repoRoot, p)),
    langs: args.langs,
  });

  if (args.jsonOut) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  } else {
    console.log(renderHumanReport(summary));
  }

  const failed = summary.totalChecksFailed > 0
    || summary.totalTranslationsPresent < summary.totalTranslationsExpected;
  if (failed && !args.soft) {
    process.exit(1);
  }
  process.exit(0);
}
