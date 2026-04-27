/**
 * @module RirFollowupsClient
 * @description Riksrevisionen (RiR) follow-up tracker library.
 *
 * Provides:
 *  - TypeScript interfaces matching `data/rir-followups.json` / `schemas/rir-followups-schema.json`
 *  - Deadline calculator using Swedish constitutional practice (4-month rule)
 *  - Status derivation helpers (PENDING / OVERDUE / RESPONDED / PARTIAL)
 *  - Markdown table injection utilities for intelligence-assessment documents
 *  - Alert detection for overdue skrivelse deadlines
 *  - Dataset load/save helpers (Node.js fs; mocked in tests)
 *
 * Constitutional basis:
 *   Swedish parliamentary practice (Riksdagsordningen ch. 10:4, with related
 *   accountability framing in RF 5:4 and RF ch. 13:7) requires the government
 *   to deliver a formal skrivelse (written communication) to the Riksdag
 *   within 4 calendar months of a Riksrevisionen (RiR) report publication.
 *   These provisions are treated as complementary rather than conflicting
 *   bases for the response expectation.
 *
 * @see data/rir-followups.json
 * @see schemas/rir-followups-schema.json
 * @see .github/skills/legislative-monitoring/SKILL.md
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync, writeFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Government response status for a Riksrevisionen follow-up. */
export type RirResponseStatus = 'PENDING' | 'RESPONDED' | 'OVERDUE' | 'PARTIAL';

/** Political accountability risk level. */
export type RirRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * A single Riksrevisionen follow-up record.
 * Matches the JSON schema at `schemas/rir-followups-schema.json`.
 */
export interface RirFollowUpRecord {
  /** Riksdag document ID for the RiR report (e.g. HD01JuU31). */
  readonly rir_report_id: string;
  /** Official RiR publication number (e.g. RiR 2026:6). */
  readonly rir_number: string;
  /** Swedish title of the RiR report. */
  readonly title: string;
  /** English translation of the title. */
  readonly title_en?: string;
  /** Primary government agency audited. */
  readonly agency: string;
  /** Swedish policy area. */
  readonly policy_area?: string;
  /** Riksdag committee codes handling the report (e.g. JuU, FöU). */
  readonly committees?: readonly string[];
  /** ISO 8601 date when the RiR report was published. */
  readonly publish_date: string;
  /** Deadline for the government skrivelse response (null if not confirmed). */
  readonly skrivelse_deadline: string | null;
  /** Government response status. */
  readonly gov_response_status: RirResponseStatus;
  /** Riksdag document ID or reference of the government skrivelse response. */
  readonly response_skrivelse_id: string | null;
  /** Riksdag document IDs for parliamentary follow-up documents. */
  readonly parliamentary_followup_doc_ids: readonly string[];
  /** Number of open/unresolved RiR recommendations. */
  readonly open_recommendations?: number;
  /** Political accountability risk level. */
  readonly risk_level?: RirRiskLevel;
  /** Additional context or intelligence notes. */
  readonly notes?: string;
  /** URL to the document on riksdagen.se. */
  readonly riksdag_url?: string;
}

/** The top-level dataset shape for `data/rir-followups.json`. */
export interface RirFollowUpsDataset {
  readonly $schema?: string;
  readonly version: string;
  readonly description: string;
  readonly last_updated: string;
  /** Default constitutional deadline in calendar months (Swedish practice: 4). */
  readonly constitutional_deadline_months: number;
  readonly notes?: readonly string[];
  readonly records: readonly RirFollowUpRecord[];
}

/** Alert produced when a skrivelse deadline has elapsed without a response. */
export interface RirDeadlineAlert {
  readonly rir_report_id: string;
  readonly rir_number: string;
  readonly title: string;
  readonly agency: string;
  readonly skrivelse_deadline: string;
  /** Number of days the deadline is overdue (positive integer). */
  readonly days_overdue: number;
  readonly risk_level: RirRiskLevel;
  readonly riksdag_url?: string;
}

/** Options for the deadline calculator. */
export interface DeadlineCalculatorOptions {
  /**
   * Override the default 4-month deadline.
   * Useful for reports with explicitly extended timelines.
   */
  readonly monthsOverride?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Swedish constitutional practice: 4-month skrivelse deadline. */
export const CONSTITUTIONAL_DEADLINE_MONTHS = 4 as const;

/**
 * Default risk level applied when a record's `risk_level` is missing.
 * Used by both alert detection and risk-level filtering so downstream
 * logic stays consistent.
 */
export const DEFAULT_RISK_LEVEL = 'MEDIUM' as const;

/** Riksdag search endpoint for government communications (skrivelser). */
export const RIR_SKRIVELSE_DOKTYP = 'skr' as const;

/** Document subtype for government responses to Riksrevisionen. */
export const RIR_SKRIVELSE_SUBTYP = 'rsk' as const;

// ---------------------------------------------------------------------------
// Deadline calculator
// ---------------------------------------------------------------------------

/**
 * Calculate the skrivelse deadline from a RiR report publish date.
 *
 * Swedish constitutional practice: 4 calendar months after publication.
 * The returned date is computed by adding the configured number of calendar
 * months to the publish date and preserving the original day-of-month when
 * possible; if the target month is shorter, the date is clamped to that
 * month's last day.
 *
 * @param publishDate - ISO 8601 date string (YYYY-MM-DD)
 * @param options - Optional override for month count
 * @returns ISO 8601 date string for the calculated deadline
 *
 * @example
 * calculateSkrivelseDeadline('2026-01-15') // '2026-05-15'
 * calculateSkrivelseDeadline('2026-01-31') // '2026-05-31'
 * calculateSkrivelseDeadline('2026-10-31') // '2027-02-28' (Feb has no 31st)
 */
export function calculateSkrivelseDeadline(
  publishDate: string,
  options: DeadlineCalculatorOptions = {},
): string {
  const months = options.monthsOverride ?? CONSTITUTIONAL_DEADLINE_MONTHS;
  const pub = new Date(publishDate + 'T00:00:00Z');
  if (isNaN(pub.getTime())) {
    throw new RangeError(`Invalid publish_date: ${publishDate}`);
  }
  const year = pub.getUTCFullYear();
  const month = pub.getUTCMonth(); // 0-indexed
  const day = pub.getUTCDate();

  const deadlineYear = year + Math.floor((month + months) / 12);
  const deadlineMonth = (month + months) % 12; // 0-indexed

  // Clamp to last day of deadline month
  const daysInDeadlineMonth = new Date(Date.UTC(deadlineYear, deadlineMonth + 1, 0)).getUTCDate();
  const deadlineDay = Math.min(day, daysInDeadlineMonth);

  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${deadlineYear}-${pad(deadlineMonth + 1)}-${pad(deadlineDay)}`;
}

/**
 * @deprecated Use {@link calculateSkrivelseDeadline} (correctly spelled).
 * Kept as a thin alias for backwards compatibility.
 */
export const calculateSkrivelsDeadline = calculateSkrivelseDeadline;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

/**
 * Derive the current response status for a record given today's date.
 *
 * Rules (in priority order):
 *  1. If `response_skrivelse_id` is set:
 *     - If `gov_response_status === 'PARTIAL'` (or `open_recommendations > 0`) → PARTIAL
 *     - Otherwise → RESPONDED
 *  2. If deadline has elapsed and no response → OVERDUE
 *  3. Otherwise → PENDING
 *
 * Status is derived primarily from the presence of `response_skrivelse_id`:
 * a record cannot be PENDING/OVERDUE if a skrivelse reference is recorded.
 *
 * @param record - The RiR follow-up record
 * @param asOf - Reference date for "today" (ISO 8601 or Date). Defaults to now.
 * @returns Derived status (does NOT mutate the record).
 */
export function deriveResponseStatus(
  record: RirFollowUpRecord,
  asOf: Date | string = new Date(),
): RirResponseStatus {
  const now = typeof asOf === 'string' ? new Date(asOf + 'T00:00:00Z') : asOf;

  // Rule 1: a recorded skrivelse ID is the canonical signal of a response.
  if (record.response_skrivelse_id) {
    if (
      record.gov_response_status === 'PARTIAL' ||
      (typeof record.open_recommendations === 'number' && record.open_recommendations > 0)
    ) {
      return 'PARTIAL';
    }
    return 'RESPONDED';
  }

  // Rule 2: no response yet — check deadline.
  if (record.skrivelse_deadline) {
    const deadline = new Date(record.skrivelse_deadline + 'T00:00:00Z');
    if (now > deadline) {
      return 'OVERDUE';
    }
  }

  // Rule 3: default.
  return 'PENDING';
}

/**
 * Calculate the number of days a deadline is overdue.
 *
 * @param deadlineDate - ISO 8601 date string (YYYY-MM-DD)
 * @param asOf - Reference date. Defaults to now.
 * @throws RangeError when either date is invalid (mirrors {@link calculateSkrivelseDeadline}).
 * @returns Positive integer (days overdue) or 0 if not yet overdue.
 */
export function daysOverdue(
  deadlineDate: string,
  asOf: Date | string = new Date(),
): number {
  const now = typeof asOf === 'string' ? new Date(asOf + 'T00:00:00Z') : asOf;
  const deadline = new Date(deadlineDate + 'T00:00:00Z');
  if (isNaN(deadline.getTime())) {
    throw new RangeError(`Invalid deadlineDate: ${deadlineDate}`);
  }
  if (isNaN(now.getTime())) {
    throw new RangeError(`Invalid asOf: ${String(asOf)}`);
  }
  const diffMs = now.getTime() - deadline.getTime();
  return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
}

// ---------------------------------------------------------------------------
// Alert detection
// ---------------------------------------------------------------------------

/**
 * Scan a dataset for records whose skrivelse deadline has elapsed without a
 * government response, and return alert objects for each.
 *
 * @param dataset - The full RiR follow-ups dataset
 * @param asOf - Reference date for "today". Defaults to now.
 * @returns Array of {@link RirDeadlineAlert} objects (empty if none overdue).
 */
export function detectOverdueAlerts(
  dataset: RirFollowUpsDataset,
  asOf: Date | string = new Date(),
): readonly RirDeadlineAlert[] {
  const now = typeof asOf === 'string' ? new Date(asOf + 'T00:00:00Z') : asOf;
  const alerts: RirDeadlineAlert[] = [];

  for (const record of dataset.records) {
    if (!record.skrivelse_deadline) continue;
    if (record.response_skrivelse_id) continue;

    const status = deriveResponseStatus(record, now);
    if (status === 'OVERDUE') {
      alerts.push({
        rir_report_id: record.rir_report_id,
        rir_number: record.rir_number,
        title: record.title,
        agency: record.agency,
        skrivelse_deadline: record.skrivelse_deadline,
        days_overdue: daysOverdue(record.skrivelse_deadline, now),
        risk_level: record.risk_level ?? DEFAULT_RISK_LEVEL,
        riksdag_url: record.riksdag_url,
      });
    }
  }

  // Sort by days_overdue descending (most overdue first)
  return alerts.sort((a, b) => b.days_overdue - a.days_overdue);
}

// ---------------------------------------------------------------------------
// Markdown table injection
// ---------------------------------------------------------------------------

/**
 * Render a Markdown table of RiR follow-up records for injection into
 * intelligence-assessment documents.
 *
 * The table includes: RiR#, Title, Agency, Published, Deadline, Status, Days Overdue.
 *
 * @param records - The RiR follow-up records to include in the table
 * @param asOf - Reference date for status derivation. Defaults to now.
 * @returns Markdown string (including header, divider, and rows).
 */
export function renderRirFollowUpTable(
  records: readonly RirFollowUpRecord[],
  asOf: Date | string = new Date(),
): string {
  const now = typeof asOf === 'string' ? new Date(asOf + 'T00:00:00Z') : asOf;

  const header =
    '| RiR # | Title | Agency | Published | Skrivelse Deadline | Status | Days Overdue |';
  const divider =
    '|-------|-------|--------|-----------|-------------------|--------|--------------|';

  const rows = records.map((r) => {
    const status = deriveResponseStatus(r, now);
    const overdue = status === 'OVERDUE' && r.skrivelse_deadline
      ? daysOverdue(r.skrivelse_deadline, now)
      : 0;
    const overdueStr = overdue > 0 ? `⚠️ ${overdue}` : '—';
    const statusEmoji = {
      PENDING: '⏳',
      RESPONDED: '✅',
      OVERDUE: '🚨',
      PARTIAL: '⚠️',
    }[status];
    const deadlineStr = r.skrivelse_deadline ?? '(unknown)';
    const titleLink = r.riksdag_url
      ? `[${r.title}](${r.riksdag_url})`
      : r.title;
    return `| ${r.rir_number} | ${titleLink} | ${r.agency} | ${r.publish_date} | ${deadlineStr} | ${statusEmoji} ${status} | ${overdueStr} |`;
  });

  return [header, divider, ...rows].join('\n');
}

/**
 * Inject (or replace) a RiR follow-up table block in a Markdown document.
 *
 * The block is delimited by HTML comment markers:
 *   <!-- RIR-FOLLOWUP-TABLE-START -->
 *   … table …
 *   <!-- RIR-FOLLOWUP-TABLE-END -->
 *
 * If the markers are absent the table is appended to the end of the document.
 *
 * @param documentContent - Existing Markdown document content
 * @param records - RiR records to render
 * @param asOf - Reference date for status derivation. Defaults to now.
 * @returns Updated document content with the RiR table injected or replaced.
 */
export function injectRirTableIntoDocument(
  documentContent: string,
  records: readonly RirFollowUpRecord[],
  asOf: Date | string = new Date(),
): string {
  const table = renderRirFollowUpTable(records, asOf);
  const block = [
    '<!-- RIR-FOLLOWUP-TABLE-START -->',
    '',
    '## 🔍 Riksrevisionen Follow-Up Status',
    '',
    table,
    '',
    '<!-- RIR-FOLLOWUP-TABLE-END -->',
  ].join('\n');

  const startMarker = '<!-- RIR-FOLLOWUP-TABLE-START -->';
  const endMarker = '<!-- RIR-FOLLOWUP-TABLE-END -->';
  const startIdx = documentContent.indexOf(startMarker);
  const endIdx = documentContent.indexOf(endMarker);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return (
      documentContent.slice(0, startIdx) +
      block +
      documentContent.slice(endIdx + endMarker.length)
    );
  }

  // No existing markers — append to end
  return documentContent.trimEnd() + '\n\n' + block + '\n';
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

/**
 * Filter records by committee code (case-insensitive).
 *
 * @param records - Source records
 * @param committee - Committee code to match (e.g. 'JuU', 'FöU')
 * @returns Records that involve the given committee.
 */
export function filterByCommittee(
  records: readonly RirFollowUpRecord[],
  committee: string,
): readonly RirFollowUpRecord[] {
  const lc = committee.toLowerCase();
  return records.filter((r) =>
    (r.committees ?? []).some((c) => c.toLowerCase() === lc),
  );
}

/**
 * Filter records by government response status.
 *
 * @param records - Source records (status taken from stored field, NOT re-derived)
 * @param status - Status to filter by
 */
export function filterByStatus(
  records: readonly RirFollowUpRecord[],
  status: RirResponseStatus,
): readonly RirFollowUpRecord[] {
  return records.filter((r) => r.gov_response_status === status);
}

/**
 * Filter records by risk level.
 *
 * @param records - Source records
 * @param minLevel - Minimum risk level (LOW < MEDIUM < HIGH < CRITICAL)
 */
export function filterByMinRiskLevel(
  records: readonly RirFollowUpRecord[],
  minLevel: RirRiskLevel,
): readonly RirFollowUpRecord[] {
  const order: Record<RirRiskLevel, number> = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
  };
  const threshold = order[minLevel];
  return records.filter((r) => order[r.risk_level ?? DEFAULT_RISK_LEVEL] >= threshold);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a single {@link RirFollowUpRecord} for required fields and
 * consistency rules.
 *
 * @returns Array of validation error strings. Empty array = valid.
 */
export function validateRirRecord(record: RirFollowUpRecord): readonly string[] {
  const errors: string[] = [];

  if (!record.rir_report_id || typeof record.rir_report_id !== 'string') {
    errors.push('rir_report_id is required and must be a string');
  }
  if (!record.rir_number || !/^RiR \d{4}:\d+$/.test(record.rir_number)) {
    errors.push(`rir_number must match pattern RiR YYYY:N (e.g. RiR 2026:6), got: ${record.rir_number}`);
  }
  if (!record.title || typeof record.title !== 'string') {
    errors.push('title is required and must be a string');
  }
  if (!record.agency || typeof record.agency !== 'string') {
    errors.push('agency is required and must be a string');
  }
  if (!record.publish_date || !/^\d{4}-\d{2}-\d{2}$/.test(record.publish_date)) {
    errors.push(`publish_date must be ISO 8601 (YYYY-MM-DD), got: ${record.publish_date}`);
  }
  if (record.skrivelse_deadline !== null && !/^\d{4}-\d{2}-\d{2}$/.test(record.skrivelse_deadline ?? '')) {
    errors.push(`skrivelse_deadline must be ISO 8601 or null, got: ${record.skrivelse_deadline}`);
  }
  const validStatuses: RirResponseStatus[] = ['PENDING', 'RESPONDED', 'OVERDUE', 'PARTIAL'];
  if (!validStatuses.includes(record.gov_response_status)) {
    errors.push(`gov_response_status must be one of ${validStatuses.join(', ')}`);
  }
  if (!Array.isArray(record.parliamentary_followup_doc_ids)) {
    errors.push('parliamentary_followup_doc_ids must be an array');
  } else if (!record.parliamentary_followup_doc_ids.every((id) => typeof id === 'string')) {
    errors.push('parliamentary_followup_doc_ids items must all be strings');
  }
  if (
    record.committees !== undefined &&
    (!Array.isArray(record.committees) ||
      !record.committees.every((c) => typeof c === 'string'))
  ) {
    errors.push('committees must be an array of strings (when present)');
  }
  if (
    record.response_skrivelse_id !== null &&
    typeof record.response_skrivelse_id !== 'string'
  ) {
    errors.push('response_skrivelse_id must be a string or null');
  }

  // Consistency: RESPONDED requires a response_skrivelse_id
  if (record.gov_response_status === 'RESPONDED' && !record.response_skrivelse_id) {
    errors.push('RESPONDED status requires response_skrivelse_id to be set');
  }

  return errors;
}

/**
 * Validate the entire dataset.
 *
 * @returns Map of `rir_report_id` → validation errors. Empty map = fully valid.
 */
export function validateRirDataset(
  dataset: RirFollowUpsDataset,
): Map<string, readonly string[]> {
  const errorMap = new Map<string, readonly string[]>();
  for (const record of dataset.records) {
    const errors = validateRirRecord(record);
    if (errors.length > 0) {
      errorMap.set(record.rir_report_id ?? '(unknown)', errors);
    }
  }
  return errorMap;
}

// ---------------------------------------------------------------------------
// Dataset I/O helpers (injectable for testing)
// ---------------------------------------------------------------------------

/**
 * Load the RiR follow-ups dataset from a JSON file.
 *
 * @param filePath - Absolute or relative path to the JSON file
 * @param readFileFn - Injectable file reader (default: synchronous fs.readFileSync)
 * @returns Parsed dataset
 */
export function loadRirDataset(
  filePath: string,
  readFileFn: (path: string, encoding: BufferEncoding) => string = defaultReadFileFn,
): RirFollowUpsDataset {
  const raw = readFileFn(filePath, 'utf8');
  return JSON.parse(raw) as RirFollowUpsDataset;
}

/**
 * Persist the RiR follow-ups dataset to a JSON file.
 *
 * @param dataset - Dataset to persist
 * @param filePath - Absolute or relative path to write to
 * @param writeFileFn - Injectable file writer (default: synchronous fs.writeFileSync)
 * @param nowDate - Injectable clock for `last_updated` (default: `new Date()`)
 */
export function saveRirDataset(
  dataset: RirFollowUpsDataset,
  filePath: string,
  writeFileFn: (path: string, data: string, encoding: BufferEncoding) => void = defaultWriteFileFn,
  nowDate: Date = new Date(),
): void {
  const json =
    JSON.stringify(
      { ...dataset, last_updated: nowDate.toISOString().slice(0, 10) },
      null,
      2,
    ) + '\n';
  writeFileFn(filePath, json, 'utf8');
}

// ---------------------------------------------------------------------------
// Default I/O implementations (ESM-compatible static imports)
// ---------------------------------------------------------------------------

/* istanbul ignore next -- Node.js fs wrapper, not testable in unit tests */
function defaultReadFileFn(path: string, encoding: BufferEncoding): string {
  return readFileSync(path, encoding);
}

/* istanbul ignore next -- Node.js fs wrapper, not testable in unit tests */
function defaultWriteFileFn(path: string, data: string, encoding: BufferEncoding): void {
  writeFileSync(path, data, encoding);
}
