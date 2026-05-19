/**
 * @module scripts/statskontoret/domain/headcount
 * @description Headcount/authority-count aggregation derived from
 * Statskontoret myndighetsförteckning workbooks.
 *
 * Consumes the records produced by `rowsToRecords` and groups by
 * `(year, department)` returning a sorted, deterministic time series.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { rowsToRecords } from '../extractors/rows-to-records.js';
import {
  buildRecordLookup,
  findField,
  parseStatskontoretOptionalInt,
  parseStatskontoretSwedishNumber,
  roundOneDecimal,
} from '../internal/text.js';
import type {
  StatskontoretHeadcountOptions,
  StatskontoretHeadcountRow,
  StatskontoretWorkbook,
} from '../types.js';

export function aggregateHeadcountByDepartment(
  records: readonly Record<string, string>[],
  fallbackYear?: number,
): StatskontoretHeadcountRow[] {
  const aggregate = new Map<string, { headcount: number; authorities: Set<string> }>();
  for (const record of records) {
    const lookup = buildRecordLookup(record);
    const year =
      parseStatskontoretOptionalInt(findField(lookup, ['år', 'ar', 'year']) ?? '') ?? fallbackYear;
    const department = findField(lookup, [
      'departement',
      'departementstillhörighet',
      'departementstillhorighet',
    ])?.trim();
    const headcountValue = parseStatskontoretSwedishNumber(
      findField(lookup, ['årsarbetskrafter', 'arsarbetskrafter', 'åa', 'aa']) ?? '',
    );
    if (!year || !department || headcountValue === undefined) continue;
    const authority = findField(lookup, ['myndighet', 'myndighetsnamn', 'namn'])?.trim() ?? '';
    const key = `${year}::${department}`;
    const current = aggregate.get(key) ?? { headcount: 0, authorities: new Set<string>() };
    current.headcount += headcountValue;
    if (authority) current.authorities.add(authority);
    aggregate.set(key, current);
  }

  return [...aggregate.entries()]
    .map(([key, value]) => {
      const [yearRaw, department] = key.split('::');
      return {
        year: Number.parseInt(yearRaw, 10),
        department,
        headcount: roundOneDecimal(value.headcount),
        authorityCount: value.authorities.size,
      };
    })
    .sort((a, b) => a.year - b.year || a.department.localeCompare(b.department, 'sv'));
}

export function buildHeadcountTimeSeries(
  workbook: StatskontoretWorkbook,
  options: StatskontoretHeadcountOptions = {},
): StatskontoretHeadcountRow[] {
  const sheet = options.sheetNamePattern
    ? workbook.sheets.find((candidate) => options.sheetNamePattern?.test(candidate.name))
    : workbook.sheets.find((candidate) => /förteckning|forteckning/i.test(candidate.name)) ??
      workbook.sheets[0];
  if (!sheet) return [];
  return aggregateHeadcountByDepartment(rowsToRecords(sheet.rows), options.fallbackYear);
}
