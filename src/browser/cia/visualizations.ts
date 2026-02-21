/**
 * @module CIA/Visualizations
 * @category Intelligence Platform - Visual Analytics Engine
 *
 * @description
 * CIA Dashboard Renderer Module – Intelligence Visualization Engine.
 * Primary rendering engine for Swedish parliamentary intelligence operations,
 * transforming complex CIA-exported political data into actionable visual
 * intelligence. Orchestrates 6+ specialized visualization types designed
 * specifically for real-time political risk assessment and coalition
 * forecasting analysis.
 *
 * @author Hack23 AB - Intelligence Analytics
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2024-01-15

 *
 * @intelligence Intelligence Visualization Engine — primary rendering engine transforming complex CIA-exported political data into actionable visual intelligence. Orchestrates 6+ specialized visualization types for real-time political risk assessment and coalition forecasting analysis.
 *
 * @business Visual analytics value driver — visualization quality directly determines user perception of platform intelligence depth. Each visualization type is a feature-marketable capability. Custom visualization engine enables white-label offerings for B2G/enterprise clients.
 *
 * @marketing Visual content factory — every rendered visualization is a potential marketing asset: embeddable widgets, shareable images, presentation slides, and report graphics. High-quality visualizations are the most shared content type, driving organic reach and brand recognition.
 * */

import type {
  OverviewDashboard,
  PartyPerformance,
  Top10Influential,
  CommitteeNetwork,
  VotingPatterns,
  MPRanking,
  CommitteeEntry,
} from './data-loader.js';

/* ------------------------------------------------------------------ */
/*  Global library reference (loaded via <script> tag)                */
/* ------------------------------------------------------------------ */

const Chart = (globalThis as any).Chart;

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
/* ------------------------------------------------------------------ */

/** Data bundle consumed by the renderer. */
export interface RendererData {
  overview?: OverviewDashboard;
  partyPerf?: PartyPerformance;
  top10?: Top10Influential;
  committees?: CommitteeNetwork;
  votingPatterns?: VotingPatterns;
}

/** Chart.js instance reference map. */
interface ChartInstanceMap {
  [key: string]: InstanceType<typeof Chart> | undefined;
}

/* ------------------------------------------------------------------ */
/*  CIADashboardRenderer class                                        */
/* ------------------------------------------------------------------ */

export class CIADashboardRenderer {
  readonly data: RendererData;
  private charts: ChartInstanceMap;

  constructor(data: RendererData) {
    this.data = data;
    this.charts = {};
  }

  /** Render key metrics section. */
  renderKeyMetrics(): void {
    const { overview } = this.data || {};

    if (!overview) {
      console.warn('Invalid or missing overview data');
      return;
    }

    // Update metric values with null checks
    const totalMpsEl = document.getElementById('metric-total-mps');
    if (totalMpsEl && overview.keyMetrics) {
      totalMpsEl.textContent = String(overview.keyMetrics.totalMPs);
    }
    const totalPartiesEl = document.getElementById('metric-total-parties');
    if (totalPartiesEl && overview.keyMetrics) {
      totalPartiesEl.textContent = String(overview.keyMetrics.totalParties);
    }
    const riskRulesEl = document.getElementById('metric-risk-rules');
    if (riskRulesEl && overview.keyMetrics) {
      riskRulesEl.textContent = String(overview.keyMetrics.totalRiskRules);
    }
    const coalitionSeatsEl = document.getElementById('metric-coalition-seats');
    if (coalitionSeatsEl && overview.keyMetrics) {
      coalitionSeatsEl.textContent = String(overview.keyMetrics.coalitionSeats);
    }

    // Update risk alerts with null checks
    const hasRiskAlerts = overview.riskAlerts && overview.riskAlerts.last90Days;
    const alertCriticalEl = document.getElementById('alert-critical');
    if (alertCriticalEl && hasRiskAlerts) {
      alertCriticalEl.textContent = String(overview.riskAlerts.last90Days.critical);
    }
    const alertMajorEl = document.getElementById('alert-major');
    if (alertMajorEl && hasRiskAlerts) {
      alertMajorEl.textContent = String(overview.riskAlerts.last90Days.major);
    }
    const alertMinorEl = document.getElementById('alert-minor');
    if (alertMinorEl && hasRiskAlerts) {
      alertMinorEl.textContent = String(overview.riskAlerts.last90Days.minor);
    }
  }

  /** Render party performance charts. */
  renderPartyPerformance(): void {
    const { partyPerf } = this.data;

    // Defensive check for data structure
    if (!partyPerf || !Array.isArray(partyPerf.parties)) {
      console.warn('Invalid or missing party performance data');
      return;
    }

    // Party Seats Chart
    const seatsCtx = document.getElementById('party-seats-chart') as HTMLCanvasElement | null;
    if (seatsCtx && typeof Chart !== 'undefined') {
      // Defensive check for nested party properties
      const hasValidMetrics = partyPerf.parties.every(
        p => p && p.metrics && typeof p.metrics.seats === 'number'
      );
      if (!hasValidMetrics) {
        console.warn('Some parties have invalid or missing metrics data');
      }

      this.charts.seats = new Chart(seatsCtx, {
        type: 'bar',
        data: {
          labels: partyPerf.parties.map(p => p.shortName || 'Unknown'),
          datasets: [
            {
              label: 'Current Seats',
              data: partyPerf.parties.map(p =>
                p && p.metrics && typeof p.metrics.seats === 'number' ? p.metrics.seats : 0
              ),
              backgroundColor: [
                'rgba(224, 32, 32, 0.8)',
                'rgba(221, 171, 0, 0.8)',
                'rgba(82, 126, 196, 0.8)',
                'rgba(175, 8, 42, 0.8)',
                'rgba(0, 150, 65, 0.8)',
                'rgba(0, 90, 170, 0.8)',
                'rgba(83, 160, 60, 0.8)',
                'rgba(0, 106, 179, 0.8)',
              ],
              borderColor: [
                'rgb(224, 32, 32)',
                'rgb(221, 171, 0)',
                'rgb(82, 126, 196)',
                'rgb(175, 8, 42)',
                'rgb(0, 150, 65)',
                'rgb(0, 90, 170)',
                'rgb(83, 160, 60)',
                'rgb(0, 106, 179)',
              ],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Current Riksdag Seats by Party',
              font: { size: 16, weight: 'bold' },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 120,
              title: { display: true, text: 'Number of Seats' },
            },
          },
        },
      });
    }

    // Party Cohesion Chart
    const cohesionCtx = document.getElementById('party-cohesion-chart') as HTMLCanvasElement | null;
    if (cohesionCtx && typeof Chart !== 'undefined') {
      const hasValidVoting = partyPerf.parties.every(
        p =>
          p &&
          p.voting &&
          typeof p.voting.cohesionScore === 'number' &&
          typeof p.voting.rebellionRate === 'number'
      );
      if (!hasValidVoting) {
        console.warn('Some parties have invalid or missing voting data');
      }

      this.charts.cohesion = new Chart(cohesionCtx, {
        type: 'line',
        data: {
          labels: partyPerf.parties.map(p => p.shortName || 'Unknown'),
          datasets: [
            {
              label: 'Voting Cohesion (%)',
              data: partyPerf.parties.map(p =>
                p && p.voting && typeof p.voting.cohesionScore === 'number'
                  ? p.voting.cohesionScore
                  : 0
              ),
              borderColor: 'rgb(0, 102, 51)',
              backgroundColor: 'rgba(0, 102, 51, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              label: 'Rebellion Rate (%)',
              data: partyPerf.parties.map(p =>
                p && p.voting && typeof p.voting.rebellionRate === 'number'
                  ? p.voting.rebellionRate
                  : 0
              ),
              borderColor: 'rgb(220, 53, 69)',
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Party Voting Cohesion vs Rebellion Rate',
              font: { size: 16, weight: 'bold' },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: 'Percentage (%)' },
            },
          },
        },
      });
    }
  }

  /** Render Top 10 rankings. */
  renderTop10Rankings(): void {
    const { top10 } = this.data;
    const container = document.getElementById('influential-mps');

    if (!container) return;

    if (!top10 || !Array.isArray(top10.rankings)) {
      console.warn('Invalid or missing top 10 rankings data');
      return;
    }

    container.textContent = '';
    const fragment = document.createDocumentFragment();

    top10.rankings.forEach((mp: MPRanking) => {
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
      const influenceScore =
        mp && typeof mp.influenceScore === 'number' && Number.isFinite(mp.influenceScore)
          ? mp.influenceScore
          : null;
      scoreValue.textContent = influenceScore !== null ? influenceScore.toFixed(1) : 'N/A';

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

  /** Render voting patterns heatmap. */
  renderVotingPatterns(): void {
    const { votingPatterns } = this.data;
    const ctx = document.getElementById('voting-heatmap') as HTMLCanvasElement | null;

    if (!ctx || typeof Chart === 'undefined') return;

    if (
      !votingPatterns ||
      !votingPatterns.votingMatrix ||
      !votingPatterns.votingMatrix.labels ||
      !votingPatterns.votingMatrix.partyNames ||
      !Array.isArray(votingPatterns.votingMatrix.agreementMatrix)
    ) {
      console.warn('Invalid or missing voting patterns data');
      return;
    }

    const matrix = votingPatterns.votingMatrix;

    this.charts.heatmap = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: matrix.labels,
        datasets: matrix.agreementMatrix.map((row: number[], i: number) => ({
          label: matrix.partyNames[i],
          data: row,
          backgroundColor: `hsla(${i * 45}, 70%, 50%, 0.6)`,
          stack: 'Stack ' + i,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Party Agreement Matrix (%)',
            font: { size: 16, weight: 'bold' },
          },
          legend: { display: true, position: 'right' },
        },
        scales: {
          x: { title: { display: true, text: 'Parties' } },
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Agreement %' },
          },
        },
      },
    });
  }

  /** Render committee network. */
  renderCommitteeNetwork(): void {
    const { committees } = this.data;
    const container = document.getElementById('committee-list');

    if (!container) return;

    if (!committees || !Array.isArray(committees.committees)) {
      console.warn('Invalid or missing committee network data');
      return;
    }

    container.textContent = '';
    const fragment = document.createDocumentFragment();

    committees.committees.forEach((committee: CommitteeEntry) => {
      const card = document.createElement('div');
      card.className = 'committee-card';

      const nameEl = document.createElement('h3');
      nameEl.className = 'committee-name';
      nameEl.textContent = committee.name;

      const stats = document.createElement('div');
      stats.className = 'committee-stats';

      const createStat = (label: string, value: string | number): HTMLDivElement => {
        const stat = document.createElement('div');
        stat.className = 'committee-stat';

        const statLabel = document.createElement('span');
        statLabel.className = 'stat-label';
        statLabel.textContent = label + ':';

        const statValue = document.createElement('span');
        statValue.className = 'stat-value';
        statValue.textContent = String(value);

        stat.appendChild(statLabel);
        stat.appendChild(statValue);
        return stat;
      };

      const memberCount =
        typeof committee.memberCount === 'number' ? committee.memberCount : 'N/A';
      const influenceScore =
        typeof committee.influenceScore === 'number' && Number.isFinite(committee.influenceScore)
          ? committee.influenceScore.toFixed(1)
          : 'N/A';
      const meetingsPerYear =
        typeof committee.meetingsPerYear === 'number' ? committee.meetingsPerYear : 'N/A';
      const documentsProcessed =
        typeof committee.documentsProcessed === 'number' ? committee.documentsProcessed : 'N/A';

      stats.appendChild(createStat('Members', memberCount));
      stats.appendChild(createStat('Influence', influenceScore));
      stats.appendChild(createStat('Meetings/Year', meetingsPerYear));
      stats.appendChild(createStat('Documents', documentsProcessed));

      const issues = document.createElement('div');
      issues.className = 'committee-issues';

      const issuesHeading = document.createElement('h4');
      issuesHeading.textContent = 'Key Issues';
      issues.appendChild(issuesHeading);

      if (Array.isArray(committee.keyIssues)) {
        committee.keyIssues.forEach((issue: string) => {
          const tag = document.createElement('span');
          tag.className = 'issue-tag';
          tag.textContent = issue;
          issues.appendChild(tag);
        });
      }

      card.appendChild(nameEl);
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
      p1.appendChild(
        document.createTextNode(
          ' Interactive committee network visualization would be rendered here using D3.js or similar library.'
        )
      );

      const p2 = document.createElement('p');
      p2.textContent = `Current data shows ${committees.networkGraph.nodes.length} committees with ${committees.networkGraph.edges.length} interconnections.`;

      vizDiv.appendChild(p1);
      vizDiv.appendChild(p2);
      networkViz.appendChild(vizDiv);
    }
  }

  /** Destroy all charts (for cleanup). */
  destroy(): void {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}
