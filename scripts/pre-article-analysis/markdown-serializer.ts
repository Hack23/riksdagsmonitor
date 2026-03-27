/**
 * @module pre-article-analysis/markdown-serializer
 * @description Serializes analysis framework results as structured markdown
 * files for persistence in `analysis/daily/YYYY-MM-DD/`.
 *
 * Each output file follows the standard analysis template:
 * ```markdown
 * # [Analysis Type] — YYYY-MM-DD
 * **Generated**: YYYY-MM-DD HH:MM UTC
 * **Data Sources**: [list]
 * **Documents Analyzed**: N
 * **Confidence**: HIGH/MEDIUM/LOW
 * ## Summary / ## Detailed Analysis / ## Key Findings / ## Implications
 * ```
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  DocumentAnalysisResult,
  PerspectiveAnalysis,
  DocumentLink,
} from '../analysis-framework/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SerializationContext {
  /** ISO date string, e.g. "2026-03-26" */
  date: string;
  /** UTC timestamp of generation */
  generatedAt: string;
  /** List of MCP tool names called to download data */
  dataSources: string[];
}

export interface SignificanceEntry {
  dok_id: string;
  title: string;
  score: number;
  doctype: string;
}

export interface RiskAssessmentResult {
  coalitionRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskSummary: string;
  anomalyFlags: Array<{ type: string; severity: string; description: string }>;
  implications: string[];
}

export interface SwotSummary {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  forStakeholder: string;
}

export interface CrossReferenceSummary {
  docCount: number;
  totalLinks: number;
  links: DocumentLink[];
}

export interface SynthesisSummary {
  totalDocs: number;
  executiveSummary: string;
  keyFindings: string[];
  topDocuments: SignificanceEntry[];
  overallConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  aggregateRiskLevel: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a numeric confidence score (0–100) to a categorical label.
 * - ≥70: HIGH — strong evidence, full-text content available for most documents
 * - 40–69: MEDIUM — moderate evidence, mix of full-text and metadata-only
 * - <40: LOW — weak evidence, metadata-only documents or small batch
 */
function confidenceLabel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

/** Maximum number of documents shown in the detailed analysis section */
const MAX_DETAILED_RESULTS = 20;

function significanceLabel(score: number): string {
  if (score >= 8) return '🔴 Critical';
  if (score >= 6) return '🟠 High';
  if (score >= 4) return '🟡 Medium';
  return '🟢 Low';
}

function escapeMarkdownTableCell(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

/** Escape user-sourced text for safe inline Markdown rendering. */
function escapeMarkdownInline(value: string): string {
  return value
    .replace(/\r?\n/g, ' ')
    .replace(/[#*_`[\]<>|\\~]/g, '\\$&')
    .trim();
}

function frontmatter(ctx: SerializationContext, title: string, docCount: number, confidenceScore: number): string {
  return [
    `# ${title} — ${ctx.date}`,
    '',
    `**Generated**: ${ctx.generatedAt}`,
    `**Data Sources**: ${ctx.dataSources.join(', ')}`,
    `**Documents Analyzed**: ${docCount}`,
    `**Confidence**: ${confidenceLabel(confidenceScore)}`,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Data-download manifest
// ---------------------------------------------------------------------------

export function serializeDataManifest(
  ctx: SerializationContext,
  docCounts: Record<string, number>,
  dateFilteredTotal?: number,
): string {
  const totalDocs = Object.values(docCounts).reduce((a, b) => a + b, 0);
  const analyzedCount = dateFilteredTotal ?? totalDocs;
  const lines: string[] = [
    frontmatter(ctx, 'Data Download Manifest', analyzedCount, 100),
    '## Summary',
    '',
    `Downloaded **${totalDocs}** documents (session-wide) from ${ctx.dataSources.length} MCP data sources.`,
    '',
  ];

  if (dateFilteredTotal !== undefined) {
    lines.push(`After date filtering to **${ctx.date}**: **${dateFilteredTotal}** documents selected for analysis.`, '');
  }

  lines.push('## Document Counts by Type', '');

  for (const [type, count] of Object.entries(docCounts)) {
    lines.push(`- **${type}**: ${count} documents`);
  }

  lines.push('', '## Data Quality Notes', '', 'All documents sourced from official riksdag-regering-mcp API.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Classification results
// ---------------------------------------------------------------------------

export function serializeClassificationResults(
  ctx: SerializationContext,
  results: DocumentAnalysisResult[],
): string {
  const avgConfidence =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length
      : 0;

  const lines: string[] = [
    frontmatter(ctx, 'Political Classification Results', results.length, avgConfidence),
    '## Summary',
    '',
    `Classified **${results.length}** parliamentary documents by sensitivity, impact, urgency, and domain.`,
    '',
    '## Detailed Analysis',
    '',
  ];

  for (const result of results.slice(0, MAX_DETAILED_RESULTS)) {
    const title = result.document.titel || result.document.title || result.document.dok_id || 'Unknown';
    const dokId = result.document.dok_id || 'N/A';
    const domains = result.perspectives
      .flatMap(p => p.relatedPolicies)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 3);

    lines.push(`### ${title}`);
    lines.push(`- **dok_id**: ${dokId}`);
    lines.push(`- **Type**: ${result.document.doktyp || 'unknown'}`);
    lines.push(`- **Significance**: ${significanceLabel(result.overallSignificance)} (${result.overallSignificance}/10)`);
    lines.push(`- **Domains**: ${domains.join(', ') || 'General'}`);
    lines.push(`- **Confidence**: ${confidenceLabel(result.confidenceScore)} (${Math.round(result.confidenceScore)}%)`);
    lines.push('');
  }

  lines.push('## Key Findings', '');
  const topDocs = [...results].sort((a, b) => b.overallSignificance - a.overallSignificance).slice(0, 5);
  topDocs.forEach((r, i) => {
    const title = r.document.titel || r.document.title || r.document.dok_id || 'Unknown';
    lines.push(`${i + 1}. **${title}** (dok_id: ${r.document.dok_id || 'N/A'}) — Significance: ${r.overallSignificance}/10`);
  });

  lines.push('', '## Implications', '');
  lines.push('Classification drives article prioritisation. High-significance documents should receive deep-inspection treatment.');

  lines.push('', '## Data Quality Notes', '');
  lines.push(`Classification confidence: ${confidenceLabel(avgConfidence)}. Higher confidence when full-text content is available.`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Risk assessment
// ---------------------------------------------------------------------------

export function serializeRiskAssessment(
  ctx: SerializationContext,
  docCount: number,
  risk: RiskAssessmentResult,
): string {
  const confidenceScore = risk.riskLevel === 'LOW' ? 80 : risk.riskLevel === 'MEDIUM' ? 60 : 40;

  const lines: string[] = [
    frontmatter(ctx, 'Political Risk Assessment', docCount, confidenceScore),
    '## Summary',
    '',
    risk.riskSummary,
    '',
    '## Detailed Analysis',
    '',
    `**Coalition Risk Score**: ${risk.coalitionRiskScore}/100`,
    `**Risk Level**: ${risk.riskLevel}`,
    '',
    '### Anomaly Flags',
    '',
  ];

  if (risk.anomalyFlags.length > 0) {
    for (const flag of risk.anomalyFlags) {
      lines.push(`- **[${flag.severity}]** ${flag.type}: ${flag.description}`);
    }
  } else {
    lines.push('No anomalous patterns detected in current data.');
  }

  lines.push('', '## Key Findings', '');
  lines.push(`1. Coalition stability at risk score **${risk.coalitionRiskScore}** (${risk.riskLevel})`);
  if (risk.anomalyFlags.length > 0) {
    lines.push(`2. **${risk.anomalyFlags.length}** anomaly flag(s) detected requiring monitoring`);
  }

  lines.push('', '## Implications', '');
  for (const impl of risk.implications) {
    lines.push(`- ${impl}`);
  }

  lines.push('', '## Data Quality Notes', '');
  lines.push('Risk assessment derived from CIA coalition metrics and document significance scores.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// SWOT analysis
// ---------------------------------------------------------------------------

export function serializeSwotAnalysis(
  ctx: SerializationContext,
  docCount: number,
  swots: SwotSummary[],
): string {
  const lines: string[] = [
    frontmatter(ctx, 'Political SWOT Analysis', docCount, 70),
    '## Summary',
    '',
    `Generated SWOT analysis for **${swots.length}** political actor(s) based on ${docCount} documents.`,
    '',
    '## Detailed Analysis',
    '',
  ];

  for (const swot of swots) {
    lines.push(`### ${swot.forStakeholder}`, '');

    lines.push('**Strengths**');
    swot.strengths.forEach(s => lines.push(`- ${s}`));
    lines.push('');

    lines.push('**Weaknesses**');
    swot.weaknesses.forEach(s => lines.push(`- ${s}`));
    lines.push('');

    lines.push('**Opportunities**');
    swot.opportunities.forEach(s => lines.push(`- ${s}`));
    lines.push('');

    lines.push('**Threats**');
    swot.threats.forEach(s => lines.push(`- ${s}`));
    lines.push('');
  }

  lines.push('## Key Findings', '');
  lines.push('1. SWOT entries derived from all six perspective analyses across downloaded documents.');

  lines.push('', '## Implications', '');
  lines.push('SWOT insights should inform stakeholder framing in generated articles.');

  lines.push('', '## Data Quality Notes', '');
  lines.push('SWOT confidence is proportional to document richness (full-text vs metadata-only).');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Threat analysis
// ---------------------------------------------------------------------------

export function serializeThreatAnalysis(
  ctx: SerializationContext,
  results: DocumentAnalysisResult[],
): string {
  const threatEntries = results.flatMap(r =>
    r.perspectives.flatMap(p =>
      p.swotContribution
        .filter(c => c.quadrant === 'threat')
        .map(c => ({ title: r.document.titel || r.document.title || r.document.dok_id || 'Unknown', text: c.text, forStakeholder: c.forStakeholder }))
    )
  );

  const avgConfidence =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length
      : 0;

  const lines: string[] = [
    frontmatter(ctx, 'Political Threat Analysis', results.length, avgConfidence),
    '## Summary',
    '',
    `Identified **${threatEntries.length}** threat indicators across ${results.length} documents.`,
    '',
    '## Detailed Analysis',
    '',
  ];

  const grouped = new Map<string, string[]>();
  for (const entry of threatEntries) {
    const arr = grouped.get(entry.forStakeholder) ?? [];
    arr.push(`[${entry.title}] ${entry.text}`);
    grouped.set(entry.forStakeholder, arr);
  }

  for (const [stakeholder, threats] of grouped) {
    lines.push(`### Threats for: ${stakeholder}`, '');
    threats.slice(0, 5).forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }

  lines.push('## Key Findings', '');
  lines.push(`1. **${threatEntries.length}** threat indicators identified targeting ${grouped.size} stakeholder group(s)`);

  lines.push('', '## Implications', '');
  lines.push('Threat analysis should inform risk-focused article framing and editorial prioritisation.');

  lines.push('', '## Data Quality Notes', '');
  lines.push(`Analysis confidence: ${confidenceLabel(avgConfidence)}.`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Stakeholder perspectives
// ---------------------------------------------------------------------------

export function serializeStakeholderPerspectives(
  ctx: SerializationContext,
  results: DocumentAnalysisResult[],
): string {
  const avgConfidence =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length
      : 0;

  // Aggregate perspectives by lens across all documents
  const lensMap = new Map<string, PerspectiveAnalysis[]>();
  for (const result of results) {
    for (const p of result.perspectives) {
      const arr = lensMap.get(p.lens) ?? [];
      arr.push(p);
      lensMap.set(p.lens, arr);
    }
  }

  const lines: string[] = [
    frontmatter(ctx, 'Stakeholder Perspective Analysis', results.length, avgConfidence),
    '## Summary',
    '',
    `Applied **6 analysis lenses** to **${results.length}** documents.`,
    '',
    '## Detailed Analysis',
    '',
  ];

  const lensEmoji: Record<string, string> = {
    government: '🏛️',
    opposition: '⚖️',
    citizen: '👥',
    economic: '💰',
    international: '🌍',
    media: '📰',
  };

  for (const [lens, perspectives] of lensMap) {
    const emoji = lensEmoji[lens] || '🔍';
    const high = perspectives.filter(p => p.impact === 'high').length;
    const avgConf = perspectives.reduce((s, p) => s + p.confidence, 0) / perspectives.length;
    const topActors = [...new Set(perspectives.flatMap(p => p.keyActors))].slice(0, 5);

    lines.push(`### ${emoji} ${lens.charAt(0).toUpperCase() + lens.slice(1)} Perspective`, '');
    lines.push(`- **Documents with High Impact**: ${high}/${perspectives.length}`);
    lines.push(`- **Avg Confidence**: ${Math.round(avgConf)}%`);
    lines.push(`- **Key Actors**: ${topActors.join(', ') || 'N/A'}`);
    lines.push('');

    // Show top 3 summaries
    const topThree = [...perspectives].sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    for (const p of topThree) {
      if (p.summary) {
        lines.push(`> ${p.summary}`);
        lines.push('');
      }
    }
  }

  lines.push('## Key Findings', '');
  lines.push('1. All six stakeholder perspectives applied consistently across the document batch.');
  lines.push('2. Cross-perspective conflicts indicate politically contentious documents.');

  lines.push('', '## Implications', '');
  lines.push('Perspective analysis feeds directly into article stakeholder framing and balance.');

  lines.push('', '## Data Quality Notes', '');
  lines.push(`Aggregate confidence: ${confidenceLabel(avgConfidence)}.`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Significance scoring
// ---------------------------------------------------------------------------

export function serializeSignificanceScoring(
  ctx: SerializationContext,
  entries: SignificanceEntry[],
): string {
  const lines: string[] = [
    frontmatter(ctx, 'Document Significance Scoring', entries.length, 80),
    '## Summary',
    '',
    `Scored **${entries.length}** documents for political significance (0–10 scale).`,
    '',
    '## Detailed Analysis',
    '',
    '| Score | Level | Type | dok_id | Title |',
    '|-------|-------|------|--------|-------|',
  ];

  const sorted = [...entries].sort((a, b) => b.score - a.score);
  for (const entry of sorted.slice(0, 30)) {
    const level = escapeMarkdownTableCell(significanceLabel(entry.score).replace(/🔴|🟠|🟡|🟢/g, '').trim());
    const titleValue = entry.title.length > 50 ? entry.title.slice(0, 47) + '...' : entry.title;
    const doctype = escapeMarkdownTableCell(entry.doctype);
    const dokId = escapeMarkdownTableCell(entry.dok_id);
    const title = escapeMarkdownTableCell(titleValue);
    lines.push(`| ${entry.score}/10 | ${level} | ${doctype} | ${dokId} | ${title} |`);
  }

  lines.push('', '## Key Findings', '');
  const critical = sorted.filter(e => e.score >= 8);
  lines.push(`1. **${critical.length}** document(s) rated Critical (score ≥ 8)`);
  const high = sorted.filter(e => e.score >= 6 && e.score < 8);
  lines.push(`2. **${high.length}** document(s) rated High (score 6–7)`);

  lines.push('', '## Implications', '');
  lines.push('High-significance documents should be prioritised for deep-inspection article generation.');

  lines.push('', '## Data Quality Notes', '');
  lines.push('Significance scores use document type, committee tier, domain breadth, coalition context, and content richness.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Cross-reference map
// ---------------------------------------------------------------------------

export function serializeCrossReferenceMap(
  ctx: SerializationContext,
  summary: CrossReferenceSummary,
): string {
  const lines: string[] = [
    frontmatter(ctx, 'Cross-Reference Map', summary.docCount, 75),
    '## Summary',
    '',
    `Detected **${summary.totalLinks}** cross-document relationships.`,
    '',
    '## Detailed Analysis',
    '',
  ];

  if (summary.links.length === 0) {
    lines.push('No cross-document relationships detected in current batch.');
  } else {
    const byType = new Map<string, DocumentLink[]>();
    for (const link of summary.links) {
      const arr = byType.get(link.type) ?? [];
      arr.push(link);
      byType.set(link.type, arr);
    }

    for (const [type, links] of byType) {
      lines.push(`### ${type}`, '');
      for (const link of links.slice(0, 10)) {
        lines.push(`- **${link.sourceId}** → **${link.targetId}** (confidence: ${link.confidence}%)`);
        lines.push(`  _${link.reason}_`);
      }
      lines.push('');
    }
  }

  lines.push('## Key Findings', '');
  lines.push(`1. **${summary.totalLinks}** inter-document relationships mapped`);

  lines.push('', '## Implications', '');
  lines.push('Cross-references enrich article narratives by linking related legislative developments.');

  lines.push('', '## Data Quality Notes', '');
  lines.push('Cross-reference confidence is driven by shared policy domains and textual similarity.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Synthesis summary
// ---------------------------------------------------------------------------

export function serializeSynthesisSummary(
  ctx: SerializationContext,
  synthesis: SynthesisSummary,
): string {
  const confScore = synthesis.overallConfidence === 'HIGH' ? 80 : synthesis.overallConfidence === 'MEDIUM' ? 55 : 30;

  const lines: string[] = [
    frontmatter(ctx, 'Analysis Synthesis Summary', synthesis.totalDocs, confScore),
    '## Summary',
    '',
    synthesis.executiveSummary,
    '',
    '## Key Findings',
    '',
  ];

  synthesis.keyFindings.forEach((f, i) => lines.push(`${i + 1}. ${f}`));

  lines.push('', '## Top Documents by Significance', '', '| Score | Type | dok_id | Title |', '|-------|------|--------|-------|');
  for (const doc of synthesis.topDocuments.slice(0, 10)) {
    const titleValue = doc.title.length > 50 ? doc.title.slice(0, 47) + '...' : doc.title;
    const doctype = escapeMarkdownTableCell(doc.doctype);
    const dokId = escapeMarkdownTableCell(doc.dok_id);
    const title = escapeMarkdownTableCell(titleValue);
    lines.push(`| ${doc.score}/10 | ${doctype} | ${dokId} | ${title} |`);
  }

  lines.push('', '## Implications', '');
  lines.push(`Overall political risk level: **${synthesis.aggregateRiskLevel}**`);
  lines.push('Articles should reference this synthesis to ensure analytical depth and consistency.');

  lines.push('', '## Data Quality Notes', '');
  lines.push(`Overall confidence: **${synthesis.overallConfidence}**. All analysis results are available in sibling files.`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Per-document analysis (full AI-quality SWOT + intelligence per document)
// ---------------------------------------------------------------------------

/**
 * Serialize a comprehensive per-document analysis markdown file.
 *
 * Each document gets its own analysis file with:
 * - Full document metadata
 * - Detailed SWOT analysis
 * - 6-lens stakeholder perspective analysis
 * - Risk indicators
 * - Significance scoring with justification
 * - Cross-document references
 * - Key insights and implications
 *
 * Quality target: Comparable to SWOT.md and THREAT_MODEL.md depth.
 */
export function serializeDocumentAnalysis(
  ctx: SerializationContext,
  result: DocumentAnalysisResult,
): string {
  const doc = result.document;
  const title = escapeMarkdownInline(doc.titel || doc.title || doc.dok_id || 'Unknown Document');
  const dokId = escapeMarkdownInline(doc.dok_id || 'N/A');
  const docType = escapeMarkdownInline(doc.doktyp || 'unknown');
  const committee = escapeMarkdownInline(doc.organ || doc.committee || 'N/A');
  const date = escapeMarkdownInline(doc.datum || ctx.date);
  const author = escapeMarkdownInline(doc.intressent_namn || doc.author || 'N/A');
  const party = escapeMarkdownInline(doc.parti || 'N/A');
  const rm = escapeMarkdownInline(doc.rm || 'N/A');

  const lines: string[] = [
    `# Document Analysis: ${title}`,
    '',
    `**Generated**: ${ctx.generatedAt}`,
    `**dok_id**: ${dokId}`,
    `**Document Type**: ${docType}`,
    `**Committee**: ${committee}`,
    `**Date**: ${date}`,
    `**Author**: ${author}`,
    `**Party**: ${party}`,
    `**Riksmöte**: ${rm}`,
    `**Significance**: ${significanceLabel(result.overallSignificance)} (${result.overallSignificance}/10)`,
    `**Confidence**: ${confidenceLabel(result.confidenceScore)} (${Math.round(result.confidenceScore)}%)`,
    '',
    '---',
    '',
  ];

  // ── Executive Summary ──────────────────────────────────────────────────
  lines.push('## Executive Summary', '');
  if (result.keyInsights.length > 0) {
    for (const insight of result.keyInsights) {
      lines.push(`- ${escapeMarkdownInline(insight)}`);
    }
  } else {
    lines.push('No key insights extracted — document may be metadata-only.');
  }
  lines.push('');

  // ── Document Content Summary ───────────────────────────────────────────
  lines.push('## Document Content', '');
  if (doc.summary) {
    lines.push(`**Summary**: ${escapeMarkdownInline(doc.summary)}`);
    lines.push('');
  }
  if (doc.rubrik) {
    lines.push(`**Rubrik**: ${escapeMarkdownInline(doc.rubrik)}`);
    lines.push('');
  }
  if (doc.undertitel) {
    lines.push(`**Undertitel**: ${escapeMarkdownInline(doc.undertitel)}`);
    lines.push('');
  }
  if (doc.notis) {
    lines.push(`**Notis**: ${escapeMarkdownInline(doc.notis)}`);
    lines.push('');
  }
  if (doc.mottagare) {
    lines.push(`**Mottagare (Recipient)**: ${escapeMarkdownInline(doc.mottagare)}`);
    lines.push('');
  }
  const hasFullText = !!(doc.fullText || doc.fullContent);
  lines.push(`**Full-text available**: ${hasFullText ? 'Yes ✅' : 'No — metadata-only ⚠️'}`);
  lines.push('');

  // ── SWOT Analysis ──────────────────────────────────────────────────────
  lines.push('## SWOT Analysis', '');
  const swotMap = new Map<string, { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }>();
  for (const p of result.perspectives) {
    for (const c of p.swotContribution) {
      if (!swotMap.has(c.forStakeholder)) {
        swotMap.set(c.forStakeholder, { strengths: [], weaknesses: [], opportunities: [], threats: [] });
      }
      const entry = swotMap.get(c.forStakeholder)!;
      switch (c.quadrant) {
        case 'strength': entry.strengths.push(c.text); break;
        case 'weakness': entry.weaknesses.push(c.text); break;
        case 'opportunity': entry.opportunities.push(c.text); break;
        case 'threat': entry.threats.push(c.text); break;
      }
    }
  }

  if (swotMap.size === 0) {
    lines.push('_No SWOT contributions extracted. Document may lack sufficient content for structured analysis._');
    lines.push('');
  }

  for (const [stakeholder, swot] of swotMap) {
    lines.push(`### SWOT: ${escapeMarkdownInline(stakeholder)}`, '');

    lines.push('#### Strengths 💪');
    if (swot.strengths.length > 0) {
      [...new Set(swot.strengths)].forEach(s => lines.push(`- ${escapeMarkdownInline(s)}`));
    } else {
      lines.push('- _No strengths identified_');
    }
    lines.push('');

    lines.push('#### Weaknesses ⚠️');
    if (swot.weaknesses.length > 0) {
      [...new Set(swot.weaknesses)].forEach(s => lines.push(`- ${escapeMarkdownInline(s)}`));
    } else {
      lines.push('- _No weaknesses identified_');
    }
    lines.push('');

    lines.push('#### Opportunities 🌟');
    if (swot.opportunities.length > 0) {
      [...new Set(swot.opportunities)].forEach(s => lines.push(`- ${escapeMarkdownInline(s)}`));
    } else {
      lines.push('- _No opportunities identified_');
    }
    lines.push('');

    lines.push('#### Threats 🔴');
    if (swot.threats.length > 0) {
      [...new Set(swot.threats)].forEach(s => lines.push(`- ${escapeMarkdownInline(s)}`));
    } else {
      lines.push('- _No threats identified_');
    }
    lines.push('');
  }

  // ── Stakeholder Perspective Analysis ───────────────────────────────────
  lines.push('## Stakeholder Perspective Analysis', '');

  const lensEmoji: Record<string, string> = {
    government: '🏛️',
    opposition: '⚖️',
    citizen: '👥',
    economic: '💰',
    international: '🌍',
    media: '📰',
  };

  for (const p of result.perspectives) {
    const emoji = lensEmoji[p.lens] || '🔍';
    lines.push(`### ${emoji} ${p.lens.charAt(0).toUpperCase() + p.lens.slice(1)} Perspective`, '');
    lines.push(`- **Impact**: ${escapeMarkdownInline(p.impact)}`);
    lines.push(`- **Sentiment**: ${escapeMarkdownInline(p.sentiment)}`);
    lines.push(`- **Confidence**: ${Math.round(p.confidence)}%`);
    lines.push(`- **Key Actors**: ${p.keyActors.map(a => escapeMarkdownInline(a)).join(', ') || 'N/A'}`);
    lines.push(`- **Related Policies**: ${p.relatedPolicies.map(r => escapeMarkdownInline(r)).join(', ') || 'N/A'}`);
    lines.push('');
    if (p.summary) {
      lines.push(`> ${escapeMarkdownInline(p.summary)}`);
      lines.push('');
    }

    // Dashboard metrics
    if (p.dashboardMetrics.length > 0) {
      lines.push('**Dashboard Metrics**:');
      for (const m of p.dashboardMetrics) {
        lines.push(`- ${escapeMarkdownInline(m.metricName)}: ${m.value}${m.unit ? ' ' + escapeMarkdownInline(m.unit) : ''}`);
      }
      lines.push('');
    }
  }

  // ── Cross-Document References ──────────────────────────────────────────
  lines.push('## Cross-Document References', '');
  if (result.crossDocumentLinks.length > 0) {
    for (const link of result.crossDocumentLinks) {
      lines.push(`- **${escapeMarkdownInline(link.type)}**: ${escapeMarkdownInline(link.sourceId)} → ${escapeMarkdownInline(link.targetId)} (confidence: ${link.confidence}%)`);
      lines.push(`  _${escapeMarkdownInline(link.reason)}_`);
    }
  } else {
    lines.push('_No cross-document references detected for this document._');
  }
  lines.push('');

  // ── Significance Assessment ────────────────────────────────────────────
  lines.push('## Significance Assessment', '');
  lines.push(`**Overall Score**: ${result.overallSignificance}/10 — ${significanceLabel(result.overallSignificance)}`);
  lines.push('');
  lines.push('**Scoring Factors**:');
  lines.push(`- Document type tier (${docType})`);
  lines.push(`- Committee tier (${committee})`);
  const domains = [...new Set(result.perspectives.flatMap(p => p.relatedPolicies))].slice(0, 5);
  lines.push(`- Policy domain breadth: ${domains.length} domain(s) — ${domains.join(', ') || 'N/A'}`);
  lines.push(`- Content richness: ${hasFullText ? 'Full-text available' : 'Metadata-only'}`);
  lines.push(`- Perspective impact: ${result.perspectives.filter(p => p.impact === 'high').length}/6 high-impact perspectives`);
  lines.push('');

  // ── Key Insights ───────────────────────────────────────────────────────
  lines.push('## Key Insights', '');
  if (result.keyInsights.length > 0) {
    result.keyInsights.forEach((insight, i) => lines.push(`${i + 1}. ${escapeMarkdownInline(insight)}`));
  } else {
    lines.push('_No key insights extracted._');
  }
  lines.push('');

  // ── Data Quality Notes ─────────────────────────────────────────────────
  lines.push('## Data Quality Notes', '');
  lines.push(`- **Analysis confidence**: ${confidenceLabel(result.confidenceScore)} (${Math.round(result.confidenceScore)}%)`);
  lines.push(`- **Full-text content**: ${hasFullText ? 'Available — high confidence' : 'Unavailable — analysis based on metadata only'}`);
  lines.push(`- **Data sources**: ${ctx.dataSources.join(', ')}`);
  lines.push(`- **Analysis method**: 6-lens stakeholder analysis with SWOT extraction`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Sanitize a document identifier for use as a safe filename.
 * Replaces non-alphanumeric characters with hyphens and lowercases.
 */
export function sanitizeDokId(dokId: string): string {
  return dokId
    .toLowerCase()
    .replace(/[^a-z0-9åäö-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}
