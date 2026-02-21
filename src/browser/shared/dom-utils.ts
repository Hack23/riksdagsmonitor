/**
 * @module Shared/DomUtils
 * @description Shared DOM utility functions for dashboard components.
 * Provides loading states, error display, and accessibility helpers.

 *
 * @intelligence Intelligence presentation layer — standardized loading states, error recovery displays, and accessibility helpers ensuring WCAG 2.1 AA compliance across all intelligence dashboard components.
 *
 * @business User experience consistency — loading skeletons and error states prevent user frustration during data acquisition. Accessibility compliance (WCAG 2.1 AA) is a legal requirement for government clients and a competitive advantage.
 *
 * @marketing Inclusive design asset — accessibility compliance enables marketing to government agencies (mandatory WCAG requirement), educational institutions, and disability advocacy organizations. Demonstrates corporate social responsibility.
 * */

/**
 * Show a loading spinner overlay inside a container.
 */
export function showLoadingState(container: HTMLElement, message = 'Loading data...'): void {
  let overlay = container.querySelector('.chart-loading-overlay') as HTMLElement | null;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'chart-loading-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    container.style.position = 'relative';
    container.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="loading-spinner" aria-hidden="true"></div>
    <p>${message}</p>
  `;
  overlay.style.display = 'flex';
}

/**
 * Show an empty state message inside a container.
 */
export function showEmptyState(container: HTMLElement, message = 'No data available'): void {
  let overlay = container.querySelector('.chart-loading-overlay') as HTMLElement | null;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'chart-loading-overlay';
    overlay.setAttribute('role', 'status');
    container.style.position = 'relative';
    container.appendChild(overlay);
  }
  overlay.innerHTML = `<p class="empty-message">${message}</p>`;
  overlay.style.display = 'flex';
}

/**
 * Show an error state message inside a container.
 */
export function showErrorState(container: HTMLElement, message = 'Failed to load data'): void {
  let overlay = container.querySelector('.chart-loading-overlay') as HTMLElement | null;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'chart-loading-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'assertive');
    container.style.position = 'relative';
    container.appendChild(overlay);
  }
  overlay.innerHTML = `<p class="error-message" role="alert">${message}</p>`;
  overlay.style.display = 'flex';
}

/**
 * Hide all state overlays in a container.
 */
export function hideStateOverlays(container: HTMLElement): void {
  const overlay = container.querySelector('.chart-loading-overlay') as HTMLElement | null;
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * Format a number with locale-appropriate separators.
 */
export function formatNumber(value: number, locale = 'sv-SE'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a number as percentage.
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Detect the current page language from the HTML lang attribute.
 */
export function detectLanguage(): string {
  return document.documentElement.lang || 'en';
}

/**
 * Announce a data point to screen readers via live region.
 */
export function announceToScreenReader(message: string): void {
  let region = document.getElementById('sr-announcements');
  if (!region) {
    region = document.createElement('div');
    region.id = 'sr-announcements';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.className = 'sr-only';
    document.body.appendChild(region);
  }
  region.textContent = message;
}
