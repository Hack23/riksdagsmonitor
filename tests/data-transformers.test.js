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

  describe('data-translate markers for Swedish API content', () => {
    it('should wrap Swedish titel in data-translate span for committee reports', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Bättre förutsättningar', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
      expect(content).toContain('Bättre förutsättningar');
    });

    it('should NOT wrap English title in data-translate span for committee reports', () => {
      const content = generateArticleContent(
        { reports: [{ title: 'Better conditions', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('Better conditions');
    });

    it('should wrap Swedish titel in data-translate span for propositions', () => {
      const content = generateArticleContent(
        { propositions: [{ titel: 'Ändringsbudget för 2026', url: '#' }] },
        'propositions',
        'en'
      );
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
      expect(content).toContain('Ändringsbudget för 2026');
    });

    it('should NOT wrap English title in data-translate span for propositions', () => {
      const content = generateArticleContent(
        { propositions: [{ title: 'Budget Amendment 2026', url: '#' }] },
        'propositions',
        'en'
      );
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('Budget Amendment 2026');
    });

    it('should wrap Swedish titel in data-translate span for motions', () => {
      const content = generateArticleContent(
        { motions: [{ titel: 'Djurskydd', url: '#', parti: 'MP', intressent_namn: 'Test' }] },
        'motions',
        'en'
      );
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
      expect(content).toContain('Djurskydd');
    });

    it('should NOT wrap English title in data-translate span for motions', () => {
      const content = generateArticleContent(
        { motions: [{ title: 'Animal Protection', url: '#', parti: 'MP', intressent_namn: 'Test' }] },
        'motions',
        'en'
      );
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('Animal Protection');
    });

    it('should wrap Swedish summary in data-translate span when present', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', summary: 'Förslaget innebär att', url: '#', organ: 'SoU' }] },
        'committee-reports',
        'en'
      );
      // Two data-translate spans: one for title, one for summary
      const matches = content.match(/data-translate="true"/g);
      expect(matches).not.toBeNull();
      expect(matches.length).toBe(2);
      expect(content).toContain('Förslaget innebär att');
    });

    it('should use localized default when no summary provided', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', url: '#', organ: 'SoU' }] },
        'committee-reports',
        'de'
      );
      // Only title has data-translate, summary is localized default
      const matches = content.match(/data-translate="true"/g);
      expect(matches).not.toBeNull();
      expect(matches.length).toBe(1);
      // Should contain the German default text
      expect(content).toContain(L('de', 'reportDefault'));
    });

    it('should wrap week-ahead event titel in data-translate span', () => {
      const eventsWithTitel = [
        { titel: 'Öppen utfrågning om AI', rubrik: 'EU debate on AI', datum: '2026-02-10T10:00:00', organ: 'TU' }
      ];
      const content = generateArticleContent(
        { events: eventsWithTitel, highlights: [] },
        'week-ahead',
        'en'
      );
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('Öppen utfrågning om AI');
    });

    it('should NOT wrap week-ahead event with English title', () => {
      const eventsWithTitle = [
        { title: 'EU summit on trade', datum: '2026-02-10T10:00:00', organ: 'TU' }
      ];
      const content = generateArticleContent(
        { events: eventsWithTitle, highlights: [] },
        'week-ahead',
        'en'
      );
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('EU summit on trade');
    });
  });

  describe('HTML escaping in data-translate spans (XSS prevention)', () => {
    it('should escape HTML special characters in Swedish titles', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test <script>alert("xss")</script>', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).not.toContain('<script>');
      expect(content).toContain('&lt;script&gt;');
    });

    it('should escape HTML in Swedish summaries', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', summary: 'Summary with <img onerror="hack">', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).not.toContain('<img onerror');
      expect(content).toContain('&lt;img onerror');
    });

    it('should escape HTML in document names', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', dokumentnamn: 'Doc <b>bold</b>', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).not.toContain('<b>bold</b>');
      expect(content).toContain('&lt;b&gt;');
    });
  });

  describe('dokumentnamn fallback chain', () => {
    it('should use dokumentnamn as link text when available', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', dokumentnamn: 'Bet 2025/26:FiU1', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).toContain('>Bet 2025/26:FiU1</a>');
    });

    it('should fall back to dok_id when dokumentnamn missing', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', dok_id: 'GX01FiU1', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).toContain('>GX01FiU1</a>');
    });

    it('should fall back to title text when both dokumentnamn and dok_id missing', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Fallback Title', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).toContain('>Fallback Title</a>');
    });

    it('should never render "undefined" as link text', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', url: '#', organ: 'FiU' }] },
        'committee-reports',
        'en'
      );
      expect(content).not.toContain('>undefined</a>');
      expect(content).not.toContain('>undefined<');
    });

    it('should apply dokumentnamn fallback for propositions', () => {
      const content = generateArticleContent(
        { propositions: [{ titel: 'Test Prop', dok_id: 'PROP123', url: '#' }] },
        'propositions',
        'en'
      );
      expect(content).toContain('>PROP123</a>');
    });

    it('should apply dokumentnamn fallback for motions', () => {
      const content = generateArticleContent(
        { motions: [{ titel: 'Test Motion', dok_id: 'MOT456', url: '#', parti: 'S', intressent_namn: 'Test' }] },
        'motions',
        'en'
      );
      expect(content).toContain('>MOT456</a>');
    });
  });

  describe('extractWatchPoints with data-translate markers', () => {
    it('should wrap Swedish event titles in data-translate span', () => {
      const watchPoints = extractWatchPoints({
        events: [
          { titel: 'Öppen utfrågning', rubrik: 'EU summit debate', datum: '2026-02-10T10:00:00', organ: 'Kammaren' }
        ]
      }, 'en');
      
      expect(watchPoints.length).toBeGreaterThan(0);
      const wp = watchPoints[0];
      expect(wp.title).toContain('data-translate="true"');
      expect(wp.title).toContain('lang="sv"');
      expect(wp.title).toContain('Öppen utfrågning');
    });

    it('should NOT wrap English event titles in data-translate span', () => {
      const watchPoints = extractWatchPoints({
        events: [
          { title: 'EU summit on trade', datum: '2026-02-10T10:00:00', organ: 'Kammaren' }
        ]
      }, 'en');
      
      expect(watchPoints.length).toBeGreaterThan(0);
      const wp = watchPoints[0];
      expect(wp.title).not.toContain('data-translate="true"');
      expect(wp.title).toContain('EU summit on trade');
    });

    it('should escape HTML in watch point titles', () => {
      const watchPoints = extractWatchPoints({
        events: [
          { titel: 'Test <script>hack</script>', rubrik: 'EU vote on safety', datum: '2026-02-10T10:00:00', organ: 'Kammaren' }
        ]
      }, 'en');
      
      expect(watchPoints.length).toBeGreaterThan(0);
      expect(watchPoints[0].title).not.toContain('<script>');
      expect(watchPoints[0].title).toContain('&lt;script&gt;');
    });
  });
});
