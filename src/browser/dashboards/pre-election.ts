/**
 * @module Dashboards/PreElection
 * @category Intelligence Analysis - Pre-Election Activity Monitoring & Behavior Anomaly Detection
 *
 * Swedish Pre-Election Activity Monitoring & Electoral Behavior Intelligence Dashboard.
 *
 * Advanced intelligence analysis platform implementing critical pre-election period monitoring
 * (12-24 months before elections) with real-time activity anomaly detection. Detects
 * election-driven behavior changes through quarterly comparison and establishes early warning
 * indicators for coalition formation, government dissolution, and electoral campaign intensity.
 *
 * @author Hack23 AB - Pre-Election Intelligence Team
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024

 *
 * @intelligence Pre-Election Activity Monitoring & Behavior Anomaly Detection — critical-period intelligence monitoring (12-24 months before elections) with real-time activity anomaly detection. Detects election-driven behavior changes through quarterly comparison. Provides early warning for coalition formation, government dissolution, and campaign intensity signals.
 *
 * @business Early warning intelligence product — pre-election monitoring is the most time-sensitive intelligence product. Creates urgency for real-time access (premium tier justification). Valuable to political consulting firms, media organizations, and financial institutions tracking political stability.
 *
 * @marketing Campaign-period content engine — pre-election anomaly alerts generate timely, newsworthy content during the highest-traffic political period. Each detected anomaly is a potential press release, social media post, and newsletter feature. Peak content marketing effectiveness.
 * */

import {
  logger,
  detectLanguage,
} from '../shared/index.js';

import type { CSVRow } from '../shared/index.js';

const Chart = (globalThis as any).Chart;

// ============================================================================
// INTERFACES
// ============================================================================

interface PreElectionConfig {
  readonly dataUrls: {
    readonly preElection: readonly string[];
    readonly electionComparison: readonly string[];
  };
  readonly cachePrefix: string;
  readonly cacheDuration: number;
  readonly chartColors: Record<string, string>;
  readonly thresholds: {
    readonly ballotWarning: number;
    readonly ballotAlert: number;
    readonly documentWarning: number;
    readonly attendanceWarning: number;
    readonly yoyAlert: number;
  };
}

interface PreElectionTranslations {
  title: string;
  currentYear: string;
  baseline: string;
  deviation: string;
  ballotActivity: string;
  documentProduction: string;
  attendanceRate: string;
  partyWinRate: string;
  vsBaseline: string;
  yoy: string;
  normal: string;
  reduced: string;
  elevated: string;
  improving: string;
  declining: string;
  stable: string;
  metrics: Record<string, string>;
  status: Record<string, string>;
  chartLabels: Record<string, string>;
}

interface Deviations {
  ballots: number;
  documents: number;
  assignments: number;
  attendance: number;
}

interface EarlyWarning {
  metric: string;
  status: string;
  deviation: number;
}

interface CacheEntry {
  data: CSVRow[];
  timestamp: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG: PreElectionConfig = {
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
  cacheDuration: 24 * 60 * 60 * 1000,
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

// ============================================================================
// TRANSLATIONS (EN/SV - other languages fallback to EN)
// ============================================================================

const TRANSLATIONS: Record<string, PreElectionTranslations> = {
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
    metrics: { ballots: 'Ballots', documents: 'Documents', attendance: 'Attendance', yoyChange: 'YoY Change', winRate: 'Win Rate', absenceRate: 'Absence Rate', proposals: 'Proposals', assignments: 'Assignments' },
    status: { ok: 'OK', warning: 'Warning', alert: 'Alert' },
    chartLabels: { ballots: 'Ballots', documents: 'Documents', attendance: 'Attendance', electionYear: 'Election Year', nonElectionYear: 'Non-Election Year', baseline: 'Baseline' }
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
    metrics: { ballots: 'Omröstningar', documents: 'Dokument', attendance: 'Närvaro', yoyChange: 'ÅfÅ-förändring', winRate: 'Vinstfrekvens', absenceRate: 'Frånvarofrekvens', proposals: 'Förslag', assignments: 'Uppdrag' },
    status: { ok: 'OK', warning: 'Varning', alert: 'Alert' },
    chartLabels: { ballots: 'Omröstningar', documents: 'Dokument', attendance: 'Närvaro', electionYear: 'Valår', nonElectionYear: 'Icke-valår', baseline: 'Baslinje' }
  }
};

// ============================================================================
// DATA MANAGER
// ============================================================================

class PreElectionDataManager {
  preElectionData: CSVRow[] | null = null;
  electionComparisonData: CSVRow[] | null = null;

  async fetchData(): Promise<boolean> {
    try {
      const cachedPreElection = this.loadFromCache('preElection');
      const cachedElectionComparison = this.loadFromCache('electionComparison');

      if (cachedPreElection && cachedElectionComparison) {
        this.preElectionData = cachedPreElection;
        this.electionComparisonData = cachedElectionComparison;
        logger.info('Loaded pre-election data from cache');
        return true;
      }

      const [preElectionCsv, electionComparisonCsv] = await Promise.all([
        this.fetchWithFallback(CONFIG.dataUrls.preElection),
        this.fetchWithFallback(CONFIG.dataUrls.electionComparison)
      ]);

      if (!preElectionCsv || !electionComparisonCsv) {
        throw new Error('Failed to fetch CIA data');
      }

      this.preElectionData = this.parseCSV(preElectionCsv);
      this.electionComparisonData = this.parseCSV(electionComparisonCsv);

      this.saveToCache('preElection', this.preElectionData);
      this.saveToCache('electionComparison', this.electionComparisonData);

      logger.info('Loaded pre-election data from source');
      return true;
    } catch (error) {
      logger.error('Error fetching pre-election data:', error);
      return false;
    }
  }

  async fetchWithFallback(urls: readonly string[]): Promise<string | null> {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const isLocal = !url.startsWith('http');
      try {
        logger.info(`Trying to fetch: ${url}`);
        const response = await fetch(url);
        if (response.ok) {
          const text = await response.text();
          if (text.trim().length > 0 && text.includes(',')) {
            logger.info(`Successfully loaded from ${isLocal ? 'local' : 'remote'}: ${url}`);
            return text;
          }
        }
      } catch (error) {
        logger.error(`Failed to fetch from ${url}:`, error);
      }
    }
    logger.error('All fetch attempts failed for:', urls);
    return null;
  }

  parseCSV(csvText: string): CSVRow[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        if (!isNaN(Number(value)) && value !== '') {
          (row as any)[header] = parseFloat(value);
        } else {
          (row as any)[header] = value;
        }
      });
      data.push(row);
    }
    return data;
  }

  loadFromCache(key: string): CSVRow[] | null {
    try {
      const cached = localStorage.getItem(CONFIG.cachePrefix + key);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached) as CacheEntry;
      const age = Date.now() - timestamp;
      if (age > CONFIG.cacheDuration) { localStorage.removeItem(CONFIG.cachePrefix + key); return null; }
      return data;
    } catch { return null; }
  }

  saveToCache(key: string, data: CSVRow[]): void {
    try { localStorage.setItem(CONFIG.cachePrefix + key, JSON.stringify({ data, timestamp: Date.now() })); }
    catch (e) { logger.error('Cache save error:', e); }
  }

  getLatestYear(): number | null {
    if (!this.preElectionData || this.preElectionData.length === 0) return null;
    return Math.max(...this.preElectionData.map(d => Number(d['year'])));
  }

  getCurrentYearData(year?: number): CSVRow | null {
    if (!this.preElectionData) return null;
    const targetYear = year !== undefined ? year : this.getLatestYear();
    if (!targetYear) return null;
    return this.preElectionData.find(d => Number(d['year']) === targetYear) || null;
  }

  calculateDeviations(currentYear?: number): Deviations | null {
    const data = this.getCurrentYearData(currentYear);
    if (!data) return null;
    return {
      ballots: Number(data['ballot_percent_change_from_baseline']) || 0,
      documents: Number(data['document_percent_change_from_baseline']) || 0,
      assignments: ((Number(data['total_new_assignments']) - Number(data['baseline_assignments'])) / (Number(data['baseline_assignments']) || 1) * 100) || 0,
      attendance: ((Number(data['avg_attendance_rate']) - Number(data['baseline_attendance'])) / (Number(data['baseline_attendance']) || 1) * 100) || 0
    };
  }

  classifyActivityLevel(deviation: number): string {
    if (deviation < -50) return 'SEVERELY_REDUCED';
    if (deviation < -30) return 'REDUCED_ACTIVITY';
    if (deviation > 50) return 'UNUSUALLY_HIGH_ACTIVITY';
    if (deviation > 20) return 'ELEVATED_ACTIVITY';
    return 'NORMAL_ACTIVITY';
  }

  generateEarlyWarnings(): EarlyWarning[] {
    const data = this.getCurrentYearData();
    if (!data) return [];
    const deviations = this.calculateDeviations();
    if (!deviations) return [];
    const warnings: EarlyWarning[] = [];

    if (deviations.ballots < CONFIG.thresholds.ballotAlert) {
      warnings.push({ metric: 'ballots', status: 'alert', deviation: deviations.ballots });
    } else if (deviations.ballots < CONFIG.thresholds.ballotWarning) {
      warnings.push({ metric: 'ballots', status: 'warning', deviation: deviations.ballots });
    } else {
      warnings.push({ metric: 'ballots', status: 'ok', deviation: deviations.ballots });
    }

    if (Math.abs(deviations.documents) > CONFIG.thresholds.documentWarning) {
      warnings.push({ metric: 'documents', status: 'warning', deviation: deviations.documents });
    } else {
      warnings.push({ metric: 'documents', status: 'ok', deviation: deviations.documents });
    }

    if (deviations.attendance < CONFIG.thresholds.attendanceWarning) {
      warnings.push({ metric: 'attendance', status: 'warning', deviation: deviations.attendance });
    } else {
      warnings.push({ metric: 'attendance', status: 'ok', deviation: deviations.attendance });
    }

    const yoyDeviation = Number(data['yoy_ballot_change_pct']) || 0;
    if (Math.abs(yoyDeviation) > CONFIG.thresholds.yoyAlert) {
      warnings.push({ metric: 'yoyChange', status: 'alert', deviation: yoyDeviation });
    } else {
      warnings.push({ metric: 'yoyChange', status: 'ok', deviation: yoyDeviation });
    }

    return warnings;
  }
}

// ============================================================================
// CHART RENDERER
// ============================================================================

class PreElectionCharts {
  private dataManager: PreElectionDataManager;
  private t: PreElectionTranslations;

  constructor(dataManager: PreElectionDataManager) {
    this.dataManager = dataManager;
    const lang = detectLanguage();
    this.t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  }

  renderQ4Timeline(): void {
    const ctx = document.getElementById('q4-timeline-chart') as HTMLCanvasElement | null;
    if (!ctx) return;
    const data = this.dataManager.preElectionData;
    if (!data || data.length === 0) return;
    const sorted = [...data].sort((a, b) => Number(a['year']) - Number(b['year']));
    const t = this.t;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: sorted.map(d => d['year']),
        datasets: [
          { label: t.metrics['ballots'], data: sorted.map(d => d['total_ballots']), borderColor: CONFIG.chartColors.ballots, backgroundColor: CONFIG.chartColors.ballots + '33', yAxisID: 'y1', tension: 0.3 },
          { label: t.metrics['documents'], data: sorted.map(d => d['total_documents']), borderColor: CONFIG.chartColors.documents, backgroundColor: CONFIG.chartColors.documents + '33', yAxisID: 'y2', tension: 0.3 },
          { label: t.baseline + ' (Ballots)', data: sorted.map(d => d['baseline_ballots']), borderColor: CONFIG.chartColors.baseline, borderDash: [5, 5], pointRadius: 0, yAxisID: 'y1', fill: false },
          { label: t.baseline + ' (Documents)', data: sorted.map(d => d['baseline_documents']), borderColor: CONFIG.chartColors.baseline, borderDash: [5, 5], pointRadius: 0, yAxisID: 'y2', fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top', labels: { color: '#e0e0e0' } }, tooltip: { callbacks: { label: (context: any) => { let label = context.dataset.label || ''; if (label) label += ': '; label += context.parsed.y.toLocaleString(); return label; } } } },
        scales: {
          y1: { type: 'linear', position: 'left', title: { display: true, text: t.chartLabels['ballots'], color: CONFIG.chartColors.ballots }, ticks: { color: '#e0e0e0' }, grid: { color: '#ffffff22' } },
          y2: { type: 'linear', position: 'right', title: { display: true, text: t.chartLabels['documents'], color: CONFIG.chartColors.documents }, ticks: { color: '#e0e0e0' }, grid: { drawOnChartArea: false } },
          x: { ticks: { color: '#e0e0e0' }, grid: { color: '#ffffff22' } }
        }
      }
    });
  }

  renderElectionComparison(): void {
    const ctx = document.getElementById('election-comparison-chart') as HTMLCanvasElement | null;
    if (!ctx) return;
    const data = this.dataManager.electionComparisonData;
    if (!data || data.length === 0) return;
    const sorted = [...data].sort((a, b) => Number(a['year']) - Number(b['year']));
    const t = this.t;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(d => d['year']),
        datasets: [
          { label: t.chartLabels['electionYear'], data: sorted.map(d => (d['is_election_year'] === 't' || d['is_election_year'] === 'true') ? d['total_ballots'] : null), backgroundColor: CONFIG.chartColors.election + '99', borderColor: CONFIG.chartColors.election, borderWidth: 1 },
          { label: t.chartLabels['nonElectionYear'], data: sorted.map(d => (d['is_election_year'] === 'f' || d['is_election_year'] === 'false') ? d['total_ballots'] : null), backgroundColor: CONFIG.chartColors.nonElection + '99', borderColor: CONFIG.chartColors.nonElection, borderWidth: 1 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { color: '#e0e0e0' } }, tooltip: { callbacks: { label: (context: any) => context.dataset.label + ': ' + (context.parsed.y || 0).toLocaleString() + ' ' + t.chartLabels['ballots'].toLowerCase() } } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Total Ballots', color: '#e0e0e0' }, ticks: { color: '#e0e0e0' }, grid: { color: '#ffffff22' } }, x: { ticks: { color: '#e0e0e0', maxRotation: 45, minRotation: 45 }, grid: { color: '#ffffff22' } } }
      }
    });
  }

  renderDeviationRadar(): void {
    const ctx = document.getElementById('deviation-radar-chart') as HTMLCanvasElement | null;
    if (!ctx) return;
    const latestYear = this.dataManager.getLatestYear();
    const data = this.dataManager.getCurrentYearData(latestYear ?? undefined);
    if (!data) return;
    const t = this.t;

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [t.metrics['ballots'], t.metrics['documents'], t.metrics['assignments'], t.metrics['attendance'], t.metrics['winRate'], t.metrics['absenceRate']],
        datasets: [
          { label: `${latestYear} Q4`, data: [Number(data['total_ballots']) / 100, Number(data['total_documents']) / 100, Number(data['total_new_assignments']), Number(data['avg_attendance_rate']), Number(data['avg_party_win_rate']), Number(data['avg_party_absence_rate'])], borderColor: CONFIG.chartColors.ballots, backgroundColor: CONFIG.chartColors.ballots + '33', pointBackgroundColor: CONFIG.chartColors.ballots },
          { label: t.baseline, data: [Number(data['baseline_ballots']) / 100, Number(data['baseline_documents']) / 100, Number(data['baseline_assignments']), Number(data['baseline_attendance']) || 85, Number(data['baseline_party_win_rate']) || 56, Number(data['baseline_party_absence_rate']) || 15], borderColor: CONFIG.chartColors.baseline, backgroundColor: CONFIG.chartColors.baseline + '22', borderDash: [5, 5], pointBackgroundColor: CONFIG.chartColors.baseline }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { color: '#e0e0e0' } } },
        scales: { r: { angleLines: { color: '#ffffff22' }, grid: { color: '#ffffff22' }, pointLabels: { color: '#e0e0e0' }, ticks: { color: '#e0e0e0', backdropColor: 'transparent' } } }
      }
    });
  }

  renderPartyTrends(): void {
    const ctx = document.getElementById('party-trends-chart') as HTMLCanvasElement | null;
    if (!ctx) return;
    const data = this.dataManager.preElectionData;
    if (!data || data.length === 0) return;
    const sorted = [...data].sort((a, b) => Number(a['year']) - Number(b['year']));

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: sorted.map(d => d['year']),
        datasets: [
          { label: 'Party Win Rate (%)', data: sorted.map(d => d['avg_party_win_rate']), borderColor: CONFIG.chartColors.normal, backgroundColor: CONFIG.chartColors.normal + '33', tension: 0.3, yAxisID: 'y' },
          { label: 'Party Absence Rate (%)', data: sorted.map(d => d['avg_party_absence_rate']), borderColor: CONFIG.chartColors.alert, backgroundColor: CONFIG.chartColors.alert + '33', tension: 0.3, yAxisID: 'y' },
          { label: 'Party Documents (÷100)', data: sorted.map(d => (Number(d['party_documents_total']) || 0) / 100), borderColor: CONFIG.chartColors.documents, backgroundColor: CONFIG.chartColors.documents + '33', tension: 0.3, yAxisID: 'y2' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top', labels: { color: '#e0e0e0' } } },
        scales: {
          y: { type: 'linear', position: 'left', title: { display: true, text: 'Percentage (%)', color: '#e0e0e0' }, ticks: { color: '#e0e0e0' }, grid: { color: '#ffffff22' } },
          y2: { type: 'linear', position: 'right', title: { display: true, text: 'Documents (÷100)', color: '#e0e0e0' }, ticks: { color: '#e0e0e0' }, grid: { drawOnChartArea: false } },
          x: { ticks: { color: '#e0e0e0' }, grid: { color: '#ffffff22' } }
        }
      }
    });
  }

  renderYoYWaterfall(): void {
    const ctx = document.getElementById('yoy-waterfall-chart') as HTMLCanvasElement | null;
    if (!ctx) return;
    const data = this.dataManager.preElectionData;
    if (!data || data.length === 0) return;
    const sorted = [...data].sort((a, b) => Number(a['year']) - Number(b['year']));

    const years = sorted.map(d => d['year']);
    const values = sorted.map(d => Number(d['total_ballots']));
    const labels: string[] = [];
    const changes: number[] = [];

    for (let i = 0; i < values.length; i++) {
      if (i === 0) { labels.push(String(years[0])); changes.push(values[0]); }
      else { labels.push(String(years[i]) + ' Change'); changes.push(values[i] - values[i - 1]); }
    }

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Ballot Activity', data: changes, backgroundColor: changes.map((v, i) => i === 0 ? CONFIG.chartColors.ballots : v > 0 ? CONFIG.chartColors.normal : CONFIG.chartColors.alert), borderColor: changes.map((v, i) => i === 0 ? CONFIG.chartColors.ballots : v > 0 ? CONFIG.chartColors.normal : CONFIG.chartColors.alert), borderWidth: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context: any) => { const value = context.parsed.y; const label = context.label; if (label.includes('Change')) return (value > 0 ? '+' : '') + value.toLocaleString() + ' ballots'; return value.toLocaleString() + ' ballots'; } } } },
        scales: { y: { title: { display: true, text: 'Ballots', color: '#e0e0e0' }, ticks: { color: '#e0e0e0' }, grid: { color: '#ffffff22' } }, x: { ticks: { color: '#e0e0e0' }, grid: { color: '#ffffff22' } } }
      }
    });
  }

  renderWarningMatrix(): void {
    const container = document.getElementById('warning-matrix');
    if (!container) return;
    const warnings = this.dataManager.generateEarlyWarnings();
    const t = this.t;

    container.textContent = '';
    warnings.forEach(w => {
      const statusIcon = w.status === 'ok' ? '🟢' : w.status === 'warning' ? '🟡' : '🔴';
      const statusClass = w.status === 'ok' ? 'normal' : w.status === 'warning' ? 'warning' : 'alert';
      const statusLabel = t.status[w.status] || w.status.toUpperCase();
      const metricLabel = t.metrics[w.metric] || w.metric;
      const deviationText = (w.deviation > 0 ? '+' : '') + w.deviation.toFixed(1) + '%';

      const cell = document.createElement('div');
      cell.classList.add('warning-cell', statusClass);

      const statusIconEl = document.createElement('div');
      statusIconEl.classList.add('status-icon');
      statusIconEl.setAttribute('role', 'img');
      statusIconEl.setAttribute('aria-label', statusLabel);
      statusIconEl.textContent = statusIcon;

      const metricNameEl = document.createElement('div');
      metricNameEl.classList.add('metric-name');
      metricNameEl.textContent = metricLabel;

      const deviationValueEl = document.createElement('div');
      deviationValueEl.classList.add('deviation-value');
      deviationValueEl.textContent = deviationText;

      cell.appendChild(statusIconEl);
      cell.appendChild(metricNameEl);
      cell.appendChild(deviationValueEl);
      container.appendChild(cell);
    });
  }

  renderAllCharts(): void {
    this.renderQ4Timeline();
    this.renderElectionComparison();
    this.renderDeviationRadar();
    this.renderPartyTrends();
    this.renderYoYWaterfall();
    this.renderWarningMatrix();
  }
}

// ============================================================================
// STATUS CARD UPDATER
// ============================================================================

function updateStatusCards(dataManager: PreElectionDataManager): void {
  const lang = detectLanguage();
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const latestYear = dataManager.getLatestYear();
  const data = dataManager.getCurrentYearData(latestYear ?? undefined);
  if (!data) return;
  const deviations = dataManager.calculateDeviations(latestYear ?? undefined);
  if (!deviations) return;

  // Ballot activity
  const ballotCard = document.querySelector('.status-card[data-metric="ballots"]');
  if (ballotCard) {
    const currentValue = ballotCard.querySelector('.current-value');
    if (currentValue) currentValue.textContent = Number(data['total_ballots']).toLocaleString();
    const baselineComparison = ballotCard.querySelector('.baseline-comparison');
    if (baselineComparison) baselineComparison.textContent = (deviations.ballots > 0 ? '+' : '') + deviations.ballots.toFixed(2) + '% ' + t.vsBaseline;
    const badge = ballotCard.querySelector('.status-badge');
    if (badge) {
      if (deviations.ballots < -30) { badge.textContent = t.reduced; badge.className = 'status-badge alert'; }
      else if (deviations.ballots > 20) { badge.textContent = t.elevated; badge.className = 'status-badge improving'; }
      else { badge.textContent = t.normal; badge.className = 'status-badge normal'; }
    }
  }

  // Document production
  const docCard = document.querySelector('.status-card[data-metric="documents"]');
  if (docCard) {
    const currentValue = docCard.querySelector('.current-value');
    if (currentValue) currentValue.textContent = Number(data['total_documents']).toLocaleString();
    const baselineComparison = docCard.querySelector('.baseline-comparison');
    if (baselineComparison) baselineComparison.textContent = (deviations.documents > 0 ? '+' : '') + deviations.documents.toFixed(2) + '% ' + t.vsBaseline;
    const badge = docCard.querySelector('.status-badge');
    if (badge) { badge.textContent = t.normal; badge.className = 'status-badge normal'; }
  }

  // Attendance rate
  const attendanceCard = document.querySelector('.status-card[data-metric="attendance"]');
  if (attendanceCard) {
    const currentValue = attendanceCard.querySelector('.current-value');
    if (currentValue) currentValue.textContent = Number(data['avg_attendance_rate']).toFixed(2) + '%';
    const baselineComparison = attendanceCard.querySelector('.baseline-comparison');
    if (baselineComparison) baselineComparison.textContent = (deviations.attendance > 0 ? '+' : '') + deviations.attendance.toFixed(2) + '% ' + t.vsBaseline;
    const badge = attendanceCard.querySelector('.status-badge');
    if (badge) { badge.textContent = t.stable; badge.className = 'status-badge normal'; }
  }

  // Party performance
  const partyCard = document.querySelector('.status-card[data-metric="party-performance"]');
  if (partyCard) {
    const currentValue = partyCard.querySelector('.current-value');
    if (currentValue) currentValue.textContent = Number(data['avg_party_win_rate']).toFixed(2) + '%';

    const availableYears = Array.from(new Set(dataManager.preElectionData!.map(d => Number(d['year'])))).sort((a, b) => a - b);
    const latestYearIndex = availableYears.indexOf(latestYear!);
    const prevYearValue = latestYearIndex > 0 ? availableYears[latestYearIndex - 1] : null;
    const prevYear = prevYearValue !== null ? dataManager.preElectionData!.find(d => Number(d['year']) === prevYearValue) : null;
    const yoyChange = (prevYear && prevYear['avg_party_win_rate']) ? ((Number(data['avg_party_win_rate']) - Number(prevYear['avg_party_win_rate'])) / (Number(prevYear['avg_party_win_rate']) || 1) * 100) : 0;

    const baselineComparison = partyCard.querySelector('.baseline-comparison');
    if (baselineComparison) baselineComparison.textContent = (yoyChange > 0 ? '+' : '') + yoyChange.toFixed(2) + '% ' + t.yoy;
    const badge = partyCard.querySelector('.status-badge');
    if (badge) {
      if (yoyChange > 0) { badge.textContent = t.improving; badge.className = 'status-badge improving'; }
      else { badge.textContent = t.declining; badge.className = 'status-badge warning'; }
    }
  }
}

// ============================================================================
// EXPORTED INIT
// ============================================================================

export { PreElectionDataManager, PreElectionCharts };

export async function init(): Promise<void> {
  const dashboard = document.getElementById('pre-election-dashboard');
  if (!dashboard) return;

  logger.info('Initializing Pre-Election Monitoring Dashboard...');
  dashboard.classList.add('loading');

  const dataManager = new PreElectionDataManager();
  const success = await dataManager.fetchData();

  if (!success) {
    logger.error('Failed to load pre-election data');
    dashboard.innerHTML = '<p class="error">Failed to load dashboard data. Please try again later.</p>';
    return;
  }

  updateStatusCards(dataManager);
  const chartRenderer = new PreElectionCharts(dataManager);
  chartRenderer.renderAllCharts();
  dashboard.classList.remove('loading');
  logger.info('Pre-Election Monitoring Dashboard initialized successfully');
}
