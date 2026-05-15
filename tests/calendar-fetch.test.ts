import { describe, it, expect, vi } from 'vitest';

import { fetchCalendarStatus } from '../scripts/calendar-fetch.js';

describe('calendar-fetch', () => {
  it('emits normalized calendar status for an org-scoped fetch', async () => {
    const client = {
      fetchCalendarEvents: vi.fn().mockResolvedValue([
        {
          dtstart: '2026-05-20T09:00:00',
          organ: 'SfU',
          akt: 'utskottsmöte',
          summary: 'Socialförsäkringsutskottet sammanträde',
          dok_id: 'H901SfU1',
        },
      ]),
    };

    const status = await fetchCalendarStatus('2026-05-20', '2026-05-25', 'SfU', null, client as never);

    expect(status.status).toBe('ok');
    expect(status.org).toBe('SfU');
    expect(status.eventCount).toBe(1);
    expect(status.events[0]?.org).toBe('SfU');
  });

  it('captures fetch errors without throwing', async () => {
    const client = {
      fetchCalendarEvents: vi.fn().mockRejectedValue(new Error('MCP unavailable')),
    };

    const status = await fetchCalendarStatus('2026-05-20', '2026-05-25', 'SfU', null, client as never);

    expect(status.status).toBe('error');
    expect(status.notes).toContain('MCP unavailable');
  });

  it('filters scoped events in injected MCP client mode', async () => {
    const client = {
      fetchCalendarEvents: vi.fn().mockResolvedValue([
        {
          dtstart: '2026-05-20T09:00:00',
          organ: 'SfU',
          akt: 'utskottsmöte',
          summary: 'Scoped event',
        },
        {
          dtstart: '2026-05-20T10:00:00',
          organ: '',
          akt: 'utskottsmöte',
          summary: 'Missing org should be excluded',
        },
        {
          dtstart: '2026-05-20T11:00:00',
          organ: 'FiU',
          akt: 'utskottsmöte',
          summary: 'Mismatched org should be excluded',
        },
      ]),
    };

    const status = await fetchCalendarStatus('2026-05-20', '2026-05-25', 'SfU', null, client as never);

    expect(status.status).toBe('ok');
    expect(status.eventCount).toBe(1);
    expect(status.events).toHaveLength(1);
    expect(status.events[0]?.org).toBe('SfU');
  });
});
