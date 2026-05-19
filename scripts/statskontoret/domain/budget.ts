/**
 * @module scripts/statskontoret/domain/budget
 * @description Budget-outturn row parsing and summary aggregation for the
 * årsutfall, månadsutfall and budget-time-series Statskontoret workbooks.
 *
 * Field names are normalised so Swedish characters and capitalisation
 * differences in Statskontoret's column headers are tolerated transparently.
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
  StatskontoretBudgetOptions,
  StatskontoretBudgetRow,
  StatskontoretBudgetSummary,
  StatskontoretWorkbook,
} from '../types.js';

/**
 * Parse budget-outturn records into typed `StatskontoretBudgetRow` rows.
 *
 * Covers both `arsutfall` (annual, no month) and `manadsutfall` (monthly) as
 * well as the `budget-time-series` XLSX series.  Field names are normalised so
 * Swedish characters and capitalisation differences are tolerated.
 */
export function parseBudgetRows(
  records: readonly Record<string, string>[],
  options: StatskontoretBudgetOptions = {},
): StatskontoretBudgetRow[] {
  const rows: StatskontoretBudgetRow[] = [];
  for (const record of records) {
    const lookup = buildRecordLookup(record);
    const yearRaw = findField(lookup, ['år', 'ar', 'year', 'kalenderår', 'kalenderar']);
    const year = parseStatskontoretOptionalInt(yearRaw ?? '') ?? options.fallbackYear;
    if (!year) continue;

    const monthRaw = findField(lookup, ['månad', 'manad', 'month', 'månadsperiod']);
    const month = parseStatskontoretOptionalInt(monthRaw ?? '') ?? options.fallbackMonth;

    const docType =
      options.documentType ??
      findField(lookup, ['dokumenttyp', 'dokumenttype', 'typ', 'inkomst_utgift', 'inkomstutgift']) ??
      '';

    const title =
      findField(lookup, [
        'inkomsttitelnamn',
        'inkomsttitelgruppsnamn',
        'anslagsnamn',
        'utgiftsomradesnamn',
        'utgiftsomrade',
        'titel',
        'name',
        'namn',
        'rubrik',
      ])?.trim() ?? '';

    const code = findField(lookup, [
      'inkomsttitel',
      'inkomsttitelnummer',
      'inkomsttitelnr',
      'anslagsnr',
      'anslagsnummer',
      'anslagspost',
      'utgiftsomradesnr',
      'kod',
      'code',
      'nummer',
    ])?.trim();

    const outturnRaw = findField(lookup, [
      'utfall',
      'outturn',
      'utfallmsek',
      'utfallbelopp',
      'inkomstutfall',
      'utgiftsutfall',
      'belopp',
    ]);
    const outturn = parseStatskontoretSwedishNumber(outturnRaw ?? '');
    if (outturn === undefined) continue;

    const budgetRaw = findField(lookup, [
      'budget',
      'budgetvarde',
      'budgetvärde',
      'anvisatbelopp',
      'anvisat',
      'statsbidrag',
      'ramanslag',
    ]);
    const budget = parseStatskontoretSwedishNumber(budgetRaw ?? '');

    const agency = findField(lookup, ['myndighet', 'myndighetsnamn', 'namn', 'authority'])?.trim();
    const status = findField(lookup, ['status', 'utfallsstatus', 'preliminar', 'preliminär'])?.trim();

    rows.push({
      year,
      ...(month !== undefined ? { month } : {}),
      documentType: docType,
      title,
      ...(code ? { code } : {}),
      outturn: roundOneDecimal(outturn),
      ...(budget !== undefined ? { budget: roundOneDecimal(budget) } : {}),
      ...(agency ? { agency } : {}),
      ...(status ? { status } : {}),
    });
  }
  return rows;
}

/**
 * Parse all sheets in a budget-outturn workbook and return a flat array of
 * typed rows sorted by year ascending, then month ascending (annual rows last
 * for the same year), then documentType alphabetically.  For single-type workbooks
 * (e.g. a file explicitly downloaded as "Inkomst"), pass
 * `options.documentType` to set the label uniformly.
 */
export function buildBudgetTimeSeries(
  workbook: StatskontoretWorkbook,
  options: StatskontoretBudgetOptions = {},
): StatskontoretBudgetRow[] {
  const rows: StatskontoretBudgetRow[] = [];
  for (const sheet of workbook.sheets) {
    const sheetDocType = options.documentType ?? inferDocTypeFromSheetName(sheet.name);
    const sheetOptions: StatskontoretBudgetOptions = {
      ...options,
      ...(sheetDocType ? { documentType: sheetDocType } : {}),
    };
    rows.push(...parseBudgetRows(rowsToRecords(sheet.rows), sheetOptions));
  }
  return rows.sort(
    (a, b) =>
      a.year - b.year ||
      (a.month ?? Number.MAX_SAFE_INTEGER) - (b.month ?? Number.MAX_SAFE_INTEGER) ||
      a.documentType.localeCompare(b.documentType, 'sv'),
  );
}

/**
 * Aggregate `StatskontoretBudgetRow` rows into per-year/documentType totals.
 *
 * Rows are grouped by `(year, documentType)`.  `totalBudget` and `variance`
 * are included only when every row in the group has a `budget` value.
 *
 * Returns results sorted by year ascending, then documentType alphabetically.
 */
export function summarizeBudgetOutturn(
  rows: readonly StatskontoretBudgetRow[],
): StatskontoretBudgetSummary[] {
  const groups = new Map<
    string,
    {
      year: number;
      documentType: string;
      totalOutturn: number;
      totalBudget: number;
      allHaveBudget: boolean;
      rowCount: number;
    }
  >();

  for (const row of rows) {
    const key = `${row.year}::${row.documentType}`;
    const existing = groups.get(key);
    if (existing) {
      existing.totalOutturn = roundOneDecimal(existing.totalOutturn + row.outturn);
      if (row.budget !== undefined) {
        existing.totalBudget = roundOneDecimal(existing.totalBudget + row.budget);
      } else {
        existing.allHaveBudget = false;
      }
      existing.rowCount++;
    } else {
      groups.set(key, {
        year: row.year,
        documentType: row.documentType,
        totalOutturn: row.outturn,
        totalBudget: row.budget ?? 0,
        allHaveBudget: row.budget !== undefined,
        rowCount: 1,
      });
    }
  }

  return [...groups.values()]
    .map((g): StatskontoretBudgetSummary => ({
      year: g.year,
      documentType: g.documentType,
      totalOutturn: g.totalOutturn,
      ...(g.allHaveBudget
        ? {
            totalBudget: g.totalBudget,
            variance: roundOneDecimal(g.totalOutturn - g.totalBudget),
          }
        : {}),
      rowCount: g.rowCount,
    }))
    .sort((a, b) => a.year - b.year || a.documentType.localeCompare(b.documentType, 'sv'));
}

/** Infer 'Inkomst' / 'Utgift' from common Swedish sheet-name patterns. */
function inferDocTypeFromSheetName(name: string): string | undefined {
  const n = name.toLowerCase();
  if (n.includes('inkomst')) return 'Inkomst';
  if (n.includes('utgift') || n.includes('anslag')) return 'Utgift';
  return undefined;
}
