/**
 * @module Intelligence/MCPClient
 * @description Public API barrel for the MCP client modules.
 *
 * Implementation split into focused modules under `./mcp-client/`:
 *
 * | Module            | Lines | Responsibility                           |
 * |------------------ |-------|------------------------------------------|
 * | transport.ts      | ~120  | HTTP POST abstraction (fetch + Node.js)  |
 * | document-types.ts |  ~65  | doktyp → English type normalisation      |
 * | client.ts         | ~500  | MCPClient class (JSON-RPC 2.0)           |
 * | index.ts          | ~105  | singleton + convenience functions         |
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
  searchDocumentsWithDiagnostics,
  searchSpeeches,
  fetchMPs,
  fetchVotingRecords,
  fetchVotingRecordsWithDiagnostics,
  fetchVotingGroup,
  fetchGovernmentDocuments,
  fetchDocumentDetails,
  fetchDocumentDetailsWithCoverage,
  enrichDocumentsWithContent,
} from './mcp-client/index.js';
