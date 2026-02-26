/**
 * @module Types/MCP
 * @description Type definitions for the riksdag-regering-mcp JSON-RPC 2.0 client.
 */

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

/** Configuration options for MCPClient */
export interface MCPClientConfig {
  baseURL?: string;
  serverUrl?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
  authToken?: string;
}

/** Runtime statistics for an MCPClient instance */
export interface MCPStats {
  requests: number;
  errors: number;
  successRate: string;
}

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 protocol
// ---------------------------------------------------------------------------

/** Outgoing JSON-RPC 2.0 request */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

/** Incoming JSON-RPC 2.0 response */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ---------------------------------------------------------------------------
// Tool parameter types
// ---------------------------------------------------------------------------

/** Parameters for riksdag document search */
export interface SearchDocumentsParams {
  titel?: string;
  doktyp?: string;
  subtyp?: string;
  rm?: string;
  organ?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  [key: string]: unknown;
}

/** Parameters for parliamentary speech search */
export interface SearchSpeechesParams {
  talare?: string;
  parti?: string;
  rm?: string;
  text?: string;
  limit?: number;
  [key: string]: unknown;
}

/** Filters for MP (ledamot) lookup */
export interface FetchMPsFilters {
  parti?: string;
  valkrets?: string;
  status?: string;
  namn?: string;
  limit?: number;
  [key: string]: unknown;
}

/** Filters for voting record lookup */
export interface FetchVotingFilters {
  rm?: string;
  bet?: string;
  punkt?: string;
  iid?: string;
  rost?: string;
  limit?: number;
  [key: string]: unknown;
}

/** Parameters for party-level voting group lookup */
export interface FetchVotingGroupParams {
  bet?: string;
  punkt?: string;
  groupBy?: 'parti' | 'valkrets' | 'namn';
  rm?: string;
  limit?: number;
  [key: string]: unknown;
}

/** Parameters for government document search */
export interface GovDocSearchParams {
  title?: string;
  type?: string;
  departement?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

/** A riksdag document returned from the MCP server */
export interface RiksdagDocument {
  dok_id?: string;
  dokumentnamn?: string;
  id?: string;
  titel?: string;
  rubrik?: string;
  /** Raw Swedish document-type code from the API (e.g. 'mot', 'bet', 'prop', 'skr', 'ip', 'fr') */
  doktyp?: string;
  /** Normalized human-readable document type (e.g. 'motion', 'committee-report', 'proposition') */
  type?: string;
  /** Normalized human-readable document sub-type (mirrors API 'subtyp' field) */
  subtype?: string;
  /** Raw sub-type code from the API */
  subtyp?: string;
  organ?: string;
  datum?: string;
  summary?: string;
  [key: string]: unknown;
}
