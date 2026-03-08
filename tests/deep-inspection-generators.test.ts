/**
 * Tests for deep-inspection generator utilities:
 * - extractDocIdFromUrl: URL-to-dok_id resolution
 * - isGovernmentUrl: Detection of regeringen.se URLs
 * - isGitHubUrl: Detection of github.com / raw.githubusercontent.com URLs
 * - toGitHubRawUrl: Conversion of GitHub blob URLs to raw URLs
 * - hashPathSuffix: Deterministic path-based hash for dok_id collision avoidance
 * - sanitizePlainText: XSS prevention for user-controlled strings
 */

import { describe, it, expect } from 'vitest';
import { extractDocIdFromUrl, isGovernmentUrl, isGitHubUrl, toGitHubRawUrl, hashPathSuffix, sanitizePlainText } from '../scripts/generate-news-enhanced/generators.js';

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

  it('returns null for regeringen.se URLs (handled separately via g0v)', () => {
    expect(extractDocIdFromUrl(
      'https://www.regeringen.se/pressmeddelanden/2026/03/91-atgarder-ska-starka-sveriges-motstandskraft-mot-cyberhot/'
    )).toBeNull();
  });

  it('handles URLs with query strings', () => {
    expect(extractDocIdFromUrl(
      'https://riksdagen.se/sv/dokument-och-lagar/dokument/motion/H901FiU1?highlight=budget'
    )).toBe('H901FiU1');
  });
});

describe('isGovernmentUrl', () => {
  it('returns true for www.regeringen.se URL', () => {
    expect(isGovernmentUrl(
      'https://www.regeringen.se/pressmeddelanden/2026/03/91-atgarder-ska-starka-sveriges-motstandskraft-mot-cyberhot/'
    )).toBe(true);
  });

  it('returns true for regeringen.se URL without www', () => {
    expect(isGovernmentUrl('https://regeringen.se/sou/2026/01/sou-2026-1/')).toBe(true);
  });

  it('returns false for riksdagen.se URL', () => {
    expect(isGovernmentUrl('https://www.riksdagen.se/sv/dokument-och-lagar/')).toBe(false);
  });

  it('returns false for data.riksdagen.se URL', () => {
    expect(isGovernmentUrl('https://data.riksdagen.se/dokument/H901FiU1')).toBe(false);
  });

  it('returns false for other URLs', () => {
    expect(isGovernmentUrl('https://example.com/some-page')).toBe(false);
  });

  it('returns false for invalid URL', () => {
    expect(isGovernmentUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isGovernmentUrl('')).toBe(false);
  });
});

describe('isGitHubUrl', () => {
  it('returns true for github.com URL', () => {
    expect(isGitHubUrl(
      'https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Strategy.md'
    )).toBe(true);
  });

  it('returns true for www.github.com URL', () => {
    expect(isGitHubUrl('https://www.github.com/Hack23/cia/blob/master/README.md')).toBe(true);
  });

  it('returns true for raw.githubusercontent.com URL', () => {
    expect(isGitHubUrl(
      'https://raw.githubusercontent.com/Hack23/ISMS-PUBLIC/main/Information_Security_Strategy.md'
    )).toBe(true);
  });

  it('returns false for riksdagen.se URL', () => {
    expect(isGitHubUrl('https://www.riksdagen.se/sv/')).toBe(false);
  });

  it('returns false for regeringen.se URL', () => {
    expect(isGitHubUrl('https://www.regeringen.se/pressmeddelanden/')).toBe(false);
  });

  it('returns false for other URLs', () => {
    expect(isGitHubUrl('https://example.com/some-page')).toBe(false);
  });

  it('returns false for invalid URL', () => {
    expect(isGitHubUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isGitHubUrl('')).toBe(false);
  });
});

describe('toGitHubRawUrl', () => {
  it('converts github.com/blob/ URL to raw.githubusercontent.com', () => {
    expect(toGitHubRawUrl(
      'https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Strategy.md'
    )).toBe(
      'https://raw.githubusercontent.com/Hack23/ISMS-PUBLIC/main/Information_Security_Strategy.md'
    );
  });

  it('converts github.com/raw/ URL to raw.githubusercontent.com', () => {
    expect(toGitHubRawUrl(
      'https://github.com/Hack23/cia/raw/master/README.md'
    )).toBe(
      'https://raw.githubusercontent.com/Hack23/cia/master/README.md'
    );
  });

  it('returns raw.githubusercontent.com URL as-is', () => {
    const rawUrl = 'https://raw.githubusercontent.com/Hack23/ISMS-PUBLIC/main/Information_Security_Strategy.md';
    expect(toGitHubRawUrl(rawUrl)).toBe(rawUrl);
  });

  it('handles deep nested paths in blob URLs', () => {
    expect(toGitHubRawUrl(
      'https://github.com/Hack23/cia/blob/master/service.data.impl/sample-data/file.csv'
    )).toBe(
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/file.csv'
    );
  });

  it('returns null for github.com URL without blob/raw path', () => {
    expect(toGitHubRawUrl('https://github.com/Hack23/ISMS-PUBLIC')).toBeNull();
  });

  it('returns null for github.com URL with insufficient path segments', () => {
    expect(toGitHubRawUrl('https://github.com/Hack23')).toBeNull();
  });

  it('returns null for non-GitHub URL', () => {
    expect(toGitHubRawUrl('https://example.com/path')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(toGitHubRawUrl('not-a-url')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(toGitHubRawUrl('')).toBeNull();
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

describe('hashPathSuffix', () => {
  it('returns a deterministic base-36 string for a given path', () => {
    const result = hashPathSuffix('/pressmeddelanden/2026/03/example-doc');
    expect(typeof result).toBe('string');
    // Same input always yields same output
    expect(hashPathSuffix('/pressmeddelanden/2026/03/example-doc')).toBe(result);
  });

  it('returns different hashes for different paths', () => {
    const a = hashPathSuffix('/path/a');
    const b = hashPathSuffix('/path/b');
    expect(a).not.toBe(b);
  });

  it('replaces leading minus with "n"', () => {
    // The function should never return a string starting with '-'
    const result = hashPathSuffix('/some/path');
    expect(result).not.toMatch(/^-/);
  });

  it('handles empty string', () => {
    const result = hashPathSuffix('');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
