/**
 * Tests for populate-analysis-data script logic.
 *
 * Validates:
 * - riksMoteFromDate calculation
 * - Integration with persistence functions (via mock MCP client)
 * - Correct handling of empty/error responses
 * - All data types: documents, events, MPs, government, voting groups,
 *   World Bank indicators, SCB statistics
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import type { RawDocument } from '../scripts/data-transformers/types.js';
import type { DownloadedData } from '../scripts/parliamentary-data/data-downloader.js';
import {
  persistDownloadedData,
  persistEvents,
  persistMPs,
  persistMCPResponse,
  persistWorldBankData,
  persistSCBData,
} from '../scripts/parliamentary-data/data-persistence.js';
import { riksMoteFromDate } from '../scripts/populate-analysis-data.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRawDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'H901FiU1',
    titel: 'Test proposition',
    doktyp: 'prop',
    organ: 'FiU',
    datum: '2026-03-28',
    ...overrides,
  };
}

function emptyDownloadedData(): DownloadedData {
  return {
    propositions: [],
    motions: [],
    committeeReports: [],
    votes: [],
    speeches: [],
    questions: [],
    interpellations: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('riksMoteFromDate', () => {
  it('should return current session for October (start of new session)', () => {
    expect(riksMoteFromDate('2025-10-01')).toBe('2025/26');
  });

  it('should return current session for November', () => {
    expect(riksMoteFromDate('2025-11-15')).toBe('2025/26');
  });

  it('should return current session for December', () => {
    expect(riksMoteFromDate('2025-12-31')).toBe('2025/26');
  });

  it('should return previous session for January', () => {
    expect(riksMoteFromDate('2026-01-15')).toBe('2025/26');
  });

  it('should return previous session for March', () => {
    expect(riksMoteFromDate('2026-03-28')).toBe('2025/26');
  });

  it('should return previous session for September (end of session)', () => {
    expect(riksMoteFromDate('2026-09-30')).toBe('2025/26');
  });
});

describe('populate-analysis-data integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'riksdag-populate-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('persistDownloadedData for full population', () => {
    it('should persist all document types with correct directory structure', () => {
      const data: DownloadedData = {
        propositions: [makeRawDoc({ dok_id: 'PROP1', doktyp: 'prop' })],
        motions: [makeRawDoc({ dok_id: 'MOT1', doktyp: 'mot' })],
        committeeReports: [makeRawDoc({ dok_id: 'BET1', doktyp: 'bet' })],
        votes: [makeRawDoc({ dok_id: 'VOT1', doktyp: 'votering', datum: '2026-03-28' })],
        speeches: [makeRawDoc({ dok_id: 'ANF1', doktyp: 'anf' })],
        questions: [makeRawDoc({ dok_id: 'FR1', doktyp: 'fr' })],
        interpellations: [makeRawDoc({ dok_id: 'IP1', doktyp: 'ip' })],
      };

      const result = persistDownloadedData(data, '2025/26', undefined, tmpDir);
      expect(result.written).toBe(7);
      expect(result.skipped).toBe(0);

      // All 7 type directories should have files
      for (const dir of ['propositions', 'motions', 'committeeReports', 'votes', 'speeches', 'questions', 'interpellations']) {
        const typeDir = path.join(tmpDir, 'documents', dir);
        expect(fs.existsSync(typeDir)).toBe(true);
        const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.json') && !f.endsWith('.meta.json'));
        expect(files.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should create date-stamped vote directory', () => {
      const data: DownloadedData = {
        ...emptyDownloadedData(),
        votes: [makeRawDoc({ dok_id: 'VOT-DATE', datum: '2026-03-28' })],
      };

      persistDownloadedData(data, '2025/26', undefined, tmpDir);

      // Should exist in both documents/votes/ and votes/2026-03-28/
      expect(fs.existsSync(path.join(tmpDir, 'documents', 'votes', 'vot-date.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'votes', '2026-03-28', 'vot-date.json'))).toBe(true);
    });
  });

  describe('persistEvents for calendar population', () => {
    it('should persist events to date-stamped directories', () => {
      const events: RawDocument[] = [
        makeRawDoc({ dok_id: 'EVT1', datum: '2026-03-28' }),
        makeRawDoc({ dok_id: 'EVT2', datum: '2026-04-01' }),
      ];

      const result = persistEvents(events, '2025/26', tmpDir);
      expect(result.written).toBe(2);

      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28', 'evt1.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-04-01', 'evt2.json'))).toBe(true);

      // Sidecars should also exist
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28', 'evt1.meta.json'))).toBe(true);
    });

    it('should handle events with "from" field instead of "datum"', () => {
      const events: RawDocument[] = [
        { from: '2026-04-05T09:00:00', titel: 'Committee Meeting' } as unknown as RawDocument,
      ];

      const result = persistEvents(events, '2025/26', tmpDir);
      expect(result.written).toBe(1);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-04-05'))).toBe(true);
    });
  });

  describe('persistMPs for MP population', () => {
    it('should persist MP profiles using intressent_id', () => {
      const mps: RawDocument[] = [
        { intressent_id: 'ABC123', tilltalsnamn: 'Test', efternamn: 'Person' } as unknown as RawDocument,
        { intressent_id: 'DEF456', tilltalsnamn: 'Another', efternamn: 'MP' } as unknown as RawDocument,
      ];

      const result = persistMPs(mps, '2025/26', tmpDir);
      expect(result.written).toBe(2);

      const mpDir = path.join(tmpDir, 'mps');
      expect(fs.existsSync(path.join(mpDir, 'abc123.json'))).toBe(true);
      expect(fs.existsSync(path.join(mpDir, 'abc123.meta.json'))).toBe(true);
      expect(fs.existsSync(path.join(mpDir, 'def456.json'))).toBe(true);
    });

    it('should handle large batch of MPs', () => {
      const mps: RawDocument[] = Array.from({ length: 50 }, (_, i) => ({
        intressent_id: `MP${String(i + 1).padStart(3, '0')}`,
        tilltalsnamn: `MP ${i + 1}`,
      } as unknown as RawDocument));

      const result = persistMPs(mps, '2025/26', tmpDir);
      expect(result.written).toBe(50);
    });
  });

  describe('end-to-end population flow', () => {
    it('should persist all data types to the same root', () => {
      // Documents
      const data: DownloadedData = {
        propositions: [makeRawDoc({ dok_id: 'PROP-E2E' })],
        motions: [makeRawDoc({ dok_id: 'MOT-E2E' })],
        committeeReports: [],
        votes: [],
        speeches: [],
        questions: [],
        interpellations: [],
      };
      const docResult = persistDownloadedData(data, '2025/26', undefined, tmpDir);

      // Events
      const events: RawDocument[] = [
        makeRawDoc({ dok_id: 'EVT-E2E', datum: '2026-03-28' }),
      ];
      const evtResult = persistEvents(events, '2025/26', tmpDir);

      // MPs
      const mps: RawDocument[] = [
        { intressent_id: 'MP-E2E', tilltalsnamn: 'Test' } as unknown as RawDocument,
      ];
      const mpResult = persistMPs(mps, '2025/26', tmpDir);

      // All persist to the same root
      expect(docResult.dataRoot).toBe(tmpDir);
      expect(evtResult.dataRoot).toBe(tmpDir);
      expect(mpResult.dataRoot).toBe(tmpDir);

      // Verify directory structure
      expect(fs.existsSync(path.join(tmpDir, 'documents', 'propositions'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'documents', 'motions'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'mps'))).toBe(true);

      expect(docResult.written).toBe(2);
      expect(evtResult.written).toBe(1);
      expect(mpResult.written).toBe(1);
    });
  });

  describe('persistMCPResponse for government documents', () => {
    it('should persist government document to mcp-responses/riksdag-regering/search_regering/', () => {
      const govDoc = { id: 'GOV-DOC-1', title: 'Test Government Document', type: 'pressmeddelande' };
      const filePath = persistMCPResponse(
        { tool: 'search_regering', params: { limit: 10 }, server: 'riksdag-regering' },
        govDoc,
        'gov-doc-1',
        tmpDir,
      );

      expect(fs.existsSync(filePath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(content.id).toBe('GOV-DOC-1');

      // Sidecar metadata
      const metaPath = filePath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.mcpTool).toBe('search_regering');
      expect(meta.documentType).toBe('riksdag-regering');
    });

    it('should persist voting groups to mcp-responses/riksdag-regering/get_voting_group/', () => {
      const group = { parti: 'S', ja: 100, nej: 20, avstar: 5 };
      const filePath = persistMCPResponse(
        { tool: 'get_voting_group', params: { rm: '2025/26', groupBy: 'parti' }, server: 'riksdag-regering' },
        group,
        '2025-26-s',
        tmpDir,
      );

      expect(fs.existsSync(filePath)).toBe(true);
      expect(filePath).toContain('mcp-responses');
      expect(filePath).toContain('riksdag-regering');
      expect(filePath).toContain('get_voting_group');

      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(content.parti).toBe('S');
    });
  });

  describe('persistWorldBankData for economic indicators', () => {
    it('should persist World Bank data under worldbank/{indicator}/', () => {
      const dataPoints = [
        { countryId: 'SWE', countryName: 'Sweden', indicatorId: 'NY.GDP.MKTP.KD.ZG', indicatorName: 'GDP growth', date: '2024', value: 1.2 },
        { countryId: 'SWE', countryName: 'Sweden', indicatorId: 'NY.GDP.MKTP.KD.ZG', indicatorName: 'GDP growth', date: '2023', value: 0.8 },
      ];

      const filePath = persistWorldBankData(
        'NY.GDP.MKTP.KD.ZG',
        'SWE',
        dataPoints,
        tmpDir,
      );

      expect(fs.existsSync(filePath)).toBe(true);

      // Verify directory structure: worldbank/{indicator}/{country}.json
      expect(filePath).toContain(path.join('worldbank', 'ny-gdp-mktp-kd-zg', 'swe.json'));

      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(content).toHaveLength(2);
      expect(content[0].value).toBe(1.2);

      // Sidecar metadata
      const metaPath = filePath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.mcpTool).toBe('world-bank-api');
      expect(meta.indicator).toBe('NY.GDP.MKTP.KD.ZG');
      expect(meta.country).toBe('SWE');
    });

    it('should handle multiple indicators for Sweden', () => {
      const indicators = ['NY.GDP.MKTP.KD.ZG', 'SL.UEM.TOTL.ZS', 'FP.CPI.TOTL.ZG'];

      for (const ind of indicators) {
        persistWorldBankData(ind, 'SWE', [{ value: 1.5, date: '2024' }], tmpDir);
      }

      // All three indicator directories should exist
      for (const ind of indicators) {
        const dirName = ind.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        expect(fs.existsSync(path.join(tmpDir, 'worldbank', dirName))).toBe(true);
      }
    });
  });

  describe('persistSCBData for Swedish statistics', () => {
    it('should persist SCB table data under scb/', () => {
      const tableData = [
        { tableId: 'TAB5765', label: 'Unemployment rate', value: 7.5, unit: '%', period: '2025M01' },
        { tableId: 'TAB5765', label: 'Unemployment rate', value: 7.2, unit: '%', period: '2025M02' },
      ];

      const filePath = persistSCBData(
        'TAB5765',
        tableData,
        { domain: 'labour', query: 'sysselsättning arbetslöshet' },
        tmpDir,
      );

      expect(fs.existsSync(filePath)).toBe(true);
      expect(filePath).toContain(path.join('scb', 'tab5765.json'));

      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(content).toHaveLength(2);
      expect(content[0].label).toBe('Unemployment rate');

      // Sidecar metadata with query provenance
      const metaPath = filePath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.mcpTool).toBe('scb-pxweb');
      expect(meta.tableId).toBe('TAB5765');
      expect(meta.query.domain).toBe('labour');
    });

    it('should persist without query parameter', () => {
      const filePath = persistSCBData('TAB1291', [{ value: 42 }], undefined, tmpDir);
      expect(fs.existsSync(filePath)).toBe(true);

      const meta = JSON.parse(fs.readFileSync(filePath.replace('.json', '.meta.json'), 'utf8'));
      expect(meta.tableId).toBe('TAB1291');
      expect(meta.query).toBeUndefined();
    });
  });

  describe('full end-to-end with all data types', () => {
    it('should populate all data type directories from a single root', () => {
      // 1. Documents
      const data: DownloadedData = {
        propositions: [makeRawDoc({ dok_id: 'PROP-FULL' })],
        motions: [],
        committeeReports: [],
        votes: [],
        speeches: [],
        questions: [],
        interpellations: [],
      };
      persistDownloadedData(data, '2025/26', undefined, tmpDir);

      // 2. Events
      persistEvents([makeRawDoc({ dok_id: 'EVT-FULL', datum: '2026-03-28' })], '2025/26', tmpDir);

      // 3. MPs
      persistMPs([{ intressent_id: 'MP-FULL' } as unknown as RawDocument], '2025/26', tmpDir);

      // 4. Government documents (via MCP response)
      persistMCPResponse(
        { tool: 'search_regering', params: {}, server: 'riksdag-regering' },
        { id: 'GOV-FULL', title: 'Test' },
        'gov-full',
        tmpDir,
      );

      // 5. Voting groups (via MCP response)
      persistMCPResponse(
        { tool: 'get_voting_group', params: { groupBy: 'parti' }, server: 'riksdag-regering' },
        { parti: 'M', ja: 50 },
        '2025-26-m',
        tmpDir,
      );

      // 6. World Bank
      persistWorldBankData('NY.GDP.MKTP.KD.ZG', 'SWE', [{ value: 1.5 }], tmpDir);

      // 7. SCB
      persistSCBData('TAB5765', [{ value: 7.5 }], { domain: 'labour' }, tmpDir);

      // Verify ALL directory types exist
      expect(fs.existsSync(path.join(tmpDir, 'documents', 'propositions'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'mps'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'mcp-responses', 'riksdag-regering', 'search_regering'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'mcp-responses', 'riksdag-regering', 'get_voting_group'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'worldbank'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'scb'))).toBe(true);
    });
  });
});
