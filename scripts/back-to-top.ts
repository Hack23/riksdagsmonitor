/**
 * @module Infrastructure/Accessibility
 * @category Infrastructure
 *
 * @title Back-to-Top Navigation Utility - Accessibility & User Experience
 *
 * @description
 * Provides a "back to top" button that scrolls long-form political intelligence
 * articles to the top with accessibility support (WCAG 2.1 AA).
 *
 * @author Hack23 AB (Accessibility & User Experience)
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2024-06-20
 */
(function (): void {
  'use strict';

  const maybeButton: HTMLElement | null = document.getElementById('back-to-top');

  if (!maybeButton) return;

  const backToTopButton: HTMLElement = maybeButton;

  // Show/hide button based on scroll position
  function toggleButtonVisibility(): void {
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add('visible');
    } else {
      backToTopButton.classList.remove('visible');
    }
  }

  // Scroll to top with accessibility support
  function scrollToTop(): void {
    // Check if user prefers reduced motion
    const prefersReducedMotion: boolean = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }

  // Add event listeners
  window.addEventListener('scroll', toggleButtonVisibility);
  backToTopButton.addEventListener('click', scrollToTop);

  // Initial check
  toggleButtonVisibility();
})();
