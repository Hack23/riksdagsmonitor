/**
 * IMF Fiscal Monitor indicator catalog.
 *
 * Migrated from tests/imf-client.test.ts (subset of
 * 'IMF_WEO_INDICATORS / IMF_FM_INDICATORS' covering Fiscal Monitor).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { IMF_FM_INDICATORS } from '../../../scripts/imf-client.js';

describe('IMF_FM_INDICATORS', () => {
  it('exposes Fiscal Monitor indicators', () => {
    expect(IMF_FM_INDICATORS.primaryBalance).toBe('GGXONLB_NGDP');
  });
});
