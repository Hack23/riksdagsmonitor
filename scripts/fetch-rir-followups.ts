#!/usr/bin/env tsx
/**
 * @module scripts/fetch-rir-followups
 * @description CLI script to fetch and update Riksrevisionen (RiR) follow-up
 * records from the Riksdag API.
 *
 * Fetches new skrivelse responses from `riksdag-regering-search_dokument` using
 * `doktyp=skr` (government skrivelse) and matches them against the known RiR
 * follow-up records in `data/rir-followups.json`. Updates record status and
 * emits alerts for overdue deadlines.
 *
 * ## Usage
 *
 *   npx tsx scripts/fetch-rir-followups.ts [--dry-run] [--date YYYY-MM-DD] [--alert]
 *
 * Options:
 *   --dry-run         Print updates without writing to disk
 *   --date YYYY-MM-DD Reference date for deadline calculations (default: today)
 *   --alert           Exit with code 1 if any OVERDUE records detected
 *
 * Environment variables:
 *   RIR_DATA_FILE     Override path to data/rir-followups.json
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadRirDataset,
  saveRirDataset,
  detectOverdueAlerts,
  deriveResponseStatus,
  validateRirDataset,
} from './rir-followups-client.js';
import type { RirFollowUpRecord, RirFollowUpsDataset } from './rir-followups-client.js';

// ---------------------------------------------------------------------------
// Repo root
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DATA_FILE = path.join(REPO_ROOT, 'data', 'rir-followups.json');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

interface CliOptions {
  readonly dryRun: boolean;
  readonly asOf: Date;
  readonly alertOnOverdue: boolean;
  readonly dataFile: string;
}

function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  let dryRun = false;
  let dateStr: string | null = null;
  let alertOnOverdue = false;
  const dataFile = process.env['RIR_DATA_FILE'] ?? DEFAULT_DATA_FILE;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--alert') alertOnOverdue = true;
    else if (arg === '--date' && args[i + 1]) {
      dateStr = args[++i];
    }
  }

  const asOf = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  return { dryRun, asOf, alertOnOverdue, dataFile };
}

// ---------------------------------------------------------------------------
// Riksdag API fetch helpers
// ---------------------------------------------------------------------------

/**
 * Minimal Riksdag API client for fetching skrivelse documents.
 * Uses the public riksdagen.se data API directly (no MCP server required for CLI).
 */
async function fetchRiksdagSkrivelser(
  fromDate: string,
  toDate: string,
  limit = 50,
): Promise<RiksdagDocumentResult[]> {
  const params = new URLSearchParams({
    doktyp: 'skr',
    from: fromDate,
    tom: toDate,
    sz: String(limit),
    utformat: 'json',
    sort: 'datum',
    sortorder: 'desc',
  });

  const url = `https://data.riksdagen.se/dokumentlista/?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    console.error(`[fetch-rir-followups] Network error fetching Riksdag API: ${err}`);
    return [];
  }

  if (!response.ok) {
    console.error(`[fetch-rir-followups] Riksdag API returned ${response.status}`);
    return [];
  }

  let json: RiksdagDocumentListResponse;
  try {
    json = (await response.json()) as RiksdagDocumentListResponse;
  } catch {
    console.error('[fetch-rir-followups] Failed to parse Riksdag API JSON response');
    return [];
  }

  return json?.dokumentlista?.dokument ?? [];
}

interface RiksdagDocumentResult {
  readonly id?: string;
  readonly dok_id?: string;
  readonly titel?: string;
  readonly datum?: string;
  readonly organ?: string;
  readonly typ?: string;
  readonly subtyp?: string;
  readonly beteckning?: string;
  readonly rm?: string;
  readonly url?: string;
}

interface RiksdagDocumentListResponse {
  readonly dokumentlista?: {
    readonly dokument?: RiksdagDocumentResult[];
  };
}

// ---------------------------------------------------------------------------
// Matching logic
// ---------------------------------------------------------------------------

/**
 * Attempt to match a Riksdag skrivelse document against known RiR follow-up
 * records by looking for the RiR report ID in the document title or related
 * document ID fields.
 */
function matchSkrivelse(
  skrivelse: RiksdagDocumentResult,
  records: readonly RirFollowUpRecord[],
): RirFollowUpRecord | null {
  const title = (skrivelse.titel ?? '').toLowerCase();
  const docId = skrivelse.dok_id ?? skrivelse.id ?? '';

  for (const record of records) {
    // Match on rir_report_id in title
    if (title.includes(record.rir_report_id.toLowerCase())) return record;
    // Match on rir_number (e.g. "RiR 2026:6") in title
    const rirNum = record.rir_number.toLowerCase();
    if (title.includes(rirNum)) return record;
    // Match on response_skrivelse_id (document already matched)
    if (record.response_skrivelse_id && docId.includes(record.response_skrivelse_id)) return record;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  console.log(`[fetch-rir-followups] Loading dataset from: ${opts.dataFile}`);
  let dataset: RirFollowUpsDataset;
  try {
    dataset = loadRirDataset(opts.dataFile);
  } catch (err) {
    console.error(`[fetch-rir-followups] Failed to load dataset: ${err}`);
    process.exit(1);
  }

  // Validate dataset on load
  const validationErrors = validateRirDataset(dataset);
  if (validationErrors.size > 0) {
    console.warn(`[fetch-rir-followups] Validation warnings in dataset:`);
    for (const [id, errors] of validationErrors) {
      for (const e of errors) {
        console.warn(`  ${id}: ${e}`);
      }
    }
  }

  // Fetch recent skrivelser (last 90 days)
  const toDate = opts.asOf.toISOString().slice(0, 10);
  const fromDate90 = new Date(opts.asOf);
  fromDate90.setDate(fromDate90.getDate() - 90);
  const fromDate = fromDate90.toISOString().slice(0, 10);

  console.log(`[fetch-rir-followups] Fetching skrivelser from ${fromDate} to ${toDate} ...`);
  const skrivelser = await fetchRiksdagSkrivelser(fromDate, toDate);
  console.log(`[fetch-rir-followups] Fetched ${skrivelser.length} skrivelse documents`);

  // Match and update records
  let updatedCount = 0;
  const updatedRecords = dataset.records.map((record): RirFollowUpRecord => {
    if (record.gov_response_status === 'RESPONDED') return record;

    for (const skr of skrivelser) {
      if (matchSkrivelse(skr, [record])) {
        const newId = skr.beteckning ?? skr.dok_id ?? skr.id ?? null;
        if (newId && !record.response_skrivelse_id) {
          console.log(
            `[fetch-rir-followups] Matched response for ${record.rir_report_id}: ${newId}`,
          );
          updatedCount++;
          return {
            ...record,
            gov_response_status: 'RESPONDED',
            response_skrivelse_id: newId,
          };
        }
      }
    }

    // Re-derive status based on deadline
    const derivedStatus = deriveResponseStatus(record, opts.asOf);
    if (derivedStatus !== record.gov_response_status) {
      console.log(
        `[fetch-rir-followups] Status update for ${record.rir_report_id}: ${record.gov_response_status} → ${derivedStatus}`,
      );
      updatedCount++;
      return { ...record, gov_response_status: derivedStatus };
    }

    return record;
  });

  // Detect overdue alerts
  const updatedDataset: RirFollowUpsDataset = { ...dataset, records: updatedRecords };
  const alerts = detectOverdueAlerts(updatedDataset, opts.asOf);

  if (alerts.length > 0) {
    console.warn(`\n⚠️  OVERDUE SKRIVELSE ALERTS (${alerts.length}):`);
    for (const alert of alerts) {
      console.warn(
        `  🚨 ${alert.rir_number} | ${alert.title} | Deadline: ${alert.skrivelse_deadline} | ${alert.days_overdue} days overdue`,
      );
    }
    console.warn('');
  } else {
    console.log('[fetch-rir-followups] No overdue skrivelse deadlines detected.');
  }

  // Persist
  if (!opts.dryRun) {
    if (updatedCount > 0 || alerts.length > 0) {
      saveRirDataset(updatedDataset, opts.dataFile);
      console.log(`[fetch-rir-followups] Dataset saved (${updatedCount} record(s) updated).`);
    } else {
      console.log('[fetch-rir-followups] No changes — dataset not rewritten.');
    }
  } else {
    console.log('[fetch-rir-followups] --dry-run: no changes written to disk.');
  }

  // Alert exit code
  if (opts.alertOnOverdue && alerts.length > 0) {
    console.error(`[fetch-rir-followups] Exiting with code 1: ${alerts.length} overdue alert(s).`);
    process.exit(1);
  }

  console.log('[fetch-rir-followups] Done.');
}

// Run CLI when invoked directly
if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main().catch((err: unknown) => {
    console.error('[fetch-rir-followups] Fatal:', err);
    process.exit(1);
  });
}
