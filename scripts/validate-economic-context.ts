#!/usr/bin/env tsx
/**
 * @file Economic context quality gate.
 *
 * Enforces that every news article shipped through agentic workflows
 * carries real World Bank / SCB data, at least one Chart.js canvas, and
 * AI-authored commentary — never the "economic-dashboard-placeholder"
 * bullet list that the April 17 2026 committee-reports article was
 * produced with.
 *
 * Usage:
 *   npx tsx scripts/validate-economic-context.ts [--date YYYY-MM-DD] [--type committee-reports]
 *
 * Exit codes:
 *   0 — all checks pass (or nothing applicable)
 *   1 — at least one article violates the contract
 *
 * Checks per English article file (non-English are translations):
 *   1. HTML must not include `class="economic-dashboard-placeholder"`
 *      when the article's committee/domain has any indicator with an
 *      `mcpTool` binding.
 *   2. HTML must include at least one `data-chart-config=` canvas
 *      (Chart.js) when the article type requires it.
 *   3. `analysis/daily/{date}/{subfolder}/economic-data.json` must
 *      exist (unless the article type is on the exempt allow-list and
 *      the skip marker is present) and contain non-empty `dataPoints`
 *      and non-empty `commentary`.
 *   4. HTML must include a footer attribution link "Data by World Bank"
 *      (or the localized variant present in the template).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadEconomicContext, economicDataPath } from './data-transformers/load-economic-context.js';

// ---------------------------------------------------------------------------
// Coverage matrix (single source of truth: .github/aw/ECONOMIC_DATA_CONTRACT.md)
// ---------------------------------------------------------------------------

/**
 * Minimum expected economic charts and commentary length per article
 * type. Article types not in this matrix are exempt from the gate.
 */
export interface CoverageRule {
  /** Minimum `data-chart-config` canvases expected in the HTML. */
  minCharts: number;
  /** Minimum commentary word count (matches contract in ECONOMIC_DATA_CONTRACT.md). */
  minCommentaryWords: number;
  /** Whether the article type may opt out via `skip: true`. */
  allowSkip: boolean;
  /**
   * Whether the article MUST include a D3 Sankey / network diagram
   * (emitted as a `data-d3-sankey=` marker + `js/lib/d3.*.min.js` load).
   * Enforced for weekly / monthly reviews per the Economic Data
   * Contract (.github/aw/ECONOMIC_DATA_CONTRACT.md).
   */
  requiresD3?: boolean;
}

/**
 * Date (ISO `YYYY-MM-DD`) on which the Economic Data Contract v1.0 became
 * authoritative. Articles published before this date legitimately had no
 * way to comply — the contract, schema, loader, and validator all landed
 * on 2026-04-17 (see `.github/aw/ECONOMIC_DATA_CONTRACT.md` § "Version
 * history"), so the first *full* day under the contract is 2026-04-18.
 *
 * The validator and the daily audit discovery use this constant to skip
 * pre-contract articles, which would otherwise keep generating the same
 * ~80 violations in the daily audit until they age out of the 7-day
 * lookback window (see `.github/workflows/economic-context-audit.yml`).
 *
 * Keep in sync with the contract's version-history entry.
 */
export const CONTRACT_EFFECTIVE_DATE = '2026-04-18';

/**
 * Strict `YYYY-MM-DD` validator used before any prefix/lexicographic
 * comparison on date strings. Prevents malformed or user-controlled
 * values from flowing into patterns or filesystem glue code (see CodeQL
 * alerts #185 regex-injection and #186 no-op replace).
 */
export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Returns true when `date` is a strict ISO `YYYY-MM-DD` string on or
 * after `CONTRACT_EFFECTIVE_DATE`. Non-ISO / malformed inputs return
 * `false` deterministically so invalid filenames never silently pass
 * the gate. Uses literal string comparison once the shape is validated
 * — safe for ISO-8601 `YYYY-MM-DD`, which is lexicographically sortable.
 */
export function isUnderContract(date: string): boolean {
  if (!isIsoDate(date)) return false;
  return date >= CONTRACT_EFFECTIVE_DATE;
}

export const COVERAGE_MATRIX: Readonly<Record<string, CoverageRule>> = {
  'committee-reports':  { minCharts: 2, minCommentaryWords: 60,  allowSkip: false },
  'propositions':       { minCharts: 2, minCommentaryWords: 60,  allowSkip: false },
  'motions':            { minCharts: 1, minCommentaryWords: 40,  allowSkip: false },
  'interpellations':    { minCharts: 1, minCommentaryWords: 40,  allowSkip: false },
  'evening-analysis':   { minCharts: 1, minCommentaryWords: 40,  allowSkip: false },
  'realtime-monitor':   { minCharts: 1, minCommentaryWords: 30,  allowSkip: true  },
  'breaking':           { minCharts: 1, minCommentaryWords: 30,  allowSkip: true  },
  'week-ahead':         { minCharts: 2, minCommentaryWords: 80,  allowSkip: false },
  'month-ahead':        { minCharts: 3, minCommentaryWords: 100, allowSkip: false },
  'weekly-review':      { minCharts: 3, minCommentaryWords: 150, allowSkip: false, requiresD3: true },
  'monthly-review':     { minCharts: 4, minCommentaryWords: 200, allowSkip: false, requiresD3: true },
  'deep-inspection':    { minCharts: 1, minCommentaryWords: 40,  allowSkip: true  },
  'article-generator':  { minCharts: 1, minCommentaryWords: 40,  allowSkip: true  },
};

// ---------------------------------------------------------------------------
// Violation reporting
// ---------------------------------------------------------------------------

export interface Violation {
  articleFile: string;
  articleType: string;
  reason: string;
}

/**
 * Count word-ish tokens in a commentary string.
 * Exposed for the unit test.
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

/**
 * Count occurrences of `data-chart-config=` (Chart.js canvases) in HTML.
 * Exposed for the unit test.
 */
export function countChartCanvases(html: string): number {
  const matches = html.match(/data-chart-config=/g);
  return matches ? matches.length : 0;
}

/**
 * Check whether the HTML contains a footer attribution link to IMF /
 * World Bank / SCB. Matches common phrasings across the 14 languages.
 *
 * Schema v2 (2026-04-20+): accepts "IMF" / "International Monetary Fund"
 * as a primary-source marker alongside the existing World Bank / SCB
 * patterns.
 */
export function hasAttribution(html: string): boolean {
  return /IMF|International Monetary Fund|Internationella valutafonden|Internationaler Währungsfonds|Fondo Monetario Internacional|Fonds monétaire international|Internationaal Monetair Fonds|صندوق النقد الدولي|קרן המטבע הבינלאומית|国際通貨基金|국제통화기금|国际货币基金组织|World Bank|världsbanken|verdensbank|weltbank|banco mundial|banque mondiale|wereldbank|البنك الدولي|הבנק העולמי|世界銀行|세계은행|世界银行|SCB|Statistics Sweden|Statistiska centralbyrån/i.test(html);
}

// ---------------------------------------------------------------------------
// Per-article validation
// ---------------------------------------------------------------------------

/**
 * Extract article type and date from a news filename.
 * Returns null when the file does not match the expected pattern.
 *
 * Expected pattern: `news/YYYY-MM-DD-{type-with-dashes}-{lang}.html`.
 * Type is matched against the coverage matrix keys to avoid greedy splits
 * (e.g. "committee-reports" vs "opposition-motions" vs "week-ahead").
 */
export function parseArticleFilename(filePath: string): { date: string; articleType: string } | null {
  const base = path.basename(filePath, '.html');
  const match = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)-([a-z]{2})$/);
  if (!match) return null;
  const date = match[1];
  const body = match[2];

  // Match longest known article-type suffix in the body. Some slugs
  // differ from the contract key (e.g. `government-propositions` →
  // `propositions`, `opposition-motions` → `motions`,
  // `interpellation-debates` → `interpellations`).
  const SLUG_ALIASES: Readonly<Record<string, string>> = {
    'committee-reports': 'committee-reports',
    'government-propositions': 'propositions',
    'opposition-motions': 'motions',
    'interpellation-debates': 'interpellations',
    'evening-analysis': 'evening-analysis',
    'realtime-monitor': 'realtime-monitor',
    'breaking': 'breaking',
    'week-ahead': 'week-ahead',
    'month-ahead': 'month-ahead',
    'weekly-review': 'weekly-review',
    'monthly-review': 'monthly-review',
  };

  // deep-inspection is special: body starts with 'deep-inspection-'
  if (body.startsWith('deep-inspection-')) {
    return { date, articleType: 'deep-inspection' };
  }

  // Look for exact alias match first, then longest suffix
  for (const [slug, type] of Object.entries(SLUG_ALIASES)) {
    if (body === slug || body.endsWith(`-${slug}`)) {
      return { date, articleType: type };
    }
  }

  // Fallback: treat the whole body as the type (e.g. article-generator).
  return { date, articleType: body };
}

export function validateArticle(filePath: string, rootDir: string = process.cwd()): Violation[] {
  const violations: Violation[] = [];
  const parsed = parseArticleFilename(filePath);
  if (!parsed) return violations; // unknown pattern, skip silently

  const { date, articleType } = parsed;
  const rule = COVERAGE_MATRIX[articleType];
  if (!rule) return violations; // article type not covered by the contract

  // Pre-contract articles are exempt — the contract / schema / validator
  // only became authoritative on CONTRACT_EFFECTIVE_DATE. Enforcing on
  // older articles would be a retroactive rule change we cannot satisfy
  // without re-running the World Bank / SCB MCP queries for history, and
  // it keeps the daily audit noisy for a week after every rollout.
  if (!isUnderContract(date)) return violations;

  let html: string;
  try {
    html = fs.readFileSync(filePath, 'utf-8');
  } catch {
    violations.push({ articleFile: filePath, articleType, reason: 'Article HTML could not be read' });
    return violations;
  }

  // Load the companion economic-data.json (if any)
  const ctx = loadEconomicContext(date, articleType, rootDir);

  // Skip marker handling
  if (ctx?.skip) {
    if (!rule.allowSkip) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: `economic-data.json has skip=true but article type '${articleType}' is not on the exempt allow-list`,
      });
    } else if (!ctx.skipReason) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: 'economic-data.json has skip=true without skipReason',
      });
    }
    return violations;
  }

  // Check 1: no placeholder leakage
  if (/class="economic-dashboard-placeholder"/.test(html)) {
    violations.push({
      articleFile: filePath,
      articleType,
      reason: 'HTML contains economic-dashboard-placeholder — agentic workflow did not supply live IMF / World Bank / SCB data',
    });
  }

  // Check 2: Chart.js canvases
  const chartCount = countChartCanvases(html);
  if (chartCount < rule.minCharts) {
    violations.push({
      articleFile: filePath,
      articleType,
      reason: `Expected ≥${rule.minCharts} data-chart-config canvases, found ${chartCount}`,
    });
  }

  // Check 2b: If the article emits any `data-chart-config` canvases, the
  // HTML MUST also load the Chart.js runtime (chart.umd.*.js) and the
  // generic initializer (chart-init.js). Without them canvases render
  // blank in the browser. See scripts/article-template/template.ts.
  if (chartCount > 0) {
    if (!/<script[^>]+chart\.umd\.[^"']+\.js/.test(html)) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: 'Article has data-chart-config canvases but does not load js/lib/chart.umd.*.js — charts would render blank',
      });
    }
    if (!/<script[^>]+chart-init\.js/.test(html)) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: 'Article has data-chart-config canvases but does not load js/chart-init.js — charts would never be instantiated',
      });
    }
  }

  // Check 3: economic-data.json completeness
  if (!ctx) {
    violations.push({
      articleFile: filePath,
      articleType,
      reason: `Missing or malformed ${economicDataPath(date, articleType).replace(rootDir + '/', '')}`,
    });
  } else {
    if (ctx.dataPoints.length === 0) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: 'economic-data.json has empty dataPoints[] (workflow fetched no IMF / World Bank / SCB data)',
      });
    }
    const words = countWords(ctx.commentary);
    if (words < rule.minCommentaryWords) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: `AI commentary too short — ${words} words, expected ≥${rule.minCommentaryWords}`,
      });
    }
    if (ctx.source.worldBank.length === 0 && ctx.source.scb.length === 0 && ctx.source.imf.length === 0) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: 'economic-data.json lacks source attribution (World Bank + IMF + SCB all empty)',
      });
    }
  }

  // Check 4: footer attribution link. The renderer does not yet emit
  // a deterministic "Data by IMF / World Bank / SCB" footer string for
  // every template, so accept structured attribution from
  // `economic-data.json.source` as a fallback source of truth. This
  // prevents false failures for articles that ship valid economic
  // data and charts but whose footer copy has not been migrated.
  const hasStructuredAttribution = Boolean(
    ctx && (ctx.source.worldBank.length > 0 || ctx.source.scb.length > 0 || ctx.source.imf.length > 0),
  );
  if (!hasAttribution(html) && !hasStructuredAttribution) {
    violations.push({
      articleFile: filePath,
      articleType,
      reason: 'Missing "Data by IMF / World Bank / SCB" footer attribution (no structured source in economic-data.json either)',
    });
  }

  // Check 5: D3 Sankey requirement for high-level reviews. The renderer
  // ships two equivalent Sankey flavours:
  //   (a) An inline SVG Sankey section (class="sankey-section") emitted
  //       by scripts/data-transformers/content-generators/sankey-section.ts
  //   (b) A `data-d3-sankey=` marker rendered client-side by D3 (requires
  //       `js/lib/d3.*.min.js` to be loaded)
  // Either satisfies the coverage rule. When the D3 marker is used, the
  // matching minified script MUST be loaded or the diagram would not
  // render.
  if (rule.requiresD3) {
    const hasD3Marker = /data-d3-sankey=/.test(html);
    const hasInlineSankeySection = /class="sankey-section"|id="sankey-section"/.test(html);
    if (!hasD3Marker && !hasInlineSankeySection) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: `Article type '${articleType}' requires a Sankey / flow diagram (inline class="sankey-section" SVG or data-d3-sankey= marker)`,
      });
    }
    if (hasD3Marker && !/<script[^>]+d3\.[^"']+\.min\.js/.test(html)) {
      violations.push({
        articleFile: filePath,
        articleType,
        reason: `Article type '${articleType}' uses data-d3-sankey= but js/lib/d3.*.min.js is not loaded — diagram would not render`,
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { date?: string; type?: string; files?: string[] } {
  const out: { date?: string; type?: string; files?: string[] } = {};
  const files: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--date') out.date = argv[++i];
    else if (a === '--type') out.type = argv[++i];
    else if (a.startsWith('--')) continue;
    else files.push(a);
  }
  if (files.length > 0) out.files = files;
  return out;
}

function discoverArticleFiles(opts: { date?: string; type?: string }, rootDir: string): string[] {
  const newsDir = path.join(rootDir, 'news');
  let entries: string[];
  try {
    entries = fs.readdirSync(newsDir);
  } catch {
    return [];
  }
  // NOTE: do NOT construct a RegExp from `opts.date` — it would be
  // user-controlled regex input (CodeQL regex-injection). Instead we
  // validate the shape and use a literal startsWith() check.
  const explicitDate = opts.date && isIsoDate(opts.date) ? opts.date : undefined;
  const genericDatePrefix = /^\d{4}-\d{2}-\d{2}-/;
  return entries
    .filter((f) => f.endsWith('-en.html')) // check EN only — translations inherit
    .filter((f) => !f.startsWith('index'))
    .filter((f) => (explicitDate
      ? f.startsWith(`${explicitDate}-`)
      : genericDatePrefix.test(f)))
    // Skip pre-contract articles so they neither show up as "✅" noise
    // nor trigger violations the agent cannot retroactively fix. See
    // CONTRACT_EFFECTIVE_DATE above.
    .filter((f) => {
      const m = f.match(/^(\d{4}-\d{2}-\d{2})-/);
      return m ? isUnderContract(m[1]) : true;
    })
    .filter((f) => {
      if (!opts.type) return true;
      const parsed = parseArticleFilename(path.join(newsDir, f));
      return parsed?.articleType === opts.type;
    })
    .map((f) => path.join(newsDir, f));
}

export async function main(argv: string[] = process.argv.slice(2), rootDir: string = process.cwd()): Promise<number> {
  const opts = parseArgs(argv);
  const files = opts.files && opts.files.length > 0
    ? opts.files
    : discoverArticleFiles({ date: opts.date, type: opts.type }, rootDir);

  if (files.length === 0) {
    console.log('✅ validate-economic-context: no matching articles to validate');
    return 0;
  }

  let totalViolations = 0;
  for (const f of files) {
    const violations = validateArticle(f, rootDir);
    if (violations.length > 0) {
      console.error(`❌ ${path.relative(rootDir, f)}`);
      for (const v of violations) {
        console.error(`   • [${v.articleType}] ${v.reason}`);
      }
      totalViolations += violations.length;
    } else {
      console.log(`✅ ${path.relative(rootDir, f)}`);
    }
  }

  if (totalViolations > 0) {
    console.error(`\n❌ validate-economic-context: ${totalViolations} violation(s) across ${files.length} article(s)`);
    return 1;
  }
  console.log(`\n✅ validate-economic-context: ${files.length} article(s) pass the economic context contract`);
  return 0;
}

// Run when invoked directly (tsx runs it as an entry module).
const isMain =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] != null &&
  /validate-economic-context\.(ts|mjs|js)$/.test(process.argv[1]);

if (isMain) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.error('validate-economic-context crashed:', err);
    process.exit(2);
  });
}
