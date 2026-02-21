/**
 * @module CIA/ElectionPredictions
 * @category Intelligence Platform - Electoral Forecasting Engine
 *
 * @description
 * Election 2026 Predictions Module – Swedish Electoral Forecasting & Coalition Analysis.
 * Implements sophisticated electoral forecasting and coalition scenario analysis for the
 * Swedish parliamentary elections scheduled for 2026. Transforms raw polling data,
 * historical voting patterns, and demographic trends into probabilistic seat distribution
 * predictions and viable coalition formation scenarios.
 *
 * @author Hack23 AB - Electoral Intelligence
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2024-01-15
 */

import type { ElectionAnalysis } from './data-loader.js';

/* ------------------------------------------------------------------ */
/*  Global library reference (loaded via <script> tag)                */
/* ------------------------------------------------------------------ */

const Chart = (globalThis as any).Chart;

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
/* ------------------------------------------------------------------ */

/** Party forecast entry used in seat prediction rendering. */
export interface PartyForecast {
  name: string;
  currentSeats: number;
  predictedSeats: number;
  change: number;
  voteShare: number;
  confidenceInterval?: { min: number; max: number };
}

/** Coalition scenario entry. */
export interface CoalitionScenario {
  name: string;
  composition: string[];
  totalSeats: number;
  probability: number;
  majority: boolean;
  riskLevel: string;
}

/** Summary statistics from election forecast. */
export interface SummaryStats {
  totalSeats: number;
  gainers: number;
  losers: number;
  stable: number;
  biggestGain: PartyForecast | null;
  biggestLoss: PartyForecast | null;
}

/* ------------------------------------------------------------------ */
/*  Election2026Predictions class                                     */
/* ------------------------------------------------------------------ */

export class Election2026Predictions {
  readonly data: ElectionAnalysis;

  constructor(electionData: ElectionAnalysis) {
    this.data = electionData;
  }

  /** Render seat predictions for all parties. */
  renderSeatPredictions(): void {
    const container = document.getElementById('seat-predictions');

    if (!container) return;

    if (!this.data || !this.data.forecast || !Array.isArray(this.data.forecast.parties)) {
      console.warn('Invalid or missing election forecast data');
      return;
    }

    const { parties } = this.data.forecast;

    container.textContent = '';
    const fragment = document.createDocumentFragment();

    parties.forEach((party: PartyForecast) => {
      const changeClass = party.change >= 0 ? 'positive' : 'negative';
      const changeSymbol = party.change >= 0 ? '+' : '';
      const cardClass = party.change >= 0 ? 'gain' : 'loss';

      const card = document.createElement('div');
      card.className = `prediction-card ${cardClass}`;

      const partyName = document.createElement('h3');
      partyName.className = 'prediction-party';
      partyName.textContent = party.name;

      const seatsDiv = document.createElement('div');
      seatsDiv.className = 'prediction-seats';

      // Current seats
      const currentDiv = document.createElement('div');
      currentDiv.className = 'seats-current';
      const currentLabel = document.createElement('div');
      currentLabel.className = 'seats-label';
      currentLabel.textContent = 'Current';
      const currentValue = document.createElement('strong');
      currentValue.textContent = String(party.currentSeats);
      currentDiv.appendChild(currentLabel);
      currentDiv.appendChild(currentValue);

      // Arrow
      const arrowDiv = document.createElement('div');
      arrowDiv.className = 'seats-arrow';
      arrowDiv.textContent = '→';

      // Predicted seats
      const predictedDiv = document.createElement('div');
      predictedDiv.className = 'seats-predicted';
      const predictedLabel = document.createElement('div');
      predictedLabel.className = 'seats-label';
      predictedLabel.textContent = 'Predicted';
      const predictedValue = document.createElement('strong');
      predictedValue.textContent = String(party.predictedSeats);
      predictedDiv.appendChild(predictedLabel);
      predictedDiv.appendChild(predictedValue);

      seatsDiv.appendChild(currentDiv);
      seatsDiv.appendChild(arrowDiv);
      seatsDiv.appendChild(predictedDiv);

      // Change
      const changeDiv = document.createElement('div');
      changeDiv.className = `seats-change ${changeClass}`;
      changeDiv.textContent = `${changeSymbol}${party.change} seats (${party.voteShare}%)`;

      // Confidence interval with defensive check
      const confidenceDiv = document.createElement('div');
      confidenceDiv.className = 'confidence-interval';
      let ciText = '95% CI: N/A';
      if (
        party.confidenceInterval &&
        typeof party.confidenceInterval.min === 'number' &&
        typeof party.confidenceInterval.max === 'number'
      ) {
        ciText = `95% CI: ${party.confidenceInterval.min}-${party.confidenceInterval.max} seats`;
      } else {
        console.warn('Missing or invalid confidenceInterval for party', party.name, party);
      }
      confidenceDiv.textContent = ciText;

      card.appendChild(partyName);
      card.appendChild(seatsDiv);
      card.appendChild(changeDiv);
      card.appendChild(confidenceDiv);

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  /** Render coalition scenarios. */
  renderCoalitionScenarios(): void {
    const container = document.getElementById('coalition-scenarios');

    if (!container) return;

    if (!this.data || !Array.isArray(this.data.coalitionScenarios)) {
      console.warn('Invalid or missing coalition scenarios data');
      return;
    }

    const { coalitionScenarios } = this.data;

    container.textContent = '';
    const fragment = document.createDocumentFragment();

    coalitionScenarios.forEach((scenario: CoalitionScenario) => {
      const majorityClass = scenario.majority ? 'yes' : 'no';
      const majorityText = scenario.majority ? 'Majority ✓' : 'No Majority';

      const card = document.createElement('div');
      card.className = 'scenario-card';

      const probability = document.createElement('div');
      probability.className = 'scenario-probability';
      probability.textContent = `${scenario.probability}%`;

      const name = document.createElement('h3');
      name.className = 'scenario-name';
      name.textContent = scenario.name;

      const composition = document.createElement('div');
      composition.className = 'scenario-composition';

      if (Array.isArray(scenario.composition)) {
        scenario.composition.forEach((partyId: string) => {
          const badge = document.createElement('span');
          badge.className = 'party-badge';
          badge.textContent = partyId;
          composition.appendChild(badge);
        });
      } else {
        console.warn('Missing or invalid composition for scenario', scenario.name);
      }

      const seats = document.createElement('div');
      seats.className = 'scenario-seats';
      const seatsStrong = document.createElement('strong');
      seatsStrong.textContent = String(scenario.totalSeats);
      seats.appendChild(seatsStrong);
      seats.appendChild(document.createTextNode(' seats (175 required for majority)'));

      const majority = document.createElement('span');
      majority.className = `scenario-majority ${majorityClass}`;
      majority.textContent = majorityText;

      const riskLevel = document.createElement('div');
      riskLevel.className = 'scenario-risk-level';
      riskLevel.textContent = 'Risk Level: ';
      const riskStrong = document.createElement('strong');
      riskStrong.textContent = scenario.riskLevel;
      riskLevel.appendChild(riskStrong);

      card.appendChild(probability);
      card.appendChild(name);
      card.appendChild(composition);
      card.appendChild(seats);
      card.appendChild(majority);
      card.appendChild(riskLevel);

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  /**
   * Render key factors affecting the election.
   * NOTE: Requires `<div id="key-factors"></div>` in the HTML.
   */
  renderKeyFactors(): void {
    const container = document.getElementById('key-factors');

    if (!container) return;

    if (!this.data || !Array.isArray(this.data.keyFactors)) {
      console.warn('Invalid or missing key factors data');
      return;
    }

    const { keyFactors } = this.data;

    container.textContent = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'key-factors';

    const heading = document.createElement('h3');
    heading.textContent = 'Key Election Factors';
    wrapper.appendChild(heading);

    const list = document.createElement('ul');

    keyFactors.forEach((factor: string) => {
      const listItem = document.createElement('li');
      listItem.textContent = String(factor);
      list.appendChild(listItem);
    });

    wrapper.appendChild(list);
    container.appendChild(wrapper);
  }

  /**
   * Get election date formatted.
   * @returns Formatted election date or empty string if invalid.
   */
  getFormattedElectionDate(): string {
    if (!this.data || !this.data.electionDate) {
      console.warn('Invalid or missing election date data');
      return '';
    }

    const date = new Date(this.data.electionDate);

    if (Number.isNaN(date.getTime())) {
      console.warn('Election date is not a valid date:', this.data.electionDate);
      return '';
    }

    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.warn('Failed to format election date', error);
      return '';
    }
  }

  /**
   * Calculate and return summary statistics.
   * @returns Summary statistics object.
   */
  getSummaryStats(): SummaryStats {
    if (!this.data || !this.data.forecast || !Array.isArray(this.data.forecast.parties)) {
      console.warn('Invalid or missing election forecast data for summary stats');
      return {
        totalSeats: 0,
        gainers: 0,
        losers: 0,
        stable: 0,
        biggestGain: null,
        biggestLoss: null,
      };
    }

    const { parties } = this.data.forecast;

    if (parties.length === 0) {
      return {
        totalSeats: 0,
        gainers: 0,
        losers: 0,
        stable: 0,
        biggestGain: null,
        biggestLoss: null,
      };
    }

    return {
      totalSeats: parties.reduce((sum, p) => sum + p.predictedSeats, 0),
      gainers: parties.filter(p => p.change > 0).length,
      losers: parties.filter(p => p.change < 0).length,
      stable: parties.filter(p => p.change === 0).length,
      biggestGain: parties.reduce((max, p) => (p.change > max.change ? p : max), parties[0]),
      biggestLoss: parties.reduce((min, p) => (p.change < min.change ? p : min), parties[0]),
    };
  }
}
