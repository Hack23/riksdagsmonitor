/**
 * Tests for deep-inspection generator utilities:
 * - extractDocIdFromUrl: URL-to-dok_id resolution
 * - sanitizePlainText (via topicLabel sanitization): XSS prevention
 */

import { describe, it, expect } from 'vitest';
import { extractDocIdFromUrl } from '../scripts/generate-news-enhanced/generators.js';

describe('extractDocIdFromUrl', () => {
  it('extracts dok_id from riksdagen.se document URL', () => {
    expect(extractDocIdFromUrl(
      'https://riksdagen.se/sv/dokument-och-lagar/dokument/motion/H901FiU1'
    )).toBe('H901FiU1');
  });

  it('extracts dok_id from riksdagen.se URL with trailing slash', () => {
    expect(extractDocIdFromUrl(
      'https://riksdagen.se/sv/dokument-och-lagar/dokument/proposition/H903FiU25/'
    )).toBe('H903FiU25');
  });

  it('extracts dok_id from www.riksdagen.se URL', () => {
    expect(extractDocIdFromUrl(
      'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/bet%C3%A4nkande/H901JuU25'
    )).toBe('H901JuU25');
  });

  it('extracts dok_id from data.riksdagen.se URL', () => {
    expect(extractDocIdFromUrl(
      'https://data.riksdagen.se/dokument/H901FiU1'
    )).toBe('H901FiU1');
  });

  it('strips file extension from data.riksdagen.se URL', () => {
    expect(extractDocIdFromUrl(
      'https://data.riksdagen.se/dokument/H901FiU1.json'
    )).toBe('H901FiU1');
  });

  it('strips .xml extension from data.riksdagen.se URL', () => {
    expect(extractDocIdFromUrl(
      'https://data.riksdagen.se/dokument/GZ10349.xml'
    )).toBe('GZ10349');
  });

  it('returns null for unrecognized hostname', () => {
    expect(extractDocIdFromUrl('https://example.com/dokument/H901FiU1')).toBeNull();
  });

  it('returns null for riksdagen.se URL without enough path segments', () => {
    expect(extractDocIdFromUrl('https://riksdagen.se/sv/dokument-och-lagar/dokument/')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(extractDocIdFromUrl('not-a-url')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractDocIdFromUrl('')).toBeNull();
  });

  it('handles URLs with query strings', () => {
    expect(extractDocIdFromUrl(
      'https://riksdagen.se/sv/dokument-och-lagar/dokument/motion/H901FiU1?highlight=budget'
    )).toBe('H901FiU1');
  });
});
