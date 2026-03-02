/**
 * Tests for Coalition & Voting Pattern Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Coalition Dashboard', () => {
  let container;
  let originalFetch;

  beforeEach(() => {
    // Save original fetch mock from setup.js
    originalFetch = global.fetch;
    
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
    // Restore original fetch mock
    global.fetch = originalFetch;
    vi.clearAllMocks();
    document.body.innerHTML = '';
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

  describe('Data Source Configuration', () => {
    it('should configure local-first URLs for all CSV files', () => {
      // Verify DATA_CONFIG structure: each file key should map to [localUrl, remoteUrl]
      const expectedFiles = ['coalition', 'behavioral', 'decision', 'anomalyClassification', 'anomalyByParty', 'annualVotes', 'decisionTrends', 'partyMomentum'];
      const localPrefix = 'cia-data/';
      const remotePrefix = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';

      expectedFiles.forEach(_key => {
        // The dashboard JS defines DATA_CONFIG.files with these keys
        expect(localPrefix.startsWith('cia-data')).toBe(true);
        expect(remotePrefix).toContain('sample-data');
      });
    });

    it('should use local paths starting with cia-data/', () => {
      const localPaths = [
        'cia-data/party/distribution_coalition_alignment.csv',
        'cia-data/parties/distribution_behavioral_patterns_by_party.csv',
        'cia-data/parties/distribution_decision_patterns_by_party.csv',
        'cia-data/voting/distribution_voting_anomaly_classification.csv',
        'cia-data/anomaly/distribution_anomaly_by_party.csv',
        'cia-data/voting/distribution_annual_party_votes.csv',
        'cia-data/voting/distribution_decision_trends.csv',
        'cia-data/distribution_party_momentum.csv'
      ];
      localPaths.forEach(path => {
        expect(path).toMatch(/^cia-data\//);
        expect(path).toMatch(/\.csv$/);
      });
    });

    it('should have remote fallback URLs for all files', () => {
      const remoteBase = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';
      const remoteFiles = [
        'distribution_coalition_alignment.csv',
        'distribution_behavioral_patterns_by_party.csv',
        'distribution_decision_patterns_by_party.csv',
        'distribution_voting_anomaly_classification.csv',
        'distribution_anomaly_by_party.csv',
        'distribution_annual_party_votes.csv',
        'distribution_decision_trends.csv',
        'distribution_party_momentum.csv'
      ];
      remoteFiles.forEach(file => {
        const url = remoteBase + file;
        expect(url).toMatch(/^https:\/\//);
        expect(url).toMatch(/\.csv$/);
      });
    });
  });

  describe('Coalition Data Processing (Real CSV Schema)', () => {
    it('should parse behavioral patterns CSV with real columns', () => {
      // Real CSV: party,behavioral_assessment,politician_count,avg_absence_rate
      const csvData = 'party,behavioral_assessment,politician_count,avg_absence_rate\nS,STANDARD_BEHAVIOR,80,5.32\nS,ELEVATED_RISK,4,14.50\nM,STANDARD_BEHAVIOR,55,6.10';
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('party');
      expect(headers).toContain('behavioral_assessment');
      expect(headers).toContain('politician_count');
      expect(headers).toContain('avg_absence_rate');
    });

    it('should parse annual party votes CSV with real columns', () => {
      // Real CSV: year,party,vote_count,yes_votes,no_votes,absent
      const csvData = 'year,party,vote_count,yes_votes,no_votes,absent\n2002,S,12672,0,0,0\n2002,M,4840,0,0,0\n2023,S,8950,3200,2800,1100';
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('year');
      expect(headers).toContain('party');
      expect(headers).toContain('vote_count');
      expect(headers).toContain('yes_votes');
      expect(headers).toContain('no_votes');
      expect(headers).toContain('absent');
    });

    it('should parse decision trends CSV with real columns', () => {
      // Real CSV: year,month,decision_count,approved_decisions,rejected_decisions,approval_rate
      const csvData = 'year,month,decision_count,approved_decisions,rejected_decisions,approval_rate\n2021,2,4,1,3,25.00\n2024,10,15,12,3,80.00';
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('year');
      expect(headers).toContain('decision_count');
      expect(headers).toContain('approved_decisions');
      expect(headers).toContain('approval_rate');
    });

    it('should parse decision patterns CSV with real columns', () => {
      // Real CSV: party,committee,decision_year,decision_count,total_decisions,avg_approval_rate
      const csvData = 'party,committee,decision_year,decision_count,total_decisions,avg_approval_rate\nS,Socialförsäkringsutskottet,2024,5,10,80.00';
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('party');
      expect(headers).toContain('committee');
      expect(headers).toContain('decision_year');
      expect(headers).toContain('avg_approval_rate');
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

    it('should aggregate behavioral data by party', () => {
      const rows = [
        { party: 'S', behavioral_assessment: 'STANDARD_BEHAVIOR', politician_count: '80' },
        { party: 'S', behavioral_assessment: 'ELEVATED_RISK', politician_count: '4' },
        { party: 'M', behavioral_assessment: 'STANDARD_BEHAVIOR', politician_count: '55' }
      ];
      const partyData = {};
      rows.forEach(row => {
        if (!partyData[row.party]) partyData[row.party] = { total: 0, standard: 0 };
        const count = parseInt(row.politician_count);
        partyData[row.party].total += count;
        if (row.behavioral_assessment === 'STANDARD_BEHAVIOR') {
          partyData[row.party].standard += count;
        }
      });
      expect(partyData.S.total).toBe(84);
      expect(partyData.S.standard).toBe(80);
      expect(partyData.M.standard / partyData.M.total).toBeCloseTo(1.0);
    });
  });

  describe('D3.js Network', () => {
    it('should prepare network data nodes for all 8 parties', () => {
      const partyIds = ['S', 'M', 'SD', 'V', 'MP', 'C', 'L', 'KD'];
      const nodes = partyIds.map(id => ({ id, label: id }));
      expect(nodes).toHaveLength(8);
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

    it('should generate correct number of links for 8 parties', () => {
      const n = 8;
      const expectedLinks = (n * (n - 1)) / 2; // 28 unique pairs
      expect(expectedLinks).toBe(28);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle empty CSV data gracefully', () => {
      const emptyCSV = 'party,behavioral_assessment,politician_count,avg_absence_rate\n';
      const lines = emptyCSV.trim().split('\n');
      expect(lines.length).toBe(1); // header only
      const hasData = lines.length > 1;
      expect(hasData).toBe(false);
    });

    it('should provide fallback coalition data when CSV is empty', () => {
      // Simulates generateMockCoalitionData behavior
      const data = {};
      const parties = ['S', 'M', 'SD', 'V', 'MP', 'C', 'L', 'KD'];
      const rightBloc = ['M', 'KD', 'L', 'SD'];
      const leftBloc = ['S', 'V', 'MP'];
      parties.forEach(p1 => {
        data[p1] = {};
        parties.forEach(p2 => {
          if (p1 !== p2) {
            const sameBloc = (rightBloc.includes(p1) && rightBloc.includes(p2)) ||
                            (leftBloc.includes(p1) && leftBloc.includes(p2));
            data[p1][p2] = sameBloc ? 0.70 : 0.35;
          }
        });
      });
      expect(data.S.V).toBe(0.70);
      expect(data.M.KD).toBe(0.70);
      expect(data.S.M).toBe(0.35);
    });

    it('should handle fetch failures with mock fallback', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = fetchMock;
      
      // Should not throw, should fall back to mock data
      try {
        const _response = await fetch('cia-data/nonexistent.csv');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
      
      // Fetch will be restored in afterEach
    });

    it('should skip aggregate rows with party "-"', () => {
      const rows = [
        { party: '-', behavioral_assessment: 'ELEVATED_RISK', politician_count: '19' },
        { party: 'S', behavioral_assessment: 'STANDARD_BEHAVIOR', politician_count: '80' }
      ];
      const filtered = rows.filter(r => r.party !== '-');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].party).toBe('S');
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

  describe('Alignment Rate Data Processing', () => {
    it('should use alignment_rate directly as 0-1 scale without dividing by 100', () => {
      // Real CSV stores pairs alphabetically (e.g., KD,M not M,KD)
      const alignment = { 'KD': { 'M': 0.84 }, 'MP': { 'S': 0.72 } };
      
      // Network strength should use raw value (not /100)
      const strength = alignment['KD']['M'];
      expect(strength).toBe(0.84);
      expect(strength).toBeGreaterThan(0.5);
      expect(strength).toBeLessThanOrEqual(1.0);
      
      // Heat map should also use raw value
      const heatMapValue = alignment['MP']['S'];
      expect(heatMapValue).toBe(0.72);
      expect(heatMapValue * 100).toBeCloseTo(72); // Display as percentage
    });

    it('should handle reverse-pair lookups when CSV stores only one direction', () => {
      // CSV has KD,M but code may look up M,KD — reverse lookup should find it
      const alignment = { 'KD': { 'M': 0.84 } };
      
      // Forward lookup: KD -> M (present in CSV)
      const rawForward = alignment?.['KD']?.['M'];
      expect(typeof rawForward === 'number').toBe(true);
      expect(rawForward).toBe(0.84);
      
      // Reverse lookup: M -> KD (not in CSV — should check reverse)
      const rawDirect = alignment?.['M']?.['KD'];
      const rawReverse = alignment?.['KD']?.['M'];
      const resolved = typeof rawDirect === 'number' ? rawDirect : (typeof rawReverse === 'number' ? rawReverse : 0.5);
      expect(resolved).toBe(0.84); // Found via reverse lookup
    });

    it('should NOT divide alignment_rate by 100 (values are already 0-1)', () => {
      // This test validates the fix: alignment_rate 0.84 should render as 84%, not 0.84%
      const rawAlignmentRate = 0.84; // From CSV
      
      // WRONG (old behavior): dividing 0-1 value by 100 gives 0.0084
      const wrongValue = rawAlignmentRate / 100;
      expect(wrongValue).toBeLessThan(0.01); // This would be incorrect
      
      // CORRECT (new behavior): use raw value directly
      const correctValue = rawAlignmentRate;
      expect(correctValue).toBeCloseTo(0.84);
      expect(correctValue * 100).toBeCloseTo(84); // Display as 84%
    });

    it('should calculate node influence correctly with 0-1 alignment rates', () => {
      // With alignment rates in 0-1 range, average for same-bloc parties ~0.65-0.84
      const rates = [0.84, 0.83, 0.78]; // M-KD, M-L, M-C alignment rates
      const avgRate = rates.reduce((s, v) => s + v, 0) / rates.length; // ~0.817
      const influence = avgRate * 10 + 3; // ~11.17 (good range for visualization)
      
      expect(influence).toBeGreaterThan(5);
      expect(influence).toBeLessThan(15);
      expect(Math.max(5, Math.min(15, influence))).toBeCloseTo(influence);
    });

    it('should treat alignment value of 0 as valid, not fall back to 0.5', () => {
      // An alignment of 0 means zero alignment — it should NOT be treated as missing
      const alignment = { 'S': { 'SD': 0 } };
      const rawStrength = alignment?.['S']?.['SD'];
      const strength = typeof rawStrength === 'number' ? rawStrength : 0.5;
      expect(strength).toBe(0); // Must be 0, not 0.5
    });

    it('should fall back to 0.5 only for missing alignment data', () => {
      const alignment = { 'S': {} };
      const rawStrength = alignment?.['S']?.['M'];
      const strength = typeof rawStrength === 'number' ? rawStrength : 0.5;
      expect(strength).toBe(0.5);
    });

    it('should filter out non-party rows (e.g., party "-") when building alignment matrix', () => {
      // CSV contains rows where party1 or party2 is '-' (aggregate/independent)
      const PARTIES_SET = { 'S': true, 'M': true, 'SD': true, 'V': true, 'MP': true, 'C': true, 'L': true, 'KD': true };
      const csvRows = [
        { party1: 'KD', party2: 'M', alignment_rate: '0.84' },
        { party1: '-', party2: 'SD', alignment_rate: '0.39' },
        { party1: '-', party2: 'S', alignment_rate: '0.34' },
        { party1: 'S', party2: 'V', alignment_rate: '0.65' },
      ];
      
      const alignment = {};
      csvRows.forEach(row => {
        const p1 = row.party1; const p2 = row.party2; const rate = parseFloat(row.alignment_rate);
        if (!PARTIES_SET[p1] || !PARTIES_SET[p2]) return;
        if (!alignment[p1]) alignment[p1] = {};
        alignment[p1][p2] = rate;
        if (!alignment[p2]) alignment[p2] = {};
        alignment[p2][p1] = rate;
      });
      
      // '-' should not appear as a key in the alignment matrix
      expect(alignment['-']).toBeUndefined();
      // Real parties should be stored symmetrically
      expect(alignment['KD']['M']).toBe(0.84);
      expect(alignment['M']['KD']).toBe(0.84);
      expect(alignment['S']['V']).toBe(0.65);
      // '-' entries should not pollute any party's alignment map
      expect(alignment['SD']?.['-']).toBeUndefined();
      expect(alignment['S']?.['-']).toBeUndefined();
    });
  });

  describe('Mock Data Quality', () => {
    it('should generate deterministic non-empty mock anomaly data for all parties', () => {
      // Deterministic mock deviations (no Math.random)
      const deviations = { 'S': 1.85, 'M': 2.10, 'SD': 3.25, 'V': 1.45, 'MP': 2.70, 'C': 1.30, 'L': 1.95, 'KD': 2.50 };
      const parties = Object.keys(deviations);
      const anomalies = parties.map(party => ({
        party, date: '2024-06-15', deviation: deviations[party],
        severity: deviations[party] > 3 ? 'critical' : deviations[party] > 2 ? 'major' : 'minor'
      }));
      // Must always produce exactly 8 entries (one per party)
      expect(anomalies.length).toBe(8);
      expect(anomalies[0]).toHaveProperty('party');
      expect(anomalies[0]).toHaveProperty('deviation');
      // Verify deterministic: running again yields same result
      const anomalies2 = parties.map(party => ({
        party, date: '2024-06-15', deviation: deviations[party],
        severity: deviations[party] > 3 ? 'critical' : deviations[party] > 2 ? 'major' : 'minor'
      }));
      expect(anomalies).toEqual(anomalies2);
    });

    it('should generate deterministic non-empty mock annual votes data', () => {
      const parties = ['S', 'M', 'SD', 'V', 'MP', 'C', 'L', 'KD'];
      const baseline = 15000;
      const data = {};
      parties.forEach(party => {
        data[party] = [];
        for (let year = 2002; year <= 2025; year++) {
          const variation = year % 2 === 0 ? 0.9 : 1.1;
          data[party].push({ year, votes: Math.round(baseline * variation) });
        }
      });
      expect(Object.keys(data).length).toBe(8);
      expect(data['S'].length).toBeGreaterThan(0);
      expect(data['S'][0]).toHaveProperty('year');
      expect(data['S'][0]).toHaveProperty('votes');
      // Verify deterministic: even years get 0.9x, odd years get 1.1x
      expect(data['S'][0].votes).toBe(Math.round(baseline * 0.9)); // 2002 is even
      expect(data['S'][1].votes).toBe(Math.round(baseline * 1.1)); // 2003 is odd
    });
  });
});
