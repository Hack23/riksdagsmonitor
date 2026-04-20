/**
 * Unit tests for `scripts/data-transformers/text-cleaner.ts` (§P0-4).
 *
 * These tests lock in the prose-hygiene contract so Riksdag raw-dump
 * residue can never reach article HTML through summary/notis fields.
 */

import { describe, it, expect } from 'vitest';
import { cleanSummaryForDisplay, looksLikeRawDump } from '../scripts/data-transformers/text-cleaner.js';

describe('cleanSummaryForDisplay', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(cleanSummaryForDisplay(null)).toBe('');
    expect(cleanSummaryForDisplay(undefined)).toBe('');
    expect(cleanSummaryForDisplay('')).toBe('');
  });

  it('passes legitimate prose through unchanged (idempotent)', () => {
    const prose = 'Regeringen föreslår en ny lag om cybersäkerhet.';
    expect(cleanSummaryForDisplay(prose)).toBe(prose);
    // Idempotency
    expect(cleanSummaryForDisplay(cleanSummaryForDisplay(prose))).toBe(prose);
  });

  it('strips the Riksdag dok-id metadata prefix (§P0-4 case 1)', () => {
    const dump = '5287684 HD03232 2025/26 232 prop prop prop Proposition 2025/26:232 om en ny lag';
    const cleaned = cleanSummaryForDisplay(dump);
    expect(cleaned).not.toMatch(/^\d{6,}\s+HD/);
    expect(cleaned).not.toMatch(/prop prop prop/);
    expect(cleaned).toContain('Proposition 2025/26:232 om en ny lag');
  });

  it('strips CSS rule fragments inline in summary text', () => {
    const raw = 'Lagens innehåll .t10{width: 555px; font: italic 13px Verdana !important;} rörande försvar.';
    const cleaned = cleanSummaryForDisplay(raw);
    expect(cleaned).not.toMatch(/\.t10\{/);
    expect(cleaned).not.toMatch(/width:\s*555px/);
    expect(cleaned).toMatch(/Lagens innehåll.*rörande försvar\./);
  });

  it('strips #page_N and #id_N anchors', () => {
    expect(cleanSummaryForDisplay('Se avsnitt #page_34 för detaljer.'))
      .toBe('Se avsnitt för detaljer.');
    expect(cleanSummaryForDisplay('Referens #id_12 i texten.'))
      .toBe('Referens i texten.');
  });

  it('collapses Proposition-stuttering (≥ 3 repeats)', () => {
    expect(cleanSummaryForDisplay('Proposition Proposition Proposition om klimat'))
      .toBe('Proposition om klimat');
    expect(cleanSummaryForDisplay('Motion Motion Motion Motion Motion av Anders'))
      .toBe('Motion av Anders');
  });

  it('preserves legitimate double-words (< 3 repeats)', () => {
    // Two repeats are left alone — only 3+ are a stutter.
    const text = 'Det är är en vanlig skrivning.';
    expect(cleanSummaryForDisplay(text)).toBe(text);
  });

  it('decodes &nbsp; to ordinary space and collapses whitespace', () => {
    expect(cleanSummaryForDisplay('En&nbsp;&nbsp;lag   om\t\tcyber säkerhet'))
      .toBe('En lag om cyber säkerhet');
  });

  it('handles the full real-world monthly-review leak case', () => {
    // This shape is taken straight from 2026-04-19-monthly-review-en.html:
    // dok-id prefix + stutter + CSS + trailing prose.
    const raw = '5287684 HD03232 2025/26 232 prop prop prop Proposition 2025/26:232 Proposition Proposition .p436{text-align:center;} Utredningen om statens ansvar.';
    const cleaned = cleanSummaryForDisplay(raw);
    expect(cleaned).not.toMatch(/^\d{6,}\s+HD/);
    expect(cleaned).not.toMatch(/\.p436\{/);
    // Stutter pattern matches only 3+ consecutive same-word. Here the word
    // "Proposition" appears 3 times back-to-back after the prefix strip, so
    // it collapses to a single "Proposition" token.
    expect(cleaned).toMatch(/Proposition/);
    expect(cleaned).not.toMatch(/Proposition\s+Proposition\s+Proposition/);
    expect(cleaned).toContain('Utredningen om statens ansvar.');
  });
});

describe('looksLikeRawDump', () => {
  it('returns true for dok-id prefix', () => {
    expect(looksLikeRawDump('5287684 HD03232 2025/26 232 prop')).toBe(true);
  });

  it('returns true for embedded CSS rules', () => {
    expect(looksLikeRawDump('text .p436{text-align:center;} more')).toBe(true);
  });

  it('returns true for #page_N anchors', () => {
    expect(looksLikeRawDump('See #page_34 for details')).toBe(true);
  });

  it('returns false for clean prose', () => {
    expect(looksLikeRawDump('En ordinarie sammanfattning av propositionen.')).toBe(false);
  });

  it('returns false for null/undefined/empty', () => {
    expect(looksLikeRawDump(null)).toBe(false);
    expect(looksLikeRawDump(undefined)).toBe(false);
    expect(looksLikeRawDump('')).toBe(false);
  });
});
