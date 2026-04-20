/**
 * Tests for the MCP data persistence and PDF conversion modules:
 * - data-persistence: collision-free storage, sidecar metadata, MCP response storage
 * - pdf-converter: tool detection, text conversion, markdown formatting
 *
 * Tests verify:
 * - Data files contain ONLY raw data (no _metadata injection)
 * - Sidecar .meta.json files track provenance separately
 * - Parallel writes produce byte-identical data files
 * - All persist functions work with configurable dataRoot for isolation
 * - Edge cases: empty data, missing fields, special characters
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import type { RawDocument } from '../scripts/data-transformers/types.js';
import type { DownloadedData } from '../scripts/parliamentary-data/data-downloader.js';

import {
  resolveDocId,
  persistDownloadedData,
  persistEvents,
  persistMPs,
  persistMCPResponse,
  persistWorldBankData,
  persistIMFData,
  persistSCBData,
  getDataRoot,
} from '../scripts/parliamentary-data/data-persistence.js';

import {
  textToMarkdown,
  isPdfToTextAvailable,
  resetPdfToolCache,
} from '../scripts/parliamentary-data/pdf-converter.js';

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
// data-persistence tests
// ---------------------------------------------------------------------------

describe('data-persistence', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'riksdag-persist-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── resolveDocId ─────────────────────────────────────────────────────────

  describe('resolveDocId', () => {
    it('should prefer dok_id when available', () => {
      const doc = makeRawDoc({ dok_id: 'H901FiU1' });
      expect(resolveDocId(doc, 0)).toBe('h901fiu1');
    });

    it('should fall back to titel when dok_id is missing', () => {
      const doc = makeRawDoc({ titel: 'Test Motion' });
      delete (doc as Record<string, unknown>)['dok_id'];
      expect(resolveDocId(doc, 0)).toBe('test-motion');
    });

    it('should fall back through dokument_id, id, rel_dok_id, titel, title', () => {
      const doc = { dokument_id: 'DOK123' } as unknown as RawDocument;
      expect(resolveDocId(doc, 0)).toBe('dok123');

      const doc2 = { id: 'ID456' } as unknown as RawDocument;
      expect(resolveDocId(doc2, 0)).toBe('id456');
    });

    it('should use index-based fallback when all fields empty', () => {
      const doc = {} as RawDocument;
      expect(resolveDocId(doc, 5)).toBe('unknown-6');
    });

    it('should trim whitespace from identifiers', () => {
      const doc = { dok_id: '  H901FiU1  ' } as unknown as RawDocument;
      expect(resolveDocId(doc, 0)).toBe('h901fiu1');
    });

    it('should skip empty string fields', () => {
      const doc = { dok_id: '', titel: 'Fallback' } as unknown as RawDocument;
      expect(resolveDocId(doc, 0)).toBe('fallback');
    });
  });

  // ── persistDownloadedData ────────────────────────────────────────────────

  describe('persistDownloadedData', () => {
    it('should write data files without _metadata injection', () => {
      const data: DownloadedData = {
        ...emptyDownloadedData(),
        propositions: [makeRawDoc({ dok_id: 'H901FiU1', titel: 'Budget' })],
      };
      const result = persistDownloadedData(data, '2025/26', undefined, tmpDir);

      expect(result.written).toBe(1);
      expect(result.skipped).toBe(0);

      const dataFile = path.join(tmpDir, 'documents', 'propositions', 'h901fiu1.json');
      expect(fs.existsSync(dataFile)).toBe(true);

      const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      // Must NOT have _metadata in data file (collision-free design)
      expect(parsed._metadata).toBeUndefined();
      expect(parsed.dok_id).toBe('H901FiU1');
      expect(parsed.titel).toBe('Budget');
    });

    it('should write sidecar .meta.json alongside data file', () => {
      const data: DownloadedData = {
        ...emptyDownloadedData(),
        propositions: [makeRawDoc()],
      };
      persistDownloadedData(data, '2025/26', undefined, tmpDir);

      const metaFile = path.join(tmpDir, 'documents', 'propositions', 'h901fiu1.meta.json');
      expect(fs.existsSync(metaFile)).toBe(true);

      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      expect(meta.mcpTool).toBe('get_propositioner');
      expect(meta.riksmote).toBe('2025/26');
      expect(meta.documentType).toBe('propositions');
      expect(meta.fetchedAt).toBeDefined();
    });

    it('should handle all document types', () => {
      const data: DownloadedData = {
        propositions: [makeRawDoc({ dok_id: 'PROP1' })],
        motions: [makeRawDoc({ dok_id: 'MOT1' })],
        committeeReports: [makeRawDoc({ dok_id: 'BET1' })],
        votes: [makeRawDoc({ dok_id: 'VOT1', datum: '2026-03-28' })],
        speeches: [makeRawDoc({ dok_id: 'SPE1' })],
        questions: [makeRawDoc({ dok_id: 'QUE1' })],
        interpellations: [makeRawDoc({ dok_id: 'INT1' })],
      };
      const result = persistDownloadedData(data, '2025/26', undefined, tmpDir);
      expect(result.written).toBe(7);

      for (const t of ['propositions', 'motions', 'committeeReports', 'votes', 'speeches', 'questions', 'interpellations']) {
        expect(fs.existsSync(path.join(tmpDir, 'documents', t))).toBe(true);
      }
    });

    it('should create date-stamped vote directories', () => {
      const data: DownloadedData = {
        ...emptyDownloadedData(),
        votes: [makeRawDoc({ dok_id: 'VOT1', datum: '2026-03-28' })],
      };
      persistDownloadedData(data, '2025/26', undefined, tmpDir);

      expect(fs.existsSync(path.join(tmpDir, 'documents', 'votes', 'vot1.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'votes', '2026-03-28', 'vot1.json'))).toBe(true);
    });

    it('should skip null documents', () => {
      const data: DownloadedData = {
        ...emptyDownloadedData(),
        propositions: [null as unknown as RawDocument, makeRawDoc({ dok_id: 'VALID' })],
      };
      const result = persistDownloadedData(data, '2025/26', undefined, tmpDir);
      expect(result.written).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('should handle empty data gracefully', () => {
      const result = persistDownloadedData(emptyDownloadedData(), '2025/26', undefined, tmpDir);
      expect(result.written).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should produce byte-identical data files for parallel writes (collision-free)', () => {
      const doc = makeRawDoc({ dok_id: 'COLLISION-TEST' });
      const data: DownloadedData = {
        ...emptyDownloadedData(),
        propositions: [doc],
      };

      // First write
      persistDownloadedData(data, '2025/26', undefined, tmpDir);
      const content1 = fs.readFileSync(
        path.join(tmpDir, 'documents', 'propositions', 'collision-test.json'), 'utf8',
      );

      // Second write (simulating parallel workflow)
      const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'riksdag-persist-test2-'));
      persistDownloadedData(data, '2025/26', undefined, tmpDir2);
      const content2 = fs.readFileSync(
        path.join(tmpDir2, 'documents', 'propositions', 'collision-test.json'), 'utf8',
      );
      fs.rmSync(tmpDir2, { recursive: true, force: true });

      // Data files must be byte-identical — no embedded timestamp
      expect(content1).toBe(content2);
    });

    it('should allow custom mcpToolMap overrides', () => {
      const data: DownloadedData = {
        ...emptyDownloadedData(),
        propositions: [makeRawDoc()],
      };
      persistDownloadedData(data, '2025/26', { propositions: 'custom_tool' }, tmpDir);

      const meta = JSON.parse(fs.readFileSync(
        path.join(tmpDir, 'documents', 'propositions', 'h901fiu1.meta.json'), 'utf8',
      ));
      expect(meta.mcpTool).toBe('custom_tool');
    });

    it('should return correct dataRoot in result', () => {
      const result = persistDownloadedData(emptyDownloadedData(), '2025/26', undefined, tmpDir);
      expect(result.dataRoot).toBe(tmpDir);
    });
  });

  // ── persistEvents ────────────────────────────────────────────────────────

  describe('persistEvents', () => {
    it('should persist events to date-stamped directories', () => {
      const events: RawDocument[] = [
        makeRawDoc({ dok_id: 'EVT1', datum: '2026-03-28' }),
      ];
      const result = persistEvents(events, '2025/26', tmpDir);

      expect(result.written).toBe(1);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28', 'evt1.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28', 'evt1.meta.json'))).toBe(true);
    });

    it('should use "undated" for events without valid date', () => {
      const events: RawDocument[] = [
        { dok_id: 'EVT-NODATE' } as unknown as RawDocument,
      ];
      const result = persistEvents(events, '2025/26', tmpDir);

      expect(result.written).toBe(1);
      expect(fs.existsSync(path.join(tmpDir, 'events', 'undated', 'evt-nodate.json'))).toBe(true);
    });

    it('should skip null events', () => {
      const events = [null as unknown as RawDocument];
      const result = persistEvents(events, '2025/26', tmpDir);
      expect(result.written).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should write metadata with correct tool name', () => {
      const events: RawDocument[] = [
        makeRawDoc({ dok_id: 'EVT2', datum: '2026-03-28' }),
      ];
      persistEvents(events, '2025/26', tmpDir);

      const meta = JSON.parse(fs.readFileSync(
        path.join(tmpDir, 'events', '2026-03-28', 'evt2.meta.json'), 'utf8',
      ));
      expect(meta.mcpTool).toBe('get_calendar_events');
      expect(meta.documentType).toBe('events');
    });

    it('should handle "from" field as date fallback', () => {
      const events: RawDocument[] = [
        { dok_id: 'EVT-FROM', from: '2026-04-01T10:00:00' } as unknown as RawDocument,
      ];
      persistEvents(events, '2025/26', tmpDir);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-04-01', 'evt-from.json'))).toBe(true);
    });
  });

  // ── persistMPs ───────────────────────────────────────────────────────────

  describe('persistMPs', () => {
    it('should persist MP profiles using intressent_id', () => {
      const mps: RawDocument[] = [
        { intressent_id: '0123456789', tilltalsnamn: 'Test' } as unknown as RawDocument,
      ];
      const result = persistMPs(mps, '2025/26', tmpDir);

      expect(result.written).toBe(1);
      expect(fs.existsSync(path.join(tmpDir, 'mps', '0123456789.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'mps', '0123456789.meta.json'))).toBe(true);
    });

    it('should skip null MP entries', () => {
      const mps = [null as unknown as RawDocument];
      const result = persistMPs(mps, '2025/26', tmpDir);
      expect(result.written).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should fall back to resolveDocId when intressent_id missing', () => {
      const mps: RawDocument[] = [
        { titel: 'Some MP' } as unknown as RawDocument,
      ];
      const result = persistMPs(mps, '2025/26', tmpDir);
      expect(result.written).toBe(1);
      expect(fs.existsSync(path.join(tmpDir, 'mps', 'some-mp.json'))).toBe(true);
    });

    it('should write metadata with correct tool name', () => {
      const mps: RawDocument[] = [
        { intressent_id: 'MP001' } as unknown as RawDocument,
      ];
      persistMPs(mps, '2025/26', tmpDir);

      const meta = JSON.parse(fs.readFileSync(
        path.join(tmpDir, 'mps', 'mp001.meta.json'), 'utf8',
      ));
      expect(meta.mcpTool).toBe('search_ledamoter');
      expect(meta.documentType).toBe('mps');
    });
  });

  // ── MCP response storage ────────────────────────────────────────────────

  describe('persistMCPResponse', () => {
    it('should store generic MCP tool response in server/tool subdirs', () => {
      const resultPath = persistMCPResponse(
        { tool: 'get_sync_status', params: { key: 'val' }, server: 'riksdag-regering' },
        { status: 'ok', last_sync: '2026-03-28' },
        'sync-check',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      expect(data.status).toBe('ok');

      // Verify sidecar
      const metaPath = resultPath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.mcpTool).toBe('get_sync_status');
      expect(meta.params.key).toBe('val');
    });

    it('should use UUID-based fallback for empty id', () => {
      const resultPath = persistMCPResponse(
        { tool: 'test_tool', params: {}, server: 'test' },
        { data: true },
        '', // empty id
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(path.basename(resultPath)).toMatch(/^response-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/);
    });

    it('should derive riksmote from call.params.rm when not explicitly provided', () => {
      const resultPath = persistMCPResponse(
        { tool: 'get_propositioner', params: { rm: '2025/26' }, server: 'riksdag-regering' },
        { dokument_lista: [] },
        'rm-test',
        tmpDir,
      );
      const metaPath = resultPath.replace('.json', '.meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.riksmote).toBe('2025/26');
    });

    it('should use explicit riksmote param over call.params.rm', () => {
      const resultPath = persistMCPResponse(
        { tool: 'get_propositioner', params: { rm: '2024/25' }, server: 'riksdag-regering' },
        { dokument_lista: [] },
        'rm-override-test',
        tmpDir,
        '2025/26',
      );
      const metaPath = resultPath.replace('.json', '.meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.riksmote).toBe('2025/26');
    });
  });

  describe('persistWorldBankData', () => {
    it('should store data with indicator/country structure', () => {
      const resultPath = persistWorldBankData(
        'NY.GDP.MKTP.CD',
        'SWE',
        [{ date: '2025', value: 600000000000 }],
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);

      const data = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      expect(data[0].date).toBe('2025');

      expect(resultPath).toContain(path.join('worldbank', 'ny-gdp-mktp-cd', 'swe.json'));

      const metaPath = resultPath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.indicator).toBe('NY.GDP.MKTP.CD');
      expect(meta.country).toBe('SWE');
    });
  });

  describe('persistIMFData', () => {
    it('stores IMF data under imf/{indicator}/{country}.json with sidecar', () => {
      const resultPath = persistIMFData(
        'NGDP_RPCH',
        'SWE',
        [{ period: '2026', value: 2.1, projection: true }],
        {
          database: 'WEO',
          projectionVintage: 'WEO-2026-04',
          dataRoot: tmpDir,
        },
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath).toContain(path.join('imf', 'ngdp-rpch', 'swe.json'));

      const metaPath = resultPath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.mcpTool).toBe('imf-ts-client');
      expect(meta.indicator).toBe('NGDP_RPCH');
      expect(meta.country).toBe('SWE');
      expect(meta.database).toBe('WEO');
      expect(meta.projectionVintage).toBe('WEO-2026-04');
    });

    it('omits optional provenance fields when not supplied', () => {
      const resultPath = persistIMFData(
        'PCPIPCH',
        'DEU',
        { data: [] },
        { dataRoot: tmpDir },
      );
      const metaPath = resultPath.replace('.json', '.meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.database).toBeUndefined();
      expect(meta.projectionVintage).toBeUndefined();
    });
  });

  describe('persistSCBData', () => {
    it('should store SCB table data with sidecar', () => {
      const resultPath = persistSCBData(
        'BE0101A',
        { columns: ['Region', 'Population'], data: [[1, 10000]] },
        { region: '01' },
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath).toContain(path.join('scb', 'be0101a.json'));

      const metaPath = resultPath.replace('.json', '.meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.tableId).toBe('BE0101A');
      expect(meta.query.region).toBe('01');
    });

    it('should work without query parameter', () => {
      const resultPath = persistSCBData(
        'TEST_TABLE',
        { data: [] },
        undefined,
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);

      const metaPath = resultPath.replace('.json', '.meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.query).toBeUndefined();
    });
  });

  // ── Collision avoidance ───────────────────────────────────────────────────

  describe('collision avoidance', () => {
    it('should suffix duplicate doc IDs within a batch', () => {
      // Create docs with NO dok_id so resolveDocId falls back to titel
      const docWithTitleOnly = (title: string): RawDocument => ({
        titel: title,
        doktyp: 'prop',
        organ: 'FiU',
        datum: '2026-03-28',
      }) as unknown as RawDocument;

      const data: DownloadedData = {
        ...emptyDownloadedData(),
        propositions: [
          docWithTitleOnly('Same Title'),
          docWithTitleOnly('Same Title'),
          docWithTitleOnly('Same Title'),
        ],
      };
      const result = persistDownloadedData(data, '2025/26', undefined, tmpDir);
      expect(result.written).toBe(3);

      const propDir = path.join(tmpDir, 'documents', 'propositions');
      const files = fs.readdirSync(propDir).filter(f => f.endsWith('.json') && !f.endsWith('.meta.json'));
      expect(files.length).toBe(3);
      // Should have base, -1, and -2 suffixed variants
      expect(files.some(f => f === 'same-title.json')).toBe(true);
      expect(files.some(f => f === 'same-title-1.json')).toBe(true);
      expect(files.some(f => f === 'same-title-2.json')).toBe(true);
    });
  });

  // ── Path traversal prevention ─────────────────────────────────────────────

  describe('path traversal prevention', () => {
    it('should sanitize server and tool names with path traversal characters', () => {
      const resultPath = persistMCPResponse(
        { tool: '../../../etc', params: {}, server: '../secret' },
        { safe: true },
        'test-doc',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      // Path should NOT escape tmpDir
      expect(resultPath.startsWith(tmpDir)).toBe(true);
      // Should not contain raw ../
      expect(resultPath).not.toContain('../');
    });

    it('should handle dots-only server names', () => {
      const resultPath = persistMCPResponse(
        { tool: 'test', params: {}, server: '..' },
        { safe: true },
        'test-doc',
        tmpDir,
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      expect(resultPath.startsWith(tmpDir)).toBe(true);
    });
  });

  // ── getDataRoot ──────────────────────────────────────────────────────────

  describe('getDataRoot', () => {
    it('should return path ending with analysis/data', () => {
      const root = getDataRoot();
      expect(root).toMatch(/analysis[/\\]data$/);
    });
  });
});

// ---------------------------------------------------------------------------
// pdf-converter tests
// ---------------------------------------------------------------------------

describe('pdf-converter', () => {
  describe('isPdfToTextAvailable', () => {
    beforeEach(() => {
      resetPdfToolCache();
    });

    it('should return a boolean', () => {
      const result = isPdfToTextAvailable();
      expect(typeof result).toBe('boolean');
    });

    it('should cache the result', () => {
      const first = isPdfToTextAvailable();
      const second = isPdfToTextAvailable();
      expect(first).toBe(second);
    });
  });

  describe('textToMarkdown', () => {
    it('should return empty string for empty input', () => {
      expect(textToMarkdown('')).toBe('');
    });

    it('should convert ALL CAPS lines to headings', () => {
      const input = 'INTRODUCTION\nThis is a paragraph.';
      const result = textToMarkdown(input);
      expect(result).toContain('## INTRODUCTION');
      expect(result).toContain('This is a paragraph.');
    });

    it('should preserve paragraph breaks', () => {
      const input = 'First paragraph.\n\nSecond paragraph.';
      const result = textToMarkdown(input);
      expect(result).toContain('First paragraph.');
      expect(result).toContain('Second paragraph.');
      const lines = result.split('\n');
      const emptyLineIndex = lines.findIndex(l => l === '');
      expect(emptyLineIndex).toBeGreaterThan(0);
    });

    it('should not convert short ALL CAPS as headings', () => {
      const input = 'AB\nSome text';
      const result = textToMarkdown(input);
      expect(result).not.toContain('## AB');
    });

    it('should handle Swedish characters in headings', () => {
      const input = 'FÖRSLAG TILL RIKSDAGSBESLUT\nContent here.';
      const result = textToMarkdown(input);
      expect(result).toContain('## FÖRSLAG TILL RIKSDAGSBESLUT');
    });

    it('should normalise excessive whitespace', () => {
      const input = 'Line 1\n\n\n\n\nLine 2';
      const result = textToMarkdown(input);
      expect(result).not.toMatch(/\n\n\n/);
    });

    it('should handle mixed content', () => {
      const input = [
        'SAMMANFATTNING',
        '',
        'Regeringen föreslår att riksdagen godkänner...',
        '',
        'FÖRSLAG TILL RIKSDAGSBESLUT',
        '',
        '1. Riksdagen godkänner att...',
      ].join('\n');

      const result = textToMarkdown(input);
      expect(result).toContain('## SAMMANFATTNING');
      expect(result).toContain('## FÖRSLAG TILL RIKSDAGSBESLUT');
      expect(result).toContain('1. Riksdagen godkänner att...');
    });
  });
});
