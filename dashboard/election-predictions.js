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

    container.innerHTML = parties.map(party => {
      const changeClass = party.change >= 0 ? 'positive' : 'negative';
      const changeSymbol = party.change >= 0 ? '+' : '';
      const cardClass = party.change >= 0 ? 'gain' : 'loss';

      return `
        <div class="prediction-card ${cardClass}">
          <h3 class="prediction-party">${party.name}</h3>
          <div class="prediction-seats">
            <div class="seats-current">
              <div style="font-size: 0.75rem; color: var(--text-secondary);">Current</div>
              <strong>${party.currentSeats}</strong>
            </div>
            <div class="seats-arrow">→</div>
            <div class="seats-predicted">
              <div style="font-size: 0.75rem; color: var(--text-secondary);">Predicted</div>
              <strong>${party.predictedSeats}</strong>
            </div>
          </div>
          <div class="seats-change ${changeClass}">
            ${changeSymbol}${party.change} seats (${party.voteShare}%)
          </div>
          <div class="confidence-interval">
            95% CI: ${party.confidenceInterval.min}-${party.confidenceInterval.max} seats
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render coalition scenarios
   */
  renderCoalitionScenarios() {
    const container = document.getElementById('coalition-scenarios');
    const { coalitionScenarios } = this.data;

    container.innerHTML = coalitionScenarios.map(scenario => {
      const majorityClass = scenario.majority ? 'yes' : 'no';
      const majorityText = scenario.majority ? 'Majority ✓' : 'No Majority';

      return `
        <div class="scenario-card">
          <div class="scenario-probability">${scenario.probability}%</div>
          <h3 class="scenario-name">${scenario.name}</h3>
          <div class="scenario-composition">
            ${scenario.composition.map(partyId => 
              `<span class="party-badge">${partyId}</span>`
            ).join('')}
          </div>
          <div class="scenario-seats">
            <strong>${scenario.totalSeats}</strong> seats (175 required for majority)
          </div>
          <span class="scenario-majority ${majorityClass}">
            ${majorityText}
          </span>
          <div style="margin-top: var(--spacing-sm); font-size: var(--font-size-sm); color: var(--text-secondary);">
            Risk Level: <strong>${scenario.riskLevel}</strong>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render key factors affecting the election
   */
  renderKeyFactors() {
    const { keyFactors } = this.data;
    
    return `
      <div class="key-factors">
        <h3>Key Election Factors</h3>
        <ul>
          ${keyFactors.map(factor => `<li>${factor}</li>`).join('')}
        </ul>
      </div>
    `;
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
