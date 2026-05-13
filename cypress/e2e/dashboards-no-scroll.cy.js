/**
 * Dedicated-page dashboard no-scroll regression suite.
 *
 * The per-chart suite (`cypress/e2e/dashboards-per-chart/`) is excellent at
 * validating that every chart on every dashboard page maps the CSV data
 * correctly — BUT it always calls `cy.visitDashboard(path, containerId)`,
 * which unconditionally `scrollIntoView()`s the dashboard container. That
 * scroll triggers the IntersectionObserver in `lazy-loader.ts` and
 * `register-globals.ts` runs, registering `window.Chart` / `window.d3` /
 * `window.Papa`.
 *
 * The live regression observed in production was the opposite scenario: a
 * user lands on `/dashboards/<name>.html` and the single dashboard section
 * sits ~1156 px below the fold of a 720 px viewport. With the previous
 * `rootMargin: '200px'`, the observer never fired without a user scroll →
 * Chart.js / D3 / PapaParse were never registered → all charts rendered
 * empty AND the error fallback shown to the user was misleading
 * ("Cannot access 'o' before initialization", "Unable to load risk
 * assessment data from CIA Platform"). The per-chart suite did not catch
 * this because it always scrolls.
 *
 * This suite *deliberately* does NOT scroll. It only asserts the
 * minimal contract that — when a user opens a dedicated dashboard page
 * without scrolling — the lazy bundle bootstraps within a reasonable
 * timeout. If this suite fails on `main`, the live site is broken for
 * users that land on a dashboard page and do not scroll within a few
 * seconds.
 *
 * @see src/browser/lazy-loader.ts (DEFAULT_ROOT_MARGIN = '2000px')
 * @author Hack23 AB
 * @license Apache-2.0
 */

const NO_SCROLL_PAGES = [
  '/dashboards/parties.html',
  '/dashboards/committees.html',
  '/dashboards/coalitions.html',
  '/dashboards/election-cycle.html',
  '/dashboards/seasonal-patterns.html',
  '/dashboards/pre-election.html',
  '/dashboards/anomaly-detection.html',
  '/dashboards/ministers.html',
  '/dashboards/risk.html',
];

describe('Dedicated dashboard pages — no-scroll lazy-load regression', () => {
  NO_SCROLL_PAGES.forEach((path) => {
    describe(path, () => {
      beforeEach(() => {
        // Fresh viewport, NO scrollIntoView, NO programmatic scroll. We
        // want to assert what a user actually sees on first paint.
        cy.viewport(1280, 720);
        cy.visit(path);
      });

      it('serves the hashed main-*.js bundle (no dev /src/browser/main.ts)', () => {
        cy.request(path).then((res) => {
          expect(res.status, `GET ${path}`).to.equal(200);
          expect(res.body, 'main-*.js bundle reference').to.match(
            /<script\b[^>]*type="module"[^>]*src="\/assets\/js\/main-[A-Za-z0-9_-]+\.js"/,
          );
          expect(res.body, 'no dev-only /src/browser/main.ts path').not.to.include(
            '/src/browser/main.ts',
          );
        });
      });

      it('registers window.Chart and window.d3 without any user scroll', () => {
        // The default rootMargin must be wide enough — or the eager-load
        // requestAnimationFrame fallback must fire — for the lazy loader
        // to bootstrap the chart libraries even though the dashboard
        // container sits ~1156 px below the 720 px viewport.
        //
        // 15 s allows for slow CI machines; the bootstrap normally fires
        // within ~200 ms on a warm cache.
        cy.window({ timeout: 15000 }).should((win) => {
          expect(win.Chart, 'window.Chart registered by lazy bundle').to.exist;
          expect(win.d3, 'window.d3 registered by lazy bundle').to.exist;
        });
        // Confirm no programmatic or test-induced scroll happened.
        cy.window().then((win) => {
          expect(win.scrollY, 'window.scrollY (no scroll occurred)').to.equal(0);
        });
      });

      it('does not show a visible error fallback on first paint', () => {
        // Visible error-message / [role="alert"] containers (excluding the
        // CIA hub's pre-baked, .hidden #error-state) indicate that a
        // dashboard's init() failed because globals were never registered
        // — the exact symptom of the live regression.
        cy.window({ timeout: 15000 }).should((win) => {
          expect(win.Chart, 'window.Chart registered first').to.exist;
        });
        cy.get('body').then(($body) => {
          // Look for visible error containers in the dashboard section.
          // Skip empty placeholders (e.g. risk.html's #earlyWarnings banner
          // which is `role="alert"` but contains no children until JS
          // populates it) — only fail on containers that actually render
          // user-visible error text.
          const $errors = $body
            .find('.error-message, [role="alert"]')
            .filter((_, el) => {
              const cs = window.getComputedStyle(el);
              if (cs.display === 'none' || cs.visibility === 'hidden') return false;
              const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
              return text.length > 0;
            });
          if ($errors.length > 0) {
            const messages = $errors
              .map((_, el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
              .get();
            throw new Error(
              `Visible error fallback rendered on ${path} without user scroll: ` +
                messages.join(' | '),
            );
          }
        });
      });
    });
  });
});
