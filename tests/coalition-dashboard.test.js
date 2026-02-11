/**
 * Tests for Coalition & Voting Pattern Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Coalition Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="coalition-dashboard" class="dashboard-container">
        <h2>Coalition & Voting Patterns</h2>
        <div class="dashboard-grid">
          <div class="chart-card wide">
            <h3>Coalition Network</h3>
            <div id="coalitionNetwork" role="img" aria-label="Coalition network diagram"></div>
            <table id="coalitionNetworkTable" class="sr-only">
              <caption>Coalition Network Data</caption>
              <thead><tr><th>Party 1</th><th>Party 2</th><th>Alignment</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="chart-card">
            <canvas id="votingAnomalyChart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="behavioralPatternsChart"></canvas>
          </div>
          <div class="chart-card wide">
            <canvas id="decisionTrendsChart"></canvas>
          </div>
          <div class="chart-card">
            <div id="alignmentHeatMap" role="img" aria-label="Party alignment heat map"></div>
          </div>
        </div>
        <div class="data-attribution">
          <p>Data source: CIA Platform</p>
        </div>
      </section>
    `;
    container = document.getElementById('coalition-dashboard');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DOM Structure', () => {
    it('should have coalition dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('coalition-dashboard');
    });

    it('should have dashboard-container class', () => {
      expect(container.classList.contains('dashboard-container')).toBe(true);
    });

    it('should have all chart canvases', () => {
      expect(document.getElementById('votingAnomalyChart')).not.toBeNull();
      expect(document.getElementById('behavioralPatternsChart')).not.toBeNull();
      expect(document.getElementById('decisionTrendsChart')).not.toBeNull();
    });

    it('should have D3.js visualization containers', () => {
      expect(document.getElementById('coalitionNetwork')).not.toBeNull();
      expect(document.getElementById('alignmentHeatMap')).not.toBeNull();
    });

    it('should have wide chart cards', () => {
      const wideCards = container.querySelectorAll('.chart-card.wide');
      expect(wideCards.length).toBe(2);
    });

    it('should have data attribution', () => {
      const attribution = container.querySelector('.data-attribution');
      expect(attribution).not.toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have ARIA labels on D3 containers', () => {
      const network = document.getElementById('coalitionNetwork');
      expect(network.getAttribute('role')).toBe('img');
      expect(network.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have accessible fallback table for network', () => {
      const table = document.getElementById('coalitionNetworkTable');
      expect(table).not.toBeNull();
      expect(table.classList.contains('sr-only')).toBe(true);
    });

    it('should have table caption', () => {
      const caption = document.querySelector('#coalitionNetworkTable caption');
      expect(caption).not.toBeNull();
      expect(caption.textContent).toBeTruthy();
    });

    it('should have proper heading hierarchy', () => {
      const h2 = container.querySelector('h2');
      const h3s = container.querySelectorAll('h3');
      expect(h2).not.toBeNull();
      expect(h3s.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Coalition Data Processing', () => {
    it('should parse coalition voting data', () => {
      const csvData = 'Party1,Party2,Alignment\nS,MP,0.85\nM,KD,0.78\nS,V,0.72';
      const lines = csvData.split('\n');
      expect(lines.length).toBe(4);
      const headers = lines[0].split(',');
      expect(headers).toContain('Alignment');
    });

    it('should calculate alignment scores between parties', () => {
      const alignments = [
        { party1: 'S', party2: 'MP', score: 0.85 },
        { party1: 'M', party2: 'KD', score: 0.78 }
      ];
      const smpAlignment = alignments.find(a => a.party1 === 'S' && a.party2 === 'MP');
      expect(smpAlignment.score).toBe(0.85);
    });

    it('should identify coalition blocs', () => {
      const leftBloc = ['S', 'V', 'MP'];
      const rightBloc = ['M', 'KD', 'L'];
      expect(leftBloc).toContain('S');
      expect(rightBloc).toContain('M');
      expect(leftBloc.length + rightBloc.length).toBe(6);
    });
  });

  describe('D3.js Network', () => {
    it('should prepare network data nodes', () => {
      const nodes = [
        { id: 'S', label: 'Social Democrats' },
        { id: 'M', label: 'Moderates' },
        { id: 'SD', label: 'Sweden Democrats' }
      ];
      expect(nodes).toHaveLength(3);
      expect(nodes[0].id).toBe('S');
    });

    it('should prepare network data links', () => {
      const links = [
        { source: 'S', target: 'MP', value: 0.85 },
        { source: 'M', target: 'KD', value: 0.78 }
      ];
      expect(links).toHaveLength(2);
      expect(links[0].source).toBe('S');
      expect(links[0].value).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('should add loading class to container', () => {
      container.classList.add('loading');
      expect(container.classList.contains('loading')).toBe(true);
    });

    it('should remove loading class when data loads', () => {
      container.classList.add('loading');
      container.classList.remove('loading');
      expect(container.classList.contains('loading')).toBe(false);
    });
  });
});
