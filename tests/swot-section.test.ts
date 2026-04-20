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

  it('renders impact badges with CSS classes instead of inline styles', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).toContain('[High]');
    expect(section.html).toContain('[Medium]');
    expect(section.html).toContain('[Low]');
    expect(section.html).toContain('class="swot-impact swot-impact--high"');
    expect(section.html).toContain('class="swot-impact swot-impact--medium"');
    expect(section.html).toContain('class="swot-impact swot-impact--low"');
    // No inline styles for impact colors
    expect(section.html).not.toContain('style="color:');
  });

  it('localises impact badge labels for non-English languages', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'sv' });
    expect(section.html).toContain('[Hög]');
    expect(section.html).toContain('[Medel]');
    expect(section.html).toContain('[Låg]');
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

  // ----- SWOT Radar Chart Tests -----

  it('renders radar chart canvas when multiple quadrants have entries', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    expect(section.html).toContain('swot-radar-wrapper');
    expect(section.html).toContain('data-chart-config');
    expect(section.html).toContain('canvas');
  });

  it('radar chart config has correct type and datasets', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    const match = section.html.match(/data-chart-config="([^"]*)"/);
    expect(match).not.toBeNull();
    const config = JSON.parse(match![1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    expect(config.type).toBe('radar');
    expect(config.data.labels).toHaveLength(4);
    expect(config.data.datasets).toHaveLength(1);
    expect(config.data.datasets[0].data).toHaveLength(4);
  });

  it('radar chart scores are weighted by impact level', () => {
    const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
    const match = section.html.match(/data-chart-config="([^"]*)"/);
    const config = JSON.parse(match![1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    const scores = config.data.datasets[0].data;
    // high impact (3) > medium (2) > low (1)
    expect(scores[0]).toBe(3); // strengths: high
    expect(scores[1]).toBe(2); // weaknesses: medium
    expect(scores[2]).toBe(3); // opportunities: high
    expect(scores[3]).toBe(1); // threats: low
  });

  it('omits radar chart when fewer than 2 quadrants have entries', () => {
    const data: SwotData = {
      strengths: [{ text: 'Only one', impact: 'high' }],
      weaknesses: [],
      opportunities: [],
      threats: [],
    };
    const section = generateSwotSection({ data, lang: 'en' });
    expect(section.html).not.toContain('swot-radar-wrapper');
    // When no radar is emitted the a11y fallback table should also be absent
    // (the quadrant lists already carry the data).
    expect(section.html).not.toContain('swot-radar-fallback');
  });

  describe('SWOT radar a11y fallback table', () => {
    it('emits an sr-only <table> alongside the radar canvas', () => {
      const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
      expect(section.html).toContain('<table class="swot-radar-fallback sr-only">');
      expect(section.html).toContain('<caption>');
      expect(section.html).toMatch(/<th scope="col">/);
      expect(section.html).toMatch(/<th scope="row">/);
    });

    it('fallback table contains one row per quadrant with correct weighted impact score', () => {
      // Impact weights: high=3, medium=2, low=1
      // strengths=high(3), weaknesses=medium(2), opportunities=high(3), threats=low(1)
      const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
      // Count the number of <tr> inside <tbody>
      const tbodyMatch = section.html.match(/<tbody>([\s\S]*?)<\/tbody>/);
      expect(tbodyMatch).not.toBeNull();
      const rowCount = (tbodyMatch![1].match(/<tr>/g) ?? []).length;
      expect(rowCount).toBe(4);
      // Score cells should be present (one per quadrant, integer)
      expect(section.html).toMatch(/<td>3<\/td>\s*<\/tr>/);  // strengths or opportunities
    });

    it('fallback table is omitted when radar is omitted', () => {
      const data: SwotData = {
        strengths: [{ text: 'Only one', impact: 'high' }],
        weaknesses: [],
        opportunities: [],
        threats: [],
      };
      const section = generateSwotSection({ data, lang: 'en' });
      expect(section.html).not.toContain('swot-radar-fallback');
    });

    it('radar canvas config never contains a function literal (CSP hygiene)', () => {
      const section = generateSwotSection({ data: makeSwot(), lang: 'en' });
      // data-chart-config is JSON-encoded and HTML-escaped; check the raw
      // attribute for any function-literal token that chart-init.js would
      // reject as defense-in-depth.
      const cfgMatch = section.html.match(/data-chart-config="([^"]+)"/);
      expect(cfgMatch).not.toBeNull();
      expect(cfgMatch![1]).not.toMatch(/\bfunction\s*\(/);
    });
  });
});
