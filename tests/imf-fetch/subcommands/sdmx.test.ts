/**
 * NEW smoke test for the `sdmx` imf-fetch subcommand surface.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { runSdmx } from '../../../scripts/imf-fetch/subcommands/sdmx.js';

describe('sdmx subcommand', () => {
  it('exports runSdmx as a function', () => {
    expect(typeof runSdmx).toBe('function');
  });
});
