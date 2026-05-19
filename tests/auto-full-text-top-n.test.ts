/**
 * @module tests/auto-full-text-top-n
 * @description Tests for the --auto-full-text-top-n feature.
 *
 * Validates:
 * - parseArgs correctly parses --auto-full-text-top-n flag
 * - fetchFullTextForTopN fetches and persists full text for top-N documents
 * - Graceful degradation when full text is unavailable (metadata-only)
 * - Graceful degradation when fetchDocumentDetails rejects
 * - Manifest serializeDataManifest records full-text outcomes table
 * - Documents without resolvable dok_id are skipped
 * - topN=0 returns empty array immediately
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { parseArgs, resolveAutoFullTextTopN, serializeDataManifest } from '../scripts/download-parliamentary-data.js';
import {
  fetchFullTextForTopN,
  FULL_TEXT_MIN_LENGTH,
  isDocumentNotIndexedError,
} from '../scripts/parliamentary-data/data-downloader.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';
import type { MCPClient } from '../scripts/mcp-client/client.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDoc(overrides: Record<string, unknown> = {}): RawDocument {
  return {
    dok_id: 'HD01FiU48',
    titel: 'Test committee report',
    doktyp: 'bet',
    organ: 'FiU',
    datum: '2026-04-26',
    ...overrides,
  };
}

function createMockClient(
  fetchDetailsImpl?: (dokId: string, includeFullText: boolean) => Promise<Record<string, unknown>>,
): MCPClient {
  const fetchDocumentDetails = fetchDetailsImpl
    ? vi.fn().mockImplementation(fetchDetailsImpl)
    : vi.fn().mockResolvedValue({});
  return {
    baseURL: 'https://riksdag-regering-ai.onrender.com/mcp',
    fetchPropositions: vi.fn().mockResolvedValue([]),
    fetchMotions: vi.fn().mockResolvedValue([]),
    fetchCommitteeReports: vi.fn().mockResolvedValue([]),
    fetchVotingRecords: vi.fn().mockResolvedValue([]),
    searchSpeeches: vi.fn().mockResolvedValue([]),
    fetchWrittenQuestions: vi.fn().mockResolvedValue([]),
    fetchInterpellations: vi.fn().mockResolvedValue([]),
    fetchDocumentDetails,
    fetchDocumentDetailsWithCoverage: vi.fn().mockImplementation(async (dokId: string, includeFullText: boolean) => {
      const document = await fetchDocumentDetails(dokId, includeFullText);
      return {
        document,
        query: { dok_id: dokId, include_full_text: includeFullText },
        resultCount: Object.keys(document).length > 0 ? 1 : 0,
        coverageState: 'metadata_only',
        provenance: {
          provider: 'riksdag-regering',
          endpoint: 'https://riksdag-regering-ai.onrender.com/mcp',
          tool: 'get_dokument_innehall',
          query: { dok_id: dokId, include_full_text: includeFullText },
          resultCount: Object.keys(document).length > 0 ? 1 : 0,
          coverageState: 'metadata_only',
          retrieval: 'live',
          retrievedAt: '2026-05-15T00:00:00.000Z',
        },
      };
    }),
  } as unknown as MCPClient;
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-auto-ft-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// parseArgs — --auto-full-text-top-n flag
// ---------------------------------------------------------------------------

describe('parseArgs --auto-full-text-top-n', () => {
  it('defaults to null when flag is absent', () => {
    const result = parseArgs(['node', 'script.ts']);
    expect(result.autoFullTextTopN).toBeNull();
  });

  it('parses integer value correctly', () => {
    const result = parseArgs(['node', 'script.ts', '--auto-full-text-top-n', '2']);
    expect(result.autoFullTextTopN).toBe(2);
  });

  it('accepts value 0 (explicit disable)', () => {
    const result = parseArgs(['node', 'script.ts', '--auto-full-text-top-n', '0']);
    expect(result.autoFullTextTopN).toBe(0);
  });

  it('accepts larger values', () => {
    const result = parseArgs(['node', 'script.ts', '--auto-full-text-top-n', '5']);
    expect(result.autoFullTextTopN).toBe(5);
  });

  it('throws on negative value', () => {
    expect(() =>
      parseArgs(['node', 'script.ts', '--auto-full-text-top-n', '-1']),
    ).toThrow(/auto-full-text-top-n/);
  });

  it('throws on non-integer value', () => {
    expect(() =>
      parseArgs(['node', 'script.ts', '--auto-full-text-top-n', 'abc']),
    ).toThrow(/auto-full-text-top-n/);
  });

  it('throws on fractional value', () => {
    expect(() =>
      parseArgs(['node', 'script.ts', '--auto-full-text-top-n', '2.5']),
    ).toThrow(/auto-full-text-top-n/);
  });

  it('combines correctly with other flags', () => {
    const result = parseArgs([
      'node', 'script.ts',
      '--date', '2026-04-26',
      '--limit', '10',
      '--auto-full-text-top-n', '2',
    ]);
    expect(result.date).toBe('2026-04-26');
    expect(result.limit).toBe(10);
    expect(result.autoFullTextTopN).toBe(2);
  });

  it('parses --full-text-for-all as a boolean flag', () => {
    const result = parseArgs(['node', 'script.ts', '--full-text-for-all']);
    expect(result.fullTextForAll).toBe(true);
  });
});

describe('resolveAutoFullTextTopN', () => {
  it('raises long-horizon top-N requests to the floor of 10', () => {
    expect(resolveAutoFullTextTopN(30, 5, false)).toBe(10);
  });

  it('uses all selected documents when --full-text-for-all is enabled', () => {
    expect(resolveAutoFullTextTopN(30, 5, true, 15)).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// fetchFullTextForTopN — core behaviour
// ---------------------------------------------------------------------------

describe('fetchFullTextForTopN', () => {
  it('returns empty array when topN is 0', async () => {
    const client = createMockClient();
    const outcomes = await fetchFullTextForTopN(client, [makeDoc()], 0, tmpDir);
    expect(outcomes).toHaveLength(0);
    expect(client.fetchDocumentDetails).not.toHaveBeenCalled();
  });

  it('returns empty array when docs list is empty', async () => {
    const client = createMockClient();
    const outcomes = await fetchFullTextForTopN(client, [], 2, tmpDir);
    expect(outcomes).toHaveLength(0);
  });

  it('fetches full text for top-N documents and persists to full-text/ dir', async () => {
    const longContent = '<p>' + 'X'.repeat(FULL_TEXT_MIN_LENGTH + 50) + '</p>';
    const docs = [
      makeDoc({ dok_id: 'HD01FiU48' }),
      makeDoc({ dok_id: 'HD01CU25' }),
    ];
    const client = createMockClient(async (_dokId, _) => ({ text: longContent, snippet: 'Test snippet' }));

    const outcomes = await fetchFullTextForTopN(client, docs, 2, tmpDir);

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]!.dokId).toBe('HD01FiU48');
    expect(outcomes[0]!.success).toBe(true);
    expect(outcomes[0]!.chars).toBeGreaterThan(FULL_TEXT_MIN_LENGTH);

    expect(outcomes[1]!.dokId).toBe('HD01CU25');
    expect(outcomes[1]!.success).toBe(true);

    // Verify files were written to full-text/ subdirectory
    const fullTextDir = path.join(tmpDir, 'full-text');
    expect(fs.existsSync(path.join(fullTextDir, 'HD01FiU48.md'))).toBe(true);
    expect(fs.existsSync(path.join(fullTextDir, 'HD01CU25.md'))).toBe(true);
  });

  it('only fetches top-N documents even when more docs provided', async () => {
    const longContent = 'A'.repeat(FULL_TEXT_MIN_LENGTH + 10);
    const docs = [
      makeDoc({ dok_id: 'DOC1' }),
      makeDoc({ dok_id: 'DOC2' }),
      makeDoc({ dok_id: 'DOC3' }),
    ];
    const fetchDetails = vi.fn().mockResolvedValue({ text: longContent });
    const client = createMockClient(fetchDetails);

    await fetchFullTextForTopN(client, docs, 2, tmpDir);

    expect(fetchDetails).toHaveBeenCalledTimes(2);
    expect(fetchDetails).toHaveBeenCalledWith('DOC1', true);
    expect(fetchDetails).toHaveBeenCalledWith('DOC2', true);
    expect(fetchDetails).not.toHaveBeenCalledWith('DOC3', true);
  });

  it('creates full-text directory automatically', async () => {
    const longContent = 'B'.repeat(FULL_TEXT_MIN_LENGTH + 1);
    const client = createMockClient(async () => ({ text: longContent }));
    const nestedDir = path.join(tmpDir, 'deeply', 'nested');

    await fetchFullTextForTopN(client, [makeDoc({ dok_id: 'X1' })], 1, nestedDir);

    expect(fs.existsSync(path.join(nestedDir, 'full-text', 'X1.md'))).toBe(true);
  });

  describe('graceful degradation — metadata-only response', () => {
    it('records success=false when content is below FULL_TEXT_MIN_LENGTH', async () => {
      const shortContent = 'short';
      const client = createMockClient(async () => ({ text: shortContent, snippet: 'snippet' }));

      const outcomes = await fetchFullTextForTopN(
        client, [makeDoc({ dok_id: 'HD03104' })], 1, tmpDir,
      );

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]!.success).toBe(false);
      expect(outcomes[0]!.chars).toBe(0);
      expect(outcomes[0]!.reason).toMatch(/metadata-only/);

      // No file should be written for failed fetches
      const fullTextDir = path.join(tmpDir, 'full-text');
      expect(fs.existsSync(path.join(fullTextDir, 'HD03104.md'))).toBe(false);
    });

    it('falls back from text to fullText field when text is too short', async () => {
      const longFullText = 'C'.repeat(FULL_TEXT_MIN_LENGTH + 20);
      const client = createMockClient(async () => ({
        text: 'short',
        fullText: longFullText,
      }));

      const outcomes = await fetchFullTextForTopN(
        client, [makeDoc({ dok_id: 'DOC_FT' })], 1, tmpDir,
      );

      expect(outcomes[0]!.success).toBe(true);
      expect(outcomes[0]!.chars).toBe(longFullText.length);
    });

    it('falls back to html field when text and fullText are too short', async () => {
      const longHtml = '<html>' + 'D'.repeat(FULL_TEXT_MIN_LENGTH + 20) + '</html>';
      const client = createMockClient(async () => ({
        text: 'x',
        fullText: 'y',
        html: longHtml,
      }));

      const outcomes = await fetchFullTextForTopN(
        client, [makeDoc({ dok_id: 'DOC_HTML' })], 1, tmpDir,
      );

      expect(outcomes[0]!.success).toBe(true);
      expect(outcomes[0]!.chars).toBe(longHtml.length);
    });
  });

  describe('graceful degradation — fetchDocumentDetails throws', () => {
    it('records success=false with reason when MCP call rejects', async () => {
      const client = createMockClient(async () => {
        throw new Error('MCP connection timeout');
      });

      const outcomes = await fetchFullTextForTopN(
        client, [makeDoc({ dok_id: 'HD01CU24' })], 1, tmpDir,
      );

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]!.success).toBe(false);
      expect(outcomes[0]!.chars).toBe(0);
      expect(outcomes[0]!.reason).toMatch(/fetchDocumentDetails failed/);
      expect(outcomes[0]!.reason).toMatch(/MCP connection timeout/);
    });

    it('continues to next document after one fails', async () => {
      const longContent = 'E'.repeat(FULL_TEXT_MIN_LENGTH + 5);
      const client = createMockClient(async (dokId) => {
        if (dokId === 'FAIL_DOC') throw new Error('timeout');
        return { text: longContent };
      });

      const docs = [
        makeDoc({ dok_id: 'FAIL_DOC' }),
        makeDoc({ dok_id: 'OK_DOC' }),
      ];

      const outcomes = await fetchFullTextForTopN(client, docs, 2, tmpDir);

      expect(outcomes).toHaveLength(2);
      expect(outcomes[0]!.success).toBe(false);
      expect(outcomes[1]!.success).toBe(true);
      expect(outcomes[1]!.chars).toBeGreaterThan(0);
    });
  });

  describe('dokId resolution', () => {
    it('skips documents with no resolvable dok_id', async () => {
      const fetchDetails = vi.fn().mockResolvedValue({});
      const client = createMockClient(fetchDetails);
      const docNoId = makeDoc({
        dok_id: undefined,
        dokument_id: undefined,
        rel_dok_id: undefined,
        id: undefined,
        dokumentnamn: undefined,
      });

      const outcomes = await fetchFullTextForTopN(client, [docNoId], 1, tmpDir);

      expect(outcomes).toHaveLength(0);
      expect(fetchDetails).not.toHaveBeenCalled();
    });

    it('resolves dok_id from dokument_id when dok_id is absent', async () => {
      const longContent = 'F'.repeat(FULL_TEXT_MIN_LENGTH + 5);
      const fetchDetails = vi.fn().mockResolvedValue({ text: longContent });
      const client = createMockClient(fetchDetails);
      const doc = makeDoc({
        dok_id: undefined,
        dokument_id: 'DOKU1',
      });

      const outcomes = await fetchFullTextForTopN(client, [doc], 1, tmpDir);

      expect(fetchDetails).toHaveBeenCalledWith('DOKU1', true);
      expect(outcomes[0]!.dokId).toBe('DOKU1');
    });
  });

  describe('file content', () => {
    it('writes markdown file with header and content', async () => {
      const content = 'G'.repeat(FULL_TEXT_MIN_LENGTH + 5);
      const client = createMockClient(async () => ({
        text: content,
        snippet: 'A short summary',
      }));

      await fetchFullTextForTopN(client, [makeDoc({ dok_id: 'DOC99' })], 1, tmpDir);

      const written = fs.readFileSync(path.join(tmpDir, 'full-text', 'DOC99.md'), 'utf8');
      expect(written).toContain('# Full Text — DOC99');
      expect(written).toContain('A short summary');
      expect(written).toContain(content);
      // Blank lines must be preserved so the horizontal rule renders correctly
      expect(written).toContain('\n\n---\n');
    });

    it('filePath in outcome is relative to outputDir (not CWD)', async () => {
      const content = 'Z'.repeat(FULL_TEXT_MIN_LENGTH + 5);
      const client = createMockClient(async () => ({ text: content }));

      const outcomes = await fetchFullTextForTopN(
        client, [makeDoc({ dok_id: 'RELPATH' })], 1, tmpDir,
      );

      expect(outcomes[0]!.success).toBe(true);
      // filePath should be relative to outputDir, not an absolute path or CWD-relative
      expect(outcomes[0]!.filePath).toBe(path.join('full-text', 'RELPATH.md'));
    });

    it('sanitizes MP profile text (isPersonProfileText filter)', async () => {
      const profileText = 'Tjänstgörande riksdagsledamot ' + 'A'.repeat(200);
      const client = createMockClient(async () => ({
        text: 'short',
        fullText: profileText,
      }));

      const outcomes = await fetchFullTextForTopN(
        client, [makeDoc({ dok_id: 'PROF_DOC' })], 1, tmpDir,
      );

      // Profile text is sanitized, falls back to short text which is below threshold
      expect(outcomes[0]!.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// serializeDataManifest — full-text outcomes section
// ---------------------------------------------------------------------------

// We import buildWeeklySummaryMarkdown as a smoke-test that the module loads
// without errors after the changes to download-parliamentary-data.ts.
import { buildWeeklySummaryMarkdown } from '../scripts/download-parliamentary-data.js';

describe('serializeDataManifest (via buildWeeklySummaryMarkdown sanity)', () => {
  it('buildWeeklySummaryMarkdown still works after refactor', () => {
    const md = buildWeeklySummaryMarkdown({
      weekLabel: '2026-W17',
      generatedAt: '2026-04-26 06:00 UTC',
      documentsDownloaded: 42,
      daysIncluded: 5,
      dayList: ['2026-04-22', '2026-04-23', '2026-04-24'],
    });
    expect(md).toContain('2026-W17');
    expect(md).toContain('42');
  });
});

// We test the manifest full-text section indirectly by checking parseArgs
// correctly exposes autoFullTextTopN so the caller can pass outcomes to
// serializeDataManifest. Direct testing of the private serialize function
// is done via the integration path in the pipeline.
describe('manifest full-text outcomes integration contract', () => {
  it('parseArgs exposes autoFullTextTopN=2 when flag is set', () => {
    const args = parseArgs(['node', 'script.ts', '--auto-full-text-top-n', '2']);
    expect(args.autoFullTextTopN).toBe(2);
  });

  it('fetchFullTextForTopN returns outcome with filePath for successful fetch', async () => {
    const longContent = 'H'.repeat(FULL_TEXT_MIN_LENGTH + 10);
    const client = createMockClient(async () => ({ text: longContent }));

    const outcomes = await fetchFullTextForTopN(
      client,
      [makeDoc({ dok_id: 'HD01FiU48' }), makeDoc({ dok_id: 'HD01CU25' })],
      2,
      tmpDir,
    );

    for (const o of outcomes) {
      if (o.success) {
        expect(o.filePath).toBeDefined();
        expect(o.chars).toBeGreaterThan(FULL_TEXT_MIN_LENGTH);
      }
    }
  });

  it('analysis-gate can determine if top-2 full texts are available from outcomes', async () => {
    const longContent = 'I'.repeat(FULL_TEXT_MIN_LENGTH + 1);
    const client = createMockClient(async () => ({ text: longContent }));

    const docs = [
      makeDoc({ dok_id: 'TOP1' }),
      makeDoc({ dok_id: 'TOP2' }),
    ];

    const outcomes = await fetchFullTextForTopN(client, docs, 2, tmpDir);

    const successCount = outcomes.filter(o => o.success).length;
    // Gate can check: successCount >= 2 OR fallback annotation present
    expect(successCount).toBe(2);
  });

  it('serializes coverage-state and deferred queue sections in the manifest', () => {
    const manifest = serializeDataManifest(
      '2026-05-15',
      '2026-05-15 00:00 UTC',
      ['get_interpellationer'],
      { interpellations: 2 },
      2,
      null,
      [
        {
          tool: 'search_dokument',
          query: { titel: 'Statskontoret' },
          resultCount: 0,
          coverageState: 'search_empty',
          provenance: {
            provider: 'riksdag-regering',
            endpoint: 'https://riksdag-regering-ai.onrender.com/mcp',
            tool: 'search_dokument',
            query: { titel: 'Statskontoret' },
            resultCount: 0,
            coverageState: 'search_empty',
            retrieval: 'live',
            retrievedAt: '2026-05-15T00:00:00.000Z',
          },
          notes: '0 rows returned',
        },
      ],
      [
        {
          dokId: 'HD10492',
          coverageState: 'not_indexed',
          retrieval: 'live',
          tool: 'get_dokument_innehall',
          resultCount: 1,
          notes: 'same-day filing',
        },
      ],
      { processed: 1, resolved: 0, retained: 1, expired: 0, enqueued: 1 },
      [
        {
          dokId: 'HD10492',
          success: false,
          chars: 0,
          reason: 'same-day filing',
          coverageState: 'not_indexed',
          provenance: {
            provider: 'riksdag-regering',
            endpoint: 'https://riksdag-regering-ai.onrender.com/mcp',
            tool: 'get_dokument_innehall',
            query: { dok_id: 'HD10492', include_full_text: true },
            resultCount: 1,
            coverageState: 'not_indexed',
            retrieval: 'live',
            retrievedAt: '2026-05-15T00:00:00.000Z',
          },
        },
      ],
    );

    expect(manifest).toContain('## MCP Query Diagnostics');
    expect(manifest).toContain('## MCP Coverage State');
    expect(manifest).toContain('## Deferred Retrieval Queue');
    expect(manifest).toContain('HD10492');
    expect(manifest).toContain('not_indexed');
  });

  it('escapes pipes and collapses newlines in diagnostic manifest cells', () => {
    // MCP error / notes text routinely contains the `|` character (used in
    // serialised queries) and multi-line stack traces. Both would corrupt
    // the markdown table layout and make the diagnostics unparseable for
    // downstream gates. The serializer must escape them.
    const manifest = serializeDataManifest(
      '2026-05-15',
      '2026-05-15 00:00 UTC',
      ['search_dokument'],
      { motions: 0 },
      0,
      null,
      [
        {
          tool: 'search_dokument',
          query: { titel: 'A | B\nC' },
          resultCount: 0,
          coverageState: 'fetch_error',
          provenance: {
            provider: 'riksdag-regering',
            endpoint: 'https://riksdag-regering-ai.onrender.com/mcp',
            tool: 'search_dokument',
            query: { titel: 'A | B\nC' },
            resultCount: 0,
            coverageState: 'fetch_error',
            retrieval: 'live',
            retrievedAt: '2026-05-15T00:00:00.000Z',
          },
          notes: 'MCP server error: 503 Service Unavailable\n  at fetch (line 1)\n  at next (line 2)',
        },
      ],
      [],
      { processed: 0, resolved: 0, retained: 0, expired: 0, enqueued: 0 },
    );

    // The diagnostic row must remain a single line within the table — no
    // raw newline characters that would break the markdown table layout.
    const diagRow = manifest.split('\n').find(line => line.includes('search_dokument') && line.includes('fetch_error'));
    expect(diagRow).toBeDefined();
    // Pipes inside the query/notes payload must be escaped so they do not
    // start a new table column.
    expect(diagRow).toMatch(/\\\|/);
    // Multi-line stack-trace text must be collapsed onto a single row
    // (no orphan `at fetch (line ...)` text spilling onto subsequent lines).
    const linesAfterDiag = manifest.split(diagRow!)[1]?.split('\n').slice(0, 3) ?? [];
    expect(linesAfterDiag.join('\n')).not.toMatch(/at fetch \(line 2\)/);
    // The collapsed payload must still contain the trace fragments on the
    // same single row.
    expect(diagRow).toContain('at fetch (line 1)');
    expect(diagRow).toContain('at next (line 2)');
  });

  it('escapes backslashes before pipes so escaped-pipe sentinels are unambiguous', () => {
    // CodeQL `js/incomplete-sanitization` regression guard. Input that
    // already contains a literal backslash (e.g. a Windows path fragment
    // or a serialised regex) must not be allowed to combine with the
    // subsequent `\|` insertion to look like an escaped backslash + raw
    // pipe — which would re-open a new table column in the markdown
    // renderer. Backslash escaping happens FIRST so every `\|` in the
    // output is the sanitizer's own sentinel, never the caller's data.
    const manifest = serializeDataManifest(
      '2026-05-15',
      '2026-05-15 00:00 UTC',
      ['search_dokument'],
      { motions: 0 },
      0,
      null,
      [
        {
          tool: 'search_dokument',
          query: { path: 'C:\\Users\\runner|admin' },
          resultCount: 0,
          coverageState: 'fetch_error',
          provenance: {
            provider: 'riksdag-regering',
            endpoint: 'https://riksdag-regering-ai.onrender.com/mcp',
            tool: 'search_dokument',
            query: { path: 'C:\\Users\\runner|admin' },
            resultCount: 0,
            coverageState: 'fetch_error',
            retrieval: 'live',
            retrievedAt: '2026-05-15T00:00:00.000Z',
          },
          notes: 'path \\\\ contains | pipe',
        },
      ],
      [],
      { processed: 0, resolved: 0, retained: 0, expired: 0, enqueued: 0 },
    );

    const diagRow = manifest
      .split('\n')
      .find(line => line.includes('search_dokument') && line.includes('fetch_error'));
    expect(diagRow).toBeDefined();
    // Each caller-supplied `\` becomes `\\` and each caller-supplied `|`
    // becomes `\|`. The notes payload `path \\ contains | pipe` therefore
    // becomes `path \\\\ contains \| pipe` in the rendered cell — i.e. four
    // literal backslashes before ` contains `, and an unambiguous escaped
    // pipe before ` pipe`. Critically, the backslash pass MUST run before
    // the pipe pass, otherwise the trailing `\` in the input could combine
    // with the sanitizer's own `\|` and look like an escaped-backslash +
    // raw-pipe sequence (re-opening a markdown table column).
    expect(diagRow).toContain('path \\\\\\\\ contains \\| pipe');
  });
});

describe('isDocumentNotIndexedError (transport vs document-level disambiguation)', () => {
  it('treats explicit indexing phrases as not_indexed', () => {
    expect(isDocumentNotIndexedError('document HD10492 not found', 'HD10492')).toBe(true);
    expect(isDocumentNotIndexedError('Document not indexed yet', 'HD10492')).toBe(true);
    expect(isDocumentNotIndexedError('no document for HD10492', 'HD10492')).toBe(true);
  });

  it('treats transport-level failures as fetch_error, NOT not_indexed', () => {
    expect(isDocumentNotIndexedError('MCP server error: 404 Not Found', 'HD10492')).toBe(false);
    expect(isDocumentNotIndexedError('Transport error: ECONNREFUSED', 'HD10492')).toBe(false);
    expect(isDocumentNotIndexedError('fetch failed: 502 Bad Gateway', 'HD10492')).toBe(false);
    expect(isDocumentNotIndexedError('Network timeout while calling endpoint', 'HD10492')).toBe(false);
    expect(isDocumentNotIndexedError('Server error: 503 Service Unavailable', 'HD10492')).toBe(false);
  });

  it('only treats bare "not found" as not_indexed when paired with the dok_id', () => {
    // Generic "not found" without the dok_id is ambiguous between transport
    // and document-level — must NOT collapse into not_indexed.
    expect(isDocumentNotIndexedError('not found', 'HD10492')).toBe(false);
    // The same message that echoes the dok_id is document-level.
    expect(isDocumentNotIndexedError('hd10492 not found', 'HD10492')).toBe(true);
  });
});
