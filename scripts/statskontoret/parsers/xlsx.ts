/**
 * @module scripts/statskontoret/parsers/xlsx
 * @description Defensive XLSX workbook parser for Statskontoret workbooks.
 *
 * Operates directly on the OOXML zip envelope so the client doesn't depend
 * on a full SpreadsheetML library — only `jszip` is required.  Isolating
 * the parser makes it easy to add fuzz tests against malformed workbooks.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import JSZip from 'jszip';

import { StatskontoretError } from '../errors.js';
import type { StatskontoretSheet, StatskontoretWorkbook } from '../types.js';
import {
  decodeXml,
  extractTextNodes,
  firstXmlTagValue,
  parseXmlAttributes,
} from '../internal/text.js';

export async function parseStatskontoretXlsx(
  input: ArrayBuffer | Uint8Array,
): Promise<StatskontoretWorkbook> {
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

function parseCellValue(
  xml: string,
  type: string | undefined,
  sharedStrings: readonly string[],
): string {
  if (type === 'inlineStr') return extractTextNodes(xml);
  const value = firstXmlTagValue(xml, 'v');
  if (value === undefined) return '';
  if (type === 's') return sharedStrings[Number.parseInt(value, 10)] ?? '';
  return decodeXml(value);
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

async function readZipText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) throw new StatskontoretError(`Statskontoret workbook missing ${path}`, 'workbook');
  return file.async('string');
}
