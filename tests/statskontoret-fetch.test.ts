/** Tests for Statskontoret CLI argument parsing helpers. */

import { describe, it, expect } from 'vitest';
import {
  parseStatskontoretArgs,
  parseStatskontoretSource,
  requireStatskontoretFlag,
} from '../scripts/statskontoret-fetch.js';
import {
  classifyStatskontoretResource,
  parseStatskontoretOptionalInt,
  parseStatskontoretSwedishNumber,
  StatskontoretError,
} from '../scripts/statskontoret-client.js';

describe('Statskontoret CLI parsing', () => {
  it('parses flags and boolean options without executing the CLI', () => {
    const parsed = parseStatskontoretArgs(['discover', '--source', 'arsutfall', '--persist']);

    expect(parsed.command).toBe('discover');
    expect(requireStatskontoretFlag(parsed.flags, 'source')).toBe('arsutfall');
    expect(parsed.booleans.has('persist')).toBe(true);
  });

  it('throws typed CLI errors for invalid input', () => {
    expect(() => parseStatskontoretArgs(['unknown'])).toThrow(StatskontoretError);
    expect(() => requireStatskontoretFlag(new Map(), 'source')).toThrow(/missing required flag/);
    expect(() => parseStatskontoretSource('bad-source')).toThrow(/unknown source/);
  });

  it('accepts built-in source keys', () => {
    expect(parseStatskontoretSource('myndighetsforteckning')).toBe('myndighetsforteckning');
  });
});

describe('Statskontoret parsing primitives', () => {
  it('classifies common downloadable resources', () => {
    expect(classifyStatskontoretResource('/OpenData/GetFile?fileType=Excel', 'Excel')).toBe('excel');
    expect(classifyStatskontoretResource('/OpenData/GetFile?fileType=Zip', 'Csv (10 kB)')).toBe('csv-zip');
    expect(classifyStatskontoretResource('/files/report.pdf', 'Rapport')).toBe('document');
    expect(classifyStatskontoretResource('/page', 'Webbsida')).toBe('unknown');
  });

  it('normalises Swedish numeric and integer values defensively', () => {
    expect(parseStatskontoretSwedishNumber('1 234,5')).toBe(1234.5);
    expect(parseStatskontoretSwedishNumber('not-a-number')).toBeUndefined();
    expect(parseStatskontoretOptionalInt('2026')).toBe(2026);
    expect(parseStatskontoretOptionalInt(null)).toBeUndefined();
  });
});
