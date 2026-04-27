/**
 * @module CIA/Loaders/Election
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the election analysis payload from CIA CSV exports.
 * Parses seat forecasts and coalition scenarios with strict numeric/boolean
 * validation; rows missing required fields are dropped.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type { ElectionAnalysis } from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import { CSV_SOURCES } from '../sources.js';

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

/**
 * Build `ElectionAnalysis` from CSV sources.
 * Replaces the legacy `election-analysis.json` static export.
 *
 * @param loadCSV - CSV loader closure
 * @returns Election forecast with seat predictions, coalition scenarios and key factors
 */
export async function loadElectionAnalysis(loadCSV: LoadCSV): Promise<ElectionAnalysis> {
  const [forecastRows, scenarioRows] = await Promise.all([
    loadCSV(CSV_SOURCES.electionForecast.local),
    loadCSV(CSV_SOURCES.coalitionScenarios.local)
  ]);

  const parties = forecastRows.flatMap(r => {
    const name = String(r.name ?? '').trim();
    const currentSeats = toFiniteNumber(r.currentSeats);
    const predictedSeats = toFiniteNumber(r.predictedSeats);
    const change = toFiniteNumber(r.change);
    const voteShare = toFiniteNumber(r.voteShare);

    if (!name || currentSeats === undefined || predictedSeats === undefined || change === undefined || voteShare === undefined) {
      return [];
    }

    const confidenceMin = toFiniteNumber(r.confidenceMin);
    const confidenceMax = toFiniteNumber(r.confidenceMax);

    return [{
      name,
      currentSeats,
      predictedSeats,
      change,
      voteShare,
      confidenceInterval:
        confidenceMin !== undefined && confidenceMax !== undefined
          ? { min: confidenceMin, max: confidenceMax }
          : undefined
    }];
  });

  const coalitionScenarios = scenarioRows.flatMap(r => {
    const name = String(r.name ?? '').trim();
    const probability = toFiniteNumber(r.probability);
    const totalSeats = toFiniteNumber(r.totalSeats);
    const majority = toBoolean(r.majority);
    const riskLevel = String(r.riskLevel ?? '').trim();
    const composition = String(r.composition ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (
      !name ||
      probability === undefined ||
      totalSeats === undefined ||
      majority === undefined ||
      !riskLevel ||
      composition.length === 0
    ) {
      return [];
    }

    return [{
      name,
      probability,
      composition,
      totalSeats,
      majority,
      riskLevel
    }];
  });

  return {
    forecast: { parties },
    coalitionScenarios,
    keyFactors: [
      'Economic conditions',
      'Immigration policy',
      'Climate change priorities',
      'Healthcare reform',
      'NATO membership impact'
    ],
    electionDate: '2026-09-13'
  };
}
