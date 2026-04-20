/**
 * Unit tests for `scripts/validate-mcp-reliability.ts`.
 *
 * Locks in the canonical schema and every rule (section present, table
 * present, column-order, numeric parsing, arithmetic consistency,
 * required-server coverage) using synthetic manifest fixtures.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateMCPReliability,
  extractMCPSection,
  parseMCPTable,
  CANONICAL_COLUMNS,
  REQUIRED_SERVERS,
} from '../scripts/validate-mcp-reliability.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HEADER = `# Data-Download Manifest — Test Fixture

Summary prose.

`;

const PASSING_TABLE = `## MCP Reliability

| MCP Server | Tool | Calls | Successes | Retries | Failures | Notes |
|------------|------|:-----:|:---------:|:-------:|:--------:|-------|
| riksdag-regering | search_dokument | 12 | 12 | 0 | 0 | — |
| riksdag-regering | get_anforande | 8 | 7 | 1 | 0 | 1 × 429 rate-limit |
| scb | query_table | 3 | 3 | 0 | 0 | — |

## Next Section

More prose.
`;

const FIXTURE_PASSING = HEADER + PASSING_TABLE;

const FIXTURE_NO_SECTION = HEADER + '## Something Else\n\nUnrelated.\n';

const FIXTURE_SECTION_NO_TABLE = `${HEADER}## MCP Reliability

Section body with no table.

## Next Section
`;

const FIXTURE_WRONG_COLUMN_ORDER = `${HEADER}## MCP Reliability

| Tool | MCP Server | Calls | Successes | Retries | Failures | Notes |
|------|------------|:-----:|:---------:|:-------:|:--------:|-------|
| search_dokument | riksdag-regering | 5 | 5 | 0 | 0 | — |
`;

const FIXTURE_MISSING_RIKSDAG = `${HEADER}## MCP Reliability

| MCP Server | Tool | Calls | Successes | Retries | Failures | Notes |
|------------|------|:-----:|:---------:|:-------:|:--------:|-------|
| scb | query_table | 3 | 3 | 0 | 0 | — |
| world-bank | get_economic_data | 2 | 2 | 0 | 0 | — |
`;

const FIXTURE_NON_NUMERIC = `${HEADER}## MCP Reliability

| MCP Server | Tool | Calls | Successes | Retries | Failures | Notes |
|------------|------|:-----:|:---------:|:-------:|:--------:|-------|
| riksdag-regering | search_dokument | twelve | 12 | 0 | 0 | — |
`;

const FIXTURE_ARITHMETIC_INCONSISTENT = `${HEADER}## MCP Reliability

| MCP Server | Tool | Calls | Successes | Retries | Failures | Notes |
|------------|------|:-----:|:---------:|:-------:|:--------:|-------|
| riksdag-regering | get_anforande | 5 | 4 | 0 | 3 | — |
`;

const FIXTURE_NO_ROWS = `${HEADER}## MCP Reliability

| MCP Server | Tool | Calls | Successes | Retries | Failures | Notes |
|------------|------|:-----:|:---------:|:-------:|:--------:|-------|
`;

const FIXTURE_EXTRA_COLUMN = `${HEADER}## MCP Reliability

| MCP Server | Tool | Calls | Successes | Retries | Failures | Notes | Latency (ms) |
|------------|------|:-----:|:---------:|:-------:|:--------:|-------|:-----------:|
| riksdag-regering | search_dokument | 12 | 12 | 0 | 0 | — | 420 |
`;

// ---------------------------------------------------------------------------
// Temp-directory scaffolding
// ---------------------------------------------------------------------------

let rootDir: string;

async function writeFixture(name: string, content: string): Promise<string> {
  const absPath = join(rootDir, name);
  await mkdir(join(absPath, '..'), { recursive: true });
  await writeFile(absPath, content, 'utf-8');
  return absPath;
}

beforeAll(async () => {
  rootDir = await mkdtemp(join(tmpdir(), 'mcp-reliab-'));
});

afterAll(async () => {
  if (rootDir) {
    await rm(rootDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('Canonical schema constants', () => {
  it('declares exactly 7 canonical columns in order', () => {
    expect(CANONICAL_COLUMNS).toEqual([
      'MCP Server', 'Tool', 'Calls', 'Successes', 'Retries', 'Failures', 'Notes',
    ]);
  });

  it('lists riksdag-regering as a required server', () => {
    expect(REQUIRED_SERVERS).toContain('riksdag-regering');
  });
});

// ---------------------------------------------------------------------------
// Section extraction
// ---------------------------------------------------------------------------

describe('extractMCPSection', () => {
  it('extracts the MCP Reliability section body', () => {
    const body = extractMCPSection(FIXTURE_PASSING);
    expect(body).not.toBeNull();
    expect(body).toContain('| riksdag-regering | search_dokument |');
    // Must stop at the next H2.
    expect(body).not.toContain('More prose.');
  });

  it('returns null when the section is absent', () => {
    expect(extractMCPSection(FIXTURE_NO_SECTION)).toBeNull();
  });

  it('accepts the section header with an emoji preamble', () => {
    const body = extractMCPSection(HEADER + '## 🛰️ MCP Reliability\n\n| a | b |\n|---|---|\n| 1 | 2 |\n');
    expect(body).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Table parsing
// ---------------------------------------------------------------------------

describe('parseMCPTable', () => {
  it('parses header + data rows correctly', () => {
    const body = extractMCPSection(FIXTURE_PASSING)!;
    const { headers, rows } = parseMCPTable(body);
    expect(headers).toEqual(['MCP Server', 'Tool', 'Calls', 'Successes', 'Retries', 'Failures', 'Notes']);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      server: 'riksdag-regering',
      tool: 'search_dokument',
      calls: 12,
      successes: 12,
      retries: 0,
      failures: 0,
    });
  });

  it('returns empty arrays when no table is present', () => {
    const body = extractMCPSection(FIXTURE_SECTION_NO_TABLE);
    const { headers, rows } = parseMCPTable(body ?? '');
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it('preserves row order (rowIndex is 1-based)', () => {
    const body = extractMCPSection(FIXTURE_PASSING)!;
    const { rows } = parseMCPTable(body);
    expect(rows.map((r) => r.rowIndex)).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('validateMCPReliability — happy path', () => {
  it('PASSES a canonical manifest with riksdag-regering coverage', async () => {
    const file = await writeFixture('ok.md', FIXTURE_PASSING);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.rows).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Rule-by-rule failure tests
// ---------------------------------------------------------------------------

describe('validateMCPReliability — file-exists', () => {
  it('reports error when manifest is missing', async () => {
    const report = await validateMCPReliability(join(rootDir, 'missing.md'));
    expect(report.ok).toBe(false);
    expect(report.issues[0].rule).toBe('file-exists');
  });
});

describe('validateMCPReliability — section-missing', () => {
  it('reports error when §MCP Reliability heading is absent', async () => {
    const file = await writeFixture('no-section.md', FIXTURE_NO_SECTION);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'section-missing')).toBe(true);
  });
});

describe('validateMCPReliability — table-missing', () => {
  it('reports error when section exists but no table is present', async () => {
    const file = await writeFixture('no-table.md', FIXTURE_SECTION_NO_TABLE);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'table-missing')).toBe(true);
  });
});

describe('validateMCPReliability — column-order', () => {
  it('reports error when columns are in the wrong order', async () => {
    const file = await writeFixture('wrong-order.md', FIXTURE_WRONG_COLUMN_ORDER);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(false);
    const columnIssues = report.issues.filter((i) => i.rule === 'column-order');
    // First two columns are swapped; subsequent columns will also drift.
    expect(columnIssues.length).toBeGreaterThanOrEqual(1);
  });
});

describe('validateMCPReliability — extra-columns (warning only)', () => {
  it('warns but does not fail when extra columns are present', async () => {
    const file = await writeFixture('extra.md', FIXTURE_EXTRA_COLUMN);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(true);
    expect(report.issues.some((i) => i.rule === 'extra-columns' && i.severity === 'warning')).toBe(true);
  });
});

describe('validateMCPReliability — no-rows', () => {
  it('reports error when the table has header but no data rows', async () => {
    const file = await writeFixture('no-rows.md', FIXTURE_NO_ROWS);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'no-rows')).toBe(true);
  });
});

describe('validateMCPReliability — non-numeric-cell', () => {
  it('reports error when a numeric cell is not an integer', async () => {
    const file = await writeFixture('non-numeric.md', FIXTURE_NON_NUMERIC);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'non-numeric-cell')).toBe(true);
  });
});

describe('validateMCPReliability — arithmetic-consistency', () => {
  it('reports error when successes + failures exceeds calls', async () => {
    const file = await writeFixture('arith.md', FIXTURE_ARITHMETIC_INCONSISTENT);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'arithmetic-consistency')).toBe(true);
  });

  it('accepts successes + failures < calls (pending-outcome case)', async () => {
    const withPending = `${HEADER}## MCP Reliability

| MCP Server | Tool | Calls | Successes | Retries | Failures | Notes |
|------------|------|:-----:|:---------:|:-------:|:--------:|-------|
| riksdag-regering | search_dokument | 10 | 7 | 2 | 1 | 2 retries still in flight |
`;
    const file = await writeFixture('pending.md', withPending);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(true);
  });
});

describe('validateMCPReliability — required-server', () => {
  it('reports error when riksdag-regering has no rows', async () => {
    const file = await writeFixture('no-riksdag.md', FIXTURE_MISSING_RIKSDAG);
    const report = await validateMCPReliability(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.rule === 'required-server')).toBe(true);
  });
});
