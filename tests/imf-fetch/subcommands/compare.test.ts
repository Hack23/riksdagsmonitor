/**
 * NEW smoke test for the `compare` imf-fetch subcommand surface.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { runCompare } from '../../../scripts/imf-fetch/subcommands/compare.js';

describe('compare subcommand', () => {
  it('exports runCompare as a function', () => {
    expect(typeof runCompare).toBe('function');
  });
});
