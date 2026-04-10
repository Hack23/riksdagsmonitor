/**
 * Unit Tests for Article Content Depth Validation
 *
 * Tests the content depth validation functions in article-quality-enhancer.ts:
 * - hasWhatHappensNext: Detects "What Happens Next" section (class or heading in 14 languages)
 * - hasWinnersLosers: Detects "Winners & Losers" section (class or heading in 14 languages)
 * - countSpecificClaims: Counts verifiable claim indicators (doc refs, percentages, named actors)
 * - hasSubstantialLede: Validates lede paragraph word count (≥ 30)
 * - countSectionWords: Counts words in a section identified by CSS class
 */

import { describe, it, expect } from 'vitest';
import {
  hasWhatHappensNext,
  hasWinnersLosers,
  countSpecificClaims,
  hasSubstantialLede,
  countSectionWords,
} from '../scripts/article-quality-enhancer.js';

// ---------------------------------------------------------------------------
// hasWhatHappensNext
// ---------------------------------------------------------------------------

describe('hasWhatHappensNext', () => {
  it('should detect section by CSS class (double quotes)', () => {
    const html = '<section class="what-happens-next"><h2>Next Steps</h2></section>';
    expect(hasWhatHappensNext(html)).toBe(true);
  });

  it('should detect section by CSS class (single quotes)', () => {
    const html = "<section class='article-section what-happens-next'><p>Soon</p></section>";
    expect(hasWhatHappensNext(html)).toBe(true);
  });

  it('should detect English heading', () => {
    const html = '<h2>What Happens Next</h2><p>Timeline of events.</p>';
    expect(hasWhatHappensNext(html)).toBe(true);
  });

  it('should detect Swedish heading', () => {
    const html = '<h2>Vad händer härnäst</h2><p>Nästa steg.</p>';
    expect(hasWhatHappensNext(html)).toBe(true);
  });

  it('should detect German heading', () => {
    const html = '<h2>Was passiert als Nächstes</h2><p>Zeitplan.</p>';
    expect(hasWhatHappensNext(html)).toBe(true);
  });

  it('should detect Japanese heading', () => {
    const html = '<h2>次のステップ</h2><p>今後の予定。</p>';
    expect(hasWhatHappensNext(html)).toBe(true);
  });

  it('should detect Arabic heading', () => {
    const html = '<h2>ماذا يحدث بعد ذلك</h2><p>الخطوات التالية.</p>';
    expect(hasWhatHappensNext(html)).toBe(true);
  });

  it('should detect Hebrew heading', () => {
    const html = '<h2>מה קורה בהמשך</h2><p>השלבים הבאים.</p>';
    expect(hasWhatHappensNext(html)).toBe(true);
  });

  it('should return false when section is absent', () => {
    const html = '<h2>Key Takeaways</h2><p>Summary of findings.</p>';
    expect(hasWhatHappensNext(html)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasWinnersLosers
// ---------------------------------------------------------------------------

describe('hasWinnersLosers', () => {
  it('should detect section by CSS class', () => {
    const html = '<section class="winners-losers"><h2>Outcomes</h2></section>';
    expect(hasWinnersLosers(html)).toBe(true);
  });

  it('should detect English heading with ampersand', () => {
    const html = '<h2>Winners & Losers</h2><p>Analysis.</p>';
    expect(hasWinnersLosers(html)).toBe(true);
  });

  it('should detect English heading with "and"', () => {
    const html = '<h2>Winners and Losers</h2><p>Analysis.</p>';
    expect(hasWinnersLosers(html)).toBe(true);
  });

  it('should NOT match "winners n losers" (false positive guard)', () => {
    const html = '<p>The winners n losers of this debate.</p>';
    expect(hasWinnersLosers(html)).toBe(false);
  });

  it('should detect Swedish heading', () => {
    const html = '<h2>Vinnare och Förlorare</h2><p>Analys.</p>';
    expect(hasWinnersLosers(html)).toBe(true);
  });

  it('should detect Finnish heading', () => {
    const html = '<h2>Voittajat ja häviäjät</h2><p>Analyysi.</p>';
    expect(hasWinnersLosers(html)).toBe(true);
  });

  it('should detect Korean heading', () => {
    const html = '<h2>승자와 패자</h2><p>분석.</p>';
    expect(hasWinnersLosers(html)).toBe(true);
  });

  it('should detect Chinese heading', () => {
    const html = '<h2>赢家与输家</h2><p>分析。</p>';
    expect(hasWinnersLosers(html)).toBe(true);
  });

  it('should return false when section is absent', () => {
    const html = '<h2>SWOT Analysis</h2><p>Strengths and weaknesses.</p>';
    expect(hasWinnersLosers(html)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// countSpecificClaims
// ---------------------------------------------------------------------------

describe('countSpecificClaims', () => {
  it('should count document references (Prop.)', () => {
    const html = '<p>According to Prop. 2024/25:123 the measure will cost 5 billion.</p>';
    expect(countSpecificClaims(html)).toBeGreaterThanOrEqual(1);
  });

  it('should count document references (Bet.)', () => {
    const html = '<p>The committee report Bet. 2024/25:FiU1 recommends approval.</p>';
    expect(countSpecificClaims(html)).toBeGreaterThanOrEqual(1);
  });

  it('should count percentage figures', () => {
    const html = '<p>Support rose by 12.5% compared to last year.</p>';
    expect(countSpecificClaims(html)).toBeGreaterThanOrEqual(1);
  });

  it('should count named MPs with party affiliation', () => {
    const html = '<p>Anna Karlsson (SD) proposed the amendment.</p>';
    expect(countSpecificClaims(html)).toBeGreaterThanOrEqual(1);
  });

  it('should deduplicate repeated document references', () => {
    const html = `
      <p>Prop. 2024/25:1 was debated. Later, Prop. 2024/25:1 was again discussed.
      Also Prop. 2024/25:1 was mentioned once more.</p>
    `;
    // Same doc ID repeated 3 times should count as 1
    const claims = countSpecificClaims(html);
    expect(claims).toBe(1);
  });

  it('should cap document references at 5', () => {
    const refs = Array.from({ length: 10 }, (_, i) => `Prop. 2024/25:${i + 1}`);
    const html = `<p>${refs.join('. ')}.</p>`;
    const claims = countSpecificClaims(html);
    // At most 5 from doc refs + 0 from percent/names = max 5
    expect(claims).toBeLessThanOrEqual(5);
  });

  it('should return 0 for generic text with no specific claims', () => {
    const html = '<p>The government announced new policies today.</p>';
    expect(countSpecificClaims(html)).toBe(0);
  });

  it('should combine multiple claim types', () => {
    const html = `
      <p>Prop. 2024/25:100 increases the budget by 15%.
      Erik Svensson (M) supports the proposal.</p>
    `;
    // 1 doc ref + 1 percent + 1 named actor = 3
    expect(countSpecificClaims(html)).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// hasSubstantialLede
// ---------------------------------------------------------------------------

describe('hasSubstantialLede', () => {
  it('should return true for a lede with 30+ words', () => {
    const words = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ');
    const html = `<p class="lede">${words}</p>`;
    expect(hasSubstantialLede(html)).toBe(true);
  });

  it('should return false for a short lede', () => {
    const html = '<p class="lede">Short lede paragraph.</p>';
    expect(hasSubstantialLede(html)).toBe(false);
  });

  it('should return false when no lede paragraph exists', () => {
    const html = '<p>Regular paragraph without lede class.</p>';
    expect(hasSubstantialLede(html)).toBe(false);
  });

  it('should strip HTML tags before counting words', () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
    const html = `<p class="lede"><strong>${words}</strong></p>`;
    expect(hasSubstantialLede(html)).toBe(true);
  });

  it('should handle lede with extra classes', () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
    const html = `<p class="article-lede lede highlighted">${words}</p>`;
    expect(hasSubstantialLede(html)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// countSectionWords
// ---------------------------------------------------------------------------

describe('countSectionWords', () => {
  it('should count words in a section with double-quoted class', () => {
    const html = '<section class="key-takeaways">one two three four five</section>';
    expect(countSectionWords(html, 'key-takeaways')).toBe(5);
  });

  it('should count words in a section with single-quoted class', () => {
    const html = "<section class='key-takeaways'>one two three four five</section>";
    expect(countSectionWords(html, 'key-takeaways')).toBe(5);
  });

  it('should count words in a div element', () => {
    const html = '<div class="what-happens-next">first second third</div>';
    expect(countSectionWords(html, 'what-happens-next')).toBe(3);
  });

  it('should strip HTML tags before counting', () => {
    const html = '<section class="analysis"><p><strong>Bold</strong> word and <em>italic</em> text</p></section>';
    expect(countSectionWords(html, 'analysis')).toBe(5);
  });

  it('should return 0 when section is not found', () => {
    const html = '<section class="other-section">Some content</section>';
    expect(countSectionWords(html, 'missing-section')).toBe(0);
  });

  it('should handle section with multiple classes', () => {
    const html = '<section class="article-section winners-losers highlighted">alpha beta gamma</section>';
    expect(countSectionWords(html, 'winners-losers')).toBe(3);
  });

  it('should return 0 for empty section', () => {
    const html = '<section class="faq-section"></section>';
    expect(countSectionWords(html, 'faq-section')).toBe(0);
  });
});
