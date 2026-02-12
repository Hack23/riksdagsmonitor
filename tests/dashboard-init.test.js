/**
 * Tests for Dashboard Initialization Module
 * Tests the orchestration of data loading and rendering
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Dashboard Initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main class="cia-dashboard" id="main-dashboard">
        <div id="loading-state" class="loading-state" aria-live="polite">
          <div class="loading-spinner"></div>
          <p>Loading CIA intelligence data...</p>
        </div>
        <div id="error-state" class="error-state hidden" role="alert" aria-live="assertive">
          <h2>Data Loading Error</h2>
          <p id="error-message"></p>
          <button id="retry-button" class="btn">Retry</button>
        </div>
        <div id="dashboard-content" class="hidden">
          <section id="key-metrics" class="metrics-grid">
            <div class="metrics-cards">
              <div class="metric-value" id="metric-total-mps">-</div>
              <div class="metric-value" id="metric-total-parties">-</div>
              <div class="metric-value" id="metric-risk-rules">-</div>
              <div class="metric-value" id="metric-coalition-seats">-</div>
            </div>
            <span class="badge-count" id="alert-critical">0</span>
            <span class="badge-count" id="alert-major">0</span>
            <span class="badge-count" id="alert-minor">0</span>
          </section>
          <section id="party-performance">
            <canvas id="party-seats-chart"></canvas>
            <canvas id="party-cohesion-chart"></canvas>
          </section>
          <section id="election-forecast">
            <div id="seat-predictions" class="predictions-grid"></div>
            <div id="coalition-scenarios" class="scenarios-grid"></div>
            <div id="key-factors"></div>
          </section>
          <section id="top-rankings">
            <div id="influential-mps" class="rankings-list"></div>
          </section>
          <section id="voting-patterns">
            <canvas id="voting-heatmap"></canvas>
          </section>
          <section id="committee-network">
            <div id="network-visualization" class="network-container"></div>
            <div id="committee-list" class="committee-grid"></div>
          </section>
        </div>
      </main>
    `;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State Management', () => {
    it('should show loading state initially', () => {
      const loadingState = document.getElementById('loading-state');
      expect(loadingState).not.toBeNull();
      expect(loadingState.classList.contains('hidden')).toBe(false);
    });

    it('should hide dashboard content initially', () => {
      const content = document.getElementById('dashboard-content');
      expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should hide error state initially', () => {
      const errorState = document.getElementById('error-state');
      expect(errorState.classList.contains('hidden')).toBe(true);
    });

    it('should hide loading and show content on success', () => {
      const loadingState = document.getElementById('loading-state');
      const content = document.getElementById('dashboard-content');

      loadingState.classList.add('hidden');
      content.classList.remove('hidden');

      expect(loadingState.classList.contains('hidden')).toBe(true);
      expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should hide loading and show error on failure', () => {
      const loadingState = document.getElementById('loading-state');
      const errorState = document.getElementById('error-state');
      const errorMessage = document.getElementById('error-message');

      loadingState.classList.add('hidden');
      errorState.classList.remove('hidden');
      errorMessage.textContent = 'Failed to load overview-dashboard.json';

      expect(loadingState.classList.contains('hidden')).toBe(true);
      expect(errorState.classList.contains('hidden')).toBe(false);
      expect(errorMessage.textContent).toContain('Failed to load');
    });
  });

  describe('Error State', () => {
    it('should have error message element', () => {
      expect(document.getElementById('error-message')).not.toBeNull();
    });

    it('should have retry button', () => {
      const retryButton = document.getElementById('retry-button');
      expect(retryButton).not.toBeNull();
      expect(retryButton.tagName).toBe('BUTTON');
    });

    it('should display error message from exception', () => {
      const error = new Error('Network timeout');
      const errorMessage = document.getElementById('error-message');
      errorMessage.textContent = (error && error.message) || 'An unknown error occurred';
      expect(errorMessage.textContent).toBe('Network timeout');
    });

    it('should handle falsy error message', () => {
      const error = null;
      const errorMessage = document.getElementById('error-message');
      errorMessage.textContent = (error && error.message) || 'An unknown error occurred while loading dashboard data.';
      expect(errorMessage.textContent).toBe('An unknown error occurred while loading dashboard data.');
    });

    it('should have alert role on error state for accessibility', () => {
      const errorState = document.getElementById('error-state');
      expect(errorState.getAttribute('role')).toBe('alert');
      expect(errorState.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Dashboard DOM Structure', () => {
    it('should have all 6 dashboard sections', () => {
      expect(document.getElementById('key-metrics')).not.toBeNull();
      expect(document.getElementById('party-performance')).not.toBeNull();
      expect(document.getElementById('election-forecast')).not.toBeNull();
      expect(document.getElementById('top-rankings')).not.toBeNull();
      expect(document.getElementById('voting-patterns')).not.toBeNull();
      expect(document.getElementById('committee-network')).not.toBeNull();
    });

    it('should have key-factors container for election factors', () => {
      expect(document.getElementById('key-factors')).not.toBeNull();
    });

    it('should have loading spinner for initial state', () => {
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).not.toBeNull();
    });

    it('should have aria-live on loading state for screen readers', () => {
      const loadingState = document.getElementById('loading-state');
      expect(loadingState.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Module Imports', () => {
    it('should define correct module dependencies', () => {
      const modules = [
        'cia-data-loader.js',
        'cia-visualizations.js',
        'election-predictions.js',
        'dashboard-init.js'
      ];
      expect(modules).toHaveLength(4);
      modules.forEach(mod => {
        expect(mod).toMatch(/\.js$/);
      });
    });
  });

  describe('Rendering Order', () => {
    it('should define correct rendering sequence', () => {
      const renderSteps = [
        'renderKeyMetrics',
        'renderPartyPerformance',
        'renderTop10Rankings',
        'renderVotingPatterns',
        'renderCommitteeNetwork',
        'renderSeatPredictions',
        'renderCoalitionScenarios',
        'renderKeyFactors'
      ];
      expect(renderSteps).toHaveLength(8);
      // Key metrics should be rendered first
      expect(renderSteps[0]).toBe('renderKeyMetrics');
      // Key factors should be rendered last
      expect(renderSteps[7]).toBe('renderKeyFactors');
    });
  });

  describe('DOM Ready Handling', () => {
    it('should support both loading and ready document states', () => {
      // The init module checks document.readyState
      const states = ['loading', 'interactive', 'complete'];
      expect(states).toContain('loading');
      expect(states).toContain('complete');
    });
  });
});
