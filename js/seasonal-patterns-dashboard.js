/**
 * Seasonal Activity Patterns Dashboard
 * 
 * Visualizes quarterly parliamentary activity from 2002-2025 with:
 * - Quarterly activity heat map (23 years × 4 quarters)
 * - Z-score anomaly detection
 * - Seasonal pattern classification
 * - Cross-year quarter comparison
 * - Activity quartile tracking
 * 
 * Data Source: CIA Platform
 * CSV: view_riksdagen_seasonal_activity_patterns_sample.csv
 * 
 * @author Hack23 AB
 * @version 1.0.0
 * @license Apache-2.0
 */

(function() {
  'use strict';

  // ============================================================================
  // Configuration
  // ============================================================================
  
  const CONFIG = {
    dataUrl: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_activity_patterns_sample.csv',
    cacheKey: 'riksdag_seasonal_patterns',
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    zScoreThreshold: 2.0, // Anomaly threshold
    colors: {
      primary: '#00d9ff',
      secondary: '#ff006e',
      tertiary: '#ffbe0b',
      success: '#008838',
      warning: '#fbc02d',
      danger: '#d32f2f',
      info: '#117a8b',
      normal: '#388e3c',
      elevated: '#f57c00',
      reduced: '#1976d2',
      anomaly: '#d32f2f'
    },
    quarterColors: {
      Q1: '#1976d2', // Blue - Winter
      Q2: '#388e3c', // Green - Spring
      Q3: '#fbc02d', // Yellow - Summer Recess
      Q4: '#f57c00'  // Orange - Autumn
    }
  };

  // ============================================================================
  // Translations (14 Languages)
  // ============================================================================
  
  const TRANSLATIONS = {
    en: {
      title: 'Seasonal Activity Patterns (2002-2025)',
      subtitle: 'Quarterly Analysis with Z-Score Anomaly Detection',
      filters: {
        year: 'Year',
        quarter: 'Quarter',
        election: 'Election Status',
        classification: 'Activity Classification',
        allYears: 'All Years',
        allQuarters: 'All Quarters',
        allElections: 'All',
        electionYears: 'Election Years',
        nonElectionYears: 'Non-Election Years',
        allClassifications: 'All Classifications'
      },
      quarters: {
        Q1: 'Q1 - Winter Session',
        Q2: 'Q2 - Spring Session',
        Q3: 'Q3 - Summer Recess',
        Q4: 'Q4 - Autumn Session'
      },
      charts: {
        heatmap: {
          title: 'Quarterly Activity Heat Map (2002-2025)',
          description: 'Ballot volume by year and quarter with Z-score overlay'
        },
        zscore: {
          title: 'Z-Score Anomaly Detection',
          description: 'Statistical outliers (|Z| ≥ 2.0) flagged in red'
        },
        comparison: {
          title: 'Average Activity by Quarter (All Years)',
          description: 'Q1-Q4 baselines with standard deviation bands'
        },
        classification: {
          title: 'Seasonal Pattern Classification',
          description: 'Distribution of NORMAL, ELEVATED, REDUCED, ANOMALY patterns'
        },
        qoq: {
          title: 'Quarter-over-Quarter Changes',
          description: 'Sequential ballot changes (% and absolute)'
        }
      },
      classifications: {
        NORMAL_ACTIVITY: 'Normal Activity',
        ELEVATED_ACTIVITY: 'Elevated Activity',
        REDUCED_ACTIVITY: 'Reduced Activity',
        ANOMALY_DETECTED: 'Anomaly Detected',
        NORMAL_SEASONAL_PATTERN: 'Normal Seasonal Pattern',
        Q3_SUMMER_LULL: 'Q3 Summer Lull',
        Q4_ELEVATED_ACTIVITY: 'Q4 Elevated Activity',
        UNUSUALLY_HIGH_ACTIVITY: 'Unusually High Activity',
        UNUSUALLY_LOW_ACTIVITY: 'Unusually Low Activity'
      },
      loading: 'Loading data...',
      error: 'Error loading data. Please try again.',
      dataAttribution: 'Data by CIA Platform'
    },
    sv: {
      title: 'Säsongsmönster (2002-2025)',
      subtitle: 'Kvartalsanalys med Z-poäng anomalidetektering',
      filters: {
        year: 'År',
        quarter: 'Kvartal',
        election: 'Valstatus',
        classification: 'Aktivitetsklassificering',
        allYears: 'Alla år',
        allQuarters: 'Alla kvartal',
        allElections: 'Alla',
        electionYears: 'Valår',
        nonElectionYears: 'Icke-valår',
        allClassifications: 'Alla klassificeringar'
      },
      quarters: {
        Q1: 'Q1 - Vintersession',
        Q2: 'Q2 - Vårsession',
        Q3: 'Q3 - Sommaruppehåll',
        Q4: 'Q4 - Höstsession'
      },
      charts: {
        heatmap: {
          title: 'Kvartalsaktivitet värmekarta (2002-2025)',
          description: 'Omröstningsvolym per år och kvartal med Z-poäng'
        },
        zscore: {
          title: 'Z-poäng anomalidetektering',
          description: 'Statistiska avvikelser (|Z| ≥ 2.0) markerade i rött'
        },
        comparison: {
          title: 'Genomsnittlig aktivitet per kvartal (alla år)',
          description: 'Q1-Q4 baslinjer med standardavvikelseband'
        },
        classification: {
          title: 'Säsongsmönster klassificering',
          description: 'Fördelning av NORMAL, FÖRHÖJD, REDUCERAD, ANOMALI mönster'
        },
        qoq: {
          title: 'Kvartal-till-kvartal förändringar',
          description: 'Sekventiella omröstningsförändringar (% och absolut)'
        }
      },
      classifications: {
        NORMAL_ACTIVITY: 'Normal aktivitet',
        ELEVATED_ACTIVITY: 'Förhöjd aktivitet',
        REDUCED_ACTIVITY: 'Reducerad aktivitet',
        ANOMALY_DETECTED: 'Anomali upptäckt',
        NORMAL_SEASONAL_PATTERN: 'Normalt säsongsmönster',
        Q3_SUMMER_LULL: 'Q3 sommaruppehåll',
        Q4_ELEVATED_ACTIVITY: 'Q4 förhöjd aktivitet',
        UNUSUALLY_HIGH_ACTIVITY: 'Ovanligt hög aktivitet',
        UNUSUALLY_LOW_ACTIVITY: 'Ovanligt låg aktivitet'
      },
      loading: 'Laddar data...',
      error: 'Fel vid inläsning av data. Försök igen.',
      dataAttribution: 'Data från CIA-plattformen'
    },
    // Add more languages as needed (da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh)
    da: {
      title: 'Sæsonmønstre (2002-2025)',
      subtitle: 'Kvartalsanalyse med Z-score anomalidetektion',
      filters: {
        year: 'År',
        quarter: 'Kvartal',
        election: 'Valgstatus',
        classification: 'Aktivitetsklassificering',
        allYears: 'Alle år',
        allQuarters: 'Alle kvartaler',
        allElections: 'Alle',
        electionYears: 'Valgår',
        nonElectionYears: 'Ikke-valgår',
        allClassifications: 'Alle klassificeringer'
      },
      quarters: {
        Q1: 'K1 - Vintersession',
        Q2: 'K2 - Forårssession',
        Q3: 'K3 - Sommerpause',
        Q4: 'K4 - Efterårssession'
      },
      charts: {
        heatmap: {
          title: 'Kvartalsaktivitet varmekort (2002-2025)',
          description: 'Afstemningsvolumen efter år og kvartal med Z-score'
        },
        zscore: {
          title: 'Z-score anomalidetektion',
          description: 'Statistiske afvigelser (|Z| ≥ 2.0) markeret med rødt'
        },
        comparison: {
          title: 'Gennemsnitlig aktivitet efter kvartal (alle år)',
          description: 'K1-K4 basislinjer med standardafvigelsesbånd'
        },
        classification: {
          title: 'Sæsonmønster klassificering',
          description: 'Fordeling af NORMAL, FORHØJET, REDUCERET, ANOMALI mønstre'
        },
        qoq: {
          title: 'Kvartal-til-kvartal ændringer',
          description: 'Sekventielle afstemningsændringer (% og absolut)'
        }
      },
      classifications: {
        NORMAL_ACTIVITY: 'Normal aktivitet',
        ELEVATED_ACTIVITY: 'Forhøjet aktivitet',
        REDUCED_ACTIVITY: 'Reduceret aktivitet',
        ANOMALY_DETECTED: 'Anomali opdaget',
        NORMAL_SEASONAL_PATTERN: 'Normalt sæsonmønster',
        Q3_SUMMER_LULL: 'K3 sommerpause',
        Q4_ELEVATED_ACTIVITY: 'K4 forhøjet aktivitet',
        UNUSUALLY_HIGH_ACTIVITY: 'Usædvanligt høj aktivitet',
        UNUSUALLY_LOW_ACTIVITY: 'Usædvanligt lav aktivitet'
      },
      loading: 'Indlæser data...',
      error: 'Fejl ved indlæsning af data. Prøv igen.',
      dataAttribution: 'Data fra CIA-platformen'
    }
  };

  // ============================================================================
  // Data Manager
  // ============================================================================
  
  class SeasonalPatternsDataManager {
    constructor() {
      this.data = null;
      this.cachedData = null;
    }

    /**
     * Fetch data from CIA platform with 24-hour caching
     */
    async fetchData() {
      try {
        // Check cache first
        const cached = this.getCachedData();
        if (cached) {
          console.log('Using cached seasonal patterns data');
          this.data = cached;
          return cached;
        }

        console.log('Fetching fresh seasonal patterns data from CIA platform...');
        const response = await fetch(CONFIG.dataUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvText = await response.text();
        const parsedData = this.parseCSV(csvText);
        
        // Cache the data
        this.setCachedData(parsedData);
        this.data = parsedData;
        
        console.log(`Loaded ${parsedData.length} seasonal activity records`);
        return parsedData;
      } catch (error) {
        console.error('Error fetching seasonal patterns data:', error);
        // Try to use cached data even if expired
        const cached = localStorage.getItem(CONFIG.cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          console.log('Using expired cache as fallback');
          this.data = parsed.data;
          return parsed.data;
        }
        throw error;
      }
    }

    /**
     * Parse CSV data using PapaParse (if available) or fallback parser
     */
    parseCSV(csvText) {
      if (typeof Papa !== 'undefined') {
        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        return parsed.data;
      } else {
        // Fallback CSV parser
        return this.parseCSVFallback(csvText);
      }
    }

    /**
     * Fallback CSV parser (if PapaParse is not available)
     */
    parseCSVFallback(csvText) {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          const value = values[index];
          // Try to convert to number
          const numValue = parseFloat(value);
          row[header] = isNaN(numValue) ? value : numValue;
        });
        data.push(row);
      }

      return data;
    }

    /**
     * Get cached data from LocalStorage
     */
    getCachedData() {
      try {
        const cached = localStorage.getItem(CONFIG.cacheKey);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        const now = Date.now();
        
        if (now - parsed.timestamp > CONFIG.cacheDuration) {
          console.log('Cache expired');
          return null;
        }

        return parsed.data;
      } catch (error) {
        console.error('Error reading cache:', error);
        return null;
      }
    }

    /**
     * Save data to LocalStorage cache
     */
    setCachedData(data) {
      try {
        const cacheObject = {
          data: data,
          timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.cacheKey, JSON.stringify(cacheObject));
        console.log('Data cached successfully');
      } catch (error) {
        console.error('Error caching data:', error);
      }
    }

    /**
     * Aggregate data by quarter (cross-year averages)
     */
    aggregateByQuarter() {
      if (!this.data) return null;

      const quarters = { Q1: [], Q2: [], Q3: [], Q4: [] };
      
      this.data.forEach(row => {
        const quarter = `Q${row.quarter}`;
        if (quarters[quarter]) {
          quarters[quarter].push(row);
        }
      });

      const aggregated = {};
      Object.keys(quarters).forEach(q => {
        const records = quarters[q];
        if (records.length === 0) return;

        const ballots = records.map(r => r.total_ballots || 0);
        const attendance = records.map(r => r.attendance_rate || 0);
        const docs = records.map(r => r.documents_produced || 0);

        aggregated[q] = {
          quarter: q,
          avgBallots: this.mean(ballots),
          stddevBallots: this.stddev(ballots),
          avgAttendance: this.mean(attendance),
          stddevAttendance: this.stddev(attendance),
          avgDocs: this.mean(docs),
          stddevDocs: this.stddev(docs),
          count: records.length
        };
      });

      return aggregated;
    }

    /**
     * Identify anomalies (|Z-score| >= threshold)
     */
    identifyAnomalies(threshold = CONFIG.zScoreThreshold) {
      if (!this.data) return [];

      const anomalies = this.data.filter(row => {
        const ballotZ = Math.abs(row.ballot_z_score || 0);
        const docZ = Math.abs(row.doc_z_score || 0);
        const attendanceZ = Math.abs(row.attendance_z_score || 0);
        
        return ballotZ >= threshold || docZ >= threshold || attendanceZ >= threshold;
      });

      // Sort by maximum Z-score (descending)
      anomalies.sort((a, b) => {
        const maxZa = Math.max(
          Math.abs(a.ballot_z_score || 0),
          Math.abs(a.doc_z_score || 0),
          Math.abs(a.attendance_z_score || 0)
        );
        const maxZb = Math.max(
          Math.abs(b.ballot_z_score || 0),
          Math.abs(b.doc_z_score || 0),
          Math.abs(b.attendance_z_score || 0)
        );
        return maxZb - maxZa;
      });

      return anomalies;
    }

    /**
     * Calculate mean of an array
     */
    mean(arr) {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    /**
     * Calculate standard deviation of an array
     */
    stddev(arr) {
      if (arr.length === 0) return 0;
      const avg = this.mean(arr);
      const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
      const avgSquareDiff = this.mean(squareDiffs);
      return Math.sqrt(avgSquareDiff);
    }

    /**
     * Filter data by criteria
     */
    filterData(filters) {
      if (!this.data) return [];

      return this.data.filter(row => {
        if (filters.year && filters.year !== 'all' && row.year !== parseInt(filters.year)) {
          return false;
        }
        if (filters.quarter && filters.quarter !== 'all' && row.quarter !== parseInt(filters.quarter)) {
          return false;
        }
        if (filters.election && filters.election !== 'all') {
          const isElection = row.is_election_year === 't' || row.is_election_year === true;
          if (filters.election === 'election' && !isElection) return false;
          if (filters.election === 'non-election' && isElection) return false;
        }
        if (filters.classification && filters.classification !== 'all') {
          if (row.base_activity_classification !== filters.classification &&
              row.seasonal_pattern_classification !== filters.classification) {
            return false;
          }
        }
        return true;
      });
    }
  }

  // ============================================================================
  // Chart Renderers
  // ============================================================================
  
  class SeasonalPatternsCharts {
    constructor(dataManager, language = 'en') {
      this.dataManager = dataManager;
      this.language = language;
      this.translations = TRANSLATIONS[language] || TRANSLATIONS.en;
      this.chartInstances = {};
    }

    /**
     * Destroy all chart instances
     */
    destroyCharts() {
      Object.keys(this.chartInstances).forEach(key => {
        if (this.chartInstances[key]) {
          this.chartInstances[key].destroy();
          delete this.chartInstances[key];
        }
      });
    }

    /**
     * Render all charts
     */
    async renderAll(filteredData = null) {
      const data = filteredData || this.dataManager.data;
      if (!data || data.length === 0) {
        console.warn('No data available for rendering');
        return;
      }

      this.destroyCharts();

      // Render each chart
      this.renderSeasonalHeatmap(data);
      this.renderZScoreTimeline(data);
      this.renderQuarterComparison();
      this.renderClassificationChart(data);
      this.renderQoQChangeChart(data);
    }

    /**
     * Render seasonal heat map using D3.js
     */
    renderSeasonalHeatmap(data) {
      const container = document.getElementById('seasonal-heatmap');
      if (!container || typeof d3 === 'undefined') {
        console.warn('D3.js not loaded or container not found');
        return;
      }

      // Clear container
      container.innerHTML = '';

      // Dimensions
      const margin = { top: 40, right: 100, bottom: 60, left: 60 };
      const width = Math.min(container.clientWidth, 1200) - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      // Create SVG
      const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('role', 'img')
        .attr('aria-label', this.translations.charts.heatmap.title)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Get unique years and quarters
      const years = [...new Set(data.map(d => d.year))].sort();
      const quarters = [1, 2, 3, 4];

      // Scales
      const xScale = d3.scaleBand()
        .domain(quarters)
        .range([0, width])
        .padding(0.05);

      const yScale = d3.scaleBand()
        .domain(years)
        .range([0, height])
        .padding(0.05);

      // Color scale for ballots
      const maxBallots = d3.max(data, d => d.total_ballots || 0);
      const colorScale = d3.scaleSequential()
        .domain([0, maxBallots])
        .interpolator(d3.interpolateYlOrRd);

      // Create heat map cells
      svg.selectAll('.cell')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', d => xScale(d.quarter))
        .attr('y', d => yScale(d.year))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.total_ballots || 0))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('role', 'presentation')
        .on('mouseover', function(event, d) {
          // Tooltip
          d3.select(this).attr('stroke', '#000').attr('stroke-width', 2);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1);
        })
        .append('title')
        .text(d => `${d.year} Q${d.quarter}\nBallots: ${d.total_ballots}\nZ-Score: ${(d.ballot_z_score || 0).toFixed(2)}\nClassification: ${d.seasonal_pattern_classification || 'N/A'}`);

      // Add anomaly markers
      const anomalies = data.filter(d => Math.abs(d.ballot_z_score || 0) >= CONFIG.zScoreThreshold);
      svg.selectAll('.anomaly-marker')
        .data(anomalies)
        .enter()
        .append('circle')
        .attr('class', 'anomaly-marker')
        .attr('cx', d => xScale(d.quarter) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.year) + yScale.bandwidth() / 2)
        .attr('r', 8)
        .attr('fill', CONFIG.colors.danger)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('role', 'presentation')
        .append('title')
        .text(d => `ANOMALY: ${d.year} Q${d.quarter}\nZ-Score: ${(d.ballot_z_score || 0).toFixed(2)}`);

      // Add axes
      const xAxis = d3.axisBottom(xScale)
        .tickFormat(q => `Q${q}`);
      
      const yAxis = d3.axisLeft(yScale);

      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .attr('class', 'axis');

      svg.append('g')
        .call(yAxis)
        .attr('class', 'axis');

      // Add axis labels
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .text('Quarter')
        .style('font-size', '14px')
        .style('font-weight', '500');

      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .text('Year')
        .style('font-size', '14px')
        .style('font-weight', '500');

      // Add legend
      const legendWidth = 200;
      const legendHeight = 10;
      const legend = svg.append('g')
        .attr('transform', `translate(${width + 20}, 0)`);

      const legendScale = d3.scaleLinear()
        .domain([0, maxBallots])
        .range([0, legendHeight * 20]);

      const legendAxis = d3.axisRight(legendScale)
        .ticks(5);

      // Legend gradient
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');

      gradient.selectAll('stop')
        .data(d3.range(0, 1.1, 0.1))
        .enter()
        .append('stop')
        .attr('offset', d => `${d * 100}%`)
        .attr('stop-color', d => colorScale(d * maxBallots));

      legend.append('rect')
        .attr('width', legendHeight)
        .attr('height', legendHeight * 20)
        .style('fill', 'url(#legend-gradient)');

      legend.append('g')
        .attr('transform', `translate(${legendHeight}, 0)`)
        .call(legendAxis);

      legend.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .text('Ballots')
        .style('font-size', '12px')
        .style('font-weight', '500');
    }

    /**
     * Render Z-score timeline using Chart.js
     */
    renderZScoreTimeline(data) {
      const canvas = document.getElementById('zscore-timeline-chart');
      if (!canvas || typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded or canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Sort data by year and quarter
      const sortedData = [...data].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter - b.quarter;
      });

      const labels = sortedData.map(d => `${d.year}-Q${d.quarter}`);
      const ballotZScores = sortedData.map(d => d.ballot_z_score || 0);
      const docZScores = sortedData.map(d => d.doc_z_score || 0);
      const attendanceZScores = sortedData.map(d => d.attendance_z_score || 0);

      this.chartInstances.zscore = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Ballot Z-Score',
              data: ballotZScores,
              borderColor: CONFIG.colors.primary,
              backgroundColor: CONFIG.colors.primary + '40',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.1
            },
            {
              label: 'Document Z-Score',
              data: docZScores,
              borderColor: CONFIG.colors.secondary,
              backgroundColor: CONFIG.colors.secondary + '40',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.1
            },
            {
              label: 'Attendance Z-Score',
              data: attendanceZScores,
              borderColor: CONFIG.colors.tertiary,
              backgroundColor: CONFIG.colors.tertiary + '40',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: false
            },
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += context.parsed.y.toFixed(2);
                  const absZ = Math.abs(context.parsed.y);
                  if (absZ >= CONFIG.zScoreThreshold) {
                    label += ' 🔴 ANOMALY';
                  }
                  return label;
                }
              }
            },
            annotation: {
              annotations: {
                threshold1: {
                  type: 'line',
                  yMin: CONFIG.zScoreThreshold,
                  yMax: CONFIG.zScoreThreshold,
                  borderColor: CONFIG.colors.danger,
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: '+2.0 Threshold',
                    enabled: true,
                    position: 'end'
                  }
                },
                threshold2: {
                  type: 'line',
                  yMin: -CONFIG.zScoreThreshold,
                  yMax: -CONFIG.zScoreThreshold,
                  borderColor: CONFIG.colors.danger,
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: '-2.0 Threshold',
                    enabled: true,
                    position: 'end'
                  }
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Year-Quarter'
              },
              ticks: {
                maxRotation: 90,
                minRotation: 45,
                autoSkip: true,
                maxTicksLimit: 20
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Z-Score'
              },
              min: -4,
              max: 4
            }
          }
        }
      });
    }

    /**
     * Render quarter comparison chart with error bars using Chart.js
     */
    renderQuarterComparison() {
      const canvas = document.getElementById('quarter-comparison-chart');
      if (!canvas || typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded or canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');
      const aggregated = this.dataManager.aggregateByQuarter();

      if (!aggregated) {
        console.warn('No aggregated data available');
        return;
      }

      const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      const avgBallots = labels.map(q => aggregated[q]?.avgBallots || 0);
      const stddevBallots = labels.map(q => aggregated[q]?.stddevBallots || 0);

      this.chartInstances.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.map(q => this.translations.quarters[q] || q),
          datasets: [
            {
              label: 'Average Ballots',
              data: avgBallots,
              backgroundColor: labels.map(q => CONFIG.quarterColors[q]),
              borderColor: labels.map(q => CONFIG.quarterColors[q]),
              borderWidth: 2,
              errorBars: stddevBallots
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: false
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const avg = context.parsed.y;
                  const stddev = stddevBallots[context.dataIndex];
                  return [
                    `Average: ${avg.toFixed(1)} ballots`,
                    `Std Dev: ±${stddev.toFixed(1)}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Quarter'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Average Ballots'
              },
              beginAtZero: true
            }
          }
        }
      });
    }

    /**
     * Render classification distribution chart using Chart.js
     */
    renderClassificationChart(data) {
      const canvas = document.getElementById('classification-chart');
      if (!canvas || typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded or canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Count classifications by year
      const years = [...new Set(data.map(d => d.year))].sort();
      const classifications = {};

      data.forEach(row => {
        const classification = row.seasonal_pattern_classification || 'UNKNOWN';
        if (!classifications[classification]) {
          classifications[classification] = {};
        }
        if (!classifications[classification][row.year]) {
          classifications[classification][row.year] = 0;
        }
        classifications[classification][row.year]++;
      });

      const datasets = Object.keys(classifications).map(classification => {
        const counts = years.map(year => classifications[classification][year] || 0);
        let color;
        
        if (classification.includes('NORMAL')) {
          color = CONFIG.colors.normal;
        } else if (classification.includes('ELEVATED') || classification.includes('HIGH')) {
          color = CONFIG.colors.elevated;
        } else if (classification.includes('REDUCED') || classification.includes('LOW')) {
          color = CONFIG.colors.reduced;
        } else if (classification.includes('ANOMALY')) {
          color = CONFIG.colors.anomaly;
        } else {
          color = CONFIG.colors.info;
        }

        return {
          label: this.translations.classifications[classification] || classification,
          data: counts,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        };
      });

      this.chartInstances.classification = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: false
            },
            legend: {
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              stacked: true,
              display: true,
              title: {
                display: true,
                text: 'Year'
              }
            },
            y: {
              stacked: true,
              display: true,
              title: {
                display: true,
                text: 'Count'
              },
              beginAtZero: true
            }
          }
        }
      });
    }

    /**
     * Render QoQ change waterfall chart using Chart.js
     */
    renderQoQChangeChart(data) {
      const canvas = document.getElementById('qoq-change-chart');
      if (!canvas || typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded or canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');

      // Sort data and filter those with QoQ change data
      const sortedData = [...data]
        .filter(d => d.qoq_ballot_change_pct !== null && d.qoq_ballot_change_pct !== undefined)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.quarter - b.quarter;
        });

      const labels = sortedData.map(d => `${d.year}-Q${d.quarter}`);
      const changes = sortedData.map(d => d.qoq_ballot_change_pct || 0);
      
      // Color by positive/negative
      const colors = changes.map(change => {
        if (change > 0) return CONFIG.colors.success;
        if (change < 0) return CONFIG.colors.danger;
        return CONFIG.colors.info;
      });

      this.chartInstances.qoq = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'QoQ Change (%)',
              data: changes,
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: false
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Change: ${context.parsed.y.toFixed(2)}%`;
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Year-Quarter'
              },
              ticks: {
                maxRotation: 90,
                minRotation: 45,
                autoSkip: true,
                maxTicksLimit: 20
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Change (%)'
              }
            }
          }
        }
      });
    }
  }

  // ============================================================================
  // Dashboard Controller
  // ============================================================================
  
  class SeasonalPatternsDashboard {
    constructor() {
      this.dataManager = new SeasonalPatternsDataManager();
      this.chartRenderer = null;
      this.currentLanguage = this.detectLanguage();
      this.currentFilters = {
        year: 'all',
        quarter: 'all',
        election: 'all',
        classification: 'all'
      };
    }

    /**
     * Detect current language from URL
     */
    detectLanguage() {
      const path = window.location.pathname;
      const match = path.match(/index_([a-z]{2})\.html/);
      if (match) {
        return match[1];
      }
      return 'en';
    }

    /**
     * Initialize dashboard
     */
    async initialize() {
      try {
        // Show loading state
        this.showLoading();

        // Fetch data
        await this.dataManager.fetchData();

        // Initialize chart renderer
        this.chartRenderer = new SeasonalPatternsCharts(this.dataManager, this.currentLanguage);

        // Setup filters
        this.setupFilters();

        // Render charts
        await this.chartRenderer.renderAll();

        // Hide loading state
        this.hideLoading();

        console.log('Seasonal Patterns Dashboard initialized successfully');
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        this.showError();
      }
    }

    /**
     * Setup filter controls
     */
    setupFilters() {
      const yearFilter = document.getElementById('year-filter');
      const quarterFilter = document.getElementById('quarter-filter');
      const electionFilter = document.getElementById('election-filter');
      const classificationFilter = document.getElementById('classification-filter');

      if (yearFilter) {
        yearFilter.addEventListener('change', (e) => {
          this.currentFilters.year = e.target.value;
          this.applyFilters();
        });

        // Populate year options
        const years = [...new Set(this.dataManager.data.map(d => d.year))].sort((a, b) => b - a);
        years.forEach(year => {
          const option = document.createElement('option');
          option.value = year;
          option.textContent = year;
          yearFilter.appendChild(option);
        });
      }

      if (quarterFilter) {
        quarterFilter.addEventListener('change', (e) => {
          this.currentFilters.quarter = e.target.value;
          this.applyFilters();
        });
      }

      if (electionFilter) {
        electionFilter.addEventListener('change', (e) => {
          this.currentFilters.election = e.target.value;
          this.applyFilters();
        });
      }

      if (classificationFilter) {
        classificationFilter.addEventListener('change', (e) => {
          this.currentFilters.classification = e.target.value;
          this.applyFilters();
        });

        // Populate classification options
        const classifications = [...new Set(this.dataManager.data.map(d => d.seasonal_pattern_classification))].filter(c => c);
        classifications.forEach(classification => {
          const option = document.createElement('option');
          option.value = classification;
          option.textContent = classification;
          classificationFilter.appendChild(option);
        });
      }
    }

    /**
     * Apply filters and re-render charts
     */
    async applyFilters() {
      const filteredData = this.dataManager.filterData(this.currentFilters);
      await this.chartRenderer.renderAll(filteredData);
    }

    /**
     * Show loading state
     */
    showLoading() {
      const container = document.getElementById('seasonal-patterns-dashboard');
      if (container) {
        container.classList.add('loading');
      }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
      const container = document.getElementById('seasonal-patterns-dashboard');
      if (container) {
        container.classList.remove('loading');
      }
    }

    /**
     * Show error message
     */
    showError() {
      const container = document.getElementById('seasonal-patterns-dashboard');
      if (container) {
        container.innerHTML = `
          <div class="error-message" role="alert">
            <p>⚠️ ${TRANSLATIONS[this.currentLanguage]?.error || TRANSLATIONS.en.error}</p>
          </div>
        `;
      }
    }
  }

  // ============================================================================
  // Initialize on DOM ready
  // ============================================================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }

  function initDashboard() {
    const dashboardContainer = document.getElementById('seasonal-patterns-dashboard');
    if (dashboardContainer) {
      const dashboard = new SeasonalPatternsDashboard();
      dashboard.initialize();
    }
  }

})();
