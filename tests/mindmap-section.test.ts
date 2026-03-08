/**
 * Tests for generateMindmapSection — color-coded CSS mindmap generator.
 * Validates HTML structure, branch rendering, color attributes, XSS escaping,
 * accessibility, RTL support, and TemplateSection shape.
 */

import { describe, it, expect } from 'vitest';
import { generateMindmapSection } from '../scripts/data-transformers/content-generators/mindmap-section.js';
import type { MindmapBranch } from '../scripts/data-transformers/content-generators/mindmap-section.js';

/** Build a minimal set of branches for testing */
function makeBranches(): MindmapBranch[] {
  return [
    {
      label: 'Key Actors',
      color: 'cyan',
      icon: '👥',
      items: ['Ministry of Defence', 'NCSC', 'Riksdag Defence Committee'],
    },
    {
      label: 'Legislative Risks',
      color: 'magenta',
      items: ['Insufficient budget', 'Fragmented mandates'],
    },
    {
      label: 'EU Context',
      color: 'blue',
    },
  ];
}

describe('generateMindmapSection', () => {
  it('returns a TemplateSection with correct id and className', () => {
    const section = generateMindmapSection({
      topic: 'Cybersecurity Policy',
      branches: makeBranches(),
      lang: 'en',
    });
    expect(section.id).toBe('mindmap-section');
    expect(section.className).toBe('mindmap-section-wrapper');
    expect(typeof section.html).toBe('string');
  });

  it('renders the central topic in .mindmap-center', () => {
    const section = generateMindmapSection({
      topic: 'Climate Policy',
      branches: makeBranches(),
      lang: 'en',
    });
    expect(section.html).toContain('class="mindmap-center"');
    expect(section.html).toContain('Climate Policy');
  });

  it('renders all branches with branch labels', () => {
    const branches = makeBranches();
    const section = generateMindmapSection({ topic: 'Test', branches, lang: 'en' });
    branches.forEach(b => {
      expect(section.html).toContain(b.label);
    });
  });

  it('injects CSS custom properties for branch colors', () => {
    const section = generateMindmapSection({
      topic: 'Test',
      branches: [{ label: 'Branch A', color: 'cyan' }],
      lang: 'en',
    });
    expect(section.html).toContain('--branch-border:#00d9ff');
    expect(section.html).toContain('--branch-text:#00d9ff');
  });

  it('uses magenta color properties for magenta branches', () => {
    const section = generateMindmapSection({
      topic: 'Test',
      branches: [{ label: 'Risk Branch', color: 'magenta' }],
      lang: 'en',
    });
    expect(section.html).toContain('--branch-border:#ff006e');
  });

  it('renders leaf items in <ul> when items are provided', () => {
    const section = generateMindmapSection({
      topic: 'Test',
      branches: [{ label: 'Branch', color: 'green', items: ['Item A', 'Item B'] }],
      lang: 'en',
    });
    expect(section.html).toContain('<ul class="mindmap-leaf-list"');
    expect(section.html).toContain('Item A');
    expect(section.html).toContain('Item B');
  });

  it('does not render leaf list when items is empty or absent', () => {
    const s1 = generateMindmapSection({
      topic: 'Test',
      branches: [{ label: 'No items', color: 'yellow' }],
      lang: 'en',
    });
    const s2 = generateMindmapSection({
      topic: 'Test',
      branches: [{ label: 'Empty items', color: 'yellow', items: [] }],
      lang: 'en',
    });
    expect(s1.html).not.toContain('mindmap-leaf-list');
    expect(s2.html).not.toContain('mindmap-leaf-list');
  });

  it('renders icon prefix when provided', () => {
    const section = generateMindmapSection({
      topic: 'Test',
      branches: [{ label: 'Actors', color: 'cyan', icon: '👥' }],
      lang: 'en',
    });
    expect(section.html).toContain('👥');
  });

  it('renders summary when provided', () => {
    const section = generateMindmapSection({
      topic: 'Test',
      branches: makeBranches(),
      lang: 'en',
      summary: 'A conceptual overview of the policy landscape.',
    });
    expect(section.html).toContain('A conceptual overview of the policy landscape.');
    expect(section.html).toContain('class="mindmap-summary"');
  });

  it('uses custom title when provided', () => {
    const section = generateMindmapSection({
      topic: 'Test',
      branches: makeBranches(),
      lang: 'en',
      title: 'My Custom Mindmap Title',
    });
    expect(section.html).toContain('My Custom Mindmap Title');
  });

  it('falls back to language default titles for all 14 languages', () => {
    const langs = ['en','sv','da','no','fi','de','fr','es','nl','ar','he','ja','ko','zh'] as const;
    for (const lang of langs) {
      const section = generateMindmapSection({ topic: 'T', branches: makeBranches(), lang });
      expect(section.html).toContain('<h2>');
      // Must produce a non-empty title
      expect(section.html).not.toContain('<h2></h2>');
    }
  });

  it('escapes XSS in topic', () => {
    const section = generateMindmapSection({
      topic: '<script>alert(1)</script>',
      branches: [],
      lang: 'en',
    });
    expect(section.html).not.toContain('<script>');
    expect(section.html).toContain('&lt;script&gt;');
  });

  it('escapes XSS in branch label', () => {
    const section = generateMindmapSection({
      topic: 'T',
      branches: [{ label: '<img src=x onerror=alert(1)>', color: 'red' }],
      lang: 'en',
    });
    expect(section.html).not.toContain('<img');
    expect(section.html).toContain('&lt;img');
  });

  it('escapes XSS in leaf items', () => {
    const section = generateMindmapSection({
      topic: 'T',
      branches: [{ label: 'B', color: 'green', items: ['<b>bold</b>'] }],
      lang: 'en',
    });
    expect(section.html).not.toContain('<b>');
    expect(section.html).toContain('&lt;b&gt;');
  });

  it('escapes XSS in summary', () => {
    const section = generateMindmapSection({
      topic: 'T',
      branches: [],
      lang: 'en',
      summary: '<script>xss</script>',
    });
    expect(section.html).not.toContain('<script>');
  });

  it('includes aria-label for accessibility', () => {
    const section = generateMindmapSection({
      topic: 'Test',
      branches: makeBranches(),
      lang: 'en',
    });
    expect(section.html).toContain('aria-label=');
    expect(section.html).toContain('role="list"');
    expect(section.html).toContain('role="listitem"');
  });

  it('includes data-branch-count attribute', () => {
    const branches = makeBranches(); // 3 branches
    const section = generateMindmapSection({ topic: 'T', branches, lang: 'en' });
    expect(section.html).toContain('data-branch-count="3"');
  });

  it('handles empty branches array gracefully', () => {
    const section = generateMindmapSection({ topic: 'Empty', branches: [], lang: 'en' });
    expect(section.html).toContain('mindmap-container');
    expect(section.html).toContain('mindmap-center');
  });

  it('renders Swedish title correctly', () => {
    const section = generateMindmapSection({ topic: 'Klimatpolitik', branches: [], lang: 'sv' });
    expect(section.html).toContain('Policykarta');
  });

  it('renders Arabic with correct section title', () => {
    const section = generateMindmapSection({ topic: 'السياسة', branches: [], lang: 'ar' });
    expect(section.html).toContain('خريطة السياسات');
  });

  it('escapes XSS in section title override', () => {
    const section = generateMindmapSection({
      topic: 'T',
      branches: [],
      lang: 'en',
      title: '<script>evil</script>',
    });
    expect(section.html).not.toContain('<script>');
    expect(section.html).toContain('&lt;script&gt;');
  });

  it('renders all 8 color types without error', () => {
    const colors = ['cyan','magenta','yellow','green','purple','orange','blue','red'] as const;
    for (const color of colors) {
      expect(() =>
        generateMindmapSection({ topic: 'T', branches: [{ label: 'B', color }], lang: 'en' })
      ).not.toThrow();
    }
  });
});
