/**
 * @module UI/BackToTop
 * @description WCAG-compliant scroll-to-top button with reduced motion support.

 *
 * @intelligence WCAG-compliant navigation intelligence — scroll-to-top accessibility component with reduced motion support (prefers-reduced-motion media query). Ensures inclusive navigation for intelligence analysts working through long-form dashboard content.
 *
 * @business Accessibility compliance requirement — WCAG 2.1 AA is mandatory for government clients (B2G) and required by EU accessibility directives. Back-to-top is a basic UX pattern that reduces friction for all users, improving engagement metrics across all customer segments.
 *
 * @marketing Inclusive design demonstration — accessibility features are marketable to government agencies, educational institutions, and organizations with diversity mandates. WCAG compliance is a checkbox requirement in many RFP processes.
 * */

export function initBackToTop(): void {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toggleVisibility = () => {
    const scrolled = window.scrollY > 300;
    btn.classList.toggle('visible', scrolled);
    btn.setAttribute('aria-hidden', String(!scrolled));
    btn.tabIndex = scrolled ? 0 : -1;
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        toggleVisibility();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
    });
  });

  btn.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });

  // Initial state
  toggleVisibility();
}
