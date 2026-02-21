/// <reference lib="dom" />
/**
 * Vitest Setup File
 *
 * Global setup for Vitest tests
 * Runs before all test files
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { expect, vi, beforeEach, afterEach } from 'vitest';

/* -------------------------------------------------------------------------- */
/*  Augment the global scope so TypeScript knows about our mocks              */
/* -------------------------------------------------------------------------- */

interface MockChartConfig {
  data?: unknown;
  options?: unknown;
}

declare global {
   
  var Chart: new (ctx: unknown, config: MockChartConfig) => {
    ctx: unknown;
    config: MockChartConfig;
    data: unknown;
    options: unknown;
    update(): void;
    destroy(): void;
    resize(): void;
    clear(): void;
  };

   
  var d3: Record<string, unknown>;
}

// Global test utilities
(globalThis as Record<string, unknown>).expect = expect;
(globalThis as Record<string, unknown>).vi = vi;

// Mock Chart.js globally
globalThis.Chart = class MockChart {
  ctx: unknown;
  config: MockChartConfig;
  data: unknown;
  options: unknown;

  constructor(ctx: unknown, config: MockChartConfig) {
    this.ctx = ctx;
    this.config = config;
    this.data = config.data;
    this.options = config.options;
  }

  update(): void { /* noop */ }
  destroy(): void { /* noop */ }
  resize(): void { /* noop */ }
  clear(): void { /* noop */ }
};

// Mock D3 globally
globalThis.d3 = {
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn(() => ({})),
            style: vi.fn(() => ({})),
            text: vi.fn(() => ({})),
          })),
        })),
        exit: vi.fn(() => ({
          remove: vi.fn(),
        })),
      })),
      attr: vi.fn(() => ({})),
      style: vi.fn(() => ({})),
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({})),
      style: vi.fn(() => ({})),
    })),
    attr: vi.fn(() => ({})),
    style: vi.fn(() => ({})),
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn(() => ({
      range: vi.fn(() => ((x: unknown): unknown => x)),
    })),
    range: vi.fn(() => ((x: unknown): unknown => x)),
  })),
  scaleBand: vi.fn(() => ({
    domain: vi.fn(() => ({
      range: vi.fn(() => ({
        padding: vi.fn(() => ((x: unknown): unknown => x)),
      })),
    })),
    range: vi.fn(() => ((x: unknown): unknown => x)),
    bandwidth: vi.fn(() => 50),
  })),
  axisBottom: vi.fn(() => ({})),
  axisLeft: vi.fn(() => ({})),
  max: vi.fn(
    (arr: number[], fn?: (x: number) => number) =>
      Math.max(...arr.map(fn ?? ((x: number): number => x))),
  ),
  min: vi.fn(
    (arr: number[], fn?: (x: number) => number) =>
      Math.min(...arr.map(fn ?? ((x: number): number => x))),
  ),
};

// Mock fetch globally
globalThis.fetch = vi.fn((_url: string | URL | Request): Promise<Response> => {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () =>
      Promise.resolve('Year,Quarter,Ballot\n2024,Q1,1000\n2024,Q2,1100'),
    json: () => Promise.resolve({ data: [] }),
    headers: new Headers([['content-type', 'text/csv']]),
  } as unknown as Response);
}) as typeof fetch;

// Mock localStorage
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn((_key: string): string | null => null),
    setItem: vi.fn((_key: string, _value: string): void => { /* noop */ }),
    removeItem: vi.fn((_key: string): void => { /* noop */ }),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: vi.fn((_key: string): string | null => null),
    setItem: vi.fn((_key: string, _value: string): void => { /* noop */ }),
    removeItem: vi.fn((_key: string): void => { /* noop */ }),
    clear: vi.fn(),
  },
  writable: true,
});

// Setup DOM utilities
beforeEach(() => {
  // Clear DOM before each test
  document.body.innerHTML = '';

  // Reset all mocks
  vi.clearAllMocks();

  // Silence console output while keeping the original console object
  vi.spyOn(console, 'log').mockImplementation(() => { /* noop */ });
  vi.spyOn(console, 'debug').mockImplementation(() => { /* noop */ });
  vi.spyOn(console, 'info').mockImplementation(() => { /* noop */ });
  vi.spyOn(console, 'warn').mockImplementation(() => { /* noop */ });
  vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});
