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
    
    // Update metric values with null checks
    const totalMpsEl = document.getElementById('metric-total-mps');
    if (totalMpsEl) {
      totalMpsEl.textContent = overview.keyMetrics.totalMPs;
    }
    const totalPartiesEl = document.getElementById('metric-total-parties');
    if (totalPartiesEl) {
      totalPartiesEl.textContent = overview.keyMetrics.totalParties;
    }
    const riskRulesEl = document.getElementById('metric-risk-rules');
    if (riskRulesEl) {
      riskRulesEl.textContent = overview.keyMetrics.totalRiskRules;
    }
    const coalitionSeatsEl = document.getElementById('metric-coalition-seats');
    if (coalitionSeatsEl) {
      coalitionSeatsEl.textContent = overview.keyMetrics.coalitionSeats;
    }

    // Update risk alerts with null checks
    const alertCriticalEl = document.getElementById('alert-critical');
    if (alertCriticalEl) {
      alertCriticalEl.textContent = overview.riskAlerts.last90Days.critical;
    }
    const alertMajorEl = document.getElementById('alert-major');
    if (alertMajorEl) {
      alertMajorEl.textContent = overview.riskAlerts.last90Days.major;
    }
    const alertMinorEl = document.getElementById('alert-minor');
    if (alertMinorEl) {
      alertMinorEl.textContent = overview.riskAlerts.last90Days.minor;
    }
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
    
    if (!container) return;
    
    // Clear existing content safely
    container.textContent = '';
    
    const fragment = document.createDocumentFragment();
    
    top10.rankings.forEach(mp => {
      const item = document.createElement('div');
      item.className = 'ranking-item';
      
      const number = document.createElement('div');
      number.className = 'ranking-number';
      number.textContent = String(mp.rank);
      
      const info = document.createElement('div');
      info.className = 'ranking-info';
      
      const name = document.createElement('div');
      name.className = 'ranking-name';
      name.textContent = `${mp.firstName} ${mp.lastName}`;
      
      const party = document.createElement('div');
      party.className = 'ranking-party';
      party.textContent = mp.party;
      
      const role = document.createElement('div');
      role.className = 'ranking-role';
      role.textContent = mp.role;
      
      info.appendChild(name);
      info.appendChild(party);
      info.appendChild(role);
      
      const score = document.createElement('div');
      score.className = 'ranking-score';
      
      const scoreValue = document.createElement('div');
      scoreValue.className = 'score-value';
      scoreValue.textContent = mp.influenceScore.toFixed(1);
      
      const scoreLabel = document.createElement('div');
      scoreLabel.className = 'score-label';
      scoreLabel.textContent = 'Influence';
      
      score.appendChild(scoreValue);
      score.appendChild(scoreLabel);
      
      item.appendChild(number);
      item.appendChild(info);
      item.appendChild(score);
      
      fragment.appendChild(item);
    });
    
    container.appendChild(fragment);
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
    
    if (!container) return;
    
    // Clear existing content safely
    container.textContent = '';
    
    const fragment = document.createDocumentFragment();
    
    committees.committees.forEach(committee => {
      const card = document.createElement('div');
      card.className = 'committee-card';
      
      const name = document.createElement('h3');
      name.className = 'committee-name';
      name.textContent = committee.name;
      
      const stats = document.createElement('div');
      stats.className = 'committee-stats';
      
      // Helper to create stat item
      const createStat = (label, value) => {
        const stat = document.createElement('div');
        stat.className = 'committee-stat';
        
        const statLabel = document.createElement('span');
        statLabel.className = 'stat-label';
        statLabel.textContent = label + ':';
        
        const statValue = document.createElement('span');
        statValue.className = 'stat-value';
        statValue.textContent = value;
        
        stat.appendChild(statLabel);
        stat.appendChild(statValue);
        return stat;
      };
      
      stats.appendChild(createStat('Members', committee.memberCount));
      stats.appendChild(createStat('Influence', committee.influenceScore.toFixed(1)));
      stats.appendChild(createStat('Meetings/Year', committee.meetingsPerYear));
      stats.appendChild(createStat('Documents', committee.documentsProcessed));
      
      const issues = document.createElement('div');
      issues.className = 'committee-issues';
      
      const issuesHeading = document.createElement('h4');
      issuesHeading.textContent = 'Key Issues';
      issues.appendChild(issuesHeading);
      
      committee.keyIssues.forEach(issue => {
        const tag = document.createElement('span');
        tag.className = 'issue-tag';
        tag.textContent = issue;
        issues.appendChild(tag);
      });
      
      card.appendChild(name);
      card.appendChild(stats);
      card.appendChild(issues);
      
      fragment.appendChild(card);
    });
    
    container.appendChild(fragment);
    
    // Add simple network visualization note
    const networkViz = document.getElementById('network-visualization');
    if (networkViz) {
      networkViz.textContent = '';
      
      const vizDiv = document.createElement('div');
      
      const p1 = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Network Graph:';
      p1.appendChild(strong);
      p1.appendChild(document.createTextNode(' Interactive committee network visualization would be rendered here using D3.js or similar library.'));
      
      const p2 = document.createElement('p');
      p2.textContent = `Current data shows ${committees.networkGraph.nodes.length} committees with ${committees.networkGraph.edges.length} interconnections.`;
      
      vizDiv.appendChild(p1);
      vizDiv.appendChild(p2);
      networkViz.appendChild(vizDiv);
    }
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
