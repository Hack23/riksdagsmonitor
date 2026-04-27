/**
 * Unit and integration tests for `scripts/rir-followups-client.ts`.
 *
 * Most tests use synthetic data. The dataset-load/save helpers are primarily
 * exercised by injecting mock read/write functions so the unit tests remain
 * stable regardless of the content of `data/rir-followups.json`. This file
 * also includes an integration check that reads the real dataset from
 * `data/rir-followups.json` via file system I/O.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateSkrivelseDeadline,
  calculateSkrivelsDeadline,
  daysOverdue,
  deriveResponseStatus,
  detectOverdueAlerts,
  renderRirFollowUpTable,
  injectRirTableIntoDocument,
  filterByCommittee,
  filterByStatus,
  filterByMinRiskLevel,
  validateRirRecord,
  validateRirDataset,
  loadRirDataset,
  saveRirDataset,
  CONSTITUTIONAL_DEADLINE_MONTHS,
  RIR_SKRIVELSE_DOKTYP,
  RIR_SKRIVELSE_SUBTYP,
} from '../scripts/rir-followups-client.js';
import type {
  RirFollowUpRecord,
  RirFollowUpsDataset,
} from '../scripts/rir-followups-client.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RECORD_PENDING: RirFollowUpRecord = {
  rir_report_id: 'HD01JuU31',
  rir_number: 'RiR 2026:6',
  title: 'Polisreform — granskning',
  title_en: 'Police reform audit',
  agency: 'Polismyndigheten',
  policy_area: 'Justitia',
  committees: ['JuU'],
  publish_date: '2026-01-15',
  skrivelse_deadline: '2026-05-15',
  gov_response_status: 'PENDING',
  response_skrivelse_id: null,
  parliamentary_followup_doc_ids: ['HD01JuU31'],
  open_recommendations: 9,
  risk_level: 'HIGH',
  notes: 'Test pending record',
  riksdag_url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/HD01JuU31/',
};

const RECORD_OVERDUE: RirFollowUpRecord = {
  rir_report_id: 'HC03206',
  rir_number: 'RiR 2025:18',
  title: 'Civilt försvar — granskning',
  title_en: 'Civil defence audit',
  agency: 'MSB',
  policy_area: 'Försvar och säkerhet',
  committees: ['FöU'],
  publish_date: '2025-12-10',
  skrivelse_deadline: '2026-04-10',
  gov_response_status: 'OVERDUE',
  response_skrivelse_id: null,
  parliamentary_followup_doc_ids: ['HC03206'],
  open_recommendations: 7,
  risk_level: 'HIGH',
};

const RECORD_RESPONDED: RirFollowUpRecord = {
  rir_report_id: 'HB01NU20',
  rir_number: 'RiR 2025:12',
  title: 'Exportfrämjande — Business Sweden',
  agency: 'Business Sweden',
  committees: ['NU'],
  publish_date: '2025-09-22',
  skrivelse_deadline: '2026-01-22',
  gov_response_status: 'RESPONDED',
  response_skrivelse_id: 'Skr. 2025/26:78',
  parliamentary_followup_doc_ids: ['HB01NU20'],
  open_recommendations: 0,
  risk_level: 'LOW',
};

const RECORD_PARTIAL: RirFollowUpRecord = {
  rir_report_id: 'HA01AU15',
  rir_number: 'RiR 2025:7',
  title: 'Arbetsmarknadspolitiken — Arbetsförmedlingen',
  agency: 'Arbetsförmedlingen',
  committees: ['AU'],
  publish_date: '2025-06-05',
  skrivelse_deadline: '2025-10-05',
  gov_response_status: 'PARTIAL',
  response_skrivelse_id: 'Skr. 2025/26:22',
  parliamentary_followup_doc_ids: ['HA01AU15'],
  open_recommendations: 2,
  risk_level: 'MEDIUM',
};

const DATASET: RirFollowUpsDataset = {
  version: '1.0',
  description: 'Test dataset',
  last_updated: '2026-04-27',
  constitutional_deadline_months: 4,
  records: [RECORD_PENDING, RECORD_OVERDUE, RECORD_RESPONDED, RECORD_PARTIAL],
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('CONSTITUTIONAL_DEADLINE_MONTHS is 4', () => {
    expect(CONSTITUTIONAL_DEADLINE_MONTHS).toBe(4);
  });

  it('RIR_SKRIVELSE_DOKTYP is "skr"', () => {
    expect(RIR_SKRIVELSE_DOKTYP).toBe('skr');
  });

  it('RIR_SKRIVELSE_SUBTYP is "rsk"', () => {
    expect(RIR_SKRIVELSE_SUBTYP).toBe('rsk');
  });
});

// ---------------------------------------------------------------------------
// calculateSkrivelseDeadline
// ---------------------------------------------------------------------------

describe('calculateSkrivelseDeadline', () => {
  it('adds 4 months to a mid-month date', () => {
    expect(calculateSkrivelseDeadline('2026-01-15')).toBe('2026-05-15');
  });

  it('adds 4 months crossing a year boundary', () => {
    expect(calculateSkrivelseDeadline('2025-10-31')).toBe('2026-02-28');
  });

  it('clamps to last day when target month is shorter', () => {
    // Jan 31 + 1 month = Feb 28 (non-leap)
    expect(calculateSkrivelseDeadline('2025-01-31', { monthsOverride: 1 })).toBe('2025-02-28');
  });

  it('handles leap year correctly', () => {
    // Oct 31 2023 + 4 months = Feb 29 2024 (leap year)
    expect(calculateSkrivelseDeadline('2023-10-31')).toBe('2024-02-29');
  });

  it('uses custom month override', () => {
    expect(calculateSkrivelseDeadline('2026-01-15', { monthsOverride: 6 })).toBe('2026-07-15');
  });

  it('throws RangeError on invalid date', () => {
    expect(() => calculateSkrivelseDeadline('not-a-date')).toThrow(RangeError);
  });

  it('handles end of year wrapping correctly', () => {
    expect(calculateSkrivelseDeadline('2026-12-15')).toBe('2027-04-15');
  });

  it('exposes a backwards-compatible alias `calculateSkrivelsDeadline`', () => {
    expect(calculateSkrivelsDeadline).toBe(calculateSkrivelseDeadline);
    expect(calculateSkrivelsDeadline('2026-01-15')).toBe('2026-05-15');
  });
});

// ---------------------------------------------------------------------------
// daysOverdue
// ---------------------------------------------------------------------------

describe('daysOverdue', () => {
  it('returns 0 when not yet overdue', () => {
    expect(daysOverdue('2026-12-31', '2026-06-01')).toBe(0);
  });

  it('returns positive integer when overdue', () => {
    expect(daysOverdue('2026-04-10', '2026-04-27')).toBe(17);
  });

  it('returns 0 exactly on the deadline day', () => {
    expect(daysOverdue('2026-04-10', '2026-04-10')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// deriveResponseStatus
// ---------------------------------------------------------------------------

describe('deriveResponseStatus', () => {
  it('returns RESPONDED when skrivelse_id set and status RESPONDED', () => {
    expect(deriveResponseStatus(RECORD_RESPONDED, '2026-04-27')).toBe('RESPONDED');
  });

  it('returns PARTIAL when status PARTIAL and skrivelse_id set', () => {
    expect(deriveResponseStatus(RECORD_PARTIAL, '2026-04-27')).toBe('PARTIAL');
  });

  it('returns OVERDUE when deadline elapsed and no response', () => {
    // RECORD_OVERDUE: deadline 2026-04-10, asOf 2026-04-27
    expect(deriveResponseStatus(RECORD_OVERDUE, '2026-04-27')).toBe('OVERDUE');
  });

  it('returns PENDING when deadline not yet elapsed', () => {
    // RECORD_PENDING: deadline 2026-05-15, asOf 2026-04-27
    expect(deriveResponseStatus(RECORD_PENDING, '2026-04-27')).toBe('PENDING');
  });

  it('returns PENDING when no deadline set', () => {
    const noDeadline: RirFollowUpRecord = {
      ...RECORD_PENDING,
      skrivelse_deadline: null,
    };
    expect(deriveResponseStatus(noDeadline, '2030-01-01')).toBe('PENDING');
  });

  it('uses current date by default', () => {
    // Just check that it does not throw
    expect(() => deriveResponseStatus(RECORD_PENDING)).not.toThrow();
  });

  it('returns RESPONDED when stored status is PENDING but response_skrivelse_id is set (rule 1)', () => {
    const stalePending: RirFollowUpRecord = {
      ...RECORD_PENDING,
      gov_response_status: 'PENDING',
      response_skrivelse_id: 'Skr. 2026/27:42',
      open_recommendations: 0,
    };
    expect(deriveResponseStatus(stalePending, '2026-04-27')).toBe('RESPONDED');
  });

  it('returns PARTIAL when response_skrivelse_id is set but open_recommendations > 0', () => {
    const stalePending: RirFollowUpRecord = {
      ...RECORD_PENDING,
      gov_response_status: 'PENDING',
      response_skrivelse_id: 'Skr. 2026/27:42',
      open_recommendations: 3,
    };
    expect(deriveResponseStatus(stalePending, '2026-04-27')).toBe('PARTIAL');
  });
});

// ---------------------------------------------------------------------------
// detectOverdueAlerts
// ---------------------------------------------------------------------------

describe('detectOverdueAlerts', () => {
  it('returns alerts for OVERDUE records only', () => {
    const alerts = detectOverdueAlerts(DATASET, '2026-04-27');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].rir_report_id).toBe('HC03206');
  });

  it('alert has correct days_overdue', () => {
    const alerts = detectOverdueAlerts(DATASET, '2026-04-27');
    // deadline: 2026-04-10, asOf: 2026-04-27 → 17 days
    expect(alerts[0].days_overdue).toBe(17);
  });

  it('returns empty array when no records are overdue', () => {
    const alerts = detectOverdueAlerts(DATASET, '2026-01-01');
    expect(alerts).toHaveLength(0);
  });

  it('sorts alerts by days_overdue descending', () => {
    const dataset: RirFollowUpsDataset = {
      ...DATASET,
      records: [
        { ...RECORD_OVERDUE, rir_report_id: 'A', rir_number: 'RiR 2025:1', skrivelse_deadline: '2026-03-01' },
        { ...RECORD_OVERDUE, rir_report_id: 'B', rir_number: 'RiR 2025:2', skrivelse_deadline: '2026-02-01' },
      ],
    };
    const alerts = detectOverdueAlerts(dataset, '2026-04-27');
    expect(alerts[0].rir_report_id).toBe('B'); // Feb 1 → more overdue
    expect(alerts[1].rir_report_id).toBe('A');
  });

  it('skips records with no skrivelse_deadline', () => {
    const dataset: RirFollowUpsDataset = {
      ...DATASET,
      records: [{ ...RECORD_PENDING, skrivelse_deadline: null }],
    };
    const alerts = detectOverdueAlerts(dataset, '2030-01-01');
    expect(alerts).toHaveLength(0);
  });

  it('skips records that already have a response_skrivelse_id', () => {
    const responded: RirFollowUpRecord = {
      ...RECORD_OVERDUE,
      response_skrivelse_id: 'Skr. 2026:99',
    };
    const dataset: RirFollowUpsDataset = { ...DATASET, records: [responded] };
    const alerts = detectOverdueAlerts(dataset, '2026-04-27');
    expect(alerts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// renderRirFollowUpTable
// ---------------------------------------------------------------------------

describe('renderRirFollowUpTable', () => {
  it('renders a header row and record rows', () => {
    const table = renderRirFollowUpTable([RECORD_RESPONDED], '2026-04-27');
    expect(table).toContain('| RiR #');
    expect(table).toContain('RiR 2025:12');
    expect(table).toContain('✅ RESPONDED');
  });

  it('shows overdue emoji for overdue records', () => {
    const table = renderRirFollowUpTable([RECORD_OVERDUE], '2026-04-27');
    expect(table).toContain('🚨 OVERDUE');
    expect(table).toContain('⚠️ 17');
  });

  it('shows pending emoji for pending records', () => {
    const table = renderRirFollowUpTable([RECORD_PENDING], '2026-04-27');
    expect(table).toContain('⏳ PENDING');
    expect(table).toContain('—'); // no days overdue
  });

  it('uses riksdag_url for title link when available', () => {
    const table = renderRirFollowUpTable([RECORD_PENDING], '2026-04-27');
    expect(table).toContain('[Polisreform');
    expect(table).toContain('HD01JuU31/');
  });

  it('renders empty table gracefully', () => {
    const table = renderRirFollowUpTable([], '2026-04-27');
    expect(table).toContain('| RiR #');
    // Only header and divider
    const lines = table.split('\n');
    expect(lines).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// injectRirTableIntoDocument
// ---------------------------------------------------------------------------

describe('injectRirTableIntoDocument', () => {
  it('appends a table block to a document without existing markers', () => {
    const doc = '# Intelligence Assessment\n\nSome analysis here.';
    const result = injectRirTableIntoDocument(doc, [RECORD_RESPONDED], '2026-04-27');
    expect(result).toContain('<!-- RIR-FOLLOWUP-TABLE-START -->');
    expect(result).toContain('<!-- RIR-FOLLOWUP-TABLE-END -->');
    expect(result).toContain('## 🔍 Riksrevisionen Follow-Up Status');
    expect(result).toContain('Some analysis here.');
  });

  it('replaces an existing table block', () => {
    const doc = [
      '# Doc',
      '',
      '<!-- RIR-FOLLOWUP-TABLE-START -->',
      '## 🔍 Riksrevisionen Follow-Up Status',
      '| old table |',
      '<!-- RIR-FOLLOWUP-TABLE-END -->',
      '',
      'Footer text.',
    ].join('\n');

    const result = injectRirTableIntoDocument(doc, [RECORD_PENDING], '2026-04-27');
    expect(result).not.toContain('| old table |');
    expect(result).toContain('RiR 2026:6');
    expect(result).toContain('Footer text.');
  });

  it('preserves content before and after the markers', () => {
    const doc = [
      'BEFORE',
      '<!-- RIR-FOLLOWUP-TABLE-START -->',
      'OLD',
      '<!-- RIR-FOLLOWUP-TABLE-END -->',
      'AFTER',
    ].join('\n');
    const result = injectRirTableIntoDocument(doc, [], '2026-04-27');
    expect(result.startsWith('BEFORE')).toBe(true);
    expect(result).toContain('AFTER');
    expect(result).not.toContain('OLD');
  });
});

// ---------------------------------------------------------------------------
// filterByCommittee
// ---------------------------------------------------------------------------

describe('filterByCommittee', () => {
  it('filters records by committee code', () => {
    const result = filterByCommittee(DATASET.records, 'JuU');
    expect(result).toHaveLength(1);
    expect(result[0].rir_report_id).toBe('HD01JuU31');
  });

  it('is case-insensitive', () => {
    const lower = filterByCommittee(DATASET.records, 'juu');
    const upper = filterByCommittee(DATASET.records, 'JuU');
    expect(lower.map((r) => r.rir_report_id)).toEqual(upper.map((r) => r.rir_report_id));
  });

  it('returns empty array if no match', () => {
    expect(filterByCommittee(DATASET.records, 'KU')).toHaveLength(0);
  });

  it('handles records without committees field', () => {
    const noCommittees: RirFollowUpRecord = { ...RECORD_PENDING, committees: undefined };
    expect(filterByCommittee([noCommittees], 'JuU')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterByStatus
// ---------------------------------------------------------------------------

describe('filterByStatus', () => {
  it('filters PENDING records', () => {
    const result = filterByStatus(DATASET.records, 'PENDING');
    expect(result).toHaveLength(1);
    expect(result[0].rir_report_id).toBe('HD01JuU31');
  });

  it('filters OVERDUE records', () => {
    const result = filterByStatus(DATASET.records, 'OVERDUE');
    expect(result).toHaveLength(1);
    expect(result[0].rir_report_id).toBe('HC03206');
  });

  it('filters RESPONDED records', () => {
    const result = filterByStatus(DATASET.records, 'RESPONDED');
    expect(result).toHaveLength(1);
    expect(result[0].rir_report_id).toBe('HB01NU20');
  });

  it('filters PARTIAL records', () => {
    const result = filterByStatus(DATASET.records, 'PARTIAL');
    expect(result).toHaveLength(1);
    expect(result[0].rir_report_id).toBe('HA01AU15');
  });
});

// ---------------------------------------------------------------------------
// filterByMinRiskLevel
// ---------------------------------------------------------------------------

describe('filterByMinRiskLevel', () => {
  it('returns all records at or above LOW', () => {
    const result = filterByMinRiskLevel(DATASET.records, 'LOW');
    expect(result).toHaveLength(4);
  });

  it('filters to MEDIUM and above', () => {
    const result = filterByMinRiskLevel(DATASET.records, 'MEDIUM');
    const ids = result.map((r) => r.rir_report_id);
    expect(ids).toContain('HC03206'); // HIGH
    expect(ids).toContain('HD01JuU31'); // HIGH
    expect(ids).toContain('HA01AU15'); // MEDIUM
    expect(ids).not.toContain('HB01NU20'); // LOW
  });

  it('filters to HIGH and above', () => {
    const result = filterByMinRiskLevel(DATASET.records, 'HIGH');
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL')).toBe(true);
  });

  it('defaults missing risk_level to LOW', () => {
    const noRisk: RirFollowUpRecord = { ...RECORD_RESPONDED, risk_level: undefined };
    const result = filterByMinRiskLevel([noRisk], 'MEDIUM');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateRirRecord
// ---------------------------------------------------------------------------

describe('validateRirRecord', () => {
  it('passes a fully valid record', () => {
    expect(validateRirRecord(RECORD_RESPONDED)).toHaveLength(0);
  });

  it('reports missing rir_report_id', () => {
    const bad = { ...RECORD_PENDING, rir_report_id: '' };
    const errors = validateRirRecord(bad);
    expect(errors.some((e) => e.includes('rir_report_id'))).toBe(true);
  });

  it('reports invalid rir_number format', () => {
    const bad = { ...RECORD_PENDING, rir_number: 'INVALID' };
    const errors = validateRirRecord(bad);
    expect(errors.some((e) => e.includes('rir_number'))).toBe(true);
  });

  it('reports invalid publish_date', () => {
    const bad = { ...RECORD_PENDING, publish_date: '15-01-2026' };
    const errors = validateRirRecord(bad);
    expect(errors.some((e) => e.includes('publish_date'))).toBe(true);
  });

  it('reports invalid gov_response_status', () => {
    const bad = { ...RECORD_PENDING, gov_response_status: 'UNKNOWN' as never };
    const errors = validateRirRecord(bad);
    expect(errors.some((e) => e.includes('gov_response_status'))).toBe(true);
  });

  it('reports RESPONDED without response_skrivelse_id', () => {
    const bad: RirFollowUpRecord = {
      ...RECORD_RESPONDED,
      response_skrivelse_id: null,
    };
    const errors = validateRirRecord(bad);
    expect(errors.some((e) => e.includes('RESPONDED'))).toBe(true);
  });

  it('accepts null skrivelse_deadline', () => {
    const noDeadline: RirFollowUpRecord = { ...RECORD_PENDING, skrivelse_deadline: null };
    const errors = validateRirRecord(noDeadline);
    expect(errors.filter((e) => e.includes('skrivelse_deadline'))).toHaveLength(0);
  });

  it('reports non-string response_skrivelse_id', () => {
    const bad = { ...RECORD_PENDING, response_skrivelse_id: 42 as unknown as null };
    const errors = validateRirRecord(bad);
    expect(errors.some((e) => e.includes('response_skrivelse_id'))).toBe(true);
  });

  it('reports non-string item in parliamentary_followup_doc_ids', () => {
    const bad = {
      ...RECORD_PENDING,
      parliamentary_followup_doc_ids: ['ok', 123 as unknown as string],
    };
    const errors = validateRirRecord(bad);
    expect(errors.some((e) => e.includes('parliamentary_followup_doc_ids'))).toBe(true);
  });

  it('reports non-string item in committees', () => {
    const bad = { ...RECORD_PENDING, committees: ['JuU', 5 as unknown as string] };
    const errors = validateRirRecord(bad);
    expect(errors.some((e) => e.includes('committees'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateRirDataset
// ---------------------------------------------------------------------------

describe('validateRirDataset', () => {
  it('returns empty map for valid dataset', () => {
    const errors = validateRirDataset(DATASET);
    expect(errors.size).toBe(0);
  });

  it('returns entries for each invalid record', () => {
    const bad: RirFollowUpsDataset = {
      ...DATASET,
      records: [
        { ...RECORD_PENDING, rir_report_id: '' },
        { ...RECORD_RESPONDED, response_skrivelse_id: null },
      ],
    };
    const errors = validateRirDataset(bad);
    expect(errors.size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// loadRirDataset / saveRirDataset (injectable I/O)
// ---------------------------------------------------------------------------

describe('loadRirDataset', () => {
  it('parses a JSON string via injectable reader', () => {
    const raw = JSON.stringify(DATASET);
    const mockRead = (_path: string, _enc: BufferEncoding) => raw;
    const loaded = loadRirDataset('/fake/path.json', mockRead);
    expect(loaded.version).toBe('1.0');
    expect(loaded.records).toHaveLength(4);
  });

  it('throws on malformed JSON', () => {
    const mockRead = () => 'not json {{{';
    expect(() => loadRirDataset('/fake/path.json', mockRead)).toThrow();
  });
});

describe('saveRirDataset', () => {
  it('calls writeFileFn with pretty JSON', () => {
    let written = '';
    const mockWrite = (_path: string, data: string, _enc: BufferEncoding) => {
      written = data;
    };
    saveRirDataset(DATASET, '/fake/path.json', mockWrite);
    const parsed = JSON.parse(written) as RirFollowUpsDataset;
    expect(parsed.version).toBe('1.0');
    expect(parsed.records).toHaveLength(4);
  });

  it('updates last_updated using injected clock (deterministic)', () => {
    let written = '';
    const mockWrite = (_path: string, data: string) => { written = data; };
    const fixedClock = new Date('2026-04-27T12:34:56Z');
    saveRirDataset(DATASET, '/fake/path.json', mockWrite, fixedClock);
    const parsed = JSON.parse(written) as RirFollowUpsDataset;
    expect(parsed.last_updated).toBe('2026-04-27');
  });
});

// ---------------------------------------------------------------------------
// Integration: load real data/rir-followups.json
// ---------------------------------------------------------------------------

const __dirn = dirname(fileURLToPath(import.meta.url));
const REAL_DATA_FILE = resolve(__dirn, '../data/rir-followups.json');

describe('data/rir-followups.json integrity', () => {
  it('loads and validates the real dataset file', () => {
    const raw = readFileSync(REAL_DATA_FILE, 'utf8');
    const dataset = JSON.parse(raw) as RirFollowUpsDataset;

    expect(dataset.version).toBeTruthy();
    expect(dataset.constitutional_deadline_months).toBe(4);
    expect(Array.isArray(dataset.records)).toBe(true);
    expect(dataset.records.length).toBeGreaterThan(0);

    const errors = validateRirDataset(dataset);
    if (errors.size > 0) {
      for (const [id, errs] of errors) {
        console.warn(`Validation error for ${id}:`, errs);
      }
    }
    expect(errors.size).toBe(0);
  });

  it('all records in data/rir-followups.json have required fields', () => {
    const raw = readFileSync(REAL_DATA_FILE, 'utf8');
    const dataset = JSON.parse(raw) as RirFollowUpsDataset;

    for (const record of dataset.records) {
      expect(record.rir_report_id).toBeTruthy();
      expect(record.rir_number).toMatch(/^RiR \d{4}:\d+$/);
      expect(record.title).toBeTruthy();
      expect(record.agency).toBeTruthy();
      expect(record.publish_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['PENDING', 'RESPONDED', 'OVERDUE', 'PARTIAL']).toContain(
        record.gov_response_status,
      );
    }
  });
});
