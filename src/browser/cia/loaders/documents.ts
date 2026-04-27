/**
 * @module CIA/Loaders/Documents
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * Builds the parliamentary document activity dashboard from CIA CSV exports.
 * Joins annual document type counts with monthly decision approval trends.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type {
  DecisionTrendEntry,
  DocumentActivityDashboard,
  DocumentTypeEntry
} from '../types.js';
import type { LoadCSV } from '../csv-utils.js';
import { CSV_SOURCES } from '../sources.js';

/**
 * Build `DocumentActivityDashboard` from CSV sources.
 *
 * @param loadCSV - CSV loader closure
 * @returns Document type and decision trend rows with zero-row filtering
 */
export async function loadDocumentActivity(loadCSV: LoadCSV): Promise<DocumentActivityDashboard> {
  const [docTypeRows, decisionRows] = await Promise.all([
    loadCSV(CSV_SOURCES.annualDocTypes.local),
    loadCSV(CSV_SOURCES.decisionTrends.local)
  ]);

  const documentTypes: DocumentTypeEntry[] = docTypeRows
    .filter(r => (r.doc_count as number) > 0)
    .map(r => ({
      year: (r.year as number) || 0,
      documentType: (r.document_type as string) || '',
      docCount: (r.doc_count as number) || 0
    }));

  const decisionTrends: DecisionTrendEntry[] = decisionRows
    .filter(r => (r.decision_count as number) > 0)
    .map(r => ({
      year: (r.year as number) || 0,
      month: (r.month as number) || 0,
      decisionCount: (r.decision_count as number) || 0,
      approvedDecisions: (r.approved_decisions as number) || 0,
      rejectedDecisions: (r.rejected_decisions as number) || 0,
      approvalRate: (r.approval_rate as number) || 0
    }));

  return {
    title: 'Parliamentary Document Activity',
    description: 'Document production and decision trends from CIA database exports',
    lastUpdated: new Date().toISOString(),
    documentTypes,
    decisionTrends,
    _source: 'csv'
  };
}
