/**
 * cypress-axe shared configuration for WCAG 2.1 AA scans.
 *
 * This module is the single source of truth for:
 *   - The axe-core run options applied by `cypress/e2e/wcag-axe.cy.js`
 *   - Known-baseline accessibility violations that are temporarily
 *     accepted while remediation issues are tracked separately.
 *
 * Each entry in `KNOWN_VIOLATIONS` MUST include:
 *   - `id`        – the axe-core rule ID (e.g. 'color-contrast')
 *   - `reason`    – plain-English justification for the exception
 *   - `issue`     – link to the GitHub issue tracking remediation
 *   - `expires`   – ISO date after which CI should fail again to force
 *                   re-evaluation (kept short to avoid silent decay)
 *
 * Currently the list is empty — every WCAG 2.1 AA violation MUST fail CI.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * axe-core context selector.
 *
 * `null` means "scan the whole document". To exclude a third-party widget
 * that we cannot control, use the include/exclude shape from the axe-core
 * documentation, e.g.:
 *   exports.AXE_CONTEXT = { exclude: [['#third-party-iframe']] };
 */
export const AXE_CONTEXT = null;

/**
 * axe-core run options. Limit the scan to WCAG 2.1 A and AA rules so the
 * gate matches the platform's published accessibility commitment.
 */
export const AXE_RUN_OPTIONS = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
};

/**
 * Known baseline violations that are temporarily acknowledged.
 *
 * Add entries here ONLY with an accompanying GitHub issue. CI logs each
 * acknowledged rule so the exception remains visible to reviewers.
 *
 * @type {Array<{ id: string, reason: string, issue: string, expires: string }>}
 */
export const KNOWN_VIOLATIONS = [];

/**
 * Default callback used by `cy.checkA11y` to log a readable failure summary
 * before Cypress throws. Keeping this in one place ensures every spec
 * produces consistent output for triage. Uses `cy.log` so messages appear
 * in the Cypress command log alongside the failing assertion.
 *
 * @param {Array<object>} violations - axe-core violation objects
 */
export const logViolations = (violations) => {
  if (!violations || violations.length === 0) {
    return;
  }

  const acknowledged = new Set(KNOWN_VIOLATIONS.map((v) => v.id));

  violations.forEach((v) => {
    const status = acknowledged.has(v.id) ? 'KNOWN' : 'NEW';
    cy.log(`[axe][${status}] ${v.id} (${v.impact}): ${v.description}`);
    cy.log(`help: ${v.helpUrl}`);
    v.nodes.forEach((node) => {
      cy.log(`target: ${node.target.join(' ')}`);
      if (node.failureSummary) {
        cy.log(node.failureSummary);
      }
    });
  });
};
