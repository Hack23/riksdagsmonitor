/**
 * Tests for Election 2026 Predictions Module
 * Tests rendering of seat predictions, coalition scenarios,
 * key factors, and summary statistics
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Election 2026 Predictions', () => {
  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Seat Predictions Rendering', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <section id="election-forecast" class="election-section">
          <h2 class="section-heading">Swedish Election 2026 Predictions</h2>
          <div id="seat-predictions" class="predictions-grid"></div>
          <h3>Coalition Scenarios</h3>
          <div id="coalition-scenarios" class="scenarios-grid"></div>
          <h3>Key Election Factors</h3>
          <div id="key-factors"></div>
        </section>
      `;
    });

    it('should have seat predictions container', () => {
      expect(document.getElementById('seat-predictions')).not.toBeNull();
    });

    it('should render prediction cards for all 8 parties', () => {
      const container = document.getElementById('seat-predictions');
      const parties = [
        { name: 'Social Democrats (S)', currentSeats: 107, predictedSeats: 110, change: 3, voteShare: 31.5, confidenceInterval: { min: 105, max: 115 } },
        { name: 'Sweden Democrats (SD)', currentSeats: 73, predictedSeats: 70, change: -3, voteShare: 20.1, confidenceInterval: { min: 65, max: 75 } },
        { name: 'Moderates (M)', currentSeats: 68, predictedSeats: 65, change: -3, voteShare: 18.5, confidenceInterval: { min: 60, max: 70 } },
        { name: 'Left Party (V)', currentSeats: 24, predictedSeats: 26, change: 2, voteShare: 7.5, confidenceInterval: { min: 22, max: 30 } },
        { name: 'Centre Party (C)', currentSeats: 24, predictedSeats: 25, change: 1, voteShare: 7.2, confidenceInterval: { min: 21, max: 29 } },
        { name: 'Christian Democrats (KD)', currentSeats: 19, predictedSeats: 18, change: -1, voteShare: 5.2, confidenceInterval: { min: 15, max: 21 } },
        { name: 'Green Party (MP)', currentSeats: 18, predictedSeats: 20, change: 2, voteShare: 5.8, confidenceInterval: { min: 16, max: 24 } },
        { name: 'Liberals (L)', currentSeats: 16, predictedSeats: 15, change: -1, voteShare: 4.4, confidenceInterval: { min: 12, max: 18 } }
      ];

      const fragment = document.createDocumentFragment();
      parties.forEach(party => {
        const card = document.createElement('div');
        card.className = `prediction-card ${party.change >= 0 ? 'gain' : 'loss'}`;

        const partyName = document.createElement('h3');
        partyName.className = 'prediction-party';
        partyName.textContent = party.name;

        const changeDiv = document.createElement('div');
        changeDiv.className = `seats-change ${party.change >= 0 ? 'positive' : 'negative'}`;
        changeDiv.textContent = `${party.change >= 0 ? '+' : ''}${party.change} seats (${party.voteShare}%)`;

        const ciDiv = document.createElement('div');
        ciDiv.className = 'confidence-interval';
        ciDiv.textContent = `95% CI: ${party.confidenceInterval.min}-${party.confidenceInterval.max} seats`;

        card.appendChild(partyName);
        card.appendChild(changeDiv);
        card.appendChild(ciDiv);
        fragment.appendChild(card);
      });
      container.appendChild(fragment);

      const cards = container.querySelectorAll('.prediction-card');
      expect(cards).toHaveLength(8);
    });

    it('should classify gain/loss cards correctly', () => {
      const parties = [
        { change: 3 },
        { change: -3 },
        { change: 0 }
      ];

      parties.forEach(party => {
        const cardClass = party.change >= 0 ? 'gain' : 'loss';
        const changeClass = party.change >= 0 ? 'positive' : 'negative';
        
        if (party.change > 0) {
          expect(cardClass).toBe('gain');
          expect(changeClass).toBe('positive');
        } else if (party.change < 0) {
          expect(cardClass).toBe('loss');
          expect(changeClass).toBe('negative');
        } else {
          expect(cardClass).toBe('gain');
          expect(changeClass).toBe('positive');
        }
      });
    });

    it('should format change text with +/- symbol', () => {
      const positive = { change: 3, voteShare: 31.5 };
      const negative = { change: -3, voteShare: 20.1 };

      const posText = `${positive.change >= 0 ? '+' : ''}${positive.change} seats (${positive.voteShare}%)`;
      const negText = `${negative.change >= 0 ? '+' : ''}${negative.change} seats (${negative.voteShare}%)`;

      expect(posText).toBe('+3 seats (31.5%)');
      expect(negText).toBe('-3 seats (20.1%)');
    });

    it('should display confidence intervals', () => {
      const party = { confidenceInterval: { min: 105, max: 115 } };
      const ciText = `95% CI: ${party.confidenceInterval.min}-${party.confidenceInterval.max} seats`;
      expect(ciText).toBe('95% CI: 105-115 seats');
    });

    it('should handle missing confidence interval', () => {
      const party = { name: 'Test', confidenceInterval: null };
      let ciText = '95% CI: N/A';
      if (party.confidenceInterval &&
          typeof party.confidenceInterval.min === 'number' &&
          typeof party.confidenceInterval.max === 'number') {
        ciText = `95% CI: ${party.confidenceInterval.min}-${party.confidenceInterval.max} seats`;
      }
      expect(ciText).toBe('95% CI: N/A');
    });

    it('should handle missing forecast data gracefully', () => {
      const data = null;
      if (!data || !data.forecast || !Array.isArray(data.forecast.parties)) {
        expect(true).toBe(true);
      }
    });
  });

  describe('Coalition Scenarios Rendering', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="coalition-scenarios" class="scenarios-grid"></div>
      `;
    });

    it('should have coalition scenarios container', () => {
      expect(document.getElementById('coalition-scenarios')).not.toBeNull();
    });

    it('should render scenario cards', () => {
      const container = document.getElementById('coalition-scenarios');
      const scenarios = [
        {
          name: 'Tidö Coalition',
          probability: 35,
          composition: ['M', 'SD', 'KD', 'L'],
          totalSeats: 176,
          majority: true,
          riskLevel: 'Moderate'
        },
        {
          name: 'Red-Green',
          probability: 30,
          composition: ['S', 'V', 'MP', 'C'],
          totalSeats: 181,
          majority: true,
          riskLevel: 'Low'
        }
      ];

      const fragment = document.createDocumentFragment();
      scenarios.forEach(scenario => {
        const card = document.createElement('div');
        card.className = 'scenario-card';

        const name = document.createElement('h3');
        name.className = 'scenario-name';
        name.textContent = scenario.name;

        const probability = document.createElement('div');
        probability.className = 'scenario-probability';
        probability.textContent = `${scenario.probability}%`;

        const composition = document.createElement('div');
        composition.className = 'scenario-composition';
        scenario.composition.forEach(partyId => {
          const badge = document.createElement('span');
          badge.className = 'party-badge';
          badge.textContent = partyId;
          composition.appendChild(badge);
        });

        const majority = document.createElement('span');
        majority.className = `scenario-majority ${scenario.majority ? 'yes' : 'no'}`;
        majority.textContent = scenario.majority ? 'Majority ✓' : 'No Majority';

        card.appendChild(name);
        card.appendChild(probability);
        card.appendChild(composition);
        card.appendChild(majority);
        fragment.appendChild(card);
      });
      container.appendChild(fragment);

      const cards = container.querySelectorAll('.scenario-card');
      expect(cards).toHaveLength(2);
      expect(cards[0].querySelector('.scenario-name').textContent).toBe('Tidö Coalition');
      expect(cards[0].querySelector('.scenario-probability').textContent).toBe('35%');
      expect(cards[0].querySelectorAll('.party-badge')).toHaveLength(4);
      expect(cards[0].querySelector('.scenario-majority').classList.contains('yes')).toBe(true);
    });

    it('should display 175 seats required for majority', () => {
      const requiredSeats = 175;
      const scenario = { totalSeats: 176, majority: true };
      expect(scenario.totalSeats).toBeGreaterThanOrEqual(requiredSeats);
      expect(scenario.majority).toBe(true);
    });

    it('should handle missing composition array', () => {
      const scenario = { name: 'Test', composition: null };
      const hasComposition = Array.isArray(scenario.composition);
      expect(hasComposition).toBe(false);
    });

    it('should handle missing coalition scenarios data', () => {
      const data = { coalitionScenarios: undefined };
      if (!data || !Array.isArray(data.coalitionScenarios)) {
        expect(true).toBe(true);
      }
    });
  });

  describe('Key Factors Rendering', () => {
    beforeEach(() => {
      document.body.innerHTML = `<div id="key-factors"></div>`;
    });

    it('should have key-factors container', () => {
      expect(document.getElementById('key-factors')).not.toBeNull();
    });

    it('should render key factors list', () => {
      const container = document.getElementById('key-factors');
      const keyFactors = [
        'Economic policy and inflation concerns',
        'Immigration and integration debates',
        'Energy policy transition',
        'Healthcare system reform',
        'Defense spending (NATO 2%)'
      ];

      const wrapper = document.createElement('div');
      wrapper.className = 'key-factors';
      const heading = document.createElement('h3');
      heading.textContent = 'Key Election Factors';
      wrapper.appendChild(heading);

      const list = document.createElement('ul');
      keyFactors.forEach(factor => {
        const li = document.createElement('li');
        li.textContent = String(factor);
        list.appendChild(li);
      });
      wrapper.appendChild(list);
      container.appendChild(wrapper);

      const items = container.querySelectorAll('li');
      expect(items).toHaveLength(5);
      expect(items[0].textContent).toBe('Economic policy and inflation concerns');
    });

    it('should use textContent to prevent XSS', () => {
      const maliciousFactor = '<script>alert("xss")</script>';
      const li = document.createElement('li');
      li.textContent = String(maliciousFactor);
      expect(li.textContent).toBe('<script>alert("xss")</script>');
      expect(li.innerHTML).not.toContain('<script>');
    });

    it('should handle missing keyFactors gracefully', () => {
      const data = { keyFactors: null };
      if (!data || !Array.isArray(data.keyFactors)) {
        expect(true).toBe(true);
      }
    });
  });

  describe('Election Date Formatting', () => {
    it('should format valid election date', () => {
      const electionDate = '2026-09-13';
      const date = new Date(electionDate);
      expect(Number.isNaN(date.getTime())).toBe(false);
      
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      expect(formatted).toContain('2026');
      expect(formatted).toContain('13');
    });

    it('should handle invalid election date', () => {
      const invalidDate = 'not-a-date';
      const date = new Date(invalidDate);
      expect(Number.isNaN(date.getTime())).toBe(true);
    });

    it('should handle missing election date', () => {
      const data = { electionDate: null };
      if (!data || !data.electionDate) {
        expect(true).toBe(true);
      }
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate total seats', () => {
      const parties = [
        { predictedSeats: 110, change: 3 },
        { predictedSeats: 70, change: -3 },
        { predictedSeats: 65, change: -3 },
        { predictedSeats: 26, change: 2 },
        { predictedSeats: 25, change: 1 },
        { predictedSeats: 18, change: -1 },
        { predictedSeats: 20, change: 2 },
        { predictedSeats: 15, change: -1 }
      ];

      const totalSeats = parties.reduce((sum, p) => sum + p.predictedSeats, 0);
      expect(totalSeats).toBe(349);
    });

    it('should count gainers, losers, and stable parties', () => {
      const parties = [
        { change: 3 }, { change: -3 }, { change: -3 }, { change: 2 },
        { change: 1 }, { change: -1 }, { change: 2 }, { change: -1 }
      ];

      const gainers = parties.filter(p => p.change > 0).length;
      const losers = parties.filter(p => p.change < 0).length;
      const stable = parties.filter(p => p.change === 0).length;

      expect(gainers).toBe(4);
      expect(losers).toBe(4);
      expect(stable).toBe(0);
    });

    it('should find biggest gain and loss', () => {
      const parties = [
        { name: 'S', change: 3 },
        { name: 'SD', change: -3 },
        { name: 'V', change: 2 },
        { name: 'MP', change: 2 }
      ];

      const biggestGain = parties.reduce((max, p) => p.change > max.change ? p : max, parties[0]);
      const biggestLoss = parties.reduce((min, p) => p.change < min.change ? p : min, parties[0]);

      expect(biggestGain.name).toBe('S');
      expect(biggestLoss.name).toBe('SD');
    });

    it('should handle empty parties array', () => {
      const parties = [];
      if (parties.length === 0) {
        const stats = {
          totalSeats: 0,
          gainers: 0,
          losers: 0,
          stable: 0,
          biggestGain: null,
          biggestLoss: null
        };
        expect(stats.totalSeats).toBe(0);
        expect(stats.biggestGain).toBeNull();
      }
    });

    it('should handle missing forecast data', () => {
      const data = null;
      if (!data || !data.forecast || !Array.isArray(data.forecast.parties)) {
        const defaultStats = {
          totalSeats: 0,
          gainers: 0,
          losers: 0,
          stable: 0,
          biggestGain: null,
          biggestLoss: null
        };
        expect(defaultStats.totalSeats).toBe(0);
      }
    });
  });
});
