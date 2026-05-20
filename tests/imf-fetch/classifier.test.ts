/**
 * NEW smoke tests for scripts/imf-fetch/classifier.ts —
 * partition error inputs into 'transient' vs 'permanent'.
 *
 * Required by acceptance criteria of #2620: the classifier is the
 * pivotal retry-vs-fail decision and now has its own test file.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  classifyImfFetchError,
  EMPTY_DATAMAPPER_SERIES_CODE,
} from '../../scripts/imf-fetch.js';
import { ImfWeoSdmxOnlyError } from '../../scripts/imf-client.js';

describe('classifyImfFetchError', () => {
  it('ImfWeoSdmxOnlyError is always permanent', () => {
    expect(classifyImfFetchError(new ImfWeoSdmxOnlyError('SWE', 'TX_RPCH'))).toBe('permanent');
  });

  it('empty-Datamapper sentinel is transient (Datamapper occasionally lags Fund publishing)', () => {
    const err = Object.assign(new Error('empty'), { code: EMPTY_DATAMAPPER_SERIES_CODE });
    expect(classifyImfFetchError(err)).toBe('transient');
  });

  it('respects an explicit retryable=true / false flag (e.g. ImfHttpError)', () => {
    const transient = Object.assign(new Error('rate-limited'), { retryable: true });
    const permanent = Object.assign(new Error('not-found'), { retryable: false });
    expect(classifyImfFetchError(transient)).toBe('transient');
    expect(classifyImfFetchError(permanent)).toBe('permanent');
  });

  it('AbortError is transient (timeout — worth one more shot)', () => {
    const err = Object.assign(new Error('aborted'), { name: 'AbortError' });
    expect(classifyImfFetchError(err)).toBe('transient');
  });

  it('classifies by HTTP status when no flag is present (429/5xx transient, 4xx permanent)', () => {
    expect(classifyImfFetchError(Object.assign(new Error('rl'), { status: 429 }))).toBe('transient');
    expect(classifyImfFetchError(Object.assign(new Error('boom'), { status: 503 }))).toBe('transient');
    expect(classifyImfFetchError(Object.assign(new Error('nope'), { status: 404 }))).toBe('permanent');
  });

  it('exports the sentinel code string used to tag empty-Datamapper errors', () => {
    expect(typeof EMPTY_DATAMAPPER_SERIES_CODE).toBe('string');
    expect(EMPTY_DATAMAPPER_SERIES_CODE.length).toBeGreaterThan(0);
  });
});
