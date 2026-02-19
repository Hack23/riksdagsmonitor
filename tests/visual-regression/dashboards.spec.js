/**
 * Playwright Visual Regression Tests - Dashboard Screenshots
 *
 * Captures baseline screenshots for all 9 dashboards across:
 * - Desktop (1440px)
 * - Tablet (768px)
 * - Mobile (375px)
 * - RTL layouts (Arabic, Hebrew)
 *
 * Run with: npx playwright test
 * Update baselines: npx playwright test --update-snapshots
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { test, expect } from '@playwright/test';

const dashboards = [
  {
    id: 'party-dashboard',
    name: 'Party Dashboard',
    waitFor: '#partyEffectivenessChart',
  },
  {
    id: 'election-cycle-dashboard',
    name: 'Election Cycle Dashboard',
    waitFor: '#cycle-timeline-chart',
  },
  {
    id: 'committee-dashboard',
    name: 'Committee Dashboard',
    waitFor: '#committeeComparisonChart',
  },
  {
    id: 'coalition-dashboard',
    name: 'Coalition Dashboard',
    waitFor: '#votingAnomalyChart',
  },
  {
    id: 'seasonal-patterns-dashboard',
    name: 'Seasonal Patterns Dashboard',
    waitFor: '#zscore-timeline-chart',
  },
  {
    id: 'pre-election-dashboard',
    name: 'Pre-Election Dashboard',
    waitFor: '#q4-timeline-chart',
  },
  {
    id: 'anomaly-detection-dashboard',
    name: 'Anomaly Detection Dashboard',
    waitFor: '#anomaly-timeline-chart',
  },
  {
    id: 'ministry-dashboard',
    name: 'Ministry Dashboard',
    waitFor: '#ministerInfluenceChart',
  },
  {
    id: 'risk-dashboard',
    name: 'Risk Dashboard',
    waitFor: '#riskDistributionChart',
  },
];

/**
 * Wait for charts to render in the page
 */
async function waitForDashboardCharts(page, dashboardId, chartSelector) {
  // Wait for the dashboard section to be visible
  await page.locator(`#${dashboardId}`).waitFor({ state: 'visible', timeout: 15000 });

  // Wait for the primary chart canvas to exist
  await page.locator(chartSelector).waitFor({ state: 'attached', timeout: 10000 });

  // Allow time for chart.js animations to complete
  await page.waitForTimeout(500);
}

// ============================================================================
// DESKTOP VISUAL REGRESSION TESTS (1440px)
// ============================================================================

test.describe('Dashboard Visual Regression - Desktop (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  dashboards.forEach(({ id, name, waitFor }) => {
    test(`${name} - desktop screenshot`, async ({ page }) => {
      await waitForDashboardCharts(page, id, waitFor);

      const dashboard = page.locator(`#${id}`);
      await expect(dashboard).toHaveScreenshot(`${id}-desktop.png`, {
        maxDiffPixels: 100,
        animations: 'disabled',
      });
    });
  });
});

// ============================================================================
// TABLET VISUAL REGRESSION TESTS (768px)
// ============================================================================

test.describe('Dashboard Visual Regression - Tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  dashboards.forEach(({ id, name, waitFor }) => {
    test(`${name} - tablet screenshot`, async ({ page }) => {
      await waitForDashboardCharts(page, id, waitFor);

      const dashboard = page.locator(`#${id}`);
      await expect(dashboard).toHaveScreenshot(`${id}-tablet.png`, {
        maxDiffPixels: 100,
        animations: 'disabled',
      });
    });
  });
});

// ============================================================================
// MOBILE VISUAL REGRESSION TESTS (375px)
// ============================================================================

test.describe('Dashboard Visual Regression - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  dashboards.forEach(({ id, name, waitFor }) => {
    test(`${name} - mobile screenshot`, async ({ page }) => {
      await waitForDashboardCharts(page, id, waitFor);

      const dashboard = page.locator(`#${id}`);
      await expect(dashboard).toHaveScreenshot(`${id}-mobile.png`, {
        maxDiffPixels: 150,
        animations: 'disabled',
      });
    });
  });
});

// ============================================================================
// RTL LAYOUT VISUAL REGRESSION TESTS
// ============================================================================

test.describe('Dashboard Visual Regression - RTL Layouts', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Arabic (RTL) - party dashboard screenshot', async ({ page }) => {
    await page.goto('/index_ar.html');
    await page.waitForLoadState('domcontentloaded');

    // Verify RTL direction
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');

    await waitForDashboardCharts(page, 'party-dashboard', '#partyEffectivenessChart');

    const dashboard = page.locator('#party-dashboard');
    await expect(dashboard).toHaveScreenshot('party-dashboard-rtl-ar.png', {
      maxDiffPixels: 100,
      animations: 'disabled',
    });
  });

  test('Hebrew (RTL) - party dashboard screenshot', async ({ page }) => {
    await page.goto('/index_he.html');
    await page.waitForLoadState('domcontentloaded');

    // Verify RTL direction
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');

    await waitForDashboardCharts(page, 'party-dashboard', '#partyEffectivenessChart');

    const dashboard = page.locator('#party-dashboard');
    await expect(dashboard).toHaveScreenshot('party-dashboard-rtl-he.png', {
      maxDiffPixels: 100,
      animations: 'disabled',
    });
  });

  test('Arabic (RTL) - risk dashboard screenshot', async ({ page }) => {
    await page.goto('/index_ar.html');
    await page.waitForLoadState('domcontentloaded');

    await waitForDashboardCharts(page, 'risk-dashboard', '#riskDistributionChart');

    const dashboard = page.locator('#risk-dashboard');
    await expect(dashboard).toHaveScreenshot('risk-dashboard-rtl-ar.png', {
      maxDiffPixels: 100,
      animations: 'disabled',
    });
  });
});

// ============================================================================
// CJK LAYOUT SCREENSHOTS
// ============================================================================

test.describe('Dashboard Visual Regression - CJK Languages', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const cjkLanguages = [
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
  ];

  cjkLanguages.forEach(({ code, name }) => {
    test(`${name} - party dashboard screenshot`, async ({ page }) => {
      await page.goto(`/index_${code}.html`);
      await page.waitForLoadState('domcontentloaded');

      // Verify correct language attribute
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe(code);

      await waitForDashboardCharts(page, 'party-dashboard', '#partyEffectivenessChart');

      const dashboard = page.locator('#party-dashboard');
      await expect(dashboard).toHaveScreenshot(`party-dashboard-${code}.png`, {
        maxDiffPixels: 100,
        animations: 'disabled',
      });
    });
  });
});

// ============================================================================
// FULL PAGE STRUCTURE VALIDATION (not screenshot-based)
// ============================================================================

test.describe('Dashboard Structure Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('all 9 dashboards should exist in the page', async ({ page }) => {
    const dashboardIds = dashboards.map((d) => d.id);
    for (const id of dashboardIds) {
      const element = page.locator(`#${id}`);
      await expect(element).toBeVisible();
    }
  });

  test('party dashboard should have canvas elements', async ({ page }) => {
    await page.locator('#party-dashboard').waitFor({ state: 'visible' });
    const canvasCount = await page.locator('#party-dashboard canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('risk dashboard should have risk heatmap container', async ({ page }) => {
    await page.locator('#risk-dashboard').waitFor({ state: 'visible' });
    const heatmap = page.locator('#riskHeatMap');
    await expect(heatmap).toBeVisible();
  });

  test('anomaly detection dashboard should have filter controls', async ({ page }) => {
    const filter = page.locator('#anomaly-severity-filter');
    await expect(filter).toBeVisible();
  });

  test('seasonal patterns dashboard should have filter controls', async ({ page }) => {
    const filter = page.locator('#seasonal-quarter-filter');
    await expect(filter).toBeVisible();
  });

  test('election cycle dashboard should have filter controls', async ({ page }) => {
    const filter = page.locator('#election-metric-filter');
    await expect(filter).toBeVisible();
  });
});
