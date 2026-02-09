/**
 * Anomaly Detection & Early Warning Dashboard
 * 
 * Statistical outlier identification for Swedish Parliament activity (2002-2025)
 * Uses Z-score analysis to detect anomalies in voting, document production, and attendance
 * 
 * Data Source: CIA Platform - Seasonal Anomaly Detection
 * Update Frequency: 1-hour cache (monitoring frequency)
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Local-first data loading with fallback to remote URL
    dataUrls: [
      'cia-data/seasonal/view_riksdagen_seasonal_anomaly_detection_sample.csv', // Try local first
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_anomaly_detection_sample.csv' // Fallback to remote
    ],
    cacheKey: 'riksdag_anomaly_detection',
    cacheDuration: 60 * 60 * 1000, // 1 hour in milliseconds
    alertDismissKey: 'anomaly_alert_dismissed',
    alertDismissDuration: 24 * 60 * 60 * 1000 // 24 hours
  };

  // Alert configuration
  const ALERT_CONFIG = {
    CRITICAL: { color: '#d32f2f', icon: '🔴', notify: true },
    HIGH: { color: '#f57c00', icon: '🟠', notify: true },
    MODERATE: { color: '#fbc02d', icon: '🟡', notify: false },
    LOW: { color: '#388e3c', icon: '🟢', notify: false }
  };

  // Translations for 14 languages
  const TRANSLATIONS = {
    en: {
      title: 'Anomaly Detection & Early Warning System',
      severityLabel: 'Severity',
      typeLabel: 'Type',
      directionLabel: 'Direction',
      yearLabel: 'Year',
      allSeverities: 'All Severities',
      allTypes: 'All Types',
      allDirections: 'All Directions',
      allYears: 'All Years',
      severity: {
        CRITICAL: 'Critical',
        HIGH: 'High',
        MODERATE: 'Moderate',
        LOW: 'Low'
      },
      type: {
        BALLOT_ANOMALY: 'Ballot Anomaly',
        DOCUMENT_ANOMALY: 'Document Anomaly',
        ATTENDANCE_ANOMALY: 'Attendance Anomaly',
        NO_ANOMALY: 'No Anomaly'
      },
      direction: {
        UNUSUALLY_HIGH: 'Unusually High',
        UNUSUALLY_LOW: 'Unusually Low',
        WITHIN_NORMAL_RANGE: 'Within Normal Range'
      },
      alertPrefix: 'CRITICAL ANOMALY DETECTED',
      dismissAlert: 'Dismiss',
      loading: 'Loading anomaly data...',
      error: 'Error loading data',
      noData: 'No anomaly data available',
      chartTitles: {
        timeline: 'Anomaly Timeline (2002-2025)',
        distribution: 'Z-Score Distribution',
        typeBreakdown: 'Anomaly Type Distribution',
        heatmap: 'Severity Heat Map (Year × Quarter)',
        quarterly: 'Anomaly Frequency by Quarter',
        recent: 'Recent Anomalies (Last 5)'
      },
      chartDescriptions: {
        timeline: 'Chronological view of detected anomalies with severity coding',
        distribution: 'Normal curve with outlier markers (|Z| ≥ 2.0)',
        typeBreakdown: 'Ballot vs. Document anomaly distribution',
        heatmap: 'Grid showing anomaly severity by year and quarter',
        quarterly: 'Q1-Q4 anomaly counts across all years',
        recent: 'Most recent anomalies with details'
      },
      quarters: {
        Q1: 'Q1 (Jan-Mar)',
        Q2: 'Q2 (Apr-Jun)',
        Q3: 'Q3 (Jul-Sep)',
        Q4: 'Q4 (Oct-Dec)'
      }
    },
    sv: {
      title: 'Anomalidetektering och Tidig Varning',
      severityLabel: 'Allvarlighetsgrad',
      typeLabel: 'Typ',
      directionLabel: 'Riktning',
      yearLabel: 'År',
      allSeverities: 'Alla allvarlighetsgrader',
      allTypes: 'Alla typer',
      allDirections: 'Alla riktningar',
      allYears: 'Alla år',
      severity: {
        CRITICAL: 'Kritisk',
        HIGH: 'Hög',
        MODERATE: 'Måttlig',
        LOW: 'Låg'
      },
      type: {
        BALLOT_ANOMALY: 'Omröstningsanomali',
        DOCUMENT_ANOMALY: 'Dokumentanomali',
        ATTENDANCE_ANOMALY: 'Närvaroanomali',
        NO_ANOMALY: 'Ingen anomali'
      },
      direction: {
        UNUSUALLY_HIGH: 'Ovanligt hög',
        UNUSUALLY_LOW: 'Ovanligt låg',
        WITHIN_NORMAL_RANGE: 'Inom normalintervall'
      },
      alertPrefix: 'KRITISK ANOMALI UPPTÄCKT',
      dismissAlert: 'Avvisa',
      loading: 'Laddar anomalidata...',
      error: 'Fel vid laddning av data',
      noData: 'Ingen anomalidata tillgänglig',
      chartTitles: {
        timeline: 'Anomalitidslinje (2002-2025)',
        distribution: 'Z-poängfördelning',
        typeBreakdown: 'Anomalitypfördelning',
        heatmap: 'Allvarlighetsvärmekartan (År × Kvartal)',
        quarterly: 'Anomalifrekvens per kvartal',
        recent: 'Senaste anomalierna (Senaste 5)'
      },
      chartDescriptions: {
        timeline: 'Kronologisk vy av upptäckta anomalier med allvarlighetskodning',
        distribution: 'Normalkurva med utliggare (|Z| ≥ 2.0)',
        typeBreakdown: 'Omröstnings- vs. dokumentanomalier',
        heatmap: 'Rutnät som visar anomalins allvarlighetsgrad per år och kvartal',
        quarterly: 'Q1-Q4 anomaliräkning över alla år',
        recent: 'Senaste anomalier med detaljer'
      },
      quarters: {
        Q1: 'Q1 (Jan-Mar)',
        Q2: 'Q2 (Apr-Jun)',
        Q3: 'Q3 (Jul-Sep)',
        Q4: 'Q4 (Okt-Dec)'
      }
    },
    // Add minimal translations for other languages (can be expanded)
    da: { title: 'Anomalidetektering og Tidlig Advarsel', severity: { CRITICAL: 'Kritisk', HIGH: 'Høj', MODERATE: 'Moderat', LOW: 'Lav' } },
    no: { title: 'Anomalideteksjon og Tidlig Varsel', severity: { CRITICAL: 'Kritisk', HIGH: 'Høy', MODERATE: 'Moderat', LOW: 'Lav' } },
    fi: { title: 'Poikkeavuuksien havaitseminen ja varhainen varoitus', severity: { CRITICAL: 'Kriittinen', HIGH: 'Korkea', MODERATE: 'Kohtalainen', LOW: 'Matala' } },
    de: { title: 'Anomalieerkennung und Frühwarnsystem', severity: { CRITICAL: 'Kritisch', HIGH: 'Hoch', MODERATE: 'Mäßig', LOW: 'Niedrig' } },
    fr: { title: 'Détection d\'anomalies et alerte précoce', severity: { CRITICAL: 'Critique', HIGH: 'Élevé', MODERATE: 'Modéré', LOW: 'Faible' } },
    es: { title: 'Detección de anomalías y alerta temprana', severity: { CRITICAL: 'Crítico', HIGH: 'Alto', MODERATE: 'Moderado', LOW: 'Bajo' } },
    nl: { title: 'Anomaliedetectie en vroegtijdige waarschuwing', severity: { CRITICAL: 'Kritiek', HIGH: 'Hoog', MODERATE: 'Gematigd', LOW: 'Laag' } },
    ar: { title: 'اكتشاف الشذوذ والإنذار المبكر', severity: { CRITICAL: 'حرج', HIGH: 'عالي', MODERATE: 'معتدل', LOW: 'منخفض' } },
    he: { title: 'זיהוי חריגות והתרעה מוקדמת', severity: { CRITICAL: 'קריטי', HIGH: 'גבוה', MODERATE: 'בינוני', LOW: 'נמוך' } },
    ja: { title: '異常検知と早期警告', severity: { CRITICAL: '重大', HIGH: '高', MODERATE: '中', LOW: '低' } },
    ko: { title: '이상 탐지 및 조기 경보', severity: { CRITICAL: '치명적', HIGH: '높음', MODERATE: '보통', LOW: '낮음' } },
    zh: { title: '异常检测与预警', severity: { CRITICAL: '严重', HIGH: '高', MODERATE: '中等', LOW: '低' } }
  };

  /**
   * Data Manager - Handles CSV fetching, parsing, and caching
   */
  class AnomalyDetectionDataManager {
    constructor() {
      this.data = null;
      this.language = this.detectLanguage();
    }

    detectLanguage() {
      const path = window.location.pathname;
      const match = path.match(/index_([a-z]{2})\.html/);
      return match ? match[1] : 'en';
    }

    getTranslations() {
      return TRANSLATIONS[this.language] || TRANSLATIONS.en;
    }

    async fetchData() {
      try {
        // Check cache first
        const cached = this.getCachedData();
        if (cached) {
          console.log('Using cached anomaly data');
          this.data = cached;
          return cached;
        }

        // Try to fetch from multiple URLs (local first, then remote fallback)
        console.log('Fetching fresh anomaly data from CIA...');
        let response = null;
        let lastError = null;
        
        for (const url of CONFIG.dataUrls) {
          try {
            console.log(`Attempting to fetch from: ${url}`);
            response = await fetch(url);
            
            if (response.ok) {
              console.log(`✓ Successfully fetched from: ${url}`);
              break; // Success, exit loop
            } else {
              console.warn(`⚠ Failed to fetch from ${url}: HTTP ${response.status}`);
              lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
              response = null; // Reset for next iteration
            }
          } catch (error) {
            console.warn(`⚠ Error fetching from ${url}:`, error.message);
            lastError = error;
            response = null;
          }
        }
        
        // If all URLs failed, throw the last error
        if (!response) {
          throw lastError || new Error('All data sources failed');
        }

        const csvText = await response.text();
        const parsedData = this.parseCSV(csvText);
        
        // Cache the data
        this.setCachedData(parsedData);
        this.data = parsedData;
        
        console.log(`Loaded ${parsedData.length} anomaly records`);
        return parsedData;
      } catch (error) {
        console.error('Error fetching anomaly data:', error);
        throw error;
      }
    }

    parseCSV(csvText) {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const record = {};
          headers.forEach((header, index) => {
            record[header] = values[index];
          });
          data.push(record);
        }
      }

      // Sort by year DESC, quarter DESC (most recent first)
      data.sort((a, b) => {
        const yearDiff = parseInt(b.year) - parseInt(a.year);
        if (yearDiff !== 0) return yearDiff;
        return parseInt(b.quarter) - parseInt(a.quarter);
      });

      return data;
    }

    parseCSVLine(line) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    }

    getCachedData() {
      try {
        const cached = localStorage.getItem(CONFIG.cacheKey);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        if (age < CONFIG.cacheDuration) {
          return data;
        }
        
        // Cache expired
        localStorage.removeItem(CONFIG.cacheKey);
        return null;
      } catch (error) {
        console.error('Error reading cache:', error);
        return null;
      }
    }

    setCachedData(data) {
      try {
        const cacheData = {
          data: data,
          timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.cacheKey, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Error setting cache:', error);
      }
    }

    identifyActiveAnomalies() {
      if (!this.data) return [];
      
      return this.data.filter(record => 
        record.anomaly_type !== 'NO_ANOMALY'
      ).sort((a, b) => {
        // Sort by max_z_score DESC (most severe first)
        return Math.abs(parseFloat(b.max_z_score)) - Math.abs(parseFloat(a.max_z_score));
      });
    }

    calculateAnomalyStats() {
      if (!this.data) return null;

      const anomalies = this.identifyActiveAnomalies();
      const total = this.data.length;
      const anomalyCount = anomalies.length;

      const criticalCount = anomalies.filter(a => a.anomaly_severity === 'CRITICAL').length;
      const highCount = anomalies.filter(a => a.anomaly_severity === 'HIGH').length;
      const moderateCount = anomalies.filter(a => a.anomaly_severity === 'MODERATE').length;

      const ballotAnomalies = anomalies.filter(a => a.anomaly_type === 'BALLOT_ANOMALY').length;
      const documentAnomalies = anomalies.filter(a => a.anomaly_type === 'DOCUMENT_ANOMALY').length;
      const attendanceAnomalies = anomalies.filter(a => a.anomaly_type === 'ATTENDANCE_ANOMALY').length;

      const avgZScore = anomalies.length > 0
        ? anomalies.reduce((sum, a) => sum + Math.abs(parseFloat(a.max_z_score)), 0) / anomalies.length
        : 0;

      return {
        total,
        anomalyCount,
        anomalyRate: (anomalyCount / total * 100).toFixed(1),
        criticalCount,
        highCount,
        moderateCount,
        ballotAnomalies,
        documentAnomalies,
        attendanceAnomalies,
        avgZScore: avgZScore.toFixed(2)
      };
    }

    checkForCriticalAnomalies() {
      if (!this.data || this.data.length === 0) return null;

      // Get the 2 most recent quarters
      const recentQuarters = this.data.slice(0, 2);
      
      // Find CRITICAL or HIGH anomalies
      const criticalAnomalies = recentQuarters.filter(record => 
        record.anomaly_severity === 'CRITICAL' || record.anomaly_severity === 'HIGH'
      );

      return criticalAnomalies.length > 0 ? criticalAnomalies[0] : null;
    }
  }

  /**
   * Alert System - Manages alert banner display
   */
  class AnomalyAlertSystem {
    constructor(dataManager) {
      this.dataManager = dataManager;
      this.translations = dataManager.getTranslations();
    }

    checkAndDisplayAlert(anomaly) {
      if (!anomaly) return;

      // Check if alert was recently dismissed
      const dismissedTimestamp = localStorage.getItem(CONFIG.alertDismissKey);
      if (dismissedTimestamp) {
        const age = Date.now() - parseInt(dismissedTimestamp);
        if (age < CONFIG.alertDismissDuration) {
          console.log('Alert was recently dismissed, not showing');
          return;
        }
      }

      const banner = document.getElementById('anomaly-alert-banner');
      const message = document.getElementById('alert-message');
      
      if (banner && message) {
        const alertText = this.generateAlertMessage(anomaly);
        message.textContent = alertText;
        
        const severity = anomaly.anomaly_severity.toLowerCase();
        banner.className = `alert-banner ${severity}`;
        banner.style.display = 'flex';

        // Attach dismiss handler
        const dismissBtn = banner.querySelector('.dismiss-alert');
        if (dismissBtn) {
          dismissBtn.onclick = () => this.dismissAlert();
        }
      }
    }

    dismissAlert() {
      const banner = document.getElementById('anomaly-alert-banner');
      if (banner) {
        banner.style.display = 'none';
        localStorage.setItem(CONFIG.alertDismissKey, Date.now().toString());
      }
    }

    generateAlertMessage(anomaly) {
      const year = anomaly.year;
      const quarter = `Q${anomaly.quarter}`;
      const type = anomaly.anomaly_type;
      const zScore = parseFloat(anomaly.max_z_score).toFixed(2);
      const direction = anomaly.anomaly_direction;
      
      let actualValue = '';
      let baseline = '';
      
      if (type === 'BALLOT_ANOMALY') {
        actualValue = `${anomaly.total_ballots} ballots`;
        baseline = `${Math.round(anomaly.q_baseline_ballots)} baseline`;
      } else if (type === 'DOCUMENT_ANOMALY') {
        actualValue = `${anomaly.documents_produced} documents`;
        baseline = `${Math.round(anomaly.q_baseline_docs)} baseline`;
      }

      return `${year} ${quarter} ${type}: ${zScore > 0 ? '+' : ''}${zScore} Z-score, ${direction} (${actualValue} vs ${baseline})`;
    }
  }

  /**
   * Chart Renderers - Creates visualizations using Chart.js and D3.js
   */
  class AnomalyDetectionCharts {
    constructor(dataManager) {
      this.dataManager = dataManager;
      this.translations = dataManager.getTranslations();
      this.chartInstances = {};
    }

    async renderAll() {
      await this.renderAnomalyTimeline();
      await this.renderZScoreDistribution();
      await this.renderAnomalyTypeChart();
      await this.renderSeverityHeatmap();
      await this.renderQuarterlyFrequency();
      await this.renderRecentAnomaliesFeed();
    }

    async renderAnomalyTimeline() {
      const canvas = document.getElementById('anomaly-timeline-chart');
      if (!canvas) return;

      const data = this.dataManager.data;
      const anomalies = data.filter(r => r.anomaly_type !== 'NO_ANOMALY');

      // Prepare data points
      const dataPoints = anomalies.map(record => {
        const year = parseInt(record.year);
        const quarter = parseInt(record.quarter);
        const xValue = year + (quarter - 1) * 0.25;
        const yValue = parseFloat(record.max_z_score);
        
        return {
          x: xValue,
          y: yValue,
          record: record
        };
      });

      // Destroy existing chart
      if (this.chartInstances.timeline) {
        this.chartInstances.timeline.destroy();
      }

      const ctx = canvas.getContext('2d');
      this.chartInstances.timeline = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Anomalies',
            data: dataPoints,
            backgroundColor: dataPoints.map(p => this.getSeverityColor(p.record.anomaly_severity)),
            borderColor: dataPoints.map(p => this.getSeverityColor(p.record.anomaly_severity)),
            pointRadius: dataPoints.map(p => this.getSeverityRadius(p.record.anomaly_severity)),
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const record = context.raw.record;
                  return [
                    `${record.year} Q${record.quarter}`,
                    `Type: ${record.anomaly_type}`,
                    `Severity: ${record.anomaly_severity}`,
                    `Z-Score: ${parseFloat(record.max_z_score).toFixed(2)}`,
                    `Direction: ${record.anomaly_direction}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Year'
              },
              ticks: {
                callback: function(value) {
                  return Math.floor(value);
                }
              }
            },
            y: {
              title: {
                display: true,
                text: 'Z-Score'
              },
              grid: {
                color: (context) => {
                  if (context.tick.value === 2.0 || context.tick.value === -2.0) {
                    return '#f57c00'; // Orange for threshold
                  }
                  return 'rgba(255, 255, 255, 0.1)';
                }
              }
            }
          }
        }
      });
    }

    async renderZScoreDistribution() {
      const canvas = document.getElementById('zscore-distribution-chart');
      if (!canvas) return;

      const data = this.dataManager.data;
      
      // Collect all Z-scores
      const zScores = [];
      data.forEach(record => {
        const ballotZ = parseFloat(record.ballot_z_score);
        const docZ = parseFloat(record.doc_z_score);
        const attendanceZ = parseFloat(record.attendance_z_score);
        
        if (!isNaN(ballotZ)) zScores.push(ballotZ);
        if (!isNaN(docZ)) zScores.push(docZ);
        if (!isNaN(attendanceZ)) zScores.push(attendanceZ);
      });

      // Create histogram bins
      const bins = [];
      const binSize = 0.5;
      const minZ = -3;
      const maxZ = 11; // Extended to cover outlier at +10.97
      
      for (let i = minZ; i < maxZ; i += binSize) {
        bins.push({
          min: i,
          max: i + binSize,
          count: 0,
          isOutlier: Math.abs(i) >= 2.0 || Math.abs(i + binSize) >= 2.0
        });
      }

      // Count Z-scores in each bin
      zScores.forEach(z => {
        const bin = bins.find(b => z >= b.min && z < b.max);
        if (bin) bin.count++;
      });

      // Destroy existing chart
      if (this.chartInstances.distribution) {
        this.chartInstances.distribution.destroy();
      }

      const ctx = canvas.getContext('2d');
      this.chartInstances.distribution = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: bins.map(b => `${b.min.toFixed(1)}`),
          datasets: [{
            label: 'Frequency',
            data: bins.map(b => b.count),
            backgroundColor: bins.map(b => b.isOutlier ? 'rgba(211, 47, 47, 0.7)' : 'rgba(0, 217, 255, 0.7)'),
            borderColor: bins.map(b => b.isOutlier ? '#d32f2f' : '#00d9ff'),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `Count: ${context.parsed.y}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Z-Score'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Frequency'
              },
              beginAtZero: true
            }
          }
        }
      });
    }

    async renderAnomalyTypeChart() {
      const canvas = document.getElementById('anomaly-type-chart');
      if (!canvas) return;

      const anomalies = this.dataManager.identifyActiveAnomalies();
      
      const ballotCount = anomalies.filter(a => a.anomaly_type === 'BALLOT_ANOMALY').length;
      const documentCount = anomalies.filter(a => a.anomaly_type === 'DOCUMENT_ANOMALY').length;
      const attendanceCount = anomalies.filter(a => a.anomaly_type === 'ATTENDANCE_ANOMALY').length;

      // Destroy existing chart
      if (this.chartInstances.typeChart) {
        this.chartInstances.typeChart.destroy();
      }

      const ctx = canvas.getContext('2d');
      this.chartInstances.typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Ballot Anomaly', 'Document Anomaly', 'Attendance Anomaly'],
          datasets: [{
            data: [ballotCount, documentCount, attendanceCount],
            backgroundColor: [
              'rgba(25, 118, 210, 0.8)',  // Blue
              'rgba(56, 142, 60, 0.8)',   // Green
              'rgba(245, 124, 0, 0.8)'    // Orange
            ],
            borderColor: [
              '#1976d2',
              '#388e3c',
              '#f57c00'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const total = ballotCount + documentCount + attendanceCount;
                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    async renderSeverityHeatmap() {
      const container = document.getElementById('severity-heatmap');
      if (!container) return;

      const data = this.dataManager.data;
      
      // Clear existing content
      container.innerHTML = '';

      // Get unique years
      const years = [...new Set(data.map(r => parseInt(r.year)))].sort();
      const quarters = [1, 2, 3, 4];

      // Create SVG
      const width = container.clientWidth || 800;
      const height = Math.min(600, years.length * 25);
      const margin = { top: 40, right: 40, bottom: 40, left: 60 };
      const cellWidth = (width - margin.left - margin.right) / quarters.length;
      const cellHeight = (height - margin.top - margin.bottom) / years.length;

      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // Create cells
      const cells = svg.selectAll('g')
        .data(data)
        .enter()
        .append('g');

      cells.append('rect')
        .attr('x', d => margin.left + (parseInt(d.quarter) - 1) * cellWidth)
        .attr('y', d => {
          const yearIndex = years.indexOf(parseInt(d.year));
          return margin.top + yearIndex * cellHeight;
        })
        .attr('width', cellWidth - 2)
        .attr('height', cellHeight - 2)
        .attr('fill', d => this.getHeatmapColor(d.anomaly_severity))
        .attr('stroke', '#0a0e27')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('stroke', '#00d9ff').attr('stroke-width', 2);
          
          // Show tooltip
          const tooltip = d3.select('body').append('div')
            .attr('class', 'heatmap-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(10, 14, 39, 0.95)')
            .style('color', '#fff')
            .style('padding', '10px')
            .style('border-radius', '4px')
            .style('border', '1px solid #00d9ff')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .html(`
              <strong>${d.year} Q${d.quarter}</strong><br>
              Severity: ${d.anomaly_severity}<br>
              Type: ${d.anomaly_type}<br>
              Max Z-Score: ${parseFloat(d.max_z_score).toFixed(2)}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke', '#0a0e27').attr('stroke-width', 1);
          d3.selectAll('.heatmap-tooltip').remove();
        });

      // Add year labels
      svg.selectAll('.year-label')
        .data(years)
        .enter()
        .append('text')
        .attr('class', 'year-label')
        .attr('x', margin.left - 10)
        .attr('y', (d, i) => margin.top + i * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#e0e0e0')
        .attr('font-size', '12px')
        .text(d => d);

      // Add quarter labels
      svg.selectAll('.quarter-label')
        .data(quarters)
        .enter()
        .append('text')
        .attr('class', 'quarter-label')
        .attr('x', (d, i) => margin.left + i * cellWidth + cellWidth / 2)
        .attr('y', margin.top - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e0e0e0')
        .attr('font-size', '12px')
        .text(d => `Q${d}`);
    }

    async renderQuarterlyFrequency() {
      const canvas = document.getElementById('quarterly-frequency-chart');
      if (!canvas) return;

      const anomalies = this.dataManager.identifyActiveAnomalies();
      
      // Count anomalies by quarter and severity
      const quarterData = {
        1: { critical: 0, high: 0, moderate: 0, total: 0 },
        2: { critical: 0, high: 0, moderate: 0, total: 0 },
        3: { critical: 0, high: 0, moderate: 0, total: 0 },
        4: { critical: 0, high: 0, moderate: 0, total: 0 }
      };

      anomalies.forEach(record => {
        const quarter = parseInt(record.quarter);
        const severity = record.anomaly_severity;
        
        quarterData[quarter].total++;
        
        if (severity === 'CRITICAL') quarterData[quarter].critical++;
        else if (severity === 'HIGH') quarterData[quarter].high++;
        else if (severity === 'MODERATE') quarterData[quarter].moderate++;
      });

      // Destroy existing chart
      if (this.chartInstances.quarterly) {
        this.chartInstances.quarterly.destroy();
      }

      const ctx = canvas.getContext('2d');
      this.chartInstances.quarterly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'Critical',
              data: [quarterData[1].critical, quarterData[2].critical, quarterData[3].critical, quarterData[4].critical],
              backgroundColor: 'rgba(211, 47, 47, 0.8)',
              borderColor: '#d32f2f',
              borderWidth: 1
            },
            {
              label: 'High',
              data: [quarterData[1].high, quarterData[2].high, quarterData[3].high, quarterData[4].high],
              backgroundColor: 'rgba(245, 124, 0, 0.8)',
              borderColor: '#f57c00',
              borderWidth: 1
            },
            {
              label: 'Moderate',
              data: [quarterData[1].moderate, quarterData[2].moderate, quarterData[3].moderate, quarterData[4].moderate],
              backgroundColor: 'rgba(251, 192, 45, 0.8)',
              borderColor: '#fbc02d',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: 'Quarter'
              }
            },
            y: {
              stacked: true,
              title: {
                display: true,
                text: 'Anomaly Count'
              },
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }

    async renderRecentAnomaliesFeed() {
      const container = document.getElementById('recent-anomalies-feed');
      if (!container) return;

      const anomalies = this.dataManager.identifyActiveAnomalies();
      const recent = anomalies.slice(0, 5);

      container.innerHTML = '';

      if (recent.length === 0) {
        container.innerHTML = '<p>No recent anomalies detected</p>';
        return;
      }

      recent.forEach(record => {
        const item = document.createElement('div');
        item.className = `anomaly-feed-item ${record.anomaly_severity.toLowerCase()}`;
        
        const severity = record.anomaly_severity;
        const icon = ALERT_CONFIG[severity].icon;
        const zScore = parseFloat(record.max_z_score).toFixed(2);
        
        let detailsText = '';
        if (record.anomaly_type === 'BALLOT_ANOMALY') {
          detailsText = `${record.total_ballots} ballots vs ${Math.round(record.q_baseline_ballots)} baseline`;
        } else if (record.anomaly_type === 'DOCUMENT_ANOMALY') {
          detailsText = `${record.documents_produced} documents vs ${Math.round(record.q_baseline_docs)} baseline`;
        }

        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
            <span style="font-size: 1.5rem;">${icon}</span>
            <span class="severity-badge ${severity.toLowerCase()}">${severity}</span>
            <span><strong>${record.year} Q${record.quarter}</strong></span>
          </div>
          <div style="margin-left: 2.5rem;">
            <p style="margin: 2px 0;"><strong>Type:</strong> ${record.anomaly_type}</p>
            <p style="margin: 2px 0;"><strong>Z-Score:</strong> ${zScore > 0 ? '+' : ''}${zScore}</p>
            <p style="margin: 2px 0;"><strong>Direction:</strong> ${record.anomaly_direction}</p>
            <p style="margin: 2px 0;"><strong>Details:</strong> ${detailsText}</p>
          </div>
        `;
        
        container.appendChild(item);
      });
    }

    getSeverityColor(severity) {
      const colors = {
        CRITICAL: '#d32f2f',
        HIGH: '#f57c00',
        MODERATE: '#fbc02d',
        LOW: '#388e3c'
      };
      return colors[severity] || '#666';
    }

    getSeverityRadius(severity) {
      const sizes = {
        CRITICAL: 8,
        HIGH: 7,
        MODERATE: 6,
        LOW: 5
      };
      return sizes[severity] || 5;
    }

    getHeatmapColor(severity) {
      const colors = {
        CRITICAL: '#d32f2f',
        HIGH: '#f57c00',
        MODERATE: '#fbc02d',
        LOW: '#388e3c',
        NO_ANOMALY: '#2e3b4e'
      };
      return colors[severity] || colors.NO_ANOMALY;
    }
  }

  /**
   * Dashboard Initializer
   */
  class AnomalyDetectionDashboard {
    constructor() {
      this.dataManager = new AnomalyDetectionDataManager();
      this.alertSystem = new AnomalyAlertSystem(this.dataManager);
      this.charts = new AnomalyDetectionCharts(this.dataManager);
    }

    async initialize() {
      try {
        console.log('Initializing Anomaly Detection Dashboard...');
        
        // Show loading state
        this.showLoading();

        // Fetch data
        await this.dataManager.fetchData();

        // Check for critical anomalies and show alert
        const criticalAnomaly = this.dataManager.checkForCriticalAnomalies();
        if (criticalAnomaly) {
          this.alertSystem.checkAndDisplayAlert(criticalAnomaly);
        }

        // Render all visualizations
        await this.charts.renderAll();

        // Log statistics
        const stats = this.dataManager.calculateAnomalyStats();
        console.log('Anomaly Statistics:', stats);

        // Hide loading state
        this.hideLoading();

        console.log('Anomaly Detection Dashboard initialized successfully');
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        this.showError(error.message);
      }
    }

    showLoading() {
      const sections = document.querySelectorAll('#anomaly-detection-dashboard .chart-card');
      sections.forEach(section => {
        const canvas = section.querySelector('canvas');
        const container = section.querySelector('div[id$="-heatmap"], div[id$="-feed"]');
        
        if (canvas || container) {
          const loading = document.createElement('div');
          loading.className = 'loading-indicator';
          loading.textContent = this.dataManager.getTranslations().loading;
          loading.style.padding = '20px';
          loading.style.textAlign = 'center';
          loading.style.color = '#00d9ff';
          
          if (canvas) {
            canvas.style.display = 'none';
            section.appendChild(loading);
          } else if (container) {
            container.innerHTML = '';
            container.appendChild(loading);
          }
        }
      });
    }

    hideLoading() {
      const loadingIndicators = document.querySelectorAll('.loading-indicator');
      loadingIndicators.forEach(indicator => indicator.remove());
      
      const canvases = document.querySelectorAll('#anomaly-detection-dashboard canvas');
      canvases.forEach(canvas => canvas.style.display = 'block');
    }

    showError(message) {
      const dashboard = document.getElementById('anomaly-detection-dashboard');
      if (dashboard) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.padding = '20px';
        errorDiv.style.backgroundColor = 'rgba(211, 47, 47, 0.2)';
        errorDiv.style.border = '2px solid #d32f2f';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.margin = '20px 0';
        errorDiv.style.color = '#fff';
        errorDiv.innerHTML = `
          <h3>⚠️ Error Loading Dashboard</h3>
          <p>${message}</p>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
        `;
        
        dashboard.insertBefore(errorDiv, dashboard.firstChild);
      }
    }
  }

  // Initialize dashboard when DOM is ready and libraries are loaded
  function waitForLibraries(callback) {
    const checkLibraries = () => {
      if (typeof Chart !== 'undefined' && typeof d3 !== 'undefined') {
        callback();
      } else {
        setTimeout(checkLibraries, 100);
      }
    };
    checkLibraries();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      waitForLibraries(() => {
        const dashboard = new AnomalyDetectionDashboard();
        dashboard.initialize();
      });
    });
  } else {
    waitForLibraries(() => {
      const dashboard = new AnomalyDetectionDashboard();
      dashboard.initialize();
    });
  }

})();
