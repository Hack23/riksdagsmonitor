#!/usr/bin/env tsx
/**
 * @module scripts/scb-fetch
 * @description CLI wrapper around the SCB MCP client for Swedish ground-truth
 * quantitative layers used alongside the IMF economic canon.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { SCBClient } from './scb-client.js';
import { persistSCBData } from './parliamentary-data/data-persistence.js';

export type SCBPresetKey = 'cpi' | 'aku' | 'household-economy' | 'fuel-prices';

export interface SCBPreset {
  readonly key: SCBPresetKey;
  readonly tableId: string;
  readonly label: string;
  readonly domain: string;
  readonly defaultValueCodes: Readonly<Record<string, string>>;
  readonly notes: string;
}

export interface SCBEconomicProvenance {
  readonly provider: 'scb';
  readonly dataflow: 'SCB PxWeb';
  readonly indicator: string;
  readonly tableId: string;
  readonly retrieved_at: string;
  readonly mcpTool: 'query_table';
}

export interface SCBFetchPayload {
  readonly provider: 'scb';
  readonly preset?: SCBPresetKey;
  readonly tableId: string;
  readonly label?: string;
  readonly valueCodes: Readonly<Record<string, string>>;
  readonly data: readonly unknown[];
  readonly status: 'ok' | 'no-data';
  readonly warning?: string;
  readonly economicProvenance: SCBEconomicProvenance;
}

interface ParsedArgs {
  readonly command: 'list-presets' | 'preset' | 'table' | 'help';
  readonly flags: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

export const SCB_PRESETS: readonly SCBPreset[] = Object.freeze([
  {
    key: 'cpi',
    tableId: '0000003N',
    label: 'Consumer Price Index (KPI)',
    domain: 'inflation',
    defaultValueCodes: Object.freeze({ Tid: 'top(12)' }),
    notes: 'Monthly CPI / KPI layer for disposable-income and cost-of-living transmission analysis.',
  },
  {
    key: 'aku',
    tableId: '000003V8',
    label: 'Labour Force Survey (AKU)',
    domain: 'labour',
    defaultValueCodes: Object.freeze({ Tid: 'top(8)' }),
    notes: 'Quarterly labour-market layer for AKU unemployment and employment comparisons.',
  },
  {
    key: 'household-economy',
    tableId: 'HE0110A',
    label: 'Household economy (HEK / income distribution)',
    domain: 'household economy',
    defaultValueCodes: Object.freeze({ Tid: 'top(5)' }),
    notes: 'Household income and distribution layer for disposable-income impact estimates.',
  },
  {
    key: 'fuel-prices',
    tableId: 'PR0101A',
    label: 'Fuel and energy consumer-price components',
    domain: 'prices',
    defaultValueCodes: Object.freeze({ Tid: 'top(12)' }),
    notes: 'Fuel-price component layer for pump-price to CPI transmission analysis.',
  },
] as const);

const HELP = `tsx scripts/scb-fetch.ts <command> [flags]

Commands:
  list-presets  Print curated KPI / AKU / HEK / fuel-price presets
  preset        Fetch one curated preset by --preset
  table         Fetch one SCB table by --table-id
  help          Show this message

Flags:
  --preset <KEY>          cpi | aku | household-economy | fuel-prices
  --table-id <ID>         SCB table ID for table command
  --value-codes <JSON>    PxWeb value_codes JSON, e.g. '{"Tid":"top(10)"}'
  --periods <N>           Convenience fallback for Tid=top(N)
  --persist               Write output under analysis/data/scb/
`;

export function parseSCBArgs(argv: readonly string[]): ParsedArgs {
  const command = (argv[0] ?? 'help') as ParsedArgs['command'];
  const validCommands: readonly ParsedArgs['command'][] = ['list-presets', 'preset', 'table', 'help'];
  if (!validCommands.includes(command)) throw new Error(`unknown command ${command}`);

  const flags = new Map<string, string>();
  const booleans = new Set<string>();
  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) throw new Error(`unexpected positional argument ${token}`);
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      booleans.add(key);
    }
  }
  return { command, flags, booleans };
}

export function requireSCBFlag(flags: ReadonlyMap<string, string>, key: string): string {
  const value = flags.get(key);
  if (!value) throw new Error(`missing required flag --${key}`);
  return value;
}

export function parseSCBPreset(value: string): SCBPreset {
  const preset = SCB_PRESETS.find((item) => item.key === value);
  if (!preset) throw new Error(`unknown SCB preset ${value}`);
  return preset;
}

export function parseSCBValueCodes(raw: string | undefined, periods: string | undefined): Record<string, string> {
  if (raw) {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('--value-codes must be a JSON object');
    }
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
    );
  }
  if (periods) {
    const count = Number.parseInt(periods, 10);
    if (!Number.isInteger(count) || count < 1) throw new Error('--periods must be a positive integer');
    return { Tid: `top(${count})` };
  }
  return {};
}

export async function fetchSCBTablePayload(
  tableId: string,
  valueCodes: Readonly<Record<string, string>>,
  options: { preset?: SCBPreset; client?: SCBClient } = {},
): Promise<SCBFetchPayload> {
  const client = options.client ?? new SCBClient();
  const data = await client.getTableData(tableId, { ...valueCodes });
  const retrievedAt = new Date().toISOString();
  const status = data.length > 0 ? 'ok' : 'no-data';
  return {
    provider: 'scb',
    ...(options.preset ? { preset: options.preset.key, label: options.preset.label } : {}),
    tableId,
    valueCodes,
    data,
    status,
    ...(status === 'no-data' ? { warning: 'SCB returned no rows; callers should fall back to cached data if available.' } : {}),
    economicProvenance: {
      provider: 'scb',
      dataflow: 'SCB PxWeb',
      indicator: tableId,
      tableId,
      retrieved_at: retrievedAt,
      mcpTool: 'query_table',
    },
  };
}

async function runTable(
  tableId: string,
  valueCodes: Readonly<Record<string, string>>,
  booleans: ReadonlySet<string>,
  preset?: SCBPreset,
): Promise<void> {
  const payload = await fetchSCBTablePayload(tableId, valueCodes, { ...(preset ? { preset } : {}) });
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (booleans.has('persist')) {
    persistSCBData(tableId, payload, {
      provider: 'scb',
      ...(preset ? { preset: preset.key } : {}),
      valueCodes,
    });
  }
}

async function main(): Promise<void> {
  const { command, flags, booleans } = parseSCBArgs(process.argv.slice(2));
  switch (command) {
    case 'list-presets':
      process.stdout.write(`${JSON.stringify({ presets: SCB_PRESETS }, null, 2)}\n`);
      return;
    case 'preset': {
      const preset = parseSCBPreset(requireSCBFlag(flags, 'preset'));
      const valueCodes = {
        ...preset.defaultValueCodes,
        ...parseSCBValueCodes(flags.get('value-codes'), flags.get('periods')),
      };
      await runTable(preset.tableId, valueCodes, booleans, preset);
      return;
    }
    case 'table': {
      const tableId = requireSCBFlag(flags, 'table-id');
      const valueCodes = parseSCBValueCodes(flags.get('value-codes'), flags.get('periods'));
      await runTable(tableId, valueCodes, booleans);
      return;
    }
    case 'help':
    default:
      process.stdout.write(HELP);
  }
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isDirectExecution()) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`scb-fetch: ${message}\n`);
    process.exit(/^(missing|unknown|unexpected|--)/i.test(message) ? 2 : 1);
  });
}
