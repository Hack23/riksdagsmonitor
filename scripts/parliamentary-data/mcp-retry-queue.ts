/**
 * @module parliamentary-data/mcp-retry-queue
 * @description Re-export shim — original 373-line implementation was split
 * into `./mcp-retry-queue/{index,classifier,persistence,retry-policy}.ts`.
 * Kept so historic imports (`mcp-retry-queue.js`) keep resolving.
 */
export * from './mcp-retry-queue/index.js';
