/**
 * Tests for Dashboard CIA Data Loader (CSV-based)
 * Tests CSV parsing, data aggregation, fallback, and output shape
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CIADataLoader } from '../dashboard/cia-data-loader.js';

describe('CIA Data Loader (CSV)', () => {
  let loader;
  let originalFetch;

  beforeEach(() => {
    loader = new CIADataLoader();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use cia-data directory as primary CSV source', () => {
      expect(loader.csvBaseURL).toContain('cia-data');
    });

    it('should keep JSON base URL for election predictions', () => {
      expect(loader.jsonBaseURL).toContain('cia-exports/current');
    });

    it('should define 14 CSV data sources', () => {
      const sources = CIADataLoader.CSV_SOURCES;
      expect(Object.keys(sources).length).toBeGreaterThanOrEqual(14);
      Object.values(sources).forEach(src => {
        expect(src.local).toMatch(/\.csv$/);
        expect(src.description).toBeTruthy();
      });
    });

    it('should have CSV sources for all key datasets', () => {
      const sources = CIADataLoader.CSV_SOURCES;
      expect(sources.personStatus).toBeDefined();
      expect(sources.riskByParty).toBeDefined();
      expect(sources.partyPerformance).toBeDefined();
      expect(sources.partyMetrics).toBeDefined();
      expect(sources.influenceMetrics).toBeDefined();
      expect(sources.committeeProductivity).toBeDefined();
      expect(sources.partyEffectiveness).toBeDefined();
    });
  });

  describe('CSV Parser', () => {
    it('should parse CSV with header row', () => {
      const csv = 'name,count,rate\nAlpha,10,3.5\nBeta,20,7.2';
      const rows = loader.parseCSV(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0].name).toBe('Alpha');
      expect(rows[0].count).toBe(10);
      expect(rows[0].rate).toBe(3.5);
    });

    it('should auto-convert numeric values', () => {
      const csv = 'party,count,percentage\nS,107,30.3';
      const rows = loader.parseCSV(csv);
      expect(typeof rows[0].count).toBe('number');
      expect(typeof rows[0].percentage).toBe('number');
      expect(typeof rows[0].party).toBe('string');
    });

    it('should handle quoted fields', () => {
      const csv = 'status,count\n"Tjänstgörande riksdagsledamot",327';
      const rows = loader.parseCSV(csv);
      expect(rows[0].status).toBe('Tjänstgörande riksdagsledamot');
      expect(rows[0].count).toBe(327);
    });

    it('should return empty array for header-only CSV', () => {
      const csv = 'party,anomaly_classification,politician_count';
      const rows = loader.parseCSV(csv);
      expect(rows).toHaveLength(0);
    });

    it('should return empty array for empty input', () => {
      expect(loader.parseCSV('')).toHaveLength(0);
    });

    it('should skip blank lines', () => {
      const csv = 'a,b\n1,2\n\n3,4\n';
      const rows = loader.parseCSV(csv);
      expect(rows).toHaveLength(2);
    });
  });

  describe('CSV Loading with Fallback', () => {
    it('should load from local CSV URL first', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        text: () => Promise.resolve('party,count\nS,107\nM,68')
      }));

      const rows = await loader.loadCSV('distribution_person_status.csv');
      expect(rows).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when CSV has no data rows', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        text: () => Promise.resolve('party,count')
      }));

      const rows = await loader.loadCSV('empty.csv');
      expect(rows).toHaveLength(0);
    });

    it('should return empty array on fetch failure', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      const rows = await loader.loadCSV('missing.csv');
      expect(rows).toHaveLength(0);
    });

    it('should skip non-ok responses', async () => {
      global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404 }));
      const rows = await loader.loadCSV('missing.csv');
      expect(rows).toHaveLength(0);
    });
  });

  describe('Overview Dashboard (from CSV)', () => {
    it('should build overview with correct keyMetrics shape', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('person_status')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'status,person_count,percentage\nTjänstgörande riksdagsledamot,327,13.11\nTidigare riksdagsledamot,1118,44.83'
          )});
        }
        if (url.includes('risk_by_party')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'party,risk_level,politician_count,avg_risk_score\nS,HIGH,18,48.56\nS,MEDIUM,95,38.63\nM,HIGH,5,49.20'
          )});
        }
        if (url.includes('politician_risk_levels')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'risk_level,politician_count,percentage\nHIGH,78,19.40\nMEDIUM,278,69.15\nLOW,46,11.44'
          )});
        }
        if (url.includes('annual_ballots')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'year,unique_ballots,total_votes,avg_yes_rate\n2025,431,150419,\n2026,40,13960,'
          )});
        }
        if (url.includes('crisis_resilience')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'party,resilience_classification,politician_count,avg_resilience_score\nM,HIGHLY_RESILIENT,65,80.00\nKD,HIGHLY_RESILIENT,17,80.00'
          )});
        }
        return Promise.resolve({ ok: false });
      });

      const overview = await loader.loadOverviewDashboard();
      expect(overview.keyMetrics).toBeDefined();
      expect(overview.keyMetrics.totalMPs).toBe(327);
      expect(overview.keyMetrics.totalParties).toBeGreaterThanOrEqual(2);
      expect(overview.keyMetrics.coalitionSeats).toBe(176);
      expect(overview.riskAlerts).toBeDefined();
      expect(overview.riskAlerts.last90Days.critical).toBeGreaterThan(0);
      expect(overview.coalitionStability).toBeDefined();
      expect(overview._source).toBe('csv');
    });
  });

  describe('Election Analysis (JSON kept)', () => {
    it('should load election analysis from JSON', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          electionDate: '2026-09-13',
          forecast: { parties: [{ name: 'S', currentSeats: 107 }] },
          coalitionScenarios: [{ name: 'Tidö', probability: 35 }],
          keyFactors: ['Economy']
        })
      }));

      const data = await loader.loadElectionAnalysis();
      expect(data.electionDate).toBe('2026-09-13');
      expect(data.forecast.parties).toHaveLength(1);
      expect(data.coalitionScenarios[0].probability).toBe(35);
    });
  });

  describe('Party Performance (from CSV)', () => {
    it('should build parties with correct shape', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('party_performance') && !url.includes('metrics')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'party,party_name,active_members,inactive_members,documents_last_year,motions_last_year,propositions_last_year,docs_per_member,performance_level\nS,Arbetarepartiet-Socialdemokraterna,0,0,850,0,0,0.00,GOOD\nM,Moderaterna,0,0,1299,0,0,0.00,EXCELLENT'
          )});
        }
        if (url.includes('performance_metrics')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'party,party_name,registration_date,active_members,inactive_members,total_violations,members_with_violations,violation_rate_percentage,latest_member_violation,total_votes_last_year,avg_absence_rate,avg_win_rate,avg_rebel_rate,avg_participation_rate,documents_last_year,motions_last_year,propositions_last_year,docs_per_member,current_ministers,current_committee_chairs,performance_score,performance_level,strengths,weaknesses\nS,Arbetarepartiet-Socialdemokraterna,1956-08-02,0,0,0,0,0,,15944414,14.73,43.40,0.06,85.27,850,0,0,0,0,0,67.15,GOOD,"High participation",\nM,Moderaterna,2013-09-06,0,0,0,0,0,,10228492,14.71,86.49,0.00,85.29,1299,0,0,0,13,5,77.95,EXCELLENT,"High participation | Effective voting",""'
          )});
        }
        if (url.includes('party_momentum')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'party,year,quarter,period,participation_rate,momentum,trend_direction,stability_classification\nS,2026,1,2026-Q1,0.00,0.00,STABLE,VERY_STABLE\nM,2026,1,2026-Q1,0.00,0.00,STABLE,VERY_STABLE'
          )});
        }
        return Promise.resolve({ ok: false });
      });

      const data = await loader.loadPartyPerformance();
      expect(data.parties).toBeDefined();
      expect(Array.isArray(data.parties)).toBe(true);
      expect(data.parties.length).toBeGreaterThan(0);
      
      const sParty = data.parties.find(p => p.shortName === 'S');
      expect(sParty).toBeDefined();
      expect(sParty.metrics.seats).toBe(107);
      expect(sParty.metrics.documentsAuthored).toBe(850);
      expect(sParty.voting.cohesionScore).toBe(85.27);
      expect(sParty.voting.rebellionRate).toBe(0.06);
      expect(sParty._source).toBe('csv');
    });
  });

  describe('Top 10 Influential MPs (from CSV)', () => {
    it('should build rankings sorted by network connections', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('influence_metrics')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'person_id,first_name,last_name,party,network_connections,network_median,influence_classification,broker_classification,influence_assessment\n028954589415,Ann-Sofie,Alm,M,207,146.50,HIGHLY_INFLUENTIAL,STRONG_BROKER,High influence\n0406831930624,Henrik,Vinge,SD,206,146.50,INFLUENTIAL,STRONG_BROKER,Notable influence\n0112806493429,Fredrik,Saweståhl,M,192,146.50,MODERATELY_INFLUENTIAL,STRONG_BROKER,Standard influence'
          )});
        }
        if (url.includes('risk_summary')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'person_id,first_name,last_name,party,status,total_violations,latest_violation_date,absenteeism_violations,effectiveness_violations,discipline_violations,productivity_violations,collaboration_violations,annual_absence_rate,annual_rebel_rate,annual_vote_count,documents_last_year,risk_score,risk_level,risk_assessment\n028954589415,Ann-Sofie,Alm,M,Tjänstgörande riksdagsledamot,0,,0,0,0,0,0,0.00,0.00,500,10,20.00,LOW,Low risk'
          )});
        }
        return Promise.resolve({ ok: false });
      });

      const data = await loader.loadTop10Influential();
      expect(data.rankings).toBeDefined();
      expect(data.rankings.length).toBeGreaterThan(0);
      expect(data.rankings[0].rank).toBe(1);
      expect(data.rankings[0].firstName).toBe('Ann-Sofie');
      expect(data.rankings[0].influenceScore).toBe(207);
      expect(data.rankings[0].networkConnections).toBe(207);
      expect(data._source).toBe('csv');
    });
  });

  describe('Committee Network (from CSV)', () => {
    it('should build committees with productivity data', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('committee_productivity') && !url.includes('matrix')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'committee_name,total_documents,propositions_count,reports_count,total_members,docs_per_member,productivity_level\nKonstitutionsutskottet,62,0,0,48,0.65,HIGHLY_PRODUCTIVE\nCivilutskottet,48,0,0,44,0.59,HIGHLY_PRODUCTIVE'
          )});
        }
        if (url.includes('committee_activity')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'org,document_count\nSoU,11825\nTU,10010'
          )});
        }
        return Promise.resolve({ ok: false });
      });

      const data = await loader.loadCommitteeNetwork();
      expect(data.committees).toBeDefined();
      expect(data.committees.length).toBe(2);
      expect(data.committees[0].name).toBe('Konstitutionsutskottet');
      expect(data.committees[0].memberCount).toBe(48);
      expect(data.committees[0].documentsProcessed).toBe(62);
      expect(data.networkGraph).toBeDefined();
      expect(data.networkGraph.nodes.length).toBe(2);
      expect(data._source).toBe('csv');
    });
  });

  describe('Voting Patterns (from CSV)', () => {
    it('should build voting matrix from effectiveness data', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('party_effectiveness')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'party,year,quarter,documents_produced,motions_count,active_members,avg_win_rate,effectiveness_assessment\nS,2025,4,100,50,107,43.40,Standard\nM,2025,4,200,30,68,86.49,Excellent\nSD,2025,4,150,40,73,63.83,Good'
          )});
        }
        if (url.includes('risk_by_party')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(
            'party,risk_level,politician_count,avg_risk_score\nS,HIGH,18,48.56\nM,HIGH,5,49.20\nSD,HIGH,8,49.00'
          )});
        }
        return Promise.resolve({ ok: false });
      });

      const data = await loader.loadVotingPatterns();
      expect(data.votingMatrix).toBeDefined();
      expect(data.votingMatrix.labels).toHaveLength(8);
      expect(data.votingMatrix.partyNames).toHaveLength(8);
      expect(data.votingMatrix.agreementMatrix).toHaveLength(8);
      // Diagonal should be 100
      expect(data.votingMatrix.agreementMatrix[0][0]).toBe(100);
      expect(data.rebellionTracking).toBeDefined();
      expect(data._source).toBe('csv');
    });
  });

  describe('Parallel Loading', () => {
    it('should load all 6 data sources in parallel', async () => {
      const csvResponse = (text) => Promise.resolve({ ok: true, text: () => Promise.resolve(text) });
      const jsonResponse = (data) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });

      global.fetch = vi.fn((url) => {
        if (url.includes('election-analysis.json')) {
          return jsonResponse({ electionDate: '2026-09-13', forecast: { parties: [] }, coalitionScenarios: [], keyFactors: [] });
        }
        if (url.includes('person_status')) return csvResponse('status,person_count,percentage\nTjänstgörande riksdagsledamot,327,13.11');
        if (url.includes('risk_by_party')) return csvResponse('party,risk_level,politician_count,avg_risk_score\nS,HIGH,18,48.56');
        if (url.includes('politician_risk_levels')) return csvResponse('risk_level,politician_count,percentage\nHIGH,78,19.40');
        if (url.includes('annual_ballots')) return csvResponse('year,unique_ballots,total_votes,avg_yes_rate\n2026,40,13960,');
        if (url.includes('crisis_resilience')) return csvResponse('party,resilience_classification,politician_count,avg_resilience_score\nM,HIGHLY_RESILIENT,65,80.00');
        if (url.includes('party_performance') && !url.includes('metrics')) return csvResponse('party,party_name,active_members,inactive_members,documents_last_year,motions_last_year,propositions_last_year,docs_per_member,performance_level\nS,S,0,0,850,0,0,0,GOOD');
        if (url.includes('performance_metrics')) return csvResponse('party,party_name,registration_date,active_members,inactive_members,total_violations,members_with_violations,violation_rate_percentage,latest_member_violation,total_votes_last_year,avg_absence_rate,avg_win_rate,avg_rebel_rate,avg_participation_rate,documents_last_year,motions_last_year,propositions_last_year,docs_per_member,current_ministers,current_committee_chairs,performance_score,performance_level,strengths,weaknesses\nS,S,,0,0,0,0,0,,0,0,43,0.06,85,0,0,0,0,0,0,67,GOOD,,');
        if (url.includes('party_momentum')) return csvResponse('party,year,quarter,period,participation_rate,momentum,trend_direction,stability_classification\nS,2026,1,2026-Q1,0,0,STABLE,VERY_STABLE');
        if (url.includes('influence_metrics')) return csvResponse('person_id,first_name,last_name,party,network_connections,network_median,influence_classification,broker_classification,influence_assessment\n123,Test,MP,S,200,146,INFLUENTIAL,STRONG_BROKER,High');
        if (url.includes('risk_summary')) return csvResponse('person_id,first_name,last_name,party,status,total_violations,latest_violation_date,absenteeism_violations,effectiveness_violations,discipline_violations,productivity_violations,collaboration_violations,annual_absence_rate,annual_rebel_rate,annual_vote_count,documents_last_year,risk_score,risk_level,risk_assessment\n123,Test,MP,S,Active,0,,0,0,0,0,0,0,0,500,10,20,LOW,Low');
        if (url.includes('committee_productivity') && !url.includes('matrix')) return csvResponse('committee_name,total_documents,propositions_count,reports_count,total_members,docs_per_member,productivity_level\nTest,62,0,0,48,0.65,HIGHLY_PRODUCTIVE');
        if (url.includes('committee_activity')) return csvResponse('org,document_count\nTU,10010');
        if (url.includes('party_effectiveness')) return csvResponse('party,year,quarter,documents_produced,motions_count,active_members,avg_win_rate,effectiveness_assessment\nS,2025,4,100,50,107,43,Standard');
        return Promise.resolve({ ok: false });
      });

      const result = await loader.loadAll();
      expect(result.overview).toBeDefined();
      expect(result.election).toBeDefined();
      expect(result.partyPerf).toBeDefined();
      expect(result.top10).toBeDefined();
      expect(result.committees).toBeDefined();
      expect(result.votingPatterns).toBeDefined();
    });
  });
});
