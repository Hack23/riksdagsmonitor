/**
 * @module data-transformers/calendar
 * @description Calendar event transformation and watch-point extraction.
 * Converts raw MCP calendar events into structured grid items and
 * extracts high-priority intelligence watch points.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../html-utils.js';
import type { Language } from '../types/language.js';
import type { EventGridItem, WatchPoint } from '../types/article.js';
import type { RawCalendarEvent, RawDocument, ArticleContentData } from './types.js';
import {
  L,
  svSpan,
  isTodayDate,
  formatDayName,
  formatDayLabel,
  isHighPriority,
} from './helpers.js';

export function transformCalendarToEventGrid(events: RawCalendarEvent[], lang: Language = 'en'): EventGridItem[] {
  if (!events || events.length === 0) return [];

  // Group events by date
  const eventsByDate: Record<string, RawCalendarEvent[]> = {};
  events.forEach(event => {
    // Extract date from various field formats (MCP responses use 'from', 'start', or 'datum')
    let dateStr = event.datum || event.from || event.start;
    if (dateStr) {
      // Extract just the date part if it's an ISO timestamp
      dateStr = dateStr.split('T')[0];
    }
    if (!dateStr) return;

    if (!eventsByDate[dateStr]) {
      eventsByDate[dateStr] = [];
    }
    eventsByDate[dateStr]!.push(event);
  });

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();

  // Convert to grid format
  const eventGrid: EventGridItem[] = sortedDates.map(date => {
    const dateObj = new Date(date);
    const isTodayFlag = isTodayDate(dateObj);

    return {
      date: date,
      dayName: formatDayName(dateObj, lang),
      dayNumber: dateObj.getDate().toString(),
      dayLabel: formatDayLabel(dateObj, lang),
      isToday: isTodayFlag,
      items: (eventsByDate[date] ?? []).map(event => ({
        time: event.tid || event.time || 'Expected',
        title: event.rubrik || event.titel || event.title || 'Event'
      }))
    };
  });

  return eventGrid;
}

export function extractTopics(documents: RawDocument[]): string[] {
  const topics = new Set<string>();

  documents.forEach(doc => {
    // Extract from document type
    if (doc.doktyp) {
      switch (doc.doktyp) {
        case 'mot': topics.add('motions'); break;
        case 'prop': topics.add('propositions'); break;
        case 'bet': topics.add('committee-reports'); break;
        case 'skr': topics.add('government-communication'); break;
      }
    }

    // Extract from organ/committee
    if (doc.organ) {
      topics.add(`${doc.organ.toLowerCase()}-committee`);
    }

    // Extract from title keywords
    const title = (doc.titel || doc.rubrik || '').toLowerCase();
    if (title.includes('eu')) topics.add('eu');
    if (title.includes('försvar')) topics.add('defense');
    if (title.includes('ekonomi')) topics.add('economy');
    if (title.includes('miljö')) topics.add('environment');
    if (title.includes('migration')) topics.add('migration');
    if (title.includes('utbildning')) topics.add('education');
    if (title.includes('vård')) topics.add('healthcare');
  });

  return Array.from(topics).slice(0, 10); // Max 10 topics
}

export function extractWatchPoints(data: ArticleContentData, lang: Language = 'en'): WatchPoint[] {
  const watchPoints: WatchPoint[] = [];

  // From calendar events
  if (data.events) {
    const highPriorityEvents = data.events.filter(isHighPriority);
    highPriorityEvents.forEach(event => {
      // Derive dayName from event date if not present
      const rawDate = event.datum || event.from || event.start;
      const dateOnly = rawDate ? rawDate.split('T')[0] ?? rawDate : '';
      const dayName = event.dayName || (dateOnly ? formatDayName(new Date(dateOnly), lang) : '');
      const eventTitle = event.title || event.titel || 'Event';

      // Mark Swedish API titles for LLM translation post-processing
      const escapedEventTitle = escapeHtml(eventTitle);
      const titleDisplay = (event.titel && !event.title)
        ? svSpan(escapedEventTitle, lang)
        : escapedEventTitle;

      const monitorVal = L(lang, 'monitorDev');
      watchPoints.push({
        title: dayName ? `${dayName}: ${titleDisplay}` : titleDisplay,
        description: event.description || (typeof monitorVal === 'string' ? monitorVal : '')
      });
    });
  }

  // From committee reports
  if (data.reports && data.reports.length > 0) {
    const debatesVal = L(lang, 'committeeDebates');
    const debatesDescFn = L(lang, 'committeeDebatesDesc') as string | ((n: number) => string);
    watchPoints.push({
      title: typeof debatesVal === 'string' ? debatesVal : '',
      description: typeof debatesDescFn === 'function' ? debatesDescFn(data.reports.length) : ''
    });
  }

  // From propositions
  if (data.propositions && data.propositions.length > 0) {
    const proposalsVal = L(lang, 'govProposals');
    const proposalsDescFn = L(lang, 'govProposalsDesc') as string | ((n: number) => string);
    watchPoints.push({
      title: typeof proposalsVal === 'string' ? proposalsVal : '',
      description: typeof proposalsDescFn === 'function' ? proposalsDescFn(data.propositions.length) : ''
    });
  }

  return watchPoints.slice(0, 5); // Max 5 watch points
}
