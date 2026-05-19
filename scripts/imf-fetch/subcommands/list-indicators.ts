/**
 * @module scripts/imf-fetch/subcommands/list-indicators
 * @description `imf-fetch list-indicators` and
 * `list-datamapper-indicators` subcommands.
 *
 * `list-indicators` is fully offline (prints the built-in WEO + FM
 * catalogues). `list-datamapper-indicators` hits the live IMF
 * Datamapper catalog endpoint and groups results by dataset.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { ImfClient } from '../../imf/client.js';
import { IMF_FM_INDICATORS } from '../../imf/indicators/fm.js';
import {
  IMF_WEO_DATAMAPPER_AVAILABLE,
  IMF_WEO_INDICATORS,
  IMF_WEO_SDMX_ONLY,
  weoSdmxPath,
} from '../../imf/indicators/weo.js';

export function runListIndicators(): void {
  process.stdout.write(
    `${JSON.stringify(
      {
        weo: IMF_WEO_INDICATORS,
        fm: IMF_FM_INDICATORS,
        weoDatamapperAvailable: [...IMF_WEO_DATAMAPPER_AVAILABLE].sort(),
        weoSdmxOnly: [...IMF_WEO_SDMX_ONLY].sort(),
        weoSdmxPathExample: weoSdmxPath('SWE', 'GGR_NGDP'),
      },
      null,
      2,
    )}\n`,
  );
}

export async function runListDatamapperIndicators(
  flags: ReadonlyMap<string, string>,
): Promise<void> {
  const datasetFilter = flags.get('dataset')?.toUpperCase();
  const client = new ImfClient();
  const catalog = await client.listDatamapperIndicators();
  const filtered = datasetFilter
    ? new Map([...catalog].filter(([, meta]) => meta.dataset.toUpperCase() === datasetFilter))
    : catalog;
  const grouped: Record<string, unknown[]> = {};
  for (const meta of filtered.values()) {
    (grouped[meta.dataset] ??= []).push({
      code: meta.code,
      label: meta.label,
      unit: meta.unit,
      ...(meta.lastUpdate ? { lastUpdate: meta.lastUpdate } : {}),
    });
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        totalIndicators: filtered.size,
        datasets: Object.keys(grouped).sort(),
        byDataset: grouped,
      },
      null,
      2,
    )}\n`,
  );
}
