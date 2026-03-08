/**
 * Tests for generateSankeySection — inline SVG Sankey flow chart generator.
 * Validates SVG structure, node rendering, flow paths, color attributes,
 * XSS escaping, accessibility fallback table, and TemplateSection shape.
 */

import { describe, it, expect } from 'vitest';
import { generateSankeySection } from '../scripts/data-transformers/content-generators/sankey-section.js';
import type { SankeyNode, SankeyFlow } from '../scripts/data-transformers/content-generators/sankey-section.js';

/** Minimal nodes for a parliamentary flow */
function makeNodes(): SankeyNode[] {
  return [
    { id: 'gov', label: 'Government', color: 'cyan' },
    { id: 'opp', label: 'Opposition', color: 'magenta' },
    { id: 'prop', label: 'Propositions', color: 'orange' },
    { id: 'mot', label: 'Motions', color: 'yellow' },
    { id: 'passed', label: 'Passed', color: 'green' },
    { id: 'rejected', label: 'Rejected', color: 'red' },
  ];
}

/** Flows corresponding to the nodes above */
function makeFlows(): SankeyFlow[] {
  return [
    { source: 'gov',  target: 'prop',     value: 12, label: '2024 props' },
    { source: 'opp',  target: 'mot',      value: 35, label: '2024 mots' },
    { source: 'prop', target: 'passed',   value: 10 },
    { source: 'prop', target: 'rejected', value: 2 },
    { source: 'mot',  target: 'passed',   value: 5 },
    { source: 'mot',  target: 'rejected', value: 30 },
  ];
}

describe('generateSankeySection', () => {
  it('returns a TemplateSection with correct id and className', () => {
    const section = generateSankeySection({
      nodes: makeNodes(),
      flows: makeFlows(),
      lang: 'en',
    });
    expect(section.id).toBe('sankey-section');
    expect(section.className).toBe('sankey-section-wrapper');
    expect(typeof section.html).toBe('string');
  });

  it('embeds an SVG element', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('<svg');
    expect(section.html).toContain('</svg>');
  });

  it('includes viewBox attribute on SVG', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('viewBox="0 0 600');
  });

  it('renders SVG title element for accessibility', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('<title>');
  });

  it('has role="img" on SVG for screen readers', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('role="img"');
  });

  it('renders node labels as SVG text elements', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('Government');
    expect(section.html).toContain('Opposition');
    expect(section.html).toContain('Propositions');
  });

  it('renders flow paths as SVG path elements', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    // Each flow becomes a cubic bezier path
    expect(section.html).toContain('<path d="M');
  });

  it('includes a background rectangle', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('fill="#0a0e27"');
  });

  it('uses default section title in English', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('Policy Flow (Sankey)');
  });

  it('uses Swedish title for lang=sv', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'sv' });
    expect(section.html).toContain('Politikflöde (Sankey)');
  });

  it('uses custom title when provided', () => {
    const section = generateSankeySection({
      nodes: makeNodes(), flows: makeFlows(), lang: 'en',
      title: 'My Custom Sankey Title',
    });
    expect(section.html).toContain('My Custom Sankey Title');
  });

  it('renders summary when provided', () => {
    const section = generateSankeySection({
      nodes: makeNodes(), flows: makeFlows(), lang: 'en',
      summary: 'Legislative flow summary for 2024.',
    });
    expect(section.html).toContain('Legislative flow summary for 2024.');
    expect(section.html).toContain('class="sankey-summary"');
  });

  it('includes accessible fallback table with sr-only class', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('<table');
    expect(section.html).toContain('sr-only');
    expect(section.html).toContain('<caption>Flow data</caption>');
  });

  it('includes flow labels as mid-path SVG text elements', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('2024 props');
    expect(section.html).toContain('2024 mots');
  });

  it('uses custom svgHeight when provided', () => {
    const section = generateSankeySection({
      nodes: makeNodes(), flows: makeFlows(), lang: 'en', svgHeight: 500,
    });
    expect(section.html).toContain('viewBox="0 0 600 500"');
  });

  it('uses default height 340 when svgHeight is omitted', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('viewBox="0 0 600 340"');
  });

  it('escapes XSS in node labels', () => {
    const nodes: SankeyNode[] = [
      { id: 'src', label: '<script>alert(1)</script>', color: 'cyan' },
      { id: 'tgt', label: 'Target', color: 'green' },
    ];
    const section = generateSankeySection({
      nodes, flows: [{ source: 'src', target: 'tgt', value: 1 }], lang: 'en',
    });
    expect(section.html).not.toContain('<script>');
    expect(section.html).toContain('&lt;script&gt;');
  });

  it('escapes XSS in flow labels', () => {
    const section = generateSankeySection({
      nodes: makeNodes(),
      flows: [{ source: 'gov', target: 'prop', value: 5, label: '<b>evil</b>' }],
      lang: 'en',
    });
    expect(section.html).not.toContain('<b>');
    expect(section.html).toContain('&lt;b&gt;');
  });

  it('escapes XSS in section title', () => {
    const section = generateSankeySection({
      nodes: makeNodes(), flows: makeFlows(), lang: 'en',
      title: '<script>xss</script>',
    });
    expect(section.html).not.toContain('<script>');
  });

  it('escapes XSS in summary', () => {
    const section = generateSankeySection({
      nodes: makeNodes(), flows: makeFlows(), lang: 'en',
      summary: '<img src=x onerror=xss>',
    });
    expect(section.html).not.toContain('<img');
  });

  it('handles empty flows array gracefully', () => {
    expect(() =>
      generateSankeySection({ nodes: makeNodes(), flows: [], lang: 'en' })
    ).not.toThrow();
  });

  it('handles empty nodes array gracefully', () => {
    expect(() =>
      generateSankeySection({ nodes: [], flows: [], lang: 'en' })
    ).not.toThrow();
  });

  it('ignores flows referencing unknown node ids (no crash)', () => {
    const section = generateSankeySection({
      nodes: [{ id: 'a', label: 'A', color: 'cyan' }, { id: 'b', label: 'B', color: 'green' }],
      flows: [
        { source: 'a', target: 'b', value: 3 },
        { source: 'unknown', target: 'b', value: 1 }, // unknown source
      ],
      lang: 'en',
    });
    expect(section.html).toContain('<svg');
  });

  it('renders all 14 language titles without error', () => {
    const langs = ['en','sv','da','no','fi','de','fr','es','nl','ar','he','ja','ko','zh'] as const;
    for (const lang of langs) {
      expect(() =>
        generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang })
      ).not.toThrow();
    }
  });

  it('renders all 8 node color types without error', () => {
    const colors = ['cyan','magenta','yellow','green','purple','orange','blue','red'] as const;
    const nodes = colors.map((c, i) => ({ id: `n${i}`, label: `Node ${c}`, color: c } as SankeyNode));
    const flows: SankeyFlow[] = nodes.slice(0, -1).map((n, i) => ({
      source: n.id, target: nodes[i + 1]?.id ?? nodes[0]!.id, value: i + 1,
    }));
    expect(() =>
      generateSankeySection({ nodes, flows, lang: 'en' })
    ).not.toThrow();
  });

  it('renders node rectangles in SVG', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    // Each node should produce a <rect> element
    expect(section.html).toContain('<rect');
  });

  it('wraps SVG in a div.sankey-chart-wrapper', () => {
    const section = generateSankeySection({ nodes: makeNodes(), flows: makeFlows(), lang: 'en' });
    expect(section.html).toContain('class="sankey-chart-wrapper"');
  });
});
