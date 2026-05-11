/**
 * @module CIA/Loaders/Committees
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the committee network analysis from CIA CSV exports.
 * Filters out INACTIVE committees with no measured output, deduplicates by
 * name, and produces both the committee table and a derived productivity
 * similarity network graph.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type {
  CSVRow,
  CommitteeEntry,
  CommitteeNetwork,
  NetworkEdge,
  NetworkNode
} from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import {
  COMMITTEE_DOCS_PER_MEETING_ESTIMATE,
  COMMITTEE_ORG_CODES,
  CSV_SOURCES
} from '../sources.js';

/**
 * Build `CommitteeNetwork` analysis from CSV sources.
 * Replaces the legacy `committee-network.json` static export.
 *
 * @param loadCSV - CSV loader closure
 * @returns Committee table plus a derived productivity-similarity network graph
 */
export async function loadCommitteeNetwork(loadCSV: LoadCSV): Promise<CommitteeNetwork> {
  const [productivity, activity] = await Promise.all([
    loadCSV(CSV_SOURCES.committeeProductivity.local),
    loadCSV(CSV_SOURCES.committeeActivity.local)
  ]);

  const activityMap: Record<string, number> = {};
  activity.forEach(a => {
    activityMap[a.org as string] = (a.document_count as number) || 0;
  });

  const nameToOrgCode = COMMITTEE_ORG_CODES;

  const bestByName: Record<string, CSVRow> = {};
  productivity.forEach(c => {
    const name = c.committee_name as string;
    if (!name) return;
    const existing = bestByName[name];
    if (!existing || (c.total_documents as number) > (existing.total_documents as number) ||
        ((c.total_documents as number) === (existing.total_documents as number) &&
         (c.total_members as number) > (existing.total_members as number))) {
      bestByName[name] = c;
    }
  });

  const committees: CommitteeEntry[] = Object.values(bestByName)
    .map(c => {
      const name = c.committee_name as string;
      const code = nameToOrgCode[name] || name.substring(0, 3).toUpperCase();
      const totalDocuments = (c.total_documents as number) || 0;
      const activityDocs = activityMap[code] || 0;
      const documentsProcessed = Math.max(totalDocuments, activityDocs);
      const productivityLevel = (c.productivity_level as string) || '';
      return {
        id: code,
        name,
        memberCount: (c.total_members as number) || 0,
        influenceScore: c.docs_per_member
          ? Math.round((c.docs_per_member as number) * 100)
          : 0,
        documentsProcessed,
        productivityLevel,
        meetingsPerYear:
          documentsProcessed > 0
            ? Math.round(documentsProcessed / COMMITTEE_DOCS_PER_MEETING_ESTIMATE)
            : 0,
        keyIssues: [productivityLevel || 'N/A'],
        _source: 'csv'
      };
    })
    .filter(c => {
      return (
        c.name !== 'Riksdagen' &&
        c.memberCount > 0 &&
        (c.productivityLevel !== 'INACTIVE' || c.documentsProcessed > 0)
      );
    })
    .sort((a, b) => b.documentsProcessed - a.documentsProcessed);

  const nodes: NetworkNode[] = committees.map(c => ({
    id: c.id,
    name: c.name,
    size: c.influenceScore
  }));

  const edges: NetworkEdge[] = [];
  for (let i = 0; i < committees.length; i++) {
    for (let j = i + 1; j < committees.length && edges.length < 10; j++) {
      if (
        committees[i].productivityLevel === committees[j].productivityLevel &&
        committees[i].productivityLevel !== 'INACTIVE'
      ) {
        edges.push({
          source: committees[i].id,
          target: committees[j].id,
          weight: Math.min(committees[i].documentsProcessed, committees[j].documentsProcessed),
          type: 'productivity_similarity'
        });
      }
    }
  }

  return {
    title: 'Committee Network Analysis',
    description: 'Committee data from CIA committee productivity view',
    lastUpdated: new Date().toISOString(),
    committees,
    networkGraph: { nodes, edges },
    crossCommitteeMPs: [],
    _source: 'csv'
  };
}
