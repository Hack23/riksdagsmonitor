#!/usr/bin/env npx tsx
/**
 * Add a `<meta name="description">` to generated API-documentation pages
 * that are missing one.
 *
 * Background
 * ----------
 * The published `docs/api/` directory is a mix of current TypeDoc output
 * (every page already carries a `<meta name="description">`) and a set of
 * **stale, orphaned legacy JSDoc pages** (`<title>JSDoc: …</title>`) that
 * predate the TypeDoc migration. The JSDoc pages have no description tag,
 * are not linked from the current TypeDoc navigation, yet are committed and
 * shipped verbatim by the production deploy (`deploy-s3` copies the
 * repository `docs/` directory straight into `dist/docs/`). SEO crawlers
 * therefore report "The description is missing in the head section of the
 * page" for those pages.
 *
 * This post-processor closes that gap: for every `*.html` page under the
 * target root(s) whose `<head>` lacks a `<meta name="description">`, it
 * derives a concise, page-specific description from the document `<title>`
 * and inserts the tag immediately after the closing `</title>`.
 *
 * Behaviour
 * ---------
 * - **Idempotent** — pages that already declare a description are left
 *   untouched, so it is safe to run repeatedly (e.g. as a deploy safety net).
 * - **Non-destructive** — it only *adds* a single `<meta>` tag; no existing
 *   markup is modified or removed.
 * - Works on both pretty-printed (JSDoc) and minified (TypeDoc) markup.
 *
 * Usage:
 *   npx tsx scripts/fix-docs-meta-description.ts                 # dry-run, scans docs/api
 *   npx tsx scripts/fix-docs-meta-description.ts --write         # apply fixes to docs/api
 *   npx tsx scripts/fix-docs-meta-description.ts --write docs/api dist/docs/api
 *
 * @author Hack23 AB (Quality Engineering)
 * @license Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const WRITE = process.argv.includes('--write');

/** Project / platform name used in the generated descriptions. */
const PLATFORM = 'Riksdagsmonitor Intelligence Platform';

/**
 * Positional CLI arguments (everything that is not a flag) are treated as
 * the documentation root directories to scan. Defaults to `docs/api`.
 */
const TARGET_ROOTS = process.argv
  .slice(2)
  .filter((arg) => !arg.startsWith('--'));
if (TARGET_ROOTS.length === 0) TARGET_ROOTS.push('docs/api');

/** Recursively collect all `.html` files under `dir`. */
function collectHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

/** Escape a string for safe use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Decode the handful of HTML entities that show up in `<title>` text. */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Derive a concise, human-readable meta description from a page `<title>`.
 *
 * Recognises the legacy JSDoc title shapes (`JSDoc: Source: …`,
 * `JSDoc: Module: …`, `JSDoc: Class: …`, `JSDoc: Namespace: …`,
 * `JSDoc: Global`) and falls back to a generic description built from the
 * title text for anything else.
 */
export function deriveDescription(rawTitle: string): string {
  const title = decodeEntities(rawTitle).trim();

  // Strip a leading "JSDoc:" label if present.
  const jsdoc = title.replace(/^JSDoc:\s*/i, '');

  const labelled = /^(Source|Module|Class|Namespace|Interface|Mixin|Tutorial|Event):\s*(.+)$/i.exec(
    jsdoc,
  );
  if (labelled) {
    const kind = labelled[1].toLowerCase();
    const subject = labelled[2].trim();
    if (kind === 'source') {
      return `Annotated source code for ${subject} in the ${PLATFORM} API documentation.`;
    }
    return `API reference for the ${subject} ${kind} in the ${PLATFORM} API documentation.`;
  }

  if (/^Global$/i.test(jsdoc)) {
    return `Global members reference for the ${PLATFORM} API documentation.`;
  }

  // Generic fallback: use the meaningful part of the title (drop a trailing
  // site-name / version suffix such as " | Riksdagsmonitor … - v0.9.40").
  const subject = (jsdoc.split('|')[0] ?? jsdoc).trim() || PLATFORM;
  if (new RegExp(`${PLATFORM}`, 'i').test(subject)) {
    return `API documentation for the ${PLATFORM}.`;
  }
  return `${subject} — ${PLATFORM} API documentation.`;
}

interface FixResult {
  file: string;
  description: string;
}

/**
 * Inject a `<meta name="description">` into a single file when one is
 * missing from its `<head>`. Returns the fix metadata, or `null` if no
 * change was needed.
 */
export function injectDescription(html: string): { html: string; description: string } | null {
  const headEndIdx = html.search(/<\/head>/i);
  const head = headEndIdx === -1 ? html : html.slice(0, headEndIdx);

  // Already has a description meta in the head → nothing to do.
  if (/<meta\s+[^>]*name=["']description["']/i.test(head)) return null;

  const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (!titleMatch) return null;

  const description = deriveDescription(titleMatch[1]);
  const metaTag = `<meta name="description" content="${escapeAttr(description)}">`;

  // Insert immediately after the closing </title>, mirroring the title's
  // own indentation when the markup is pretty-printed.
  const titleEndIdx = titleMatch.index + titleMatch[0].length;
  const lineStart = html.lastIndexOf('\n', titleMatch.index) + 1;
  const indent = /^(\s*)/.exec(html.slice(lineStart, titleMatch.index))?.[1] ?? '';
  const afterTitle = html.slice(titleEndIdx);
  const insertion = /^\s*\n/.test(afterTitle) || afterTitle.startsWith('\n')
    ? `\n${indent}${metaTag}`
    : metaTag;

  const newHtml = html.slice(0, titleEndIdx) + insertion + afterTitle;
  return { html: newHtml, description };
}

function fixFile(filePath: string): FixResult | null {
  const html = fs.readFileSync(filePath, 'utf8');
  const result = injectDescription(html);
  if (!result) return null;
  if (WRITE) fs.writeFileSync(filePath, result.html, 'utf8');
  return { file: path.relative(ROOT, filePath), description: result.description };
}

function main(): void {
  const htmlFiles = TARGET_ROOTS.flatMap((root) =>
    collectHtmlFiles(path.isAbsolute(root) ? root : path.join(ROOT, root)),
  );

  console.log(`Scanning ${htmlFiles.length} HTML file(s) under: ${TARGET_ROOTS.join(', ')}`);
  console.log(`Mode: ${WRITE ? 'WRITE (applying fixes)' : 'DRY-RUN (use --write to apply)'}`);

  const results: FixResult[] = [];
  for (const file of htmlFiles) {
    const result = fixFile(file);
    if (result) results.push(result);
  }

  if (results.length === 0) {
    console.log('\n✅ All scanned pages already declare a <meta name="description">.');
    return;
  }

  console.log(
    `\n${WRITE ? '✅ Added' : '⚠️  Would add'} a meta description to ${results.length} page(s):`,
  );
  for (const r of results.slice(0, 20)) {
    console.log(`  • ${r.file}`);
  }
  if (results.length > 20) console.log(`  … and ${results.length - 20} more`);

  if (!WRITE) console.log('\nRun with --write to apply fixes.');
}

// Only run the CLI when executed directly (not when imported by tests).
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  main();
}
