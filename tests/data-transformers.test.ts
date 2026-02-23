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
import type { Language } from '../scripts/types/language.js';
import type { EventGridItem, WatchPoint, ArticleMetadata } from '../scripts/types/article.js';
import type { ContentLabelSet } from '../scripts/types/content.js';

/** Mock calendar event shape from Swedish parliament API */
interface MockCalendarEvent {
  title?: string;
  titel?: string;
  rubrik?: string;
  start?: string;
  datum?: string;
  from?: string;
  organ?: string;
  type?: string;
}

/** Mock article data payload */
interface MockArticlePayload {
  events?: MockCalendarEvent[];
  highlights?: Array<{ title: string; description: string }>;
  reports?: Array<{
    titel?: string;
    title?: string;
    summary?: string;
    url?: string;
    organ?: string;
    dokumentnamn?: string;
    dok_id?: string;
  }>;
  propositions?: Array<{
    titel?: string;
    title?: string;
    url?: string;
    organ?: string;
    dokumentnamn?: string;
    dok_id?: string;
  }>;

  motions?: Array<{
    titel?: string;
    title?: string;
    url?: string;
    parti?: string;
    dokumentnamn?: string;
    dok_id?: string;
    intressent_namn?: string;
    /** Riksdag API subtitle — motions typically "av Author (Party)" */
    undertitel?: string;
    notis?: string;
    summary?: string;
  }>;
  documents?: Array<{
    titel?: string;
    title?: string;
    url?: string;
    doktyp?: string;
    documentType?: string;
    dokumentnamn?: string;
    dok_id?: string;
    organ?: string;
  }>;
}

describe('Data Transformers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  const mockEvents: MockCalendarEvent[] = [
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
      const grid = transformCalendarToEventGrid(mockEvents, 'en') as EventGridItem[];
      
      expect(grid).toBeInstanceOf(Array);
      expect(grid.length).toBeGreaterThan(0);
      
      const firstDay = grid[0]!;
      expect(firstDay).toHaveProperty('date');
      expect(firstDay).toHaveProperty('dayName');
      expect(firstDay).toHaveProperty('dayNumber');
      expect(firstDay).toHaveProperty('items');
      expect(firstDay.items).toBeInstanceOf(Array);
    });

    it('should transform events to grid structure for Swedish', () => {
      const grid = transformCalendarToEventGrid(mockEvents, 'sv') as EventGridItem[];
      
      expect(grid).toBeInstanceOf(Array);
      expect(grid[0]).toHaveProperty('dayName');
      // Swedish day names (Intl may return lowercase — compare case-insensitively)
      const validSwedishDays = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
      expect(validSwedishDays).toContain(grid[0]!.dayName.toLowerCase());
    });

    it('should handle empty events array', () => {
      const grid = transformCalendarToEventGrid([], 'en') as EventGridItem[];
      expect(grid).toBeInstanceOf(Array);
      expect(grid.length).toBe(0);
    });

    it('should handle null/undefined events', () => {
      expect(transformCalendarToEventGrid(null as any, 'en')).toEqual([]);
      expect(transformCalendarToEventGrid(undefined as any, 'en')).toEqual([]);
    });

    it('should support all 14 languages via Intl formatting', () => {
      const allLangs: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
      allLangs.forEach((lang: Language) => {
        const grid = transformCalendarToEventGrid(mockEvents, lang) as EventGridItem[];
        expect(grid).toBeInstanceOf(Array);
        expect(grid.length).toBeGreaterThan(0);
        // Day name should be a non-empty string for all languages
        expect(grid[0]!.dayName).toBeTruthy();
        expect(typeof grid[0]!.dayName).toBe('string');
        expect(grid[0]!.dayName.length).toBeGreaterThan(0);
      });
    });

    it('should handle events with different date field names', () => {
      const eventsWithDatum: MockCalendarEvent[] = [
        { titel: 'Event 1', datum: '2026-02-10T10:00:00' },
        { rubrik: 'Event 2', from: '2026-02-11T14:00:00' }
      ];
      const grid = transformCalendarToEventGrid(eventsWithDatum, 'en') as EventGridItem[];
      expect(grid.length).toBe(2);
    });

    it('should group events by date', () => {
      const grid = transformCalendarToEventGrid(mockEvents, 'en') as EventGridItem[];
      
      // Events on same day should be in same group
      const feb10Events = grid.find((day: EventGridItem) => day.date === '2026-02-10');
      expect(feb10Events).toBeDefined();
      expect(feb10Events!.items.length).toBeGreaterThan(0);
    });
  });

  describe('generateArticleContent', () => {
    it('should generate HTML content for week-ahead article', () => {
      const content = generateArticleContent(
        { events: mockEvents, highlights: [] } as MockArticlePayload,
        'week-ahead',
        'en'
      ) as string;
      
      expect(content).toContain('<h2>');
      expect(content).toContain('<p>');
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(100);
    });

    it('should generate content in Swedish', () => {
      const content = generateArticleContent(
        { events: mockEvents, highlights: [] } as MockArticlePayload,
        'week-ahead',
        'sv'
      ) as string;
      
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(100);
    });

    it('should support different article types', () => {
      const types = ['week-ahead', 'committee-reports', 'propositions', 'motions'] as const;
      
      types.forEach((type) => {
        const content = generateArticleContent(
          { events: mockEvents } as MockArticlePayload,
          type,
          'en'
        ) as string;
        expect(typeof content).toBe('string');
      });
    });
  });

  describe('extractWatchPoints', () => {
    it('should extract watch points from events', () => {
      const watchPoints = extractWatchPoints({ events: mockEvents } as MockArticlePayload, 'en') as WatchPoint[];
      
      expect(watchPoints).toBeInstanceOf(Array);
      expect(watchPoints.length).toBeGreaterThan(0);
      
      if (watchPoints.length > 0) {
        expect(watchPoints[0]).toHaveProperty('title');
        expect(watchPoints[0]).toHaveProperty('description');
      }
    });

    it('should extract watch points in Swedish', () => {
      const watchPoints = extractWatchPoints({ events: mockEvents } as MockArticlePayload, 'sv') as WatchPoint[];
      
      expect(watchPoints).toBeInstanceOf(Array);
    });

    it('should handle empty data', () => {
      const watchPoints = extractWatchPoints({ events: [] } as MockArticlePayload, 'en') as WatchPoint[];
      expect(watchPoints).toBeInstanceOf(Array);
    });
  });

  describe('extractTopics', () => {
    it('should extract topics from events', () => {
      const topics = extractTopics(mockEvents) as string[];
      
      expect(topics).toBeInstanceOf(Array);
      expect(topics.every((t: string) => typeof t === 'string')).toBe(true);
    });

    it('should return unique topics', () => {
      const topics = extractTopics(mockEvents) as string[];
      const uniqueTopics = [...new Set(topics)];
      expect(topics.length).toBe(uniqueTopics.length);
    });
  });

  describe('generateMetadata', () => {
    it('should generate metadata with keywords, topics, tags', () => {
      const metadata = generateMetadata(
        { events: mockEvents } as MockArticlePayload,
        'week-ahead',
        'en'
      ) as ArticleMetadata;
      
      expect(metadata).toHaveProperty('keywords');
      expect(metadata).toHaveProperty('topics');
      expect(metadata).toHaveProperty('tags');
      
      expect(metadata.keywords).toBeInstanceOf(Array);
      expect(metadata.topics).toBeInstanceOf(Array);
      expect(metadata.tags).toBeInstanceOf(Array);
    });

    it('should generate Swedish metadata', () => {
      const metadata = generateMetadata(
        { events: mockEvents } as MockArticlePayload,
        'week-ahead',
        'sv'
      ) as ArticleMetadata;
      
      expect(metadata).toHaveProperty('keywords');
      expect(metadata.keywords).toBeInstanceOf(Array);
    });

    it('should generate metadata for weekly-review type', () => {
      const metadata = generateMetadata(
        { documents: [{ titel: 'Test', doktyp: 'mot' }] } as MockArticlePayload,
        'weekly-review',
        'en'
      ) as ArticleMetadata;

      expect(metadata.keywords).toContain('weekly review');
      expect(metadata.keywords).toContain('analysis');
      expect(metadata.topics).toContain('review');
    });

    it('should generate metadata for monthly-review type', () => {
      const metadata = generateMetadata(
        { documents: [{ titel: 'Test', doktyp: 'prop' }] } as MockArticlePayload,
        'monthly-review',
        'en'
      ) as ArticleMetadata;

      expect(metadata.keywords).toContain('monthly review');
      expect(metadata.keywords).toContain('analysis');
      expect(metadata.topics).toContain('review');
    });

    it('should generate metadata for month-ahead type', () => {
      const metadata = generateMetadata(
        { events: mockEvents } as MockArticlePayload,
        'month-ahead',
        'en'
      ) as ArticleMetadata;

      expect(metadata.keywords).toContain('month ahead');
      expect(metadata.keywords).toContain('outlook');
      expect(metadata.topics).toContain('outlook');
    });

    it('should generate metadata for breaking type', () => {
      const metadata = generateMetadata(
        {} as MockArticlePayload,
        'breaking',
        'en'
      ) as ArticleMetadata;

      expect(metadata.keywords).toContain('breaking news');
      expect(metadata.keywords).toContain('urgent');
      expect(metadata.topics).toContain('breaking');
    });
  });

  describe('calculateReadTime', () => {
    it('should calculate read time for short content', () => {
      const shortContent = '<p>Short text.</p>';
      const readTime = calculateReadTime(shortContent) as string;
      
      expect(readTime).toContain('min read');
      expect(readTime).toMatch(/^\d+ min read$/);
    });

    it('should calculate read time for long content', () => {
      const longContent = '<p>' + 'word '.repeat(1000) + '</p>';
      const readTime = calculateReadTime(longContent) as string;
      
      expect(readTime).toContain('min read');
      const minutes = parseInt(readTime);
      expect(minutes).toBeGreaterThan(1);
    });

    it('should handle empty content', () => {
      const readTime = calculateReadTime('') as string;
      expect(readTime).toBe('1 min read');
    });

    it('should handle content with only HTML tags', () => {
      const readTime = calculateReadTime('<div><p></p></div>') as string;
      expect(readTime).toContain('min read');
    });

    it('should never return less than 1 minute', () => {
      const readTime = calculateReadTime('<p>Hello</p>') as string;
      const minutes = parseInt(readTime);
      expect(minutes).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateArticleContent edge cases', () => {
    it('should handle unknown article type gracefully', () => {
      const content = generateArticleContent({ events: [] } as MockArticlePayload, 'unknown-type', 'en') as string;
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should handle committee-reports with empty reports array', () => {
      const content = generateArticleContent({ reports: [] } as MockArticlePayload, 'committee-reports', 'en') as string;
      expect(content).toContain('No committee reports');
    });

    it('should handle propositions with data', () => {
      const content = generateArticleContent({ 
        propositions: [{ titel: 'Test Prop', url: '#', dokumentnamn: 'Prop 2025/26:1' }] 
      } as MockArticlePayload, 'propositions', 'en') as string;
      expect(content).toContain('Test Prop');
    });

    it('should handle motions with data', () => {
      const content = generateArticleContent({ 
        motions: [{ titel: 'Test Motion', parti: 'S', url: '#', dokumentnamn: 'Mot 2025/26:1', intressent_namn: 'Test Person' }] 
      } as MockArticlePayload, 'motions', 'en') as string;
      expect(content).toContain('Test Motion');
    });

    it('should extract author/party from notis when intressent_namn is "Unknown" sentinel', () => {
      const content = generateArticleContent({
        motions: [{
          titel: 'Djurskydd',
          url: '#',
          dok_id: 'MOT123',
          // enrichDocumentsWithContent sets these sentinels when intressent data is missing
          intressent_namn: 'Unknown',
          parti: 'Unknown',
          notis: 'Motion till riksdagen 2025/26:123 av Ulrika Liljeberg (C) om förbättrat djurskydd. Förslag till riksdagsbeslut'
        }]
      } as MockArticlePayload, 'motions', 'en') as string;
      expect(content).toContain('Ulrika Liljeberg');
      expect(content).toContain('(C)');
      expect(content).not.toContain('Unknown (Unknown)');
    });

    it('should extract author/party from undertitel field as primary text source', () => {
      const content = generateArticleContent({
        motions: [{
          titel: 'Försvarspolitik',
          url: '#',
          dok_id: 'MOT456',
          intressent_namn: 'Unknown',
          parti: 'Unknown',
          undertitel: 'av Stefan Löfven m.fl. (S)'
        }]
      } as MockArticlePayload, 'motions', 'en') as string;
      expect(content).toContain('Stefan Löfven');
      expect(content).toContain('(S)');
      expect(content).not.toContain('Unknown (Unknown)');
    });

    it('should extract party from notis even when authorName is already set (party-only sentinel)', () => {
      const content = generateArticleContent({
        motions: [{
          titel: 'Klimatpolitik',
          url: '#',
          dok_id: 'MOT999',
          // author is present but party is missing/sentinel
          intressent_namn: 'Ulrika Liljeberg',
          parti: 'Unknown',
          notis: 'Motion till riksdagen 2025/26:999 av Ulrika Liljeberg (C) om klimatpolitik.'
        }]
      } as MockArticlePayload, 'motions', 'en') as string;
      expect(content).toContain('Ulrika Liljeberg');
      expect(content).toContain('(C)');
      expect(content).not.toContain('Unknown');
    });

    it('should extract author/party from summary when intressent_namn is empty', () => {
      const content = generateArticleContent({
        motions: [{
          titel: 'Skatter',
          url: '#',
          dok_id: 'MOT789',
          summary: 'Motion till riksdagen 2025/26:456 av Nooshi Dadgostar m.fl. (V) om skattepolitik.'
        }]
      } as MockArticlePayload, 'motions', 'en') as string;
      expect(content).toContain('Nooshi Dadgostar');
      expect(content).toContain('(V)');
    });

    it('should handle weekly-review type with documents property', () => {
      const content = generateArticleContent(
        { documents: [{ titel: 'Weekly Doc', url: '#' }] } as MockArticlePayload,
        'weekly-review',
        'en'
      ) as string;
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should handle monthly-review type with documents property', () => {
      const content = generateArticleContent(
        { documents: [{ titel: 'Monthly Doc', url: '#' }] } as MockArticlePayload,
        'monthly-review',
        'en'
      ) as string;
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should handle month-ahead type with events', () => {
      const content = generateArticleContent(
        { events: mockEvents, highlights: [] } as MockArticlePayload,
        'month-ahead',
        'en'
      ) as string;
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should include highlights section when highlights are provided', () => {
      const content = generateArticleContent(
        { 
          events: mockEvents, 
          highlights: [
            { title: 'Budget Vote', description: 'Critical budget debate expected' },
            { title: 'EU Summit', description: 'Key EU decisions ahead' }
          ] 
        } as MockArticlePayload,
        'week-ahead',
        'en'
      ) as string;
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
        } as MockArticlePayload,
        'week-ahead',
        'sv'
      ) as string;
      expect(content).toContain('Vad man ska följa');
      expect(content).toContain('Budgetomröstning');
    });

    it('should handle events with no date field', () => {
      const content = generateArticleContent(
        { events: [{ title: 'No date event' }], highlights: [] } as MockArticlePayload,
        'week-ahead',
        'en'
      ) as string;
      expect(typeof content).toBe('string');
    });
  });

  describe('generateSources', () => {
    it('should generate sources list from MCP tools', () => {
      const tools = ['get_calendar_events', 'get_betankanden'];
      const sources = generateSources(tools) as string[];
      
      expect(sources).toBeInstanceOf(Array);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources).toContain('riksdag-regering-mcp');
    });

    it('should handle empty tools array', () => {
      const sources = generateSources([]) as string[];
      expect(sources).toBeInstanceOf(Array);
      expect(sources).toContain('riksdag-regering-mcp');
    });

    it('should include descriptive source names', () => {
      const tools = ['get_calendar_events'];
      const sources = generateSources(tools) as string[];
      
      expect(sources.some((s: string) => s.includes('Calendar') || s.includes('Riksdagen'))).toBe(true);
    });

    it('should include sources for all MCP tool types', () => {
      const sources = generateSources([
        'get_calendar_events', 'get_betankanden', 'get_propositioner',
        'get_motioner', 'search_dokument'
      ]) as string[];
      
      expect(sources).toContain('riksdag-regering-mcp');
      expect(sources).toContain('Riksdagen Calendar');
      expect(sources).toContain('Committee Reports');
      expect(sources).toContain('Government Propositions');
      expect(sources).toContain('Parliamentary Motions');
      expect(sources).toContain('Riksdagen Documents');
    });
  });

  describe('Multi-language content labels (CONTENT_LABELS)', () => {
    const ALL_LANGUAGES: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    const REQUIRED_KEYS: string[] = [
      'whyMatters', 'whyMattersDefault', 'keyEvents', 'whatToWatch',
      'latestReports', 'noReports', 'committee', 'document',
      'reportDefault', 'govProps', 'noProps', 'propDefault',
      'oppMotions', 'noMotions', 'author', 'party', 'motionDefault',
      'genericContent', 'monitorDev', 'committeeDebates', 'committeeDebatesDesc',
      'govProposals', 'govProposalsDesc', 'weekAhead', 'committeeReportsTag',
      'govPropsTag', 'oppMotionsTag'
    ];

    it('should have labels for all 14 supported languages', () => {
      ALL_LANGUAGES.forEach((lang: Language) => {
        expect(CONTENT_LABELS).toHaveProperty(lang);
      });
    });

    it('should have all required keys in every language', () => {
      ALL_LANGUAGES.forEach((lang: Language) => {
        REQUIRED_KEYS.forEach((key: string) => {
          expect((CONTENT_LABELS as unknown as Record<string, Record<string, unknown>>)[lang]).toHaveProperty(key);
        });
      });
    });

    it('should have non-empty string values for static labels', () => {
      const staticKeys = REQUIRED_KEYS.filter((k: string) => !k.endsWith('Desc'));
      ALL_LANGUAGES.forEach((lang: Language) => {
        staticKeys.forEach((key: string) => {
          const val = (CONTENT_LABELS as unknown as Record<string, Record<string, unknown>>)[lang]![key];
          expect(typeof val).toBe('string');
          expect((val as string).length).toBeGreaterThan(0);
        });
      });
    });

    it('should have function values for Desc labels', () => {
      const descKeys = REQUIRED_KEYS.filter((k: string) => k.endsWith('Desc'));
      ALL_LANGUAGES.forEach((lang: Language) => {
        descKeys.forEach((key: string) => {
          const fn = (CONTENT_LABELS as unknown as Record<string, Record<string, unknown>>)[lang]![key];
          expect(typeof fn).toBe('function');
          // Should return a string when called with a number
          expect(typeof (fn as (n: number) => string)(5)).toBe('string');
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
    const nonEnSvLanguages: Language[] = ['da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

    it('should generate localized content for all 14 languages', () => {
      nonEnSvLanguages.forEach((lang: Language) => {
        const content = generateArticleContent(
          { events: mockEvents, highlights: [] } as MockArticlePayload,
          'week-ahead',
          lang
        ) as string;
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
        { reports: [] } as MockArticlePayload,
        'committee-reports',
        'de'
      ) as string;
      expect(content).toContain('Neueste Ausschussberichte');
    });

    it('should generate localized propositions content for French', () => {
      const content = generateArticleContent(
        { propositions: [] } as MockArticlePayload,
        'propositions',
        'fr'
      ) as string;
      expect(content).toContain('Propositions gouvernementales');
    });

    it('should generate localized motions content for Japanese', () => {
      const content = generateArticleContent(
        { motions: [] } as MockArticlePayload,
        'motions',
        'ja'
      ) as string;
      expect(content).toContain('野党動議');
    });

    it('should generate localized metadata tags', () => {
      const metadata = generateMetadata(
        { events: mockEvents } as MockArticlePayload,
        'week-ahead',
        'de'
      ) as ArticleMetadata;
      expect(metadata.tags).toContain('Woche Voraus');
    });
  });

  describe('data-translate markers for Swedish API content', () => {
    it('should wrap Swedish titel in data-translate span for committee reports', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Bättre förutsättningar', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
      expect(content).toContain('Bättre förutsättningar');
    });

    it('should NOT wrap English title in data-translate span for committee reports', () => {
      const content = generateArticleContent(
        { reports: [{ title: 'Better conditions', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('Better conditions');
    });

    it('should wrap Swedish titel in data-translate span for propositions', () => {
      const content = generateArticleContent(
        { propositions: [{ titel: 'Ändringsbudget för 2026', url: '#' }] } as MockArticlePayload,
        'propositions',
        'en'
      ) as string;
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
      expect(content).toContain('Ändringsbudget för 2026');
    });

    it('should NOT wrap English title in data-translate span for propositions', () => {
      const content = generateArticleContent(
        { propositions: [{ title: 'Budget Amendment 2026', url: '#' }] } as MockArticlePayload,
        'propositions',
        'en'
      ) as string;
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('Budget Amendment 2026');
    });

    it('should wrap Swedish titel in data-translate span for motions', () => {
      const content = generateArticleContent(
        { motions: [{ titel: 'Djurskydd', url: '#', parti: 'MP', intressent_namn: 'Test' }] } as MockArticlePayload,
        'motions',
        'en'
      ) as string;
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
      expect(content).toContain('Djurskydd');
    });

    it('should NOT wrap English title in data-translate span for motions', () => {
      const content = generateArticleContent(
        { motions: [{ title: 'Animal Protection', url: '#', parti: 'MP', intressent_namn: 'Test' }] } as MockArticlePayload,
        'motions',
        'en'
      ) as string;
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('Animal Protection');
    });

    it('should wrap Swedish summary in data-translate span when present', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', summary: 'Förslaget innebär att', url: '#', organ: 'SoU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      // Two data-translate spans: one for title, one for summary
      const matches = content.match(/data-translate="true"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(2);
      expect(content).toContain('Förslaget innebär att');
    });

    it('should use localized default or enhanced summary when no API summary provided', () => {
      // Test case 1: With organ metadata, should generate enhanced summary
      const contentWithOrgan = generateArticleContent(
        { reports: [{ titel: 'Test', url: '#', organ: 'SoU' }] } as MockArticlePayload,
        'committee-reports',
        'de'
      ) as string;
      // Only title has data-translate (not the enhanced summary based on metadata)
      const matchesWithOrgan = contentWithOrgan.match(/data-translate="true"/g);
      expect(matchesWithOrgan).not.toBeNull();
      expect(matchesWithOrgan!.length).toBe(1);
      // Should contain enhanced summary with organ
      expect(contentWithOrgan).toContain('SoU');
      expect(contentWithOrgan).toContain(L('de', 'committeeReport'));
      
      // Test case 2: Without any metadata, should use localized default
      const contentWithoutMetadata = generateArticleContent(
        { reports: [{ titel: 'Test', url: '#' }] } as MockArticlePayload,
        'committee-reports',
        'de'
      ) as string;
      // Only title has data-translate
      const matchesWithoutMetadata = contentWithoutMetadata.match(/data-translate="true"/g);
      expect(matchesWithoutMetadata).not.toBeNull();
      expect(matchesWithoutMetadata!.length).toBe(1);
      // Should contain the German default text when no metadata available
      expect(contentWithoutMetadata).toContain(L('de', 'reportDefault'));
    });

    it('should wrap week-ahead event titel in data-translate span', () => {
      const eventsWithTitel: MockCalendarEvent[] = [
        { titel: 'Öppen utfrågning om AI', rubrik: 'EU debate on AI', datum: '2026-02-10T10:00:00', organ: 'TU' }
      ];
      const content = generateArticleContent(
        { events: eventsWithTitel, highlights: [] } as MockArticlePayload,
        'week-ahead',
        'en'
      ) as string;
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('Öppen utfrågning om AI');
    });

    it('should NOT wrap week-ahead event with English title', () => {
      const eventsWithTitle: MockCalendarEvent[] = [
        { title: 'EU summit on trade', datum: '2026-02-10T10:00:00', organ: 'TU' }
      ];
      const content = generateArticleContent(
        { events: eventsWithTitle, highlights: [] } as MockArticlePayload,
        'week-ahead',
        'en'
      ) as string;
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('EU summit on trade');
    });
  });

  describe('HTML escaping in data-translate spans (XSS prevention)', () => {
    it('should escape HTML special characters in Swedish titles', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test <script>alert("xss")</script>', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).not.toContain('<script>');
      expect(content).toContain('&lt;script&gt;');
    });

    it('should escape HTML in Swedish summaries', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', summary: 'Summary with <img onerror="hack">', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).not.toContain('<img onerror');
      expect(content).toContain('&lt;img onerror');
    });

    it('should escape HTML in document names', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', dokumentnamn: 'Doc <b>bold</b>', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).not.toContain('<b>bold</b>');
      expect(content).toContain('&lt;b&gt;');
    });
  });

  describe('dokumentnamn fallback chain', () => {
    it('should use dokumentnamn as link text when available', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', dokumentnamn: 'Bet 2025/26:FiU1', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).toContain('Bet 2025/26:FiU1</a>');
    });

    it('should fall back to dok_id when dokumentnamn missing', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', dok_id: 'GX01FiU1', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).toContain('GX01FiU1</a>');
    });

    it('should fall back to title text when both dokumentnamn and dok_id missing', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Fallback Title', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).toContain('Fallback Title</a>');
    });

    it('should never render "undefined" as link text', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      expect(content).not.toContain('>undefined</a>');
      expect(content).not.toContain('>undefined<');
    });

    it('should apply dokumentnamn fallback for propositions', () => {
      const content = generateArticleContent(
        { propositions: [{ titel: 'Test Prop', dok_id: 'PROP123', url: '#' }] } as MockArticlePayload,
        'propositions',
        'en'
      ) as string;
      expect(content).toContain('PROP123</a>');
    });

    it('should apply dokumentnamn fallback for motions', () => {
      const content = generateArticleContent(
        { motions: [{ titel: 'Test Motion', dok_id: 'MOT456', url: '#', parti: 'S', intressent_namn: 'Test' }] } as MockArticlePayload,
        'motions',
        'en'
      ) as string;
      expect(content).toContain('MOT456</a>');
    });
  });

  describe('extractWatchPoints with data-translate markers', () => {
    it('should wrap Swedish event titles in data-translate span', () => {
      const watchPoints = extractWatchPoints({
        events: [
          { titel: 'Öppen utfrågning', rubrik: 'EU summit debate', datum: '2026-02-10T10:00:00', organ: 'Kammaren' }
        ]
      } as MockArticlePayload, 'en') as WatchPoint[];
      
      expect(watchPoints.length).toBeGreaterThan(0);
      const wp = watchPoints[0]!;
      expect(wp.title).toContain('data-translate="true"');
      expect(wp.title).toContain('lang="sv"');
      expect(wp.title).toContain('Öppen utfrågning');
    });

    it('should NOT wrap English event titles in data-translate span', () => {
      const watchPoints = extractWatchPoints({
        events: [
          { title: 'EU summit on trade', datum: '2026-02-10T10:00:00', organ: 'Kammaren' }
        ]
      } as MockArticlePayload, 'en') as WatchPoint[];
      
      expect(watchPoints.length).toBeGreaterThan(0);
      const wp = watchPoints[0]!;
      expect(wp.title).not.toContain('data-translate="true"');
      expect(wp.title).toContain('EU summit on trade');
    });

    it('should escape HTML in watch point titles', () => {
      const watchPoints = extractWatchPoints({
        events: [
          { titel: 'Test <script>hack</script>', rubrik: 'EU vote on safety', datum: '2026-02-10T10:00:00', organ: 'Kammaren' }
        ]
      } as MockArticlePayload, 'en') as WatchPoint[];
      
      expect(watchPoints.length).toBeGreaterThan(0);
      expect(watchPoints[0]!.title).not.toContain('<script>');
      expect(watchPoints[0]!.title).toContain('&lt;script&gt;');
    });
  });

  describe('Analytical content sections', () => {
    it('should render Thematic Analysis and Key Takeaways for committee-reports', () => {
      const content = generateArticleContent({
        reports: [
          { titel: 'Skattereform', organ: 'FiU', url: 'https://example.com/1', dok_id: 'FiU1' },
          { titel: 'Miljöpolitik', organ: 'MJU', url: 'https://example.com/2', dok_id: 'MJU5' }
        ]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).toContain('Thematic Analysis');
      expect(content).toContain('Key Takeaways');
      expect(content).toContain('What This Means');
    });

    it('should render Legislative Pipeline and Policy Implications for propositions', () => {
      const content = generateArticleContent({
        propositions: [
          { titel: 'Budget 2026', organ: 'FiU', url: 'https://example.com/p1', dok_id: 'Prop1' }
        ]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('Legislative Pipeline');
      expect(content).toContain('Policy Implications');
      expect(content).toContain('Why It Matters');
    });

    it('should render Opposition Strategy and Coalition Dynamics for motions', () => {
      const content = generateArticleContent({
        motions: [
          { titel: 'Skattefrågor', parti: 'S', url: 'https://example.com/m1', dok_id: 'M1' },
          { titel: 'Försvarspolitik', parti: 'V', url: 'https://example.com/m2', dok_id: 'M2' }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      expect(content).toContain('Opposition Strategy');
      expect(content).toContain('Coalition Dynamics');
      expect(content).toContain('Why It Matters');
    });

    it('should render Thematic Analysis for generic content (weekly/monthly review)', () => {
      const content = generateArticleContent({
        documents: [
          { titel: 'Test document', doktyp: 'mot', url: 'https://example.com/d1', dok_id: 'D1' },
          { titel: 'Another document', doktyp: 'prop', url: 'https://example.com/d2', dok_id: 'D2' }
        ]
      } as MockArticlePayload, 'weekly-review', 'en') as string;

      expect(content).toContain('Thematic Analysis');
      expect(content).toContain('Motions');
      expect(content).toContain('Propositions');
    });

    it('should render Key Takeaways and What This Means for generic content', () => {
      const content = generateArticleContent({
        documents: [
          { titel: 'Skattepolitik', doktyp: 'mot', url: 'https://example.com/d1', dok_id: 'D1', organ: 'FiU' },
          { titel: 'Budget proposal', doktyp: 'prop', url: 'https://example.com/d2', dok_id: 'D2' }
        ]
      } as MockArticlePayload, 'weekly-review', 'en') as string;

      expect(content).toContain('Key Takeaways');
      expect(content).toContain('What This Means');
    });

    it('should render policy significance in monthly-review generic content', () => {
      const content = generateArticleContent({
        documents: [
          { titel: 'Försvarspolitik', doktyp: 'bet', url: 'https://example.com/d1', dok_id: 'D1', organ: 'FöU' }
        ]
      } as MockArticlePayload, 'monthly-review', 'en') as string;

      expect(content).toContain('Thematic Analysis');
      expect(content).toContain('Key Takeaways');
      expect(content).toContain('defence and security policy');
    });

    it('should handle month-ahead type via week-ahead content generator', () => {
      const content = generateArticleContent({
        events: [
          { titel: 'EU-debatt', datum: '2026-02-10T10:00:00', organ: 'Kammaren' }
        ],
        highlights: [{ title: 'Key vote', description: 'Budget debate' }]
      } as MockArticlePayload, 'month-ahead', 'en') as string;

      expect(content).toContain('What to Watch');
      expect(content).toContain('Key vote');
    });

    it('should render Swedish analytical sections for generic content', () => {
      const content = generateArticleContent({
        documents: [
          { titel: 'Skattepolitik', doktyp: 'mot', url: 'https://example.com/d1', dok_id: 'D1', organ: 'FiU' }
        ]
      } as MockArticlePayload, 'weekly-review', 'sv') as string;

      // Swedish labels from CONTENT_LABELS.sv
      expect(content).toContain(CONTENT_LABELS.sv.thematicAnalysis);
      expect(content).toContain(CONTENT_LABELS.sv.keyTakeaways);
      expect(content).toContain(CONTENT_LABELS.sv.whatThisMeans);
    });
  });

  describe('Policy domain inference (generatePolicySignificance)', () => {
    it('should detect fiscal policy from FiU committee', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Budget', organ: 'FiU', url: 'https://example.com/1', dok_id: 'FiU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).toContain('fiscal policy');
    });

    it('should detect defence policy from FöU committee', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Military spending', organ: 'FöU', url: 'https://example.com/1', dok_id: 'FöU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).toContain('defence and security policy');
    });

    it('should detect environmental policy from title keyword', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Klimat och miljö', url: 'https://example.com/1', dok_id: 'X1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).toContain('environmental and climate policy');
    });

    it('should detect healthcare policy from SoU committee', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Healthcare reform', organ: 'SoU', url: 'https://example.com/1', dok_id: 'SoU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).toContain('healthcare policy');
    });

    it('should not produce duplicate domains when both keyword and committee match', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'EU-frågor och europa', organ: 'UU', url: 'https://example.com/1', dok_id: 'UU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // Should only appear once, not duplicated
      const matches = content.match(/EU and foreign affairs/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(1);
    });

    it('should produce generic significance for unknown domains', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Diverse frågor', url: 'https://example.com/1', dok_id: 'X1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).toContain('Requires committee review');
    });

    it('should produce Swedish significance for sv language', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Skattepolitik', organ: 'FiU', url: 'https://example.com/1', dok_id: 'FiU1' }]
      } as MockArticlePayload, 'committee-reports', 'sv') as string;

      expect(content).toContain('finanspolitik');
    });
  });

  describe('URL sanitization in generated content', () => {
    it('should reject javascript: URLs in report links', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Test', url: 'javascript:alert(1)', dok_id: 'X1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).not.toContain('javascript:');
      expect(content).toContain('href="#"');
    });

    it('should reject data: URLs in proposition links', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Test', url: 'data:text/html,<h1>XSS</h1>', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).not.toContain('data:');
      expect(content).toContain('href="#"');
    });

    it('should allow valid https URLs', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Test', url: 'https://riksdagen.se/doc/1', dok_id: 'R1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).toContain('href="https://riksdagen.se/doc/1"');
    });

    it('should reject vbscript: URLs', () => {
      const content = generateArticleContent({
        motions: [{ titel: 'Test', url: 'vbscript:MsgBox("XSS")', dok_id: 'M1' }]
      } as MockArticlePayload, 'motions', 'en') as string;

      expect(content).not.toContain('vbscript:');
      expect(content).toContain('href="#"');
    });
  });

  describe('Localized committee and document type labels', () => {
    it('should render localized committee name for unknown committees', () => {
      const content = generateArticleContent({
        reports: [
          { titel: 'Test report', url: 'https://example.com/1', dok_id: 'X1' }
        ]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // Without organ/committee, should use localized "Other committees" not literal "other"
      expect(content).not.toMatch(/<h3>other<\/h3>/i);
    });

    it('should render localized "Other documents" for unknown doc types', () => {
      const content = generateArticleContent({
        documents: [
          { titel: 'Test', doktyp: 'other', url: 'https://example.com/1', dok_id: 'D1' }
        ]
      } as MockArticlePayload, 'weekly-review', 'en') as string;

      expect(content).toContain('Other documents');
      // Should NOT render raw 'other' as the heading label
      expect(content).not.toMatch(/<h3>other\s*\(/);
    });
  });

  describe('New ContentLabelSet fields', () => {
    const allLangs: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    const newKeys = [
      'committeeCountContext', 'committeeActivityTakeaway', 'committeeMomentumTakeaway',
      'oppositionStrategyContext', 'policyImplicationsContext', 'genericOverview',
      'partyMotionsFiled', 'otherCommittee', 'otherDocuments',
      'policySignificanceTouches', 'policySignificanceGeneric',
      'politicalContext', 'policyImplications', 'keyTakeaways', 'thematicAnalysis',
      'legislativePipeline', 'oppositionStrategy', 'coalitionDynamics',
      'whatThisMeans', 'whyItMatters', 'committeeBreakdown', 'propsBreakdown',
      'motionsBreakdown',
      'responsesToProp', 'independentMotions'
    ];

    allLangs.forEach(lang => {
      newKeys.forEach(key => {
        it(`should have ${key} label for ${lang}`, () => {
          const labels = CONTENT_LABELS[lang];
          expect(labels).toBeDefined();
          expect((labels as unknown as Record<string, unknown>)[key]).toBeDefined();
        });
      });
    });

    it('should have function-valued committeeCountContext for en', () => {
      const fn = CONTENT_LABELS.en.committeeCountContext;
      expect(typeof fn).toBe('function');
      expect(fn(3)).toContain('3');
    });

    it('should have string-valued otherCommittee for sv', () => {
      expect(typeof CONTENT_LABELS.sv.otherCommittee).toBe('string');
      expect(CONTENT_LABELS.sv.otherCommittee).toBe('Övriga utskott');
    });

    it('should have string-valued policySignificanceGeneric for en', () => {
      expect(typeof CONTENT_LABELS.en.policySignificanceGeneric).toBe('string');
      expect(CONTENT_LABELS.en.policySignificanceGeneric).toContain('committee review');
    });

    it('should have function-valued responsesToProp for en', () => {
      const fn = CONTENT_LABELS.en.responsesToProp;
      expect(typeof fn).toBe('function');
      expect(fn('2025/26:118')).toContain('2025/26:118');
    });

    it('should have string-valued independentMotions for sv', () => {
      expect(typeof CONTENT_LABELS.sv.independentMotions).toBe('string');
      expect(CONTENT_LABELS.sv.independentMotions.length).toBeGreaterThan(0);
    });
  });

  describe('Motion grouping by parent proposition (#462)', () => {
    it('should render a group heading when motions share a parent proposition', () => {
      const content = generateArticleContent({
        motions: [
          {
            titel: 'med anledning av prop. 2025/26:118 Tillståndsprövning enligt förnybartdirektivet',
            url: 'https://riksdagen.se/mot1', dok_id: 'HD023912', parti: 'S',
            intressent_namn: 'Anna Lindberg'
          },
          {
            titel: 'med anledning av prop. 2025/26:118 Tillståndsprövning enligt förnybartdirektivet',
            url: 'https://riksdagen.se/mot2', dok_id: 'HD023908', parti: 'V',
            intressent_namn: 'Bo Karlsson'
          }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      // Group heading should appear once with the prop reference
      expect(content).toContain('2025/26:118');
      // The proposition title should be extracted after stripping the "med anledning av" prefix
      expect(content).toContain('Tillståndsprövning');
      // Individual entries should use dok_id as sub-heading (h4)
      expect(content).toContain('HD023912');
      expect(content).toContain('HD023908');
    });

    it('should group under a single h3 heading when multiple motions reference the same prop', () => {
      const content = generateArticleContent({
        motions: [
          {
            titel: 'med anledning av prop. 2025/26:108 Reformering av avfallslagstiftningen',
            url: 'https://riksdagen.se/mot3', dok_id: 'HD023909', parti: 'S',
            intressent_namn: 'Carl Svensson'
          },
          {
            titel: 'med anledning av prop. 2025/26:108 Reformering av avfallslagstiftningen',
            url: 'https://riksdagen.se/mot4', dok_id: 'HD023907', parti: 'M',
            intressent_namn: 'Diana Persson'
          },
          {
            titel: 'med anledning av prop. 2025/26:108 Reformering av avfallslagstiftningen',
            url: 'https://riksdagen.se/mot5', dok_id: 'HD023906', parti: 'V',
            intressent_namn: 'Erik Holm'
          }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      // "Responses to Prop." group heading should appear once
      const matchCount = (content.match(/Responses to Prop\. 2025\/26:108/g) || []).length;
      expect(matchCount).toBe(1);
      // All three dok_ids should appear
      expect(content).toContain('HD023909');
      expect(content).toContain('HD023907');
      expect(content).toContain('HD023906');
    });

    it('should render independent motions section when grouped motions also exist', () => {
      const content = generateArticleContent({
        motions: [
          {
            titel: 'med anledning av prop. 2025/26:118 Förnybartdirektivet',
            url: 'https://riksdagen.se/mot6', dok_id: 'HD023901', parti: 'S',
            intressent_namn: 'Fanny Berg'
          },
          {
            titel: 'Klimatpolitik och havsnivåer',
            url: 'https://riksdagen.se/mot7', dok_id: 'HD023900', parti: 'MP',
            intressent_namn: 'Greta Larsson'
          }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      // Grouped section for the prop reference
      expect(content).toContain('2025/26:118');
      // Independent motions section heading
      expect(content).toContain('Independent Motions');
      // Independent motion's dok_id
      expect(content).toContain('HD023900');
    });

    it('should render flat (no group headers) when no motions reference a proposition', () => {
      const content = generateArticleContent({
        motions: [
          { titel: 'Skattefrågor', url: 'https://riksdagen.se/m1', dok_id: 'M1', parti: 'S', intressent_namn: 'Hans Ek' },
          { titel: 'Försvarspolitik', url: 'https://riksdagen.se/m2', dok_id: 'M2', parti: 'V', intressent_namn: 'Ida Nilsson' }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      // No grouping headers should appear
      expect(content).not.toContain('Responses to Prop.');
      expect(content).not.toContain('Independent Motions');
      // Titles rendered as h3 in flat mode
      expect(content).toContain('Skattefrågor');
      expect(content).toContain('Försvarspolitik');
    });
  });
});
