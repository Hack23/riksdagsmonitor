/**
 * @module Analytics/CommitteeIntelligence
 * @category Analytics
 *
 * @title Committee Performance & Network Analytics Dashboard - Organizational Intelligence
 *
 * @description
 * Interactive visualization and analysis of Swedish Riksdag committee structure,
 * productivity, and decision patterns. Committees are where legislative power
 * actually accumulates and policy details get hammered out.
 *
 * @author Hack23 AB
 * @license Apache-2.0

 *
 * @intelligence Committee Performance & Network Analytics — organizational intelligence analyzing Swedish Riksdag committee structure, productivity patterns, and decision-making networks. Committees are where legislative power accumulates and policy details are negotiated.
 *
 * @business Institutional analysis product — committee analytics serve researchers (legislative studies), journalists (committee coverage), and corporate affairs teams (regulatory tracking). Unique data product differentiating from vote-only parliamentary trackers.
 *
 * @marketing Expert audience engagement — committee analysis content attracts high-value audiences: policy researchers, lobbyists, and legislative affairs professionals. This audience has high conversion potential for premium analytics and API subscriptions.
 * */

import { logger, showDataSourceDisclaimer } from '../shared/index.js';

/* ------------------------------------------------------------------ */
/*  Global library references (loaded via <script> tags)              */
/* ------------------------------------------------------------------ */

const d3 = (globalThis as any).d3;
const Chart = (globalThis as any).Chart;
const Papa = (globalThis as any).Papa;

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
/* ------------------------------------------------------------------ */

interface CommitteeDefinition {
  code: string;
  name: string;
  nameLocalized: Record<string, string>;
  color: string;
  domain: string;
}

interface CommitteeConfig {
  dataUrls: Record<string, string[]>;
  cache: { enabled: boolean; ttl: number; prefix: string };
  committees: CommitteeDefinition[];
  dimensions: {
    network: { width: number; height: number };
    heatmap: { width: number; height: number };
    chart: { aspectRatio: number };
  };
}

interface NetworkNode {
  id: string;
  code: string;
  name: string;
  color: string;
  productivity: number;
  decisions: number;
  radius: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  value: number;
}

interface HeatMapCell {
  committee: string;
  year: string;
  value: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface AllCommitteeData {
  productivityMatrix: any[];
  committeeDecisions: any[];
  annualDocuments: any[];
  ballotSummary: any[];
  seasonalPatterns: any[];
}

interface VisualizationInstances {
  network: NetworkDiagram;
  heatmap: ProductivityHeatMap;
  charts: ChartJSVisualizations;
}

/* ------------------------------------------------------------------ */
/*  Configuration                                                     */
/* ------------------------------------------------------------------ */

const CONFIG: CommitteeConfig = {
  dataUrls: {
    productivityMatrix: [
      'cia-data/distribution_committee_productivity_matrix.csv',
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_committee_productivity_matrix.csv',
    ],
    committeeDecisions: [
      'cia-data/view_riksdagen_committee_decisions.csv',
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_committee_decisions_sample.csv',
    ],
    annualDocuments: [
      'cia-data/distribution_annual_committee_documents.csv',
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_annual_committee_documents.csv',
    ],
    ballotSummary: [
      'cia-data/view_riksdagen_committee_ballot_decision_party_summary.csv',
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_committee_ballot_decision_party_summary_sample.csv',
    ],
    seasonalPatterns: [
      'cia-data/percentile_seasonal_activity_patterns.csv',
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/percentile_seasonal_activity_patterns.csv',
    ],
  },

  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    prefix: 'riksdag_committee_',
  },

  committees: [
    { code: 'AU',   name: 'Foreign Affairs Committee',       nameLocalized: { sv: 'Utrikesutskottet',                en: 'Foreign Affairs Committee' },         color: '#1e88e5', domain: 'Foreign Policy' },
    { code: 'CU',   name: 'Civil Affairs Committee',         nameLocalized: { sv: 'Civilutskottet',                  en: 'Civil Affairs Committee' },           color: '#43a047', domain: 'Civil Law' },
    { code: 'FiU',  name: 'Finance Committee',               nameLocalized: { sv: 'Finansutskottet',                 en: 'Finance Committee' },                 color: '#fb8c00', domain: 'Economics' },
    { code: 'FöU',  name: 'Defense Committee',               nameLocalized: { sv: 'Försvarsutskottet',               en: 'Defense Committee' },                 color: '#e53935', domain: 'National Security' },
    { code: 'JuU',  name: 'Justice Committee',               nameLocalized: { sv: 'Justitieutskottet',               en: 'Justice Committee' },                 color: '#8e24aa', domain: 'Justice' },
    { code: 'KU',   name: 'Constitutional Committee',        nameLocalized: { sv: 'Konstitutionsutskottet',           en: 'Constitutional Committee' },          color: '#3949ab', domain: 'Constitution' },
    { code: 'KrU',  name: 'Cultural Affairs Committee',      nameLocalized: { sv: 'Kulturutskottet',                 en: 'Cultural Affairs Committee' },        color: '#00acc1', domain: 'Culture' },
    { code: 'MjU',  name: 'Environment Committee',           nameLocalized: { sv: 'Miljö- och jordbruksutskottet',   en: 'Environment Committee' },             color: '#7cb342', domain: 'Environment' },
    { code: 'NU',   name: 'Business Committee',              nameLocalized: { sv: 'Näringsutskottet',                en: 'Business Committee' },                color: '#ff6f00', domain: 'Business' },
    { code: 'SkU',  name: 'Taxation Committee',              nameLocalized: { sv: 'Skatteutskottet',                 en: 'Taxation Committee' },                color: '#d32f2f', domain: 'Taxation' },
    { code: 'SoU',  name: 'Social Insurance Committee',      nameLocalized: { sv: 'Socialförsäkringsutskottet',       en: 'Social Insurance Committee' },        color: '#c2185b', domain: 'Social Welfare' },
    { code: 'TU',   name: 'Transport Committee',             nameLocalized: { sv: 'Trafikutskottet',                 en: 'Transport Committee' },               color: '#0097a7', domain: 'Transportation' },
    { code: 'UbU',  name: 'Education Committee',             nameLocalized: { sv: 'Utbildningsutskottet',            en: 'Education Committee' },               color: '#5e35b1', domain: 'Education' },
    { code: 'UFöU', name: 'Foreign Defense Committee',       nameLocalized: { sv: 'Utrikes- och försvarsutskottet',  en: 'Foreign Defense Committee' },         color: '#f57c00', domain: 'Security Policy' },
    { code: 'UU',   name: 'Foreign Affairs Sub-Committee',   nameLocalized: { sv: 'Utrikesutskottets underutskott',  en: 'Foreign Affairs Sub-Committee' },     color: '#1565c0', domain: 'Foreign Policy' },
  ],

  dimensions: {
    network: { width: 1200, height: 700 },
    heatmap: { width: 1200, height: 600 },
    chart:   { aspectRatio: 2 },
  },
};

/* ------------------------------------------------------------------ */
/*  DataManager                                                       */
/* ------------------------------------------------------------------ */

class DataManager {

  constructor() {
  }

  /** Fetch CSV data with caching & fallback URLs. */
  async fetchData(key: string, url: string | string[]): Promise<any[]> {
    if (CONFIG.cache.enabled) {
      const cached = this.getCached(key);
      if (cached) {
        logger.info(`[DataManager] Using cached data for ${key}`);
        return cached;
      }
    }

    const urls = Array.isArray(url) ? url : [url];
    let lastError: Error | null = null;

    for (let i = 0; i < urls.length; i++) {
      const currentUrl = urls[i];
      try {
        logger.info(`[DataManager] Fetching ${key} from ${currentUrl}`);
        const response = await fetch(currentUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvText = await response.text();

        if (typeof Papa === 'undefined') {
          throw new Error('Papa Parse library not loaded');
        }

        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        if (parsed.errors.length > 0) {
          logger.warn(`[DataManager] CSV parsing warnings for ${key}:`, parsed.errors);
        }

        const data = parsed.data as any[];

        if (CONFIG.cache.enabled) {
          this.setCached(key, data);
        }

        logger.info(`[DataManager] Successfully loaded ${key} from ${i === 0 ? 'local' : 'remote'} source`);
        return data;
      } catch (error: any) {
        logger.warn(`[DataManager] Failed to fetch ${key} from ${currentUrl}:`, error.message);
        lastError = error;
      }
    }

    logger.error(`[DataManager] All sources failed for ${key}`);
    throw lastError || new Error(`Failed to fetch ${key} from any source`);
  }

  /** Read from localStorage cache. */
  private getCached(key: string): any[] | null {
    const cacheKey = CONFIG.cache.prefix + key;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached) as CacheEntry<any[]>;
      const age = Date.now() - timestamp;

      if (age < CONFIG.cache.ttl) {
        return data;
      }
      localStorage.removeItem(cacheKey);
      return null;
    } catch {
      try { localStorage.removeItem(cacheKey); } catch { /* ignore */ }
      return null;
    }
  }

  /** Write to localStorage cache. */
  private setCached(key: string, data: any[]): void {
    const cacheKey = CONFIG.cache.prefix + key;
    const cacheData: CacheEntry<any[]> = { data, timestamp: Date.now() };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error: any) {
      logger.warn(`[DataManager] Failed to cache ${key}:`, error);
    }
  }

  /** Load all five committee data sources in parallel. */
  async loadAllData(): Promise<AllCommitteeData> {
    try {
      const [
        productivityMatrix,
        committeeDecisions,
        annualDocuments,
        ballotSummary,
        seasonalPatterns,
      ] = await Promise.all([
        this.fetchData('productivityMatrix', CONFIG.dataUrls.productivityMatrix),
        this.fetchData('committeeDecisions', CONFIG.dataUrls.committeeDecisions),
        this.fetchData('annualDocuments', CONFIG.dataUrls.annualDocuments),
        this.fetchData('ballotSummary', CONFIG.dataUrls.ballotSummary),
        this.fetchData('seasonalPatterns', CONFIG.dataUrls.seasonalPatterns),
      ]);

      return { productivityMatrix, committeeDecisions, annualDocuments, ballotSummary, seasonalPatterns };
    } catch (error) {
      logger.error('[DataManager] Failed to load all data:', error);
      throw error;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  D3.js Network Diagram                                             */
/* ------------------------------------------------------------------ */

class NetworkDiagram {
  private containerId: string;
  private data: AllCommitteeData;
  private svg: any;
  private simulation: any;

  constructor(containerId: string, data: AllCommitteeData) {
    this.containerId = containerId;
    this.data = data;
    this.svg = null;
    this.simulation = null;
  }

  /** Render force-directed network diagram. */
  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) {
      logger.error(`[NetworkDiagram] Container ${this.containerId} not found`);
      return;
    }

    container.innerHTML = '';

    const containerWidth = container.clientWidth;
    const width = Math.min(containerWidth, CONFIG.dimensions.network.width);
    const height = Math.min(width * 0.6, CONFIG.dimensions.network.height);

    this.svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Committee network connections diagram')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', 'var(--card-bg)');

    const { nodes, links } = this.processNetworkData();

    this.simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 10));

    const link = this.svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value) * 2)
      .attr('stroke-opacity', 0.6);

    const node = this.svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('tabindex', '0')
      .attr('role', 'button')
      .attr('aria-label', (d: any) => `${d.name} committee with ${d.productivity} productivity score`)
      .call(
        d3
          .drag()
          .on('start', (event: any) => this.dragStarted(event))
          .on('drag', (event: any) => this.dragged(event))
          .on('end', (event: any) => this.dragEnded(event)),
      );

    node
      .append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => d.color)
      .attr('stroke', 'var(--card-bg)')
      .attr('stroke-width', 2);

    node
      .append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', 'var(--text-color)')
      .text((d: any) => d.code);

    node
      .append('title')
      .text((d: any) => `${d.name}\nProductivity: ${d.productivity}\nDecisions: ${d.decisions}`);

    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    this.addLegend(width, height);
    this.updateAccessibleTable(nodes, links);
  }

  /** Build nodes & links from productivity data. */
  private processNetworkData(): { nodes: NetworkNode[]; links: NetworkLink[] } {
    const prodLookup: Record<string, number> = {};
    const decisionsLookup: Record<string, number> = {};

    if (this.data?.productivityMatrix) {
      for (const row of this.data.productivityMatrix) {
        const code = row.committee_code || '';
        if (code && !prodLookup[code]) {
          const level = (row.productivity_level || '').toUpperCase();
          prodLookup[code] =
            level === 'HIGHLY_PRODUCTIVE' ? 95 :
            level === 'PRODUCTIVE' ? 80 :
            level === 'MODERATELY_PRODUCTIVE' ? 65 : 50;
        }
      }
    }

    if (this.data?.annualDocuments) {
      for (const row of this.data.annualDocuments) {
        const code = row.committee || '';
        const count = parseInt(row.doc_count) || 0;
        if (code) {
          decisionsLookup[code] = (decisionsLookup[code] || 0) + count;
        }
      }
    }

    const nodes: NetworkNode[] = CONFIG.committees.map((committee) => {
      const productivity = prodLookup[committee.code] || 70;
      const decisions = decisionsLookup[committee.code] || 50;
      return {
        id: committee.code,
        code: committee.code,
        name: committee.name,
        color: committee.color,
        productivity,
        decisions,
        radius: 15 + (productivity / 100) * 20,
      };
    });

    const links: NetworkLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const prodDiff = Math.abs(nodes[i].productivity - nodes[j].productivity);
        if (prodDiff < 20) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: 10 - prodDiff / 2,
          });
        }
      }
    }

    return { nodes, links };
  }

  /** SVG legend for the network diagram. */
  private addLegend(_width: number, height: number): void {
    const legend = this.svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, ${height - 80})`);

    legend
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', 'var(--text-color)')
      .text('Node size = Productivity score');

    legend
      .append('text')
      .attr('x', 0)
      .attr('y', 20)
      .attr('font-size', '12px')
      .attr('fill', 'var(--text-secondary)')
      .text('Link width = Relationship strength');
  }

  /** Build accessible HTML table from nodes and links. */
  private updateAccessibleTable(nodes: NetworkNode[], links: NetworkLink[]): void {
    const table = document.getElementById('committeeNetworkTable');
    if (!table) return;

    let html = '<caption>Committee Network Connections</caption>';
    html += '<thead><tr><th>Committee</th><th>Productivity</th><th>Decisions</th><th>Connections</th></tr></thead>';
    html += '<tbody>';

    for (const node of nodes) {
      const connections = links.filter((l) => {
        const sourceId = typeof l.source === 'string' ? l.source : (l.source as any)?.id;
        const targetId = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
        return sourceId === node.id || targetId === node.id;
      }).length;
      html += `<tr>
        <td>${node.name} (${node.code})</td>
        <td>${node.productivity.toFixed(1)}</td>
        <td>${node.decisions}</td>
        <td>${connections}</td>
      </tr>`;
    }

    html += '</tbody>';
    table.innerHTML = html;
  }

  /* Drag handlers */
  private dragStarted(event: any): void {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  private dragged(event: any): void {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  private dragEnded(event: any): void {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}

/* ------------------------------------------------------------------ */
/*  D3.js Productivity Heat Map                                       */
/* ------------------------------------------------------------------ */

class ProductivityHeatMap {
  private containerId: string;
  private data: AllCommitteeData;
  private svg: any;

  constructor(containerId: string, data: AllCommitteeData) {
    this.containerId = containerId;
    this.data = data;
    this.svg = null;
  }

  /** Render the productivity heat map. */
  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) {
      logger.error(`[ProductivityHeatMap] Container ${this.containerId} not found`);
      return;
    }

    container.innerHTML = '';

    const containerWidth = container.clientWidth;
    const width = Math.min(containerWidth, CONFIG.dimensions.heatmap.width);
    const height = Math.min(width * 0.5, CONFIG.dimensions.heatmap.height);

    const margin = { top: 80, right: 100, bottom: 60, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    this.svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Committee productivity matrix over time')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', 'var(--card-bg)');

    const g = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const { matrix, years, committees } = this.processHeatMapData();

    const xScale = d3.scaleBand().domain(years).range([0, innerWidth]).padding(0.05);
    const yScale = d3.scaleBand().domain(committees).range([0, innerHeight]).padding(0.05);
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 100]);

    g.selectAll('rect')
      .data(matrix)
      .enter()
      .append('rect')
      .attr('x', (d: any) => xScale(d.year))
      .attr('y', (d: any) => yScale(d.committee))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: any) => colorScale(d.value))
      .attr('stroke', 'var(--card-bg)')
      .attr('stroke-width', 1)
      .attr('tabindex', '0')
      .attr('role', 'button')
      .attr('aria-label', (d: any) => `${d.committee} in ${d.year}: ${d.value.toFixed(1)} productivity`)
      .on('mouseover', function (this: SVGRectElement) {
        d3.select(this).attr('stroke', 'var(--accent-color)').attr('stroke-width', 2);
      })
      .on('mouseout', function (this: SVGRectElement) {
        d3.select(this).attr('stroke', 'var(--card-bg)').attr('stroke-width', 1);
      })
      .append('title')
      .text((d: any) => `${d.committee} (${d.year})\nProductivity: ${d.value.toFixed(1)}`);

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
    this.svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', 'var(--text-color)')
      .text('Committee Productivity Over Time (2020-2026)');

    this.addColorLegend(g, colorScale, innerWidth, innerHeight);
    this.updateAccessibleTable(matrix);
  }

  /** Convert productivity data into a flat matrix of cells. */
  private processHeatMapData(): { matrix: HeatMapCell[]; years: string[]; committees: string[] } {
    const committees = CONFIG.committees.map((c) => c.code);

    const dataLookup: Record<string, number> = {};
    if (this.data?.productivityMatrix) {
      for (const row of this.data.productivityMatrix) {
        const code = row.committee_code || '';
        const year = row.year || '';
        if (code && year) {
          const level = (row.productivity_level || '').toUpperCase();
          const value =
            level === 'HIGHLY_PRODUCTIVE' ? 90 :
            level === 'PRODUCTIVE' ? 75 :
            level === 'MODERATELY_PRODUCTIVE' ? 55 :
            level === 'INACTIVE' ? 15 : 40;
          dataLookup[`${code}_${year}`] = value;
        }
      }
    }

    const yearSet = new Set<string>();
    if (this.data?.productivityMatrix) {
      for (const row of this.data.productivityMatrix) {
        if (row.year) yearSet.add(String(row.year));
      }
    }
    const years =
      yearSet.size > 0
        ? Array.from(yearSet).sort()
        : ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];

    const matrix: HeatMapCell[] = [];
    for (const committee of committees) {
      for (const year of years) {
        matrix.push({
          committee,
          year,
          value: dataLookup[`${committee}_${year}`] || 50,
        });
      }
    }

    return { matrix, years, committees };
  }

  /** Add a gradient color legend below the heatmap. */
  private addColorLegend(g: any, _colorScale: any, innerWidth: number, innerHeight: number): void {
    const legendWidth = 200;
    const legendHeight = 15;

    const legend = g
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth - legendWidth}, ${innerHeight + 40})`);

    const defs = this.svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'productivity-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.interpolateRdYlGn(0));
    gradient.append('stop').attr('offset', '50%').attr('stop-color', d3.interpolateRdYlGn(0.5));
    gradient.append('stop').attr('offset', '100%').attr('stop-color', d3.interpolateRdYlGn(1));

    legend.append('rect').attr('width', legendWidth).attr('height', legendHeight).style('fill', 'url(#productivity-gradient)');

    legend.append('text').attr('x', 0).attr('y', -5).attr('font-size', '12px').attr('fill', 'var(--text-color)').text('Low');
    legend.append('text').attr('x', legendWidth).attr('y', -5).attr('text-anchor', 'end').attr('font-size', '12px').attr('fill', 'var(--text-color)').text('High');
  }

  /** Accessible HTML table fallback. */
  private updateAccessibleTable(matrix: HeatMapCell[]): void {
    const table = document.getElementById('productivityMatrixTable');
    if (!table) return;

    const years = [...new Set(matrix.map((d) => d.year))];
    const committees = [...new Set(matrix.map((d) => d.committee))];

    let html = '<caption>Committee Productivity Matrix (2020-2026)</caption>';
    html += '<thead><tr><th>Committee</th>';
    for (const year of years) {
      html += `<th>${year}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (const committee of committees) {
      html += `<tr><td>${committee}</td>`;
      for (const year of years) {
        const cell = matrix.find((d) => d.committee === committee && d.year === year);
        html += `<td>${cell ? cell.value.toFixed(1) : 'N/A'}</td>`;
      }
      html += '</tr>';
    }

    html += '</tbody>';
    table.innerHTML = html;
  }
}

/* ------------------------------------------------------------------ */
/*  Chart.js Visualizations                                           */
/* ------------------------------------------------------------------ */

class ChartJSVisualizations {
  private charts: Record<string, any>;

  constructor() {
    this.charts = {};
  }

  /** Render all Chart.js panels. */
  renderAll(data: AllCommitteeData): void {
    this.renderCommitteeComparison(data);
    this.renderDecisionEffectiveness(data);
    this.renderSeasonalPatterns(data);
  }

  /** Committee comparison bar chart. */
  private renderCommitteeComparison(data: AllCommitteeData): void {
    const canvas = document.getElementById('committeeComparisonChart') as HTMLCanvasElement | null;
    if (!canvas) {
      logger.error('[ChartJS] committeeComparisonChart canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    const labels = CONFIG.committees.map((c) => c.code);

    const prodLookup: Record<string, number> = {};
    if (data?.productivityMatrix) {
      for (const row of data.productivityMatrix) {
        const code = row.committee_code || '';
        if (code && !prodLookup[code]) {
          const level = (row.productivity_level || '').toUpperCase();
          prodLookup[code] =
            level === 'HIGHLY_PRODUCTIVE' ? 90 :
            level === 'PRODUCTIVE' ? 75 :
            level === 'MODERATELY_PRODUCTIVE' ? 55 :
            level === 'INACTIVE' ? 15 : 40;
        }
      }
    }

    const productivity = labels.map((code) => prodLookup[code] || 50);
    const colors = CONFIG.committees.map((c) => c.color);

    if (this.charts.comparison) {
      this.charts.comparison.destroy();
    }

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');

    this.charts.comparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Productivity Score',
            data: productivity,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          title: { display: true, text: 'Committee Productivity Comparison', color: textColor, font: { size: 16, weight: 'bold' } },
          legend: { display: false },
          tooltip: { callbacks: { label: (context: any) => `Productivity: ${context.parsed.y.toFixed(1)}` } },
        },
        scales: {
          y: { beginAtZero: true, max: 100, title: { display: true, text: 'Productivity Score (0-100)', color: textColor }, ticks: { color: textColor }, grid: { color: borderColor } },
          x: { title: { display: true, text: 'Committee', color: textColor }, ticks: { color: textColor }, grid: { color: borderColor } },
        },
      },
    });
  }

  /** Decision effectiveness stacked bar chart. */
  private renderDecisionEffectiveness(data: AllCommitteeData): void {
    const canvas = document.getElementById('decisionEffectivenessChart') as HTMLCanvasElement | null;
    if (!canvas) {
      logger.error('[ChartJS] decisionEffectivenessChart canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');

    const yearSet = new Set<string>();
    if (data?.annualDocuments) {
      for (const row of data.annualDocuments) {
        if (row.year) yearSet.add(String(row.year));
      }
    }
    const allYears = yearSet.size > 0 ? Array.from(yearSet).sort() : ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
    const labels = allYears.slice(-7);

    const yearDocCounts: Record<string, number> = {};
    if (data?.annualDocuments) {
      for (const row of data.annualDocuments) {
        const year = String(row.year);
        const count = parseInt(row.doc_count) || 0;
        yearDocCounts[year] = (yearDocCounts[year] || 0) + count;
      }
    }

    const approved = labels.map((year) => {
      const total = yearDocCounts[year] || 100;
      return Math.min(100, total > 0 ? 70 : 0);
    });
    const rejected = labels.map((year) => {
      const total = yearDocCounts[year] || 100;
      return total > 0 ? 20 : 0;
    });
    const pending = labels.map((_, i) => Math.max(0, 100 - approved[i] - rejected[i]));

    if (this.charts.effectiveness) {
      this.charts.effectiveness.destroy();
    }

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');

    this.charts.effectiveness = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Approved', data: approved, backgroundColor: '#7cb342', borderColor: '#7cb342', borderWidth: 1 },
          { label: 'Rejected', data: rejected, backgroundColor: '#e53935', borderColor: '#e53935', borderWidth: 1 },
          { label: 'Pending', data: pending, backgroundColor: '#fb8c00', borderColor: '#fb8c00', borderWidth: 1 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          title: { display: true, text: 'Decision Outcomes by Year', color: textColor, font: { size: 16, weight: 'bold' } },
          legend: { labels: { color: textColor } },
          tooltip: { callbacks: { label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%` } },
        },
        scales: {
          x: { stacked: true, title: { display: true, text: 'Year', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
          y: { stacked: true, beginAtZero: true, max: 100, title: { display: true, text: 'Percentage (%)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
        },
      },
    });
  }

  /** Seasonal activity line chart. */
  private renderSeasonalPatterns(data: AllCommitteeData): void {
    const canvas = document.getElementById('seasonalPatternsChart') as HTMLCanvasElement | null;
    if (!canvas) {
      logger.error('[ChartJS] seasonalPatternsChart canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];

    const yearQuarterData: Record<string, Record<number, number>> = {};
    if (data?.seasonalPatterns) {
      for (const row of data.seasonalPatterns) {
        const year = String(row.year || '');
        const quarter = parseInt(row.quarter) || 0;
        if (year && quarter >= 1 && quarter <= 4) {
          if (!yearQuarterData[year]) yearQuarterData[year] = {};
          yearQuarterData[year][quarter] = parseFloat(row.median || row.total_ballots || row.value || 0);
        }
      }
    }

    const availableYears = Object.keys(yearQuarterData).sort().slice(-3);
    const yearColors = ['#1e88e5', '#43a047', '#fb8c00'];

    const datasets =
      availableYears.length > 0
        ? availableYears.map((year, idx) => ({
            label: year,
            data: [1, 2, 3, 4].map((q) => yearQuarterData[year][q] || 0),
            borderColor: yearColors[idx % yearColors.length],
            backgroundColor: yearColors[idx % yearColors.length] + '1A',
            tension: 0.4,
          }))
        : [
            { label: '2024', data: [0, 0, 0, 0], borderColor: '#1e88e5', backgroundColor: 'rgba(30, 136, 229, 0.1)', tension: 0.4 },
            { label: '2025', data: [0, 0, 0, 0], borderColor: '#43a047', backgroundColor: 'rgba(67, 160, 71, 0.1)', tension: 0.4 },
            { label: '2026', data: [0, 0, 0, 0], borderColor: '#fb8c00', backgroundColor: 'rgba(251, 140, 0, 0.1)', tension: 0.4 },
          ];

    if (this.charts.seasonal) {
      this.charts.seasonal.destroy();
    }

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');

    this.charts.seasonal = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 3,
        plugins: {
          title: { display: true, text: 'Quarterly Activity Patterns (2023-2025)', color: textColor, font: { size: 16, weight: 'bold' } },
          legend: { labels: { color: textColor } },
          tooltip: { callbacks: { label: (context: any) => `${context.dataset.label}: ${context.parsed.y} activity score` } },
        },
        scales: {
          y: { beginAtZero: true, max: 100, title: { display: true, text: 'Activity Score', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
          x: { title: { display: true, text: 'Quarter', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
        },
      },
    });
  }

  /** Destroy all Chart.js instances. */
  destroy(): void {
    for (const key of Object.keys(this.charts)) {
      if (this.charts[key] && typeof this.charts[key].destroy === 'function') {
        this.charts[key].destroy();
      }
    }
    this.charts = {};
  }
}

/* ------------------------------------------------------------------ */
/*  Loading / Error helpers                                           */
/* ------------------------------------------------------------------ */

function showLoadingIndicator(): void {
  const dashboard = document.getElementById('committee-dashboard');
  if (!dashboard) return;

  const existing = document.getElementById('committee-loading');
  if (existing) existing.remove();

  const indicator = document.createElement('div');
  indicator.id = 'committee-loading';
  indicator.className = 'loading-indicator';
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-live', 'polite');

  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  indicator.appendChild(spinner);

  const text = document.createElement('p');
  text.textContent = 'Loading committee data...';
  indicator.appendChild(text);

  dashboard.insertBefore(indicator, dashboard.firstChild);
}

function hideLoadingIndicator(): void {
  const indicator = document.getElementById('committee-loading');
  if (indicator) indicator.remove();
}

function showErrorMessage(message: string): void {
  const dashboard = document.getElementById('committee-dashboard');
  if (!dashboard) return;

  const error = document.createElement('div');
  error.className = 'error-message';
  error.setAttribute('role', 'alert');

  const heading = document.createElement('h3');
  heading.textContent = '\u26a0\ufe0f Error Loading Committee Dashboard';
  error.appendChild(heading);

  const messageParagraph = document.createElement('p');
  messageParagraph.textContent = message;
  error.appendChild(messageParagraph);

  const supportParagraph = document.createElement('p');
  supportParagraph.textContent = 'Please refresh the page or contact support if the issue persists.';
  error.appendChild(supportParagraph);

  dashboard.insertBefore(error, dashboard.firstChild);
  hideLoadingIndicator();
}

/* ------------------------------------------------------------------ */
/*  Dashboard Initialization                                          */
/* ------------------------------------------------------------------ */

let visualizationInstances: VisualizationInstances | null = null;
let isInitializing = false;

async function initializeDashboard(): Promise<void> {
  const dashboardRoot = document.getElementById('committee-dashboard');
  if (!dashboardRoot) {
    logger.info('[CommitteeDashboard] Skipping initialization: #committee-dashboard container not found.');
    return;
  }

  if (isInitializing) {
    logger.info('[CommitteeDashboard] Already initializing, skipping duplicate call');
    return;
  }

  isInitializing = true;
  logger.info('[CommitteeDashboard] Initializing...');

  try {
    if (typeof d3 === 'undefined') throw new Error('D3.js not loaded. Please include D3.js library.');
    if (typeof Chart === 'undefined') throw new Error('Chart.js not loaded. Please include Chart.js library.');
    if (typeof Papa === 'undefined') throw new Error('Papa Parse not loaded. Please include Papa Parse library.');

    showLoadingIndicator();

    const dataManager = new DataManager();
    const data = await dataManager.loadAllData();
    logger.info('[CommitteeDashboard] Data loaded successfully');

    showDataSourceDisclaimer(dashboardRoot, 'live');

    if (visualizationInstances?.charts) {
      visualizationInstances.charts.destroy();
    }

    const network = new NetworkDiagram('committeeNetwork', data);
    network.render();

    const heatmap = new ProductivityHeatMap('productivityMatrix', data);
    heatmap.render();

    const charts = new ChartJSVisualizations();
    charts.renderAll(data);

    visualizationInstances = { network, heatmap, charts };

    hideLoadingIndicator();
    logger.info('[CommitteeDashboard] Initialization complete');
  } catch (error: any) {
    logger.error('[CommitteeDashboard] Initialization failed:', error);
    showErrorMessage(error.message);
  } finally {
    isInitializing = false;
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export async function init(): Promise<void> {
  await initializeDashboard();
}
