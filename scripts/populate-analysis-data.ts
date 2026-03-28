#!/usr/bin/env npx tsx
/**
 * @module populate-analysis-data
 * @description Standalone script that fetches recent data from **all** MCP sources
 * (riksdag-regering, SCB, World Bank) and persists it to `analysis/data/`.
 *
 * This populates the analysis folder with **all** supported data types:
 * - **Documents**: propositions, motions, committeeReports, votes, speeches,
 *   questions, interpellations
 * - **Calendar events**: upcoming parliamentary events
 * - **MPs**: current member profiles
 * - **Government documents**: recent government publications (regeringen.se)
 * - **Voting groups**: party-level voting patterns
 * - **World Bank indicators**: Swedish economic context (GDP, unemployment, etc.)
 * - **SCB statistics**: Swedish official statistics for key policy domains
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
  persistMCPResponse,
  persistWorldBankData,
  persistSCBData,
  getDataRoot,
} from './pre-article-analysis/data-persistence.js';
import type { RawDocument } from './data-transformers/types.js';
import {
  WorldBankClient,
  INDICATOR_IDS,
  COUNTRY_CODES,
} from './world-bank-client.js';
import {
  SCBClient,
  SCB_DOMAINS,
} from './scb-client.js';

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

/** Resolve an identifier for a government document. */
function resolveGovDocId(doc: RawDocument, index: number): string {
  const record = doc as Record<string, unknown>;
  const candidates = [
    record['id'],
    record['dok_id'],
    record['title'],
    record['titel'],
  ];
  const raw = candidates.find(
    (c): c is string => typeof c === 'string' && c.trim().length > 0,
  )?.trim() ?? `gov-${index + 1}`;
  // Simple sanitisation: lowercase, replace non-alphanum with hyphens, collapse
  return raw.toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `gov-${index + 1}`;
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
  console.log('📄 Step 1/7: Downloading parliamentary documents...');
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
  console.log('\n📅 Step 2/7: Downloading calendar events...');
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
  console.log('\n👤 Step 3/7: Downloading MP profiles...');
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

  // ── Step 4: Download government documents ───────────────────────────────
  console.log('\n🏛️  Step 4/7: Downloading government documents...');
  try {
    const thirtyDaysAgo = new Date(date + 'T00:00:00Z');
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const rawGovDocs = await client.fetchGovernmentDocuments({
      dateFrom: formatDate(thirtyDaysAgo),
      dateTo: date,
      limit,
    });
    const govDocs: RawDocument[] = (Array.isArray(rawGovDocs) ? rawGovDocs : []) as RawDocument[];
    console.log(`   ✅ Downloaded ${govDocs.length} government documents`);

    let govWritten = 0;
    for (let i = 0; i < govDocs.length; i++) {
      const doc = govDocs[i];
      if (!doc) continue;
      persistMCPResponse(
        { tool: 'search_regering', params: { limit }, server: 'riksdag-regering' },
        doc,
        resolveGovDocId(doc, i),
      );
      govWritten++;
    }
    console.log(`   🗄️  Persisted ${govWritten} government document files`);
  } catch (err) {
    console.error('   ❌ Government document download failed:', errorMessage(err));
  }

  // ── Step 5: Download voting groups by party ─────────────────────────────
  console.log('\n🗳️  Step 5/7: Downloading voting groups by party...');
  try {
    const rawGroups = await client.fetchVotingGroup({ rm, groupBy: 'parti', limit });
    const groups: RawDocument[] = (Array.isArray(rawGroups) ? rawGroups : []) as RawDocument[];
    console.log(`   ✅ Downloaded ${groups.length} voting group records`);

    let voteGroupWritten = 0;
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;
      const record = group as Record<string, unknown>;
      const id = (typeof record['parti'] === 'string' && record['parti'])
        || `group-${i + 1}`;
      persistMCPResponse(
        { tool: 'get_voting_group', params: { rm, groupBy: 'parti' }, server: 'riksdag-regering' },
        group,
        `${rm.replace('/', '-')}-${id}`,
      );
      voteGroupWritten++;
    }
    console.log(`   🗄️  Persisted ${voteGroupWritten} voting group files`);
  } catch (err) {
    console.error('   ❌ Voting group download failed:', errorMessage(err));
  }

  // ── Step 6: Download World Bank indicators for Sweden ───────────────────
  console.log('\n🌍 Step 6/7: Downloading World Bank indicators for Sweden...');
  try {
    const wb = new WorldBankClient();
    const indicatorEntries = Object.entries(INDICATOR_IDS);
    let wbWritten = 0;
    let wbFailed = 0;

    for (const [_name, indicatorId] of indicatorEntries) {
      try {
        const dataPoints = await wb.getIndicator(COUNTRY_CODES.sweden, indicatorId, 10);
        if (dataPoints.length > 0) {
          persistWorldBankData(indicatorId, COUNTRY_CODES.sweden, dataPoints);
          wbWritten++;
        }
      } catch {
        wbFailed++;
      }
    }
    console.log(`   ✅ Persisted ${wbWritten}/${indicatorEntries.length} World Bank indicators (${wbFailed} failed)`);
  } catch (err) {
    console.error('   ❌ World Bank data download failed:', errorMessage(err));
  }

  // ── Step 7: Download SCB statistics for key domains ─────────────────────
  console.log('\n📊 Step 7/7: Downloading SCB statistics...');
  try {
    const scb = new SCBClient();
    const domainsWithTables = SCB_DOMAINS.filter(d => d.tables.length > 0);
    let scbWritten = 0;
    let scbFailed = 0;

    for (const domain of domainsWithTables) {
      for (const tableId of domain.tables) {
        try {
          const data = await scb.getTableData(tableId);
          if (data && (Array.isArray(data) ? data.length > 0 : true)) {
            persistSCBData(tableId, data, { domain: domain.domain, query: domain.query });
            scbWritten++;
          }
        } catch {
          scbFailed++;
        }
      }
    }
    console.log(`   ✅ Persisted ${scbWritten} SCB tables (${scbFailed} failed)`);
  } catch (err) {
    console.error('   ❌ SCB data download failed:', errorMessage(err));
  }

  console.log('\n✅ Analysis data population complete.');
  console.log(`   📂 Data written to: ${getDataRoot()}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
