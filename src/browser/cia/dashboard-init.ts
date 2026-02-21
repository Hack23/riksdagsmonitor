/**
 * @module CIA/DashboardInit
 * @category Intelligence Platform - System Orchestration
 *
 * @description
 * Dashboard Initialization Module – Intelligence Platform Orchestration Layer.
 * Coordinates the bootstrap sequence for multi-layered data integration,
 * visualization rendering, and interactive intelligence presentation. Manages
 * component lifecycle, dependency resolution, error recovery, and state
 * coordination across distributed rendering engines and data transformation
 * pipelines.
 *
 * @author Hack23 AB - Intelligence Platforms
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2024-01-15

 *
 * @intelligence Intelligence Platform Orchestration Layer — coordinates bootstrap sequence for multi-layered data integration, visualization rendering, and interactive intelligence presentation. Manages component lifecycle, dependency resolution, error recovery, and state coordination across rendering engines and data pipelines.
 *
 * @business Platform reliability SLA foundation — initialization resilience directly impacts uptime metrics and user trust. Error recovery ensures graceful degradation, maintaining partial functionality during outages. SLA commitments for enterprise clients depend on robust initialization.
 *
 * @marketing First-load experience quality — dashboard initialization speed and reliability determine first-impression quality for new users. Time to Interactive (< 3s target) is critical for conversion from landing page visitor to engaged user. Loading state UX affects bounce rate.
 * */

import { CIADataLoader } from './data-loader.js';
import { CIADashboardRenderer } from './visualizations.js';
import { Election2026Predictions } from './election-predictions.js';
import { t } from './i18n-translations.js';

import type { CIADataPayload } from './data-loader.js';
import type { RendererData } from './visualizations.js';

/* ------------------------------------------------------------------ */
/*  Dashboard initialization                                          */
/* ------------------------------------------------------------------ */

async function initDashboard(): Promise<void> {
  const loader = new CIADataLoader();

  // Update loading text with i18n
  const loadingText = document.querySelector('#loading-state p') as HTMLElement | null;
  if (loadingText) {
    loadingText.textContent = t('loadingData');
  }

  try {
    // Load all CIA exports using the loadAll method
    const data: CIADataPayload = await loader.loadAll();
    const { overview, election, partyPerf, top10, committees, votingPatterns } = data;

    // Hide loading state
    const loadingState = document.getElementById('loading-state');
    if (loadingState) loadingState.classList.add('hidden');
    const dashboardContent = document.getElementById('dashboard-content');
    if (dashboardContent) dashboardContent.classList.remove('hidden');

    // Initialize renderers
    const rendererData: RendererData = {
      overview,
      partyPerf,
      top10,
      committees,
      votingPatterns
    };
    const renderer = new CIADashboardRenderer(rendererData);

    const electionRenderer = new Election2026Predictions(election);

    // Render all sections
    renderer.renderKeyMetrics();
    renderer.renderPartyPerformance();
    renderer.renderTop10Rankings();
    renderer.renderVotingPatterns();
    renderer.renderCommitteeNetwork();

    electionRenderer.renderSeatPredictions();
    electionRenderer.renderCoalitionScenarios();
    electionRenderer.renderKeyFactors();
  } catch (error: unknown) {
    console.error('Dashboard initialization error:', error);

    const loadingState = document.getElementById('loading-state');
    if (loadingState) loadingState.classList.add('hidden');
    const errorState = document.getElementById('error-state');
    if (errorState) errorState.classList.remove('hidden');

    // Use i18n for user-facing error message, log technical details to console
    const errorMessage = t('errorLoadingData');
    const errorMessageEl = document.getElementById('error-message');
    if (errorMessageEl) errorMessageEl.textContent = errorMessage;

    // Retry button with i18n text
    const retryButton = document.getElementById('retry-button') as HTMLButtonElement | null;
    if (retryButton) {
      retryButton.textContent = t('retryButton');
      retryButton.addEventListener('click', () => {
        location.reload();
      });
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
