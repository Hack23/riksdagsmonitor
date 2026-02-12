/**
 * Coalition & Voting Pattern Dashboard
 * Riksdagsmonitor - Swedish Parliament Intelligence Platform
 * 
 * Features:
 * - D3.js coalition network diagram (force-directed graph)
 * - Chart.js voting anomaly scatter plot
 * - D3.js party alignment heat map
 * - Chart.js behavioral patterns bar chart
 * - Chart.js decision trends timeline
 * 
 * Data Sources: CIA Platform (https://github.com/Hack23/cia)
 * License: Apache 2.0
 * Author: James Pether Sörling, CISSP, CISM
 */

(function() {
  'use strict';

  // Swedish party configuration
  const PARTIES = {
    'S': { name: 'Socialdemokraterna', color: '#E8112d', fullName: 'Social Democrats' },
    'M': { name: 'Moderaterna', color: '#52BDEC', fullName: 'Moderates' },
    'SD': { name: 'Sverigedemokraterna', color: '#DDDD00', fullName: 'Sweden Democrats' },
    'V': { name: 'Vänsterpartiet', color: '#DA291C', fullName: 'Left Party' },
    'MP': { name: 'Miljöpartiet', color: '#83CF39', fullName: 'Green Party' },
    'C': { name: 'Centerpartiet', color: '#009933', fullName: 'Centre Party' },
    'L': { name: 'Liberalerna', color: '#006AB3', fullName: 'Liberals' },
    'KD': { name: 'Kristdemokraterna', color: '#000077', fullName: 'Christian Democrats' }
  };

  // Data cache
  let dataCache = {
    coalitionAlignment: null,
    behavioralPatterns: null,
    decisionPatterns: null,
    votingAnomalies: null,
    annualVotes: null
  };

  // Remote base URL for CIA CSV data
  const REMOTE_BASE_URL = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';

  // Data source configuration with local-first + remote fallback
  const DATA_CONFIG = {
    files: {
      coalition: [
        'cia-data/party/distribution_coalition_alignment.csv',
        REMOTE_BASE_URL + 'distribution_coalition_alignment.csv'
      ],
      behavioral: [
        'cia-data/parties/distribution_behavioral_patterns_by_party.csv',
        REMOTE_BASE_URL + 'distribution_behavioral_patterns_by_party.csv'
      ],
      decision: [
        'cia-data/parties/distribution_decision_patterns_by_party.csv',
        REMOTE_BASE_URL + 'distribution_decision_patterns_by_party.csv'
      ],
      anomalyClassification: [
        'cia-data/voting/distribution_voting_anomaly_classification.csv',
        REMOTE_BASE_URL + 'distribution_voting_anomaly_classification.csv'
      ],
      anomalyByParty: [
        'cia-data/anomaly/distribution_anomaly_by_party.csv',
        REMOTE_BASE_URL + 'distribution_anomaly_by_party.csv'
      ],
      annualVotes: [
        'cia-data/voting/distribution_annual_party_votes.csv',
        REMOTE_BASE_URL + 'distribution_annual_party_votes.csv'
      ],
      decisionTrends: [
        'cia-data/voting/distribution_decision_trends.csv',
        REMOTE_BASE_URL + 'distribution_decision_trends.csv'
      ],
      partyMomentum: [
        'cia-data/distribution_party_momentum.csv',
        REMOTE_BASE_URL + 'distribution_party_momentum.csv'
      ]
    },
    useMockData: false // Set to true to force mock data
  };

  /**
   * Parse CSV text into array of objects
   * Uses D3's built-in CSV parser which properly handles quoted fields
   * @param {string} csvText - Raw CSV text
   * @returns {Array} Array of objects with header keys
   */
  function parseCSV(csvText) {
    try {
      // Use D3's csvParse which handles quoted fields, escaped quotes, etc.
      return d3.csvParse(csvText);
    } catch (error) {
      console.error('CSV parsing error:', error);
      return [];
    }
  }

  /**
   * Fetch CSV file with local-first fallback to remote
   * @param {Array<string>} urls - Array of [localUrl, remoteUrl]
   * @returns {Array|null} Parsed CSV data or null
   */
  async function fetchCSV(urls) {
    const urlList = Array.isArray(urls) ? urls : [urls];
    for (const url of urlList) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        const data = parseCSV(text);
        if (data && data.length > 0) {
          console.log(`  Loaded from: ${url} (${data.length} rows)`);
          return data;
        }
      } catch (error) {
        console.warn(`  Failed: ${url} - ${error.message}`);
      }
    }
    return null;
  }

  /**
   * Initialize the dashboard
   */
  async function initDashboard() {
    try {
      console.log('🚀 Initializing Coalition & Voting Pattern Dashboard...');
      
      // Show loading state
      showLoadingState();
      
      // Fetch all data in parallel
      await Promise.all([
        fetchCoalitionData(),
        fetchBehavioralData(),
        fetchDecisionData(),
        fetchAnomalyData(),
        fetchAnnualVotesData()
      ]);
      
      // Render all visualizations
      renderCoalitionNetwork();
      renderAlignmentHeatMap();
      renderVotingAnomalyChart();
      renderBehavioralPatternsChart();
      renderDecisionTrendsChart();
      
      // Hide loading state
      hideLoadingState();
      
      console.log('✅ Dashboard initialized successfully');
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      showErrorState(error.message);
    }
  }

  /**
   * Fetch coalition alignment data from CIA Platform
   */
  async function fetchCoalitionData() {
    try {
      if (DATA_CONFIG.useMockData) {
        dataCache.coalitionAlignment = generateMockCoalitionData();
        console.log('✅ Coalition data loaded (mock)');
        return;
      }

      // Try to load real CSV data
      const csvData = await fetchCSV(DATA_CONFIG.files.coalition);
      
      if (csvData && csvData.length > 0) {
        // Transform CSV data into coalition alignment format
        const alignment = {};
        
        csvData.forEach(row => {
          const party1 = row.party1;
          const party2 = row.party2;
          const alignmentRate = parseFloat(row.alignment_rate);
          
          if (!alignment[party1]) alignment[party1] = {};
          alignment[party1][party2] = alignmentRate;
        });
        
        dataCache.coalitionAlignment = alignment;
        console.log('✅ Coalition data loaded from CSV');
      } else {
        // Fallback to mock data
        dataCache.coalitionAlignment = generateMockCoalitionData();
        console.log('⚠️ Coalition data loaded (mock fallback)');
      }
    } catch (error) {
      console.error('Failed to fetch coalition data:', error);
      dataCache.coalitionAlignment = generateMockCoalitionData();
      console.log('⚠️ Coalition data loaded (mock fallback due to error)');
    }
  }

  /**
   * Fetch behavioral patterns data
   */
  async function fetchBehavioralData() {
    try {
      if (DATA_CONFIG.useMockData) {
        dataCache.behavioralPatterns = generateMockBehavioralData();
        console.log('✅ Behavioral data loaded (mock)');
        return;
      }

      // Try to load real CSV data
      const csvData = await fetchCSV(DATA_CONFIG.files.behavioral);
      
      if (csvData && csvData.length > 0) {
        // Transform CSV data into behavioral patterns format
        const patterns = {};
        
        // Aggregate by party, calculate consistency based on behavioral assessment
        const partyData = {};
        csvData.forEach(row => {
          const party = row.party;
          if (party === '-') return; // Skip aggregate rows
          
          if (!partyData[party]) {
            partyData[party] = { total: 0, standardBehavior: 0 };
          }
          
          const count = parseInt(row.politician_count) || 0;
          partyData[party].total += count;
          
          // Standard behavior counts as high consistency
          if (row.behavioral_assessment === 'STANDARD_BEHAVIOR') {
            partyData[party].standardBehavior += count;
          }
        });
        
        // Calculate consistency percentages
        Object.keys(partyData).forEach(party => {
          if (partyData[party].total > 0) {
            const consistency = (partyData[party].standardBehavior / partyData[party].total) * 100;
            // Normalize to 75-100 range for visualization
            patterns[party] = Math.max(75, Math.min(100, consistency || 80));
          }
        });
        
        dataCache.behavioralPatterns = patterns;
        console.log('✅ Behavioral data loaded from CSV');
      } else {
        dataCache.behavioralPatterns = generateMockBehavioralData();
        console.log('⚠️ Behavioral data loaded (mock fallback)');
      }
    } catch (error) {
      console.error('Failed to fetch behavioral data:', error);
      dataCache.behavioralPatterns = generateMockBehavioralData();
      console.log('⚠️ Behavioral data loaded (mock fallback due to error)');
    }
  }

  /**
   * Fetch decision patterns data
   */
  async function fetchDecisionData() {
    try {
      if (DATA_CONFIG.useMockData) {
        dataCache.decisionPatterns = generateMockDecisionData();
        console.log('✅ Decision data loaded (mock)');
        return;
      }

      // Try to load real CSV data (not currently used in visualizations)
      const csvData = await fetchCSV(DATA_CONFIG.files.decision);
      
      if (csvData && csvData.length > 0) {
        dataCache.decisionPatterns = csvData;
        console.log('✅ Decision data loaded from CSV');
      } else {
        dataCache.decisionPatterns = generateMockDecisionData();
        console.log('⚠️ Decision data loaded (mock fallback)');
      }
    } catch (error) {
      console.error('Failed to fetch decision data:', error);
      dataCache.decisionPatterns = generateMockDecisionData();
      console.log('⚠️ Decision data loaded (mock fallback due to error)');
    }
  }

  /**
   * Fetch voting anomaly data
   */
  async function fetchAnomalyData() {
    try {
      if (DATA_CONFIG.useMockData) {
        dataCache.votingAnomalies = generateMockAnomalyData();
        console.log('✅ Anomaly data loaded (mock)');
        return;
      }

      // Try to load real CSV data
      const csvData = await fetchCSV(DATA_CONFIG.files.anomalyByParty);
      
      if (csvData && csvData.length > 0) {
        // Transform CSV data into anomaly format
        const anomalies = [];
        
        // Generate anomaly entries from party anomaly data
        csvData.forEach(row => {
          const party = row.party;
          if (party === '-' || !party) return; // Skip aggregate rows
          
          const avgRebellions = parseFloat(row.avg_rebellions) || 0;
          const count = parseInt(row.politician_count) || 1;
          const classification = row.anomaly_classification || 'EXPECTED_BEHAVIOR';
          
          if (avgRebellions > 0 && count > 0) {
            // Create a single representative anomaly entry per party
            const deviation = Math.min(6, avgRebellions);
            anomalies.push({
              party: party,
              date: '2024-06-15',
              deviation: deviation,
              severity: classification === 'HIGH_REBELLION_RATE' ? 'critical' : 
                        deviation > 2.5 ? 'major' : 'minor'
            });
          }
        });
        
        dataCache.votingAnomalies = anomalies;
        console.log('✅ Anomaly data loaded from CSV');
      } else {
        dataCache.votingAnomalies = generateMockAnomalyData();
        console.log('⚠️ Anomaly data loaded (mock fallback)');
      }
    } catch (error) {
      console.error('Failed to fetch anomaly data:', error);
      dataCache.votingAnomalies = generateMockAnomalyData();
      console.log('⚠️ Anomaly data loaded (mock fallback due to error)');
    }
  }

  /**
   * Fetch annual votes data
   */
  async function fetchAnnualVotesData() {
    try {
      if (DATA_CONFIG.useMockData) {
        dataCache.annualVotes = generateMockAnnualVotesData();
        console.log('✅ Annual votes data loaded (mock)');
        return;
      }

      // Try to load real CSV data
      const csvData = await fetchCSV(DATA_CONFIG.files.annualVotes);
      
      if (csvData && csvData.length > 0) {
        // Transform CSV data into annual votes format
        const annualData = {};
        
        csvData.forEach(row => {
          const year = parseInt(row.year);
          const party = row.party;
          const voteCount = parseInt(row.vote_count) || 0;
          
          if (!annualData[party]) {
            annualData[party] = [];
          }
          
          annualData[party].push({
            year: year,
            votes: voteCount
          });
        });
        
        // Sort by year for each party
        Object.keys(annualData).forEach(party => {
          annualData[party].sort((a, b) => a.year - b.year);
        });
        
        dataCache.annualVotes = annualData;
        console.log('✅ Annual votes data loaded from CSV');
      } else {
        dataCache.annualVotes = generateMockAnnualVotesData();
        console.log('⚠️ Annual votes data loaded (mock fallback)');
      }
    } catch (error) {
      console.error('Failed to fetch annual votes data:', error);
      dataCache.annualVotes = generateMockAnnualVotesData();
      console.log('⚠️ Annual votes data loaded (mock fallback due to error)');
    }
  }

  /**
   * Render D3.js coalition network diagram
   */
  function renderCoalitionNetwork() {
    const container = document.getElementById('coalitionNetwork');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Get dimensions
    const width = container.clientWidth || 800;
    const height = 600;

    // Create SVG
    const svg = d3.select('#coalitionNetwork')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Create nodes from parties
    const nodes = Object.keys(PARTIES).map(id => {
      // Calculate influence from alignment data (sum of alignment rates with other parties)
      let influence = 5;
      const alignment = dataCache.coalitionAlignment;
      if (alignment && alignment[id]) {
        const rates = Object.values(alignment[id]).filter(v => typeof v === 'number');
        influence = rates.length > 0 ? (rates.reduce((s, v) => s + v, 0) / rates.length) / 10 + 3 : 5;
      }
      return {
        id,
        name: PARTIES[id].name,
        fullName: PARTIES[id].fullName,
        color: PARTIES[id].color,
        influence: Math.max(5, Math.min(15, influence))
      };
    });

    // Create coalition edges based on alignment data
    const links = [];
    const alignment = dataCache.coalitionAlignment;
    
    nodes.forEach((source, i) => {
      nodes.forEach((target, j) => {
        if (i < j) {
          const strength = alignment[source.id] && alignment[source.id][target.id] 
            ? alignment[source.id][target.id] / 100
            : 0.5; // Default neutral alignment if no data
          
          links.push({
            source: source.id,
            target: target.id,
            strength
          });
        }
      });
    });

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.influence * 3 + 10));

    // Create links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', d => d.strength)
      .attr('stroke-width', d => Math.sqrt(d.strength * 10))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // Highlight edge
        d3.select(this)
          .attr('stroke', '#ff6600')
          .attr('stroke-width', d => Math.sqrt(d.strength * 10) + 2);
        
        // Show tooltip
        showTooltip(event, `Coalition Strength: ${(d.strength * 100).toFixed(0)}%`);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('stroke', '#999')
          .attr('stroke-width', d => Math.sqrt(d.strength * 10));
        
        hideTooltip();
      });

    // Create nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('tabindex', '0')
      .attr('role', 'button')
      .attr('aria-label', d => `${d.fullName} party node`)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => d.influence * 3)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text(d => d.id)
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .attr('pointer-events', 'none');

    // Add party name labels
    node.append('text')
      .text(d => d.name)
      .attr('x', 0)
      .attr('y', d => d.influence * 3 + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'var(--text-color)')
      .attr('pointer-events', 'none');

    // Node interaction handlers
    node.on('mouseover', function(event, d) {
      d3.select(this).select('circle')
        .attr('stroke-width', 4)
        .attr('stroke', '#ff6600');
      
      showTooltip(event, `${d.fullName}<br>Influence: ${d.influence.toFixed(1)}`);
    })
    .on('mouseout', function(event, d) {
      d3.select(this).select('circle')
        .attr('stroke-width', 2)
        .attr('stroke', '#fff');
      
      hideTooltip();
    })
    .on('click', function(event, d) {
      alert(`${d.fullName}\nInfluence Score: ${d.influence.toFixed(1)}\nColor: ${d.color}`);
    })
    .on('keydown', function(event, d) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        alert(`${d.fullName}\nInfluence Score: ${d.influence.toFixed(1)}\nColor: ${d.color}`);
      }
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Create accessible table fallback
    createAccessibleNetworkTable(nodes, links);
  }

  /**
   * Render D3.js party alignment heat map
   */
  function renderAlignmentHeatMap() {
    const container = document.getElementById('alignmentHeatMap');
    if (!container) return;

    container.innerHTML = '';

    const width = container.clientWidth || 600;
    const height = 500;
    const margin = { top: 80, right: 20, bottom: 20, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#alignmentHeatMap')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const partyIds = Object.keys(PARTIES);
    const cellSize = Math.min(innerWidth / partyIds.length, innerHeight / partyIds.length);

    // Create scale for colors
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([0, 1]);

    // Create heat map data
    const heatMapData = [];
    partyIds.forEach(party1 => {
      partyIds.forEach(party2 => {
        const alignment = party1 === party2 ? 1.0 : 
          ((dataCache.coalitionAlignment[party1] && dataCache.coalitionAlignment[party1][party2]) 
            ? dataCache.coalitionAlignment[party1][party2] / 100 : 0.5);
        
        heatMapData.push({
          party1,
          party2,
          alignment
        });
      });
    });

    // Create cells
    g.selectAll('rect')
      .data(heatMapData)
      .enter()
      .append('rect')
      .attr('x', d => partyIds.indexOf(d.party2) * cellSize)
      .attr('y', d => partyIds.indexOf(d.party1) * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', d => colorScale(d.alignment))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        showTooltip(event, `${PARTIES[d.party1].name} ↔ ${PARTIES[d.party2].name}<br>Alignment: ${(d.alignment * 100).toFixed(0)}%`);
      })
      .on('mouseout', hideTooltip);

    // Add row labels
    g.selectAll('.row-label')
      .data(partyIds)
      .enter()
      .append('text')
      .attr('class', 'row-label')
      .attr('x', -10)
      .attr('y', (d, i) => i * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'var(--text-color)')
      .text(d => PARTIES[d].name);

    // Add column labels
    g.selectAll('.col-label')
      .data(partyIds)
      .enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('x', (d, i) => i * cellSize + cellSize / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'var(--text-color)')
      .text(d => d);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', 'var(--text-color)')
      .text('Party Voting Alignment Matrix');
  }

  /**
   * Render Chart.js voting anomaly scatter plot
   */
  function renderVotingAnomalyChart() {
    const canvas = document.getElementById('votingAnomalyChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Prepare data
    const datasets = Object.keys(PARTIES).map(partyId => {
      const partyData = dataCache.votingAnomalies.filter(a => a.party === partyId);
      
      return {
        label: PARTIES[partyId].name,
        data: partyData.map(a => ({
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
              label: function(context) {
                const date = new Date(context.parsed.x);
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
  function renderBehavioralPatternsChart() {
    const canvas = document.getElementById('behavioralPatternsChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const partyIds = Object.keys(PARTIES);
    const data = {
      labels: partyIds.map(id => PARTIES[id].name),
      datasets: [{
        label: 'Party Consistency Score (%)',
        data: partyIds.map(id => dataCache.behavioralPatterns[id] || 80),
        backgroundColor: partyIds.map(id => PARTIES[id].color),
        borderColor: partyIds.map(id => PARTIES[id].color),
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
              label: function(context) {
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
  function renderDecisionTrendsChart() {
    const canvas = document.getElementById('decisionTrendsChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Determine year range from data
    let years = [];
    let useRealData = false;
    
    if (dataCache.annualVotes && Object.keys(dataCache.annualVotes).length > 0) {
      // Use real data years
      const allYears = new Set();
      Object.values(dataCache.annualVotes).forEach(partyData => {
        partyData.forEach(d => allYears.add(d.year));
      });
      years = Array.from(allYears).sort((a, b) => a - b);
      useRealData = true;
      console.log('📊 Using real annual votes data for decision trends');
    }
    
    // Fallback to 1990-2026 range
    if (years.length === 0) {
      for (let year = 1990; year <= 2026; year++) {
        years.push(year);
      }
      console.log('📊 Using generated data for decision trends');
    }

    const datasets = Object.keys(PARTIES).map(partyId => {
      let data;
      
      if (useRealData && dataCache.annualVotes[partyId]) {
        // Use real data
        const partyYearData = {};
        dataCache.annualVotes[partyId].forEach(d => {
          partyYearData[d.year] = d.votes;
        });
        
        // Map to year array (0 if no data for that year)
        data = years.map(year => partyYearData[year] || 0);
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
              label: function(context) {
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
  function createAccessibleNetworkTable(nodes, links) {
    const table = document.getElementById('coalitionNetworkTable');
    if (!table) return;

    let html = '<caption>Coalition Network Data</caption>';
    html += '<thead><tr><th>Party</th><th>Influence</th><th>Coalition Partners</th></tr></thead>';
    html += '<tbody>';

    nodes.forEach(node => {
      const partners = links
        .filter(l => l.source.id === node.id || l.target.id === node.id)
        .map(l => {
          const partnerId = l.source.id === node.id ? l.target.id : l.source.id;
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
  function showTooltip(event, content) {
    let tooltip = document.getElementById('d3-tooltip');
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
  function hideTooltip() {
    const tooltip = document.getElementById('d3-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  /**
   * Show loading state
   */
  function showLoadingState() {
    const container = document.getElementById('coalition-dashboard');
    if (container) {
      container.classList.add('loading');
    }
  }

  /**
   * Hide loading state
   */
  function hideLoadingState() {
    const container = document.getElementById('coalition-dashboard');
    if (container) {
      container.classList.remove('loading');
    }
  }

  /**
   * Show error state
   */
  function showErrorState(message) {
    const container = document.getElementById('coalition-dashboard');
    if (container) {
      const errorDiv = document.createElement('div');
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

  function generateMockCoalitionData() {
    // coalition_alignment.csv is header-only upstream - use known Swedish bloc patterns
    const data = {};
    const rightBloc = ['M', 'KD', 'L', 'SD'];
    const leftBloc = ['S', 'V', 'MP'];
    Object.keys(PARTIES).forEach(p1 => {
      data[p1] = {};
      Object.keys(PARTIES).forEach(p2 => {
        if (p1 !== p2) {
          const sameBloc = (rightBloc.includes(p1) && rightBloc.includes(p2)) ||
                          (leftBloc.includes(p1) && leftBloc.includes(p2));
          data[p1][p2] = sameBloc ? 0.70 : 0.35;
        }
      });
    });
    return data;
  }

  function generateMockBehavioralData() {
    // Fallback: neutral values until real data loads
    const data = {};
    Object.keys(PARTIES).forEach(p => { data[p] = 80; });
    return data;
  }

  function generateMockDecisionData() {
    return [];
  }

  function generateMockAnomalyData() {
    return []; // Empty until real data loads
  }

  function generateMockAnnualVotesData() {
    return {}; // Empty until real data loads
  }

  // Initialize dashboard when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }

})();
