/**
 * Tests for extractKeyPassage — passage extraction from document full text.
 * Validates HTML stripping, URL removal, markdown link cleanup, and truncation.
 */

import { describe, it, expect } from 'vitest';
import { extractKeyPassage } from '../scripts/data-transformers/helpers.js';

describe('extractKeyPassage', () => {
  it('returns empty string for undefined input', () => {
    expect(extractKeyPassage(undefined)).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(extractKeyPassage('')).toBe('');
  });

  it('returns full text when shorter than maxChars', () => {
    const text = 'This is a short passage.';
    expect(extractKeyPassage(text)).toBe(text);
  });

  it('strips HTML tags from text', () => {
    const text = '<p>This is <strong>important</strong> text.</p>';
    expect(extractKeyPassage(text)).toBe('This is important text.');
  });

  it('strips bare URLs from text', () => {
    const text = 'Visit https://www.example.com/page for more info. This is the main content.';
    expect(extractKeyPassage(text)).toBe('Visit for more info. This is the main content.');
  });

  it('strips markdown links and keeps link text', () => {
    const text = 'Registration [registration form](https://www.lyyti.in/event). Main content here.';
    expect(extractKeyPassage(text)).toBe('Registration registration form. Main content here.');
  });

  it('strips HTML anchor tags and removes URLs from the result', () => {
    const text = '<a href="https://www.lyyti.in/form">Registration form - external</a>. Policy discussion continues.';
    const result = extractKeyPassage(text);
    expect(result).not.toContain('https://');
    expect(result).toContain('Registration form - external');
    expect(result).toContain('Policy discussion continues.');
  });

  it('handles text with multiple URLs', () => {
    const text = 'See https://example.com and https://other.org for details. Important analysis.';
    const result = extractKeyPassage(text);
    expect(result).not.toContain('https://');
    expect(result).toContain('Important analysis.');
  });

  it('truncates at sentence boundary when exceeding maxChars', () => {
    const sentence1 = 'First sentence about policy analysis with sufficient length to test.';
    const sentence2 = 'Second sentence provides further context and detail.';
    const sentence3 = 'Third sentence is the conclusion.';
    const text = `${sentence1} ${sentence2} ${sentence3}`;
    const result = extractKeyPassage(text, 130);
    expect(result).toContain(sentence1);
    expect(result).toContain(sentence2);
    expect(result).not.toContain(sentence3);
  });

  it('uses ellipsis when no sentence boundary found near maxChars', () => {
    const longWord = 'abcdefghij'.repeat(20); // 200 chars, no periods
    const result = extractKeyPassage(longWord, 50);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBe(51); // 50 chars + ellipsis
  });
});
