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
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

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

/** Base path for the analysis directory relative to project root */
const ANALYSIS_BASE_PATH = 'analysis/daily';

/** Analysis file names within a daily directory */
const ANALYSIS_FILES = {
  classification: 'classification-results.md',
  risk: 'risk-assessment.md',
  swot: 'swot-analysis.md',
  threat: 'threat-analysis.md',
  stakeholders: 'stakeholder-perspectives.md',
  significance: 'significance-scoring.md',
  synthesis: 'synthesis-summary.md',
} as const;

/** Strict YYYY-MM-DD format guard to prevent path traversal via `date`. */
const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Attempt to read a markdown file from the analysis directory.
 * First checks `analysis/daily/{date}/{filename}`, then scans immediate
 * subdirectories (e.g., `deep-inspection/`, `propositions/`) for the file.
 * Returns `null` if the file does not exist, cannot be read, or `date` is
 * not a valid YYYY-MM-DD string (guards against path traversal).
 */
async function readAnalysisFile(date: string, filename: string, basePath?: string): Promise<string | null> {
  if (!DATE_FORMAT_RE.test(date)) return null;
  const resolvedBase = basePath ?? ANALYSIS_BASE_PATH;
  const dateDir = join(resolvedBase, date);

  try {
    const entries = await readdir(dateDir, { withFileTypes: true });
    const sortedDirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of sortedDirs) {
      const subPath = join(dateDir, entry.name, filename);
      try {
        return await readFile(subPath, 'utf-8');
      } catch {
        // Not in this subdirectory — continue
      }
    }
  } catch {
    // Date directory doesn't exist or can't be read
  }

  const rootPath = join(resolvedBase, date, filename);
  try {
    return await readFile(rootPath, 'utf-8');
  } catch {
    // Root-level file not found either
  }
  return null;
}

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
 * Derive the most recent date for which analysis files exist.
 * Searches backwards from today up to `maxDaysBack` days.
 *
 * @param maxDaysBack - Maximum number of days to search back (default 7)
 * @param basePath - Optional override for the base analysis directory path
 * @returns ISO date string (YYYY-MM-DD) or `null` if no analysis found
 */
export async function findLatestAnalysisDate(maxDaysBack = 7, basePath?: string): Promise<string | null> {
  const resolvedBase = basePath ?? ANALYSIS_BASE_PATH;
  const today = new Date();
  for (let i = 0; i < maxDaysBack; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]!;
    const dirPath = join(resolvedBase, dateStr);
    if (existsSync(dirPath)) {
      const hasRootFile = Object.values(ANALYSIS_FILES).some(f => existsSync(join(dirPath, f)));
      if (hasRootFile) return dateStr;

      try {
        const entries = await readdir(dirPath, { withFileTypes: true });
        const sortedDirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of sortedDirs) {
          const hasSubFile = Object.values(ANALYSIS_FILES).some(
            f => existsSync(join(dirPath, entry.name, f)),
          );
          if (hasSubFile) return dateStr;
        }
      } catch {
        // Can't read subdirectories — skip
      }
    }
  }
  return null;
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
