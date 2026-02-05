/**
 * CIA Dashboard Renderer Module
 * Renders CIA intelligence data visualizations
 */

export class CIADashboardRenderer {
  constructor(data) {
    this.data = data;
    this.charts = {};
  }

  /**
   * Render key metrics section
   */
  renderKeyMetrics() {
    const { overview } = this.data;
    
    // Update metric values
    document.getElementById('metric-total-mps').textContent = 
      overview.keyMetrics.totalMPs;
    document.getElementById('metric-total-parties').textContent = 
      overview.keyMetrics.totalParties;
    document.getElementById('metric-risk-rules').textContent = 
      overview.keyMetrics.totalRiskRules;
    document.getElementById('metric-coalition-seats').textContent = 
      overview.keyMetrics.coalitionSeats;

    // Update risk alerts
    document.getElementById('alert-critical').textContent = 
      overview.riskAlerts.last90Days.critical;
    document.getElementById('alert-major').textContent = 
      overview.riskAlerts.last90Days.major;
    document.getElementById('alert-minor').textContent = 
      overview.riskAlerts.last90Days.minor;
  }

  /**
   * Render party performance charts
   */
  renderPartyPerformance() {
    const { partyPerf } = this.data;
    
    // Party Seats Chart
    const seatsCtx = document.getElementById('party-seats-chart');
    if (seatsCtx && typeof Chart !== 'undefined') {
      this.charts.seats = new Chart(seatsCtx, {
        type: 'bar',
        data: {
          labels: partyPerf.parties.map(p => p.shortName),
          datasets: [{
            label: 'Current Seats',
            data: partyPerf.parties.map(p => p.metrics.seats),
            backgroundColor: [
              'rgba(224, 32, 32, 0.8)',    // S - Red
              'rgba(221, 171, 0, 0.8)',    // SD - Yellow
              'rgba(82, 126, 196, 0.8)',   // M - Blue
              'rgba(175, 8, 42, 0.8)',     // V - Dark Red
              'rgba(0, 150, 65, 0.8)',     // C - Green
              'rgba(0, 90, 170, 0.8)',     // KD - Dark Blue
              'rgba(83, 160, 60, 0.8)',    // MP - Green
              'rgba(0, 106, 179, 0.8)'     // L - Blue
            ],
            borderColor: [
              'rgb(224, 32, 32)',
              'rgb(221, 171, 0)',
              'rgb(82, 126, 196)',
              'rgb(175, 8, 42)',
              'rgb(0, 150, 65)',
              'rgb(0, 90, 170)',
              'rgb(83, 160, 60)',
              'rgb(0, 106, 179)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Current Riksdag Seats by Party',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 120,
              title: {
                display: true,
                text: 'Number of Seats'
              }
            }
          }
        }
      });
    }

    // Party Cohesion Chart
    const cohesionCtx = document.getElementById('party-cohesion-chart');
    if (cohesionCtx && typeof Chart !== 'undefined') {
      this.charts.cohesion = new Chart(cohesionCtx, {
        type: 'line',
        data: {
          labels: partyPerf.parties.map(p => p.shortName),
          datasets: [{
            label: 'Voting Cohesion (%)',
            data: partyPerf.parties.map(p => p.voting.cohesionScore),
            borderColor: 'rgb(0, 102, 51)',
            backgroundColor: 'rgba(0, 102, 51, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7
          }, {
            label: 'Rebellion Rate (%)',
            data: partyPerf.parties.map(p => p.voting.rebellionRate),
            borderColor: 'rgb(220, 53, 69)',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Party Voting Cohesion vs Rebellion Rate',
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Percentage (%)'
              }
            }
          }
        }
      });
    }
  }

  /**
   * Render Top 10 rankings
   */
  renderTop10Rankings() {
    const { top10 } = this.data;
    const container = document.getElementById('influential-mps');
    
    container.innerHTML = top10.rankings.map(mp => `
      <div class="ranking-item">
        <div class="ranking-number">${mp.rank}</div>
        <div class="ranking-info">
          <div class="ranking-name">${mp.firstName} ${mp.lastName}</div>
          <div class="ranking-party">${mp.party}</div>
          <div class="ranking-role">${mp.role}</div>
        </div>
        <div class="ranking-score">
          <div class="score-value">${mp.influenceScore.toFixed(1)}</div>
          <div class="score-label">Influence</div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render voting patterns heatmap
   */
  renderVotingPatterns() {
    const { votingPatterns } = this.data;
    const ctx = document.getElementById('voting-heatmap');
    
    if (!ctx || typeof Chart === 'undefined') return;

    // Prepare data for matrix visualization
    const matrix = votingPatterns.votingMatrix;
    const datasets = matrix.agreementMatrix.map((row, i) => ({
      label: matrix.partyNames[i],
      data: row.map((value, j) => ({
        x: matrix.labels[j],
        y: matrix.labels[i],
        v: value
      })),
      backgroundColor: (context) => {
        const value = context.raw?.v || 0;
        const alpha = value / 100;
        return `rgba(0, 102, 51, ${alpha})`;
      }
    }));

    // Using a bar chart as a simple heatmap alternative
    this.charts.heatmap = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: matrix.labels,
        datasets: matrix.agreementMatrix.map((row, i) => ({
          label: matrix.partyNames[i],
          data: row,
          backgroundColor: `hsla(${i * 45}, 70%, 50%, 0.6)`,
          stack: 'Stack ' + i
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Party Agreement Matrix (%)',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: true,
            position: 'right'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Parties'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Agreement %'
            }
          }
        }
      }
    });
  }

  /**
   * Render committee network
   */
  renderCommitteeNetwork() {
    const { committees } = this.data;
    const container = document.getElementById('committee-list');
    
    // Render committee cards
    container.innerHTML = committees.committees.map(committee => `
      <div class="committee-card">
        <h3 class="committee-name">${committee.name}</h3>
        <div class="committee-stats">
          <div class="committee-stat">
            <span class="stat-label">Members:</span>
            <span class="stat-value">${committee.memberCount}</span>
          </div>
          <div class="committee-stat">
            <span class="stat-label">Influence:</span>
            <span class="stat-value">${committee.influenceScore.toFixed(1)}</span>
          </div>
          <div class="committee-stat">
            <span class="stat-label">Meetings/Year:</span>
            <span class="stat-value">${committee.meetingsPerYear}</span>
          </div>
          <div class="committee-stat">
            <span class="stat-label">Documents:</span>
            <span class="stat-value">${committee.documentsProcessed}</span>
          </div>
        </div>
        <div class="committee-issues">
          <h4>Key Issues</h4>
          ${committee.keyIssues.map(issue => 
            `<span class="issue-tag">${issue}</span>`
          ).join('')}
        </div>
      </div>
    `).join('');

    // Add simple network visualization note
    const networkViz = document.getElementById('network-visualization');
    networkViz.innerHTML = `
      <div>
        <p><strong>Network Graph:</strong> Interactive committee network visualization would be rendered here using D3.js or similar library.</p>
        <p>Current data shows ${committees.networkGraph.nodes.length} committees with ${committees.networkGraph.edges.length} interconnections.</p>
      </div>
    `;
  }

  /**
   * Destroy all charts (for cleanup)
   */
  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}
