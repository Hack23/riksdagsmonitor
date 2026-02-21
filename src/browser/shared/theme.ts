/**
 * @module Shared/Theme
 * @description Cyberpunk design system theme constants.
 * Single source of truth for colors, breakpoints, and typography used across all dashboards.

 *
 * @intelligence Visual intelligence presentation standards — cyberpunk design system encoding risk severity (CRITICAL red → LOW green), classification levels, and intelligence hierarchy through consistent color semantics and typography.
 *
 * @business Brand identity infrastructure — the cyberpunk theme is a key differentiator creating instant visual recognition. Design system consistency reduces development cost for new features and ensures professional appearance across all 14 language versions.
 *
 * @marketing Brand consistency engine — ensures every screenshot, embed, and shared visualization carries the distinctive Riksdagsmonitor visual identity. CSS custom properties enable white-label customization for enterprise/B2G clients.
 * */

import type { ThemeColors, Breakpoints } from './types.js';

/**
 * Cyberpunk theme color palette.
 * Matches CSS custom properties in styles.css.
 */
export const THEME_COLORS: ThemeColors = {
  cyan: '#00d9ff',
  magenta: '#ff006e',
  yellow: '#ffbe0b',
  green: '#06d6a0',
  orange: '#fb8500',
  purple: '#8338ec',
  red: '#ef476f',
  blue: '#118ab2',
  parties: {
    S: '#E8112d',
    M: '#52BDEC',
    SD: '#DDDD00',
    C: '#009933',
    V: '#DA291C',
    KD: '#000077',
    L: '#006AB3',
    MP: '#83CF39',
  },
} as const;

/**
 * Responsive breakpoints (mobile-first).
 */
export const BREAKPOINTS: Breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  large: 1440,
} as const;

/**
 * Chart color palette for sequential data series.
 */
export const CHART_PALETTE = [
  THEME_COLORS.cyan,
  THEME_COLORS.magenta,
  THEME_COLORS.yellow,
  THEME_COLORS.green,
  THEME_COLORS.orange,
  THEME_COLORS.purple,
  THEME_COLORS.red,
  THEME_COLORS.blue,
] as const;

/**
 * Get party color by party abbreviation.
 */
export function getPartyColor(party: string): string {
  return THEME_COLORS.parties[party] ?? THEME_COLORS.cyan;
}
