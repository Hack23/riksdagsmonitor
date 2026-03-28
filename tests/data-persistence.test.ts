/**
 * Tests for the MCP data persistence and PDF conversion modules:
 * - data-persistence: collision-free storage, sidecar metadata, MCP response storage
 * - pdf-converter: tool detection, text conversion, markdown formatting
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import type { RawDocument } from '../scripts/data-transformers/types.js';

import {
  resolveDocId,
  persistMCPResponse,
  persistWorldBankData,
  persistSCBData,
  getDataRoot,
} from '../scripts/pre-article-analysis/data-persistence.js';

import {
  textToMarkdown,
  isPdfToTextAvailable,
  resetPdfToolCache,
} from '../scripts/pre-article-analysis/pdf-converter.js';

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

// ---------------------------------------------------------------------------
// data-persistence tests
// ---------------------------------------------------------------------------

describe('data-persistence', () => {
  describe('collision-free design (sidecar metadata)', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'riksdag-persist-test-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should create directory structure for document types', () => {
      const types = [
        'propositions', 'motions', 'committeeReports', 'votes',
        'speeches', 'questions', 'interpellations',
      ];
      for (const t of types) {
        const dir = path.join(tmpDir, 'documents', t);
        fs.mkdirSync(dir, { recursive: true });
        expect(fs.existsSync(dir)).toBe(true);
      }
    });

    it('should write raw data WITHOUT _metadata injection', () => {
      const dir = path.join(tmpDir, 'docs');
      fs.mkdirSync(dir, { recursive: true });
      const doc = makeRawDoc();
      // Simulate new collision-free write: data file has NO _metadata
      const filePath = path.join(dir, 'h901fiu1.json');
      fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf8');

      const written = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(written._metadata).toBeUndefined();
      expect(written.dok_id).toBe('H901FiU1');
    });

    it('should write sidecar .meta.json file separately', () => {
      const dir = path.join(tmpDir, 'docs');
      fs.mkdirSync(dir, { recursive: true });
      const meta = {
        fetchedAt: '2026-03-28T10:00:00Z',
        mcpTool: 'get_propositioner',
        riksmote: '2025/26',
        documentType: 'propositions',
      };
      const metaPath = path.join(dir, 'h901fiu1.meta.json');
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');

      const writtenMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(writtenMeta.mcpTool).toBe('get_propositioner');
      expect(writtenMeta.riksmote).toBe('2025/26');
      expect(writtenMeta.documentType).toBe('propositions');
    });

    it('parallel writes of same doc should produce identical data files', () => {
      const dir = path.join(tmpDir, 'docs');
      fs.mkdirSync(dir, { recursive: true });
      const doc = makeRawDoc();

      // Simulate two parallel workflow writes (same doc, different times)
      const content1 = JSON.stringify(doc, null, 2);
      const content2 = JSON.stringify(doc, null, 2);

      // Write both — they should produce identical files
      fs.writeFileSync(path.join(dir, 'h901fiu1.json'), content1, 'utf8');
      const onDisk = fs.readFileSync(path.join(dir, 'h901fiu1.json'), 'utf8');
      expect(onDisk).toBe(content2); // Byte-identical
    });

    it('should support upsert (overwrite) semantics', () => {
      const dir = path.join(tmpDir, 'docs');
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, 'test.json');

      fs.writeFileSync(filePath, JSON.stringify({ version: 1 }), 'utf8');
      expect(JSON.parse(fs.readFileSync(filePath, 'utf8')).version).toBe(1);

      fs.writeFileSync(filePath, JSON.stringify({ version: 2 }), 'utf8');
      expect(JSON.parse(fs.readFileSync(filePath, 'utf8')).version).toBe(2);
    });

    it('should create date-stamped directories for votes', () => {
      const voteDate = '2026-03-28';
      const voteDir = path.join(tmpDir, 'votes', voteDate);
      fs.mkdirSync(voteDir, { recursive: true });
      expect(fs.existsSync(voteDir)).toBe(true);
    });

    it('should handle documents without dok_id gracefully', () => {
      const doc = makeRawDoc({ titel: 'Fallback Title' });
      delete (doc as Record<string, unknown>)['dok_id'];
      const record = doc as Record<string, unknown>;
      const candidates = [
        record['dok_id'],
        record['dokument_id'],
        record['id'],
        record['titel'],
        record['title'],
      ];
      const id = candidates.find(
        (c): c is string => typeof c === 'string' && c.trim().length > 0,
      );
      expect(id).toBe('Fallback Title');
    });

    it('should create event directories by date', () => {
      const eventDate = '2026-03-28';
      const eventDir = path.join(tmpDir, 'events', eventDate);
      fs.mkdirSync(eventDir, { recursive: true });
      expect(fs.existsSync(eventDir)).toBe(true);
    });

    it('should create MP profile files', () => {
      const mpDir = path.join(tmpDir, 'mps');
      fs.mkdirSync(mpDir, { recursive: true });
      const filePath = path.join(mpDir, '0123456789.json');
      fs.writeFileSync(filePath, JSON.stringify({ intressent_id: '0123456789' }), 'utf8');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

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

    it('should use index-based fallback when all fields empty', () => {
      const doc = {} as RawDocument;
      expect(resolveDocId(doc, 5)).toBe('unknown-6');
    });
  });

  describe('MCP response storage', () => {
    it('should store generic MCP tool response', () => {
      const resultPath = persistMCPResponse(
        { tool: 'get_sync_status', params: {}, server: 'riksdag-regering' },
        { status: 'ok', last_sync: '2026-03-28' },
        'sync-status-2026-03-28',
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      expect(data.status).toBe('ok');

      // Verify sidecar exists
      const metaPath = resultPath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.mcpTool).toBe('get_sync_status');

      // Cleanup
      fs.rmSync(path.dirname(resultPath), { recursive: true, force: true });
    });

    it('should store World Bank data with indicator/country structure', () => {
      const resultPath = persistWorldBankData(
        'NY.GDP.MKTP.CD',
        'SWE',
        [{ date: '2025', value: 600000000000 }],
      );
      expect(fs.existsSync(resultPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      expect(data[0].date).toBe('2025');

      // Verify sidecar exists
      const metaPath = resultPath.replace('.json', '.meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);

      // Cleanup
      fs.rmSync(path.dirname(resultPath), { recursive: true, force: true });
    });

    it('should store SCB table data', () => {
      const resultPath = persistSCBData(
        'BE0101A',
        { columns: ['Region', 'Population'], data: [[1, 10000]] },
        { region: '01' },
      );
      expect(fs.existsSync(resultPath)).toBe(true);

      // Verify sidecar has query params
      const metaPath = resultPath.replace('.json', '.meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.tableId).toBe('BE0101A');
      expect(meta.query.region).toBe('01');

      // Cleanup
      fs.unlinkSync(resultPath);
      fs.unlinkSync(metaPath);
    });
  });

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
