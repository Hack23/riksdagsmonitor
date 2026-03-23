/**
 * Reusable MockMCPClient fixture for testing news generation pipeline.
 * @author Hack23 AB
 * @license Apache-2.0
 */
import type { RawDocument, RawCalendarEvent } from '../../scripts/data-transformers/types.js';

type FixtureValue = unknown[] | Record<string, unknown> | unknown;

export class MockMCPClient {
  private fixtures: Map<string, FixtureValue> = new Map();
  readonly baseURL: string = 'http://mock-mcp:3000';
  timeout: number = 30000;

  withFixture(method: string, result: FixtureValue): this {
    this.fixtures.set(method, result);
    return this;
  }

  private getFixture(method: string): FixtureValue {
    return this.fixtures.get(method) ?? [];
  }

  async searchDocuments(_p?: unknown): Promise<RawDocument[]> { return this.getFixture('searchDocuments') as RawDocument[]; }
  async fetchCalendarEvents(_f?: string, _t?: string): Promise<RawCalendarEvent[]> { return this.getFixture('fetchCalendarEvents') as RawCalendarEvent[]; }
  async fetchCommitteeReports(_l?: number): Promise<RawDocument[]> { return this.getFixture('fetchCommitteeReports') as RawDocument[]; }
  async fetchPropositions(_p?: unknown): Promise<RawDocument[]> { return this.getFixture('fetchPropositions') as RawDocument[]; }
  async fetchMotions(_p?: unknown): Promise<RawDocument[]> { return this.getFixture('fetchMotions') as RawDocument[]; }
  async fetchInterpellations(_p?: unknown): Promise<RawDocument[]> { return this.getFixture('fetchInterpellations') as RawDocument[]; }
  async fetchWrittenQuestions(_p?: unknown): Promise<unknown[]> { return this.getFixture('fetchWrittenQuestions') as unknown[]; }
  async fetchVotingRecords(_p?: unknown): Promise<unknown[]> { return this.getFixture('fetchVotingRecords') as unknown[]; }
  async searchSpeeches(_p?: unknown): Promise<unknown[]> { return this.getFixture('searchSpeeches') as unknown[]; }
  async fetchVotingGroup(_p?: unknown): Promise<unknown[]> { return this.getFixture('fetchVotingGroup') as unknown[]; }
  async fetchMPs(_p?: unknown): Promise<unknown[]> { return this.getFixture('fetchMPs') as unknown[]; }

  async enrichDocumentsWithContent(docs: RawDocument[], _c?: number): Promise<RawDocument[]> {
    return docs.map(d => ({ ...d, contentFetched: true }));
  }

  async request(method: string, _p?: unknown): Promise<Record<string, unknown>> {
    if (method === 'get_sync_status') return { last_sync: new Date().toISOString() };
    return this.getFixture(method) as Record<string, unknown>;
  }
}

export const sampleDocuments: RawDocument[] = [
  { dok_id: 'H901FiU1', titel: 'Utgiftsramar', title: 'Expenditure frameworks', doktyp: 'bet', organ: 'FiU', datum: '2026-03-15', parti: '' },
  { dok_id: 'H9011', titel: 'Proposition om säkerhet', title: 'Proposition on security', doktyp: 'prop', datum: '2026-03-14', organ: 'FöU' },
  { dok_id: 'H901Ju22', titel: 'Betänkande om digitalisering', title: 'Report on digitalization', doktyp: 'bet', organ: 'JuU', datum: '2026-03-13' },
  { dok_id: 'H9023456', titel: 'Motion om klimat', title: 'Motion on climate', doktyp: 'mot', datum: '2026-03-12', parti: 'MP', intressent_namn: 'Maria Grönberg' },
  { dok_id: 'H9034567', titel: 'Interpellation om sjukvård', title: 'Interpellation on healthcare', doktyp: 'ip', datum: '2026-03-11', parti: 'V', intressent_namn: 'Erik Lindström', mottagare: 'Socialministern' },
  { dok_id: 'H9045678', titel: 'Fråga om infrastruktur', title: 'Question on infrastructure', doktyp: 'fr', datum: '2026-03-10', parti: 'S', intressent_namn: 'Anna Johansson' },
  { dok_id: 'H9012', titel: 'Proposition om skollag', title: 'Proposition on education', doktyp: 'prop', datum: '2026-03-09', organ: 'UbU' },
  { dok_id: 'H9056789', titel: 'Motion om försvar', title: 'Motion on defense', doktyp: 'mot', datum: '2026-03-08', parti: 'M', intressent_namn: 'Lars Svensson' },
  { dok_id: 'H901FöU5', titel: 'Betänkande om cybersäkerhet', title: 'Report on cybersecurity', doktyp: 'bet', organ: 'FöU', datum: '2026-03-07' },
  { dok_id: 'H9067890', titel: 'Motion om energipolitik', title: 'Motion on energy policy', doktyp: 'mot', datum: '2026-03-06', parti: 'C', intressent_namn: 'Karin Lindqvist' },
  { dok_id: 'H9078901', titel: 'Motion om pensionsreform', title: 'Motion on pension reform', doktyp: 'mot', datum: '2026-03-05', parti: 'SD', intressent_namn: 'Nils Andersson' },
  { dok_id: 'H901FiU12', titel: 'Betänkande om finanspolitik', title: 'Report on fiscal policy', doktyp: 'bet', organ: 'FiU', datum: '2026-03-04' },
];

export const sampleCalendarEvents: RawCalendarEvent[] = [
  { datum: '2026-03-16', tid: '09:00', rubrik: 'Finansutskottets sammanträde', organ: 'FiU' },
  { datum: '2026-03-17', tid: '13:00', rubrik: 'Kammarens frågestund', organ: 'Kammaren' },
  { datum: '2026-03-18', tid: '10:00', rubrik: 'Justitieutskottets sammanträde', organ: 'JuU' },
];
