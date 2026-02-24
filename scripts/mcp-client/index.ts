/**
 * @module mcp-client
 * @description Barrel re-export + singleton convenience functions.
 *
 * The monolithic mcp-client.ts has been decomposed into:
 *
 * | Module            | Responsibility                           |
 * |------------------ |------------------------------------------|
 * | transport.ts      | HTTP POST abstraction (fetch + Node.js)  |
 * | document-types.ts | doktyp → English type normalisation      |
 * | client.ts         | MCPClient class (JSON-RPC 2.0)           |
 * | index.ts          | barrel re-export + convenience functions |
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { MCPClient } from './client.js';
export { normalizeDocumentType } from './document-types.js';

import { MCPClient } from './client.js';

// ---------------------------------------------------------------------------
// Singleton & convenience functions
// ---------------------------------------------------------------------------

let defaultClient: MCPClient | null = null;

/** Get or create the default singleton MCPClient */
export function getDefaultClient(): MCPClient {
  if (!defaultClient) {
    defaultClient = new MCPClient();
  }
  return defaultClient;
}

export async function fetchCalendarEvents(
  ...args: Parameters<MCPClient['fetchCalendarEvents']>
): ReturnType<MCPClient['fetchCalendarEvents']> {
  return getDefaultClient().fetchCalendarEvents(...args);
}

export async function fetchCommitteeReports(
  ...args: Parameters<MCPClient['fetchCommitteeReports']>
): ReturnType<MCPClient['fetchCommitteeReports']> {
  return getDefaultClient().fetchCommitteeReports(...args);
}

export async function fetchPropositions(
  ...args: Parameters<MCPClient['fetchPropositions']>
): ReturnType<MCPClient['fetchPropositions']> {
  return getDefaultClient().fetchPropositions(...args);
}

export async function fetchMotions(
  ...args: Parameters<MCPClient['fetchMotions']>
): ReturnType<MCPClient['fetchMotions']> {
  return getDefaultClient().fetchMotions(...args);
}

export async function searchDocuments(
  ...args: Parameters<MCPClient['searchDocuments']>
): ReturnType<MCPClient['searchDocuments']> {
  return getDefaultClient().searchDocuments(...args);
}

export async function searchSpeeches(
  ...args: Parameters<MCPClient['searchSpeeches']>
): ReturnType<MCPClient['searchSpeeches']> {
  return getDefaultClient().searchSpeeches(...args);
}

export async function fetchMPs(
  ...args: Parameters<MCPClient['fetchMPs']>
): ReturnType<MCPClient['fetchMPs']> {
  return getDefaultClient().fetchMPs(...args);
}

export async function fetchVotingRecords(
  ...args: Parameters<MCPClient['fetchVotingRecords']>
): ReturnType<MCPClient['fetchVotingRecords']> {
  return getDefaultClient().fetchVotingRecords(...args);
}

export async function fetchGovernmentDocuments(
  ...args: Parameters<MCPClient['fetchGovernmentDocuments']>
): ReturnType<MCPClient['fetchGovernmentDocuments']> {
  return getDefaultClient().fetchGovernmentDocuments(...args);
}

export async function fetchDocumentDetails(
  ...args: Parameters<MCPClient['fetchDocumentDetails']>
): ReturnType<MCPClient['fetchDocumentDetails']> {
  return getDefaultClient().fetchDocumentDetails(...args);
}

export async function enrichDocumentsWithContent(
  ...args: Parameters<MCPClient['enrichDocumentsWithContent']>
): ReturnType<MCPClient['enrichDocumentsWithContent']> {
  return getDefaultClient().enrichDocumentsWithContent(...args);
}
