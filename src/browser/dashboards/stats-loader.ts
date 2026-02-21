/**
 * @module Dashboards/StatsLoader
 * @category Intelligence Platform - Data Collection
 *
 * @description
 * Dynamic Political Intelligence Statistics Loader.
 *
 * Core OSINT data acquisition module that loads extraction summary statistics
 * from the CIA Platform and populates DOM elements with formatted metric values.
 *
 * ## Intelligence Pipeline
 *
 * 1. **Acquisition** — Fetch CSV via local cache, remote fallback
 * 2. **Parsing**     — CSV → structured rows
 * 3. **Validation**  — Filter by `status === 'success'`
 * 4. **Mapping**     — Apply stat-id → object_name lookup
 * 5. **Display**     — Format numbers and update DOM elements

 *
 * @intelligence OSINT Data Acquisition Module — core intelligence collection loading extraction summary statistics from CIA Platform CSVs. Implements structured data acquisition pipeline: fetch → parse → validate → map → display. Provides real-time political metrics including document counts, voting records, and party activity indicators.
 *
 * @business Key metrics showcase — statistics are the "proof of depth" for the platform, demonstrating comprehensive data coverage (documents, votes, committees). These numbers drive trust and credibility for all customer segments, especially journalists and researchers requiring data provenance.
 *
 * @marketing Hero section content — statistics (e.g., "3.5M+ votes analyzed") are primary marketing assets for landing pages, press releases, and social media. Each metric is a shareable data point that demonstrates platform value and drives organic reach.
 * */

import { loadCSV, createDataSource, logger } from '../shared/index.js';
import type { CSVRow } from '../shared/index.js';

// ─── Interfaces ──────────────────────────────────────────────────────────────

/** A single row from the CIA extraction summary report. */
interface ExtractionRow extends CSVRow {
  object_type: string;
  object_name: string;
  status: string;
  row_count: string;
  error_message: string;
  extraction_time: string;
}

/** Mapping from DOM stat identifier to CIA database object name. */
type StatMappings = Readonly<Record<string, string>>;

/** Lookup built from successful extraction rows: object_name → parsed row_count. */
type RowCountLookup = Record<string, number>;

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Remote fallback repo path for the extraction summary CSV.
 */
const REMOTE_REPO_PATH =
  'service.data.impl/sample-data/extraction_summary_report.csv';

/**
 * Local cached data path (served alongside the site).
 */
const LOCAL_CSV = 'cia-data/extraction_summary_report.csv';

/**
 * Maps DOM stat identifiers to their corresponding CIA database object names.
 *
 * Hero statistics and detailed intelligence section metrics are both included.
 */
const STAT_MAPPINGS: StatMappings = {
  // Hero stats
  'stat-historical-persons': 'person_data',
  'stat-total-votes': 'view_riksdagen_vote_data_ballot_politician_summary',
  'stat-total-documents': 'document_data',
  'stat-rule-violations': 'rule_violation',
  'stat-government-proposals': 'view_riksdagen_goverment_proposals',
  'stat-committee-decisions': 'view_riksdagen_committee_decisions',

  // Intelligence section stats
  'stat-committee-documents': 'view_riksdagen_committee_decision_type_summary',
  'stat-document-activities': 'view_riksdagen_document_type_daily_summary',
  'stat-riksdag-parties': 'view_riksdagen_party',
  'stat-against-proposals': 'view_riksdagen_vote_data_ballot_summary',
  'stat-committee-proposals':
    'view_riksdagen_committee_decision_type_org_summary',
  'stat-government-roles': 'view_riksdagen_goverment_roles',
  'stat-government-role-members': 'view_riksdagen_goverment_role_member',
  'stat-member-proposals': 'view_riksdagen_person_signed_document_summary',
  'stat-committee-role-members': 'view_riksdagen_committee_role_member',
  'stat-party-members': 'view_riksdagen_party_member',
  'stat-party-summary': 'view_riksdagen_party_summary',
  'stat-ballot-summaries': 'view_riksdagen_vote_data_ballot_party_summary',
  'stat-political-parties': 'sweden_political_party',
  'stat-assignments': 'assignment_data',
  'stat-document-attachments': 'document_attachment',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format a value for display with locale-aware number separators.
 */
function formatDisplayValue(value: number | string): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  const normalized = value.replace(/[,.\s]/g, '');
  if (/^[0-9]+$/.test(normalized)) {
    return Number(normalized).toLocaleString();
  }
  return value;
}

/**
 * Update all DOM elements that display a specific stat identifier.
 *
 * Targets both `id` matches and `data-stat-id` attribute selectors so the
 * same metric stays consistent across hero panels and detail sections.
 */
function updateStat(identifier: string, value: number | string): void {
  if (value === null || value === undefined) return;

  const displayValue = formatDisplayValue(value);

  // Update by ID
  const elById = document.getElementById(identifier) as HTMLElement | null;
  if (elById) {
    elById.textContent = displayValue;
  }

  // Update ALL elements with matching data-stat-id attribute
  const elements = document.querySelectorAll<HTMLElement>(
    `[data-stat-id="${identifier}"]`,
  );
  elements.forEach((el) => {
    el.textContent = displayValue;
  });
}

/**
 * Build a lookup of object_name → row_count from successfully extracted rows.
 */
function buildLookup(rows: ExtractionRow[]): RowCountLookup {
  const lookup: RowCountLookup = {};
  for (const row of rows) {
    if (row.status === 'success' && row.object_name && row.row_count) {
      lookup[row.object_name] = parseInt(row.row_count, 10);
    }
  }
  return lookup;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialise the statistics loader.
 *
 * Fetches the CIA extraction summary CSV, parses it, and populates every
 * mapped DOM element with its formatted metric value.
 *
 * @returns Resolves once all stat elements have been updated (or on error).
 */
export async function init(): Promise<void> {
  try {
    const source = createDataSource(LOCAL_CSV, REMOTE_REPO_PATH);
    const rows = (await loadCSV(source)) as ExtractionRow[];

    if (rows.length === 0) {
      logger.warn('Stats loader: CSV parsed but no data rows found');
      return;
    }

    const lookup = buildLookup(rows);

    let updated = 0;
    for (const [statId, objectName] of Object.entries(STAT_MAPPINGS)) {
      if (objectName in lookup) {
        updateStat(statId, lookup[objectName]!);
        updated++;
      }
    }

    logger.info(
      `Stats loaded from extraction_summary_report.csv (${updated}/${Object.keys(STAT_MAPPINGS).length} stats updated)`,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Stats loader error: ${message}`);
  }
}
