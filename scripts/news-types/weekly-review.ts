/**
 * @module ContentGeneration/WeeklyReview
 * @category ContentGeneration
 * 
 * @title Weekly Review Article Generator - Deep Intelligence Analysis
 * 
 * @description
 * Generates retrospective weekly review articles with full-document analysis.
 * Pipeline: search_dokument (IDs) → get_dokument_innehall per doc (full text)
 * → search_anforanden (speeches) → CIA static data → deep intelligence analysis.
 * 
 * **DATA PIPELINE:**
 * 1. search_dokument  – find document IDs and types for the period
 * 2. get_dokument_innehall – load every document completely (concurrency 3)
 * 3. search_anforanden – fetch speeches from the same period
 * 4. get_betankanden / get_propositioner / get_motioner – typed metadata
 * 5. CIA static context – party performance, motion success rates, coalition data
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from '../mcp-client.js';
import {
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  isPersonProfileText,
  type RawDocument,
  type CIAContext
} from '../data-transformers.js';
import { generateArticleHTML } from '../article-template.js';
import { escapeHtml } from '../html-utils.js';
import {
  calculateCoalitionRiskIndex,
  detectAnomalousPatterns,
  generateTrendComparison,
} from '../data-transformers/risk-analysis.js';
import type {
  CoalitionRiskIndex,
  AnomalyFlag,
  TrendComparison,
} from '../data-transformers/risk-analysis.js';
import type { Language } from '../types/language.js';
import type { ArticleCategory, GeneratedArticle, GenerationResult, MCPCallRecord } from '../types/article.js';

/** Swedish government coalition parties (current Tidö coalition) */
const GOVERNMENT_PARTIES = new Set(['M', 'KD', 'L', 'SD']);

/** Swedish opposition parties */
const OPPOSITION_PARTIES = new Set(['S', 'V', 'MP', 'C']);

/** Allowlist of severity values for anomaly CSS class injection */
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

/**
 * Required MCP tools for weekly-review articles
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'search_dokument',
  'get_dokument_innehall',
  'search_anforanden',
  'get_betankanden',
  'get_propositioner',
  'get_motioner',
  'search_voteringar',
];

export interface TitleSet {
  title: string;
  subtitle: string;
}

export interface WeeklyReviewValidationResult {
  hasWeeklySummary: boolean;
  hasMinimumSources: boolean;
  hasRetrospectiveTone: boolean;
  hasKeyOutcomes: boolean;
  passed: boolean;
}

export interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface GenerationOptions {
  languages?: Language[];
  lookbackDays?: number;
  writeArticle?: ((html: string, filename: string) => Promise<void | boolean>) | null;
}

/** Shape of a single voting record returned by search_voteringar */
export interface VotingRecord {
  parti?: string;
  /** Ja | Nej | Avstår | Frånvarande */
  rost?: string;
  bet?: string;
  punkt?: string;
  /** ISO date string (YYYY-MM-DD) used for post-query date filtering */
  datum?: string;
  [key: string]: unknown;
}

/** Coalition stress analysis result derived from voting records */
export interface CoalitionStressResult {
  /** Number of vote points where the government bloc position (Ja/Nej) matched the chamber majority */
  governmentWins: number;
  /** Number of vote points where the government bloc position did not match the chamber majority */
  governmentLosses: number;
  /** Vote points where opposition parties voted with the government */
  crossPartyVotes: number;
  /** Vote points with internal government-bloc defections */
  defections: number;
  /** Composite risk index from risk-analysis.ts */
  riskIndex: CoalitionRiskIndex;
  /** Detected anomaly flags from risk-analysis.ts */
  anomalies: AnomalyFlag[];
  /** Total distinct vote-points analysed */
  totalVotes: number;
}

/** Week-over-week comparative metrics */
export interface WeekOverWeekMetrics {
  currentDocuments: number;
  currentSpeeches: number;
  currentVotes: number;
  trendComparison: TrendComparison;
  activityChange: 'increasing' | 'stable' | 'declining';
}

/**
 * Format date for article slug
 */
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

/** Current Riksdag parties (2022 election onwards). */
const RIKSDAG_PARTIES = new Set(['M', 'SD', 'KD', 'L', 'C', 'S', 'V', 'MP']);

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
 * risk-analysis.ts multiplies it by 100, so a whole-percent value (e.g. 15)
 * would produce 1500 and break risk calculations.
 */
function normalizedCIAContext(ctx: CIAContext): CIAContext {
  const defProb = ctx.coalitionStability?.defectionProbability;
  if (typeof defProb !== 'number') return ctx;

  let normalized: number;
  if (!Number.isFinite(defProb)) {
    normalized = 0;
  } else if (defProb > 1) {
    // Treat as whole-percent and convert to fraction, then clamp
    normalized = Math.min(1, Math.max(0, defProb / 100));
  } else {
    // Already fraction form — clamp negatives to 0
    normalized = Math.max(0, defProb);
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
export function analyzeCoalitionStress(
  votingRecords: VotingRecord[],
  ciaContext: CIAContext,
): CoalitionStressResult {
  const GOV_PARTIES = GOVERNMENT_PARTIES;
  const OPP_PARTIES = OPPOSITION_PARTIES;

  // Group records by vote-point
  const byPoint = new Map<string, VotingRecord[]>();
  for (const record of votingRecords) {
    const key = `${record.bet ?? 'unknown'}-${record.punkt ?? '0'}`;
    if (!byPoint.has(key)) byPoint.set(key, []);
    byPoint.get(key)!.push(record);
  }

  let governmentWins = 0;
  let governmentLosses = 0;
  let crossPartyVotes = 0;
  let defections = 0;

  for (const records of byPoint.values()) {
    const totalYes = records.filter(r => r.rost === 'Ja').length;
    const totalNo  = records.filter(r => r.rost === 'Nej').length;

    const govYes = records.filter(r => GOV_PARTIES.has(r.parti ?? '') && r.rost === 'Ja').length;
    const govNo  = records.filter(r => GOV_PARTIES.has(r.parti ?? '') && r.rost === 'Nej').length;
    const oppYes = records.filter(r => OPP_PARTIES.has(r.parti ?? '') && r.rost === 'Ja').length;
    const oppNo  = records.filter(r => OPP_PARTIES.has(r.parti ?? '') && r.rost === 'Nej').length;

    // Determine government position — skip if the bloc is evenly split (no clear position)
    const govPositionClear = govYes !== govNo;
    const govPosition = govYes > govNo ? 'Ja' : 'Nej';

    // Government wins when its position matches the chamber majority
    if (govPositionClear && totalYes !== totalNo) {
      const governmentWon =
        (govPosition === 'Ja' && totalYes > totalNo) ||
        (govPosition === 'Nej' && totalNo > totalYes);
      if (governmentWon) { governmentWins++; }
      else { governmentLosses++; }
    }

    // Cross-party: opposition aligned with government position (Ja or Nej)
    const oppAlignedWithGov = govPosition === 'Ja' ? oppYes > 0 : oppNo > 0;
    if (govPositionClear && oppAlignedWithGov) crossPartyVotes++;
    // Defection: government bloc members split
    if (govYes > 0 && govNo > 0) defections++;
  }

  const normCtx = normalizedCIAContext(ciaContext);
  return {
    governmentWins,
    governmentLosses,
    crossPartyVotes,
    defections,
    riskIndex: calculateCoalitionRiskIndex(normCtx),
    anomalies: detectAnomalousPatterns(normCtx),
    totalVotes: byPoint.size,
  };
}

/**
 * Calculate current-week activity metrics with CIA trend direction.
 *
 * Returns the count of documents, speeches, and distinct vote-points
 * collected during the current week, together with the CIA trend comparison
 * (30/90/365-day coalition stability trajectory) mapped to a simple
 * increasing/stable/declining direction.
 *
 * NOTE: This is not a prior-week comparison — `activityChange` reflects the
 * CIA coalition-stability trend direction, not a delta against last week.
 *
 * @param documents     - Documents collected this week
 * @param speeches      - Speeches collected this week
 * @param votingRecords - Voting records collected this week (already date-filtered)
 * @param ciaContext    - CIA intelligence context for trend analysis
 */
export function calculateWeekOverWeekMetrics(
  documents: RawDocument[],
  speeches: unknown[],
  votingRecords: VotingRecord[],
  ciaContext: CIAContext,
): WeekOverWeekMetrics {
  const trendComparison = generateTrendComparison(ciaContext);

  const activityChange: WeekOverWeekMetrics['activityChange'] =
    trendComparison.overallDirection === 'IMPROVING'
      ? 'increasing'
      : trendComparison.overallDirection === 'DECLINING' || trendComparison.overallDirection === 'VOLATILE'
      ? 'declining'
      : 'stable';

  // Count distinct vote-points (bet + punkt) to align with coalition analysis semantics
  const uniqueVotePoints = new Set<string>();
  for (const record of votingRecords) {
    if (record.bet && record.punkt) {
      uniqueVotePoints.add(`${record.bet}-${record.punkt}`);
    }
  }
  const currentVotes = uniqueVotePoints.size > 0 ? uniqueVotePoints.size : votingRecords.length;

  return {
    currentDocuments: documents.length,
    currentSpeeches: speeches.length,
    currentVotes,
    trendComparison,
    activityChange,
  };
}

/** Coalition Dynamics section labels for all 14 languages */
const COALITION_DYNAMICS_LABELS: Readonly<Record<Language, string>> = {
  en: 'Coalition Dynamics',
  sv: 'Koalitionsdynamik',
  da: 'Koalitionsdynamik',
  no: 'Koalisjonsdynamikk',
  fi: 'Koalitionidynamiikka',
  de: 'Koalitionsdynamik',
  fr: 'Dynamique de coalition',
  es: 'Dinámica de coalición',
  nl: 'Coalitiedynamiek',
  ar: 'ديناميكيات الائتلاف',
  he: 'דינמיקת קואליציה',
  ja: '連立の動向',
  ko: '연립 동향',
  zh: '联合政府动态',
};

/** Risk level labels for all 14 languages */
const RISK_LEVEL_LABELS: Readonly<Record<Language, Record<string, string>>> = {
  en: { LOW: 'Low', MEDIUM: 'Moderate', HIGH: 'High', CRITICAL: 'Critical' },
  sv: { LOW: 'Låg', MEDIUM: 'Måttlig', HIGH: 'Hög', CRITICAL: 'Kritisk' },
  da: { LOW: 'Lav', MEDIUM: 'Moderat', HIGH: 'Høj', CRITICAL: 'Kritisk' },
  no: { LOW: 'Lav', MEDIUM: 'Moderat', HIGH: 'Høy', CRITICAL: 'Kritisk' },
  fi: { LOW: 'Matala', MEDIUM: 'Kohtalainen', HIGH: 'Korkea', CRITICAL: 'Kriittinen' },
  de: { LOW: 'Gering', MEDIUM: 'Moderat', HIGH: 'Hoch', CRITICAL: 'Kritisch' },
  fr: { LOW: 'Faible', MEDIUM: 'Modéré', HIGH: 'Élevé', CRITICAL: 'Critique' },
  es: { LOW: 'Bajo', MEDIUM: 'Moderado', HIGH: 'Alto', CRITICAL: 'Crítico' },
  nl: { LOW: 'Laag', MEDIUM: 'Matig', HIGH: 'Hoog', CRITICAL: 'Kritiek' },
  ar: { LOW: 'منخفض', MEDIUM: 'معتدل', HIGH: 'مرتفع', CRITICAL: 'حرج' },
  he: { LOW: 'נמוך', MEDIUM: 'בינוני', HIGH: 'גבוה', CRITICAL: 'קריטי' },
  ja: { LOW: '低', MEDIUM: '中程度', HIGH: '高', CRITICAL: '危機的' },
  ko: { LOW: '낮음', MEDIUM: '보통', HIGH: '높음', CRITICAL: '위급' },
  zh: { LOW: '低', MEDIUM: '中等', HIGH: '高', CRITICAL: '危急' },
};

/** Coalition Dynamics stats labels for all 14 languages */
const COALITION_STATS_LABELS: Readonly<Record<Language, {
  score: string; level: string; wins: string; losses: string;
  cross: string; defections: string; votes: string;
}>> = {
  en: { score: 'Risk score', level: 'Risk level', wins: 'Government wins', losses: 'Government losses', cross: 'Cross-party votes', defections: 'Internal defections', votes: 'Vote points analysed' },
  sv: { score: 'Riskpoäng', level: 'Risknivå', wins: 'Regeringsvinster', losses: 'Regeringsförluster', cross: 'Partiöverskridande röster', defections: 'Interna avhopp', votes: 'Analyserade röstpunkter' },
  da: { score: 'Risikoscore', level: 'Risikoniveau', wins: 'Regeringsgevinster', losses: 'Regeringstab', cross: 'Tværpartilige stemmer', defections: 'Interne afhopp', votes: 'Analyserede afstemningspunkter' },
  no: { score: 'Risikoscore', level: 'Risikonivå', wins: 'Regjeringsseire', losses: 'Regjeringstap', cross: 'Tverrpartistemmer', defections: 'Interne avhopp', votes: 'Analyserte voteringspunkter' },
  fi: { score: 'Riskipisteet', level: 'Riskitaso', wins: 'Hallituksen voitot', losses: 'Hallituksen tappiot', cross: 'Puoluerajat ylittävät äänet', defections: 'Sisäiset loikkaukset', votes: 'Analysoidut äänestyskohteet' },
  de: { score: 'Risikowert', level: 'Risikoniveau', wins: 'Regierungssiege', losses: 'Regierungsniederlagen', cross: 'Überparteiliche Abstimmungen', defections: 'Interne Abweichungen', votes: 'Analysierte Abstimmungspunkte' },
  fr: { score: 'Score de risque', level: 'Niveau de risque', wins: 'Victoires gouvernementales', losses: 'Défaites gouvernementales', cross: 'Votes transpartisans', defections: 'Défections internes', votes: 'Points de vote analysés' },
  es: { score: 'Puntuación de riesgo', level: 'Nivel de riesgo', wins: 'Victorias gubernamentales', losses: 'Derrotas gubernamentales', cross: 'Votos transversales', defections: 'Defecciones internas', votes: 'Puntos de votación analizados' },
  nl: { score: 'Risicoscore', level: 'Risiconiveau', wins: 'Regeringsoverwinningen', losses: 'Regeringsnederlagen', cross: 'Stemmen over partijgrenzen', defections: 'Interne defecties', votes: 'Geanalyseerde stemmentpunten' },
  ar: { score: 'درجة الخطر', level: 'مستوى الخطر', wins: 'انتصارات الحكومة', losses: 'خسائر الحكومة', cross: 'تصويتات متعددة الأحزاب', defections: 'الانشقاقات الداخلية', votes: 'نقاط التصويت المحللة' },
  he: { score: 'ציון סיכון', level: 'רמת סיכון', wins: 'ניצחונות ממשלתיים', losses: 'הפסדים ממשלתיים', cross: 'הצבעות חוצות-מפלגות', defections: 'עריקות פנימיות', votes: 'נקודות הצבעה שנותחו' },
  ja: { score: 'リスクスコア', level: 'リスクレベル', wins: '政府の勝利', losses: '政府の敗北', cross: '超党派投票', defections: '内部離反', votes: '分析された投票点' },
  ko: { score: '위험 점수', level: '위험 수준', wins: '정부 승리', losses: '정부 패배', cross: '초당파 표결', defections: '내부 이탈', votes: '분석된 표결 항목' },
  zh: { score: '风险评分', level: '风险等级', wins: '政府获胜', losses: '政府失败', cross: '跨党派投票', defections: '内部叛离', votes: '分析的表决点' },
};

/**
 * Generate the "Coalition Dynamics" HTML section for the given language.
 * Shows risk index, government wins/losses, cross-party votes, defections,
 * and any anomaly flags detected this week.
 */
export function generateCoalitionDynamicsSection(
  stress: CoalitionStressResult,
  lang: Language,
): string {
  const heading = COALITION_DYNAMICS_LABELS[lang] ?? COALITION_DYNAMICS_LABELS.en;
  const riskLabels = RISK_LEVEL_LABELS[lang] ?? RISK_LEVEL_LABELS.en;
  const riskLevelLabel = riskLabels[stress.riskIndex.level] ?? stress.riskIndex.level;

  const lbl = COALITION_STATS_LABELS[lang] ?? COALITION_STATS_LABELS.en;

  let html = `\n    <h2>${escapeHtml(heading)}</h2>\n`;
  html += `    <div class="context-box">\n`;
  html += `      <p>${escapeHtml(stress.riskIndex.summary)}</p>\n`;
  html += `      <ul>\n`;
  html += `        <li><strong>${escapeHtml(lbl.score)}:</strong> ${stress.riskIndex.score}/100</li>\n`;
  html += `        <li><strong>${escapeHtml(lbl.level)}:</strong> ${escapeHtml(riskLevelLabel)}</li>\n`;

  if (stress.totalVotes > 0) {
    html += `        <li><strong>${escapeHtml(lbl.votes)}:</strong> ${stress.totalVotes}</li>\n`;
    html += `        <li><strong>${escapeHtml(lbl.wins)}:</strong> ${stress.governmentWins}</li>\n`;
    html += `        <li><strong>${escapeHtml(lbl.losses)}:</strong> ${stress.governmentLosses}</li>\n`;
    if (stress.crossPartyVotes > 0) {
      html += `        <li><strong>${escapeHtml(lbl.cross)}:</strong> ${stress.crossPartyVotes}</li>\n`;
    }
    if (stress.defections > 0) {
      html += `        <li><strong>${escapeHtml(lbl.defections)}:</strong> ${stress.defections}</li>\n`;
    }
  }

  html += `      </ul>\n`;

  if (stress.anomalies.length > 0) {
    html += `      <ul>\n`;
    for (const anomaly of stress.anomalies.slice(0, 3)) {
      html += `        <li class="anomaly-flag severity-${VALID_SEVERITIES.has(anomaly.severity.toLowerCase()) ? anomaly.severity.toLowerCase() : 'low'}">${escapeHtml(anomaly.description)}</li>\n`;
    }
    html += `      </ul>\n`;
  }

  html += `    </div>\n`;
  return html;
}

/** Weekly Activity section labels for all 14 languages */
const WEEK_OVER_WEEK_LABELS: Readonly<Record<Language, string>> = {
  en: 'Weekly Activity',
  sv: 'Veckans aktivitet',
  da: 'Ugentlig aktivitet',
  no: 'Ukentlig aktivitet',
  fi: 'Viikon toiminta',
  de: 'Wöchentliche Aktivität',
  fr: 'Activité hebdomadaire',
  es: 'Actividad semanal',
  nl: 'Wekelijkse activiteit',
  ar: 'النشاط الأسبوعي',
  he: 'פעילות שבועית',
  ja: '今週の活動',
  ko: '주간 활동',
  zh: '本周活动',
};

/** Weekly Activity metric labels for all 14 languages */
const WEEKLY_ACTIVITY_LABELS: Readonly<Record<Language, {
  documents: string; speeches: string; votes: string; trend: string;
  direction: string; insights: string; increasing: string; stable: string; declining: string;
}>> = {
  en: { documents: 'Documents', speeches: 'Speeches', votes: 'Votes', trend: 'Stability trend', direction: 'CIA stability trend', insights: 'Trend insights', increasing: 'Improving ↑', stable: 'Stable →', declining: 'Declining ↓' },
  sv: { documents: 'Dokument', speeches: 'Anföranden', votes: 'Voteringar', trend: 'Stabilitetstrend', direction: 'CIA-stabilitetstrend', insights: 'Trendinsikter', increasing: 'Förbättrad ↑', stable: 'Stabilt →', declining: 'Minskande ↓' },
  da: { documents: 'Dokumenter', speeches: 'Taler', votes: 'Afstemninger', trend: 'Stabilitetstrend', direction: 'CIA-stabilitetstrend', insights: 'Trendindsigter', increasing: 'Forbedret ↑', stable: 'Stabilt →', declining: 'Faldende ↓' },
  no: { documents: 'Dokumenter', speeches: 'Taler', votes: 'Voteringer', trend: 'Stabilitetstrend', direction: 'CIA-stabilitetstrend', insights: 'Trendinnsikter', increasing: 'Forbedret ↑', stable: 'Stabilt →', declining: 'Synkende ↓' },
  fi: { documents: 'Asiakirjat', speeches: 'Puheenvuorot', votes: 'Äänestykset', trend: 'Vakaustrendit', direction: 'CIA-vakaustrendi', insights: 'Trendianalyysit', increasing: 'Paraneva ↑', stable: 'Vakaa →', declining: 'Laskeva ↓' },
  de: { documents: 'Dokumente', speeches: 'Reden', votes: 'Abstimmungen', trend: 'Stabilitätstrend', direction: 'CIA-Stabilitätstrend', insights: 'Trendeinblicke', increasing: 'Verbessernd ↑', stable: 'Stabil →', declining: 'Abnehmend ↓' },
  fr: { documents: 'Documents', speeches: 'Discours', votes: 'Votes', trend: 'Tendance de stabilité', direction: 'Tendance stabilité CIA', insights: 'Aperçus des tendances', increasing: 'En amélioration ↑', stable: 'Stable →', declining: 'En baisse ↓' },
  es: { documents: 'Documentos', speeches: 'Discursos', votes: 'Votaciones', trend: 'Tendencia de estabilidad', direction: 'Tendencia estabilidad CIA', insights: 'Perspectivas de tendencia', increasing: 'Mejorando ↑', stable: 'Estable →', declining: 'En descenso ↓' },
  nl: { documents: 'Documenten', speeches: 'Toespraken', votes: 'Stemmingen', trend: 'Stabiliteitstrend', direction: 'CIA-stabiliteitsrend', insights: 'Trendinzichten', increasing: 'Verbeterend ↑', stable: 'Stabiel →', declining: 'Afnemend ↓' },
  ar: { documents: 'وثائق', speeches: 'خطب', votes: 'عمليات التصويت', trend: 'اتجاه الاستقرار', direction: 'اتجاه استقرار CIA', insights: 'رؤى الاتجاه', increasing: 'تحسّن ↑', stable: 'مستقر →', declining: 'متناقص ↓' },
  he: { documents: 'מסמכים', speeches: 'נאומים', votes: 'הצבעות', trend: 'מגמת יציבות', direction: 'מגמת יציבות CIA', insights: 'תובנות מגמה', increasing: 'משתפר ↑', stable: 'יציב →', declining: 'יורד ↓' },
  ja: { documents: '文書', speeches: '演説', votes: '採決', trend: '安定性トレンド', direction: 'CIA安定性トレンド', insights: 'トレンド考察', increasing: '改善中 ↑', stable: '安定 →', declining: '低下中 ↓' },
  ko: { documents: '문서', speeches: '연설', votes: '표결', trend: '안정성 추세', direction: 'CIA 안정성 추세', insights: '추세 인사이트', increasing: '개선 중 ↑', stable: '안정적 →', declining: '감소 중 ↓' },
  zh: { documents: '文件', speeches: '演讲', votes: '表决', trend: '稳定性趋势', direction: 'CIA稳定性趋势', insights: '趋势洞察', increasing: '改善中 ↑', stable: '稳定 →', declining: '下降中 ↓' },
};

/**
 * Generate the "Weekly Activity" HTML section for the given language.
 * Shows current-week activity counts (documents, speeches, vote-points),
 * the CIA coalition-stability trend direction, and trend insights.
 *
 * NOTE: The "direction" field reflects the CIA stability trend (30/90/365-day),
 * not a comparison against last week's counts.
 */
export function generateWeekOverWeekSection(
  metrics: WeekOverWeekMetrics,
  lang: Language,
): string {
  const heading = WEEK_OVER_WEEK_LABELS[lang] ?? WEEK_OVER_WEEK_LABELS.en;

  const lbl = WEEKLY_ACTIVITY_LABELS[lang] ?? WEEKLY_ACTIVITY_LABELS.en;
  const directionText = metrics.activityChange === 'increasing'
    ? lbl.increasing
    : metrics.activityChange === 'declining'
    ? lbl.declining
    : lbl.stable;

  let html = `\n    <h2>${escapeHtml(heading)}</h2>\n`;
  html += `    <div class="context-box">\n`;
  html += `      <ul>\n`;
  html += `        <li><strong>${escapeHtml(lbl.documents)}:</strong> ${metrics.currentDocuments}</li>\n`;
  html += `        <li><strong>${escapeHtml(lbl.speeches)}:</strong> ${metrics.currentSpeeches}</li>\n`;
  if (metrics.currentVotes > 0) {
    html += `        <li><strong>${escapeHtml(lbl.votes)}:</strong> ${metrics.currentVotes}</li>\n`;
  }
  html += `        <li><strong>${escapeHtml(lbl.direction)}:</strong> ${escapeHtml(directionText)}</li>\n`;
  html += `      </ul>\n`;

  if (metrics.trendComparison.insights.length > 0) {
    html += `      <p><strong>${escapeHtml(lbl.insights)}:</strong> ${escapeHtml(metrics.trendComparison.insights[0] ?? '')}</p>\n`;
  }

  html += `    </div>\n`;
  return html;
}

/**
 * Generate Weekly Review article in specified languages
 */
export async function generateWeeklyReview(options: GenerationOptions = {}): Promise<GenerationResult> {
  const { languages = ['en', 'sv'], lookbackDays = 7, writeArticle = null } = options;

  console.log('📊 Generating Weekly Review article (full-document analysis pipeline)...');

  const mcpCalls: MCPCallRecord[] = [];

  try {
    const client = new MCPClient();

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - lookbackDays);

    const fromStr = formatDateForSlug(startDate);
    const toStr = formatDateForSlug(today);

    console.log(`  🔄 Step 1 — Searching documents ${fromStr} → ${toStr}...`);

    // ── Step 1: search_dokument to discover IDs and types ──────────────────
    const allDocs = await client.searchDocuments({
      from_date: fromStr,
      to_date: toStr,
      limit: 200,
    });

    mcpCalls.push({ tool: 'search_dokument', result: allDocs });

    const filterRecent = (docs: unknown[]): RawDocument[] =>
      (docs as RawDocument[]).filter(d => {
        const date = (d as Record<string, string>).datum ?? (d as Record<string, string>).publicerad ?? '';
        return date >= fromStr && date <= toStr;
      });

    // ── Step 2: type-specific fetchers for richer metadata (non-fatal) ─────
    console.log('  🔄 Step 2 — Fetching typed metadata (reports, propositions, motions)...');
    const [reports, propositions, motions] = await Promise.all([
      Promise.resolve()
        .then(() => client.fetchCommitteeReports(50, '2025/26') as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch committee reports:', err); return [] as unknown[]; }),
      Promise.resolve()
        .then(() => client.fetchPropositions(50, '2025/26') as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch propositions:', err); return [] as unknown[]; }),
      Promise.resolve()
        .then(() => client.fetchMotions(50, '2025/26') as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch motions:', err); return [] as unknown[]; }),
    ]);

    const recentReports = filterRecent(reports);
    const recentPropositions = filterRecent(propositions);
    const recentMotions = filterRecent(motions);

    for (const d of recentReports) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'bet'; }
    for (const d of recentPropositions) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'prop'; }
    for (const d of recentMotions) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'mot'; }

    mcpCalls.push({ tool: 'get_betankanden', result: recentReports });
    mcpCalls.push({ tool: 'get_propositioner', result: recentPropositions });
    mcpCalls.push({ tool: 'get_motioner', result: recentMotions });

    // Merge: typed docs (with dok_id) are highest quality; supplement with
    // real documents from general search (those that have both dok_id and doktyp).
    const typedDocs = [...recentReports, ...recentPropositions, ...recentMotions];
    const typedDocIds = new Set<string>(
      typedDocs.flatMap(d => {
        const id = (d as Record<string, string>).dok_id;
        return id ? [id] : [];
      }),
    );

    const searchExtras = (allDocs as RawDocument[]).filter(d => {
      const id = (d as Record<string, string>).dok_id;
      const type = (d as Record<string, string>).doktyp;
      return id && type && !typedDocIds.has(id);
    });

    // Use typed + extras when available; fall back to raw search results (test mocks / edge cases)
    const documents: RawDocument[] =
      typedDocs.length > 0 || searchExtras.length > 0
        ? [...typedDocs, ...searchExtras]
        : (allDocs as RawDocument[]);

    console.log(`  📊 Found ${documents.length} documents (${recentReports.length} reports, ${recentPropositions.length} propositions, ${recentMotions.length} motions)`);

    if (documents.length === 0) {
      console.log('  ℹ️ No documents found for the past week, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    // ── Step 3: load each document completely via get_dokument_innehall ────
    console.log('  🔄 Step 3 — Loading full document content...');
    await enrichWithFullText(client, documents, mcpCalls, 3);

    // ── Step 4: fetch speeches from the period ─────────────────────────────
    console.log('  🔄 Step 4 — Fetching speeches from the period...');
    const speeches = await Promise.resolve()
      .then(() => client.searchSpeeches({ rm: '2025/26', from: fromStr, to: toStr, limit: 100 }) as Promise<unknown[]>)
      .catch((err: unknown) => { console.error('Failed to fetch speeches:', err); return [] as unknown[]; });

    mcpCalls.push({ tool: 'search_anforanden', result: speeches });
    attachSpeechesToDocuments(documents, speeches as Array<Record<string, unknown>>);
    console.log(`  🗣 Found ${speeches.length} speeches`);

    // ── Step 5: load CIA intelligence context from static data ─────────────
    console.log('  🔄 Step 5 — Loading CIA intelligence context...');
    const ciaContext = loadCIAContext();
    console.log(`  🧠 CIA context: ${ciaContext.partyPerformance.length} parties, coalition stability ${ciaContext.coalitionStability.stabilityScore}/100, motion denial rate ${ciaContext.overallMotionDenialRate}%`);

    // ── Step 6: fetch voting records for coalition stress analysis ─────────
    console.log('  🔄 Step 6 — Fetching voting records for coalition stress analysis...');
    let votingRecords: unknown[] = [];
    try {
      // search_voteringar does not support date params; use rm+limit then filter by datum.
      // Derive the riksmöte(s) from both ends of the date range in case the window crosses
      // the September session boundary (e.g. late Aug → early Sep lookback).
      const startRmYear = startDate.getMonth() >= 8 ? startDate.getFullYear() : startDate.getFullYear() - 1;
      const endRmYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
      const rmValues: string[] = [];
      rmValues.push(`${startRmYear}/${String(startRmYear + 1).slice(-2)}`);
      if (endRmYear !== startRmYear) {
        const endRm = `${endRmYear}/${String(endRmYear + 1).slice(-2)}`;
        if (!rmValues.includes(endRm)) rmValues.push(endRm);
      }
      const allVotesArrays = await Promise.all(
        rmValues.map(rm => client.fetchVotingRecords({ rm, limit: 200 }) as Promise<VotingRecord[]>),
      );
      const allVotes: VotingRecord[] = allVotesArrays.flat();
      // Post-query filter to the weekly window using the datum field.
      // Normalize to YYYY-MM-DD in case datum includes a time component.
      votingRecords = allVotes.filter(r => {
        const d = r.datum;
        if (typeof d !== 'string') return false;
        const dateStr = d.includes('T') ? d.split('T')[0] : d;
        return dateStr >= fromStr && dateStr <= toStr;
      });
    } catch (err: unknown) {
      console.error('Failed to fetch voting records:', err);
    }

    mcpCalls.push({ tool: 'search_voteringar', result: votingRecords });
    console.log(`  🗳 Found ${votingRecords.length} voting records`);

    // ── Compute coalition stress and week-over-week metrics ────────────────
    const coalitionStress = analyzeCoalitionStress(votingRecords as VotingRecord[], ciaContext);
    const weekMetrics = calculateWeekOverWeekMetrics(documents, speeches, votingRecords as VotingRecord[], ciaContext);
    console.log(`  📈 Coalition risk: ${coalitionStress.riskIndex.level} (${coalitionStress.riskIndex.score}/100), activity: ${weekMetrics.activityChange}`);

    // ── Generate articles ──────────────────────────────────────────────────
    const slug = `${formatDateForSlug(today)}-weekly-review`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const content: string = generateArticleContent({ documents, ciaContext }, 'weekly-review', lang);
      const coalitionSection: string = generateCoalitionDynamicsSection(coalitionStress, lang);
      const weekOverWeekSection: string = generateWeekOverWeekSection(weekMetrics, lang);
      const fullContent: string = content + coalitionSection + weekOverWeekSection;
      const watchPoints = extractWatchPoints({ documents, ciaContext }, lang);
      const metadata = generateMetadata({ documents, ciaContext }, 'weekly-review', lang);
      const readTime: string = calculateReadTime(fullContent);
      const sources: string[] = generateSources([
        'search_dokument',
        'get_dokument_innehall',
        'search_anforanden',
        'get_betankanden',
        'get_propositioner',
        'get_motioner',
        'search_voteringar',
      ]);

      const titles: TitleSet = getTitles(lang, documents.length);

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0] ?? '',
        type: 'retrospective' as ArticleCategory,
        readTime,
        lang,
        content: fullContent,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      articles.push({
        lang,
        html,
        filename: `${slug}-${lang}.html`,
        slug: `${slug}-${lang}`
      });

      if (writeArticle) {
        await writeArticle(html, `${slug}-${lang}.html`);
        console.log(`  ✅ ${lang.toUpperCase()} version generated`);
      }
    }

    return {
      success: true,
      files: languages.length,
      slug,
      articles,
      mcpCalls,
      crossReferences: {
        event: `${documents.length} documents over ${lookbackDays} days`,
        sources: ['search_dokument', 'get_dokument_innehall', 'search_anforanden', 'get_betankanden', 'get_propositioner', 'get_motioner', 'search_voteringar']
      }
    };
  } catch (error: unknown) {
    console.error('❌ Error generating Weekly Review:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      mcpCalls
    };
  }
}

/**
 * Get language-specific titles
 */
function getTitles(lang: Language, documentCount: number): TitleSet {
  const titles: Record<Language, TitleSet> = {
    en: {
      title: `Weekly Review: Parliament in Retrospect`,
      subtitle: `Analysis of ${documentCount} key developments from the past week in Swedish politics`
    },
    sv: {
      title: `Veckans sammanfattning: Riksdagen i retrospektiv`,
      subtitle: `Analys av ${documentCount} viktiga händelser från den gångna veckan`
    },
    da: {
      title: `Ugentlig gennemgang: Parlamentet i tilbageblik`,
      subtitle: `Analyse af ${documentCount} vigtige begivenheder fra den forgangne uge`
    },
    no: {
      title: `Ukentlig gjennomgang: Stortinget i retrospekt`,
      subtitle: `Analyse av ${documentCount} viktige hendelser fra den siste uken`
    },
    fi: {
      title: `Viikkokatsaus: Eduskunta jälkikäteen`,
      subtitle: `Analyysi ${documentCount} tärkeästä tapahtumasta viime viikolta`
    },
    de: {
      title: `Wochenrückblick: Parlament in Rückschau`,
      subtitle: `Analyse von ${documentCount} wichtigen Entwicklungen der vergangenen Woche`
    },
    fr: {
      title: `Revue hebdomadaire : Le Parlement en rétrospective`,
      subtitle: `Analyse de ${documentCount} développements clés de la semaine écoulée`
    },
    es: {
      title: `Revisión semanal: El Parlamento en retrospectiva`,
      subtitle: `Análisis de ${documentCount} desarrollos clave de la semana pasada`
    },
    nl: {
      title: `Wekelijkse terugblik: Parlement in retrospectief`,
      subtitle: `Analyse van ${documentCount} belangrijke ontwikkelingen van de afgelopen week`
    },
    ar: {
      title: `المراجعة الأسبوعية: البرلمان في استعراض`,
      subtitle: `تحليل ${documentCount} تطورات رئيسية من الأسبوع الماضي`
    },
    he: {
      title: `סקירה שבועית: הפרלמנט בראי`,
      subtitle: `ניתוח ${documentCount} התפתחויות מרכזיות מהשבוע שעבר`
    },
    ja: {
      title: `週間レビュー：議会の振り返り`,
      subtitle: `先週の${documentCount}件の主要な動向の分析`
    },
    ko: {
      title: `주간 리뷰: 의회 회고`,
      subtitle: `지난 주 ${documentCount}건의 주요 동향 분석`
    },
    zh: {
      title: `每周回顾：议会回顾`,
      subtitle: `过去一周${documentCount}项重要发展的分析`
    }
  };

  return titles[lang] || titles.en;
}

/**
 * Validate weekly review article structure
 */
export function validateWeeklyReview(article: ArticleInput): WeeklyReviewValidationResult {
  const hasWeeklySummary = checkWeeklySummary(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasRetrospectiveTone = checkRetrospectiveTone(article);
  const hasKeyOutcomes = checkKeyOutcomes(article);

  return {
    hasWeeklySummary,
    hasMinimumSources,
    hasRetrospectiveTone,
    hasKeyOutcomes,
    passed: hasWeeklySummary && hasMinimumSources && hasRetrospectiveTone && hasKeyOutcomes
  };
}

function checkWeeklySummary(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('week') ||
         article.content.toLowerCase().includes('summary') ||
         article.content.toLowerCase().includes('review');
}

function countSources(article: ArticleInput): number {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkRetrospectiveTone(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const retroKeywords = ['concluded', 'passed', 'voted', 'decided', 'approved', 'rejected', 'completed'];
  return retroKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}

function checkKeyOutcomes(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const outcomeKeywords = ['outcome', 'result', 'decision', 'passed', 'adopted'];
  return outcomeKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}
