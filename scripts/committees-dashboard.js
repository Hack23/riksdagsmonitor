/**
 * Committee Performance & Network Analytics Dashboard
 * 
 * Purpose: Interactive D3.js/Chart.js dashboard for Swedish Riksdag committee analysis
 * Version: 1.0.0
 * Author: Hack23 AB
 * License: Apache-2.0
 * 
 * Features:
 * - D3.js force-directed network diagram
 * - D3.js productivity heat map
 * - Chart.js bar/stacked/line charts
 * - WCAG 2.1 AA accessibility
 * - Multi-language support (14 languages)
 * - Responsive design (320px-1440px+)
 */

(function() {
  'use strict';

  // ==============================================
  // CONFIGURATION
  // ==============================================

  const CONFIG = {
    // CIA Data Sources - Local files with remote fallback
    dataUrls: {
      productivityMatrix: ['cia-data/distribution_committee_productivity_matrix.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_committee_productivity_matrix.csv'],
      committeeDecisions: ['cia-data/view_riksdagen_committee_decisions.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_committee_decisions_sample.csv'],
      annualDocuments: ['cia-data/distribution_annual_committee_documents.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_annual_committee_documents.csv'],
      ballotSummary: ['cia-data/view_riksdagen_committee_ballot_decision_party_summary.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_committee_ballot_decision_party_summary_sample.csv'],
      seasonalPatterns: ['cia-data/percentile_seasonal_activity_patterns.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/percentile_seasonal_activity_patterns.csv']
    },
    
    // Cache configuration
    cache: {
      enabled: true,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      prefix: 'riksdag_committee_'
    },
    
    // Committee definitions with Swedish abbreviations
    committees: [
      { code: 'AU', name: 'Foreign Affairs Committee', nameLocalized: { sv: 'Utrikesutskottet', en: 'Foreign Affairs Committee' }, color: '#1e88e5', domain: 'Foreign Policy' },
      { code: 'CU', name: 'Civil Affairs Committee', nameLocalized: { sv: 'Civilutskottet', en: 'Civil Affairs Committee' }, color: '#43a047', domain: 'Civil Law' },
      { code: 'FiU', name: 'Finance Committee', nameLocalized: { sv: 'Finansutskottet', en: 'Finance Committee' }, color: '#fb8c00', domain: 'Economics' },
      { code: 'FöU', name: 'Defense Committee', nameLocalized: { sv: 'Försvarsutskottet', en: 'Defense Committee' }, color: '#e53935', domain: 'National Security' },
      { code: 'JuU', name: 'Justice Committee', nameLocalized: { sv: 'Justitieutskottet', en: 'Justice Committee' }, color: '#8e24aa', domain: 'Justice' },
      { code: 'KU', name: 'Constitutional Committee', nameLocalized: { sv: 'Konstitutionsutskottet', en: 'Constitutional Committee' }, color: '#3949ab', domain: 'Constitution' },
      { code: 'KrU', name: 'Cultural Affairs Committee', nameLocalized: { sv: 'Kulturutskottet', en: 'Cultural Affairs Committee' }, color: '#00acc1', domain: 'Culture' },
      { code: 'MjU', name: 'Environment Committee', nameLocalized: { sv: 'Miljö- och jordbruksutskottet', en: 'Environment Committee' }, color: '#7cb342', domain: 'Environment' },
      { code: 'NU', name: 'Business Committee', nameLocalized: { sv: 'Näringsutskottet', en: 'Business Committee' }, color: '#ff6f00', domain: 'Business' },
      { code: 'SkU', name: 'Taxation Committee', nameLocalized: { sv: 'Skatteutskottet', en: 'Taxation Committee' }, color: '#d32f2f', domain: 'Taxation' },
      { code: 'SoU', name: 'Social Insurance Committee', nameLocalized: { sv: 'Socialförsäkringsutskottet', en: 'Social Insurance Committee' }, color: '#c2185b', domain: 'Social Welfare' },
      { code: 'TU', name: 'Transport Committee', nameLocalized: { sv: 'Trafikutskottet', en: 'Transport Committee' }, color: '#0097a7', domain: 'Transportation' },
      { code: 'UbU', name: 'Education Committee', nameLocalized: { sv: 'Utbildningsutskottet', en: 'Education Committee' }, color: '#5e35b1', domain: 'Education' },
      { code: 'UFöU', name: 'Foreign Defense Committee', nameLocalized: { sv: 'Utrikes- och försvarsutskottet', en: 'Foreign Defense Committee' }, color: '#f57c00', domain: 'Security Policy' },
      { code: 'UU', name: 'Foreign Affairs Sub-Committee', nameLocalized: { sv: 'Utrikesutskottets underutskott', en: 'Foreign Affairs Sub-Committee' }, color: '#1565c0', domain: 'Foreign Policy' }
    ],
    
    // Visualization dimensions
    dimensions: {
      network: { width: 1200, height: 700 },
      heatmap: { width: 1200, height: 600 },
      chart: { aspectRatio: 2 }
    }
  };

  // ==============================================
  // DATA FETCHING & CACHING
  // ==============================================

  class DataManager {
    constructor() {
      this.cache = new Map();
    }

    /**
     * Fetch CSV data with caching support
     * @param {string} key - Cache key identifier
     * @param {string|Array<string>} url - URL(s) to fetch data from (tries in order if array)
     * @returns {Promise<Array>} Parsed CSV data
     */
    async fetchData(key, url) {
      // Check cache first
      if (CONFIG.cache.enabled) {
        const cached = this.getCached(key);
        if (cached) {
          console.log(`[DataManager] Using cached data for ${key}`);
          return cached;
        }
      }

      // Convert single URL to array for consistent handling
      const urls = Array.isArray(url) ? url : [url];
      let lastError = null;

      // Try each URL in order (local first, then remote fallback)
      for (let i = 0; i < urls.length; i++) {
        const currentUrl = urls[i];
        try {
          console.log(`[DataManager] Fetching ${key} from ${currentUrl}`);
          const response = await fetch(currentUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const csvText = await response.text();
          
          // Parse CSV using Papa Parse
          if (typeof Papa === 'undefined') {
            throw new Error('Papa Parse library not loaded');
          }

          const parsed = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
          });

          if (parsed.errors.length > 0) {
            console.warn(`[DataManager] CSV parsing warnings for ${key}:`, parsed.errors);
          }

          const data = parsed.data;
          
          // Cache the result
          if (CONFIG.cache.enabled) {
            this.setCached(key, data);
          }

          console.log(`[DataManager] Successfully loaded ${key} from ${i === 0 ? 'local' : 'remote'} source`);
          return data;
        } catch (error) {
          console.warn(`[DataManager] Failed to fetch ${key} from ${currentUrl}:`, error.message);
          lastError = error;
          // Continue to next URL if available
        }
      }

      // All URLs failed
      console.error(`[DataManager] All sources failed for ${key}`);
      throw lastError || new Error(`Failed to fetch ${key} from any source`);
    }

    /**
     * Get cached data if valid
     * @param {string} key - Cache key
     * @returns {Array|null} Cached data or null
     */
    getCached(key) {
      try {
        const cacheKey = CONFIG.cache.prefix + key;
        const cached = localStorage.getItem(cacheKey);
        
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CONFIG.cache.ttl) {
          return data;
        } else {
          localStorage.removeItem(cacheKey);
          return null;
        }
      } catch (error) {
        // localStorage might be disabled, in privacy mode, or have quota issues
        console.warn('[DataManager] Cache read failed:', error);
        return null;
      }
          return null;
        }
      } catch (error) {
        console.warn(`[DataManager] Invalid cache for ${key}`, error);
        localStorage.removeItem(cacheKey);
        return null;
      }
    }

    /**
     * Set cached data
     * @param {string} key - Cache key
     * @param {Array} data - Data to cache
     */
    setCached(key, data) {
      const cacheKey = CONFIG.cache.prefix + key;
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) {
        console.warn(`[DataManager] Failed to cache ${key}:`, error);
      }
    }

    /**
     * Load all committee data
     * @returns {Promise<Object>} All committee data
     */
    async loadAllData() {
      try {
        const [
          productivityMatrix,
          committeeDecisions,
          annualDocuments,
          ballotSummary,
          seasonalPatterns
        ] = await Promise.all([
          this.fetchData('productivityMatrix', CONFIG.dataUrls.productivityMatrix),
          this.fetchData('committeeDecisions', CONFIG.dataUrls.committeeDecisions),
          this.fetchData('annualDocuments', CONFIG.dataUrls.annualDocuments),
          this.fetchData('ballotSummary', CONFIG.dataUrls.ballotSummary),
          this.fetchData('seasonalPatterns', CONFIG.dataUrls.seasonalPatterns)
        ]);

        return {
          productivityMatrix,
          committeeDecisions,
          annualDocuments,
          ballotSummary,
          seasonalPatterns
        };
      } catch (error) {
        console.error('[DataManager] Failed to load all data:', error);
        throw error;
      }
    }
  }

  // ==============================================
  // D3.JS NETWORK DIAGRAM
  // ==============================================

  class NetworkDiagram {
    constructor(containerId, data) {
      this.containerId = containerId;
      this.data = data;
      this.svg = null;
      this.simulation = null;
    }

    /**
     * Render force-directed network diagram
     */
    render() {
      const container = document.getElementById(this.containerId);
      if (!container) {
        console.error(`[NetworkDiagram] Container ${this.containerId} not found`);
        return;
      }

      // Clear existing content
      container.innerHTML = '';

      // Calculate responsive dimensions
      const containerWidth = container.clientWidth;
      const width = Math.min(containerWidth, CONFIG.dimensions.network.width);
      const height = Math.min(width * 0.6, CONFIG.dimensions.network.height);

      // Create SVG
      this.svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('role', 'img')
        .attr('aria-label', 'Committee network connections diagram')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background', 'var(--card-bg)');

      // Process data for network
      const { nodes, links } = this.processNetworkData();

      // Create force simulation
      this.simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 10));

      // Add links
      const link = this.svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-width', d => Math.sqrt(d.value) * 2)
        .attr('stroke-opacity', 0.6);

      // Add nodes
      const node = this.svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .attr('tabindex', '0')
        .attr('role', 'button')
        .attr('aria-label', d => `${d.name} committee with ${d.productivity} productivity score`)
        .call(d3.drag()
          .on('start', d => this.dragStarted(d))
          .on('drag', d => this.dragged(d))
          .on('end', d => this.dragEnded(d)));

      // Node circles
      node.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => d.color)
        .attr('stroke', 'var(--card-bg)')
        .attr('stroke-width', 2);

      // Node labels
      node.append('text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', 'var(--text-color)')
        .text(d => d.code);

      // Tooltips
      node.append('title')
        .text(d => `${d.name}\nProductivity: ${d.productivity}\nDecisions: ${d.decisions}`);

      // Update positions on simulation tick
      this.simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('transform', d => `translate(${d.x},${d.y})`);
      });

      // Add legend
      this.addLegend(width, height);

      // Update accessible table
      this.updateAccessibleTable(nodes, links);
    }

    /**
     * Process raw data into network format
     * @returns {Object} Nodes and links for network diagram
     */
    processNetworkData() {
      const nodes = CONFIG.committees.map((committee, index) => ({
        id: committee.code,
        code: committee.code,
        name: committee.name,
        color: committee.color,
        productivity: 75 + Math.random() * 25, // Mock data (0-100)
        decisions: Math.floor(50 + Math.random() * 100),
        radius: 20 + Math.random() * 15
      }));

      // Generate links based on committee relationships (mock data)
      const links = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() > 0.7) { // 30% connection probability
            links.push({
              source: nodes[i].id,
              target: nodes[j].id,
              value: Math.random() * 10
            });
          }
        }
      }

      return { nodes, links };
    }

    /**
     * Add legend to network diagram
     */
    addLegend(width, height) {
      const legend = this.svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(20, ${height - 80})`);

      legend.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', 'var(--text-color)')
        .text('Node size = Productivity score');

      legend.append('text')
        .attr('x', 0)
        .attr('y', 20)
        .attr('font-size', '12px')
        .attr('fill', 'var(--text-secondary)')
        .text('Link width = Relationship strength');
    }

    /**
     * Update accessible table fallback
     */
    updateAccessibleTable(nodes, links) {
      const table = document.getElementById('committeeNetworkTable');
      if (!table) return;

      let html = '<caption>Committee Network Connections</caption>';
      html += '<thead><tr><th>Committee</th><th>Productivity</th><th>Decisions</th><th>Connections</th></tr></thead>';
      html += '<tbody>';

      nodes.forEach(node => {
        // Handle both string and object types for source/target
        const connections = links.filter(l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source && l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target && l.target.id;
          return sourceId === node.id || targetId === node.id;
        }).length;
        html += `<tr>
          <td>${node.name} (${node.code})</td>
          <td>${node.productivity.toFixed(1)}</td>
          <td>${node.decisions}</td>
          <td>${connections}</td>
        </tr>`;
      });

      html += '</tbody>';
      table.innerHTML = html;
    }

    // Drag handlers
    dragStarted(event) {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    dragEnded(event) {
      if (!event.active) this.simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  }

  // ==============================================
  // D3.JS PRODUCTIVITY HEAT MAP
  // ==============================================

  class ProductivityHeatMap {
    constructor(containerId, data) {
      this.containerId = containerId;
      this.data = data;
      this.svg = null;
    }

    /**
     * Render productivity heat map
     */
    render() {
      const container = document.getElementById(this.containerId);
      if (!container) {
        console.error(`[ProductivityHeatMap] Container ${this.containerId} not found`);
        return;
      }

      // Clear existing content
      container.innerHTML = '';

      // Calculate responsive dimensions
      const containerWidth = container.clientWidth;
      const width = Math.min(containerWidth, CONFIG.dimensions.heatmap.width);
      const height = Math.min(width * 0.5, CONFIG.dimensions.heatmap.height);

      const margin = { top: 80, right: 100, bottom: 60, left: 150 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Create SVG
      this.svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('role', 'img')
        .attr('aria-label', 'Committee productivity matrix over time')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background', 'var(--card-bg)');

      const g = this.svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Process data
      const { matrix, years, committees } = this.processHeatMapData();

      // Scales
      const xScale = d3.scaleBand()
        .domain(years)
        .range([0, innerWidth])
        .padding(0.05);

      const yScale = d3.scaleBand()
        .domain(committees)
        .range([0, innerHeight])
        .padding(0.05);

      const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
        .domain([0, 100]);

      // Add cells
      g.selectAll('rect')
        .data(matrix)
        .enter().append('rect')
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.committee))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', 'var(--card-bg)')
        .attr('stroke-width', 1)
        .attr('tabindex', '0')
        .attr('role', 'button')
        .attr('aria-label', d => `${d.committee} in ${d.year}: ${d.value.toFixed(1)} productivity`)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('stroke', 'var(--accent-color)').attr('stroke-width', 2);
        })
        .on('mouseout', function(event, d) {
          d3.select(this).attr('stroke', 'var(--card-bg)').attr('stroke-width', 1);
        })
        .append('title')
        .text(d => `${d.committee} (${d.year})\nProductivity: ${d.value.toFixed(1)}`);

      // X axis
      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('fill', 'var(--text-color)');

      // Y axis
      g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .attr('fill', 'var(--text-color)');

      // Title
      this.svg.append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', 'var(--text-color)')
        .text('Committee Productivity Over Time (2020-2026)');

      // Color scale legend
      this.addColorLegend(g, colorScale, innerWidth, innerHeight);

      // Update accessible table
      this.updateAccessibleTable(matrix);
    }

    /**
     * Process raw data into heat map format
     * @returns {Object} Matrix data, years, and committees
     */
    processHeatMapData() {
      const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
      const committees = CONFIG.committees.map(c => c.code);
      
      const matrix = [];
      committees.forEach(committee => {
        years.forEach(year => {
          matrix.push({
            committee: committee,
            year: year,
            value: 40 + Math.random() * 60 // Mock data (0-100)
          });
        });
      });

      return { matrix, years, committees };
    }

    /**
     * Add color scale legend
     */
    addColorLegend(g, colorScale, innerWidth, innerHeight) {
      const legendWidth = 200;
      const legendHeight = 15;

      const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth - legendWidth}, ${innerHeight + 40})`);

      // Gradient
      const defs = this.svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'productivity-gradient')
        .attr('x1', '0%')
        .attr('x2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.interpolateRdYlGn(0));

      gradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', d3.interpolateRdYlGn(0.5));

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.interpolateRdYlGn(1));

      legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#productivity-gradient)');

      legend.append('text')
        .attr('x', 0)
        .attr('y', -5)
        .attr('font-size', '12px')
        .attr('fill', 'var(--text-color)')
        .text('Low');

      legend.append('text')
        .attr('x', legendWidth)
        .attr('y', -5)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', 'var(--text-color)')
        .text('High');
    }

    /**
     * Update accessible table fallback
     */
    updateAccessibleTable(matrix) {
      const table = document.getElementById('productivityMatrixTable');
      if (!table) return;

      const years = [...new Set(matrix.map(d => d.year))];
      const committees = [...new Set(matrix.map(d => d.committee))];

      let html = '<caption>Committee Productivity Matrix (2020-2026)</caption>';
      html += '<thead><tr><th>Committee</th>';
      years.forEach(year => {
        html += `<th>${year}</th>`;
      });
      html += '</tr></thead><tbody>';

      committees.forEach(committee => {
        html += `<tr><td>${committee}</td>`;
        years.forEach(year => {
          const cell = matrix.find(d => d.committee === committee && d.year === year);
          html += `<td>${cell ? cell.value.toFixed(1) : 'N/A'}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody>';
      table.innerHTML = html;
    }
  }

  // ==============================================
  // CHART.JS VISUALIZATIONS
  // ==============================================

  class ChartJSVisualizations {
    constructor() {
      this.charts = {};
    }

    /**
     * Render all Chart.js charts
     */
    renderAll(data) {
      this.renderCommitteeComparison(data);
      this.renderDecisionEffectiveness(data);
      this.renderSeasonalPatterns(data);
    }

    /**
     * Committee Comparison Bar Chart
     */
    renderCommitteeComparison(data) {
      const canvas = document.getElementById('committeeComparisonChart');
      if (!canvas) {
        console.error('[ChartJS] committeeComparisonChart canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Process data
      const labels = CONFIG.committees.map(c => c.code);
      const productivity = CONFIG.committees.map(() => 50 + Math.random() * 50);
      const colors = CONFIG.committees.map(c => c.color);

      // Destroy existing chart
      if (this.charts.comparison) {
        this.charts.comparison.destroy();
      }

      // Create chart
      this.charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Productivity Score',
            data: productivity,
            backgroundColor: colors,
            borderColor: colors.map(c => c),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            title: {
              display: true,
              text: 'Committee Productivity Comparison',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Productivity: ${context.parsed.y.toFixed(1)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Productivity Score (0-100)',
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              ticks: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              grid: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
              }
            },
            x: {
              title: {
                display: true,
                text: 'Committee',
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              ticks: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              grid: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
              }
            }
          }
        }
      });
    }

    /**
     * Decision Effectiveness Stacked Bar Chart
     */
    renderDecisionEffectiveness(data) {
      const canvas = document.getElementById('decisionEffectivenessChart');
      if (!canvas) {
        console.error('[ChartJS] decisionEffectivenessChart canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Process data (mock data)
      const labels = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
      const approved = labels.map(() => 60 + Math.random() * 30);
      const rejected = labels.map((_, i) => 100 - approved[i] - Math.random() * 10);
      const pending = labels.map((_, i) => 100 - approved[i] - rejected[i]);

      // Destroy existing chart
      if (this.charts.effectiveness) {
        this.charts.effectiveness.destroy();
      }

      // Create chart
      this.charts.effectiveness = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Approved',
              data: approved,
              backgroundColor: '#7cb342',
              borderColor: '#7cb342',
              borderWidth: 1
            },
            {
              label: 'Rejected',
              data: rejected,
              backgroundColor: '#e53935',
              borderColor: '#e53935',
              borderWidth: 1
            },
            {
              label: 'Pending',
              data: pending,
              backgroundColor: '#fb8c00',
              borderColor: '#fb8c00',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            title: {
              display: true,
              text: 'Decision Outcomes by Year',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              labels: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: 'Year',
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              ticks: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              grid: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Percentage (%)',
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              ticks: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              grid: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
              }
            }
          }
        }
      });
    }

    /**
     * Seasonal Activity Patterns Line Chart
     */
    renderSeasonalPatterns(data) {
      const canvas = document.getElementById('seasonalPatternsChart');
      if (!canvas) {
        console.error('[ChartJS] seasonalPatternsChart canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Process data (mock seasonal data)
      const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      const datasets = [
        {
          label: '2023',
          data: [70, 85, 60, 75],
          borderColor: '#1e88e5',
          backgroundColor: 'rgba(30, 136, 229, 0.1)',
          tension: 0.4
        },
        {
          label: '2024',
          data: [75, 90, 65, 80],
          borderColor: '#43a047',
          backgroundColor: 'rgba(67, 160, 71, 0.1)',
          tension: 0.4
        },
        {
          label: '2025',
          data: [80, 95, 70, 85],
          borderColor: '#fb8c00',
          backgroundColor: 'rgba(251, 140, 0, 0.1)',
          tension: 0.4
        }
      ];

      // Destroy existing chart
      if (this.charts.seasonal) {
        this.charts.seasonal.destroy();
      }

      // Create chart
      this.charts.seasonal = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 3,
          plugins: {
            title: {
              display: true,
              text: 'Quarterly Activity Patterns (2023-2025)',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              labels: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y} activity score`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Activity Score',
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              ticks: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              grid: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
              }
            },
            x: {
              title: {
                display: true,
                text: 'Quarter',
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              ticks: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
              },
              grid: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
              }
            }
          }
        }
      });
    }

    /**
     * Destroy all Chart.js instances
     */
    destroy() {
      Object.keys(this.charts).forEach(key => {
        if (this.charts[key] && typeof this.charts[key].destroy === 'function') {
          this.charts[key].destroy();
        }
      });
      this.charts = {};
    }
  }

  // ==============================================
  // INITIALIZATION
  // ==============================================

  // Keep references to visualization instances for reuse
  let visualizationInstances = null;

  /**
   * Initialize committee dashboard
   */
  async function initializeDashboard() {
    // Early guard: only initialize when the main dashboard container exists
    const dashboardRoot = document.getElementById('committee-dashboard');
    if (!dashboardRoot) {
      console.info('[CommitteeDashboard] Skipping initialization: #committee-dashboard container not found.');
      return;
    }

    console.log('[CommitteeDashboard] Initializing...');

    try {
      // Check if required libraries are loaded
      if (typeof d3 === 'undefined') {
        throw new Error('D3.js not loaded. Please include D3.js library.');
      }
      if (typeof Chart === 'undefined') {
        throw new Error('Chart.js not loaded. Please include Chart.js library.');
      }
      if (typeof Papa === 'undefined') {
        throw new Error('Papa Parse not loaded. Please include Papa Parse library.');
      }

      // Show loading indicator
      showLoadingIndicator();

      // Load data
      const dataManager = new DataManager();
      const data = await dataManager.loadAllData();
      console.log('[CommitteeDashboard] Data loaded successfully', data);

      // Destroy existing Chart.js instances if they exist
      if (visualizationInstances && visualizationInstances.charts) {
        visualizationInstances.charts.destroy();
      }

      // Render visualizations
      const network = new NetworkDiagram('committeeNetwork', data);
      network.render();

      const heatmap = new ProductivityHeatMap('productivityMatrix', data);
      heatmap.render();

      const charts = new ChartJSVisualizations();
      charts.renderAll(data);

      // Store instances for later cleanup/reuse
      visualizationInstances = {
        network: network,
        heatmap: heatmap,
        charts: charts
      };

      // Hide loading indicator
      hideLoadingIndicator();

      console.log('[CommitteeDashboard] Initialization complete');
    } catch (error) {
      console.error('[CommitteeDashboard] Initialization failed:', error);
      showErrorMessage(error.message);
    }
  }

  /**
   * Show loading indicator
   */
  function showLoadingIndicator() {
    const dashboard = document.getElementById('committee-dashboard');
    if (dashboard) {
      const indicator = document.createElement('div');
      indicator.id = 'committee-loading';
      indicator.className = 'loading-indicator';
      indicator.setAttribute('role', 'status');
      indicator.setAttribute('aria-live', 'polite');
      indicator.innerHTML = `
        <div class="spinner"></div>
        <p>Loading committee data...</p>
      `;
      dashboard.insertBefore(indicator, dashboard.firstChild);
    }
  }

  /**
   * Hide loading indicator
   */
  function hideLoadingIndicator() {
    const indicator = document.getElementById('committee-loading');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Show error message
   */
  function showErrorMessage(message) {
    const dashboard = document.getElementById('committee-dashboard');
    if (dashboard) {
      const error = document.createElement('div');
      error.className = 'error-message';
      error.setAttribute('role', 'alert');
      error.innerHTML = `
        <h3>⚠️ Error Loading Committee Dashboard</h3>
        <p>${message}</p>
        <p>Please refresh the page or contact support if the issue persists.</p>
      `;
      dashboard.insertBefore(error, dashboard.firstChild);
    }

    hideLoadingIndicator();
  }

  // ==============================================
  // EVENT LISTENERS
  // ==============================================

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
  } else {
    // DOM already loaded
    initializeDashboard();
  }

  // Re-render on window resize (debounced)
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      console.log('[CommitteeDashboard] Window resized, re-rendering...');
      initializeDashboard();
    }, 300);
  });

})();
