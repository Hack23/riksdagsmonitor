/**
 * Test Suite for Agentic Workflow Bash and Shell Safety
 *
 * Enforces the bash-pattern blocklist documented in
 * .github/prompts/01-bash-and-shell-safety.md. The gh-aw AWF sandbox
 * rejects matching commands at runtime; each rejection costs ~30-60 s of
 * agent wall-time (per the safety prompt) and can push a news run past
 * the safeoutputs MCP idle window. The cheapest mitigation is to keep
 * the patterns out of the prompt surface in the first place.
 *
 * Scope of files validated (the surface the agent reads at runtime):
 *   - .github/workflows/news-*.md  -- workflow source bodies
 *   - .github/prompts/ *.md        -- bounded-context prompt modules
 *   - .github/skills/ ** /SKILL.md -- skill bodies copied into context
 *
 * The safety doc itself (01-bash-and-shell-safety.md) is the ONE file
 * permitted to mention the banned patterns -- it documents them in
 * markdown tables so the agent can recognise and rewrite them. Every
 * other file must use the documented allowed eval replacements
 * (arrays, case, or explicit branches, or pre-captured variables).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.join(__dirname, '..');
const WORKFLOWS_DIR = path.join(REPO_ROOT, '.github', 'workflows');
const PROMPTS_DIR = path.join(REPO_ROOT, '.github', 'prompts');
const SKILLS_DIR = path.join(REPO_ROOT, '.github', 'skills');

/** The single file allowed to demonstrate banned patterns (table cells). */
const SAFETY_DOC = '01-bash-and-shell-safety.md';

/** A banned bash pattern, with the safe rewrite suggested by the safety doc. */
interface BannedPattern {
  readonly id: string;
  readonly description: string;
  /** Regex tested against each line of every fenced bash code block. */
  readonly regex: RegExp;
  /** The allowed eval replacement the safety doc points to. */
  readonly safeRewrite: string;
}

/**
 * The blocklist -- kept in sync with the table in
 * .github/prompts/01-bash-and-shell-safety.md (Banned expansion patterns).
 */
const BANNED_PATTERNS: readonly BannedPattern[] = [
  {
    id: 'parameter-transformation',
    description: 'parameter transformations: ${var@P}, @Q, @E, @A, @a',
    regex: /\$\{[A-Za-z_][A-Za-z0-9_]*@[PQEAa]\}/,
    safeRewrite: 'printf %s "$var"  or plain "$var"',
  },
  {
    id: 'indirect-expansion',
    description: '${!var} indirect expansion',
    regex: /\$\{!\w/,
    safeRewrite: 'declare -A MAP; ... echo "${MAP[$key]}"',
  },
  {
    id: 'nested-cmd-substitution',
    description: 'Nested $(...$(...)...) command substitution (incl. inside $((...)))',
    // Match any $( or $(( whose body contains another $( before its first
    // closing ) -- the staged-injection shape rejected by the AWF sandbox.
    regex: /\$\(\(?[^)]*\$\(/,
    safeRewrite: 'inner=$(cmd2); outer=$(cmd1 "$inner")',
  },
  {
    id: 'eval-on-variable',
    description: 'eval, bash -c "$var", or source /dev/stdin <<<"$var"',
    // Match eval followed by a string- or variable-bearing argument.
    // Eval on plain-literal flag-only invocations is also banned in our
    // workflows -- there is no safe eval use in this repo.
    regex:
      /(^|[^A-Za-z_./])(eval\s+["'$\\]|bash\s+-c\s+["'][^"']*\$|source\s+\/dev\/stdin)/,
    safeRewrite: 'arrays, case, or explicit branches -- never eval',
  },
];

/**
 * Recursively collect every *.md file under dir.
 */
function listMarkdown(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMarkdown(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Extract every fenced code block from a markdown source. We treat
 * bash, sh, shell, console, and unspecified fences as shell-bearing --
 * the AWF sandbox does not look at the language tag, only at the
 * resulting command string the agent constructs.
 */
function extractShellBlocks(source: string): { startLine: number; body: string }[] {
  const lines = source.split('\n');
  const blocks: { startLine: number; body: string }[] = [];
  let inBlock = false;
  let lang = '';
  let bodyStart = 0;
  let bodyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const fenceMatch = line.match(/^```([A-Za-z0-9_+-]*)\s*$/);
    if (fenceMatch) {
      if (!inBlock) {
        inBlock = true;
        lang = (fenceMatch[1] ?? '').toLowerCase();
        bodyStart = i + 1;
        bodyLines = [];
      } else {
        if (lang === '' || ['bash', 'sh', 'shell', 'console', 'zsh'].includes(lang)) {
          blocks.push({ startLine: bodyStart + 1, body: bodyLines.join('\n') });
        }
        inBlock = false;
        lang = '';
      }
      continue;
    }
    if (inBlock) bodyLines.push(line);
  }
  return blocks;
}

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly content: string;
  readonly pattern: BannedPattern;
}

function scanFile(file: string): Violation[] {
  const source = fs.readFileSync(file, 'utf-8');
  const blocks = extractShellBlocks(source);
  const violations: Violation[] = [];
  for (const block of blocks) {
    const blockLines = block.body.split('\n');
    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i] ?? '';
      // Comments inside bash blocks are inert — skip them so we don't
      // flag rewrite hints that intentionally name the banned shape.
      if (/^\s*#/.test(line)) continue;
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.regex.test(line)) {
          violations.push({
            file: path.relative(REPO_ROOT, file),
            line: block.startLine + i,
            content: line.trim(),
            pattern,
          });
        }
      }
    }
  }
  return violations;
}

function formatViolations(violations: readonly Violation[]): string {
  return violations
    .map(
      (v) =>
        `  ${v.file}:${v.line}\n    pattern: ${v.pattern.id} — ${v.pattern.description}\n    line:    ${v.content}\n    safe:    ${v.pattern.safeRewrite}`,
    )
    .join('\n\n');
}

const FILES_TO_SCAN: readonly string[] = [
  ...fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.startsWith('news-') && f.endsWith('.md'))
    .map((f) => path.join(WORKFLOWS_DIR, f)),
  ...fs
    .readdirSync(PROMPTS_DIR)
    .filter((f) => f.endsWith('.md') && f !== SAFETY_DOC)
    .map((f) => path.join(PROMPTS_DIR, f)),
  ...listMarkdown(SKILLS_DIR),
];

describe('Agentic Workflow Bash & Shell Safety', () => {
  describe('Banned bash patterns are absent from agent-visible prompt surface', () => {
    it('the safety doc itself exists and is the only allowlisted source of pattern strings', () => {
      const safetyPath = path.join(PROMPTS_DIR, SAFETY_DOC);
      expect(fs.existsSync(safetyPath)).toBe(true);
      const safety = fs.readFileSync(safetyPath, 'utf-8');
      // The doc must list every banned pattern by name so future agents
      // can recognise them. If any of these strings disappear, the
      // blocklist documentation has drifted from this test.
      expect(safety).toMatch(/\$\{var@P\}/);
      expect(safety).toMatch(/\$\{!var\}/);
      expect(safety).toMatch(/Nested .*\$\(/);
      expect(safety).toMatch(/\beval\b/);
    });

    for (const file of FILES_TO_SCAN) {
      const rel = path.relative(REPO_ROOT, file);
      it(`${rel} contains no banned bash patterns in fenced code blocks`, () => {
        const violations = scanFile(file);
        if (violations.length > 0) {
          throw new Error(
            `Banned bash pattern(s) found in ${rel}:\n\n${formatViolations(violations)}\n\n` +
              `Fix using the documented safe rewrite — see ` +
              `.github/prompts/01-bash-and-shell-safety.md §Banned expansion patterns.`,
          );
        }
        expect(violations).toHaveLength(0);
      });
    }
  });

  describe('Allowed eval replacements are documented and self-consistent', () => {
    it('safety doc still names the three allowed eval replacements', () => {
      const safety = fs.readFileSync(path.join(PROMPTS_DIR, SAFETY_DOC), 'utf-8');
      // The safety doc resolves every `eval`-like usage into one of
      // these three shapes. If the canonical wording drifts, update
      // both the doc AND this test in the same PR.
      const evalRow = safety
        .split('\n')
        .find((l) => /\beval\b/.test(l) && /Never required/i.test(l));
      expect(evalRow, 'eval row missing from safety doc table').toBeDefined();
      expect(evalRow).toMatch(/arrays/i);
      expect(evalRow).toMatch(/case/i);
      expect(evalRow).toMatch(/explicit branches/i);
    });

    it('no agent-visible file authorises a fourth eval-replacement shape', () => {
      // Defence-in-depth: catch a future PR that introduces a new
      // "use eval like this instead" snippet. We allow `eval` only
      // inside the safety doc; everywhere else its mere presence in
      // a code block is a regression caught by the per-file test
      // above. This test is a redundant outer guard so the failure
      // message names the policy explicitly when it fires.
      const offenders: string[] = [];
      for (const file of FILES_TO_SCAN) {
        const blocks = extractShellBlocks(fs.readFileSync(file, 'utf-8'));
        for (const block of blocks) {
          if (/(^|[^A-Za-z_./])eval\s+/.test(block.body)) {
            offenders.push(path.relative(REPO_ROOT, file));
            break;
          }
        }
      }
      expect(offenders, `eval usage outside the safety doc: ${offenders.join(', ')}`).toEqual([]);
    });
  });
});
