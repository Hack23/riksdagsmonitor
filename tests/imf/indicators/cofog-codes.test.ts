/**
 * NEW invariant test (acceptance criteria of #2620): assert canonical
 * GFS_COFOG codes are in the `GF##_T` form, and that the retired bare
 * `G02`/`G07`/`G09`/`G10` codes are NOT present in the exported catalog.
 *
 * Background: the 2026-05 refactor retired the `G##` form in favour of
 * `GF##_T` (verified live against the IMF GFS dataflow). This test pins
 * that contract so a regression revives the wrong code form.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  COFOG_DEFENCE,
  COFOG_EDUCATION,
  COFOG_HEALTH,
  COFOG_SOCIAL_PROTECTION,
  IMF_GFS_COFOG_CODES,
} from '../../../scripts/imf-client.js';

describe('IMF GFS COFOG codes — canonical GF##_T form', () => {
  it('exposes the four canonical GF##_T codes as named exports', () => {
    expect(COFOG_DEFENCE).toBe('GF02_T');
    expect(COFOG_HEALTH).toBe('GF07_T');
    expect(COFOG_EDUCATION).toBe('GF09_T');
    expect(COFOG_SOCIAL_PROTECTION).toBe('GF10_T');
  });

  it('IMF_GFS_COFOG_CODES catalog contains every GF##_T entry', () => {
    const values = Object.values(IMF_GFS_COFOG_CODES);
    expect(values).toContain('GF02_T');
    expect(values).toContain('GF07_T');
    expect(values).toContain('GF09_T');
    expect(values).toContain('GF10_T');
  });

  it('rejects the retired bare G02 / G07 / G09 / G10 codes', () => {
    const values = Object.values(IMF_GFS_COFOG_CODES) as string[];
    for (const retired of ['G02', 'G07', 'G09', 'G10']) {
      // No value may equal exactly the retired bare form.
      expect(values, `'${retired}' is the retired pre-refactor code form`).not.toContain(retired);
    }
  });

  it('every catalog value matches the GF##_T pattern', () => {
    for (const code of Object.values(IMF_GFS_COFOG_CODES)) {
      expect(code).toMatch(/^GF\d{2}_T$/);
    }
  });
});
