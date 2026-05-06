/**
 * @module Shared/GlobalLibs
 * @description Type declarations for global libraries loaded via CDN script tags.
 * Provides type-safe access to Chart.js, D3.js, and PapaParse without `any`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type * as d3Namespace from 'd3';

/** Minimal Chart.js constructor interface for dashboard usage. */
export interface ChartConstructor {
  new (ctx: HTMLCanvasElement | CanvasRenderingContext2D | null, config: Record<string, unknown>): unknown;
  register(...items: unknown[]): void;
}

/** PapaParse interface for CSV parsing. */
export interface PapaParseStatic {
  parse(input: string, config?: Record<string, unknown>): { data: string[][] };
}

/** D3 library type alias. */
export type D3Static = typeof d3Namespace;

/** Interface representing the CDN-loaded globals on globalThis. */
export interface DashboardGlobals {
  d3: D3Static;
  Chart: ChartConstructor;
  Papa: PapaParseStatic;
}

/** Type-safe accessor for CDN-loaded globals. */
export const globals = globalThis as unknown as DashboardGlobals;
