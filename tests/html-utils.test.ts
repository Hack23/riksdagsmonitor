import { describe, it, expect, afterEach, vi } from 'vitest';
import { escapeHtml, decodeHtmlEntities } from '../scripts/html-utils.js';

describe('html-utils', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
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

  describe('decodeHtmlEntities', () => {
    it('should decode Swedish numeric entities to UTF-8', () => {
      expect(decodeHtmlEntities('f&#246;resl&#229;r')).toBe('föreslår');
    });

    it('should decode ä ö å entities', () => {
      expect(decodeHtmlEntities('&#228;')).toBe('ä');
      expect(decodeHtmlEntities('&#246;')).toBe('ö');
      expect(decodeHtmlEntities('&#229;')).toBe('å');
    });

    it('should decode uppercase Swedish entities', () => {
      expect(decodeHtmlEntities('&#196;')).toBe('Ä');
      expect(decodeHtmlEntities('&#214;')).toBe('Ö');
      expect(decodeHtmlEntities('&#197;')).toBe('Å');
    });

    it('should decode em-dash and en-dash entities', () => {
      expect(decodeHtmlEntities('&#8212;')).toBe('—');
      expect(decodeHtmlEntities('&#8211;')).toBe('–');
    });

    it('should decode hex entities', () => {
      expect(decodeHtmlEntities('&#x00E4;')).toBe('ä');
      expect(decodeHtmlEntities('&#x00F6;')).toBe('ö');
    });

    it('should decode named entities', () => {
      expect(decodeHtmlEntities('&amp;')).toBe('&');
      expect(decodeHtmlEntities('&lt;')).toBe('<');
      expect(decodeHtmlEntities('&gt;')).toBe('>');
      expect(decodeHtmlEntities('&quot;')).toBe('"');
      expect(decodeHtmlEntities('&mdash;')).toBe('—');
    });

    it('should decode mixed content with entities and regular text', () => {
      expect(decodeHtmlEntities('Regeringen f&#246;resl&#229;r ers&#228;ttning'))
        .toBe('Regeringen föreslår ersättning');
    });

    it('should handle text with no entities', () => {
      expect(decodeHtmlEntities('Hello World')).toBe('Hello World');
    });

    it('should handle null input', () => {
      expect(decodeHtmlEntities(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(decodeHtmlEntities(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(decodeHtmlEntities('')).toBe('');
    });

    it('should preserve valid UTF-8 characters', () => {
      expect(decodeHtmlEntities('föreslår')).toBe('föreslår');
    });

    it('should decode author name with entities', () => {
      expect(decodeHtmlEntities('James Pether S&#246;rling')).toBe('James Pether Sörling');
    });

    it('should decode article title with multiple entity types', () => {
      const input = 'Artskyddsbegr&#228;nsningar &#8212; en &#246;versikt';
      expect(decodeHtmlEntities(input)).toBe('Artskyddsbegränsningar — en översikt');
    });
  });
});
