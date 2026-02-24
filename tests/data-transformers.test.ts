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
  generateContentTitle,
  groupMotionsByProposition,
  groupPropositionsByCommittee,
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
    author?: string;
    notis?: string;
    summary?: string;
    undertitel?: string;
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
    it('should wrap Swedish titel in lang="sv" span for non-Swedish committee reports', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Bättre förutsättningar', url: '#', organ: 'FiU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      // Non-Swedish: lang="sv" for accessibility but no data-translate marker
      expect(content).not.toContain('data-translate="true"');
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

    it('should wrap Swedish titel in lang="sv" span for non-Swedish propositions', () => {
      const content = generateArticleContent(
        { propositions: [{ titel: 'Ändringsbudget för 2026', url: '#' }] } as MockArticlePayload,
        'propositions',
        'en'
      ) as string;
      // Non-Swedish: lang="sv" for accessibility but no data-translate marker
      expect(content).not.toContain('data-translate="true"');
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
      // Non-Swedish articles use lang="sv" for accessibility but no data-translate marker
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
      expect(content).toContain('Djurskydd');
    });

    it('should use data-translate="true" for Swedish (sv) articles with Swedish title', () => {
      const content = generateArticleContent(
        { motions: [{ titel: 'Djurskydd', url: '#', parti: 'MP', intressent_namn: 'Test' }] } as MockArticlePayload,
        'motions',
        'sv'
      ) as string;
      expect(content).toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
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

    it('should wrap Swedish summary in lang="sv" span when present for non-Swedish articles', () => {
      const content = generateArticleContent(
        { reports: [{ titel: 'Test', summary: 'Förslaget innebär att', url: '#', organ: 'SoU' }] } as MockArticlePayload,
        'committee-reports',
        'en'
      ) as string;
      // Non-Swedish: lang="sv" spans but no data-translate markers
      expect(content).not.toContain('data-translate="true"');
      const langMatches = content.match(/lang="sv"/g);
      expect(langMatches).not.toBeNull();
      expect(langMatches!.length).toBe(2); // title + summary
      expect(content).toContain('Förslaget innebär att');
    });

    it('should use localized default or enhanced summary when no API summary provided', () => {
      // Test case 1: With organ metadata, should generate enhanced summary
      const contentWithOrgan = generateArticleContent(
        { reports: [{ titel: 'Test', url: '#', organ: 'SoU' }] } as MockArticlePayload,
        'committee-reports',
        'de'
      ) as string;
      // Non-Swedish: lang="sv" span for title but no data-translate markers
      expect(contentWithOrgan).not.toContain('data-translate="true"');
      const langMatchesWithOrgan = contentWithOrgan.match(/lang="sv"/g);
      expect(langMatchesWithOrgan).not.toBeNull();
      expect(langMatchesWithOrgan!.length).toBe(1); // only title
      // Should contain enhanced summary with organ
      expect(contentWithOrgan).toContain('SoU');
      expect(contentWithOrgan).toContain(L('de', 'committeeReport'));
      
      // Test case 2: Without any metadata, should use localized default
      const contentWithoutMetadata = generateArticleContent(
        { reports: [{ titel: 'Test', url: '#' }] } as MockArticlePayload,
        'committee-reports',
        'de'
      ) as string;
      // Non-Swedish: lang="sv" span for title only, no data-translate markers
      expect(contentWithoutMetadata).not.toContain('data-translate="true"');
      const langMatchesWithoutMetadata = contentWithoutMetadata.match(/lang="sv"/g);
      expect(langMatchesWithoutMetadata).not.toBeNull();
      expect(langMatchesWithoutMetadata!.length).toBe(1); // only title
      // Should contain the German default text when no metadata available
      expect(contentWithoutMetadata).toContain(L('de', 'reportDefault'));
    });

    it('should wrap week-ahead event titel in lang="sv" span for non-Swedish articles', () => {
      const eventsWithTitel: MockCalendarEvent[] = [
        { titel: 'Öppen utfrågning om AI', rubrik: 'EU debate on AI', datum: '2026-02-10T10:00:00', organ: 'TU' }
      ];
      const content = generateArticleContent(
        { events: eventsWithTitel, highlights: [] } as MockArticlePayload,
        'week-ahead',
        'en'
      ) as string;
      // Non-Swedish: lang="sv" for accessibility but no data-translate marker
      expect(content).not.toContain('data-translate="true"');
      expect(content).toContain('lang="sv"');
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
    it('should wrap Swedish event titles in lang="sv" span for non-Swedish articles', () => {
      const watchPoints = extractWatchPoints({
        events: [
          { titel: 'Öppen utfrågning', rubrik: 'EU summit debate', datum: '2026-02-10T10:00:00', organ: 'Kammaren' }
        ]
      } as MockArticlePayload, 'en') as WatchPoint[];
      
      expect(watchPoints.length).toBeGreaterThan(0);
      const wp = watchPoints[0]!;
      // Non-Swedish: lang="sv" for accessibility but no data-translate marker
      expect(wp.title).not.toContain('data-translate="true"');
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

      // Domain must appear (it IS detected) — may appear in multiple analytical sections
      // but must never be listed twice in a single domain string (deduplication check)
      expect(content).toMatch(/EU and foreign affairs/);
      expect(content).not.toContain('EU and foreign affairs, EU and foreign affairs');
    });

    it('should produce generic significance for unknown domains', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Diverse frågor', url: 'https://example.com/1', dok_id: 'X1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      expect(content).toContain('Requires committee review');
    });

    it('should produce committee-specific fallback when organ is known but no title keyword matches', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Diverse administrativa ändringar', organ: 'KU', url: 'https://example.com/1', dok_id: 'KU1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      // KU is not mapped to a domain — should get committee-specific fallback instead of generic
      expect(content).not.toContain('Requires committee review and chamber debate before a decision is reached.');
      expect(content).toContain('Committee on the Constitution');
    });

    it('should produce Swedish committee fallback for sv language', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Diverse administrativa ändringar', organ: 'KU', url: 'https://example.com/1', dok_id: 'KU1' }]
      } as MockArticlePayload, 'propositions', 'sv') as string;

      expect(content).toContain('konstitutionsutskottet');
    });

    it('should detect "vapen" as defence and security policy', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Vapenlagen och vapentillstånd', url: 'https://example.com/1', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('defence and security policy');
    });

    it('should detect "beredskap" as defence and security policy', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Civilt försvar och beredskap', url: 'https://example.com/1', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('defence and security policy');
    });

    it('should detect "moms" as fiscal policy', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Momsbedrägerier och skattekontroll', url: 'https://example.com/1', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('fiscal policy');
    });

    it('should detect "e-legitimation" as fiscal policy', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Rapportering om e-legitimation och e-id', url: 'https://example.com/1', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('fiscal policy');
    });

    it('should detect "verklig huvudman" as fiscal policy', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Verklig huvudman och beneficial ownership', url: 'https://example.com/1', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('fiscal policy');
    });

    it('should detect "uppehållstillstånd" as migration policy', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Uppehållstillstånd och medborgarskap', url: 'https://example.com/1', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('migration policy');
    });

    it('should detect "trakasserier" as labour market policy', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Trakasserier och ILO-konventioner', url: 'https://example.com/1', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('labour market policy');
    });

    it('should detect "veterinär" as trade and industry policy', () => {
      const content = generateArticleContent({
        propositions: [{ titel: 'Veterinär och lantbruk', url: 'https://example.com/1', dok_id: 'P1' }]
      } as MockArticlePayload, 'propositions', 'en') as string;

      expect(content).toContain('trade and industry policy');
    });

    it('should use committee fallback for KU organ when title has no matching keywords', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Grundlagsändringar', organ: 'KU', url: 'https://example.com/1', dok_id: 'KU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // KU not mapped to domain — gets committee-specific fallback
      expect(content).not.toContain('Requires committee review and chamber debate before a decision is reached.');
      expect(content).toContain('Committee on the Constitution');
    });

    it('should use committee fallback for KrU organ when title has no matching keywords', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Kulturfrågor', organ: 'KrU', url: 'https://example.com/1', dok_id: 'KrU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // KrU not mapped to domain — gets committee-specific fallback
      expect(content).not.toContain('Requires committee review and chamber debate before a decision is reached.');
      expect(content).toContain('Committee on Cultural Affairs');
    });

    it('should produce Swedish significance for sv language', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Skattepolitik', organ: 'FiU', url: 'https://example.com/1', dok_id: 'FiU1' }]
      } as MockArticlePayload, 'committee-reports', 'sv') as string;

      expect(content).toContain('finanspolitik');
    });
  });

  describe('Domain-specific policy analysis (getDomainSpecificAnalysis)', () => {
    it('should include substantive fiscal committee report analysis — not just generic boilerplate', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Skattereform', organ: 'FiU', url: 'https://example.com/1', dok_id: 'FiU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // New domain-specific sentence should mention Finance Committee or fiscal framework
      expect(content).toMatch(/Finance Committee|fiscal surplus rule|budgetary/i);
    });

    it('should include substantive defence motion analysis', () => {
      const content = generateArticleContent({
        motions: [{ titel: 'Försvarspolitik', parti: 'M', url: 'https://example.com/1', dok_id: 'M1' }]
      } as MockArticlePayload, 'motions', 'en') as string;

      // New domain-specific sentence should mention NATO or security commitments
      expect(content).toMatch(/NATO|security commitments|strategic/i);
    });

    it('should include substantive climate committee report analysis', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Klimatpolitik', organ: 'MJU', url: 'https://example.com/1', dok_id: 'MJU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // New domain-specific sentence should mention decarbonisation or climate ambition
      expect(content).toMatch(/decarboni|climate ambition|Environment.*Committee|legislative baseline/i);
    });

    it('should include substantive healthcare committee report analysis', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Hälso- och sjukvård', organ: 'SoU', url: 'https://example.com/1', dok_id: 'SoU1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // New domain-specific sentence should mention regional councils or health system
      expect(content).toMatch(/regional|Social Affairs Committee|health system/i);
    });

    it('should not contain old generic implication "signals a policy position"', () => {
      const content = generateArticleContent({
        motions: [{ titel: 'Skattefrågor', parti: 'S', url: 'https://example.com/1', dok_id: 'S1' }]
      } as MockArticlePayload, 'motions', 'en') as string;

      // Old boilerplate should be gone
      expect(content).not.toContain('This motion signals a policy position; passage requires government or majority support.');
    });

    it('should use mot-specific analysis even when doktyp field is absent from motion doc', () => {
      // No doktyp field — generateMotionsContent injects implied 'mot' type
      const content = generateArticleContent({
        motions: [{ titel: 'Klimatpolitik', parti: 'MP', url: 'https://example.com/1', dok_id: 'M1' }]
      } as MockArticlePayload, 'motions', 'en') as string;

      // mot-specific text: "growing parliamentary pressure for faster decarbonisation"
      expect(content).toContain('decarbonisation');
      // NOT the default proposition fallback "navigate competing interests"
      expect(content).not.toContain('navigate competing interests from industry');
    });

    it('should use bet-specific analysis even when doktyp field is absent from report doc', () => {
      // No doktyp field — generateCommitteeContent injects implied 'bet' type
      const content = generateArticleContent({
        reports: [{ titel: 'Klimatpolitik', organ: 'MJU', url: 'https://example.com/1', dok_id: 'R1' }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // bet-specific text: "legislative baseline"
      expect(content).toContain('legislative baseline');
      // NOT the climate-mot text ("decarbonisation")
      expect(content).not.toContain('decarbonisation');
    });

    it('should not include redundant "Committee review" procedural sentence in policySignificanceTouches', () => {
      const content = generateArticleContent({
        motions: [{ titel: 'Skattefrågor', parti: 'S', url: 'https://example.com/1', dok_id: 'M1' }]
      } as MockArticlePayload, 'motions', 'en') as string;

      // The policySignificanceTouches label no longer appends the procedural sentence
      expect(content).not.toContain('Committee review and potential chamber vote will determine the proposal\'s fate.');
    });

    it('should detect "förnybartdirektivet" as environmental/climate policy', () => {
      const content = generateArticleContent({
        motions: [{ titel: 'Tillståndsprövning enligt förnybartdirektivet', parti: 'S', url: 'https://example.com/1', dok_id: 'M1' }]
      } as MockArticlePayload, 'motions', 'en') as string;

      expect(content).toContain('environmental and climate policy');
      expect(content).toContain('decarbonisation');
    });

    it('should detect "makrotillsyn" as fiscal policy', () => {
      const content = generateArticleContent({
        motions: [{ titel: 'Utveckling av makrotillsynsområdet', parti: 'S', url: 'https://example.com/1', dok_id: 'M1' }]
      } as MockArticlePayload, 'motions', 'en') as string;

      expect(content).toContain('fiscal policy');
    });

    it('should detect "bostadsrätt" and "lagfart" as housing policy', () => {
      const content = generateArticleContent({
        motions: [{ titel: 'Identitetskrav vid lagfart och åtgärder mot kringgåenden av bostadsrättslagen', parti: 'V', url: 'https://example.com/1', dok_id: 'M1' }]
      } as MockArticlePayload, 'motions', 'en') as string;

      expect(content).toContain('housing policy');
      expect(content).toContain('Housing motions reflect structural tension');
    });

    it('should produce Swedish domain-specific analysis for sv language', () => {
      const content = generateArticleContent({
        motions: [{ titel: 'Försvarspolitik', parti: 'M', url: 'https://example.com/1', dok_id: 'M1' }]
      } as MockArticlePayload, 'motions', 'sv') as string;

      // Should contain Swedish domain-specific text about NATO
      expect(content).toMatch(/NATO|säkerhetsåtaganden|strategisk/i);
    });
  });

  describe('Thematic grouping in motions content', () => {
    it('should group motions by policy theme when multiple domains detected', () => {
      const content = generateArticleContent({
        motions: [
          { titel: 'Skattefrågor och budget', parti: 'S', url: 'https://example.com/1', dok_id: 'M1' },
          { titel: 'Försvarspolitik och NATO', parti: 'M', url: 'https://example.com/2', dok_id: 'M2' }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      // Thematic Analysis section should appear when multiple domains exist
      expect(content).toContain('Thematic Analysis');
    });

    it('should render thematic section headings for each policy domain', () => {
      const content = generateArticleContent({
        motions: [
          { titel: 'Skattefrågor', parti: 'S', url: 'https://example.com/1', dok_id: 'M1' },
          { titel: 'Klimat och miljö', parti: 'MP', url: 'https://example.com/2', dok_id: 'M2' }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      expect(content).toContain('fiscal policy');
      expect(content).toContain('environmental and climate policy');
    });

    it('should not render Thematic Analysis section when all motions share one domain', () => {
      const content = generateArticleContent({
        motions: [
          { titel: 'Skattefrågor del 1', parti: 'S', url: 'https://example.com/1', dok_id: 'M1' },
          { titel: 'Skattefrågor del 2', parti: 'M', url: 'https://example.com/2', dok_id: 'M2' }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      // Single theme = flat list, no Thematic Analysis heading
      expect(content).not.toContain('Thematic Analysis');
    });
  });

  describe('Opposition strategy per-party analysis', () => {
    it('should name the most active party in opposition strategy section', () => {
      const content = generateArticleContent({
        motions: [
          { titel: 'Skattefrågor', parti: 'S', url: 'https://example.com/1', dok_id: 'M1' },
          { titel: 'Bostadspolitik', parti: 'S', url: 'https://example.com/2', dok_id: 'M2' },
          { titel: 'Försvarspolitik', parti: 'M', url: 'https://example.com/3', dok_id: 'M3' }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      // S is most active with 2 motions
      expect(content).toContain('<strong>S</strong>');
      expect(content).toContain('leads opposition activity');
    });

    it('should mention the second most active party', () => {
      const content = generateArticleContent({
        motions: [
          { titel: 'Skattefrågor', parti: 'S', url: 'https://example.com/1', dok_id: 'M1' },
          { titel: 'Bostadspolitik', parti: 'S', url: 'https://example.com/2', dok_id: 'M2' },
          { titel: 'Försvarspolitik', parti: 'M', url: 'https://example.com/3', dok_id: 'M3' }
        ]
      } as MockArticlePayload, 'motions', 'en') as string;

      // M follows with 1 motion
      expect(content).toContain('M follows with');
    });
  });

  describe('Government priority analysis in propositions', () => {
    it('should include government priority signal when multiple propositions share a committee', () => {
      const content = generateArticleContent({
        propositions: [
          { titel: 'Budget 2026', organ: 'FiU', url: 'https://example.com/p1', dok_id: 'P1' },
          { titel: 'Skattepolitik', organ: 'FiU', url: 'https://example.com/p2', dok_id: 'P2' },
          { titel: 'Miljölag', organ: 'MJU', url: 'https://example.com/p3', dok_id: 'P3' }
        ]
      } as MockArticlePayload, 'propositions', 'en') as string;

      // Should mention FiU receives the most (2) propositions
      expect(content).toMatch(/Committee on Finance.*2|2.*Committee on Finance/);
      expect(content).toContain('government priority');
    });

    it('domainCount reflects actual policy domains, not committee count', () => {
      // 3 propositions, all sent to FiU (1 committee) but touching 2 distinct domains
      const content = generateArticleContent({
        propositions: [
          { titel: 'Klimatlag miljö', organ: 'FiU', url: 'https://example.com/p1', dok_id: 'P1' },
          { titel: 'Försvarsbudget militär', organ: 'FiU', url: 'https://example.com/p2', dok_id: 'P2' },
          { titel: 'Extra budgetanslag', organ: 'FiU', url: 'https://example.com/p3', dok_id: 'P3' }
        ]
      } as MockArticlePayload, 'propositions', 'en') as string;

      // Committee count is 1 (all FiU) but domain count should be > 1 (climate + defence + fiscal)
      // The text must NOT say "1 policy domain" when multiple domains are detected
      expect(content).not.toMatch(/touch on 1 policy domain[^s]/);
    });
  });

  describe('Cross-committee analysis in committee reports', () => {
    it('should include cross-committee domain analysis in key takeaways', () => {
      const content = generateArticleContent({
        reports: [
          { titel: 'Skattereform', organ: 'FiU', url: 'https://example.com/1', dok_id: 'FiU1' },
          { titel: 'Försvarspolitik', organ: 'FöU', url: 'https://example.com/2', dok_id: 'FöU1' }
        ]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // Cross-committee analysis should identify domains spanning committees
      expect(content).toMatch(/cross-committee|broad legislative|multi-front/i);
    });

    it('should list detected policy domains in the cross-committee analysis', () => {
      const content = generateArticleContent({
        reports: [
          { titel: 'Klimat och miljö', organ: 'MJU', url: 'https://example.com/1', dok_id: 'MJU1' }
        ]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // The cross-committee section should name detected domains
      expect(content).toContain('environmental and climate policy');
    });
  });

  describe('generateDeepPolicyAnalysis with fullText enrichment', () => {
    it('falls back to domain-specific policy significance when no fullText is available', () => {
      // When only summary/notis are present (no fullText), deepPolicyAnalysis falls back
      // to generatePolicySignificance — the summary is already shown in the line above
      const content = generateArticleContent({
        reports: [{
          titel: 'Skattereform',
          organ: 'FiU',
          url: 'https://example.com/1',
          dok_id: 'FiU1'
        } as unknown as { titel: string; organ: string; url: string; dok_id: string }]
      } as MockArticlePayload, 'committee-reports', 'en') as string;

      // Fallback: domain-specific analysis is still present
      expect(content).toMatch(/Finance Committee|fiscal surplus rule|fiscal policy/i);
    });

    it('should NOT add extra data-translate span when summary is already shown above', () => {
      const content = generateArticleContent({
        reports: [{ titel: 'Test', summary: 'Förslaget innebär att', url: '#', organ: 'SoU' }]
      } as MockArticlePayload, 'committee-reports', 'sv') as string;

      // Exactly 2: one for title, one for summary — deepPolicyAnalysis uses only fullText,
      // so summary/notis are NOT re-wrapped, avoiding a third span.
      // Uses lang='sv' because svSpan adds data-translate="true" only for Swedish articles.
      const matches = content.match(/data-translate="true"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(2);
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
      'policySignificanceTouches', 'policySignificanceGeneric', 'generalMatters',
      'politicalContext', 'policyImplications', 'keyTakeaways', 'thematicAnalysis',
      'legislativePipeline', 'oppositionStrategy', 'coalitionDynamics',
      'whatThisMeans', 'whyItMatters', 'committeeBreakdown', 'propsBreakdown',
      'motionsBreakdown'
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

    it('should have localized generalMatters for sv (not English)', () => {
      expect(CONTENT_LABELS.sv.generalMatters).toBe('Övriga frågor');
      expect(CONTENT_LABELS.sv.generalMatters).not.toBe('General matters');
    });

    it('should use localized generalMatters as fallback theme in motions thematic grouping', () => {
      // One detectable domain (försvar) + one undetectable → 2 themes → thematic section shown
      const svContent = generateArticleContent({
        motions: [
          { titel: 'Försvarspolitik och NATO', parti: 'M', url: 'https://example.com/1', dok_id: 'M1' },
          { titel: 'Med anledning av misc policy', parti: 'S', url: 'https://example.com/2', dok_id: 'M2' }
        ]
      } as MockArticlePayload, 'motions', 'sv') as string;

      // Swedish fallback should be "Övriga frågor", not the English "General matters"
      expect(svContent).toContain('Övriga frågor');
      expect(svContent).not.toContain('>General matters<');
    });

    it('should collect domain labels (not full analysis sentences) in generic content policy context', () => {
      const content = generateArticleContent({
        documents: [
          { titel: 'Skattefrågor', doktyp: 'mot', url: 'https://example.com/1', dok_id: 'D1' },
          { titel: 'Försvarspolitik', doktyp: 'bet', url: 'https://example.com/2', dok_id: 'D2' }
        ]
      } as MockArticlePayload, 'weekly-review', 'en') as string;

      // Should show domain labels, not full multi-sentence analysis
      if (content.includes('Policy context')) {
        const policyLine = content.split('\n').find(l => l.includes('Policy context'));
        if (policyLine) {
          // Each domain-label entry should be short — not contain full analysis sentences
          expect(policyLine).not.toContain('Fiscal policy motions directly challenge');
          expect(policyLine).not.toContain('signals opposition readiness');
        }
      }
    });
  });
});

describe('generateContentTitle', () => {
  /** Minimal RawDocument shapes that carry Swedish keyword content */
  const klimatDoc = { titel: 'Förslag om klimatanpassning och utsläppshandel', rubrik: '' };
  const försvarDoc = { titel: 'Proposition om försvarsutgifter och NATO-samarbete', rubrik: '' };
  const bostadDoc  = { titel: 'Motion om bostadsmark och byggande i städerna', rubrik: '' };
  const ekonomiDoc = { titel: 'Budgetproposition med skatteändringar och ekonomi', rubrik: '' };

  it('returns null when fewer than 2 domains are detected', () => {
    const result = generateContentTitle([], 'en', 'motions');
    expect(result).toBeNull();
  });

  it('returns null for documents without Swedish keyword matches', () => {
    const docs = [{ titel: 'Unknown parliamentary document', rubrik: '' }];
    const result = generateContentTitle(docs, 'en', 'motions');
    expect(result).toBeNull();
  });

  describe('motions', () => {
    it('builds an English content title from 2 domains', () => {
      const result = generateContentTitle([klimatDoc, försvarDoc], 'en', 'motions');
      expect(result).not.toBeNull();
      expect(result!.title).toContain('Opposition');
      expect(result!.title).not.toBe('Opposition Motions: Battle Lines This Week');
    });

    it('title contains both detected domain names', () => {
      const result = generateContentTitle([klimatDoc, försvarDoc], 'en', 'motions');
      expect(result!.title).toContain('Environment');
      expect(result!.title).toContain('Defense');
    });

    it('subtitle includes document count', () => {
      const docs = [klimatDoc, försvarDoc, bostadDoc];
      const result = generateContentTitle(docs, 'en', 'motions');
      expect(result!.subtitle).toContain('3');
    });

    it('produces a Swedish (sv) title', () => {
      const result = generateContentTitle([klimatDoc, försvarDoc], 'sv', 'motions');
      expect(result!.title).toContain('Oppositionen');
      expect(result!.title).toContain('Miljö');
      expect(result!.title).toContain('Försvar');
    });

    it('falls back to English template for unknown language code', () => {
      const result = generateContentTitle([klimatDoc, försvarDoc], 'xx', 'motions');
      expect(result!.title).toContain('Opposition');
    });
  });

  describe('propositions', () => {
    it('builds an English content title', () => {
      const result = generateContentTitle([ekonomiDoc, bostadDoc], 'en', 'propositions');
      expect(result).not.toBeNull();
      expect(result!.title).toContain('Government');
      expect(result!.title).toContain('Economy');
      expect(result!.title).toContain('Housing');
    });

    it('produces a Swedish (sv) title', () => {
      const result = generateContentTitle([ekonomiDoc, bostadDoc], 'sv', 'propositions');
      expect(result!.title).toContain('Regeringen');
      expect(result!.title).toContain('Ekonomi');
      expect(result!.title).toContain('Bostäder');
    });
  });

  describe('committee-reports', () => {
    it('builds an English content title', () => {
      const result = generateContentTitle([klimatDoc, ekonomiDoc], 'en', 'committee-reports');
      expect(result).not.toBeNull();
      expect(result!.title).toContain('Committees');
      expect(result!.title).toContain('Environment');
      expect(result!.title).toContain('Economy');
    });

    it('produces a Swedish (sv) title', () => {
      const result = generateContentTitle([klimatDoc, ekonomiDoc], 'sv', 'committee-reports');
      expect(result!.title).toContain('Utskotten');
      expect(result!.title).toContain('Miljö');
      expect(result!.title).toContain('Ekonomi');
    });
  });

  describe('domain frequency ranking', () => {
    it('picks the most frequent domain first', () => {
      const docs = [klimatDoc, klimatDoc, ekonomiDoc];
      const result = generateContentTitle(docs, 'en', 'motions');
      // environment appears twice, economy once — environment should be d1 (earlier in title)
      expect(result).not.toBeNull();
      const title = result!.title;
      const envIdx = title.indexOf('Environment');
      const ecoIdx = title.indexOf('Economy');
      expect(envIdx).toBeGreaterThanOrEqual(0);
      expect(ecoIdx).toBeGreaterThanOrEqual(0);
      expect(envIdx).toBeLessThan(ecoIdx);
    });
  });

  describe('14-language coverage', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;
    for (const lang of langs) {
      it(`returns a non-null result for lang="${lang}"`, () => {
        const result = generateContentTitle([klimatDoc, ekonomiDoc], lang, 'motions');
        expect(result).not.toBeNull();
        expect(result!.title.length).toBeGreaterThan(0);
        expect(result!.subtitle.length).toBeGreaterThan(0);
      });
    }
  });
});

describe('generateMotionsContent author/party sentinel fix (#454)', () => {
  it('falls back to parseMotionAuthorParty when intressent_namn is Unknown sentinel', () => {
    const content = generateArticleContent({
      motions: [{
        titel: 'Motion till riksdagen 2025/26:123 av Anna Andersson (M) om skattelättnad',
        intressent_namn: 'Unknown',
        parti: 'Unknown',
        url: '#',
        dok_id: 'MOT123',
      }]
    } as MockArticlePayload, 'motions', 'en') as string;
    expect(content).toContain('Anna Andersson');
    expect(content).toContain('(M)');
    expect(content).not.toContain('Unknown (Unknown)');
  });

  it('keeps real author name when intressent_namn is not a sentinel', () => {
    const content = generateArticleContent({
      motions: [{
        titel: 'Test motion',
        intressent_namn: 'Lars Pettersson',
        parti: 'S',
        url: '#',
        dok_id: 'MOT999',
      }]
    } as MockArticlePayload, 'motions', 'en') as string;
    expect(content).toContain('Lars Pettersson');
    expect(content).toContain('(S)');
  });
});

describe('groupMotionsByProposition (#462) / thematic grouping (#460)', () => {
  it('groups same-prop motions under a single h3 heading with h4 entries', () => {
    const content = generateArticleContent({
      motions: [
        {
          titel: 'med anledning av prop. 2025/26:118 Tillståndsprövning enligt förnybartdirektivet',
          intressent_namn: 'Anna Björk',
          parti: 'M',
          url: '#',
          dok_id: 'MOT_A',
        },
        {
          titel: 'med anledning av prop. 2025/26:118 Tillståndsprövning enligt förnybartdirektivet',
          intressent_namn: 'Lars Svensson',
          parti: 'SD',
          url: '#',
          dok_id: 'MOT_B',
        },
      ]
    } as MockArticlePayload, 'motions', 'en') as string;
    // Proposition grouping: both motions share the same prop → single h3 heading
    expect(content).toContain('Responses to Government Propositions');
    expect(content).toContain('Prop. 2025/26:118');
    expect(content).toContain('MOT_A');
    expect(content).toContain('MOT_B');
  });

  it('groups proposition-response motions separately from independent motions', () => {
    const content = generateArticleContent({
      motions: [
        {
          titel: 'med anledning av prop. 2025/26:50 Bostadsfrågor',
          intressent_namn: 'Maja Berg',
          parti: 'C',
          url: '#',
          dok_id: 'MOT_PROP',
        },
        {
          titel: 'Fristående motion om transportpolitik',
          intressent_namn: 'Erik Holm',
          parti: 'V',
          url: '#',
          dok_id: 'MOT_IND',
        },
      ]
    } as MockArticlePayload, 'motions', 'en') as string;
    // Proposition grouping: one grouped + one independent
    expect(content).toContain('Responses to Government Propositions');
    expect(content).toContain('Independent Motions');
    expect(content).toContain('MOT_PROP');
    expect(content).toContain('MOT_IND');
  });

  it('renders all motions without proposition-grouping header when none reference a proposition', () => {
    const content = generateArticleContent({
      motions: [
        { titel: 'Om utbildningspolitik', intressent_namn: 'Per Nord', parti: 'KD', url: '#', dok_id: 'M1' },
        { titel: 'Om sjukvård', intressent_namn: 'Gun Öst', parti: 'MP', url: '#', dok_id: 'M2' },
      ]
    } as MockArticlePayload, 'motions', 'en') as string;
    expect(content).not.toContain('Responses to Government Propositions');
    expect(content).not.toContain('Independent Motions');
    expect(content).toContain('M1');
    expect(content).toContain('M2');
  });
});

describe('generateContentTitle', () => {
  /** Minimal RawDocument shapes that carry Swedish keyword content */
  const klimatDoc = { titel: 'Förslag om klimatanpassning och utsläppshandel', rubrik: '' };
  const försvarDoc = { titel: 'Proposition om försvarsutgifter och NATO-samarbete', rubrik: '' };
  const bostadDoc  = { titel: 'Motion om bostadsmark och byggande i städerna', rubrik: '' };
  const ekonomiDoc = { titel: 'Budgetproposition med skatteändringar och ekonomi', rubrik: '' };

  it('returns null when fewer than 2 domains are detected', () => {
    const result = generateContentTitle([], 'en', 'motions');
    expect(result).toBeNull();
  });

  it('returns null for documents without Swedish keyword matches', () => {
    const docs = [{ titel: 'Unknown parliamentary document', rubrik: '' }];
    const result = generateContentTitle(docs, 'en', 'motions');
    expect(result).toBeNull();
  });

  describe('motions', () => {
    it('builds an English content title from 2 domains', () => {
      const result = generateContentTitle([klimatDoc, försvarDoc], 'en', 'motions');
      expect(result).not.toBeNull();
      expect(result!.title).toContain('Opposition');
      expect(result!.title).not.toBe('Opposition Motions: Battle Lines This Week');
    });

    it('title contains both detected domain names', () => {
      const result = generateContentTitle([klimatDoc, försvarDoc], 'en', 'motions');
      expect(result!.title).toContain('Environment');
      expect(result!.title).toContain('Defense');
    });

    it('subtitle includes document count', () => {
      const docs = [klimatDoc, försvarDoc, bostadDoc];
      const result = generateContentTitle(docs, 'en', 'motions');
      expect(result!.subtitle).toContain('3');
    });

    it('produces a Swedish (sv) title', () => {
      const result = generateContentTitle([klimatDoc, försvarDoc], 'sv', 'motions');
      expect(result!.title).toContain('Oppositionen');
      expect(result!.title).toContain('Miljö');
      expect(result!.title).toContain('Försvar');
    });

    it('falls back to English template for unknown language code', () => {
      const result = generateContentTitle([klimatDoc, försvarDoc], 'xx', 'motions');
      expect(result!.title).toContain('Opposition');
    });
  });

  describe('propositions', () => {
    it('builds an English content title', () => {
      const result = generateContentTitle([ekonomiDoc, bostadDoc], 'en', 'propositions');
      expect(result).not.toBeNull();
      expect(result!.title).toContain('Government');
      expect(result!.title).toContain('Economy');
      expect(result!.title).toContain('Housing');
    });

    it('produces a Swedish (sv) title', () => {
      const result = generateContentTitle([ekonomiDoc, bostadDoc], 'sv', 'propositions');
      expect(result!.title).toContain('Regeringen');
      expect(result!.title).toContain('Ekonomi');
      expect(result!.title).toContain('Bostäder');
    });
  });

  describe('committee-reports', () => {
    it('builds an English content title', () => {
      const result = generateContentTitle([klimatDoc, ekonomiDoc], 'en', 'committee-reports');
      expect(result).not.toBeNull();
      expect(result!.title).toContain('Committees');
      expect(result!.title).toContain('Environment');
      expect(result!.title).toContain('Economy');
    });

    it('produces a Swedish (sv) title', () => {
      const result = generateContentTitle([klimatDoc, ekonomiDoc], 'sv', 'committee-reports');
      expect(result!.title).toContain('Utskotten');
      expect(result!.title).toContain('Miljö');
      expect(result!.title).toContain('Ekonomi');
    });
  });

  describe('domain frequency ranking', () => {
    it('picks the most frequent domain first', () => {
      const docs = [klimatDoc, klimatDoc, ekonomiDoc];
      const result = generateContentTitle(docs, 'en', 'motions');
      // environment appears twice, economy once — environment should be d1 (earlier in title)
      expect(result).not.toBeNull();
      const title = result!.title;
      const envIdx = title.indexOf('Environment');
      const ecoIdx = title.indexOf('Economy');
      expect(envIdx).toBeGreaterThanOrEqual(0);
      expect(ecoIdx).toBeGreaterThanOrEqual(0);
      expect(envIdx).toBeLessThan(ecoIdx);
    });
  });

  describe('14-language coverage', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;
    for (const lang of langs) {
      it(`returns a non-null result for lang="${lang}"`, () => {
        const result = generateContentTitle([klimatDoc, ekonomiDoc], lang, 'motions');
        expect(result).not.toBeNull();
        expect(result!.title.length).toBeGreaterThan(0);
        expect(result!.subtitle.length).toBeGreaterThan(0);
      });
    }
  });
});

describe('generateMotionsContent author/party sentinel fix (#454)', () => {
  it('falls back to parseMotionAuthorParty when intressent_namn is Unknown sentinel', () => {
    const content = generateArticleContent({
      motions: [{
        titel: 'Motion till riksdagen 2025/26:123 av Anna Andersson (M) om skattelättnad',
        intressent_namn: 'Unknown',
        parti: 'Unknown',
        url: '#',
        dok_id: 'MOT123',
      }]
    } as MockArticlePayload, 'motions', 'en') as string;
    expect(content).toContain('Anna Andersson');
    expect(content).toContain('(M)');
    expect(content).not.toContain('Unknown (Unknown)');
  });

  it('keeps real author name when intressent_namn is not a sentinel', () => {
    const content = generateArticleContent({
      motions: [{
        titel: 'Test motion',
        intressent_namn: 'Lars Pettersson',
        parti: 'S',
        url: '#',
        dok_id: 'MOT999',
      }]
    } as MockArticlePayload, 'motions', 'en') as string;
    expect(content).toContain('Lars Pettersson');
    expect(content).toContain('(S)');
  });

  it('extracts party from notis when author is valid but parti is Unknown sentinel', () => {
    // Simulates enrichDocumentsWithContent setting intressent_namn correctly but parti='Unknown'
    const content = generateArticleContent({
      motions: [{
        titel: 'Test motion',
        intressent_namn: 'Ulrika Liljeberg',
        parti: 'Unknown',
        notis: 'Motion till riksdagen 2025/26:456 av Ulrika Liljeberg (C) om något viktigt.',
        url: '#',
        dok_id: 'MOT_PARTY_ONLY',
      }]
    } as MockArticlePayload, 'motions', 'en') as string;
    expect(content).toContain('Ulrika Liljeberg');
    expect(content).toContain('(C)');
    expect(content).not.toContain('Unknown (Unknown)');
  });

  it('extracts author and party from notis when both intressent_namn and author are Unknown sentinels', () => {
    // Simulates real enrichDocumentsWithContent shape: both author fields default to 'Unknown'
    const content = generateArticleContent({
      motions: [{
        titel: 'Test motion',
        intressent_namn: 'Unknown',
        author: 'Unknown',
        parti: 'Unknown',
        notis: 'Motion till riksdagen 2025/26:789 av Erik Andersson (KD) om ett viktigt ämne.',
        url: '#',
        dok_id: 'MOT_ALL_UNKNOWN',
      }]
    } as MockArticlePayload, 'motions', 'en') as string;
    expect(content).toContain('Erik Andersson');
    expect(content).toContain('(KD)');
    expect(content).not.toContain('Unknown (Unknown)');
  });
});

describe('groupMotionsByProposition (#462)', () => {
  it('groups motions referencing the same proposition under a single h3 heading', () => {
    const content = generateArticleContent({
      motions: [
        {
          titel: 'med anledning av prop. 2025/26:118 Tillståndsprövning enligt förnybartdirektivet',
          intressent_namn: 'Anna Björk',
          parti: 'M',
          url: '#',
          dok_id: 'MOT_A',
        },
        {
          titel: 'med anledning av prop. 2025/26:118 Tillståndsprövning enligt förnybartdirektivet',
          intressent_namn: 'Lars Svensson',
          parti: 'SD',
          url: '#',
          dok_id: 'MOT_B',
        },
      ]
    } as MockArticlePayload, 'motions', 'en') as string;
    // Proposition grouping: both motions share the same prop → single h3 heading
    expect(content).toContain('Responses to Government Propositions');
    expect(content).toContain('Prop. 2025/26:118');
    // Both motion entries should still be present
    expect(content).toContain('MOT_A');
    expect(content).toContain('MOT_B');
  });

  it('uses Independent Motions heading when mixed with proposition-response motions', () => {
    const content = generateArticleContent({
      motions: [
        {
          titel: 'med anledning av prop. 2025/26:50 Bostadsfrågor',
          intressent_namn: 'Maja Berg',
          parti: 'C',
          url: '#',
          dok_id: 'MOT_PROP',
        },
        {
          titel: 'Fristående motion om transportpolitik',
          intressent_namn: 'Erik Holm',
          parti: 'V',
          url: '#',
          dok_id: 'MOT_IND',
        },
      ]
    } as MockArticlePayload, 'motions', 'en') as string;
    // One grouped + one independent
    expect(content).toContain('Responses to Government Propositions');
    expect(content).toContain('Independent Motions');
    expect(content).toContain('MOT_PROP');
    expect(content).toContain('MOT_IND');
  });

  it('renders all motions without grouping header when none reference a proposition', () => {
    const content = generateArticleContent({
      motions: [
        { titel: 'Om utbildningspolitik', intressent_namn: 'Per Nord', parti: 'KD', url: '#', dok_id: 'M1' },
        { titel: 'Om sjukvård', intressent_namn: 'Gun Öst', parti: 'MP', url: '#', dok_id: 'M2' },
      ]
    } as MockArticlePayload, 'motions', 'en') as string;
    expect(content).not.toContain('Responses to Government Propositions');
    expect(content).not.toContain('Independent Motions');
    expect(content).toContain('M1');
    expect(content).toContain('M2');
  });
});
