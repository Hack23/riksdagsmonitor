/**
 * @module scripts/imf-fetch/subcommands/compare
 * @description `imf-fetch compare` subcommand — fetch the latest WEO
 * value across a peer set of countries.
 *
 * Falls back to cache per country (marking stale fills) so a single
 * IMF outage cannot poison comparative analyses.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { ImfClient } from '../../imf/client.js';
import { persistIMFData } from '../../parliamentary-data/data-persistence.js';
import { requireFlag } from '../args.js';
import { isCacheStale, loadCachedIMFData } from '../cache.js';

export async function runCompare(
  flags: ReadonlyMap<string, string>,
  booleans: ReadonlySet<string>,
): Promise<void> {
  const countriesRaw = requireFlag(flags, 'countries');
  const indicator = requireFlag(flags, 'indicator');
  const countries = countriesRaw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  if (countries.length === 0) {
    process.stderr.write('imf-fetch: --countries is empty\n');
    process.exit(2);
  }

  const client = new ImfClient();
  const results = await client.compareCountriesWeo(countries, indicator);

  const byCountry: Record<string, unknown> = {};
  const cacheFilledCountries: string[] = [];
  let staleAny = false;

  for (const code of countries) {
    const livePoint = results.get(code) ?? null;
    if (livePoint !== null) {
      byCountry[code] = livePoint;
    } else {
      const cached = loadCachedIMFData(indicator, code);
      if (cached) {
        const cachedObj = cached.data as Record<string, unknown>;
        const dataPoint = 'dataPoint' in cachedObj ? cachedObj['dataPoint'] : cachedObj;
        const stale = isCacheStale(cached.meta.fetchedAt);
        if (stale) staleAny = true;
        cacheFilledCountries.push(code);
        byCountry[code] = dataPoint;
      } else {
        byCountry[code] = null;
      }
    }
  }

  const payload: Record<string, unknown> = { indicator, countries, results: byCountry };
  if (cacheFilledCountries.length > 0) {
    payload['_cacheFilledCountries'] = cacheFilledCountries;
    payload['_staleVintage'] = staleAny;
    payload['_vintageAnnotation'] = staleAny
      ? `Cache fill used for ${cacheFilledCountries.join(', ')}; some cached data >6 months old`
      : `Cache fill used for ${cacheFilledCountries.join(', ')}; live fetch returned null`;
    process.stderr.write(
      `imf-fetch: cache fill for ${cacheFilledCountries.join(', ')}${staleAny ? ' (some STALE >6mo)' : ''}\n`,
    );
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

  if (booleans.has('persist')) {
    for (const [code, point] of results) {
      if (point !== null) {
        persistIMFData(
          indicator,
          code,
          { indicator, country: code, dataPoint: point },
          {
            database: flags.get('database') ?? 'WEO',
            ...(point?.projectionVintage ? { projectionVintage: point.projectionVintage } : {}),
          },
        );
      }
    }
  }
}
