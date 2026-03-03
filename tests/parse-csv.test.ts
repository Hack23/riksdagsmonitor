/**
 * Tests for CSP-compatible CSV parsing (parseCSV).
 *
 * Validates that parseCSV works with PapaParse (primary) and
 * the built-in simple parser (fallback), without requiring
 * unsafe-eval via d3.csvParse.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseCSV } from '../src/browser/shared/data-loader.js';

const SAMPLE_CSV = `name,party,score
Anna Andersson,S,7.2
Erik Eriksson,M,4.5
Maria Nilsson,SD,8.1`;

describe('parseCSV', () => {
  let savedPapa: unknown;
  let papaExisted: boolean;

  beforeEach(() => {
    papaExisted = 'Papa' in globalThis;
    savedPapa = (globalThis as any).Papa;
  });

  afterEach(() => {
    if (papaExisted) {
      (globalThis as any).Papa = savedPapa;
    } else {
      delete (globalThis as any).Papa;
    }
  });

  describe('with PapaParse available', () => {
    beforeEach(() => {
      // Provide a mock PapaParse that behaves like the real one
      (globalThis as any).Papa = {
        parse(text: string, config: { header: boolean; skipEmptyLines: boolean }) {
          const lines = text.trim().split('\n');
          const headers = lines[0]!.split(',');
          const data = lines.slice(1).filter((l) => config.skipEmptyLines ? l.trim() : true).map((line) => {
            const values = line.split(',');
            const row: Record<string, string> = {};
            headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
            return row;
          });
          return { data };
        },
      };
    });

    it('should parse CSV with headers', () => {
      const rows = parseCSV(SAMPLE_CSV);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual({ name: 'Anna Andersson', party: 'S', score: '7.2' });
    });

    it('should return empty array for empty input', () => {
      expect(parseCSV('')).toEqual([]);
    });

    it('should return empty array for header-only CSV', () => {
      expect(parseCSV('name,party\n')).toEqual([]);
    });
  });

  describe('without PapaParse (CSP-safe fallback)', () => {
    beforeEach(() => {
      // Remove PapaParse to exercise the fallback parser
      delete (globalThis as any).Papa;
    });

    it('should parse CSV with headers using fallback parser', () => {
      const rows = parseCSV(SAMPLE_CSV);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual({ name: 'Anna Andersson', party: 'S', score: '7.2' });
      expect(rows[2]).toEqual({ name: 'Maria Nilsson', party: 'SD', score: '8.1' });
    });

    it('should return empty array for empty input', () => {
      expect(parseCSV('')).toEqual([]);
    });

    it('should return empty array for header-only CSV', () => {
      expect(parseCSV('name,party')).toEqual([]);
    });

    it('should handle quoted fields', () => {
      const csv = `"name","party"\n"Anna ""A"" Andersson","S"`;
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0]!['name']).toContain('Anna');
    });

    it('should skip empty lines', () => {
      const csv = `name,score\nAnna,7\n\nErik,4\n`;
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(2);
    });

    it('should not use d3.csvParse (CSP-unsafe)', () => {
      // Ensure d3.csvParse is not called even when available
      let d3Called = false;
      (globalThis as any).d3 = {
        csvParse: () => { d3Called = true; return []; },
      };
      parseCSV(SAMPLE_CSV);
      expect(d3Called).toBe(false);
      delete (globalThis as any).d3;
    });
  });
});
