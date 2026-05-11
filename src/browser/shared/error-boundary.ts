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
 * Localised labels for the loading and error states produced by
 * {@link renderWithFallback}.  Both fields are optional; English defaults
 * are used when omitted so the API remains backwards-compatible.
 */
export interface RenderWithFallbackOptions {
  /** ARIA label announced by screen readers while the skeleton is visible. */
  readonly loadingLabel?: string;
  /** Text shown on the retry button in the error card. */
  readonly retryLabel?: string;
}

/**
 * Wrap a synchronous or asynchronous render function with an error boundary.
 *
 * - Shows a loading skeleton while an async render is in progress.
 * - On success the container is left with whatever the render function produced.
 * - On failure the container shows an error card with an optional retry button.
 * - Each retry re-runs the full renderFn.
 *
 * @param container       - Target DOM element that will receive the rendered output.
 * @param renderFn        - Function (sync or async) that populates `container`.
 * @param fallbackMessage - Human-readable message shown in the error card.
 * @param options         - Optional localised labels for the loading/error states.
 */
export async function renderWithFallback(
  container: HTMLElement,
  renderFn: () => void | Promise<void>,
  fallbackMessage = 'Data temporarily unavailable',
  options: RenderWithFallbackOptions = {},
): Promise<void> {
  const originalHTML = container.innerHTML;
  let inFlight = false;
  let isFirstAttempt = true;

  const attempt = async (): Promise<void> => {
    if (inFlight) {
      return;
    }

    inFlight = true;

    if (!isFirstAttempt) {
      container.innerHTML = originalHTML;
    }
    isFirstAttempt = false;

    const loadingOverlay = document.createElement('div');
    loadingOverlay.setAttribute('data-error-boundary-loading', 'true');
    loadingOverlay.setAttribute('aria-busy', 'true');
    loadingOverlay.className = 'error-boundary-loading-overlay';

    const priorInlinePosition = container.style.position;
    const currentPosition = getComputedStyle(container).position;
    if (currentPosition === '' || currentPosition === 'static') {
      container.style.position = 'relative';
    }

    loadingOverlay.style.position = 'absolute';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.right = '0';
    loadingOverlay.style.bottom = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.zIndex = '1';
    loadingOverlay.style.pointerEvents = 'none';

    renderLoadingFallback(loadingOverlay, options.loadingLabel);
    container.appendChild(loadingOverlay);

    try {
      await Promise.resolve(renderFn());
    } catch (err) {
      logger.error('[ErrorBoundary] Render failed:', err);
      renderErrorFallback(container, fallbackMessage, attempt, options.retryLabel);
    } finally {
      if (loadingOverlay.parentNode === container) {
        container.removeChild(loadingOverlay);
      }
      container.style.position = priorInlinePosition;
      inFlight = false;
    }
  };

  await attempt();
}
