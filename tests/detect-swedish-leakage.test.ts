/**
 * Unit Tests for Swedish Leakage Detector
 * Tests detection of untranslated Swedish text in non-Swedish articles.
 */

import { describe, it, expect } from 'vitest';
import {
  detectSwedishLeakage,
  stripHtml,
  SWEDISH_STOP_WORDS,
  SWEDISH_PARLIAMENTARY_TERMS,
} from '../scripts/detect-swedish-leakage.js';

describe('Swedish Leakage Detector', () => {
  // ---- stripHtml ----

  describe('stripHtml', () => {
    it('should strip HTML tags', () => {
      expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('should decode HTML entities', () => {
      expect(stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
      expect(stripHtml('a &lt; b &gt; c')).toBe('a < b > c');
    });

    it('should strip script and style tags with content', () => {
      const html = '<script>var x = 1;</script><p>Text</p><style>.a{}</style>';
      expect(stripHtml(html)).toBe('Text');
    });

    it('should normalise whitespace', () => {
      expect(stripHtml('  Hello   World  ')).toBe('Hello World');
    });

    it('should decode Swedish character entities (å, ä, ö)', () => {
      expect(stripHtml('bet&auml;nkande')).toBe('betänkande');
      expect(stripHtml('f&ouml;r')).toBe('för');
      expect(stripHtml('&aring;r')).toBe('år');
      expect(stripHtml('&Auml;ldre')).toBe('Äldre');
      expect(stripHtml('&#228;ven')).toBe('även');
      expect(stripHtml('&#xE4;ven')).toBe('även');
    });

    it('should decode case-insensitive hex entities with leading zeros', () => {
      // Lowercase hex
      expect(stripHtml('&#xe4;ven')).toBe('även');
      // Uppercase hex prefix
      expect(stripHtml('&#Xe4;ven')).toBe('även');
      // Leading zeros
      expect(stripHtml('&#x00E4;ven')).toBe('även');
      expect(stripHtml('&#x0e4;ven')).toBe('även');
      // ö with various hex formats
      expect(stripHtml('&#xf6;r')).toBe('ör');
      expect(stripHtml('&#xF6;r')).toBe('ör');
      expect(stripHtml('&#X00f6;r')).toBe('ör');
      // å with hex
      expect(stripHtml('&#xe5;r')).toBe('år');
      expect(stripHtml('&#x00E5;r')).toBe('år');
    });

    it('should decode quote and dash entities', () => {
      expect(stripHtml('a &ndash; b')).toBe('a - b');
      expect(stripHtml('a &mdash; b')).toBe('a - b');
      expect(stripHtml('&ldquo;hello&rdquo;')).toBe('"hello"');
      expect(stripHtml('&lsquo;hello&rsquo;')).toBe("'hello'");
    });

    it('should decode doubly-encoded entities (&amp;#Xe4; → ä)', () => {
      expect(stripHtml('bet&amp;#xe4;nkande')).toBe('betänkande');
      expect(stripHtml('bet&amp;#Xe4;nkande')).toBe('betänkande');
      expect(stripHtml('bet&amp;#228;nkande')).toBe('betänkande');
      expect(stripHtml('f&amp;#xf6;r')).toBe('för');
      expect(stripHtml('&amp;#xe5;r')).toBe('år');
    });
  });

  // ---- Word lists ----

  describe('Swedish word lists', () => {
    it('should have Swedish stop words defined', () => {
      expect(SWEDISH_STOP_WORDS.size).toBeGreaterThan(20);
      expect(SWEDISH_STOP_WORDS.has('och')).toBe(true);
      expect(SWEDISH_STOP_WORDS.has('att')).toBe(true);
      expect(SWEDISH_STOP_WORDS.has('för')).toBe(true);
    });

    it('should have Swedish parliamentary terms defined', () => {
      expect(SWEDISH_PARLIAMENTARY_TERMS.size).toBeGreaterThan(90);
      expect(SWEDISH_PARLIAMENTARY_TERMS.has('betänkande')).toBe(true);
      expect(SWEDISH_PARLIAMENTARY_TERMS.has('betänkanden')).toBe(true);
      expect(SWEDISH_PARLIAMENTARY_TERMS.has('proposition')).toBe(true);
      expect(SWEDISH_PARLIAMENTARY_TERMS.has('propositionen')).toBe(true);
      expect(SWEDISH_PARLIAMENTARY_TERMS.has('utskottet')).toBe(true);
      // Ministry names should be in the set
      expect(SWEDISH_PARLIAMENTARY_TERMS.has('finansdepartementet')).toBe(true);
      expect(SWEDISH_PARLIAMENTARY_TERMS.has('justitiedepartementet')).toBe(true);
    });
  });

  // ---- detectSwedishLeakage ----

  describe('detectSwedishLeakage', () => {
    it('should return empty report for Swedish articles', () => {
      const html = '<p>Regeringen har beslutat att genomföra betänkande</p>';
      const report = detectSwedishLeakage(html, 'sv');
      expect(report.score).toBe(0);
      expect(report.leakedTerms).toHaveLength(0);
    });

    it('should detect Swedish parliamentary terms in English articles', () => {
      const html = '<p>The betänkande was discussed in the utskottet today.</p>';
      const report = detectSwedishLeakage(html, 'en');
      expect(report.score).toBeGreaterThan(0);
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('betänkande');
      expect(terms).toContain('utskottet');
    });
    it('should detect leaked terms adjacent to hyphen/dash punctuation', () => {
      const html = '<p>The betänkande- was debated and proposition&ndash; was referenced.</p>';
      const report = detectSwedishLeakage(html, 'en');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('betänkande');
      expect(terms).toContain('proposition');
    });


    it('should detect Swedish stop words in English articles', () => {
      const html = '<p>The government och the parliament har discussed this.</p>';
      const report = detectSwedishLeakage(html, 'en');
      expect(report.score).toBeGreaterThan(0);
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('och');
      expect(terms).toContain('har');
    });

    it('should not flag shared words in Scandinavian languages', () => {
      // "det" is valid in both Swedish and Danish
      const html = '<p>Det er vigtigt at diskutere dette.</p>';
      const report = detectSwedishLeakage(html, 'da');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).not.toContain('det');
    });

    it('should not flag shared parliamentary terms in Norwegian', () => {
      // "proposition" and "interpellation" are valid Norwegian parliamentary terms
      const html = '<p>The proposition was debated after an interpellation in parliament.</p>';
      const report = detectSwedishLeakage(html, 'no');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).not.toContain('proposition');
      expect(terms).not.toContain('interpellation');
    });

    it('should strip multi-line script blocks before scanning', () => {
      const html = '<script>\nvar riksdagen = "test";\nvar betänkande = true;\n</script>\n<p>Clean text</p>';
      const report = detectSwedishLeakage(html, 'en');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).not.toContain('riksdagen');
      expect(terms).not.toContain('betänkande');
    });

    it('should report correct line numbers', () => {
      const html = '<p>Normal text</p>\n<p>betänkande is here</p>\n<p>More text</p>';
      const report = detectSwedishLeakage(html, 'en');
      const betankande = report.leakedTerms.find((t) => t.term === 'betänkande');
      expect(betankande).toBeDefined();
      expect(betankande!.line).toBe(2);
    });

    it('should not double-count the same term but track occurrences', () => {
      const html = '<p>betänkande betänkande betänkande</p>';
      const report = detectSwedishLeakage(html, 'en');
      const matches = report.leakedTerms.filter((t) => t.term === 'betänkande');
      expect(matches).toHaveLength(1);
      expect(matches[0].count).toBe(3);
      // score = total occurrences, not unique terms
      expect(report.score).toBe(3);
    });

    it('should handle empty input', () => {
      const report = detectSwedishLeakage('', 'en');
      expect(report.score).toBe(0);
      expect(report.leakedTerms).toHaveLength(0);
    });

    it('should detect ministry-related committee names', () => {
      const html = '<p>The finansutskottet discussed the lagförslag in detail.</p>';
      const report = detectSwedishLeakage(html, 'en');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('finansutskottet');
      expect(terms).toContain('lagförslag');
    });

    it('should detect Swedish terms encoded as HTML entities', () => {
      const html = '<p>The bet&auml;nkande was discussed in the f&ouml;rsvarsutskottet.</p>';
      const report = detectSwedishLeakage(html, 'en');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('betänkande');
    });

    it('should handle HTML content with nested tags', () => {
      const html = '<div><p><span>The <b>betänkande</b> was approved</span></p></div>';
      const report = detectSwedishLeakage(html, 'en');
      expect(report.score).toBeGreaterThan(0);
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('betänkande');
    });

    it('should work with German target language', () => {
      const html = '<p>Die betänkande wurde im utskottet besprochen.</p>';
      const report = detectSwedishLeakage(html, 'de');
      expect(report.score).toBeGreaterThan(0);
    });

    it('should detect inflected Swedish parliamentary terms', () => {
      const html = '<p>The betänkanden were discussed alongside several propositioner.</p>';
      const report = detectSwedishLeakage(html, 'en');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('betänkanden');
      expect(terms).toContain('propositioner');
    });

    it('should not flag inflected shared parliamentary terms in Norwegian', () => {
      const html = '<p>Propositionerna ble diskutert etter interpellationen i parlamentet.</p>';
      const report = detectSwedishLeakage(html, 'no');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).not.toContain('propositionerna');
      expect(terms).not.toContain('interpellationen');
    });

    it('should preserve line numbers when stripping multi-line script blocks', () => {
      // Script block spans lines 2-5; leaked term on line 6 should report line 6
      const html = '<p>Normal</p>\n<script>\nvar x = 1;\nvar y = 2;\n</script>\n<p>betänkande here</p>';
      const report = detectSwedishLeakage(html, 'en');
      const betankande = report.leakedTerms.find((t) => t.term === 'betänkande');
      expect(betankande).toBeDefined();
      expect(betankande!.line).toBe(6);
    });

    it('should detect Swedish ministry names as leaked terms', () => {
      const html = '<p>The finansdepartementet announced new regulations.</p>';
      const report = detectSwedishLeakage(html, 'en');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('finansdepartementet');
    });

    it('should detect multiple ministry names', () => {
      const html = '<p>Both justitiedepartementet and utrikesdepartementet were involved.</p>';
      const report = detectSwedishLeakage(html, 'en');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('justitiedepartementet');
      expect(terms).toContain('utrikesdepartementet');
    });

    it('should work with Japanese target language', () => {
      const html = '<p>betänkande について utskottet で議論されました。</p>';
      const report = detectSwedishLeakage(html, 'ja');
      expect(report.score).toBeGreaterThan(0);
    });

    it('should not flag shared ministry name forms in Norwegian articles', () => {
      // Norwegian uses the same "departementet" naming convention as Swedish for some ministries
      const html = '<p>Finansdepartementet announced new policy together with Kulturdepartementet.</p>';
      const report = detectSwedishLeakage(html, 'no');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).not.toContain('finansdepartementet');
      expect(terms).not.toContain('kulturdepartementet');
    });

    it('should detect Swedish-only ministry names in Norwegian output', () => {
      // These have distinct Norwegian translations (Justisdepartementet, Utenriksdepartementet)
      const html = '<p>Både justitiedepartementet og utrikesdepartementet ble nevnt.</p>';
      const report = detectSwedishLeakage(html, 'no');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('justitiedepartementet');
      expect(terms).toContain('utrikesdepartementet');
    });

    it('should detect additional Swedish-only ministry spellings in Norwegian output', () => {
      // These Swedish spellings differ from Norwegian forms:
      // försvarsdepartementet (NO: Forsvarsdepartementet), miljödepartementet (NO: Klima- og miljødepartementet),
      // arbetsmarknadsdepartementet (NO: Arbeids- og inkluderingsdepartementet),
      // näringsdepartementet (NO: Nærings- og fiskeridepartementet)
      const html = '<p>försvarsdepartementet og miljödepartementet samt arbetsmarknadsdepartementet og näringsdepartementet.</p>';
      const report = detectSwedishLeakage(html, 'no');
      const terms = report.leakedTerms.map((t) => t.term);
      expect(terms).toContain('försvarsdepartementet');
      expect(terms).toContain('miljödepartementet');
      expect(terms).toContain('arbetsmarknadsdepartementet');
      expect(terms).toContain('näringsdepartementet');
    });
  });
});
