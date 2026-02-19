/**
 * @module Infrastructure/Analytics
 * @category Infrastructure
 *
 * @title Plausible Analytics Custom Events - Privacy-Focused Engagement Tracking
 *
 * @description
 * Privacy-focused analytics custom event tracking for Riksdagsmonitor news articles.
 * Uses Plausible Analytics — a GDPR-compliant, cookie-free, lightweight analytics
 * platform that requires no consent banner and collects no personally identifiable
 * information (PII).
 *
 * **PRIVACY PRINCIPLES:**
 * - No cookies are used
 * - No personal data collected
 * - No cross-site tracking
 * - Fully GDPR-compliant (no consent required)
 * - Data processed on EU infrastructure
 *
 * **TRACKED EVENTS:**
 * 1. Scroll depth milestones (25 %, 50 %, 75 %, 100 %)
 * 2. Article Read (fires once when user reaches 75 % scroll depth)
 * 3. Document Link Click (when a `.document-link` is clicked)
 * 4. Language detected from `<html lang="...">` attribute
 * 5. Article type inferred from URL pattern
 *
 * **CUSTOM PROPERTIES sent with each event:**
 * - `language`    : ISO 639-1 code from `<html lang>` (e.g. "en", "sv")
 * - `articleType` : "evening-analysis" | "committee-reports" | "week-ahead" |
 *                   "government-propositions" | "opposition-motions" |
 *                   "breaking-news" | "article"
 * - `scrollDepth` : "25%", "50%", "75%", "100%" (scroll events only)
 * - `documentId`  : value of `data-doc-id` attribute (document click events only)
 *
 * **IMPLEMENTATION NOTES:**
 * The Plausible script is loaded with `defer`; this module queues events via the
 * standard `window.plausible.q` fallback so no events are lost during script load.
 *
 * @gdpr Cookie-Free Analytics
 * - No personal data
 * - No tracking cookies
 * - No cross-site requests
 * - No fingerprinting
 * - GDPR Article 6(1)(f) legitimate interest basis
 *
 * @security Analytics Integrity
 * - External plausible.io script loaded with `defer` (non-blocking)
 * - No eval or dynamic code execution
 * - No storage of user data
 * - Events contain only non-identifying metadata
 *
 * @author Hack23 AB
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2026-02-19
 * @see https://plausible.io/docs/custom-event-goals (Plausible Custom Events)
 * @see https://plausible.io/docs/goal-conversions (Goal Conversions)
 */
(function () {
  'use strict';

  /**
   * Plausible event queue polyfill.
   * Allows events to be tracked even before the external Plausible script has
   * finished loading (because it is loaded with `defer`).
   * @type {Function}
   */
  window.plausible =
    window.plausible ||
    function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Detect the current page language from the `<html lang>` attribute.
   * Falls back to 'en' when absent or malformed.
   * @returns {string} ISO 639-1 language code.
   */
  function detectLanguage() {
    var lang = document.documentElement.getAttribute('lang');
    return lang ? lang.split('-')[0].toLowerCase() : 'en';
  }

  /**
   * Infer the article type from the URL pathname.
   * @returns {string} Article type label.
   */
  function detectArticleType() {
    var path = window.location.pathname;
    if (path.indexOf('evening-analysis') !== -1) return 'evening-analysis';
    if (path.indexOf('committee-reports') !== -1) return 'committee-reports';
    if (path.indexOf('week-ahead') !== -1) return 'week-ahead';
    if (path.indexOf('government-propositions') !== -1) return 'government-propositions';
    if (path.indexOf('opposition-motions') !== -1) return 'opposition-motions';
    if (path.indexOf('breaking-news') !== -1) return 'breaking-news';
    return 'article';
  }

  /** @type {string} */
  var language = detectLanguage();

  /** @type {string} */
  var articleType = detectArticleType();

  // ─── Scroll Depth Tracking ────────────────────────────────────────────────

  /** Milestones already fired in this page view (avoids duplicate events). */
  var depthFired = {};

  /** Set to true once the "Article Read" (75 %) event has fired. */
  var articleReadFired = false;

  /**
   * Calculate the user's current scroll progress as a percentage (0–100).
   * @returns {number} Scroll percentage.
   */
  function getScrollPercent() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var docHeight =
      Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      ) - window.innerHeight;
    if (docHeight <= 0) return 100;
    return Math.min(Math.round((scrollTop / docHeight) * 100), 100);
  }

  /**
   * Handle scroll events: fire milestone events at 25, 50, 75, and 100 percent.
   * Also fires an "Article Read" event once when 75 % is reached.
   */
  function onScroll() {
    var pct = getScrollPercent();
    var milestones = [25, 50, 75, 100];

    milestones.forEach(function (milestone) {
      if (pct >= milestone && !depthFired[milestone]) {
        depthFired[milestone] = true;

        window.plausible('Scroll Depth', {
          props: {
            scrollDepth: milestone + '%',
            language: language,
            articleType: articleType
          }
        });

        // Article Read fires once at the 75 % milestone.
        if (milestone === 75 && !articleReadFired) {
          articleReadFired = true;
          window.plausible('Article Read', {
            props: {
              language: language,
              articleType: articleType
            }
          });
        }
      }
    });
  }

  // Only attach scroll tracking on article pages (not on index/sitemap pages).
  if (
    window.location.pathname.indexOf('/news/') !== -1 &&
    window.location.pathname.indexOf('/news/index') === -1
  ) {
    window.addEventListener('scroll', onScroll, { passive: true });
    // Fire immediately in case the user has already scrolled (e.g. anchor links).
    onScroll();
  }

  // ─── Document Link Click Tracking ─────────────────────────────────────────

  /**
   * Track clicks on parliamentary document links.
   * Elements with class `document-link` may carry a `data-doc-id` attribute
   * identifying the riksdag document (e.g. "H901AU1").
   */
  document.addEventListener('click', function (event) {
    /** @type {Element|null} */
    var target = event.target && event.target.closest
      ? event.target.closest('.document-link')
      : null;

    if (!target) return;

    var docId = target.getAttribute('data-doc-id') || '';

    window.plausible('Document Click', {
      props: {
        documentId: docId,
        language: language,
        articleType: articleType
      }
    });
  });

})();
