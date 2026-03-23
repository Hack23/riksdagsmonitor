/**
 * Reusable MockMCPClient fixture for testing news generation pipeline
 * and agentic workflow scripts without real MCP server connections.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, RawCalendarEvent } from '../../scripts/data-transformers/types.js';

/** Shape of fixture data map entries */
type FixtureValue = unknown[] | Record<string, unknown> | unknown;

/**
 * MockMCPClient provides a testable stand-in for the real MCPClient.
 *
 * Usage:
 * ```ts
 * const mock = new MockMCPClient()
 *   .withFixture('searchDocuments', sampleDocuments)
 *   .withFixture('fetchCalendarEvents', sampleEvents);
 * ```
 */
export class MockMCPClient {
  private fixtures: Map<string, FixtureValue> = new Map();

  /** Simulated base URL */
  readonly baseURL: string = 'http://mock-mcp:3000';

  /** Simulated timeout */
  timeout: number = 30000;

  /** Register a fixture for a specific method */
  withFixture(method: string, result: FixtureValue): this {
    this.fixtures.set(method, result);
    return this;
  }

  /** Get fixture or return default empty array */
  private getFixture(method: string): FixtureValue {
    return this.fixtures.get(method) ?? [];
  }

  async searchDocuments(_params?: unknown): Promise<RawDocument[]> {
    return this.getFixture('searchDocuments') as RawDocument[];
  }

  async fetchCalendarEvents(_from?: string, _to?: string): Promise<RawCalendarEvent[]> {
    return this.getFixture('fetchCalendarEvents') as RawCalendarEvent[];
  }

  async fetchCommitteeReports(_limit?: number): Promise<RawDocument[]> {
    return this.getFixture('fetchCommitteeReports') as RawDocument[];
  }

  async fetchPropositions(_params?: unknown): Promise<RawDocument[]> {
    return this.getFixture('fetchPropositions') as RawDocument[];
  }

  async fetchMotions(_params?: unknown): Promise<RawDocument[]> {
    return this.getFixture('fetchMotions') as RawDocument[];
  }

  async fetchInterpellations(_params?: unknown): Promise<RawDocument[]> {
    return this.getFixture('fetchInterpellations') as RawDocument[];
  }

  async fetchWrittenQuestions(_params?: unknown): Promise<unknown[]> {
    return this.getFixture('fetchWrittenQuestions') as unknown[];
  }

  async fetchVotingRecords(_params?: unknown): Promise<unknown[]> {
    return this.getFixture('fetchVotingRecords') as unknown[];
  }

  async searchSpeeches(_params?: unknown): Promise<unknown[]> {
    return this.getFixture('searchSpeeches') as unknown[];
  }

  async fetchVotingGroup(_params?: unknown): Promise<unknown[]> {
    return this.getFixture('fetchVotingGroup') as unknown[];
  }

  async fetchMPs(_params?: unknown): Promise<unknown[]> {
    return this.getFixture('fetchMPs') as unknown[];
  }

  async enrichDocumentsWithContent(docs: RawDocument[], _concurrency?: number): Promise<RawDocument[]> {
    return docs.map(d => ({ ...d, contentFetched: true }));
  }

  async request(method: string, _params?: unknown): Promise<Record<string, unknown>> {
    if (method === 'get_sync_status') {
      return { last_sync: new Date().toISOString() };
    }
    return this.getFixture(method) as Record<string, unknown>;
  }
}

/** Sample raw documents covering all major document types */
export const sampleDocuments: RawDocument[] = [
  {
    dok_id: 'H901FiU1',
    titel: 'Utgiftsramar och beräkning av statsinkomsterna',
    title: 'Expenditure frameworks and calculation of state revenues',
    doktyp: 'bet',
    organ: 'FiU',
    datum: '2026-03-15',
    parti: '',
  },
  {
    dok_id: 'H9011',
    titel: 'Proposition om stärkt nationell säkerhet',
    title: 'Proposition on strengthened national security',
    doktyp: 'prop',
    datum: '2026-03-14',
    organ: 'FöU',
  },
  {
    dok_id: 'H901Ju22',
    titel: 'Betänkande om rättsväsendets digitalisering',
    title: 'Committee report on digitalization of the justice system',
    doktyp: 'bet',
    organ: 'JuU',
    datum: '2026-03-13',
  },
  {
    dok_id: 'H9023456',
    titel: 'Motion om klimatanpassning',
    title: 'Motion on climate adaptation',
    doktyp: 'mot',
    datum: '2026-03-12',
    parti: 'MP',
    intressent_namn: 'Maria Grönberg',
  },
  {
    dok_id: 'H9034567',
    titel: 'Interpellation om sjukvårdens resurser',
    title: 'Interpellation on healthcare resources',
    doktyp: 'ip',
    datum: '2026-03-11',
    parti: 'V',
    intressent_namn: 'Erik Lindström',
    mottagare: 'Socialministern',
  },
  {
    dok_id: 'H9045678',
    titel: 'Skriftlig fråga om infrastrukturinvesteringar',
    title: 'Written question on infrastructure investments',
    doktyp: 'fr',
    datum: '2026-03-10',
    parti: 'S',
    intressent_namn: 'Anna Johansson',
  },
  {
    dok_id: 'H9012',
    titel: 'Proposition om ny skollag',
    title: 'Proposition on new education act',
    doktyp: 'prop',
    datum: '2026-03-09',
    organ: 'UbU',
  },
  {
    dok_id: 'H9056789',
    titel: 'Motion om försvarsbudgeten',
    title: 'Motion on the defense budget',
    doktyp: 'mot',
    datum: '2026-03-08',
    parti: 'M',
    intressent_namn: 'Lars Svensson',
  },
  {
    dok_id: 'H901FöU5',
    titel: 'Betänkande om cybersäkerhet',
    title: 'Committee report on cybersecurity',
    doktyp: 'bet',
    organ: 'FöU',
    datum: '2026-03-07',
  },
  {
    dok_id: 'H9067890',
    titel: 'Motion om energipolitik och grön omställning',
    title: 'Motion on energy policy and green transition',
    doktyp: 'mot',
    datum: '2026-03-06',
    parti: 'C',
    intressent_namn: 'Karin Lindqvist',
  },
];

/** Sample calendar events for week-ahead testing */
export const sampleCalendarEvents: RawCalendarEvent[] = [
  {
    datum: '2026-03-16',
    tid: '09:00',
    rubrik: 'Finansutskottets sammanträde',
    organ: 'FiU',
  },
  {
    datum: '2026-03-17',
    tid: '13:00',
    rubrik: 'Kammarens frågestund',
    organ: 'Kammaren',
  },
  {
    datum: '2026-03-18',
    tid: '10:00',
    rubrik: 'Justitieutskottets sammanträde',
    organ: 'JuU',
  },
];
