/**
 * Generates `cypress/fixtures/csv-contracts.json` from the canonical
 * `src/browser/cia/csv-contracts.ts` registry.
 *
 * Cypress runs its specs through a webpack pipeline that cannot
 * consume the project's vite/typescript module graph reliably (it
 * stalls on the project root `tsconfig.json` and on browser-only
 * `import`s). The runtime CSV-contract Cypress spec therefore loads
 * a tiny JSON fixture produced from the same single-source-of-truth
 * TypeScript module, keeping the registry one-write-many-read.
 *
 * Invoke as a npm script (`npm run build:csv-contracts-fixture`) or
 * directly: `npx tsx scripts/build-csv-contracts-fixture.ts`.
 *
 * The script is intentionally tiny and dependency-free — it imports
 * the contracts module via `tsx` (which honours TS path resolution
 * for the source file but does not require building dist/).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CSV_CONTRACTS } from '../src/browser/cia/csv-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT = join(REPO_ROOT, 'cypress', 'fixtures', 'csv-contracts.json');

mkdirSync(dirname(OUT), { recursive: true });

const payload = {
  generatedAt: new Date().toISOString(),
  contracts: CSV_CONTRACTS.map((c) => ({
    dashboard: c.dashboard,
    path: c.path,
    requiredColumns: c.requiredColumns,
    minRows: c.minRows ?? 1,
  })),
};

writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
// eslint-disable-next-line no-console
console.log(`[csv-contracts] wrote ${payload.contracts.length} contracts → ${OUT}`);
