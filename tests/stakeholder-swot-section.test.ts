/**
 * Tests for generateStakeholderSwotSection — multi-stakeholder SWOT analysis.
 * Validates HTML structure, multiple stakeholder cards, impact badges, XSS
 * escaping, strategic context, TemplateSection shape, trend indicators,
 * justification sections, and enhanced AI entry rendering.
 */

import { describe, it, expect } from 'vitest';
import { generateStakeholderSwotSection } from '../scripts/data-transformers/content-generators/stakeholder-swot-section.js';
import type { StakeholderSwot } from '../scripts/data-transformers/content-generators/stakeholder-swot-section.js';
import type { SwotData, SwotEntry } from '../scripts/types/article.js';

/** Extended entry shape matching AISwotEntry (without importing the ai-swot-analyzer module) */
interface EnhancedEntry extends SwotEntry {
  justification?: string;
  trendDirection?: 'improving' | 'stable' | 'deteriorating';
  quantitativeEvidence?: string;
}

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

  // ---------------------------------------------------------------------------
  // Enhanced AI entry rendering — trend indicators, justification, evidence
  // ---------------------------------------------------------------------------

  describe('trend indicator rendering', () => {
    it('renders ↑ symbol for improving trend', () => {
      const entry: EnhancedEntry = {
        text: 'Policy momentum',
        impact: 'high',
        trendDirection: 'improving',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).toContain('↑');
      expect(section.html).toContain('swot-trend--improving');
    });

    it('renders → symbol for stable trend', () => {
      const entry: EnhancedEntry = {
        text: 'Stable situation',
        impact: 'medium',
        trendDirection: 'stable',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).toContain('→');
      expect(section.html).toContain('swot-trend--stable');
    });

    it('renders ↓ symbol for deteriorating trend', () => {
      const entry: EnhancedEntry = {
        text: 'Declining support',
        impact: 'low',
        trendDirection: 'deteriorating',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ weaknesses: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).toContain('↓');
      expect(section.html).toContain('swot-trend--deteriorating');
    });

    it('renders trend aria-label for accessibility', () => {
      const entry: EnhancedEntry = {
        text: 'Test',
        impact: 'high',
        trendDirection: 'improving',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).toContain('aria-label="Improving"');
    });

    it('renders localised trend aria-label for Swedish', () => {
      const entry: EnhancedEntry = {
        text: 'Test',
        impact: 'high',
        trendDirection: 'improving',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'sv',
      });
      expect(section.html).toContain('aria-label="Förbättras"');
    });

    it('does not render trend indicator when trendDirection is absent', () => {
      const entry: SwotEntry = { text: 'No trend', impact: 'medium' };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).not.toContain('swot-trend');
    });
  });

  describe('justification section rendering', () => {
    it('renders expandable justification in a <details> element', () => {
      const entry: EnhancedEntry = {
        text: 'Key policy',
        impact: 'high',
        justification: 'This policy is significant because it restructures the welfare system.',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).toContain('<details class="swot-justification">');
      expect(section.html).toContain('This policy is significant because it restructures the welfare system.');
    });

    it('renders justification as a <p> inside <details>', () => {
      const entry: EnhancedEntry = {
        text: 'Key policy',
        impact: 'high',
        justification: 'Detailed analysis here.',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).toContain('<p>Detailed analysis here.</p>');
    });

    it('escapes XSS in justification', () => {
      const entry: EnhancedEntry = {
        text: 'Safe text',
        impact: 'medium',
        justification: '<script>alert("xss")</script>',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).not.toContain('<script>alert');
      expect(section.html).toContain('&lt;script&gt;');
    });

    it('does not render justification block when justification is absent', () => {
      const entry: SwotEntry = { text: 'Simple entry', impact: 'medium' };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).not.toContain('<details class="swot-justification">');
    });
  });

  describe('quantitative evidence rendering', () => {
    it('renders quantitative evidence in a swot-evidence span', () => {
      const entry: EnhancedEntry = {
        text: 'Strong majority',
        impact: 'high',
        quantitativeEvidence: '73% majority vote',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).toContain('class="swot-evidence"');
      expect(section.html).toContain('73% majority vote');
    });

    it('escapes XSS in quantitative evidence', () => {
      const entry: EnhancedEntry = {
        text: 'Data point',
        impact: 'medium',
        quantitativeEvidence: '<script>bad()</script>',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).not.toContain('<script>bad');
      expect(section.html).toContain('&lt;script&gt;');
    });

    it('does not render evidence span when quantitativeEvidence is absent', () => {
      const entry: SwotEntry = { text: 'No evidence', impact: 'low' };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).not.toContain('swot-evidence');
    });
  });

  describe('combined AI entry fields', () => {
    it('renders all enhanced fields together without error', () => {
      const entry: EnhancedEntry = {
        text: 'Comprehensive policy',
        impact: 'high',
        trendDirection: 'improving',
        justification: 'Justified by recent propositions',
        quantitativeEvidence: 'SEK 2.1 bn committed',
      };
      const section = generateStakeholderSwotSection({
        stakeholders: [{ name: 'Gov', swot: makeSwot({ strengths: [entry] }) }],
        lang: 'en',
      });
      expect(section.html).toContain('Comprehensive policy');
      expect(section.html).toContain('↑');
      expect(section.html).toContain('Justified by recent propositions');
      expect(section.html).toContain('SEK 2.1 bn committed');
      expect(section.html).toContain('swot-impact--high');
    });
  });
});
