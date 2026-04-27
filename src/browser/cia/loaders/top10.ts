/**
 * @module CIA/Loaders/Top10
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the top-10 most influential MPs ranking from CIA CSV exports.
 * Joins influence metrics with the MP risk summary and ranks by network
 * connections.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type { CSVRow, MPRanking, Top10Influential } from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import { CSV_SOURCES } from '../sources.js';

/**
 * Build `Top10Influential` ranking from CSV sources.
 * Replaces the legacy `top10-influential-mps.json` static export.
 *
 * @param loadCSV - CSV loader closure
 * @returns Top 10 MPs ranked by network connections, joined with risk data
 */
export async function loadTop10Influential(loadCSV: LoadCSV): Promise<Top10Influential> {
  const [influence, riskSummary] = await Promise.all([
    loadCSV(CSV_SOURCES.influenceMetrics.local),
    loadCSV(CSV_SOURCES.riskSummary.local)
  ]);

  // Build risk lookup by person_id
  const riskMap: Record<string, CSVRow> = {};
  riskSummary.forEach(r => {
    riskMap[r.person_id as string] = r;
  });

  // Sort by network_connections descending, take top 10
  const sorted = [...influence]
    .filter(mp => (mp.network_connections as number) > 0)
    .sort((a, b) => ((b.network_connections as number) || 0) - ((a.network_connections as number) || 0))
    .slice(0, 10);

  const rankings: MPRanking[] = sorted.map((mp, idx) => {
    const risk = riskMap[mp.person_id as string] || {};
    return {
      rank: idx + 1,
      id: String(mp.person_id),
      firstName: (mp.first_name as string) || '',
      lastName: (mp.last_name as string) || '',
      party: (mp.party as string) || '',
      role: (mp.influence_classification as string)
        ? (mp.influence_classification as string)
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c: string) => c.toUpperCase())
        : '',
      influenceScore: (mp.network_connections as number) || 0,
      networkConnections: (mp.network_connections as number) || 0,
      brokerClassification: (mp.broker_classification as string) || '',
      riskLevel: (risk.risk_level as string) || '',
      riskScore: (risk.risk_score as number) || 0,
      _source: 'csv'
    };
  });

  return {
    title: 'Top 10 Most Influential MPs',
    description: 'Network analysis from CIA politician influence metrics view',
    lastUpdated: new Date().toISOString(),
    methodology: 'Ranked by network_connections from view_riksdagen_politician_influence_metrics',
    rankings,
    _source: 'csv'
  };
}
