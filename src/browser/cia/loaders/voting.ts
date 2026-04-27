/**
 * @module CIA/Loaders/Voting
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the voting patterns analysis from CIA CSV exports.
 * Prefers the real coalition alignment matrix when available; falls back to
 * win-rate similarity when not. Derives rebellion tracking from per-party
 * risk distribution.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type { CSVRow, RebellionEntry, VotingPatterns } from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import { CSV_SOURCES, RIKSDAG_PARTIES } from '../sources.js';

/**
 * Build `VotingPatterns` from CSV sources.
 *
 * Uses real coalition alignment data for the agreement matrix when present;
 * otherwise derives a similarity matrix from party effectiveness win rates.
 *
 * @param loadCSV - CSV loader closure
 * @returns Voting patterns analysis with party-pair agreement matrix
 */
export async function loadVotingPatterns(loadCSV: LoadCSV): Promise<VotingPatterns> {
  const [coalitionAlignment, effectiveness, riskByParty] = await Promise.all([
    loadCSV(CSV_SOURCES.coalitionAlignment.local),
    loadCSV(CSV_SOURCES.partyEffectiveness.local),
    loadCSV(CSV_SOURCES.riskByParty.local)
  ]);

  const labels = [...RIKSDAG_PARTIES];
  const partyNames = [
    'Social Democrats', 'Moderates', 'Sweden Democrats', 'Centre',
    'Left', 'Christian Democrats', 'Liberals', 'Green'
  ];

  // Build agreement matrix from real coalition alignment data
  const alignmentLookup: Record<string, number> = {};
  coalitionAlignment
    .filter(r => RIKSDAG_PARTIES.includes(r.party1 as string) && RIKSDAG_PARTIES.includes(r.party2 as string))
    .forEach(r => {
      const key1 = `${r.party1}:${r.party2}`;
      const key2 = `${r.party2}:${r.party1}`;
      const rate = Math.round(((r.alignment_rate as number) || 0) * 100);
      alignmentLookup[key1] = rate;
      alignmentLookup[key2] = rate;
    });

  const hasAlignmentData = Object.keys(alignmentLookup).length > 0;

  let agreementMatrix: number[][];
  if (hasAlignmentData) {
    agreementMatrix = labels.map(p1 =>
      labels.map(p2 => {
        if (p1 === p2) return 100;
        return alignmentLookup[`${p1}:${p2}`] ?? 50;
      })
    );
  } else {
    // Fallback: build from win rate similarity
    const latestWinRate: Record<string, CSVRow> = {};
    effectiveness
      .filter(e => RIKSDAG_PARTIES.includes(e.party as string))
      .forEach(e => {
        const party = e.party as string;
        if (
          !latestWinRate[party] ||
          (e.year as number) > (latestWinRate[party].year as number) ||
          ((e.year as number) === (latestWinRate[party].year as number) &&
            (e.quarter as number) > (latestWinRate[party].quarter as number))
        ) {
          latestWinRate[party] = e;
        }
      });
    agreementMatrix = labels.map(p1 => {
      const wr1 = latestWinRate[p1] ? (latestWinRate[p1].avg_win_rate as number) : 50;
      return labels.map(p2 => {
        if (p1 === p2) return 100;
        const wr2 = latestWinRate[p2] ? (latestWinRate[p2].avg_win_rate as number) : 50;
        return Math.max(0, Math.round(100 - Math.abs(wr1 - wr2)));
      });
    });
  }

  // Rebellion tracking from risk data (HIGH risk ~ rebellious)
  const rebellionTracking: RebellionEntry[] = RIKSDAG_PARTIES
    .map(party => {
      const partyRisks = riskByParty.filter(r => r.party === party);
      const highRisk = partyRisks.find(r => r.risk_level === 'HIGH');
      const total = partyRisks.reduce((s, r) => s + ((r.politician_count as number) || 0), 0);
      const highCount = highRisk ? (highRisk.politician_count as number) : 0;
      const rebellionRate = total > 0 ? Math.round((highCount / total) * 100 * 10) / 10 : 0;
      return {
        party,
        rebellionRate,
        trend: rebellionRate > 25 ? 'increasing' : rebellionRate > 15 ? 'stable' : 'decreasing'
      };
    })
    .filter(r => r.rebellionRate > 0);

  return {
    title: 'Voting Patterns Analysis',
    description: hasAlignmentData
      ? 'Real coalition alignment data from CIA voting analysis'
      : 'Derived from CIA party effectiveness trends and risk data',
    lastUpdated: new Date().toISOString(),
    analysisPeriod: '2022-2026',
    votingMatrix: { labels, partyNames, agreementMatrix },
    keyIssues: [],
    rebellionTracking,
    _source: 'csv'
  };
}
