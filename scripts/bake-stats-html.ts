/**
 * @module Build/BakeStatsHtml
 * @category Build / Performance Optimization
 *
 * @description
 * Replaces every `<span ... data-stat-id="stat-…">PLACEHOLDER</span>` in
 * the targeted HTML files (default: `dist/index*.html`) with the real
 * value parsed from `cia-data/extraction_summary_report.csv`.
 *
 * Eliminates the runtime CSV fetch + DOM-rewrite that the browser
 * stats-loader (`src/browser/dashboards/stats-loader.ts`) otherwise
 * performs on every navigation to a start page. The stat values shift
 * on a multi-day cadence (the CSV is re-pushed by an upstream CIA
 * pipeline), so baking at deploy time is correct: every deploy carries
 * the same values the runtime fetch would have produced, but without
 * the network round-trip, PapaParse path, or DOM mutation cost.
 *
 * Rationale (perf):
 *   - The start pages otherwise pay ≈ 15 KiB CSV + parse + N DOM writes
 *     just to render numbers that are already known at build time.
 *   - Removing this eager work shaves TBT and lets the browser focus
 *     on FCP/LCP rendering of the hero banner.
 *
 * The mapping (`STAT_MAPPINGS`) MUST stay in sync with the browser
 * stats-loader so that pages that are NOT baked (e.g. `dashboards/*`)
 * still display identical values through the runtime path. The test
 * `tests/bake-stats-html.test.ts` enforces parity by importing both
 * symbol tables and asserting equality.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

/**
 * Keep this identical to `STAT_MAPPINGS` in
 * `src/browser/dashboards/stats-loader.ts`. The test
 * `tests/bake-stats-html.test.ts` enforces parity.
 */
export const STAT_MAPPINGS: Readonly<Record<string, string>> = {
  // Hero stats
  'stat-historical-persons': 'person_data',
  'stat-total-votes': 'view_riksdagen_vote_data_ballot_politician_summary',
  'stat-total-documents': 'document_data',
  'stat-rule-violations': 'rule_violation',
  'stat-government-proposals': 'view_riksdagen_goverment_proposals',
  'stat-committee-decisions': 'view_riksdagen_committee_decisions',

  // Intelligence section stats
  'stat-committee-documents': 'view_riksdagen_committee_decision_type_summary',
  'stat-document-activities': 'view_riksdagen_document_type_daily_summary',
  'stat-riksdag-parties': 'view_riksdagen_party',
  'stat-against-proposals': 'view_riksdagen_vote_data_ballot_summary',
  'stat-committee-proposals':
    'view_riksdagen_committee_decision_type_org_summary',
  'stat-government-roles': 'view_riksdagen_goverment_roles',
  'stat-government-role-members': 'view_riksdagen_goverment_role_member',
  'stat-member-proposals': 'view_riksdagen_person_signed_document_summary',
  'stat-committee-role-members': 'view_riksdagen_committee_role_member',
  'stat-party-members': 'view_riksdagen_party_member',
  'stat-party-summary': 'view_riksdagen_party_summary',
  'stat-ballot-summaries': 'view_riksdagen_vote_data_ballot_party_summary',
  'stat-political-parties': 'sweden_political_party',
  'stat-assignments': 'assignment_data',
  'stat-document-attachments': 'document_attachment',
};

interface ExtractionRow {
  object_name: string;
  status: string;
  row_count: string;
}

/**
 * Tiny CSV parser scoped to the extraction-summary file. We do not
 * import PapaParse here because the file has no quoted fields, and
 * this keeps the script with zero runtime dependencies (besides Node).
 */
function parseCsv(text: string): ExtractionRow[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const out: ExtractionRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw) continue;
    const cells = raw.split(',');
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (cells[j] ?? '').trim();
    }
    out.push(row as unknown as ExtractionRow);
  }
  return out;
}

/**
 * Build the `stat-id → display-string` lookup from a CSV file. Numbers
 * are formatted with `en-US` thousands separators so the rendered
 * output matches what the browser stats-loader produces via
 * `Number.toLocaleString()` on the index pages (which use `lang="en"`
 * and language-neutral hero markup). Localised index files (`_sv`,
 * `_de`, …) share the same digits — only surrounding labels differ.
 */
export function buildStatLookup(csvText: string): Record<string, string> {
  const rows = parseCsv(csvText);
  const byObject: Record<string, number> = {};
  for (const row of rows) {
    if (row.status !== 'success') continue;
    const n = Number(row.row_count);
    if (!Number.isFinite(n)) continue;
    byObject[row.object_name] = n;
  }
  const out: Record<string, string> = {};
  for (const [statId, objectName] of Object.entries(STAT_MAPPINGS)) {
    const value = byObject[objectName];
    if (typeof value === 'number') {
      out[statId] = value.toLocaleString('en-US');
    }
  }
  return out;
}

/**
 * Rewrite every `<span … data-stat-id="X">…</span>` whose `X` has a
 * baked value. Untouched ids (no CSV value, or no mapping) are left as
 * placeholders so the runtime path on non-baked pages still has work
 * to do — i.e. this script is purely subtractive on baked pages.
 *
 * @returns the rewritten HTML and the number of substitutions made.
 */
export function bakeHtml(
  html: string,
  lookup: Record<string, string>,
): { html: string; replaced: number } {
  // Match a span with `data-stat-id="<id>"` (attribute order tolerant)
  // and a single text-node child. The trailing `</span>` is captured
  // separately so we do not accidentally span across nested markup.
  const spanRe =
    /(<span\b[^>]*\bdata-stat-id="(stat-[a-z][a-z0-9-]*)"[^>]*>)([^<]*)(<\/span>)/gi;
  let replaced = 0;
  const rewritten = html.replace(spanRe, (full, open, statId, _inner, close) => {
    const value = lookup[statId];
    if (value === undefined) return full;
    replaced++;
    return `${open}${value}${close}`;
  });
  return { html: rewritten, replaced };
}

interface BakeOptions {
  /** Directory containing the HTML files to bake (default: `dist`). */
  distDir: string;
  /** Path to the extraction-summary CSV (default: `cia-data/extraction_summary_report.csv`). */
  csvPath: string;
  /** Glob-equivalent filter for files inside `distDir`. */
  filter?: (relPath: string) => boolean;
}

/** Default scope: every hand-authored `index*.html` at the dist root. */
function defaultFilter(rel: string): boolean {
  return /^index(_[a-z]{2,3})?\.html$/i.test(rel);
}

export function bakeStatsHtml(opts: BakeOptions): {
  files: { path: string; replaced: number }[];
  totalReplaced: number;
} {
  if (!fs.existsSync(opts.csvPath)) {
    throw new Error(`bake-stats-html: CSV not found at ${opts.csvPath}`);
  }
  const csvText = fs.readFileSync(opts.csvPath, 'utf8');
  const lookup = buildStatLookup(csvText);
  if (Object.keys(lookup).length === 0) {
    throw new Error(
      `bake-stats-html: 0 stat values built from ${opts.csvPath} — refusing to deploy with empty placeholders`,
    );
  }

  const filter = opts.filter ?? defaultFilter;
  const entries = fs.readdirSync(opts.distDir);
  const results: { path: string; replaced: number }[] = [];
  let totalReplaced = 0;
  for (const name of entries) {
    if (!filter(name)) continue;
    const full = path.join(opts.distDir, name);
    if (!fs.statSync(full).isFile()) continue;
    const before = fs.readFileSync(full, 'utf8');
    const { html: after, replaced } = bakeHtml(before, lookup);
    if (replaced > 0 && after !== before) {
      fs.writeFileSync(full, after);
    }
    results.push({ path: name, replaced });
    totalReplaced += replaced;
  }
  return { files: results, totalReplaced };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  const distDir = process.argv[2] || 'dist';
  const csvPath =
    process.argv[3] || path.join('cia-data', 'extraction_summary_report.csv');
  if (!fs.existsSync(distDir)) {
    console.error(`bake-stats-html: dist directory not found at ${distDir}`);
    process.exit(1);
  }
  const { files, totalReplaced } = bakeStatsHtml({ distDir, csvPath });
  for (const f of files) {
    console.log(`  ${f.path}: replaced ${f.replaced} stat span(s)`);
  }
  console.log(
    `✓ bake-stats-html: ${totalReplaced} substitution(s) across ${files.length} file(s) (${distDir})`,
  );
  if (totalReplaced === 0) {
    console.error(
      `bake-stats-html: no substitutions made — placeholders still rely on runtime fetch. Failing build.`,
    );
    process.exit(1);
  }
}
