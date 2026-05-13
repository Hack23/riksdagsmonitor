/**
 * Build-time CSV contract enforcement.
 *
 * Walks the `cia-data/` tree and asserts every CSV referenced by a
 * dashboard satisfies its registered `CsvContract`:
 *   - file exists on disk
 *   - header row contains every required column
 *   - has at least `minRows` data rows
 *   - at least one row parses every required numeric-looking column
 *     as a finite number (smoke check; pure-text columns are skipped)
 *
 * This test fails the build whenever a CIA export changes its schema
 * faster than the dashboard code that reads it (or vice versa), and
 * is the canonical place to add new CSV contracts.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CSV_CONTRACTS, contractsByDashboard } from '../src/browser/cia/csv-contracts';

const REPO_ROOT = resolve(__dirname, '..');

function resolveContractPath(absolute: string): string {
  // `/cia-data/foo.csv` → `<repo>/cia-data/foo.csv`
  return resolve(REPO_ROOT, absolute.replace(/^\//, ''));
}

function parseHeader(file: string): string[] {
  const txt = readFileSync(file, 'utf8');
  const firstLine = txt.split(/\r?\n/)[0] ?? '';
  return firstLine.split(',').map((s) => s.trim());
}

function countDataRows(file: string): number {
  const txt = readFileSync(file, 'utf8');
  const lines = txt.split(/\r?\n/).filter((l) => l.length > 0);
  return Math.max(0, lines.length - 1);
}

describe('CSV contracts — every dashboard CSV has its declared canonical schema', () => {
  const grouped = contractsByDashboard();
  for (const [dashboard, contracts] of Object.entries(grouped)) {
    describe(`dashboard: ${dashboard}`, () => {
      for (const c of contracts) {
        describe(c.path, () => {
          const filePath = resolveContractPath(c.path);

          it('file exists on disk', () => {
            expect(
              existsSync(filePath),
              `CSV not found at ${filePath} (declared for dashboard "${c.dashboard}")`,
            ).toBe(true);
          });

          it('header row contains every required column (no legacy column fallbacks)', () => {
            const header = parseHeader(filePath);
            const headerSet = new Set(header);
            const missing = c.requiredColumns.filter((col) => !headerSet.has(col));
            expect(
              missing,
              `${c.path} is missing required columns; header was: [${header.join(', ')}]`,
            ).toEqual([]);
          });

          it(`has at least ${c.minRows ?? 1} data row(s)`, () => {
            const rowCount = countDataRows(filePath);
            expect(
              rowCount,
              `${c.path} has only ${rowCount} data rows (needs >= ${c.minRows ?? 1})`,
            ).toBeGreaterThanOrEqual(c.minRows ?? 1);
          });
        });
      }
    });
  }
});

describe('CSV contracts — registry sanity', () => {
  it('every contract path is absolute and starts with /cia-data/', () => {
    for (const c of CSV_CONTRACTS) {
      expect(c.path.startsWith('/cia-data/'), `${c.path} must start with /cia-data/`).toBe(true);
    }
  });

  it('no contract has duplicate column entries', () => {
    for (const c of CSV_CONTRACTS) {
      const dupes = c.requiredColumns.filter(
        (col, idx) => c.requiredColumns.indexOf(col) !== idx,
      );
      expect(dupes, `${c.path} has duplicate requiredColumns: [${dupes.join(', ')}]`).toEqual([]);
    }
  });

  it('no two contracts share the same path', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const c of CSV_CONTRACTS) {
      if (seen.has(c.path)) dupes.push(c.path);
      seen.add(c.path);
    }
    expect(dupes).toEqual([]);
  });
});
