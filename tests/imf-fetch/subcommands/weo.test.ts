/**
 * NEW invariant + smoke test for the `weo` imf-fetch subcommand.
 *
 * Acceptance criteria for #2620:
 *   - DEFAULT_WEO_VINTAGE pinned to 'WEO-2026-04'
 *   - WEO_FETCH_MAX_ATTEMPTS is a positive integer
 *
 * The `runWeo` function itself is exercised end-to-end by the
 * existing tests/imf-fetch-cli.test.ts integration spine.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_WEO_VINTAGE } from '../../../scripts/imf/config/defaults.js';
import { WEO_FETCH_MAX_ATTEMPTS } from '../../../scripts/imf-fetch.js';
import { runWeo } from '../../../scripts/imf-fetch/subcommands/weo.js';

describe('weo subcommand — vintage + retry budget', () => {
  it('DEFAULT_WEO_VINTAGE is pinned to WEO-2026-04 (renderer + provenance reads this label)', () => {
    expect(DEFAULT_WEO_VINTAGE).toBe('WEO-2026-04');
  });

  it('WEO_FETCH_MAX_ATTEMPTS is a positive integer', () => {
    expect(Number.isInteger(WEO_FETCH_MAX_ATTEMPTS)).toBe(true);
    expect(WEO_FETCH_MAX_ATTEMPTS).toBeGreaterThan(0);
  });

  it('runWeo is exported as a function', () => {
    expect(typeof runWeo).toBe('function');
  });
});
