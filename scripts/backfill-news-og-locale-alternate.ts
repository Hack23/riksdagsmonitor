/**
 * @module Infrastructure/Scripts/BackfillNewsOgLocaleAlternate
 * @category SEO / Open Graph
 * @name Backfill `og:locale:alternate` tags on news/*.html files
 *
 * @description
 * Idempotent, pure-string backfill that injects the 13
 * `<meta property="og:locale:alternate" content="...">` tags directly
 * after the existing `<meta property="og:locale" content="...">` tag in
 * every `news/**.html` file that is missing them.
 *
 * **Why this script exists**
 * - About half of the news articles on disk (those produced by the older
 *   hand-authored breaking-news template, the daily news workflows, and
 *   the translation pipeline) ship a single `og:locale` tag and zero
 *   `og:locale:alternate` siblings. This breaks cross-language sharing
 *   on Facebook / LinkedIn / WhatsApp, which use the alternate locale
 *   list to surface the correct language version to readers.
 * - The renderer in `scripts/render-lib/chrome/head.ts` already emits all
 *   13 alternates for newly rendered articles; this script aligns the
 *   pre-rendered files with that contract without re-running the entire
 *   news pipeline.
 *
 * **Idempotency contract**
 * 1. If the file already contains *any* `og:locale:alternate` tag, the
 *    file is left untouched.
 * 2. If the file has no `og:locale` tag at all, it is left untouched
 *    (the renderer has not yet emitted the canonical block — a backfill
 *    here would corrupt the head).
 * 3. Otherwise: insert the 13 sibling `og:locale:alternate` tags
 *    immediately after the existing `og:locale` tag, preserving the
 *    surrounding indentation pattern.
 *
 * **Detection**
 * The current language is detected from the `og:locale` `content`
 * attribute (e.g. `ja_JP`) → mapped back to the BCP-47 primary subtag
 * (`ja`) via the inverse `OG_LOCALE` lookup table.
 *
 * **Invocation**
 *   tsx scripts/backfill-news-og-locale-alternate.ts            # full backfill
 *   tsx scripts/backfill-news-og-locale-alternate.ts --dry-run  # report only
 *   tsx scripts/backfill-news-og-locale-alternate.ts --check    # exit-1 if missing
 *
 * @author Hack23 AB (Frontend / SEO)
 * @license Apache-2.0
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Type & lookup tables ──────────────────────────────────────────────────

export type Language =
  | 'en' | 'sv' | 'da' | 'no' | 'fi' | 'de' | 'fr' | 'es'
  | 'nl' | 'ar' | 'he' | 'ja' | 'ko' | 'zh';

export const OG_LOCALE: Readonly<Record<Language, string>> = {
  en: 'en_US', sv: 'sv_SE', da: 'da_DK', no: 'nb_NO', fi: 'fi_FI',
  de: 'de_DE', fr: 'fr_FR', es: 'es_ES', nl: 'nl_NL', ar: 'ar_SA',
  he: 'he_IL', ja: 'ja_JP', ko: 'ko_KR', zh: 'zh_CN',
};

export const ALL_LANGS: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
];

/**
 * Inverse lookup: `og:locale` content value (e.g. `ja_JP`) → primary
 * BCP-47 subtag (`ja`). Generated once at module load.
 */
const OG_LOCALE_TO_LANG: Readonly<Record<string, Language>> = (() => {
  const out: Record<string, Language> = {};
  for (const l of ALL_LANGS) out[OG_LOCALE[l]] = l;
  return out;
})();

/**
 * Match the *single-tag* `<meta property="og:locale" content="xx_YY">`
 * line. Capture group 1 = leading whitespace (preserved), group 2 = the
 * locale content (used to map back to the BCP-47 primary subtag).
 *
 * The regex is deliberately tolerant of single/double quotes and varying
 * inner-attribute whitespace so it matches both the renderer output and
 * the older hand-authored breaking-news template.
 */
const OG_LOCALE_LINE =
  /^([ \t]*)<meta\s+property\s*=\s*["']og:locale["']\s+content\s*=\s*["']([^"']+)["']\s*\/?>\s*$/m;

/** Match *any* `og:locale:alternate` tag (used for the idempotency guard). */
const OG_LOCALE_ALTERNATE_ANY = /<meta\s+property\s*=\s*["']og:locale:alternate["']/i;

// ─── Public API ────────────────────────────────────────────────────────────

export interface BackfillResult {
  readonly path: string;
  readonly action: 'updated' | 'skipped-already-complete' | 'skipped-no-og-locale' | 'skipped-unknown-locale';
  readonly lang?: Language;
}

/**
 * Backfill a single HTML string. Pure function — does not touch the
 * filesystem. Returns the (possibly unchanged) HTML plus an action tag
 * describing what happened.
 *
 * Contract:
 * - If the input already contains any `og:locale:alternate` tag → no-op.
 * - If no `og:locale` tag is present → no-op (we never invent one).
 * - Otherwise we insert the 13 sibling alternate tags directly after the
 *   existing `og:locale`, using the same leading whitespace so the head
 *   block stays visually tidy.
 */
export function backfillHtml(html: string): { html: string; action: BackfillResult['action']; lang?: Language } {
  if (OG_LOCALE_ALTERNATE_ANY.test(html)) {
    return { html, action: 'skipped-already-complete' };
  }
  const match = OG_LOCALE_LINE.exec(html);
  if (!match) {
    return { html, action: 'skipped-no-og-locale' };
  }
  const [fullLine, leadingWs, localeValue] = match;
  const lang = OG_LOCALE_TO_LANG[localeValue];
  if (!lang) {
    return { html, action: 'skipped-unknown-locale' };
  }
  const alternates = ALL_LANGS
    .filter((l) => l !== lang)
    .map((l) => `${leadingWs}<meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`)
    .join('\n');
  const next = html.replace(fullLine, `${fullLine}\n${alternates}`);
  return { html: next, action: 'updated', lang };
}

/**
 * List every `news/*.html` file (non-recursive — the news directory is
 * already flat in this repo, plus a single `news/2026/` archive subtree
 * which we explicitly include so older indexes are not left behind).
 */
export async function listNewsFiles(repoRoot: string): Promise<string[]> {
  const newsDir = path.join(repoRoot, 'news');
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: import('node:fs').Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        out.push(full);
      }
    }
  }
  await walk(newsDir);
  return out.sort();
}

export interface RunOptions {
  readonly dryRun?: boolean;
  readonly check?: boolean;
}

export interface RunSummary {
  readonly total: number;
  readonly updated: number;
  readonly skippedAlreadyComplete: number;
  readonly skippedNoOgLocale: number;
  readonly skippedUnknownLocale: number;
}

/**
 * Run the backfill across every news/*.html file under `repoRoot`.
 *
 * - `dryRun: true` → don't write any files; still returns a full summary.
 * - `check: true`  → after the dry-run pass, exit-1 if any file still
 *                    has `skipped-no-og-locale` (used by CI as a guard).
 *
 * Exit semantics (when invoked as CLI):
 *   0 — no files needed an update, or all updates succeeded
 *   1 — `--check` and at least one file is missing the og:locale tag
 */
export async function runBackfill(repoRoot: string, opts: RunOptions = {}): Promise<RunSummary> {
  const files = await listNewsFiles(repoRoot);
  let updated = 0;
  let alreadyComplete = 0;
  let noOgLocale = 0;
  let unknownLocale = 0;
  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    const result = backfillHtml(html);
    switch (result.action) {
      case 'updated':
        if (!opts.dryRun) {
          await fs.writeFile(file, result.html, 'utf8');
        }
        updated++;
        break;
      case 'skipped-already-complete':
        alreadyComplete++;
        break;
      case 'skipped-no-og-locale':
        noOgLocale++;
        break;
      case 'skipped-unknown-locale':
        unknownLocale++;
        break;
    }
  }
  return {
    total: files.length,
    updated,
    skippedAlreadyComplete: alreadyComplete,
    skippedNoOgLocale: noOgLocale,
    skippedUnknownLocale: unknownLocale,
  };
}

// ─── CLI entry point ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run') || args.has('--check');
  const check = args.has('--check');
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  const summary = await runBackfill(repoRoot, { dryRun });

  console.log('=== news/*.html og:locale:alternate backfill ===');
  console.log(`  total files scanned:           ${summary.total}`);
  console.log(`  updated:                       ${summary.updated}${dryRun ? ' (dry-run — no write)' : ''}`);
  console.log(`  skipped (already complete):    ${summary.skippedAlreadyComplete}`);
  console.log(`  skipped (no og:locale tag):    ${summary.skippedNoOgLocale}`);
  console.log(`  skipped (unknown locale):      ${summary.skippedUnknownLocale}`);

  if (check && summary.updated > 0) {
    console.error(
      `\n✘ ${summary.updated} news file(s) are missing og:locale:alternate tags.`,
    );
    console.error('  Run: tsx scripts/backfill-news-og-locale-alternate.ts');
    process.exit(1);
  }
}

// Only run when invoked directly (not when imported by tests).
if (
  typeof process !== 'undefined' &&
  typeof import.meta !== 'undefined' &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
