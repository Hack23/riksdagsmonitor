/**
 * @module tests/pir-status-contract/status-classification
 * @description Status classification (open/answered/dropped/stale) checks
 * implemented in `validateSource()`. Split per Hack23/riksdagsmonitor#2624
 * from `tests/pir-status-contract.test.ts` (889 lines).
 */

import { describe, expect, it } from 'vitest';

import {
  type Confidence,
  type PirStatusFile,
  validateSource,
} from '../../scripts/roll-forward-pirs';

import { validFixture } from './_shared.js';

describe('validateSource', () => {
  it('accepts a valid fixture', () => {
    const result = validateSource(validFixture(), '/tmp/x');
    expect(result.schema_version).toBe('1.0');
  });

  it('rejects non-objects', () => {
    expect(() => validateSource(null, '/tmp/x')).toThrow(/not a JSON object/);
    expect(() => validateSource('string', '/tmp/x')).toThrow(/not a JSON object/);
  });

  it('rejects missing schema_version', () => {
    const fix = validFixture() as unknown as Record<string, unknown>;
    delete fix['schema_version'];
    expect(() => validateSource(fix, '/tmp/x')).toThrow(/schema_version/);
  });

  it('rejects unsupported schema_version', () => {
    expect(() =>
      validateSource(validFixture({ schema_version: '2.0' as '1.0' }), '/tmp/x'),
    ).toThrow(/unsupported schema_version/);
  });

  it('rejects non-array pirs', () => {
    const fix = validFixture() as unknown as Record<string, unknown>;
    fix['pirs'] = 'not an array';
    expect(() => validateSource(fix, '/tmp/x')).toThrow(/'pirs' must be an array/);
  });

  it('rejects missing required field', () => {
    const fix = validFixture() as unknown as Record<string, unknown>;
    delete fix['cycle'];
    expect(() => validateSource(fix, '/tmp/x')).toThrow(/missing required field 'cycle'/);
  });

  it('rejects invalid top-level cycle', () => {
    expect(() =>
      validateSource(validFixture({ cycle: 'not-a-cycle' as CycleType }), '/tmp/x'),
    ).toThrow(/is not a valid cycle/);
  });

  it('rejects invalid top-level date format', () => {
    expect(() =>
      validateSource(validFixture({ date: '27-04-2026' }), '/tmp/x'),
    ).toThrow(/must match YYYY-MM-DD/);
  });

  it('rejects empty top-level subfolder', () => {
    expect(() =>
      validateSource(validFixture({ subfolder: '' }), '/tmp/x'),
    ).toThrow(/subfolder must be a non-empty string/);
  });

  it('rejects top-level subfolder that does not equal cycle', () => {
    expect(() =>
      validateSource(validFixture({ subfolder: 'week-ahead' }), '/tmp/x'),
    ).toThrow(/must equal cycle/);
  });

  it('rejects invalid top-level generated_at date-time', () => {
    expect(() =>
      validateSource(validFixture({ generated_at: 'not-a-date' }), '/tmp/x'),
    ).toThrow(/must be a valid date-time string/);
  });

  it('rejects invalid inherited_from type', () => {
    const fix = validFixture() as unknown as Record<string, unknown>;
    fix['inherited_from'] = 42;
    expect(() => validateSource(fix, '/tmp/x')).toThrow(/inherited_from must be a string or null/);
  });

  it('rejects invalid pir_id pattern', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'invalid_id',
              statement: 'short statement that is long enough',
              status: 'open',
              confidence: 'HIGH',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/pir_id 'invalid_id' does not match/);
  });

  it('rejects too-short statement', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'short',
              status: 'open',
              confidence: 'HIGH',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/statement missing or shorter than 10 chars/);
  });

  it('rejects unknown status enum', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'A reasonably long statement here',
              status: 'wibble' as PirEntry['status'],
              confidence: 'HIGH',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/'wibble' is not a valid PIR status/);
  });

  it('rejects unknown confidence enum', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'A reasonably long statement here',
              status: 'open',
              confidence: 'EXTREME' as PirEntry['confidence'],
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/is not a valid confidence value/);
  });

  it('rejects answered without answer_summary', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'A reasonably long statement here',
              status: 'answered',
              confidence: 'HIGH',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/status='answered' requires non-empty answer_summary/);
  });

  it('rejects non-answered with answer_summary', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'A reasonably long statement here',
              status: 'open',
              confidence: 'HIGH',
              answer_summary: 'should not be here',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/must not carry answer_summary/);
  });

  it('rejects non-object pir entry', () => {
    expect(() =>
      validateSource(
        { ...validFixture(), pirs: ['not-an-object' as unknown as PirEntry] },
        '/tmp/x',
      ),
    ).toThrow(/pirs\[0\] is not an object/);
  });
});

// ---------------------------------------------------------------------------
// Section 3 — rollForward unit tests
// ---------------------------------------------------------------------------

