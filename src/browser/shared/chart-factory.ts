/**
 * @module Shared/ChartFactory
 * @description Centralized Chart.js creation and configuration.
 * Replaces 51+ independent `new Chart()` calls with consistent theming,
 * responsive behavior, and accessibility features.
 *
 * @security No inline scripts — all Chart.js configuration is programmatic

 *
 * @intelligence Standardized intelligence visualization factory — ensures all analytical charts (risk heat maps, coalition networks, electoral forecasts) maintain consistent OSINT presentation standards with accessibility compliance for briefing-quality output.
 *
 * @business Development velocity multiplier — centralizing Chart.js configuration eliminates per-dashboard setup cost (reduced from 51+ `new Chart()` calls). Enables rapid prototyping of new intelligence products with predictable quality and performance.
 *
 * @marketing Visual quality assurance — every chart produced is screenshot-ready for social media, press releases, and reports. Consistent styling builds brand recognition. Responsive behavior ensures mobile-quality content for all distribution channels.
 * */

import type { Chart as ChartType, ChartConfiguration, ChartTypeRegistry } from 'chart.js';
import { THEME_COLORS, CHART_PALETTE, BREAKPOINTS, getActiveThemeColors, getChartPalette } from './theme.js';
import { showLoadingState, showErrorState, hideStateOverlays } from './dom-utils.js';
import { logger } from './logger.js';

// Re-export for convenience
export { THEME_COLORS, CHART_PALETTE, BREAKPOINTS, getActiveThemeColors, getChartPalette };

/**
 * Get the Chart constructor.
 * Works with both global `Chart` (from script tag) and ES module import.
 */
function getChart(): typeof ChartType {
  const g = globalThis as Record<string, unknown>;
  if (g.Chart) return g.Chart as typeof ChartType;
  throw new Error('Chart.js not loaded');
}

/**
 * Get responsive chart options based on current viewport.
 */
export function getResponsiveOptions(): Record<string, unknown> {
  const width = window.innerWidth;
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const theme = getActiveThemeColors();

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: isMobile ? 0 : 400 },
    plugins: {
      legend: {
        position: isMobile ? 'bottom' as const : 'top' as const,
        labels: {
          boxWidth: isMobile ? 8 : 12,
          padding: isMobile ? 4 : 8,
          font: { size: isMobile ? 10 : (isTablet ? 11 : 12) },
          color: theme.bodyText,
        },
      },
      tooltip: {
        backgroundColor: theme.tooltipBg,
        titleColor: theme.cyan,
        bodyColor: theme.bodyText,
        borderColor: theme.cyan,
        borderWidth: 1,
        padding: isMobile ? 6 : 10,
        titleFont: { size: isMobile ? 11 : 13, weight: 'bold' as const },
        bodyFont: { size: isMobile ? 10 : 12 },
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme.tickColor,
          font: { size: isMobile ? 9 : 11 },
          maxRotation: isMobile ? 45 : 0,
        },
        grid: { color: theme.gridColor },
      },
      y: {
        ticks: {
          color: theme.tickColor,
          font: { size: isMobile ? 9 : 11 },
        },
        grid: { color: theme.gridColor },
      },
    },
  };
}

/**
 * Create a Chart.js chart with consistent theming and responsive behavior.
 *
 * @param canvas - Canvas element or its ID
 * @param config - Chart.js configuration
 * @param containerId - Optional container ID for loading/error states
 * @returns The Chart instance
 */
export function createChart<T extends keyof ChartTypeRegistry>(
  canvas: HTMLCanvasElement | string,
  config: ChartConfiguration<T>,
  containerId?: string,
): ChartType<T> {
  const ChartCtor = getChart();
  const canvasEl = typeof canvas === 'string'
    ? document.getElementById(canvas) as HTMLCanvasElement | null
    : canvas;

  if (!canvasEl) {
    throw new Error(`Canvas element not found: ${canvas}`);
  }

  // Merge responsive options with user config
  const responsive = getResponsiveOptions();
  const mergedConfig: ChartConfiguration<T> = {
    ...config,
    options: deepMerge(responsive, config.options ?? {}) as ChartConfiguration<T>['options'],
  };

  const container = containerId
    ? document.getElementById(containerId)
    : canvasEl.parentElement;

  if (container) {
    hideStateOverlays(container);
  }

  try {
    return new ChartCtor(canvasEl, mergedConfig);
  } catch (error) {
    logger.error(`Failed to create chart:`, error);
    if (container) {
      showErrorState(container, 'Failed to render chart');
    }
    throw error;
  }
}

/**
 * Safely initialize a dashboard section.
 * Shows loading state, runs the initializer, shows error state on failure.
 */
export async function initDashboardSection(
  containerId: string,
  initializer: () => Promise<void>,
  loadingMessage = 'Loading data...',
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) {
    logger.debug(`Container #${containerId} not found — skipping`);
    return;
  }

  showLoadingState(container, loadingMessage);

  try {
    await initializer();
    hideStateOverlays(container);
  } catch (error) {
    logger.error(`Dashboard section ${containerId} failed:`, error);
    showErrorState(
      container,
      `Failed to load ${containerId.replace(/-/g, ' ')}`,
    );
  }
}

/**
 * Add keyboard navigation to a Chart.js chart for accessibility.
 */
export function addChartKeyboardNav(
  chart: ChartType,
  canvas: HTMLCanvasElement,
): void {
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'img');

  canvas.addEventListener('keydown', (e: KeyboardEvent) => {
    const meta = chart.getActiveElements();
    const currentIndex = meta.length > 0 ? meta[0]!.index : -1;
    const datasetIndex = meta.length > 0 ? meta[0]!.datasetIndex : 0;
    const maxIndex = (chart.data.datasets[datasetIndex]?.data?.length ?? 1) - 1;

    let newIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      newIndex = Math.min(currentIndex + 1, maxIndex);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      newIndex = Math.max(currentIndex - 1, 0);
      e.preventDefault();
    }

    if (newIndex !== currentIndex && newIndex >= 0) {
      chart.setActiveElements([{ datasetIndex, index: newIndex }]);
      chart.update();
    }
  });
}

/**
 * Create a resize handler that re-creates charts on breakpoint changes.
 */
export function createResizeHandler(callback: () => void): () => void {
  let currentBreakpoint = getBreakpoint();
  let resizeTimer: ReturnType<typeof setTimeout>;

  const handler = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newBreakpoint = getBreakpoint();
      if (newBreakpoint !== currentBreakpoint) {
        currentBreakpoint = newBreakpoint;
        callback();
      }
    }, 250);
  };

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

function getBreakpoint(): string {
  const w = window.innerWidth;
  if (w < BREAKPOINTS.tablet) return 'mobile';
  if (w < BREAKPOINTS.desktop) return 'tablet';
  if (w < BREAKPOINTS.large) return 'desktop';
  return 'large';
}

/**
 * Deep merge two objects (simple version for chart configs).
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key];
    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}
