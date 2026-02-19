/**
 * Tests for Plausible Analytics custom events (js/plausible-events.js).
 * Verifies that scroll depth milestones, Article Read, and Document Click
 * events are correctly dispatched via the window.plausible() queue function.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load script source for eval-based execution in jsdom context
const scriptSrc = readFileSync(
  resolve(__dirname, '../js/plausible-events.js'),
  'utf-8'
);

/**
 * Execute the IIFE in the current window context.
 * We reset window.plausible before each execution so tests are independent.
 */
function runScript() {
  // eslint-disable-next-line no-eval
  (new Function(scriptSrc))();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setScrollPosition(scrollTop, totalHeight = 2000) {
  Object.defineProperty(window, 'pageYOffset', { writable: true, configurable: true, value: scrollTop });
  Object.defineProperty(document.body, 'scrollHeight', { writable: true, configurable: true, value: totalHeight });
  Object.defineProperty(document.documentElement, 'scrollHeight', { writable: true, configurable: true, value: totalHeight });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 500 });
}

// ──────────────────────────────────────────────────────────────────────────────

describe('Plausible Analytics – plausible-events.js', () => {
  let plausibleCalls;

  beforeEach(() => {
    plausibleCalls = [];

    // Provide a spy for window.plausible
    window.plausible = vi.fn(function (...args) {
      plausibleCalls.push(args);
    });

    // Default: English article page
    document.documentElement.setAttribute('lang', 'en');
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        pathname: '/news/2026-02-13-evening-analysis-en.html',
        href: 'https://riksdagsmonitor.com/news/2026-02-13-evening-analysis-en.html'
      }
    });

    setScrollPosition(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.body.innerHTML = '';
    delete window.plausible;
  });

  // ─── Plausible polyfill ────────────────────────────────────────────────────

  describe('Plausible polyfill', () => {
    it('should preserve an existing window.plausible function', () => {
      const original = vi.fn();
      window.plausible = original;
      runScript();
      expect(window.plausible).toBe(original);
    });

    it('should create a queue-based polyfill when window.plausible is absent', () => {
      delete window.plausible;
      runScript();
      expect(typeof window.plausible).toBe('function');
      window.plausible('test', { props: {} });
      expect(window.plausible.q).toBeDefined();
      expect(window.plausible.q.length).toBe(1);
    });
  });

  // ─── Language detection ────────────────────────────────────────────────────

  describe('Language detection', () => {
    it('should detect English from html[lang="en"]', () => {
      document.documentElement.setAttribute('lang', 'en');
      runScript();
      setScrollPosition(1600); // 75 %+
      window.dispatchEvent(new Event('scroll'));
      const articleRead = plausibleCalls.find(c => c[0] === 'Article Read');
      expect(articleRead).toBeDefined();
      expect(articleRead[1].props.language).toBe('en');
    });

    it('should detect Swedish from html[lang="sv"]', () => {
      document.documentElement.setAttribute('lang', 'sv');
      window.location = {
        pathname: '/news/2026-02-13-evening-analysis-sv.html',
        href: 'https://riksdagsmonitor.com/news/2026-02-13-evening-analysis-sv.html'
      };
      runScript();
      setScrollPosition(1600);
      window.dispatchEvent(new Event('scroll'));
      const articleRead = plausibleCalls.find(c => c[0] === 'Article Read');
      expect(articleRead).toBeDefined();
      expect(articleRead[1].props.language).toBe('sv');
    });

    it('should fall back to "en" when lang attribute is missing', () => {
      document.documentElement.removeAttribute('lang');
      runScript();
      setScrollPosition(1600);
      window.dispatchEvent(new Event('scroll'));
      const articleRead = plausibleCalls.find(c => c[0] === 'Article Read');
      if (articleRead) {
        expect(articleRead[1].props.language).toBe('en');
      }
    });

    it('should strip locale suffix (e.g. "en-US" → "en")', () => {
      document.documentElement.setAttribute('lang', 'en-US');
      runScript();
      setScrollPosition(1600);
      window.dispatchEvent(new Event('scroll'));
      const articleRead = plausibleCalls.find(c => c[0] === 'Article Read');
      if (articleRead) {
        expect(articleRead[1].props.language).toBe('en');
      }
    });
  });

  // ─── Article type detection ────────────────────────────────────────────────

  describe('Article type detection', () => {
    const cases = [
      ['/news/2026-02-13-evening-analysis-en.html', 'evening-analysis'],
      ['/news/2026-02-14-committee-reports-en.html', 'committee-reports'],
      ['/news/2026-02-10-week-ahead-feb-10-17-en.html', 'week-ahead'],
      ['/news/2026-02-19-government-propositions-en.html', 'government-propositions'],
      ['/news/2026-02-19-opposition-motions-en.html', 'opposition-motions'],
      ['/news/2026-02-19-breaking-news-en.html', 'breaking-news'],
      ['/news/2026-02-19-some-article-en.html', 'article'],
    ];

    cases.forEach(([pathname, expectedType]) => {
      it(`should detect "${expectedType}" for path: ${pathname}`, () => {
        window.location = { pathname, href: `https://riksdagsmonitor.com${pathname}` };
        runScript();
        setScrollPosition(1600);
        window.dispatchEvent(new Event('scroll'));
        const articleRead = plausibleCalls.find(c => c[0] === 'Article Read');
        if (articleRead) {
          expect(articleRead[1].props.articleType).toBe(expectedType);
        }
      });
    });
  });

  // ─── Scroll depth milestones ───────────────────────────────────────────────

  describe('Scroll depth tracking', () => {
    it('should NOT fire Scroll Depth on non-article pages', () => {
      window.location = { pathname: '/index.html', href: 'https://riksdagsmonitor.com/index.html' };
      runScript();
      setScrollPosition(1600);
      window.dispatchEvent(new Event('scroll'));
      const scrollEvents = plausibleCalls.filter(c => c[0] === 'Scroll Depth');
      expect(scrollEvents.length).toBe(0);
    });

    it('should NOT fire Scroll Depth on news index page', () => {
      window.location = { pathname: '/news/index.html', href: 'https://riksdagsmonitor.com/news/index.html' };
      runScript();
      setScrollPosition(1600);
      window.dispatchEvent(new Event('scroll'));
      const scrollEvents = plausibleCalls.filter(c => c[0] === 'Scroll Depth');
      expect(scrollEvents.length).toBe(0);
    });

    it('should fire Scroll Depth 25% when scroll ≥ 25%', () => {
      runScript();
      // 25% of (2000 - 500) = 375px
      setScrollPosition(380);
      window.dispatchEvent(new Event('scroll'));
      const ev = plausibleCalls.find(c => c[0] === 'Scroll Depth' && c[1].props.scrollDepth === '25%');
      expect(ev).toBeDefined();
    });

    it('should fire Scroll Depth 50% when scroll ≥ 50%', () => {
      runScript();
      setScrollPosition(800);
      window.dispatchEvent(new Event('scroll'));
      const ev = plausibleCalls.find(c => c[0] === 'Scroll Depth' && c[1].props.scrollDepth === '50%');
      expect(ev).toBeDefined();
    });

    it('should fire Scroll Depth 75% when scroll ≥ 75%', () => {
      runScript();
      setScrollPosition(1150);
      window.dispatchEvent(new Event('scroll'));
      const ev = plausibleCalls.find(c => c[0] === 'Scroll Depth' && c[1].props.scrollDepth === '75%');
      expect(ev).toBeDefined();
    });

    it('should fire Scroll Depth 100% when scroll reaches 100%', () => {
      runScript();
      setScrollPosition(1500);
      window.dispatchEvent(new Event('scroll'));
      const ev = plausibleCalls.find(c => c[0] === 'Scroll Depth' && c[1].props.scrollDepth === '100%');
      expect(ev).toBeDefined();
    });

    it('should NOT fire the same milestone twice', () => {
      runScript();
      setScrollPosition(380);
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      const events25 = plausibleCalls.filter(
        c => c[0] === 'Scroll Depth' && c[1].props.scrollDepth === '25%'
      );
      expect(events25.length).toBe(1);
    });

    it('should fire multiple milestones in a single scroll jump', () => {
      runScript();
      setScrollPosition(1500); // 100%
      window.dispatchEvent(new Event('scroll'));
      const depths = plausibleCalls
        .filter(c => c[0] === 'Scroll Depth')
        .map(c => c[1].props.scrollDepth);
      expect(depths).toContain('25%');
      expect(depths).toContain('50%');
      expect(depths).toContain('75%');
      expect(depths).toContain('100%');
    });
  });

  // ─── Article Read event ────────────────────────────────────────────────────

  describe('Article Read event', () => {
    it('should fire Article Read once when 75% is reached', () => {
      runScript();
      setScrollPosition(1150);
      window.dispatchEvent(new Event('scroll'));
      const events = plausibleCalls.filter(c => c[0] === 'Article Read');
      expect(events.length).toBe(1);
    });

    it('should NOT fire Article Read twice even after scrolling further', () => {
      runScript();
      setScrollPosition(1150);
      window.dispatchEvent(new Event('scroll'));
      setScrollPosition(1400);
      window.dispatchEvent(new Event('scroll'));
      const events = plausibleCalls.filter(c => c[0] === 'Article Read');
      expect(events.length).toBe(1);
    });

    it('should include language and articleType props in Article Read', () => {
      document.documentElement.setAttribute('lang', 'sv');
      window.location = {
        pathname: '/news/2026-02-14-committee-reports-sv.html',
        href: 'https://riksdagsmonitor.com/news/2026-02-14-committee-reports-sv.html'
      };
      runScript();
      setScrollPosition(1150);
      window.dispatchEvent(new Event('scroll'));
      const ev = plausibleCalls.find(c => c[0] === 'Article Read');
      expect(ev).toBeDefined();
      expect(ev[1].props.language).toBe('sv');
      expect(ev[1].props.articleType).toBe('committee-reports');
    });
  });

  // ─── Document Link Click event ─────────────────────────────────────────────

  describe('Document Click event', () => {
    it('should fire Document Click when a .document-link is clicked', () => {
      document.body.innerHTML = '<a class="document-link" data-doc-id="H901AU1" href="#">Doc</a>';
      runScript();
      document.querySelector('.document-link').click();
      const ev = plausibleCalls.find(c => c[0] === 'Document Click');
      expect(ev).toBeDefined();
    });

    it('should include documentId from data-doc-id attribute', () => {
      document.body.innerHTML = '<a class="document-link" data-doc-id="H901AU1" href="#">Doc</a>';
      runScript();
      document.querySelector('.document-link').click();
      const ev = plausibleCalls.find(c => c[0] === 'Document Click');
      expect(ev[1].props.documentId).toBe('H901AU1');
    });

    it('should send empty documentId when data-doc-id is missing', () => {
      document.body.innerHTML = '<a class="document-link" href="#">Doc without ID</a>';
      runScript();
      document.querySelector('.document-link').click();
      const ev = plausibleCalls.find(c => c[0] === 'Document Click');
      expect(ev[1].props.documentId).toBe('');
    });

    it('should NOT fire Document Click for non-document-link elements', () => {
      document.body.innerHTML = '<a class="back-to-news" href="index.html">Back</a>';
      runScript();
      document.querySelector('.back-to-news').click();
      const ev = plausibleCalls.find(c => c[0] === 'Document Click');
      expect(ev).toBeUndefined();
    });

    it('should include language and articleType in Document Click props', () => {
      // Set lang and location BEFORE running the script so the IIFE captures correct values
      document.documentElement.setAttribute('lang', 'de');
      window.location = {
        pathname: '/news/2026-02-14-committee-reports-de.html',
        href: 'https://riksdagsmonitor.com/news/2026-02-14-committee-reports-de.html'
      };
      document.body.innerHTML = '<a class="document-link" data-doc-id="H123" href="#">Doc</a>';
      runScript();
      document.querySelector('.document-link').click();
      // Filter for events fired by THIS test's IIFE instance (lang='de')
      const events = plausibleCalls.filter(
        c => c[0] === 'Document Click' && c[1].props.language === 'de'
      );
      expect(events.length).toBeGreaterThan(0);
      expect(events[0][1].props.articleType).toBe('committee-reports');
    });
  });
});
