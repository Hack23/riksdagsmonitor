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
// ─────────────────────────────────────────────────────────────────────────
// H1 discovery
// ─────────────────────────────────────────────────────────────────────────

/**
 * Lines that wrap the title without being the title themselves.
 * Translator output for RTL languages frequently leads with
 * `<div dir="rtl">` so the rendered HTML aligns correctly; centered or
 * attributed brief layouts use `<center>` / `<section>` / `<header>`;
 * some templates emit a `<figure>` with a hero image before the title.
 * These wrapper tags must be skipped so the scanner can reach the real
 * heading instead of bailing out on the first non-`#` line.
 */
const HTML_WRAPPER_TAG_RE =
  /^\s*<\/?(?:div|center|section|article|main|header|figure|figcaption|p|aside|nav)\b[^>]*\/?>\s*$/i;

/** Standalone image lines — HTML `<img>` or Markdown `![alt](src)` form. */
const IMAGE_LINE_RE = /^\s*(?:<img\b[^>]*\/?>|!\[[^\]]*\]\([^)]+\)(?:\s*\{[^}]*\})?)\s*$/i;

/** Markdown H1 (`# Title`). */
const MARKDOWN_H1_RE = /^#\s+/;

/** Same-line HTML H1: `<h1 ...>Title</h1>`. */
const HTML_H1_INLINE_RE = /^\s*<h1\b[^>]*>([\s\S]*?)<\/h1>\s*$/i;

/** Opening `<h1>` tag at line start (multi-line H1). */
const HTML_H1_OPEN_RE = /^\s*<h1\b[^>]*>(.*)$/i;

/** Closing `</h1>` tag (multi-line H1). */
const HTML_H1_CLOSE_RE = /^(.*?)<\/h1>\s*$/i;

interface H1Match {
  /** First line of the heading block (inclusive). */
  readonly startLine: number;
  /** Last line of the heading block (inclusive). */
  readonly endLine: number;
  /** Heading kind: markdown `#` form or HTML `<h1>` form. */
  readonly kind: 'markdown' | 'html';
  /** Heading inner text with any nested HTML tags stripped. */
  readonly text: string;
}

/** Strip nested HTML tags from a fragment captured inside an `<h1>`. */
function stripInnerTags(text: string): string {
  // Apply repeatedly to prevent incomplete sanitization (CWE-20/CWE-80):
  // nested or malformed sequences like `<<b>script>` could survive a
  // single pass.
  let prev: string;
  let result = text;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  return result.trim();
}

/**
 * Locate the body H1 (markdown `#` form OR HTML `<h1>` form), skipping
 * YAML frontmatter, HTML comments, blank lines, leading wrapper tags
 * (`<div dir="rtl">`, `<center>`, `<section>`, …) and standalone
 * image lines. Returns `null` when no H1 is present in the document.
 */
function findBodyH1(lines: readonly string[]): H1Match | null {
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
    // Skip blank lines, HTML comments, wrapper tags, and standalone images.
    if (
      ln.trim() === '' ||
      /^\s*<!--/.test(ln) ||
      HTML_WRAPPER_TAG_RE.test(ln) ||
      IMAGE_LINE_RE.test(ln)
    ) {
      continue;
    }
    // Markdown H1
    if (MARKDOWN_H1_RE.test(ln)) {
      const text = ln.replace(MARKDOWN_H1_RE, '').trim();
      return { startLine: i, endLine: i, kind: 'markdown', text };
    }
    // Inline HTML H1 — `<h1 ...>Title</h1>` on one line.
    const inline = HTML_H1_INLINE_RE.exec(ln);
    if (inline) {
      return { startLine: i, endLine: i, kind: 'html', text: stripInnerTags(inline[1]) };
    }
    // Multi-line HTML H1 — opening `<h1>` here, closing `</h1>` later.
    const open = HTML_H1_OPEN_RE.exec(ln);
    if (open) {
      // Gather inner text across subsequent lines until the closing tag.
      const parts: string[] = [open[1]];
      for (let j = i + 1; j < lines.length; j++) {
        const inner = lines[j];
        const close = HTML_H1_CLOSE_RE.exec(inner);
        if (close) {
          parts.push(close[1]);
          return {
            startLine: i,
            endLine: j,
            kind: 'html',
            text: stripInnerTags(parts.join(' ')),
          };
        }
        parts.push(inner);
      }
      // Unterminated `<h1>` — treat as no-match and let downstream
      // markdown validation surface the malformed input.
      return null;
    }
    // First content line is neither a wrapper, image, nor a heading —
    // the document has no H1 we can safely rewrite.
    return null;
  }
  return null;
}

export function postprocessBriefMarkdown(
  markdown: string,
  lang: Language,
  subfolder: string,
): { markdown: string; changed: boolean; originalH1: string | null; cleanedH1: string | null } {
  const lines = markdown.split('\n');
  const match = findBodyH1(lines);

  if (!match) {
    return { markdown, changed: false, originalH1: null, cleanedH1: null };
  }

  const originalH1Text = match.text;
  const cleaned = cleanArticleTitle(originalH1Text, subfolder, lang);

  // When cleanArticleTitle returns null OR a string identical to the
  // original (case-sensitive), no rewrite needed.
  if (!cleaned || cleaned === originalH1Text) {
    return { markdown, changed: false, originalH1: originalH1Text, cleanedH1: cleaned };
  }

  // Rewrite the heading block in place. For markdown form we replace a
  // single line; for HTML form we collapse the whole `<h1>...</h1>`
  // block into a normalised single-line markdown `# ` heading so the
  // downstream renderer's title-extraction logic (which expects
  // markdown H1s) keeps working uniformly across languages.
  const before = lines.slice(0, match.startLine);
  const after = lines.slice(match.endLine + 1);
  const newLines = [...before, `# ${cleaned}`, ...after];

  return {
    markdown: newLines.join('\n'),
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
