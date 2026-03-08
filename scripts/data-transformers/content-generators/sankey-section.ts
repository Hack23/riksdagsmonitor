/**
 * @module data-transformers/content-generators/sankey-section
 * @description Generates a Sankey (flow) chart as inline SVG — no JavaScript,
 * no third-party libraries required.
 *
 * A Sankey diagram visualises quantities flowing from source nodes to target
 * nodes. Node heights and flow-path widths are proportional to the values,
 * making it easy to see dominant flows at a glance.
 *
 * Typical usage in deep-inspection articles:
 * - Parliamentary flow: initiating party → document type → legislative outcome
 * - Policy flow: policy domain → committee → outcome (passed/rejected/pending)
 * - Budget flow: government programme → ministry → spending category
 * - Data source flow: CIA / World Bank / SCB indicator → policy area → article insight
 *
 * Agentic workflows append the returned `TemplateSection` to `ArticleData.sections`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { TemplateSection } from '../../types/article.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Pre-defined semantic color categories for Sankey nodes */
export type SankeyNodeColor =
  | 'cyan'     // primary topic / key source
  | 'magenta'  // risk / opposition flows
  | 'yellow'   // opportunity / future flows
  | 'green'    // positive / approved outcomes
  | 'purple'   // background / data source
  | 'orange'   // process / intermediate
  | 'blue'     // international / EU
  | 'red';     // blocked / rejected / urgent

/** A node in the Sankey diagram */
export interface SankeyNode {
  /** Unique identifier (used in flows to reference source/target) */
  id: string;
  /** Display label */
  label: string;
  /** Semantic color */
  color: SankeyNodeColor;
}

/** A directed flow between two nodes */
export interface SankeyFlow {
  /** Source node id */
  source: string;
  /** Target node id */
  target: string;
  /** Flow magnitude (relative — all values scaled to fit the SVG height) */
  value: number;
  /** Optional label shown on the flow path */
  label?: string;
}

/** Options for the Sankey section generator */
export interface SankeySectionOptions {
  /** Array of nodes (must have at least two: one source, one target) */
  nodes: SankeyNode[];
  /** Array of directed flows between nodes */
  flows: SankeyFlow[];
  /** Target language for labels */
  lang: Language | string;
  /** Optional section title override */
  title?: string;
  /** Optional narrative summary */
  summary?: string;
  /** SVG canvas height in px (default: 340) */
  svgHeight?: number;
}

// ---------------------------------------------------------------------------
// Color palette (cyberpunk theme)
// ---------------------------------------------------------------------------

const NODE_COLORS: Readonly<Record<SankeyNodeColor, { fill: string; stroke: string; text: string }>> = {
  cyan:    { fill: '#003344', stroke: '#00d9ff', text: '#00d9ff' },
  magenta: { fill: '#330011', stroke: '#ff006e', text: '#ff006e' },
  yellow:  { fill: '#332200', stroke: '#ffbe0b', text: '#ffbe0b' },
  green:   { fill: '#003300', stroke: '#83cf39', text: '#83cf39' },
  purple:  { fill: '#1a0033', stroke: '#9d4edd', text: '#9d4edd' },
  orange:  { fill: '#331500', stroke: '#f77f00', text: '#f77f00' },
  blue:    { fill: '#001133', stroke: '#4895ef', text: '#4895ef' },
  red:     { fill: '#330000', stroke: '#e63946', text: '#e63946' },
};

// ---------------------------------------------------------------------------
// Section title labels (14 languages)
// ---------------------------------------------------------------------------

const SECTION_TITLES: Partial<Record<string, string>> = {
  en: 'Policy Flow (Sankey)',
  sv: 'Politikflöde (Sankey)',
  da: 'Politikflow (Sankey)',
  no: 'Politikkflyt (Sankey)',
  fi: 'Politiikkavirta (Sankey)',
  de: 'Politikfluss (Sankey)',
  fr: 'Flux de politique (Sankey)',
  es: 'Flujo de política (Sankey)',
  nl: 'Beleidsflow (Sankey)',
  ar: 'تدفق السياسات (سانكي)',
  he: 'זרימת מדיניות (סנקי)',
  ja: '政策フロー (Sankey)',
  ko: '정책 흐름 (Sankey)',
  zh: '政策流向图 (Sankey)',
};

// ---------------------------------------------------------------------------
// SVG layout engine
// ---------------------------------------------------------------------------

const SVG_WIDTH = 600;
const NODE_WIDTH = 22;
const NODE_GAP = 14;       // gap between nodes on the same column
const COL_LEFT = 20;       // x-position of source column
const COL_RIGHT = SVG_WIDTH - NODE_WIDTH - 20; // x-position of target column

interface LayoutNode extends SankeyNode {
  totalValue: number;  // sum of flows touching this node
  y: number;           // top y-coordinate in the SVG
  height: number;      // rectangle height
  isSource: boolean;
  isTarget: boolean;
  /** current offset within node for allocating flow strips */
  srcOffset: number;
  tgtOffset: number;
}

/** Scale a bezier cubic SVG path between two columns */
function buildBezierPath(
  x1: number, y1: number,
  x2: number, y2: number,
  h: number,
): string {
  const mx = (x1 + x2) / 2;
  return [
    `M${x1},${y1}`,
    `C${mx},${y1} ${mx},${y2} ${x2},${y2}`,
    `L${x2},${y2 + h}`,
    `C${mx},${y2 + h} ${mx},${y1 + h} ${x1},${y1 + h}`,
    'Z',
  ].join(' ');
}

/**
 * Compute SVG layout for the Sankey diagram.
 * Returns an array of SVG element strings.
 */
function layoutSankey(
  nodes: SankeyNode[],
  flows: SankeyFlow[],
  svgHeight: number,
): string[] {
  // --- Determine source vs target sets ---
  const sourceIds = new Set(flows.map(f => f.source));
  const targetIds = new Set(flows.map(f => f.target));

  // --- Compute total flow value per node ---
  const valuePer: Record<string, number> = {};
  for (const f of flows) {
    valuePer[f.source] = (valuePer[f.source] ?? 0) + f.value;
    valuePer[f.target] = (valuePer[f.target] ?? 0) + f.value;
  }

  const totalValue = Object.values(valuePer).reduce((a, b) => a + b, 0) || 1;

  // --- Scale factor: map node totalValue to SVG height ---
  const usableHeight = svgHeight - 40; // top/bottom margin
  const scaleFactor = usableHeight / (totalValue / 2 + (nodes.length - 1) * NODE_GAP);

  // --- Separate source-only vs target-only vs both ---
  const srcOnlyNodes = nodes.filter(n => sourceIds.has(n.id) && !targetIds.has(n.id));
  const tgtOnlyNodes = nodes.filter(n => targetIds.has(n.id) && !sourceIds.has(n.id));
  const bothNodes    = nodes.filter(n => sourceIds.has(n.id) && targetIds.has(n.id));

  // Nodes that appear only as targets go to right column;
  // nodes that appear only as sources go to left column;
  // nodes in both go to left column (they drive flows to the right).
  const leftNodes  = [...srcOnlyNodes, ...bothNodes];
  const rightNodes = [...tgtOnlyNodes];

  /** Place a set of nodes vertically, returning LayoutNode array */
  function placeNodes(nds: SankeyNode[]): LayoutNode[] {
    const result: LayoutNode[] = [];
    let yOffset = 20;
    for (const n of nds) {
      const total = valuePer[n.id] ?? 0;
      const height = Math.max(18, Math.round(total * scaleFactor));
      result.push({
        ...n,
        totalValue: total,
        y: yOffset,
        height,
        isSource: sourceIds.has(n.id),
        isTarget: targetIds.has(n.id),
        srcOffset: 0,
        tgtOffset: 0,
        color: n.color,
      });
      yOffset += height + NODE_GAP;
    }
    return result;
  }

  const leftLayout  = placeNodes(leftNodes);
  const rightLayout = placeNodes(rightNodes);
  const allLayout   = [...leftLayout, ...rightLayout];
  const layoutMap   = new Map<string, LayoutNode>(allLayout.map(n => [n.id, n]));

  // --- Build flow paths ---
  const svgElements: string[] = [];

  // Render nodes first (behind flows)
  for (const ln of allLayout) {
    const palette = NODE_COLORS[ln.color] ?? NODE_COLORS.cyan;
    const isLeft = leftLayout.some(l => l.id === ln.id);
    const xPos = isLeft ? COL_LEFT : COL_RIGHT;
    const labelX = isLeft ? xPos + NODE_WIDTH + 6 : xPos - 6;
    const textAnchor = isLeft ? 'start' : 'end';
    svgElements.push(
      `<rect x="${xPos}" y="${ln.y}" width="${NODE_WIDTH}" height="${ln.height}"
         fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2" rx="3"/>`,
      `<text x="${labelX}" y="${ln.y + ln.height / 2}" text-anchor="${textAnchor}" dominant-baseline="middle"
         font-size="11" fill="${palette.text}" font-family="monospace">${escapeHtml(ln.label)}</text>`,
    );
  }

  // Render flow paths (on top of node labels but behind we'll keep z-order via SVG)
  for (const flow of flows) {
    const srcNode = layoutMap.get(flow.source);
    const tgtNode = layoutMap.get(flow.target);
    if (!srcNode || !tgtNode) continue;

    const srcPalette = NODE_COLORS[srcNode.color] ?? NODE_COLORS.cyan;
    const tgtVal = valuePer[tgtNode.id] ?? 1;
    const scaledH = Math.max(4, Math.round(
      (flow.value / Math.max(tgtVal, valuePer[srcNode.id] ?? 1)) * (srcNode.height + tgtNode.height) / 2,
    ));

    const srcIsLeft = leftLayout.some(l => l.id === srcNode.id);
    const tgtIsLeft = leftLayout.some(l => l.id === tgtNode.id);
    const x1 = srcIsLeft ? COL_LEFT + NODE_WIDTH : COL_RIGHT;
    const x2 = tgtIsLeft ? COL_LEFT : COL_RIGHT + NODE_WIDTH;
    const y1 = srcNode.y + srcNode.srcOffset;
    const y2 = tgtNode.y + tgtNode.tgtOffset;

    srcNode.srcOffset += scaledH + 2;
    tgtNode.tgtOffset += scaledH + 2;

    const pathD = buildBezierPath(x1, y1, x2, y2, scaledH);

    svgElements.push(`<path d="${pathD}" fill="${srcPalette.stroke}44" stroke="${srcPalette.stroke}" stroke-width="0.5" opacity="0.8"/>`);

    // Mid-label
    if (flow.label) {
      const midX = SVG_WIDTH / 2;
      const midY = (y1 + y2) / 2 + scaledH / 2;
      svgElements.push(
        `<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="middle"
           font-size="9" fill="#cccccc" font-family="monospace">${escapeHtml(flow.label)}</text>`,
      );
    }
  }

  return svgElements;
}

// ---------------------------------------------------------------------------
// Accessible table fallback
// ---------------------------------------------------------------------------

function renderFallbackTable(nodes: SankeyNode[], flows: SankeyFlow[]): string {
  const sourceLabel = 'Source';
  const targetLabel = 'Target';
  const valueLabel  = 'Value';

  const rows = flows.map(f => {
    const srcNode = nodes.find(n => n.id === f.source);
    const tgtNode = nodes.find(n => n.id === f.target);
    return `      <tr>
        <td>${escapeHtml(srcNode?.label ?? f.source)}</td>
        <td>${escapeHtml(tgtNode?.label ?? f.target)}</td>
        <td>${f.value}</td>
        ${f.label ? `<td>${escapeHtml(f.label)}</td>` : '<td></td>'}
      </tr>`;
  }).join('\n');

  return `<table class="sankey-fallback-table sr-only" aria-label="Sankey data">
    <caption>Flow data</caption>
    <thead><tr><th>${sourceLabel}</th><th>${targetLabel}</th><th>${valueLabel}</th><th>Note</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a color-coded Sankey flow chart as inline SVG.
 *
 * Returns a `TemplateSection` with an embedded responsive SVG. No client-side
 * JavaScript is required. An accessible `<table>` with `sr-only` class is
 * included as a fallback for screen readers and search engines.
 *
 * @example
 * ```ts
 * const section = generateSankeySection({
 *   lang: 'en',
 *   nodes: [
 *     { id: 'gov', label: 'Government', color: 'cyan' },
 *     { id: 'opp', label: 'Opposition', color: 'magenta' },
 *     { id: 'prop', label: 'Propositions', color: 'orange' },
 *     { id: 'mot', label: 'Motions', color: 'purple' },
 *     { id: 'passed', label: 'Passed', color: 'green' },
 *     { id: 'rejected', label: 'Rejected/Shelved', color: 'red' },
 *   ],
 *   flows: [
 *     { source: 'gov',  target: 'prop',     value: 12, label: '2024 props' },
 *     { source: 'opp',  target: 'mot',      value: 35, label: '2024 mots' },
 *     { source: 'prop', target: 'passed',   value: 10 },
 *     { source: 'prop', target: 'rejected', value: 2 },
 *     { source: 'mot',  target: 'passed',   value: 5 },
 *     { source: 'mot',  target: 'rejected', value: 30 },
 *   ],
 * });
 * articleData.sections = [...(articleData.sections ?? []), section];
 * ```
 */
export function generateSankeySection(opts: SankeySectionOptions): TemplateSection {
  const { nodes, flows, lang } = opts;
  const svgHeight = opts.svgHeight ?? 340;

  const titleText = opts.title?.trim() || SECTION_TITLES[lang as string] || SECTION_TITLES.en!;

  const summaryBlock = opts.summary?.trim()
    ? `  <p class="sankey-summary">${escapeHtml(opts.summary.trim())}</p>\n`
    : '';

  // Generate SVG elements
  const svgElements = layoutSankey(nodes, flows, svgHeight);
  const svgContent  = svgElements.join('\n    ');

  const fallbackTable = renderFallbackTable(nodes, flows);

  const html = `<section class="sankey-section" aria-label="${escapeHtml(titleText)}">
  <h2>${escapeHtml(titleText)}</h2>
${summaryBlock}  <div class="sankey-chart-wrapper">
    <svg viewBox="0 0 ${SVG_WIDTH} ${svgHeight}" xmlns="http://www.w3.org/2000/svg"
         role="img" aria-label="${escapeHtml(titleText)}"
         style="width:100%;height:auto;max-width:${SVG_WIDTH}px;display:block;">
      <title>${escapeHtml(titleText)}</title>
      <rect width="${SVG_WIDTH}" height="${svgHeight}" fill="#0a0e27" rx="8"/>
    ${svgContent}
    </svg>
  </div>
  ${fallbackTable}
</section>`;

  return {
    id: 'sankey-section',
    html,
    className: 'sankey-section-wrapper',
  };
}
