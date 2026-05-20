/**
 * @file documents.test.ts
 * @module tests/parliamentary-data/persistence/documents
 * @description persistDownloadedData / persistEvents / persistMPs / resolveDocId
 * + collision-avoidance + getDataRoot. Split from the original 710-line
 * `tests/data-persistence.test.ts` (issue #2620).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import type { RawDocument } from '../../../scripts/data-transformers/types.js';
import type { DownloadedData } from '../../../scripts/parliamentary-data/data-downloader.js';

import {
  persistDownloadedData,
  persistEvents,
  persistMPs,
  getDataRoot,
} from '../../../scripts/parliamentary-data/data-persistence.js';

import { makeRawDoc, emptyDownloadedData, mkTmpDir, cleanupTmpDir } from './_fixtures.js';

describe('data-persistence — documents', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkTmpDir();
  });
  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

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

  describe('persistEvents', () => {
    it('should persist events to date-stamped directories', () => {
      const events: RawDocument[] = [makeRawDoc({ dok_id: 'EVT1', datum: '2026-03-28' })];
      const result = persistEvents(events, '2025/26', tmpDir);

      expect(result.written).toBe(1);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28', 'evt1.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'events', '2026-03-28', 'evt1.meta.json'))).toBe(true);
    });

    it('should use "undated" for events without valid date', () => {
      const events: RawDocument[] = [{ dok_id: 'EVT-NODATE' } as unknown as RawDocument];
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
      const events: RawDocument[] = [makeRawDoc({ dok_id: 'EVT2', datum: '2026-03-28' })];
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
      const mps: RawDocument[] = [{ titel: 'Some MP' } as unknown as RawDocument];
      const result = persistMPs(mps, '2025/26', tmpDir);
      expect(result.written).toBe(1);
      expect(fs.existsSync(path.join(tmpDir, 'mps', 'some-mp.json'))).toBe(true);
    });

    it('should write metadata with correct tool name', () => {
      const mps: RawDocument[] = [{ intressent_id: 'MP001' } as unknown as RawDocument];
      persistMPs(mps, '2025/26', tmpDir);

      const meta = JSON.parse(fs.readFileSync(
        path.join(tmpDir, 'mps', 'mp001.meta.json'), 'utf8',
      ));
      expect(meta.mcpTool).toBe('search_ledamoter');
      expect(meta.documentType).toBe('mps');
    });
  });

  describe('getDataRoot', () => {
    it('should return path ending with analysis/data', () => {
      const root = getDataRoot();
      expect(root).toMatch(/analysis[/\\]data$/);
    });
  });
});
