/**
 * @module parliamentary-data/data-persistence
 * @description Public router for the persistence subsystem. Persists raw MCP
 * data to a structured, version-controlled directory tree under
 * `analysis/data/`. The implementation is split across `./persistence/*`
 * per source family; this module is a stable re-export surface that test
 * suites and downstream callers continue to import from.
 *
 * **Collision-free design** (v2):
 *   - **Data files** (`{id}.json`) contain ONLY the raw source data — no
 *     injected metadata.  Two parallel workflows writing the same document
 *     produce byte-identical output, eliminating git merge conflicts.
 *   - **Sidecar metadata** (`{id}.meta.json`) tracks provenance (at minimum
 *     fetch timestamp and MCP tool name) in a separate file that is safely
 *     overwritten on each run. Riksdag/Riksdag-regeringen documents also
 *     include `riksmöte` and `documentType`, while external MCP tools
 *     (World Bank, SCB, etc.) use tool-specific fields (e.g. indicator /
 *     country, tableId / query) instead.
 *   - **All MCP tools**: riksdag-regering, World Bank, SCB, and any other
 *     MCP tool responses are stored under `analysis/data/`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

// Shared types + utilities
export { sanitizeDokId } from './persistence/shared/sanitize.js';
export {
  getDataRoot,
  resolveDocId,
  type PersistenceDocumentType,
  type PersistenceMetadata,
  type PersistenceResult,
  type MCPToolCall,
} from './persistence/shared/meta-sidecar.js';

// Riksdag document/event/MP persistence
export {
  persistDownloadedData,
  persistEvents,
  persistMPs,
} from './persistence/documents.js';

// Generic MCP response persistence
export { persistMCPResponse } from './persistence/mcp-response.js';

// External data sources
export { persistWorldBankData } from './persistence/world-bank.js';
export { persistIMFData } from './persistence/imf.js';
export { persistStatskontoretData } from './persistence/statskontoret.js';
export { persistSCBData } from './persistence/scb.js';
export { persistRiksbankData } from './persistence/riksbank.js';
