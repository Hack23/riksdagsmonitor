/**
 * Tests for generateSwotSection — embeddable SWOT analysis for articles.
 * Validates HTML structure, label localisation, impact badges, XSS escaping,
 * and TemplateSection shape.
 */

import { describe, it, expect } from 'vitest';
import { generateSwotSection } from '../scripts/data-transformers/content-generators/swot-section.js';
import type { SwotData } from '../scripts/types/article.js';

/** Minimal SWOT data for tests */
function makeSwot(overrides: Partial<SwotData> = {}): SwotData {
  return {
    strengths: [{ text: 'Strong base', impact: 'high' }],
    weaknesses: [{ text: 'Internal divisions', impact: 'medium' }],
    opportunities: [{ text: 'Rising issue salience', impact: 'high' }],
    threats: [{ text: 'Coalition instability', impact: 'low' }],
    ...overrides,
  };
}

describe('generateSwotSection', () => {
  it('returns a TemplateSection with correct id and className', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.id).toBe('swot-analysis');
    expect(section.className).toBe('swot-analysis-section');
    expect(typeof section.html).toBe('string');
    expect(section.html.length).toBeGreaterThan(0);
  });

  it('renders a <section> with the swot-analysis class', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).toContain('<section class="swot-analysis"');
    expect(section.html).toContain('</section>');
  });

  it('renders all four quadrants with correct CSS classes', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).toContain('swot-strengths');
    expect(section.html).toContain('swot-weaknesses');
    expect(section.html).toContain('swot-opportunities');
    expect(section.html).toContain('swot-threats');
  });

  it('renders English heading labels', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).toContain('SWOT Analysis');
    expect(section.html).toContain('Strengths');
    expect(section.html).toContain('Weaknesses');
    expect(section.html).toContain('Opportunities');
    expect(section.html).toContain('Threats');
  });

  it('renders Swedish heading labels', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'sv' });
    expect(section.html).toContain('SWOT-analys');
    expect(section.html).toContain('Styrkor');
    expect(section.html).toContain('Svagheter');
    expect(section.html).toContain('Möjligheter');
    expect(section.html).toContain('Hot');
  });

  it('renders entry text inside list items', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).toContain('Strong base');
    expect(section.html).toContain('Internal divisions');
    expect(section.html).toContain('Rising issue salience');
    expect(section.html).toContain('Coalition instability');
  });

  it('renders impact badges', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).toContain('[high]');
    expect(section.html).toContain('[medium]');
    expect(section.html).toContain('[low]');
    expect(section.html).toContain('class="swot-impact"');
  });

  it('renders subject line when provided', () => {
    const data = makeSwot({ subject: 'Moderaterna (M)' });
    const section = generateSwotSection({ data, lang: 'en' });
    expect(section.html).toContain('Moderaterna (M)');
    expect(section.html).toContain('class="swot-subject"');
  });

  it('omits subject line when not provided', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).not.toContain('class="swot-subject"');
  });

  it('renders context note when provided', () => {
    const data = makeSwot({ context: 'Based on Q1 2026 polling data.' });
    const section = generateSwotSection({ data, lang: 'en' });
    expect(section.html).toContain('Based on Q1 2026 polling data.');
    expect(section.html).toContain('class="swot-context"');
  });

  it('escapes XSS in entry text', () => {
    const data = makeSwot({
      strengths: [{ text: '<script>alert("xss")</script>', impact: 'high' }],
    });
    const section = generateSwotSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<script>alert');
    expect(section.html).toContain('&lt;script&gt;');
  });

  it('escapes XSS in subject and context', () => {
    const data = makeSwot({
      subject: '<img onerror=alert(1)>',
      context: '<script>bad</script>',
    });
    const section = generateSwotSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<img onerror');
    expect(section.html).not.toContain('<script>bad');
  });

  it('omits empty quadrants gracefully', () => {
    const data: SwotData = {
      strengths: [{ text: 'Only strength' }],
      weaknesses: [],
      opportunities: [],
      threats: [],
    };
    const section = generateSwotSection({ data, lang: 'en' });
    expect(section.html).toContain('Only strength');
    // Empty quadrants should not render
    expect(section.html).not.toContain('swot-weaknesses');
    expect(section.html).not.toContain('swot-opportunities');
    expect(section.html).not.toContain('swot-threats');
  });

  it('supports all 14 languages without errors', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    for (const lang of langs) {
      const section = generateSwotSection({ data: makeSwot(), lang });
      expect(section.html).toContain('<section class="swot-analysis"');
      expect(section.html).toContain('</section>');
    }
  });

  it('includes aria-label for accessibility', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).toContain('aria-label="SWOT Analysis"');
  });
});
