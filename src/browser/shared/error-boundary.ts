/**
 * @module Shared/ErrorBoundary
 * @description Centralized error boundary pattern for browser-side dashboard components.
 * Prevents individual component failures from breaking the entire page by wrapping
 * render functions with error catching, fallback UI, and optional retry logic.
 *
 * @intelligence Intelligence platform resilience layer — each dashboard panel is isolated
 * so a single data-source failure never cascades to the rest of the page. Retry logic
 * maximises successful data acquisition from unstable government APIs.
 *
 * @business Platform reliability — isolated component failures improve perceived
 * reliability and reduce support incidents. Automatic retry reduces manual page refreshes
 * and keeps users engaged with available data.
 *
 * @marketing Enterprise readiness signal — graceful degradation and structured error
 * handling demonstrate production quality to government and enterprise prospects.
 */

import { logger } from './logger.js';
import { renderErrorFallback, renderLoadingFallback } from './fallback-ui.js';

/**
 * Wrap a synchronous or asynchronous render function with an error boundary.
 *
 * - Shows a loading skeleton while an async render is in progress.
 * - On success the container is left with whatever the render function produced.
 * - On failure the container shows an error card with an optional retry button.
 * - Each retry re-runs the full renderFn.
 *
 * @param container  - Target DOM element that will receive the rendered output.
 * @param renderFn   - Function (sync or async) that populates `container`.
 * @param fallbackMessage - Human-readable message shown in the error card.
 */
export async function renderWithFallback(
  container: HTMLElement,
  renderFn: () => void | Promise<void>,
  fallbackMessage = 'Data temporarily unavailable',
): Promise<void> {
  let inFlight = false;

  const attempt = async (): Promise<void> => {
    if (inFlight) {
      // Prevent overlapping attempts that could cause race conditions.
      return;
    }

    inFlight = true;
    renderLoadingFallback(container);

    try {
      await Promise.resolve(renderFn());
    } catch (err) {
      logger.error('[ErrorBoundary] Render failed:', err);
      renderErrorFallback(container, fallbackMessage, attempt);
    } finally {
      inFlight = false;
    }
  };

  await attempt();
}
