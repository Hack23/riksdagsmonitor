/**
 * @module CIA/Loaders/Parties
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the party performance dashboard from CIA CSV exports.
 * Joins three CSV sources (performance, metrics, momentum), filters to the
 * 8 Riksdag parties and emits a sorted `PartyPerformance` payload.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type { CSVRow, PartyEntry, PartyPerformance } from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import { CSV_SOURCES, RIKSDAG_PARTIES } from '../sources.js';

/**
 * Build `PartyPerformance` from CSV sources.
 * Replaces the legacy `party-performance.json` static export.
 *
 * @param loadCSV - CSV loader closure
 * @returns Party performance dashboard sorted by seat count descending
 */
export async function loadPartyPerformance(loadCSV: LoadCSV): Promise<PartyPerformance> {
  const [performance, metrics, momentum] = await Promise.all([
    loadCSV(CSV_SOURCES.partyPerformance.local),
    loadCSV(CSV_SOURCES.partyMetrics.local),
    loadCSV(CSV_SOURCES.partyMomentum.local)
  ]);

  const activePerformance = performance.filter(p => RIKSDAG_PARTIES.includes(p.party as string));

  const metricsMap: Record<string, CSVRow> = {};
  metrics.forEach(m => {
    if (RIKSDAG_PARTIES.includes(m.party as string)) {
      metricsMap[m.party as string] = m;
    }
  });

  const latestMomentum: Record<string, CSVRow> = {};
  momentum
    .filter(m => RIKSDAG_PARTIES.includes(m.party as string))
    .forEach(m => {
      const party = m.party as string;
      if (
        !latestMomentum[party] ||
        (m.year as number) > (latestMomentum[party].year as number) ||
        ((m.year as number) === (latestMomentum[party].year as number) &&
          (m.quarter as number) > (latestMomentum[party].quarter as number))
      ) {
        latestMomentum[party] = m;
      }
    });

  const seatMap: Record<string, number> = {
    S: 107, SD: 73, M: 68, C: 24, V: 24, KD: 19, L: 16, MP: 18
  };

  const parties: PartyEntry[] = activePerformance.map(p => {
    const party = p.party as string;
    const m = metricsMap[party] || {};
    const mom = latestMomentum[party] || {};

    return {
      id: party,
      partyName: (p.party_name as string) || party,
      shortName: party,
      metrics: {
        seats: seatMap[party] || 0,
        voteShare: 0,
        memberCount: (p.active_members as number) || 0,
        documentsAuthored: (p.documents_last_year as number) || 0,
        motionsSubmitted: (p.motions_last_year as number) || 0,
        successRate: (m.avg_win_rate as number) || 0
      },
      voting: {
        totalVotes: (m.total_votes_last_year as number) || 0,
        cohesionScore: (m.avg_participation_rate as number) || 0,
        rebellionRate: (m.avg_rebel_rate as number) || 0
      },
      trends: {
        supportTrend: ((mom.trend_direction as string) || 'stable').toLowerCase(),
        activityTrend: ((mom.stability_classification as string) || 'stable').toLowerCase(),
        performanceLevel: (m.performance_level as string) || (p.performance_level as string) || ''
      },
      _source: 'csv'
    };
  });

  parties.sort((a, b) => (b.metrics.seats || 0) - (a.metrics.seats || 0));

  return {
    title: 'Party Performance Dashboard',
    description: 'Live party data from CIA PostgreSQL database exports',
    lastUpdated: new Date().toISOString(),
    parties,
    _source: 'csv'
  };
}
