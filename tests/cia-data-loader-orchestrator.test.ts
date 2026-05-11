import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CIADataLoader } from '../src/browser/cia/data-loader.js';

describe('CIADataLoader orchestrator', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('exposes the same constants and CSV_SOURCES as the extracted modules', () => {
    expect(CIADataLoader.RIKSDAG_PARTIES).toEqual(['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']);
    expect(CIADataLoader.COMMITTEE_DOCS_PER_MEETING_ESTIMATE).toBe(25);
    expect(CIADataLoader.COMMITTEE_ORG_CODES['Finansutskottet']).toBe('FiU');
    expect(CIADataLoader.CSV_SOURCES.electionForecast.local).toBe('election/election_forecast.csv');
  });

  it('parseCSV delegates to the shared helper', () => {
    const loader = new CIADataLoader();
    expect(loader.parseCSV('a,b\n1,2')).toEqual([{ a: 1, b: 2 }]);
    expect(loader.parseCSV('only-header')).toEqual([]);
  });

  it('parseCSV handles quoted commas and multiline fields from larger CIA exports', () => {
    const loader = new CIADataLoader();
    const rows = loader.parseCSV('id,title,comment\n1,"Motion, with comma","Line one\nLine two"');

    expect(rows).toEqual([
      {
        id: 1,
        title: 'Motion, with comma',
        comment: 'Line one\nLine two'
      }
    ]);
  });

  it('parseCSV normalizes headers and surfaces malformed CSV errors', () => {
    const loader = new CIADataLoader();

    expect(loader.parseCSV(' "party" , "risk_level" \nS,HIGH')).toEqual([
      { party: 'S', risk_level: 'HIGH' }
    ]);
    expect(() => loader.parseCSV('party,comment\nS,"unterminated')).toThrow('CSV parse error');
  });

  it('loadCSV uses the configured base URL and fallback URL', async () => {
    const seen: string[] = [];
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      seen.push(url);
      // Local fails, fallback succeeds
      if (seen.length === 1) return { ok: false, status: 404 } as Response;
      return { ok: true, text: async () => 'a,b\n9,8' } as Response;
    });

    const loader = new CIADataLoader();
    const rows = await loader.loadCSV('foo.csv');
    expect(rows).toEqual([{ a: 9, b: 8 }]);
    expect(seen[0]).toBe('/cia-data/foo.csv');
    expect(seen[1]).toContain('raw.githubusercontent.com');
    expect(seen[1]).toContain('foo.csv');
  });

  it('loadCSV recovers from network errors and warns on full failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ ok: false } as Response);

    const loader = new CIADataLoader();
    const rows = await loader.loadCSV('missing.csv');
    expect(rows).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('loadAll wires up every per-domain loader', async () => {
    // Stub each delegating method so we can assert composition without
    // building 20 CSV fixtures.
    const loader = new CIADataLoader();
    const stub = <T>(value: T) => vi.fn().mockResolvedValue(value);
    loader.loadOverviewDashboard = stub({ _source: 'csv' } as never);
    loader.loadElectionAnalysis = stub({ keyFactors: [] } as never);
    loader.loadPartyPerformance = stub({ _source: 'csv', parties: [] } as never);
    loader.loadTop10Influential = stub({ _source: 'csv', rankings: [] } as never);
    loader.loadCommitteeNetwork = stub({ _source: 'csv', committees: [] } as never);
    loader.loadVotingPatterns = stub({ _source: 'csv', rebellionTracking: [] } as never);
    loader.loadMinistryDashboard = stub({ _source: 'csv', ministries: [] } as never);
    loader.loadDemographics = stub({ _source: 'csv', genderByParty: [] } as never);
    loader.loadDocumentActivity = stub({ _source: 'csv', documentTypes: [] } as never);
    loader.loadRiskEvolution = stub({ _source: 'csv', entries: [] } as never);

    const result = await loader.loadAll();
    expect(Object.keys(result).sort()).toEqual([
      'committees',
      'demographics',
      'documentActivity',
      'election',
      'ministry',
      'overview',
      'partyPerf',
      'riskEvolution',
      'top10',
      'votingPatterns'
    ]);
    expect(loader.loadOverviewDashboard).toHaveBeenCalledTimes(1);
    expect(loader.loadElectionAnalysis).toHaveBeenCalledTimes(1);
  });

  it('loadPartyPerformance and loadTop10Influential delegate to the loader modules', async () => {
    const csvMap: Record<string, string> = {
      'distribution_party_performance.csv': `party,party_name,active_members,documents_last_year,motions_last_year,performance_level
S,Social Democrats,107,200,40,HIGH`,
      'view_party_performance_metrics_sample.csv': `party,avg_win_rate
S,60`,
      'distribution_party_momentum.csv': `party,year,quarter,trend_direction,stability_classification
S,2025,2,Up,Stable`,
      'view_riksdagen_politician_influence_metrics_sample.csv': `person_id,first_name,last_name,party,influence_classification,network_connections,broker_classification
p1,Anna,Andersson,S,HIGH_INFLUENCE,42,bridge`,
      'view_politician_risk_summary_sample.csv': `person_id,risk_level,risk_score
p1,LOW,10`
    };
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      for (const [pattern, csv] of Object.entries(csvMap)) {
        if (url.includes(pattern)) return { ok: true, text: async () => csv } as Response;
      }
      return { ok: false } as Response;
    });

    const loader = new CIADataLoader();
    const partyPerf = await loader.loadPartyPerformance();
    expect(partyPerf.parties).toHaveLength(1);
    expect(partyPerf.parties[0].id).toBe('S');

    const top10 = await loader.loadTop10Influential();
    expect(top10.rankings).toHaveLength(1);
    expect(top10.rankings[0].rank).toBe(1);
  });
});
