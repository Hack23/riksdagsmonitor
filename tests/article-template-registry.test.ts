/**
 * Unit Tests for Article Template Registry & Type System
 *
 * Verifies the per-type template registry, CSS class generation,
 * AI style directives, and the article-type CSS class injection
 * into the main template HTML output.
 */

import { describe, it, expect } from 'vitest';
import {
  getTemplate,
  getStyleClass,
  getAIDirectives,
  getLayout,
  listRegisteredTypes,
} from '../scripts/article-template/registry.js';
import { GLOBAL_STYLE_RUBRIC, ARTICLE_TYPE_NAMES } from '../scripts/article-template/types.js';
import { generateArticleHTML } from '../scripts/article-template.js';
import type { ArticleType } from '../scripts/types/article.js';
import type { ArticleData } from '../scripts/types/article.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_ARTICLE_TYPES: readonly ArticleType[] = [
  'week-ahead',
  'month-ahead',
  'weekly-review',
  'monthly-review',
  'committee-reports',
  'propositions',
  'motions',
  'interpellations',
  'breaking',
  'deep-inspection',
] as const;

function makeMockArticleData(articleTypeName: ArticleType | string): ArticleData {
  return {
    slug: `2026-03-13-${articleTypeName}-en.html`,
    title: `Test Article: ${articleTypeName}`,
    subtitle: 'Test subtitle for article type testing.',
    date: '2026-03-13',
    type: 'analysis' as ArticleData['type'],
    articleType: articleTypeName as ArticleType,
    readTime: '3 min read',
    lang: 'en',
    content: '<p>Test content paragraph.</p>',
    sources: ['Riksdagen'],
    keywords: ['parliament', 'test'],
    tags: ['Test'],
  };
}

// ---------------------------------------------------------------------------
// Registry tests
// ---------------------------------------------------------------------------

describe('Article Template Registry', () => {
  describe('listRegisteredTypes', () => {
    it('should return all 10 article types', () => {
      const types = listRegisteredTypes();
      expect(types).toHaveLength(10);
    });

    it('should include all expected article types', () => {
      const types = listRegisteredTypes();
      for (const expected of ALL_ARTICLE_TYPES) {
        expect(types).toContain(expected);
      }
    });
  });

  describe('getTemplate', () => {
    it('should return a template for every registered type', () => {
      for (const type of ALL_ARTICLE_TYPES) {
        const tpl = getTemplate(type);
        expect(tpl).toBeDefined();
        expect(tpl.type).toBe(type);
      }
    });

    it('should fall back to breaking template for unknown types', () => {
      const tpl = getTemplate('unknown-type-xyz');
      expect(tpl.type).toBe('breaking');
    });

    it('should fall back to breaking for prototype-pollution keys', () => {
      for (const key of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
        const tpl = getTemplate(key);
        expect(tpl.type).toBe('breaking');
        expect(tpl.styleClass).toBe('article-type-breaking');
      }
    });

    it('each template should have a non-empty description', () => {
      for (const type of ALL_ARTICLE_TYPES) {
        const tpl = getTemplate(type);
        expect(tpl.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getStyleClass', () => {
    it('should return a CSS class for each registered type', () => {
      for (const type of ALL_ARTICLE_TYPES) {
        const cls = getStyleClass(type);
        expect(cls).toMatch(/^article-type-/);
      }
    });

    it('should have correct class for key types', () => {
      expect(getStyleClass('propositions')).toBe('article-type-propositions');
      expect(getStyleClass('motions')).toBe('article-type-motions');
      expect(getStyleClass('interpellations')).toBe('article-type-interpellations');
      expect(getStyleClass('deep-inspection')).toBe('article-type-deep-inspection');
      expect(getStyleClass('breaking')).toBe('article-type-breaking');
      expect(getStyleClass('week-ahead')).toBe('article-type-week-ahead');
      expect(getStyleClass('committee-reports')).toBe('article-type-committee-reports');
    });

    it('each style class should be unique across all types', () => {
      const classes = ALL_ARTICLE_TYPES.map(t => getStyleClass(t));
      const unique = new Set(classes);
      expect(unique.size).toBe(ALL_ARTICLE_TYPES.length);
    });
  });

  describe('getLayout', () => {
    it('should return a layout object for every type', () => {
      for (const type of ALL_ARTICLE_TYPES) {
        const layout = getLayout(type);
        expect(layout).toBeDefined();
        expect([1, 2, 3]).toContain(layout.columns);
        expect(typeof layout.sidebar).toBe('boolean');
        expect(typeof layout.heroSection).toBe('boolean');
        expect(['full', 'compact']).toContain(layout.breadcrumbStyle);
      }
    });

    it('breaking news should have compact breadcrumb and no hero', () => {
      const layout = getLayout('breaking');
      expect(layout.heroSection).toBe(false);
      expect(layout.breadcrumbStyle).toBe('compact');
    });

    it('deep-inspection should have full breadcrumb and hero', () => {
      const layout = getLayout('deep-inspection');
      expect(layout.heroSection).toBe(true);
      expect(layout.breadcrumbStyle).toBe('full');
    });
  });

  describe('getAIDirectives', () => {
    it('should return at least one directive for each type', () => {
      for (const type of ALL_ARTICLE_TYPES) {
        const directives = getAIDirectives(type);
        expect(Object.keys(directives).length).toBeGreaterThan(0);
      }
    });

    it('every type should have a lede directive', () => {
      for (const type of ALL_ARTICLE_TYPES) {
        const directives = getAIDirectives(type);
        expect(directives['lede']).toBeDefined();
      }
    });

    it('lede maxWords should be between 40 and 100 for all types', () => {
      for (const type of ALL_ARTICLE_TYPES) {
        const lede = getAIDirectives(type)['lede'];
        expect(lede?.maxWords).toBeGreaterThanOrEqual(40);
        expect(lede?.maxWords).toBeLessThanOrEqual(100);
      }
    });

    it('every directive should have a valid tone', () => {
      const validTones = ['analytical', 'urgent', 'reflective', 'informational', 'investigative'];
      for (const type of ALL_ARTICLE_TYPES) {
        for (const [, directive] of Object.entries(getAIDirectives(type))) {
          expect(validTones).toContain(directive.tone);
        }
      }
    });

    it('every directive should have a non-empty rubric array', () => {
      for (const type of ALL_ARTICLE_TYPES) {
        for (const [, directive] of Object.entries(getAIDirectives(type))) {
          expect(Array.isArray(directive.rubric)).toBe(true);
          expect(directive.rubric.length).toBeGreaterThan(0);
        }
      }
    });

    it('breaking news lede directive should have urgent tone', () => {
      const lede = getAIDirectives('breaking')['lede'];
      expect(lede?.tone).toBe('urgent');
    });

    it('interpellations should have minister-response directive', () => {
      const directives = getAIDirectives('interpellations');
      expect(directives['minister-response']).toBeDefined();
      expect(directives['minister-response']?.tone).toBe('investigative');
    });

    it('deep-inspection should have swot and mindmap directives', () => {
      const directives = getAIDirectives('deep-inspection');
      expect(directives['swot']).toBeDefined();
      expect(directives['mindmap']).toBeDefined();
    });

    it('propositions should have impact-assessment directive', () => {
      const directives = getAIDirectives('propositions');
      expect(directives['impact-assessment']).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// GLOBAL_STYLE_RUBRIC tests
// ---------------------------------------------------------------------------

describe('GLOBAL_STYLE_RUBRIC', () => {
  it('should have at least 5 rules', () => {
    expect(GLOBAL_STYLE_RUBRIC.length).toBeGreaterThanOrEqual(5);
  });

  it('each rule should be a non-empty string', () => {
    for (const rule of GLOBAL_STYLE_RUBRIC) {
      expect(typeof rule).toBe('string');
      expect(rule.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// ARTICLE_TYPE_NAMES tests
// ---------------------------------------------------------------------------

describe('ARTICLE_TYPE_NAMES', () => {
  it('should have entries for all 10 article types', () => {
    for (const type of ALL_ARTICLE_TYPES) {
      expect(ARTICLE_TYPE_NAMES[type]).toBeDefined();
    }
  });

  it('should have English and Swedish translations for all types', () => {
    for (const type of ALL_ARTICLE_TYPES) {
      expect(ARTICLE_TYPE_NAMES[type]['en'].length).toBeGreaterThan(0);
      expect(ARTICLE_TYPE_NAMES[type]['sv'].length).toBeGreaterThan(0);
    }
  });

  it('should have translations for all 14 languages for all types', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;
    for (const type of ALL_ARTICLE_TYPES) {
      for (const lang of langs) {
        const name = ARTICLE_TYPE_NAMES[type][lang];
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// HTML template integration tests
// ---------------------------------------------------------------------------

describe('generateArticleHTML article-type class injection', () => {
  it('should include article-type CSS class in article element for week-ahead', () => {
    const html = generateArticleHTML(makeMockArticleData('week-ahead') as ArticleData);
    expect(html).toContain('class="news-article article-type-week-ahead"');
  });

  it('should include article-type CSS class for propositions', () => {
    const html = generateArticleHTML(makeMockArticleData('propositions') as ArticleData);
    expect(html).toContain('class="news-article article-type-propositions"');
  });

  it('should include article-type CSS class for motions', () => {
    const html = generateArticleHTML(makeMockArticleData('motions') as ArticleData);
    expect(html).toContain('class="news-article article-type-motions"');
  });

  it('should include article-type CSS class for interpellations', () => {
    const html = generateArticleHTML(makeMockArticleData('interpellations') as ArticleData);
    expect(html).toContain('class="news-article article-type-interpellations"');
  });

  it('should include article-type CSS class for breaking', () => {
    const html = generateArticleHTML(makeMockArticleData('breaking') as ArticleData);
    expect(html).toContain('class="news-article article-type-breaking"');
  });

  it('should include article-type CSS class for deep-inspection', () => {
    const html = generateArticleHTML(makeMockArticleData('deep-inspection') as ArticleData);
    expect(html).toContain('class="news-article article-type-deep-inspection"');
  });

  it('should include article-type CSS class for committee-reports', () => {
    const html = generateArticleHTML(makeMockArticleData('committee-reports') as ArticleData);
    expect(html).toContain('class="news-article article-type-committee-reports"');
  });

  it('should NOT have a separate article-types.css link (loaded via @import)', () => {
    const html = generateArticleHTML(makeMockArticleData('propositions') as ArticleData);
    expect(html).not.toContain('<link rel="stylesheet" href="../styles/themes/article-types.css">');
  });

  it('should still include the main styles.css link', () => {
    const html = generateArticleHTML(makeMockArticleData('motions') as ArticleData);
    expect(html).toContain('href="../styles.css"');
  });

  it('should generate valid HTML structure with type class', () => {
    const html = generateArticleHTML(makeMockArticleData('weekly-review') as ArticleData);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('class="news-article article-type-weekly-review"');
    expect(html).toContain('</html>');
  });

  it('should fall back gracefully for unknown article type string', () => {
    const data = { ...makeMockArticleData('breaking'), type: 'analysis' as ArticleData['type'] };
    const html = generateArticleHTML(data as ArticleData);
    // Should still produce valid HTML
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('class="news-article');
  });

  it('should use base news-article class when articleType is omitted', () => {
    const data: ArticleData = {
      slug: '2026-03-13-analysis-en.html',
      title: 'Test Without articleType',
      subtitle: 'Testing omitted articleType field.',
      date: '2026-03-13',
      type: 'analysis' as ArticleData['type'],
      // articleType intentionally omitted
      lang: 'en',
      content: '<p>Test content.</p>',
      sources: ['Riksdagen'],
      keywords: ['test'],
      tags: [],
    };
    const html = generateArticleHTML(data);
    // Should have base class only, NOT article-type-breaking or any other per-type class
    expect(html).toContain('class="news-article"');
    expect(html).not.toContain('article-type-breaking');
    expect(html).not.toMatch(/article-type-/);
  });

  it('should render the type label with type-badge class', () => {
    const html = generateArticleHTML(makeMockArticleData('propositions') as ArticleData);
    expect(html).toContain('class="type-badge"');
  });
});
