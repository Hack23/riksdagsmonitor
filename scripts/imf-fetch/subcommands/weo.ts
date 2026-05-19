/**
 * @module scripts/imf-fetch/subcommands/weo
 * @description `imf-fetch weo` subcommand entry.
 *
 * Thin wrapper around {@link fetchWeoPayload} — parses flags, writes
 * stdout, optionally persists. The pipeline orchestration lives in
 * `weo-pipeline.ts` so this file can stay ≤ 150 lines.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { requireFlag } from '../args.js';
import { maybePersistWeoPayload } from '../persist.js';
import { fetchWeoPayload } from '../weo-pipeline.js';

export async function runWeo(
  flags: ReadonlyMap<string, string>,
  booleans: ReadonlySet<string>,
): Promise<void> {
  const country = requireFlag(flags, 'country').toUpperCase();
  const indicator = requireFlag(flags, 'indicator');
  const years = Number.parseInt(flags.get('years') ?? '10', 10);
  if (!Number.isInteger(years) || years < 1) {
    process.stderr.write(
      `imf-fetch: --years must be a positive integer, got ${flags.get('years')}\n`,
    );
    process.exit(2);
  }

  const payload = await fetchWeoPayload({ country, indicator, years });
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  maybePersistWeoPayload(payload, flags, booleans);
}
