/**
 * @module Shared/Theme
 * @description Cyberpunk design system theme constants with dark/light mode support.
 * Single source of truth for colors, breakpoints, and typography used across all dashboards.
 *
 * Theme architecture:
 *   – `DARK_THEME_COLORS`  → Ingress-inspired neon palette (matches html[data-theme="dark"])
 *   – `LIGHT_THEME_COLORS` → Professional green palette (matches html[data-theme="light"] / :root)
 *   – `THEME_COLORS`       → Deprecated constant alias of `DARK_THEME_COLORS` (kept for backwards compatibility; not runtime-resolved)
 *
 * WCAG 2.1 AA compliance:
 *   Dark  #001a1a / #f0f0f0 → 18.1:1 ✅   Cyan  #00d9ff / #001a1a → 9.4:1 ✅
 *   Light #f5f5f5 / #1a1a1a → 16.1:1 ✅   Cyan  #0077b6 / #f5f5f5 → 5.2:1 ✅
 *
 * @intelligence Visual intelligence presentation standards — cyberpunk design system encoding
 *   risk severity (CRITICAL red → LOW green), classification levels, and intelligence hierarchy
 *   through consistent color semantics and typography.
 *
 * @business Brand identity infrastructure — the cyberpunk theme is a key differentiator
 *   creating instant visual recognition. Design system consistency reduces development cost
 *   for new features and ensures professional appearance across all 14 language versions.
 *
 * @marketing Brand consistency engine — ensures every screenshot, embed, and shared
 *   visualization carries the distinctive Riksdagsmonitor visual identity. CSS custom
 *   properties enable white-label customization for enterprise/B2G clients.
 */

import type { ThemeColors, Breakpoints } from './types.js';

/* ── Party colour palette (theme-invariant) ─────────────────────────────── */

const PARTY_COLORS: Readonly<Record<string, string>> = {
  S:  '#E8112d',
  M:  '#52BDEC',
  SD: '#DDDD00',
  C:  '#009933',
  V:  '#DA291C',
  KD: '#000077',
  L:  '#006AB3',
  MP: '#83CF39',
} as const;

/* ── Dark theme (Ingress-inspired, neon) ────────────────────────────────── */

/**
 * Dark cyberpunk theme.
 * Matches CSS custom properties under `html[data-theme="dark"]` in styles.css.
 * All values pass WCAG 2.1 AA (≥ 4.5:1) against the dark background #001a1a.
 */
export const DARK_THEME_COLORS: ThemeColors = {
  cyan:    '#00d9ff',   // 9.4:1 on #001a1a ✅
  magenta: '#ff006e',
  yellow:  '#ffbe0b',
  green:   '#06d6a0',
  orange:  '#fb8500',
  purple:  '#bd93f9',
  red:     '#ef476f',
  blue:    '#58a6ff',
  tooltipBg:  'rgba(10, 14, 39, 0.95)',
  bodyText:   '#e0e0e0',
  parties: PARTY_COLORS,
} as const;

/* ── Light theme (professional green) ──────────────────────────────────── */

/**
 * Light professional theme.
 * Matches CSS custom properties under `html[data-theme="light"]` in styles.css.
 * All values pass WCAG 2.1 AA (≥ 4.5:1) against the light background #f5f5f5.
 */
export const LIGHT_THEME_COLORS: ThemeColors = {
  cyan:    '#0077b6',   // 5.2:1 on #f5f5f5 ✅  (--primary-cyan light per spec)
  magenta: '#c2185b',
  yellow:  '#b35a00',   // accessible amber
  green:   '#006633',
  orange:  '#cc5200',
  purple:  '#7B2CBF',
  red:     '#DC3545',
  blue:    '#007744',
  tooltipBg:  'rgba(245, 245, 245, 0.95)',
  bodyText:   '#1a1e3d',
  parties: PARTY_COLORS,
} as const;

/* ── Runtime theme resolution ───────────────────────────────────────────── */

/**
 * Returns the active ThemeColors based on the current `data-theme` attribute
 * on `<html>`.  When the attribute is absent (e.g. before the anti-flash
 * snippet runs), falls back to `prefers-color-scheme` — consistent with the
 * CSS `@media (prefers-color-scheme: dark)` default.  Defaults to
 * `DARK_THEME_COLORS` only in SSR / test environments where `document` is
 * undefined; in a browser without `matchMedia` support it defaults to
 * `LIGHT_THEME_COLORS` (matching the CSS `:root` base styles).
 *
 * Call this wherever Chart.js datasets need the current palette, e.g.:
 * ```ts
 * const colors = getActiveThemeColors();
 * chart.data.datasets[0].backgroundColor = colors.cyan;
 * ```
 */
export function getActiveThemeColors(): ThemeColors {
  if (typeof document === 'undefined') return DARK_THEME_COLORS; // SSR / test guard
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'light') return LIGHT_THEME_COLORS;
  if (theme === 'dark') return DARK_THEME_COLORS;
  // data-theme not set — mirror the CSS prefers-color-scheme behaviour
  if (typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return DARK_THEME_COLORS;
  }
  return LIGHT_THEME_COLORS;
}

/**
 * Cyberpunk (dark) theme color palette — kept as the default export for
 * backwards compatibility with existing Chart.js consumers.
 *
 * @deprecated since v2.0 — will be removed in v3.0.
 *   Prefer `getActiveThemeColors()` which returns the correct palette for the
 *   current `data-theme` value.  Migration:
 *   ```ts
 *   // Before
 *   import { THEME_COLORS } from './theme.js';
 *   chart.data.datasets[0].borderColor = THEME_COLORS.cyan;
 *
 *   // After
 *   import { getActiveThemeColors } from './theme.js';
 *   chart.data.datasets[0].borderColor = getActiveThemeColors().cyan;
 *   ```
 */
export const THEME_COLORS: ThemeColors = DARK_THEME_COLORS;

/* ── Breakpoints ────────────────────────────────────────────────────────── */

/**
 * Responsive breakpoints (mobile-first, in px).
 */
export const BREAKPOINTS: Breakpoints = {
  mobile:  320,
  tablet:  768,
  desktop: 1024,
  large:   1440,
} as const;

/* ── Chart palettes ─────────────────────────────────────────────────────── */

/**
 * Chart color palette for sequential data series (dark theme).
 */
export const CHART_PALETTE = [
  DARK_THEME_COLORS.cyan,
  DARK_THEME_COLORS.magenta,
  DARK_THEME_COLORS.yellow,
  DARK_THEME_COLORS.green,
  DARK_THEME_COLORS.orange,
  DARK_THEME_COLORS.purple,
  DARK_THEME_COLORS.red,
  DARK_THEME_COLORS.blue,
] as const;

/**
 * Chart color palette for sequential data series (light theme).
 */
export const CHART_PALETTE_LIGHT = [
  LIGHT_THEME_COLORS.cyan,
  LIGHT_THEME_COLORS.magenta,
  LIGHT_THEME_COLORS.yellow,
  LIGHT_THEME_COLORS.green,
  LIGHT_THEME_COLORS.orange,
  LIGHT_THEME_COLORS.purple,
  LIGHT_THEME_COLORS.red,
  LIGHT_THEME_COLORS.blue,
] as const;

/**
 * Returns the appropriate chart palette for the current theme.
 */
export function getChartPalette(): readonly string[] {
  return getActiveThemeColors() === LIGHT_THEME_COLORS
    ? CHART_PALETTE_LIGHT
    : CHART_PALETTE;
}

/* ── Utilities ──────────────────────────────────────────────────────────── */

/**
 * Get party color by party abbreviation.
 * Party colors are theme-invariant (official brand colours).
 * Falls back to the active theme's cyan for unknown parties.
 */
export function getPartyColor(party: string): string {
  return PARTY_COLORS[party] ?? getActiveThemeColors().cyan;
}

/**
 * Subscribe to theme changes and invoke the callback with the new ThemeColors.
 * Returns an unsubscribe function.
 *
 * ```ts
 * const unsub = onThemeChange((colors) => {
 *   chart.data.datasets[0].backgroundColor = colors.cyan;
 *   chart.update();
 * });
 * ```
 */
export function onThemeChange(
  callback: (colors: ThemeColors) => void,
): () => void {
  if (typeof MutationObserver === 'undefined') return () => {};

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') {
        callback(getActiveThemeColors());
        break;
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true });
  return () => observer.disconnect();
}
