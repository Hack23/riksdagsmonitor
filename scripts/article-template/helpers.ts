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
import type { WhatHappensNextItem, WinnersLosersEntry, FAQItem } from '../types/editorial.js';
import type { BreadcrumbLabels, FooterLabelSet } from '../types/content.js';
import {
  BREADCRUMB_TRANSLATIONS,
  FOOTER_LABELS,
  EVENT_CALENDAR_TITLES,
  WATCH_SECTION_TITLES,
  WHAT_HAPPENS_NEXT_TITLES,
  WINNERS_LOSERS_TITLES,
  FAQ_SECTION_TITLES,
  SIGNIFICANCE_LABELS,
  OUTCOME_LABELS,
  LOCALE_MAP,
  LANG_DISPLAY,
  SITE_FOOTER_LABELS,
  ALL_LANG_CODES,
  LANG_ARIA_LABELS,
  LANG_SWITCHER_ARIA_LABELS,
} from './constants.js';
import { PKG_VERSION } from '../shared/version.js';
import { escapeHtml } from '../html-utils.js';

/**
 * Map a language code to its BCP-47 hreflang value.
 * Norwegian files use the filename suffix 'no' but must be advertised as 'nb' (Bokmål) per BCP-47.
 */
export function hreflangCode(lang: string): string {
  return lang === 'no' ? 'nb' : lang;
}

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
  let result = htmlContent.replace(/<\/(ul|ol)>\s*<\/p>/g, '</$1>');

  // Strip empty paragraph tags (e.g. <p></p>, <p> </p>)
  result = result.replace(/<p>\s*<\/p>/g, '');

  return result;
}

/**
 * Known Swedish boilerplate phrases that leak from Riksdag API responses
 * into English article content. These are template/procedural text that
 * should be stripped when generating non-Swedish articles.
 */
const SWEDISH_BOILERPLATE_PATTERNS: readonly RegExp[] = [
  /Regeringen överlämnar denna proposition till riksdagen\.?/g,
  /Stockholm den \d{1,2} [a-zA-Z]+ \d{4}\.?/gi,
  /Propositionens huvudsakliga innehåll\.?/g,
  /Förslag till riksdagsbeslut\.?/g,
  /Riksdagen (avslår|bifaller) [^.]+\.?/g,
  /Ärendet är avslutat\.?/g,
];

/**
 * Strip known Swedish boilerplate phrases from non-Swedish content.
 * These phrases leak from Riksdag API responses and should not appear
 * in English or other non-Swedish articles.
 *
 * @param html - Article HTML content
 * @param lang - Target language code
 * @returns Content with Swedish boilerplate removed (for non-sv languages)
 */
export function stripSwedishBoilerplate(html: string, lang: string): string {
  if (lang === 'sv') return html;

  let result = html;
  for (const pattern of SWEDISH_BOILERPLATE_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result;
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
 * Generate "Watch Section" with key points.
 *
 * `WatchPoint.title` and `.description` are expected to be **pre-escaped HTML**
 * (or trusted HTML containing translation markers such as `svSpan()`).
 * Upstream producers (`extractWatchPoints()`) already call `escapeHtml()` and
 * may inject `<span data-translate>` markers.  AI-pipeline watch points are
 * plain text and must be escaped at the *call site* before passing them here
 * — see `generators.ts` deep-inspection path.
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
    return `    <a href="${baseSlug}-${l}.html" class="lang-link${active}" hreflang="${hreflangCode(l)}"${ariaCurrent}>${display.flag} ${display.name}</a>`;
  }).join('\n');
  const ariaLabel: string = LANG_SWITCHER_ARIA_LABELS[currentLang as Language] || LANG_SWITCHER_ARIA_LABELS.en;
  return `  <nav class="language-switcher" role="navigation" aria-label="${ariaLabel}">\n${links}\n  </nav>`;
}

/**
 * Generate the "What Happens Next" timeline section.
 *
 * Renders an ordered list of upcoming legislative pipeline dates with
 * significance indicators (high / medium / low).  Items with no `date` are
 * omitted.  The section has class `what-happens-next` so the quality enhancer
 * and Schema.org generator can locate it.
 *
 * @param items   - Ordered list of upcoming events
 * @param lang    - Article language (determines heading and label text)
 * @returns HTML `<section>` element string
 */
export function generateWhatHappensNextSection(
  items: ReadonlyArray<WhatHappensNextItem>,
  lang: Language = 'en',
): string {
  if (items.length === 0) return '';
  const title: string = WHAT_HAPPENS_NEXT_TITLES[lang] || WHAT_HAPPENS_NEXT_TITLES.en;
  const sigLabels = SIGNIFICANCE_LABELS[lang] || SIGNIFICANCE_LABELS.en;

  const VALID_SIGNIFICANCE = new Set(['high', 'medium', 'low']);

  const rows = items
    .filter(item => item.date && item.event)
    .map(item => {
      const significance = VALID_SIGNIFICANCE.has(item.significance) ? item.significance : 'medium';
      const sigClass = `significance-${significance}`;
      const sigLabel = sigLabels[significance];
      return `      <li class="timeline-item ${sigClass}">
        <time class="timeline-date" datetime="${escapeHtml(item.date)}">${escapeHtml(item.date)}</time>
        <span class="timeline-event">${escapeHtml(item.event)}</span>
        <span class="timeline-significance" aria-label="${escapeHtml(sigLabel)}">${escapeHtml(sigLabel)}</span>
      </li>`;
    })
    .join('\n');

  if (!rows) return '';

  return `
  <section class="what-happens-next" aria-label="${escapeHtml(title)}">
    <h2>${escapeHtml(title)}</h2>
    <ol class="timeline-list">
${rows}
    </ol>
  </section>`;
}

/**
 * Generate the "Winners & Losers" political analysis section.
 *
 * Each entry names an actor, classifies their outcome (wins / loses / mixed),
 * and provides a one-sentence evidence string.  The section has class
 * `winners-losers` so downstream validators can detect it.
 *
 * @param entries - Array of actor outcome entries
 * @param lang    - Article language
 * @returns HTML `<section>` element string
 */
export function generateWinnersLosersSection(
  entries: ReadonlyArray<WinnersLosersEntry>,
  lang: Language = 'en',
): string {
  if (entries.length === 0) return '';
  const title: string = WINNERS_LOSERS_TITLES[lang] || WINNERS_LOSERS_TITLES.en;
  const outcomeLabels = OUTCOME_LABELS[lang] || OUTCOME_LABELS.en;

  const VALID_OUTCOMES = new Set(['wins', 'loses', 'mixed']);

  const rows = entries
    .filter(e => e.actor && e.evidence)
    .map(e => {
      const outcome = VALID_OUTCOMES.has(e.outcome) ? e.outcome : 'mixed';
      const outcomeClass = `outcome-${outcome}`;
      const outcomeLabel = outcomeLabels[outcome];
      return `      <li class="wl-entry ${outcomeClass}">
        <span class="wl-actor">${escapeHtml(e.actor)}</span>
        <span class="wl-outcome">${escapeHtml(outcomeLabel)}</span>
        <span class="wl-evidence">${escapeHtml(e.evidence)}</span>
      </li>`;
    })
    .join('\n');

  if (!rows) return '';

  return `
  <section class="winners-losers" aria-label="${escapeHtml(title)}">
    <h2>${escapeHtml(title)}</h2>
    <ul class="wl-list">
${rows}
    </ul>
  </section>`;
}

/**
 * Generate the FAQ section HTML.
 *
 * Renders a `<section class="faq-section">` with question/answer pairs in a
 * definition-list structure.  This HTML is used for in-page display; the
 * matching Schema.org FAQPage structured data is emitted separately in
 * `generateArticleHTML`.
 *
 * @param items - Array of FAQ items
 * @param lang  - Article language
 * @returns HTML `<section>` element string (empty string if no items)
 */
export function generateFaqSection(
  items: ReadonlyArray<FAQItem>,
  lang: Language = 'en',
): string {
  if (items.length === 0) return '';
  const title: string = FAQ_SECTION_TITLES[lang] || FAQ_SECTION_TITLES.en;

  const pairs = items
    .filter(item => item.question && item.answer)
    .map(item => `    <div class="faq-item">
      <dt class="faq-question">${escapeHtml(item.question)}</dt>
      <dd class="faq-answer">${escapeHtml(item.answer)}</dd>
    </div>`)
    .join('\n');

  if (!pairs) return '';

  return `
  <section class="faq-section" aria-label="${escapeHtml(title)}">
    <h2>${escapeHtml(title)}</h2>
    <dl class="faq-list">
${pairs}
    </dl>
  </section>`;
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
      <a href="${homePath}" aria-label="Riksdagsmonitor Home">
        <img src="../images/riksdagsmonitor-logo.webp" alt="Riksdagsmonitor" class="footer-logo" width="80" height="80" loading="lazy">
      </a>
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
        <li><a href="${homePath}">${labels.home}</a></li>
        <li><a href="${newsPath}">${labels.news}</a></li>
        <li><a href="${dashboardPath}">${labels.dashboard}</a></li>
        <li><a href="https://www.hack23.com/cia" target="_blank" rel="noopener noreferrer">${labels.ciaplatform}</a></li>
        <li><a href="https://github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
        <li><a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">Sveriges Riksdag</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>${labels.builtBy}</h3>
      <p>${labels.builtByText}</p>
      <ul>
        <li><a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23.com</a></li>
        <li><a href="https://www.linkedin.com/company/hack23/" target="_blank" rel="noopener noreferrer">${labels.companyLinkedin}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">${labels.publicIsms}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md" target="_blank" rel="noopener noreferrer">${labels.securityPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Privacy_Policy.md" target="_blank" rel="noopener noreferrer">${labels.privacyPolicy}</a></li>
        <li><a href="mailto:info@hack23.com">${labels.contactUs}</a></li>
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
    <p>&copy; 2008-<time datetime="2026">2026</time> <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a> (Org.nr 5595347807) | ${labels.location} | v${escapeHtml(String(PKG_VERSION))}</p>
    <p class="footer-disclaimer">⚠️ ${labels.disclaimer} <a href="https://github.com/Hack23/riksdagsmonitor/issues" target="_blank" rel="noopener noreferrer">${labels.disclaimerLink}</a>.</p>
  </div>
</footer>`;
}
