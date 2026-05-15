import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('news-prewarm composite action data-context wiring', () => {
  const actionPath = join(process.cwd(), '.github', 'actions', 'news-prewarm', 'action.yml');
  const content = readFileSync(actionPath, 'utf8');

  it('wires polling, calendar, lagradet, and RSS context scripts', () => {
    expect(content).toContain('scripts/polling-fetch.ts');
    expect(content).toContain('scripts/calendar-fetch.ts');
    expect(content).toContain('scripts/lagradet-fetch.ts');
    expect(content).toContain('scripts/rss-watch.ts');
  });

  it('exposes optional inputs for calendar org, Lagrådet reference, and RSS dok_ids', () => {
    expect(content).toMatch(/^\s{2}calendar-org:/m);
    expect(content).toMatch(/^\s{2}lagradet-reference:/m);
    expect(content).toMatch(/^\s{2}rss-watch-dok-ids:/m);
  });
});
