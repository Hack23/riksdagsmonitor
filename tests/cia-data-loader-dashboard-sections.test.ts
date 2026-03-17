import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CIADataLoader } from '../src/browser/cia/data-loader.js';

function mockFetchForCSV(csvMap: Record<string, string>) {
  return vi.fn().mockImplementation(async (url: string) => {
    for (const [pattern, csv] of Object.entries(csvMap)) {
      if (url.includes(pattern)) {
        return { ok: true, text: async () => csv };
      }
    }
    return { ok: false, status: 404 };
  });
}

describe('CIADataLoader dashboard sections', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('uses coalition alignment CSV when available', async () => {
    const alignmentCsv = `party1,party2,alignment_rate
M,KD,0.84
S,V,0.73`;
    const effectivenessCsv = `party,year,quarter,avg_win_rate
M,2026,1,70
KD,2026,1,67
S,2026,1,55
V,2026,1,59`;
    const riskCsv = `party,risk_level,politician_count,avg_risk_score
M,HIGH,5,40
M,LOW,60,20`;

    globalThis.fetch = mockFetchForCSV({
      'distribution_coalition_alignment.csv': alignmentCsv,
      'distribution_party_effectiveness_trends.csv': effectivenessCsv,
      'distribution_risk_by_party.csv': riskCsv,
    });

    const loader = new CIADataLoader();
    const result = await loader.loadVotingPatterns();
    const labels = result.votingMatrix.labels;
    const idxM = labels.indexOf('M');
    const idxKD = labels.indexOf('KD');

    expect(result.description).toContain('Real coalition alignment');
    expect(result.votingMatrix.agreementMatrix[idxM][idxKD]).toBe(84);
    expect(result.votingMatrix.agreementMatrix[idxKD][idxM]).toBe(84);
  });

  it('falls back to win-rate similarity when coalition alignment CSV is unavailable', async () => {
    const effectivenessCsv = `party,year,quarter,avg_win_rate
S,2026,1,80
M,2026,1,70`;
    const riskCsv = `party,risk_level,politician_count,avg_risk_score
S,HIGH,10,45
S,LOW,90,20`;

    globalThis.fetch = mockFetchForCSV({
      'distribution_party_effectiveness_trends.csv': effectivenessCsv,
      'distribution_risk_by_party.csv': riskCsv,
    });

    const loader = new CIADataLoader();
    const result = await loader.loadVotingPatterns();
    const labels = result.votingMatrix.labels;
    const idxS = labels.indexOf('S');
    const idxM = labels.indexOf('M');

    expect(result.description).toContain('Derived from CIA party effectiveness');
    expect(result.votingMatrix.agreementMatrix[idxS][idxM]).toBe(90);
    expect(result.votingMatrix.agreementMatrix[idxS][idxS]).toBe(100);
  });

  it('parses and filters ministry dashboard rows', async () => {
    const ministryCsv = `ministry_name,year,quarter,documents_produced,government_bills,effectiveness_assessment
Justitiedepartementet,2026,1,10,2,High
Kulturdepartementet,2026,1,0,0,Low`;

    globalThis.fetch = mockFetchForCSV({
      'distribution_ministry_effectiveness.csv': ministryCsv,
    });

    const loader = new CIADataLoader();
    const result = await loader.loadMinistryDashboard();

    expect(result.ministries).toHaveLength(1);
    expect(result.ministries[0]).toEqual(
      expect.objectContaining({
        name: 'Justitiedepartementet',
        documentsProduced: 10,
        governmentBills: 2,
      }),
    );
  });

  it('parses demographics and keeps only Riksdag parties', async () => {
    const genderCsv = `party,gender,count
S,MAN,60
S,KVINNA,50
XYZ,MAN,9`;
    const experienceCsv = `party,experience_level,politician_count
S,ACTIVE_COMMITTEES,80
M,LONG_SERVING_PARLIAMENT,35
XYZ,MIXED_EXPERIENCE,12`;

    globalThis.fetch = mockFetchForCSV({
      'distribution_gender_by_party.csv': genderCsv,
      'distribution_experience_by_party.csv': experienceCsv,
    });

    const loader = new CIADataLoader();
    const result = await loader.loadDemographics();

    expect(result.genderByParty.some(x => x.party === 'XYZ')).toBe(false);
    expect(result.experienceByParty.some(x => x.party === 'XYZ')).toBe(false);
    expect(result.genderByParty).toEqual(
      expect.arrayContaining([expect.objectContaining({ party: 'S', gender: 'MAN', count: 60 })]),
    );
  });

  it('parses document activity and risk evolution with zero-row filtering', async () => {
    const docTypesCsv = `year,document_type,doc_count
2025,mot,100
2025,bet,0`;
    const decisionCsv = `year,month,decision_count,approved_decisions,rejected_decisions,approval_rate
2025,1,12,8,4,66.7
2025,2,0,0,0,0`;
    const riskCsv = `assessment_period,risk_severity,politician_count,avg_risk_score
2026-01-01 00:00:00+01,HIGH,12,42.1
2026-01-01 00:00:00+01,LOW,0,20`;

    globalThis.fetch = mockFetchForCSV({
      'distribution_annual_document_types.csv': docTypesCsv,
      'distribution_decision_trends.csv': decisionCsv,
      'distribution_risk_evolution_temporal.csv': riskCsv,
    });

    const loader = new CIADataLoader();
    const docs = await loader.loadDocumentActivity();
    const risk = await loader.loadRiskEvolution();

    expect(docs.documentTypes).toHaveLength(1);
    expect(docs.decisionTrends).toHaveLength(1);
    expect(risk.entries).toHaveLength(1);
    expect(risk.entries[0]).toEqual(
      expect.objectContaining({ severity: 'HIGH', politicianCount: 12 }),
    );
  });
});

