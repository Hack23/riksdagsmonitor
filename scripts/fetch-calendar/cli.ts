/**
 * @module scripts/fetch-calendar/cli
 * @description CLI argument parsing and main() entry for the fetch-calendar
 * script.
 *
 * Accepts `--to` (preferred) and `--tom` (Swedish alias used in the repo
 * docs) as the end-date flag. Invokes the orchestrator and writes either
 * a persistent JSON file (`--persist`) or pipes the result to stdout.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { fetchCalendarWithFallback } from './orchestrator.js';
import { formatManifestMarkdown, persistCalendarJson } from './manifest.js';

/** Thrown by `parseCalendarArgs` for invalid CLI arguments (exit code 2). */
export class CliArgsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliArgsError';
  }
}

/**
 * Parse CLI argv into `{ from, to, persist }`.
 */
export function parseCalendarArgs(argv: readonly string[]): {
  from: string;
  to: string;
  persist: boolean;
} {
  const flags = new Map<string, string>();
  const booleans = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token || !token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      booleans.add(key);
    }
  }
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const from = flags.get('from') ?? '';
  const to = flags.get('to') ?? flags.get('tom') ?? '';
  if (!ISO_DATE_RE.test(from)) {
    throw new CliArgsError(`--from must be an ISO 8601 date (YYYY-MM-DD), got: "${from}"`);
  }
  if (!ISO_DATE_RE.test(to)) {
    throw new CliArgsError(`--to must be an ISO 8601 date (YYYY-MM-DD), got: "${to}"`);
  }
  return { from, to, persist: booleans.has('persist') };
}

export async function main(): Promise<void> {
  const args = parseCalendarArgs(process.argv.slice(2));
  console.error(`📅 [fetch-calendar] Fetching ${args.from} → ${args.to}`);

  const result = await fetchCalendarWithFallback(args.from, args.to);

  console.error(formatManifestMarkdown(result.manifest));

  if (args.persist) {
    persistCalendarJson(args.from, result);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }

  if (result.manifest.path === 'none') {
    process.exit(1);
  }
}
