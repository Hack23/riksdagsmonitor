/**
 * Tests for generateStakeholderSwotSection — multi-stakeholder SWOT analysis.
 * Validates HTML structure, multiple stakeholder cards, impact badges, XSS
 * escaping, strategic context, and TemplateSection shape.
 */

import { describe, it, expect } from 'vitest';
import { generateStakeholderSwotSection } from '../scripts/data-transformers/content-generators/stakeholder-swot-section.js';
import type { StakeholderSwot } from '../scripts/data-transformers/content-generators/stakeholder-swot-section.js';
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

/** Two stakeholders for multi-perspective tests */
function makeStakeholders(): StakeholderSwot[] {
  return [
    {
      name: 'Government Coalition',
      role: 'Tidö Agreement parties (M, KD, L + SD)',
      swot: makeSwot({
        strengths: [{ text: 'Parliamentary majority', impact: 'high' }],
        weaknesses: [{ text: 'Policy disagreements', impact: 'medium' }],
      }),
    },
    {
      name: 'Opposition',
      role: 'S, V, C, MP',
      swot: makeSwot({
        strengths: [{ text: 'Strong polling', impact: 'high' }],
        weaknesses: [{ text: 'Coalition uncertainty', impact: 'medium' }],
      }),
    },
  ];
}

describe('generateStakeholderSwotSection', () => {
  it('returns a TemplateSection with correct id and className', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.id).toBe('stakeholder-swot-analysis');
    expect(section.className).toBe('stakeholder-swot-analysis-section');
    expect(typeof section.html).toBe('string');
    expect(section.html.length).toBeGreaterThan(0);
  });

  it('renders a <section> with the stakeholder-swot-analysis class', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.html).toContain('<section class="stakeholder-swot-analysis"');
    expect(section.html).toContain('</section>');
  });

  it('renders the default English title', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.html).toContain('Multi-Stakeholder SWOT Analysis');
  });

  it('renders a custom title when provided', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
      title: 'Budget Impact Analysis',
    });
    expect(section.html).toContain('Budget Impact Analysis');
  });

  it('renders Swedish title', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'sv',
    });
    expect(section.html).toContain('Intressentanalys (SWOT)');
  });

  it('renders all stakeholder names', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.html).toContain('Government Coalition');
    expect(section.html).toContain('Opposition');
  });

  it('renders stakeholder roles', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.html).toContain('Tidö Agreement parties');
    expect(section.html).toContain('S, V, C, MP');
  });

  it('renders SWOT quadrant CSS classes for each stakeholder', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.html).toContain('swot-strengths');
    expect(section.html).toContain('swot-weaknesses');
    expect(section.html).toContain('swot-opportunities');
    expect(section.html).toContain('swot-threats');
  });

  it('renders stakeholder-specific SWOT entries', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.html).toContain('Parliamentary majority');
    expect(section.html).toContain('Policy disagreements');
    expect(section.html).toContain('Strong polling');
    expect(section.html).toContain('Coalition uncertainty');
  });

  it('renders impact badges with CSS classes', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.html).toContain('swot-impact--high');
    expect(section.html).toContain('swot-impact--medium');
    expect(section.html).toContain('swot-impact--low');
  });

  it('renders strategic context when provided', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
      strategicContext: 'Ahead of the 2026 election, coalition dynamics are shifting.',
    });
    expect(section.html).toContain('Strategic Context');
    expect(section.html).toContain('Ahead of the 2026 election');
  });

  it('escapes HTML in stakeholder names to prevent XSS', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: [{
        name: '<script>alert("xss")</script>',
        swot: makeSwot(),
      }],
      lang: 'en',
    });
    expect(section.html).not.toContain('<script>');
    expect(section.html).toContain('&lt;script&gt;');
  });

  it('escapes HTML in strategic context to prevent XSS', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
      strategicContext: '<img onerror="alert(1)">',
    });
    // The onerror attribute value must be escaped so browsers don't execute it
    expect(section.html).not.toContain('<img');
    expect(section.html).toContain('&lt;img');
    expect(section.html).toContain('&quot;');
  });

  it('renders stakeholder-swot-card for each stakeholder', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    const cardCount = (section.html.match(/stakeholder-swot-card/g) ?? []).length;
    expect(cardCount).toBeGreaterThanOrEqual(2);
  });

  it('supports all 14 languages without crashing', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    for (const lang of langs) {
      const section = generateStakeholderSwotSection({
        stakeholders: makeStakeholders(),
        lang,
      });
      expect(section.html).toContain('<section');
      expect(section.html).toContain('</section>');
    }
  });

  it('renders aria-label for accessibility', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: makeStakeholders(),
      lang: 'en',
    });
    expect(section.html).toContain('aria-label=');
  });

  it('handles a single stakeholder without errors', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: [makeStakeholders()[0]],
      lang: 'en',
    });
    expect(section.html).toContain('Government Coalition');
    expect(section.html).not.toContain('Opposition');
  });

  it('renders SWOT context per stakeholder when provided', () => {
    const section = generateStakeholderSwotSection({
      stakeholders: [{
        name: 'Test Party',
        swot: makeSwot({ context: 'Recent polling shows movement.' }),
      }],
      lang: 'en',
    });
    expect(section.html).toContain('Recent polling shows movement.');
  });
});
