/**
 * @file resolve-doc-id.test.ts
 * @module tests/parliamentary-data/persistence/resolve-doc-id
 * @description Pure-function tests for `resolveDocId`. Split from
 * `documents.test.ts` to keep both files under the 250-line budget set by
 * issue #2620.
 */

import { describe, it, expect } from 'vitest';

import type { RawDocument } from '../../../scripts/data-transformers/types.js';
import { resolveDocId } from '../../../scripts/parliamentary-data/data-persistence.js';

import { makeRawDoc } from './_fixtures.js';

describe('resolveDocId', () => {
  it('should prefer dok_id when available', () => {
    const doc = makeRawDoc({ dok_id: 'H901FiU1' });
    expect(resolveDocId(doc, 0)).toBe('h901fiu1');
  });

  it('should fall back to titel when dok_id is missing', () => {
    const doc = makeRawDoc({ titel: 'Test Motion' });
    delete (doc as Record<string, unknown>)['dok_id'];
    expect(resolveDocId(doc, 0)).toBe('test-motion');
  });

  it('should fall back through dokument_id, id, rel_dok_id, titel, title', () => {
    const doc = { dokument_id: 'DOK123' } as unknown as RawDocument;
    expect(resolveDocId(doc, 0)).toBe('dok123');

    const doc2 = { id: 'ID456' } as unknown as RawDocument;
    expect(resolveDocId(doc2, 0)).toBe('id456');
  });

  it('should use index-based fallback when all fields empty', () => {
    const doc = {} as RawDocument;
    expect(resolveDocId(doc, 5)).toBe('unknown-6');
  });

  it('should trim whitespace from identifiers', () => {
    const doc = { dok_id: '  H901FiU1  ' } as unknown as RawDocument;
    expect(resolveDocId(doc, 0)).toBe('h901fiu1');
  });

  it('should skip empty string fields', () => {
    const doc = { dok_id: '', titel: 'Fallback' } as unknown as RawDocument;
    expect(resolveDocId(doc, 0)).toBe('fallback');
  });
});
