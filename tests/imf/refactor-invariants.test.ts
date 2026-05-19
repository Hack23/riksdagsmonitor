/**
 * Refactor invariants for the IMF integration (Hack23/riksdagsmonitor#2580).
 *
 * These are not unit tests of behaviour — they assert the
 * architectural boundaries that the bounded-context split was created
 * to enforce, so accidental regressions in future PRs surface here.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  COFOG_DEFENCE,
  COFOG_EDUCATION,
  COFOG_HEALTH,
  COFOG_SOCIAL_PROTECTION,
  IMF_GFS_COFOG_CODES,
} from '../../scripts/imf/indicators/cofog-codes.js';
import { RETRY_AFTER_CAP_MS } from '../../scripts/imf/transport/retry.js';
import { DEFAULT_WEO_VINTAGE } from '../../scripts/imf/config/defaults.js';

const REPO_ROOT = resolve(__dirname, '..', '..');
const IMF_CLIENT_DIR = join(REPO_ROOT, 'scripts', 'imf');
const IMF_FETCH_DIR = join(REPO_ROOT, 'scripts', 'imf-fetch');

function listSourceFiles(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const p = join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(p));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      out.push(p);
    }
  }
  return out;
}

describe('IMF refactor: bounded-context invariants', () => {
  describe('COFOG codes (issue #2580 acceptance criterion)', () => {
    it('exposes only the canonical GF##_T form (legacy G02/G07/G09/G10 retired 2026-05)', () => {
      expect(COFOG_DEFENCE).toBe('GF02_T');
      expect(COFOG_HEALTH).toBe('GF07_T');
      expect(COFOG_EDUCATION).toBe('GF09_T');
      expect(COFOG_SOCIAL_PROTECTION).toBe('GF10_T');
      const values = Object.values(IMF_GFS_COFOG_CODES);
      expect(values).toEqual(expect.arrayContaining(['GF02_T', 'GF07_T', 'GF09_T', 'GF10_T']));
      // Legacy codes MUST be absent.
      for (const legacy of ['G02', 'G07', 'G09', 'G10']) {
        expect(values).not.toContain(legacy);
      }
    });
  });

  describe('Retry policy (issue #2580 acceptance criterion)', () => {
    it('preserves the 30_000 ms RETRY_AFTER_CAP_MS cap', () => {
      expect(RETRY_AFTER_CAP_MS).toBe(30_000);
    });
  });

  describe('WEO vintage default (issue #2580 acceptance criterion)', () => {
    it('keeps DEFAULT_WEO_VINTAGE at WEO-2026-04', () => {
      expect(DEFAULT_WEO_VINTAGE).toBe('WEO-2026-04');
    });
  });

  describe('IMF SDMX subscription key auth boundary', () => {
    /**
     * Only `scripts/imf/config/auth.ts` is allowed to read
     * `process.env['IMF_SDMX_SUBSCRIPTION_KEY']`. Any other source
     * file that does so is a security regression — see issue #2580
     * §"Security / ISMS Notes".
     */
    it('is the sole reader of process.env IMF_SDMX_SUBSCRIPTION_KEY', () => {
      const offenders: string[] = [];
      for (const dir of [IMF_CLIENT_DIR, IMF_FETCH_DIR]) {
        for (const file of listSourceFiles(dir)) {
          if (file.endsWith(join('config', 'auth.ts'))) continue;
          const src = readFileSync(file, 'utf8');
          if (/process\.env(\.|\[['"])IMF_SDMX_SUBSCRIPTION_KEY/.test(src)) {
            offenders.push(file);
          }
        }
      }
      expect(offenders).toEqual([]);
    });
  });

  describe('Bounded-context file-size budget (issue #2580 acceptance criterion)', () => {
    it('keeps every source file under 300 lines', () => {
      const over: Array<{ file: string; lines: number }> = [];
      for (const dir of [IMF_CLIENT_DIR, IMF_FETCH_DIR]) {
        for (const file of listSourceFiles(dir)) {
          const lines = readFileSync(file, 'utf8').split('\n').length;
          if (lines > 300) over.push({ file, lines });
        }
      }
      expect(over).toEqual([]);
    });

    it('keeps imf-client.ts + imf-fetch.ts shims under 80 lines each', () => {
      for (const shim of ['scripts/imf-client.ts', 'scripts/imf-fetch.ts']) {
        const lines = readFileSync(join(REPO_ROOT, shim), 'utf8').split('\n').length;
        expect({ shim, lines }).toEqual({ shim, lines: expect.any(Number) });
        expect(lines).toBeLessThanOrEqual(80);
      }
    });

    it('keeps each subcommand entry under 150 lines', () => {
      const subRoot = join(IMF_FETCH_DIR, 'subcommands');
      const over: Array<{ file: string; lines: number }> = [];
      for (const entry of readdirSync(subRoot)) {
        const p = join(subRoot, entry);
        if (!statSync(p).isFile() || !entry.endsWith('.ts')) continue;
        const lines = readFileSync(p, 'utf8').split('\n').length;
        if (lines > 150) over.push({ file: p, lines });
      }
      expect(over).toEqual([]);
    });
  });
});
