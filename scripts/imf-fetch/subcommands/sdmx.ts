/**
 * @module scripts/imf-fetch/subcommands/sdmx
 * @description `imf-fetch sdmx` — low-level SDMX 3.0 passthrough
 * (IFS / BOP / DOTS / GFS_COFOG / MFS / PCPS / ER / full WEO 9.0.0).
 *
 * Requires `IMF_SDMX_SUBSCRIPTION_KEY` — the subcommand does not
 * enforce this; the transport surfaces a descriptive error on 401 /
 * 403 / masked 404 (see `errors/http-error.ts`).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { ImfClient } from '../../imf/client.js';
import { persistIMFData } from '../../parliamentary-data/data-persistence.js';
import { requireFlag } from '../args.js';

export async function runSdmx(
  flags: ReadonlyMap<string, string>,
  booleans: ReadonlySet<string>,
): Promise<void> {
  const pathWithQuery = requireFlag(flags, 'path');
  const client = new ImfClient();
  const raw = await client.sdmxFetch(pathWithQuery);
  process.stdout.write(`${JSON.stringify(raw, null, 2)}\n`);

  if (booleans.has('persist')) {
    const indicator =
      flags.get('indicator') ?? pathWithQuery.split('/').slice(-2)[0] ?? 'sdmx';
    const country = flags.get('country') ?? 'all';
    persistIMFData(indicator, country, raw, { database: flags.get('database') ?? 'SDMX' });
  }
}
