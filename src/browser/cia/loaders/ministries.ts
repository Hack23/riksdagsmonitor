/**
 * @module CIA/Loaders/Ministries
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the ministry effectiveness dashboard from CIA CSV exports.
 * Filters out rows without a ministry name or zero documents produced.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type { MinistryDashboard, MinistryEntry } from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import { CSV_SOURCES } from '../sources.js';

/**
 * Build `MinistryDashboard` from CSV sources.
 *
 * @param loadCSV - CSV loader closure
 * @returns Ministry effectiveness rows sorted by documents produced descending
 */
export async function loadMinistryDashboard(loadCSV: LoadCSV): Promise<MinistryDashboard> {
  const rows = await loadCSV(CSV_SOURCES.ministryEffectiveness.local);

  const ministries: MinistryEntry[] = rows
    .filter(r => r.ministry_name && (r.documents_produced as number) > 0)
    .map(r => ({
      name: r.ministry_name as string,
      effectiveness: (r.effectiveness_assessment as string) || '',
      documentsProduced: (r.documents_produced as number) || 0,
      governmentBills: (r.government_bills as number) || 0,
      year: (r.year as number) || 0,
      quarter: (r.quarter as number) || 0
    }))
    .sort((a, b) => b.documentsProduced - a.documentsProduced);

  return {
    title: 'Ministry Performance',
    description: 'Ministry effectiveness from CIA database exports',
    lastUpdated: new Date().toISOString(),
    ministries,
    _source: 'csv'
  };
}
