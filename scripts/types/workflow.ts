/**
 * @module Types/Workflow
 * @description Workflow state and coordination types for multi-workflow synchronization.
 */

// ---------------------------------------------------------------------------
// MCP query cache
// ---------------------------------------------------------------------------

/** A single cached MCP query result */
export interface MCPCacheEntry {
  timestamp: string;
  ttl?: number;
  resultHash: string;
  result: unknown;
}

// ---------------------------------------------------------------------------
// Recent articles
// ---------------------------------------------------------------------------

/** A recently generated article stored for deduplication */
export interface RecentArticleEntry {
  slug: string;
  timestamp: string;
  workflow: string;
  title: string;
  topics: string[];
  mcpQueries: string[];
}

/** Input shape for adding an article to recent-article tracking */
export interface RecentArticleInput {
  slug: string;
  workflow?: string;
  title: string;
  topics?: string[];
  mcpQueries?: string[];
  timestamp?: string;
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/** Result of a duplicate-article check */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedArticle: RecentArticleEntry | null;
  similarityScore: number;
}

// ---------------------------------------------------------------------------
// Workflow execution records
// ---------------------------------------------------------------------------

/** Optional metadata attached to a workflow execution */
export interface WorkflowExecutionMetadata {
  articlesGenerated?: number;
  errors?: number;
  [key: string]: unknown;
}

/** Persistent record of a single workflow's run history */
export interface WorkflowRecord {
  lastRun: string | null;
  runCount: number;
  articlesGenerated: number;
}

// ---------------------------------------------------------------------------
// Top-level state
// ---------------------------------------------------------------------------

/** Full persisted state managed by WorkflowStateCoordinator */
export interface WorkflowState {
  lastUpdate: string | null;
  recentArticles: RecentArticleEntry[];
  mcpQueryCache: Record<string, MCPCacheEntry>;
  workflows: Record<string, WorkflowRecord>;
}

/** Aggregated statistics returned by getWorkflowStatistics() */
export type WorkflowStatistics = Record<string, WorkflowRecord | number> & {
  cacheSize: number;
  recentArticlesCount: number;
};
