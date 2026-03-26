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
import { analyzeDocuments } from './analysis-framework/index.js';
import { calculateCoalitionRiskIndex, detectAnomalousPatterns } from './data-transformers/risk-analysis.js';
import type { RawDocument, CIAContext } from './data-transformers/types.js';
import { loadCIAContext } from './news-types/weekly-review/index.js';
import { normalizedCIAContext } from './news-types/weekly-review/data-loader.js';

import {
  downloadAllDocuments,
  flattenDocuments,
} from './pre-article-analysis/data-downloader.js';

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
} from './pre-article-analysis/markdown-serializer.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ANALYSIS_DIR = path.join(REPO_ROOT, 'analysis');

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

export function parseArgs(argv: string[]): {
  date: string;
  aggregate: boolean;
  limit: number;
  weekLabel: string | null;
  rm: string | null;
} {
  const args = argv.slice(2);
  const get = (flag: string): string | null => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1]! : null;
  };

  const dateArg = get('--date');
  const aggregate = get('--aggregate') === 'weekly';

  const now = new Date();
  if (dateArg && dateArg !== 'today' && !aggregate && !parseAndValidateIsoDate(dateArg)) {
    throw new Error(`Invalid --date value: ${dateArg}. Expected YYYY-MM-DD or 'today'.`);
  }

  const isoDate = dateArg === 'today' || !dateArg ? now.toISOString().slice(0, 10) : dateArg;

  const weekLabel = aggregate
    ? (get('--date') || `${now.getUTCFullYear()}-W${isoWeekNumber(now).toString().padStart(2, '0')}`)
    : null;
  if (aggregate && weekLabel && !parseIsoWeekLabel(weekLabel)) {
    throw new Error(`Invalid weekly --date value: ${weekLabel}. Expected YYYY-WNN.`);
  }

  const limitArg = get('--limit');
  const DEFAULT_LIMIT = 20;
  const parsedLimit = limitArg ? parseInt(limitArg, 10) : DEFAULT_LIMIT;
  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    throw new Error(`Invalid --limit value: ${limitArg}. Expected a positive integer.`);
  }
  const limit = parsedLimit;
  const rm = get('--rm');

  return { date: isoDate, aggregate, limit, weekLabel, rm };
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

function extractSwotSummaries(results: ReturnType<typeof analyzeDocuments>['results']): SwotSummary[] {
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

function buildSignificanceEntries(results: ReturnType<typeof analyzeDocuments>['results']): SignificanceEntry[] {
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

  const executiveSummary = [
    `Pre-article analysis completed for ${totalDocs} documents.`,
    `Overall political risk: ${riskResult.riskLevel}.`,
    `Average document significance: ${avgScore.toFixed(1)}/10.`,
    overallConfidence === 'HIGH'
      ? 'High data coverage — analysis results are reliable for article generation.'
      : 'Partial data coverage — treat analysis as directional guidance.',
  ].join(' ');

  return {
    totalDocs,
    executiveSummary,
    keyFindings,
    topDocuments: topDocs,
    overallConfidence,
    aggregateRiskLevel: riskResult.riskLevel,
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

  const parsedWeek = parseIsoWeekLabel(weekLabel);
  if (!parsedWeek) {
    throw new Error(`Invalid ISO week label: ${weekLabel}. Expected format YYYY-WNN`);
  }

  if (fs.existsSync(dailyRoot)) {
    const dailyDirs = fs.readdirSync(dailyRoot).sort();
    for (const dir of dailyDirs) {
      if (!isDateInIsoWeek(dir, weekLabel)) continue;
      const synthPath = path.join(dailyRoot, dir, 'synthesis-summary.md');
      if (fs.existsSync(synthPath)) {
        allSyntheses += `\n\n---\n\n## Day: ${dir}\n\n` + fs.readFileSync(synthPath, 'utf8');
      }
    }
  }

  const weeklyContent = [
    `# Weekly Analysis Aggregation — ${weekLabel}`,
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Period**: ${weekLabel}`,
    '',
    '## Summary',
    '',
    'Aggregation of daily analysis synthesis results for the week.',
    '',
    allSyntheses || '_No daily analysis results found for this week._',
  ].join('\n');

  writeAnalysis(weekDir, 'weekly-synthesis.md', weeklyContent);
  console.log(`\n✅ Weekly aggregation written to analysis/weekly/${weekLabel}/`);
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
}): Promise<void> {
  const { date, limit, aggregate, weekLabel, rm } = opts;

  if (aggregate && weekLabel) {
    console.log(`\n📅 Running weekly aggregation for: ${weekLabel}`);
    runWeeklyAggregation(weekLabel);
    return;
  }

  console.log(`\n🚀 Pre-Article Analysis Pipeline — ${date}`);
  console.log('='.repeat(50));

  // Output directory
  const outputDir = path.join(ANALYSIS_DIR, 'daily', date);
  ensureDir(outputDir);

  const generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

  // ── Step 1: Download data ─────────────────────────────────────────────────
  console.log('\n📥 Step 1: Downloading documents from riksdag-regering-mcp...');
  const client = new MCPClient();
  const resolvedRm = rm ?? riksMoteFromDate(date);

  const { data, manifest } = await downloadAllDocuments(client, { limit, rm: resolvedRm });
  const allDocs = flattenDocuments(data).filter((doc: RawDocument) => {
    // If the document has a datum field, require its date portion to match the requested date.
    // Documents without a datum are kept to avoid accidentally dropping metadata/auxiliary entries.
    if (doc.datum && typeof doc.datum === 'string') {
      return doc.datum.slice(0, 10) === date;
    }
    return true;
  });

  console.log(`   Downloaded ${allDocs.length} unique documents from ${manifest.dataSources.length} MCP tools`);
  console.log(`   Duration: ${manifest.durationMs}ms`);
  console.log(`   Riksmöte: ${resolvedRm}`);

  const ctx: SerializationContext = {
    date,
    generatedAt,
    dataSources: manifest.dataSources,
  };

  writeAnalysis(outputDir, 'data-download-manifest.md', serializeDataManifest(ctx, manifest.docCounts, allDocs.length));

  if (allDocs.length === 0) {
    console.warn('\n⚠️  No documents downloaded. Analysis will be minimal.');
  }

  // ── Step 2: Classification ────────────────────────────────────────────────
  console.log('\n🏷️  Step 2: Classifying documents...');
  const ciaContext = loadCIAContext();
  const batchResult = analyzeDocuments(allDocs, ciaContext, 'en');
  writeAnalysis(outputDir, 'classification-results.md', serializeClassificationResults(ctx, batchResult.results));

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
  writeAnalysis(outputDir, 'threat-analysis.md', serializeThreatAnalysis(ctx, batchResult.results));

  // ── Step 6: Stakeholder perspectives ─────────────────────────────────────
  console.log('\n👥 Step 6: Running stakeholder perspective analysis...');
  writeAnalysis(outputDir, 'stakeholder-perspectives.md', serializeStakeholderPerspectives(ctx, batchResult.results));

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
  const synthesis = buildSynthesis(allDocs, significanceEntries, riskResult);
  writeAnalysis(outputDir, 'synthesis-summary.md', serializeSynthesisSummary(ctx, synthesis));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n✅ Analysis complete! Results in: analysis/daily/${date}/`);
  console.log(`   📄 9 analysis files written`);
  console.log(`   📊 ${allDocs.length} documents analyzed`);
  console.log(`   🎯 Overall confidence: ${synthesis.overallConfidence}`);
  console.log(`   ⚠️  Risk level: ${synthesis.aggregateRiskLevel}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv);

  runPreArticleAnalysis(args).catch((err: unknown) => {
    console.error('[pre-article-analysis] Fatal error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
