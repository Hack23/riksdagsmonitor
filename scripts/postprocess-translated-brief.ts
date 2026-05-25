/**
 * @module scripts/postprocess-translated-brief
 * @description
 * Post-processing pass for the news-translate workflow. After Pass-1
 * translation, each `executive-brief_<lang>.md` file's H1 may still
 * carry locale-specific boilerplate (`Exekutiv sammanfattning — `,
 * `Zusammenfassung — `, `执行摘要：…`, …) or a trailing date suffix
 * that the EN-only renderer regex doesn't catch. This helper re-applies
 * the same `cleanArticleTitle` pipeline the renderer uses, so the H1
 * on disk matches what the SERP eventually surfaces — preventing
 * cleanup-only drift PRs and ensuring per-language pages render
 * the same scrubbed title the contract guarantees.
 *
 * Usage:
 *   npx tsx scripts/postprocess-translated-brief.ts \
 *     analysis/daily/2026-05-15/propositions/executive-brief_sv.md
 *
 * Multiple paths may be passed on the command line; each is processed
 * independently. The script exits 0 on success (even when no rewrite
 * is needed) and exits 1 only on an unrecoverable error (file I/O,
 * malformed path).
 *
 * Library exports are pure for unit-testability.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sep as PATH_SEP } from 'node:path';

import { cleanArticleTitle } from './render-lib/aggregator/seo/title.js';
import type { Language } from './types/language.js';

const LANG_CODES: ReadonlySet<Language> = new Set<Language>([
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
]);

/**
 * Parse the language and `daily/<date>/<subfolder>` location from a
 * `analysis/daily/<date>/<subfolder>/executive-brief_<lang>.md` path.
 *
 * Returns `null` for any path that doesn't fit the canonical layout,
 * so the caller can skip non-brief files without crashing.
 */
export function parseBriefPath(filepath: string): { lang: Language; subfolder: string } | null {
  const parts = filepath.split(/[\\/]/).filter(Boolean);
  const filename = parts[parts.length - 1];
  if (!filename) return null;
  const m = filename.match(/^executive-brief_([a-z]{2})\.md$/);
  if (!m) return null;
  const lang = m[1] as Language;
  if (!LANG_CODES.has(lang)) return null;

  // Find the `daily` segment in the path. The subfolder is everything
  // between `daily/<date>/` and the filename — joined with `/`.
  const dailyIdx = parts.lastIndexOf('daily');
  if (dailyIdx < 0 || dailyIdx + 2 >= parts.length - 1) return null;
  const subfolderParts = parts.slice(dailyIdx + 2, parts.length - 1);
  if (subfolderParts.length === 0) return null;
  return { lang, subfolder: subfolderParts.join('/') };
}

/**
 * Apply the post-processing transformation to a brief's markdown body
 * and return both the (possibly rewritten) markdown and the before/after
 * H1 strings. Pure function — no I/O.
 *
 * The transformation only rewrites the H1 line; every other line is
 * passed through verbatim. When `cleanArticleTitle` returns `null`
 * (cleaned title too short, or equal to the subfolder fallback), the
 * original H1 is preserved — the translator's intent wins over the
 * scrubber's veto, since the workflow won't synthesise a BLUF-based
 * replacement post-hoc.
 */
export function postprocessBriefMarkdown(
  markdown: string,
  lang: Language,
  subfolder: string,
): { markdown: string; changed: boolean; originalH1: string | null; cleanedH1: string | null } {
  const lines = markdown.split('\n');
  // The first markdown H1 — skip YAML frontmatter and HTML comments.
  let h1Index = -1;
  let inFrontmatter = false;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (i === 0 && ln.trim() === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (ln.trim() === '---') inFrontmatter = false;
      continue;
    }
    // Skip HTML comments / blank lines at top of body
    if (/^\s*<!--/.test(ln) || ln.trim() === '') continue;
    if (/^#\s+/.test(ln)) {
      h1Index = i;
      break;
    }
    // First non-comment, non-blank, non-H1 line — no H1 to rewrite
    break;
  }

  if (h1Index < 0) {
    return { markdown, changed: false, originalH1: null, cleanedH1: null };
  }

  const originalH1Raw = lines[h1Index];
  const originalH1Text = originalH1Raw.replace(/^#\s+/, '').trim();
  const cleaned = cleanArticleTitle(originalH1Text, subfolder, lang);

  // When cleanArticleTitle returns null OR a string identical to the
  // original (case-sensitive), no rewrite needed.
  if (!cleaned || cleaned === originalH1Text) {
    return { markdown, changed: false, originalH1: originalH1Text, cleanedH1: cleaned };
  }

  lines[h1Index] = `# ${cleaned}`;
  return {
    markdown: lines.join('\n'),
    changed: true,
    originalH1: originalH1Text,
    cleanedH1: cleaned,
  };
}

/**
 * Read a brief file, apply post-processing, and write it back when
 * the H1 changed. Returns the diff result for the caller (CLI or
 * orchestrator) to log.
 */
export function postprocessBriefFile(filepath: string): {
  filepath: string;
  status: 'rewrote' | 'unchanged' | 'skipped' | 'error';
  reason?: string;
  originalH1?: string | null;
  cleanedH1?: string | null;
} {
  if (!existsSync(filepath)) {
    return { filepath, status: 'error', reason: 'file not found' };
  }
  const parsed = parseBriefPath(filepath);
  if (!parsed) {
    return { filepath, status: 'skipped', reason: 'not a canonical executive-brief_<lang>.md path' };
  }
  let raw: string;
  try {
    raw = readFileSync(filepath, 'utf8');
  } catch (e) {
    return { filepath, status: 'error', reason: (e as Error).message };
  }
  const { markdown, changed, originalH1, cleanedH1 } = postprocessBriefMarkdown(
    raw,
    parsed.lang,
    parsed.subfolder,
  );
  if (!changed) {
    return { filepath, status: 'unchanged', originalH1, cleanedH1 };
  }
  try {
    writeFileSync(filepath, markdown);
  } catch (e) {
    return { filepath, status: 'error', reason: (e as Error).message };
  }
  return { filepath, status: 'rewrote', originalH1, cleanedH1 };
}

function isMainModule(): boolean {
  // ES-module entry-point check that doesn't rely on `require.main`.
  if (typeof process === 'undefined' || !process.argv[1]) return false;
  try {
    return fileURLToPath(import.meta.url).split(PATH_SEP).join('/') ===
      process.argv[1].split(PATH_SEP).join('/');
  } catch {
    return false;
  }
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('usage: postprocess-translated-brief.ts <file> [<file> ...]');
    process.exit(2);
  }
  let rewroteAny = false;
  let hadError = false;
  for (const filepath of args) {
    const result = postprocessBriefFile(filepath);
    if (result.status === 'rewrote') {
      rewroteAny = true;
      console.log(
        `✏️  ${result.filepath}\n    H1 was: ${result.originalH1}\n    H1 now: ${result.cleanedH1}`,
      );
    } else if (result.status === 'unchanged') {
      console.log(`✓  ${result.filepath} (H1 already clean)`);
    } else if (result.status === 'skipped') {
      console.log(`⊘  ${result.filepath} (${result.reason})`);
    } else {
      hadError = true;
      console.error(`✗  ${result.filepath}: ${result.reason}`);
    }
  }
  if (hadError) process.exit(1);
  if (!rewroteAny) console.log('\nAll briefs already had a scrubbed H1 — nothing to rewrite.');
}

if (isMainModule()) {
  main();
}
