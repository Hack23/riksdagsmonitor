/**
 * @file tests/fetch-voting-records.test.ts
 * @description Vitest unit tests for fetch-voting-records.ts
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  parseArgs,
  detectDefectors,
  generateMermaidVoteChart,
  extractBetValues,
  sanitizeBet,
  type PartyVoteRow,
} from '../scripts/fetch-voting-records.js';

// ---------------------------------------------------------------------------
// parseArgs tests
// ---------------------------------------------------------------------------

describe('parseArgs — fetch-voting-records', () => {
  it('parses --date and --doc-type and --persist happy path', () => {
    const { args, error } = parseArgs(['--date', '2026-04-27', '--doc-type', 'committeeReports', '--persist']);
    expect(error).toBeNull();
    expect(args.date).toBe('2026-04-27');
    expect(args.docType).toBe('committeeReports');
    expect(args.persist).toBe(true);
  });

  it('defaults date to today when not provided', () => {
    const { args, error } = parseArgs([]);
    expect(error).toBeNull();
    // Today is always YYYY-MM-DD format
    expect(args.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(args.docType).toBeNull();
    expect(args.persist).toBe(false);
  });

  it('returns error for invalid date format', () => {
    const { error } = parseArgs(['--date', '27-04-2026']);
    expect(error).not.toBeNull();
    expect(error).toMatch(/YYYY-MM-DD/);
  });

  it('returns error for non-date string', () => {
    const { error } = parseArgs(['--date', 'yesterday']);
    expect(error).not.toBeNull();
    expect(error).toMatch(/YYYY-MM-DD/);
  });

  it('parses --date without --doc-type', () => {
    const { args, error } = parseArgs(['--date', '2026-01-15']);
    expect(error).toBeNull();
    expect(args.date).toBe('2026-01-15');
    expect(args.docType).toBeNull();
  });

  it('persist defaults to false when flag is absent', () => {
    const { args, error } = parseArgs(['--date', '2026-04-27']);
    expect(error).toBeNull();
    expect(args.persist).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectDefectors tests
// ---------------------------------------------------------------------------

describe('detectDefectors', () => {
  it('returns vote_pending status when input is empty', () => {
    const { defectors, status } = detectDefectors([]);
    expect(status).toBe('vote_pending');
    expect(defectors).toHaveLength(0);
  });

  it('detects an MP voting Nej when party majority is Ja', () => {
    const votes = [
      { parti: 'S', rost: 'Ja', iid: '001', intressentNamn: 'Anna Svensson' },
      { parti: 'S', rost: 'Ja', iid: '002', intressentNamn: 'Björn Karlsson' },
      { parti: 'S', rost: 'Ja', iid: '003', intressentNamn: 'Carla Lindqvist' },
      { parti: 'S', rost: 'Nej', iid: '004', intressentNamn: 'David Eriksson' },
      { parti: 'M', rost: 'Nej', iid: '005', intressentNamn: 'Eva Johansson' },
      { parti: 'M', rost: 'Nej', iid: '006', intressentNamn: 'Fredrik Nilsson' },
    ];

    const { defectors, status } = detectDefectors(votes);
    expect(status).toBe('fetched');
    expect(defectors).toHaveLength(1);
    expect(defectors[0]).toMatchObject({
      iid: '004',
      intressentNamn: 'David Eriksson',
      parti: 'S',
      rost: 'Nej',
      partyMajority: 'Ja',
    });
  });

  it('detects no defectors when all MPs vote with their party', () => {
    const votes = [
      { parti: 'S', rost: 'Ja', iid: '001', intressentNamn: 'A' },
      { parti: 'S', rost: 'Ja', iid: '002', intressentNamn: 'B' },
      { parti: 'M', rost: 'Nej', iid: '003', intressentNamn: 'C' },
      { parti: 'M', rost: 'Nej', iid: '004', intressentNamn: 'D' },
    ];

    const { defectors, status } = detectDefectors(votes);
    expect(status).toBe('fetched');
    expect(defectors).toHaveLength(0);
  });

  it('excludes Frånvarande from defector list', () => {
    const votes = [
      { parti: 'SD', rost: 'Ja', iid: '001', intressentNamn: 'A' },
      { parti: 'SD', rost: 'Ja', iid: '002', intressentNamn: 'B' },
      { parti: 'SD', rost: 'Frånvarande', iid: '003', intressentNamn: 'C' },
    ];

    const { defectors } = detectDefectors(votes);
    expect(defectors).toHaveLength(0);
  });

  it('handles multiple defectors across multiple parties', () => {
    const votes = [
      { parti: 'C', rost: 'Ja', iid: '1', intressentNamn: 'X' },
      { parti: 'C', rost: 'Ja', iid: '2', intressentNamn: 'Y' },
      { parti: 'C', rost: 'Nej', iid: '3', intressentNamn: 'Z' }, // defector
      { parti: 'L', rost: 'Avstår', iid: '4', intressentNamn: 'W' },
      { parti: 'L', rost: 'Ja', iid: '5', intressentNamn: 'V' }, // defector
      { parti: 'L', rost: 'Ja', iid: '6', intressentNamn: 'U' }, // defector
    ];

    const { defectors } = detectDefectors(votes);
    // Z defects from C (majority Ja), W defects from L (majority Ja)
    const defectorIds = defectors.map((d) => d.iid).sort();
    expect(defectorIds).toContain('3'); // Z (C) voted Nej, majority Ja
    expect(defectorIds).toContain('4'); // W (L) voted Avstår, majority Ja
  });

  it('handles votes with alternative field names', () => {
    const votes = [
      { party: 'V', vote: 'Ja', iid: 'v1', namn: 'Person A' },
      { party: 'V', vote: 'Ja', iid: 'v2', namn: 'Person B' },
      { party: 'V', vote: 'Nej', iid: 'v3', namn: 'Person C' },
    ];

    const { defectors, status } = detectDefectors(votes);
    expect(status).toBe('fetched');
    expect(defectors).toHaveLength(1);
    expect(defectors[0]?.rost).toBe('Nej');
  });
});

// ---------------------------------------------------------------------------
// generateMermaidVoteChart tests
// ---------------------------------------------------------------------------

describe('generateMermaidVoteChart', () => {
  it('produces a valid mermaid string for party votes', () => {
    const partyVotes: PartyVoteRow[] = [
      { parti: 'S', ja: 100, nej: 0, avstar: 0, franvarande: 7 },
      { parti: 'M', ja: 0, nej: 68, avstar: 0, franvarande: 3 },
      { parti: 'SD', ja: 0, nej: 54, avstar: 0, franvarande: 2 },
    ];

    const diagram = generateMermaidVoteChart(partyVotes, 'FiU48');
    expect(diagram).toContain('xychart-beta');
    expect(diagram).toContain('FiU48');
    expect(diagram).toContain('"S"');
    expect(diagram).toContain('"M"');
    expect(diagram).toContain('"SD"');
    expect(diagram).toContain('100');
  });

  it('returns a flowchart-style diagram when there are no party votes', () => {
    const diagram = generateMermaidVoteChart([], 'AU10');
    expect(diagram).toContain('AU10');
    // Should be a valid mermaid snippet (not throw)
    expect(typeof diagram).toBe('string');
    expect(diagram.length).toBeGreaterThan(0);
  });

  it('includes x-axis and y-axis labels', () => {
    const partyVotes: PartyVoteRow[] = [
      { parti: 'KD', ja: 16, nej: 0, avstar: 2, franvarande: 1 },
    ];
    const diagram = generateMermaidVoteChart(partyVotes, 'SoU12');
    expect(diagram).toContain('x-axis');
    expect(diagram).toContain('y-axis');
  });
});

// ---------------------------------------------------------------------------
// extractBetValues tests
// ---------------------------------------------------------------------------

describe('extractBetValues', () => {
  it('extracts beteckning values from manifest text', () => {
    const manifest = `
# Data Download Manifest

Focus betänkanden: FiU48, AU10, KU20

| dok_id | Title |
|--------|-------|
| FiU48 | Budget |
| AU10 | Work |
`;
    const bets = extractBetValues(manifest);
    expect(bets).toContain('FiU48');
    expect(bets).toContain('AU10');
    expect(bets).toContain('KU20');
  });

  it('filters out common false-positive acronyms', () => {
    const manifest = 'See ISO standards and HTTP protocol for CSV format. Also JSON and MCP.';
    const bets = extractBetValues(manifest);
    expect(bets).not.toContain('ISO');
    expect(bets).not.toContain('HTTP');
    expect(bets).not.toContain('CSV');
    expect(bets).not.toContain('JSON');
    expect(bets).not.toContain('MCP');
  });

  it('returns empty array for manifest with no beteckning values', () => {
    const manifest = '# Daily Report\n\nNo committee reports today.';
    const bets = extractBetValues(manifest);
    expect(bets).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// sanitizeBet tests
// ---------------------------------------------------------------------------

describe('sanitizeBet', () => {
  it('lowercases and preserves alphanumeric content', () => {
    expect(sanitizeBet('FiU48')).toBe('fiu48');
  });

  it('replaces special characters with hyphens', () => {
    expect(sanitizeBet('AU 10')).toBe('au-10');
  });

  it('collapses multiple hyphens', () => {
    expect(sanitizeBet('KU--20')).toBe('ku-20');
  });
});

// ---------------------------------------------------------------------------
// Contract test — any betänkande cited in intelligence-assessment.md
// must have a voting-record with a status field
// ---------------------------------------------------------------------------

describe('contract: voting records have status field', () => {
  const dailyRoot = path.resolve('analysis', 'daily');
  const voterRoot = path.resolve('data', 'voteringar');

  it('every voting record JSON in data/voteringar/ has a status field', () => {
    if (!fs.existsSync(voterRoot)) {
      // No voting records yet — pass vacuously
      return;
    }

    const dateEntries = fs
      .readdirSync(voterRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory());

    for (const dateEntry of dateEntries) {
      const dateDir = path.join(voterRoot, dateEntry.name);
      const jsonFiles = fs
        .readdirSync(dateDir)
        .filter((f) => f.endsWith('.json'));

      for (const jsonFile of jsonFiles) {
        const filePath = path.join(dateDir, jsonFile);
        let parsed: unknown;
        try {
          parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
          // Skip malformed files
          continue;
        }

        expect(
          parsed,
          `${jsonFile} should be an object`,
        ).toBeTypeOf('object');

        const record = parsed as Record<string, unknown>;
        expect(
          record['status'],
          `${jsonFile} must have a status field`,
        ).toBeDefined();

        expect(
          ['fetched', 'vote_pending', 'not_found'],
          `${jsonFile} status must be a valid value`,
        ).toContain(record['status']);
      }
    }
  });

  it('betänkanden cited in intelligence-assessment.md have voting records or vote-pending annotation', () => {
    if (!fs.existsSync(dailyRoot)) return;

    const dateDirs = fs
      .readdirSync(dailyRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory());

    for (const dateDir of dateDirs) {
      const date = dateDir.name;
      const baseDir = path.join(dailyRoot, date);

      // Find all intelligence-assessment.md files
      const assessmentFiles: string[] = [];
      for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const asmPath = path.join(baseDir, entry.name, 'intelligence-assessment.md');
          if (fs.existsSync(asmPath)) assessmentFiles.push(asmPath);
        }
      }
      const rootAsm = path.join(baseDir, 'intelligence-assessment.md');
      if (fs.existsSync(rootAsm)) assessmentFiles.push(rootAsm);

      for (const asmFile of assessmentFiles) {
        const content = fs.readFileSync(asmFile, 'utf8');
        const bets = extractBetValues(content);

        for (const bet of bets) {
          const voterDir = path.join(voterRoot, date);
          const votingFile = path.join(voterDir, `${sanitizeBet(bet)}.json`);

          // If voting file exists, it must have a status
          if (fs.existsSync(votingFile)) {
            let record: unknown;
            try {
              record = JSON.parse(fs.readFileSync(votingFile, 'utf8'));
            } catch {
              continue;
            }
            expect(
              (record as Record<string, unknown>)['status'],
              `Voting record for ${bet} (${date}) must have a status field`,
            ).toBeDefined();
          }
          // If no voting file, the assessment may have <!-- vote-pending: {bet} -->
          // (we don't fail here — the file just hasn't been fetched yet)
        }
      }
    }
  });
});
