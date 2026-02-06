/**
 * Dashboard Initialization Module
 * Initializes and renders the CIA intelligence dashboard
 */

import { CIADataLoader } from './cia-data-loader.js';
import { CIADashboardRenderer } from './cia-visualizations.js';
import { Election2026Predictions } from './election-predictions.js';

async function initDashboard() {
  const loader = new CIADataLoader();
  
  try {
    // Load all CIA exports
    const [overview, election, partyPerf, top10, committees, votingPatterns] = await Promise.all([
      loader.loadOverviewDashboard(),
      loader.loadElectionAnalysis(),
      loader.loadPartyPerformance(),
      loader.loadTop10Influential(),
      loader.loadCommitteeNetwork(),
      loader.loadVotingPatterns()
    ]);
    
    // Hide loading state
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');
    
    // Initialize renderers
    const renderer = new CIADashboardRenderer({
      overview,
      partyPerf,
      top10,
      committees,
      votingPatterns
    });
    
    const electionRenderer = new Election2026Predictions(election);
    
    // Render all sections
    renderer.renderKeyMetrics();
    renderer.renderPartyPerformance();
    renderer.renderTop10Rankings();
    renderer.renderVotingPatterns();
    renderer.renderCommitteeNetwork();
    
    electionRenderer.renderSeatPredictions();
    electionRenderer.renderCoalitionScenarios();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('error-message').textContent = error.message;
    
    // Retry button handler
    document.getElementById('retry-button').addEventListener('click', () => {
      location.reload();
    });
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
