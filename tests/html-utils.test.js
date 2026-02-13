import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../scripts/html-utils.js';

describe('html-utils', () => {
  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape angle brackets', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('he said "hello"')).toBe('he said &quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("it's fine")).toBe('it&#039;s fine');
    });

    it('should handle null input', () => {
      expect(escapeHtml(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle numeric input via String coercion', () => {
      expect(escapeHtml(42)).toBe('42');
    });

    it('should handle strings with no special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should escape all special characters together', () => {
      expect(escapeHtml('<a href="x" data-val=\'y\'>&')).toBe(
        '&lt;a href=&quot;x&quot; data-val=&#039;y&#039;&gt;&amp;'
      );
    });
  });
});
