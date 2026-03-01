/**
 * @module Analytics/CoalitionIntelligence/Charts
 * @description D3.js chart rendering functions for the Coalition Intelligence Dashboard.
 *
 * Contains:
 * - **renderCoalitionNetwork**: Force-directed party coalition network
 * - **renderAlignmentHeatMap**: Coalition alignment voting heatmap
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const d3: any;
import type { PartyNode, CoalitionLink, HeatMapDatum } from './types.js';

function renderCoalitionNetwork(): void {
  const container: HTMLElement | null = document.getElementById('coalitionNetwork');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Get dimensions
  const width: number = container.clientWidth || 800;
  const height: number = 600;

  // Create SVG
  const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> = d3.select('#coalitionNetwork')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('style', 'max-width: 100%; height: auto;');

  // Create nodes from parties
  const nodes: PartyNode[] = Object.keys(PARTIES).map((id: string): PartyNode => {
    // Calculate influence from alignment data (sum of alignment rates with other parties)
    let influence: number = 5;
    const alignment: CoalitionAlignment | null = dataCache.coalitionAlignment;
    if (alignment && alignment[id]) {
      const rates: number[] = Object.values(alignment[id]).filter((v): v is number => typeof v === 'number');
      influence = rates.length > 0 ? (rates.reduce((s: number, v: number) => s + v, 0) / rates.length) / 10 + 3 : 5;
    }
    return {
      id,
      name: PARTIES[id].name,
      fullName: PARTIES[id].fullName,
      color: PARTIES[id].color,
      influence: Math.max(5, Math.min(15, influence))
    };
  });

  // Create coalition edges based on alignment data
  const links: CoalitionLink[] = [];
  const alignment: CoalitionAlignment | null = dataCache.coalitionAlignment;
  
  nodes.forEach((source: PartyNode, i: number) => {
    nodes.forEach((target: PartyNode, j: number) => {
      if (i < j) {
        const strength: number = alignment && alignment[source.id] && alignment[source.id][target.id] 
          ? alignment[source.id][target.id] / 100
          : 0.5; // Default neutral alignment if no data
        
        links.push({
          source: source.id,
          target: target.id,
          strength
        });
      }
    });
  });

  // Create force simulation
  const simulation: d3.Simulation<PartyNode, CoalitionLink> = d3.forceSimulation<PartyNode>(nodes)
    .force('link', d3.forceLink<PartyNode, CoalitionLink>(links).id((d: PartyNode) => d.id).distance(150))
    .force('charge', d3.forceManyBody<PartyNode>().strength(-400))
    .force('center', d3.forceCenter<PartyNode>(width / 2, height / 2))
    .force('collision', d3.forceCollide<PartyNode>().radius((d: PartyNode) => d.influence * 3 + 10));

  // Create links
  const link: d3.Selection<SVGLineElement, CoalitionLink, SVGGElement, unknown> = svg.append('g')
    .attr('class', 'links')
    .selectAll<SVGLineElement, CoalitionLink>('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', (d: CoalitionLink) => d.strength)
    .attr('stroke-width', (d: CoalitionLink) => Math.sqrt(d.strength * 10))
    .style('cursor', 'pointer')
    .on('mouseover', function(this: SVGLineElement, event: MouseEvent, d: CoalitionLink): void {
      // Highlight edge — use outer d directly (single element selected)
      d3.select<SVGLineElement, CoalitionLink>(this)
        .attr('stroke', '#ff6600')
        .attr('stroke-width', Math.sqrt(d.strength * 10) + 2);
      
      // Show tooltip
      showTooltip(event, `Coalition Strength: ${(d.strength * 100).toFixed(0)}%`);
    })
    .on('mouseout', function(this: SVGLineElement, _event: MouseEvent, d: CoalitionLink): void {
      d3.select<SVGLineElement, CoalitionLink>(this)
        .attr('stroke', '#999')
        .attr('stroke-width', Math.sqrt(d.strength * 10));
      
      hideTooltip();
    });

  // Create nodes
  const node: d3.Selection<SVGGElement, PartyNode, SVGGElement, unknown> = svg.append('g')
    .attr('class', 'nodes')
    .selectAll<SVGGElement, PartyNode>('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('tabindex', '0')
    .attr('role', 'button')
    .attr('aria-label', (d: PartyNode) => `${d.fullName} party node`)
    .style('cursor', 'pointer')
    .call(d3.drag<SVGGElement, PartyNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  // Add circles to nodes
  node.append('circle')
    .attr('r', (d: PartyNode) => d.influence * 3)
    .attr('fill', (d: PartyNode) => d.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  // Add labels to nodes
  node.append('text')
    .text((d: PartyNode) => d.id)
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#fff')
    .attr('font-weight', 'bold')
    .attr('font-size', '14px')
    .attr('pointer-events', 'none');

  // Add party name labels
  node.append('text')
    .text((d: PartyNode) => d.name)
    .attr('x', 0)
    .attr('y', (d: PartyNode) => d.influence * 3 + 15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', 'var(--text-color)')
    .attr('pointer-events', 'none');

  // Node interaction handlers
  node.on('mouseover', function(this: SVGGElement, event: MouseEvent, d: PartyNode): void {
    d3.select(this).select('circle')
      .attr('stroke-width', 4)
      .attr('stroke', '#ff6600');
    
    showTooltip(event, `${d.fullName}<br>Influence: ${d.influence.toFixed(1)}`);
  })
  .on('mouseout', function(this: SVGGElement, _event: MouseEvent, _d: PartyNode): void {
    d3.select(this).select('circle')
      .attr('stroke-width', 2)
      .attr('stroke', '#fff');
    
    hideTooltip();
  })
  .on('click', function(this: SVGGElement, _event: MouseEvent, d: PartyNode): void {
    alert(`${d.fullName}\nInfluence Score: ${d.influence.toFixed(1)}\nColor: ${d.color}`);
  })
  .on('keydown', function(this: SVGGElement, event: KeyboardEvent, d: PartyNode): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      alert(`${d.fullName}\nInfluence Score: ${d.influence.toFixed(1)}\nColor: ${d.color}`);
    }
  });

  // Update positions on simulation tick
  simulation.on('tick', () => {
    link
      .attr('x1', (d: CoalitionLink) => (d.source as PartyNode).x!)
      .attr('y1', (d: CoalitionLink) => (d.source as PartyNode).y!)
      .attr('x2', (d: CoalitionLink) => (d.target as PartyNode).x!)
      .attr('y2', (d: CoalitionLink) => (d.target as PartyNode).y!);

    node.attr('transform', (d: PartyNode) => `translate(${d.x ?? 0},${d.y ?? 0})`);
  });

  // Drag functions
  function dragstarted(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, PartyNode, PartyNode>, d: PartyNode): void {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, PartyNode, PartyNode>, d: PartyNode): void {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, PartyNode, PartyNode>, d: PartyNode): void {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Create accessible table fallback
  createAccessibleNetworkTable(nodes, links);
}

/**
 * Render D3.js party alignment heat map
 */
function renderAlignmentHeatMap(): void {
  const container: HTMLElement | null = document.getElementById('alignmentHeatMap');
  if (!container) return;

  container.innerHTML = '';

  const width: number = container.clientWidth || 600;
  const height: number = 500;
  const margin: { top: number; right: number; bottom: number; left: number } = { top: 80, right: 20, bottom: 20, left: 100 };
  const innerWidth: number = width - margin.left - margin.right;
  const innerHeight: number = height - margin.top - margin.bottom;

  const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> = d3.select('#alignmentHeatMap')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('style', 'max-width: 100%; height: auto;');

  const g: d3.Selection<SVGGElement, unknown, HTMLElement, any> = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const partyIds: string[] = Object.keys(PARTIES);
  const cellSize: number = Math.min(innerWidth / partyIds.length, innerHeight / partyIds.length);

  // Create scale for colors
  const colorScale: d3.ScaleSequential<string> = d3.scaleSequential(d3.interpolateRdYlGn)
    .domain([0, 1]);

  // Create heat map data
  const heatMapData: HeatMapDatum[] = [];
  const coalitionAlignment: CoalitionAlignment | null = dataCache.coalitionAlignment;
  partyIds.forEach((party1: string) => {
    partyIds.forEach((party2: string) => {
      const alignmentValue: number = party1 === party2 ? 1.0 : 
        ((coalitionAlignment && coalitionAlignment[party1] && coalitionAlignment[party1][party2]) 
          ? coalitionAlignment[party1][party2] / 100 : 0.5);
      
      heatMapData.push({
        party1,
        party2,
        alignment: alignmentValue
      });
    });
  });

  // Create cells
  g.selectAll<SVGRectElement, HeatMapDatum>('rect')
    .data(heatMapData)
    .enter()
    .append('rect')
    .attr('x', (d: HeatMapDatum) => partyIds.indexOf(d.party2) * cellSize)
    .attr('y', (d: HeatMapDatum) => partyIds.indexOf(d.party1) * cellSize)
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('fill', (d: HeatMapDatum) => colorScale(d.alignment))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(this: SVGRectElement, event: MouseEvent, d: HeatMapDatum): void {
      showTooltip(event, `${PARTIES[d.party1].name} ↔ ${PARTIES[d.party2].name}<br>Alignment: ${(d.alignment * 100).toFixed(0)}%`);
    })
    .on('mouseout', hideTooltip);

  // Add row labels
  g.selectAll<SVGTextElement, string>('.row-label')
    .data(partyIds)
    .enter()
    .append('text')
    .attr('class', 'row-label')
    .attr('x', -10)
    .attr('y', (_d: string, i: number) => i * cellSize + cellSize / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '12px')
    .attr('fill', 'var(--text-color)')
    .text((d: string) => PARTIES[d].name);

  // Add column labels
  g.selectAll<SVGTextElement, string>('.col-label')
    .data(partyIds)
    .enter()
    .append('text')
    .attr('class', 'col-label')
    .attr('x', (_d: string, i: number) => i * cellSize + cellSize / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', 'var(--text-color)')
    .text((d: string) => d);

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .attr('fill', 'var(--text-color)')
    .text('Party Voting Alignment Matrix');
}

/**
 * Render Chart.js voting anomaly scatter plot
 */
