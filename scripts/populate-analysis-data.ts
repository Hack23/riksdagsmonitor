#!/usr/bin/env npx tsx
/**
 * @module populate-analysis-data
 * @description Standalone script that fetches recent data from all MCP sources
 * (riksdag-regering, SCB, World Bank) and persists it to `analysis/data/`.
 *
 * This populates the analysis folder with all supported data types:
 * - **Documents**: propositions, motions, committeeReports, votes, speeches,
 *   questions, interpellations
 * - **Calendar events**: upcoming parliamentary events
 * - **MPs**: current member profiles
 *
 * The script reuses the existing MCP client and data-persistence modules,
 * ensuring the collision-free sidecar design (data + .meta.json) is
 * consistently applied.
 *
 * Usage:
 *   npx tsx scripts/populate-analysis-data.ts [--limit N] [--date YYYY-MM-DD]
 *
 * Options:
 *   --limit N           Max documents per type (default: 20)
 *   --date YYYY-MM-DD   Target date for analysis (default: today UTC)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { MCPClient } from './mcp-client/client.js';
import {
  downloadAllDocuments,
  flattenDocuments,
} from './pre-article-analysis/data-downloader.js';
import {
  persistDownloadedData,
  persistEvents,
  persistMPs,
  getDataRoot,
} from './pre-article-analysis/data-persistence.js';
import type { RawDocument } from './data-transformers/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute riksmöte from a date string (YYYY-MM-DD).
 *  Swedish parliamentary year runs Oct–Sep. October onwards is the new session. */
export function riksMoteFromDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  if (month >= 10) return `${year}/${String(year + 1).slice(-2)}`;
  return `${year - 1}/${String(year).slice(-2)}`;
}

/** Format a Date to YYYY-MM-DD. */
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Safely extract error message from unknown thrown value. */
function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function parseArgs(): { limit: number; date: string } {
  const args = process.argv.slice(2);
  let limit = 20;
  let date = formatDate(new Date());

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = Math.max(1, parseInt(args[i + 1], 10) || 20);
      i++;
    } else if (args[i] === '--date' && args[i + 1]) {
      date = args[i + 1];
      i++;
    }
  }
  return { limit, date };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { limit, date } = parseArgs();
  const rm = riksMoteFromDate(date);

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   📥 Populate Analysis Data — MCP Data Fetcher             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`   📅 Date: ${date}`);
  console.log(`   🏛️  Riksmöte: ${rm}`);
  console.log(`   📊 Limit: ${limit} per type`);
  console.log(`   📂 Data root: ${getDataRoot()}`);
  console.log('');

  const client = new MCPClient();

  // ── Step 1: Download all document types ─────────────────────────────────
  console.log('📄 Step 1/3: Downloading parliamentary documents...');
  try {
    const { data, manifest } = await downloadAllDocuments(client, { limit, rm });
    const allDocs = flattenDocuments(data);
    console.log(`   ✅ Downloaded ${allDocs.length} documents from ${manifest.dataSources.length} MCP tools (${manifest.durationMs}ms)`);

    const persistResult = persistDownloadedData(data, rm);
    console.log(`   🗄️  Persisted ${persistResult.written} document files (${persistResult.skipped} skipped)`);
  } catch (err) {
    console.error('   ❌ Document download failed:', errorMessage(err));
  }

  // ── Step 2: Download calendar events ────────────────────────────────────
  console.log('\n📅 Step 2/3: Downloading calendar events...');
  try {
    const today = new Date(date + 'T00:00:00Z');
    const twoWeeksAhead = new Date(today);
    twoWeeksAhead.setUTCDate(twoWeeksAhead.getUTCDate() + 14);

    const rawEvents = await client.fetchCalendarEvents(
      formatDate(today),
      formatDate(twoWeeksAhead),
    );
    const events: RawDocument[] = (Array.isArray(rawEvents) ? rawEvents : []) as RawDocument[];
    console.log(`   ✅ Downloaded ${events.length} calendar events`);

    if (events.length > 0) {
      const persistResult = persistEvents(events, rm);
      console.log(`   🗄️  Persisted ${persistResult.written} event files (${persistResult.skipped} skipped)`);
    }
  } catch (err) {
    console.error('   ❌ Calendar event download failed:', errorMessage(err));
  }

  // ── Step 3: Download MP profiles ────────────────────────────────────────
  console.log('\n👤 Step 3/3: Downloading MP profiles...');
  try {
    const rawMPs = await client.fetchMPs({ limit });
    const mps: RawDocument[] = (Array.isArray(rawMPs) ? rawMPs : []) as RawDocument[];
    console.log(`   ✅ Downloaded ${mps.length} MP profiles`);

    if (mps.length > 0) {
      const persistResult = persistMPs(mps, rm);
      console.log(`   🗄️  Persisted ${persistResult.written} MP files (${persistResult.skipped} skipped)`);
    }
  } catch (err) {
    console.error('   ❌ MP download failed:', errorMessage(err));
  }

  console.log('\n✅ Analysis data population complete.');
  console.log(`   📂 Data written to: ${getDataRoot()}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
