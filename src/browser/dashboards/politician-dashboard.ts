/**
 * @module Dashboards/Politician
 * @category Intelligence Analysis - Individual Politician Risk Assessment & Career Analytics
 *
 * Individual Politician Career Analytics & Risk Intelligence Dashboard.
 *
 * Advanced intelligence profiling platform providing micro-level politician assessment
 * across 349 Swedish members of parliament. Implements comprehensive risk scoring,
 * influence hierarchy measurement, behavioral pattern analysis, and career trajectory
 * forecasting using Chart.js visualization.
 *
 * ## Data Sources (CIA Platform CSVs)
 *
 * - `view_politician_risk_summary_sample.csv`
 * - `view_riksdagen_politician_influence_metrics_sample.csv`
 * - `view_politician_behavioral_trends_sample.csv`
 * - `distribution_experience_levels.csv`
 * - `distribution_influence_buckets.csv`
 * - `distribution_assignment_roles.csv`
 *
 * @author Hack23 AB - Individual Intelligence Team
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024
 * @see {@link https://github.com/Hack23/cia|CIA Platform Data Source}

 *
 * @intelligence Individual Politician Intelligence Profiling — micro-level assessment of 349 Swedish MPs with comprehensive risk scoring, influence hierarchy measurement, behavioral pattern analysis, and career trajectory forecasting. Provides drill-down from macro political trends to individual actor analysis.
 *
 * @business Personalized intelligence product — individual politician profiles are the most granular data product, enabling per-politician alerts, comparison tools, and voter constituency reports. Foundation for B2C freemium model (free basic profiles, premium detailed analytics).
 *
 * @marketing Voter engagement tool — "look up your MP" functionality drives organic search traffic and civic engagement. Each politician profile page is SEO-optimized for name searches, capturing electoral-season search spikes across 14 languages.
 * */

import {
  logger,
  detectLanguage,
  showDataSourceDisclaimer,
} from '../shared/index.js';

import type { CSVRow } from '../shared/index.js';

const Chart = (globalThis as any).Chart;

// ============================================================================
// INTERFACES
// ============================================================================

/** Local-first + remote-fallback URL pair. */
interface DataSourceUrls {
  readonly riskSummary: readonly string[];
  readonly influenceMetrics: readonly string[];
  readonly behavioralTrends: readonly string[];
  readonly experienceLevels: readonly string[];
  readonly influenceBuckets: readonly string[];
  readonly assignmentRoles: readonly string[];
}

/** In-memory data cache. */
interface DataCache {
  riskSummary: CSVRow[] | null;
  influenceMetrics: CSVRow[] | null;
  behavioralTrends: CSVRow[] | null;
  experienceLevels: CSVRow[] | null;
  influenceBuckets: CSVRow[] | null;
  assignmentRoles: CSVRow[] | null;
}

/** A single top-10 list item. */
interface Top10Item {
  name: string;
  party: string;
  score: string;
}

/** Bubble chart data point. */
interface BubblePoint {
  x: number;
  y: number;
  r: number;
  name: string;
  party: string;
  riskLevel: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LOCAL_DATA_BASE = 'cia-data';
const CIA_DATA_BASE_URL =
  'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data';

const DATA_SOURCES: DataSourceUrls = {
  riskSummary: [
    `${LOCAL_DATA_BASE}/politician/view_politician_risk_summary_sample.csv`,
    `${CIA_DATA_BASE_URL}/politician/view_politician_risk_summary_sample.csv`,
  ],
  influenceMetrics: [
    `${LOCAL_DATA_BASE}/politician/view_riksdagen_politician_influence_metrics_sample.csv`,
    `${CIA_DATA_BASE_URL}/politician/view_riksdagen_politician_influence_metrics_sample.csv`,
  ],
  behavioralTrends: [
    `${LOCAL_DATA_BASE}/politician/view_politician_behavioral_trends_sample.csv`,
    `${CIA_DATA_BASE_URL}/politician/view_politician_behavioral_trends_sample.csv`,
  ],
  experienceLevels: [
    `${LOCAL_DATA_BASE}/politician/distribution_experience_levels.csv`,
    `${CIA_DATA_BASE_URL}/politician/distribution_experience_levels.csv`,
  ],
  influenceBuckets: [
    `${LOCAL_DATA_BASE}/politician/distribution_influence_buckets.csv`,
    `${CIA_DATA_BASE_URL}/politician/distribution_influence_buckets.csv`,
  ],
  assignmentRoles: [
    `${LOCAL_DATA_BASE}/politician/distribution_assignment_roles.csv`,
    `${CIA_DATA_BASE_URL}/politician/distribution_assignment_roles.csv`,
  ],
};

const PARTY_COLORS: Record<string, string> = {
  S: 'rgba(237, 28, 36, 0.6)',
  M: 'rgba(0, 106, 179, 0.6)',
  SD: 'rgba(221, 221, 0, 0.6)',
  C: 'rgba(0, 153, 68, 0.6)',
  V: 'rgba(218, 41, 28, 0.6)',
  KD: 'rgba(0, 95, 164, 0.6)',
  L: 'rgba(0, 106, 180, 0.6)',
  MP: 'rgba(83, 160, 39, 0.6)',
};

// ============================================================================
// STATE
// ============================================================================

const dataCache: DataCache = {
  riskSummary: null,
  influenceMetrics: null,
  behavioralTrends: null,
  experienceLevels: null,
  influenceBuckets: null,
  assignmentRoles: null,
};

// ============================================================================
// CSV PARSING
// ============================================================================

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map((h) =>
    h.trim().replace(/^\uFEFF?"/, '').replace(/"$/, ''),
  );
  const data: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }
  return data;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchCIAData(urls: readonly string[]): Promise<CSVRow[]> {
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      const text = await response.text();
      const data = parseCSV(text);
      if (data.length > 0) return data;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Fetch failed for ${url}, trying next source...`);
    }
  }

  logger.error('All data sources failed:', lastError);
  return [];
}

// ============================================================================
// TOP-10 RENDERING
// ============================================================================

function renderTop10List(
  containerId: string,
  data: Top10Item[],
  scoreLabel = 'Score',
): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!data || data.length === 0) {
    container.textContent = '';
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = 'No data available';
    container.appendChild(errorElement);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'top10-list';
  ul.setAttribute('role', 'list');

  data.slice(0, 10).forEach((item, index) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');

    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = `${index + 1}`;
    rank.setAttribute('aria-label', `Rank ${index + 1}`);

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.name || 'Unknown';

    const party = document.createElement('span');
    party.className = 'party';
    party.textContent = item.party || '';

    const score = document.createElement('span');
    score.className = 'score';
    score.textContent = item.score || '0';
    score.setAttribute('aria-label', `${scoreLabel}: ${item.score || '0'}`);

    li.appendChild(rank);
    li.appendChild(name);
    if (item.party) li.appendChild(party);
    li.appendChild(score);

    ul.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(ul);
}

// ============================================================================
// CHART RENDERING
// ============================================================================

function createCareerTrajectoryChart(data: CSVRow[]): void {
  const canvas = document.getElementById('career-trajectory-chart') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let chartData: any;
  if (data && data.length > 0) {
    const byPeriod: Record<
      string,
      { absence: number[]; winRate: number[]; rebelRate: number[]; count: number }
    > = {};

    data.forEach((row) => {
      const period = ((row.time_bucket as string) || (row.period_start as string) || '').substring(0, 7);
      if (!period) return;
      if (!byPeriod[period]) {
        byPeriod[period] = { absence: [], winRate: [], rebelRate: [], count: 0 };
      }
      byPeriod[period].absence.push(parseFloat(row.avg_absence_rate as string) || 0);
      byPeriod[period].winRate.push(parseFloat(row.avg_win_rate as string) || 0);
      byPeriod[period].rebelRate.push(parseFloat(row.avg_rebel_rate as string) || 0);
      byPeriod[period].count++;
    });

    const periods = Object.keys(byPeriod).sort();
    const avg = (arr: number[]): number =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    chartData = {
      labels: periods,
      datasets: [
        {
          label: 'Avg Win Rate (%)',
          data: periods.map((p) => avg(byPeriod[p].winRate).toFixed(1)),
          borderColor: '#00d9ff',
          backgroundColor: 'rgba(0, 217, 255, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Avg Absence Rate (%)',
          data: periods.map((p) => avg(byPeriod[p].absence).toFixed(1)),
          borderColor: '#ff006e',
          backgroundColor: 'rgba(255, 0, 110, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Avg Rebel Rate (%)',
          data: periods.map((p) => avg(byPeriod[p].rebelRate).toFixed(1)),
          borderColor: '#ffbe0b',
          backgroundColor: 'rgba(255, 190, 11, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  } else {
    chartData = {
      labels: ['No Data'],
      datasets: [
        {
          label: 'No behavioral data available',
          data: [0],
          borderColor: '#00d9ff',
          backgroundColor: 'rgba(0, 217, 255, 0.1)',
        },
      ],
    };
  }

  new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#e0e0e0',
            font: { family: "'Inter', sans-serif" },
          },
        },
        title: { display: false },
        tooltip: {
          backgroundColor: 'rgba(26, 30, 61, 0.95)',
          titleColor: '#00d9ff',
          bodyColor: '#e0e0e0',
          borderColor: '#00d9ff',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: '#e0e0e0', font: { family: "'Inter', sans-serif" } },
          grid: { color: 'rgba(0, 217, 255, 0.1)' },
        },
        y: {
          ticks: { color: '#e0e0e0', font: { family: "'Inter', sans-serif" } },
          grid: { color: 'rgba(0, 217, 255, 0.1)' },
        },
      },
    },
  });
}

function createProductivityInfluenceChart(
  riskData: CSVRow[],
  influenceData: CSVRow[],
): void {
  const canvas = document.getElementById(
    'productivity-influence-chart',
  ) as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let chartData: any;
  if (riskData && riskData.length > 0 && influenceData && influenceData.length > 0) {
    const influenceLookup: Record<string, { connections: number; classification: string }> = {};
    influenceData.forEach((row) => {
      influenceLookup[row.person_id as string] = {
        connections: parseInt(row.network_connections as string, 10) || 0,
        classification: (row.influence_classification as string) || 'UNKNOWN',
      };
    });

    const byParty: Record<string, BubblePoint[]> = {};
    riskData.forEach((row) => {
      if (row.status !== 'Tjänstgörande riksdagsledamot') return;
      const party = (row.party as string) || 'Unknown';
      const influence = influenceLookup[row.person_id as string];
      const productivity = parseInt(row.annual_vote_count as string, 10) || 0;
      const connections = influence ? influence.connections : 0;
      const riskScore = parseFloat(row.risk_score as string) || 10;

      if (!byParty[party]) byParty[party] = [];
      byParty[party].push({
        x: productivity,
        y: connections,
        r: Math.max(3, riskScore / 5),
        name: `${row.first_name} ${row.last_name}`,
        party,
        riskLevel: (row.risk_level as string) || '',
      });
    });

    chartData = {
      datasets: Object.entries(byParty).map(([party, points]) => ({
        label: party,
        data: points,
        backgroundColor: PARTY_COLORS[party] || 'rgba(128, 128, 128, 0.5)',
        borderColor: (PARTY_COLORS[party] || 'rgba(128,128,128,0.5)').replace('0.6', '1'),
        borderWidth: 1,
      })),
    };
  } else {
    chartData = {
      datasets: [
        {
          label: 'No data available',
          data: [{ x: 0, y: 0, r: 5 }],
          backgroundColor: 'rgba(0, 217, 255, 0.5)',
          borderColor: '#00d9ff',
          borderWidth: 1,
        },
      ],
    };
  }

  new Chart(ctx, {
    type: 'bubble',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#e0e0e0', font: { family: "'Inter', sans-serif" } },
        },
        tooltip: {
          backgroundColor: 'rgba(26, 30, 61, 0.95)',
          titleColor: '#00d9ff',
          bodyColor: '#e0e0e0',
          borderColor: '#00d9ff',
          borderWidth: 1,
          callbacks: {
            label(context: any) {
              const raw = context.raw as BubblePoint;
              return [
                raw.name ? `${raw.name} (${raw.party})` : '',
                `Votes: ${context.parsed.x}`,
                `Connections: ${context.parsed.y}`,
                raw.riskLevel ? `Risk: ${raw.riskLevel}` : '',
              ].filter(Boolean);
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Annual Vote Count',
            color: '#e0e0e0',
            font: { family: "'Inter', sans-serif" },
          },
          ticks: { color: '#e0e0e0', font: { family: "'Inter', sans-serif" } },
          grid: { color: 'rgba(0, 217, 255, 0.1)' },
        },
        y: {
          title: {
            display: true,
            text: 'Network Connections',
            color: '#e0e0e0',
            font: { family: "'Inter', sans-serif" },
          },
          ticks: { color: '#e0e0e0', font: { family: "'Inter', sans-serif" } },
          grid: { color: 'rgba(0, 217, 255, 0.1)' },
        },
      },
    },
  });
}

function createExperienceDistributionChart(data: CSVRow[]): void {
  const canvas = document.getElementById(
    'experience-distribution-chart',
  ) as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let labels: string[];
  let counts: number[];

  if (data && data.length > 0) {
    const formatLabel = (s: string): string =>
      s
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase());

    labels = data.map((row) => formatLabel((row.experience_level as string) || ''));
    counts = data.map((row) => parseInt(row.politician_count as string, 10) || 0);
  } else {
    labels = ['No Data'];
    counts = [0];
  }

  const colors = [
    'rgba(0, 217, 255, 0.7)',
    'rgba(0, 217, 255, 0.6)',
    'rgba(0, 217, 255, 0.5)',
    'rgba(255, 190, 11, 0.6)',
    'rgba(255, 0, 110, 0.5)',
    'rgba(255, 0, 110, 0.6)',
    'rgba(255, 0, 110, 0.7)',
  ];
  const borderColors = [
    '#00d9ff', '#00d9ff', '#00d9ff',
    '#ffbe0b',
    '#ff006e', '#ff006e', '#ff006e',
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Number of Politicians',
        data: counts,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderColor: labels.map((_, i) => borderColors[i % borderColors.length]),
        borderWidth: 2,
      },
    ],
  };

  new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(26, 30, 61, 0.95)',
          titleColor: '#00d9ff',
          bodyColor: '#e0e0e0',
          borderColor: '#00d9ff',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: '#e0e0e0', font: { family: "'Inter', sans-serif" }, maxRotation: 45 },
          grid: { color: 'rgba(0, 217, 255, 0.1)' },
        },
        y: {
          ticks: { color: '#e0e0e0', font: { family: "'Inter', sans-serif" } },
          grid: { color: 'rgba(0, 217, 255, 0.1)' },
        },
      },
    },
  });
}

// ============================================================================
// ERROR DISPLAY
// ============================================================================

function showError(message: string): void {
  const containers = [
    'top10-productive-container',
    'top10-influential-container',
    'top10-rising-stars-container',
    'top10-controversial-container',
  ];

  containers.forEach((id) => {
    const container = document.getElementById(id);
    if (container) {
      container.textContent = '';
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = message;
      container.appendChild(errorElement);
    }
  });
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Initialise the Politician Dashboard.
 *
 * Loads risk, influence, behavioral, and experience data in parallel,
 * computes Top-10 lists, and renders Chart.js visualizations.
 */
export async function init(): Promise<void> {
  logger.debug('Initializing Politician Dashboard...');

  try {
    const [riskData, influenceData, behavioralData, experienceData] = await Promise.all([
      fetchCIAData(DATA_SOURCES.riskSummary),
      fetchCIAData(DATA_SOURCES.influenceMetrics),
      fetchCIAData(DATA_SOURCES.behavioralTrends),
      fetchCIAData(DATA_SOURCES.experienceLevels),
    ]);

    dataCache.riskSummary = riskData;
    dataCache.influenceMetrics = influenceData;
    dataCache.behavioralTrends = behavioralData;
    dataCache.experienceLevels = experienceData;

    const politicianDashboard = document.getElementById('politician-dashboard');
    if (politicianDashboard) {
      showDataSourceDisclaimer(politicianDashboard, 'live');
    }

    // --- Top 10 Most Productive (by annual_vote_count) ---
    const activeRiskData = riskData.filter(
      (r) => r.status === 'Tjänstgörande riksdagsledamot',
    );
    const top10Productive: Top10Item[] = [...activeRiskData]
      .sort(
        (a, b) =>
          (parseInt(b.annual_vote_count as string, 10) || 0) -
          (parseInt(a.annual_vote_count as string, 10) || 0),
      )
      .slice(0, 10)
      .map((r) => ({
        name: `${r.first_name} ${r.last_name}`,
        party: (r.party as string) || '',
        score: (r.annual_vote_count as string) || '0',
      }));

    // --- Top 10 Most Influential (by network_connections) ---
    const top10Influential: Top10Item[] = [...influenceData]
      .sort(
        (a, b) =>
          (parseInt(b.network_connections as string, 10) || 0) -
          (parseInt(a.network_connections as string, 10) || 0),
      )
      .slice(0, 10)
      .map((r) => ({
        name: `${r.first_name} ${r.last_name}`,
        party: (r.party as string) || '',
        score: (r.network_connections as string) || '0',
      }));

    // --- Top 10 Rising Stars (low risk + high vote count) ---
    const top10RisingStars: Top10Item[] = [...activeRiskData]
      .filter((r) => parseInt(r.annual_vote_count as string, 10) > 0)
      .sort((a, b) => {
        const scoreA =
          (parseFloat(a.risk_score as string) || 50) -
          (parseInt(a.annual_vote_count as string, 10) || 0) / 100;
        const scoreB =
          (parseFloat(b.risk_score as string) || 50) -
          (parseInt(b.annual_vote_count as string, 10) || 0) / 100;
        return scoreA - scoreB;
      })
      .slice(0, 10)
      .map((r) => ({
        name: `${r.first_name} ${r.last_name}`,
        party: (r.party as string) || '',
        score: (r.risk_score as string) || '0',
      }));

    // --- Top 10 Controversial (highest risk_score) ---
    const top10Controversial: Top10Item[] = [...activeRiskData]
      .sort(
        (a, b) =>
          (parseFloat(b.risk_score as string) || 0) -
          (parseFloat(a.risk_score as string) || 0),
      )
      .slice(0, 10)
      .map((r) => ({
        name: `${r.first_name} ${r.last_name}`,
        party: (r.party as string) || '',
        score: (r.risk_score as string) || '0',
      }));

    renderTop10List('top10-productive-container', top10Productive, 'Votes');
    renderTop10List('top10-influential-container', top10Influential, 'Connections');
    renderTop10List('top10-rising-stars-container', top10RisingStars, 'Risk Score');
    renderTop10List('top10-controversial-container', top10Controversial, 'Risk Score');

    createCareerTrajectoryChart(behavioralData);
    createProductivityInfluenceChart(riskData, influenceData);
    createExperienceDistributionChart(experienceData);

    logger.debug('✅ Politician Dashboard initialized successfully');
  } catch (error) {
    logger.error('Error loading dashboard data:', error);
    showError('Failed to load dashboard data. Please try again later.');
  }
}
