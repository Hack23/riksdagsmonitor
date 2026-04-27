<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🧪 Riksdagsmonitor — Testing Strategy</h1>

<p align="center">
  <strong>✅ Comprehensive Quality Assurance for Democratic Intelligence</strong><br>
  <em>🎯 Vitest Unit · Cypress E2E · Accessibility · Performance · 14-Language Coverage</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Coverage-70%25_lines-brightgreen?style=for-the-badge" alt="Coverage"/></a>
  <a href="#"><img src="https://img.shields.io/badge/WCAG-2.1_AA-purple?style=for-the-badge" alt="WCAG 2.1 AA"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **🔄 Review Cycle:** Quarterly  
**🏢 Owner:** Hack23 AB (Org.nr 559534-7807) | **🏷️ Classification:** 🟢 Public

---

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

## 📰 News Pipeline Test Surfaces

The aggregate-then-render news pipeline (`scripts/aggregate-analysis.ts` → `scripts/render-articles.ts` → `scripts/render-lib/`) is exercised by the following dedicated test surfaces. Any change to the pipeline must keep them green.

| Surface | What it asserts | Typical harness |
|---------|-----------------|-----------------|
| **Aggregator ordering** | Per-day artifacts in `analysis/daily/$DATE/$SUB/` concatenate into `article.md` in the canonical narrative order defined by `analysis/templates/` (executive-brief → synthesis → significance → stakeholders → …). Duplicate H1s and admin footers are stripped; relative links are rewritten to absolute GitHub blob URLs. | Fixture-based Vitest snapshot over a minimal `analysis/daily/fixture/$SUB/` tree |
| **Aggregator manifest** | A `.manifest.json` sibling to `article.md` lists every consumed artifact with a SHA-256 digest. The manifest is reproducible (same input → same manifest). | Vitest hash assertion |
| **Renderer sanitisation** | `rehype-sanitize` drops `<script>`, `<iframe>`, inline event handlers, `javascript:` / non-image `data:` URIs. It does **not** drop allow-listed `<pre class="mermaid">` blocks, `<figure>`/`<figcaption>`, `<details>`/`<summary>`, or tables. | Vitest with adversarial markdown fixtures |
| **Mermaid pass-through** | A ```mermaid fenced block in the markdown survives sanitisation as `<pre class="mermaid">…</pre>` and the rendered chrome injects `js/lib/mermaid-init.mjs`. | Vitest parse assertion + Cypress client-render smoke |
| **JSON-LD validity** | Each rendered article contains a single well-formed `application/ld+json` `NewsArticle` block with populated `headline`, `datePublished`, `inLanguage`, `author`, `publisher`, `citation[]`, and `about[]`. | Vitest parses the script tag and validates against a lightweight schema |
| **Sitemap inclusion** | Every `news/$DATE-$SUB-$LANG.html` appears in `sitemap.xml` (with the correct `hreflang` alternates) and `sitemap.html`. All 14 `political-intelligence_*.html` pages are listed too. | Vitest fixture-based assertion in `generate-sitemap` tests |
| **Provenance footer** | Every article links to the GitHub blob URL of every methodology and template file it consumed, as recorded in the manifest. | Vitest DOM assertion |
| **Naming convention** | Rendered files match `news/$DATE-$SUB-$LANG.html` (hyphens only — never `_lang` underscore). | Vitest regex over `news/` directory listing |

### Known-stale fixtures

Three fixture-based tests (`generate-news-indexes`, two `generate-rss`) historically failed on pre-existing `news/*.html` files with malformed `article:published_time` values. These fixtures are regenerated by the renderer in CI; the tests now scope themselves to the new `news/$DATE-$SUB-$LANG.html` naming pattern so stale files do not pollute results.

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
  
  // Chart tests (3 canvas charts + 1 D3 container)
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

### CIA Visualizations Renderer Unit Tests

**File**: `tests/visualizations.test.ts`

Covers all 9 public render methods of `src/browser/cia/visualizations.ts` — the
primary chart rendering engine that drives every CIA intelligence dashboard.
The module is now included in the Vitest coverage gate.

**Chart.js mock pattern.** The renderer captures `Chart` at module load time
(`const Chart = (globalThis as any).Chart;`). To intercept each chart
construction with a per-test spy we:

1. Replace `globalThis.Chart` with a `vi.fn()` that pushes `{ ctx, type, data,
   options }` into a `chartCalls` array.
2. Call `vi.resetModules()` and **dynamically** `import` the module so the new
   `Chart` reference is captured.

```typescript
async function loadRenderer(): Promise<RendererCtor> {
  vi.resetModules();
  const mod = await import('../src/browser/cia/visualizations.js');
  return mod.CIADashboardRenderer as unknown as RendererCtor;
}

it('passes correct party labels to Chart.js', async () => {
  const Renderer = await loadRenderer();
  makeCanvas('party-seats-chart');
  makeCanvas('party-cohesion-chart');

  new Renderer({ partyPerf: fxPartyPerf() }).renderPartyPerformance();

  expect(chartCalls[0].type).toBe('bar');
  expect(chartCalls[0].data.labels).toEqual(['S','M','SD','C','V','KD','L','MP']);
});
```

**Edge cases covered.** Empty/missing dashboards (early `return` warning paths),
missing `globalThis.Chart` (graceful no-op), and NaN / non-finite numeric
fields (rendered as `'N/A'` or replaced with `0`).

## 🌐 E2E Tests (Cypress)

### Comprehensive Dashboard Coverage

**File**: `cypress/e2e/all-dashboards.cy.js` (150+ tests)

Tests all 9 dashboards systematically:

```javascript
// Simplified example - actual implementation has specific chart IDs
const dashboards = [
  // NOTE: These are simplified placeholder values for documentation purposes.
  // For actual chart IDs and counts, see cypress/e2e/all-dashboards.cy.js
  { id: 'party-dashboard', charts: 3, hasD3: true, d3Container: 'coalitionAlignmentChart' },
  { id: 'election-cycle-dashboard', charts: 4, hasD3: true, d3Container: 'decision-heatmap' },
  { id: 'committee-dashboard', charts: 3, hasD3: true, d3Container: 'committeeNetwork' },
  { id: 'coalition-dashboard', charts: 3, hasD3: true, d3Container: 'coalitionNetwork' },
  { id: 'seasonal-patterns-dashboard', charts: 4, hasD3: true, d3Container: 'seasonal-heatmap' },
  { id: 'pre-election-dashboard', charts: 5, hasD3: false },
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
        uses: step-security/harden-runner@58077d3c7e43986b6b15fba718e8ea69e387dfcc # v2.15.1
        with:
          egress-policy: audit
          
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: '25'
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
        uses: step-security/harden-runner@58077d3c7e43986b6b15fba718e8ea69e387dfcc # v2.15.1
        with:
          egress-policy: audit
          
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: '25'
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

#### Enforced Coverage Thresholds (vitest.config.js)

CI fails if any metric falls below the **Hack23 Secure Development Policy
floor** (≥80 % lines, ≥70 % branches). Thresholds apply to the *importable
unit-testable surface* — browser-only `<script>`-loaded modules are exercised
by Cypress E2E and CLI entry points are exercised by the news workflows;
both are deliberately excluded from the Vitest gate via the documented
`exclude` list in `vitest.config.js`.

| Metric | Enforced floor (ISMS) | Measured 2026-04-25 |
| --- | --- | --- |
| Statements | **≥ 80 %** | 90.26 % |
| Branches | **≥ 70 %** | 80.08 % |
| Functions | **≥ 70 %** | 93.42 % |
| Lines | **≥ 80 %** | 91.74 % |

To re-measure after adding modules, run `npm run test:coverage` and read
the `All files` row at the bottom. Update both the enforced thresholds in
`vitest.config.js` and the measured-baseline column above in the same PR.

> **Authority:** [Secure_Development_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
> mandates ≥80 % line coverage and ≥70 % branch coverage as a hard CI gate
> for all Hack23 production codebases.

### Quality Gates

**All PRs must pass**:
- ✅ Unit tests (100% pass rate)
- ✅ E2E tests (100% pass rate)
- ✅ CSV data validation (all files valid)
- ✅ No test skips or conditionals
- ✅ Coverage thresholds at the ISMS floor (≥80 % lines, ≥70 % branches — see table above)

## 📊 Test Metrics

### Current Status (2026-04-25)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Unit Tests** | 2094 | >1000 | ✅ |
| **E2E Tests** | 150+ | >100 | ✅ |
| **CSV Validation** | 159 | 100% | ✅ |
| **Code Coverage (lines)** | 91.74 % | ≥80 % (ISMS) | ✅ |
| **Code Coverage (branches)** | 80.08 % | ≥70 % (ISMS) | ✅ |
| **Test Skips** | 0 | 0 | ✅ |
| **Dashboards Covered** | 9/9 | 9/9 | ✅ |
| **Languages Tested** | 1/14 | 14/14 | 🟡 |

### Test Execution Times

| Test Suite | Duration | Target |
|------------|----------|--------|
| Unit Tests (Vitest) | ~63 s | <90 s |
| E2E Tests (Cypress) | TBD | <5 min |
| Visual Tests (Playwright) | TBD | <10 min |

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run a specific test file
npm test tests/csv-validation.test.js

# Run a focused subset by name pattern
npm test -- --grep "imf-client"

# Run tests with coverage (enforces thresholds in vitest.config.js)
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


---

## 🌐 IMF Integration Testing

> **Effective:** 2026-04-24 · **Authoritative hub:** [`analysis/imf/README.md`](analysis/imf/README.md) · [`analysis/imf/agentic-integration.md`](analysis/imf/agentic-integration.md) · [`analysis/imf/indicators-inventory.json`](analysis/imf/indicators-inventory.json) · [`analysis/imf/data-dictionary.md`](analysis/imf/data-dictionary.md) · [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](.github/aw/ECONOMIC_DATA_CONTRACT.md)

### IMF test surface

| Test file | Purpose |
|---|---|
| `tests/imf-client.test.ts` | Low-level Datamapper + SDMX client behaviour |
| `tests/imf-codes.test.ts` | Dataflow / indicator code registry validation |
| `tests/imf-context.test.ts` | High-level `getImfContext({domain, country, vintage})` shape, cache, vintage handling |
| `tests/imf-inventory.test.ts` | Schema validation of `analysis/imf/indicators-inventory.json` (13 assertions) |
| `tests/economic-context-multi-provider.test.ts` | Asserts IMF queried **before** WB for every economic indicator class |
| `tests/validate-economic-context.test.ts` | Validates the IMF-first contract end-to-end |

### Running IMF tests

```bash
# Offline (mocked) — fast; runs in CI
npm test -- imf

# Online smoke (live IMF API) — opt-in only, not in default CI
IMF_LIVE_SMOKE=1 npm test -- imf-client.live
```

### IMF test fail-fast principles

1. **Zero skips** — IMF tests never use conditional skip; if IMF mock data is missing, the test fails immediately
2. **Vintage assertion** — every IMF mock fixture carries an explicit `vintage_label`; tests assert presence
3. **Provider precedence assertion** — `economic-context-multi-provider.test.ts` asserts IMF appears before WB in fetched economic data
4. **Schema integrity** — `imf-inventory.test.ts` asserts every indicator in the inventory JSON has dataflow + dimensions + vintage + supersedes pointer
5. **Banned-phrase lint** — `tests/banned-patterns.test.ts` (where present) asserts that WB economic codes (`NY.GDP.*`, `FP.CPI.*`, `SL.UEM.*`, `GC.DOD.TOTL.*`) are never used as primary citation in article fixtures

### Future testing additions (W12)

- `tests/imf-precedence-contract.test.ts` — synthetic test feeding both IMF + WB GDP series; asserts article cites IMF
- `tests/imf-vintage-discipline.test.ts` — asserts cache filenames carry vintage tags

**Canonical rule.** Every economic claim in a Riksdagsmonitor article cites an IMF dataflow first; World Bank citations are reserved for governance, environment and social residue (the classes IMF does not publish). SCB is the Swedish-specific ground truth layer. See `ECONOMIC_DATA_CONTRACT.md` v2.1 for the banned-phrase list and vintage discipline (>6 mo → annotation).

---

## 🧪 Statskontoret Test Coverage

Statskontoret coverage is split across focused Vitest suites:

| Test file | Coverage |
|---|---|
| `tests/statskontoret-client.test.ts` | Download-link extraction, XLSX workbook parsing, CSV ZIP extraction, Swedish decimal handling, injected fetch client behavior. |
| `tests/statskontoret-fetch.test.ts` | Import-safe CLI parsing, typed CLI errors, source validation, resource classification, numeric parsing primitives. |
| `tests/statskontoret-inventory.test.ts` | Inventory metadata, dataset coverage parity with `STATSKONTORET_SOURCES`, provider-decision matrix, client/CLI/persistence declarations. |

Targeted validation command:

```bash
npx vitest run tests/statskontoret-client.test.ts tests/statskontoret-fetch.test.ts tests/statskontoret-inventory.test.ts
```

Quality expectation: no live network calls in tests; fixtures model Statskontoret workbook/ZIP assumptions and prevent workflow regressions without depending on upstream availability.


---

## 🔗 Hack23 Ecosystem

<table>
<tr>
  <th width="33%">🌐 Platforms</th>
  <th width="33%">📦 Open-Source Projects</th>
  <th width="33%">🛡️ Governance &amp; Standards</th>
</tr>
<tr>
<td valign="top">
🗳️ <a href="https://riksdagsmonitor.com">Riksdagsmonitor</a> — Swedish Parliament intelligence<br>
🇪🇺 <a href="https://www.euparliamentmonitor.com">EU Parliament Monitor</a> — European coverage<br>
🕵️ <a href="https://www.hack23.com/cia">Citizen Intelligence Agency</a> — political-data engine<br>
🌐 <a href="https://www.hack23.com">Hack23 AB</a> — corporate site<br>
📰 <a href="https://hack23.com/blog.html">Hack23 Blog</a> — engineering &amp; policy<br>
💼 <a href="https://www.linkedin.com/company/hack23/">Hack23 on LinkedIn</a>
</td>
<td valign="top">
🗳️ <a href="https://github.com/Hack23/riksdagsmonitor">Hack23/riksdagsmonitor</a><br>
🕵️ <a href="https://github.com/Hack23/cia">Hack23/cia</a><br>
🇪🇺 <a href="https://github.com/Hack23/euparliamentmonitor">Hack23/euparliamentmonitor</a><br>
🔌 <a href="https://github.com/Hack23/european-parliament-mcp">Hack23/european-parliament-mcp</a><br>
✅ <a href="https://github.com/Hack23/cia-compliance-manager">Hack23/cia-compliance-manager</a><br>
🥋 <a href="https://github.com/Hack23/black-trigram">Hack23/black-trigram</a><br>
🏠 <a href="https://github.com/Hack23/homepage">Hack23/homepage</a>
</td>
<td valign="top">
🛡️ <a href="https://github.com/Hack23/ISMS-PUBLIC">Hack23 ISMS-PUBLIC</a> — public ISMS<br>
🔒 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md">Information Security Policy</a><br>
🤖 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md">AI Policy</a><br>
🧪 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md">Secure Development Policy</a><br>
🎯 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md">Threat Modeling Policy</a><br>
⚠️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md">Vulnerability Management</a><br>
🏷️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md">Classification Framework</a>
</td>
</tr>
</table>

<p align="center">
<a href="https://www.bestpractices.dev/projects/12069"><img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices"/></a>
<a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor"><img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/ISO_27001-2022-blue?style=flat-square&logo=iso&logoColor=white" alt="ISO 27001:2022"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/NIST_CSF-2.0-green?style=flat-square&logo=nist&logoColor=white" alt="NIST CSF 2.0"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/CIS_Controls-v8.1-orange?style=flat-square&logo=cisecurity&logoColor=white" alt="CIS Controls v8.1"/></a>
<a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="Apache 2.0"/></a>
</p>

<p align="center"><em>🗳️ Empower citizens · 🔍 Strengthen democratic accountability · 🕵️ Illuminate the political process</em></p>

<p align="center"><sub>© 2008–2026 <a href="https://www.hack23.com">Hack23 AB</a> (Org.nr 559534-7807) · Maintainer: <a href="https://www.linkedin.com/in/jamessorling/">James Pether Sörling, CISSP CISM</a></sub></p>
