/**
 * @module parliamentary-data/persistence/mcp-response
 * @description Generic MCP tool response persistence with path-segment
 * sanitisation. Extracted from the original `data-persistence.ts` monolith.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { sanitizeDokId, sanitizePathSegment } from './shared/sanitize.js';
import {
  DATA_ROOT,
  ensureDir,
  type MCPToolCall,
  type PersistenceMetadata,
} from './shared/meta-sidecar.js';

/**
 * Persist a generic MCP tool response.  Supports any MCP server (riksdag,
 * SCB, World Bank, etc.).  Responses are stored under:
 *   `analysis/data/mcp-responses/{server}/{tool}/{id}.json`
 *
 * The response data is stored as-is (no metadata injection).  A sidecar
 * `.meta.json` tracks provenance.
 *
 * @param call     - Description of the MCP tool call
 * @param response - Raw response data from the MCP tool
 * @param id       - Unique identifier for this response (e.g. dok_id, table_id, country code)
 * @param dataRoot - Override for the data root directory (for testing)
 * @returns The absolute path where the response was written.
 */
export function persistMCPResponse(
  call: MCPToolCall,
  response: unknown,
  id: string,
  dataRoot: string = DATA_ROOT,
  riksmote?: string,
): string {
  const sanitized = sanitizeDokId(id) || `response-${crypto.randomUUID()}`;
  const safeServer = sanitizePathSegment(call.server);
  const safeTool = sanitizePathSegment(call.tool);
  const dir = path.join(dataRoot, 'mcp-responses', safeServer, safeTool);
  ensureDir(dir);

  const filename = `${sanitized}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(response, null, 2),
    'utf8',
  );

  const resolvedRiksmote = riksmote
    ?? (typeof call.params.rm === 'string' ? call.params.rm : '');

  const metaFilename = `${sanitized}.meta.json`;
  const metadata: PersistenceMetadata & { params: Record<string, unknown> } = {
    fetchedAt: new Date().toISOString(),
    mcpTool: call.tool,
    riksmote: resolvedRiksmote,
    documentType: call.server,
    params: call.params,
  };
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify(metadata, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}
