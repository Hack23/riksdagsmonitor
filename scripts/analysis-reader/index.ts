/**
 * @module analysis-reader/index
 * @description Orchestrator for reading the per-date analysis artifact set:
 * resolves files inside `analysis/daily/<date>/.../`, dispatches each
 * markdown to its dedicated parser, and aggregates results into a
 * `DailyAnalysis`. Also provides `findLatestAnalysisDate`,
 * `readLatestAnalysis`, `readLatestNonEmptyAnalysis`,
 * `deriveArticleClassificationMeta`, and `isNonEmptyAnalysis`.
 *
 * @see ../analysis-reader.ts for the legacy compatibility shim.
 * @see ./file-reader.ts for filesystem helpers + date-format guard.
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  ClassificationLevel,
  ConfidenceLabel,
  DailyAnalysis,
  RiskLevel,
  UrgencyLabel,
} from './types.js';
import { parseClassificationResults } from './parsers/classification.js';
import { parseRiskAssessment } from './parsers/risk.js';
import { parseSignificanceScoring } from './parsers/significance.js';
import { parseStakeholderPerspectives } from './parsers/stakeholders.js';
import { parseSwotAnalysis } from './parsers/swot.js';
import { parseSynthesisSummary } from './parsers/synthesis.js';
import { parseThreatAnalysis } from './parsers/threat.js';
import {
  ANALYSIS_FILES,
  DATE_FORMAT_RE,
  findLatestAnalysisDate,
  readAnalysisFile,
} from './file-reader.js';

export { findLatestAnalysisDate } from './file-reader.js';

/**
 * Read and parse all pre-computed analysis files for a given date.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param basePath - Optional override for the base analysis directory path
 * @returns Complete DailyAnalysis object; individual fields are `null` when
 *          the corresponding file is absent or cannot be parsed.
 */
export async function readDailyAnalysis(date: string, basePath?: string): Promise<DailyAnalysis> {
  const [
    classificationMd,
    riskMd,
    swotMd,
    threatMd,
    stakeholdersMd,
    significanceMd,
    synthesisMd,
  ] = await Promise.all([
    readAnalysisFile(date, ANALYSIS_FILES.classification, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.risk, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.swot, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.threat, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.stakeholders, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.significance, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.synthesis, basePath),
  ]);

  const classification = classificationMd ? parseClassificationResults(classificationMd) : null;
  const riskAssessment = riskMd ? parseRiskAssessment(riskMd) : null;
  const swot = swotMd ? parseSwotAnalysis(swotMd) : null;
  const threatAnalysis = threatMd ? parseThreatAnalysis(threatMd) : null;
  const stakeholderPerspectives = stakeholdersMd ? parseStakeholderPerspectives(stakeholdersMd) : null;
  const significance = significanceMd ? parseSignificanceScoring(significanceMd) : null;
  const synthesis = synthesisMd ? parseSynthesisSummary(synthesisMd) : null;

  const hasAnalysis = [
    classification,
    riskAssessment,
    swot,
    threatAnalysis,
    stakeholderPerspectives,
    significance,
    synthesis,
  ].some(field => field !== null);

  return {
    date,
    classification,
    riskAssessment,
    swot,
    threatAnalysis,
    stakeholderPerspectives,
    significance,
    synthesis,
    hasAnalysis,
  };
}

/**
 * Read the most recent available daily analysis.
 * Convenience wrapper around `findLatestAnalysisDate` + `readDailyAnalysis`.
 */
export async function readLatestAnalysis(maxDaysBack = 7, basePath?: string): Promise<DailyAnalysis> {
  const date = await findLatestAnalysisDate(maxDaysBack, basePath);
  if (!date) {
    const today = new Date().toISOString().split('T')[0]!;
    return {
      date: today,
      classification: null,
      riskAssessment: null,
      swot: null,
      threatAnalysis: null,
      stakeholderPerspectives: null,
      significance: null,
      synthesis: null,
      hasAnalysis: false,
    };
  }
  return readDailyAnalysis(date, basePath);
}

/**
 * Derive article classification metadata from a DailyAnalysis.
 * Returns safe defaults when analysis is absent.
 */
export function deriveArticleClassificationMeta(analysis: DailyAnalysis): {
  classificationLevel: ClassificationLevel;
  riskLevel: RiskLevel;
  confidenceLabel: ConfidenceLabel;
  significanceScore: number | undefined;
  urgency: UrgencyLabel | undefined;
} {
  return {
    classificationLevel: analysis.classification?.level ?? 'MEDIUM',
    riskLevel: analysis.riskAssessment?.level ?? 'moderate',
    confidenceLabel: analysis.classification?.confidence ?? analysis.riskAssessment?.confidence ?? 'MEDIUM',
    significanceScore: analysis.significance?.score,
    urgency: analysis.significance?.urgency,
  };
}

/**
 * Check whether a daily analysis has substantive content.
 *
 * An analysis is considered non-empty when the synthesis contains at least
 * one key theme or a narrative direction. When the synthesis-summary.md file
 * was not generated (synthesis is null), the function defers to `hasAnalysis`
 * since other analysis files may still contain useful data.
 */
export function isNonEmptyAnalysis(analysis: DailyAnalysis): boolean {
  if (!analysis.hasAnalysis) return false;
  if (analysis.synthesis === null) return analysis.hasAnalysis;
  const hasThemes = analysis.synthesis.keyThemes.length > 0;
  const hasNarrative = analysis.synthesis.narrativeDirection.length > 0;
  return hasThemes || hasNarrative;
}

/**
 * Read the daily analysis for `date`, falling back to previous dates when the
 * current analysis is empty (Documents Analyzed: 0).
 */
export async function readLatestNonEmptyAnalysis(
  date: string,
  maxDaysBack = 5,
  basePath?: string,
): Promise<DailyAnalysis> {
  if (!DATE_FORMAT_RE.test(date)) {
    return readDailyAnalysis(date, basePath);
  }
  const primary = await readDailyAnalysis(date, basePath);
  if (isNonEmptyAnalysis(primary)) return primary;

  for (let i = 1; i <= maxDaysBack; i++) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    const prevDate = d.toISOString().slice(0, 10);
    const prev = await readDailyAnalysis(prevDate, basePath);
    if (isNonEmptyAnalysis(prev)) {
      console.log(`[analysis-reader] Lookback fallback: using analysis from ${prevDate} (requested: ${date})`);
      return prev;
    }
  }

  return primary;
}
