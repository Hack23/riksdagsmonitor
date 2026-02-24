/**
 * @module article-template/helpers
 * @description Formatting, sanitisation, and HTML section generators
 * for article templates. Includes date formatting, event calendar grid,
 * and watch section rendering.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { EventGridItem, WatchPoint } from '../types/article.js';
import type { BreadcrumbLabels, FooterLabelSet } from '../types/content.js';
import {
  BREADCRUMB_TRANSLATIONS,
  FOOTER_LABELS,
  EVENT_CALENDAR_TITLES,
  WATCH_SECTION_TITLES,
  LOCALE_MAP,
} from './constants.js';

/**
 * Get breadcrumb name for a given language
 */
export function getBreadcrumbName(lang: Language | string, type: keyof BreadcrumbLabels): string {
  return BREADCRUMB_TRANSLATIONS[lang as Language]?.[type] || BREADCRUMB_TRANSLATIONS.en[type];
}

/**
 * Get footer label for a given language
 */
export function getFooterLabel(lang: Language | string, key: keyof FooterLabelSet): string {
  return FOOTER_LABELS[lang as Language]?.[key] || FOOTER_LABELS.en[key];
}

/**
 * Get the news index filename for a language (en → index.html, others → index_{lang}.html)
 */
export function getNewsIndexFilename(lang: Language | string): string {
  if (lang === 'en') return 'index.html';
  return `index_${lang}.html`;
}

/**
 * Sanitize article body content for JSON-LD structured data.
 * Removes newlines and normalizes whitespace to prevent invalid JSON.
 */
export function sanitizeArticleBody(htmlContent: string): string {
  return htmlContent
    .substring(0, 500)
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format date for display using locale-appropriate formatting
 */
export function formatDate(date: Date, lang: Language | string = 'en'): string {
  const locale: string = LOCALE_MAP[lang] || 'en-GB';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  try {
    return date.toLocaleDateString(locale, options);
  } catch {
    return date.toLocaleDateString('en-GB', options);
  }
}

/**
 * Format date range for event calendar title
 */
export function formatDateRange(events: ReadonlyArray<EventGridItem>, lang: Language | string = 'en'): string {
  if (events.length === 0) return '';

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];

  if (!firstEvent || !lastEvent) return '';
  if (!firstEvent.date || !lastEvent.date) return '';

  const locale: string = LOCALE_MAP[lang] || 'en-GB';
  const longOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const shortOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

  try {
    const startDate: string = new Date(firstEvent.date).toLocaleDateString(locale, longOptions);
    const endDate: string = new Date(lastEvent.date).toLocaleDateString(locale, shortOptions);
    return `${startDate} – ${endDate}`;
  } catch {
    const startDate: string = new Date(firstEvent.date).toLocaleDateString('en-GB', longOptions);
    const endDate: string = new Date(lastEvent.date).toLocaleDateString('en-GB', shortOptions);
    return `${startDate} – ${endDate}`;
  }
}

/**
 * Generate event calendar HTML section
 */
export function generateEventCalendar(events: ReadonlyArray<EventGridItem>, lang: Language = 'en'): string {
  const title: string = EVENT_CALENDAR_TITLES[lang] || EVENT_CALENDAR_TITLES.en;
  const firstEvt = events[0];
  const weekLabel: string = events.length > 0 && firstEvt?.date ?
    `${formatDateRange(events, lang)}` : '';

  return `
  <section class="event-calendar" aria-label="${title}">
    <h2>${title}${weekLabel ? `: ${weekLabel}` : ''}</h2>
    <div class="calendar-grid">
${events.map(event => `      <div class="calendar-day${event.isToday ? ' today' : ''}" aria-label="${event.dayLabel}">
        <div class="day-header">${event.dayName}</div>
        <span class="day-date">${event.dayNumber}</span>
        <ul class="event-list">
${event.items.map(item => `          <li class="event-item">
            <span class="event-time">${item.time}</span>
            <span class="event-title">${item.title}</span>
          </li>`).join('\n')}
        </ul>
      </div>`).join('\n')}
    </div>
  </section>`;
}

/**
 * Generate "Watch Section" with key points
 */
export function generateWatchSection(watchPoints: ReadonlyArray<WatchPoint>, lang: Language = 'en'): string {
  const title: string = WATCH_SECTION_TITLES[lang] || WATCH_SECTION_TITLES.en;

  return `
    <section class="watch-section">
      <h2>${title}</h2>
      <ul class="watch-list">
${watchPoints.map(point => `        <li>
          <strong>${point.title}:</strong> ${point.description}
        </li>`).join('\n')}
      </ul>
    </section>`;
}
