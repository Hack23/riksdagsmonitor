/**
 * Runtime CSV column validator.
 *
 * Used by dashboard data-loaders right after a CSV is parsed.
 * If the parsed rows are missing any of the columns declared in the
 * registered `CsvContract` for a given path, this module throws a
 * clear, structured error. Dashboard error handlers surface the
 * thrown message in their visible error banner, so a CSV schema
 * regression is impossible to ship as a silently-empty chart.
 *
 * Validation rules (intentionally strict — no legacy fallbacks):
 *   1. Header check: every name in `contract.requiredColumns` must
 *      appear in the row keys of the first parsed record.
 *   2. Row count: `rows.length >= contract.minRows ?? 1`.
 *   3. No partial rows: a row missing one of the required column
 *      keys (i.e. the parser lost a column) fails the check.
 *
 * Use `validateCsvRows()` from any dashboard data loader. Use
 * `validateCsvRowsLenient()` when the CSV is best-effort (e.g. an
 * unreleased export pulled from a remote CDN); it only logs to
 * `console.error` instead of throwing.
 */
import { type CsvContract, getCsvContract } from './csv-contracts';

export class CsvContractError extends Error {
  readonly path: string;
  readonly missingColumns: readonly string[];
  readonly availableColumns: readonly string[];
  readonly rowCount: number;
  constructor(
    path: string,
    missingColumns: readonly string[],
    availableColumns: readonly string[],
    rowCount: number,
  ) {
    super(
      `CSV ${path} fails its registered contract — missing columns: [${
        missingColumns.join(', ')
      }]; received ${rowCount} row(s); header: [${availableColumns.join(', ')}]`,
    );
    this.name = 'CsvContractError';
    this.path = path;
    this.missingColumns = missingColumns;
    this.availableColumns = availableColumns;
    this.rowCount = rowCount;
  }
}

type CsvRowLike = Readonly<Record<string, unknown>>;

/**
 * Inspect parsed rows against the registered contract for `path`.
 * Returns the input unchanged on success. Throws `CsvContractError`
 * on any violation. If no contract is registered for `path`,
 * validation is skipped (returns input).
 */
export function validateCsvRows<T extends CsvRowLike>(
  path: string,
  rows: readonly T[],
  overrideContract?: CsvContract,
): readonly T[] {
  const contract = overrideContract ?? getCsvContract(path);
  if (!contract) return rows;

  const minRows = contract.minRows ?? 1;
  if (rows.length < minRows) {
    throw new CsvContractError(
      path,
      contract.requiredColumns,
      rows[0] ? Object.keys(rows[0]) : [],
      rows.length,
    );
  }

  const headerKeys = Object.keys(rows[0]);
  const headerSet = new Set(headerKeys);
  const missing = contract.requiredColumns.filter((c) => !headerSet.has(c));
  if (missing.length > 0) {
    throw new CsvContractError(path, missing, headerKeys, rows.length);
  }
  return rows;
}

/**
 * Same checks, but logs to `console.error` instead of throwing.
 * Returns `true` when the contract is satisfied (or no contract is
 * registered), `false` otherwise.
 */
export function validateCsvRowsLenient<T extends CsvRowLike>(
  path: string,
  rows: readonly T[],
): boolean {
  try {
    validateCsvRows(path, rows);
    return true;
  } catch (err) {
    if (err instanceof CsvContractError) {
      console.error('[csv-validator]', err.message);
      return false;
    }
    throw err;
  }
}
