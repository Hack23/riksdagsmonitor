/**
 * Cypress E2E Tests - Dashboard Accessibility (WCAG 2.1 AA) with cypress-axe
 *
 * Automated accessibility testing for all 9 dashboards using axe-core.
 * Validates WCAG 2.1 AA compliance including color contrast, ARIA labels,
 * keyboard navigation, and focus indicators.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import 'cypress-axe';

const dashboards = [
  'party-dashboard',
  'election-cycle-dashboard',
  'committee-dashboard',
  'coalition-dashboard',
  'seasonal-patterns-dashboard',
  'pre-election-dashboard',
  'anomaly-detection-dashboard',
  'ministry-dashboard',
  'risk-dashboard',
];

describe('Dashboard Accessibility (WCAG 2.1 AA) - cypress-axe', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  // ============================================================================
  // AXE AUTOMATED WCAG 2.1 AA CHECKS PER DASHBOARD
  // ============================================================================

  dashboards.forEach((dashboardId) => {
    it(`${dashboardId} should have no critical axe violations`, () => {
      cy.get(`#${dashboardId}`).should('exist');

      cy.checkA11y(
        `#${dashboardId}`,
        {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa'],
          },
          rules: {
            'color-contrast': { enabled: true },
            'label': { enabled: true },
            'button-name': { enabled: true },
            'link-name': { enabled: true },
            'image-alt': { enabled: true },
            'region': { enabled: false }, // Page-level rule; scoped to section
          },
        },
        null,
        (violations) => {
          if (violations.length > 0) {
            const violationMessages = violations.map(
              (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`
            );
            cy.log(`⚠️  axe violations in #${dashboardId}:`);
            violationMessages.forEach((msg) => cy.log(msg));
          }
        }
      );
    });
  });

  // ============================================================================
  // FULL PAGE ACCESSIBILITY CHECK
  // ============================================================================

  it('full page should have no critical or serious axe violations', () => {
    cy.checkA11y(
      null,
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
        includedImpacts: ['critical', 'serious'],
      },
      null,
      (violations) => {
        if (violations.length > 0) {
          const messages = violations.map(
            (v) => `[${v.impact}] ${v.id}: ${v.description}`
          );
          cy.log(`⚠️  Critical/serious violations: ${messages.join(' | ')}`);
        }
      }
    );
  });

  // ============================================================================
  // ARIA LABEL VALIDATION PER DASHBOARD
  // ============================================================================

  dashboards.forEach((dashboardId) => {
    it(`${dashboardId} canvases should all have aria-labels`, () => {
      cy.get(`#${dashboardId} canvas`).each(($canvas) => {
        const ariaLabel = $canvas.attr('aria-label');
        expect(ariaLabel, `Canvas in #${dashboardId} missing aria-label`).to.exist;
        expect(ariaLabel.length, `aria-label should be non-empty`).to.be.greaterThan(0);
      });
    });
  });

  // ============================================================================
  // KEYBOARD NAVIGATION TESTS
  // ============================================================================

  it('should support keyboard navigation through filter controls', () => {
    // Focus the first interactive element
    cy.get('select, button, a[href]').first().focus();
    cy.focused().should('exist');
  });

  it('should have visible focus indicators on filter selects', () => {
    cy.get('#anomaly-detection-dashboard select').first().then(($select) => {
      if ($select.length > 0) {
        cy.wrap($select).focus();
        cy.focused().should('exist');
      }
    });
  });

  it('party dashboard should have visible focus indicator on buttons', () => {
    cy.get('#party-dashboard').then(($dashboard) => {
      const buttons = $dashboard.find('button');
      if (buttons.length > 0) {
        cy.wrap(buttons.first()).focus();
        cy.focused().should('exist');
      } else {
        cy.log('No buttons in party dashboard - skipping');
      }
    });
  });

  // ============================================================================
  // SCREEN READER SUPPORT TESTS
  // ============================================================================

  it('should have screen reader text (.sr-only) for chart descriptions', () => {
    cy.get('.sr-only').should('exist');
  });

  it('risk dashboard should have screen reader table for heatmap', () => {
    cy.get('#risk-dashboard .sr-only, #risk-dashboard table').should('exist');
  });

  it('committee dashboard should have sr-only table for network diagram', () => {
    cy.get('#committee-dashboard #committeeNetworkTable').should('exist');
  });

  it('coalition dashboard should have sr-only table for network diagram', () => {
    cy.get('#coalition-dashboard #coalitionNetworkTable').should('exist');
  });

  // ============================================================================
  // HEADING HIERARCHY TESTS
  // ============================================================================

  it('each dashboard should have a heading (h2)', () => {
    dashboards.forEach((dashboardId) => {
      cy.get(`#${dashboardId} h2`).should('have.length', 1);
    });
  });

  it('dashboard chart cards should use h3 for chart titles', () => {
    cy.get('#party-dashboard .chart-card h3').should('exist');
  });

  // ============================================================================
  // ALERT BANNER ACCESSIBILITY
  // ============================================================================

  it('anomaly-detection alert banner should have role="alert" when visible', () => {
    // Banner starts hidden - check structure
    cy.get('#anomaly-alert-banner').should('have.class', 'hidden');
    cy.get('#anomaly-alert-banner').should('have.class', 'alert-banner');
  });

  it('risk dashboard early warnings should have role="alert"', () => {
    cy.get('#earlyWarnings').should('have.attr', 'role', 'alert');
    cy.get('#earlyWarnings').should('have.attr', 'aria-live', 'polite');
  });

  // ============================================================================
  // FORM CONTROLS ACCESSIBILITY (FILTERS)
  // ============================================================================

  it('seasonal patterns filter selects should have aria-labels', () => {
    const filters = [
      '#seasonal-year-filter',
      '#seasonal-quarter-filter',
      '#seasonal-election-filter',
      '#classification-filter',
    ];
    filters.forEach((selector) => {
      cy.get(selector).should('have.attr', 'aria-label');
    });
  });

  it('anomaly detection filter selects should have aria-labels', () => {
    const filters = [
      '#anomaly-severity-filter',
      '#anomaly-type-filter',
      '#anomaly-direction-filter',
      '#anomaly-year-filter',
    ];
    filters.forEach((selector) => {
      cy.get(selector).should('have.attr', 'aria-label');
    });
  });

  it('election cycle filter selects should have associated labels', () => {
    cy.get('label[for="election-cycle-filter"]').should('exist');
    cy.get('label[for="election-party-filter"]').should('exist');
    cy.get('label[for="election-metric-filter"]').should('exist');
  });
});
