/**
 * @module validate-mcp-reliability
 * @description Validator for the MCP Reliability Table required in every
 *              Tier-C `data-download-manifest.md` file.
 *
 * The MCP reliability table is the single row-per-call observability
 * surface that makes workflow retries, rate-limit hits, and cold-MCP
 * failures visible to the weekly aggregator job. Without a standardised
 * shape per Tier-C run, the aggregator cannot compute reliability trends.
 *
 * ## Canonical table shape (§P2-1)
 *
 * ```markdown
 * ## MCP Reliability
 *
 * | MCP Server | Tool | Calls | Successes | Retries | Failures | Notes |
 * |------------|------|:-----:|:---------:|:-------:|:--------:|-------|
 * | riksdag-regering | search_dokument | 12 | 12 | 0 | 0 | — |
 * | riksdag-regering | get_anforande | 8 | 7 | 1 | 0 | 1 × 429 rate-limit |
 * | scb | query_table | 3 | 3 | 0 | 0 | — |
 * ```
 *
 * Columns are **order-sensitive** so the weekly aggregator can `awk`-parse
 * without regex hell; column **headers are case-insensitive** so authors
 * may use "Calls", "CALLS", or "calls" interchangeably.
 *
 * ## Validation rules
 *
 *  1. An H2 `## MCP Reliability` (or `## MCP reliability`) section exists.
 *  2. The section contains at least one markdown table.
 *  3. The table header row carries the seven canonical columns in order:
 *     MCP Server · Tool · Calls · Successes · Retries · Failures · Notes.
 *  4. Every data row parses the numeric columns (Calls, Successes, Retries,
 *     Failures) as non-negative integers.
 *  5. For every row, `Successes + Failures ≤ Calls` (retries may cause
 *     `Successes + Failures < Calls` when a call is recorded but its outcome
 *     is still pending; that is allowed).
 *  6. At least one row references the `riksdag-regering` server — every
 *     Riksdag analysis depends on it and the absence of any call would
 *     indicate the aggregation is synthetic or the table is stale.
 *
 * The validator is deliberately permissive about row count (minimum 1),
 * notes formatting (free-text), and extra trailing columns (warning only).
 *
 * @example
 *   npx tsx scripts/validate-mcp-reliability.ts \
 *     analysis/daily/2026-04-19/month-ahead/data-download-manifest.md
 *
 * @see analysis/agentic-workflow-quality-plan §P2-1 and §P2-2
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Canonical schema
// ---------------------------------------------------------------------------

/** The seven canonical columns in order; case-insensitive on match. */
export const CANONICAL_COLUMNS: ReadonlyArray<string> = [
  'MCP Server',
  'Tool',
  'Calls',
  'Successes',
  'Retries',
  'Failures',
  'Notes',
];

/** MCP servers expected in a Riksdag analysis — presence is enforced. */
export const REQUIRED_SERVERS: ReadonlyArray<string> = ['riksdag-regering'];

/** Section heading matcher (H2, permissive on emoji/numbering preamble). */
const SECTION_HEADER = /^##[^\n]{0,30}\bMCP\s+Reliability\b/mi;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single parsed row from the MCP Reliability Table. */
export interface MCPReliabilityRow {
  readonly server: string;
  readonly tool: string;
  readonly calls: number;
  readonly successes: number;
  readonly retries: number;
  readonly failures: number;
  readonly notes: string;
  /** Row index in the table, 1-based, for error messages. */
  readonly rowIndex: number;
}

/** A single contract violation. */
export interface ValidationIssue {
  readonly severity: 'error' | 'warning';
  readonly rule: string;
  readonly message: string;
}

/** Aggregated validation report for one manifest. */
export interface ValidationReport {
  readonly file: string;
  readonly rows: ReadonlyArray<MCPReliabilityRow>;
  readonly issues: ReadonlyArray<ValidationIssue>;
  /** True when no `severity: 'error'` issues are present. */
  readonly ok: boolean;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Extract the body of the `## MCP Reliability` section from a manifest.
 *
 * Returns the text between the heading and the next H2 (or EOF). Returns
 * `null` when the section is absent.
 */
export function extractMCPSection(manifestContent: string): string | null {
  const headerMatch = SECTION_HEADER.exec(manifestContent);
  if (!headerMatch) return null;
  const start = headerMatch.index;
  const rest = manifestContent.slice(start + headerMatch[0].length);
  const nextHeader = /^##\s/m.exec(rest);
  const end = nextHeader ? nextHeader.index : rest.length;
  return rest.slice(0, end);
}

/**
 * Parse the MCP reliability table rows from a section body.
 *
 * Walks line-by-line looking for markdown table rows (`| a | b | … |`).
 * The first such row is the header, the second is the separator
 * (`|:---:|`), and subsequent rows are data. Returns an empty array if
 * no table is found.
 */
export function parseMCPTable(sectionBody: string): {
  headers: string[];
  rows: MCPReliabilityRow[];
} {
  const tableLines = sectionBody
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (tableLines.length < 2) {
    return { headers: [], rows: [] };
  }

  const splitCells = (line: string): string[] => {
    // Strip leading/trailing pipe before splitting so we don't get empty
    // cells from the outer delimiters.
    const stripped = line.replace(/^\|/, '').replace(/\|$/, '');
    return stripped.split('|').map((c) => c.trim());
  };

  const headerRow = splitCells(tableLines[0]);
  // tableLines[1] is the `|:---:|…|` separator — skip it.
  const dataLines = tableLines.slice(2);

  const rows: MCPReliabilityRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const cells = splitCells(dataLines[i]);
    // Defensive: skip malformed rows (fewer than 7 cells). The validator
    // will surface this as a required-column violation.
    if (cells.length < 7) continue;

    const toInt = (v: string): number => {
      const n = parseInt(v.replace(/[^0-9-]/g, ''), 10);
      return Number.isFinite(n) ? n : NaN;
    };

    rows.push({
      server: cells[0],
      tool: cells[1],
      calls: toInt(cells[2]),
      successes: toInt(cells[3]),
      retries: toInt(cells[4]),
      failures: toInt(cells[5]),
      notes: cells[6],
      rowIndex: i + 1,
    });
  }

  return { headers: headerRow, rows };
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validate the MCP Reliability Table in a `data-download-manifest.md` file.
 *
 * @param filePath - Absolute or repo-relative path to the manifest
 * @returns Structured validation report. Callers decide exit code.
 */
export async function validateMCPReliability(filePath: string): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];

  if (!existsSync(filePath)) {
    return {
      file: filePath,
      rows: [],
      issues: [{ severity: 'error', rule: 'file-exists', message: `File not found: ${filePath}` }],
      ok: false,
    };
  }

  const content = await readFile(filePath, 'utf-8');
  const section = extractMCPSection(content);
  if (!section) {
    return {
      file: filePath,
      rows: [],
      issues: [
        {
          severity: 'error',
          rule: 'section-missing',
          message: 'No `## MCP Reliability` section found. Every Tier-C data-download-manifest MUST include this canonical observability table.',
        },
      ],
      ok: false,
    };
  }

  const { headers, rows } = parseMCPTable(section);
  if (headers.length === 0) {
    issues.push({
      severity: 'error',
      rule: 'table-missing',
      message: '§MCP Reliability section has no markdown table. The canonical row-per-call table is missing.',
    });
    return { file: filePath, rows: [], issues, ok: false };
  }

  // Rule 3: canonical columns in order, case-insensitive.
  for (let i = 0; i < CANONICAL_COLUMNS.length; i++) {
    const expected = CANONICAL_COLUMNS[i].toLowerCase();
    const got = (headers[i] ?? '').toLowerCase();
    if (got !== expected) {
      issues.push({
        severity: 'error',
        rule: 'column-order',
        message: `Column ${i + 1} must be "${CANONICAL_COLUMNS[i]}"; got "${headers[i] ?? '(missing)'}".`,
      });
    }
  }

  if (headers.length > CANONICAL_COLUMNS.length) {
    issues.push({
      severity: 'warning',
      rule: 'extra-columns',
      message: `Table has ${headers.length} columns; canonical schema is ${CANONICAL_COLUMNS.length}. Extra columns are allowed but ignored by the weekly aggregator.`,
    });
  }

  if (rows.length === 0) {
    issues.push({
      severity: 'error',
      rule: 'no-rows',
      message: 'MCP Reliability Table has no data rows. At least one MCP call must be recorded.',
    });
    return { file: filePath, rows: [], issues, ok: false };
  }

  // Rule 4 & 5: numeric columns parse + arithmetic consistency.
  for (const row of rows) {
    const numericFields: Array<[string, number]> = [
      ['Calls', row.calls],
      ['Successes', row.successes],
      ['Retries', row.retries],
      ['Failures', row.failures],
    ];
    for (const [label, value] of numericFields) {
      if (!Number.isFinite(value) || value < 0) {
        issues.push({
          severity: 'error',
          rule: 'non-numeric-cell',
          message: `Row ${row.rowIndex} (${row.server}/${row.tool}): "${label}" must be a non-negative integer.`,
        });
      }
    }
    if (
      Number.isFinite(row.calls) &&
      Number.isFinite(row.successes) &&
      Number.isFinite(row.failures) &&
      row.successes + row.failures > row.calls
    ) {
      issues.push({
        severity: 'error',
        rule: 'arithmetic-consistency',
        message: `Row ${row.rowIndex} (${row.server}/${row.tool}): successes (${row.successes}) + failures (${row.failures}) exceeds calls (${row.calls}).`,
      });
    }
  }

  // Rule 6: required-server coverage.
  const servers = new Set(rows.map((r) => r.server.toLowerCase()));
  for (const required of REQUIRED_SERVERS) {
    if (!servers.has(required.toLowerCase())) {
      issues.push({
        severity: 'error',
        rule: 'required-server',
        message: `No calls recorded against required MCP server "${required}". Either the run did not use Riksdag data (suspicious for a Tier-C run) or the table is stale.`,
      });
    }
  }

  const ok = issues.every((i) => i.severity !== 'error');
  return { file: filePath, rows, issues, ok };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: validate-mcp-reliability <data-download-manifest.md> [<manifest.md> …]');
    process.exit(2);
  }

  let totalFailures = 0;
  for (const arg of args) {
    const report = await validateMCPReliability(resolve(arg));
    if (report.ok) {
      console.log(`✅ ${report.file} (${report.rows.length} row(s))`);
    } else {
      console.error(`❌ ${report.file}`);
      for (const issue of report.issues) {
        const icon = issue.severity === 'error' ? '🔴' : '⚠️';
        console.error(`   ${icon} [${issue.rule}] ${issue.message}`);
      }
      totalFailures++;
    }
  }

  if (totalFailures > 0) {
    console.error(`\n${totalFailures} manifest file(s) failed validation.`);
    process.exit(1);
  } else {
    console.log('\n✅ All MCP Reliability Tables passed validation.');
  }
}

const isMainModule =
  typeof process !== 'undefined' &&
  typeof process.argv?.[1] === 'string' &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
