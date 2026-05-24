/**
 * Headline Quality Checker — content-side editorial gate for `executive-brief.md` H1s
 *
 * Catches editorial defects in the H1 line of every
 * `analysis/daily/<date>/<subfolder>/executive-brief.md` *before* the SEO
 * composer in `scripts/render-lib/article-seo.ts` is asked to clean and
 * truncate it. The render pipeline's `cleanArticleTitle` is a best-effort
 * cosmetic strip (it removes `Executive Brief — …` prefixes and trailing
 * ISO dates); this validator instead enforces the content contract at
 * source so the editorial team is forced to fix bad headlines rather than
 * relying on the renderer to silently paper over them.
 *
 * The four rules enforced (one violation per H1 line, multiple rules can
 * fire on the same H1):
 *
 *   A. **Untranslated Swedish in EN H1** — definite-form party names
 *      (`Socialdemokraterna`, `Moderaterna`, …) and other un-localized
 *      Swedish nouns leak into English headlines. Proper nouns
 *      `Riksdagen`/`Regeringen`/`Riksmöte` are explicitly allowed (they
 *      are valid English-prose loanwords per the per-folder methodology;
 *      see `scripts/check-analysis-language.ts` comments).
 *   B. **Weekday-date prefix** — `Thursday 21 May 2026 closes with…`
 *      style calendar prefixes are tautological (the article URL slug
 *      and front-matter `date:` field already encode the date).
 *   C. **ISO date leading/trailing** — `2026-05-21 …` or `… — 2026-05-21`
 *      style file-system slugs masquerading as headlines.
 *   D. **Boilerplate scaffolding leftover** — `Executive Brief — `,
 *      `Realtime Monitor — `, `Pass 2`, `Methodology Reflection`, etc.
 *      These are intended for the brief's *file* heading, never the
 *      shipped article H1.
 *
 * The validator walks every `analysis/daily/<date>/<subfolder>/executive-brief.md`
 * (the English source from which all 14 locales are translated). Rules A-D
 * apply to the EN brief only; translated `executive-brief_<lang>.md`
 * variants are *not* scanned because Swedish loanwords are legitimate in
 * `executive-brief_sv.md`, etc.
 *
 * @module scripts/check-headline-quality
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────
// Rule A — Untranslated Swedish in EN H1
// ─────────────────────────────────────────────────────────────────────────

/**
 * Swedish tokens that *must not* appear in an English news H1. Lower-cased
 * for case-insensitive matching against tokenised H1 words. Limited to a
 * focused subset so the rule is high-precision:
 *
 *  - Definite-form party names (Swedish convention adds `-na`/`-erna`):
 *    `Socialdemokraterna` → `Social Democrats`.
 *  - Untranslated common nouns regularly seen in our daily briefs:
 *    `propositionen`, `utskottet`, `svarsdatum`, `näringsutskottet`, etc.
 *  - Tidö-coalition slugs left in their Swedish form:
 *    `Tidöavtalet` (the agreement) / `Tidöregeringen` (the cabinet).
 *
 * Explicitly *not* listed (allowed in EN headlines):
 *  - `Riksdag`, `Riksdagen`, `Regeringen`, `Riksmöte` — convention loans.
 *  - Party *abbreviations* (`S`, `M`, `SD`, `KD`, …) — single letters.
 *  - Person names (`Kristersson`, `Andersson`, …) — proper nouns.
 *  - Bill / proposition IDs (`HD03267`, `prop. 2025/26:267`).
 */
export const SWEDISH_HEADLINE_TOKENS = new Set<string>([
  // Definite-form party names — translate to English forms
  'socialdemokraterna',
  'moderaterna',
  'sverigedemokraterna',
  'kristdemokraterna',
  'centerpartiet',
  'liberalerna',
  'miljöpartiet',
  'vänsterpartiet',
  // Untranslated political-vocabulary nouns
  'propositionen',
  'utskottet',
  'näringsutskottet',
  'finansutskottet',
  'justitieutskottet',
  'socialutskottet',
  'arbetsmarknadsutskottet',
  'konstitutionsutskottet',
  'svarsdatum',
  'lagrådsremiss',
  'lagrådsremissen',
  'kommittédirektiv',
  'kommittédirektivet',
  // Tidö coalition slugs — translate to "Tidö coalition" / "Tidö government"
  'tidöavtalet',
  'tidöregeringen',
  // Common Swedish function words — never valid in EN
  'och',
  'att',
  'för',
  'inte',
  'enligt',
  'samt',
  'genom',
]);

/** Detect any token from {@link SWEDISH_HEADLINE_TOKENS} in the H1 text. */
export function findSwedishHeadlineTokens(h1: string): string[] {
  const matches = h1.toLowerCase().match(/[a-zåäöéü]+/g);
  if (!matches) return [];
  const hits = new Set<string>();
  for (const tok of matches) {
    if (SWEDISH_HEADLINE_TOKENS.has(tok)) hits.add(tok);
  }
  return Array.from(hits).sort();
}

// ─────────────────────────────────────────────────────────────────────────
// Rule B — Weekday-date prefix
// ─────────────────────────────────────────────────────────────────────────

/**
 * Match calendar prefixes like `Thursday 21 May 2026 …` /
 * `Mon 4 Nov 2024 …` at the start of an H1. We don't enumerate full
 * day-month names in a single huge regex — instead we require the
 * sequence (weekday name) (digit-day) (month name) (4-digit year),
 * which is precise enough to avoid false positives on legitimate
 * headlines like "Monday morning briefing".
 */
const WEEKDAY_RE =
  /^(?:Mon|Monday|Tue|Tuesday|Wed|Wednesday|Thu|Thursday|Fri|Friday|Sat|Saturday|Sun|Sunday)\b/i;
const MONTH_RE =
  /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\b/i;

export function hasWeekdayDatePrefix(h1: string): boolean {
  if (!WEEKDAY_RE.test(h1)) return false;
  // After the weekday, look for a number + month name + 4-digit year within
  // the first ~40 characters; this is the calendar-prefix signature.
  const head = h1.slice(0, 50);
  return /\b\d{1,2}\b/.test(head) && MONTH_RE.test(head) && /\b(?:19|20)\d{2}\b/.test(head);
}

// ─────────────────────────────────────────────────────────────────────────
// Rule C — ISO-date leading / trailing
// ─────────────────────────────────────────────────────────────────────────

const ISO_DATE_LEADING_RE = /^\d{4}-\d{2}-\d{2}\b/;
// Trailing ISO date at the end of the H1, with an optional `—/–/-/:`
// separator before it. The optional-separator form deliberately also
// matches a plain " 2026-05-21" suffix (whitespace only), which is the
// most common file-slug-as-headline antipattern in our archive.
const ISO_DATE_TRAILING_RE = /(?:^|[\s\-–—:])\d{4}-\d{2}-\d{2}\s*$/;

export function hasIsoDateAffix(h1: string): { leading: boolean; trailing: boolean } {
  return {
    leading: ISO_DATE_LEADING_RE.test(h1),
    trailing: ISO_DATE_TRAILING_RE.test(h1),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Rule D — Boilerplate scaffolding leftover
// ─────────────────────────────────────────────────────────────────────────

/**
 * Boilerplate H1 prefixes that signal the headline still carries the
 * brief's scaffolding instead of an editorial title. The renderer's
 * `cleanArticleTitle` strips these post-hoc; the editorial contract is
 * that the source brief should not contain them in the first place.
 *
 * Note: `Executive Brief — …` is the *default* scaffolding emitted by
 * older brief templates; the new contract is that the H1 should be a
 * real headline ("Sweden Abolishes Permanent Residence …") with the
 * `Executive Brief` label living in a separate `## Executive Brief`
 * section header below.
 */
const BOILERPLATE_PREFIXES: ReadonlyArray<{ readonly label: string; readonly re: RegExp }> = [
  { label: 'Executive Brief', re: /^\s*(?:[#📋📰🎯⚡🧭]\s*)*executive\s+brief\b/iu },
  { label: 'Realtime Monitor', re: /^\s*(?:[#📋📰🎯⚡🧭]\s*)*realtime\s+monitor\b/iu },
  { label: 'Methodology Reflection', re: /^\s*methodology\s+reflection\b/i },
  { label: 'Pass 1', re: /^\s*pass\s*1\b/i },
  { label: 'Pass 2', re: /^\s*pass\s*2\b/i },
  { label: 'Daily Brief', re: /^\s*daily\s+brief\b/i },
];

export function findBoilerplatePrefixes(h1: string): string[] {
  const hits: string[] = [];
  for (const { label, re } of BOILERPLATE_PREFIXES) {
    if (re.test(h1)) hits.push(label);
  }
  return hits;
}

// ─────────────────────────────────────────────────────────────────────────
// H1 extraction
// ─────────────────────────────────────────────────────────────────────────

/**
 * Pull the first `# …` H1 line out of the brief body. Skips YAML
 * frontmatter (the leading `---\n…\n---` block) before scanning so a
 * YAML key with `# inline comment` markers can't mislead the
 * extractor. Returns `null` if no H1 is found.
 */
export function extractH1(markdown: string): string | null {
  // Strip YAML frontmatter (anchored at start of file only — never
  // multiline, otherwise a body `---` thematic break would swallow prose).
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const m = body.match(/^# +(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

// ─────────────────────────────────────────────────────────────────────────
// File discovery
// ─────────────────────────────────────────────────────────────────────────

/**
 * Recursively find every `executive-brief.md` (English source) under the
 * given `analysis/daily/` root. Excludes:
 *  - `executive-brief_<lang>.md` (translation outputs — Swedish loans OK)
 *  - `pass1/` and `full-text/` subdirectories
 */
export function findEnglishBriefs(dir: string): string[] {
  const out: string[] = [];
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
      } else if (entry.isFile() && entry.name === 'executive-brief.md') {
        out.push(fullPath);
      }
    }
  }
  walk(dir);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────

export interface HeadlineViolation {
  readonly filepath: string;
  readonly relpath: string;
  readonly h1: string;
  /** Each rule firing produces one entry, e.g. `'rule-A: Socialdemokraterna'`. */
  readonly issues: ReadonlyArray<string>;
}

/**
 * Validate a single H1 string against the four headline-quality rules.
 * Pure function — exported for unit testing without filesystem I/O.
 */
export function validateH1(h1: string): string[] {
  const issues: string[] = [];

  // Rule A — Swedish-in-EN tokens
  const swedishHits = findSwedishHeadlineTokens(h1);
  if (swedishHits.length > 0) {
    issues.push(`rule-A (Swedish-in-EN H1): ${swedishHits.join(', ')}`);
  }

  // Rule B — Weekday-date prefix
  if (hasWeekdayDatePrefix(h1)) {
    issues.push('rule-B (weekday-date prefix): H1 begins with "Weekday DD Month YYYY …"');
  }

  // Rule C — ISO date leading / trailing
  const iso = hasIsoDateAffix(h1);
  if (iso.leading) {
    issues.push('rule-C (ISO-date leading): H1 begins with a YYYY-MM-DD slug');
  }
  if (iso.trailing) {
    issues.push('rule-C (ISO-date trailing): H1 ends with " — YYYY-MM-DD"');
  }

  // Rule D — Boilerplate scaffolding leftover
  const boilerplate = findBoilerplatePrefixes(h1);
  if (boilerplate.length > 0) {
    issues.push(`rule-D (boilerplate prefix): ${boilerplate.join(', ')}`);
  }

  return issues;
}

/** Walk every English brief under `analysisDir` and collect H1 violations. */
export function validateHeadlines(analysisDir: string): HeadlineViolation[] {
  const violations: HeadlineViolation[] = [];
  const briefs = findEnglishBriefs(analysisDir);

  for (const filepath of briefs) {
    let markdown: string;
    try {
      markdown = readFileSync(filepath, 'utf8');
    } catch {
      continue;
    }
    const h1 = extractH1(markdown);
    if (!h1) continue;
    const issues = validateH1(h1);
    if (issues.length > 0) {
      violations.push({
        filepath,
        relpath: relative(process.cwd(), filepath),
        h1,
        issues,
      });
    }
  }
  return violations;
}

export function formatViolationReport(violations: HeadlineViolation[]): string {
  if (violations.length === 0) return '';
  const lines: string[] = [];
  for (const v of violations) {
    lines.push(`• ${v.relpath}`);
    lines.push(`    H1: ${v.h1}`);
    for (const issue of v.issues) {
      lines.push(`    - ${issue}`);
    }
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
 *   npx tsx scripts/check-headline-quality.ts [analysis-dir]
 *   npm run check:headline-quality -- [analysis-dir]
 *
 * Exit codes:
 *   0 — no violations
 *   1 — one or more H1s failed at least one rule (or `analysis-dir` missing)
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const analysisDir = args[0] && args[0].trim().length > 0 ? args[0] : 'analysis/daily';

  try {
    const stats = statSync(analysisDir);
    if (!stats.isDirectory()) {
      console.error(`❌ headline-quality: ${analysisDir} is not a directory`);
      process.exit(1);
    }
  } catch {
    console.error(`❌ headline-quality: ${analysisDir} does not exist`);
    process.exit(1);
  }

  const violations = validateHeadlines(analysisDir);
  const totalChecked = findEnglishBriefs(analysisDir).length;

  if (violations.length > 0) {
    console.error(
      `❌ headline-quality: ${violations.length} violation(s) across ${totalChecked} executive-brief.md file(s)\n`,
    );
    console.error(formatViolationReport(violations));
    console.error(
      'Fix the editorial issues in the source executive-brief.md H1 line(s).\n' +
        'Rules:\n' +
        '  A — translate Swedish tokens (Socialdemokraterna → Social Democrats)\n' +
        '  B — drop weekday-date prefixes (URL slug + frontmatter `date:` already encode this)\n' +
        '  C — drop ISO-date leading/trailing slugs (not headlines)\n' +
        '  D — drop scaffolding prefixes (Executive Brief — / Realtime Monitor — / Pass 2 / …)',
    );
    process.exit(1);
  }

  console.log(`✅ headline-quality: 0 violations across ${totalChecked} executive-brief.md files`);
  process.exit(0);
}

// Run CLI if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
