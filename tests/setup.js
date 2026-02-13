/**
 * Vitest Setup File
 * 
 * Global setup for Vitest tests
 * Runs before all test files
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { expect, vi } from 'vitest';

// Global test utilities
global.expect = expect;
global.vi = vi;

// Mock Chart.js globally
global.Chart = class MockChart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.data = config.data;
    this.options = config.options;
  }
  
  update() {}
  destroy() {}
  resize() {}
  clear() {}
};

// Mock D3 globally
global.d3 = {
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn(() => ({})),
            style: vi.fn(() => ({})),
            text: vi.fn(() => ({}))
          }))
        })),
        exit: vi.fn(() => ({
          remove: vi.fn()
        }))
      })),
      attr: vi.fn(() => ({})),
      style: vi.fn(() => ({}))
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({})),
      style: vi.fn(() => ({}))
    })),
    attr: vi.fn(() => ({})),
    style: vi.fn(() => ({}))
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn(() => ({
      range: vi.fn(() => (x => x))
    })),
    range: vi.fn(() => (x => x))
  })),
  scaleBand: vi.fn(() => ({
    domain: vi.fn(() => ({
      range: vi.fn(() => ({
        padding: vi.fn(() => (x => x))
      }))
    })),
    range: vi.fn(() => (x => x)),
    bandwidth: vi.fn(() => 50)
  })),
  axisBottom: vi.fn(() => ({})),
  axisLeft: vi.fn(() => ({})),
  max: vi.fn((arr, fn) => Math.max(...arr.map(fn || (x => x)))),
  min: vi.fn((arr, fn) => Math.min(...arr.map(fn || (x => x))))
};

// Preserve native fetch before mocking (for integration tests)
global.__nativeFetch = global.fetch;

// Mock fetch globally
global.fetch = vi.fn((url) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve('Year,Quarter,Ballot\n2024,Q1,1000\n2024,Q2,1100'),
    json: () => Promise.resolve({ data: [] }),
    headers: new Map([['content-type', 'text/csv']])
  });
});

// Mock localStorage
global.localStorage = {
  getItem: vi.fn((key) => null),
  setItem: vi.fn((key, value) => {}),
  removeItem: vi.fn((key) => {}),
  clear: vi.fn()
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: vi.fn((key) => null),
  setItem: vi.fn((key, value) => {}),
  removeItem: vi.fn((key) => {}),
  clear: vi.fn()
};

// Setup DOM utilities
beforeEach(() => {
  // Clear DOM before each test
  document.body.innerHTML = '';
  
  // Reset all mocks
  vi.clearAllMocks();
  
  // Silence console output while keeping the original console object
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});
