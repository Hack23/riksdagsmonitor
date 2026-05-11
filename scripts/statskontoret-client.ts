/**
 * @module Statskontoret/Client
 * @description TypeScript client for Statskontoret public open-data pages.
 *
 * Covers the Statskontoret datasets that complement IMF, SCB and World Bank
 * context for Riksdagsmonitor: the authority register (myndighetsförteckning),
 * budget time series, annual budget outturn and monthly budget outturn. Data is
 * public and unauthenticated. Excel workbooks and CSV ZIP archives are parsed
 * locally so workflows can persist source data and derived headcount series.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import JSZip from 'jszip';

import { decodeHtmlEntities } from './html-utils.js';

export type StatskontoretSourceKey =
  | 'myndighetsforteckning'
  | 'budget-time-series'
  | 'arsutfall'
  | 'manadsutfall';

export type StatskontoretResourceType = 'excel' | 'csv-zip' | 'zip' | 'document' | 'unknown';

export interface StatskontoretSourceDefinition {
  readonly key: StatskontoretSourceKey;
  readonly title: string;
  readonly url: string;
  readonly cadence: string;
  readonly coverage: string;
  readonly primaryUse: string;
}

export interface StatskontoretDownloadLink {
  readonly source: StatskontoretSourceKey;
  readonly sourcePage: string;
  readonly href: string;
  readonly url: string;
  readonly text: string;
  readonly resourceType: StatskontoretResourceType;
  readonly documentType?: string;
  readonly fileType?: string;
  readonly fileName?: string;
  readonly year?: number;
  readonly month?: number;
  readonly status?: string;
  readonly updatedAt?: string;
}

export interface StatskontoretClientConfig {
  readonly baseURL?: string;
  readonly timeout?: number;
  readonly fetchFn?: typeof fetch;
}

export interface StatskontoretWorkbook {
  readonly sheets: readonly StatskontoretSheet[];
}

export interface StatskontoretSheet {
  readonly name: string;
  readonly rows: readonly (readonly string[])[];
}

export interface StatskontoretHeadcountRow {
  readonly year: number;
  readonly department: string;
  readonly headcount: number;
  readonly authorityCount: number;
}

export interface StatskontoretHeadcountOptions {
  readonly sheetNamePattern?: RegExp;
  readonly fallbackYear?: number;
}

/**
 * A single budget-outturn row derived from an årsutfall, månadsutfall or
 * budget-time-series workbook.  Amounts are in MSEK (millions of Swedish
 * kronor) as published by Statskontoret.
 */
export interface StatskontoretBudgetRow {
  readonly year: number;
  /** Present only for månadsutfall (1–12). */
  readonly month?: number;
  /** 'Inkomst' | 'Utgift' or the raw documentType string from the download. */
  readonly documentType: string;
  /** Human-readable title: income title name or appropriation/expenditure-area name. */
  readonly title: string;
  /** Numeric code of the income title or appropriation, when present. */
  readonly code?: string;
  /** Outturn amount in MSEK. */
  readonly outturn: number;
  /** Budget amount in MSEK; may be absent in older series. */
  readonly budget?: number;
  /** Agency or authority name, when present (finest granularity). */
  readonly agency?: string;
  /** Preliminary / definitive / forecast status label. */
  readonly status?: string;
}

export interface StatskontoretBudgetOptions {
  /** Override the documentType label (e.g. when fetching a single-type workbook). */
  readonly documentType?: string;
  /** Hint for the year when the workbook has no year column (e.g. a single-year file). */
  readonly fallbackYear?: number;
  /** Hint for the month when the workbook has no month column. */
  readonly fallbackMonth?: number;
}

/**
 * Aggregated totals derived from one or more `StatskontoretBudgetRow` rows.
 *
 * `totalOutturn` and `totalBudget` are the sums of the individual row amounts
 * (in MSEK) within the selected grouping.  `variance` is `totalOutturn -
 * totalBudget`; it is `undefined` when any contributing row had no budget
 * figure.  `rowCount` records how many source rows were included.
 */
export interface StatskontoretBudgetSummary {
  readonly year: number;
  readonly documentType: string;
  readonly totalOutturn: number;
  readonly totalBudget?: number;
  readonly variance?: number;
  readonly rowCount: number;
}

/**
 * Typed error thrown by the Statskontoret client and parsers.
 *
 * `kind` lets callers distinguish transport, parsing and contract failures
 * without brittle message matching.
 */
export class StatskontoretError extends Error {
  readonly kind: 'http' | 'workbook' | 'contract' | 'cli';

  constructor(message: string, kind: StatskontoretError['kind'] = 'contract', options?: ErrorOptions) {
    super(message, options);
    this.name = 'StatskontoretError';
    this.kind = kind;
  }
}

export const STATSKONTORET_BASE_URL = 'https://www.statskontoret.se';

export const STATSKONTORET_SOURCES: readonly StatskontoretSourceDefinition[] = Object.freeze([
  {
    key: 'myndighetsforteckning',
    title: 'Myndighetsförteckning – öppna data',
    url: '/analys-och-statistik/oppna-data/myndighetsforteckning/',
    cadence: 'Annual snapshot; Statskontoret page metadata currently indicates 2026-02-06 update for the 2025 workbook.',
    coverage: 'Summary statistics, 2007–2025 time series, latest authority list and full 2007–2025 authority register.',
    primaryUse: 'Government-body headcount, authority count, leadership form and department grouping over time.',
  },
  {
    key: 'budget-time-series',
    title: 'Tidsserier, statens budget m.m.',
    url: '/analys-och-statistik/officiell-statistik/tidsserier-statens-budget-m.m',
    cadence: 'Annual official statistics release.',
    coverage: 'Final outcomes for central-government revenue, expenditure, balance and related public-finance tables, generally from 1995.',
    primaryUse: 'Long-run fiscal context for committee and budget-cycle analysis.',
  },
  {
    key: 'arsutfall',
    title: 'Årsutfall för statens budget – öppna data',
    url: '/analys-och-statistik/oppna-data/arsutfall/',
    cadence: 'Annual, with preliminary and definitive releases.',
    coverage: 'Annual central-government revenue and expenditure outturns based on Hermes reporting and Riksdag/government budget decisions.',
    primaryUse: 'Yearly budget execution context by appropriation, income title and agency.',
  },
  {
    key: 'manadsutfall',
    title: 'Månadsutfall för statens budget – öppna data',
    url: '/analys-och-statistik/oppna-data/manadsutfall/',
    cadence: 'Monthly.',
    coverage: 'Monthly central-government revenue and expenditure outcomes from January 2006 onward at low-level agency/account granularity.',
    primaryUse: 'High-frequency budget execution context and agency-level fiscal monitoring.',
  },
]);

const DEFAULT_TIMEOUT = 15_000;
const FILE_EXTENSION_RE = /\.(xlsx|xls|csv|zip|docx|pdf)(?:$|[?#])/i;
const HREF_RE = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
const TAG_RE = /<[^>]+>/g;

export class StatskontoretClient {
  readonly baseURL: string;
  readonly timeout: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: StatskontoretClientConfig = {}) {
    this.baseURL = trimTrailingSlash(config.baseURL ?? STATSKONTORET_BASE_URL);
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.fetchFn = config.fetchFn ?? fetch;
  }

  async discoverDownloads(sourceKey: StatskontoretSourceKey): Promise<StatskontoretDownloadLink[]> {
    const source = getStatskontoretSource(sourceKey);
    const pageUrl = resolveStatskontoretUrl(source.url, this.baseURL);
    const html = await this.fetchText(pageUrl);
    return extractStatskontoretDownloadLinks(html, sourceKey, pageUrl, this.baseURL);
  }

  async fetchWorkbook(url: string): Promise<StatskontoretWorkbook> {
    const buffer = await this.fetchArrayBuffer(url);
    return parseStatskontoretXlsx(buffer);
  }

  async fetchCsvZip(url: string): Promise<Record<string, string>> {
    const buffer = await this.fetchArrayBuffer(url);
    return parseStatskontoretCsvZip(buffer);
  }

  async fetchText(url: string): Promise<string> {
    const response = await this.fetchWithTimeout(url);
    return response.text();
  }

  async fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
    const response = await this.fetchWithTimeout(url);
    return response.arrayBuffer();
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const resolved = resolveStatskontoretUrl(url, this.baseURL);
    assertStatskontoretFetchTarget(resolved, this.baseURL);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    let response: Response;
    try {
      response = await this.fetchFn(resolved, {
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/csv,*/*',
        },
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new StatskontoretError(`Statskontoret fetch failed for ${resolved}: ${detail}`, 'http', { cause: error });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      throw new StatskontoretError(`Statskontoret API error: ${response.status} ${response.statusText} for ${response.url}`, 'http');
    }
    return response;
  }
}

export function getStatskontoretSource(key: StatskontoretSourceKey): StatskontoretSourceDefinition {
  const source = STATSKONTORET_SOURCES.find((candidate) => candidate.key === key);
  if (!source) throw new StatskontoretError(`Unknown Statskontoret source: ${key}`);
  return source;
}

export function extractStatskontoretDownloadLinks(
  html: string,
  source: StatskontoretSourceKey,
  sourcePage: string,
  baseURL: string = STATSKONTORET_BASE_URL,
): StatskontoretDownloadLink[] {
  const links: StatskontoretDownloadLink[] = [];
  const pageUpdatedAt = extractPageLastModified(html);
  for (const match of html.matchAll(HREF_RE)) {
    const href = decodeHtml(match[1] ?? '').trim();
    const text = normalizeWhitespace(decodeHtml((match[2] ?? '').replace(TAG_RE, ' ')));
    if (!href) continue;
    const resourceType = classifyStatskontoretResource(href, text);
    if (resourceType === 'unknown') continue;
    const url = resolveStatskontoretUrl(href, baseURL);
    const parsed = new URL(url);
    const year = parseStatskontoretOptionalInt(parsed.searchParams.get('Year'));
    const month = parseStatskontoretOptionalInt(parsed.searchParams.get('month'));
    links.push({
      source,
      sourcePage,
      href,
      url,
      text,
      resourceType,
      ...(parsed.searchParams.get('documentType') ? { documentType: parsed.searchParams.get('documentType') ?? undefined } : {}),
      ...(parsed.searchParams.get('fileType') ? { fileType: parsed.searchParams.get('fileType') ?? undefined } : {}),
      ...(parsed.searchParams.get('fileName') ? { fileName: parsed.searchParams.get('fileName') ?? undefined } : {}),
      ...(year !== undefined ? { year } : {}),
      ...(month !== undefined ? { month } : {}),
      ...(parsed.searchParams.get('status') ? { status: parsed.searchParams.get('status') ?? undefined } : {}),
      ...(pageUpdatedAt ? { updatedAt: pageUpdatedAt } : {}),
    });
  }
  return deduplicateLinks(links);
}

export async function parseStatskontoretXlsx(input: ArrayBuffer | Uint8Array): Promise<StatskontoretWorkbook> {
  const zip = await JSZip.loadAsync(input);
  const workbookXml = await readZipText(zip, 'xl/workbook.xml');
  const workbookRelsXml = await readZipText(zip, 'xl/_rels/workbook.xml.rels');
  const sharedStringsXml = zip.file('xl/sharedStrings.xml')
    ? await readZipText(zip, 'xl/sharedStrings.xml')
    : '';
  const sharedStrings = parseSharedStrings(sharedStringsXml);
  const rels = parseWorkbookRelationships(workbookRelsXml);
  const sheets: StatskontoretSheet[] = [];

  for (const sheet of parseWorkbookSheets(workbookXml)) {
    const target = rels.get(sheet.relationshipId);
    if (!target) continue;
    const sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
    const sheetXml = await readZipText(zip, sheetPath.replace(/\/\.\//g, '/'));
    sheets.push({ name: sheet.name, rows: parseWorksheetRows(sheetXml, sharedStrings) });
  }

  return { sheets };
}

export async function parseStatskontoretCsvZip(input: ArrayBuffer | Uint8Array): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(input);
  const out: Record<string, string> = {};
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!/\.csv$/i.test(name)) continue;
    out[name] = await entry.async('string');
  }
  return out;
}

export function rowsToRecords(rows: readonly (readonly string[])[], headerRowIndex?: number): Record<string, string>[] {
  const resolvedHeaderIndex = headerRowIndex ?? findLikelyHeaderRow(rows);
  if (resolvedHeaderIndex < 0) return [];
  const headers = rows[resolvedHeaderIndex].map((header, index) => header.trim() || `column_${index + 1}`);
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

export function aggregateHeadcountByDepartment(
  records: readonly Record<string, string>[],
  fallbackYear?: number,
): StatskontoretHeadcountRow[] {
  const aggregate = new Map<string, { headcount: number; authorities: Set<string> }>();
  for (const record of records) {
    const lookup = buildRecordLookup(record);
    const year = parseStatskontoretOptionalInt(findField(lookup, ['år', 'ar', 'year']) ?? '') ?? fallbackYear;
    const department = findField(lookup, ['departement', 'departementstillhörighet', 'departementstillhorighet'])?.trim();
    const headcountValue = parseStatskontoretSwedishNumber(findField(lookup, ['årsarbetskrafter', 'arsarbetskrafter', 'åa', 'aa']) ?? '');
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
    : workbook.sheets.find((candidate) => /förteckning|forteckning/i.test(candidate.name)) ?? workbook.sheets[0];
  if (!sheet) return [];
  return aggregateHeadcountByDepartment(rowsToRecords(sheet.rows), options.fallbackYear);
}

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
        'inkomsttitelnamn', 'inkomsttitelgruppsnamn',
        'anslagsnamn', 'utgiftsomradesnamn', 'utgiftsomrade',
        'titel', 'name', 'namn', 'rubrik',
      ])?.trim() ?? '';

    const code = findField(lookup, [
      'inkomsttitel', 'inkomsttitelnummer', 'inkomsttitelnr',
      'anslagsnr', 'anslagsnummer', 'anslagspost',
      'utgiftsomradesnr', 'kod', 'code', 'nummer',
    ])?.trim();

    const outturnRaw = findField(lookup, [
      'utfall', 'outturn', 'utfallmsek', 'utfallbelopp',
      'inkomstutfall', 'utgiftsutfall', 'belopp',
    ]);
    const outturn = parseStatskontoretSwedishNumber(outturnRaw ?? '');
    if (outturn === undefined) continue;

    const budgetRaw = findField(lookup, [
      'budget', 'budgetvarde', 'budgetvärde', 'anvisatbelopp',
      'anvisat', 'statsbidrag', 'ramanslag',
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
  const groups = new Map<string, {
    year: number;
    documentType: string;
    totalOutturn: number;
    totalBudget: number;
    allHaveBudget: boolean;
    rowCount: number;
  }>();

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
      ...(g.allHaveBudget ? {
        totalBudget: g.totalBudget,
        variance: roundOneDecimal(g.totalOutturn - g.totalBudget),
      } : {}),
      rowCount: g.rowCount,
    }))
    .sort(
      (a, b) => a.year - b.year || a.documentType.localeCompare(b.documentType, 'sv'),
    );
}

/** Infer 'Inkomst' / 'Utgift' from common Swedish sheet-name patterns. */
function inferDocTypeFromSheetName(name: string): string | undefined {
  const n = name.toLowerCase();
  if (n.includes('inkomst')) return 'Inkomst';
  if (n.includes('utgift') || n.includes('anslag')) return 'Utgift';
  return undefined;
}

function parseWorkbookSheets(xml: string): Array<{ name: string; relationshipId: string }> {
  const sheets: Array<{ name: string; relationshipId: string }> = [];
  const sheetRe = /<sheet\b([^>]*)\/>/gi;
  for (const match of xml.matchAll(sheetRe)) {
    const attrs = parseXmlAttributes(match[1] ?? '');
    const name = attrs.get('name');
    const relationshipId = attrs.get('r:id') ?? attrs.get('id');
    if (name && relationshipId) sheets.push({ name: decodeXml(name), relationshipId });
  }
  return sheets;
}

function parseWorkbookRelationships(xml: string): Map<string, string> {
  const rels = new Map<string, string>();
  const relRe = /<Relationship\b([^>]*)\/>/gi;
  for (const match of xml.matchAll(relRe)) {
    const attrs = parseXmlAttributes(match[1] ?? '');
    const id = attrs.get('Id');
    const target = attrs.get('Target');
    if (id && target) rels.set(id, target);
  }
  return rels;
}

function parseSharedStrings(xml: string): string[] {
  if (!xml) return [];
  const strings: string[] = [];
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
  for (const match of xml.matchAll(siRe)) {
    strings.push(extractTextNodes(match[1] ?? ''));
  }
  return strings;
}

function parseWorksheetRows(xml: string, sharedStrings: readonly string[]): string[][] {
  const rows: string[][] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  for (const rowMatch of xml.matchAll(rowRe)) {
    const row: string[] = [];
    const cellRe = /<c\b([^>]*)>([\s\S]*?)<\/c>/gi;
    for (const cellMatch of (rowMatch[1] ?? '').matchAll(cellRe)) {
      const attrs = parseXmlAttributes(cellMatch[1] ?? '');
      const ref = attrs.get('r') ?? '';
      const cellIndex = cellRefToColumnIndex(ref) ?? row.length;
      row[cellIndex] = parseCellValue(cellMatch[2] ?? '', attrs.get('t'), sharedStrings);
    }
    rows.push(Array.from({ length: row.length }, (_, i) => row[i] ?? ''));
  }
  return rows;
}

function parseCellValue(xml: string, type: string | undefined, sharedStrings: readonly string[]): string {
  if (type === 'inlineStr') return extractTextNodes(xml);
  const value = firstXmlTagValue(xml, 'v');
  if (value === undefined) return '';
  if (type === 's') return sharedStrings[Number.parseInt(value, 10)] ?? '';
  return decodeXml(value);
}

function findLikelyHeaderRow(rows: readonly (readonly string[])[]): number {
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
      normalized.some((cell) =>
        cell.includes('inkomst') || cell.includes('utgift') || cell.includes('anslag'),
      ),
      normalized.some((cell) => cell === 'ar' || cell.includes('kalenderar') || cell === 'year'),
      normalized.some((cell) => cell.includes('budget') || cell.includes('belopp')),
    ].filter(Boolean).length;
    if (budgetScore >= 2) return i;
  }
  return rows.findIndex((row) => row.filter((cell) => cell.trim()).length >= 2);
}

function buildRecordLookup(record: Record<string, string>): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [key, value] of Object.entries(record)) {
    lookup.set(normalizeKey(key), value);
  }
  return lookup;
}

function findField(lookup: ReadonlyMap<string, string>, candidates: readonly string[]): string | undefined {
  const normalizedCandidates = candidates.map(normalizeKey);
  for (const candidate of normalizedCandidates) {
    const exact = lookup.get(candidate);
    if (exact !== undefined) return exact;
  }
  for (const [key, value] of lookup.entries()) {
    if (normalizedCandidates.some((candidate) => key.includes(candidate))) return value;
  }
  return undefined;
}

export function parseStatskontoretSwedishNumber(value: string): number | undefined {
  const compact = value.replace(/\s/g, '');
  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseStatskontoretOptionalInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function classifyStatskontoretResource(href: string, text: string): StatskontoretResourceType {
  const haystack = `${href} ${text}`.toLowerCase();
  if (haystack.includes('filetype=excel') || /\.xlsx(?:$|[?#])/i.test(href) || /\bexcel\b/i.test(text)) return 'excel';
  if (haystack.includes('filetype=zip') && /\bcsv\b/i.test(text)) return 'csv-zip';
  if (/\.zip(?:$|[?#])/i.test(href)) return /\bcsv\b/i.test(text) ? 'csv-zip' : 'zip';
  if (/\b(csv|zip)\b/i.test(text) && href.includes('GetFile')) return 'csv-zip';
  if (/\.(docx|pdf)(?:$|[?#])/i.test(href)) return 'document';
  if (FILE_EXTENSION_RE.test(href) || href.includes('GetFile')) return 'unknown';
  return 'unknown';
}

function deduplicateLinks(links: readonly StatskontoretDownloadLink[]): StatskontoretDownloadLink[] {
  const seen = new Set<string>();
  const out: StatskontoretDownloadLink[] = [];
  for (const link of links) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    out.push(link);
  }
  return out;
}

function resolveStatskontoretUrl(url: string, baseURL: string): string {
  return new URL(decodeHtml(url), `${trimTrailingSlash(baseURL)}/`).toString();
}

/**
 * Validate that an outbound URL targets the Statskontoret allowlisted host
 * over HTTPS before issuing a fetch. Mirrors the firewall allowlist documented
 * in `analysis/statskontoret/indicators-inventory.json` so absolute URLs from
 * untrusted callers cannot redirect the client to arbitrary hosts.
 */
export function assertStatskontoretFetchTarget(url: string, baseURL: string = STATSKONTORET_BASE_URL): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new StatskontoretError(`Invalid Statskontoret URL: ${url}`, 'http');
  }
  if (parsed.protocol !== 'https:') {
    throw new StatskontoretError(`Statskontoret fetch must use https: ${url}`, 'http');
  }
  const allowedHost = new URL(baseURL).hostname;
  if (parsed.hostname !== allowedHost) {
    throw new StatskontoretError(
      `Statskontoret fetch host ${parsed.hostname} not in allowlist (${allowedHost})`,
      'http',
    );
  }
  return parsed;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function cellRefToColumnIndex(ref: string): number | undefined {
  const letters = ref.match(/^[A-Z]+/i)?.[0];
  if (!letters) return undefined;
  let index = 0;
  for (const char of letters.toUpperCase()) {
    index = index * 26 + (char.charCodeAt(0) - 65 + 1);
  }
  return index - 1;
}

function parseXmlAttributes(input: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const attrRe = /([\w:-]+)=["']([^"']*)["']/g;
  for (const match of input.matchAll(attrRe)) {
    attrs.set(match[1], decodeXml(match[2] ?? ''));
  }
  return attrs;
}

function firstXmlTagValue(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml);
  return match ? decodeXml(match[1] ?? '') : undefined;
}

function extractTextNodes(xml: string): string {
  const parts: string[] = [];
  const textRe = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
  for (const match of xml.matchAll(textRe)) {
    parts.push(decodeXml(match[1] ?? ''));
  }
  return parts.join('');
}

async function readZipText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) throw new StatskontoretError(`Statskontoret workbook missing ${path}`, 'workbook');
  return file.async('string');
}

function extractPageLastModified(html: string): string | undefined {
  const match = /<meta\s+name=["']last-modified["']\s+content=["']([^"']+)["']/i.exec(html);
  return match ? decodeHtml(match[1] ?? '') : undefined;
}

function decodeHtml(value: string): string {
  return decodeHtmlEntities(value).replace(/\u00a0/g, ' ');
}

function decodeXml(value: string): string {
  return decodeHtml(value);
}
