/**
 * @module Shared/FallbackUI
 * @description Centralized fallback UI renderers for dashboard error and loading states.
 * Provides consistent error and loading state presentation with optional retry capability.
 *
 * @intelligence Intelligence platform resilience layer — standardised fallback states
 * (error cards, loading skeletons) ensure uninterrupted intelligence consumption even when
 * individual data sources fail. Each component degrades gracefully without disrupting other
 * dashboard panels.
 *
 * @business User experience consistency — unified error and loading states prevent user
 * frustration and reduce support requests. Retry buttons maximise data recovery rate.
 *
 * @marketing Developer experience asset — reusable fallback components reduce time-to-market
 * for new dashboard panels and maintain visual consistency across all 14 language variants.
 */

/**
 * Replace the contents of `container` with an accessible error card.
 * An optional `retryFn` receives a retry button the user can click.
 * An optional `retryLabel` overrides the default "Retry" button text for localised UIs.
 */
export function renderErrorFallback(
  container: HTMLElement,
  message = 'Data temporarily unavailable',
  retryFn?: () => void,
  retryLabel = 'Retry',
): void {
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'fallback-error-card';
  card.setAttribute('role', 'alert');
  card.setAttribute('aria-live', 'assertive');

  const icon = document.createElement('span');
  icon.className = 'fallback-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '⚠';

  const text = document.createElement('p');
  text.className = 'fallback-message';
  text.textContent = message;

  card.appendChild(icon);
  card.appendChild(text);

  if (retryFn) {
    const btn = document.createElement('button');
    btn.className = 'fallback-retry-btn';
    btn.type = 'button';
    btn.textContent = retryLabel;
    btn.addEventListener('click', retryFn);
    card.appendChild(btn);
  }

  container.appendChild(card);
}

/**
 * Replace the contents of `container` with a CSS-only skeleton loading animation.
 * The optional `loadingLabel` allows localized ARIA text for screen readers.
 */
export function renderLoadingFallback(container: HTMLElement, loadingLabel = 'Loading…'): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'fallback-loading-skeleton';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');
  wrapper.setAttribute('aria-label', loadingLabel);

  for (let i = 0; i < 3; i++) {
    const bar = document.createElement('div');
    bar.className = 'skeleton-bar';
    wrapper.appendChild(bar);
  }

  container.appendChild(wrapper);
}
