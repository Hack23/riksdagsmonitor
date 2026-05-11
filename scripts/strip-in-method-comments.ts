/**
 * @module Scripts/StripInMethodComments
 * @description Removes leading, trailing and free-standing comments that live
 * **inside** function/method/arrow/constructor/accessor bodies, while preserving
 * comments that document declarations and any directive comments needed by the
 * tooling chain (ESLint, TypeScript, coverage, bundlers, license headers).
 *
 * Rules:
 * - Strip block and line comments whose range falls inside
 *   any function/method/constructor/get/set/arrow body block.
 * - Preserve directive comments anywhere:
 *   `eslint-`, `@ts-`, `prettier-ignore`, `c8 ignore`, `istanbul ignore`,
 *   `webpackIgnore`, `vite-ignore`, `__PURE__`, `@vite-`, `@license`,
 *   `@preserve`, `@copyright`, `@cc_on`.
 * - Always preserve top-level JSDoc anywhere — they document
 *   declarations, never live inside method bodies under our codebase rules.
 *
 * Usage:
 *   npx tsx scripts/strip-in-method-comments.ts [--check] [--quiet] [paths…]
 *
 * With no paths, defaults to `src/browser` and `scripts` (recursively),
 * skipping tests, generated artefacts, vendor `js/lib`, dashboard stubs and
 * declaration files.
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';
import ts from 'typescript';

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname);

const DEFAULT_ROOTS = ['src/browser', 'scripts'];

const SKIP_PATH_PATTERNS = [
  /\bnode_modules\b/,
  /\bdist\b/,
  /\bbuilds\b/,
  /\bcoverage\b/,
  /\bapi\b\//,
  /\.test\.[mc]?[jt]sx?$/,
  /\.spec\.[mc]?[jt]sx?$/,
  /\.d\.ts$/,
  /\bjs\/lib\b/,
  /scripts\/coalition-dashboard(\.|\/)/,
  /scripts\/committees-dashboard(\.|\/)/,
  /scripts\/back-to-top\.ts$/,
  /scripts\/strip-in-method-comments\.ts$/,
  /scripts\/generate-types-from-cia-schemas\.ts$/,
  /scripts\/generate-article-types-doc\.ts$/,
];

const PRESERVE_DIRECTIVES = [
  'eslint-',
  '@ts-',
  'prettier-ignore',
  'c8 ignore',
  'istanbul ignore',
  'webpackIgnore',
  'vite-ignore',
  '__PURE__',
  '@vite-',
  '@license',
  '@preserve',
  '@copyright',
  '@cc_on',
];

interface BodyRange {
  readonly start: number;
  readonly end: number;
}

/**
 * Determine if a comment must be preserved regardless of its position.
 *
 * @param text - Full comment text including delimiters.
 * @returns `true` when the comment is a JSDoc block, a license header or a
 *   recognised tooling directive.
 */
function shouldPreserveComment(text: string): boolean {
  if (text.startsWith('/**')) return true;
  for (const marker of PRESERVE_DIRECTIVES) {
    if (text.includes(marker)) return true;
  }
  return false;
}

/**
 * Collect the byte ranges of every function/method/arrow/constructor/accessor
 * body in a source file.
 *
 * @param source - Parsed TypeScript source file.
 * @returns Sorted, possibly overlapping body ranges.
 */
function collectBodyRanges(source: ts.SourceFile): BodyRange[] {
  const ranges: BodyRange[] = [];
  const visit = (node: ts.Node): void => {
    let body: ts.Node | undefined;
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)
    ) {
      body = node.body;
    } else if (ts.isArrowFunction(node)) {
      body = ts.isBlock(node.body) ? node.body : undefined;
    }
    if (body && ts.isBlock(body)) {
      ranges.push({ start: body.getStart(source) + 1, end: body.getEnd() - 1 });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return ranges;
}

/**
 * Check whether a comment range is covered by any method body range.
 *
 * @param ranges - Body ranges from `collectBodyRanges`.
 * @param pos - Comment start offset.
 * @param end - Comment end offset.
 * @returns `true` when the comment lies fully inside at least one body range.
 */
function isInsideBody(ranges: readonly BodyRange[], pos: number, end: number): boolean {
  for (const r of ranges) {
    if (pos >= r.start && end <= r.end) return true;
  }
  return false;
}

interface CommentToRemove {
  readonly pos: number;
  readonly end: number;
  readonly kind: ts.CommentKind;
}

/**
 * Walk every token-leading and token-trailing comment in the file and
 * collect those that should be removed.
 *
 * @param source - Parsed TypeScript source file.
 * @param bodyRanges - Body ranges where comments are considered in-method.
 * @returns Comment ranges sorted descending so removals from the source string
 *   do not shift the indices of pending removals.
 */
function collectInMethodComments(source: ts.SourceFile, bodyRanges: readonly BodyRange[]): CommentToRemove[] {
  const text = source.text;
  const seen = new Set<string>();
  const removals: CommentToRemove[] = [];

  const handle = (pos: number, end: number, kind: ts.CommentKind): void => {
    const key = `${pos}:${end}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (!isInsideBody(bodyRanges, pos, end)) return;
    const commentText = text.slice(pos, end);
    if (shouldPreserveComment(commentText)) return;
    removals.push({ pos, end, kind });
  };

  const visit = (node: ts.Node): void => {
    const leading = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
    for (const c of leading) handle(c.pos, c.end, c.kind);
    const trailing = ts.getTrailingCommentRanges(text, node.getEnd()) ?? [];
    for (const c of trailing) handle(c.pos, c.end, c.kind);
    if (ts.isBlock(node) && node.statements.length > 0) {
      const tail = ts.getLeadingCommentRanges(text, node.statements.end) ?? [];
      for (const c of tail) handle(c.pos, c.end, c.kind);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  removals.sort((a, b) => b.pos - a.pos);
  return removals;
}

/**
 * Remove a single comment from the source text. Strips the trailing newline of
 * line comments and any leading whitespace/newline-only run preceding a
 * stand-alone block comment so the file does not accumulate blank lines.
 */
function spliceComment(text: string, removal: CommentToRemove): string {
  let end = removal.end;
  let start = removal.pos;
  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') {
    const ch = text[lineStart - 1];
    if (ch !== ' ' && ch !== '\t') break;
    lineStart -= 1;
  }
  const onOwnLine = lineStart === 0 || text[lineStart - 1] === '\n';
  if (onOwnLine) {
    start = lineStart;
    if (text[end] === '\n') end += 1;
  } else if (removal.kind === ts.SyntaxKind.SingleLineCommentTrivia) {
    // Trailing line-comment on a code line — strip preceding spaces/tabs so the
    // surviving line does not have dangling whitespace, but keep the newline.
    while (start > lineStart && (text[start - 1] === ' ' || text[start - 1] === '\t')) {
      start -= 1;
    }
  }
  return text.slice(0, start) + text.slice(end);
}

/**
 * Process a single file: parse, collect in-method comments, splice them out,
 * collapse runs of blank lines and write the result if changed.
 *
 * @returns `true` when the file content changed.
 */
function processFile(filePath: string, opts: { check: boolean; quiet: boolean }): boolean {
  const original = readFileSync(filePath, 'utf8');
  const source = ts.createSourceFile(filePath, original, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const bodyRanges = collectBodyRanges(source);
  if (bodyRanges.length === 0) return false;
  const removals = collectInMethodComments(source, bodyRanges);
  if (removals.length === 0) return false;

  let updated = original;
  for (const r of removals) updated = spliceComment(updated, r);
  updated = updated.replace(/\n{3,}/g, '\n\n');

  if (updated === original) return false;
  if (!opts.check) writeFileSync(filePath, updated, 'utf8');
  if (!opts.quiet) {
    const rel = relative(REPO_ROOT, filePath);
    console.log(`${opts.check ? '[would-strip]' : '[stripped]'} ${rel} (${removals.length} comment(s))`);
  }
  return true;
}

/**
 * Recursively gather candidate `.ts` / `.js` files for stripping.
 */
function* walk(dir: string): Iterable<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (SKIP_PATH_PATTERNS.some((re) => re.test(full))) continue;
      yield* walk(full);
      continue;
    }
    const ext = extname(full);
    if (ext !== '.ts' && ext !== '.js' && ext !== '.mjs' && ext !== '.cjs') continue;
    if (SKIP_PATH_PATTERNS.some((re) => re.test(full))) continue;
    yield full;
  }
}

/**
 * CLI entry point.
 */
function main(): void {
  const argv = process.argv.slice(2);
  const opts = {
    check: argv.includes('--check'),
    quiet: argv.includes('--quiet'),
  };
  const explicit = argv.filter((a) => !a.startsWith('--'));
  const roots = explicit.length > 0 ? explicit : DEFAULT_ROOTS;

  let total = 0;
  let changed = 0;
  for (const root of roots) {
    for (const file of walk(resolve(REPO_ROOT, root))) {
      total += 1;
      if (processFile(file, opts)) changed += 1;
    }
  }

  if (!opts.quiet) {
    console.log(`\nScanned ${total} file(s); ${opts.check ? 'would change' : 'changed'} ${changed}.`);
  }
  if (opts.check && changed > 0) process.exit(1);
}

main();
