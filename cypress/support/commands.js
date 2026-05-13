/**
 * Cypress Custom Commands
 * 
 * Reusable commands for E2E testing
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Wait for dashboard to load
 */
Cypress.Commands.add('waitForDashboard', (dashboardId) => {
  cy.get(`#${dashboardId}`).should('be.visible');
  cy.get(`#${dashboardId} canvas, #${dashboardId} svg`).should('exist');
});

/**
 * Check accessibility
 */
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('[role]').should('have.attr', 'role');
  cy.get('img').should('have.attr', 'alt');
  cy.get('canvas[role="img"]').should('have.attr', 'aria-label');
});

/**
 * Test responsive design at different viewports
 */
Cypress.Commands.add('testResponsive', (selector) => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 720, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' }
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    cy.get(selector).should('be.visible');
  });
});

/**
 * Wait for Chart.js to render
 *
 * Verifies that:
 *   1. The canvas exists and is visible
 *   2. The bundled `main.ts` actually executed and Chart.js attached a
 *      chart instance to the canvas (`Chart.getChart(canvas)` returns
 *      truthy). A bare `canvas.width > 0` check is NOT sufficient — the
 *      default canvas dimensions are 300×150 even when no JS has run,
 *      so it would pass even when `<script src="/src/browser/main.ts">`
 *      404s in production (the bug fixed in this PR).
 */
Cypress.Commands.add('waitForChart', (canvasId) => {
  cy.get(`#${canvasId}`).should('be.visible');
  // Wait for Chart.js to attach an instance — proves main.ts loaded,
  // the lazy dashboard module was imported, CSV data was fetched, and
  // a chart was actually drawn (not just a default-sized empty canvas).
  cy.window({ timeout: 10000 }).should((win) => {
    const Chart = win.Chart;
    expect(Chart, 'window.Chart from main.ts bundle').to.exist;
    const canvas = win.document.getElementById(canvasId);
    expect(canvas, `<canvas id="${canvasId}">`).to.exist;
    const instance = Chart.getChart(canvas);
    expect(instance, `Chart.js instance attached to #${canvasId}`).to.exist;
  });
});

/**
 * Strong per-chart data validation.
 *
 * Goes beyond `waitForChart` by asserting that the rendered Chart.js
 * instance actually has data flowing through it (a real CSV was
 * fetched, parsed, and mapped onto chart datasets). This catches the
 * silent-failure mode where Chart.js is loaded but the dashboard
 * loader threw before populating the chart — leaving an empty axis.
 *
 * @param {string} canvasId  - HTML id of the <canvas>
 * @param {object} [opts]
 * @param {number} [opts.minDatasets=1] - minimum number of datasets
 * @param {number} [opts.minDataPoints=1] - minimum total data points
 *                                          across all datasets
 * @param {string} [opts.chartType] - optional expected Chart.js type
 *                                    (`bar`, `line`, `doughnut`, …)
 */
Cypress.Commands.add('expectChartHasData', (canvasId, opts = {}) => {
  const minDatasets = opts.minDatasets ?? 1;
  const minDataPoints = opts.minDataPoints ?? 1;
  cy.get(`#${canvasId}`).should('be.visible');
  cy.window({ timeout: 15000 }).should((win) => {
    const Chart = win.Chart;
    expect(Chart, `window.Chart attached for #${canvasId}`).to.exist;
    const canvas = win.document.getElementById(canvasId);
    expect(canvas, `<canvas id="${canvasId}">`).to.exist;
    const instance = Chart.getChart(canvas);
    expect(instance, `Chart.js instance on #${canvasId}`).to.exist;

    if (opts.chartType) {
      expect(instance.config.type, `Chart type for #${canvasId}`).to.equal(opts.chartType);
    }

    const datasets = (instance.data && instance.data.datasets) || [];
    expect(datasets.length, `datasets on #${canvasId}`).to.be.gte(minDatasets);

    const totalPoints = datasets.reduce((sum, ds) => {
      const arr = Array.isArray(ds.data) ? ds.data : [];
      return sum + arr.length;
    }, 0);
    expect(totalPoints, `total data points across datasets on #${canvasId}`).to.be.gte(
      minDataPoints,
    );
  });
});

/**
 * Wait for D3 visualization to render
 */
Cypress.Commands.add('waitForD3', (containerId) => {
  cy.get(`#${containerId} svg`).should('exist');
  // Wait for SVG to have actual content (elements)
  cy.get(`#${containerId} svg`).should(($svg) => {
    expect($svg.children().length).to.be.greaterThan(0);
  });
});

/**
 * Strong D3 visualization validation: asserts that the container
 * holds an <svg> with renderable child shapes (rect/circle/path/g
 * descendants), proving D3 actually loaded data and bound it.
 *
 * @param {string} containerId
 * @param {object} [opts]
 * @param {number} [opts.minChildren=1]
 * @param {number} [opts.minShapes=0] minimum rect/circle/path nodes
 */
Cypress.Commands.add('expectD3Rendered', (containerId, opts = {}) => {
  const minChildren = opts.minChildren ?? 1;
  const minShapes = opts.minShapes ?? 0;
  cy.window({ timeout: 15000 }).should((win) => {
    expect(win.d3, 'window.d3 attached by register-globals').to.exist;
  });
  cy.get(`#${containerId}`).scrollIntoView();
  cy.get(`#${containerId} svg`, { timeout: 15000 }).should(($svg) => {
    expect($svg.length, `<svg> rendered under #${containerId}`).to.be.gte(1);
    expect($svg[0].children.length, `<svg> children for #${containerId}`).to.be.gte(minChildren);
    if (minShapes > 0) {
      const shapes = $svg[0].querySelectorAll('rect, circle, path, line, text');
      expect(shapes.length, `shape nodes under #${containerId}`).to.be.gte(minShapes);
    }
  });
});

/**
 * Assert a stat-card element has been populated with a real value
 * (not a placeholder like `—`, `--`, `…`, or `Loading…`).
 *
 * @param {string} elementId
 * @param {RegExp} [pattern] optional regex the populated text must match
 */
Cypress.Commands.add('expectStatPopulated', (elementId, pattern) => {
  cy.get(`#${elementId}`, { timeout: 15000 }).should(($el) => {
    const text = ($el.text() || '').trim();
    expect(text.length, `#${elementId} populated`).to.be.gte(1);
    expect(text, `#${elementId} not a placeholder`).not.to.match(
      /^(?:—|-+|…|\.{3}|loading\b|laddar\b|N\/A|--)$/i,
    );
    if (pattern) {
      expect(text, `#${elementId} matches ${pattern}`).to.match(pattern);
    }
  });
});

/**
 * Wait until window.Chart and (optionally) window.d3 have been
 * registered by the cia-entry/main-bundle bootstrap. Use this BEFORE
 * any chart-specific assertion to fail fast when a tree-shaking
 * regression silently drops Chart.js from the bundle (the bug fixed
 * in this PR).
 */
Cypress.Commands.add('waitForGlobals', (opts = {}) => {
  const needD3 = opts.d3 !== false;
  const needPapa = opts.papa !== false;
  cy.window({ timeout: 15000 }).should((win) => {
    expect(win.Chart, 'window.Chart registered by bundle').to.exist;
    if (needD3) {
      expect(win.d3, 'window.d3 registered by bundle').to.exist;
    }
    if (needPapa) {
      expect(win.Papa, 'window.Papa registered by bundle').to.exist;
    }
  });
});

/**
 * Visit a dashboard page (`/dashboards/<slug>.html` or
 * `/dashboard/index.html` for the CIA hub) AND scroll the dashboard
 * container into view so the IntersectionObserver-based lazy loader
 * (main.ts → loadDashboard) fires. Required before `waitForChart` on
 * any /dashboards/* spec page because charts are below the fold in
 * headless 1280×720.
 *
 * @param {string} path  full URL path (e.g. `/dashboards/parties.html`)
 * @param {string} containerId dashboard root container to scroll into view
 */
Cypress.Commands.add('visitDashboard', (path, containerId) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      const consoleErrors = [];
      const originalError = win.console.error.bind(win.console);
      win.__rdmConsoleErrors = consoleErrors;
      cy.stub(win.console, 'error')
        .callsFake((...args) => {
          consoleErrors.push(args);
          originalError(...args);
        })
        .as('consoleError');
    },
  });
  if (containerId) {
    cy.get(`#${containerId}`, { timeout: 15000 }).should('exist').scrollIntoView();
  }
});

function formatConsoleArg(arg) {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}`;
  }
  if (typeof arg === 'string') {
    return arg;
  }
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

Cypress.Commands.add('assertNoConsoleErrors', () => {
  cy.window().then((win) => {
    const messages = (win.__rdmConsoleErrors || []).map((args) =>
      args.map(formatConsoleArg).join(' '),
    );
    expect(messages, 'dashboard console.error messages').to.deep.equal([]);
  });
});

/**
 * Assert no severity-`error` console messages were emitted while
 * loading a dashboard. Pair with `cy.visit(...,{onBeforeLoad})` to
 * stub `console.error` if you need to enforce zero-error budgets.
 */
Cypress.Commands.add('stubConsoleError', () => {
  cy.visit('/', {
    onBeforeLoad(win) {
      cy.stub(win.console, 'error').as('consoleError');
    },
  });
});

/**
 * Intercept and stub API calls
 */
Cypress.Commands.add('stubCIAData', () => {
  cy.intercept('GET', '**/cia-data/**/*.csv', {
    statusCode: 200,
    body: 'Year,Quarter,Ballot\n2024,Q1,1000\n2024,Q2,1100'
  }).as('ciaData');
  
  cy.intercept('GET', '**/raw.githubusercontent.com/**', {
    statusCode: 200,
    body: 'Year,Quarter,Ballot\n2024,Q1,1000\n2024,Q2,1100'
  }).as('githubData');
});

/**
 * Test language switcher
 */
Cypress.Commands.add('switchLanguage', (langCode) => {
  cy.get(`a[href*="index_${langCode}.html"]`).click();
  cy.url().should('include', `index_${langCode}.html`);
});

/**
 * Check for console errors
 */
Cypress.Commands.add('checkConsoleErrors', () => {
  cy.window().then((win) => {
    cy.spy(win.console, 'error');
  });
});

/**
 * Test back-to-top button
 */
Cypress.Commands.add('testBackToTop', () => {
  cy.scrollTo('bottom');
  cy.wait(500);
  cy.get('.back-to-top').should('be.visible');
  cy.get('.back-to-top').click();
  cy.window().its('scrollY').should('equal', 0);
});
