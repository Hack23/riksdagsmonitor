/**
 * Shared helpers for reading agentic workflow content **together with**
 * the bounded-context prompt modules it imports.
 *
 * As of 2026-04 all news workflows in `.github/workflows/news-*.md` are
 * modularised: shared rules (bash safety, MCP access, data download,
 * analysis pipeline, analysis gate, article generation, commit & PR)
 * live in `.github/prompts/00-*.md … 07-*.md` and are pulled in via
 * the YAML `imports:` list in each workflow frontmatter. A prompt-level
 * rule can therefore be satisfied by either the workflow body **or**
 * any imported module.
 *
 * Tests that need to validate the *effective* prompt an agent sees
 * should use {@link readWorkflowWithImports} rather than a plain
 * `fs.readFileSync()` on the workflow file alone.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

/**
 * Extract the raw YAML frontmatter block from a workflow `.md` file
 * (everything between the opening and closing `---` markers).
 * Returns an empty string if no valid frontmatter block is found.
 */
export function extractFrontmatter(content: string): string {
  const lines = content.split('\n');
  const start = lines.indexOf('---');
  if (start === -1) return '';
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') return lines.slice(start + 1, i).join('\n');
  }
  return '';
}

/**
 * Parse the list of import paths declared under the top-level `imports:`
 * key of a workflow frontmatter. Each list item is resolved relative to
 * the workflow's own directory (so `../prompts/02-mcp-access.md` is
 * resolved against `.github/workflows/`).
 */
export function parseImports(frontmatter: string, workflowDir: string): string[] {
  const lines = frontmatter.split('\n');
  const startIdx = lines.findIndex((l) => /^imports\s*:/.test(l));
  if (startIdx === -1) return [];

  const out: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    // Leave the imports block as soon as we hit another top-level key.
    if (/^[A-Za-z_-][^\s:]*\s*:/.test(line)) break;
    const match = line.match(/^\s*-\s+(.+?)\s*$/);
    if (!match) continue;
    const rel = match[1]!.replace(/^["']|["']$/g, '');
    out.push(path.resolve(workflowDir, rel));
  }
  return out;
}

/**
 * Read the body of a workflow `.md` file **plus** the bodies of every
 * prompt module it imports, joined by newlines. The returned string is
 * the effective prompt surface the agent will see at run-time.
 *
 * Missing import targets are silently skipped (a separate structural
 * test asserts that every import resolves to a real file on disk).
 */
export function readWorkflowWithImports(filepath: string): string {
  const content = fs.readFileSync(filepath, 'utf-8');
  const frontmatter = extractFrontmatter(content);
  const imports = parseImports(frontmatter, path.dirname(filepath));
  const parts: string[] = [content];
  for (const importPath of imports) {
    if (fs.existsSync(importPath)) {
      parts.push(fs.readFileSync(importPath, 'utf-8'));
    }
  }
  return parts.join('\n');
}
