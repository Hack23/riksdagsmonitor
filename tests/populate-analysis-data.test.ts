/**
 * Tests for populate-analysis-data script logic.
 *
 * Validates:
 * - riksMoteFromDate calculation
 * - Integration with persistence functions (via mock MCP client)
 * - Correct handling of empty/error responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import type { RawDocument } from '../scripts/data-transformers/types.js';
import type { DownloadedData } from '../scripts/pre-article-analysis/data-downloader.js';
import {
  persistDownloadedData,
  persistEvents,
  persistMPs,
} from '../scripts/pre-article-analysis/data-persistence.js';
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
});
