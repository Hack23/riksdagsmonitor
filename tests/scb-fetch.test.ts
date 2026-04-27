import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  SCB_PRESETS,
  fetchSCBTablePayload,
  parseSCBArgs,
  parseSCBPreset,
  parseSCBValueCodes,
  requireSCBFlag,
} from '../scripts/scb-fetch.js';
import { SCBClient } from '../scripts/scb-client.js';

describe('SCB fetch CLI helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes KPI, AKU, household-economy and fuel-price presets', () => {
    expect(SCB_PRESETS.map((preset) => preset.key)).toEqual([
      'cpi',
      'aku',
      'household-economy',
      'fuel-prices',
    ]);
    expect(parseSCBPreset('cpi').tableId).toBe('0000003N');
    expect(parseSCBPreset('aku').tableId).toBe('000003V8');
  });

  it('parses command flags and JSON value codes', () => {
    const parsed = parseSCBArgs(['table', '--table-id', 'TAB5765', '--value-codes', '{"Tid":"top(4)"}', '--persist']);
    expect(parsed.command).toBe('table');
    expect(requireSCBFlag(parsed.flags, 'table-id')).toBe('TAB5765');
    expect(parsed.booleans.has('persist')).toBe(true);
    expect(parseSCBValueCodes(parsed.flags.get('value-codes'), undefined)).toEqual({ Tid: 'top(4)' });
  });

  it('builds a periods fallback value code', () => {
    expect(parseSCBValueCodes(undefined, '6')).toEqual({ Tid: 'top(6)' });
  });

  it('throws for invalid CLI input', () => {
    expect(() => parseSCBArgs(['bad-command'])).toThrow(/unknown command/);
    expect(() => requireSCBFlag(new Map(), 'table-id')).toThrow(/missing required flag/);
    expect(() => parseSCBPreset('bad')).toThrow(/unknown SCB preset/);
    expect(() => parseSCBValueCodes('[]', undefined)).toThrow(/JSON object/);
  });

  it('emits SCB provenance and fail-soft no-data payload on outage', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('SCB API down'));
    const payload = await fetchSCBTablePayload(
      '0000003N',
      { Tid: 'top(2)' },
      { client: new SCBClient({ maxRetries: 0 }) },
    );
    expect(payload.status).toBe('no-data');
    expect(payload.data).toEqual([]);
    expect(payload.warning).toMatch(/cached data/i);
    expect(payload.economicProvenance.provider).toBe('scb');
    expect(payload.economicProvenance.indicator).toBe('0000003N');
  });
});
