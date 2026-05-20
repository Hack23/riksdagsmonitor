/**
 * CLI / manifest helpers — parseCalendarArgs + formatManifestMarkdown.
 *
 * Migrated verbatim from tests/fetch-calendar.test.ts (describes
 * 'parseCalendarArgs' and 'formatManifestMarkdown').
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  parseCalendarArgs,
  formatManifestMarkdown,
  CliArgsError,
} from '../../scripts/fetch-calendar.js';

describe('parseCalendarArgs', () => {
  it('parses --from and --to flags', () => {
    const args = parseCalendarArgs(['--from', '2026-04-28', '--to', '2026-05-04']);
    expect(args.from).toBe('2026-04-28');
    expect(args.to).toBe('2026-05-04');
    expect(args.persist).toBe(false);
  });

  it('sets persist=true when --persist flag is present', () => {
    const args = parseCalendarArgs(['--from', '2026-04-28', '--to', '2026-05-04', '--persist']);
    expect(args.persist).toBe(true);
  });

  it('throws when --from is missing', () => {
    expect(() => parseCalendarArgs(['--to', '2026-05-04'])).toThrow(/--from/);
  });

  it('throws when --to is missing', () => {
    expect(() => parseCalendarArgs(['--from', '2026-04-28'])).toThrow(/--to/);
  });

  it('throws when date format is invalid', () => {
    expect(() =>
      parseCalendarArgs(['--from', '28-04-2026', '--to', '2026-05-04']),
    ).toThrow(/ISO 8601/);
  });

  it('accepts --tom as an alias for --to (Swedish, used in repo docs)', () => {
    const args = parseCalendarArgs(['--from', '2026-04-28', '--tom', '2026-05-04']);
    expect(args.from).toBe('2026-04-28');
    expect(args.to).toBe('2026-05-04');
  });

  it('prefers --to over --tom when both are provided', () => {
    const args = parseCalendarArgs([
      '--from', '2026-04-28',
      '--to', '2026-05-04',
      '--tom', '2026-05-31',
    ]);
    expect(args.to).toBe('2026-05-04');
  });

  it('throws CliArgsError (typed) for invalid arguments', () => {
    expect(() => parseCalendarArgs(['--to', '2026-05-04'])).toThrow(CliArgsError);
    expect(() =>
      parseCalendarArgs(['--from', 'bogus', '--to', '2026-05-04']),
    ).toThrow(CliArgsError);
  });
});

describe('formatManifestMarkdown', () => {
  it('formats a successful MCP primary manifest', () => {
    const md = formatManifestMarkdown({
      date: '2026-04-28',
      dateTo: '2026-05-04',
      path: 'mcp-primary',
      eventCount: 5,
      fetchedAt: '2026-04-28T06:00:00Z',
    });
    expect(md).toContain('MCP primary');
    expect(md).toContain('**Events**: 5');
    expect(md).not.toContain('error');
  });

  it('formats a web fallback manifest with primary error', () => {
    const md = formatManifestMarkdown({
      date: '2026-04-28',
      dateTo: '2026-05-04',
      path: 'web-fallback',
      eventCount: 3,
      primaryError: 'MCP returned HTML instead of JSON',
      fetchedAt: '2026-04-28T06:00:00Z',
    });
    expect(md).toContain('Web fallback');
    expect(md).toContain('Primary error');
    expect(md).toContain('MCP returned HTML');
  });

  it('formats a none (both failed) manifest', () => {
    const md = formatManifestMarkdown({
      date: '2026-04-28',
      dateTo: '2026-05-04',
      path: 'none',
      eventCount: 0,
      primaryError: 'ECONNREFUSED',
      fallbackError: 'EHOSTUNREACH',
      fetchedAt: '2026-04-28T06:00:00Z',
    });
    expect(md).toContain('None');
    expect(md).toContain('Fallback error');
  });
});
