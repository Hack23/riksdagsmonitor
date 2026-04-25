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
  buildHeadcountTimeSeries,
  extractStatskontoretDownloadLinks,
  parseStatskontoretCsvZip,
  parseStatskontoretXlsx,
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
    expect(records).toHaveLength(3);

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
        Årsarbetskrafter: '4.25',
      },
    ]);

    expect(rows).toEqual([
      {
        year: 2025,
        department: 'Klimat- och näringslivsdepartementet',
        headcount: 14.8,
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
});

async function createWorkbookFixture(): Promise<Uint8Array> {
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
