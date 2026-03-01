/**
 * @module Analytics/CoalitionIntelligence/Scenarios
 * @description Chart.js voting analysis and scenario visualization for the Coalition Intelligence Dashboard.
 *
 * Contains:
 * - **renderVotingAnomalyChart**: Chart.js voting anomaly analysis
 * - **renderBehavioralPatternsChart**: Chart.js behavioral pattern radar/bar
 * - **renderDecisionTrendsChart**: Decision trend line charts
 * - Accessibility: createAccessibleNetworkTable (screen reader table)
 * - UI helpers: showTooltip, hideTooltip, showLoadingState, hideLoadingState, showErrorState
 * - Fallback data generators
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Chart: any;
declare const d3: any;
import type { PartyNode, CoalitionLink, VotingAnomaly } from './types.js';

function renderVotingAnomalyChart(): void {
  const canvas: HTMLCanvasElement | null = document.getElementById('votingAnomalyChart') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!ctx) return;
  
  const anomalies: VotingAnomaly[] = dataCache.votingAnomalies || [];
  
  // Prepare data
  const datasets: any[] = Object.keys(PARTIES).map((partyId: string) => {
    const partyData: VotingAnomaly[] = anomalies.filter((a: VotingAnomaly) => a.party === partyId);
    
    return {
      label: PARTIES[partyId].name,
      data: partyData.map((a: VotingAnomaly) => ({
        x: new Date(a.date).getTime(),
        y: a.deviation
      })),
      backgroundColor: PARTIES[partyId].color,
      borderColor: PARTIES[partyId].color,
      pointRadius: 6,
      pointHoverRadius: 8
    };
  });

  new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Voting Anomalies (Last 5 Years)',
          font: { size: 16, weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            label: function(context: any): string {
              const date: Date = new Date(context.parsed.x);
              return `${context.dataset.label}: Deviation ${context.parsed.y.toFixed(2)} on ${date.toLocaleDateString()}`;
            }
          }
        },
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'year',
            displayFormats: {
              year: 'yyyy'
            }
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Deviation Score'
          },
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Render Chart.js behavioral patterns bar chart
 */
function renderBehavioralPatternsChart(): void {
  const canvas: HTMLCanvasElement | null = document.getElementById('behavioralPatternsChart') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!ctx) return;
  
  const behavioral: BehavioralPatterns = dataCache.behavioralPatterns || {};
  const partyIds: string[] = Object.keys(PARTIES);
  const data: any = {
    labels: partyIds.map((id: string) => PARTIES[id].name),
    datasets: [{
      label: 'Party Consistency Score (%)',
      data: partyIds.map((id: string) => behavioral[id] || 80),
      backgroundColor: partyIds.map((id: string) => PARTIES[id].color),
      borderColor: partyIds.map((id: string) => PARTIES[id].color),
      borderWidth: 1
    }]
  };

  new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Party Voting Consistency (2019-2024)',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context: any): string {
              return `Consistency: ${context.parsed.x.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Consistency Score (%)'
          }
        }
      }
    }
  });
}

/**
 * Render Chart.js decision trends timeline
 */
function renderDecisionTrendsChart(): void {
  const canvas: HTMLCanvasElement | null = document.getElementById('decisionTrendsChart') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!ctx) return;
  
  // Determine year range from data
  let years: number[] = [];
  let useRealData: boolean = false;
  
  const annualVotes: AnnualVotes = dataCache.annualVotes || {};
  
  if (Object.keys(annualVotes).length > 0) {
    // Use real data years
    const allYears: Set<number> = new Set<number>();
    Object.values(annualVotes).forEach((partyData: AnnualVoteEntry[]) => {
      partyData.forEach((d: AnnualVoteEntry) => allYears.add(d.year));
    });
    years = Array.from(allYears).sort((a: number, b: number) => a - b);
    useRealData = true;
    console.log('📊 Using real annual votes data for decision trends');
  }
  
  // Fallback to 1990-2026 range
  if (years.length === 0) {
    for (let year: number = 1990; year <= 2026; year++) {
      years.push(year);
    }
    console.log('📊 Using generated data for decision trends');
  }

  const datasets: any[] = Object.keys(PARTIES).map((partyId: string) => {
    let data: number[];
    
    if (useRealData && annualVotes[partyId]) {
      // Use real data
      const partyYearData: Record<number, number> = {};
      annualVotes[partyId].forEach((d: AnnualVoteEntry) => {
        partyYearData[d.year] = d.votes;
      });
      
      // Map to year array (0 if no data for that year)
      data = years.map((year: number) => partyYearData[year] || 0);
    } else {
      // No real data available, use placeholder zeros
      data = years.map(() => 0);
    }
    
    return {
      label: PARTIES[partyId].name,
      data: data,
      borderColor: PARTIES[partyId].color,
      backgroundColor: PARTIES[partyId].color + '20',
      tension: 0.4,
      fill: false
    };
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Annual Voting Activity Trends (${years[0]}-${years[years.length - 1]})`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'bottom'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context: any): string {
              return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' votes';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Year'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Number of Votes'
          },
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Create accessible table fallback for network diagram
 */
function createAccessibleNetworkTable(nodes: PartyNode[], links: CoalitionLink[]): void {
  const table: HTMLElement | null = document.getElementById('coalitionNetworkTable');
  if (!table) return;

  let html: string = '<caption>Coalition Network Data</caption>';
  html += '<thead><tr><th>Party</th><th>Influence</th><th>Coalition Partners</th></tr></thead>';
  html += '<tbody>';

  nodes.forEach((node: PartyNode) => {
    const partners: string = links
      .filter((l: CoalitionLink) => {
        const sourceId: string = typeof l.source === 'object' ? (l.source as PartyNode).id : String(l.source);
        const targetId: string = typeof l.target === 'object' ? (l.target as PartyNode).id : String(l.target);
        return sourceId === node.id || targetId === node.id;
      })
      .map((l: CoalitionLink) => {
        const sourceId: string = typeof l.source === 'object' ? (l.source as PartyNode).id : String(l.source);
        const targetId: string = typeof l.target === 'object' ? (l.target as PartyNode).id : String(l.target);
        const partnerId: string = sourceId === node.id ? targetId : sourceId;
        return `${PARTIES[partnerId].name} (${(l.strength * 100).toFixed(0)}%)`;
      })
      .join(', ');

    html += `<tr>
      <td>${node.fullName}</td>
      <td>${node.influence.toFixed(1)}</td>
      <td>${partners}</td>
    </tr>`;
  });

  html += '</tbody>';
  table.innerHTML = html;
}

/**
 * Show tooltip
 */
function showTooltip(event: MouseEvent, content: string): void {
  let tooltip: HTMLElement | null = document.getElementById('d3-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'd3-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = content;
  tooltip.style.display = 'block';
  tooltip.style.left = (event.pageX + 10) + 'px';
  tooltip.style.top = (event.pageY + 10) + 'px';
}

/**
 * Hide tooltip
 */
function hideTooltip(): void {
  const tooltip: HTMLElement | null = document.getElementById('d3-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

/**
 * Show loading state
 */
function showLoadingState(): void {
  const container: HTMLElement | null = document.getElementById('coalition-dashboard');
  if (container) {
    container.classList.add('loading');
  }
}

/**
 * Hide loading state
 */
function hideLoadingState(): void {
  const container: HTMLElement | null = document.getElementById('coalition-dashboard');
  if (container) {
    container.classList.remove('loading');
  }
}

/**
 * Show error state
 */
function showErrorState(message: string): void {
  const container: HTMLElement | null = document.getElementById('coalition-dashboard');
  if (container) {
    const errorDiv: HTMLDivElement = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.padding = '20px';
    errorDiv.style.background = '#ff000020';
    errorDiv.style.border = '1px solid #ff0000';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.marginTop = '20px';
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    container.appendChild(errorDiv);
  }
}

// ========== FALLBACK DATA GENERATORS ==========
// Used only when CSV data is unavailable (header-only files or fetch failures)

function generateMockCoalitionData(): CoalitionAlignment {
  // coalition_alignment.csv is header-only upstream - use known Swedish bloc patterns
  const data: CoalitionAlignment = {};
  const rightBloc: string[] = ['M', 'KD', 'L', 'SD'];
  const leftBloc: string[] = ['S', 'V', 'MP'];
  Object.keys(PARTIES).forEach((p1: string) => {
    data[p1] = {};
    Object.keys(PARTIES).forEach((p2: string) => {
      if (p1 !== p2) {
        const sameBloc: boolean = (rightBloc.includes(p1) && rightBloc.includes(p2)) ||
                        (leftBloc.includes(p1) && leftBloc.includes(p2));
        data[p1][p2] = sameBloc ? 0.70 : 0.35;
      }
    });
  });
  return data;
}

function generateMockBehavioralData(): BehavioralPatterns {
  // Fallback: neutral values until real data loads
  const data: BehavioralPatterns = {};
  Object.keys(PARTIES).forEach((p: string) => { data[p] = 80; });
  return data;
}

function generateMockDecisionData(): d3.DSVRowString<string>[] {
  return [];
}

function generateMockAnomalyData(): VotingAnomaly[] {
  return []; // Empty until real data loads
}

function generateMockAnnualVotesData(): AnnualVotes {
  return {}; // Empty until real data loads
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

})();
