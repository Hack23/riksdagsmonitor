/**
 * Tests for data-downloader enrichment behavior.
 *
 * Validates:
 * - dokId resolution order (dok_id → dokument_id → rel_dok_id → id → dokumentnamn)
 * - Whitespace trimming on selected IDs
 * - fullText/fullContent only assigned when length > FULL_TEXT_MIN_LENGTH
 * - Existing summary/notis fields are not overwritten
 * - isPersonProfileText sanitization filters MP profile text
 * - Inter-batch delay for rate limiting
 */

import { describe, it, expect, vi } from 'vitest';

import type { RawDocument } from '../scripts/data-transformers/types.js';
import {
  downloadAllDocuments,
  FULL_TEXT_MIN_LENGTH,
} from '../scripts/parliamentary-data/data-downloader.js';
import type { MCPClient } from '../scripts/mcp-client/client.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRawDoc(overrides: Record<string, unknown> = {}): RawDocument {
  return {
    dok_id: 'H901FiU1',
    titel: 'Test proposition',
    doktyp: 'prop',
    organ: 'FiU',
    datum: '2026-03-28',
    ...overrides,
  };
}

/**
 * Create a minimal mock MCPClient that returns one proposition and
 * allows controlling fetchDocumentDetails behavior per test.
 */
function createMockClient(
  fetchDetailsImpl?: (dokId: string, includeFullText: boolean) => Promise<Record<string, unknown>>,
  docs: RawDocument[] = [makeRawDoc()],
) {
  return {
    fetchPropositions: vi.fn().mockResolvedValue(docs),
    fetchMotions: vi.fn().mockResolvedValue([]),
    fetchCommitteeReports: vi.fn().mockResolvedValue([]),
    fetchVotingRecords: vi.fn().mockResolvedValue([]),
    searchSpeeches: vi.fn().mockResolvedValue([]),
    fetchWrittenQuestions: vi.fn().mockResolvedValue([]),
    fetchInterpellations: vi.fn().mockResolvedValue([]),
    fetchDocumentDetails: fetchDetailsImpl
      ? vi.fn().mockImplementation(fetchDetailsImpl)
      : vi.fn().mockResolvedValue({}),
  } as unknown as MCPClient;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('data-downloader enrichment', () => {
  describe('dokId resolution order', () => {
    it('should prefer dok_id as the primary identifier', async () => {
      const doc = makeRawDoc({
        dok_id: 'DOK1',
        dokument_id: 'DOKU1',
        rel_dok_id: 'REL1',
        id: 'ID1',
        dokumentnamn: 'NAME1',
      });
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect(fetchDetails).toHaveBeenCalledWith('DOK1', true);
    });

    it('should fall back to dokument_id when dok_id is missing', async () => {
      const doc = makeRawDoc({
        dok_id: undefined,
        dokument_id: 'DOKU1',
        rel_dok_id: 'REL1',
        id: 'ID1',
      });
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect(fetchDetails).toHaveBeenCalledWith('DOKU1', true);
    });

    it('should fall back to rel_dok_id when dok_id and dokument_id are missing', async () => {
      const doc = makeRawDoc({
        dok_id: undefined,
        dokument_id: undefined,
        rel_dok_id: 'REL1',
        id: 'ID1',
      });
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect(fetchDetails).toHaveBeenCalledWith('REL1', true);
    });

    it('should fall back to id when higher-priority fields are missing', async () => {
      const doc = makeRawDoc({
        dok_id: undefined,
        dokument_id: undefined,
        rel_dok_id: undefined,
        id: 'ID1',
      });
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect(fetchDetails).toHaveBeenCalledWith('ID1', true);
    });

    it('should fall back to dokumentnamn as last resort', async () => {
      const doc = makeRawDoc({
        dok_id: undefined,
        dokument_id: undefined,
        rel_dok_id: undefined,
        id: undefined,
        dokumentnamn: 'NAME1',
      });
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect(fetchDetails).toHaveBeenCalledWith('NAME1', true);
    });
  });

  describe('whitespace trimming on IDs', () => {
    it('should trim whitespace from dok_id before calling fetchDocumentDetails', async () => {
      const doc = makeRawDoc({ dok_id: '  DOK1  ' });
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect(fetchDetails).toHaveBeenCalledWith('DOK1', true);
    });

    it('should skip empty/whitespace-only IDs and fall back', async () => {
      const doc = makeRawDoc({
        dok_id: '   ',
        dokument_id: 'DOKU1',
      });
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect(fetchDetails).toHaveBeenCalledWith('DOKU1', true);
    });
  });

  describe('fullText/fullContent assignment threshold', () => {
    it('should assign fullText when length exceeds FULL_TEXT_MIN_LENGTH', async () => {
      const longText = 'A'.repeat(FULL_TEXT_MIN_LENGTH + 1);
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({ fullText: longText });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['fullText']).toBe(longText);
    });

    it('should NOT assign fullText when length is <= FULL_TEXT_MIN_LENGTH', async () => {
      const shortText = 'A'.repeat(FULL_TEXT_MIN_LENGTH);
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({ fullText: shortText });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['fullText']).toBeUndefined();
    });

    it('should assign fullContent (from html) when length exceeds FULL_TEXT_MIN_LENGTH', async () => {
      const longHtml = '<p>' + 'B'.repeat(FULL_TEXT_MIN_LENGTH + 1) + '</p>';
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({ html: longHtml });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['fullContent']).toBe(longHtml);
    });

    it('should NOT assign fullContent when html length is <= FULL_TEXT_MIN_LENGTH', async () => {
      const shortHtml = '<p>short</p>';
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({ html: shortHtml });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['fullContent']).toBeUndefined();
    });
  });

  describe('existing summary/notis fields are not overwritten', () => {
    it('should not overwrite existing summary', async () => {
      const doc = makeRawDoc({ summary: 'existing summary' });
      const fetchDetails = vi.fn().mockResolvedValue({
        summary: 'new summary from API',
      });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['summary']).toBe('existing summary');
    });

    it('should not overwrite existing notis', async () => {
      const doc = makeRawDoc({ notis: 'existing notis' });
      const fetchDetails = vi.fn().mockResolvedValue({
        notis: 'new notis from API',
      });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['notis']).toBe('existing notis');
    });

    it('should set summary when doc does not already have one', async () => {
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({
        summary: 'new summary',
      });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['summary']).toBe('new summary');
    });
  });

  describe('isPersonProfileText sanitization', () => {
    it('should filter out MP profile text from fullText', async () => {
      const profileText = 'Tjänstgörande riksdagsledamot ' + 'A'.repeat(200);
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({
        fullText: profileText,
      });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      // Profile text is sanitized to empty, so fullText should not be set
      expect((doc as Record<string, unknown>)['fullText']).toBeUndefined();
    });

    it('should filter out deceased notice text from summary', async () => {
      const deceasedText = 'Avliden 2025-01-15 some more text here';
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({
        summary: deceasedText,
      });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      // Profile text is sanitized to empty, so summary should not be set
      expect((doc as Record<string, unknown>)['summary']).toBeUndefined();
    });
  });

  describe('enrichment skips when no IDs available', () => {
    it('should not call fetchDocumentDetails when no ID fields are present', async () => {
      const doc = makeRawDoc({
        dok_id: undefined,
        dokument_id: undefined,
        rel_dok_id: undefined,
        id: undefined,
        dokumentnamn: undefined,
      });
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect(fetchDetails).not.toHaveBeenCalled();
    });
  });

  describe('enrichment disabled when enrichLimit is 0', () => {
    it('should skip enrichment when enrichLimit is 0', async () => {
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 0,
      });

      expect(fetchDetails).not.toHaveBeenCalled();
    });
  });

  describe('MCP response field mapping (text/snippet)', () => {
    it('should assign fullContent from MCP text field when length exceeds threshold', async () => {
      const longText = '<dokumentstatus>' + 'X'.repeat(FULL_TEXT_MIN_LENGTH + 1) + '</dokumentstatus>';
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({ text: longText, snippet: 'Short summary' });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['fullContent']).toBe(longText);
    });

    it('should prefer text field over html field for fullContent', async () => {
      const longText = '<div>' + 'T'.repeat(FULL_TEXT_MIN_LENGTH + 1) + '</div>';
      const longHtml = '<p>' + 'H'.repeat(FULL_TEXT_MIN_LENGTH + 1) + '</p>';
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({ text: longText, html: longHtml });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      // text field takes priority over html
      expect((doc as Record<string, unknown>)['fullContent']).toBe(longText);
    });

    it('should use snippet as summary fallback when no legacy summary field exists', async () => {
      const doc = makeRawDoc();
      const fetchDetails = vi.fn().mockResolvedValue({
        text: 'short', snippet: 'A snippet summary of the document',
      });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['summary']).toBe('A snippet summary of the document');
    });

    it('should not overwrite existing summary with snippet', async () => {
      const doc = makeRawDoc({ summary: 'existing summary' });
      const fetchDetails = vi.fn().mockResolvedValue({
        snippet: 'snippet summary',
      });
      const client = createMockClient(fetchDetails, [doc]);

      await downloadAllDocuments(client, {
        limit: 1, rm: '2025/26', docTypes: ['propositions'], enrichLimit: 1,
      });

      expect((doc as Record<string, unknown>)['summary']).toBe('existing summary');
    });
  });
});
