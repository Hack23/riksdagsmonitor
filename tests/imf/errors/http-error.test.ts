/**
 * ImfHttpError — basic shape + auth-failure message rewriting.
 *
 * The error class is exercised end-to-end by tests/imf/transport/sdmx.test.ts
 * (401/403/404 diagnostics). This file is a minimal smoke check on the
 * constructor surface so that a regression in `.name` / `.status` /
 * `.retryable` is caught locally rather than only via integration.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ImfHttpError } from '../../../scripts/imf-client.js';

describe('ImfHttpError', () => {
  it('exposes name, status, and retryable for a 500 response', () => {
    const resp = new Response('boom', { status: 500, statusText: 'Internal Server Error' });
    const err = new ImfHttpError(resp, 'https://www.imf.org/external/datamapper/api/v1/x/y');
    expect(err.name).toBe('ImfHttpError');
    expect(err.status).toBe(500);
    expect(err.retryable).toBe(true);
    expect(err.message).toMatch(/IMF API error: 500/);
  });

  it('marks 429 as retryable', () => {
    const resp = new Response('rate', { status: 429, statusText: 'Too Many Requests' });
    const err = new ImfHttpError(resp);
    expect(err.retryable).toBe(true);
  });

  it('marks 404 as NOT retryable', () => {
    const resp = new Response('nope', { status: 404, statusText: 'Not Found' });
    const err = new ImfHttpError(resp);
    expect(err.retryable).toBe(false);
  });

  it('captures Retry-After header when present', () => {
    const resp = new Response('rate', {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'retry-after': '7' },
    });
    const err = new ImfHttpError(resp);
    expect(err.retryAfterHeader).toBe('7');
  });
});
