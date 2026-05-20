/**
 * @file pdf-converter.test.ts
 * @module tests/parliamentary-data/pdf-converter
 * @description Tool detection + text → markdown conversion. Split from
 * the original 710-line `tests/data-persistence.test.ts` (issue #2620).
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  textToMarkdown,
  isPdfToTextAvailable,
  resetPdfToolCache,
} from '../../scripts/parliamentary-data/pdf-converter.js';

describe('pdf-converter', () => {
  describe('isPdfToTextAvailable', () => {
    beforeEach(() => {
      resetPdfToolCache();
    });

    it('should return a boolean', () => {
      const result = isPdfToTextAvailable();
      expect(typeof result).toBe('boolean');
    });

    it('should cache the result', () => {
      const first = isPdfToTextAvailable();
      const second = isPdfToTextAvailable();
      expect(first).toBe(second);
    });
  });

  describe('textToMarkdown', () => {
    it('should return empty string for empty input', () => {
      expect(textToMarkdown('')).toBe('');
    });

    it('should convert ALL CAPS lines to headings', () => {
      const input = 'INTRODUCTION\nThis is a paragraph.';
      const result = textToMarkdown(input);
      expect(result).toContain('## INTRODUCTION');
      expect(result).toContain('This is a paragraph.');
    });

    it('should preserve paragraph breaks', () => {
      const input = 'First paragraph.\n\nSecond paragraph.';
      const result = textToMarkdown(input);
      expect(result).toContain('First paragraph.');
      expect(result).toContain('Second paragraph.');
      const lines = result.split('\n');
      const emptyLineIndex = lines.findIndex((l) => l === '');
      expect(emptyLineIndex).toBeGreaterThan(0);
    });

    it('should not convert short ALL CAPS as headings', () => {
      const input = 'AB\nSome text';
      const result = textToMarkdown(input);
      expect(result).not.toContain('## AB');
    });

    it('should handle Swedish characters in headings', () => {
      const input = 'FÖRSLAG TILL RIKSDAGSBESLUT\nContent here.';
      const result = textToMarkdown(input);
      expect(result).toContain('## FÖRSLAG TILL RIKSDAGSBESLUT');
    });

    it('should normalise excessive whitespace', () => {
      const input = 'Line 1\n\n\n\n\nLine 2';
      const result = textToMarkdown(input);
      expect(result).not.toMatch(/\n\n\n/);
    });

    it('should handle mixed content', () => {
      const input = [
        'SAMMANFATTNING',
        '',
        'Regeringen föreslår att riksdagen godkänner...',
        '',
        'FÖRSLAG TILL RIKSDAGSBESLUT',
        '',
        '1. Riksdagen godkänner att...',
      ].join('\n');

      const result = textToMarkdown(input);
      expect(result).toContain('## SAMMANFATTNING');
      expect(result).toContain('## FÖRSLAG TILL RIKSDAGSBESLUT');
      expect(result).toContain('1. Riksdagen godkänner att...');
    });
  });
});
