/**
 * Pre-Election Monitoring Dashboard
 * 
 * Tracks Q4 parliamentary activity in the critical 12-24 months before Swedish elections.
 * Compares election years vs. non-election years, detects activity shifts, and provides
 * early warning indicators for election-driven behavior changes.
 * 
 * @version 1.0.0
 * @author Hack23 AB
 * @license Apache-2.0
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    dataUrls: {
      preElection: [
        'cia-data/pre-election/view_riksdagen_pre_election_quarterly_activity_sample.csv',
        'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_pre_election_quarterly_activity_sample.csv'
      ],
      electionComparison: [
        'cia-data/pre-election/view_riksdagen_q4_election_year_comparison_sample.csv',
        'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_q4_election_year_comparison_sample.csv'
      ]
    },
    cachePrefix: 'riksdag_pre_election_',
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
    chartColors: {
      ballots: '#00d9ff',
      documents: '#ff006e',
      attendance: '#ffbe0b',
      baseline: '#666666',
      normal: '#388e3c',
      warning: '#f57c00',
      alert: '#d32f2f',
      election: '#ff006e',
      nonElection: '#00d9ff'
    },
    thresholds: {
      ballotWarning: -30,
      ballotAlert: -50,
      documentWarning: 20,
      attendanceWarning: -2,
      yoyAlert: 50
    }
  };

  // Translations for 2 languages (EN, SV)
  // NOTE: Only English and Swedish translations implemented. Other languages use English fallback.
  const TRANSLATIONS = {
    en: {
      title: 'Pre-Election Monitoring Dashboard',
      currentYear: '2025 Q4',
      baseline: 'Baseline',
      deviation: 'Deviation',
      ballotActivity: 'Ballot Activity',
      documentProduction: 'Document Production',
      attendanceRate: 'Attendance Rate',
      partyWinRate: 'Party Win Rate',
      vsBaseline: 'vs baseline',
      yoy: 'YoY',
      normal: 'NORMAL',
      reduced: 'REDUCED',
      elevated: 'ELEVATED',
      improving: 'IMPROVING',
      declining: 'DECLINING',
      stable: 'STABLE',
      metrics: {
        ballots: 'Ballots',
        documents: 'Documents',
        attendance: 'Attendance',
        yoyChange: 'YoY Change',
        winRate: 'Win Rate',
        absenceRate: 'Absence Rate',
        proposals: 'Proposals',
        assignments: 'Assignments'
      },
      status: {
        ok: 'OK',
        warning: 'Warning',
        alert: 'Alert'
      }
    },
    sv: {
      title: 'Övervakning före val',
      currentYear: '2025 Q4',
      baseline: 'Baslinje',
      deviation: 'Avvikelse',
      ballotActivity: 'Omröstningsaktivitet',
      documentProduction: 'Dokumentproduktion',
      attendanceRate: 'Närvarofrekvens',
      partyWinRate: 'Partiets vinstfrekvens',
      vsBaseline: 'vs baslinje',
      yoy: 'ÅfÅ',
      normal: 'NORMAL',
      reduced: 'MINSKAD',
      elevated: 'FÖRHÖJD',
      improving: 'FÖRBÄTTRAS',
      declining: 'FÖRSÄMRAS',
      stable: 'STABIL',
      metrics: {
        ballots: 'Omröstningar',
        documents: 'Dokument',
        attendance: 'Närvaro',
        yoyChange: 'ÅfÅ-förändring',
        winRate: 'Vinstfrekvens',
        absenceRate: 'Frånvarofrekvens',
        proposals: 'Förslag',
        assignments: 'Uppdrag'
      },
      status: {
        ok: 'OK',
        warning: 'Varning',
        alert: 'Alert'
      }
    }
  };

  // Detect current language from URL
  function getCurrentLanguage() {
    const url = window.location.pathname;
    if (url.includes('_sv.html')) return 'sv';
    if (url.includes('_da.html')) return 'da';
    if (url.includes('_no.html')) return 'no';
    if (url.includes('_fi.html')) return 'fi';
    if (url.includes('_de.html')) return 'de';
    if (url.includes('_fr.html')) return 'fr';
    if (url.includes('_es.html')) return 'es';
    if (url.includes('_nl.html')) return 'nl';
    if (url.includes('_ar.html')) return 'ar';
    if (url.includes('_he.html')) return 'he';
    if (url.includes('_ja.html')) return 'ja';
    if (url.includes('_ko.html')) return 'ko';
    if (url.includes('_zh.html')) return 'zh';
    return 'en';
  }

  const currentLang = getCurrentLanguage();
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Data Manager
  class PreElectionDataManager {
    constructor() {
      this.preElectionData = null;
      this.electionComparisonData = null;
    }

    async fetchData() {
      try {
        // Try to load from cache first
        const cachedPreElection = this.loadFromCache('preElection');
        const cachedElectionComparison = this.loadFromCache('electionComparison');

        if (cachedPreElection && cachedElectionComparison) {
          this.preElectionData = cachedPreElection;
          this.electionComparisonData = cachedElectionComparison;
          console.log('✓ Loaded pre-election data from cache');
          return true;
        }

        // Fetch fresh data with local-first strategy
        const [preElectionCsv, electionComparisonCsv] = await Promise.all([
          this.fetchWithFallback(CONFIG.dataUrls.preElection),
          this.fetchWithFallback(CONFIG.dataUrls.electionComparison)
        ]);

        if (!preElectionCsv || !electionComparisonCsv) {
          throw new Error('Failed to fetch CIA data');
        }

        // Parse CSV data
        this.preElectionData = this.parseCSV(preElectionCsv);
        this.electionComparisonData = this.parseCSV(electionComparisonCsv);

        // Cache the data
        this.saveToCache('preElection', this.preElectionData);
        this.saveToCache('electionComparison', this.electionComparisonData);

        console.log('✓ Loaded pre-election data from source');
        return true;
      } catch (error) {
        console.error('Error fetching pre-election data:', error);
        return false;
      }
    }

    async fetchWithFallback(urls) {
      // urls can be a string or array of URLs (local first, then remote)
      const urlArray = Array.isArray(urls) ? urls : [urls];

      for (let i = 0; i < urlArray.length; i++) {
        const url = urlArray[i];
        const isLocal = !url.startsWith('http');

        try {
          console.log(`Trying to fetch: ${url}`);
          const response = await fetch(url);

          if (response.ok) {
            const text = await response.text();
            // Verify we got actual CSV data (not empty or error page)
            if (text.trim().length > 0 && text.includes(',')) {
              console.log(`✓ Successfully loaded from ${isLocal ? 'local' : 'remote'}: ${url}`);
              return text;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${url}:`, error.message);
          // Continue to next URL in fallback chain
        }
      }

      console.error('All fetch attempts failed for:', urlArray);
      return null;
    }

    parseCSV(csvText) {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || '';
          // Convert numeric values
          if (!isNaN(value) && value !== '') {
            row[header] = parseFloat(value);
          } else {
            row[header] = value;
          }
        });
        data.push(row);
      }

      return data;
    }

    loadFromCache(key) {
      try {
        const cached = localStorage.getItem(CONFIG.cachePrefix + key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        if (age > CONFIG.cacheDuration) {
          localStorage.removeItem(CONFIG.cachePrefix + key);
          return null;
        }

        return data;
      } catch (error) {
        console.error('Cache load error:', error);
        return null;
      }
    }

    saveToCache(key, data) {
      try {
        const cacheData = {
          data: data,
          timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.cachePrefix + key, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Cache save error:', error);
      }
    }

    getLatestYear() {
      if (!this.preElectionData || this.preElectionData.length === 0) return null;
      return Math.max(...this.preElectionData.map(d => d.year));
    }

    getCurrentYearData(year) {
      if (!this.preElectionData) return null;
      
      // If no year specified, use the latest year in the dataset
      const targetYear = year !== undefined ? year : this.getLatestYear();
      if (!targetYear) return null;
      
      return this.preElectionData.find(d => d.year === targetYear);
    }

    calculateDeviations(currentYear) {
      const data = this.getCurrentYearData(currentYear);
      if (!data) return null;

      return {
        ballots: data.ballot_percent_change_from_baseline || 0,
        documents: data.document_percent_change_from_baseline || 0,
        assignments: ((data.total_new_assignments - data.baseline_assignments) / data.baseline_assignments * 100) || 0,
        attendance: ((data.avg_attendance_rate - data.baseline_attendance) / data.baseline_attendance * 100) || 0
      };
    }

    classifyActivityLevel(deviation) {
      if (deviation < -50) return 'SEVERELY_REDUCED';
      if (deviation < -30) return 'REDUCED_ACTIVITY';
      if (deviation > 50) return 'UNUSUALLY_HIGH_ACTIVITY';
      if (deviation > 20) return 'ELEVATED_ACTIVITY';
      return 'NORMAL_ACTIVITY';
    }

    generateEarlyWarnings() {
      const data = this.getCurrentYearData();
      if (!data) return [];

      const warnings = [];
      const deviations = this.calculateDeviations();

      // Ballot warning
      if (deviations.ballots < CONFIG.thresholds.ballotAlert) {
        warnings.push({ metric: 'ballots', status: 'alert', deviation: deviations.ballots });
      } else if (deviations.ballots < CONFIG.thresholds.ballotWarning) {
        warnings.push({ metric: 'ballots', status: 'warning', deviation: deviations.ballots });
      } else {
        warnings.push({ metric: 'ballots', status: 'ok', deviation: deviations.ballots });
      }

      // Document warning
      if (Math.abs(deviations.documents) > CONFIG.thresholds.documentWarning) {
        warnings.push({ metric: 'documents', status: 'warning', deviation: deviations.documents });
      } else {
        warnings.push({ metric: 'documents', status: 'ok', deviation: deviations.documents });
      }

      // Attendance warning
      if (deviations.attendance < CONFIG.thresholds.attendanceWarning) {
        warnings.push({ metric: 'attendance', status: 'warning', deviation: deviations.attendance });
      } else {
        warnings.push({ metric: 'attendance', status: 'ok', deviation: deviations.attendance });
      }

      // YoY change warning
      if (Math.abs(data.yoy_ballot_change_pct || 0) > CONFIG.thresholds.yoyAlert) {
        warnings.push({ metric: 'yoyChange', status: 'alert', deviation: data.yoy_ballot_change_pct });
      } else {
        warnings.push({ metric: 'yoyChange', status: 'ok', deviation: data.yoy_ballot_change_pct });
      }

      return warnings;
    }
  }

  // Chart Renderer
  class PreElectionCharts {
    constructor(dataManager) {
      this.dataManager = dataManager;
    }

    renderQ4Timeline() {
      const ctx = document.getElementById('q4-timeline-chart');
      if (!ctx) return;

      const data = this.dataManager.preElectionData;
      if (!data || data.length === 0) return;

      // Sort by year
      data.sort((a, b) => a.year - b.year);

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.year),
          datasets: [
            {
              label: t.metrics.ballots,
              data: data.map(d => d.total_ballots),
              borderColor: CONFIG.chartColors.ballots,
              backgroundColor: CONFIG.chartColors.ballots + '33',
              yAxisID: 'y1',
              tension: 0.3
            },
            {
              label: t.metrics.documents,
              data: data.map(d => d.total_documents),
              borderColor: CONFIG.chartColors.documents,
              backgroundColor: CONFIG.chartColors.documents + '33',
              yAxisID: 'y2',
              tension: 0.3
            },
            {
              label: t.baseline + ' (Ballots)',
              data: data.map(d => d.baseline_ballots),
              borderColor: CONFIG.chartColors.baseline,
              borderDash: [5, 5],
              pointRadius: 0,
              yAxisID: 'y1',
              fill: false
            },
            {
              label: t.baseline + ' (Documents)',
              data: data.map(d => d.baseline_documents),
              borderColor: CONFIG.chartColors.baseline,
              borderDash: [5, 5],
              pointRadius: 0,
              yAxisID: 'y2',
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#e0e0e0' }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += context.parsed.y.toLocaleString();
                  return label;
                }
              }
            }
          },
          scales: {
            y1: {
              type: 'linear',
              position: 'left',
              title: {
                display: true,
                text: 'Ballots',
                color: CONFIG.chartColors.ballots
              },
              ticks: { color: '#e0e0e0' },
              grid: { color: '#ffffff22' }
            },
            y2: {
              type: 'linear',
              position: 'right',
              title: {
                display: true,
                text: 'Documents',
                color: CONFIG.chartColors.documents
              },
              ticks: { color: '#e0e0e0' },
              grid: { drawOnChartArea: false }
            },
            x: {
              ticks: { color: '#e0e0e0' },
              grid: { color: '#ffffff22' }
            }
          }
        }
      });
    }

    renderElectionComparison() {
      const ctx = document.getElementById('election-comparison-chart');
      if (!ctx) return;

      const data = this.dataManager.electionComparisonData;
      if (!data || data.length === 0) return;

      // Sort by year
      data.sort((a, b) => a.year - b.year);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.year),
          datasets: [
            {
              label: 'Election Year',
              data: data.map(d => (d.is_election_year === 't' || d.is_election_year === true) ? d.total_ballots : null),
              backgroundColor: CONFIG.chartColors.election + '99',
              borderColor: CONFIG.chartColors.election,
              borderWidth: 1
            },
            {
              label: 'Non-Election Year',
              data: data.map(d => (d.is_election_year === 'f' || d.is_election_year === false) ? d.total_ballots : null),
              backgroundColor: CONFIG.chartColors.nonElection + '99',
              borderColor: CONFIG.chartColors.nonElection,
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#e0e0e0' }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + (context.parsed.y || 0).toLocaleString() + ' ballots';
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Total Ballots',
                color: '#e0e0e0'
              },
              ticks: { color: '#e0e0e0' },
              grid: { color: '#ffffff22' }
            },
            x: {
              ticks: { 
                color: '#e0e0e0',
                maxRotation: 45,
                minRotation: 45
              },
              grid: { color: '#ffffff22' }
            }
          }
        }
      });
    }

    renderDeviationRadar() {
      const ctx = document.getElementById('deviation-radar-chart');
      if (!ctx) return;

      const latestYear = this.dataManager.getLatestYear();
      const data = this.dataManager.getCurrentYearData(latestYear);
      if (!data) return;

      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: [t.metrics.ballots, t.metrics.documents, t.metrics.assignments, t.metrics.attendance, t.metrics.winRate, t.metrics.absenceRate],
          datasets: [
            {
              label: `${latestYear} Q4`,
              data: [
                data.total_ballots / 100,
                data.total_documents / 100,
                data.total_new_assignments,
                data.avg_attendance_rate,
                data.avg_party_win_rate,
                data.avg_party_absence_rate
              ],
              borderColor: CONFIG.chartColors.ballots,
              backgroundColor: CONFIG.chartColors.ballots + '33',
              pointBackgroundColor: CONFIG.chartColors.ballots
            },
            {
              label: t.baseline,
              data: [
                data.baseline_ballots / 100,
                data.baseline_documents / 100,
                data.baseline_assignments,
                data.baseline_attendance || 85,
                data.baseline_party_win_rate || 56,
                data.baseline_party_absence_rate || 15
              ],
              borderColor: CONFIG.chartColors.baseline,
              backgroundColor: CONFIG.chartColors.baseline + '22',
              borderDash: [5, 5],
              pointBackgroundColor: CONFIG.chartColors.baseline
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#e0e0e0' }
            }
          },
          scales: {
            r: {
              angleLines: { color: '#ffffff22' },
              grid: { color: '#ffffff22' },
              pointLabels: { color: '#e0e0e0' },
              ticks: { 
                color: '#e0e0e0',
                backdropColor: 'transparent'
              }
            }
          }
        }
      });
    }

    renderPartyTrends() {
      const ctx = document.getElementById('party-trends-chart');
      if (!ctx) return;

      const data = this.dataManager.preElectionData;
      if (!data || data.length === 0) return;

      data.sort((a, b) => a.year - b.year);

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.year),
          datasets: [
            {
              label: 'Party Win Rate (%)',
              data: data.map(d => d.avg_party_win_rate),
              borderColor: CONFIG.chartColors.normal,
              backgroundColor: CONFIG.chartColors.normal + '33',
              tension: 0.3,
              yAxisID: 'y'
            },
            {
              label: 'Party Absence Rate (%)',
              data: data.map(d => d.avg_party_absence_rate),
              borderColor: CONFIG.chartColors.alert,
              backgroundColor: CONFIG.chartColors.alert + '33',
              tension: 0.3,
              yAxisID: 'y'
            },
            {
              label: 'Party Documents (÷100)',
              data: data.map(d => (d.party_documents_total || 0) / 100),
              borderColor: CONFIG.chartColors.documents,
              backgroundColor: CONFIG.chartColors.documents + '33',
              tension: 0.3,
              yAxisID: 'y2'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#e0e0e0' }
            }
          },
          scales: {
            y: {
              type: 'linear',
              position: 'left',
              title: {
                display: true,
                text: 'Percentage (%)',
                color: '#e0e0e0'
              },
              ticks: { color: '#e0e0e0' },
              grid: { color: '#ffffff22' }
            },
            y2: {
              type: 'linear',
              position: 'right',
              title: {
                display: true,
                text: 'Documents (÷100)',
                color: '#e0e0e0'
              },
              ticks: { color: '#e0e0e0' },
              grid: { drawOnChartArea: false }
            },
            x: {
              ticks: { color: '#e0e0e0' },
              grid: { color: '#ffffff22' }
            }
          }
        }
      });
    }

    renderYoYWaterfall() {
      const ctx = document.getElementById('yoy-waterfall-chart');
      if (!ctx) return;

      const data = this.dataManager.preElectionData;
      if (!data || data.length === 0) return;

      data.sort((a, b) => a.year - b.year);

      const years = data.map(d => d.year);
      const values = data.map(d => d.total_ballots);
      
      // Generate labels and changes dynamically
      const labels = [];
      const changes = [];
      
      for (let i = 0; i < values.length; i++) {
        if (i === 0) {
          // First year: absolute value
          labels.push(String(years[0]));
          changes.push(values[0]);
        } else {
          // Subsequent years: year-over-year change
          labels.push(String(years[i]) + ' Change');
          changes.push(values[i] - values[i - 1]);
        }
      }

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ballot Activity',
            data: changes,
            backgroundColor: changes.map((v, i) => 
              i === 0 ? CONFIG.chartColors.ballots :
              v > 0 ? CONFIG.chartColors.normal : CONFIG.chartColors.alert
            ),
            borderColor: changes.map((v, i) => 
              i === 0 ? CONFIG.chartColors.ballots :
              v > 0 ? CONFIG.chartColors.normal : CONFIG.chartColors.alert
            ),
            borderWidth: 2
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
                label: function(context) {
                  const value = context.parsed.y;
                  const label = context.label;
                  if (label.includes('Change')) {
                    return (value > 0 ? '+' : '') + value.toLocaleString() + ' ballots';
                  }
                  return value.toLocaleString() + ' ballots';
                }
              }
            }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'Ballots',
                color: '#e0e0e0'
              },
              ticks: { color: '#e0e0e0' },
              grid: { color: '#ffffff22' }
            },
            x: {
              ticks: { color: '#e0e0e0' },
              grid: { color: '#ffffff22' }
            }
          }
        }
      });
    }

    renderWarningMatrix() {
      const container = document.getElementById('warning-matrix');
      if (!container) return;

      const warnings = this.dataManager.generateEarlyWarnings();
      const lang = getCurrentLanguage();
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

      container.innerHTML = warnings.map(w => {
        const statusIcon = w.status === 'ok' ? '🟢' : w.status === 'warning' ? '🟡' : '🔴';
        const statusClass = w.status === 'ok' ? 'normal' : w.status === 'warning' ? 'warning' : 'alert';
        const statusLabel = t.status[w.status] || w.status.toUpperCase();
        const metricLabel = t.metrics[w.metric] || w.metric;
        const deviationText = (w.deviation > 0 ? '+' : '') + w.deviation.toFixed(1) + '%';

        return `
          <div class="warning-cell ${statusClass}">
            <div class="status-icon" role="img" aria-label="${statusLabel}">${statusIcon}</div>
            <div class="metric-name">${metricLabel}</div>
            <div class="deviation-value">${deviationText}</div>
          </div>
        `;
      }).join('');
    }

    renderAllCharts() {
      this.renderQ4Timeline();
      this.renderElectionComparison();
      this.renderDeviationRadar();
      this.renderPartyTrends();
      this.renderYoYWaterfall();
      this.renderWarningMatrix();
    }
  }

  // Status Card Updater
  function updateStatusCards(dataManager) {
    const latestYear = dataManager.getLatestYear();
    const data = dataManager.getCurrentYearData(latestYear);
    if (!data) return;

    const deviations = dataManager.calculateDeviations(latestYear);

    // Update ballot activity
    const ballotCard = document.querySelector('.status-card[data-metric="ballots"]');
    if (ballotCard) {
      ballotCard.querySelector('.current-value').textContent = data.total_ballots.toLocaleString();
      ballotCard.querySelector('.baseline-comparison').textContent = 
        (deviations.ballots > 0 ? '+' : '') + deviations.ballots.toFixed(2) + '% ' + t.vsBaseline;
      
      const badge = ballotCard.querySelector('.status-badge');
      if (deviations.ballots < -30) {
        badge.textContent = t.reduced;
        badge.className = 'status-badge alert';
      } else if (deviations.ballots > 20) {
        badge.textContent = t.elevated;
        badge.className = 'status-badge improving';
      } else {
        badge.textContent = t.normal;
        badge.className = 'status-badge normal';
      }
    }

    // Update document production
    const docCard = document.querySelector('.status-card[data-metric="documents"]');
    if (docCard) {
      docCard.querySelector('.current-value').textContent = data.total_documents.toLocaleString();
      docCard.querySelector('.baseline-comparison').textContent = 
        (deviations.documents > 0 ? '+' : '') + deviations.documents.toFixed(2) + '% ' + t.vsBaseline;
      
      const badge = docCard.querySelector('.status-badge');
      badge.textContent = t.normal;
      badge.className = 'status-badge normal';
    }

    // Update attendance rate
    const attendanceCard = document.querySelector('.status-card[data-metric="attendance"]');
    if (attendanceCard) {
      attendanceCard.querySelector('.current-value').textContent = 
        data.avg_attendance_rate.toFixed(2) + '%';
      attendanceCard.querySelector('.baseline-comparison').textContent = 
        (deviations.attendance > 0 ? '+' : '') + deviations.attendance.toFixed(2) + '% ' + t.vsBaseline;
      
      const badge = attendanceCard.querySelector('.status-badge');
      badge.textContent = t.stable;
      badge.className = 'status-badge normal';
    }

    // Update party performance
    const partyCard = document.querySelector('.status-card[data-metric="party-performance"]');
    if (partyCard) {
      partyCard.querySelector('.current-value').textContent = 
        data.avg_party_win_rate.toFixed(2) + '%';
      
      const prevYear = dataManager.preElectionData.find(d => d.year === 2024);
      const yoyChange = prevYear ? 
        ((data.avg_party_win_rate - prevYear.avg_party_win_rate) / prevYear.avg_party_win_rate * 100) : 0;
      
      partyCard.querySelector('.baseline-comparison').textContent = 
        (yoyChange > 0 ? '+' : '') + yoyChange.toFixed(2) + '% ' + t.yoy;
      
      const badge = partyCard.querySelector('.status-badge');
      if (yoyChange > 0) {
        badge.textContent = t.improving;
        badge.className = 'status-badge improving';
      } else {
        badge.textContent = t.declining;
        badge.className = 'status-badge warning';
      }
    }
  }

  // Initialize dashboard
  async function initDashboard() {
    // Check if dashboard exists on page
    if (!document.getElementById('pre-election-dashboard')) {
      return;
    }

    console.log('Initializing Pre-Election Monitoring Dashboard...');

    // Show loading state
    const dashboard = document.getElementById('pre-election-dashboard');
    dashboard.classList.add('loading');

    // Initialize data manager
    const dataManager = new PreElectionDataManager();
    const success = await dataManager.fetchData();

    if (!success) {
      console.error('Failed to load pre-election data');
      dashboard.innerHTML = '<p class="error">Failed to load dashboard data. Please try again later.</p>';
      return;
    }

    // Update status cards
    updateStatusCards(dataManager);

    // Render charts
    const chartRenderer = new PreElectionCharts(dataManager);
    chartRenderer.renderAllCharts();

    // Remove loading state
    dashboard.classList.remove('loading');

    console.log('Pre-Election Monitoring Dashboard initialized successfully');
  }

  // Wait for DOM and Chart.js to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for Chart.js to load (max 10 seconds)
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds at 100ms intervals
      const checkChartJS = setInterval(() => {
        attempts++;
        if (typeof Chart !== 'undefined') {
          clearInterval(checkChartJS);
          initDashboard();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkChartJS);
          console.error('Chart.js failed to load after 10 seconds');
          const dashboard = document.getElementById('pre-election-dashboard');
          if (dashboard) {
            dashboard.innerHTML = '<div class="error">Failed to load Chart.js library. Please refresh the page.</div>';
          }
        }
      }, 100);
    });
  } else {
    // Wait for Chart.js to load (max 10 seconds)
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds at 100ms intervals
    const checkChartJS = setInterval(() => {
      attempts++;
      if (typeof Chart !== 'undefined') {
        clearInterval(checkChartJS);
        initDashboard();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkChartJS);
        console.error('Chart.js failed to load after 10 seconds');
        const dashboard = document.getElementById('pre-election-dashboard');
        if (dashboard) {
          dashboard.innerHTML = '<div class="error">Failed to load Chart.js library. Please refresh the page.</div>';
        }
      }
    }, 100);
  }

})();
