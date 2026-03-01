/**
 * @module news-types/weekly-review/data-loader
 * @description Data loading and processing utilities for weekly-review articles.
 * Handles CIA context loading, CSV parsing, document full-text enrichment,
 * and speech attachment.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from '../../mcp-client.js';
import {
  isPersonProfileText,
  type RawDocument,
  type CIAContext,
} from '../../data-transformers.js';
import type { MCPCallRecord } from '../../types/article.js';

/** Current Riksdag parties (2022 election onwards). */
const RIKSDAG_PARTIES = new Set(['M', 'SD', 'KD', 'L', 'C', 'S', 'V', 'MP']);

export function formatDateForSlug(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Resolve the repo data directory path.
 * Works both in Node.js ESM and from compiled paths.
 */
export function repoDataDir(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // From scripts/news-types/ → up two levels to repo root → data/
    return join(__dirname, '..', '..', 'data');
  } catch {
    return join(process.cwd(), 'data');
  }
}

/**
 * Resolve the cia-data directory path (repo root/cia-data).
 */
function resolveCIADataDir(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // From scripts/news-types/ → up two levels to repo root → cia-data/
    return join(__dirname, '..', '..', 'cia-data');
  } catch {
    return join(process.cwd(), 'cia-data');
  }
}

/**
 * Parse a single CSV line handling double-quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse a CSV file into an array of row objects keyed by header names.
 * Returns an empty array if the file does not exist or cannot be parsed.
 */
function parseCsvFile(filePath: string): Array<Record<string, string>> {
  if (!existsSync(filePath)) {
    console.warn(`CIA data file not found: ${filePath}`);
    return [];
  }
  try {
    const text = readFileSync(filePath, 'utf-8');
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]).map(h => h.trim());
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const vals = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = (vals[i] ?? '').trim(); });
        return row;
      });
  } catch (err) {
    console.error(`Failed to parse CSV ${filePath}:`, err);
    return [];
  }
}

// RIKSDAG_PARTIES is defined at the top of this file

/**
 * Load CIA intelligence context from real CSV files in cia-data/.
 * Sources:
 *   • cia-data/party/view_party_performance_metrics_sample.csv   – win rates, documents, rebel rate
 *   • cia-data/view_riksdagen_party_summary_sample.csv           – current seat counts
 *   • cia-data/party/distribution_coalition_alignment.csv        – inter-party alignment
 *   • cia-data/view_riksdagen_committee_decisions.csv            – committee decision outcomes
 *
 * Returns a populated CIAContext or a minimal fallback when files are missing.
 */
export function loadCIAContext(): CIAContext {
  const ciaDir = resolveCIADataDir();

  // ── 1. Seat counts from view_riksdagen_party_summary_sample.csv ──────────
  const seatMap = new Map<string, number>();
  const partySummaryRows = parseCsvFile(join(ciaDir, 'view_riksdagen_party_summary_sample.csv'));
  for (const row of partySummaryRows) {
    const party = row['party']?.trim();
    if (party) seatMap.set(party, parseInt(row['total_active_parliament'] ?? '0', 10) || 0);
  }

  // ── 2. Party performance from view_party_performance_metrics_sample.csv ──
  const partyPerformance: CIAContext['partyPerformance'] = [];
  const partyMetricsRows = parseCsvFile(join(ciaDir, 'party', 'view_party_performance_metrics_sample.csv'));
  for (const row of partyMetricsRows) {
    const id = row['party']?.trim() ?? '';
    if (!RIKSDAG_PARTIES.has(id)) continue;

    const avgWinRate   = parseFloat(row['avg_win_rate']   ?? '0') || 0;
    const avgRebelRate = parseFloat(row['avg_rebel_rate'] ?? '0') || 0;
    const docsLastYear = parseInt(row['documents_last_year'] ?? '0', 10) || 0;
    const ministers    = parseInt(row['current_ministers']   ?? '0', 10) || 0;
    const perfLevel    = row['performance_level']?.trim() ?? '';

    partyPerformance.push({
      id,
      partyName: row['party_name']?.trim() ?? id,
      metrics: {
        seats:             seatMap.get(id) ?? 0,
        // avg_win_rate is 0-100 percentage (e.g. M=86.49, S=43.40)
        successRate:       avgWinRate,
        motionsSubmitted:  docsLastYear,
        motionsPassed:     Math.round(avgWinRate * docsLastYear / 100),
        // avg_rebel_rate is a 0-1 decimal ratio (e.g. S=0.06 → 6% rebel rate)
        cohesionScore:     Math.round((1 - avgRebelRate) * 100),
      },
      trends: {
        supportTrend:  ministers > 0 ? 'stable' : (avgWinRate < 50 ? 'declining' : 'stable'),
        activityTrend: perfLevel === 'EXCELLENT' ? 'increasing' : perfLevel === 'BELOW_AVERAGE' ? 'declining' : 'stable',
      },
    });
  }

  // ── 3. Coalition stability from distribution_coalition_alignment.csv ─────
  const coalignRows = parseCsvFile(join(ciaDir, 'party', 'distribution_coalition_alignment.csv'));

  // Government bloc: M + KD + L + SD (SD provides confidence-and-supply support)
  const GOV_PARTIES = new Set(['M', 'KD', 'L', 'SD']);
  const govSeats = partyPerformance
    .filter(p => GOV_PARTIES.has(p.id))
    .reduce((s, p) => s + p.metrics.seats, 0);
  const totalSeats = 349;
  const majorityNeeded = Math.floor(totalSeats / 2) + 1; // 175
  const majorityMargin = govSeats - majorityNeeded;

  // Average alignment among the three formal government parties (M, KD, L)
  const coreGovPairs = new Set(['M-KD', 'M-L', 'KD-L', 'KD-M', 'L-M', 'L-KD']);
  let alignmentSum = 0; let alignmentCount = 0;
  for (const row of coalignRows) {
    const pair = `${row['party1']?.trim() ?? ''}-${row['party2']?.trim() ?? ''}`;
    if (coreGovPairs.has(pair)) {
      alignmentSum += parseFloat(row['alignment_rate'] ?? '0') || 0;
      alignmentCount++;
    }
  }
  const stabilityScore = alignmentCount > 0
    ? Math.round((alignmentSum / alignmentCount) * 100)
    : 75;
  const riskLevel = majorityMargin <= 0 ? 'high' : majorityMargin <= 2 ? 'moderate' : 'low';

  const coalitionStability: CIAContext['coalitionStability'] = {
    stabilityScore,
    riskLevel,
    // Base 20% defection probability, reduced 3% per seat of margin, minimum 5%
    defectionProbability: Math.max(5, Math.round(20 - majorityMargin * 3)),
    majorityMargin: Math.max(0, majorityMargin),
  };

  // ── 4. Voting patterns from coalition alignment (top 5 party pairs) ───────
  const votingPatterns: CIAContext['votingPatterns'] = {
    keyIssues: coalignRows.slice(0, 5).map(row => ({
      topic:                `${row['party1']?.trim() ?? ''}-${row['party2']?.trim() ?? ''} alignment`,
      coalitionAlignment:   Math.round((parseFloat(row['alignment_rate'] ?? '0') || 0) * 100),
      oppositionAlignment:  Math.round((1 - (parseFloat(row['alignment_rate'] ?? '0') || 0)) * 100),
      crossPartyVotes:      parseInt(row['aligned_votes'] ?? '0', 10) || 0,
    })),
  };

  // ── 5. Motion denial rate from committee decision outcomes ────────────────
  let overallMotionDenialRate = 96; // historical baseline from CIA data
  const decisionsRows = parseCsvFile(join(ciaDir, 'view_riksdagen_committee_decisions.csv'));
  if (decisionsRows.length > 0) {
    const committeeWins = decisionsRows.filter(r =>
      r['winner']?.trim().toLowerCase() === 'utskottet'
    ).length;
    overallMotionDenialRate = Math.round((committeeWins / decisionsRows.length) * 100);
  }

  console.log(
    `  📊 CIA CSV context: ${partyPerformance.length} parties, ` +
    `gov seats ${govSeats}/${totalSeats} (margin ${majorityMargin}), ` +
    `stability ${stabilityScore}/100, denial rate ${overallMotionDenialRate}%`
  );

  return { partyPerformance, coalitionStability, votingPatterns, overallMotionDenialRate };
}

/**
 * Enrich a flat list of documents with full text via get_dokument_innehall.
 * Mutates each document in place; never throws — failures are logged and skipped.
 */
export async function enrichWithFullText(
  client: MCPClient,
  documents: RawDocument[],
  mcpCalls: MCPCallRecord[],
  concurrency = 3,
): Promise<void> {
  console.log(`  📖 Enriching ${documents.length} documents with full text (concurrency ${concurrency})...`);
  let enriched = 0;

  for (let i = 0; i < documents.length; i += concurrency) {
    const batch = documents.slice(i, i + concurrency);

    await Promise.allSettled(batch.map(async (doc) => {
      const dokId = (doc as Record<string, string>).dok_id
        ?? (doc as Record<string, string>).dokumentnamn
        ?? (doc as Record<string, string>).id;
      if (!dokId) return;

      try {
        const details = await client.fetchDocumentDetails(dokId, true);
        mcpCalls.push({ tool: 'get_dokument_innehall', result: details });

        // Merge full text fields into document.
        // NOTE: details['text'] from get_dokument_innehall is a raw database metadata
        // dump (IDs, dates, URLs), NOT human-readable prose — do not use as fullText.
        // Also: some documents return politician profile text (MP status like
        // "Tjänstgörande riksdagsledamot..." or "Avliden YYYY-MM-DD...") in their
        // notis/summary/fullText fields — discard these to prevent them from
        // appearing as article content.
        const sanitize = (s: unknown): string => {
          const str = (s as string) ?? '';
          return isPersonProfileText(str) ? '' : str;
        };
        const d = doc as Record<string, unknown>;
        d['fullText'] = sanitize(details['fullText'])
          || sanitize(details['summary'])
          || sanitize(details['notis'])
          || '';
        d['fullContent'] = (details['html'] as string) ?? '';
        if (!d['summary'] && details['summary']) d['summary'] = sanitize(details['summary']);
        if (!d['notis'] && details['notis']) d['notis'] = sanitize(details['notis']);
        d['contentFetched'] = true;
        enriched++;
      } catch (err: unknown) {
        console.error(`  ⚠ Failed to fetch full text for ${dokId}:`, (err as Error).message);
      }
    }));

    // Small delay between batches to avoid rate limiting
    if (i + concurrency < documents.length) {
      await new Promise<void>(r => setTimeout(r, 300));
    }
  }

  console.log(`  ✅ Enriched ${enriched}/${documents.length} documents with full text`);
}

/**
 * Attach related speeches to documents that share the same dokId.
 */
export function attachSpeechesToDocuments(
  documents: RawDocument[],
  speeches: Array<Record<string, unknown>>,
): void {
  if (speeches.length === 0) return;
  // Build a loose index: dok_id → speeches
  const speechIndex = new Map<string, Array<{ talare?: string; parti?: string; text?: string; anforande_nummer?: string }>>();
  for (const s of speeches) {
    const ref = String(s['intressent_id'] ?? s['dok_id'] ?? s['rel_dok_id'] ?? '');
    if (!ref) continue;
    if (!speechIndex.has(ref)) speechIndex.set(ref, []);
    speechIndex.get(ref)!.push({
      talare: s['talare'] as string | undefined,
      parti: s['parti'] as string | undefined,
      text: (s['anforande_text'] as string | undefined)?.slice(0, 300),
      anforande_nummer: s['anforande_nummer'] as string | undefined,
    });
  }
  for (const doc of documents) {
    const dokId = (doc as Record<string, string>).dok_id ?? '';
    const related = speechIndex.get(dokId);
    if (related && related.length > 0) {
      (doc as Record<string, unknown>).speeches = related;
    }
  }
}

/**
 * Normalize CIAContext so defectionProbability is in [0, 1].
 *
 * risk-analysis.ts multiplies it by 100, so out-of-range values can
 * explode scores. Expected input formats:
 * - (0, 1] — already a proper probability fraction; kept as-is.
 *            Note: exactly 1.0 is treated as 100% (not as 1% whole-percent).
 * - (1, ∞) — treated as a whole-percent (loadCIAContext returns min 5,
 *             e.g. 50 means 50% → normalized to 0.5); clamped to 1.
 * - Non-finite or ≤ 0 — coerced to 0 (no defection risk).
 */
export function normalizedCIAContext(ctx: CIAContext): CIAContext {
  const defProb = ctx.coalitionStability?.defectionProbability;
  if (typeof defProb !== 'number') return ctx;

  let normalized: number;
  if (!Number.isFinite(defProb) || defProb <= 0) {
    // Non-finite or non-positive: no defection risk.
    normalized = 0;
  } else if (defProb <= 1) {
    // Already a fraction in (0, 1]: keep as-is (1.0 = 100% probability).
    normalized = defProb;
  } else {
    // Whole-percent value (e.g. loadCIAContext min 5): convert to fraction and clamp.
    normalized = Math.min(1, defProb / 100);
  }

  if (normalized === defProb) return ctx;
  return {
    ...ctx,
    coalitionStability: {
      ...ctx.coalitionStability!,
      defectionProbability: normalized,
    },
  };
}

/**
 * Analyse coalition stress from a list of voting records.
 *
 * Groups records by vote-point (bet + punkt), then counts:
 * - Government wins/losses (M/KD/L/SD bloc)
 * - Cross-party votes (opposition voting with government)
 * - Internal defections (government parties split)
 *
 * Also integrates risk scoring via calculateCoalitionRiskIndex and
 * detectAnomalousPatterns from scripts/data-transformers/risk-analysis.ts.
 *
 * @param votingRecords - Raw records from search_voteringar
 * @param ciaContext    - CIA intelligence context for risk scoring
 */
