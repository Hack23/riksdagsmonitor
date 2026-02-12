/**
 * Unit Tests for Data Transformers
 * Tests data transformation functions
 */

import { describe, it, expect } from 'vitest';
import {
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  extractTopics,
  generateMetadata,
  calculateReadTime,
  generateSources
} from '../scripts/data-transformers.js';

describe('Data Transformers', () => {
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
      // Swedish day names
      expect(['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'])
        .toContain(grid[0].dayName);
    });

    it('should handle empty events array', () => {
      const grid = transformCalendarToEventGrid([], 'en');
      expect(grid).toBeInstanceOf(Array);
      expect(grid.length).toBe(0);
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
  });
});
