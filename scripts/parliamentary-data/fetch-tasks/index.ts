/**
 * @module parliamentary-data/fetch-tasks/index
 * @description Internal task-name constants and DocumentTypeKey mapping
 * shared by the orchestrator and per-doctype fetch task factories.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../../data-transformers/types.js';
import type { MCPClient } from '../../mcp-client/client.js';
import type { DocumentTypeKey, DownloadedData } from '../data-downloader.js';
import type { MCPToolInvocationDiagnostic } from '../../types/mcp.js';

/** All internal fetch task names, kept in sync with the per-doctype factories. */
export const FETCH_TASK_NAMES = [
  'fetchPropositions',
  'fetchMotions',
  'fetchCommitteeReports',
  'fetchVotingRecords',
  'searchSpeeches',
  'fetchWrittenQuestions',
  'fetchInterpellations',
] as const;

export type FetchTaskName = typeof FETCH_TASK_NAMES[number];

/**
 * Maps internal fetch task names to their corresponding DocumentTypeKey.
 * `satisfies` ensures every FetchTaskName maps to a valid DocumentTypeKey
 * at compile time — adding/renaming a task without updating the map is a
 * compile error.
 */
export const FETCH_TASK_TYPE_MAP: Record<FetchTaskName, DocumentTypeKey> = {
  fetchPropositions: 'propositions',
  fetchMotions: 'motions',
  fetchCommitteeReports: 'committeeReports',
  fetchVotingRecords: 'votes',
  searchSpeeches: 'speeches',
  fetchWrittenQuestions: 'questions',
  fetchInterpellations: 'interpellations',
} as const satisfies Record<FetchTaskName, DocumentTypeKey>;

/** Per-task fetch result shape, shared across all doctype fetch factories. */
export interface FetchTaskResult {
  items: RawDocument[];
  diagnostic: MCPToolInvocationDiagnostic;
}

/** Common shape of a fetch-task descriptor used by the orchestrator. */
export interface FetchTask {
  name: FetchTaskName;
  source: string;
  query: () => Record<string, unknown>;
  fetch: () => Promise<FetchTaskResult>;
  assign: (raw: RawDocument[]) => void;
}

/** Common factory input — passed to each per-doctype fetch task. */
export interface FetchTaskContext {
  client: MCPClient;
  limit: number;
  rm: string;
  data: DownloadedData;
}
