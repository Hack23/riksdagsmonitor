/**
 * @module scripts/statskontoret/source-registry
 * @description Frozen catalogue of Statskontoret open-data sources.
 *
 * Pure data — kept in its own module so test fixtures can swap or extend
 * the registry without dragging in the HTTP client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { StatskontoretError } from './errors.js';
import type {
  StatskontoretSourceDefinition,
  StatskontoretSourceKey,
} from './types.js';

export const STATSKONTORET_BASE_URL = 'https://www.statskontoret.se';

export const STATSKONTORET_SOURCES: readonly StatskontoretSourceDefinition[] = Object.freeze([
  {
    key: 'myndighetsforteckning',
    title: 'Myndighetsförteckning – öppna data',
    url: '/analys-och-statistik/oppna-data/myndighetsforteckning/',
    cadence: 'Annual snapshot; Statskontoret page metadata currently indicates 2026-02-06 update for the 2025 workbook.',
    coverage: 'Summary statistics, 2007–2025 time series, latest authority list and full 2007–2025 authority register.',
    primaryUse: 'Government-body headcount, authority count, leadership form and department grouping over time.',
  },
  {
    key: 'budget-time-series',
    title: 'Tidsserier, statens budget m.m.',
    url: '/analys-och-statistik/officiell-statistik/tidsserier-statens-budget-m.m',
    cadence: 'Annual official statistics release.',
    coverage: 'Final outcomes for central-government revenue, expenditure, balance and related public-finance tables, generally from 1995.',
    primaryUse: 'Long-run fiscal context for committee and budget-cycle analysis.',
  },
  {
    key: 'arsutfall',
    title: 'Årsutfall för statens budget – öppna data',
    url: '/analys-och-statistik/oppna-data/arsutfall/',
    cadence: 'Annual, with preliminary and definitive releases.',
    coverage: 'Annual central-government revenue and expenditure outturns based on Hermes reporting and Riksdag/government budget decisions.',
    primaryUse: 'Yearly budget execution context by appropriation, income title and agency.',
  },
  {
    key: 'manadsutfall',
    title: 'Månadsutfall för statens budget – öppna data',
    url: '/analys-och-statistik/oppna-data/manadsutfall/',
    cadence: 'Monthly.',
    coverage: 'Monthly central-government revenue and expenditure outcomes from January 2006 onward at low-level agency/account granularity.',
    primaryUse: 'High-frequency budget execution context and agency-level fiscal monitoring.',
  },
]);

export function getStatskontoretSource(key: StatskontoretSourceKey): StatskontoretSourceDefinition {
  const source = STATSKONTORET_SOURCES.find((candidate) => candidate.key === key);
  if (!source) throw new StatskontoretError(`Unknown Statskontoret source: ${key}`);
  return source;
}
