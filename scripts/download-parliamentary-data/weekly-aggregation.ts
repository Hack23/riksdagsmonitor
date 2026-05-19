/**
 * @module download-parliamentary-data/weekly-aggregation
 * @description Weekly aggregation pipeline — reads the daily manifest files
 * for an ISO week, aggregates the per-day document counts, and writes a
 * summary Markdown to `analysis/weekly/{YYYY-WNN}/weekly-data-summary.md`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isDateInIsoWeek, parseIsoWeekLabel } from './rm-helpers.js';
import { formatTimestampForMarkdown } from './manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ANALYSIS_DIR = path.join(REPO_ROOT, 'analysis');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/** Render the weekly summary Markdown body. Pure, no I/O. */
export function buildWeeklySummaryMarkdown(opts: {
  weekLabel: string;
  generatedAt: string;
  documentsDownloaded: number;
  daysIncluded: number;
  dayList: string[];
}): string {
  return [
    `# Weekly Data Summary — ${opts.weekLabel}`,
    '',
    `**Generated**: ${opts.generatedAt}`,
    '**Data Sources**: Aggregated from daily data download manifests',
    `**Documents Downloaded**: ${opts.documentsDownloaded}`,
    `**Period**: ${opts.weekLabel}`,
    `**Days Included**: ${opts.daysIncluded}`,
    '',
    '> ℹ️ **Data-Only Summary**: This file summarizes downloaded data for the week.',
    '> All political intelligence analysis MUST be performed by AI agents following',
    '> `analysis/methodologies/ai-driven-analysis-guide.md`.',
    '',
    '## Days with Data',
    '',
    opts.dayList.length > 0
      ? opts.dayList.map((d) => `- ${d}`).join('\n')
      : '_No data downloads found for this week._',
  ].join('\n');
}

/**
 * Run the weekly aggregation pipeline for the supplied `YYYY-WNN` label.
 * Writes `analysis/weekly/{weekLabel}/weekly-data-summary.md`.
 */
export function runWeeklyAggregation(weekLabel: string): void {
  const weekDir = path.join(ANALYSIS_DIR, 'weekly', weekLabel);
  ensureDir(weekDir);

  const dailyRoot = path.join(ANALYSIS_DIR, 'daily');
  let includedDays = 0;
  let aggregatedDocumentsDownloaded = 0;
  const dayList: string[] = [];

  const parsedWeek = parseIsoWeekLabel(weekLabel);
  if (!parsedWeek) {
    throw new Error(`Invalid ISO week label: ${weekLabel}. Expected format YYYY-WNN`);
  }

  if (fs.existsSync(dailyRoot)) {
    const dailyDirs = fs.readdirSync(dailyRoot).sort();
    const KNOWN_DOC_TYPES = new Set<string>([
      'propositions',
      'motions',
      'committeeReports',
      'votes',
      'speeches',
      'questions',
      'interpellations',
    ]);
    for (const dir of dailyDirs) {
      if (!isDateInIsoWeek(dir, weekLabel)) continue;
      const dayDir = path.join(dailyRoot, dir);
      const unscopedManifest = path.join(dayDir, 'data-download-manifest.md');
      let dayHasData = false;

      if (fs.existsSync(unscopedManifest)) {
        dayHasData = true;
        const content = fs.readFileSync(unscopedManifest, 'utf8');
        const docsMatch =
          /(?:^|\n)\*\*Documents Downloaded\*\*:\s*(\d+)/.exec(content) ||
          /(?:^|\n)\*\*Documents Analyzed\*\*:\s*(\d+)/.exec(content);
        if (docsMatch?.[1]) {
          aggregatedDocumentsDownloaded += Number(docsMatch[1]);
        }
      }

      if (fs.existsSync(dayDir) && fs.statSync(dayDir).isDirectory()) {
        for (const sub of fs.readdirSync(dayDir).sort()) {
          if (!KNOWN_DOC_TYPES.has(sub)) continue;
          const subManifest = path.join(dayDir, sub, 'data-download-manifest.md');
          if (fs.existsSync(subManifest) && !dayHasData) {
            dayHasData = true;
            const content = fs.readFileSync(subManifest, 'utf8');
            const docsMatch =
              /(?:^|\n)\*\*Documents Downloaded\*\*:\s*(\d+)/.exec(content) ||
              /(?:^|\n)\*\*Documents Analyzed\*\*:\s*(\d+)/.exec(content);
            if (docsMatch?.[1]) {
              aggregatedDocumentsDownloaded += Number(docsMatch[1]);
            }
          }
        }
      }

      if (dayHasData) {
        includedDays++;
        dayList.push(dir);
      }
    }
  }

  const weeklyContent = buildWeeklySummaryMarkdown({
    weekLabel,
    generatedAt: formatTimestampForMarkdown(),
    documentsDownloaded: aggregatedDocumentsDownloaded,
    daysIncluded: includedDays,
    dayList,
  });

  const filePath = path.join(weekDir, 'weekly-data-summary.md');
  fs.writeFileSync(filePath, weeklyContent, 'utf8');
  console.log(`  ✅ Written: ${path.relative(REPO_ROOT, filePath)}`);
  console.log(`\n✅ Weekly data summary written to analysis/weekly/${weekLabel}/`);
}
