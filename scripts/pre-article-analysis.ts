#!/usr/bin/env tsx
/**
 * @module pre-article-analysis
 * @description Pre-article data download and deep analysis pipeline.
 *
 * Orchestrates all analysis steps before article generation:
 * 1. Download all relevant parliamentary documents from riksdag-regering-mcp
 * 2. Political classification — Classify each document by significance, impact, domain
 * 3. Risk assessment — Assess political risks (coalition stability, anomaly detection)
 * 4. SWOT analysis — Generate political SWOT for relevant actors
 * 5. Threat analysis — Identify threats from SWOT contributions
 * 6. Stakeholder perspective analysis — Run all 6 lenses
 * 7. Significance scoring — Score all documents (0–10)
 * 8. Cross-reference mapping — Identify relationships between documents
 * 9. Synthesis — Combined analysis summary integrating all methods
 * 10. Persist — Write structured markdown to analysis/daily/YYYY-MM-DD/
 *
 * Usage:
 *   npx tsx scripts/pre-article-analysis.ts [--date YYYY-MM-DD] [--limit N]
 *   npx tsx scripts/pre-article-analysis.ts --aggregate weekly [--date YYYY-WNN]
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MCPClient } from './mcp-client/client.js';
import { calculateCoalitionRiskIndex, detectAnomalousPatterns } from './data-transformers/risk-analysis.js';
import type { RawDocument, CIAContext } from './data-transformers/types.js';
import { loadCIAContext } from './news-types/weekly-review/index.js';
import { normalizedCIAContext } from './news-types/weekly-review/data-loader.js';

import {
  downloadAllDocuments,
  flattenDocuments,
  subtractBusinessDays,
  MAX_LOOKBACK_BUSINESS_DAYS,
} from './pre-article-analysis/data-downloader.js';
import type { DocumentTypeKey } from './pre-article-analysis/data-downloader.js';

import { persistDownloadedData } from './pre-article-analysis/data-persistence.js';

import type {
  SerializationContext,
  SignificanceEntry,
  RiskAssessmentResult,
  SwotSummary,
  CrossReferenceSummary,
  SynthesisSummary,
} from './pre-article-analysis/markdown-serializer.js';

import {
  serializeDataManifest,
  serializeClassificationResults,
  serializeRiskAssessment,
  serializeSwotAnalysis,
  serializeThreatAnalysis,
  serializeStakeholderPerspectives,
  serializeSignificanceScoring,
  serializeCrossReferenceMap,
  serializeSynthesisSummary,
  serializeDocumentAnalysis,
  sanitizeDokId,
} from './pre-article-analysis/markdown-serializer.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ANALYSIS_DIR = path.join(REPO_ROOT, 'analysis');

function formatTimestampForMarkdown(date: Date = new Date()): string {
  return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

export function parseArgs(argv: string[]): {
  date: string;
  aggregate: boolean;
  limit: number;
  weekLabel: string | null;
  rm: string | null;
  docType: DocumentTypeKey | null;
  documentIds: string[];
} {
  const args = argv.slice(2);
  const get = (flag: string): string | null => {
    const idx = args.indexOf(flag);
    if (idx === -1) {
      return null;
    }
    const next = args[idx + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`Missing value for ${flag}.`);
    }
    return next;
  };

  const dateArg = get('--date');
  const aggregateArg = get('--aggregate');
  const aggregate = (() => {
    if (aggregateArg === null) {
      return false;
    }
    if (aggregateArg === 'weekly') {
      return true;
    }
    throw new Error(`Invalid --aggregate value: ${aggregateArg}. Supported value: 'weekly'.`);
  })();

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  // When aggregate weekly, --date supplies the week label (YYYY-WNN), not a
  // calendar date.  `date` is always a YYYY-MM-DD value (defaults to today).
  const weekLabel = aggregate
    ? (dateArg || `${now.getUTCFullYear()}-W${isoWeekNumber(now).toString().padStart(2, '0')}`)
    : null;
  if (aggregate && weekLabel && !parseIsoWeekLabel(weekLabel)) {
    throw new Error(`Invalid weekly --date value: ${weekLabel}. Expected YYYY-WNN.`);
  }

  if (dateArg && dateArg !== 'today' && !aggregate && !parseAndValidateIsoDate(dateArg)) {
    throw new Error(`Invalid --date value: ${dateArg}. Expected YYYY-MM-DD or 'today'.`);
  }

  // In aggregate mode, date is always today; the week-specific field is weekLabel.
  const isoDate = aggregate
    ? todayIso
    : (dateArg === 'today' || !dateArg ? todayIso : dateArg);

  const limitArg = get('--limit');
  const DEFAULT_LIMIT = 20;
  const parsedLimit = limitArg ? Number(limitArg) : DEFAULT_LIMIT;
  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    throw new Error(`Invalid --limit value: ${limitArg}. Expected a positive integer.`);
  }
  const limit = parsedLimit;
  const rm = get('--rm');

  const docTypeArg = get('--doc-type');
  const VALID_DOC_TYPES: readonly DocumentTypeKey[] = ['propositions', 'motions', 'committeeReports', 'votes', 'speeches', 'questions', 'interpellations'];
  const isDocumentTypeKey = (value: string): value is DocumentTypeKey =>
    VALID_DOC_TYPES.includes(value as DocumentTypeKey);
  let docType: DocumentTypeKey | null = null;
  if (docTypeArg !== null) {
    if (!isDocumentTypeKey(docTypeArg)) {
      throw new Error(
        `Invalid --doc-type value: ${docTypeArg}. Supported values: ${VALID_DOC_TYPES.join(', ')}.`,
      );
    }
    docType = docTypeArg;
  }

  // --document-ids: Comma-separated Riksdag dok_id values for deep-inspection.
  // When provided, these specific documents are fetched by ID and included in
  // analysis regardless of their date, ensuring deep-inspection batch analysis
  // files contain real content instead of "0 documents analyzed".
  const documentIdsArg = get('--document-ids');
  const DOK_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
  const documentIds = documentIdsArg
    ? documentIdsArg.split(',').map(id => id.trim()).filter(id => {
        if (!id) return false;
        if (!DOK_ID_PATTERN.test(id)) {
          console.warn(`⚠️ Skipping invalid document ID: ${id} (must be alphanumeric/hyphens/underscores only)`);
          return false;
        }
        return true;
      })
    : [];

  return { date: isoDate, aggregate, limit, weekLabel, rm, docType, documentIds };
}

function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function parseAndValidateIsoDate(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) return null;
  return d;
}

function riksMoteFromDate(dateStr: string): string {
  const parsed = parseAndValidateIsoDate(dateStr) ?? new Date();
  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;
  if (month >= 10) return `${year}/${String(year + 1).slice(-2)}`;
  return `${year - 1}/${String(year).slice(-2)}`;
}

function parseIsoWeekLabel(label: string): { year: number; week: number } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(label);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;
  return { year, week };
}

function isDateInIsoWeek(dateStr: string, weekLabel: string): boolean {
  const parsedDate = parseAndValidateIsoDate(dateStr);
  const parsedWeek = parseIsoWeekLabel(weekLabel);
  if (!parsedDate || !parsedWeek) return false;

  const isoThursday = new Date(parsedDate);
  const dayNum = isoThursday.getUTCDay() || 7;
  isoThursday.setUTCDate(isoThursday.getUTCDate() + 4 - dayNum);
  const isoYear = isoThursday.getUTCFullYear();
  const isoWeek = isoWeekNumber(parsedDate);

  return isoYear === parsedWeek.year && isoWeek === parsedWeek.week;
}

// ---------------------------------------------------------------------------
// File utilities
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeAnalysis(dir: string, filename: string, content: string): void {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✅ Written: ${path.relative(REPO_ROOT, filePath)}`);
}

// ---------------------------------------------------------------------------
// SWOT extraction from analysis results
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Stub analysis types — real analysis is now done by AI agent in workflows
// per ai-driven-analysis-guide.md Rule 2
// ---------------------------------------------------------------------------

/** Minimal batch result stub for compatibility */
interface StubBatchResult {
  results: StubDocumentResult[];
  crossDocumentLinks: Array<{ sourceId: string; targetId: string; type: string; description: string; confidence: number; reason: string }>;
}
interface StubDocumentResult {
  document: RawDocument;
  overallSignificance: number;
  perspectives: Array<{
    lens: string;
    summary: string;
    impact: string;
    sentiment: string;
    confidence: number;
    keyActors: string[];
    relatedPolicies: string[];
    swotContribution: Array<{ forStakeholder: string; quadrant: string; text: string }>;
    dashboardMetrics: Array<{ label: string; value: number | string; unit?: string; metricName: string }>;
    mindmapNodes: Array<{ label: string; children?: Array<{ label: string }> }>;
  }>;
  crossDocumentLinks: Array<{ sourceId: string; targetId: string; type: string; description: string; confidence: number; reason: string }>;
  keyInsights: string[];
  confidenceScore: number;
}

/** Stub: returns empty analysis results. Real analysis is AI-driven in workflows. */
function analyzeDocuments(docs: RawDocument[], _cia: unknown, _lang: string): StubBatchResult {
  return {
    results: docs.map(d => ({
      document: d,
      overallSignificance: 0,
      perspectives: [],
      crossDocumentLinks: [],
      keyInsights: [],
      confidenceScore: 0,
    })),
    crossDocumentLinks: [],
  };
}

function extractSwotSummaries(results: StubBatchResult['results']): SwotSummary[] {
  const map = new Map<string, SwotSummary>();

  for (const result of results) {
    for (const p of result.perspectives) {
      for (const swotC of p.swotContribution) {
        const key = swotC.forStakeholder;
        if (!map.has(key)) {
          map.set(key, { forStakeholder: key, strengths: [], weaknesses: [], opportunities: [], threats: [] });
        }
        const entry = map.get(key)!;
        switch (swotC.quadrant) {
          case 'strength': entry.strengths.push(swotC.text); break;
          case 'weakness': entry.weaknesses.push(swotC.text); break;
          case 'opportunity': entry.opportunities.push(swotC.text); break;
          case 'threat': entry.threats.push(swotC.text); break;
        }
      }
    }
  }

  // Deduplicate and cap
  return [...map.values()].map(s => ({
    ...s,
    strengths: [...new Set(s.strengths)].slice(0, 5),
    weaknesses: [...new Set(s.weaknesses)].slice(0, 5),
    opportunities: [...new Set(s.opportunities)].slice(0, 5),
    threats: [...new Set(s.threats)].slice(0, 5),
  }));
}

// ---------------------------------------------------------------------------
// Significance entries
// ---------------------------------------------------------------------------

function buildSignificanceEntries(results: StubBatchResult['results']): SignificanceEntry[] {
  return results.map(r => ({
    dok_id: r.document.dok_id || 'N/A',
    title: r.document.titel || r.document.title || r.document.dok_id || 'Unknown',
    score: r.overallSignificance,
    doctype: r.document.doktyp || 'unknown',
  }));
}

// ---------------------------------------------------------------------------
// Risk assessment
// ---------------------------------------------------------------------------

function buildRiskAssessment(docs: RawDocument[], ciaContext: CIAContext): RiskAssessmentResult {
  const normalizedContext = normalizedCIAContext(ciaContext);
  // Attempt to derive basic coalition signals from document data
  const riskIndex = calculateCoalitionRiskIndex(normalizedContext);
  const anomalies = detectAnomalousPatterns(normalizedContext);

  // Derive implications from document significance
  const highSignificance = docs.filter(d => {
    const titleText = (d.titel || d.title || '').toLowerCase();
    return (
      d.doktyp === 'prop' ||
      titleText.includes('budget') ||
      titleText.includes('försvar') ||
      titleText.includes('nato')
    );
  });

  const implications: string[] = [
    `${docs.length} documents analyzed for risk indicators`,
    `${highSignificance.length} high-significance documents identified`,
    riskIndex.level !== 'LOW'
      ? `Coalition stability at ${riskIndex.level} risk — monitor upcoming votes`
      : 'Coalition stability appears stable based on available data',
  ];

  return {
    coalitionRiskScore: riskIndex.score,
    riskLevel: riskIndex.level,
    riskSummary: riskIndex.summary,
    anomalyFlags: anomalies.map(a => ({
      type: a.type,
      severity: a.severity,
      description: a.description,
    })),
    implications,
  };
}

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------

function buildSynthesis(
  docs: RawDocument[],
  significanceEntries: SignificanceEntry[],
  riskResult: RiskAssessmentResult,
  dataFreshness?: string | null,
): SynthesisSummary {
  const totalDocs = docs.length;
  const topDocs = [...significanceEntries].sort((a, b) => b.score - a.score).slice(0, 10);
  const avgScore = significanceEntries.length > 0
    ? significanceEntries.reduce((s, e) => s + e.score, 0) / significanceEntries.length
    : 0;

  const overallConfidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    totalDocs >= 20 ? 'HIGH' : totalDocs >= 10 ? 'MEDIUM' : 'LOW';

  const keyFindings: string[] = [
    `Analyzed ${totalDocs} parliamentary documents with avg significance ${avgScore.toFixed(1)}/10`,
    `Coalition risk level: ${riskResult.riskLevel} (score: ${riskResult.coalitionRiskScore}/100)`,
    `Top document: "${topDocs[0]?.title || 'N/A'}" (significance: ${topDocs[0]?.score ?? 0}/10)`,
  ];

  if (riskResult.anomalyFlags.length > 0) {
    keyFindings.push(`${riskResult.anomalyFlags.length} anomaly flag(s) detected requiring editorial attention`);
  }
  if (dataFreshness) {
    keyFindings.push(`Data sourced from ${dataFreshness} via lookback fallback — check freshness indicators`);
  }

  const executiveSummary = [
    `Pre-article analysis completed for ${totalDocs} documents.`,
    `Overall political risk: ${riskResult.riskLevel}.`,
    `Average document significance: ${avgScore.toFixed(1)}/10.`,
    overallConfidence === 'HIGH'
      ? 'High data coverage — analysis results are reliable for article generation.'
      : 'Partial data coverage — treat analysis as directional guidance.',
    dataFreshness ? `Note: Documents sourced from ${dataFreshness} via lookback (article date differs).` : '',
  ].filter(Boolean).join(' ');

  return {
    totalDocs,
    executiveSummary,
    keyFindings,
    topDocuments: topDocs,
    overallConfidence,
    aggregateRiskLevel: riskResult.riskLevel,
    dataFreshness: dataFreshness ?? null,
  };
}

// ---------------------------------------------------------------------------
// Weekly aggregation
// ---------------------------------------------------------------------------

function runWeeklyAggregation(weekLabel: string): void {
  const weekDir = path.join(ANALYSIS_DIR, 'weekly', weekLabel);
  ensureDir(weekDir);

  const dailyRoot = path.join(ANALYSIS_DIR, 'daily');
  let allSyntheses = '';
  let includedDays = 0;
  let aggregatedDocumentsAnalyzed = 0;

  const parsedWeek = parseIsoWeekLabel(weekLabel);
  if (!parsedWeek) {
    throw new Error(`Invalid ISO week label: ${weekLabel}. Expected format YYYY-WNN`);
  }

  if (fs.existsSync(dailyRoot)) {
    const dailyDirs = fs.readdirSync(dailyRoot).sort();
    const KNOWN_DOC_TYPES = new Set<string>([
      'propositions', 'motions', 'committeeReports', 'votes',
      'speeches', 'questions', 'interpellations',
    ]);
    for (const dir of dailyDirs) {
      if (!isDateInIsoWeek(dir, weekLabel)) continue;
      // Look for synthesis in unscoped path first, then in known doc-type subdirectories
      const unscopedSynth = path.join(dailyRoot, dir, 'synthesis-summary.md');
      const dayDir = path.join(dailyRoot, dir);
      const scopedSynthPaths: string[] = [];
      if (fs.existsSync(dayDir) && fs.statSync(dayDir).isDirectory()) {
        // Sort subdirectories for deterministic output across filesystems
        for (const sub of fs.readdirSync(dayDir).sort()) {
          if (!KNOWN_DOC_TYPES.has(sub)) continue;
          const subSynth = path.join(dayDir, sub, 'synthesis-summary.md');
          if (fs.existsSync(subSynth)) {
            scopedSynthPaths.push(subSynth);
          }
        }
      }

      // Prefer the unscoped synthesis when it exists (canonical copy created by
      // the copy-to-unscoped step).  Otherwise include all scoped syntheses so
      // no doc-type run is silently omitted.
      const hasUnscoped = fs.existsSync(unscopedSynth);
      const pathsToProcess = hasUnscoped ? [unscopedSynth] : scopedSynthPaths;
      let dayHasSynthesis = false;

      for (const synthPath of pathsToProcess) {
        if (!fs.existsSync(synthPath)) continue;

        const dailySynthesis = fs.readFileSync(synthPath, 'utf8');
        const subDir = path.basename(path.dirname(synthPath));
        const label = hasUnscoped ? dir : `${dir} (${subDir})`;
        allSyntheses += `\n\n---\n\n## Day: ${label}\n\n${dailySynthesis}`;

        if (!dayHasSynthesis) {
          includedDays += 1;
          dayHasSynthesis = true;
        }

        const docsMatch = /(?:^|\n)\*\*Documents Analyzed\*\*:\s*(\d+)/.exec(dailySynthesis);
        if (docsMatch?.[1]) {
          aggregatedDocumentsAnalyzed += Number(docsMatch[1]);
        } else {
          console.warn(`[pre-analysis] Could not parse Documents Analyzed from ${synthPath}`);
        }
      }
    }
  }

  const weeklyContent = buildWeeklySynthesisMarkdown({
    weekLabel,
    generatedAt: formatTimestampForMarkdown(),
    documentsAnalyzed: aggregatedDocumentsAnalyzed,
    daysIncluded: includedDays,
    allSyntheses,
  });

  writeAnalysis(weekDir, 'weekly-synthesis.md', weeklyContent);
  console.log(`\n✅ Weekly aggregation written to analysis/weekly/${weekLabel}/`);
}

export function buildWeeklySynthesisMarkdown(opts: {
  weekLabel: string;
  generatedAt: string;
  documentsAnalyzed: number;
  daysIncluded: number;
  allSyntheses: string;
}): string {
  const confidence = opts.documentsAnalyzed >= 20
    ? 'HIGH'
    : (opts.documentsAnalyzed >= 8 ? 'MEDIUM' : 'LOW');

  return [
    `# Weekly Analysis Aggregation — ${opts.weekLabel}`,
    '',
    `**Generated**: ${opts.generatedAt}`,
    '**Data Sources**: Aggregated from daily synthesis summaries',
    `**Documents Analyzed**: ${opts.documentsAnalyzed}`,
    `**Confidence**: ${confidence}`,
    `**Period**: ${opts.weekLabel}`,
    `**Days Included**: ${opts.daysIncluded}`,
    '',
    '## Summary',
    '',
    'Aggregation of daily analysis synthesis results for the week.',
    '',
    opts.allSyntheses || '_No daily analysis results found for this week._',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function runPreArticleAnalysis(opts: {
  date: string;
  limit: number;
  aggregate: boolean;
  weekLabel: string | null;
  rm: string | null;
  docType: DocumentTypeKey | null;
  documentIds: string[];
}): Promise<void> {
  const { date, limit, aggregate, weekLabel, rm, docType, documentIds } = opts;

  if (aggregate && weekLabel) {
    console.log(`\n📅 Running weekly aggregation for: ${weekLabel}`);
    runWeeklyAggregation(weekLabel);
    return;
  }

  console.log(`\n🚀 Pre-Article Analysis Pipeline — ${date}`);
  console.log('='.repeat(50));

  // When --doc-type is specified, scope output to a subdirectory to avoid
  // conflicts between parallel workflow runs (e.g. propositions vs committee-reports).
  const outputDir = docType
    ? path.join(ANALYSIS_DIR, 'daily', date, docType)
    : path.join(ANALYSIS_DIR, 'daily', date);
  ensureDir(outputDir);

  const generatedAt = formatTimestampForMarkdown();

  // ── Step 1: Download data ─────────────────────────────────────────────────
  console.log('\n📥 Step 1: Downloading documents from riksdag-regering-mcp...');
  if (docType) {
    console.log(`   📋 Scoped to document type: ${docType}`);
  }
  const client = new MCPClient();
  const resolvedRm = rm ?? riksMoteFromDate(date);

  const downloadOpts: { limit: number; rm: string; docTypes?: DocumentTypeKey[] } = { limit, rm: resolvedRm };
  if (docType) {
    downloadOpts.docTypes = [docType];
  }

  const { data, manifest } = await downloadAllDocuments(client, downloadOpts);
  const flattenedDocs = flattenDocuments(data);

  // Build a set of explicitly requested document IDs for deep-inspection bypass.
  const requestedIdSet = new Set(documentIds.map(id => id.toUpperCase()));

  const allDocs = flattenedDocs.filter((doc: RawDocument) => {
    // Documents explicitly requested by ID are ALWAYS included regardless of date.
    // This is critical for deep-inspection which targets specific documents that
    // may have been published on previous days.
    const docId = doc.dok_id ?? '';
    if (requestedIdSet.size > 0 && requestedIdSet.has(docId.toUpperCase())) {
      return true;
    }
    // Only keep documents whose datum matches the requested analysis date (YYYY-MM-DD).
    if (doc.datum && typeof doc.datum === 'string') {
      return doc.datum.slice(0, 10) === date;
    }
    return false;
  });

  // ── Lookback fallback: widen the date filter when no documents match ────
  // When no documents match the exact date (common on weekends, holidays, or
  // low-activity days), expand the filter to include previous business days
  // (up to MAX_LOOKBACK_BUSINESS_DAYS).  This prevents empty "Documents
  // Analyzed: 0" synthesis files from propagating to article generators.
  //
  // The requestedIdSet guard ensures lookback is ONLY used for generic
  // date-based runs. Deep-inspection runs (--document-ids) fetch specific
  // documents by ID in the block below, so lookback is unnecessary and would
  // introduce unrelated documents.
  let dataFreshness: string | null = null;
  if (allDocs.length === 0 && requestedIdSet.size === 0) {
    for (let lookback = 1; lookback <= MAX_LOOKBACK_BUSINESS_DAYS; lookback++) {
      const lookbackDate = subtractBusinessDays(date, lookback);
      const lookbackDocs = flattenedDocs.filter((doc: RawDocument) => {
        if (doc.datum && typeof doc.datum === 'string') {
          return doc.datum.slice(0, 10) === lookbackDate;
        }
        return false;
      });
      if (lookbackDocs.length > 0) {
        allDocs.push(...lookbackDocs);
        dataFreshness = lookbackDate;
        console.log(`   🔄 Lookback fallback: 0 documents for ${date}, using ${lookbackDocs.length} documents from ${lookbackDate} (${lookback} business day(s) back)`);
        break;
      }
    }
    if (allDocs.length === 0) {
      console.warn(`   ⚠️  Lookback exhausted (${MAX_LOOKBACK_BUSINESS_DAYS} business days) — no recent documents found in downloaded batch.`);
    }
  }

  // If document IDs were requested but not found in the bulk download, attempt
  // to fetch them individually via fetchDocumentDetails so deep-inspection always has data.
  if (requestedIdSet.size > 0) {
    const foundIds = new Set(allDocs.map((d: RawDocument) => (d.dok_id ?? '').toUpperCase()));
    const missingIds = documentIds.filter(id => !foundIds.has(id.toUpperCase()));
    if (missingIds.length > 0) {
      console.log(`   🔍 Fetching ${missingIds.length} targeted document(s) by ID: ${missingIds.join(', ')}`);
      for (const dokId of missingIds) {
        try {
          const result = await client.fetchDocumentDetails(dokId, false);
          if (result && typeof result === 'object') {
            const doc = result as unknown as RawDocument;
            if (!doc.dok_id) {
              (doc as Record<string, unknown>).dok_id = dokId;
            }
            allDocs.push(doc);
            console.log(`   ✅ Fetched document ${dokId}: ${(doc as Record<string, unknown>).titel ?? (doc as Record<string, unknown>).title ?? '(no title)'}`);
          }
        } catch (err) {
          console.warn(`   ⚠️ Failed to fetch document ${dokId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }
  // Compute excluded count from the original date-filtered set (before any
  // by-ID fetches were appended).  `Math.max(0, …)` guards against cases
  // where individually-fetched documents grow `allDocs` beyond `flattenedDocs`.
  const excludedDocsCount = Math.max(0, flattenedDocs.length - allDocs.length);

  console.log(`   Downloaded ${flattenedDocs.length} unique documents from ${manifest.dataSources.length} MCP tools`);
  console.log(
    `   Selected ${allDocs.length} documents for analysis for ${date} (${excludedDocsCount} with missing or non-matching dates excluded)`,
  );
  if (dataFreshness) {
    console.log(`   📅 Data freshness: documents sourced from ${dataFreshness} (lookback active)`);
  }
  console.log(`   Duration: ${manifest.durationMs}ms`);
  console.log(`   Riksmöte: ${resolvedRm}`);

  // ── Step 1a: Persist raw data to analysis/data/ for verification & reuse ──
  console.log('\n🗄️  Step 1a: Persisting raw MCP data to analysis/data/...');
  const persistResult = persistDownloadedData(data, resolvedRm);
  console.log(`   🗄️  Persisted data for ${persistResult.written} documents to ${path.relative(REPO_ROOT, persistResult.dataRoot)}/ (${persistResult.skipped} skipped)`);

  const ctx: SerializationContext = {
    date,
    generatedAt,
    dataSources: manifest.dataSources,
  };

  writeAnalysis(outputDir, 'data-download-manifest.md', serializeDataManifest(ctx, manifest.docCounts, allDocs.length));

  // ── Step 1b: Store each downloaded document as JSON ─────────────────────
  console.log('\n💾 Step 1b: Storing downloaded documents...');
  const documentsDir = path.join(outputDir, 'documents');
  ensureDir(documentsDir);
  let storedCount = 0;
  for (let i = 0; i < allDocs.length; i++) {
    const doc = allDocs[i];
    const dokId = doc.dok_id || doc.titel || doc.title || `unknown-doc-${i + 1}`;
    const baseName = sanitizeDokId(dokId) || `unknown-doc-${i + 1}`;
    let fileName = baseName;
    let attempt = 0;
    // Ensure no overwrite if two docs resolve to the same sanitised name.
    while (fs.existsSync(path.join(documentsDir, `${fileName}.json`))) {
      attempt++;
      fileName = `${baseName}-${attempt}`;
    }
    const docJson = JSON.stringify(doc, null, 2);
    fs.writeFileSync(path.join(documentsDir, `${fileName}.json`), docJson, 'utf8');
    storedCount++;
  }
  console.log(`   💾 Stored ${storedCount} documents as JSON in ${path.relative(REPO_ROOT, documentsDir)}/`);

  if (allDocs.length === 0) {
    console.warn('\n⚠️  No documents downloaded. Analysis will be minimal.');
  }

  // ── Step 2: Classification ────────────────────────────────────────────────
  console.log('\n🏷️  Step 2: Classifying documents...');
  const ciaContext = loadCIAContext();
  const batchResult = analyzeDocuments(allDocs, ciaContext, 'en');
  // Cast stub results to the serializer's expected type — structurally compatible
  // but TypeScript can't verify RawDocument against the index-signature document shape.
  const serializableResults = batchResult.results as unknown as Parameters<typeof serializeClassificationResults>[1];
  writeAnalysis(outputDir, 'classification-results.md', serializeClassificationResults(ctx, serializableResults));

  // ── Step 3: Risk assessment ───────────────────────────────────────────────
  console.log('\n⚠️  Step 3: Assessing political risks...');
  const riskResult = buildRiskAssessment(allDocs, ciaContext);
  writeAnalysis(outputDir, 'risk-assessment.md', serializeRiskAssessment(ctx, allDocs.length, riskResult));

  // ── Step 4: SWOT analysis ─────────────────────────────────────────────────
  console.log('\n📊 Step 4: Generating SWOT analysis...');
  const swots = extractSwotSummaries(batchResult.results);
  writeAnalysis(outputDir, 'swot-analysis.md', serializeSwotAnalysis(ctx, allDocs.length, swots));

  // ── Step 5: Threat analysis ───────────────────────────────────────────────
  console.log('\n🔴 Step 5: Analyzing threats...');
  writeAnalysis(outputDir, 'threat-analysis.md', serializeThreatAnalysis(ctx, serializableResults));

  // ── Step 6: Stakeholder perspectives ─────────────────────────────────────
  console.log('\n👥 Step 6: Running stakeholder perspective analysis...');
  writeAnalysis(outputDir, 'stakeholder-perspectives.md', serializeStakeholderPerspectives(ctx, serializableResults));

  // ── Step 7: Significance scoring ─────────────────────────────────────────
  console.log('\n📈 Step 7: Scoring document significance...');
  const significanceEntries = buildSignificanceEntries(batchResult.results);
  writeAnalysis(outputDir, 'significance-scoring.md', serializeSignificanceScoring(ctx, significanceEntries));

  // ── Step 8: Cross-reference mapping ──────────────────────────────────────
  console.log('\n🔗 Step 8: Mapping cross-document references...');
  const crossRefSummary: CrossReferenceSummary = {
    docCount: allDocs.length,
    totalLinks: batchResult.crossDocumentLinks.length,
    links: batchResult.crossDocumentLinks,
  };
  writeAnalysis(outputDir, 'cross-reference-map.md', serializeCrossReferenceMap(ctx, crossRefSummary));

  // ── Step 9: Synthesis ─────────────────────────────────────────────────────
  console.log('\n🧩 Step 9: Synthesizing all analysis...');
  const synthesis = buildSynthesis(allDocs, significanceEntries, riskResult, dataFreshness);
  writeAnalysis(outputDir, 'synthesis-summary.md', serializeSynthesisSummary(ctx, synthesis));

  // ── Step 10: Per-document analysis files ─────────────────────────────────
  console.log('\n📝 Step 10: Generating per-document analysis files...');
  let perDocCount = 0;
  for (let i = 0; i < batchResult.results.length; i++) {
    const result = batchResult.results[i];
    const dokId = result.document.dok_id || result.document.titel || result.document.title || `unknown-analysis-${i + 1}`;
    const baseName = sanitizeDokId(dokId) || `unknown-analysis-${i + 1}`;
    let fileName = `${baseName}-analysis.md`;
    let attempt = 0;
    // Ensure no overwrite if two docs resolve to the same sanitised name.
    while (fs.existsSync(path.join(documentsDir, fileName))) {
      attempt++;
      fileName = `${baseName}-${attempt}-analysis.md`;
    }
    writeAnalysis(documentsDir, fileName, serializeDocumentAnalysis(ctx, result as unknown as Parameters<typeof serializeDocumentAnalysis>[1]));
    perDocCount++;
  }
  console.log(`   📝 Generated ${perDocCount} per-document analysis files`);

  // ── Summary ───────────────────────────────────────────────────────────────
  // When --doc-type is used, batch artifacts live under a subdirectory but
  // existing consumers (analysis-reader.ts, getAnalysisEnrichment) read from
  // the unscoped analysis/daily/<date>/ path.  Copy the 9 batch artefacts to
  // that location so downstream generators still find them.  Per-document
  // files intentionally stay only in the scoped directory.
  if (docType) {
    const unscopedDir = path.join(ANALYSIS_DIR, 'daily', date);
    ensureDir(unscopedDir);
    const batchFiles = [
      'data-download-manifest.md',
      'classification-results.md',
      'risk-assessment.md',
      'swot-analysis.md',
      'threat-analysis.md',
      'stakeholder-perspectives.md',
      'significance-scoring.md',
      'cross-reference-map.md',
      'synthesis-summary.md',
    ];
    for (const file of batchFiles) {
      const src = path.join(outputDir, file);
      const dest = path.join(unscopedDir, file);
      if (fs.existsSync(src)) {
        try {
          // Use atomic create to avoid check-then-copy race under concurrency.
          fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL);
        } catch (error) {
          const err = error as NodeJS.ErrnoException;
          if (err.code !== 'EEXIST') {
            throw err;
          }
          // If the file already exists, another workflow created it first.
          // This is expected in parallel runs; keep the existing unscoped copy.
        }
      }
    }
    console.log(`   📋 Copied batch artifacts to ${path.relative(REPO_ROOT, unscopedDir)}/ for enrichment readers`);
  }

  const totalFiles = 9 + perDocCount + storedCount;
  console.log(`\n✅ Analysis complete! Results in: ${path.relative(REPO_ROOT, outputDir)}/`);
  console.log(`   📄 ${totalFiles} total files written (9 batch + ${perDocCount} analyses + ${storedCount} documents)`);
  console.log(`   📊 ${allDocs.length} documents analyzed`);
  console.log(`   🎯 Overall confidence: ${synthesis.overallConfidence}`);
  console.log(`   ⚠️  Risk level: ${synthesis.aggregateRiskLevel}`);
  if (docType) {
    console.log(`   📋 Scoped to: ${docType}`);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  const args = parseArgs(process.argv);

  runPreArticleAnalysis(args).catch((err: unknown) => {
    console.error('[pre-article-analysis] Fatal error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
