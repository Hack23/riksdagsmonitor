/**
 * @module Intelligence/MCPClient
 * @description Barrel re-export for backward compatibility.
 *
 * This file was previously an 810-line monolith. It has been decomposed
 * into focused modules under `./mcp-client/`:
 *
 * | Module            | Lines | Responsibility                           |
 * |------------------ |-------|------------------------------------------|
 * | transport.ts      | ~120  | HTTP POST abstraction (fetch + Node.js)  |
 * | document-types.ts |  ~65  | doktyp → English type normalisation      |
 * | client.ts         | ~500  | MCPClient class (JSON-RPC 2.0)           |
 * | index.ts          | ~105  | singleton + convenience functions         |
 *
 * All public exports are preserved — existing consumers require no changes.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
export {
  MCPClient,
  normalizeDocumentType,
  getDefaultClient,
  fetchCalendarEvents,
  fetchCommitteeReports,
  fetchPropositions,
  fetchMotions,
  searchDocuments,
  searchSpeeches,
  fetchMPs,
  fetchVotingRecords,
  fetchGovernmentDocuments,
  fetchDocumentDetails,
  enrichDocumentsWithContent,
} from './mcp-client/index.js';
