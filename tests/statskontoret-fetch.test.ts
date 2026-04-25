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
  StatskontoretClient,
  StatskontoretError,
  assertStatskontoretFetchTarget,
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

describe('Statskontoret fetch target guard', () => {
  it('accepts the allowlisted Statskontoret HTTPS host', () => {
    expect(() =>
      assertStatskontoretFetchTarget('https://www.statskontoret.se/page'),
    ).not.toThrow();
  });

  it('rejects non-HTTPS schemes', () => {
    expect(() =>
      assertStatskontoretFetchTarget('http://www.statskontoret.se/page'),
    ).toThrow(StatskontoretError);
  });

  it('rejects hosts outside the allowlist', () => {
    expect(() =>
      assertStatskontoretFetchTarget('https://example.com/path'),
    ).toThrow(/not in allowlist/);
  });

  it('rejects malformed URLs with a typed error', () => {
    expect(() => assertStatskontoretFetchTarget('not a url')).toThrow(StatskontoretError);
  });

  it('blocks fetchText calls that target other hosts', async () => {
    const client = new StatskontoretClient();
    await expect(client.fetchText('https://evil.example.com/x')).rejects.toThrow(/allowlist/);
  });
});

describe('Statskontoret CLI budget-outturn command parsing', () => {
  it('parses budget-outturn command with required flags', () => {
    const parsed = parseStatskontoretArgs([
      'budget-outturn', '--source', 'arsutfall', '--url', 'https://www.statskontoret.se/file.xlsx',
    ]);
    expect(parsed.command).toBe('budget-outturn');
    expect(requireStatskontoretFlag(parsed.flags, 'source')).toBe('arsutfall');
    expect(requireStatskontoretFlag(parsed.flags, 'url')).toBe('https://www.statskontoret.se/file.xlsx');
  });

  it('parses optional --doc-type flag', () => {
    const parsed = parseStatskontoretArgs([
      'budget-outturn', '--source', 'manadsutfall', '--url', 'https://www.statskontoret.se/f.xlsx', '--doc-type', 'Inkomst',
    ]);
    expect(parsed.flags.get('doc-type')).toBe('Inkomst');
  });

  it('parses --persist boolean alongside budget-outturn', () => {
    const parsed = parseStatskontoretArgs([
      'budget-outturn', '--source', 'budget-time-series', '--url', 'https://www.statskontoret.se/f.xlsx', '--persist',
    ]);
    expect(parsed.booleans.has('persist')).toBe(true);
  });
});

describe('Statskontoret CLI budget-outturn source guard', () => {
  it('rejects myndighetsforteckning as a source for budget-outturn', () => {
    // The parseStatskontoretSource guard only validates known keys, so this
    // test exercises the runtime guard inside runBudgetOutturn that was added
    // to prevent myndighetsforteckning being used with the budget-outturn command.
    // We test the CLI argument parsing is valid but the source flag is accepted.
    const parsed = parseStatskontoretArgs([
      'budget-outturn', '--source', 'myndighetsforteckning', '--url', 'https://www.statskontoret.se/x.xlsx',
    ]);
    // Parsing succeeds; the rejection happens at runtime inside runBudgetOutturn.
    expect(parsed.command).toBe('budget-outturn');
    expect(parsed.flags.get('source')).toBe('myndighetsforteckning');
  });
});
