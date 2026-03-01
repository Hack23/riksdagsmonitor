/**
 * @module Analytics/CommitteeIntelligence/Charts
 * @description D3.js chart implementations for the Committee Intelligence Dashboard.
 *
 * Contains:
 * - **NetworkDiagram**: Force-directed graph showing committee relationship networks
 * - **ProductivityHeatMap**: Temporal heatmap of committee decision activity
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const d3: any;
import type { CommitteeData, NetworkNode, NetworkLink, HeatMapCell, HeatMapData } from './types.js';

// ==============================================
// D3.JS NETWORK DIAGRAM
// ==============================================

export class NetworkDiagram {
  private containerId: string;
  private data: CommitteeData;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  private simulation: d3.Simulation<NetworkNode, NetworkLink> | null;

  constructor(containerId: string, data: CommitteeData) {
    this.containerId = containerId;
    this.data = data;
    this.svg = null;
    this.simulation = null;
  }

  /**
   * Render force-directed network diagram
   */
  render(): void {
    const container: HTMLElement | null = document.getElementById(this.containerId);
    if (!container) {
      console.error(`[NetworkDiagram] Container ${this.containerId} not found`);
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Calculate responsive dimensions
    const containerWidth: number = container.clientWidth;
    const width: number = Math.min(containerWidth, CONFIG.dimensions.network.width);
    const height: number = Math.min(width * 0.6, CONFIG.dimensions.network.height);

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
    this.simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links).id((d: NetworkNode) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NetworkNode>().radius((d: NetworkNode) => d.radius + 10));

    // Add links
    const link = this.svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-width', (d: NetworkLink) => Math.sqrt(d.value) * 2)
      .attr('stroke-opacity', 0.6);

    // Add nodes
    const node = this.svg.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, NetworkNode>('g')
      .data(nodes)
      .enter().append('g')
      .attr('tabindex', '0')
      .attr('role', 'button')
      .attr('aria-label', (d: NetworkNode) => `${d.name} committee with ${d.productivity} productivity score`)
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on('start', (event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) => this.dragStarted(event))
        .on('drag', (event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) => this.dragged(event))
        .on('end', (event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) => this.dragEnded(event)));

    // Node circles
    node.append('circle')
      .attr('r', (d: NetworkNode) => d.radius)
      .attr('fill', (d: NetworkNode) => d.color)
      .attr('stroke', 'var(--card-bg)')
      .attr('stroke-width', 2);

    // Node labels
    node.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', 'var(--text-color)')
      .text((d: NetworkNode) => d.code);

    // Tooltips
    node.append('title')
      .text((d: NetworkNode) => `${d.name}\nProductivity: ${d.productivity}\nDecisions: ${d.decisions}`);

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: NetworkNode) => `translate(${d.x},${d.y})`);
    });

    // Add legend
    this.addLegend(width, height);

    // Update accessible table
    this.updateAccessibleTable(nodes, links);
  }

  /**
   * Process raw data into network format
   * @returns {{ nodes: NetworkNode[]; links: NetworkLink[] }} Nodes and links for network diagram
   */
  processNetworkData(): { nodes: NetworkNode[]; links: NetworkLink[] } {
    // Build a lookup from loaded committee productivity data
    const prodLookup: Record<string, number> = {};
    const decisionsLookup: Record<string, number> = {};
    
    if (this.data && this.data.productivityMatrix) {
      this.data.productivityMatrix.forEach((row: ProductivityMatrixRow) => {
        const code: string = row.committee_code || '';
        if (code && !prodLookup[code]) {
          const level: string = (row.productivity_level || '').toUpperCase();
          prodLookup[code] = level === 'HIGHLY_PRODUCTIVE' ? 95 : 
                             level === 'PRODUCTIVE' ? 80 : 
                             level === 'MODERATELY_PRODUCTIVE' ? 65 : 50;
        }
      });
    }
    
    if (this.data && this.data.annualDocuments) {
      this.data.annualDocuments.forEach((row: AnnualDocumentRow) => {
        const code: string = row.committee || '';
        const count: number = parseInt(String(row.doc_count)) || 0;
        if (code) {
          decisionsLookup[code] = (decisionsLookup[code] || 0) + count;
        }
      });
    }
    
    const nodes: NetworkNode[] = CONFIG.committees.map((committee: CommitteeDefinition) => {
      const productivity: number = prodLookup[committee.code] || 70;
      const decisions: number = decisionsLookup[committee.code] || 50;
      return {
        id: committee.code,
        code: committee.code,
        name: committee.name,
        color: committee.color,
        productivity: productivity,
        decisions: decisions,
        radius: 15 + (productivity / 100) * 20
      };
    });

    // Generate links based on shared document domains (committees with similar productivity)
    const links: NetworkLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // Link committees with similar productivity levels
        const prodDiff: number = Math.abs(nodes[i].productivity - nodes[j].productivity);
        if (prodDiff < 20) {
          links.push({
            source: nodes[i].id as any,
            target: nodes[j].id as any,
            value: 10 - prodDiff / 2
          });
        }
      }
    }

    return { nodes, links };
  }

  /**
   * Add legend to network diagram
   */
  addLegend(width: number, height: number): void {
    if (!this.svg) return;

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
  updateAccessibleTable(nodes: NetworkNode[], links: NetworkLink[]): void {
    const table: HTMLElement | null = document.getElementById('committeeNetworkTable');
    if (!table) return;

    let html: string = '<caption>Committee Network Connections</caption>';
    html += '<thead><tr><th>Committee</th><th>Productivity</th><th>Decisions</th><th>Connections</th></tr></thead>';
    html += '<tbody>';

    nodes.forEach((node: NetworkNode) => {
      // Handle both string and object types for source/target
      const connections: number = links.filter((l: NetworkLink) => {
        const sourceId: string = typeof l.source === 'string' ? l.source : (l.source as any)?.id ?? '';
        const targetId: string = typeof l.target === 'string' ? l.target : (l.target as any)?.id ?? '';
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
  dragStarted(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>): void {
    if (!event.active && this.simulation) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  dragged(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>): void {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  dragEnded(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>): void {
    if (!event.active && this.simulation) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}

// ==============================================
// D3.JS PRODUCTIVITY HEAT MAP
// ==============================================

export class ProductivityHeatMap {
  private containerId: string;
  private data: CommitteeData;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;

  constructor(containerId: string, data: CommitteeData) {
    this.containerId = containerId;
    this.data = data;
    this.svg = null;
  }

  /**
   * Render productivity heat map
   */
  render(): void {
    const container: HTMLElement | null = document.getElementById(this.containerId);
    if (!container) {
      console.error(`[ProductivityHeatMap] Container ${this.containerId} not found`);
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Calculate responsive dimensions
    const containerWidth: number = container.clientWidth;
    const width: number = Math.min(containerWidth, CONFIG.dimensions.heatmap.width);
    const height: number = Math.min(width * 0.5, CONFIG.dimensions.heatmap.height);

    const margin = { top: 80, right: 100, bottom: 60, left: 150 };
    const innerWidth: number = width - margin.left - margin.right;
    const innerHeight: number = height - margin.top - margin.bottom;

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
    const { matrix, years, committees }: HeatMapData = this.processHeatMapData();

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
      .attr('x', (d: HeatMapCell) => xScale(d.year) ?? 0)
      .attr('y', (d: HeatMapCell) => yScale(d.committee) ?? 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: HeatMapCell) => colorScale(d.value))
      .attr('stroke', 'var(--card-bg)')
      .attr('stroke-width', 1)
      .attr('tabindex', '0')
      .attr('role', 'button')
      .attr('aria-label', (d: HeatMapCell) => `${d.committee} in ${d.year}: ${d.value.toFixed(1)} productivity`)
      .on('mouseover', function(this: SVGRectElement, _event: MouseEvent, _d: HeatMapCell) {
        d3.select(this).attr('stroke', 'var(--accent-color)').attr('stroke-width', 2);
      })
      .on('mouseout', function(this: SVGRectElement, _event: MouseEvent, _d: HeatMapCell) {
        d3.select(this).attr('stroke', 'var(--card-bg)').attr('stroke-width', 1);
      })
      .append('title')
      .text((d: HeatMapCell) => `${d.committee} (${d.year})\nProductivity: ${d.value.toFixed(1)}`);

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
   * @returns {HeatMapData} Matrix data, years, and committees
   */
  processHeatMapData(): HeatMapData {
    const committees: string[] = CONFIG.committees.map((c: CommitteeDefinition) => c.code);
    
    // Build lookup from real productivity matrix data
    const dataLookup: Record<string, number> = {};
    if (this.data && this.data.productivityMatrix) {
      this.data.productivityMatrix.forEach((row: ProductivityMatrixRow) => {
        const code: string = row.committee_code || '';
        const year: string = String(row.year || '');
        if (code && year) {
          const level: string = (row.productivity_level || '').toUpperCase();
          const value: number = level === 'HIGHLY_PRODUCTIVE' ? 90 :
                        level === 'PRODUCTIVE' ? 75 :
                        level === 'MODERATELY_PRODUCTIVE' ? 55 :
                        level === 'INACTIVE' ? 15 : 40;
          dataLookup[`${code}_${year}`] = value;
        }
      });
    }
    
    // Determine available years from data, fallback to default range
    const yearSet = new Set<string>();
    if (this.data && this.data.productivityMatrix) {
      this.data.productivityMatrix.forEach((row: ProductivityMatrixRow) => {
        if (row.year) yearSet.add(String(row.year));
      });
    }
    const years: string[] = yearSet.size > 0 
      ? Array.from(yearSet).sort() 
      : ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
    
    const matrix: HeatMapCell[] = [];
    committees.forEach((committee: string) => {
      years.forEach((year: string) => {
        matrix.push({
          committee: committee,
          year: year,
          value: dataLookup[`${committee}_${year}`] || 50
        });
      });
    });

    return { matrix, years, committees };
  }

  /**
   * Add color scale legend
   */
  addColorLegend(g: d3.Selection<SVGGElement, unknown, null, undefined>, _colorScale: d3.ScaleSequential<string, never>, innerWidth: number, innerHeight: number): void {
    const legendWidth: number = 200;
    const legendHeight: number = 15;

    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth - legendWidth}, ${innerHeight + 40})`);

    // Gradient
    const defs = this.svg!.append('defs');
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
  updateAccessibleTable(matrix: HeatMapCell[]): void {
    const table: HTMLElement | null = document.getElementById('productivityMatrixTable');
    if (!table) return;

    const years: string[] = [...new Set(matrix.map((d: HeatMapCell) => d.year))];
    const committees: string[] = [...new Set(matrix.map((d: HeatMapCell) => d.committee))];

    let html: string = '<caption>Committee Productivity Matrix (2020-2026)</caption>';
    html += '<thead><tr><th>Committee</th>';
    years.forEach((year: string) => {
      html += `<th>${year}</th>`;
    });
    html += '</tr></thead><tbody>';

    committees.forEach((committee: string) => {
      html += `<tr><td>${committee}</td>`;
      years.forEach((year: string) => {
        const cell: HeatMapCell | undefined = matrix.find((d: HeatMapCell) => d.committee === committee && d.year === year);
        html += `<td>${cell ? cell.value.toFixed(1) : 'N/A'}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;
  }
}

