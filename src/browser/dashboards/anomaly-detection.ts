/**
 * @module Dashboards/AnomalyDetection
 * @category Intelligence Analysis - Statistical Outlier Detection & Early Warning
 *
 * Anomaly Detection & Early Warning Intelligence Dashboard.
 *
 * Advanced statistical intelligence module implementing Z-score analysis for
 * behavioral anomaly detection across Swedish Parliament activity (2002-2025).
 * Provides real-time early warning capability for unusual patterns in voting,
 * document production, and attendance metrics.
 *
 * ## Intelligence Methodology
 *
 * - Detection Threshold: |Z| >= 2.0 (2 standard deviations)
 * - Severity Classification: CRITICAL (>3σ), HIGH (2-3σ), MODERATE (1-2σ), LOW (<1σ)
 * - Direction Detection: UNUSUALLY_HIGH, UNUSUALLY_LOW, WITHIN_NORMAL_RANGE
 * - Temporal Coverage: 23 years × 4 quarters = 92 time periods
 *
 * ## Data Source
 *
 * - `view_riksdagen_seasonal_anomaly_detection_sample.csv`
 *
 * @author Hack23 AB - Political Intelligence Team
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024
 * @see {@link https://github.com/Hack23/cia|CIA Platform Data Pipeline}

 *
 * @intelligence Statistical Outlier Detection & Early Warning System — advanced Z-score analysis (threshold |Z| >= 2.0) for behavioral anomaly detection across 23 years × 4 quarters = 92 time periods of Swedish Parliament activity. Severity classification: CRITICAL (>3σ), HIGH (2-3σ), MODERATE (1-2σ). Direction detection: UNUSUALLY_HIGH, UNUSUALLY_LOW, WITHIN_NORMAL_RANGE.
 *
 * @business Algorithmic intelligence differentiator — statistical anomaly detection represents the most technically sophisticated product capability. Demonstrates platform as an AI/ML-adjacent intelligence tool. Highest perceived value for enterprise and institutional clients. Foundation for automated anomaly alerting subscription.
 *
 * @marketing Alert-driven content generation — each detected anomaly is an automatically generated content opportunity: push notifications, email alerts, social media posts, and newsletter items. Anomaly alerts create FOMO (fear of missing out) driving subscription growth and daily active usage.
 * */

import {
  logger,
  detectLanguage,
  showDataSourceDisclaimer,
} from '../shared/index.js';

import type { CSVRow, DataSourceType } from '../shared/index.js';

const d3 = (globalThis as any).d3;
const Chart = (globalThis as any).Chart;

// ============================================================================
// INTERFACES
// ============================================================================

interface AnomalyConfig {
  readonly dataUrls: readonly string[];
  readonly cacheKey: string;
  readonly cacheDuration: number;
  readonly alertDismissKey: string;
  readonly alertDismissDuration: number;
}

interface AlertConfigEntry {
  readonly color: string;
  readonly icon: string;
  readonly notify: boolean;
}

interface AnomalyStats {
  total: number;
  anomalyCount: number;
  anomalyRate: string;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  ballotAnomalies: number;
  documentAnomalies: number;
  attendanceAnomalies: number;
  avgZScore: string;
}

interface QuarterCounts {
  critical: number;
  high: number;
  moderate: number;
  total: number;
}

/** Chart translation strings (full locale). */
interface AnomalyTranslationsFull {
  title: string;
  severityLabel: string;
  typeLabel: string;
  directionLabel: string;
  yearLabel: string;
  allSeverities: string;
  allTypes: string;
  allDirections: string;
  allYears: string;
  severity: Record<string, string>;
  type: Record<string, string>;
  direction: Record<string, string>;
  alertPrefix: string;
  dismissAlert: string;
  loading: string;
  error: string;
  noData: string;
  chartTitles: Record<string, string>;
  chartDescriptions: Record<string, string>;
  quarters: Record<string, string>;
}

/** Minimal translation for non-EN/SV locales. */
interface AnomalyTranslationsMinimal {
  title: string;
  severity: Record<string, string>;
}

type AnomalyTranslations = AnomalyTranslationsFull | AnomalyTranslationsMinimal;

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG: AnomalyConfig = {
  dataUrls: [
    'cia-data/seasonal/view_riksdagen_seasonal_anomaly_detection_sample.csv',
    'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_anomaly_detection_sample.csv',
  ],
  cacheKey: 'riksdag_anomaly_detection',
  cacheDuration: 60 * 60 * 1000,
  alertDismissKey: 'anomaly_alert_dismissed',
  alertDismissDuration: 24 * 60 * 60 * 1000,
};

const ALERT_CONFIG: Record<string, AlertConfigEntry> = {
  CRITICAL: { color: '#d32f2f', icon: '🔴', notify: true },
  HIGH: { color: '#f57c00', icon: '🟠', notify: true },
  MODERATE: { color: '#fbc02d', icon: '🟡', notify: false },
  LOW: { color: '#388e3c', icon: '🟢', notify: false },
};

// ============================================================================
// TRANSLATIONS
// ============================================================================

const TRANSLATIONS: Record<string, AnomalyTranslations> = {
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
    severity: { CRITICAL: 'Critical', HIGH: 'High', MODERATE: 'Moderate', LOW: 'Low' },
    type: {
      BALLOT_ANOMALY: 'Ballot Anomaly',
      DOCUMENT_ANOMALY: 'Document Anomaly',
      ATTENDANCE_ANOMALY: 'Attendance Anomaly',
      NO_ANOMALY: 'No Anomaly',
    },
    direction: {
      UNUSUALLY_HIGH: 'Unusually High',
      UNUSUALLY_LOW: 'Unusually Low',
      WITHIN_NORMAL_RANGE: 'Within Normal Range',
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
      recent: 'Recent Anomalies (Last 5)',
    },
    chartDescriptions: {
      timeline: 'Chronological view of detected anomalies with severity coding',
      distribution: 'Normal curve with outlier markers (|Z| ≥ 2.0)',
      typeBreakdown: 'Ballot vs. Document anomaly distribution',
      heatmap: 'Grid showing anomaly severity by year and quarter',
      quarterly: 'Q1-Q4 anomaly counts across all years',
      recent: 'Most recent anomalies with details',
    },
    quarters: {
      Q1: 'Q1 (Jan-Mar)',
      Q2: 'Q2 (Apr-Jun)',
      Q3: 'Q3 (Jul-Sep)',
      Q4: 'Q4 (Oct-Dec)',
    },
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
    severity: { CRITICAL: 'Kritisk', HIGH: 'Hög', MODERATE: 'Måttlig', LOW: 'Låg' },
    type: {
      BALLOT_ANOMALY: 'Omröstningsanomali',
      DOCUMENT_ANOMALY: 'Dokumentanomali',
      ATTENDANCE_ANOMALY: 'Närvaroanomali',
      NO_ANOMALY: 'Ingen anomali',
    },
    direction: {
      UNUSUALLY_HIGH: 'Ovanligt hög',
      UNUSUALLY_LOW: 'Ovanligt låg',
      WITHIN_NORMAL_RANGE: 'Inom normalintervall',
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
      recent: 'Senaste anomalierna (Senaste 5)',
    },
    chartDescriptions: {
      timeline: 'Kronologisk vy av upptäckta anomalier med allvarlighetskodning',
      distribution: 'Normalkurva med utliggare (|Z| ≥ 2.0)',
      typeBreakdown: 'Omröstnings- vs. dokumentanomalier',
      heatmap: 'Rutnät som visar anomalins allvarlighetsgrad per år och kvartal',
      quarterly: 'Q1-Q4 anomaliräkning över alla år',
      recent: 'Senaste anomalier med detaljer',
    },
    quarters: {
      Q1: 'Q1 (Jan-Mar)',
      Q2: 'Q2 (Apr-Jun)',
      Q3: 'Q3 (Jul-Sep)',
      Q4: 'Q4 (Okt-Dec)',
    },
  },
  da: { title: 'Anomalidetektering og Tidlig Advarsel', severity: { CRITICAL: 'Kritisk', HIGH: 'Høj', MODERATE: 'Moderat', LOW: 'Lav' } },
  no: { title: 'Anomalideteksjon og Tidlig Varsel', severity: { CRITICAL: 'Kritisk', HIGH: 'Høy', MODERATE: 'Moderat', LOW: 'Lav' } },
  fi: { title: 'Poikkeavuuksien havaitseminen ja varhainen varoitus', severity: { CRITICAL: 'Kriittinen', HIGH: 'Korkea', MODERATE: 'Kohtalainen', LOW: 'Matala' } },
  de: { title: 'Anomalieerkennung und Frühwarnsystem', severity: { CRITICAL: 'Kritisch', HIGH: 'Hoch', MODERATE: 'Mäßig', LOW: 'Niedrig' } },
  fr: { title: "Détection d'anomalies et alerte précoce", severity: { CRITICAL: 'Critique', HIGH: 'Élevé', MODERATE: 'Modéré', LOW: 'Faible' } },
  es: { title: 'Detección de anomalías y alerta temprana', severity: { CRITICAL: 'Crítico', HIGH: 'Alto', MODERATE: 'Moderado', LOW: 'Bajo' } },
  nl: { title: 'Anomaliedetectie en vroegtijdige waarschuwing', severity: { CRITICAL: 'Kritiek', HIGH: 'Hoog', MODERATE: 'Gematigd', LOW: 'Laag' } },
  ar: { title: 'اكتشاف الشذوذ والإنذار المبكر', severity: { CRITICAL: 'حرج', HIGH: 'عالي', MODERATE: 'معتدل', LOW: 'منخفض' } },
  he: { title: 'זיהוי חריגות והתרעה מוקדמת', severity: { CRITICAL: 'קריטי', HIGH: 'גבוה', MODERATE: 'בינוני', LOW: 'נמוך' } },
  ja: { title: '異常検知と早期警告', severity: { CRITICAL: '重大', HIGH: '高', MODERATE: '中', LOW: '低' } },
  ko: { title: '이상 탐지 및 조기 경보', severity: { CRITICAL: '치명적', HIGH: '높음', MODERATE: '보통', LOW: '낮음' } },
  zh: { title: '异常检测与预警', severity: { CRITICAL: '严重', HIGH: '高', MODERATE: '中等', LOW: '低' } },
};

// ============================================================================
// HELPERS
// ============================================================================

function getTranslations(): AnomalyTranslationsFull {
  const lang = detectLanguage();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  // Merge minimal translations over the English defaults
  if (!('loading' in t)) {
    return { ...(TRANSLATIONS.en as AnomalyTranslationsFull), ...t };
  }
  return t as AnomalyTranslationsFull;
}

/**
 * Generate synthetic fallback data when all CSV sources are unavailable.
 * Ensures charts render with representative sample data rather than showing
 * an error state, consistent with how other dashboards handle data failures.
 */
function generateFallbackData(): CSVRow[] {
  const data: CSVRow[] = [];
  const quarterLabels = ['Q1_JAN_MAR', 'Q2_APR_JUN', 'Q3_JUL_SEP', 'Q4_OCT_DEC'];
  const periods = ['Winter Session', 'Spring Session', 'Summer Recess/Election', 'Autumn Session'];

  for (let year = 2018; year <= 2025; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      // Deterministic, bounded z-scores to avoid random HIGH/CRITICAL anomalies in fallback data
      const ballotZRaw = (((year * 31 + quarter * 17) % 300) / 100) - 1.5;
      const docZRaw = (((year * 19 + quarter * 23) % 300) / 100) - 1.5;
      const ballotZ = ballotZRaw.toFixed(4);
      const docZ = docZRaw.toFixed(4);
      const absBallotZ = Math.abs(ballotZRaw);
      const absDocZ = Math.abs(docZRaw);
      const maxZ = Math.max(absBallotZ, absDocZ);
      let severity = 'LOW';
      let anomalyType = 'NO_ANOMALY';
      let direction = 'WITHIN_NORMAL_RANGE';
      const dominantZ = absBallotZ >= absDocZ ? ballotZRaw : docZRaw;

      if (maxZ >= 3.0) { severity = 'CRITICAL'; anomalyType = absBallotZ >= absDocZ ? 'BALLOT_ANOMALY' : 'DOCUMENT_ANOMALY'; direction = dominantZ > 0 ? 'UNUSUALLY_HIGH' : 'UNUSUALLY_LOW'; }
      else if (maxZ >= 2.0) { severity = 'HIGH'; anomalyType = absBallotZ >= absDocZ ? 'BALLOT_ANOMALY' : 'DOCUMENT_ANOMALY'; direction = dominantZ > 0 ? 'UNUSUALLY_HIGH' : 'UNUSUALLY_LOW'; }
      else if (maxZ >= 1.0) { severity = 'MODERATE'; }

      data.push({
        year: String(year),
        quarter: String(quarter),
        is_election_year: (year === 2022) ? 't' : 'f',
        // Deterministic synthetic counts for reproducible fallback data
        total_ballots: String(100 + ((year * 13 + quarter * 7) % 200)),
        active_politicians: '349',
        attendance_rate: '100.00',
        documents_produced: String(200 + ((year * 29 + quarter * 11) % 500)),
        q_baseline_ballots: '150.00',
        q_stddev_ballots: '40.00',
        ballot_z_score: ballotZ,
        q_baseline_docs: '300.00',
        q_stddev_docs: '100.00',
        doc_z_score: docZ,
        q_baseline_attendance: '100.00',
        q_stddev_attendance: '0',
        attendance_z_score: '0',
        activity_classification: maxZ >= 2 ? 'ANOMALY_DETECTED' : 'NORMAL_ACTIVITY',
        quarter_label: quarterLabels[quarter - 1],
        parliamentary_period: periods[quarter - 1],
        anomaly_type: anomalyType,
        anomaly_direction: direction,
        max_z_score: maxZ.toFixed(4),
        anomaly_severity: severity,
      });
    }
  }

  data.sort((a, b) => {
    const yearDiff = parseInt(b.year as string, 10) - parseInt(a.year as string, 10);
    if (yearDiff !== 0) return yearDiff;
    return parseInt(b.quarter as string, 10) - parseInt(a.quarter as string, 10);
  });

  return data;
}

// ============================================================================
// DATA MANAGER
// ============================================================================

class AnomalyDetectionDataManager {
  data: CSVRow[] | null = null;
  dataSourceType: DataSourceType = 'live';
  private readonly language: string;

  constructor() {
    this.language = detectLanguage();
  }

  getTranslations(): AnomalyTranslationsFull {
    return getTranslations();
  }

  async fetchData(): Promise<CSVRow[]> {
    // Check cache first
    const cached = this.getCachedData();
    if (cached) {
      logger.debug('Using cached anomaly data');
      this.data = cached;
      return cached;
    }

    logger.debug('Fetching fresh anomaly data from CIA...');
    let response: Response | null = null;
    let lastError: Error | null = null;

    for (const url of CONFIG.dataUrls) {
      try {
        logger.debug(`Attempting to fetch from: ${url}`);
        response = await fetch(url);
        if (response.ok) {
          logger.debug(`✓ Successfully fetched from: ${url}`);
          break;
        } else {
          logger.warn(`⚠ Failed to fetch from ${url}: HTTP ${response.status}`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          response = null;
        }
      } catch (error) {
        logger.warn(`⚠ Error fetching from ${url}:`, (error as Error).message);
        lastError = error as Error;
        response = null;
      }
    }

    if (!response) {
      logger.warn('All data sources failed, using synthetic fallback data');
      const fallback = generateFallbackData();
      this.data = fallback;
      this.dataSourceType = 'synthetic';
      return fallback;
    }

    const csvText = await response.text();
    const parsedData = this.parseCSV(csvText);
    this.setCachedData(parsedData);
    this.data = parsedData;

    logger.debug(`Loaded ${parsedData.length} anomaly records`);
    return parsedData;
  }

  parseCSV(csvText: string): CSVRow[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());
    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const record: CSVRow = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        data.push(record);
      }
    }

    data.sort((a, b) => {
      const yearDiff = parseInt(b.year as string, 10) - parseInt(a.year as string, 10);
      if (yearDiff !== 0) return yearDiff;
      return parseInt(b.quarter as string, 10) - parseInt(a.quarter as string, 10);
    });

    return data;
  }

  parseCSVLine(line: string): string[] {
    const values: string[] = [];
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

  getCachedData(): CSVRow[] | null {
    try {
      const cached = localStorage.getItem(CONFIG.cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      if (age < CONFIG.cacheDuration) return data;

      localStorage.removeItem(CONFIG.cacheKey);
      return null;
    } catch {
      return null;
    }
  }

  setCachedData(data: CSVRow[]): void {
    try {
      localStorage.setItem(
        CONFIG.cacheKey,
        JSON.stringify({ data, timestamp: Date.now() }),
      );
    } catch (error) {
      logger.error('Error setting cache:', error);
    }
  }

  identifyActiveAnomalies(): CSVRow[] {
    if (!this.data) return [];
    return this.data
      .filter((record) => record.anomaly_type !== 'NO_ANOMALY')
      .sort(
        (a, b) =>
          Math.abs(parseFloat(b.max_z_score as string)) -
          Math.abs(parseFloat(a.max_z_score as string)),
      );
  }

  calculateAnomalyStats(): AnomalyStats | null {
    if (!this.data) return null;

    const anomalies = this.identifyActiveAnomalies();
    const total = this.data.length;
    const anomalyCount = anomalies.length;

    const criticalCount = anomalies.filter((a) => a.anomaly_severity === 'CRITICAL').length;
    const highCount = anomalies.filter((a) => a.anomaly_severity === 'HIGH').length;
    const moderateCount = anomalies.filter((a) => a.anomaly_severity === 'MODERATE').length;

    const ballotAnomalies = anomalies.filter((a) => a.anomaly_type === 'BALLOT_ANOMALY').length;
    const documentAnomalies = anomalies.filter((a) => a.anomaly_type === 'DOCUMENT_ANOMALY').length;
    const attendanceAnomalies = anomalies.filter((a) => a.anomaly_type === 'ATTENDANCE_ANOMALY').length;

    const avgZScore =
      anomalies.length > 0
        ? anomalies.reduce((sum, a) => sum + Math.abs(parseFloat(a.max_z_score as string)), 0) /
          anomalies.length
        : 0;

    return {
      total,
      anomalyCount,
      anomalyRate: ((anomalyCount / total) * 100).toFixed(1),
      criticalCount,
      highCount,
      moderateCount,
      ballotAnomalies,
      documentAnomalies,
      attendanceAnomalies,
      avgZScore: avgZScore.toFixed(2),
    };
  }

  checkForCriticalAnomalies(): CSVRow | null {
    if (!this.data || this.data.length === 0) return null;

    const recentQuarters = this.data.slice(0, 2);
    const criticalAnomalies = recentQuarters.filter(
      (record) =>
        record.anomaly_severity === 'CRITICAL' || record.anomaly_severity === 'HIGH',
    );
    return criticalAnomalies.length > 0 ? criticalAnomalies[0] : null;
  }
}

// ============================================================================
// ALERT SYSTEM
// ============================================================================

class AnomalyAlertSystem {
  private readonly dataManager: AnomalyDetectionDataManager;
  private readonly translations: AnomalyTranslationsFull;

  constructor(dataManager: AnomalyDetectionDataManager) {
    this.dataManager = dataManager;
    this.translations = dataManager.getTranslations();
  }

  checkAndDisplayAlert(anomaly: CSVRow): void {
    if (!anomaly) return;

    const dismissedTimestamp = localStorage.getItem(CONFIG.alertDismissKey);
    if (dismissedTimestamp) {
      const age = Date.now() - parseInt(dismissedTimestamp, 10);
      if (age < CONFIG.alertDismissDuration) {
        logger.debug('Alert was recently dismissed, not showing');
        return;
      }
    }

    const banner = document.getElementById('anomaly-alert-banner');
    const message = document.getElementById('alert-message');

    if (banner && message) {
      const alertText = this.generateAlertMessage(anomaly);
      message.textContent = alertText;

      const severity = (anomaly.anomaly_severity as string).toLowerCase();
      banner.className = `alert-banner ${severity}`;
      banner.classList.remove('hidden');

      const dismissBtn = banner.querySelector('.dismiss-alert');
      if (dismissBtn) {
        (dismissBtn as HTMLElement).onclick = () => this.dismissAlert();
      }
    }
  }

  dismissAlert(): void {
    const banner = document.getElementById('anomaly-alert-banner');
    if (banner) {
      banner.classList.add('hidden');
      localStorage.setItem(CONFIG.alertDismissKey, Date.now().toString());
    }
  }

  generateAlertMessage(anomaly: CSVRow): string {
    const year = anomaly.year as string;
    const quarter = `Q${anomaly.quarter}`;
    const type = anomaly.anomaly_type as string;
    const zScore = parseFloat(anomaly.max_z_score as string).toFixed(2);
    const direction = anomaly.anomaly_direction as string;

    let actualValue = '';
    let baseline = '';

    if (type === 'BALLOT_ANOMALY') {
      actualValue = `${anomaly.total_ballots} ballots`;
      baseline = `${Math.round(parseFloat(anomaly.q_baseline_ballots as string))} baseline`;
    } else if (type === 'DOCUMENT_ANOMALY') {
      actualValue = `${anomaly.documents_produced} documents`;
      baseline = `${Math.round(parseFloat(anomaly.q_baseline_docs as string))} baseline`;
    }

    return `${year} ${quarter} ${type}: ${parseFloat(zScore) > 0 ? '+' : ''}${zScore} Z-score, ${direction} (${actualValue} vs ${baseline})`;
  }
}

// ============================================================================
// CHART RENDERERS
// ============================================================================

class AnomalyDetectionCharts {
  private readonly dataManager: AnomalyDetectionDataManager;
  private readonly translations: AnomalyTranslationsFull;
  private chartInstances: Record<string, any> = {};

  constructor(dataManager: AnomalyDetectionDataManager) {
    this.dataManager = dataManager;
    this.translations = dataManager.getTranslations();
  }

  async renderAll(): Promise<void> {
    await this.renderAnomalyTimeline();
    await this.renderZScoreDistribution();
    await this.renderAnomalyTypeChart();
    await this.renderSeverityHeatmap();
    await this.renderQuarterlyFrequency();
    await this.renderRecentAnomaliesFeed();
  }

  private async renderAnomalyTimeline(): Promise<void> {
    const canvas = document.getElementById('anomaly-timeline-chart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const data = this.dataManager.data!;
    const anomalies = data.filter((r) => r.anomaly_type !== 'NO_ANOMALY');

    const dataPoints = anomalies.map((record) => {
      const year = parseInt(record.year as string, 10);
      const quarter = parseInt(record.quarter as string, 10);
      return {
        x: year + (quarter - 1) * 0.25,
        y: parseFloat(record.max_z_score as string),
        record,
      };
    });

    if (this.chartInstances.timeline) this.chartInstances.timeline.destroy();

    const ctx = canvas.getContext('2d')!;
    this.chartInstances.timeline = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Anomalies',
            data: dataPoints,
            backgroundColor: dataPoints.map((p) =>
              this.getSeverityColor(p.record.anomaly_severity as string),
            ),
            borderColor: dataPoints.map((p) =>
              this.getSeverityColor(p.record.anomaly_severity as string),
            ),
            pointRadius: dataPoints.map((p) =>
              this.getSeverityRadius(p.record.anomaly_severity as string),
            ),
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const record = context.raw.record;
                return [
                  `${record.year} Q${record.quarter}`,
                  `Type: ${record.anomaly_type}`,
                  `Severity: ${record.anomaly_severity}`,
                  `Z-Score: ${parseFloat(record.max_z_score).toFixed(2)}`,
                  `Direction: ${record.anomaly_direction}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Year' },
            ticks: { callback: (value: any) => Math.floor(value) },
          },
          y: {
            title: { display: true, text: 'Z-Score' },
            grid: {
              color: (context: any) => {
                if (context.tick.value === 2.0 || context.tick.value === -2.0) {
                  return '#f57c00';
                }
                return 'rgba(255, 255, 255, 0.1)';
              },
            },
          },
        },
      },
    });
  }

  private async renderZScoreDistribution(): Promise<void> {
    const canvas = document.getElementById('zscore-distribution-chart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const data = this.dataManager.data!;
    const zScores: number[] = [];

    data.forEach((record) => {
      const ballotZ = parseFloat(record.ballot_z_score as string);
      const docZ = parseFloat(record.doc_z_score as string);
      const attendanceZ = parseFloat(record.attendance_z_score as string);
      if (!isNaN(ballotZ)) zScores.push(ballotZ);
      if (!isNaN(docZ)) zScores.push(docZ);
      if (!isNaN(attendanceZ)) zScores.push(attendanceZ);
    });

    const bins: { min: number; max: number; count: number; isOutlier: boolean }[] = [];
    const binSize = 0.5;
    const minZ = -3;
    const maxZ = 11;

    for (let i = minZ; i < maxZ; i += binSize) {
      bins.push({
        min: i,
        max: i + binSize,
        count: 0,
        isOutlier: Math.abs(i) >= 2.0 || Math.abs(i + binSize) >= 2.0,
      });
    }

    zScores.forEach((z) => {
      const bin = bins.find((b) => z >= b.min && z < b.max);
      if (bin) bin.count++;
    });

    if (this.chartInstances.distribution) this.chartInstances.distribution.destroy();

    const ctx = canvas.getContext('2d')!;
    this.chartInstances.distribution = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bins.map((b) => `${b.min.toFixed(1)}`),
        datasets: [
          {
            label: 'Frequency',
            data: bins.map((b) => b.count),
            backgroundColor: bins.map((b) =>
              b.isOutlier ? 'rgba(211, 47, 47, 0.7)' : 'rgba(0, 217, 255, 0.7)',
            ),
            borderColor: bins.map((b) => (b.isOutlier ? '#d32f2f' : '#00d9ff')),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (context: any) => `Count: ${context.parsed.y}` },
          },
        },
        scales: {
          x: { title: { display: true, text: 'Z-Score' } },
          y: { title: { display: true, text: 'Frequency' }, beginAtZero: true },
        },
      },
    });
  }

  private async renderAnomalyTypeChart(): Promise<void> {
    const canvas = document.getElementById('anomaly-type-chart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const anomalies = this.dataManager.identifyActiveAnomalies();
    const ballotCount = anomalies.filter((a) => a.anomaly_type === 'BALLOT_ANOMALY').length;
    const documentCount = anomalies.filter((a) => a.anomaly_type === 'DOCUMENT_ANOMALY').length;
    const attendanceCount = anomalies.filter((a) => a.anomaly_type === 'ATTENDANCE_ANOMALY').length;

    if (this.chartInstances.typeChart) this.chartInstances.typeChart.destroy();

    const ctx = canvas.getContext('2d')!;
    this.chartInstances.typeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Ballot Anomaly', 'Document Anomaly', 'Attendance Anomaly'],
        datasets: [
          {
            data: [ballotCount, documentCount, attendanceCount],
            backgroundColor: [
              'rgba(25, 118, 210, 0.8)',
              'rgba(56, 142, 60, 0.8)',
              'rgba(245, 124, 0, 0.8)',
            ],
            borderColor: ['#1976d2', '#388e3c', '#f57c00'],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const total = ballotCount + documentCount + attendanceCount;
                const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${context.parsed} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  private async renderSeverityHeatmap(): Promise<void> {
    const container = document.getElementById('severity-heatmap');
    if (!container) return;

    const data = this.dataManager.data!;
    container.innerHTML = '';

    const years = Array.from(new Set(data.map((r) => parseInt(r.year as string, 10)))).sort();
    const quarters = [1, 2, 3, 4];

    const width = container.clientWidth || 800;
    const height = Math.min(600, years.length * 25);
    const margin = { top: 40, right: 40, bottom: 40, left: 60 };
    const cellWidth = (width - margin.left - margin.right) / quarters.length;
    const cellHeight = (height - margin.top - margin.bottom) / years.length;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const cells = svg.selectAll('g').data(data).enter().append('g');

    cells
      .append('rect')
      .attr('x', (d: any) => margin.left + (parseInt(d.quarter) - 1) * cellWidth)
      .attr('y', (d: any) => {
        const yearIndex = years.indexOf(parseInt(d.year));
        return margin.top + yearIndex * cellHeight;
      })
      .attr('width', cellWidth - 2)
      .attr('height', cellHeight - 2)
      .attr('fill', (d: any) => this.getHeatmapColor(d.anomaly_severity))
      .attr('stroke', '#0a0e27')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function (this: SVGRectElement, event: any, d: any) {
        d3.select(this).attr('stroke', '#00d9ff').attr('stroke-width', 2);

        d3.select('body')
          .append('div')
          .attr('class', 'heatmap-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(10, 14, 39, 0.95)')
          .style('color', '#fff')
          .style('padding', '10px')
          .style('border-radius', '4px')
          .style('border', '1px solid #00d9ff')
          .style('pointer-events', 'none')
          .style('z-index', '10000')
          .html(
            `<strong>${d.year} Q${d.quarter}</strong><br>
              Severity: ${d.anomaly_severity}<br>
              Type: ${d.anomaly_type}<br>
              Max Z-Score: ${parseFloat(d.max_z_score).toFixed(2)}`,
          )
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function (this: SVGRectElement) {
        d3.select(this).attr('stroke', '#0a0e27').attr('stroke-width', 1);
        d3.selectAll('.heatmap-tooltip').remove();
      });

    svg
      .selectAll('.year-label')
      .data(years)
      .enter()
      .append('text')
      .attr('class', 'year-label')
      .attr('x', margin.left - 10)
      .attr('y', (_d: any, i: number) => margin.top + i * cellHeight + cellHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .text((d: any) => d);

    svg
      .selectAll('.quarter-label')
      .data(quarters)
      .enter()
      .append('text')
      .attr('class', 'quarter-label')
      .attr('x', (_d: any, i: number) => margin.left + i * cellWidth + cellWidth / 2)
      .attr('y', margin.top - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .text((d: any) => `Q${d}`);
  }

  private async renderQuarterlyFrequency(): Promise<void> {
    const canvas = document.getElementById('quarterly-frequency-chart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const anomalies = this.dataManager.identifyActiveAnomalies();
    const quarterData: Record<number, QuarterCounts> = {
      1: { critical: 0, high: 0, moderate: 0, total: 0 },
      2: { critical: 0, high: 0, moderate: 0, total: 0 },
      3: { critical: 0, high: 0, moderate: 0, total: 0 },
      4: { critical: 0, high: 0, moderate: 0, total: 0 },
    };

    anomalies.forEach((record) => {
      const quarter = parseInt(record.quarter as string, 10);
      const severity = record.anomaly_severity as string;
      quarterData[quarter].total++;
      if (severity === 'CRITICAL') quarterData[quarter].critical++;
      else if (severity === 'HIGH') quarterData[quarter].high++;
      else if (severity === 'MODERATE') quarterData[quarter].moderate++;
    });

    if (this.chartInstances.quarterly) this.chartInstances.quarterly.destroy();

    const ctx = canvas.getContext('2d')!;
    this.chartInstances.quarterly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          {
            label: 'Critical',
            data: [1, 2, 3, 4].map((q) => quarterData[q].critical),
            backgroundColor: 'rgba(211, 47, 47, 0.8)',
            borderColor: '#d32f2f',
            borderWidth: 1,
          },
          {
            label: 'High',
            data: [1, 2, 3, 4].map((q) => quarterData[q].high),
            backgroundColor: 'rgba(245, 124, 0, 0.8)',
            borderColor: '#f57c00',
            borderWidth: 1,
          },
          {
            label: 'Moderate',
            data: [1, 2, 3, 4].map((q) => quarterData[q].moderate),
            backgroundColor: 'rgba(251, 192, 45, 0.8)',
            borderColor: '#fbc02d',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true, title: { display: true, text: 'Quarter' } },
          y: {
            stacked: true,
            title: { display: true, text: 'Anomaly Count' },
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });
  }

  private async renderRecentAnomaliesFeed(): Promise<void> {
    const container = document.getElementById('recent-anomalies-feed');
    if (!container) return;

    const anomalies = this.dataManager.identifyActiveAnomalies();
    const recent = anomalies.slice(0, 5);
    container.innerHTML = '';

    if (recent.length === 0) {
      container.innerHTML = '<p>No recent anomalies detected</p>';
      return;
    }

    recent.forEach((record) => {
      const item = document.createElement('div');
      item.className = `anomaly-feed-item ${(record.anomaly_severity as string).toLowerCase()}`;

      const severity = record.anomaly_severity as string;
      const icon = ALERT_CONFIG[severity]?.icon || '⚪';
      const zScore = parseFloat(record.max_z_score as string).toFixed(2);

      let detailsText = '';
      if (record.anomaly_type === 'BALLOT_ANOMALY') {
        detailsText = `${record.total_ballots} ballots vs ${Math.round(parseFloat(record.q_baseline_ballots as string))} baseline`;
      } else if (record.anomaly_type === 'DOCUMENT_ANOMALY') {
        detailsText = `${record.documents_produced} documents vs ${Math.round(parseFloat(record.q_baseline_docs as string))} baseline`;
      }

      const header = document.createElement('div');
      header.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 5px;';

      const iconSpan = document.createElement('span');
      iconSpan.style.fontSize = '1.5rem';
      iconSpan.textContent = icon;
      header.appendChild(iconSpan);

      const badge = document.createElement('span');
      badge.className = `severity-badge ${severity.toLowerCase()}`;
      badge.textContent = severity;
      header.appendChild(badge);

      const period = document.createElement('span');
      const periodStrong = document.createElement('strong');
      periodStrong.textContent = `${record.year} Q${record.quarter}`;
      period.appendChild(periodStrong);
      header.appendChild(period);

      item.appendChild(header);

      const details = document.createElement('div');
      details.style.marginLeft = '2.5rem';

      const lines: [string, string][] = [
        ['Type:', record.anomaly_type as string],
        ['Z-Score:', `${parseFloat(zScore) > 0 ? '+' : ''}${zScore}`],
        ['Direction:', record.anomaly_direction as string],
        ['Details:', detailsText],
      ];

      lines.forEach(([label, value]) => {
        const p = document.createElement('p');
        p.style.margin = '2px 0';
        const strong = document.createElement('strong');
        strong.textContent = label;
        p.appendChild(strong);
        p.appendChild(document.createTextNode(` ${value}`));
        details.appendChild(p);
      });

      item.appendChild(details);
      container.appendChild(item);
    });
  }

  // --- colour helpers ---

  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      CRITICAL: '#d32f2f',
      HIGH: '#f57c00',
      MODERATE: '#fbc02d',
      LOW: '#388e3c',
    };
    return colors[severity] || '#666';
  }

  private getSeverityRadius(severity: string): number {
    const sizes: Record<string, number> = {
      CRITICAL: 8,
      HIGH: 7,
      MODERATE: 6,
      LOW: 5,
    };
    return sizes[severity] || 5;
  }

  private getHeatmapColor(severity: string): string {
    const colors: Record<string, string> = {
      CRITICAL: '#d32f2f',
      HIGH: '#f57c00',
      MODERATE: '#fbc02d',
      LOW: '#388e3c',
      NO_ANOMALY: '#2e3b4e',
    };
    return colors[severity] || colors.NO_ANOMALY;
  }
}

// ============================================================================
// LOADING / ERROR UI
// ============================================================================

function showLoading(translations: AnomalyTranslationsFull): void {
  const sections = document.querySelectorAll('#anomaly-detection-dashboard .chart-card');
  sections.forEach((section) => {
    const canvas = section.querySelector('canvas');
    const container = section.querySelector<HTMLElement>(
      'div[id$="-heatmap"], div[id$="-feed"]',
    );

    if (canvas || container) {
      const loading = document.createElement('div');
      loading.className = 'loading-indicator';
      loading.textContent = translations.loading;
      loading.style.padding = '20px';
      loading.style.textAlign = 'center';
      loading.style.color = '#00d9ff';

      if (canvas) {
        canvas.classList.add('hidden');
        section.appendChild(loading);
      } else if (container) {
        container.innerHTML = '';
        container.appendChild(loading);
      }
    }
  });
}

function hideLoading(): void {
  const loadingIndicators = document.querySelectorAll('.loading-indicator');
  loadingIndicators.forEach((indicator) => indicator.remove());

  const canvases = document.querySelectorAll('#anomaly-detection-dashboard canvas');
  canvases.forEach((canvas) => canvas.classList.remove('hidden'));
}

function showDashboardError(message: string): void {
  const dashboard = document.getElementById('anomaly-detection-dashboard');
  if (!dashboard) return;

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.padding = '20px';
  errorDiv.style.backgroundColor = 'rgba(211, 47, 47, 0.2)';
  errorDiv.style.border = '2px solid #d32f2f';
  errorDiv.style.borderRadius = '8px';
  errorDiv.style.margin = '20px 0';
  errorDiv.style.color = '#fff';

  const heading = document.createElement('h3');
  heading.textContent = '⚠️ Error Loading Dashboard';
  errorDiv.appendChild(heading);

  const msgP = document.createElement('p');
  msgP.textContent = message;
  errorDiv.appendChild(msgP);

  const helpP = document.createElement('p');
  helpP.textContent =
    'Please try refreshing the page or contact support if the issue persists.';
  errorDiv.appendChild(helpP);

  dashboard.insertBefore(errorDiv, dashboard.firstChild);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Initialise the Anomaly Detection & Early Warning dashboard.
 *
 * Loads CSV data (local-first with remote fallback), processes anomaly
 * statistics, renders all six Chart.js/D3 visualizations, and activates the
 * alert banner for CRITICAL/HIGH anomalies in recent quarters.
 */
export async function init(): Promise<void> {
  logger.debug('Initializing Anomaly Detection Dashboard...');

  const dataManager = new AnomalyDetectionDataManager();
  const alertSystem = new AnomalyAlertSystem(dataManager);
  const charts = new AnomalyDetectionCharts(dataManager);

  const t = dataManager.getTranslations();
  showLoading(t);

  try {
    await dataManager.fetchData();

    const dashboard = document.getElementById('anomaly-detection-dashboard');
    if (dashboard) {
      showDataSourceDisclaimer(dashboard, dataManager.dataSourceType);
    }

    const criticalAnomaly = dataManager.checkForCriticalAnomalies();
    if (criticalAnomaly) {
      alertSystem.checkAndDisplayAlert(criticalAnomaly);
    }

    await charts.renderAll();

    const stats = dataManager.calculateAnomalyStats();
    logger.debug('Anomaly Statistics:', stats);

    hideLoading();
    logger.debug('✅ Anomaly Detection Dashboard initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize dashboard:', error);
    hideLoading();
    showDashboardError((error as Error).message);
  }
}
