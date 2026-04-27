import { describe, it, expect } from 'vitest';
import type { LoadCSV } from '../src/browser/cia/csv-utils.js';
import { parseCSV, createLoadCSV } from '../src/browser/cia/csv-utils.js';
import {
  loadOverviewDashboard,
  loadElectionAnalysis,
  loadVotingPatterns,
  loadMinistryDashboard,
  loadDemographics,
  loadDocumentActivity,
  loadRiskEvolution,
  loadCommitteeNetwork,
  loadPartyPerformance,
  loadTop10Influential
} from '../src/browser/cia/loaders/index.js';

/**
 * Build a `LoadCSV` closure that returns parsed rows for any local path that
 * matches a substring key in `csvMap`. Returns `[]` for unmatched paths so
 * loaders fall through to their empty-data branches deterministically.
 */
function fakeLoadCSV(csvMap: Record<string, string>): LoadCSV {
  return async (localPath: string) => {
    for (const [pattern, csv] of Object.entries(csvMap)) {
      if (localPath.includes(pattern)) {
        return parseCSV(csv);
      }
    }
    return [];
  };
}

describe('CIA per-domain loaders (extracted modules)', () => {
  describe('loadOverviewDashboard', () => {
    it('aggregates active MP, party and risk totals', async () => {
      const personStatusCsv = `status,person_count
Tjänstgörande riksdagsledamot,349`;
      const riskCsv = `party,risk_level,politician_count
M,HIGH,5
S,MEDIUM,12
S,LOW,40
SD,LOW,30
V,LOW,20`;
      const riskLevelsCsv = `risk_level,politician_count
HIGH,5
MEDIUM,12
LOW,90`;
      const annualBallotsCsv = `year,total_votes,unique_ballots
2025,4200,180`;
      const resilienceCsv = `party,avg_resilience_score
M,75
KD,70
L,68
SD,80`;

      const loadCSV = fakeLoadCSV({
        'distribution_person_status.csv': personStatusCsv,
        'distribution_risk_by_party.csv': riskCsv,
        'distribution_politician_risk_levels.csv': riskLevelsCsv,
        'distribution_annual_ballots.csv': annualBallotsCsv,
        'distribution_crisis_resilience.csv': resilienceCsv
      });

      const result = await loadOverviewDashboard(loadCSV);

      expect(result.keyMetrics.totalMPs).toBe(349);
      expect(result.keyMetrics.totalParties).toBe(4);
      expect(result.keyMetrics.totalRiskRules).toBe(107);
      expect(result.keyMetrics.coalitionSeats).toBe(176);
      expect(result.riskAlerts.critical).toBe(5);
      expect(result.riskAlerts.major).toBe(12);
      expect(result.riskAlerts.minor).toBe(90);
      expect(result.parliamentActivity.votesLastMonth).toBe(4200);
      expect(result.coalitionStability.stabilityScore).toBe(73);
      expect(result.coalitionStability.riskLevel).toBe('moderate');
      expect(result._source).toBe('csv');
    });

    it('falls back to defaults when CSV sources are empty', async () => {
      const result = await loadOverviewDashboard(async () => []);
      expect(result.keyMetrics.totalMPs).toBe(349);
      expect(result.keyMetrics.totalParties).toBe(8);
      expect(result.keyMetrics.totalRiskRules).toBe(45);
      expect(result.coalitionStability.stabilityScore).toBe(72);
    });
  });

  describe('loadElectionAnalysis', () => {
    it('parses forecast and scenarios from CSV inputs', async () => {
      const forecastCsv = `name,currentSeats,predictedSeats,change,voteShare,confidenceMin,confidenceMax
Moderates,68,75,7,22.4,70,80
Social Democrats,107,100,-7,29.0,,`;
      const scenariosCsv = `name,probability,composition,totalSeats,majority,riskLevel
Tidö,0.55,"M,KD,L,SD",178,true,MEDIUM`;

      const loadCSV = fakeLoadCSV({
        'election_forecast.csv': forecastCsv,
        'coalition_scenarios.csv': scenariosCsv
      });

      const result = await loadElectionAnalysis(loadCSV);
      expect(result.forecast.parties).toHaveLength(2);
      expect(result.forecast.parties[0].confidenceInterval).toEqual({ min: 70, max: 80 });
      expect(result.forecast.parties[1].confidenceInterval).toBeUndefined();
      expect(result.coalitionScenarios).toHaveLength(1);
      expect(result.coalitionScenarios[0].composition).toEqual(['M', 'KD', 'L', 'SD']);
      expect(result.coalitionScenarios[0].majority).toBe(true);
      expect(result.electionDate).toBe('2026-09-13');
    });
  });

  describe('loadVotingPatterns', () => {
    it('uses real coalition alignment data when available', async () => {
      const alignmentCsv = `party1,party2,alignment_rate
M,KD,0.84`;
      const loadCSV = fakeLoadCSV({
        'distribution_coalition_alignment.csv': alignmentCsv
      });

      const result = await loadVotingPatterns(loadCSV);
      const idxM = result.votingMatrix.labels.indexOf('M');
      const idxKD = result.votingMatrix.labels.indexOf('KD');

      expect(result.description).toContain('Real coalition alignment');
      expect(result.votingMatrix.agreementMatrix[idxM][idxKD]).toBe(84);
      expect(result.votingMatrix.agreementMatrix[idxKD][idxM]).toBe(84);
    });
  });

  describe('loadMinistryDashboard', () => {
    it('sorts ministries by documents produced and filters zero rows', async () => {
      const ministryCsv = `ministry_name,effectiveness_assessment,documents_produced,government_bills,year,quarter
Finance,HIGH,120,8,2025,2
Justice,MEDIUM,45,3,2025,2
Empty,LOW,0,0,2025,2`;
      const loadCSV = fakeLoadCSV({
        'distribution_ministry_effectiveness.csv': ministryCsv
      });

      const result = await loadMinistryDashboard(loadCSV);
      expect(result.ministries).toHaveLength(2);
      expect(result.ministries[0].name).toBe('Finance');
      expect(result.ministries[0].documentsProduced).toBe(120);
    });
  });

  describe('loadDemographics', () => {
    it('keeps only the 8 Riksdag parties', async () => {
      const genderCsv = `party,gender,count
M,F,30
NOTREAL,F,99`;
      const experienceCsv = `party,experience_level,politician_count
S,Senior,40
NOTREAL,Senior,2`;
      const loadCSV = fakeLoadCSV({
        'distribution_gender_by_party.csv': genderCsv,
        'distribution_experience_by_party.csv': experienceCsv
      });

      const result = await loadDemographics(loadCSV);
      expect(result.genderByParty).toHaveLength(1);
      expect(result.genderByParty[0].party).toBe('M');
      expect(result.experienceByParty).toHaveLength(1);
      expect(result.experienceByParty[0].party).toBe('S');
    });
  });

  describe('loadDocumentActivity', () => {
    it('drops zero-count rows for both document types and decisions', async () => {
      const docTypesCsv = `year,document_type,doc_count
2025,Motion,1200
2025,Bill,0`;
      const decisionsCsv = `year,month,decision_count,approved_decisions,rejected_decisions,approval_rate
2025,1,80,60,20,75
2025,2,0,0,0,0`;
      const loadCSV = fakeLoadCSV({
        'distribution_annual_document_types.csv': docTypesCsv,
        'distribution_decision_trends.csv': decisionsCsv
      });

      const result = await loadDocumentActivity(loadCSV);
      expect(result.documentTypes).toHaveLength(1);
      expect(result.documentTypes[0].documentType).toBe('Motion');
      expect(result.decisionTrends).toHaveLength(1);
      expect(result.decisionTrends[0].decisionCount).toBe(80);
    });
  });

  describe('loadRiskEvolution', () => {
    it('emits temporal risk entries with zero filtering', async () => {
      const riskEvolutionCsv = `assessment_period,risk_severity,politician_count,avg_risk_score
2024-Q4,HIGH,12,72
2025-Q1,HIGH,0,0
2025-Q1,MEDIUM,30,40`;
      const loadCSV = fakeLoadCSV({
        'distribution_risk_evolution_temporal.csv': riskEvolutionCsv
      });

      const result = await loadRiskEvolution(loadCSV);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].politicianCount).toBe(12);
      expect(result.entries[1].severity).toBe('MEDIUM');
    });
  });

  describe('loadCommitteeNetwork', () => {
    it('filters inactive committees with no measured output', async () => {
      const productivityCsv = `committee_name,total_documents,total_members,docs_per_member,productivity_level
Finansutskottet,300,17,17.6,HIGH
Försvarsutskottet,200,17,11.7,HIGH
Riksdagen,1000,349,2.8,HIGH
GhostUtskottet,0,0,0,INACTIVE`;
      const activityCsv = `org,document_count
FiU,310
FöU,205`;
      const loadCSV = fakeLoadCSV({
        'distribution_committee_productivity.csv': productivityCsv,
        'distribution_committee_activity.csv': activityCsv
      });

      const result = await loadCommitteeNetwork(loadCSV);
      expect(result.committees.map(c => c.name)).toEqual([
        'Finansutskottet',
        'Försvarsutskottet'
      ]);
      expect(result.committees[0].documentsProcessed).toBe(310);
      expect(result.networkGraph.nodes).toHaveLength(2);
      expect(result.networkGraph.edges).toHaveLength(1);
    });
  });

  describe('loadPartyPerformance', () => {
    it('joins performance, metrics and momentum and sorts by seats', async () => {
      const performanceCsv = `party,party_name,active_members,documents_last_year,motions_last_year,performance_level
S,Social Democrats,107,300,80,HIGH
M,Moderates,68,250,60,HIGH
NOTREAL,Ghosts,5,1,0,LOW`;
      const metricsCsv = `party,avg_win_rate,total_votes_last_year,avg_participation_rate,avg_rebel_rate,performance_level
S,55,4000,92,3,HIGH
M,72,3500,93,2,HIGH`;
      const momentumCsv = `party,year,quarter,trend_direction,stability_classification
S,2025,1,Up,Stable
S,2025,2,Down,Stable
M,2025,2,Up,Stable`;

      const loadCSV = fakeLoadCSV({
        'distribution_party_performance.csv': performanceCsv,
        'view_party_performance_metrics_sample.csv': metricsCsv,
        'distribution_party_momentum.csv': momentumCsv
      });

      const result = await loadPartyPerformance(loadCSV);
      expect(result.parties).toHaveLength(2);
      expect(result.parties[0].id).toBe('S');
      expect(result.parties[0].metrics.seats).toBe(107);
      expect(result.parties[0].trends.supportTrend).toBe('down');
      expect(result.parties[1].id).toBe('M');
      expect(result.parties[1].voting.rebellionRate).toBe(2);
    });
  });

  describe('loadTop10Influential', () => {
    it('ranks MPs by network connections and joins risk data', async () => {
      const influenceCsv = `person_id,first_name,last_name,party,influence_classification,network_connections,broker_classification
p1,Anna,Andersson,S,HIGH_INFLUENCE,42,bridge
p2,Bertil,Berg,M,MODERATE,30,connector
p3,Cecilia,Carlsson,SD,LOW,0,none`;
      const riskCsv = `person_id,risk_level,risk_score
p1,LOW,12
p2,MEDIUM,40`;

      const loadCSV = fakeLoadCSV({
        'view_riksdagen_politician_influence_metrics_sample.csv': influenceCsv,
        'view_politician_risk_summary_sample.csv': riskCsv
      });

      const result = await loadTop10Influential(loadCSV);
      expect(result.rankings).toHaveLength(2);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[0].id).toBe('p1');
      expect(result.rankings[0].role).toBe('High Influence');
      expect(result.rankings[0].riskLevel).toBe('LOW');
      expect(result.rankings[1].riskScore).toBe(40);
    });
  });

  describe('createLoadCSV', () => {
    it('builds a working closure bound to URLs', async () => {
      const originalFetch = globalThis.fetch;
      const seen: string[] = [];
      globalThis.fetch = async (url: string | URL | Request) => {
        const u = typeof url === 'string' ? url : url.toString();
        seen.push(u);
        return { ok: true, text: async () => 'a,b\n1,2' } as Response;
      };
      try {
        const loadCSV = createLoadCSV('/base/', '');
        const rows = await loadCSV('foo.csv');
        expect(rows).toEqual([{ a: 1, b: 2 }]);
        expect(seen[0]).toBe('/base/foo.csv');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
