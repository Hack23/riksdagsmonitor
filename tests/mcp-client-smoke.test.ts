import { describe, expect, it } from 'vitest';

import { MCPClient } from '../scripts/mcp-client.js';

const runSmoke = process.env['MCP_SMOKE'] === '1';

describe.skipIf(!runSmoke)('MCP client smoke', () => {
  it('returns structured provenance from the live MCP endpoint', async () => {
    const client = new MCPClient({ timeout: 60_000 });
    const search = await client.searchDocumentsWithDiagnostics({ doktyp: 'prop', limit: 1 });

    expect(search.provenance.provider).toBe('riksdag-regering');
    expect(search.provenance.endpoint).toContain('riksdag-regering');

    if (search.resultCount > 0) {
      const first = search.items[0] as Record<string, unknown>;
      const dokId = first['dok_id'];
      expect(typeof dokId).toBe('string');

      const details = await client.fetchDocumentDetailsWithCoverage(
        dokId as string,
        true,
        {
          requestedDate: typeof first['datum'] === 'string' ? first['datum'] as string : null,
        },
      );
      expect(details.provenance.provider).toBe('riksdag-regering');
      expect(details.query.dok_id).toBe(dokId);
    }
  }, 90_000);
});
