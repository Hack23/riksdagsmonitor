/**
 * Unit Tests for TemplateSection extensibility in the article template.
 *
 * Validates that the `sections` array added to ArticleData is rendered
 * correctly and that the template remains backward-compatible when
 * `sections` is omitted.
 */

import { describe, it, expect } from 'vitest';
import { generateArticleHTML } from '../../scripts/article-template.js';
import type { ArticleData, ArticleCategory, TemplateSection } from '../../scripts/types/article.js';

// ---------------------------------------------------------------------------
// Shared minimal article data
// ---------------------------------------------------------------------------

const BASE_DATA: ArticleData = {
  slug: '2026-02-25-motions-en.html',
  title: 'Opposition Motions This Week',
  subtitle: 'Analysis of parliamentary motions revealing key fault lines',
  date: '2026-02-25',
  type: 'analysis' as ArticleCategory,
  readTime: '4 min read',
  lang: 'en',
  content: '<h2>Motion Analysis</h2><p>Several important motions were filed this week.</p>',
  sources: ['riksdag-regering-mcp'],
  keywords: ['motions', 'parliament'],
  tags: ['Motions'],
};

// ---------------------------------------------------------------------------
// Backward compatibility — no sections field
// ---------------------------------------------------------------------------

describe('generateArticleHTML — backward compatibility', () => {
  it('generates valid HTML without sections field', () => {
    const html = generateArticleHTML(BASE_DATA);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<h1>Opposition Motions This Week</h1>');
  });

  it('generates valid HTML with explicitly empty sections array', () => {
    const html = generateArticleHTML({ ...BASE_DATA, sections: [] });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<h1>Opposition Motions This Week</h1>');
  });
});

// ---------------------------------------------------------------------------
// Sections rendering
// ---------------------------------------------------------------------------

describe('generateArticleHTML — sections array', () => {
  it('renders a single section with id and html', () => {
    const sections: TemplateSection[] = [
      { id: 'risk-indicator', html: '<p>Risk level: Medium</p>' },
    ];
    const html = generateArticleHTML({ ...BASE_DATA, sections });
    expect(html).toContain('id="risk-indicator"');
    expect(html).toContain('<p>Risk level: Medium</p>');
  });

  it('renders multiple sections in order', () => {
    const sections: TemplateSection[] = [
      { id: 'section-a', html: '<p>Section A content</p>' },
      { id: 'section-b', html: '<p>Section B content</p>' },
      { id: 'section-c', html: '<p>Section C content</p>' },
    ];
    const html = generateArticleHTML({ ...BASE_DATA, sections });
    const posA = html.indexOf('id="section-a"');
    const posB = html.indexOf('id="section-b"');
    const posC = html.indexOf('id="section-c"');
    expect(posA).toBeGreaterThan(-1);
    expect(posB).toBeGreaterThan(posA);
    expect(posC).toBeGreaterThan(posB);
  });

  it('uses default className when none provided', () => {
    const sections: TemplateSection[] = [
      { id: 'default-class-section', html: '<p>Content</p>' },
    ];
    const html = generateArticleHTML({ ...BASE_DATA, sections });
    expect(html).toContain('class="article-section"');
  });

  it('uses custom className when provided', () => {
    const sections: TemplateSection[] = [
      { id: 'custom-class-section', html: '<p>Content</p>', className: 'risk-indicator-section' },
    ];
    const html = generateArticleHTML({ ...BASE_DATA, sections });
    expect(html).toContain('class="risk-indicator-section"');
  });

  it('renders trend chart section', () => {
    const sections: TemplateSection[] = [
      {
        id: 'trend-chart',
        html: '<div class="chart-container"><canvas id="trendChart"></canvas></div>',
        className: 'trend-chart-section',
      },
    ];
    const html = generateArticleHTML({ ...BASE_DATA, sections });
    expect(html).toContain('id="trend-chart"');
    expect(html).toContain('class="trend-chart-section"');
    expect(html).toContain('<canvas id="trendChart">');
  });

  it('renders pull quote section', () => {
    const sections: TemplateSection[] = [
      {
        id: 'pull-quote',
        html: '<blockquote class="pull-quote"><p>Democracy requires transparency.</p></blockquote>',
        className: 'pull-quote-section',
      },
    ];
    const html = generateArticleHTML({ ...BASE_DATA, sections });
    expect(html).toContain('id="pull-quote"');
    expect(html).toContain('Democracy requires transparency.');
  });

  it('sections appear after main content in document order', () => {
    const sections: TemplateSection[] = [
      { id: 'extra-section', html: '<p>Extra content</p>' },
    ];
    const html = generateArticleHTML({ ...BASE_DATA, sections });
    const contentPos = html.indexOf('Motion Analysis');
    const sectionPos = html.indexOf('id="extra-section"');
    expect(contentPos).toBeGreaterThan(-1);
    expect(sectionPos).toBeGreaterThan(contentPos);
  });
});
