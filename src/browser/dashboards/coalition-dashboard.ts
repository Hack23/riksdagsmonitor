/**
 * @module Dashboards/CoalitionDashboard
 * @category Analytics - Coalition Intelligence & Voting Pattern Analysis
 *
 * Coalition & Voting Pattern Dashboard providing interactive visualization of Swedish
 * political coalition dynamics and voting pattern analysis. Transforms raw voting records
 * into pattern intelligence revealing party alliances, behavioral anomalies, and political
 * realignments.
 *
 * @author Hack23 AB - Political Intelligence & Coalition Analysis
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024

 *
 * @intelligence Coalition Voting Pattern Intelligence — interactive visualization revealing party alliances, behavioral anomalies, and political realignments through voting record analysis. Transforms raw voting data into strategic coalition intelligence with pattern detection and trend identification.
 *
 * @business Interactive engagement driver — coalition visualizations have the highest user engagement metrics (time on page, interaction rate). Interactive features justify premium tier pricing and demonstrate technical sophistication to enterprise prospects.
 *
 * @marketing Shareable visual content — coalition alignment charts and voting pattern visualizations are the most shared content type on social media. Each visualization is a potential viral asset with embedded Riksdagsmonitor branding.
 * */

import {
  logger,
  showDataSourceDisclaimer,
} from '../shared/index.js';

import type { DataSourceType } from '../shared/index.js';

const d3 = (globalThis as any).d3;
const Chart = (globalThis as any).Chart;

// ============================================================================
// INTERFACES
// ============================================================================

interface PartyConfig {
  name: string;
  color: string;
  fullName: string;
}

interface CoalitionNode {
  id: string;
  name: string;
  fullName: string;
  color: string;
  influence: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface CoalitionLink {
  source: any;
  target: any;
  strength: number;
}

interface AnomalyEntry {
  party: string;
  date: string;
  deviation: number;
  severity: string;
}

interface AnnualVoteEntry {
  year: number;
  votes: number;
}

interface DataCache {
  coalitionAlignment: Record<string, Record<string, number>> | null;
  behavioralPatterns: Record<string, number> | null;
  decisionPatterns: any[] | null;
  votingAnomalies: AnomalyEntry[] | null;
  annualVotes: Record<string, AnnualVoteEntry[]> | null;
}

interface DataConfig {
  files: Record<string, string[]>;
  useMockData: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PARTIES: Record<string, PartyConfig> = {
  'S': { name: 'Socialdemokraterna', color: '#E8112d', fullName: 'Social Democrats' },
  'M': { name: 'Moderaterna', color: '#52BDEC', fullName: 'Moderates' },
  'SD': { name: 'Sverigedemokraterna', color: '#DDDD00', fullName: 'Sweden Democrats' },
  'V': { name: 'Vänsterpartiet', color: '#DA291C', fullName: 'Left Party' },
  'MP': { name: 'Miljöpartiet', color: '#83CF39', fullName: 'Green Party' },
  'C': { name: 'Centerpartiet', color: '#009933', fullName: 'Centre Party' },
  'L': { name: 'Liberalerna', color: '#006AB3', fullName: 'Liberals' },
  'KD': { name: 'Kristdemokraterna', color: '#000077', fullName: 'Christian Democrats' }
};

const REMOTE_BASE_URL = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';

const DATA_CONFIG: DataConfig = {
  files: {
    coalition: ['cia-data/party/distribution_coalition_alignment.csv', REMOTE_BASE_URL + 'distribution_coalition_alignment.csv'],
    behavioral: ['cia-data/parties/distribution_behavioral_patterns_by_party.csv', REMOTE_BASE_URL + 'distribution_behavioral_patterns_by_party.csv'],
    decision: ['cia-data/parties/distribution_decision_patterns_by_party.csv', REMOTE_BASE_URL + 'distribution_decision_patterns_by_party.csv'],
    anomalyClassification: ['cia-data/voting/distribution_voting_anomaly_classification.csv', REMOTE_BASE_URL + 'distribution_voting_anomaly_classification.csv'],
    anomalyByParty: ['cia-data/anomaly/distribution_anomaly_by_party.csv', REMOTE_BASE_URL + 'distribution_anomaly_by_party.csv'],
    annualVotes: ['cia-data/voting/distribution_annual_party_votes.csv', REMOTE_BASE_URL + 'distribution_annual_party_votes.csv'],
    decisionTrends: ['cia-data/voting/distribution_decision_trends.csv', REMOTE_BASE_URL + 'distribution_decision_trends.csv'],
    partyMomentum: ['cia-data/distribution_party_momentum.csv', REMOTE_BASE_URL + 'distribution_party_momentum.csv']
  },
  useMockData: false
};

let dataCache: DataCache = {
  coalitionAlignment: null,
  behavioralPatterns: null,
  decisionPatterns: null,
  votingAnomalies: null,
  annualVotes: null
};

/** Tracks whether any data source fell back to mock/synthetic data. */
let coalitionDataSourceType: DataSourceType = 'live';

// ============================================================================
// CSV UTILITIES
// ============================================================================

function parseCSV(csvText: string): Record<string, string>[] {
  try { return d3.csvParse(csvText); }
  catch (error) { logger.error('CSV parsing error:', error); return []; }
}

async function fetchCSV(urls: string[]): Promise<Record<string, string>[] | null> {
  const urlList = Array.isArray(urls) ? urls : [urls];
  for (const url of urlList) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const data = parseCSV(text);
      if (data && data.length > 0) { logger.info(`  Loaded from: ${url} (${data.length} rows)`); return data; }
    } catch (error) { logger.error(`  Failed: ${url} -`, error); }
  }
  return null;
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

async function fetchCoalitionData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) { dataCache.coalitionAlignment = generateMockCoalitionData(); coalitionDataSourceType = 'mock'; return; }
    const csvData = await fetchCSV(DATA_CONFIG.files['coalition']);
    if (csvData && csvData.length > 0) {
      const alignment: Record<string, Record<string, number>> = {};
      csvData.forEach(row => {
        const party1 = row['party1']; const party2 = row['party2']; const alignmentRate = parseFloat(row['alignment_rate']);
        if (!PARTIES[party1] || !PARTIES[party2]) return;
        if (!alignment[party1]) alignment[party1] = {};
        alignment[party1][party2] = alignmentRate;
        if (!alignment[party2]) alignment[party2] = {};
        alignment[party2][party1] = alignmentRate;
      });
      dataCache.coalitionAlignment = alignment;
      logger.info('Coalition data loaded from CSV');
    } else { dataCache.coalitionAlignment = generateMockCoalitionData(); coalitionDataSourceType = 'mock'; logger.info('Coalition data loaded (mock fallback)'); }
  } catch (error) { logger.error('Failed to fetch coalition data:', error); dataCache.coalitionAlignment = generateMockCoalitionData(); coalitionDataSourceType = 'mock'; }
}

async function fetchBehavioralData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) { dataCache.behavioralPatterns = generateMockBehavioralData(); coalitionDataSourceType = 'mock'; return; }
    const csvData = await fetchCSV(DATA_CONFIG.files['behavioral']);
    if (csvData && csvData.length > 0) {
      const partyData: Record<string, { total: number; standardBehavior: number }> = {};
      csvData.forEach(row => {
        const party = row['party'];
        if (party === '-') return;
        if (!partyData[party]) partyData[party] = { total: 0, standardBehavior: 0 };
        const count = parseInt(row['politician_count']) || 0;
        partyData[party].total += count;
        if (row['behavioral_assessment'] === 'STANDARD_BEHAVIOR') partyData[party].standardBehavior += count;
      });
      const patterns: Record<string, number> = {};
      Object.keys(partyData).forEach(party => {
        if (partyData[party].total > 0) {
          const consistency = (partyData[party].standardBehavior / partyData[party].total) * 100;
          patterns[party] = Math.max(75, Math.min(100, consistency || 80));
        }
      });
      dataCache.behavioralPatterns = patterns;
      logger.info('Behavioral data loaded from CSV');
    } else { dataCache.behavioralPatterns = generateMockBehavioralData(); coalitionDataSourceType = 'mock'; }
  } catch (error) { logger.error('Failed to fetch behavioral data:', error); dataCache.behavioralPatterns = generateMockBehavioralData(); coalitionDataSourceType = 'mock'; }
}

async function fetchDecisionData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) { dataCache.decisionPatterns = generateMockDecisionData(); coalitionDataSourceType = 'mock'; return; }
    const csvData = await fetchCSV(DATA_CONFIG.files['decision']);
    if (csvData && csvData.length > 0) { dataCache.decisionPatterns = csvData; }
    else { dataCache.decisionPatterns = generateMockDecisionData(); coalitionDataSourceType = 'mock'; }
  } catch (error) { logger.error('Failed to fetch decision data:', error); dataCache.decisionPatterns = generateMockDecisionData(); coalitionDataSourceType = 'mock'; }
}

async function fetchAnomalyData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) { dataCache.votingAnomalies = generateMockAnomalyData(); coalitionDataSourceType = 'mock'; return; }
    const csvData = await fetchCSV(DATA_CONFIG.files['anomalyByParty']);
    if (csvData && csvData.length > 0) {
      const anomalies: AnomalyEntry[] = [];
      csvData.forEach(row => {
        const party = row['party'];
        if (party === '-' || !party) return;
        const avgRebellions = parseFloat(row['avg_rebellions']) || 0;
        const count = parseInt(row['politician_count']) || 1;
        const classification = row['anomaly_classification'] || 'EXPECTED_BEHAVIOR';
        if (avgRebellions > 0 && count > 0) {
          const deviation = Math.min(6, avgRebellions);
          anomalies.push({ party, date: '2024-06-15', deviation, severity: classification === 'HIGH_REBELLION_RATE' ? 'critical' : deviation > 2.5 ? 'major' : 'minor' });
        }
      });
      dataCache.votingAnomalies = anomalies;
      logger.info('Anomaly data loaded from CSV');
    } else { dataCache.votingAnomalies = generateMockAnomalyData(); coalitionDataSourceType = 'mock'; }
  } catch (error) { logger.error('Failed to fetch anomaly data:', error); dataCache.votingAnomalies = generateMockAnomalyData(); coalitionDataSourceType = 'mock'; }
}

async function fetchAnnualVotesData(): Promise<void> {
  try {
    if (DATA_CONFIG.useMockData) { dataCache.annualVotes = generateMockAnnualVotesData(); coalitionDataSourceType = 'mock'; return; }
    const csvData = await fetchCSV(DATA_CONFIG.files['annualVotes']);
    if (csvData && csvData.length > 0) {
      const annualData: Record<string, AnnualVoteEntry[]> = {};
      csvData.forEach(row => {
        const year = parseInt(row['year']); const party = row['party']; const voteCount = parseInt(row['vote_count']) || 0;
        if (!annualData[party]) annualData[party] = [];
        annualData[party].push({ year, votes: voteCount });
      });
      Object.keys(annualData).forEach(party => { annualData[party].sort((a, b) => a.year - b.year); });
      dataCache.annualVotes = annualData;
      logger.info('Annual votes data loaded from CSV');
    } else { dataCache.annualVotes = generateMockAnnualVotesData(); coalitionDataSourceType = 'mock'; }
  } catch (error) { logger.error('Failed to fetch annual votes data:', error); dataCache.annualVotes = generateMockAnnualVotesData(); coalitionDataSourceType = 'mock'; }
}

// ============================================================================
// RENDERERS
// ============================================================================

function renderCoalitionNetwork(): void {
  const container = document.getElementById('coalitionNetwork');
  if (!container) return;
  container.innerHTML = '';
  const width = container.clientWidth || 800;
  const height = 600;

  const svg = d3.select('#coalitionNetwork').append('svg').attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]).attr('style', 'max-width: 100%; height: auto;');

  const nodes: CoalitionNode[] = Object.keys(PARTIES).map(id => {
    let influence = 5;
    const alignment = dataCache.coalitionAlignment;
    if (alignment && alignment[id]) {
      const rates = Object.values(alignment[id]).filter((v): v is number => typeof v === 'number');
      influence = rates.length > 0 ? (rates.reduce((s, v) => s + v, 0) / rates.length) * 10 + 3 : 5;
    }
    return { id, name: PARTIES[id].name, fullName: PARTIES[id].fullName, color: PARTIES[id].color, influence: Math.max(5, Math.min(15, influence)) };
  });

  const links: CoalitionLink[] = [];
  const alignment = dataCache.coalitionAlignment;
  nodes.forEach((source, i) => {
    nodes.forEach((target, j) => {
      if (i < j) {
        const rawStrengthForward = alignment?.[source.id]?.[target.id];
        const rawStrengthBackward = alignment?.[target.id]?.[source.id];
        const rawStrength = typeof rawStrengthForward === 'number' ? rawStrengthForward : (typeof rawStrengthBackward === 'number' ? rawStrengthBackward : undefined);
        const strength = typeof rawStrength === 'number' ? rawStrength : 0.5;
        links.push({ source: source.id, target: target.id, strength });
      }
    });
  });

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius((d: any) => d.influence * 3 + 10));

  const link = svg.append('g').attr('class', 'links').selectAll('line').data(links).enter().append('line')
    .attr('stroke', '#999').attr('stroke-opacity', (d: any) => d.strength).attr('stroke-width', (d: any) => Math.sqrt(d.strength * 10))
    .style('cursor', 'pointer')
    .on('mouseover', function(this: SVGLineElement, event: any, d: any) {
      d3.select(this).attr('stroke', '#ff6600').attr('stroke-width', Math.sqrt(d.strength * 10) + 2);
      showTooltip(event, `Coalition Strength: ${(d.strength * 100).toFixed(0)}%`);
    })
    .on('mouseout', function(this: SVGLineElement, _event: any, d: any) {
      d3.select(this).attr('stroke', '#999').attr('stroke-width', Math.sqrt(d.strength * 10));
      hideTooltip();
    });

  const node = svg.append('g').attr('class', 'nodes').selectAll('g').data(nodes).enter().append('g')
    .attr('tabindex', '0').attr('role', 'button').attr('aria-label', (d: any) => `${d.fullName} party node`).style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (event: any, d: any) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (_event: any, d: any) => { d.fx = _event.x; d.fy = _event.y; })
      .on('end', (event: any, d: any) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

  node.append('circle').attr('r', (d: any) => d.influence * 3).attr('fill', (d: any) => d.color).attr('stroke', '#fff').attr('stroke-width', 2);
  node.append('text').text((d: any) => d.id).attr('x', 0).attr('y', 0).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('fill', '#fff').attr('font-weight', 'bold').attr('font-size', '14px').attr('pointer-events', 'none');
  node.append('text').text((d: any) => d.name).attr('x', 0).attr('y', (d: any) => d.influence * 3 + 15).attr('text-anchor', 'middle').attr('font-size', '12px').attr('fill', 'var(--text-color)').attr('pointer-events', 'none');

  node.on('mouseover', function(this: SVGGElement, event: any, d: any) {
    d3.select(this).select('circle').attr('stroke-width', 4).attr('stroke', '#ff6600');
    showTooltip(event, `${d.fullName}<br>Influence: ${d.influence.toFixed(1)}`);
  }).on('mouseout', function(this: SVGGElement) {
    d3.select(this).select('circle').attr('stroke-width', 2).attr('stroke', '#fff');
    hideTooltip();
  }).on('click', function(this: SVGGElement, _event: any, d: any) {
    alert(`${d.fullName}\nInfluence Score: ${d.influence.toFixed(1)}\nColor: ${d.color}`);
  }).on('keydown', function(event: any, d: any) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); alert(`${d.fullName}\nInfluence Score: ${d.influence.toFixed(1)}\nColor: ${d.color}`); }
  });

  simulation.on('tick', () => {
    link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y).attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
    node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
  });

  createAccessibleNetworkTable(nodes, links);
}

function renderAlignmentHeatMap(): void {
  const container = document.getElementById('alignmentHeatMap');
  if (!container) return;
  container.innerHTML = '';
  const width = container.clientWidth || 600;
  const height = 500;
  const margin = { top: 80, right: 20, bottom: 20, left: 100 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select('#alignmentHeatMap').append('svg').attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]).attr('style', 'max-width: 100%; height: auto;');
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  const partyIds = Object.keys(PARTIES);
  const cellSize = Math.min(innerWidth / partyIds.length, innerHeight / partyIds.length);
  const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]);

  const heatMapData: { party1: string; party2: string; alignment: number }[] = [];
  partyIds.forEach(party1 => {
    partyIds.forEach(party2 => {
      const rawAlignmentDirect = dataCache.coalitionAlignment?.[party1]?.[party2];
      const rawAlignmentReverse = dataCache.coalitionAlignment?.[party2]?.[party1];
      const alignmentSource = typeof rawAlignmentDirect === 'number' ? rawAlignmentDirect : (typeof rawAlignmentReverse === 'number' ? rawAlignmentReverse : 0.5);
      const alignmentVal = party1 === party2 ? 1.0 : alignmentSource;
      heatMapData.push({ party1, party2, alignment: alignmentVal });
    });
  });

  g.selectAll('rect').data(heatMapData).enter().append('rect')
    .attr('x', (d: any) => partyIds.indexOf(d.party2) * cellSize).attr('y', (d: any) => partyIds.indexOf(d.party1) * cellSize)
    .attr('width', cellSize).attr('height', cellSize).attr('fill', (d: any) => colorScale(d.alignment)).attr('stroke', '#fff').attr('stroke-width', 1).style('cursor', 'pointer')
    .on('mouseover', function(event: any, d: any) { showTooltip(event, `${PARTIES[d.party1].name} ↔ ${PARTIES[d.party2].name}<br>Alignment: ${(d.alignment * 100).toFixed(0)}%`); })
    .on('mouseout', hideTooltip);

  g.selectAll('.row-label').data(partyIds).enter().append('text').attr('class', 'row-label').attr('x', -10).attr('y', (_d: any, i: number) => i * cellSize + cellSize / 2).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').attr('font-size', '12px').attr('fill', 'var(--text-color)').text((d: any) => PARTIES[d].name);
  g.selectAll('.col-label').data(partyIds).enter().append('text').attr('class', 'col-label').attr('x', (_d: any, i: number) => i * cellSize + cellSize / 2).attr('y', -10).attr('text-anchor', 'middle').attr('font-size', '12px').attr('fill', 'var(--text-color)').text((d: any) => d);
  svg.append('text').attr('x', width / 2).attr('y', 20).attr('text-anchor', 'middle').attr('font-size', '14px').attr('font-weight', 'bold').attr('fill', 'var(--text-color)').text('Party Voting Alignment Matrix');
}

function renderVotingAnomalyChart(): void {
  const canvas = document.getElementById('votingAnomalyChart') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const datasets = Object.keys(PARTIES).map(partyId => {
    const partyData = (dataCache.votingAnomalies || []).filter(a => a.party === partyId);
    return {
      label: PARTIES[partyId].name,
      data: partyData.map(a => ({ x: new Date(a.date).getTime(), y: a.deviation })),
      backgroundColor: PARTIES[partyId].color,
      borderColor: PARTIES[partyId].color,
      pointRadius: 6, pointHoverRadius: 8
    };
  });

  new Chart(ctx, {
    type: 'scatter', data: { datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: 'Voting Anomalies (Last 5 Years)', font: { size: 16, weight: 'bold' } }, tooltip: { callbacks: { label: (context: any) => { const date = new Date(context.parsed.x); return `${context.dataset.label}: Deviation ${context.parsed.y.toFixed(2)} on ${date.toLocaleDateString()}`; } } }, legend: { display: true, position: 'bottom' } },
      scales: { x: { type: 'linear', title: { display: true, text: 'Date' }, ticks: { callback: (value: any) => new Date(value).getFullYear().toString() } }, y: { title: { display: true, text: 'Deviation Score' }, beginAtZero: true } }
    }
  });
}

function renderBehavioralPatternsChart(): void {
  const canvas = document.getElementById('behavioralPatternsChart') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const partyIds = Object.keys(PARTIES);

  new Chart(ctx, {
    type: 'bar',
    data: { labels: partyIds.map(id => PARTIES[id].name), datasets: [{ label: 'Party Consistency Score (%)', data: partyIds.map(id => dataCache.behavioralPatterns?.[id] || 80), backgroundColor: partyIds.map(id => PARTIES[id].color), borderColor: partyIds.map(id => PARTIES[id].color), borderWidth: 1 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: 'Party Voting Consistency (2019-2024)', font: { size: 16, weight: 'bold' } }, legend: { display: false }, tooltip: { callbacks: { label: (context: any) => `Consistency: ${context.parsed.x.toFixed(1)}%` } } },
      scales: { x: { beginAtZero: true, max: 100, title: { display: true, text: 'Consistency Score (%)' } } }
    }
  });
}

function renderDecisionTrendsChart(): void {
  const canvas = document.getElementById('decisionTrendsChart') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let years: number[] = [];
  let useRealData = false;

  if (dataCache.annualVotes && Object.keys(dataCache.annualVotes).length > 0) {
    const allYears = new Set<number>();
    Object.values(dataCache.annualVotes).forEach(partyData => { partyData.forEach(d => allYears.add(d.year)); });
    years = Array.from(allYears).sort((a, b) => a - b);
    useRealData = true;
  }
  if (years.length === 0) { for (let year = 1990; year <= 2026; year++) years.push(year); }

  const datasets = Object.keys(PARTIES).map(partyId => {
    let data: number[];
    if (useRealData && dataCache.annualVotes?.[partyId]) {
      const partyYearData: Record<number, number> = {};
      dataCache.annualVotes[partyId].forEach(d => { partyYearData[d.year] = d.votes; });
      data = years.map(year => partyYearData[year] || 0);
    } else { data = years.map(() => 0); }
    return { label: PARTIES[partyId].name, data, borderColor: PARTIES[partyId].color, backgroundColor: PARTIES[partyId].color + '20', tension: 0.4, fill: false };
  });

  new Chart(ctx, {
    type: 'line', data: { labels: years, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: `Annual Voting Activity Trends (${years[0]}-${years[years.length - 1]})`, font: { size: 16, weight: 'bold' } }, legend: { display: true, position: 'bottom' }, tooltip: { mode: 'index', intersect: false, callbacks: { label: (context: any) => context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' votes' } } },
      scales: { x: { title: { display: true, text: 'Year' } }, y: { title: { display: true, text: 'Number of Votes' }, beginAtZero: true } }
    }
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function createAccessibleNetworkTable(nodes: CoalitionNode[], links: CoalitionLink[]): void {
  const table = document.getElementById('coalitionNetworkTable');
  if (!table) return;
  let html = '<caption>Coalition Network Data</caption><thead><tr><th>Party</th><th>Influence</th><th>Coalition Partners</th></tr></thead><tbody>';
  nodes.forEach(n => {
    const partners = links
      .filter(l => (l.source.id || l.source) === n.id || (l.target.id || l.target) === n.id)
      .map(l => { const pid = (l.source.id || l.source) === n.id ? (l.target.id || l.target) : (l.source.id || l.source); return `${PARTIES[pid]?.name || pid} (${(l.strength * 100).toFixed(0)}%)`; })
      .join(', ');
    html += `<tr><td>${n.fullName}</td><td>${n.influence.toFixed(1)}</td><td>${partners}</td></tr>`;
  });
  html += '</tbody>';
  table.innerHTML = html;
}

function showTooltip(event: MouseEvent, content: string): void {
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

function hideTooltip(): void {
  const tooltip = document.getElementById('d3-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

function showLoadingState(): void {
  const container = document.getElementById('coalition-dashboard');
  if (container) container.classList.add('loading');
}

function hideLoadingState(): void {
  const container = document.getElementById('coalition-dashboard');
  if (container) container.classList.remove('loading');
}

function showErrorState(message: string): void {
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

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

function generateMockCoalitionData(): Record<string, Record<string, number>> {
  const data: Record<string, Record<string, number>> = {};
  const rightBloc = ['M', 'KD', 'L', 'SD'];
  const leftBloc = ['S', 'V', 'MP'];
  Object.keys(PARTIES).forEach(p1 => {
    data[p1] = {};
    Object.keys(PARTIES).forEach(p2 => {
      if (p1 !== p2) {
        const sameBloc = (rightBloc.includes(p1) && rightBloc.includes(p2)) || (leftBloc.includes(p1) && leftBloc.includes(p2));
        data[p1][p2] = sameBloc ? 0.70 : 0.35;
      }
    });
  });
  return data;
}

function generateMockBehavioralData(): Record<string, number> {
  const data: Record<string, number> = {};
  Object.keys(PARTIES).forEach(p => { data[p] = 80; });
  return data;
}

function generateMockDecisionData(): any[] { return []; }

function generateMockAnomalyData(): AnomalyEntry[] {
  // Deterministic fallback data when CIA anomaly data is unavailable
  const deviations: Record<string, number> = {
    'S': 1.85, 'M': 2.10, 'SD': 3.25, 'V': 1.45,
    'MP': 2.70, 'C': 1.30, 'L': 1.95, 'KD': 2.50
  };
  return Object.keys(PARTIES).map(party => ({
    party,
    date: '2024-06-15',
    deviation: deviations[party] || 1.50,
    severity: (deviations[party] || 1.50) > 3 ? 'critical' : (deviations[party] || 1.50) > 2 ? 'major' : 'minor'
  }));
}

function generateMockAnnualVotesData(): Record<string, AnnualVoteEntry[]> {
  // Deterministic fallback data for annual vote trends
  const data: Record<string, AnnualVoteEntry[]> = {};
  const partyBaselines: Record<string, number> = {
    'S': 50000, 'M': 35000, 'SD': 25000, 'V': 12000,
    'MP': 10000, 'C': 12000, 'L': 10000, 'KD': 10000
  };
  Object.keys(PARTIES).forEach(party => {
    data[party] = [];
    const baseline = partyBaselines[party] || 15000;
    for (let year = 2002; year <= 2025; year++) {
      // Deterministic variation: alternates ±10% based on year parity
      const variation = year % 2 === 0 ? 0.9 : 1.1;
      data[party].push({ year, votes: Math.round(baseline * variation) });
    }
  });
  return data;
}

// ============================================================================
// EXPORTED INIT
// ============================================================================

export async function init(): Promise<void> {
  const dashboard = document.getElementById('coalition-dashboard');
  if (!dashboard) return;

  try {
    logger.info('Initializing Coalition & Voting Pattern Dashboard...');
    coalitionDataSourceType = 'live';
    showLoadingState();

    await Promise.all([
      fetchCoalitionData(),
      fetchBehavioralData(),
      fetchDecisionData(),
      fetchAnomalyData(),
      fetchAnnualVotesData()
    ]);

    showDataSourceDisclaimer(dashboard, coalitionDataSourceType);

    renderCoalitionNetwork();
    renderAlignmentHeatMap();
    renderVotingAnomalyChart();
    renderBehavioralPatternsChart();
    renderDecisionTrendsChart();

    hideLoadingState();
    logger.info('Coalition Dashboard initialized successfully');
  } catch (error) {
    logger.error('Dashboard initialization failed:', error);
    showErrorState(error instanceof Error ? error.message : String(error));
  }
}
