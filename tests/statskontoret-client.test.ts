/**
 * Tests for Statskontoret client and parsers.
 *
 * No live network calls — link discovery and XLSX/CSV ZIP parsing use local
 * fixtures.
 */

import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  aggregateHeadcountByDepartment,
  buildBudgetTimeSeries,
  buildHeadcountTimeSeries,
  extractStatskontoretDownloadLinks,
  parseStatskontoretCsvZip,
  parseStatskontoretXlsx,
  parseBudgetRows,
  rowsToRecords,
  StatskontoretClient,
} from '../scripts/statskontoret-client.js';

describe('Statskontoret link discovery', () => {
  it('extracts Excel and CSV ZIP GetFile links with provenance parameters', () => {
    const html = `
      <html><head><meta name="last-modified" content="2026-03-24"/></head><body>
        <a href="/OpenDataArsUtfallPage/GetFile?documentType=Inkomst&amp;fileType=Excel&amp;fileName=%C3%85rsutfall.xlsx&amp;Year=2025&amp;month=0&amp;status=Prelimin%C3%A4r%201">Excel (366,1 kB)</a>
        <a href="/OpenDataArsUtfallPage/GetFile?documentType=Inkomst&amp;fileType=Zip&amp;fileName=%C3%85rsutfall.zip&amp;Year=2025&amp;month=0&amp;status=Prelimin%C3%A4r%201">Csv (152,3 kB)</a>
      </body></html>`;

    const links = extractStatskontoretDownloadLinks(
      html,
      'arsutfall',
      'https://www.statskontoret.se/analys-och-statistik/oppna-data/arsutfall/',
    );

    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({
      source: 'arsutfall',
      resourceType: 'excel',
      documentType: 'Inkomst',
      fileType: 'Excel',
      year: 2025,
      month: 0,
      status: 'Preliminär 1',
      updatedAt: '2026-03-24',
    });
    expect(links[1].resourceType).toBe('csv-zip');
    expect(links[1].url).toContain('fileType=Zip');
  });
});

describe('Statskontoret workbook parsing', () => {
  it('parses XLSX rows and builds department headcount time series', async () => {
    const workbook = await parseStatskontoretXlsx(await createWorkbookFixture());
    expect(workbook.sheets.map((sheet) => sheet.name)).toEqual(['Förteckning 2007–2025']);

    const records = rowsToRecords(workbook.sheets[0].rows);
    expect(records).toHaveLength(4);

    const headcount = buildHeadcountTimeSeries(workbook);
    expect(headcount).toEqual([
      { year: 2024, department: 'Finansdepartementet', headcount: 42.5, authorityCount: 1 },
      { year: 2025, department: 'Finansdepartementet', headcount: 45.5, authorityCount: 2 },
      { year: 2025, department: 'Justitiedepartementet', headcount: 20, authorityCount: 1 },
    ]);
  });

  it('aggregates records with Swedish decimal comma values', () => {
    const rows = aggregateHeadcountByDepartment([
      {
        År: '2025',
        Myndighet: 'Myndighet A',
        Departementstillhörighet: 'Klimat- och näringslivsdepartementet',
        Årsarbetskrafter: '10,5',
      },
      {
        År: '2025',
        Myndighet: 'Myndighet B',
        Departementstillhörighet: 'Klimat- och näringslivsdepartementet',
        Årsarbetskrafter: '1.234,5',
      },
    ]);

    expect(rows).toEqual([
      {
        year: 2025,
        department: 'Klimat- och näringslivsdepartementet',
        headcount: 1245,
        authorityCount: 2,
      },
    ]);
  });
});

describe('Statskontoret CSV ZIP parsing', () => {
  it('extracts CSV files from ZIP archives', async () => {
    const zip = new JSZip();
    zip.file('utfall.csv', 'År;Myndighet;Utfall\n2025;A;100\n');
    zip.file('readme.txt', 'ignored');
    const content = await zip.generateAsync({ type: 'uint8array' });

    const csv = await parseStatskontoretCsvZip(content);
    expect(csv).toEqual({ 'utfall.csv': 'År;Myndighet;Utfall\n2025;A;100\n' });
  });
});

describe('StatskontoretClient', () => {
  it('uses injected fetch for source discovery', async () => {
    const fetchFn = async () => new Response('<a href="/file.xlsx">Excel</a>', { status: 200 });
    const client = new StatskontoretClient({ fetchFn: fetchFn as typeof fetch });
    const links = await client.discoverDownloads('myndighetsforteckning');
    expect(links[0].url).toBe('https://www.statskontoret.se/file.xlsx');
  });

  it('densifies sparse worksheet rows so column alignment is preserved', async () => {
    // Worksheet with explicit cell refs that skip column B, leaving a hole at
    // index 1; densification must fill the gap with '' so headers stay aligned.
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
    zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <sheets><sheet name="Sheet" sheetId="1" r:id="rId1"/></sheets>
      </workbook>`);
    zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
      </Relationships>`);
    zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>
          <row r="1"><c r="A1"><v>h1</v></c><c r="C1"><v>h3</v></c></row>
        </sheetData>
      </worksheet>`);
    const workbook = await parseStatskontoretXlsx(await zip.generateAsync({ type: 'uint8array' }));
    expect(workbook.sheets[0].rows[0]).toEqual(['h1', '', 'h3']);
  });
});

describe('parseBudgetRows', () => {
  it('parses annual income outturn records (årsutfall Inkomst)', () => {
    const records = [
      { År: '2024', Inkomsttitel: '1111', Inkomsttitelnamn: 'Skatt på inkomst', Utfall: '500000', Budget: '480000' },
      { År: '2024', Inkomsttitel: '1211', Inkomsttitelnamn: 'Mervärdesskatt', Utfall: '750000', Budget: '700000' },
    ];
    const rows = parseBudgetRows(records, { documentType: 'Inkomst' });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      year: 2024,
      documentType: 'Inkomst',
      title: 'Skatt på inkomst',
      code: '1111',
      outturn: 500000,
      budget: 480000,
    });
    expect(rows[0].month).toBeUndefined();
  });

  it('parses annual expenditure outturn records (årsutfall Utgift)', () => {
    const records = [
      { År: '2024', Anslagsnamn: 'Riksdagen', Anslagsnr: '1:1', Utfall: '1200', Budget: '1100', Myndighet: 'Riksdagen' },
    ];
    const rows = parseBudgetRows(records, { documentType: 'Utgift' });
    expect(rows[0]).toMatchObject({
      year: 2024,
      documentType: 'Utgift',
      title: 'Riksdagen',
      code: '1:1',
      outturn: 1200,
      budget: 1100,
      agency: 'Riksdagen',
    });
  });

  it('parses monthly outturn records (månadsutfall) with month column', () => {
    const records = [
      { År: '2025', Månad: '3', Inkomsttitelnamn: 'Skatter', Utfall: '42000', Typ: 'Inkomst' },
    ];
    const rows = parseBudgetRows(records);
    expect(rows[0]).toMatchObject({ year: 2025, month: 3, documentType: 'Inkomst', outturn: 42000 });
  });

  it('uses fallback year when the record has no year column', () => {
    const records = [{ Inkomsttitelnamn: 'Skatt', Utfall: '100' }];
    const rows = parseBudgetRows(records, { fallbackYear: 2023, documentType: 'Inkomst' });
    expect(rows[0].year).toBe(2023);
  });

  it('skips records missing an outturn value', () => {
    const records = [
      { År: '2024', Inkomsttitelnamn: 'Titel', Utfall: '' },
      { År: '2024', Inkomsttitelnamn: 'Titel2', Utfall: '100' },
    ];
    expect(parseBudgetRows(records)).toHaveLength(1);
  });

  it('normalises Swedish decimal commas', () => {
    const records = [{ År: '2024', Inkomsttitelnamn: 'X', Utfall: '1.234,5' }];
    expect(parseBudgetRows(records)[0].outturn).toBe(1234.5);
  });
});

describe('buildBudgetTimeSeries', () => {
  it('derives documentType from sheet name and parses all sheets', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
    zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <sheets>
          <sheet name="Inkomst 2024" sheetId="1" r:id="rId1"/>
          <sheet name="Utgift 2024" sheetId="2" r:id="rId2"/>
        </sheets>
      </workbook>`);
    zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
        <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
      </Relationships>`);
    zip.file('xl/sharedStrings.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        ${['Inkomsttitelnamn', 'Utfall', 'Skatt', 'Anslagsnamn', 'Utfall', 'Riksdagen'].map((v) => `<si><t>${v}</t></si>`).join('')}
      </sst>`);
    // Inkomst sheet
    zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>
          <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
          <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>500</v></c></row>
        </sheetData>
      </worksheet>`);
    // Utgift sheet
    zip.file('xl/worksheets/sheet2.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>
          <row r="1"><c r="A1" t="s"><v>3</v></c><c r="B1" t="s"><v>4</v></c></row>
          <row r="2"><c r="A2" t="s"><v>5</v></c><c r="B2"><v>1200</v></c></row>
        </sheetData>
      </worksheet>`);
    const workbook = await parseStatskontoretXlsx(await zip.generateAsync({ type: 'uint8array' }));
    const rows = buildBudgetTimeSeries(workbook, { fallbackYear: 2024 });
    expect(rows.find((r) => r.documentType === 'Inkomst')).toMatchObject({ title: 'Skatt', outturn: 500 });
    expect(rows.find((r) => r.documentType === 'Utgift')).toMatchObject({ title: 'Riksdagen', outturn: 1200 });
  });
});


async function createWorkbookFixture(): Promise<Uint8Array> {
  // Minimal XLSX fixture mirroring the Statskontoret assumptions documented in
  // analysis/statskontoret/data-dictionary.md: a workbook sheet whose header row
  // contains År, Myndighet, Departement and Årsarbetskrafter.
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <sheets><sheet name="Förteckning 2007–2025" sheetId="1" r:id="rId1"/></sheets>
    </workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
    </Relationships>`);
  zip.file('xl/sharedStrings.xml', `<?xml version="1.0" encoding="UTF-8"?>
    <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      ${['År', 'Myndighet', 'Departement', 'Årsarbetskrafter', 'Myndighet A', 'Finansdepartementet', 'Myndighet B', 'Justitiedepartementet', 'Myndighet C']
        .map((value) => `<si><t>${value}</t></si>`).join('')}
    </sst>`);
  zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?>
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>
        <row r="2"><c r="A2"><v>2025</v></c><c r="B2" t="s"><v>4</v></c><c r="C2" t="s"><v>5</v></c><c r="D2"><v>10.5</v></c></row>
        <row r="3"><c r="A3"><v>2025</v></c><c r="B3" t="s"><v>6</v></c><c r="C3" t="s"><v>7</v></c><c r="D3"><v>20</v></c></row>
        <row r="4"><c r="A4"><v>2024</v></c><c r="B4" t="s"><v>8</v></c><c r="C4" t="s"><v>5</v></c><c r="D4"><v>42.5</v></c></row>
        <row r="5"><c r="A5"><v>2025</v></c><c r="B5" t="s"><v>8</v></c><c r="C5" t="s"><v>5</v></c><c r="D5"><v>35</v></c></row>
      </sheetData>
    </worksheet>`);
  return zip.generateAsync({ type: 'uint8array' });
}
