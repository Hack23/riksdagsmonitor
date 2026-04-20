/**
 * @file tests/chart-init.test.js
 * @description Tests the defense-in-depth + a11y hardening added to
 * `js/chart-init.js`:
 *   1. Configs whose raw JSON contains a function literal are rejected
 *      before Chart.js is ever invoked (CSP hygiene).
 *   2. When the user prefers reduced motion, animation + transitions are
 *      disabled on the parsed config before instantiation.
 *
 * The module is self-invoking (IIFE), so we exercise it by loading it
 * into an isolated sandbox and controlling its globals.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const CHART_INIT_SRC = readFileSync(join(__dirname, '../js/chart-init.js'), 'utf8');

/**
 * Run `chart-init.js` inside a fresh VM context with the provided DOM
 * mocks, then return the list of configs passed to the faux Chart ctor.
 */
function runChartInit(canvases, { reduceMotion = false } = {}) {
  const instantiated = [];
  function FakeChart(_ctx, cfg) {
    instantiated.push(cfg);
  }
  FakeChart.register = () => undefined;

  const document = {
    readyState: 'complete',
    addEventListener: () => undefined,
    querySelectorAll: (_sel) => canvases,
  };
  const window = {
    Chart: FakeChart,
    matchMedia: (q) => ({
      matches: q === '(prefers-reduced-motion: reduce)' ? reduceMotion : false,
    }),
    addEventListener: () => undefined,
  };

  const sandbox = { window, document, console };
  vm.createContext(sandbox);
  vm.runInContext(CHART_INIT_SRC, sandbox);

  return instantiated;
}

function makeCanvas(rawJson) {
  const attrs = { 'data-chart-config': rawJson };
  return {
    getAttribute: (k) => attrs[k] ?? null,
    setAttribute: (k, v) => { attrs[k] = v; },
    getContext: () => ({}),
    id: 'test-canvas',
  };
}

describe('chart-init — defense-in-depth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses a valid JSON config and instantiates Chart.js', () => {
    const canvas = makeCanvas(JSON.stringify({
      type: 'bar',
      data: { labels: ['a', 'b'], datasets: [{ data: [1, 2] }] },
    }));
    const configs = runChartInit([canvas]);
    expect(configs).toHaveLength(1);
    expect(configs[0].type).toBe('bar');
  });

  it('rejects configs whose raw attribute contains a function literal', () => {
    // A forged attribute that *parses* as valid JSON but contains the
    // `function(` token in a string field. The guard runs BEFORE JSON.parse
    // so even a syntactically valid but suspicious blob is refused.
    const forged = '{"type":"bar","onClick":"function(e){alert(1)}"}';
    const canvas = makeCanvas(forged);
    const configs = runChartInit([canvas]);
    expect(configs).toHaveLength(0);
  });

  it('rejects configs with function literal and additional whitespace variants', () => {
    const forged = '{"type":"bar","fn":"function  (x){return x}"}';
    const canvas = makeCanvas(forged);
    const configs = runChartInit([canvas]);
    expect(configs).toHaveLength(0);
  });

  it('ignores canvases with missing or malformed data-chart-config', () => {
    const noAttr = { getAttribute: () => null, getContext: () => ({}) };
    const malformed = makeCanvas('not json at all');
    const configs = runChartInit([noAttr, malformed]);
    expect(configs).toHaveLength(0);
  });
});

describe('chart-init — prefers-reduced-motion', () => {
  it('disables animation on parsed config when user prefers reduced motion', () => {
    const canvas = makeCanvas(JSON.stringify({
      type: 'line',
      data: { datasets: [{ data: [1, 2, 3] }] },
      options: { animation: { duration: 1000 } },
    }));
    const [cfg] = runChartInit([canvas], { reduceMotion: true });
    expect(cfg).toBeDefined();
    expect(cfg.options.animation).toBe(false);
  });

  it('preserves original animation settings when user has no reduced-motion preference', () => {
    const canvas = makeCanvas(JSON.stringify({
      type: 'bar',
      data: { datasets: [{ data: [1, 2] }] },
      options: { animation: { duration: 500 } },
    }));
    const [cfg] = runChartInit([canvas], { reduceMotion: false });
    expect(cfg.options.animation).toEqual({ duration: 500 });
  });

  it('clears animations/transitions objects when reduced-motion is requested', () => {
    const canvas = makeCanvas(JSON.stringify({
      type: 'line',
      data: { datasets: [{ data: [1, 2, 3] }] },
      options: {
        animations: { y: { duration: 500 } },
        transitions: { active: { animation: { duration: 400 } } },
      },
    }));
    const [cfg] = runChartInit([canvas], { reduceMotion: true });
    expect(cfg.options.animation).toBe(false);
    expect(cfg.options.animations).toEqual({});
    expect(cfg.options.transitions).toEqual({});
  });

  it('handles configs without an options field gracefully', () => {
    const canvas = makeCanvas(JSON.stringify({
      type: 'pie',
      data: { datasets: [{ data: [1, 2, 3] }] },
    }));
    const [cfg] = runChartInit([canvas], { reduceMotion: true });
    expect(cfg.options.animation).toBe(false);
  });
});
