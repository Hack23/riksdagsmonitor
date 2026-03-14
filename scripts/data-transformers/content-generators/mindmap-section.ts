/**
 * @module data-transformers/content-generators/mindmap-section
 * @description Generates a color-coded mindmap HTML section using pure CSS —
 * no JavaScript or third-party libraries required.
 *
 * The mindmap renders a central topic node surrounded by color-coded branch
 * nodes. Each branch can have child leaf items, AI-weighted items, and
 * stakeholder sub-branches for hierarchical depth (2–3 levels).
 *
 * Supports AI-driven conceptual mapping with:
 * - Central thesis display (AI-synthesized statement)
 * - Weighted item visualization (critical / significant / moderate / minor)
 * - Stakeholder sub-branches on primary branches
 * - Cross-branch connection indicators
 * - ARIA list role for screen reader accessibility
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

/** Political dimension for AI-driven mindmap branches */
export type MindmapDimension = 'power' | 'impact' | 'timeline' | 'scope' | 'motivation';

/** Relative political significance weight for AI-driven mindmap items */
export type AIMindmapItemWeight = 'critical' | 'significant' | 'moderate' | 'minor';

/** A single AI-weighted item within a mindmap branch */
export interface AIMindmapItem {
  /** Display text for the item */
  text: string;
  /** Relative political significance of this item */
  weight: AIMindmapItemWeight;
  /** Optional AI-generated reasoning for why this item matters */
  aiReasoning?: string;
}

/** A stakeholder-perspective sub-branch within a primary branch */
export interface SubBranch {
  /** Sub-branch label (e.g., stakeholder name) */
  label: string;
  /** Child items in this sub-branch */
  items?: string[];
}

/** A cross-branch connection indicator */
export interface MindmapConnection {
  /** Label of the source branch */
  fromBranch: string;
  /** Label of the target branch */
  toBranch: string;
  /** AI-described relationship between the two branches */
  relationship: string;
}

/** A single branch of the mindmap, attached to the central node */
export interface MindmapBranch {
  /** Branch label (rendered in the colored branch node) */
  label: string;
  /** Semantic color for the branch node */
  color: MindmapBranchColor;
  /** Child leaf items displayed below the branch node (plain text) */
  items?: string[];
  /** Optional icon/emoji prefix for the branch label */
  icon?: string;
  /** AI-weighted items (displayed instead of plain `items` when provided) */
  aiItems?: AIMindmapItem[];
  /** Stakeholder sub-branches for hierarchical depth */
  subBranches?: SubBranch[];
  /** Political dimension this branch represents */
  dimension?: MindmapDimension;
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
  /** AI-generated thesis statement displayed in the central node */
  centralThesis?: string;
  /** Cross-branch connection indicators */
  connections?: MindmapConnection[];
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

const CONNECTIONS_ARIA_LABELS: Partial<Record<string, string>> = {
  en: 'Cross-branch connections',
  sv: 'Grenarnas kopplingar',
  da: 'Grenkoblinger',
  no: 'Grenforbindelser',
  fi: 'Haarojen yhteydet',
  de: 'Zweigverbindungen',
  fr: 'Connexions entre branches',
  es: 'Conexiones entre ramas',
  nl: 'Verbindingen tussen takken',
  ar: 'الروابط بين الفروع',
  he: 'קשרים בין ענפים',
  ja: 'ブランチ間の接続',
  ko: '브랜치 간 연결',
  zh: '分支间连接',
};

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/** Render AI-weighted items as a styled list */
function renderAIItems(items: AIMindmapItem[]): string {
  if (items.length === 0) return '';
  const listItems = items
    .map(
      item =>
        `        <li class="mindmap-ai-item" data-weight="${escapeHtml(item.weight)}">${escapeHtml(item.text)}</li>`,
    )
    .join('\n');
  return `\n      <ul class="mindmap-leaf-list mindmap-ai-list" role="list">\n${listItems}\n      </ul>`;
}

/** Render stakeholder sub-branches with nested items */
function renderSubBranches(subBranches: SubBranch[]): string {
  if (subBranches.length === 0) return '';
  return subBranches
    .map(sb => {
      const subItems =
        sb.items && sb.items.length > 0
          ? `\n          <ul class="mindmap-sub-items" role="list">\n${sb.items
              .map(i => `            <li>${escapeHtml(i)}</li>`)
              .join('\n')}\n          </ul>`
          : '';
      return `      <div class="mindmap-sub-branch">\n        <div class="mindmap-sub-branch-label">${escapeHtml(sb.label)}</div>${subItems}\n      </div>`;
    })
    .join('\n');
}

/** Render cross-branch connection indicators */
function renderConnections(connections: MindmapConnection[], lang: Language | string): string {
  if (connections.length === 0) return '';
  const ariaLabel = CONNECTIONS_ARIA_LABELS[lang as string] ?? CONNECTIONS_ARIA_LABELS.en!;
  const items = connections
    .map(
      c =>
        `    <div class="mindmap-connection" data-from="${escapeHtml(c.fromBranch)}" data-to="${escapeHtml(c.toBranch)}">` +
        `↔ ${escapeHtml(c.fromBranch)} ↔ ${escapeHtml(c.toBranch)}: ${escapeHtml(c.relationship)}` +
        `</div>`,
    )
    .join('\n');
  return `  <div class="mindmap-connections" aria-label="${escapeHtml(ariaLabel)}" role="note">\n${items}\n  </div>\n`;
}

/** Render a single branch node with its leaf items, AI items, and sub-branches */
function renderBranch(branch: MindmapBranch): string {
  const palette = BRANCH_COLORS[branch.color] ?? BRANCH_COLORS.cyan;
  const iconPrefix = branch.icon ? `${branch.icon} ` : '';
  const labelHtml = `${escapeHtml(iconPrefix)}${escapeHtml(branch.label)}`;
  const dimAttr = branch.dimension ? ` data-dimension="${escapeHtml(branch.dimension)}"` : '';

  let contentHtml = '';
  if (branch.aiItems && branch.aiItems.length > 0) {
    contentHtml = renderAIItems(branch.aiItems);
  } else if (branch.items && branch.items.length > 0) {
    contentHtml = `\n      <ul class="mindmap-leaf-list" role="list">\n${branch.items
      .map(item => `        <li>${escapeHtml(item)}</li>`)
      .join('\n')}\n      </ul>`;
  }

  const subBranchesHtml =
    branch.subBranches && branch.subBranches.length > 0
      ? `\n      <div class="mindmap-sub-branches">\n${renderSubBranches(branch.subBranches)}\n      </div>`
      : '';

  return `    <div class="mindmap-branch" role="listitem"${dimAttr}
      style="--branch-bg:${palette.bg};--branch-border:${palette.border};--branch-text:${palette.text}">
      <div class="mindmap-branch-label">${labelHtml}</div>${contentHtml}${subBranchesHtml}
    </div>`;
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
 * AI-weighted items, and stakeholder sub-branches.
 *
 * Supports AI-driven conceptual mapping features:
 * - `centralThesis` — AI-synthesized statement in the center node
 * - `connections` — Cross-branch connection indicators
 * - `MindmapBranch.aiItems` — Weighted items with `data-weight` attribute
 * - `MindmapBranch.subBranches` — Stakeholder sub-branches (hierarchical depth)
 *
 * The CSS for `.mindmap-section` lives in `styles.css`. No client-side JS is
 * required or loaded.
 *
 * @example
 * ```ts
 * const section = generateMindmapSection({
 *   topic: 'Cybersecurity Policy',
 *   lang: 'en',
 *   centralThesis: 'Parliamentary focus on cybersecurity spans defensive legislation and EU alignment.',
 *   branches: [
 *     {
 *       label: 'Key Actors',
 *       color: 'cyan',
 *       icon: '👥',
 *       dimension: 'power',
 *       aiItems: [
 *         { text: 'Ministry of Defence', weight: 'critical' },
 *         { text: 'NCSC', weight: 'significant' },
 *       ],
 *       subBranches: [
 *         { label: 'Government', items: ['Policy initiative', 'Regulatory mandate'] },
 *         { label: 'Opposition', items: ['Oversight function', 'Amendment proposals'] },
 *       ],
 *     },
 *   ],
 * });
 * articleData.sections = [...(articleData.sections ?? []), section];
 * ```
 */
export function generateMindmapSection(opts: MindmapSectionOptions): TemplateSection {
  const { topic, branches, centralThesis, connections } = opts;

  const titleText = opts.title?.trim() || SECTION_TITLES[opts.lang as string] || SECTION_TITLES.en!;

  const summaryBlock = opts.summary?.trim()
    ? `  <p class="mindmap-summary">${escapeHtml(opts.summary.trim())}</p>\n`
    : '';

  const thesisHtml = centralThesis?.trim()
    ? `\n    <p class="mindmap-thesis">${escapeHtml(centralThesis.trim())}</p>`
    : '';

  const branchCount = branches.length;
  const branchItems = branches.map(b => renderBranch(b)).join('\n');

  const connectionsHtml =
    connections && connections.length > 0 ? renderConnections(connections, opts.lang) : '';

  const html = `<section class="mindmap-section" aria-label="${escapeHtml(titleText)}">
  <h2>${escapeHtml(titleText)}</h2>
${summaryBlock}  <div class="mindmap-container" data-branch-count="${branchCount}">
    <div class="mindmap-center-wrapper">
      <div class="mindmap-center" role="heading" aria-level="3">${escapeHtml(topic)}</div>${thesisHtml}
    </div>
    <div class="mindmap-branches" role="list" aria-label="${escapeHtml(titleText)}">
${branchItems}
    </div>
  </div>
${connectionsHtml}</section>`;

  return {
    id: 'mindmap-section',
    html,
    className: 'mindmap-section-wrapper',
  };
}
