/**
 * Tests for deep-inspection generator utilities:
 * - extractDocIdFromUrl: URL-to-dok_id resolution
 * - sanitizePlainText: XSS prevention for user-controlled strings
 */

import { describe, it, expect } from 'vitest';
import { extractDocIdFromUrl, sanitizePlainText } from '../scripts/generate-news-enhanced/generators.js';

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

  it('preserves dok_id with unknown extensions', () => {
    expect(extractDocIdFromUrl(
      'https://data.riksdagen.se/dokument/H901FiU1_draft'
    )).toBe('H901FiU1_draft');
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

describe('sanitizePlainText', () => {
  it('strips script tags', () => {
    expect(sanitizePlainText('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('strips HTML tags', () => {
    expect(sanitizePlainText('<b>bold</b> text')).toBe('bold text');
  });

  it('preserves special characters without escaping (escaping deferred to render sites)', () => {
    expect(sanitizePlainText('Tom & Jerry < Friends')).toBe('Tom & Jerry < Friends');
  });

  it('strips complete tags including event handler attributes', () => {
    const result = sanitizePlainText('<img src=x onerror=alert(1)>');
    expect(result).toBe('');
  });

  it('handles incomplete/malformed tags by preserving remaining text', () => {
    const result = sanitizePlainText('text < with unclosed bracket');
    expect(result).toBe('text < with unclosed bracket');
  });

  it('handles nested quotes in tags', () => {
    const result = sanitizePlainText('<a href="javascript:alert(1)">click</a>');
    expect(result).toBe('click');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizePlainText('')).toBe('');
  });

  it('passes through plain text unchanged', () => {
    expect(sanitizePlainText('Budget Analysis 2026')).toBe('Budget Analysis 2026');
  });

  it('handles Swedish characters without escaping ampersand', () => {
    expect(sanitizePlainText('Försvarsbudget & Säkerhetspolitik')).toBe('Försvarsbudget & Säkerhetspolitik');
  });

  it('handles nested tag reconstruction attempts', () => {
    const result = sanitizePlainText('<scr<script>ipt>alert(1)</script>');
    expect(result).not.toContain('<script');
    expect(result).toBe('ipt>alert(1)');
  });
});
