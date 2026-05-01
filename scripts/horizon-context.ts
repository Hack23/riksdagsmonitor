/**
 * @module Scripts/HorizonContext
 * @category Intelligence Operations / Long-Horizon Forecasting
 * @name Horizon context helpers for long-horizon workflows
 *
 * @description
 * Pure helpers that read `analysis/article-types.json` (the single source
 * of truth for article-type metadata) and return the runtime context
 * every long-horizon workflow needs:
 *
 *   - `cycleAnchor`   — current | next | both | none
 *   - `daysToElection` — signed integer (negative = past)
 *   - `weoVintage`    — "Apr-YYYY" | "Oct-YYYY" pinned at run time
 *   - `sessionPhase`  — autumn | xmas-recess | spring | summer-recess
 *   - `articleType`   — full registry entry for the calling workflow
 *
 * Used by:
 *   - `news-quarter-ahead.md` / `news-year-ahead.md` / `news-election-cycle.md`
 *     (consumed via `bash` in the workflow body)
 *
 * Additional script consumers (`scripts/aggregate-analysis.ts`,
 * `scripts/render-articles.ts`, `scripts/validate-article.ts`,
 * `scripts/roll-forward-pirs.ts`) are planned follow-up work tracked in
 * separate issues; they do not yet import this module.
 *
 * No filesystem mutations. Reads `analysis/article-types.json` once
 * and caches the result for subsequent lookups.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

export interface ArticleTypeEntry {
  id: string;
  family: 'single-type' | 'tier-c-aggregation' | 'long-horizon-forecast';
  horizonDays: number;
  lookbackDays: number;
  subfolder: string;
  tierCMultiplier: number;
  articleWordFloor: number;
  scenarioHorizonYears: number;
  forwardIndicatorHorizons: string[];
  electionCycleAnchor: 'current' | 'next' | 'both' | 'none';
  imfPolicy: string;
  icon: string;
  label: string;
  workflow: string;
  cronExpression?: string;
  dispatchOnly?: boolean;
  coreLanguages: string[];
  extraArtifacts: string[];
  longHorizonRules?: {
    scenarioCount?: number;
    scenarioBranchesPerScenario?: number;
    wildcardCount?: number;
    counterfactualParagraphs?: number;
    pestleMandatory?: boolean;
    crossHorizonCitations?: string[];
    minDokIdReferences?: number;
    minCharts?: number;
  };
}

export interface ElectionCycle {
  id: string;
  label: string;
  start: string;
  end: string;
  governingCoalition: string[] | null;
  confidenceSupport: string[] | null;
  opposition: string[] | null;
}

export interface HorizonBand {
  days: number;
  wepFloor: string;
}

export interface ArticleTypesRegistry {
  version: string;
  effectiveDate: string;
  description: string;
  owner: string;
  classification: string;
  license?: string;
  types: ArticleTypeEntry[];
  electionCycles: { current: ElectionCycle; next: ElectionCycle };
  horizonBands: Record<string, HorizonBand>;
}

let cached: ArticleTypesRegistry | null = null;

/**
 * Load the article-types registry. Cached after first read.
 */
export function loadRegistry(): ArticleTypesRegistry {
  if (cached) return cached;
  const path = resolve(repoRoot, 'analysis/article-types.json');
  const raw = readFileSync(path, 'utf8');
  cached = JSON.parse(raw) as ArticleTypesRegistry;
  return cached;
}

/**
 * Resolve a single article-type entry by id. Throws when unknown.
 */
export function getArticleType(id: string): ArticleTypeEntry {
  const reg = loadRegistry();
  const entry = reg.types.find((t) => t.id === id);
  if (!entry) {
    throw new Error(
      `Unknown article type "${id}". Known: ${reg.types.map((t) => t.id).join(', ')}`,
    );
  }
  return entry;
}

/**
 * Compute days from articleDate to the next election day (next.start
 * in registry). Negative = past, positive = future.
 */
export function daysToElection(articleDate: string): number {
  const reg = loadRegistry();
  const elec = new Date(reg.electionCycles.next.start).getTime();
  const today = new Date(articleDate).getTime();
  return Math.floor((elec - today) / 86_400_000);
}

/**
 * Resolve which cycle anchor applies for a given article date.
 * Within the next-cycle's start..end window → 'next'. Else 'current'.
 */
export function activeCycleAnchor(articleDate: string): 'current' | 'next' {
  const reg = loadRegistry();
  const date = new Date(articleDate).getTime();
  const nextStart = new Date(reg.electionCycles.next.start).getTime();
  const nextEnd = new Date(reg.electionCycles.next.end).getTime();
  return date >= nextStart && date < nextEnd ? 'next' : 'current';
}

/**
 * Determine the most-recent IMF WEO vintage that should be pinned at
 * run time. WEO is published twice yearly, in April and October.
 *
 * Coverage matrix (UTC month numbering):
 *   Jan–Apr (1–4)   → previous year's Oct vintage (Apr not yet released)
 *   May–Oct (5–10)  → current year's Apr vintage
 *   Nov–Dec (11–12) → current year's Oct vintage
 */
export function weoVintage(articleDate: string): string {
  const d = new Date(articleDate);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1; // 1-12, always covered by the branches below.
  if (month >= 11) return `Oct-${year}`;
  if (month >= 5) return `Apr-${year}`;
  return `Oct-${year - 1}`;
}

/**
 * Riksmöte session phase for the article date. Phase boundaries are
 * approximate (Riksdagen sets exact dates per year) but stable enough
 * for forward-look workflows.
 */
export function sessionPhase(
  articleDate: string,
): 'autumn' | 'xmas-recess' | 'spring' | 'summer-recess' {
  const d = new Date(articleDate);
  const m = d.getUTCMonth() + 1; // 1-12
  const day = d.getUTCDate();
  if (m === 9 || m === 10 || m === 11 || (m === 12 && day < 18)) return 'autumn';
  if ((m === 12 && day >= 18) || m === 1) return 'xmas-recess';
  if (m === 2 || m === 3 || m === 4 || m === 5 || (m === 6 && day < 18)) return 'spring';
  return 'summer-recess';
}

export interface HorizonContext {
  articleType: ArticleTypeEntry;
  cycleAnchor: 'current' | 'next';
  daysToElection: number;
  weoVintage: string;
  sessionPhase: 'autumn' | 'xmas-recess' | 'spring' | 'summer-recess';
  cycleRolloverActive: boolean;
}

/**
 * One-shot resolution of every horizon-context field for a workflow run.
 * `cycleRolloverActive` is true when within ± 30 days of the next election.
 */
export function horizonContext(typeId: string, articleDate: string): HorizonContext {
  const articleType = getArticleType(typeId);
  const dte = daysToElection(articleDate);
  return {
    articleType,
    cycleAnchor: activeCycleAnchor(articleDate),
    daysToElection: dte,
    weoVintage: weoVintage(articleDate),
    sessionPhase: sessionPhase(articleDate),
    cycleRolloverActive: Math.abs(dte) <= 30,
  };
}

/**
 * Public convenience wrappers — exported as a frozen object so callers
 * can spread or destructure without accidentally mutating state.
 */
export const horizonContextHelpers = Object.freeze({
  loadRegistry,
  getArticleType,
  daysToElection,
  activeCycleAnchor,
  weoVintage,
  sessionPhase,
  horizonContext,
});

/**
 * CLI entry point — `tsx scripts/horizon-context.ts <type-id> <YYYY-MM-DD>`
 * emits a JSON blob for use in workflow bash blocks:
 *
 *   eval "$(tsx scripts/horizon-context.ts year-ahead 2026-07-05 | jq -r '
 *     "CYCLE_ANCHOR=\"\(.cycleAnchor)\";
 *      DAYS_TO_ELECTION=\(.daysToElection);
 *      WEO_VINTAGE=\"\(.weoVintage)\";
 *      SESSION_PHASE=\"\(.sessionPhase)\";
 *      WORD_FLOOR=\(.articleType.articleWordFloor)"')"
 */
const argv = process.argv.slice(2);
const isMain = (() => {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
})();
if (isMain) {
  const [typeId, articleDate] = argv;
  if (!typeId || !articleDate) {
    console.error('Usage: tsx scripts/horizon-context.ts <type-id> <YYYY-MM-DD>');
    process.exit(2);
  }
  const ctx = horizonContext(typeId, articleDate);
  process.stdout.write(JSON.stringify(ctx, null, 2) + '\n');
}
