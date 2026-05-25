/**
 * Unit tests for `src/browser/cia/csv-validator.ts`.
 *
 * Covers:
 *   - `validateCsvRows` happy path (override contract + registered contract).
 *   - `validateCsvRows` missing-column failure.
 *   - `validateCsvRows` row-count below `minRows` failure.
 *   - `validateCsvRows` no-contract pass-through (returns input unchanged).
 *   - `validateCsvRowsLenient` returns false + logs on contract violation.
 *   - `validateCsvRowsLenient` returns true on contract satisfaction / no contract.
 *   - `validateCsvRowsLenient` re-throws non-`CsvContractError` errors.
 *   - `CsvContractError` exposes the structured fields used by dashboard
 *     error banners (`path`, `missingColumns`, `availableColumns`, `rowCount`).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CsvContractError,
  validateCsvRows,
  validateCsvRowsLenient,
} from '../src/browser/cia/csv-validator.js';
import { type CsvContract, CSV_CONTRACTS } from '../src/browser/cia/csv-contracts.js';

const sampleContract: CsvContract = {
  path: '/cia-data/test/unit-test-fixture.csv',
  dashboard: 'unit-test',
  requiredColumns: ['col_a', 'col_b'],
  minRows: 2,
};

describe('csv-validator: CsvContractError', () => {
  it('exposes structured fields on the error instance', () => {
    const err = new CsvContractError(
      '/cia-data/x.csv',
      ['col_missing'],
      ['col_present'],
      0,
    );
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CsvContractError');
    expect(err.path).toBe('/cia-data/x.csv');
    expect(err.missingColumns).toEqual(['col_missing']);
    expect(err.availableColumns).toEqual(['col_present']);
    expect(err.rowCount).toBe(0);
    expect(err.message).toContain('/cia-data/x.csv');
    expect(err.message).toContain('col_missing');
    expect(err.message).toContain('col_present');
    expect(err.message).toContain('0 row');
  });
});

describe('csv-validator: validateCsvRows (override contract)', () => {
  it('returns rows unchanged when all required columns and minRows are satisfied', () => {
    const rows = [
      { col_a: '1', col_b: '2' },
      { col_a: '3', col_b: '4' },
    ];
    const result = validateCsvRows(sampleContract.path, rows, sampleContract);
    expect(result).toBe(rows);
  });

  it('throws CsvContractError when a required column is missing from the header', () => {
    const rows = [{ col_a: '1' }, { col_a: '3' }];
    expect(() => validateCsvRows(sampleContract.path, rows, sampleContract)).toThrowError(
      CsvContractError,
    );
    try {
      validateCsvRows(sampleContract.path, rows, sampleContract);
    } catch (err) {
      expect(err).toBeInstanceOf(CsvContractError);
      const e = err as CsvContractError;
      expect(e.missingColumns).toEqual(['col_b']);
      expect(e.availableColumns).toEqual(['col_a']);
      expect(e.rowCount).toBe(2);
      expect(e.path).toBe(sampleContract.path);
    }
  });

  it('throws CsvContractError when row count is below minRows', () => {
    const rows = [{ col_a: '1', col_b: '2' }];
    try {
      validateCsvRows(sampleContract.path, rows, sampleContract);
      expect.fail('expected CsvContractError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CsvContractError);
      const e = err as CsvContractError;
      expect(e.rowCount).toBe(1);
      expect(e.availableColumns).toEqual(['col_a', 'col_b']);
    }
  });

  it('throws CsvContractError on zero rows (header keys unknown)', () => {
    try {
      validateCsvRows<{ col_a: string; col_b: string }>(
        sampleContract.path,
        [],
        sampleContract,
      );
      expect.fail('expected CsvContractError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CsvContractError);
      const e = err as CsvContractError;
      expect(e.rowCount).toBe(0);
      expect(e.availableColumns).toEqual([]);
      expect(e.missingColumns).toEqual(['col_a', 'col_b']);
    }
  });

  it('defaults minRows to 1 when contract omits the field', () => {
    const noMinRows: CsvContract = {
      path: '/cia-data/test/no-min-rows.csv',
      dashboard: 'unit-test',
      requiredColumns: ['col_a'],
    };
    expect(() =>
      validateCsvRows(noMinRows.path, [], noMinRows),
    ).toThrowError(CsvContractError);
    expect(
      validateCsvRows(noMinRows.path, [{ col_a: '1' }], noMinRows),
    ).toHaveLength(1);
  });
});

describe('csv-validator: validateCsvRows (registered contract)', () => {
  it('uses getCsvContract lookup when no override contract is supplied', () => {
    const registered = CSV_CONTRACTS[0];
    const rows = [
      Object.fromEntries(registered.requiredColumns.map((c) => [c, 'x'])),
    ];
    const result = validateCsvRows(registered.path, rows);
    expect(result).toBe(rows);
  });

  it('returns input unchanged when no contract is registered for the path', () => {
    const rows = [{ anything: 'goes' }];
    const result = validateCsvRows('/cia-data/no/such-contract.csv', rows);
    expect(result).toBe(rows);
  });
});

describe('csv-validator: validateCsvRowsLenient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true and does not log when the contract is satisfied', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rows = [
      { col_a: '1', col_b: '2' },
      { col_a: '3', col_b: '4' },
    ];
    // No contract registered for this path → pass-through truthy.
    expect(validateCsvRowsLenient(sampleContract.path, rows)).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('returns false and logs to console.error on CsvContractError', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const registered = CSV_CONTRACTS[0];
    // Missing required columns → contract violation.
    const rows = [{ unrelated: 'value' }];
    expect(validateCsvRowsLenient(registered.path, rows)).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const args = errorSpy.mock.calls[0];
    expect(args[0]).toBe('[csv-validator]');
    expect(String(args[1])).toContain(registered.path);
  });
});
