/**
 * @module scripts/imf-fetch/cli
 * @description Argv router for the `imf-fetch` CLI.
 *
 * Each subcommand lives in `subcommands/<name>.ts`; this file is
 * intentionally a thin switch so adding a new subcommand is a single
 * import + case.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { parseArgs } from './args.js';
import { HELP } from './help.js';
import { runCompare } from './subcommands/compare.js';
import {
  runListDatamapperIndicators,
  runListIndicators,
} from './subcommands/list-indicators.js';
import { runSdmx } from './subcommands/sdmx.js';
import { runWeo } from './subcommands/weo.js';

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<void> {
  const { command, flags, booleans } = parseArgs(argv);
  switch (command) {
    case 'weo':
      await runWeo(flags, booleans);
      return;
    case 'compare':
      await runCompare(flags, booleans);
      return;
    case 'sdmx':
      await runSdmx(flags, booleans);
      return;
    case 'list-indicators':
      runListIndicators();
      return;
    case 'list-datamapper-indicators':
      await runListDatamapperIndicators(flags);
      return;
    case 'help':
    default:
      process.stdout.write(HELP);
      return;
  }
}
