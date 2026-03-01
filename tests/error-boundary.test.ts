/**
 * Tests for error-boundary and fallback-ui modules.
 *
 * Covers:
 *  - renderLoadingFallback: skeleton DOM structure and ARIA attributes, custom loadingLabel
 *  - renderErrorFallback: error card DOM, message text, retry button wiring, custom retryLabel
 *  - renderWithFallback: success path, failure path, retry re-runs renderFn, inFlight guard
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderLoadingFallback, renderErrorFallback } from '../src/browser/shared/fallback-ui.js';
import { renderWithFallback } from '../src/browser/shared/error-boundary.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// renderLoadingFallback
// ---------------------------------------------------------------------------

describe('renderLoadingFallback', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = makeContainer();
  });

  it('replaces existing container content', () => {
    container.innerHTML = '<p>old</p>';
    renderLoadingFallback(container);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders a skeleton wrapper with role=status', () => {
    renderLoadingFallback(container);
    const wrapper = container.querySelector('.fallback-loading-skeleton');
    expect(wrapper).not.toBeNull();
    expect(wrapper!.getAttribute('role')).toBe('status');
  });

  it('has aria-live="polite" on the skeleton wrapper', () => {
    renderLoadingFallback(container);
    const wrapper = container.querySelector('.fallback-loading-skeleton');
    expect(wrapper!.getAttribute('aria-live')).toBe('polite');
  });

  it('uses the default "Loading…" aria-label when no label is supplied', () => {
    renderLoadingFallback(container);
    const wrapper = container.querySelector('.fallback-loading-skeleton');
    expect(wrapper!.getAttribute('aria-label')).toBe('Loading…');
  });

  it('uses a custom aria-label when loadingLabel is provided', () => {
    renderLoadingFallback(container, 'Laddar…');
    const wrapper = container.querySelector('.fallback-loading-skeleton');
    expect(wrapper!.getAttribute('aria-label')).toBe('Laddar…');
  });

  it('renders at least one skeleton bar', () => {
    renderLoadingFallback(container);
    const bars = container.querySelectorAll('.skeleton-bar');
    expect(bars.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// renderErrorFallback
// ---------------------------------------------------------------------------

describe('renderErrorFallback', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = makeContainer();
  });

  it('replaces existing container content', () => {
    container.innerHTML = '<canvas></canvas>';
    renderErrorFallback(container, 'Oops');
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('renders an error card with role=alert', () => {
    renderErrorFallback(container, 'Something went wrong');
    const card = container.querySelector('.fallback-error-card');
    expect(card).not.toBeNull();
    expect(card!.getAttribute('role')).toBe('alert');
  });

  it('displays the provided message', () => {
    renderErrorFallback(container, 'Party data unavailable');
    const msg = container.querySelector('.fallback-message');
    expect(msg!.textContent).toBe('Party data unavailable');
  });

  it('uses default message when none is provided', () => {
    renderErrorFallback(container);
    const msg = container.querySelector('.fallback-message');
    expect(msg!.textContent).toBe('Data temporarily unavailable');
  });

  it('does not render a retry button when retryFn is omitted', () => {
    renderErrorFallback(container, 'msg');
    expect(container.querySelector('.fallback-retry-btn')).toBeNull();
  });

  it('renders a retry button when retryFn is provided', () => {
    renderErrorFallback(container, 'msg', vi.fn());
    const btn = container.querySelector('.fallback-retry-btn');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).type).toBe('button');
  });

  it('uses the default "Retry" label for the retry button', () => {
    renderErrorFallback(container, 'msg', vi.fn());
    const btn = container.querySelector('.fallback-retry-btn') as HTMLButtonElement;
    expect(btn.textContent).toBe('Retry');
  });

  it('uses a custom label for the retry button when retryLabel is provided', () => {
    renderErrorFallback(container, 'msg', vi.fn(), 'Försök igen');
    const btn = container.querySelector('.fallback-retry-btn') as HTMLButtonElement;
    expect(btn.textContent).toBe('Försök igen');
  });

  it('calls retryFn when the retry button is clicked', () => {
    const retryFn = vi.fn();
    renderErrorFallback(container, 'msg', retryFn);
    const btn = container.querySelector('.fallback-retry-btn') as HTMLButtonElement;
    btn.click();
    expect(retryFn).toHaveBeenCalledTimes(1);
  });

  it('renders an icon element', () => {
    renderErrorFallback(container, 'msg');
    const icon = container.querySelector('.fallback-icon');
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute('aria-hidden')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// renderWithFallback
// ---------------------------------------------------------------------------

describe('renderWithFallback', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = makeContainer();
  });

  it('calls the renderFn on success', async () => {
    const renderFn = vi.fn();
    await renderWithFallback(container, renderFn, 'msg');
    expect(renderFn).toHaveBeenCalledTimes(1);
  });

  it('renders error fallback when renderFn throws synchronously', async () => {
    const renderFn = vi.fn(() => { throw new Error('boom'); });
    await renderWithFallback(container, renderFn, 'Chart unavailable');
    const card = container.querySelector('.fallback-error-card');
    expect(card).not.toBeNull();
    expect(container.querySelector('.fallback-message')!.textContent).toBe('Chart unavailable');
  });

  it('renders error fallback when renderFn rejects', async () => {
    const renderFn = vi.fn(async () => { throw new Error('async boom'); });
    await renderWithFallback(container, renderFn, 'Async error');
    expect(container.querySelector('.fallback-error-card')).not.toBeNull();
  });

  it('shows a retry button after failure', async () => {
    const renderFn = vi.fn(() => { throw new Error('fail'); });
    await renderWithFallback(container, renderFn, 'fail msg');
    expect(container.querySelector('.fallback-retry-btn')).not.toBeNull();
  });

  it('re-runs renderFn when retry button is clicked', async () => {
    let callCount = 0;
    const renderFn = vi.fn(() => {
      callCount += 1;
      if (callCount === 1) throw new Error('first attempt fails');
      // second attempt succeeds — populate container so skeleton disappears
      container.innerHTML = '<p class="success">ok</p>';
    });

    await renderWithFallback(container, renderFn, 'retry msg');
    // After first failure the retry button should exist
    const btn = container.querySelector('.fallback-retry-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();

    // Click retry (the click handler is async-in-sync wrapper — flush microtasks)
    btn.click();
    // Allow the async re-render to complete
    await new Promise((r) => setTimeout(r, 0));

    expect(renderFn).toHaveBeenCalledTimes(2);
  });

  it('does not render error card when renderFn succeeds', async () => {
    const renderFn = vi.fn(() => {
      container.innerHTML = '<p class="chart">chart</p>';
    });
    await renderWithFallback(container, renderFn, 'msg');
    expect(container.querySelector('.fallback-error-card')).toBeNull();
    expect(container.querySelector('.chart')).not.toBeNull();
  });

  it('uses default fallback message when none is supplied', async () => {
    await renderWithFallback(container, () => { throw new Error('x'); });
    const msg = container.querySelector('.fallback-message');
    expect(msg!.textContent).toBe('Data temporarily unavailable');
  });

  it('removes the loading overlay after a successful render', async () => {
    const renderFn = vi.fn(() => {
      container.innerHTML = '<p class="result">done</p>';
    });
    await renderWithFallback(container, renderFn, 'msg');
    // The loading overlay should be gone after the render completes
    expect(container.querySelector('[data-error-boundary-loading]')).toBeNull();
  });

  it('removes the loading overlay after a failed render', async () => {
    const renderFn = vi.fn(() => { throw new Error('fail'); });
    await renderWithFallback(container, renderFn, 'msg');
    // The loading overlay should be removed even when the render throws
    expect(container.querySelector('[data-error-boundary-loading]')).toBeNull();
  });

  it('ignores concurrent retry clicks while an attempt is already in flight', async () => {
    let resolveSecond!: () => void;
    let callCount = 0;

    const renderFn = vi.fn(async () => {
      callCount += 1;
      if (callCount === 1) throw new Error('fail');
      // Second attempt is slow — wait until externally resolved
      await new Promise<void>((r) => { resolveSecond = r; });
    });

    await renderWithFallback(container, renderFn, 'race msg');

    const btn = container.querySelector('.fallback-retry-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();

    // Trigger two rapid clicks before the first retry resolves
    btn.click();
    btn.click();

    // Resolve the pending async renderFn
    resolveSecond();
    await new Promise((r) => setTimeout(r, 0));

    // Only one extra attempt should have been started (the inFlight guard blocks the second)
    expect(renderFn).toHaveBeenCalledTimes(2);
  });

  it('restores original container HTML before each renderFn call', async () => {
    // Pre-populate the container with a sentinel element (simulates a <canvas> in the HTML)
    container.innerHTML = '<canvas id="myChart"></canvas>';

    let seenCanvas = false;
    const renderFn = vi.fn(() => {
      // Check that the sentinel element is present when renderFn is called
      seenCanvas = container.querySelector('#myChart') !== null;
    });

    await renderWithFallback(container, renderFn, 'msg');
    expect(seenCanvas).toBe(true);
  });

  it('restores original HTML before retry after failure', async () => {
    container.innerHTML = '<canvas id="myChart"></canvas>';

    let callCount = 0;
    const seenCanvas: boolean[] = [];

    const renderFn = vi.fn(() => {
      callCount += 1;
      seenCanvas.push(container.querySelector('#myChart') !== null);
      if (callCount === 1) throw new Error('first fail');
      container.innerHTML = '<p class="success">ok</p>';
    });

    await renderWithFallback(container, renderFn, 'msg');
    const btn = container.querySelector('.fallback-retry-btn') as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 0));

    // The canvas was present for both the initial and retry call
    expect(seenCanvas).toEqual([true, true]);
    expect(renderFn).toHaveBeenCalledTimes(2);
  });

  it('forwards options.loadingLabel to the loading overlay ARIA label', async () => {
    let overlayLabel: string | null = null;
    const renderFn = vi.fn(async () => {
      // Capture the label while the render is "in progress"
      const overlay = container.querySelector('[data-error-boundary-loading]');
      if (overlay) {
        const skeleton = overlay.querySelector('.fallback-loading-skeleton');
        overlayLabel = skeleton?.getAttribute('aria-label') ?? null;
      }
    });
    await renderWithFallback(container, renderFn, 'msg', { loadingLabel: 'Laddar…' });
    expect(overlayLabel).toBe('Laddar…');
  });

  it('forwards options.retryLabel to the retry button on failure', async () => {
    const renderFn = vi.fn(() => { throw new Error('fail'); });
    await renderWithFallback(container, renderFn, 'msg', { retryLabel: 'Försök igen' });
    const btn = container.querySelector('.fallback-retry-btn');
    expect(btn?.textContent).toBe('Försök igen');
  });
});
