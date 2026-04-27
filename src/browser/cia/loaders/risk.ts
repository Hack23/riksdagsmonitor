/**
 * @module CIA/Loaders/Risk
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the risk score evolution dashboard from CIA CSV exports.
 * Filters out periods with zero politicians and emits temporal severity data.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type { RiskEvolutionDashboard, RiskEvolutionEntry } from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import { CSV_SOURCES } from '../sources.js';

/**
 * Build `RiskEvolutionDashboard` from CSV sources.
 *
 * @param loadCSV - CSV loader closure
 * @returns Risk evolution entries grouped by assessment period and severity
 */
export async function loadRiskEvolution(loadCSV: LoadCSV): Promise<RiskEvolutionDashboard> {
  const rows = await loadCSV(CSV_SOURCES.riskEvolution.local);

  const entries: RiskEvolutionEntry[] = rows
    .filter(r => (r.politician_count as number) > 0)
    .map(r => ({
      period: (r.assessment_period as string) || '',
      severity: (r.risk_severity as string) || '',
      politicianCount: (r.politician_count as number) || 0,
      avgRiskScore: (r.avg_risk_score as number) || 0
    }));

  return {
    title: 'Risk Score Evolution',
    description: 'Temporal risk score changes from CIA database exports',
    lastUpdated: new Date().toISOString(),
    entries,
    _source: 'csv'
  };
}
