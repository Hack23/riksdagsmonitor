/**
 * @module data-transformers/content-generators/mindmap-section
 * @description Generates a color-coded mindmap HTML section using pure CSS —
 * no JavaScript or third-party libraries required.
 *
 * The mindmap renders a central topic node surrounded by color-coded branch
 * nodes. Each branch can have child leaf items and nested sub-branches (3-level
 * nesting: branch → sub-branch → leaf items). The layout uses CSS Flexbox
 * and connecting-line pseudo-elements, working at all viewport widths.
 *
 * AI-enriched branches carry importance indicators, evidence references, and
 * cross-branch connection metadata that is rendered via CSS-only techniques.
 *
 * Typical usage: inject into deep-inspection articles to visualise the
 * relationship between a focus topic and detected policy domains, parliamentary
 * actors, data sources (CIA, World Bank, SCB), or legislative outcomes.
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

/** Pre-defined semantic color roles for mindmap branches */
export type MindmapBranchColor =
  | 'cyan'     // primary topic / key actors
  | 'magenta'  // threats / risks / opposition
  | 'yellow'   // opportunities / future
  | 'green'    // strengths / positive outcomes
  | 'purple'   // data sources / background
  | 'orange'   // legislative pipeline / process
  | 'blue'     // international / EU context
  | 'red';     // urgency / critical issues

/** Relative importance of a mindmap branch — drives visual weight */
export type BranchImportance = 'critical' | 'high' | 'medium' | 'low';

/** A directional relationship between two mindmap branches */
export interface BranchConnection {
  /** Label or identifier of the source branch */
  from: string;
  /** Label or identifier of the target branch */
  to: string;
  /** Semantic type of the relationship */
  type: 'dependency' | 'conflict' | 'alignment' | 'sequence';
  /** Short human-readable description of the connection */
  label?: string;
}

/** A single branch of the mindmap, attached to the central node */
export interface MindmapBranch {
  /** Branch label (rendered in the colored branch node) */
  label: string;
  /** Semantic color for the branch node */
  color: MindmapBranchColor;
  /** Child leaf items displayed below the branch node */
  items?: string[];
  /** Optional icon/emoji prefix for the branch label */
  icon?: string;
  /** Nested second-level branches (sub-branches with optional leaf items) */
  subBranches?: MindmapBranch[];
  /** Relative importance — reflected visually via border weight and glow */
  importance?: BranchImportance;
  /** Document IDs or titles that serve as evidence for this branch */
  evidenceRefs?: string[];
  /** Labels of related branches that share dependencies or alignment */
  connections?: string[];
}

/** Options for the mindmap section generator */
export interface MindmapSectionOptions {
  /** Central topic text (the root of the mindmap) */
  topic: string;
  /** Array of branches radiating from the central node */
  branches: MindmapBranch[];
  /** Target language for section labels */
  lang: Language | string;
  /** Optional section title override */
  title?: string;
  /** Optional introductory paragraph rendered above the mindmap */
  summary?: string;
  /** Cross-branch connections to render as relationship indicators */
  connections?: BranchConnection[];
}

// ---------------------------------------------------------------------------
// Color palette  (matches cyberpunk theme CSS variables from styles.css)
// ---------------------------------------------------------------------------

const BRANCH_COLORS: Readonly<Record<MindmapBranchColor, { bg: string; border: string; text: string }>> = {
  cyan:    { bg: '#0a2a33', border: '#00d9ff', text: '#00d9ff' },
  magenta: { bg: '#2a0a1a', border: '#ff006e', text: '#ff006e' },
  yellow:  { bg: '#2a200a', border: '#ffbe0b', text: '#ffbe0b' },
  green:   { bg: '#0a2a0a', border: '#83cf39', text: '#83cf39' },
  purple:  { bg: '#1a0a2a', border: '#9d4edd', text: '#9d4edd' },
  orange:  { bg: '#2a1500', border: '#f77f00', text: '#f77f00' },
  blue:    { bg: '#0a1230', border: '#4895ef', text: '#4895ef' },
  red:     { bg: '#2a0a0a', border: '#e63946', text: '#e63946' },
};

// Maximum nesting depth: 0 = top-level branch, 1 = sub-branch, sub-branches do not nest further
const MAX_NESTING_DEPTH = 1;

// ---------------------------------------------------------------------------
// Section title labels (14 languages)
// ---------------------------------------------------------------------------

const SECTION_TITLES: Partial<Record<string, string>> = {
  en: 'Policy Mindmap',
  sv: 'Policykarta',
  da: 'Politikkort',
  no: 'Politikkart',
  fi: 'Politiikkakartta',
  de: 'Politikkarte',
  fr: 'Carte conceptuelle',
  es: 'Mapa conceptual',
  nl: 'Beleidskaart',
  ar: 'خريطة السياسات',
  he: 'מפת מדיניות',
  ja: '政策マインドマップ',
  ko: '정책 마인드맵',
  zh: '政策思维导图',
};

/** Localised aria-label for the connections panel (screen-reader text) */
const CONNECTIONS_ARIA_LABELS: Partial<Record<string, string>> = {
  en: 'Branch connections',
  sv: 'Grenkopplingar',
  da: 'Grenforbindelser',
  no: 'Grenforbindelser',
  fi: 'Haarayhteydet',
  de: 'Verzweigungsverbindungen',
  fr: 'Connexions entre branches',
  es: 'Conexiones entre ramas',
  nl: 'Takverbindingen',
  ar: 'اتصالات الفروع',
  he: 'חיבורי ענפים',
  ja: 'ブランチ接続',
  ko: '분기 연결',
  zh: '分支连接',
};

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/** Allowed importance levels — hoisted to module scope for efficiency */
const VALID_IMPORTANCE = new Set<string>(['critical', 'high', 'medium', 'low']);

/** Allowed connection types — hoisted to module scope for efficiency */
const VALID_CONN_TYPES = new Set<string>(['dependency', 'conflict', 'alignment', 'sequence']);

/** Render a single branch or sub-branch node with its leaf items and nested sub-branches.
 * Supports nesting up to MAX_NESTING_DEPTH levels deep.
 * When `level` reaches MAX_NESTING_DEPTH, sub-branch rendering is skipped — preventing
 * unbounded recursion regardless of how deeply subBranches are nested in input data.
 */
function renderBranch(branch: MindmapBranch, level: number = 0): string {
  const palette = BRANCH_COLORS[branch.color] ?? BRANCH_COLORS.cyan;
  const iconPrefix = branch.icon ? `${branch.icon} ` : '';
  const labelHtml = `${escapeHtml(iconPrefix)}${escapeHtml(branch.label)}`;

  // Importance data attribute for CSS-driven visual weight — validated against allowed set to prevent attribute injection
  const importanceAttr = branch.importance && VALID_IMPORTANCE.has(branch.importance)
    ? ` data-importance="${branch.importance}"`
    : '';

  // Leaf items (present at any nesting level)
  const leafItems =
    branch.items && branch.items.length > 0
      ? `\n      <ul class="mindmap-leaf-list" role="list">\n${branch.items
          .map(item => `        <li>${escapeHtml(item)}</li>`)
          .join('\n')}\n      </ul>`
      : '';

  // Sub-branches are only rendered when we have not yet reached the maximum nesting depth
  const subBranchBlock =
    level < MAX_NESTING_DEPTH && branch.subBranches && branch.subBranches.length > 0
      ? `\n      <div class="mindmap-sub-branches" role="list">\n${branch.subBranches
          .map(sb => renderBranch(sb, level + 1))
          .join('\n')}\n      </div>`
      : '';

  const outerClass = level === 0 ? 'mindmap-branch' : 'mindmap-sub-branch';

  return `    <div class="${outerClass}" role="listitem"${importanceAttr}
      style="--branch-bg:${palette.bg};--branch-border:${palette.border};--branch-text:${palette.text}">
      <div class="mindmap-branch-label">${labelHtml}</div>${leafItems}${subBranchBlock}
    </div>`;
}

/** Render the cross-branch connections panel (pure CSS — no JS) */
function renderConnections(connections: BranchConnection[], lang?: Language | string): string {
  if (connections.length === 0) return '';

  const items = connections.map(c => {
    const label = c.label ? escapeHtml(c.label) : `${escapeHtml(c.from)} → ${escapeHtml(c.to)}`;
    const safeType = VALID_CONN_TYPES.has(c.type) ? c.type : 'dependency';
    return `    <li class="mindmap-connection" data-type="${safeType}"
        data-from="${escapeHtml(c.from)}" data-to="${escapeHtml(c.to)}">${label}</li>`;
  }).join('\n');

  const ariaLabel = (lang && CONNECTIONS_ARIA_LABELS[lang as string]) || CONNECTIONS_ARIA_LABELS.en || 'Branch connections';

  return `  <ul class="mindmap-connections" role="list" aria-label="${escapeHtml(ariaLabel)}">\n${items}\n  </ul>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a color-coded mindmap section.
 *
 * Returns a `TemplateSection` (pure HTML/CSS — no JavaScript) that can be
 * appended to `ArticleData.sections`. The mindmap renders a central topic node
 * surrounded by colored branch nodes, each optionally containing child items,
 * nested sub-branches (3-level nesting), importance indicators, and
 * cross-branch connections.
 *
 * The CSS for `.mindmap-section` lives in `styles.css`. No client-side JS is
 * required or loaded.
 *
 * @example
 * ```ts
 * const section = generateMindmapSection({
 *   topic: 'Cybersecurity Policy',
 *   lang: 'en',
 *   branches: [
 *     {
 *       label: 'Key Actors',
 *       color: 'cyan',
 *       icon: '👥',
 *       importance: 'critical',
 *       items: ['Ministry of Defence', 'NCSC', 'Riksdag Defence Committee'],
 *     },
 *     {
 *       label: 'Legislative Risks',
 *       color: 'magenta',
 *       icon: '⚠️',
 *       importance: 'high',
 *       items: ['Insufficient NIS2 implementation budget', 'Fragmented agency mandates'],
 *       subBranches: [
 *         { label: 'Budget Gap', color: 'red', items: ['FY2025 shortfall', 'NCSC underfunding'] },
 *       ],
 *     },
 *     {
 *       label: 'EU Context',
 *       color: 'blue',
 *       icon: '🇪🇺',
 *       items: ['NIS2 Directive', 'Cyber Resilience Act', 'ENISA framework'],
 *     },
 *   ],
 *   connections: [
 *     { from: 'Legislative Risks', to: 'EU Context', type: 'dependency', label: 'NIS2 deadline drives urgency' },
 *   ],
 * });
 * articleData.sections = [...(articleData.sections ?? []), section];
 * ```
 */
export function generateMindmapSection(opts: MindmapSectionOptions): TemplateSection {
  const { topic, branches } = opts;

  const titleText = opts.title?.trim() || SECTION_TITLES[opts.lang as string] || SECTION_TITLES.en!;

  const summaryBlock = opts.summary?.trim()
    ? `  <p class="mindmap-summary">${escapeHtml(opts.summary.trim())}</p>\n`
    : '';

  const branchCount = branches.length;
  const branchItems = branches.map(b => renderBranch(b)).join('\n');

  const connectionsBlock = opts.connections && opts.connections.length > 0
    ? `\n${renderConnections(opts.connections, opts.lang)}`
    : '';

  const html = `<section class="mindmap-section" aria-label="${escapeHtml(titleText)}">
  <h2>${escapeHtml(titleText)}</h2>
${summaryBlock}  <div class="mindmap-container" data-branch-count="${branchCount}">
    <div class="mindmap-center" role="heading" aria-level="3">${escapeHtml(topic)}</div>
    <div class="mindmap-branches" role="list">
${branchItems}
    </div>
  </div>${connectionsBlock}
</section>`;

  return {
    id: 'mindmap-section',
    html,
    className: 'mindmap-section-wrapper',
  };
}
