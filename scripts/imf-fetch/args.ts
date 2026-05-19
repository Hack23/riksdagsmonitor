/**
 * @module scripts/imf-fetch/args
 * @description CLI argument parser for `imf-fetch.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export interface ParsedArgs {
  readonly command:
    | 'weo'
    | 'compare'
    | 'sdmx'
    | 'list-indicators'
    | 'list-datamapper-indicators'
    | 'help';
  readonly flags: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = (argv[0] ?? 'help') as ParsedArgs['command'];
  const flags = new Map<string, string>();
  const booleans = new Set<string>();
  for (let i = 1; i < argv.length; i++) {
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
  return { command, flags, booleans };
}

/** Read a required flag or exit with code 2. */
export function requireFlag(flags: ReadonlyMap<string, string>, key: string): string {
  const v = flags.get(key);
  if (!v) {
    process.stderr.write(`imf-fetch: missing required flag --${key}\n`);
    process.exit(2);
  }
  return v;
}
