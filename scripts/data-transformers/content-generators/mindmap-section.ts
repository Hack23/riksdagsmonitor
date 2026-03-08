/**
 * @module data-transformers/content-generators/mindmap-section
 * @description Generates a color-coded mindmap HTML section using pure CSS —
 * no JavaScript or third-party libraries required.
 *
 * The mindmap renders a central topic node surrounded by color-coded branch
 * nodes. Each branch can have child leaf items. The layout uses CSS Flexbox
 * and connecting-line pseudo-elements, working at all viewport widths.
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

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/** Render a single branch node with its leaf items */
function renderBranch(branch: MindmapBranch): string {
  const palette = BRANCH_COLORS[branch.color] ?? BRANCH_COLORS.cyan;
  const iconPrefix = branch.icon ? `${branch.icon} ` : '';
  const labelHtml = `${escapeHtml(iconPrefix)}${escapeHtml(branch.label)}`;

  const leafItems =
    branch.items && branch.items.length > 0
      ? `\n      <ul class="mindmap-leaf-list" role="list">\n${branch.items
          .map(item => `        <li>${escapeHtml(item)}</li>`)
          .join('\n')}\n      </ul>`
      : '';

  return `    <div class="mindmap-branch" role="listitem"
      style="--branch-bg:${palette.bg};--branch-border:${palette.border};--branch-text:${palette.text}">
      <div class="mindmap-branch-label">${labelHtml}</div>${leafItems}
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
 * surrounded by colored branch nodes, each optionally containing child items.
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
 *       items: ['Ministry of Defence', 'NCSC', 'Riksdag Defence Committee'],
 *     },
 *     {
 *       label: 'Legislative Risks',
 *       color: 'magenta',
 *       icon: '⚠️',
 *       items: ['Insufficient NIS2 implementation budget', 'Fragmented agency mandates'],
 *     },
 *     {
 *       label: 'EU Context',
 *       color: 'blue',
 *       icon: '🇪🇺',
 *       items: ['NIS2 Directive', 'Cyber Resilience Act', 'ENISA framework'],
 *     },
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

  const html = `<section class="mindmap-section" aria-label="${escapeHtml(titleText)}">
  <h2>${escapeHtml(titleText)}</h2>
${summaryBlock}  <div class="mindmap-container" data-branch-count="${branchCount}">
    <div class="mindmap-center" role="heading" aria-level="3">${escapeHtml(topic)}</div>
    <div class="mindmap-branches" role="list">
${branchItems}
    </div>
  </div>
</section>`;

  return {
    id: 'mindmap-section',
    html,
    className: 'mindmap-section-wrapper',
  };
}
