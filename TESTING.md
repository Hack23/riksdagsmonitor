# Testing Strategy for Riksdagsmonitor

## 📋 Overview

Comprehensive testing strategy covering unit tests (Vitest), E2E tests (Cypress), data validation, accessibility, and performance for all 9 CIA intelligence dashboards.

## 🎯 Testing Objectives

1. **>80% Code Coverage** - All dashboard JavaScript modules
2. **Zero Test Skips** - Fail-fast principle (no conditionals)
3. **Comprehensive E2E Coverage** - All 9 dashboards × 14 languages
4. **Data Quality Assurance** - CIA CSV validation
5. **WCAG 2.1 AA Compliance** - Automated accessibility testing
6. **Performance Benchmarks** - Chart render time <500ms

## 🧪 Test Stack

| Framework | Purpose | Test Count |
|-----------|---------|------------|
| **Vitest** | Unit & Integration Tests | 1183+ tests |
| **Cypress** | E2E & Integration Tests | 150+ tests |
| **Playwright** | Visual Regression (planned) | TBD |
| **cypress-axe** | Accessibility Testing (planned) | TBD |

## 📂 Test Structure

```
tests/
├── csv-validation.test.js              # CIA CSV data validation
├── party-dashboard.test.js             # Party dashboard unit tests
├── risk-dashboard.test.js              # Risk dashboard unit tests (existing)
├── coalition-dashboard.test.js         # Coalition dashboard (existing)
├── committees-dashboard.test.js        # Committee dashboard (existing)
├── load-cia-stats.test.js              # CIA data loading (existing)
└── [... 27 more test files]            # News, sitemap, MCP, etc.

cypress/e2e/
├── all-dashboards.cy.js                # Comprehensive 9 dashboard tests
├── dashboards.cy.js                    # Individual dashboard tests (updated)
├── dashboard-page.cy.js                # Dashboard page tests (updated)
├── politician-dashboard.cy.js          # Politician-specific tests
├── accessibility.cy.js                 # WCAG 2.1 AA tests
├── homepage.cy.js                      # Homepage tests
├── multi-language-sanity.cy.js         # 14-language validation
├── news-articles.cy.js                 # News article tests
├── news-page.cy.js                     # News page tests
└── sitemap.cy.js                       # Sitemap tests
```

## 🔬 Unit Tests (Vitest)

### CSV Data Validation

**File**: `tests/csv-validation.test.js`

Validates CIA Platform CSV exports for data quality:

```javascript
describe('CIA CSV Data Validation', () => {
  // File existence (18 required files)
  it('should have distribution_politician_risk_levels.csv');
  
  // Encoding validation (UTF-8/ASCII, no � characters)
  it('should have valid UTF-8 encoding');
  
  // Structure validation (headers, delimiters, data rows)
  it('should have proper CSV structure');
  
  // Schema validation (required columns, data types)
  it('should have required columns');
  it('should have valid numeric data types');
  
  // Column consistency (handles quoted fields)
  it('should have consistent column counts');
  
  // Data freshness (warns at 30 days, fails at 90 days)
  it('CSV files should not be older than 90 days');
});
```

**Coverage**:
- ✅ 18 required CSV files validated
- ✅ UTF-8 encoding checks
- ✅ Schema validation with actual column names
- ✅ Numeric data type validation
- ✅ Data freshness warnings (30 days) and enforcement (90 days)

### Dashboard Unit Tests

**File**: `tests/party-dashboard.test.js`

Tests dashboard DOM structure and configuration:

```javascript
describe('Party Dashboard', () => {
  // Structure tests
  it('should have party dashboard container');
  it('should have dashboard title and description');
  
  // Chart canvas tests (4 charts)
  it('should have partyEffectivenessChart canvas');
  it('partyEffectivenessChart should have ARIA role and label');
  
  // Accessibility tests
  it('should have semantic HTML structure');
  it('all charts should have proper ARIA attributes');
  it('should have screen reader descriptions');
  
  // Configuration tests
  it('should support all 8 Swedish parties');
  it('should define party colors for Chart.js');
  
  // Responsive design
  it('should use dashboard-grid for responsive layout');
});
```

**Note**: Dashboard JavaScript files are browser-only IIFEs (not ES6 modules), so we test DOM structure and configuration rather than importing functions.

## 🌐 E2E Tests (Cypress)

### Comprehensive Dashboard Coverage

**File**: `cypress/e2e/all-dashboards.cy.js` (150+ tests)

Tests all 9 dashboards systematically:

```javascript
// Simplified example - actual implementation has specific chart IDs
const dashboards = [
  { id: 'party-dashboard', charts: 4, hasD3: false },
  { id: 'election-cycle-dashboard', charts: 4, hasD3: true, d3Container: 'decision-heatmap' },
  { id: 'committee-dashboard', charts: 3, hasD3: true, d3Container: 'committeeNetwork' },
  { id: 'coalition-dashboard', charts: 3, hasD3: true, d3Container: 'coalitionNetwork' },
  { id: 'seasonal-patterns-dashboard', charts: 4, hasD3: true, d3Container: 'seasonal-heatmap' },
  { id: 'pre-election-dashboard', charts: 4, hasD3: false },
  { id: 'anomaly-detection-dashboard', charts: 4, hasD3: true, d3Container: 'severity-heatmap' },
  { id: 'ministry-dashboard', charts: 3, hasD3: true, d3Container: 'ministryRiskHeatMap' },
  { id: 'risk-dashboard', charts: 4, hasD3: true, d3Container: 'riskHeatMap' }
];

dashboards.forEach(dashboard => {
  describe(dashboard.name, () => {
    it('should exist and be visible');
    it('should have dashboard heading');
    it('should not have error messages');
    it('should have data attribution');
    
    // Chart.js validation
    dashboard.charts.forEach(chartId => {
      it('should have ${chartId} canvas');
      it('${chartId} should have Chart.js render monitor class');
    });
    
    // D3.js validation (if applicable)
    if (dashboard.hasD3) {
      it('should render D3 SVG');
      it('SVG should have content');
    }
    
    // Accessibility
    it('should have ARIA labels on charts');
    it('should have screen reader descriptions');
    
    // Responsive design
    it('should be visible on mobile (375px)');
    it('should be visible on tablet (768px)');
    it('should be visible on desktop (1440px)');
  });
});
```

### Fail-Fast Principle

**Zero test skips or conditionals**. All tests fail immediately when features are missing:

```javascript
// ❌ OLD (fail-slow with conditionals)
cy.get('body').then(($body) => {
  const chartContainer = $body.find('#coalitionAlignmentChart');
  if (chartContainer.length > 0) {
    cy.get('#coalitionAlignmentChart').should('exist');
  } else {
    cy.log('Coalition alignment chart not found - skipping test');
  }
});

// ✅ NEW (fail-fast)
cy.get('#coalitionAlignmentChart').should('exist');
```

### Custom Cypress Commands

**File**: `cypress/support/commands.js`

Reusable commands for dashboard testing:

```javascript
// Wait for Chart.js to render
Cypress.Commands.add('waitForChart', (canvasId) => {
  cy.get(`#${canvasId}`).should('be.visible');
  cy.get(`#${canvasId}`).should(($canvas) => {
    expect($canvas[0].width).to.be.greaterThan(0);
    expect($canvas[0].height).to.be.greaterThan(0);
  });
});

// Wait for D3 visualization to render
Cypress.Commands.add('waitForD3', (containerId) => {
  cy.get(`#${containerId} svg`).should('exist');
  cy.get(`#${containerId} svg`).should(($svg) => {
    expect($svg.children().length).to.be.greaterThan(0);
  });
});

// Stub CIA data for testing
Cypress.Commands.add('stubCIAData', () => {
  cy.intercept('GET', '**/cia-data/**/*.csv', {
    statusCode: 200,
    body: 'Year,Quarter,Ballot\n2024,Q1,1000\n2024,Q2,1100'
  }).as('ciaData');
});

// Test responsive design
Cypress.Commands.add('testResponsive', (selector) => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 720, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' }
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.get(selector).should('be.visible');
  });
});
```

## 🎨 Visual Regression Tests (Planned)

**Tool**: Playwright

**Planned Coverage**:
- Baseline screenshots for all 9 dashboards
- Mobile view screenshots (375px)
- Tablet view screenshots (768px)
- Desktop view screenshots (1440px)
- RTL layout screenshots (Arabic, Hebrew)
- Chart rendering validation
- D3.js visualization validation

**Example**:
```javascript
test('party-dashboard should match baseline', async ({ page }) => {
  await page.goto('/');
  const dashboard = page.locator('#party-dashboard');
  
  // Wait for charts to render
  await page.waitForFunction(() => {
    const charts = document.querySelectorAll('.chartjs-render-monitor');
    return charts.length > 0;
  });
  
  // Take screenshot
  await expect(dashboard).toHaveScreenshot('party-dashboard.png', {
    maxDiffPixels: 100
  });
});
```

## ♿ Accessibility Tests (Planned)

**Tool**: cypress-axe

**Planned Coverage**:
- WCAG 2.1 AA automated validation
- Keyboard navigation tests
- Color contrast validation (4.5:1 minimum)
- ARIA label verification
- Screen reader compatibility

**Example**:
```javascript
import 'cypress-axe';

describe('Dashboard Accessibility (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });
  
  it('should have no accessibility violations', () => {
    cy.checkA11y();
  });
  
  it('should have sufficient color contrast', () => {
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });
  
  it('should have ARIA labels on all charts', () => {
    cy.get('canvas').each($canvas => {
      expect($canvas).to.have.attr('role', 'img');
      expect($canvas).to.have.attr('aria-label');
    });
  });
});
```

## ⚡ Performance Tests (Planned)

**Goals**:
- Chart render time < 500ms
- D3.js heatmap render < 1000ms (349 MPs × 45 rules)
- No memory leaks (10 renders without 50% memory growth)

**Example**:
```javascript
describe('Dashboard Performance', () => {
  it('should render party chart in < 500ms', async () => {
    const start = performance.now();
    await renderPartyEffectivenessChart(mockData);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(500);
  });
  
  it('should not leak memory after multiple renders', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 10; i++) {
      await renderAllDashboards();
      destroyAllCharts();
    }
    
    global.gc();
    const finalMemory = process.memoryUsage().heapUsed;
    
    expect(finalMemory).toBeLessThan(initialMemory * 1.5);
  });
});
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@5ef0c079ce82195b2a36a210272d6b661572d83e # v2.14.2
        with:
          egress-policy: audit
          
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: '24'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: actions/upload-artifact@6f51ac03b9356f520e9adb1b1b7802705f340c2b # v4.5.0
        with:
          name: coverage-report
          path: coverage/
  
  e2e-tests:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@5ef0c079ce82195b2a36a210272d6b661572d83e # v2.14.2
        with:
          egress-policy: audit
          
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run build
      - run: npm run cypress:run
      - uses: actions/upload-artifact@6f51ac03b9356f520e9adb1b1b7802705f340c2b # v4.5.0
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots/
```

### Coverage Reporting

**Coverage Reports Published to**:
- `docs/coverage/` - HTML coverage report
- `coverage/lcov.info` - LCOV format for badges
- `coverage/json` - JSON format for analysis

### Quality Gates

**All PRs must pass**:
- ✅ Unit tests (100% pass rate)
- ✅ E2E tests (100% pass rate)
- ✅ CSV data validation (all files valid)
- ✅ No test skips or conditionals
- ✅ >80% code coverage (target)

## 📊 Test Metrics

### Current Status (2026-02-18)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Unit Tests** | 1183 | >1000 | ✅ |
| **E2E Tests** | 150+ | >100 | ✅ |
| **CSV Validation** | 159 | 100% | ✅ |
| **Code Coverage** | ~30% | >80% | 🟡 |
| **Test Skips** | 0 | 0 | ✅ |
| **Dashboards Covered** | 9/9 | 9/9 | ✅ |
| **Languages Tested** | 1/14 | 14/14 | 🟡 |

### Test Execution Times

| Test Suite | Duration | Target |
|------------|----------|--------|
| Unit Tests (Vitest) | ~15s | <30s |
| E2E Tests (Cypress) | TBD | <5min |
| Visual Tests (Playwright) | TBD | <10min |

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test tests/csv-validation.test.js

# Run tests with coverage
npm run test:coverage

# Watch mode (interactive)
npm run test:watch

# UI mode (visual test runner)
npm run test:ui
```

### E2E Tests

```bash
# Run all E2E tests (headless)
npm run cypress:run

# Run specific test file
npm run cypress:run -- --spec "cypress/e2e/all-dashboards.cy.js"

# Open Cypress UI (interactive)
npm run cypress:open

# Run critical tests only
npm run cypress:run:critical

# Run with build (full integration)
npm run e2e
```

### Visual Regression Tests (Planned)

```bash
# Run visual tests
npm run playwright:test

# Update baselines
npm run playwright:test -- --update-snapshots

# Show report
npm run playwright:show-report
```

## 📝 Writing New Tests

### Unit Test Template

```javascript
import { describe, it, expect, beforeEach } from 'vitest';

describe('New Dashboard', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="new-dashboard">
        <!-- Dashboard HTML structure -->
      </section>
    `;
  });

  it('should have dashboard container', () => {
    const dashboard = document.getElementById('new-dashboard');
    expect(dashboard).toBeTruthy();
  });

  // Add more tests...
});
```

### E2E Test Template

```javascript
describe('New Dashboard E2E', () => {
  beforeEach(() => {
    cy.stubCIAData();
    cy.visit('/');
  });

  it('should display new dashboard', () => {
    cy.get('#new-dashboard').should('be.visible');
  });

  it('should render charts', () => {
    cy.get('#newChart').should('exist');
    cy.waitForChart('newChart');
  });

  // Add more tests...
});
```

## 🐛 Debugging Tests

### Unit Tests

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Run single test in watch mode
npm run test:watch tests/specific.test.js

# Use debugger
npm run test:ui  # Best for debugging
```

### E2E Tests

```bash
# Open Cypress UI for debugging
npm run cypress:open

# Run with video recording
npm run cypress:run  # Videos saved to cypress/videos/

# Run with screenshots on failure
# (enabled by default, saved to cypress/screenshots/)
```

## 📚 Best Practices

### ✅ DO

- **Write fail-fast tests** - No conditionals or skips
- **Test user behavior** - Focus on what users see/do
- **Use semantic selectors** - `cy.get('#dashboard')` not `cy.get('div.container')`
- **Validate accessibility** - ARIA labels, screen readers
- **Test responsive design** - Mobile, tablet, desktop
- **Validate data quality** - CSV structure, encoding, schemas
- **Mock external dependencies** - Stub CIA data
- **Keep tests independent** - Each test should work in isolation

### ❌ DON'T

- **Don't skip tests** - Fix the issue or remove the test
- **Don't use conditionals** - Tests should fail if feature missing
- **Don't test implementation details** - Test user-facing behavior
- **Don't hardcode IDs** - Use configuration arrays
- **Don't ignore accessibility** - WCAG 2.1 AA is mandatory
- **Don't test browser internals** - Focus on application logic
- **Don't use arbitrary waits** - Use proper wait commands

## 🔍 Test Coverage Goals

### Dashboard JavaScript Coverage (Target: >80%)

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| party-dashboard.js | ~20% | >80% | High |
| risk-dashboard.js | ~60% | >80% | Medium |
| coalition-dashboard.js | ~40% | >80% | High |
| committees-dashboard.js | ~50% | >80% | Medium |
| election-cycle-dashboard.js | ~10% | >80% | High |
| ministry-dashboard.js | ~10% | >80% | High |
| seasonal-patterns-dashboard.js | ~10% | >80% | Medium |
| pre-election-dashboard.js | ~10% | >80% | Medium |
| anomaly-detection-dashboard.js | ~10% | >80% | Medium |

## 📖 References

- [Vitest Documentation](https://vitest.dev/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Playwright Visual Testing](https://playwright.dev/docs/test-snapshots)
- [cypress-axe (Accessibility Testing)](https://github.com/component-driven/cypress-axe)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chart.js Testing](https://www.chartjs.org/docs/latest/)
- [D3.js Testing](https://observablehq.com/@d3/testing)

---

**Last Updated**: 2026-02-18  
**Maintained by**: Hack23 AB  
**Version**: 1.0
