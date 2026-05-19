/**
 * @module parliamentary-data/persistence/documents
 * @description Persistence helpers for Riksdag document collections,
 * calendar events, and MP profiles. Extracted from the original
 * `data-persistence.ts` monolith as part of the >600-line refactor.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';

import type { RawDocument } from '../../data-transformers/types.js';
import type { DownloadedData, DocumentTypeKey } from '../data-downloader.js';
import { sanitizeDokId } from './shared/sanitize.js';
import {
  DATA_ROOT,
  ISO_DATE_RE,
  resolveDocId,
  writeDocumentAndMeta,
  type PersistenceMetadata,
  type PersistenceResult,
} from './shared/meta-sidecar.js';

// ---------------------------------------------------------------------------
// Public API — Riksdag documents
// ---------------------------------------------------------------------------

/**
 * Persist all downloaded MCP data to the structured `analysis/data/` tree.
 *
 * Documents are organised by type under `analysis/data/documents/{type}/`.
 * Date-stamped data (votes, events) is further partitioned by date.
 *
 * Data files contain only raw source data (no metadata injection) to ensure
 * parallel workflows writing the same document produce identical output,
 * preventing git merge conflicts.
 *
 * @param data        - Downloaded data collections from `downloadAllDocuments()`
 * @param riksmote    - Current riksmöte identifier (e.g. "2025/26")
 * @param mcpToolMap  - Map of document type → MCP tool name for provenance
 * @param dataRoot    - Override for the data root directory (for testing)
 * @returns Summary of files written and skipped.
 */
export function persistDownloadedData(
  data: DownloadedData,
  riksmote: string,
  mcpToolMap?: Partial<Record<DocumentTypeKey, string>>,
  dataRoot: string = DATA_ROOT,
): PersistenceResult {
  const defaultToolMap: Record<DocumentTypeKey, string> = {
    propositions: 'get_propositioner',
    motions: 'get_motioner',
    committeeReports: 'get_betankanden',
    votes: 'search_voteringar',
    speeches: 'search_anforanden',
    questions: 'get_fragor',
    interpellations: 'get_interpellationer',
  };
  const toolMap = { ...defaultToolMap, ...mcpToolMap };
  const fetchedAt = new Date().toISOString();

  let written = 0;
  let skipped = 0;

  const docTypes: DocumentTypeKey[] = [
    'propositions',
    'motions',
    'committeeReports',
    'votes',
    'speeches',
    'questions',
    'interpellations',
  ];

  for (const docType of docTypes) {
    const docs = data[docType];
    if (!docs || docs.length === 0) {
      continue;
    }

    const typeDir = path.join(dataRoot, 'documents', docType);
    const metadata: PersistenceMetadata = {
      fetchedAt,
      mcpTool: toolMap[docType],
      riksmote,
      documentType: docType,
    };

    const seenIds = new Set<string>();
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (!doc) {
        skipped++;
        continue;
      }

      let docId = resolveDocId(doc, i);
      if (seenIds.has(docId)) {
        let suffix = 1;
        while (seenIds.has(`${docId}-${suffix}`)) suffix++;
        docId = `${docId}-${suffix}`;
      }
      seenIds.add(docId);
      const filename = `${docId}.json`;

      if (docType === 'votes' && doc.datum) {
        const voteDate = typeof doc.datum === 'string'
          ? doc.datum.slice(0, 10)
          : '';
        if (ISO_DATE_RE.test(voteDate)) {
          const voteDateDir = path.join(dataRoot, 'votes', voteDate);
          writeDocumentAndMeta(voteDateDir, filename, doc, {
            ...metadata,
            documentType: 'votes',
          });
        }
      }

      writeDocumentAndMeta(typeDir, filename, doc, metadata);
      written++;
    }
  }

  return { written, skipped, dataRoot: dataRoot };
}

/**
 * Persist a set of calendar events to `analysis/data/events/{date}/`.
 * @param dataRoot - Override for the data root directory (for testing)
 */
export function persistEvents(
  events: RawDocument[],
  riksmote: string,
  dataRoot: string = DATA_ROOT,
): PersistenceResult {
  const fetchedAt = new Date().toISOString();
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event) { skipped++; continue; }

    const record = event as Record<string, unknown>;
    const dateStr = typeof record['datum'] === 'string'
      ? (record['datum'] as string).slice(0, 10)
      : typeof record['from'] === 'string'
        ? (record['from'] as string).slice(0, 10)
        : '';

    const eventDate = ISO_DATE_RE.test(dateStr) ? dateStr : 'undated';
    const eventDir = path.join(dataRoot, 'events', eventDate);

    const eventId = resolveDocId(event, i);
    writeDocumentAndMeta(eventDir, `${eventId}.json`, event, {
      fetchedAt,
      mcpTool: 'get_calendar_events',
      riksmote,
      documentType: 'events',
    });
    written++;
  }

  return { written, skipped, dataRoot: dataRoot };
}

/**
 * Persist MP profiles to `analysis/data/mps/`.
 * @param dataRoot - Override for the data root directory (for testing)
 */
export function persistMPs(
  mps: RawDocument[],
  riksmote: string,
  dataRoot: string = DATA_ROOT,
): PersistenceResult {
  const fetchedAt = new Date().toISOString();
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < mps.length; i++) {
    const mp = mps[i];
    if (!mp) { skipped++; continue; }

    const record = mp as Record<string, unknown>;
    const id = (typeof record['intressent_id'] === 'string' && record['intressent_id'])
      || resolveDocId(mp, i);
    const sanitized = sanitizeDokId(id) || `mp-${i + 1}`;

    writeDocumentAndMeta(path.join(dataRoot, 'mps'), `${sanitized}.json`, mp, {
      fetchedAt,
      mcpTool: 'search_ledamoter',
      riksmote,
      documentType: 'mps',
    });
    written++;
  }

  return { written, skipped, dataRoot: dataRoot };
}
