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
  LANG_DISPLAY,
  SITE_FOOTER_LABELS,
  ALL_LANG_CODES,
  LANG_ARIA_LABELS,
  LANG_SWITCHER_ARIA_LABELS,
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
 * Remove orphaned `</p>` tags that appear immediately after `</ul>` or `</ol>`.
 * Browsers auto-close `<p>` before block-level list elements, so AI-generated
 * markup of the form `<p>intro</p><ul>…</ul></p>` leaves a dangling `</p>`.
 * This function removes only that specific trailing `</p>` and does not attempt
 * any other HTML repair.
 */
export function fixHtmlNesting(htmlContent: string): string {
  return htmlContent.replace(/<\/(ul|ol)>\s*<\/p>/g, '</$1>');
}

/**
 * Sanitize article body content for JSON-LD structured data.
 * Removes newlines and normalizes whitespace to prevent invalid JSON.
 * Callers should apply {@link fixHtmlNesting} to the raw HTML *before*
 * escaping and passing it here, so the regex has a chance to match.
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

/**
 * Generate the article language switcher navigation bar.
 *
 * @param baseSlug - The article base slug without language suffix (e.g. "2026-02-13-evening-analysis")
 * @param currentLang - The current article language
 * @returns HTML nav element string
 */
export function generateArticleLanguageSwitcher(baseSlug: string, currentLang: Language | string): string {
  const links: string = ALL_LANG_CODES.map(l => {
    const display = LANG_DISPLAY[l];
    const active: string = l === currentLang ? ' active' : '';
    const ariaCurrent: string = l === currentLang ? ' aria-current="page"' : '';
    return `    <a href="${baseSlug}-${l}.html" class="lang-link${active}" hreflang="${l}"${ariaCurrent}>${display.flag} ${display.name}</a>`;
  }).join('\n');
  const ariaLabel: string = LANG_SWITCHER_ARIA_LABELS[currentLang as Language] || LANG_SWITCHER_ARIA_LABELS.en;
  return `  <nav class="language-switcher" role="navigation" aria-label="${ariaLabel}">\n${links}\n  </nav>`;
}

/**
 * Generate the full site footer matching index.html structure.
 *
 * @param lang - The current language
 * @returns HTML footer element string
 */
export function generateSiteFooter(lang: Language | string): string {
  const normalizedLang: Language = ALL_LANG_CODES.includes(lang as Language)
    ? (lang as Language)
    : 'en';
  const labels = SITE_FOOTER_LABELS[normalizedLang];
  const homePath: string = normalizedLang === 'en' ? '../index.html' : `../index_${normalizedLang}.html`;
  const newsPath: string = getNewsIndexFilename(normalizedLang);
  const dashboardPath: string = normalizedLang === 'en' ? '../dashboard/index.html' : `../dashboard/index_${normalizedLang}.html`;

  return `<footer role="contentinfo">
  <div class="footer-content">
    <div class="footer-section">
      <h3>${labels.about}</h3>
      <p>${labels.aboutText}</p>
      <ul class="footer-stats">
        <li>${labels.statMPs}</li>
        <li>${labels.statRiskRules}</li>
        <li>${labels.statLanguages}</li>
        <li>${labels.statHistoricalData}</li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>${labels.quickLinks}</h3>
      <ul>
        <li><a href="${homePath}">Home</a></li>
        <li><a href="${newsPath}">News</a></li>
        <li><a href="${dashboardPath}">${labels.dashboard}</a></li>
        <li><a href="https://www.hack23.com/cia" target="_blank" rel="noopener noreferrer">CIA Platform</a></li>
        <li><a href="https://github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
        <li><a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">Sveriges Riksdag</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>${labels.builtBy}</h3>
      <p>${labels.builtByText}</p>
      <ul>
        <li><a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23.com</a></li>
        <li><a href="https://www.linkedin.com/company/hack23/" target="_blank" rel="noopener noreferrer">Company LinkedIn</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">Public ISMS</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md" target="_blank" rel="noopener noreferrer">Security Policy</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Privacy_Policy.md" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
        <li><a href="mailto:info@hack23.com">Contact Us</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>${labels.languages}</h3>
      <div class="language-grid">
${ALL_LANG_CODES.map(l => {
  const display = LANG_DISPLAY[l];
  const ariaLabel = LANG_ARIA_LABELS[l];
  const href: string = l === 'en' ? '../index.html' : `../index_${l}.html`;
  return `        <a href="${href}" title="${display.name}" aria-label="${ariaLabel}"><span aria-hidden="true">${display.flag}</span> ${l.toUpperCase()}</a>`;
}).join('\n')}
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2008-<time datetime="2026">2026</time> <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a> (Org.nr 5595347807) | ${labels.location}</p>
  </div>
</footer>`;
}
