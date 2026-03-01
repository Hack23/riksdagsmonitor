/**
 * @module Analytics/CommitteeIntelligence/Init
 * @description Dashboard initialization, DOM event listeners, and error handling
 * for the Committee Intelligence Dashboard.
 *
 * Contains:
 * - **initializeDashboard**: Main async init function that fetches data and renders all charts
 * - UI helpers: showLoadingIndicator, hideLoadingIndicator, showErrorMessage
 * - Event listeners for tab switching and responsive resize handling
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { CONFIG, DataManager } from './data.js';
import { NetworkDiagram, ProductivityHeatMap } from './charts.js';
import { ChartJSVisualizations } from './table.js';

// ==============================================
// INITIALIZATION
// ==============================================

interface VisualizationInstances {
  network: NetworkDiagram;
  heatmap: ProductivityHeatMap;
  charts: ChartJSVisualizations;
}

// Keep references to visualization instances for reuse
let visualizationInstances: VisualizationInstances | null = null;

// Module-level flag to prevent concurrent initializations
let isInitializing: boolean = false;

/**
 * Initialize committee dashboard
 */
async function initializeDashboard(): Promise<void> {
  // Early guard: only initialize when the main dashboard container exists
  const dashboardRoot: HTMLElement | null = document.getElementById('committee-dashboard');
  if (!dashboardRoot) {
    console.info('[CommitteeDashboard] Skipping initialization: #committee-dashboard container not found.');
    return;
  }

  // Prevent concurrent initializations (race condition on resize)
  if (isInitializing) {
    console.info('[CommitteeDashboard] Already initializing, skipping duplicate call');
    return;
  }

  isInitializing = true;
  console.log('[CommitteeDashboard] Initializing...');

  try {
    // Check if required libraries are loaded
    if (typeof d3 === 'undefined') {
      throw new Error('D3.js not loaded. Please include D3.js library.');
    }
    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js not loaded. Please include Chart.js library.');
    }
    if (typeof Papa === 'undefined') {
      throw new Error('Papa Parse not loaded. Please include Papa Parse library.');
    }

    // Show loading indicator
    showLoadingIndicator();

    // Load data
    const dataManager: DataManager = new DataManager();
    const data: CommitteeData = await dataManager.loadAllData();
    console.log('[CommitteeDashboard] Data loaded successfully', data);

    // Destroy existing Chart.js instances if they exist
    if (visualizationInstances && visualizationInstances.charts) {
      visualizationInstances.charts.destroy();
    }

    // Render visualizations
    const network: NetworkDiagram = new NetworkDiagram('committeeNetwork', data);
    network.render();

    const heatmap: ProductivityHeatMap = new ProductivityHeatMap('productivityMatrix', data);
    heatmap.render();

    const charts: ChartJSVisualizations = new ChartJSVisualizations();
    charts.renderAll(data);

    // Store instances for later cleanup/reuse
    visualizationInstances = {
      network: network,
      heatmap: heatmap,
      charts: charts
    };

    // Hide loading indicator
    hideLoadingIndicator();

    console.log('[CommitteeDashboard] Initialization complete');
  } catch (error: unknown) {
    console.error('[CommitteeDashboard] Initialization failed:', error);
    showErrorMessage((error as Error).message);
  } finally {
    // Always clear the flag when initialization completes or fails
    isInitializing = false;
  }
}

/**
 * Show loading indicator (idempotent - safe to call multiple times)
 */
function showLoadingIndicator(): void {
  const dashboard: HTMLElement | null = document.getElementById('committee-dashboard');
  if (!dashboard) return;

  // Remove existing loading indicator if present (idempotency)
  const existing: HTMLElement | null = document.getElementById('committee-loading');
  if (existing) {
    existing.remove();
  }

  const indicator: HTMLDivElement = document.createElement('div');
  indicator.id = 'committee-loading';
  indicator.className = 'loading-indicator';
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-live', 'polite');
  
  const spinner: HTMLDivElement = document.createElement('div');
  spinner.className = 'spinner';
  indicator.appendChild(spinner);
  
  const text: HTMLParagraphElement = document.createElement('p');
  text.textContent = 'Loading committee data...';
  indicator.appendChild(text);
  
  dashboard.insertBefore(indicator, dashboard.firstChild);
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator(): void {
  const indicator: HTMLElement | null = document.getElementById('committee-loading');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Show error message
 */
function showErrorMessage(message: string): void {
  const dashboard: HTMLElement | null = document.getElementById('committee-dashboard');
  if (!dashboard) return;

  const error: HTMLDivElement = document.createElement('div');
  error.className = 'error-message';
  error.setAttribute('role', 'alert');
  
  const heading: HTMLHeadingElement = document.createElement('h3');
  heading.textContent = '⚠️ Error Loading Committee Dashboard';
  error.appendChild(heading);
  
  const messageParagraph: HTMLParagraphElement = document.createElement('p');
  messageParagraph.textContent = message;
  error.appendChild(messageParagraph);
  
  const supportParagraph: HTMLParagraphElement = document.createElement('p');
  supportParagraph.textContent = 'Please refresh the page or contact support if the issue persists.';
  error.appendChild(supportParagraph);
  
  dashboard.insertBefore(error, dashboard.firstChild);

  hideLoadingIndicator();
}

// ==============================================
// EVENT LISTENERS
// ==============================================

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // DOM already loaded
  initializeDashboard();
}

// Re-render on window resize (debounced)
let resizeTimeout: ReturnType<typeof setTimeout>;
window.addEventListener('resize', function(): void {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function(): void {
    console.log('[CommitteeDashboard] Window resized, re-rendering...');
    initializeDashboard();
  }, 300);
});
