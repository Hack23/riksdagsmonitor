/**
 * @module CIA/Loaders/Demographics
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the parliamentary demographics dashboard from CIA CSV exports.
 * Joins gender and experience distributions for the 8 Riksdag parties.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type {
  DemographicsDashboard,
  ExperienceEntry,
  GenderEntry
} from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import { CSV_SOURCES, RIKSDAG_PARTIES } from '../sources.js';

/**
 * Build `DemographicsDashboard` from CSV sources.
 *
 * @param loadCSV - CSV loader closure
 * @returns Gender and experience distribution rows for Riksdag parties only
 */
export async function loadDemographics(loadCSV: LoadCSV): Promise<DemographicsDashboard> {
  const [genderRows, experienceRows] = await Promise.all([
    loadCSV(CSV_SOURCES.genderByParty.local),
    loadCSV(CSV_SOURCES.experienceByParty.local)
  ]);

  const genderByParty: GenderEntry[] = genderRows
    .filter(r => RIKSDAG_PARTIES.includes(r.party as string))
    .map(r => ({
      party: r.party as string,
      gender: r.gender as string,
      count: (r.count as number) || 0
    }));

  const experienceByParty: ExperienceEntry[] = experienceRows
    .filter(r => RIKSDAG_PARTIES.includes(r.party as string))
    .map(r => ({
      party: r.party as string,
      experienceLevel: (r.experience_level as string) || '',
      politicianCount: (r.politician_count as number) || 0
    }));

  return {
    title: 'Parliamentary Demographics',
    description: 'Gender and experience distribution from CIA database exports',
    lastUpdated: new Date().toISOString(),
    genderByParty,
    experienceByParty,
    _source: 'csv'
  };
}
