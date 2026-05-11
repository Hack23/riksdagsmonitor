/**
 * @file Regression: dashboard CSV URLs use absolute `/cia-data/…` paths.
 *
 * Several dashboards live at `/dashboards/<slug>.html`. A bare
 * `cia-data/…` prefix in their CSV URLs would resolve to
 * `/dashboards/cia-data/…` and 404, forcing every load to fall through
 * to the GitHub-raw fallback. Local CSVs are copied to `dist/cia-data/`
 * by the `postbuild` script and uploaded to S3 with `text/csv` headers,
 * so the local-first hop must use a root-relative URL.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

/** Modules whose source must not contain a bare `'cia-data/...'` literal. */
const DASHBOARD_MODULES = [
  'src/browser/dashboards/stats-loader.ts',
  'src/browser/dashboards/party-dashboard.ts',
  'src/browser/dashboards/election-cycle.ts',
  'src/browser/dashboards/committees-dashboard.ts',
  'src/browser/dashboards/coalition-dashboard.ts',
  'src/browser/dashboards/seasonal-patterns.ts',
  'src/browser/dashboards/pre-election.ts',
  'src/browser/dashboards/anomaly-detection.ts',
  'src/browser/dashboards/ministry-dashboard.ts',
  'src/browser/dashboards/risk-dashboard.ts',
  'src/browser/dashboards/politician-dashboard.ts',
  'src/browser/cia/data-loader.ts',
];

/**
 * Match any string-literal CSV URL whose path begins with `cia-data/`
 * (i.e. relative). We deliberately scan only string literals to avoid
 * false positives from comments, log messages, and JSDoc references.
 */
const RELATIVE_CIA_DATA_LITERAL =
  /(['"`])(?:\.\.\/)?cia-data\/[^'"`]+\1/g;

describe('Dashboard modules use absolute /cia-data/ URLs', () => {
  for (const modulePath of DASHBOARD_MODULES) {
    it(`${modulePath} should not contain relative cia-data/ string literals`, () => {
      const src = readFileSync(resolve(ROOT, modulePath), 'utf8');

      // Strip line and block comments so doc-comments referencing the
      // path don't trip the regex.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');

      const matches = stripped.match(RELATIVE_CIA_DATA_LITERAL) ?? [];
      expect(
        matches,
        `Found relative cia-data/ literals in ${modulePath}: ${matches.join(', ')}. ` +
          `Use absolute "/cia-data/…" so the URL works from /dashboards/<slug>.html ` +
          `(a bare cia-data/ would resolve to /dashboards/cia-data/ and 404).`,
      ).toEqual([]);
    });
  }
});
