/**
 * NEW smoke test for the `list-indicators` imf-fetch subcommand surface.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  runListIndicators,
  runListDatamapperIndicators,
} from '../../../scripts/imf-fetch/subcommands/list-indicators.js';

describe('list-indicators subcommand', () => {
  it('exports runListIndicators as a function', () => {
    expect(typeof runListIndicators).toBe('function');
  });

  it('exports runListDatamapperIndicators as a function', () => {
    expect(typeof runListDatamapperIndicators).toBe('function');
  });
});
