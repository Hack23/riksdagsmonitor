/**
 * @module scripts/statskontoret/extractors/rows-to-records
 * @description Convert raw 2-D sheet rows into header-keyed records.
 *
 * Used by every Statskontoret domain workflow (headcount, budget outturn,
 * budget time-series) — the headers vary across workbooks but the parsing
 * approach is identical, so it lives in its own module.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { normalizeKey } from '../internal/text.js';

export function rowsToRecords(
  rows: readonly (readonly string[])[],
  headerRowIndex?: number,
): Record<string, string>[] {
  const resolvedHeaderIndex = headerRowIndex ?? findLikelyHeaderRow(rows);
  if (resolvedHeaderIndex < 0) return [];
  const headers = rows[resolvedHeaderIndex].map(
    (header, index) => header.trim() || `column_${index + 1}`,
  );
  const records: Record<string, string>[] = [];
  for (const row of rows.slice(resolvedHeaderIndex + 1)) {
    const record: Record<string, string> = {};
    let hasValue = false;
    for (let i = 0; i < headers.length; i++) {
      const value = row[i]?.trim() ?? '';
      if (value) hasValue = true;
      record[headers[i]] = value;
    }
    if (hasValue) records.push(record);
  }
  return records;
}

export function findLikelyHeaderRow(rows: readonly (readonly string[])[]): number {
  for (let i = 0; i < rows.length; i++) {
    const normalized = rows[i].map(normalizeKey);
    const headcountScore = [
      normalized.some((cell) => cell.includes('myndighet')),
      normalized.some((cell) => cell.includes('departement')),
      normalized.some((cell) => cell.includes('arsarbetskrafter') || cell === 'aa'),
      normalized.some((cell) => cell === 'ar' || cell === 'year'),
    ].filter(Boolean).length;
    if (headcountScore >= 2) return i;
    const budgetScore = [
      normalized.some((cell) => cell.includes('utfall') || cell.includes('outturn')),
      normalized.some(
        (cell) =>
          cell.includes('inkomst') || cell.includes('utgift') || cell.includes('anslag'),
      ),
      normalized.some((cell) => cell === 'ar' || cell.includes('kalenderar') || cell === 'year'),
      normalized.some((cell) => cell.includes('budget') || cell.includes('belopp')),
    ].filter(Boolean).length;
    if (budgetScore >= 2) return i;
  }
  return rows.findIndex((row) => row.filter((cell) => cell.trim()).length >= 2);
}
