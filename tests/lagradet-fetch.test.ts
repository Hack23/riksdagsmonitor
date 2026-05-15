import { describe, it, expect } from 'vitest';

import { extractLagradetMatches, fetchLagradetStatus } from '../scripts/lagradet-fetch.js';

describe('lagradet-fetch', () => {
  it('extracts matching Lagrådet entries from search HTML', () => {
    const html = `
      <html><body>
        <a href="/yttranden/prop-2025-26-42">Yttrande över prop. 2025/26:42</a>
        <a href="/yttranden/other">Yttrande över prop. 2025/26:99</a>
      </body></html>`;

    const matches = extractLagradetMatches(html, '2025/26:42', 'https://www.lagradet.se');

    expect(matches).toHaveLength(1);
    expect(matches[0]?.url).toBe('https://www.lagradet.se/yttranden/prop-2025-26-42');
  });

  it('returns not_configured when no reference is provided', async () => {
    const status = await fetchLagradetStatus(null);
    expect(status.status).toBe('not_configured');
    expect(status.matches).toEqual([]);
  });

  it('does not match adjacent longer reference numbers', () => {
    const html = `
      <html><body>
        <a href="/yttranden/prop-2025-26-420">Yttrande över prop. 2025/26:420</a>
        <a href="/yttranden/prop-2025-26-421">Yttrande över prop. 2025/26:421</a>
      </body></html>`;

    const matches = extractLagradetMatches(html, '2025/26:42', 'https://www.lagradet.se');
    expect(matches).toHaveLength(0);
  });
});
