/**
 * Unit Tests for Data Transformers
 * Tests data transformation functions
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  extractTopics,
  generateMetadata,
  calculateReadTime,
  generateSources,
  CONTENT_LABELS,
  L
} from '../scripts/data-transformers.js';

describe('Data Transformers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  const mockEvents = [
    {
      title: 'EU Committee Open Meeting',
      start: '2026-02-10T10:00:00',
      organ: 'UU',
      type: 'meeting'
    },
    {
      title: 'Chamber Debate - Budget',
      start: '2026-02-11T14:00:00',
      organ: 'Kammaren',
      type: 'debate'
    },
    {
      title: 'Finance Committee Meeting',
      start: '2026-02-12T09:00:00',
      organ: 'FiU',
      type: 'meeting'
    }
  ];

  describe('transformCalendarToEventGrid', () => {
    it('should transform events to grid structure for English', () => {
      const grid = transformCalendarToEventGrid(mockEvents, 'en');
      
      expect(grid).toBeInstanceOf(Array);
      expect(grid.length).toBeGreaterThan(0);
      
      const firstDay = grid[0];
      expect(firstDay).toHaveProperty('date');
      expect(firstDay).toHaveProperty('dayName');
      expect(firstDay).toHaveProperty('dayNumber');
      expect(firstDay).toHaveProperty('items');
      expect(firstDay.items).toBeInstanceOf(Array);
    });

    it('should transform events to grid structure for Swedish', () => {
      const grid = transformCalendarToEventGrid(mockEvents, 'sv');
      
      expect(grid).toBeInstanceOf(Array);
      expect(grid[0]).toHaveProperty('dayName');
      // Swedish day names (Intl may return lowercase — compare case-insensitively)
      const validSwedishDays = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
      expect(validSwedishDays).toContain(grid[0].dayName.toLowerCase());
    });

    it('should handle empty events array', () => {
      const grid = transformCalendarToEventGrid([], 'en');
      expect(grid).toBeInstanceOf(Array);
      expect(grid.length).toBe(0);
    });

    it('should handle null/undefined events', () => {
      expect(transformCalendarToEventGrid(null, 'en')).toEqual([]);
      expect(transformCalendarToEventGrid(undefined, 'en')).toEqual([]);
    });

    it('should support all 14 languages via Intl formatting', () => {
      const allLangs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
      allLangs.forEach(lang => {
        const grid = transformCalendarToEventGrid(mockEvents, lang);
        expect(grid).toBeInstanceOf(Array);
        expect(grid.length).toBeGreaterThan(0);
        // Day name should be a non-empty string for all languages
        expect(grid[0].dayName).toBeTruthy();
        expect(typeof grid[0].dayName).toBe('string');
        expect(grid[0].dayName.length).toBeGreaterThan(0);
      });
    });

    it('should handle events with different date field names', () => {
      const eventsWithDatum = [
        { titel: 'Event 1', datum: '2026-02-10T10:00:00' },
        { rubrik: 'Event 2', from: '2026-02-11T14:00:00' }
      ];
      const grid = transformCalendarToEventGrid(eventsWithDatum, 'en');
      expect(grid.length).toBe(2);
    });

    it('should group events by date', () => {
      const grid = transformCalendarToEventGrid(mockEvents, 'en');
      
      // Events on same day should be in same group
      const feb10Events = grid.find(day => day.date === '2026-02-10');
      expect(feb10Events).toBeDefined();
      expect(feb10Events.items.length).toBeGreaterThan(0);
    });
  });

  describe('generateArticleContent', () => {
    it('should generate HTML content for week-ahead article', () => {
      const content = generateArticleContent(
        { events: mockEvents, highlights: [] },
        'week-ahead',
        'en'
      );
      
      expect(content).toContain('<h2>');
      expect(content).toContain('<p>');
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(100);
    });

    it('should generate content in Swedish', () => {
      const content = generateArticleContent(
        { events: mockEvents, highlights: [] },
        'week-ahead',
        'sv'
      );
      
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(100);
    });

    it('should support different article types', () => {
      const types = ['week-ahead', 'committee-reports', 'propositions', 'motions'];
      
      types.forEach(type => {
        const content = generateArticleContent(
          { events: mockEvents },
          type,
          'en'
        );
        expect(typeof content).toBe('string');
      });
    });
  });

  describe('extractWatchPoints', () => {
    it('should extract watch points from events', () => {
      const watchPoints = extractWatchPoints({ events: mockEvents }, 'en');
      
      expect(watchPoints).toBeInstanceOf(Array);
      expect(watchPoints.length).toBeGreaterThan(0);
      
      if (watchPoints.length > 0) {
        expect(watchPoints[0]).toHaveProperty('title');
        expect(watchPoints[0]).toHaveProperty('description');
      }
    });

    it('should extract watch points in Swedish', () => {
      const watchPoints = extractWatchPoints({ events: mockEvents }, 'sv');
      
      expect(watchPoints).toBeInstanceOf(Array);
    });

    it('should handle empty data', () => {
      const watchPoints = extractWatchPoints({ events: [] }, 'en');
      expect(watchPoints).toBeInstanceOf(Array);
    });
  });

  describe('extractTopics', () => {
    it('should extract topics from events', () => {
      const topics = extractTopics(mockEvents);
      
      expect(topics).toBeInstanceOf(Array);
      expect(topics.every(t => typeof t === 'string')).toBe(true);
    });

    it('should return unique topics', () => {
      const topics = extractTopics(mockEvents);
      const uniqueTopics = [...new Set(topics)];
      expect(topics.length).toBe(uniqueTopics.length);
    });
  });

  describe('generateMetadata', () => {
    it('should generate metadata with keywords, topics, tags', () => {
      const metadata = generateMetadata(
        { events: mockEvents },
        'week-ahead',
        'en'
      );
      
      expect(metadata).toHaveProperty('keywords');
      expect(metadata).toHaveProperty('topics');
      expect(metadata).toHaveProperty('tags');
      
      expect(metadata.keywords).toBeInstanceOf(Array);
      expect(metadata.topics).toBeInstanceOf(Array);
      expect(metadata.tags).toBeInstanceOf(Array);
    });

    it('should generate Swedish metadata', () => {
      const metadata = generateMetadata(
        { events: mockEvents },
        'week-ahead',
        'sv'
      );
      
      expect(metadata).toHaveProperty('keywords');
      expect(metadata.keywords).toBeInstanceOf(Array);
    });
  });

  describe('calculateReadTime', () => {
    it('should calculate read time for short content', () => {
      const shortContent = '<p>Short text.</p>';
      const readTime = calculateReadTime(shortContent);
      
      expect(readTime).toContain('min read');
      expect(readTime).toMatch(/^\d+ min read$/);
    });

    it('should calculate read time for long content', () => {
      const longContent = '<p>' + 'word '.repeat(1000) + '</p>';
      const readTime = calculateReadTime(longContent);
      
      expect(readTime).toContain('min read');
      const minutes = parseInt(readTime);
      expect(minutes).toBeGreaterThan(1);
    });

    it('should handle empty content', () => {
      const readTime = calculateReadTime('');
      expect(readTime).toBe('1 min read');
    });

    it('should handle content with only HTML tags', () => {
      const readTime = calculateReadTime('<div><p></p></div>');
      expect(readTime).toContain('min read');
    });

    it('should never return less than 1 minute', () => {
      const readTime = calculateReadTime('<p>Hello</p>');
      const minutes = parseInt(readTime);
      expect(minutes).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateArticleContent edge cases', () => {
    it('should handle unknown article type gracefully', () => {
      const content = generateArticleContent({ events: [] }, 'unknown-type', 'en');
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should handle committee-reports with empty reports array', () => {
      const content = generateArticleContent({ reports: [] }, 'committee-reports', 'en');
      expect(content).toContain('No committee reports');
    });

    it('should handle propositions with data', () => {
      const content = generateArticleContent({ 
        propositions: [{ titel: 'Test Prop', url: '#', dokumentnamn: 'Prop 2025/26:1' }] 
      }, 'propositions', 'en');
      expect(content).toContain('Test Prop');
    });

    it('should handle motions with data', () => {
      const content = generateArticleContent({ 
        motions: [{ titel: 'Test Motion', parti: 'S', url: '#', dokumentnamn: 'Mot 2025/26:1', intressent_namn: 'Test Person' }] 
      }, 'motions', 'en');
      expect(content).toContain('Test Motion');
    });

    it('should include highlights section when highlights are provided', () => {
      const content = generateArticleContent(
        { 
          events: mockEvents, 
          highlights: [
            { title: 'Budget Vote', description: 'Critical budget debate expected' },
            { title: 'EU Summit', description: 'Key EU decisions ahead' }
          ] 
        },
        'week-ahead',
        'en'
      );
      expect(content).toContain('What to Watch');
      expect(content).toContain('Budget Vote');
      expect(content).toContain('Critical budget debate expected');
      expect(content).toContain('EU Summit');
    });

    it('should include Swedish highlights section', () => {
      const content = generateArticleContent(
        { 
          events: mockEvents, 
          highlights: [
            { title: 'Budgetomröstning', description: 'Viktig budgetdebatt förväntas' }
          ] 
        },
        'week-ahead',
        'sv'
      );
      expect(content).toContain('Vad man ska följa');
      expect(content).toContain('Budgetomröstning');
    });

    it('should handle events with no date field', () => {
      const content = generateArticleContent(
        { events: [{ title: 'No date event' }], highlights: [] },
        'week-ahead',
        'en'
      );
      expect(typeof content).toBe('string');
    });
  });

  describe('generateSources', () => {
    it('should generate sources list from MCP tools', () => {
      const tools = ['get_calendar_events', 'get_betankanden'];
      const sources = generateSources(tools);
      
      expect(sources).toBeInstanceOf(Array);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources).toContain('riksdag-regering-mcp');
    });

    it('should handle empty tools array', () => {
      const sources = generateSources([]);
      expect(sources).toBeInstanceOf(Array);
      expect(sources).toContain('riksdag-regering-mcp');
    });

    it('should include descriptive source names', () => {
      const tools = ['get_calendar_events'];
      const sources = generateSources(tools);
      
      expect(sources.some(s => s.includes('Calendar') || s.includes('Riksdagen'))).toBe(true);
    });

    it('should include sources for all MCP tool types', () => {
      const sources = generateSources([
        'get_calendar_events', 'get_betankanden', 'get_propositioner',
        'get_motioner', 'search_dokument'
      ]);
      
      expect(sources).toContain('riksdag-regering-mcp');
      expect(sources).toContain('Riksdagen Calendar');
      expect(sources).toContain('Committee Reports');
      expect(sources).toContain('Government Propositions');
      expect(sources).toContain('Parliamentary Motions');
      expect(sources).toContain('Riksdagen Documents');
    });
  });

  describe('Multi-language content labels (CONTENT_LABELS)', () => {
    const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    const REQUIRED_KEYS = [
      'whyMatters', 'whyMattersDefault', 'keyEvents', 'whatToWatch',
      'latestReports', 'noReports', 'committee', 'document',
      'reportDefault', 'govProps', 'noProps', 'propDefault',
      'oppMotions', 'noMotions', 'author', 'party', 'motionDefault',
      'genericContent', 'monitorDev', 'committeeDebates', 'committeeDebatesDesc',
      'govProposals', 'govProposalsDesc', 'weekAhead', 'committeeReportsTag',
      'govPropsTag', 'oppMotionsTag'
    ];

    it('should have labels for all 14 supported languages', () => {
      ALL_LANGUAGES.forEach(lang => {
        expect(CONTENT_LABELS).toHaveProperty(lang);
      });
    });

    it('should have all required keys in every language', () => {
      ALL_LANGUAGES.forEach(lang => {
        REQUIRED_KEYS.forEach(key => {
          expect(CONTENT_LABELS[lang]).toHaveProperty(key);
        });
      });
    });

    it('should have non-empty string values for static labels', () => {
      const staticKeys = REQUIRED_KEYS.filter(k => !k.endsWith('Desc'));
      ALL_LANGUAGES.forEach(lang => {
        staticKeys.forEach(key => {
          const val = CONTENT_LABELS[lang][key];
          expect(typeof val).toBe('string');
          expect(val.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have function values for Desc labels', () => {
      const descKeys = REQUIRED_KEYS.filter(k => k.endsWith('Desc'));
      ALL_LANGUAGES.forEach(lang => {
        descKeys.forEach(key => {
          expect(typeof CONTENT_LABELS[lang][key]).toBe('function');
          // Should return a string when called with a number
          expect(typeof CONTENT_LABELS[lang][key](5)).toBe('string');
        });
      });
    });

    it('L() helper should return correct label for known language', () => {
      expect(L('de', 'whyMatters')).toBe('Warum diese Woche wichtig ist');
      expect(L('fr', 'latestReports')).toBe('Derniers rapports de commission');
    });

    it('L() helper should fallback to English for unknown language', () => {
      expect(L('xx', 'whyMatters')).toBe('Why This Week Matters');
    });
  });

  describe('Multi-language article content generation', () => {
    const nonEnSvLanguages = ['da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

    it('should generate localized content for all 14 languages', () => {
      nonEnSvLanguages.forEach(lang => {
        const content = generateArticleContent(
          { events: mockEvents, highlights: [] },
          'week-ahead',
          lang
        );
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(50);
        // Should NOT contain Swedish-specific headings for non-sv languages
        if (lang !== 'sv') {
          expect(content).not.toContain('Varför denna vecka är viktig');
        }
      });
    });

    it('should generate localized committee content for German', () => {
      const content = generateArticleContent(
        { reports: [] },
        'committee-reports',
        'de'
      );
      expect(content).toContain('Neueste Ausschussberichte');
    });

    it('should generate localized propositions content for French', () => {
      const content = generateArticleContent(
        { propositions: [] },
        'propositions',
        'fr'
      );
      expect(content).toContain('Propositions gouvernementales');
    });

    it('should generate localized motions content for Japanese', () => {
      const content = generateArticleContent(
        { motions: [] },
        'motions',
        'ja'
      );
      expect(content).toContain('野党動議');
    });

    it('should generate localized metadata tags', () => {
      const metadata = generateMetadata(
        { events: mockEvents },
        'week-ahead',
        'de'
      );
      expect(metadata.tags).toContain('Woche Voraus');
    });
  });
});
