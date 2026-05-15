import { describe, it, expect } from 'vitest';

import { parseRssItems, buildRssSignals, watchRssFeed } from '../scripts/rss-watch.js';

describe('rss-watch', () => {
  it('parses RSS items and builds PIR match signals', () => {
    const xml = `
      <rss><channel>
        <item>
          <title>Betänkande H901SfU1</title>
          <link>https://data.riksdagen.se/dokument/H901SfU1</link>
          <guid>guid-1</guid>
          <description>Signal for H901SfU1</description>
        </item>
      </channel></rss>`;

    const items = parseRssItems(xml);
    const signals = buildRssSignals(items, ['H901SfU1']);

    expect(items).toHaveLength(1);
    expect(signals).toHaveLength(1);
    expect(signals[0]?.matchedDokIds).toEqual(['H901SFU1']);
  });

  it('returns PIR integration note in watch output', async () => {
    const result = await watchRssFeed(
      'https://data.riksdagen.se/rss/test',
      ['H901SfU1'],
      (async () => new Response('<rss><channel><item><title>H901SfU1</title><link>https://data.riksdagen.se/dokument/H901SfU1</link><guid>1</guid></item></channel></rss>', { status: 200 })) as typeof fetch,
    );

    expect(result.status).toBe('ok');
    expect(result.signalCount).toBe(1);
    expect(result.notes).toContain('signals[]');
  });
});
