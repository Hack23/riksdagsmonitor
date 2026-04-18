/**
 * Tests for extractKeyPassage — passage extraction from document full text.
 * Validates HTML stripping, URL removal, markdown link cleanup, and truncation.
 */

import { describe, it, expect } from 'vitest';
import { extractKeyPassage, stripRiksdagRawDump } from '../scripts/data-transformers/helpers.js';

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

  it('strips Riksdag proposition raw-dump header + embedded CSS (html-ec … -RIM UUID marker)', () => {
    const dump =
      '5287561 HD03242 2025/26 242 prop prop prop Proposition 2025/26:242 ' +
      'Proposition Proposition Landsbygds- och infrastrukturdepartementet MJU 242 0 ' +
      '2026-04-16 00:00:00 2026-04-16 15:24:08 2026-04-16 00:00:00 ' +
      'Ett tydligt regelverk för aktivt skogsbruk html-ec prop-RIM ' +
      '76066c92-4400-457b-ac3a-a0f403e9bdfc ' +
      'body {margin-top: 0px;margin-left: 0px;} ' +
      '#page_1 {position:relative; overflow: hidden;margin:10px 0px 21px 10px;padding:0px;border:none;width:766px;} ' +
      'Propositionens huvudsakliga innehåll är att tydliggöra regelverket för aktivt skogsbruk i Sverige.';
    const result = extractKeyPassage(dump, 500);
    expect(result).not.toContain('5287561');
    expect(result).not.toContain('HD03242');
    expect(result).not.toContain('html-ec');
    expect(result).not.toContain('prop-RIM');
    expect(result).not.toContain('76066c92-4400-457b-ac3a-a0f403e9bdfc');
    expect(result).not.toContain('body {');
    expect(result).not.toContain('#page_1');
    expect(result).not.toContain('margin-top');
    expect(result).toContain('Propositionens huvudsakliga innehåll');
  });

  it('strips Riksdag committee-report raw-dump header without html-ec marker (bare UUID fallback)', () => {
    const dump =
      '5286898 HD01KU44 2025/26 KU44 bet bet bet Betänkande 2025/26:KU44 ' +
      'Betänkande Debatt om förslag KU 44 0 2026-04-13 00:00:00 2026-04-13 11:05:12 ' +
      '2026-04-13 11:04:18 Uppskov med behandlingen av vissa ärenden planerat Brus ' +
      'aeda74fa-73bd-4ad7-bf56-f02b41bc64e8 ' +
      'Konstitutionsutskottet föreslår att riksdagen medger att behandlingen av vissa ärenden skjuts upp.';
    const result = extractKeyPassage(dump, 500);
    expect(result).not.toContain('5286898');
    expect(result).not.toContain('HD01KU44');
    expect(result).not.toContain('aeda74fa-73bd-4ad7-bf56-f02b41bc64e8');
    expect(result).toContain('Konstitutionsutskottet');
  });

  it('strips Riksdag motion raw-dump header when no UUID is present (timestamp fallback)', () => {
    const dump =
      '5287820 HD024098 2025/26 4098 mot Kommittémotion mot Motion 2025/26:4098 ' +
      'av Janine Alm Ericson m.fl. (MP) Motion Motion 088 FiU 4098 0 ' +
      '2026-04-17 00:00:00 2026-04-17 16:23:34 2026-04-17 00:00:00 ' +
      'med anledning av prop. 2025/26:236 Extra ändringsbudget för 2026.';
    const result = extractKeyPassage(dump, 500);
    expect(result).not.toContain('5287820');
    expect(result).not.toContain('HD024098');
    expect(result).not.toMatch(/2025\/26\s+4098\s+mot\s+mot/);
    expect(result).toContain('med anledning av prop. 2025/26:236');
  });

  it('leaves non-Riksdag text with braces untouched (no false-positive CSS stripping)', () => {
    const text = 'Researchers discussed curly braces {such as these} in mathematical notation. No CSS properties here.';
    expect(extractKeyPassage(text)).toBe(text);
  });

  it('leaves Swedish prose with CSS-like numeric patterns outside of braces untouched', () => {
    // Natural-language text may contain "px" or ":digit" adjacent to braces —
    // make sure the CSS sniffer only fires on actual CSS blocks.
    const text =
      'Skatteverket rapporterade en prisökning: 10 procent under 2024. ' +
      'Projektet är { sammanfattat i rapporten } och kräver 150 px marginal enligt grafisk profil. ' +
      'Lagförslaget antogs.';
    // The brace block here has no CSS properties inside it, so it must survive.
    const result = extractKeyPassage(text);
    expect(result).toContain('sammanfattat i rapporten');
    expect(result).toContain('150 px marginal');
    expect(result).toContain('Lagförslaget antogs');
  });

  it('stripRiksdagRawDump returns empty string for empty input', () => {
    expect(stripRiksdagRawDump('')).toBe('');
  });

  it('stripRiksdagRawDump is a no-op for clean prose', () => {
    const text = 'Propositionen föreslår ändringar i skogsbrukslagen.';
    expect(stripRiksdagRawDump(text)).toBe(text);
  });
});
