/**
 * Cypress runtime CSV contract spec.
 *
 * For every CSV declared in `src/browser/cia/csv-contracts.ts` (read
 * here via the JSON fixture produced by
 * `scripts/build-csv-contracts-fixture.ts`) this spec asserts, against
 * the running Vite preview / production server:
 *
 *   1. HTTP 200
 *   2. Response is served with a CSV-shaped content-type
 *      (text/csv | text/plain | application/octet-stream | application/csv)
 *   3. Header row contains every canonical column required by the
 *      contract (NO legacy column fallbacks — schema drift fails)
 *   4. At least the declared minimum number of data rows
 *
 * This complements the build-time vitest contract test
 * (`tests/cia-csv-contracts.test.ts`): vitest guards the *source*
 * tree, Cypress guards what the *deploy pipeline* actually serves.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const CSV_CONTENT_TYPES = [
  'text/csv',
  'text/plain',
  'application/octet-stream',
  'application/csv',
];

function parseHeaderRow(csv) {
  const firstLine = String(csv).split(/\r?\n/)[0] ?? '';
  return firstLine.split(',').map((s) => s.trim());
}

function countDataRows(csv) {
  const lines = String(csv).split(/\r?\n/).filter((l) => l.length > 0);
  return Math.max(0, lines.length - 1);
}

describe('CSV contracts — every dashboard CSV is served with the canonical schema', () => {
  it('fixture covers every dashboard listed in the issue', () => {
    cy.fixture('csv-contracts.json').then((fx) => {
      const expected = [
        'cia-hub',
        'parties',
        'committees',
        'coalitions',
        'election-cycle',
        'seasonal-patterns',
        'pre-election',
        'anomaly-detection',
        'ministers',
        'risk',
      ];
      const covered = new Set(fx.contracts.map((c) => c.dashboard));
      for (const d of expected) {
        expect(covered, `contracts include dashboard "${d}"`).to.include(d);
      }
      expect(fx.contracts.length, 'at least one contract per dashboard').to.be.gte(
        expected.length,
      );
    });
  });

  it('every contract serves canonical headers and ≥ minRows data rows', () => {
    cy.fixture('csv-contracts.json').then((fx) => {
      // Issue one request per contract in parallel via Cypress promise
      // chains. cy.request() retries automatically on transient
      // failures so this is stable on a healthy preview server.
      const checks = fx.contracts.map((contract) =>
        cy
          .request({
            url: contract.path,
            encoding: 'utf-8',
            failOnStatusCode: false,
          })
          .then((res) => {
            expect(res.status, `GET ${contract.path}`).to.eq(200);

            const ct = String(res.headers['content-type'] ?? '')
              .split(';')[0]
              .trim()
              .toLowerCase();
            expect(
              CSV_CONTENT_TYPES,
              `${contract.path} content-type "${ct}" should be CSV-shaped`,
            ).to.include(ct);

            const header = parseHeaderRow(res.body);
            const headerSet = new Set(header);
            const missing = contract.requiredColumns.filter((c) => !headerSet.has(c));
            expect(
              missing,
              `${contract.path} missing canonical columns; header was [${header.join(', ')}]`,
            ).to.deep.equal([]);

            const rowCount = countDataRows(res.body);
            const minRows = contract.minRows ?? 1;
            expect(rowCount, `${contract.path} produced ${rowCount} rows`).to.be.gte(minRows);
          }),
      );
      return Cypress.Promise.all(checks);
    });
  });
});
