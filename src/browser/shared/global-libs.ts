/**
 * @module Shared/GlobalLibs
 * @description Type declarations for global libraries loaded via CDN script tags.
 * Provides type-safe access to Chart.js, D3.js, and PapaParse without `any`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type * as d3Namespace from 'd3';
import type { Chart as ChartInstance, Defaults } from 'chart.js';

/** Chart.js constructor interface matching the actual Chart.js API. */
export interface ChartConstructor {
  new (ctx: HTMLCanvasElement | CanvasRenderingContext2D | null, config: Record<string, unknown>): ChartInstance;
  register(...items: unknown[]): void;
  defaults: Defaults;
}

/** PapaParse parse result including errors and meta. */
export interface PapaParseResult<T = string[]> {
  data: T[];
  errors: Array<{ message: string; type: string; code: string; row?: number }>;
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    fields?: string[];
    truncated: boolean;
  };
}

/** PapaParse interface for CSV parsing. */
export interface PapaParseStatic {
  parse<T = string[]>(input: string, config?: Record<string, unknown>): PapaParseResult<T>;
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
