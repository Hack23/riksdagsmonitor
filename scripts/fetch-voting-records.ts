#!/usr/bin/env tsx
/**
 * @module scripts/fetch-voting-records
 * @description Fetch party-level and individual voting records from the
 * riksdag-regering MCP for betänkanden listed in an analysis manifest.
 *
 * Usage:
 *   npx tsx scripts/fetch-voting-records.ts --date 2026-04-27 --doc-type committeeReports [--persist]
 *   npx tsx scripts/fetch-voting-records.ts --date 2026-04-27 [--persist]
 *
 * Output:
 *   data/voteringar/{date}/{sanitized_bet}.json   — one file per betänkande
 *   analysis/daily/{date}/{docType}/voting-records/  — injection templates (--persist)
 *
 * Exit codes:
 *   0 — success
 *   1 — runtime / network error
 *   2 — bad CLI arguments
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MCPClient } from './mcp-client.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedVotingArgs {
  readonly date: string;
  readonly docType: string | null;
  readonly persist: boolean;
}

export interface PartyVoteRow {
  parti: string;
  ja: number;
  nej: number;
  avstar: number;
  franvarande: number;
}

export interface DefectorRecord {
  iid: string;
  intressentNamn: string;
  parti: string;
  rost: string;
  partyMajority: string;
}

export interface VotingRecordOutput {
  bet: string;
  rm: string | null;
  fetchedAt: string;
  status: 'fetched' | 'vote_pending' | 'not_found' | 'error';
  partyVotes: PartyVoteRow[];
  defectors: DefectorRecord[];
  mermaidDiagram: string;
  errorMessage?: string;
  injectionMarkdown?: string;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ParseArgsResult {
  readonly args: ParsedVotingArgs;
  readonly error: string | null;
}

export function parseArgs(argv: readonly string[]): ParseArgsResult {
  const flags = new Map<string, string>();
  const booleans = new Set<string>();

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      booleans.add(key);
    }
  }

  const dateRaw = flags.get('date') ?? new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(dateRaw)) {
    return {
      args: { date: '', docType: null, persist: false },
      error: `--date must be YYYY-MM-DD, got: ${dateRaw}`,
    };
  }

  return {
    args: {
      date: dateRaw,
      docType: flags.get('doc-type') ?? null,
      persist: booleans.has('persist'),
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Manifest parsing — extract `bet` values from data-download-manifest.md
// ---------------------------------------------------------------------------

export function extractBetValues(manifestText: string): string[] {
  const bets = new Set<string>();

  const BET_RE = /\b([A-ZÅÄÖ][a-zåäöA-ZÅÄÖ]{0,4}\d+)\b/g;
  for (const match of manifestText.matchAll(BET_RE)) {
    const candidate = match[1];
    if (!candidate) continue;
    if (/^[A-ZÅÄÖ]\d{4}$/.test(candidate)) continue;
    const letterPart = candidate.replace(/\d+$/, '');
    if (/^(Se|En|Sv|Da|No|Fi|De|Fr|Es|Nl|Ar|He|Ja|Ko|Zh|Id|Ok|In|As|At|By|Be|Do|Go|Is|It|If|Of|On|Or|To|Up|Us|We)$/i.test(letterPart)) continue;
    bets.add(candidate);
  }

  return [...bets];
}

// ---------------------------------------------------------------------------
// Defector detection
// ---------------------------------------------------------------------------

/**
 * Given individual voting records for a betänkande, compute defectors.
 * An MP is a defector if they voted differently from their party's majority.
 */
export function detectDefectors(votes: unknown[]): {
  defectors: DefectorRecord[];
  status: 'fetched' | 'vote_pending';
} {
  if (!votes.length) {
    return { defectors: [], status: 'vote_pending' };
  }

  const partyTally = new Map<string, Map<string, number>>();
  for (const rawVote of votes) {
    const vote = rawVote as Record<string, unknown>;
    const parti = String(vote['parti'] ?? vote['party'] ?? '');
    const rost = String(vote['rost'] ?? vote['vote'] ?? '');
    if (!parti || !rost) continue;

    if (!partyTally.has(parti)) partyTally.set(parti, new Map());
    const tally = partyTally.get(parti)!;
    tally.set(rost, (tally.get(rost) ?? 0) + 1);
  }

  const partyMajority = new Map<string, string>();
  for (const [parti, tally] of partyTally) {
    let maxCount = 0;
    let majorityVote = '';
    let isTied = false;
    for (const [rost, count] of tally) {
      if (count > maxCount) {
        maxCount = count;
        majorityVote = rost;
        isTied = false;
      } else if (count === maxCount && count > 0 && rost !== majorityVote) {
        isTied = true;
      }
    }
    if (!isTied && majorityVote) {
      partyMajority.set(parti, majorityVote);
    }
  }

  const defectors: DefectorRecord[] = [];
  for (const rawVote of votes) {
    const vote = rawVote as Record<string, unknown>;
    const parti = String(vote['parti'] ?? vote['party'] ?? '');
    const rost = String(vote['rost'] ?? vote['vote'] ?? '');
    const iid = String(vote['iid'] ?? vote['intressent_id'] ?? '');
    const namn = String(
      vote['intressentNamn'] ??
      vote['namn'] ??
      vote['name'] ??
      vote['tilltalsnamn'] ??
      '',
    );

    if (!parti || !rost) continue;
    const majority = partyMajority.get(parti) ?? '';
    if (majority && rost !== majority && rost !== 'Frånvarande') {
      defectors.push({
        iid,
        intressentNamn: namn,
        parti,
        rost,
        partyMajority: majority,
      });
    }
  }

  return { defectors, status: 'fetched' };
}

// ---------------------------------------------------------------------------
// Mermaid diagram generation
// ---------------------------------------------------------------------------

/**
 * Generate a Mermaid xychart-beta (bar chart) showing party vote distribution.
 * Falls back to a markdown table comment if there are no rows.
 */
export function generateMermaidVoteChart(partyVotes: PartyVoteRow[], bet: string): string {
  if (!partyVotes.length) {
    return `%%{init: {"theme": "base"}}%%\nflowchart LR\n  NA["No voting data for ${bet}"]`;
  }

  const sorted = [...partyVotes].sort(
    (a, b) => (b.ja + b.nej + b.avstar) - (a.ja + a.nej + a.avstar),
  );

  const labels = sorted.map((r) => `"${r.parti}"`).join(', ');
  const jaValues = sorted.map((r) => r.ja).join(', ');
  const nejValues = sorted.map((r) => r.nej).join(', ');
  const avstarValues = sorted.map((r) => r.avstar).join(', ');

  return [
    `%%{init: {"theme": "base"}}%%`,
    `xychart-beta`,
    `  title "Omröstning: ${bet}"`,
    `  x-axis [${labels}]`,
    `  y-axis "Röster" 0 --> ${Math.max(...sorted.map((r) => r.ja + r.nej + r.avstar + r.franvarande), 1)}`,
    `  bar [${jaValues}]`,
    `  bar [${nejValues}]`,
    `  bar [${avstarValues}]`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Markdown injection template
// ---------------------------------------------------------------------------

function buildInjectionMarkdown(record: VotingRecordOutput): string {
  const { bet, status, partyVotes, defectors, mermaidDiagram, errorMessage } = record;

  if (status === 'vote_pending') {
    return [
      `<!-- vote-pending: ${bet} -->`,
      `> **Omröstning ej genomförd** — betänkande \`${bet}\` har ännu inte röstats igenom.`,
      `> Uppdatera med \`fetch-voting-records.ts --date {date}\` när omröstningen är avslutad.`,
    ].join('\n');
  }

  if (status === 'not_found') {
    return [
      `<!-- vote-not-found: ${bet} -->`,
      `> **Ingen omröstning registrerad** — betänkande \`${bet}\` saknar röstresultat i Riksdagens öppna data`,
      `> (kan vara remiss, procedurellt beslut eller utskottsärende utan kammaravgörande).`,
    ].join('\n');
  }

  if (status === 'error') {
    const detail = errorMessage ? `: ${errorMessage}` : '';
    return [
      `<!-- vote-fetch-error: ${bet} -->`,
      `> **Hämtning av omröstning misslyckades** — \`${bet}\`${detail}.`,
      `> Återhämta med \`fetch-voting-records.ts --date {date}\` när MCP/nätverket är tillgängligt.`,
    ].join('\n');
  }

  const tableRows = partyVotes
    .map((r) => `| ${r.parti} | ${r.ja} | ${r.nej} | ${r.avstar} | ${r.franvarande} |`)
    .join('\n');

  const defectorSection =
    defectors.length > 0
      ? [
          '',
          '#### Partiavvikare',
          '',
          '| Ledamot | Parti | Röstade | Partiets majoritet |',
          '|---------|-------|---------|-------------------|',
          ...defectors.map(
            (d) => `| ${d.intressentNamn || d.iid} | ${d.parti} | ${d.rost} | ${d.partyMajority} |`,
          ),
        ].join('\n')
      : '\n_Inga partiavvikare registrerade._';

  return [
    `### Omröstning: ${bet}`,
    '',
    '| Parti | Ja | Nej | Avstår | Frånv. |',
    '|-------|:--:|:---:|:------:|:------:|',
    tableRows,
    '',
    '```mermaid',
    mermaidDiagram,
    '```',
    defectorSection,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Sanitize bet for filesystem use
// ---------------------------------------------------------------------------

export function sanitizeBet(bet: string): string {
  return bet.toLowerCase().replace(/[^a-z0-9åäö]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Fetch a single bet's voting data
// ---------------------------------------------------------------------------

async function fetchVotingForBet(client: MCPClient, bet: string): Promise<VotingRecordOutput> {
  const fetchedAt = new Date().toISOString();

  let partyVotes: PartyVoteRow[] = [];
  let rawIndividualVotes: unknown[];
  let rm: string | null = null;

  try {
    const groupData = await client.fetchVotingGroup({ bet, groupBy: 'parti', limit: 200 });

    if (groupData.length > 0) {
      partyVotes = groupData.map((row) => {
        const r = row as Record<string, unknown>;
        const parseNum = (v: unknown): number => Number.parseInt(String(v ?? '0'), 10) || 0;
        const parti = String(r['parti'] ?? r['party'] ?? r['Parti'] ?? '');
        rm = rm ?? String(r['rm'] ?? r['riksmote'] ?? '');
        return {
          parti,
          ja: parseNum(r['ja'] ?? r['Ja'] ?? r['yes']),
          nej: parseNum(r['nej'] ?? r['Nej'] ?? r['no']),
          avstar: parseNum(r['avstar'] ?? r['Avstår'] ?? r['abstain'] ?? r['avstar_antal']),
          franvarande: parseNum(r['franvarande'] ?? r['Frånvarande'] ?? r['absent']),
        };
      }).filter((r) => r.parti !== '');
    }

    rawIndividualVotes = await client.fetchVotingRecords({ bet, limit: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`⚠️  fetch-voting-records: MCP error for bet=${bet}: ${message}\n`);
    const errorRecord: VotingRecordOutput = {
      bet,
      rm: null,
      fetchedAt,
      status: 'error',
      partyVotes: [],
      defectors: [],
      mermaidDiagram: generateMermaidVoteChart([], bet),
      errorMessage: message,
    };
    errorRecord.injectionMarkdown = buildInjectionMarkdown(errorRecord);
    return errorRecord;
  }

  if (partyVotes.length === 0 && rawIndividualVotes.length === 0) {
    const notFoundRecord: VotingRecordOutput = {
      bet,
      rm: rm || null,
      fetchedAt,
      status: 'not_found',
      partyVotes: [],
      defectors: [],
      mermaidDiagram: generateMermaidVoteChart([], bet),
    };
    notFoundRecord.injectionMarkdown = buildInjectionMarkdown(notFoundRecord);
    return notFoundRecord;
  }

  const { defectors } = detectDefectors(rawIndividualVotes);
  const mermaidDiagram = generateMermaidVoteChart(partyVotes, bet);

  const record: VotingRecordOutput = {
    bet,
    rm: rm || null,
    fetchedAt,
    status: 'fetched',
    partyVotes,
    defectors,
    mermaidDiagram,
  };

  record.injectionMarkdown = buildInjectionMarkdown(record);
  return record;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { args, error } = parseArgs(process.argv.slice(2));
  if (error) {
    process.stderr.write(`fetch-voting-records: ${error}\n`);
    process.exit(2);
  }

  const { date, docType, persist } = args;

  const dailyRoot = path.join(REPO_ROOT, 'analysis', 'daily', date);
  const manifestPaths: string[] = [];

  if (docType) {
    const p = path.join(dailyRoot, docType, 'data-download-manifest.md');
    if (fs.existsSync(p)) manifestPaths.push(p);
  } else {
    if (fs.existsSync(dailyRoot)) {
      for (const entry of fs.readdirSync(dailyRoot, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const p = path.join(dailyRoot, entry.name, 'data-download-manifest.md');
          if (fs.existsSync(p)) manifestPaths.push(p);
        }
      }
    }
  }

  const rootManifest = path.join(dailyRoot, 'data-download-manifest.md');
  if (fs.existsSync(rootManifest)) manifestPaths.push(rootManifest);

  if (manifestPaths.length === 0) {
    process.stderr.write(
      `fetch-voting-records: no data-download-manifest.md found under analysis/daily/${date}/\n`,
    );
    process.exit(1);
  }

  const allBets = new Set<string>();
  for (const manifestPath of manifestPaths) {
    const text = fs.readFileSync(manifestPath, 'utf8');
    for (const bet of extractBetValues(text)) {
      allBets.add(bet);
    }
  }

  if (allBets.size === 0) {
    process.stderr.write(`fetch-voting-records: no beteckning values found in manifests\n`);
    process.stdout.write(JSON.stringify({ date, bets: [], results: [] }, null, 2) + '\n');
    process.exit(0);
  }

  process.stderr.write(
    `fetch-voting-records: fetching ${allBets.size} bet(s): ${[...allBets].join(', ')}\n`,
  );

  const client = new MCPClient();
  const results: VotingRecordOutput[] = [];
  const outDir = path.join(REPO_ROOT, 'data', 'voteringar', date);
  fs.mkdirSync(outDir, { recursive: true });

  for (const bet of allBets) {
    const record = await fetchVotingForBet(client, bet);
    results.push(record);

    const outFile = path.join(outDir, `${sanitizeBet(bet)}.json`);
    fs.writeFileSync(outFile, JSON.stringify(record, null, 2) + '\n', 'utf8');
    process.stderr.write(`  ✓ ${bet} → ${path.relative(REPO_ROOT, outFile)} [${record.status}]\n`);

    if (persist && record.injectionMarkdown) {
      const docTypeDirs = docType
        ? [path.join(dailyRoot, docType)]
        : manifestPaths
            .map((p) => path.dirname(p))
            .filter((d) => !d.endsWith(date));

      for (const dtDir of docTypeDirs) {
        const injectionDir = path.join(dtDir, 'voting-records');
        fs.mkdirSync(injectionDir, { recursive: true });
        const injectionFile = path.join(injectionDir, `${sanitizeBet(bet)}.md`);
        fs.writeFileSync(injectionFile, record.injectionMarkdown + '\n', 'utf8');
        process.stderr.write(
          `    📄 injection → ${path.relative(REPO_ROOT, injectionFile)}\n`,
        );
      }
    }
  }

  process.stdout.write(
    JSON.stringify({ date, bets: [...allBets], results }, null, 2) + '\n',
  );
}

// Run if this is the entry point
const isMain =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('fetch-voting-records.ts') ||
    process.argv[1].endsWith('fetch-voting-records.js'));

if (isMain) {
  main().catch((err: unknown) => {
    process.stderr.write(`fetch-voting-records: fatal error: ${String(err)}\n`);
    process.exit(1);
  });
}
