/**
 * Election 2026 Predictions Module
 * Renders Swedish election forecasting and coalition scenarios
 */

export class Election2026Predictions {
  constructor(electionData) {
    this.data = electionData;
  }

  /**
   * Render seat predictions for all parties
   */
  renderSeatPredictions() {
    const container = document.getElementById('seat-predictions');
    const { parties } = this.data.forecast;
    
    if (!container) return;
    
    // Clear existing content safely
    container.textContent = '';
    
    const fragment = document.createDocumentFragment();

    parties.forEach(party => {
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
      currentValue.textContent = party.currentSeats;
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
      predictedValue.textContent = party.predictedSeats;
      predictedDiv.appendChild(predictedLabel);
      predictedDiv.appendChild(predictedValue);

      seatsDiv.appendChild(currentDiv);
      seatsDiv.appendChild(arrowDiv);
      seatsDiv.appendChild(predictedDiv);

      // Change
      const changeDiv = document.createElement('div');
      changeDiv.className = `seats-change ${changeClass}`;
      changeDiv.textContent = `${changeSymbol}${party.change} seats (${party.voteShare}%)`;

      // Confidence interval
      const confidenceDiv = document.createElement('div');
      confidenceDiv.className = 'confidence-interval';
      confidenceDiv.textContent = `95% CI: ${party.confidenceInterval.min}-${party.confidenceInterval.max} seats`;

      card.appendChild(partyName);
      card.appendChild(seatsDiv);
      card.appendChild(changeDiv);
      card.appendChild(confidenceDiv);

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  /**
   * Render coalition scenarios
   */
  renderCoalitionScenarios() {
    const container = document.getElementById('coalition-scenarios');
    const { coalitionScenarios } = this.data;
    
    if (!container) return;
    
    // Clear existing content safely
    container.textContent = '';
    
    const fragment = document.createDocumentFragment();

    coalitionScenarios.forEach(scenario => {
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
      
      scenario.composition.forEach(partyId => {
        const badge = document.createElement('span');
        badge.className = 'party-badge';
        badge.textContent = partyId;
        composition.appendChild(badge);
      });

      const seats = document.createElement('div');
      seats.className = 'scenario-seats';
      const seatsStrong = document.createElement('strong');
      seatsStrong.textContent = scenario.totalSeats;
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
   * Render key factors affecting the election
   */
  renderKeyFactors() {
    const container = document.getElementById('key-factors');
    const { keyFactors } = this.data;

    if (!container) {
      return;
    }

    // Clear existing content safely
    container.textContent = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'key-factors';

    const heading = document.createElement('h3');
    heading.textContent = 'Key Election Factors';
    wrapper.appendChild(heading);

    const list = document.createElement('ul');

    keyFactors.forEach(factor => {
      const listItem = document.createElement('li');
      // Use textContent to prevent XSS from untrusted factor values
      listItem.textContent = String(factor);
      list.appendChild(listItem);
    });

    wrapper.appendChild(list);
    container.appendChild(wrapper);
  }

  /**
   * Get election date formatted
   */
  getFormattedElectionDate() {
    const date = new Date(this.data.electionDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Calculate and return summary statistics
   */
  getSummaryStats() {
    const { parties } = this.data.forecast;
    
    // Handle empty parties array defensively
    if (!parties || parties.length === 0) {
      return {
        totalSeats: 0,
        gainers: 0,
        losers: 0,
        stable: 0,
        biggestGain: null,
        biggestLoss: null
      };
    }
    
    return {
      totalSeats: parties.reduce((sum, p) => sum + p.predictedSeats, 0),
      gainers: parties.filter(p => p.change > 0).length,
      losers: parties.filter(p => p.change < 0).length,
      stable: parties.filter(p => p.change === 0).length,
      biggestGain: parties.reduce((max, p) => p.change > max.change ? p : max, parties[0]),
      biggestLoss: parties.reduce((min, p) => p.change < min.change ? p : min, parties[0])
    };
  }
}
