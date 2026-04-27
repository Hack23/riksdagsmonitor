/**
 * Cypress E2E Tests - Automated WCAG 2.1 AA accessibility scan.
 *
 * Uses axe-core via cypress-axe to catch accessibility violations that
 * the structural checks in `accessibility.cy.js` cannot detect:
 *   - colour contrast (WCAG SC 1.4.3 / 1.4.11)
 *   - ARIA role correctness and required attributes
 *   - landmark region completeness
 *   - interactive element name calculation
 *   - link purpose in context
 *   - form error identification
 *   - status messages (ARIA live regions)
 *
 * Runs on every PR via the homepage test workflow as part of
 * `cypress:run:critical`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { AXE_CONTEXT, AXE_RUN_OPTIONS, logViolations } from '../axe-config.js';

const PAGES = [
  { url: '/', name: 'Homepage (EN)', lang: 'en' },
  { url: '/index_sv.html', name: 'Homepage (SV)', lang: 'sv' },
  { url: '/index_ar.html', name: 'Homepage (AR, RTL)', lang: 'ar', dir: 'rtl' },
  { url: '/index_he.html', name: 'Homepage (HE, RTL)', lang: 'he', dir: 'rtl' },
  { url: '/politician-dashboard.html', name: 'Politician Dashboard (EN)', lang: 'en' },
];

describe('WCAG 2.1 AA — axe-core automated scan', () => {
  PAGES.forEach(({ url, name, lang, dir }) => {
    it(`should have no WCAG 2.1 AA violations on ${name}`, () => {
      cy.visit(url);

      // Confirm the page advertises the expected language/direction so the
      // scan is meaningful (axe inspects lang for some rules).
      cy.get('html').should('have.attr', 'lang', lang);
      if (dir === 'rtl') {
        cy.get('html').should('have.attr', 'dir', 'rtl');
      }

      cy.injectAxe();
      cy.checkA11y(AXE_CONTEXT, AXE_RUN_OPTIONS, logViolations);
    });
  });
});
